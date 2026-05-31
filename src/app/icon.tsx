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
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fbbf24, #f97316)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 -3px 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* Anillo interior */}
        <div
          style={{
            position: 'absolute',
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <span
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '-1px',
            textShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
        >
          ES
        </span>
      </div>
    ),
    { ...size }
  );
}
