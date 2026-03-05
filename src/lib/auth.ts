import { cookies } from "next/headers";

const SESSION_COOKIE = "mazou_session";

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@mazou.dev",
  fullName: "Demo User",
  role: "owner",
  orgId: "demo-org-001",
  orgName: "Mazou Demo",
};

export async function signIn(_email: string, _password: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "demo-session-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return { user: DEMO_USER };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return { user: DEMO_USER };
}

export async function signUp(_email: string, _password: string, _orgName: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "demo-session-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return { user: DEMO_USER };
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
