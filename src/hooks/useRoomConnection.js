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
 * Socket + WebRTC lifecycle shared by Meet and Stream. Video/audio device swaps
 * (camera, mic, screen-share) use simple-peer's `replaceTrack` so there is no
 * renegotiation. Camera-off stops the device (privacy). Remote streams are kept
 * in state so tiles survive re-mounts.
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

  const [phase, setPhase] = useState("connecting");
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
  const [chatDisabled, setChatDisabledState] = useState(false);

  const [devices, setDevices] = useState({ cameras: [], mics: [], speakers: [] });
  const [selectedDevices, setSelectedDevices] = useState({ camera: "", mic: "", speaker: "" });
  const [isRecording, setIsRecording] = useState(false);

  const socketRef = useRef(null);
  const peersRef = useRef([]);
  const streamRef = useRef(null);
  const localVideoRef = useRef(null);
  const cameraTrackRef = useRef(null); // current video sender key
  const audioTrackRef = useRef(null); // current audio sender key
  const recorderRef = useRef(null);

  const refreshLocalPreview = () => {
    const el = localVideoRef.current;
    if (el && streamRef.current) {
      el.srcObject = null;
      el.srcObject = streamRef.current;
    }
  };

  const replaceForPeers = (oldKey, newTrack) => {
    peersRef.current.forEach(({ peer }) => {
      try {
        peer.replaceTrack(oldKey, newTrack, streamRef.current);
      } catch (e) {
        /* receive-only peer / no such sender */
      }
    });
  };

  const emitMedia = (kind, enabled) =>
    socketRef.current?.emit("media state", { roomID, kind, enabled });

  // Swap the live video track (camera switch / screen start-stop / turn on).
  const applyVideoTrack = (newTrack) => {
    const stream = streamRef.current;
    if (!stream) return;
    replaceForPeers(cameraTrackRef.current, newTrack);
    const old = cameraTrackRef.current;
    if (old) {
      try { stream.removeTrack(old); } catch (e) { /* ignore */ }
      old.stop();
    }
    stream.addTrack(newTrack);
    cameraTrackRef.current = newTrack;
    refreshLocalPreview();
  };

  const turnCameraOff = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !cameraTrackRef.current) return;
    replaceForPeers(cameraTrackRef.current, null);
    cameraTrackRef.current.stop(); // keep as sender key for restore
    setVideoOn(false);
    refreshLocalPreview();
    emitMedia("video", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID]);

  const muteSelf = useCallback(() => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t && t.enabled) {
      t.enabled = false;
      setMicOn(false);
      emitMedia("audio", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID]);

  // ---- Peers ----
  const trackPeerStream = useCallback((peerID, peer) => {
    peer.on("stream", (remote) =>
      setPeerStreams((prev) => ({ ...prev, [peerID]: remote }))
    );
  }, []);

  const createPeer = useCallback((userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream: stream || undefined });
    peer.on("signal", (signal) =>
      socketRef.current?.emit("sending signal", { userToSignal, callerID, signal })
    );
    return peer;
  }, []);

  const addPeer = useCallback((incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream: stream || undefined });
    peer.on("signal", (signal) =>
      socketRef.current?.emit("returning signal", { signal, callerID })
    );
    peer.signal(incomingSignal);
    return peer;
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: list.filter((d) => d.kind === "videoinput"),
        mics: list.filter((d) => d.kind === "audioinput"),
        speakers: list.filter((d) => d.kind === "audiooutput"),
      });
    } catch (e) {
      /* ignore */
    }
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

      // Lobby
      socket.on("waiting", () => setPhase("waiting"));
      socket.on("admitted", ({ host }) => { setIsHost(!!host); setPhase("live"); });
      socket.on("denied", () => setPhase("denied"));
      socket.on("host changed", () => setIsHost(true));
      socket.on("join request", ({ socketId, user: u }) =>
        setJoinRequests((prev) =>
          prev.some((r) => r.socketId === socketId) ? prev : [...prev, { socketId, user: u }]
        )
      );
      socket.on("request handled", ({ socketId }) =>
        setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId))
      );

      // Host moderation (received by the targeted participant / whole room)
      socket.on("force mute", () => muteSelf());
      socket.on("force camera off", () => turnCameraOff());
      socket.on("chat disabled", ({ disabled }) => setChatDisabledState(!!disabled));

      socket.on("stream ended", () => setPhase("ended"));
      socket.on("error", (e) => setError(e?.message || "Connection error"));

      // Local media
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
        audioTrackRef.current = audioTrack || null;
        cameraTrackRef.current = videoTrack || null;
        if (videoTrack && !initialVideo) videoTrack.stop();
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        loadDevices();
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
      try { recorderRef.current?.stop(); } catch (e) { /* ignore */ }
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

  const turnCameraOn = useCallback(
    async (deviceId) => {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        applyVideoTrack(cam.getVideoTracks()[0]);
        setVideoOn(true);
        emitMedia("video", true);
      } catch (e) {
        setError("Camera unavailable");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [roomID]
  );

  const toggleVideo = useCallback(() => {
    if (!captureMedia || isScreenSharing) return;
    if (videoOn) turnCameraOff();
    else turnCameraOn(selectedDevices.camera);
  }, [captureMedia, isScreenSharing, videoOn, turnCameraOff, turnCameraOn, selectedDevices.camera]);

  const stopScreenShare = useCallback(async () => {
    if (!streamRef.current) return;
    try {
      const cam = await navigator.mediaDevices.getUserMedia({
        video: selectedDevices.camera ? { deviceId: { exact: selectedDevices.camera } } : true,
      });
      applyVideoTrack(cam.getVideoTracks()[0]);
      setIsScreenSharing(false);
      setVideoOn(true);
      emitMedia("video", true);
    } catch (e) {
      setError("Could not restore camera");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID, selectedDevices.camera]);

  const toggleScreenShare = useCallback(async () => {
    if (!captureMedia) return;
    if (isScreenSharing) return stopScreenShare();
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      applyVideoTrack(screenTrack);
      setIsScreenSharing(true);
      setVideoOn(true);
      emitMedia("video", true);
      screenTrack.onended = () => stopScreenShare();
    } catch (e) {
      /* cancelled */
    }
  }, [captureMedia, isScreenSharing, stopScreenShare]);

  // ---- Device selection ----
  const setCamera = useCallback(
    async (deviceId) => {
      setSelectedDevices((d) => ({ ...d, camera: deviceId }));
      if (!videoOn || isScreenSharing) return;
      try {
        const cam = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        applyVideoTrack(cam.getVideoTracks()[0]);
      } catch (e) {
        setError("Could not switch camera");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [videoOn, isScreenSharing]
  );

  const setMicrophone = useCallback(async (deviceId) => {
    setSelectedDevices((d) => ({ ...d, mic: deviceId }));
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newTrack = mic.getAudioTracks()[0];
      replaceForPeers(audioTrackRef.current, newTrack);
      const old = audioTrackRef.current;
      if (old) {
        newTrack.enabled = old.enabled;
        try { stream.removeTrack(old); } catch (e) { /* ignore */ }
        old.stop();
      }
      stream.addTrack(newTrack);
      audioTrackRef.current = newTrack;
    } catch (e) {
      setError("Could not switch microphone");
    }
  }, []);

  const setSpeaker = useCallback((deviceId) => {
    setSelectedDevices((d) => ({ ...d, speaker: deviceId }));
  }, []);

  // ---- Recording (captures the tab/screen incl. all tiles) ----
  const startRecording = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const chunks = [];
      const rec = new MediaRecorder(display);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `connect-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        display.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };
      display.getVideoTracks()[0].onended = () => {
        if (rec.state !== "inactive") rec.stop();
      };
      rec.start();
      recorderRef.current = rec;
      setIsRecording(true);
    } catch (e) {
      /* cancelled */
    }
  }, []);

  const stopRecording = useCallback(() => {
    try { recorderRef.current?.stop(); } catch (e) { /* ignore */ }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // ---- Host moderation ----
  const muteParticipant = useCallback(
    (socketId) => socketRef.current?.emit("force mute", { roomID, socketId }),
    [roomID]
  );
  const cameraOffParticipant = useCallback(
    (socketId) => socketRef.current?.emit("force camera off", { roomID, socketId }),
    [roomID]
  );
  const setChatDisabled = useCallback(
    (disabled) => socketRef.current?.emit("set chat disabled", { roomID, disabled }),
    [roomID]
  );

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
    chatDisabled,
    devices,
    selectedDevices,
    isRecording,
    streamEnded: phase === "ended",
    sendMessage,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    setCamera,
    setMicrophone,
    setSpeaker,
    toggleRecording,
    muteParticipant,
    cameraOffParticipant,
    setChatDisabled,
  };
}
