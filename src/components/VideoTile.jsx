import React, { useEffect, useRef } from "react";
import { IoMicOff as MicOffIcon } from "react-icons/io5";
import { HiOutlineUser as UserIcon } from "react-icons/hi";
import { BsPin as PinIcon, BsPinFill as PinActiveIcon } from "react-icons/bs";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

/**
 * One video cell. Renders from a `stream` prop so it survives re-mounts
 * (pin/swap) without losing video.
 *
 * IMPORTANT: uses a stable ref + a guarded srcObject assignment. A callback ref
 * (or unconditional assignment) re-attaches the stream on every parent render —
 * with the per-second meeting timer that caused the video to reload/flicker
 * once a second. We only touch srcObject when it actually changes.
 */
const VideoTile = ({
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
  sinkId,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (externalVideoRef) externalVideoRef.current = el;
    if (el && stream && el.srcObject !== stream) el.srcObject = stream;
  }, [stream, externalVideoRef]);

  useEffect(() => {
    const el = videoRef.current;
    if (el && sinkId && typeof el.setSinkId === "function") {
      el.setSinkId(sinkId).catch(() => {});
    }
  }, [sinkId]);

  const showVideo = !!stream && videoOn !== false;

  return (
    <div
      className={`group relative h-full w-full overflow-hidden bg-surface2 ${rounded} ${
        active ? "ring-2 ring-brand" : pinned ? "ring-2 ring-brand/60" : ""
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full ${objectContain ? "object-contain" : "object-cover"} ${
          showVideo ? "" : "opacity-0"
        }`}
      />

      {!showVideo && (
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
