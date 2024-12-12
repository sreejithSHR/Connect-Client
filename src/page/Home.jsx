import React, { useEffect, useState } from "react";
import HomeCard from "../components/HomeCard";

import { v4 as uuid } from "uuid";

// icons
import { MdVideoCall as NewCallIcon } from "react-icons/md";
import { MdAddBox as JoinCallIcon } from "react-icons/md";
import { BsCalendarDate as CalenderIcon } from "react-icons/bs";
import { MdScreenShare as ScreenShareIcon } from "react-icons/md";
import { Link } from "react-router-dom";

const roomId = uuid();

const Home = () => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [date, setDate] = useState(new Date());

  function refreshClock() {
    setDate(new Date());
  }
  useEffect(() => {
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  return (
    <div className=" min-h-screen bg-gradient-to-r from-zinc-800 to-slate-950 text-gray-100 p-6 md:p-12 overflow-hidden relative">
      <div className="flex h-full md:gap-2 flex-col md:flex-row">
      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
          <div className="relative md:h-52 w-80  rounded md:rounded-2xl p-3">
            <div className="md:absolute bottom-2 left-2 md:bottom-6 md:left-6">
              <p className="md:text-7xl text-center text-4xl text-white">
                {`${
                  date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
                }:${
                  date.getMinutes() < 10
                    ? `0${date.getMinutes()}`
                    : date.getMinutes()
                }`}
              </p>
              <p className="text-slate-300  text-center font-thin my-1">
                {`${days[date.getDay()]},${date.getDate()} ${
                  months[date.getMonth()]
                } ${date.getFullYear()}`}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 w-auto h-auto items-center">
          <div className=" md:gap-6 mb-3 md:mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to={`/room/${roomId}`} className="block w-full">
              <HomeCard
                title="New Meeting"
                desc="Create a new meeting"
                icon={<NewCallIcon />}
                iconBgColor="lightYellows"
                bgColor=" block p-6 bg-white bg-opacity-40 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl border border-gray-200 border-opacity-20 transition-all hover:bg-opacity-20 hover:scale-105"
                route={`/room/`}
              />
            </Link>
            <HomeCard
              title="Join Meeting"
              desc="via invitation link"
              icon={<JoinCallIcon />}
              bgColor="block p-6 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl border border-gray-200 border-opacity-20 transition-all hover:bg-opacity-20 hover:scale-105"
            />
          </div>
          <div className="flex gap-2 md:gap-6">
            <HomeCard
              title="Schedule"
              desc="schedule your meeting"
              icon={<CalenderIcon size={20} />}
              bgColor="block p-6 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl border border-gray-200 border-opacity-20 transition-all hover:bg-opacity-20 hover:scale-105"
            />
            <HomeCard
              title="Screen Share"
              desc="show your work"
              icon={<ScreenShareIcon size={22} />}
              bgColor="block p-6 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl border border-gray-200 border-opacity-20 transition-all hover:bg-opacity-20 hover:scale-105"
            />
          </div>
          <div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Home;
