import React from "react";

const HomeCard = ({ icon, title, desc, bgColor, route }) => {
  return (
    <div
      className={` ${bgColor} rounded-xl shadow-xl border border-white border-opacity-20 transition-all hover:scale-105 p-6`}
    >
      <div className="flex md:h-full items-center md:flex-col md:items-start md:justify-between gap-2">
        <div
          className={`text-white text-2xl aspect-square md:h-12 flex items-center justify-center md:text-3xl 
          md: bg-slate-900 group-hover:text- group-hover:scale-110 duration-200 md:p-2 md:border-[1px]
           md:border-white  rounded-lg`}
        >
          {icon}
        </div>
        <div className="flex-shrink-0 md:mb-5">
          <p className="text-white md:mb-1 text-sm md:text-2xl md:font-bold">
            {title}
          </p>
          <p className="text-slate-200 text-sm font-thin hidden md:block">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeCard;
