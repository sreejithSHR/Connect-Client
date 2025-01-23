'use client'

import React, { useState, useEffect } from "react";
import HomeCard from "../components/HomeCard";
import Calendar from "../components/Calendar";
import { PodcastIcon,  CirclePlusIcon, GroupIcon as MeetingIcon } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

const roomId = uuid();




export default function Home() {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];
  const [date, setDate] = useState(new Date());
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [streamTitle, setStreamTitle] = useState("Welcome to my live stream!");
  const [streamDescription, setStreamDescription] = useState("Join me as we explore exciting topics and engage in lively discussions.");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleStartStream = () => {
    navigate(`/stream/${roomId}`, {
      state: {
        streamTitle,
        streamDescription,
      },
    });
  };

  const handleJoinMeeting = () => {
    // Redirect to the room ID entered by the user
    if (meetingCode.trim()) {
      navigate(`/room/${meetingCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-zinc-800 to-slate-950 text-gray-100 p-6 md:p-12 overflow-hidden relative">
      
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <div className="md:w-1/2 space-y-8">
          <div className="relative md:h-52 w-full rounded-2xl p-6 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-xl border border-white border-opacity-20">
            <div>
              <p className="text-6xl md:text-7xl text-white">
                {`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
              </p>
              <p className="text-slate-300 font-thin mt-2">
                {`${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to={`/room/${roomId}`} className="block w-full">
              <HomeCard
                title="New Meeting"
                desc="Create a new meeting"
                icon={<MeetingIcon className="text-green-500" />}
                iconBgColor="bg-green-100"
                bgColor="block p-6 bg-white bg-opacity-40 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl border border-gray-200 border-opacity-20 transition-all hover:bg-opacity-20 hover:scale-105"
                route={`/room/`}
              />
            </Link>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="block w-full text-left"
            >
              <HomeCard
                title="Join Meeting"
                desc="via invitation link"
                icon={<CirclePlusIcon className="text-blue" />}
                iconBgColor="bg-blue-100"
                bgColor="bg-white bg-opacity-10 hover:bg-opacity-20"
              />
            </button>
            <button
              onClick={() => setIsStreamModalOpen(true)}
              className="block w-full text-left"
            >
              <HomeCard
                title="Stream"
                desc="Start your live stream"
                icon={<PodcastIcon className="text-purple-500" />}
                iconBgColor="bg-purple-100"
                bgColor="bg-white bg-opacity-10 hover:bg-opacity-20"
              />
            </button>
          </div>
        </div>
        <div className="md:w-1/2 space-y-4">
          <h2 className="text-6xl text-white font-bold font-poppins text-center md:text-left">Welcome to Connect</h2>
          <Calendar />
        </div>
      </div>
      <div className="pt-16 items-center font-poppins text-slate-400">
  <p>
    Created By <a className="underline" href="https://envidoxsolutions.com" target="_blank" rel="noopener noreferrer">
      Envidox Solutions
    </a>
  </p>
 
</div>


      {/* Stream Modal */}
      {isStreamModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-zinc-600 bg-opacity-40 backdrop-filter backdrop-blur-lg  shadow-xl border border-gray-200 border-opacity-20  rounded-3xl p-4 py-2  border-b-2 border-gray max-w-md w-full">
            <h2 className="text-2xl pt-3 text-slate-200 font-poppins mb-4">Start a Live Stream</h2>
            <div className="mb-4">
              <label className="block text-slate-300 font-poppins">Stream Title</label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full font-poppins mt-1 p-2 border border-gray-300 rounded-2xl"
              />
            </div>
            <div className="mb-4">
              <label className="block text-slate-300 font-poppins">Stream Description</label>
              <textarea
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-2xl"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsStreamModalOpen(false)}
                className="px-4 py-2 bg-gray-500 border text-white font-poppins rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleStartStream}
                className="px-4 py-2 bg-zinc-600 text-white font-poppins rounded"
              >
                Start Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-zinc-600 bg-opacity-40 backdrop-filter backdrop-blur-lg  shadow-xl border border-gray-200 border-opacity-20  rounded-3xl p-4 py-2  border-b-2 border-gray max-w-md w-full">
            <h2 className="text-2xl pt-3 text-slate-200 font-poppins mb-4">Join a Meeting</h2>
            <div className="mb-4">
              <label className="block text-slate-300 font-poppins">Enter Meeting Code</label>
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="w-full font-poppins mt-1 p-2 border border-gray-300 rounded-2xl"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2 bg-gray-500 border text-white font-poppins rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinMeeting}
                className="px-4 py-2 bg-zinc-600 text-white font-poppins rounded"
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
    
  );
}

