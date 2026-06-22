/* eslint-disable react-hooks/exhaustive-deps */
// This hook deliberately manages its own effect/callback dependencies (refs +
// imperative WebRTC track swaps); the exhaustive-deps rule produces false
// positives here, so it is disabled for the file.
import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";

import { SOCKET_URL, MODES, ROLES } from "../config";
import { getIdToken } from "../api/token";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { startMeetingRecording } from "../lib/meetingRecorder";

import joinSFX from "../sounds/join.mp3";
import leaveSFX from "../sounds/leave.mp3";
import msgSFX from "../sounds/message.mp3";

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
  const [screenStream, setScreenStream] = useState(null);
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
  const streamRef = useRef(null); // local camera+mic stream
  const localVideoRef = useRef(null);
  const cameraTrackRef = useRef(null); // live camera track
  const registeredKeyRef = useRef(null); // current sender-map key track
  const screenTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const isScreenSharingRef = useRef(false);
  const cameraWasOnRef = useRef(true);
  const peerStreamsRef = useRef({});
  const recorderRef = useRef(null);

  useEffect(() => { peerStreamsRef.current = peerStreams; }, [peerStreams]);

  // Swap the track sent to all peers (camera <-> screen <-> null).
  const replaceSent = (newTrack) => {
    if (!registeredKeyRef.current && !newTrack) return;
    peersRef.current.forEach(({ peer }) => {
      try {
        peer.replaceTrack(registeredKeyRef.current, newTrack, streamRef.current);
      } catch (e) {
        /* receive-only peer / no such sender */
      }
    });
    if (newTrack) registeredKeyRef.current = newTrack;
  };

  const emitMedia = (kind, enabled) =>
    socketRef.current?.emit("media state", { roomID, kind, enabled });

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

  const turnCameraOff = useCallback(() => {
    if (!cameraTrackRef.current) return;
    replaceSent(null);
    cameraTrackRef.current.stop();
    try { streamRef.current?.removeTrack(cameraTrackRef.current); } catch (e) { /* ignore */ }
    setVideoOn(false);
    emitMedia("video", false);
  }, [roomID]);

  const muteSelf = useCallback(() => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t && t.enabled) {
      t.enabled = false;
      setMicOn(false);
      emitMedia("audio", false);
    }
  }, [roomID]);

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
      socket.on("force mute", () => muteSelf());
      socket.on("force camera off", () => turnCameraOff());
      socket.on("chat disabled", ({ disabled }) => setChatDisabledState(!!disabled));
      socket.on("stream ended", () => setPhase("ended"));
      socket.on("error", (e) => setError(e?.message || "Connection error"));

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
        registeredKeyRef.current = videoTrack || null;
        if (videoTrack && !initialVideo) {
          videoTrack.stop();
          try { stream.removeTrack(videoTrack); } catch (e) { /* ignore */ }
        }
        setLocalStream(stream);
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
          peerID: payload.callerID, peer, user: payload.user, role: payload.role, micOn: true, videoOn: true,
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
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
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
  }, [roomID]);

  const turnCameraOn = useCallback(async (deviceId) => {
    try {
      const cam = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      const newTrack = cam.getVideoTracks()[0];
      replaceSent(newTrack);
      const stream = streamRef.current;
      stream.getVideoTracks().forEach((t) => {
        try { stream.removeTrack(t); } catch (e) { /* ignore */ }
      });
      stream.addTrack(newTrack);
      cameraTrackRef.current = newTrack;
      setVideoOn(true);
      emitMedia("video", true);
    } catch (e) {
      setError("Camera unavailable");
    }
  }, [roomID]);

  const toggleVideo = useCallback(() => {
    if (!captureMedia || isScreenSharing) return;
    if (videoOn) turnCameraOff();
    else turnCameraOn(selectedDevices.camera);
  }, [captureMedia, isScreenSharing, videoOn, turnCameraOff, turnCameraOn, selectedDevices.camera]);

  const stopScreenShare = useCallback(() => {
    const restore =
      cameraWasOnRef.current &&
      cameraTrackRef.current &&
      cameraTrackRef.current.readyState === "live"
        ? cameraTrackRef.current
        : null;
    replaceSent(restore);
    try { screenTrackRef.current?.stop(); } catch (e) { /* ignore */ }
    screenTrackRef.current = null;
    screenStreamRef.current = null;
    setScreenStream(null);
    isScreenSharingRef.current = false;
    setIsScreenSharing(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!captureMedia) return;
    if (isScreenSharing) return stopScreenShare();
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      cameraWasOnRef.current = videoOn;
      replaceSent(screenTrack); // peers see the screen; camera stays alive for PiP
      screenTrackRef.current = screenTrack;
      screenStreamRef.current = display;
      setScreenStream(display);
      isScreenSharingRef.current = true;
      setIsScreenSharing(true);
      screenTrack.onended = () => stopScreenShare();
    } catch (e) {
      /* cancelled */
    }
  }, [captureMedia, isScreenSharing, videoOn, stopScreenShare]);

  const setCamera = useCallback(async (deviceId) => {
    setSelectedDevices((d) => ({ ...d, camera: deviceId }));
    if (!videoOn || isScreenSharing) return;
    await turnCameraOn(deviceId);
  }, [videoOn, isScreenSharing, turnCameraOn]);

  const setMicrophone = useCallback(async (deviceId) => {
    setSelectedDevices((d) => ({ ...d, mic: deviceId }));
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
      const newTrack = mic.getAudioTracks()[0];
      const old = stream.getAudioTracks()[0];
      peersRef.current.forEach(({ peer }) => {
        try { peer.replaceTrack(old, newTrack, stream); } catch (e) { /* ignore */ }
      });
      if (old) { newTrack.enabled = old.enabled; try { stream.removeTrack(old); } catch (e) {} old.stop(); }
      stream.addTrack(newTrack);
    } catch (e) {
      setError("Could not switch microphone");
    }
  }, []);

  const setSpeaker = useCallback((deviceId) => {
    setSelectedDevices((d) => ({ ...d, speaker: deviceId }));
  }, []);

  // ---- Recording: whole meeting via canvas compositor (no screen prompt) ----
  const getRecordingStreams = useCallback(() => {
    const out = [];
    if (isScreenSharingRef.current && screenStreamRef.current) {
      out.push({ id: "screen", stream: screenStreamRef.current });
    }
    if (streamRef.current) out.push({ id: "local", stream: streamRef.current });
    Object.entries(peerStreamsRef.current).forEach(([id, s]) => out.push({ id, stream: s }));
    return out;
  }, []);

  const toggleRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    recorderRef.current = startMeetingRecording(getRecordingStreams, () => {
      recorderRef.current = null;
      setIsRecording(false);
    });
    setIsRecording(true);
  }, [getRecordingStreams]);

  // ---- Host moderation ----
  const muteParticipant = useCallback((socketId) => socketRef.current?.emit("force mute", { roomID, socketId }), [roomID]);
  const cameraOffParticipant = useCallback((socketId) => socketRef.current?.emit("force camera off", { roomID, socketId }), [roomID]);
  const setChatDisabled = useCallback((disabled) => socketRef.current?.emit("set chat disabled", { roomID, disabled }), [roomID]);
  const admit = useCallback((socketId) => socketRef.current?.emit("admit", { roomID, socketId }), [roomID]);
  const deny = useCallback((socketId) => socketRef.current?.emit("deny", { roomID, socketId }), [roomID]);

  return {
    phase, isHost, joinRequests, admit, deny,
    loading, error,
    localStream, screenStream, localVideoRef,
    peers, peerStreams, peersRef,
    messages, participants, viewerCount,
    micOn, videoOn, isScreenSharing, chatDisabled,
    devices, selectedDevices, isRecording,
    streamEnded: phase === "ended",
    sendMessage, toggleAudio, toggleVideo, toggleScreenShare,
    setCamera, setMicrophone, setSpeaker, toggleRecording,
    muteParticipant, cameraOffParticipant, setChatDisabled,
  };
}
