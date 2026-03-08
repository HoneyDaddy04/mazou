import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/usage", "/routing", "/agents", "/models", "/catalog", "/african", "/recommendations", "/keys", "/billing", "/settings"];

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("mazou_session")?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
