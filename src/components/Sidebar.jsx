import React from "react";
import { Link, NavLink } from "react-router-dom";
import { FiSettings as SettingIcon } from "react-icons/fi";
import { AiOutlineLogout as LogOutIcon } from "react-icons/ai";
import { sideMenuData } from "../constants/SideMenuData";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-[88px] flex-col items-center justify-between border-r border-line bg-surface py-6">
      <Link to="/" className="relative">
        {user ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-brand/30"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white">
            C
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col items-center gap-3 py-8">
        {sideMenuData.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            end={item.route === "/"}
            title={item.text}
            className={({ isActive }) =>
              `group relative flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-colors ${
                isActive
                  ? "bg-brand text-white shadow-card"
                  : "text-muted hover:bg-surface2 hover:text-ink"
              }`
            }
          >
            {item.icon}
            <span className="pointer-events-none absolute left-14 z-20 origin-left scale-0 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-medium text-white shadow-float transition-transform group-hover:scale-100">
              {item.text}
            </span>
          </NavLink>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-muted transition-colors hover:bg-surface2 hover:text-ink">
          <SettingIcon />
        </button>
        {user && (
          <button
            onClick={logout}
            title="Log out"
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-muted transition-colors hover:bg-live/10 hover:text-live"
          >
            <LogOutIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
