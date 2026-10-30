import { NextRequest, NextResponse } from "next/server";
import { endAllSessions, getSession } from "@/lib/auth";
import { recordLogout } from "@/lib/login-session";
import { endClassroomTurn } from "@/lib/school";

/**
 * Logging out is a plain form POST from the dashboard, with no JavaScript to
 * follow up, so the browser simply renders whatever comes back. Returning JSON
 * left the student looking at {"success":true} on a blank page; a 303 sends
 * them to the login form instead.
 *
 * The cookie is cleared on the response itself, with the same name and path
 * login set it with. Clearing it any other way risks the redirect arriving at
 * /login still carrying a valid token - and the proxy bounces a logged-in
 * visitor straight back to /dashboard, which would look like logout silently
 * doing nothing.
 */
export async function POST(request: NextRequest) {
  // The token is still on the request here (cleared only on the response), so
  // the user is known and their open session can be closed before sign-out.
  const session = await getSession();

  // A pupil a teacher opened on a classroom device: "Log out" asks for the
  // teacher's PIN and hands the device back, rather than leaving it on the
  // login page. An idle timeout (?reason=idle) has nobody to ask, so it ends
  // the turn and signs out like any other session.
  if (session?.teacherId && session.classroomId) {
    if (request.nextUrl.searchParams.get("reason") !== "idle") {
      return new NextResponse(null, {
        status: 303,
        headers: { Location: "/classroom/exit" },
      });
    }
    await endClassroomTurn(session.classroomId, session.userId, "idle").catch((error) =>
      console.error("Failed to end classroom turn on logout:", error)
    );
  }

  if (session) {
    await recordLogout(session.userId);
    // The account has one session; logging out ends it on every device.
    await endAllSessions(session.userId).catch((error) =>
      console.error("Failed to end sessions on logout:", error)
    );
  }

  // A relative Location, not NextResponse.redirect. Behind Azure's proxy the
  // server only sees its own internal host, so an absolute redirect built from
  // request.url pointed the browser at http://localhost:8080/login. A relative
  // "/login" is resolved by the browser against the public URL it actually
  // used, so it works in front of a proxy and locally alike.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/login" },
  });

  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
