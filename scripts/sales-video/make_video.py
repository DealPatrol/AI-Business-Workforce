#!/usr/bin/env python3
"""Render the 60–90s Ava HVAC/plumbing sales video."""

from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "build"
PUBLIC_MP4 = ROOT.parent.parent / "public" / "ava-hvac-pilot.mp4"
HTML = ROOT / "scenes.html"
CHROME = "/usr/bin/google-chrome-stable"

VOICE = "en-US-AndrewNeural"

SCENES = [
    {
        "id": "1",
        "text": "What happens when a customer calls while you're on a job?",
    },
    {
        "id": "2",
        "text": "Most HVAC and plumbing businesses lose that call — and the job — to whoever picks up first.",
    },
    {
        "id": "3",
        "text": "Ava answers immediately. She handles the common questions, captures the job details, and sounds like she's already on your team.",
    },
    {
        "id": "4",
        "text": "Name, phone, address, what's broken, and how urgent it is. Then she gets off the phone so you can keep working.",
    },
    {
        "id": "5",
        "text": "When the call ends, you get this: a qualified lead summary. No voicemail. No guessing. Just the details you need to call back and close the job.",
    },
    {
        "id": "6",
        "text": "Two hundred fifty dollars to set it up. Two ninety-nine a month after a fourteen-day pilot. Three hundred voice minutes included. Cancel anytime.",
    },
    {
        "id": "7",
        "text": "I built a demo using your business so you can hear exactly how Ava would handle your missed calls. Tap the link. Call Ava yourself.",
    },
]


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def duration(path: Path) -> float:
    result = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    )
    return float(result.strip())


async def speak(text: str, dest: Path) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate="-8%")
    await communicate.save(str(dest))


def screenshot(scene_id: str, dest: Path) -> None:
    url = f"file://{HTML}?scene={scene_id}"
    run(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-sandbox",
            "--window-size=1920,1080",
            f"--screenshot={dest}",
            url,
        ]
    )


async def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_MP4.parent.mkdir(parents=True, exist_ok=True)

    audio_parts: list[Path] = []
    image_parts: list[tuple[Path, float]] = []

    for scene in SCENES:
        wav = OUT_DIR / f"scene-{scene['id']}.mp3"
        png = OUT_DIR / f"scene-{scene['id']}.png"
        print(f"scene {scene['id']}: voice + frame")
        await speak(scene["text"], wav)
        screenshot(scene["id"], png)
        hold = max(duration(wav) + 1.2, 7.2)
        if scene["id"] == "5":
            hold = max(hold, 14.0)
        if scene["id"] == "7":
            hold = max(hold, 12.0)
        audio_parts.append(wav)
        image_parts.append((png, hold))

    silence = OUT_DIR / "silence.mp3"
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-t",
            "0.35",
            "-q:a",
            "9",
            str(silence),
        ]
    )

    concat_audio = OUT_DIR / "audio-concat.txt"
    lines: list[str] = []
    for index, wav in enumerate(audio_parts):
        lines.append(f"file '{wav}'")
        if index < len(audio_parts) - 1:
            lines.append(f"file '{silence}'")
    concat_audio.write_text("\n".join(lines) + "\n")

    voice = OUT_DIR / "voiceover.m4a"
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_audio),
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(voice),
        ]
    )

    concat_video = OUT_DIR / "video-concat.txt"
    video_lines: list[str] = []
    for png, hold in image_parts:
        video_lines.append(f"file '{png}'")
        video_lines.append(f"duration {hold:.2f}")
    video_lines.append(f"file '{image_parts[-1][0]}'")
    concat_video.write_text("\n".join(video_lines) + "\n")

    silent_video = OUT_DIR / "silent.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_video),
            "-vf",
            "scale=1920:1080,format=yuv420p",
            "-r",
            "30",
            "-pix_fmt",
            "yuv420p",
            str(silent_video),
        ]
    )

    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(silent_video),
            "-i",
            str(voice),
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(PUBLIC_MP4),
        ]
    )

    info = duration(PUBLIC_MP4)
    print(f"wrote {PUBLIC_MP4} ({info:.1f}s)")


if __name__ == "__main__":
    asyncio.run(main())
