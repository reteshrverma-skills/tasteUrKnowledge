import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { formatDate } from "@/app/dashboard/subjects/marks";

const PAGE_SIZE = 100;
const MB = 1024 * 1024;
const size = (bytes: number) =>
  bytes < MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / MB).toFixed(1)} MB`;

/**
 * Admin: papers GCSE / A-Level students uploaded under Load, newest first,
 * with View and Download for review. ?q= filters by student name or username.
 */
export default async function AdminStudentPapersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const like = { contains: q, mode: "insensitive" as const };

  const files = await prisma.studentPaperFile.findMany({
    where: {
      deletedAt: null,
      paper: {
        deletedAt: null,
        ...(q
          ? { student: { OR: [{ fName: like }, { lName: like }, { profileName: like }] } }
          : {}),
      },
    },
    orderBy: { uploadedAt: "desc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      sizeBytes: true,
      pageCount: true,
      uploadedAt: true,
      paper: {
        select: {
          name: true,
          subjectCode: true,
          test: { select: { testDate: true, totalMarks: true, awardedMarks: true } },
          student: {
            select: {
              fName: true,
              mName: true,
              lName: true,
              profileName: true,
              programme: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return (
    <section className="space-y-4 min-w-0">
      <div className="card p-5">
        <h1 className="font-display text-xl font-semibold text-ink">Student papers</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Papers GCSE and A-Level students uploaded under Load, newest first. Open or download one
          to review it.
        </p>
        <form className="mt-4 flex flex-wrap gap-2" action="/admin/student-papers">
          <input
            name="q"
            defaultValue={q}
            placeholder="Student name or username"
            aria-label="Search by student"
            className="field flex-1 min-w-48 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="btn-primary px-4 py-1.5 text-sm">
            Search
          </button>
          {q && (
            <a href="/admin/student-papers" className="self-center text-sm text-ink-soft hover:text-ink">
              Clear
            </a>
          )}
        </form>
      </div>

      {files.length === 0 ? (
        <div className="card p-5 text-sm text-ink-soft">
          {q ? `No papers for "${q}".` : "No papers have been uploaded yet."}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-faint">
              <tr className="border-b border-line">
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Subject</th>
                <th className="px-4 py-2 font-medium">Test / paper</th>
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Uploaded</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const { paper } = f;
                const test = paper.test;
                return (
                  <tr key={String(f.id)} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-ink">{displayName(paper.student)}</div>
                      <div className="text-xs text-ink-faint">
                        @{paper.student.profileName} · {paper.student.programme.name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-ink">{paper.subjectCode}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-ink">{paper.name}</div>
                      {test && (
                        <div className="text-xs text-ink-faint tabular">
                          {test.testDate ? formatDate(test.testDate) : "No date"} ·{" "}
                          {test.totalMarks > 0 ? `${test.awardedMarks}/${test.totalMarks}` : "no marks yet"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft tabular whitespace-nowrap">
                      {f.pageCount} {f.pageCount === 1 ? "page" : "pages"} · {size(f.sizeBytes)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft tabular whitespace-nowrap">
                      {f.uploadedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium whitespace-nowrap text-right">
                      <a
                        href={`/api/admin/student-papers/${f.id}`}
                        target="_blank"
                        rel="noopener"
                        className="text-brand hover:underline"
                      >
                        View
                      </a>
                      <a
                        href={`/api/admin/student-papers/${f.id}?download=1`}
                        className="ml-3 text-ink-soft hover:text-brand"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {files.length === PAGE_SIZE && (
            <p className="px-4 py-2 text-xs text-ink-faint">
              Showing the newest {PAGE_SIZE}. Search by student to find older ones.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
