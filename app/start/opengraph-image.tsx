import { ImageResponse } from 'next/og';

export const alt = 'Ava, the AI receptionist: every call answered. Plans from $79/month, Starter first month $1';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#14201a',
          color: '#f4f1e8',
          padding: '64px 72px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 34, fontWeight: 700 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#f2c14e',
              color: '#14201a',
            }}
          >
            A
          </div>
          Ava · AI receptionist
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700, color: '#ffffff' }}>Every call answered.</div>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700, color: '#f2c14e' }}>Every real lead sent to you.</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#cfd8d1' }}>
          <span>Home services · Online stores</span>
          <span>Start for $1 · then $79/mo · Pro 1,200 min $397/mo</span>
        </div>
      </div>
    ),
    size,
  );
}
