'use client'

import React, { useEffect, useState } from "react";
import HomeCard from "../components/HomeCard";
import Calendar from "../components/Calendar";

import { v4 as uuid } from "uuid";

// icons
import { MdVideoCall as NewCallIcon } from "react-icons/md";
import { MdAddBox as JoinCallIcon } from "react-icons/md";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

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
            <Link href={`/room/${roomId}`} className="block w-full">
              <HomeCard
                title="New Meeting"
                desc="Create a new meeting"
                icon={<NewCallIcon />}
                iconBgColor="bg-yellow-400"
                bgColor="bg-white bg-opacity-40 hover:bg-opacity-20"
              />
            </Link>
            <HomeCard
              title="Join Meeting"
              desc="via invitation link"
              icon={<JoinCallIcon />}
              iconBgColor="bg-blue-400"
              bgColor="bg-white bg-opacity-10 hover:bg-opacity-20"
            />
          </div>
        </div>
        <div className="md:w-1/2 space-y-4">
          <h2 className="text-6xl text-white font-bold font-poppins text-center md:text-left">Welcome to Connect</h2>
          <Calendar />
        </div>
      </div>
    </div>
  );
}

