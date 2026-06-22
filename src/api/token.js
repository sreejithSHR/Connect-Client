import { auth } from "../firebase/config";

// Returns a fresh Firebase ID token for the signed-in user, or null.
export const getIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
};
