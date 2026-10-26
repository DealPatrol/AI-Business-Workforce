'use client';

import { SimliClient, LogLevel } from 'simli-client';

/**
 * Photorealistic face session: ElevenLabs agent (brain + voice) -> Simli stock avatar (face + lip sync).
 *
 * The ElevenLabs agent runs over its raw WebSocket so we receive its PCM audio and forward it to Simli,
 * which plays the voice through `audio` in sync with the lips in `video`. The agent is unchanged.
 */

export type RealFaceEvents = {
  onLive: () => void;
  onEnded: () => void;
  onError: (message: string) => void;
  onSpeaking: (speaking: boolean) => void;
  onLine: (from: 'ai' | 'you', text: string) => void;
};

type Opts = {
  simliToken: string;
  wsUrl: string;
  video: HTMLVideoElement;
  audio: HTMLAudioElement;
  events: RealFaceEvents;
};

const TARGET_RATE = 16000;

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
}

function int16ToB64(pcm: Int16Array) {
  return bytesToB64(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
}

function ulawToInt16(u8: Uint8Array) {
  const out = new Int16Array(u8.length);
  for (let i = 0; i < u8.length; i++) {
    const u = ~u8[i] & 0xff;
    const sign = u & 0x80;
    const exp = (u >> 4) & 0x07;
    const mant = u & 0x0f;
    let s = ((mant << 3) + 0x84) << exp;
    s -= 0x84;
    out[i] = sign ? -s : s;
  }
  return out;
}

/** G.711 u-law, the inverse of ulawToInt16 (same encoder the ElevenLabs client uses). */
function int16ToUlaw(pcm: Int16Array) {
  const out = new Uint8Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    let sample = pcm[i];
    const sign = (sample >> 8) & 0x80;
    if (sign) sample = -sample;
    sample += 0x84;
    if (sample > 32635) sample = 32635;
    let exponent = 7;
    let mask = 0x4000;
    while (exponent > 0 && (sample & mask) === 0) {
      exponent--;
      mask >>= 1;
    }
    const mantissa = (sample >> (exponent + 3)) & 0x0f;
    out[i] = ~(sign | (exponent << 4) | mantissa);
  }
  return out;
}

function resample(src: Int16Array, from: number, to: number) {
  if (from === to) return src;
  const n = Math.floor((src.length * to) / from);
  const out = new Int16Array(n);
  const step = from / to;
  for (let i = 0; i < n; i++) {
    const x = i * step;
    const j = Math.floor(x);
    const f = x - j;
    const a = src[j] ?? 0;
    const b = src[j + 1] ?? a;
    out[i] = a + (b - a) * f;
  }
  return out;
}

/** Converts one ElevenLabs agent audio chunk to the PCM16 @ 16 kHz Simli expects. */
function toSimliPcm(b64: string, format: string) {
  const bytes = b64ToBytes(b64);
  if (format.startsWith('ulaw')) {
    const pcm = ulawToInt16(bytes);
    return new Uint8Array(resample(pcm, 8000, TARGET_RATE).buffer);
  }
  const rate = Number(format.split('_')[1]) || TARGET_RATE;
  if (rate === TARGET_RATE) return bytes;
  const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  return new Uint8Array(resample(pcm, rate, TARGET_RATE).buffer);
}

/** Encodes one mic buffer as the PCM16 or u-law base64 payload ElevenLabs requested. */
function toAgentAudio(pcm: Int16Array, fromRate: number, format: string, toRate: number) {
  const samples = resample(pcm, fromRate, toRate);
  if (format.startsWith('ulaw')) return bytesToB64(int16ToUlaw(samples));
  return int16ToB64(samples);
}

export class RealFaceSession {
  private simli: SimliClient | null = null;
  private ws: WebSocket | null = null;
  private mic: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private proc: ScriptProcessorNode | null = null;
  private outFormat = 'pcm_16000';
  private inFormat = 'pcm_16000';
  private inRate = TARGET_RATE;
  private speakingTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(private opts: Opts) {}

  async start() {
    const { simliToken, video, audio } = this.opts;
    this.simli = new SimliClient(simliToken, video, audio, null, LogLevel.ERROR, 'livekit');
    this.simli.on('start', () => {
      if (this.closed) return;
      this.simli?.sendAudioData(new Uint8Array(6000)); // prime the stream
      this.connectAgent().catch((e) => this.fail(e));
    });
    this.simli.on('error', () => this.fail('The video face disconnected.'));
    this.simli.on('startup_error', () => this.fail('The video face could not start.'));
    this.simli.on('stop', () => this.stop());
    await this.simli.start();
  }

  private async connectAgent() {
    const { wsUrl, events } = this.opts;
    const ws = new WebSocket(wsUrl);
    this.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }));
    };
    ws.onmessage = (ev) => {
      let data: Record<string, any>;
      try {
        data = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      switch (data.type) {
        case 'conversation_initiation_metadata': {
          const m = data.conversation_initiation_metadata_event ?? {};
          this.outFormat = m.agent_output_audio_format || 'pcm_16000';
          this.inFormat = String(m.user_input_audio_format || 'pcm_16000');
          this.inRate = Number(this.inFormat.split('_')[1]) || TARGET_RATE;
          this.startMic().then(
            () => !this.closed && events.onLive(),
            () => this.fail('Microphone access is needed to talk. You can call instead.'),
          );
          break;
        }
        case 'ping':
          setTimeout(
            () => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'pong', event_id: data.ping_event?.event_id })),
            data.ping_event?.ping_ms || 0,
          );
          break;
        case 'audio': {
          const b64 = data.audio_event?.audio_base_64;
          if (b64) {
            this.simli?.sendAudioData(toSimliPcm(b64, this.outFormat));
            events.onSpeaking(true);
            if (this.speakingTimer) clearTimeout(this.speakingTimer);
            this.speakingTimer = setTimeout(() => events.onSpeaking(false), 900);
          }
          break;
        }
        case 'interruption':
          this.simli?.ClearBuffer();
          events.onSpeaking(false);
          break;
        case 'agent_response':
          if (data.agent_response_event?.agent_response) events.onLine('ai', data.agent_response_event.agent_response);
          break;
        case 'user_transcript':
          if (data.user_transcription_event?.user_transcript) events.onLine('you', data.user_transcription_event.user_transcript);
          break;
      }
    };
    ws.onerror = () => this.fail('Could not reach the receptionist. Please call instead.');
    ws.onclose = () => this.stop();
  }

  private async startMic() {
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (this.closed) {
      mic.getTracks().forEach((t) => t.stop());
      return;
    }
    this.mic = mic;
    const ctx = new AudioContext({ sampleRate: this.inRate });
    this.ctx = ctx;
    // Created from the socket callback, long after Start. Chrome and Safari leave that
    // context suspended, and a suspended context never fires onaudioprocess.
    await ctx.resume();
    if (this.closed) return;
    const src = ctx.createMediaStreamSource(mic);
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    this.proc = proc;
    proc.onaudioprocess = (e) => {
      const ws = this.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const f = e.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(f.length);
      for (let i = 0; i < f.length; i++) pcm[i] = Math.max(-1, Math.min(1, f[i])) * 0x7fff;
      const chunk = toAgentAudio(pcm, e.inputBuffer.sampleRate, this.inFormat, this.inRate);
      ws.send(JSON.stringify({ user_audio_chunk: chunk }));
    };
    src.connect(proc);
    // ScriptProcessor only runs when connected; route through a muted gain so nothing is played back.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    proc.connect(mute);
    mute.connect(ctx.destination);
  }

  private fail(e: unknown) {
    if (this.closed) return;
    this.opts.events.onError(typeof e === 'string' ? e : 'The live receptionist could not continue.');
    this.stop();
  }

  stop() {
    if (this.closed) return;
    this.closed = true;
    if (this.speakingTimer) clearTimeout(this.speakingTimer);
    if (this.proc) this.proc.onaudioprocess = null;
    this.proc?.disconnect();
    this.ctx?.close().catch(() => {});
    this.mic?.getTracks().forEach((t) => t.stop());
    const ws = this.ws;
    this.ws = null;
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    const simli = this.simli;
    this.simli = null;
    simli?.stop().catch(() => {});
    this.opts.events.onEnded();
  }
}
