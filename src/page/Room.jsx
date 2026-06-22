import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoArrowBack as BackIcon } from "react-icons/io5";
import { HiOutlineUserAdd as InviteIcon } from "react-icons/hi";
import { MdCheck as AdmitIcon, MdClose as DenyIcon } from "react-icons/md";
import { FiLogOut as LeaveIcon } from "react-icons/fi";

import { MODES, ROLES } from "../config";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { useAuth } from "../context/AuthContext";

import Loading from "../components/Loading";
import LoginGate from "../components/LoginGate";
import PreJoin from "../components/PreJoin";
import VideoTile from "../components/VideoTile";
import ControlBar from "../components/ControlBar";
import ChatPanel from "../components/ChatPanel";
import ParticipantsPanel from "../components/ParticipantsPanel";
import ShareModal from "../components/ShareModal";
import SettingsModal from "../components/SettingsModal";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";
const MAX_THUMBS = 5;

const CenterCard = ({ children }) => (
  <div className="flex h-full items-center justify-center bg-bg p-4">
    <div className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-card">{children}</div>
  </div>
);

const MeetSession = ({ roomID, prefs }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const conn = useRoomConnection({
    roomID,
    mode: MODES.MEET,
    role: ROLES.PARTICIPANT,
    initialAudio: prefs.audio,
    initialVideo: prefs.video,
  });

  const {
    phase, isHost, joinRequests, admit, deny,
    loading, localStream, screenStream, peers, peerStreams,
    messages, participants, micOn, videoOn, isScreenSharing, chatDisabled,
    devices, selectedDevices, isRecording,
    sendMessage, toggleAudio, toggleVideo, toggleScreenShare,
    setCamera, setMicrophone, setSpeaker, toggleRecording,
    muteParticipant, cameraOffParticipant, setChatDisabled,
  } = conn;

  const [tab, setTab] = useState("participants");
  const [share, setShare] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState("local");

  const leave = () => { navigate("/"); window.location.reload(); };

  const tiles = useMemo(() => {
    const local = {
      id: "local",
      isLocal: true,
      stream: isScreenSharing ? screenStream : localStream,
      user: { name: user?.displayName, photoURL: user?.photoURL },
      micOn,
      videoOn: isScreenSharing ? true : videoOn,
    };
    const remote = peers.map((p) => ({
      id: p.peerID,
      stream: peerStreams[p.peerID],
      user: p.user,
      micOn: p.micOn !== false,
      videoOn: p.videoOn !== false,
    }));
    return [local, ...remote];
  }, [localStream, screenStream, isScreenSharing, user, micOn, videoOn, peers, peerStreams]);

  const active = tiles.find((t) => t.id === activeId) || tiles[0];
  const thumbs = tiles.filter((t) => t.id !== active.id);
  const shownThumbs = thumbs.slice(0, MAX_THUMBS);
  const extraThumbs = thumbs.length - shownThumbs.length;

  const enriched = useMemo(() => {
    const byId = Object.fromEntries(peers.map((p) => [p.peerID, p]));
    return participants.map((p) => {
      if (p.user?.uid === user?.uid) return { ...p, micOn, videoOn };
      const pe = byId[p.socketId];
      return { ...p, micOn: pe ? pe.micOn !== false : true, videoOn: pe ? pe.videoOn !== false : true };
    });
  }, [participants, peers, user, micOn, videoOn]);

  if (loading) return <Loading />;

  if (phase === "waiting") {
    return (
      <CenterCard>
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <h2 className="text-lg font-semibold text-ink">Waiting for the host to let you in…</h2>
        <p className="mt-1 text-sm text-muted">You'll join automatically once admitted.</p>
        <button onClick={leave} className="mt-6 text-sm font-medium text-muted hover:text-ink">Cancel</button>
      </CenterCard>
    );
  }
  if (phase === "denied") {
    return (
      <CenterCard>
        <div className="mb-3 text-4xl">🚫</div>
        <h2 className="text-lg font-semibold text-ink">The host declined your request</h2>
        <button onClick={() => navigate("/")} className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover">Back to home</button>
      </CenterCard>
    );
  }

  return (
    <div className="flex h-full gap-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
          <button onClick={leave} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-ink">
            <BackIcon />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-ink">
              Meeting {isHost && <span className="text-xs font-normal text-brand">· You're host</span>}
            </h1>
            <p className="text-xs text-muted">{participants.length} Participant{participants.length === 1 ? "" : "s"}</p>
          </div>
          <button
            onClick={leave}
            className="ml-auto flex items-center gap-2 rounded-full bg-live/10 px-4 py-2 text-sm font-semibold text-live transition-colors hover:bg-live/20"
          >
            <LeaveIcon size={16} /> Leave Meeting
          </button>
        </div>

        {/* Speaker */}
        <div className="relative min-h-0 flex-1">
          <VideoTile
            key={active.id}
            stream={active.stream}
            isLocal={active.isLocal}
            muted={active.isLocal}
            user={active.user}
            micOn={active.micOn}
            videoOn={active.videoOn}
            sinkId={selectedDevices.speaker}
            rounded="rounded-3xl"
            active
          />

          {/* Presenter's camera, minimised to the corner while sharing screen */}
          {active.isLocal && isScreenSharing && videoOn && localStream && (
            <div className="absolute right-4 top-4 h-28 w-44 overflow-hidden rounded-2xl border-2 border-white/30 shadow-float">
              <VideoTile
                stream={localStream}
                isLocal
                muted
                user={{ name: user?.displayName, photoURL: user?.photoURL }}
                micOn={micOn}
                videoOn={videoOn}
              />
            </div>
          )}

          {isRecording && (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <span className="h-2 w-2 animate-pulseLive rounded-full bg-live" /> Recording
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <ControlBar
              micOn={micOn}
              videoOn={videoOn}
              onToggleMic={toggleAudio}
              onToggleVideo={toggleVideo}
              showScreenShare
              isScreenSharing={isScreenSharing}
              onToggleScreenShare={toggleScreenShare}
              showRecord
              isRecording={isRecording}
              onToggleRecord={toggleRecording}
              onSettings={() => setSettingsOpen(true)}
              onEnd={leave}
            />
          </div>
        </div>

        {/* Filmstrip */}
        {thumbs.length > 0 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {shownThumbs.map((t) => (
              <button key={t.id} onClick={() => setActiveId(t.id)} className="aspect-video w-40 shrink-0">
                <VideoTile
                  stream={t.stream}
                  isLocal={t.isLocal}
                  muted={t.isLocal}
                  user={t.user}
                  micOn={t.micOn}
                  videoOn={t.videoOn}
                  sinkId={selectedDevices.speaker}
                />
              </button>
            ))}
            {extraThumbs > 0 && (
              <div className="flex aspect-video w-40 shrink-0 items-center justify-center rounded-2xl bg-ink text-lg font-bold text-white">
                +{extraThumbs}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right column */}
      <aside className="hidden w-80 shrink-0 flex-col gap-3 lg:flex">
        {isHost && joinRequests.length > 0 && (
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-ink">Request to join ({joinRequests.length})</h3>
            <div className="space-y-2">
              {joinRequests.map((r) => (
                <div key={r.socketId} className="flex items-center gap-2">
                  <img src={r.user?.photoURL || AVATAR_FALLBACK} alt={r.user?.name} className="h-8 w-8 rounded-full object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.user?.name}</span>
                  <button onClick={() => deny(r.socketId)} className="flex h-8 w-8 items-center justify-center rounded-full bg-live/10 text-live hover:bg-live/20">
                    <DenyIcon />
                  </button>
                  <button onClick={() => admit(r.socketId)} className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success hover:bg-success/25">
                    <AdmitIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-surface p-4 shadow-card">
          <div className="mb-4 flex rounded-full bg-surface2 p-1">
            <button onClick={() => setTab("participants")} className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${tab === "participants" ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              Participants ({participants.length})
            </button>
            <button onClick={() => setTab("chat")} className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${tab === "chat" ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              Chat
            </button>
          </div>

          {tab === "chat" && isHost && (
            <button
              onClick={() => setChatDisabled(!chatDisabled)}
              className={`mb-3 w-full rounded-full py-2 text-xs font-semibold transition-colors ${
                chatDisabled ? "bg-success/15 text-success" : "bg-live/10 text-live"
              }`}
            >
              {chatDisabled ? "Enable chat for everyone" : "Disable chat for everyone"}
            </button>
          )}

          <div className="min-h-0 flex-1">
            {tab === "participants" ? (
              <ParticipantsPanel
                participants={enriched}
                meId={user?.uid}
                isHost={isHost}
                onMute={muteParticipant}
                onCameraOff={cameraOffParticipant}
              />
            ) : (
              <ChatPanel
                messages={messages}
                onSend={sendMessage}
                disabled={chatDisabled && !isHost}
              />
            )}
          </div>

          {tab === "participants" && (
            <button onClick={() => setShare(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brandHover">
              <InviteIcon size={18} /> Invite people
            </button>
          )}
        </div>
      </aside>

      <ShareModal open={share} onClose={() => setShare(false)} url={window.location.href} label="Share this link to invite people to the meeting" />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        devices={devices}
        selected={selectedDevices}
        onCamera={setCamera}
        onMic={setMicrophone}
        onSpeaker={setSpeaker}
      />
    </div>
  );
};

const MeetRoom = () => {
  const { roomID } = useParams();
  const [prefs, setPrefs] = useState(null);
  if (!prefs) return <PreJoin onJoin={setPrefs} heading="Ready to join the meeting?" />;
  return <MeetSession roomID={roomID} prefs={prefs} />;
};

const Room = () => (
  <LoginGate message="Sign in to join the meeting">
    <MeetRoom />
  </LoginGate>
);

export default Room;
