import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdOutlineContentCopy as CopyIcon } from "react-icons/md";
import { FiClock as ClockIcon } from "react-icons/fi";
import { IoArrowBack as BackIcon } from "react-icons/io5";
import { HiOutlineUserAdd as InviteIcon } from "react-icons/hi";

import { MODES, ROLES } from "../config";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { useAuth } from "../context/AuthContext";

import Loading from "../components/Loading";
import LoginGate from "../components/LoginGate";
import VideoTile from "../components/VideoTile";
import ControlBar from "../components/ControlBar";
import ChatPanel from "../components/ChatPanel";
import ParticipantsPanel from "../components/ParticipantsPanel";
import ShareModal from "../components/ShareModal";
import ScreenShareButton from "../components/ScreenShareButton";

const fmtDuration = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

const MeetRoom = () => {
  const { roomID } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    loading,
    localStream,
    localVideoRef,
    peers,
    peersRef,
    messages,
    participants,
    micOn,
    videoOn,
    sendMessage,
    toggleAudio,
    toggleVideo,
  } = useRoomConnection({ roomID, mode: MODES.MEET, role: ROLES.PARTICIPANT });

  const [tab, setTab] = useState("participants"); // "participants" | "chat"
  const [share, setShare] = useState(false);
  const [activeId, setActiveId] = useState("local");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const selfUser = useMemo(
    () => ({ name: user?.displayName, photoURL: user?.photoURL }),
    [user]
  );

  // All renderable video tiles (self + connected peers).
  const tiles = useMemo(() => {
    const local = {
      id: "local",
      isLocal: true,
      stream: localStream,
      user: selfUser,
      micOn,
    };
    const remote = peers.map((p) => ({
      id: p.peerID,
      peer: p.peer,
      user: p.user,
      micOn: p.micOn !== false,
    }));
    return [local, ...remote];
  }, [localStream, selfUser, micOn, peers]);

  const active = tiles.find((t) => t.id === activeId) || tiles[0];
  const thumbs = tiles.filter((t) => t.id !== active.id);

  // Merge presence list with live mic/cam state for the panel.
  const enriched = useMemo(() => {
    const byId = Object.fromEntries(peers.map((p) => [p.peerID, p]));
    return participants.map((p) => {
      if (p.user?.uid === user?.uid) return { ...p, micOn, videoOn };
      const pe = byId[p.socketId];
      return { ...p, micOn: pe ? pe.micOn !== false : true, videoOn: true };
    });
  }, [participants, peers, user, micOn, videoOn]);

  const leave = () => {
    navigate("/");
    window.location.reload();
  };

  if (loading) return <Loading />;

  const code = roomID?.slice(0, 8);

  return (
    <div className="flex h-full gap-3 p-3">
      {/* Stage */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
          <button
            onClick={leave}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-ink"
          >
            <BackIcon />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-ink">Meeting</h1>
            <p className="text-xs text-muted">
              {new Date().toLocaleString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-live/10 px-3 py-1.5 text-xs font-semibold text-live">
              <span className="h-2 w-2 animate-pulseLive rounded-full bg-live" />
              Live
            </span>
          </div>
        </div>

        {/* Thumbnail strip */}
        {thumbs.length > 0 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {thumbs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className="aspect-video w-44 shrink-0"
              >
                <VideoTile
                  peer={t.peer}
                  stream={t.stream}
                  isLocal={t.isLocal}
                  muted={t.isLocal}
                  user={t.user}
                  micOn={t.micOn}
                />
              </button>
            ))}
          </div>
        )}

        {/* Active speaker + floating controls */}
        <div className="relative min-h-0 flex-1">
          <VideoTile
            key={active.id}
            peer={active.peer}
            stream={active.stream}
            isLocal={active.isLocal}
            muted={active.isLocal}
            user={active.user}
            micOn={active.micOn}
            externalVideoRef={active.isLocal ? localVideoRef : undefined}
            rounded="rounded-3xl"
            active
          />

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm font-medium text-ink2 shadow-float sm:flex">
              <ClockIcon className="text-muted" /> {fmtDuration(elapsed)}
            </span>

            <ControlBar
              micOn={micOn}
              videoOn={videoOn}
              onToggleMic={toggleAudio}
              onToggleVideo={toggleVideo}
              onEnd={leave}
              extra={
                <ScreenShareButton
                  peersRef={peersRef}
                  localVideo={localVideoRef}
                  onScreenShareEnd={() => {}}
                />
              }
            />

            <button
              onClick={() => setShare(true)}
              className="hidden items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm font-medium text-ink2 shadow-float hover:text-ink sm:flex"
            >
              <CopyIcon className="text-muted" /> {code}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside className="hidden w-80 shrink-0 flex-col rounded-2xl bg-surface p-4 shadow-card lg:flex">
        <div className="mb-4 flex rounded-full bg-surface2 p-1">
          <button
            onClick={() => setTab("participants")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === "participants" ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            Participants ({participants.length})
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === "chat" ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            Chat
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {tab === "participants" ? (
            <ParticipantsPanel participants={enriched} meId={user?.uid} />
          ) : (
            <ChatPanel messages={messages} onSend={sendMessage} />
          )}
        </div>

        {tab === "participants" && (
          <button
            onClick={() => setShare(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brandHover"
          >
            <InviteIcon size={18} /> Invite people
          </button>
        )}
      </aside>

      <ShareModal
        open={share}
        onClose={() => setShare(false)}
        url={window.location.href}
        label="Share this link to invite people to the meeting"
      />
    </div>
  );
};

const Room = () => (
  <LoginGate message="Sign in to join the meeting">
    <MeetRoom />
  </LoginGate>
);

export default Room;
