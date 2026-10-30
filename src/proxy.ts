import { NextRequest, NextResponse } from "next/server";
import { homePathFor, isCurrentSession, verifyToken } from "@/lib/auth";

// Renamed from middleware.ts: Proxy runs on the Node.js runtime, which
// `jsonwebtoken` needs. Under the Edge runtime verifyToken always returned
// null, so every /admin request was bounced to /login.
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get token from cookies
  const token = request.cookies.get("token")?.value;
  const verified = token ? verifyToken(token) : null;

  // One session per account: a token that verifies but is no longer the
  // account's current session (signed in elsewhere, logged out, password
  // changed) is treated exactly like an invalid one. Without this, the stale
  // cookie would bounce between /login and the dashboard.
  const replaced = verified ? !(await isCurrentSession(verified)) : false;
  const decoded = replaced ? null : verified;

  // A cookie that no longer verifies (wrong signature, expired, or issued
  // before the userProfile migration) is cleared rather than ignored -
  // otherwise it sits in the browser and keeps failing every request.
  if (token && !decoded) {
    const response =
      pathname === "/login" || pathname === "/register"
        ? NextResponse.next()
        : NextResponse.redirect(
            new URL(replaced ? "/login?reason=elsewhere" : "/login", request.url)
          );
    response.cookies.delete("token");
    return response;
  }

  // A product director sees statistics only: any student or parent page
  // sends them back to their own.
  if (
    decoded?.userType === "PRODUCT_DIRECTOR" &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/quiz") ||
      pathname.startsWith("/parent"))
  ) {
    return NextResponse.redirect(new URL("/director", request.url));
  }

  // School staff work from their own pages: a School Admin from /school, a
  // teacher from /teacher. Practice pages are for the pupils they open.
  if (
    (decoded?.userType === "SCHOOL_ADMIN" || decoded?.userType === "TEACHER") &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/quiz") ||
      pathname.startsWith("/parent"))
  ) {
    return NextResponse.redirect(new URL(homePathFor(decoded.userType), request.url));
  }

  // The School Admin's page and the teacher's page, each for that role only.
  for (const [prefix, role] of [
    ["/school", "SCHOOL_ADMIN"],
    ["/teacher", "TEACHER"],
  ] as const) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!decoded) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (decoded.userType !== role) {
        return NextResponse.redirect(new URL(homePathFor(decoded.userType), request.url));
      }
    }
  }

  // Ending a classroom turn needs the pupil's session to end.
  if (pathname.startsWith("/classroom") && !decoded) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // The statistics page: product directors, and admins.
  if (pathname.startsWith("/director")) {
    if (!decoded) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (decoded.userType !== "PRODUCT_DIRECTOR" && decoded.userType !== "ADMIN") {
      return NextResponse.redirect(new URL(homePathFor(decoded.userType), request.url));
    }
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
      return NextResponse.redirect(new URL(homePathFor(decoded.userType), request.url));
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
      return NextResponse.redirect(new URL(homePathFor(decoded.userType), request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && decoded) {
    return NextResponse.redirect(
      new URL(homePathFor(decoded.userType), request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quiz/:path*",
    "/admin/:path*",
    "/director/:path*",
    "/parent/:path*",
    "/school/:path*",
    "/teacher/:path*",
    "/classroom/:path*",
    "/login",
    "/register",
  ],
};
