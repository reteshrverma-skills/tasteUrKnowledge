"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

/**
 * Google's own "Continue with Google" button (Google Identity Services).
 *
 * Google draws the button and hands back a signed ID token; /api/auth/google
 * checks it and signs in the SIGQS account with that email. Renders nothing
 * when no client ID is configured.
 */

interface GoogleIdApi {
  initialize(options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: "popup" | "redirect";
    context?: "signin" | "signup" | "use";
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    }
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignIn({
  onCredential,
}: {
  onCredential: (credential: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.google?.accounts?.id)
  );
  // Kept in a ref so re-renders of the page never re-initialise Google.
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const api = window.google?.accounts?.id;
    if (!ready || !api || !holder.current || !CLIENT_ID) return;

    api.initialize({
      client_id: CLIENT_ID,
      ux_mode: "popup",
      context: "signin",
      callback: ({ credential }) => {
        if (credential) callback.current(credential);
      },
    });
    api.renderButton(holder.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "center",
      // Google caps the button at 400px; match the form's width.
      width: Math.min(400, Math.round(holder.current.offsetWidth)),
    });
  }, [ready]);

  if (!CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      {/* Fixed height so the form does not jump when Google's button appears. */}
      <div ref={holder} className="w-full h-11 flex justify-center" />
    </>
  );
}
