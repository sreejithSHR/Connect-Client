import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

// Google Identity Services: loaded once, only when Google sign-in is enabled.
let gisPromise = null;
const loadGoogle = () => {
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve(window.google);
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => {
        gisPromise = null;
        reject(new Error("Couldn't load Google sign-in"));
      };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
};

const GoogleButton = ({ clientId, onCredential, onError }) => {
  const ref = useRef(null);
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    loadGoogle()
      .then((google) => {
        if (cancelled || !ref.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => callback.current(res.credential),
        });
        google.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: ref.current.offsetWidth || 320,
        });
      })
      .catch((e) => onError(e.message));
    return () => {
      cancelled = true;
    };
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} className="flex w-full justify-center" />;
};

const input =
  "w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand";

// Email + password sign in / sign up, plus "Continue with Google" when the
// backend has a Google client ID configured.
const AuthForm = ({ onDone }) => {
  const { login, register, loginWithGoogle, providers } = useAuth();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const signingUp = mode === "signup";
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone?.();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() =>
      signingUp
        ? register(form.name, form.email, form.password)
        : login(form.email, form.password)
    );
  };

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={submit} className="flex flex-col gap-3">
        {signingUp && (
          <input className={input} placeholder="Your name" autoComplete="name" required
            value={form.name} onChange={set("name")} />
        )}
        <input className={input} type="email" placeholder="Email" autoComplete="email" required
          value={form.email} onChange={set("email")} />
        <input className={input} type="password" placeholder="Password" required
          minLength={signingUp ? 8 : undefined}
          autoComplete={signingUp ? "new-password" : "current-password"}
          value={form.password} onChange={set("password")} />

        {error && <p className="text-left text-sm text-live">{error}</p>}

        <button type="submit" disabled={busy}
          className="rounded-full bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brandHover disabled:opacity-60">
          {busy ? "Please wait…" : signingUp ? "Create account" : "Sign in"}
        </button>
      </form>

      {providers.google && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton
            clientId={providers.google}
            onCredential={(credential) => run(() => loginWithGoogle(credential))}
            onError={setError}
          />
        </>
      )}

      <p className="mt-5 text-sm text-muted">
        {signingUp ? "Already have an account?" : "New to Connect?"}{" "}
        <button type="button" className="font-semibold text-brand hover:underline"
          onClick={() => { setMode(signingUp ? "signin" : "signup"); setError(null); }}>
          {signingUp ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
};

export default AuthForm;
