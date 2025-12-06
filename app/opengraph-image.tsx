import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'VFP Trading Strategy Dashboard';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            zIndex: 10,
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0,
                textAlign: 'center',
              }}
            >
              VFP Dashboard
            </h1>
            <p
              style={{
                fontSize: '32px',
                color: '#94a3b8',
                margin: 0,
                textAlign: 'center',
              }}
            >
              Trading Strategy Analytics
            </p>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              marginTop: '48px',
            }}
          >
            {/* Stat 1 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                padding: '32px 48px',
                borderRadius: '16px',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '20px', color: '#94a3b8' }}>Total Strategies</span>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#3b82f6' }}>
                5,000+
              </span>
            </div>

            {/* Stat 2 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                padding: '32px 48px',
                borderRadius: '16px',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '20px', color: '#94a3b8' }}>Timeframes</span>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#8b5cf6' }}>5</span>
            </div>

            {/* Stat 3 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                padding: '32px 48px',
                borderRadius: '16px',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '20px', color: '#94a3b8' }}>Real-time Data</span>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>Live</span>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
