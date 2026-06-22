import { API_URL } from "../config";
import { getIdToken } from "./token";

async function request(path, { method = "GET", body } = {}) {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // streams
  listStreams: () => request("/api/streams"),
  getStream: (id) => request(`/api/streams/${id}`),
  goLive: (data) => request("/api/streams", { method: "POST", body: data }),
  endStream: (id) => request(`/api/streams/${id}/end`, { method: "PATCH" }),
  // rooms
  createRoom: (roomID) => request("/api/rooms", { method: "POST", body: { roomID } }),
  getRoom: (id) => request(`/api/rooms/${id}`),
  // chat
  getMessages: (roomId) => request(`/api/messages/${roomId}`),
};
