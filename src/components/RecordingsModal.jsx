import React from "react";
import Modal from "./Modal";

const RecordingsModal = ({ open, onClose, recordings = [] }) => {
  const download = (rec) => {
    const a = document.createElement("a");
    a.href = rec.url;
    a.download = `connect-recording-${rec.id}.webm`;
    a.click();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Recordings (${recordings.length})`}>
      {recordings.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No recordings yet. Press the record button to capture the meeting.
        </p>
      ) : (
        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          {recordings.map((rec) => (
            <div key={rec.id} className="rounded-2xl border border-line p-3">
              <video src={rec.url} controls className="mb-2 w-full rounded-xl bg-black" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {new Date(rec.ts).toLocaleString()}
                </span>
                <button
                  onClick={() => download(rec)}
                  className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brandHover"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">
        Recordings are kept for this session only — download to save them.
      </p>
    </Modal>
  );
};

export default RecordingsModal;
