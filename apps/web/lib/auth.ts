import { RoleCode } from "@financial-system/types";

export interface SessionUser {
  id: string;
  username: string;
  realName: string;
  email: string | null;
  phone: string | null;
  roles: RoleCode[];
}

export interface SessionState {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const SESSION_KEY = "financial-system-session";

export function readSession(): SessionState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function writeSession(session: SessionState) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

