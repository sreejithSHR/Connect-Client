import React, { useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { AiOutlineLink as LinkIcon } from "react-icons/ai";
import { MdOutlineContentCopy as CopyIcon, MdCheck as CheckIcon } from "react-icons/md";
import { FiShare2 as ShareIcon } from "react-icons/fi";
import Modal from "./Modal";

// Robust copy that also works when the async Clipboard API is blocked.
const copyText = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
};

const CopyRow = ({ label, value }) => {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface2 p-1.5 pl-3 text-sm text-ink2">
        <LinkIcon className="shrink-0 text-muted" />
        <span className="flex-1 truncate">{value}</span>
        <button
          onClick={doCopy}
          className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brandHover"
        >
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

const ShareModal = ({ open, onClose, url, roomId, label = "Share to invite people" }) => {
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on Connect", url });
      } catch (e) {
        /* user cancelled */
      }
    } else {
      await copyText(url);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share">
      <p className="mb-4 text-sm text-muted">{label}</p>

      {roomId && <CopyRow label="Room ID" value={roomId} />}
      <CopyRow label="Invite link" value={url} />

      <button
        onClick={nativeShare}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-surface2 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface3"
      >
        <ShareIcon size={16} /> Share via…
      </button>

      <div className="flex justify-center rounded-2xl bg-white p-4">
        <QRCode value={url} size={168} qrStyle="dots" eyeRadius={8} />
      </div>
    </Modal>
  );
};

export default ShareModal;
