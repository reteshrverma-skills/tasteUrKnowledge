"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

/** A box over the dimmed page; a click on the dimmed part closes it. */
function Popup({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/50 px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="card p-7 space-y-5 w-full max-w-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-sans text-xl font-semibold text-login-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close"
            className="text-xl leading-none text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** The top menu shared by the login page and the SIGQS Pathway pages: SIGQS Pathway, About and Sign Up. */
export function SiteHeader() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pathwayOpen, setPathwayOpen] = useState(false);

  return (
    <>
      <header className="border-b border-login-border">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link href="/login" className="inline-flex items-center">
            <BrandLogo height={56} />
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-3 text-sm font-semibold text-login-teal">
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setPathwayOpen(false);
              }}
            >
              <button
                type="button"
                aria-expanded={pathwayOpen}
                aria-haspopup="true"
                onClick={() => setPathwayOpen((open) => !open)}
                className="whitespace-nowrap rounded-full bg-brand-tint px-2.5 sm:px-3.5 py-1.5 hover:bg-login-border transition inline-flex items-center gap-1"
              >
                SIGQS Pathway
                <svg viewBox="0 0 12 12" className={`w-3 h-3 transition ${pathwayOpen ? "rotate-180" : ""}`} aria-hidden="true">
                  <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              {pathwayOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-20 w-56 rounded-xl border border-login-border bg-white p-2 shadow-lg">
                  <p className="px-3 py-2 text-login-navy">11+ QS</p>
                  <div className="ml-4 border-l-2 border-login-border pl-2">
                    {[
                      { href: "/pathway/login-journey", label: "Login Journey" },
                      { href: "/pathway/childrens-journey", label: "Children's Journey" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setPathwayOpen(false)}
                        className="block rounded-lg px-3 py-2 font-medium text-login-body hover:bg-brand-tint hover:text-login-navy transition"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="whitespace-nowrap rounded-full bg-brand-tint px-2.5 sm:px-3.5 py-1.5 hover:bg-login-border transition"
            >
              About
            </button>
            <Link
              href="/register"
              className="whitespace-nowrap rounded-full bg-login-teal text-white px-2.5 sm:px-3.5 py-1.5 hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {aboutOpen && (
        <Popup title="About SIGQS" onClose={() => setAboutOpen(false)}>
          <p className="text-[15px] text-login-body leading-relaxed">
            SIGQS offers structured 11+ practice in Maths, English, Verbal Reasoning and Non-Verbal
            Reasoning, to help children prepare for Grammar School entrance exams. Children practise
            at their own stage, and parents can follow their progress from their own
            dashboard.
          </p>
        </Popup>
      )}
    </>
  );
}
