import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordLogout } from "@/lib/login-session";

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
export async function POST() {
  // The token is still on the request here (cleared only on the response), so
  // the user is known and their open session can be closed before sign-out.
  const session = await getSession();
  if (session) {
    await recordLogout(session.userId);
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
