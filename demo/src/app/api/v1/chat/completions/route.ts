import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Demo mode - API gateway not active. Use the dashboard to explore Mazou.",
    demo: true,
  });
}
