import React, { useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { AiOutlineLink as LinkIcon } from "react-icons/ai";
import { MdOutlineContentCopy as CopyIcon, MdCheck as CheckIcon } from "react-icons/md";
import Modal from "./Modal";

const ShareModal = ({ open, onClose, url, label = "Share this link to invite people" }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Share">
      <p className="mb-4 text-sm text-muted">{label}</p>
      <div className="mb-5 flex items-center gap-2 rounded-full border border-line bg-surface2 p-1.5 pl-3 text-sm text-ink2">
        <LinkIcon className="shrink-0 text-muted" />
        <span className="flex-1 truncate">{url}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brandHover"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex justify-center rounded-2xl bg-surface2 p-4">
        <QRCode value={url} size={170} qrStyle="dots" eyeRadius={8} bgColor="#f4f5f8" />
      </div>
    </Modal>
  );
};

export default ShareModal;
