import React, { useEffect, useRef, useState } from "react";
import { FiSend as SendIcon } from "react-icons/fi";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

/**
 * Live chat. `compact` (Twitch-style) renders inline "name: text"; otherwise
 * avatar + bubbles (meeting style).
 */
const ChatPanel = ({
  messages = [],
  onSend,
  placeholder = "Type a message…",
  compact = false,
  disabled = false,
  disabledNote = "Chat has been disabled by the host",
}) => {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted">No messages yet. Say hello 👋</p>
        )}

        {compact
          ? messages.map((m, i) => (
              <div key={m.id || i} className="text-sm leading-snug">
                <span className="font-semibold text-brand">{m.user?.name || "Guest"}</span>
                <span className="text-muted">: </span>
                <span className="break-words text-ink2">{m.message}</span>
              </div>
            ))
          : messages.map((m, i) => (
              <div
                key={m.id || i}
                className={`flex items-start gap-2 ${m.send ? "flex-row-reverse" : ""}`}
              >
                <img
                  src={m.user?.profilePic || AVATAR_FALLBACK}
                  alt={m.user?.name}
                  className="mt-4 h-7 w-7 shrink-0 rounded-full object-cover"
                />
                <div className={`max-w-[78%] ${m.send ? "text-right" : ""}`}>
                  <p className="mb-1 px-1 text-xs font-medium text-muted">
                    {m.send ? "You" : m.user?.name}
                  </p>
                  <div
                    className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                      m.send
                        ? "rounded-tr-sm bg-brand text-white"
                        : "rounded-tl-sm bg-surface2 text-ink2"
                    }`}
                  >
                    <p className="break-words">{m.message}</p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {disabled ? (
        <div className="mt-2 rounded-full bg-surface2 px-4 py-2.5 text-center text-xs font-medium text-muted">
          {disabledNote}
        </div>
      ) : (
        <form onSubmit={submit} className="pt-2">
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface2 px-2 py-1.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brandHover"
            >
              <SendIcon size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatPanel;
