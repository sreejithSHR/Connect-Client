import React, { useState } from "react";
import { MdStopScreenShare } from "react-icons/md";
import { MdScreenShare as ScreenShareIcon } from "react-icons/md";

const ScreenShareButton = ({ peersRef, localVideo, onScreenShareEnd }) => {
  const [screenSharing, setScreenSharing] = useState(false);

  const screenShareToggle = async () => {
    if (!screenSharing) {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track for all peer connections
        peersRef.current.forEach(({ peer }) => {
          const sender = peer
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Update local video preview
        if (localVideo.current) {
          localVideo.current.srcObject = screenStream;
        }

        // Handle when the user stops sharing
        screenTrack.onended = () => {
          revertToCamera();
        };

        setScreenSharing(true);
      } catch (error) {
        console.error("Error during screen sharing:", error);
      }
    } else {
      // Stop screen sharing and revert to the camera
      revertToCamera();
    }
  };

  const revertToCamera = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const cameraTrack = cameraStream.getVideoTracks()[0];

      // Replace screen track with camera track for all peer connections
      peersRef.current.forEach(({ peer }) => {
        const sender = peer
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      });

      // Update local video preview
      if (localVideo.current) {
        localVideo.current.srcObject = cameraStream;
      }

      setScreenSharing(false);

      // Callback to inform the parent component
      if (onScreenShareEnd) {
        onScreenShareEnd();
      }
    } catch (error) {
      console.error("Error reverting to camera:", error);
    }
  };

  return (
    <button
      title={screenSharing ? "Stop sharing" : "Share screen"}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-xl transition-colors ${
        screenSharing ? "bg-brand text-white hover:bg-brandHover" : "bg-surface2 text-ink2 hover:bg-surface3"
      }`}
      onClick={screenShareToggle}
    >
      {screenSharing ? <MdStopScreenShare size={20} /> : <ScreenShareIcon size={20} />}
    </button>
  );
};

export default ScreenShareButton;
