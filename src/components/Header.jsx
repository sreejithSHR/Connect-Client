import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AiOutlineLogout as LogOutIcon } from "react-icons/ai";
import { FiSun, FiMoon } from "react-icons/fi";
import ThemeControls from "./ThemeControls";

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    isActive ? "bg-brandSoft text-brand" : "text-muted hover:text-ink"
  }`;

const Header = () => {
  const { user, login, logout } = useAuth();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 w-full items-center gap-6 border-b border-line bg-surface/80 px-6 backdrop-blur">
      <Link to="/" className="text-xl font-extrabold text-ink">
        Con<span className="text-brand">nect</span>
      </Link>

      <nav className="hidden items-center gap-1 sm:flex">
        <NavLink to="/" end className={navClass}>Home</NavLink>
        <NavLink to="/browse" className={navClass}>Browse</NavLink>
      </nav>

      <div className="relative ml-auto flex items-center gap-3">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          title="Theme & background"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface2 hover:text-ink"
        >
          {theme === "dark" ? <FiMoon /> : <FiSun />}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-line bg-surface p-4 shadow-float">
              <ThemeControls />
            </div>
          </>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ink2 sm:block">{user.displayName}</span>
            <div className="group relative h-9 w-9 overflow-hidden rounded-full">
              <img className="h-full w-full rounded-full object-cover" src={user?.photoURL} alt={user?.displayName} />
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
