import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

/**
 * useSearchParams needs a Suspense boundary above it, or the whole route is
 * forced to render on the client.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
