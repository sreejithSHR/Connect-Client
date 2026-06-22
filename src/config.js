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
