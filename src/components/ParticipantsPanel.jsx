import React from "react";
import { IoMic as MicOnIcon, IoMicOff as MicOffIcon } from "react-icons/io5";
import { IoVideocam as CamOnIcon, IoVideocamOff as CamOffIcon } from "react-icons/io5";
import { ROLES } from "../config";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

const handleOf = (user) =>
  user?.email ? `@${user.email.split("@")[0]}` : `@${(user?.name || "guest").toLowerCase().replace(/\s+/g, "")}`;

const StatusIcon = ({ on, OnIcon, OffIcon }) => (
  <span
    className={`flex h-7 w-7 items-center justify-center rounded-full ${
      on ? "bg-surface2 text-ink2" : "bg-live/10 text-live"
    }`}
  >
    {on ? <OnIcon size={14} /> : <OffIcon size={14} />}
  </span>
);

// participants: { socketId, user, role, micOn?, videoOn? }
const ParticipantsPanel = ({ participants = [], meId }) => {
  return (
    <div className="space-y-1 overflow-y-auto">
      {participants.map((p) => {
        const isYou = meId && p.user?.uid === meId;
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
            <div className="flex items-center gap-1.5">
              <StatusIcon on={p.micOn !== false} OnIcon={MicOnIcon} OffIcon={MicOffIcon} />
              <StatusIcon on={p.videoOn !== false} OnIcon={CamOnIcon} OffIcon={CamOffIcon} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantsPanel;
