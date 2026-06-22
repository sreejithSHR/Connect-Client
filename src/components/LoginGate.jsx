import React from "react";
import { FcGoogle as GoogleIcon } from "react-icons/fc";
import { useAuth } from "../context/AuthContext";

// Wraps content that requires authentication; shows a Google sign-in otherwise.
const LoginGate = ({ children, message = "Sign in to continue" }) => {
  const { user, login } = useAuth();
  if (user) return children;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg px-4 text-center">
      <div className="text-2xl font-extrabold text-ink">
        Con<span className="text-brand">nect</span>
      </div>
      <p className="text-muted">{message}</p>
      <button
        onClick={login}
        className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 font-semibold text-ink shadow-card transition-transform hover:scale-105"
      >
        <GoogleIcon size={22} />
        Continue with Google
      </button>
    </div>
  );
};

export default LoginGate;
