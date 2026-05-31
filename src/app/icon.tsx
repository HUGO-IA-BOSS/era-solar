import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          background: 'linear-gradient(150deg, #fbbf24 0%, #f97316 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Reflejo diagonal superior */}
        <div style={{
          position: 'absolute',
          top: -10,
          left: -10,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
        }} />
        {/* Franja oscura inferior */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 18,
          background: 'rgba(0,0,0,0.12)',
        }} />
        {/* Texto */}
        <span style={{
          color: '#0f172a',
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: -3,
          position: 'relative',
          zIndex: 1,
        }}>
          ES
        </span>
      </div>
    ),
    { ...size }
  );
}
