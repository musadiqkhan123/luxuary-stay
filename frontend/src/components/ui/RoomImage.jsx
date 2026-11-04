import { useState } from 'react';

// Image with a graceful placeholder if the URL fails to load
export default function RoomImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`room-img room-img-fallback ${className}`} role="img" aria-label={alt}>
        <span>{alt}</span>
      </div>
    );
  }
  return <img className={`room-img ${className}`} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
