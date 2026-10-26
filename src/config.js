// Central client configuration. Backend URLs come from env with a localhost
// fallback for development (replaces the old hardcoded Render URL).

export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

// Kept in sync with the backend's src/config/constants.js.
export const ROLES = {
  PARTICIPANT: "participant", // meet: sends + receives (mesh)
  HOST: "host", // stream: broadcaster
  VIEWER: "viewer", // stream: receive-only
};

export const MODES = {
  MEET: "meet",
  STREAM: "stream",
};

export const MEDIA_MODES = {
  INTERACTIVE: "interactive",
  HLS: "hls", // phase 2
};

// 720p media caps. Media is peer-to-peer, so every viewer/peer costs the sender
// one more encode + upload of these: ~1 Mbps camera, ~0.6 Mbps screen.
export const CAMERA_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { max: 24 },
};
export const SCREEN_CONSTRAINTS = {
  width: { max: 1280 },
  height: { max: 720 },
  frameRate: { max: 5 }, // text stays sharp; motion isn't the point of a screen
};
export const VIDEO_CAPS = {
  camera: { maxBitrate: 1_000_000, maxFramerate: 24 },
  screen: { maxBitrate: 600_000, maxFramerate: 5 },
};

export const STREAM_CATEGORIES = [
  "Just Chatting",
  "Gaming",
  "Music",
  "Education",
  "Tech & Coding",
  "Sports",
  "Art",
  "IRL",
];
