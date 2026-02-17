import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const decodeJwt = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (err) {
    return null;
  }
};

const pick = (value) => (value ? value : undefined);

const buildUserFromClaims = (claims, fallbackEmail, existingUser) => {
  const firstname =
    pick(claims?.firstname) ||
    pick(claims?.firstName) ||
    pick(claims?.given_name);
  const lastname =
    pick(claims?.lastname) ||
    pick(claims?.lastName) ||
    pick(claims?.family_name);
  const userType =
    pick(claims?.userType) ||
    pick(claims?.user_type) ||
    pick(claims?.role) ||
    pick(claims?.type);
  const email = pick(claims?.email);
  const uid = pick(claims?.uid) || pick(claims?.sub);

  const merged = {
    ...(existingUser || {}),
    ...(firstname ? { firstname } : {}),
    ...(lastname ? { lastname } : {}),
    ...(userType ? { userType: userType.toUpperCase() } : {}),
    ...(email ? { email } : {}),
    ...(uid ? { uid } : {}),
  };

  if (!merged.firstname) {
    merged.firstname = fallbackEmail || "guest";
  }
  if (!merged.email && fallbackEmail) {
    merged.email = fallbackEmail;
  }

  return merged;
};

const initialState = () => {
  const raw = localStorage.getItem("homefeast_auth");
  if (!raw) {
    return { isAuthed: false, user: null, token: null };
  }
  const parsed = JSON.parse(raw);
  if (parsed?.token) {
    const claims = decodeJwt(parsed.token);
    return {
      ...parsed,
      user: buildUserFromClaims(claims, parsed?.user?.email, parsed?.user),
    };
  }
  return parsed;
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(initialState);

  const login = (payload) => {
    const next = {
      isAuthed: true,
      user: payload?.user ?? { firstname: "guest" },
      token: payload?.token ?? null,
    };
    setAuth(next);
    localStorage.setItem("homefeast_auth", JSON.stringify(next));
  };

  const updateUser = (partial) => {
    setAuth((prev) => {
      const nextUser = { ...(prev.user || {}), ...(partial || {}) };
      const next = { ...prev, user: nextUser };
      localStorage.setItem("homefeast_auth", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    const next = { isAuthed: false, user: null, token: null };
    setAuth(next);
    localStorage.setItem("homefeast_auth", JSON.stringify(next));
  };

  const value = useMemo(
    () => ({ ...auth, login, logout, updateUser }),
    [auth.isAuthed, auth.user, auth.token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
