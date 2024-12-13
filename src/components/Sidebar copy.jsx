import React from "react";
import { sideMenuData } from "../constants/SideMenuData";

import { Link, NavLink } from "react-router-dom";

// icons
import { FiSettings as SettingIcon } from "react-icons/fi";

const Sidebar = () => {
  return (
    <div className="bg-black flex flex-col items-center justify-between p-2 w-[70px] h-screen border-r-2 border-lightGray">
      <div className="my-3">
        <Link to="/">
          <img className="h-9 w-9" src="/images/logo.png" alt="logo" />
        </Link>
      </div>
      <div className="flex-grow my-2">
        
          
        
      </div>
      <div className="bg-slate-950 border-2 border-gray p-2.5 cursor-pointer rounded-xl text-slate-300">
        <SettingIcon />
      </div>
    </div>
  );
};

export default Sidebar;
