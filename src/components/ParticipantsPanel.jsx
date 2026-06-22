import React from "react";
import { IoMic as MicOnIcon, IoMicOff as MicOffIcon } from "react-icons/io5";
import { IoVideocam as CamOnIcon, IoVideocamOff as CamOffIcon } from "react-icons/io5";
import { ROLES } from "../config";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

const handleOf = (user) =>
  user?.email
    ? `@${user.email.split("@")[0]}`
    : `@${(user?.name || "guest").toLowerCase().replace(/\s+/g, "")}`;

// participants: { socketId, user, role, micOn?, videoOn? }
const ParticipantsPanel = ({ participants = [], meId, isHost, onMute, onCameraOff }) => {
  return (
    <div className="space-y-1 overflow-y-auto">
      {participants.map((p) => {
        const isYou = meId && p.user?.uid === meId;
        const canModerate = isHost && !isYou;
        return (
          <div
            key={p.socketId}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-surface2"
          >
            <img
              src={p.user?.photoURL || AVATAR_FALLBACK}
              alt={p.user?.name}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {p.user?.name || "Guest"}
                {isYou && <span className="ml-1 text-xs font-normal text-muted">(You)</span>}
              </p>
              <p className="truncate text-xs text-muted">{handleOf(p.user)}</p>
            </div>
            {p.role === ROLES.HOST && (
              <span className="rounded-full bg-brandSoft px-2 py-0.5 text-[10px] font-semibold uppercase text-brand">
                Host
              </span>
            )}

            {canModerate ? (
              <div className="flex items-center gap-1.5">
                <button
                  title={p.micOn !== false ? "Mute participant" : "Muted"}
                  onClick={() => p.micOn !== false && onMute?.(p.socketId)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    p.micOn !== false
                      ? "bg-surface2 text-ink2 hover:bg-live/10 hover:text-live"
                      : "bg-live/10 text-live"
                  }`}
                >
                  {p.micOn !== false ? <MicOnIcon size={14} /> : <MicOffIcon size={14} />}
                </button>
                <button
                  title={p.videoOn !== false ? "Turn off camera" : "Camera off"}
                  onClick={() => p.videoOn !== false && onCameraOff?.(p.socketId)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    p.videoOn !== false
                      ? "bg-surface2 text-ink2 hover:bg-live/10 hover:text-live"
                      : "bg-live/10 text-live"
                  }`}
                >
                  {p.videoOn !== false ? <CamOnIcon size={14} /> : <CamOffIcon size={14} />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    p.micOn !== false ? "bg-surface2 text-ink2" : "bg-live/10 text-live"
                  }`}
                >
                  {p.micOn !== false ? <MicOnIcon size={14} /> : <MicOffIcon size={14} />}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    p.videoOn !== false ? "bg-surface2 text-ink2" : "bg-live/10 text-live"
                  }`}
                >
                  {p.videoOn !== false ? <CamOnIcon size={14} /> : <CamOffIcon size={14} />}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantsPanel;
