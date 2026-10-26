import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthForm from "../components/AuthForm";

const SignIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || "/";

  if (user) return <Navigate to={from} replace />;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <h1 className="text-2xl font-extrabold text-ink">
        Welcome to Con<span className="text-brand">nect</span>
      </h1>
      <p className="text-muted">Sign in to start meetings and go live</p>
      <AuthForm onDone={() => navigate(from, { replace: true })} />
    </div>
  );
};

export default SignIn;
