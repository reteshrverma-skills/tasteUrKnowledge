import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { listYears, ownsManagedChild } from "@/lib/parent";
import { ParentFrame } from "../../ParentFrame";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { EditChildForm } from "./EditChildForm";
import { listProgrammes } from "@/lib/programme";
import { DeleteChild } from "./DeleteChild";
import { PasscodeForm } from "../PasscodeForm";

// Deleting a child's profile is hidden from parents for now. The API route and
// DeleteChild component are intact; set this to true to bring the option back.
const SHOW_DELETE_PROFILE = false;

/** One child's profile, editable by the parent who owns it. */
export default async function EditChildPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const { studentId: raw } = await params;
  const studentId = Number(raw);

  // A child belonging to someone else is not "forbidden", it simply is not
  // there as far as this parent is concerned.
  if (!Number.isInteger(studentId)) notFound();
  // A school pupil is edited by the school, not here.
  if (!(await ownsManagedChild(session.userId, studentId))) notFound();

  const [child, years, programmes] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: studentId },
      select: {
        fName: true,
        mName: true,
        lName: true,
        profileName: true,
        isActive: true,
        programmeCode: true,
        profilePasscode: true,
        studentDetails: { select: { studentYear: true } },
      },
    }),
    listYears(),
    listProgrammes(),
  ]);

  if (!child) notFound();

  return (
    <ParentFrame active="children">
      <WelcomeCard eyebrow="EDIT CHILD" title={displayName(child)}>
        Login id <span className="font-semibold text-ink">{child.profileName}</span> - this
        cannot be changed.
      </WelcomeCard>

      <div className="card p-5 sm:p-6">
        <EditChildForm
          studentId={studentId}
          years={years}
          programmes={programmes}
          initial={{
            fName: child.fName ?? "",
            mName: child.mName ?? "",
            lName: child.lName ?? "",
            studentYear: child.studentDetails?.studentYear ?? "",
            programmeCode: child.programmeCode,
            isActive: child.isActive,
          }}
        />
      </div>

      <div className="card p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold text-ink mb-3">Login Pin</h3>
        <PasscodeForm studentId={studentId} hasPasscode={Boolean(child.profilePasscode)} />
      </div>

      {SHOW_DELETE_PROFILE && (
        <DeleteChild studentId={studentId} profileName={child.profileName} />
      )}
    </ParentFrame>
  );
}
