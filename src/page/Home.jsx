import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { VideoIcon, PlusCircleIcon, PodcastIcon, CompassIcon } from "lucide-react";

import Calendar from "../components/Calendar";
import Modal from "../components/Modal";
import { ROLES, STREAM_CATEGORIES } from "../config";
import { useAuth } from "../context/AuthContext";

const ActionCard = ({ icon, title, desc, accent, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-1 hover:border-brand/40"
  >
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-sm text-muted">{desc}</p>
    </div>
  </button>
);

export default function Home() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [date, setDate] = useState(new Date());

  const [joinOpen, setJoinOpen] = useState(false);
  const [streamOpen, setStreamOpen] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");
  const [streamTitle, setStreamTitle] = useState("My Live Stream");
  const [streamCategory, setStreamCategory] = useState(STREAM_CATEGORIES[0]);

  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const requireAuth = (fn) => () => (user ? fn() : login());

  const newMeeting = () => navigate(`/room/${uuid()}`);
  const joinMeeting = () => {
    const code = meetingCode.trim();
    if (code) navigate(`/room/${code}`);
  };
  const goLive = () =>
    navigate(`/stream/${uuid()}`, {
      state: { role: ROLES.HOST, title: streamTitle, category: streamCategory },
    });

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-6 py-10 md:px-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Welcome to <span className="text-brand">Connect</span>
            </h1>
            <p className="mt-2 text-muted">Meet like Zoom, stream like Twitch — all in one place.</p>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
            <p className="text-6xl font-bold tabular-nums text-ink md:text-7xl">{time}</p>
            <p className="mt-2 text-muted">{dateStr}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ActionCard
              icon={<VideoIcon />}
              title="New Meeting"
              desc="Start an instant meeting"
              accent="bg-meet"
              onClick={requireAuth(newMeeting)}
            />
            <ActionCard
              icon={<PlusCircleIcon />}
              title="Join Meeting"
              desc="Enter with a code"
              accent="bg-ink"
              onClick={requireAuth(() => setJoinOpen(true))}
            />
            <ActionCard
              icon={<PodcastIcon />}
              title="Go Live"
              desc="Start a live stream"
              accent="bg-stream"
              onClick={requireAuth(() => setStreamOpen(true))}
            />
            <ActionCard
              icon={<CompassIcon />}
              title="Browse"
              desc="Watch live streams"
              accent="bg-success"
              onClick={() => navigate("/browse")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Calendar />
          <p className="text-sm text-muted">
            Created by{" "}
            <a
              className="text-brand underline"
              href="https://envidoxsolutions.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Envidox Solutions
            </a>
          </p>
        </div>
      </div>

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join a meeting"
        footer={
          <>
            <button
              onClick={() => setJoinOpen(false)}
              className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={joinMeeting}
              className="rounded-full bg-meet px-5 py-2 text-sm font-semibold text-white hover:bg-meetHover"
            >
              Join
            </button>
          </>
        }
      >
        <label className="mb-1 block text-sm text-muted">Meeting code or link</label>
        <input
          value={meetingCode}
          onChange={(e) => setMeetingCode(e.target.value)}
          placeholder="e.g. 3f9a1c2b…"
          className="w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-ink outline-none focus:ring-2 focus:ring-meet"
        />
      </Modal>

      <Modal
        open={streamOpen}
        onClose={() => setStreamOpen(false)}
        title="Start a live stream"
        footer={
          <>
            <button
              onClick={() => setStreamOpen(false)}
              className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={goLive}
              className="rounded-full bg-stream px-5 py-2 text-sm font-semibold text-white hover:bg-streamHover"
            >
              Go Live
            </button>
          </>
        }
      >
        <label className="mb-1 block text-sm text-muted">Stream title</label>
        <input
          value={streamTitle}
          onChange={(e) => setStreamTitle(e.target.value)}
          className="mb-4 w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-ink outline-none focus:ring-2 focus:ring-stream"
        />
        <label className="mb-1 block text-sm text-muted">Category</label>
        <select
          value={streamCategory}
          onChange={(e) => setStreamCategory(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-ink outline-none focus:ring-2 focus:ring-stream"
        >
          {STREAM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Modal>
    </div>
  );
}
