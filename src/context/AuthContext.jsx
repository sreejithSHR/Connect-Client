import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { getIdToken, setToken } from "../api/token";

// Coloured initials for accounts without a photo (email sign-ups), so every
// <img src={user.photoURL}> in the app keeps working.
const escapeXml = (s) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
const initialsAvatar = (name = "?") => {
  const initials =
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<rect width="96" height="96" fill="hsl(${hue},55%,45%)"/>` +
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" ` +
    `font-size="40" fill="#fff">${escapeXml(initials)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const withAvatar = (user) =>
  user && { ...user, photoURL: user.photoURL || initialsAvatar(user.displayName || user.email) };

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState({ password: true, google: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.authProviders().then(setProviders).catch(() => {});

    // Restore the session from a stored token; drop it if it's no longer valid.
    getIdToken().then((token) => {
      if (!token) return setLoading(false);
      api
        .me()
        .then(({ user: me }) => setUser(withAvatar(me)))
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
    });
  }, []);

  const finish = useCallback(({ token, user: signedIn }) => {
    setToken(token);
    setUser(withAvatar(signedIn));
    return signedIn;
  }, []);

  const login = useCallback((email, password) => api.login({ email, password }).then(finish), [finish]);
  const register = useCallback(
    (name, email, password) => api.register({ name, email, password }).then(finish),
    [finish]
  );
  const loginWithGoogle = useCallback(
    (credential) => api.loginWithGoogle(credential).then(finish),
    [finish]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    // Don't silently sign the same Google account back in.
    window.google?.accounts?.id?.disableAutoSelect();
  }, []);

  return (
    <AuthContext.Provider value={{ user, providers, login, register, loginWithGoogle, logout }}>
      {loading || children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};

export { useAuth, AuthProvider };
