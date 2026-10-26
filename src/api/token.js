// Session token issued by our backend (/api/auth/*), kept in localStorage.
// A bearer token rather than a cookie: the frontend and API live on different
// sites (e.g. two duckdns.org names), where cookies would be third-party.
const KEY = "connect.token";

export const getIdToken = async () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked (private mode): session lasts until reload */
  }
};
