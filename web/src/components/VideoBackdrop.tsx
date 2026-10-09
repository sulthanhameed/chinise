import { useState } from "react";

interface Props {
  src: string;
  poster: string;
  className?: string;
}

/**
 * Background video with a still-image poster. Videos are lazy-loaded, muted and looped.
 * If the video file is missing or fails to load, the poster stays on screen.
 */
export function VideoBackdrop({ src, poster, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`video-backdrop ${className}`} aria-hidden="true">
      {!failed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onError={() => setFailed(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      <img className="video-poster" src={poster} alt="" loading="eager" decoding="async" />
      <div className="video-overlay" />
    </div>
  );
}
