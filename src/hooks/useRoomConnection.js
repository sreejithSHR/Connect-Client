import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";

import { SOCKET_URL, MODES, ROLES } from "../config";
import { getIdToken } from "../api/token";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

import joinSFX from "../sounds/join.mp3";
import leaveSFX from "../sounds/leave.mp3";
import msgSFX from "../sounds/message.mp3";

/**
 * Single source of truth for the socket + WebRTC peer lifecycle, shared by Meet
 * and Stream. Switches transport topology by mode/role:
 *
 *   - MEET (mesh): every participant sends + receives.
 *   - STREAM host: sends its media to each viewer that connects.
 *   - STREAM viewer: receive-only; connects to the host only, never opens a camera.
 *
 * @param {{ roomID: string, mode: string, role: string }} opts
 */
export function useRoomConnection({ roomID, mode, role }) {
  const { user } = useAuth();

  const captureMedia = role === ROLES.PARTICIPANT || role === ROLES.HOST;
  const sendsStream = mode === MODES.MEET || role === ROLES.HOST;

  const [loading, setLoading] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [viewerCount, setViewerCount] = useState(1);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [streamEnded, setStreamEnded] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const peersRef = useRef([]);
  const streamRef = useRef(null);
  const localVideoRef = useRef(null);

  const createPeer = useCallback((userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream: stream || undefined });
    peer.on("signal", (signal) => {
      socketRef.current?.emit("sending signal", { userToSignal, callerID, signal });
    });
    return peer;
  }, []);

  const addPeer = useCallback((incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream: stream || undefined });
    peer.on("signal", (signal) => {
      socketRef.current?.emit("returning signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  }, []);

  useEffect(() => {
    if (!user || !roomID) return undefined;
    let cancelled = false;

    const start = async () => {
      const token = await getIdToken();
      const socket = io(SOCKET_URL, { auth: { token } });
      socketRef.current = socket;

      // Backfill chat history (best-effort).
      api
        .getMessages(roomID)
        .then(({ messages: history }) => {
          if (cancelled) return;
          setMessages(
            history.map((m) => ({
              id: m.id,
              user: { id: m.user.id, name: m.user.name, profilePic: m.user.photoURL },
              message: m.body,
              createdAt: m.createdAt,
              send: m.user.id === user.uid,
            }))
          );
        })
        .catch(() => {});

      socket.on("message", (data) => {
        if (data.user.id !== user.uid) new Audio(msgSFX).play().catch(() => {});
        setMessages((prev) => [...prev, { ...data, send: data.user.id === user.uid }]);
      });

      socket.on("room state", (state) => {
        setParticipants(state.participants || []);
        setViewerCount(state.viewerCount || 1);
      });

      socket.on("stream ended", () => setStreamEnded(true));

      socket.on("media state", ({ socketId, kind, enabled }) => {
        setPeers((prev) =>
          prev.map((p) =>
            p.peerID === socketId
              ? { ...p, [kind === "audio" ? "micOn" : "videoOn"]: enabled }
              : p
          )
        );
      });

      socket.on("error", (e) => setError(e?.message || "Connection error"));

      // Acquire media for capture roles before joining so peers have a stream.
      let stream = null;
      if (captureMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (err) {
          setError("Camera/microphone access denied");
        }
      }
      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        socket.disconnect();
        return;
      }
      streamRef.current = stream;
      if (stream) {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }
      setLoading(false);

      socket.emit("join room", { roomID, mode, role });

      // Build peers to the existing members the topology requires.
      socket.on("all users", (users) => {
        const targets = users.filter((u) => {
          if (mode === MODES.MEET) return true;
          if (role === ROLES.VIEWER) return u.role === ROLES.HOST;
          return false; // stream host doesn't initiate
        });
        const next = targets.map((u) => {
          const peer = createPeer(u.userId, socket.id, streamRef.current);
          const obj = { peerID: u.userId, peer, user: u.user, role: u.role };
          peersRef.current.push(obj);
          return obj;
        });
        setPeers(next);
      });

      // Someone connected to us.
      socket.on("user joined", (payload) => {
        new Audio(joinSFX).play().catch(() => {});
        const peer = addPeer(
          payload.signal,
          payload.callerID,
          sendsStream ? streamRef.current : null
        );
        const obj = { peerID: payload.callerID, peer, user: payload.user, role: payload.role };
        peersRef.current.push(obj);
        setPeers((prev) => [...prev, obj]);
      });

      socket.on("receiving returned signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item?.peer.signal(payload.signal);
      });

      socket.on("user left", (id) => {
        new Audio(leaveSFX).play().catch(() => {});
        const obj = peersRef.current.find((p) => p.peerID === id);
        obj?.peer.destroy();
        peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
        setPeers((prev) => prev.filter((p) => p.peerID !== id));
      });
    };

    start();

    return () => {
      cancelled = true;
      peersRef.current.forEach((p) => p.peer.destroy());
      peersRef.current = [];
      streamRef.current?.getTracks().forEach((t) => t.stop());
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomID, mode, role]);

  const sendMessage = useCallback(
    (text) => {
      const message = (text || "").trim();
      if (!message || !socketRef.current) return;
      socketRef.current.emit("send message", { roomID, message });
    },
    [roomID]
  );

  const toggleAudio = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    socketRef.current?.emit("media state", { roomID, kind: "audio", enabled: track.enabled });
  }, [roomID]);

  const toggleVideo = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
    socketRef.current?.emit("media state", { roomID, kind: "video", enabled: track.enabled });
  }, [roomID]);

  return {
    loading,
    error,
    localStream,
    localVideoRef,
    peers,
    peersRef,
    messages,
    participants,
    viewerCount,
    micOn,
    videoOn,
    streamEnded,
    sendMessage,
    toggleAudio,
    toggleVideo,
  };
}
