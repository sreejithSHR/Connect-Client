import React, { useEffect, useRef } from "react";

/**
 * Phase-2 seam (not active in the current build).
 *
 * When a stream's audience crosses VIEWER_HLS_THRESHOLD, the backend would flip
 * the stream's `mediaMode` to "hls" and expose an `.m3u8` URL; viewers would then
 * render this component instead of a WebRTC VideoTile. It uses `hls.js` where the
 * browser lacks native HLS (Safari plays HLS natively).
 *
 * Kept intentionally minimal so dropping in the scale path later is a one-line
 * branch in the viewer (see page/Stream.jsx).
 */
const HlsPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    let hls;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src; // native HLS (Safari / iOS)
    } else {
      // Lazy-load hls.js only when actually needed.
      import("hls.js")
        .then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
          }
        })
        .catch(() => {});
    }
    return () => hls?.destroy();
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      autoPlay
      playsInline
      className="h-full w-full bg-black object-contain"
    />
  );
};

export default HlsPlayer;
