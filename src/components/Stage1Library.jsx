// src/components/Stage1Library.jsx

import PhotoCard from './PhotoCard.jsx';
import photos from '../data/photos.json';

export default function Stage1Library() {
  return (
    <div>
      <div className="section-header">
        <div className="section-title">Raw Library</div>
        <div className="section-subtitle">Library as Google Photos sees it today: no structured cues</div>
      </div>

      <div className="insight-box">
        <strong>The problem:</strong> Google Photos stores captions as free text. When you search for a vague memory
        — like "my granddaughter in a pink dress at Diwali" — the engine matches only one literal keyword
        at a time. Scroll below to see 43 photos, each with just an ID and caption — no look, no person, no time cue.
      </div>

      <div className="photo-grid">
        {photos.photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} aiTag={null} showTags={false} isTarget={false} />
        ))}
      </div>
    </div>
  );
}
