import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AiOutlineLogout as LogOutIcon } from "react-icons/ai";

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    isActive ? "bg-brandSoft text-brand" : "text-muted hover:text-ink"
  }`;

const Header = () => {
  const { user, login, logout } = useAuth();

  return (
    <header className="flex h-16 w-full items-center gap-6 border-b border-line bg-surface px-6">
      <Link to="/" className="text-xl font-extrabold text-ink">
        Con<span className="text-brand">nect</span>
      </Link>

      <nav className="hidden items-center gap-1 sm:flex">
        <NavLink to="/" end className={navClass}>
          Home
        </NavLink>
        <NavLink to="/browse" className={navClass}>
          Browse
        </NavLink>
      </nav>

      <div className="ml-auto">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ink2 sm:block">
              {user.displayName}
            </span>
            <div className="group relative h-9 w-9 overflow-hidden rounded-full">
              <img
                className="h-full w-full rounded-full object-cover"
                src={user?.photoURL}
                alt={user?.displayName}
              />
              <button
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                onClick={logout}
                title="Logout"
              >
                <LogOutIcon />
              </button>
            </div>
          </div>
        ) : (
          <button
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brandHover"
            onClick={login}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
