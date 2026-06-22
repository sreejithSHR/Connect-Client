import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FiUsers as ViewersIcon } from "react-icons/fi";
import { IoArrowBack as BackIcon } from "react-icons/io5";

import { MODES, ROLES, MEDIA_MODES } from "../config";
import { api } from "../api/client";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { useAuth } from "../context/AuthContext";

import Loading from "../components/Loading";
import LoginGate from "../components/LoginGate";
import VideoTile from "../components/VideoTile";
import ChatPanel from "../components/ChatPanel";
import ControlBar from "../components/ControlBar";
import ShareModal from "../components/ShareModal";
import HlsPlayer from "../components/HlsPlayer";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

const StreamPage = () => {
  const { roomID } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHost = location.state?.role === ROLES.HOST;
  const role = isHost ? ROLES.HOST : ROLES.VIEWER;

  const [meta, setMeta] = useState({
    title: location.state?.title || "Live Stream",
    category: location.state?.category || "Just Chatting",
    mediaMode: MEDIA_MODES.INTERACTIVE,
    host: null,
  });
  const [metaReady, setMetaReady] = useState(isHost);
  const [share, setShare] = useState(false);

  useEffect(() => {
    if (!isHost || !user) return;
    api
      .goLive({ roomID, title: location.state?.title, category: location.state?.category })
      .catch(() => {});
  }, [isHost, user, roomID, location.state]);

  useEffect(() => {
    if (isHost || !user) return;
    api
      .getStream(roomID)
      .then(({ stream }) =>
        setMeta({
          title: stream.title,
          category: stream.category,
          mediaMode: stream.mediaMode,
          host: stream.host,
        })
      )
      .catch(() => {})
      .finally(() => setMetaReady(true));
  }, [isHost, user, roomID]);

  const {
    loading,
    localStream,
    localVideoRef,
    peers,
    peerStreams,
    messages,
    viewerCount,
    micOn,
    videoOn,
    isScreenSharing,
    streamEnded,
    sendMessage,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useRoomConnection({ roomID, mode: MODES.STREAM, role });

  const hostPeer = useMemo(
    () => peers.find((p) => p.role === ROLES.HOST) || peers[0],
    [peers]
  );

  const endStream = () => {
    if (isHost) api.endStream(roomID).catch(() => {});
    navigate(isHost ? "/" : "/browse");
    window.location.reload();
  };

  if (loading || !metaReady) return <Loading />;

  if (!isHost && streamEnded) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg text-center">
        <div className="text-5xl">📴</div>
        <h2 className="text-xl font-semibold text-ink">This stream has ended</h2>
        <button
          onClick={() => navigate("/browse")}
          className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brandHover"
        >
          Browse live streams
        </button>
      </div>
    );
  }

  const hostName = (isHost ? user?.displayName : meta.host?.name) || "Streamer";
  const hostPhoto = (isHost ? user?.photoURL : meta.host?.photoURL) || AVATAR_FALLBACK;

  return (
    <div className="flex h-full gap-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
          <button
            onClick={endStream}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-ink"
          >
            <BackIcon />
          </button>
          <img src={hostPhoto} alt={hostName} className="h-9 w-9 rounded-full object-cover" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-ink">{meta.title}</h1>
            <p className="truncate text-xs text-muted">
              {hostName} · {meta.category}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-live px-3 py-1.5 text-xs font-bold uppercase text-white">
              <span className="h-2 w-2 animate-pulseLive rounded-full bg-white" /> Live
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink2">
              <ViewersIcon size={13} /> {viewerCount}
            </span>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-black">
          {isHost ? (
            <VideoTile
              isLocal
              muted
              stream={localStream}
              externalVideoRef={localVideoRef}
              user={{ name: user?.displayName, photoURL: user?.photoURL }}
              micOn={micOn}
              videoOn={videoOn}
              rounded="rounded-3xl"
              objectContain
            />
          ) : meta.mediaMode === MEDIA_MODES.HLS ? (
            <HlsPlayer src={meta.hlsUrl} />
          ) : hostPeer ? (
            <VideoTile
              stream={peerStreams[hostPeer.peerID]}
              user={hostPeer.user}
              rounded="rounded-3xl"
              objectContain
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/70">
              Connecting to stream…
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <ControlBar
              showMedia={isHost}
              micOn={micOn}
              videoOn={videoOn}
              onToggleMic={toggleAudio}
              onToggleVideo={toggleVideo}
              showScreenShare={isHost}
              isScreenSharing={isScreenSharing}
              onToggleScreenShare={toggleScreenShare}
              onEnd={endStream}
            />
          </div>
        </div>
      </div>

      <aside className="hidden w-80 shrink-0 flex-col rounded-2xl bg-surface p-4 shadow-card lg:flex">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Stream Chat</h3>
          <button
            onClick={() => setShare(true)}
            className="rounded-full bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink2 hover:bg-surface3"
          >
            Share
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <ChatPanel messages={messages} onSend={sendMessage} compact />
        </div>
      </aside>

      <ShareModal
        open={share}
        onClose={() => setShare(false)}
        url={window.location.href}
        label="Share your stream"
      />
    </div>
  );
};

const Stream = () => (
  <LoginGate message="Sign in to watch or start a stream">
    <StreamPage />
  </LoginGate>
);

export default Stream;
