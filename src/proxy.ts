import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Renamed from middleware.ts: Proxy runs on the Node.js runtime, which
// `jsonwebtoken` needs. Under the Edge runtime verifyToken always returned
// null, so every /admin request was bounced to /login.
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get token from cookies
  const token = request.cookies.get("token")?.value;
  const decoded = token ? verifyToken(token) : null;

  // A cookie that no longer verifies (wrong signature, expired, or issued
  // before the userProfile migration) is cleared rather than ignored -
  // otherwise it sits in the browser and keeps failing every request.
  if (token && !decoded) {
    const response =
      pathname === "/login" || pathname === "/register"
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    // Temporarily allow dashboard access to debug
    // if (!decoded) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
  }

  // Protect quiz routes
  if (pathname.startsWith("/quiz")) {
    // Temporarily allow quiz access to debug
    // if (!decoded) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
  }

  // Protect the parent area. Only a PARENT belongs here; a student who lands
  // on it is sent to their own dashboard rather than shown an empty page.
  if (pathname.startsWith("/parent")) {
    if (!decoded) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (decoded.userType !== "PARENT") {
      const home = decoded.userType === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  // A parent's home is the parent dashboard, not the subject tiles. The
  // subject pages below /dashboard stay reachable, so a parent can still open
  // their child's work from there.
  if (pathname === "/dashboard" && decoded?.userType === "PARENT") {
    return NextResponse.redirect(new URL("/parent", request.url));
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!decoded) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (decoded.userType !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && decoded) {
    const destination =
      decoded.userType === "ADMIN"
        ? "/admin"
        : decoded.userType === "PARENT"
        ? "/parent"
        : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quiz/:path*",
    "/admin/:path*",
    "/parent/:path*",
    "/login",
    "/register",
  ],
};
