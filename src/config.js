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
// one more encode + upload of these: ~1 Mbps camera, up to ~1.5 Mbps screen.
export const CAMERA_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { max: 24 },
};
export const SCREEN_CONSTRAINTS = {
  width: { max: 1280 },
  height: { max: 720 },
  frameRate: { ideal: 30, max: 30 },
};
// Screen share sends one copy per peer, so fps scales with the room: 30 fps
// while sending to a few peers, 15 fps once the upload multiplies.
export const SCREEN_SMOOTH_MAX_PEERS = 3;
// degradationPreference "balanced": under a weak uplink, drop a bit of both
// resolution and fps instead of freezing frames to keep full resolution.
export const VIDEO_CAPS = {
  camera: { maxBitrate: 1_000_000, maxFramerate: 24 },
  screen: { maxBitrate: 2_000_000, maxFramerate: 30, degradationPreference: "balanced" },
  screenMany: { maxBitrate: 1_500_000, maxFramerate: 15, degradationPreference: "balanced" },
};

// Live streams through the server's SFU: the host uploads ONE copy whatever the
// audience, so screen share can be 1080p30. Each video goes out as two
// simulcast layers; the server gives every viewer the one their connection
// can take instead of stalling them all.
export const SFU_SCREEN_CONSTRAINTS = {
  width: { max: 1920 },
  height: { max: 1080 },
  frameRate: { ideal: 30, max: 30 },
};
export const SFU_LAYERS = {
  camera: [
    { scaleResolutionDownBy: 4, maxBitrate: 150_000, maxFramerate: 15 },
    { scaleResolutionDownBy: 1, maxBitrate: 1_200_000, maxFramerate: 24 },
  ],
  // Server CPU grows with bitrate x viewers: 1.5 Mbps keeps 30 viewers inside
  // the Micro's 1/8 OCPU (load-tested); slides and code need far less anyway.
  screen: [
    { scaleResolutionDownBy: 2, maxBitrate: 400_000, maxFramerate: 15 },
    { scaleResolutionDownBy: 1, maxBitrate: 1_500_000, maxFramerate: 30 },
  ],
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
