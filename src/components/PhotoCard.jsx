// src/components/PhotoCard.jsx — Gradient tile with SVG icon keyed to look

import { useState } from 'react';

// Gradient + icon config per look value
const LOOK_CONFIG = {
  'pink dress': {
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f9a8d4 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 8 L20 14 L26 8" />
        <path d="M14 8 C12 12 10 30 10 34 L30 34 C30 30 28 12 26 8" />
        <path d="M16 22 Q20 26 24 22" />
      </svg>
    ),
  },
  'dressed up': {
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="11" r="4" />
        <path d="M12 20 C12 16 28 16 28 20 L28 34 L12 34 Z" />
        <path d="M16 20 L14 14 M24 20 L26 14" />
        <path d="M17 24 L23 24" />
      </svg>
    ),
  },
  'short hair': {
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="14" r="6" />
        <path d="M14 14 C13 9 27 9 26 14" />
        <path d="M14 18 C13 22 12 28 14 32 L26 32 C28 28 27 22 26 18" />
        <path d="M14 14 C14 10 12 8 11 9" />
        <path d="M26 14 C26 10 28 8 29 9" />
      </svg>
    ),
  },
  'blue jacket': {
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 12 L10 16 L10 34 L30 34 L30 16 L26 12" />
        <path d="M14 12 L17 8 L20 12 L23 8 L26 12" />
        <path d="M20 12 L20 34" />
        <path d="M10 22 L14 22 M30 22 L26 22" />
      </svg>
    ),
  },
  'birthday cake': {
    gradient: 'linear-gradient(135deg, #f97316 0%, #fde68a 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 8 C20 8 19 10 20 12" />
        <path d="M8 20 L8 34 L32 34 L32 20 Q20 16 8 20 Z" />
        <path d="M8 26 Q20 22 32 26" />
        <path d="M15 20 Q15 16 15 12 M25 20 Q25 16 25 12" />
      </svg>
    ),
  },
  'beach sunset': {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fb7185 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 28 L32 28" />
        <path d="M8 32 L32 32" />
        <circle cx="20" cy="18" r="5" />
        <path d="M20 10 L20 8 M20 28 L20 26 M10 18 L8 18 M32 18 L30 18 M13 11 L12 10 M28 11 L29 10" />
      </svg>
    ),
  },
  'wedding mandap': {
    gradient: 'linear-gradient(135deg, #dc2626 0%, #fca5a5 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 30 L8 18 M32 30 L32 18" />
        <path d="M8 18 Q20 10 32 18" />
        <path d="M12 18 L12 30 M28 18 L28 30" />
        <path d="M8 30 L32 30" />
        <path d="M16 30 L16 22 L24 22 L24 30" />
        <path d="M18 22 L18 18 M22 22 L22 18" />
      </svg>
    ),
  },
  'festive lights': {
    gradient: 'linear-gradient(135deg, #d97706 0%, #fde68a 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 14 Q14 10 20 14 Q26 18 32 14" />
        <circle cx="11" cy="17" r="3" fill="rgba(255,255,255,0.4)" />
        <circle cx="20" cy="13" r="3" fill="rgba(255,255,255,0.4)" />
        <circle cx="29" cy="17" r="3" fill="rgba(255,255,255,0.4)" />
        <path d="M11 20 L11 24 M20 16 L20 20 M29 20 L29 24" />
        <path d="M8 28 Q14 24 20 28 Q26 32 32 28" />
      </svg>
    ),
  },
  'office whiteboard': {
    gradient: 'linear-gradient(135deg, #374151 0%, #9ca3af 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="10" width="24" height="18" rx="2" />
        <path d="M14 32 L16 28 M26 32 L24 28" />
        <path d="M12 16 L22 16 M12 20 L19 20 M12 24 L24 24" />
        <path d="M25 13 L28 16 L22 20" />
      </svg>
    ),
  },
  'trekking backpack': {
    gradient: 'linear-gradient(135deg, #065f46 0%, #6ee7b7 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8 Q20 6 24 8 L24 12" />
        <path d="M14 12 Q12 12 12 14 L12 32 Q12 34 14 34 L26 34 Q28 34 28 32 L28 14 Q28 12 26 12 Z" />
        <path d="M16 8 L16 12 M24 12 L24 8" />
        <path d="M15 20 L25 20 M15 24 L25 24" />
        <path d="M10 16 L8 18 L10 30 M30 16 L32 18 L30 30" />
      </svg>
    ),
  },
  'puppy': {
    gradient: 'linear-gradient(135deg, #78350f 0%, #fcd34d 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="22" rx="9" ry="7" />
        <circle cx="20" cy="13" r="5" />
        <path d="M15 9 C14 6 11 7 12 10" />
        <path d="M25 9 C26 6 29 7 28 10" />
        <circle cx="17" cy="13" r="1" fill="white" />
        <circle cx="23" cy="13" r="1" fill="white" />
        <path d="M18 16 Q20 18 22 16" />
        <path d="M14 26 L12 30 M26 26 L28 30" />
      </svg>
    ),
  },
  'rainy window': {
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #60a5fa 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="22" height="22" rx="2" />
        <path d="M20 9 L20 31 M9 20 L31 20" />
        <path d="M13 25 L13 27 M17 27 L17 29 M21 25 L21 27 M25 27 L25 29 M27 25 L27 27" />
      </svg>
    ),
  },
  'plate of biryani': {
    gradient: 'linear-gradient(135deg, #92400e 0%, #fcd34d 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="26" rx="12" ry="6" />
        <path d="M8 24 Q8 16 20 14 Q32 16 32 24" />
        <path d="M13 20 Q16 17 20 18 Q24 17 27 20" />
        <path d="M20 8 C19 10 21 12 20 14" />
      </svg>
    ),
  },
  'cricket match': {
    gradient: 'linear-gradient(135deg, #14532d 0%, #4ade80 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 30 L24 10" strokeWidth="3" />
        <path d="M24 10 L28 14 L16 34" />
        <circle cx="28" cy="16" r="4" />
        <path d="M8 34 L16 34 M16 34 L18 30" />
      </svg>
    ),
  },
  'diwali diyas': {
    gradient: 'linear-gradient(135deg, #b45309 0%, #fde68a 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 26 C14 24 16 22 20 22 C24 22 26 24 26 26 C26 28 24 30 20 30 C16 30 14 28 14 26 Z" />
        <path d="M20 22 L20 14" />
        <path d="M18 14 C18 11 22 11 22 14" fill="rgba(255,200,50,0.5)" stroke="none" />
        <path d="M20 14 L19 12 M20 14 L21 12 M20 14 L20 11" />
        <path d="M10 30 L30 30" />
      </svg>
    ),
  },
  'graduation gown': {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #818cf8 100%)',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10 L8 16 L20 22 L32 16 Z" />
        <path d="M28 19 L28 28 Q20 32 12 28 L12 19" />
        <path d="M32 16 L32 24" />
        <circle cx="32" cy="26" r="2" />
        <path d="M17 22 L16 34 M23 22 L24 34" />
        <path d="M16 28 Q20 26 24 28" />
      </svg>
    ),
  },
};

export default function PhotoCard({ photo, aiTag, showTags, isTarget }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const padId = String(photo.id).padStart(2, '0');
  const imgSrc = `/photo-cards/card-${padId}.svg`;

  const config = LOOK_CONFIG[photo.look] || {
    gradient: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
    icon: null,
  };

  const hasMistag = aiTag && showTags && (
    aiTag.look !== photo.look ||
    aiTag.person !== photo.person
  );

  const mistags = aiTag && showTags ? [
    aiTag.look !== photo.look && { field: 'look', ai: aiTag.look, truth: photo.look },
    aiTag.person !== photo.person && { field: 'person', ai: aiTag.person, truth: photo.person },
  ].filter(Boolean) : [];

  return (
    <div
      className={`photo-card ${hasMistag ? 'mistagged' : ''} ${isTarget ? 'target-found' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Mistag tooltip */}
      {hovered && hasMistag && mistags.length > 0 && (
        <div className="mistag-tooltip">
          {mistags.map((m) => (
            <div key={m.field} style={{ marginBottom: 4 }}>
              <strong style={{ color: '#fb923c', textTransform: 'capitalize' }}>{m.field} (AI):</strong>
              {' '}AI: <em>{m.ai || '—'}</em> · Truth: <em style={{ color: '#34d399' }}>{m.truth}</em>
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail tile */}
      {!imgError ? (
        <div className="photo-tile">
          <img
            src={imgSrc}
            alt={photo.caption}
            loading="lazy"
            width="400"
            height="280"
            className="photo-thumbnail-img"
            onError={() => setImgError(true)}
          />
          <span className="photo-id-badge">#{photo.id}</span>
          {isTarget && (
            <span style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'rgba(52,211,153,0.9)', borderRadius: '50%',
              width: 20, height: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12,
            }}>✓</span>
          )}
        </div>
      ) : (
        /* Fallback gradient tile */
        <div className="photo-tile" style={{ background: config.gradient }}>
          <span className="photo-id-badge">#{photo.id}</span>
          {config.icon}
          {isTarget && (
            <span style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'rgba(52,211,153,0.9)', borderRadius: '50%',
              width: 20, height: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12,
            }}>✓</span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="photo-body">
        <p className="photo-caption">{photo.caption}</p>
        {showTags && aiTag && (
          <div className="photo-tags">
            <div className="tag-row">
              <span className="tag-label">look</span>
              <span className={`tag-value ${aiTag.look === photo.look ? 'correct' : 'wrong'}`}>
                {aiTag.look || '—'} {aiTag.look === photo.look ? '✓' : '✗'}
              </span>
            </div>
            <div className="tag-row">
              <span className="tag-label">who</span>
              <span className={`tag-value ${aiTag.person === photo.person ? 'correct' : 'wrong'}`}>
                {aiTag.person || '—'} {aiTag.person === photo.person ? '✓' : '✗'}
              </span>
            </div>
            <div className="tag-row">
              <span className="tag-label">when</span>
              <span className="tag-value correct" style={{ color: '#a5b4fc' }}>
                {aiTag.when || photo.when} <span style={{ fontSize: 10, opacity: 0.8 }}>(EXIF)</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
