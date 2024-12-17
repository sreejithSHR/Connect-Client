import React, { useState } from "react";
import { MdStopScreenShare } from "react-icons/md";
import { AiOutlineShareAlt as ShareIcon } from "react-icons/ai";
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
      className={`${
        screenSharing
          ? "bg-cyan-950 border-transparent"
          : "bg-slate-800/70 backdrop-blur border-gray"
      } border-2 p-2 cursor-pointer rounded-xl text-white text-xl`}
      onClick={screenShareToggle}
    >
      {screenSharing ? (
        <MdStopScreenShare size={22} />
      ) : (
        <ScreenShareIcon size={22} />
        
      )}
    </button>
  );
};

export default ScreenShareButton;
