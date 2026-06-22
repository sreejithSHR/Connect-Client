import React, { useEffect, useRef, useState } from "react";
import { IoMic as MicOnIcon, IoMicOff as MicOffIcon } from "react-icons/io5";
import { IoVideocam as CamOnIcon, IoVideocamOff as CamOffIcon } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";

const AVATAR_FALLBACK =
  "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png";

/**
 * Green-room shown before joining: live camera preview + mic/cam toggles, so the
 * user can check their devices. Calls onJoin({ audio, video }) with the chosen
 * initial state; the preview stream is stopped first so the room re-acquires.
 */
const PreJoin = ({ onJoin, heading = "Ready to join?", cta = "Join now" }) => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setDenied(true));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleAudio = () => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) t.enabled = !t.enabled;
    setAudioOn((v) => !v);
  };
  const toggleVideo = () => {
    const t = streamRef.current?.getVideoTracks()[0];
    if (t) t.enabled = !t.enabled;
    setVideoOn((v) => !v);
  };

  const join = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onJoin({ audio: audioOn, video: videoOn });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-surface p-6 shadow-card sm:p-8">
        <h1 className="mb-1 text-center text-2xl font-bold text-ink">{heading}</h1>
        <p className="mb-6 text-center text-sm text-muted">
          Check your camera and microphone before joining.
        </p>

        <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl bg-ink">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${videoOn && !denied ? "" : "opacity-0"}`}
          />
          {(!videoOn || denied) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <img
                src={user?.photoURL || AVATAR_FALLBACK}
                alt={user?.displayName}
                className="h-24 w-24 rounded-full object-cover"
              />
              {denied && (
                <p className="text-sm text-white/70">Camera/mic blocked — you can still join</p>
              )}
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl text-white ${
                audioOn ? "bg-white/15 hover:bg-white/25" : "bg-live"
              }`}
            >
              {audioOn ? <MicOnIcon /> : <MicOffIcon />}
            </button>
            <button
              onClick={toggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl text-white ${
                videoOn ? "bg-white/15 hover:bg-white/25" : "bg-live"
              }`}
            >
              {videoOn ? <CamOnIcon /> : <CamOffIcon />}
            </button>
          </div>
        </div>

        <button
          onClick={join}
          className="mx-auto mt-6 block w-full max-w-xs rounded-full bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brandHover"
        >
          {cta}
        </button>
      </div>
    </div>
  );
};

export default PreJoin;
