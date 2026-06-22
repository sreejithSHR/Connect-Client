import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { PodcastIcon, RefreshCwIcon } from "lucide-react";

import { api } from "../api/client";
import LoginGate from "../components/LoginGate";
import StreamCard from "../components/StreamCard";
import { ROLES } from "../config";

const BrowsePage = () => {
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const { streams: list } = await api.listStreams();
      setStreams(list);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const goLive = () =>
    navigate(`/stream/${uuid()}`, { state: { role: ROLES.HOST, title: "My Live Stream" } });

  return (
    <div className="min-h-full px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Live now</h1>
            <p className="text-sm text-muted">Streams happening right now on Connect</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted shadow-card hover:text-ink"
              title="Refresh"
            >
              <RefreshCwIcon size={18} />
            </button>
            <button
              onClick={goLive}
              className="flex items-center gap-2 rounded-full bg-stream px-4 py-2.5 text-sm font-semibold text-white hover:bg-streamHover"
            >
              <PodcastIcon size={18} /> Go Live
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-live shadow-card">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-2xl bg-surface2" />
                <div className="mt-3 h-4 w-3/4 rounded bg-surface2" />
                <div className="mt-2 h-3 w-1/2 rounded bg-surface2" />
              </div>
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-line bg-surface py-20 text-center shadow-card">
            <div className="text-5xl opacity-60">📺</div>
            <h2 className="text-lg font-semibold text-ink">No one is live right now</h2>
            <p className="text-sm text-muted">Be the first — start your own stream.</p>
            <button
              onClick={goLive}
              className="mt-2 flex items-center gap-2 rounded-full bg-stream px-4 py-2.5 text-sm font-semibold text-white hover:bg-streamHover"
            >
              <PodcastIcon size={18} /> Go Live
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {streams.map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Browse = () => (
  <LoginGate message="Sign in to browse live streams">
    <BrowsePage />
  </LoginGate>
);

export default Browse;
