import React from "react";
import { Link } from "react-router-dom";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

// One live stream in the Browse directory.
const StreamCard = ({ stream }) => {
  return (
    <Link
      to={`/stream/${stream.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-video bg-gradient-to-br from-surface2 to-surface3">
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-live px-2 py-0.5 text-[11px] font-bold uppercase text-white">
          <span className="h-1.5 w-1.5 animate-pulseLive rounded-full bg-white" />
          Live
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
          {stream.viewers ?? 0} watching
        </div>
        <div className="flex h-full items-center justify-center text-5xl opacity-30 transition-opacity group-hover:opacity-50">
          🔴
        </div>
      </div>
      <div className="flex gap-3 p-3">
        <img
          src={stream.host?.photoURL || AVATAR_FALLBACK}
          alt={stream.host?.name}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink group-hover:text-brand">
            {stream.title}
          </h3>
          <p className="truncate text-xs text-muted">{stream.host?.name || "Streamer"}</p>
          <p className="truncate text-xs font-medium text-stream">{stream.category}</p>
        </div>
      </div>
    </Link>
  );
};

export default StreamCard;
