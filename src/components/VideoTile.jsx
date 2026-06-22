import React, { useEffect, useRef, useState } from "react";
import { IoMicOff as MicOffIcon } from "react-icons/io5";
import { HiOutlineUser as UserIcon } from "react-icons/hi";
import { BsPin as PinIcon, BsPinFill as PinActiveIcon } from "react-icons/bs";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

/**
 * One video cell. Accepts either a local MediaStream (`stream` + `isLocal`) or a
 * simple-peer `peer` whose remote stream it attaches on the "stream" event.
 */
const VideoTile = ({
  peer,
  stream,
  user,
  isLocal = false,
  muted = false,
  micOn = true,
  videoOn = true,
  pinned = false,
  onTogglePin,
  objectContain = false,
  active = false,
  rounded = "rounded-2xl",
  externalVideoRef,
}) => {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(videoOn);

  const setVideoNode = (node) => {
    videoRef.current = node;
    if (externalVideoRef) externalVideoRef.current = node;
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      const track = stream.getVideoTracks()[0];
      setHasVideo(track ? track.enabled : false);
    }
  }, [stream]);

  useEffect(() => {
    if (!peer) return undefined;
    const onStream = (remote) => {
      if (videoRef.current) videoRef.current.srcObject = remote;
      const track = remote.getVideoTracks()[0];
      setHasVideo(track ? track.enabled : true);
    };
    peer.on("stream", onStream);
    return () => peer.off?.("stream", onStream);
  }, [peer]);

  useEffect(() => {
    if (isLocal) setHasVideo(videoOn);
  }, [videoOn, isLocal]);

  return (
    <div
      className={`group relative h-full w-full overflow-hidden bg-surface2 ${rounded} ${
        active ? "ring-2 ring-brand" : pinned ? "ring-2 ring-brand/60" : ""
      }`}
    >
      <video
        ref={setVideoNode}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full ${objectContain ? "object-contain" : "object-cover"} ${
          hasVideo ? "" : "opacity-0"
        }`}
      />

      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface2">
          <img
            src={user?.photoURL || user?.profilePic || AVATAR_FALLBACK}
            alt={user?.name || "Participant"}
            className="aspect-square h-[38%] max-h-[110px] rounded-full object-cover"
          />
        </div>
      )}

      {onTogglePin && (
        <button
          onClick={onTogglePin}
          className={`absolute right-3 top-3 rounded-full p-2 text-sm text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 ${
            pinned ? "bg-brand" : "bg-black/40"
          }`}
        >
          {pinned ? <PinActiveIcon /> : <PinIcon />}
        </button>
      )}

      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/55 py-1 pl-1.5 pr-2.5 backdrop-blur">
        <UserIcon className="text-white/80" size={13} />
        <span className="text-xs font-medium text-white">
          {user?.name || (isLocal ? "You" : "Guest")}
        </span>
      </div>

      {!micOn && (
        <div className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-live text-white">
          <MicOffIcon size={14} />
        </div>
      )}
    </div>
  );
};

export default VideoTile;
