import { forwardRef } from 'react';
import type { WrappedData } from '@/types/wrapped';

interface WrappedShareCardProps {
  data: WrappedData;
}

const WrappedShareCard = forwardRef<HTMLDivElement, WrappedShareCardProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 40%, #7c3aed 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'white',
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          padding: '80px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '0.05em',
            marginBottom: 20,
            opacity: 0.7,
          }}
        >
          Conciertos Latam
        </div>

        {/* Year */}
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 40,
            background: 'linear-gradient(to right, #fbbf24, #ec4899, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {data.year}
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'flex',
            gap: 50,
            marginBottom: 60,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 80, fontWeight: 900 }}>{data.totalConcerts}</div>
            <div style={{ fontSize: 24, opacity: 0.8 }}>Conciertos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 80, fontWeight: 900 }}>{data.totalArtistsSeen}</div>
            <div style={{ fontSize: 24, opacity: 0.8 }}>Artistas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 80, fontWeight: 900 }}>{data.uniqueCitiesCount}</div>
            <div style={{ fontSize: 24, opacity: 0.8 }}>Ciudades</div>
          </div>
        </div>

        {/* Top artist */}
        {data.topArtistByConcerts && (
          <div
            style={{
              fontSize: 36,
              marginBottom: 40,
              textAlign: 'center',
            }}
          >
            Artista mas visto:{' '}
            <span style={{ fontWeight: 800 }}>
              {data.topArtistByConcerts.name}
            </span>
          </div>
        )}

        {/* URL */}
        <div
          style={{
            fontSize: 22,
            opacity: 0.5,
            position: 'absolute',
            bottom: 50,
          }}
        >
          conciertoslatam.app/wrapped
        </div>
      </div>
    );
  }
);

WrappedShareCard.displayName = 'WrappedShareCard';

export default WrappedShareCard;
