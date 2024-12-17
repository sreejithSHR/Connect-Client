import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const Stream = () => {
  const { roomID } = useParams(); // Get the room ID from the route
  const { user } = useAuth(); // Get the current user (e.g., for host identification)
  const socket = useRef(null);
  const hostVideoRef = useRef(null); // Reference for the host's video
  const peerConnections = useRef({}); // Store WebRTC connections
  const [isHost, setIsHost] = useState(false); // Determines if the user is the host
  const [msgs, setMsgs] = useState([]); // Chat messages
  const [msgText, setMsgText] = useState(""); // Current chat input

  // Initialize WebRTC stream (only for host)
  useEffect(() => {
    socket.current = io("https://connect-backend-2s1a.onrender.com/");
    socket.current.emit("join room", { roomID, user });

    socket.current.on("set host", (hostID) => {
      if (hostID === user?.uid) {
        setIsHost(true);
        startHostStream(); // Start streaming if the user is the host
      }
    });

    socket.current.on("user joined", ({ signal, callerID }) => {
      if (!isHost) return; // Only the host handles incoming connections
      const peer = createPeerConnection(callerID, signal);
      peerConnections.current[callerID] = peer;
    });

    socket.current.on("receiving returned signal", ({ id, signal }) => {
      const peer = peerConnections.current[id];
      if (peer) {
        peer.signal(signal);
      }
    });

    // Cleanup on component unmount
    return () => {
      socket.current.emit("leave room", { roomID });
      socket.current.disconnect();
    };
  }, [user, roomID]);

  // Function to start the host's stream
  const startHostStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      hostVideoRef.current.srcObject = stream; // Attach the stream to the host's video element

      stream.getTracks().forEach((track) => {
        Object.values(peerConnections.current).forEach((peer) =>
          peer.addTrack(track, stream)
        );
      });
    } catch (err) {
      console.error("Error starting host stream:", err);
    }
  };

  // Function to create a WebRTC connection for a new participant
  const createPeerConnection = (callerID, signal) => {
    const peer = new RTCPeerConnection();

    const stream = hostVideoRef.current.srcObject;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onsignal = (signal) => {
      socket.current.emit("returning signal", { signal, callerID });
    };

    peer.signal(signal);
    return peer;
  };

  // Handle chat messages
  const sendMessage = (e) => {
    e.preventDefault();
    if (msgText.trim() === "") return;

    socket.current.emit("send message", {
      roomID,
      user: { name: user?.displayName },
      message: msgText.trim(),
    });

    setMsgText("");
  };

  // Listen for incoming chat messages
  useEffect(() => {
    socket.current.on("message", (message) => {
      setMsgs((prev) => [...prev, message]);
    });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <h1 className="text-xl">Live Stream</h1>
        <div>{user?.displayName}</div>
      </header>

      <main className="flex flex-grow">
        {/* Host's Video Section */}
        <div className="flex-grow p-4 flex items-center justify-center">
          <video
            ref={hostVideoRef}
            autoPlay
            playsInline
            muted={isHost} // Mute the host's own stream
            className="h-full w-full bg-black rounded"
          />
        </div>

        {/* Chat Section */}
        <div className="w-1/3 bg-gray-800 p-4 flex flex-col">
          <div className="flex-grow overflow-y-auto">
            {msgs.map((msg, index) => (
              <div key={index} className="mb-2">
                <p className="font-bold">{msg.user?.name || "Anonymous"}:</p>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="mt-2 flex">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              className="flex-grow px-4 py-2 rounded bg-gray-700"
              placeholder="Enter your message..."
            />
            <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 rounded">
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Stream;
