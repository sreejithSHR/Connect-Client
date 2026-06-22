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
 * Socket + WebRTC lifecycle shared by Meet and Stream.
 *
 * Track handling uses simple-peer's `replaceTrack` (no renegotiation): every
 * connection is created with a video sender, and camera-off / screen-share swap
 * that sender's track. Camera-off actually stops the device (privacy), then a
 * fresh track is acquired on camera-on. Remote streams are captured into state
 * so a tile can be re-mounted (e.g. pinned) without losing its video.
 */
export function useRoomConnection({
  roomID,
  mode,
  role,
  initialAudio = true,
  initialVideo = true,
}) {
  const { user } = useAuth();

  const captureMedia = role === ROLES.PARTICIPANT || role === ROLES.HOST;
  const sendsStream = mode === MODES.MEET || role === ROLES.HOST;

  const [phase, setPhase] = useState("connecting"); // connecting | waiting | live | denied
  const [isHost, setIsHost] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [peerStreams, setPeerStreams] = useState({});
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [viewerCount, setViewerCount] = useState(1);
  const [micOn, setMicOn] = useState(initialAudio);
  const [videoOn, setVideoOn] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const socketRef = useRef(null);
  const peersRef = useRef([]);
  const streamRef = useRef(null);
  const localVideoRef = useRef(null);
  const cameraTrackRef = useRef(null); // current video sender key (kept in streamRef)

  const refreshLocalPreview = () => {
    const el = localVideoRef.current;
    if (el && streamRef.current) {
      el.srcObject = null;
      el.srcObject = streamRef.current;
    }
  };

  const replaceVideoForPeers = (oldKey, newTrack) => {
    peersRef.current.forEach(({ peer }) => {
      try {
        peer.replaceTrack(oldKey, newTrack, streamRef.current);
      } catch (e) {
        /* peer may have no video sender (receive-only viewer) */
      }
    });
  };

  const emitMedia = (kind, enabled) =>
    socketRef.current?.emit("media state", { roomID, kind, enabled });

  // ---- Peer factory (stream capture wired in) ----
  const trackPeerStream = useCallback((peerID, peer) => {
    peer.on("stream", (remote) => {
      setPeerStreams((prev) => ({ ...prev, [peerID]: remote }));
    });
  }, []);

  const createPeer = useCallback(
    (userToSignal, callerID, stream) => {
      const peer = new Peer({ initiator: true, trickle: false, stream: stream || undefined });
      peer.on("signal", (signal) =>
        socketRef.current?.emit("sending signal", { userToSignal, callerID, signal })
      );
      return peer;
    },
    []
  );

  const addPeer = useCallback((incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream: stream || undefined });
    peer.on("signal", (signal) =>
      socketRef.current?.emit("returning signal", { signal, callerID })
    );
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

      socket.on("media state", ({ socketId, kind, enabled }) => {
        setPeers((prev) =>
          prev.map((p) =>
            p.peerID === socketId
              ? { ...p, [kind === "audio" ? "micOn" : "videoOn"]: enabled }
              : p
          )
        );
      });

      // ---- Lobby ----
      socket.on("waiting", () => setPhase("waiting"));
      socket.on("admitted", ({ host }) => {
        setIsHost(!!host);
        setPhase("live");
      });
      socket.on("denied", () => setPhase("denied"));
      socket.on("host changed", () => setIsHost(true));
      socket.on("join request", ({ socketId, user: u }) => {
        setJoinRequests((prev) =>
          prev.some((r) => r.socketId === socketId) ? prev : [...prev, { socketId, user: u }]
        );
      });
      socket.on("request handled", ({ socketId }) =>
        setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId))
      );

      socket.on("stream ended", () => setPhase("ended"));
      socket.on("error", (e) => setError(e?.message || "Connection error"));

      // ---- Local media ----
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
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        if (audioTrack) audioTrack.enabled = initialAudio;
        cameraTrackRef.current = videoTrack || null;
        // Honour an initial camera-off choice by stopping the device now, while
        // keeping the (ended) track in the stream so peers still get a sender.
        if (videoTrack && !initialVideo) videoTrack.stop();
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }
      setLoading(false);

      socket.emit("join room", { roomID, mode, role });

      socket.on("all users", (users) => {
        const targets = users.filter((u) => {
          if (mode === MODES.MEET) return true;
          if (role === ROLES.VIEWER) return u.role === ROLES.HOST;
          return false;
        });
        const next = targets.map((u) => {
          const peer = createPeer(u.userId, socket.id, streamRef.current);
          trackPeerStream(u.userId, peer);
          const obj = { peerID: u.userId, peer, user: u.user, role: u.role, micOn: true, videoOn: true };
          peersRef.current.push(obj);
          return obj;
        });
        setPeers(next);
      });

      socket.on("user joined", (payload) => {
        new Audio(joinSFX).play().catch(() => {});
        const peer = addPeer(payload.signal, payload.callerID, sendsStream ? streamRef.current : null);
        trackPeerStream(payload.callerID, peer);
        const obj = {
          peerID: payload.callerID,
          peer,
          user: payload.user,
          role: payload.role,
          micOn: true,
          videoOn: true,
        };
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
        setPeerStreams((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
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
    emitMedia("audio", track.enabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID]);

  // Real camera off: stop the device (light off) + stop sending; re-acquire on.
  const toggleVideo = useCallback(async () => {
    if (!captureMedia || isScreenSharing) return;
    const stream = streamRef.current;
    if (!stream) return;

    if (videoOn) {
      replaceVideoForPeers(cameraTrackRef.current, null);
      cameraTrackRef.current?.stop(); // keep the (ended) track as the sender key
      setVideoOn(false);
      refreshLocalPreview();
      emitMedia("video", false);
    } else {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = cam.getVideoTracks()[0];
        replaceVideoForPeers(cameraTrackRef.current, newTrack);
        const old = cameraTrackRef.current;
        if (old) {
          try { stream.removeTrack(old); } catch (e) { /* ignore */ }
        }
        stream.addTrack(newTrack);
        cameraTrackRef.current = newTrack;
        setVideoOn(true);
        refreshLocalPreview();
        emitMedia("video", true);
      } catch (e) {
        setError("Camera unavailable");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMedia, isScreenSharing, videoOn, roomID]);

  const stopScreenShare = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = cam.getVideoTracks()[0];
      const screenTrack = cameraTrackRef.current;
      replaceVideoForPeers(screenTrack, camTrack);
      if (screenTrack) {
        try { stream.removeTrack(screenTrack); } catch (e) { /* ignore */ }
        screenTrack.stop();
      }
      stream.addTrack(camTrack);
      cameraTrackRef.current = camTrack;
      setIsScreenSharing(false);
      setVideoOn(true);
      refreshLocalPreview();
      emitMedia("video", true);
    } catch (e) {
      setError("Could not restore camera");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID]);

  const toggleScreenShare = useCallback(async () => {
    if (!captureMedia) return;
    if (isScreenSharing) return stopScreenShare();
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      replaceVideoForPeers(cameraTrackRef.current, screenTrack);
      const old = cameraTrackRef.current;
      if (old) {
        try { stream.removeTrack(old); } catch (e) { /* ignore */ }
        old.stop();
      }
      stream.addTrack(screenTrack);
      cameraTrackRef.current = screenTrack;
      setIsScreenSharing(true);
      setVideoOn(true);
      refreshLocalPreview();
      screenTrack.onended = () => stopScreenShare();
    } catch (e) {
      /* user cancelled the picker */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMedia, isScreenSharing, stopScreenShare]);

  const admit = useCallback(
    (socketId) => socketRef.current?.emit("admit", { roomID, socketId }),
    [roomID]
  );
  const deny = useCallback(
    (socketId) => socketRef.current?.emit("deny", { roomID, socketId }),
    [roomID]
  );

  return {
    phase,
    isHost,
    joinRequests,
    admit,
    deny,
    loading,
    error,
    localStream,
    localVideoRef,
    peers,
    peerStreams,
    peersRef,
    messages,
    participants,
    viewerCount,
    micOn,
    videoOn,
    isScreenSharing,
    streamEnded: phase === "ended",
    sendMessage,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  };
}
