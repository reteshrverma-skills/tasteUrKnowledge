import { redirect } from "next/navigation";
import { getSession, homePathFor } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { ExitForm } from "./ExitForm";

/**
 * Where "Log out" leads for a pupil their teacher opened on a classroom
 * device: the teacher enters their PIN (or password) and the device goes back
 * to the teacher's screen.
 */
export default async function ClassroomExitPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.teacherId) redirect(homePathFor(session.userType));

  return (
    <div className="min-h-screen bg-ground grid place-items-center px-4 py-10">
      <div className="card p-6 sm:p-8 w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <BrandLogo height={56} />
        </div>
        <h1 className="font-display text-xl font-bold text-ink">Finished?</h1>
        <p className="text-sm text-ink-soft mt-2">Ask your teacher to enter their PIN.</p>
        <ExitForm />
      </div>
    </div>
  );
}
