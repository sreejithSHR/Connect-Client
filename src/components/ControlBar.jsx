import React from "react";
import { IoMic as MicOnIcon, IoMicOff as MicOffIcon } from "react-icons/io5";
import { IoVideocam as CamOnIcon, IoVideocamOff as CamOffIcon } from "react-icons/io5";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { MdCallEnd as EndIcon } from "react-icons/md";
import { FiSettings as SettingsIcon } from "react-icons/fi";
import { BsRecordCircle, BsStopCircle } from "react-icons/bs";

export const CtrlCircle = ({ variant = "default", onClick, title, children, size = "h-11 w-11" }) => {
  const styles = {
    default: "bg-surface2 text-ink2 hover:bg-surface3",
    active: "bg-brand text-white hover:bg-brandHover",
    danger: "bg-live text-white hover:bg-liveHover",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex ${size} items-center justify-center rounded-full text-xl transition-colors ${styles[variant]}`}
    >
      {children}
    </button>
  );
};

const ControlBar = ({
  showMedia = true,
  micOn = true,
  videoOn = true,
  onToggleMic,
  onToggleVideo,
  showScreenShare = false,
  isScreenSharing = false,
  onToggleScreenShare,
  showRecord = false,
  isRecording = false,
  onToggleRecord,
  onSettings,
  onEnd,
  extra,
}) => {
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-2 shadow-float">
      {showMedia && (
        <>
          <CtrlCircle variant={micOn ? "active" : "danger"} onClick={onToggleMic} title={micOn ? "Mute" : "Unmute"}>
            {micOn ? <MicOnIcon /> : <MicOffIcon />}
          </CtrlCircle>
          <CtrlCircle variant={videoOn ? "active" : "default"} onClick={onToggleVideo} title={videoOn ? "Stop video" : "Start video"}>
            {videoOn ? <CamOnIcon /> : <CamOffIcon />}
          </CtrlCircle>
        </>
      )}
      {showScreenShare && (
        <CtrlCircle
          variant={isScreenSharing ? "active" : "default"}
          onClick={onToggleScreenShare}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? <MdStopScreenShare /> : <MdScreenShare />}
        </CtrlCircle>
      )}
      {showRecord && (
        <CtrlCircle
          variant={isRecording ? "danger" : "default"}
          onClick={onToggleRecord}
          title={isRecording ? "Stop recording" : "Record"}
        >
          {isRecording ? <BsStopCircle /> : <BsRecordCircle />}
        </CtrlCircle>
      )}
      {onSettings && (
        <CtrlCircle onClick={onSettings} title="Settings">
          <SettingsIcon />
        </CtrlCircle>
      )}
      {extra}
      <CtrlCircle variant="danger" onClick={onEnd} title="Leave">
        <EndIcon />
      </CtrlCircle>
    </div>
  );
};

export default ControlBar;
