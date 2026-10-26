import React from "react";
import { useAuth } from "../context/AuthContext";
import AuthForm from "./AuthForm";

// Wraps content that requires authentication; shows sign-in otherwise.
const LoginGate = ({ children, message = "Sign in to continue" }) => {
  const { user } = useAuth();
  if (user) return children;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-transparent px-4 py-10 text-center">
      <div className="text-2xl font-extrabold text-ink">
        Con<span className="text-brand">nect</span>
      </div>
      <p className="text-muted">{message}</p>
      <AuthForm />
    </div>
  );
};

export default LoginGate;
