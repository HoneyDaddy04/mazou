import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password, orgName } = await request.json();

  if (!email || !password || !orgName) {
    return NextResponse.json({ error: "Email, password, and organization name are required" }, { status: 400 });
  }

  const result = await signUp(email, password, orgName);
  return NextResponse.json({ user: result.user });
}
