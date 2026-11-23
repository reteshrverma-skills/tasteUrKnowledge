import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { programmeOf } from "@/lib/programme";
import { sanitiseFigure } from "@/lib/nvr";
import { presentOptions } from "@/app/dashboard/subject/TestReview";
import { FigureScale, OptionFigure, StemFigure } from "@/components/NvrFigures";
import { NvrIdSearch } from "../NvrIdSearch";
import { StageEditor } from "./StageEditor";

/**
 * One Non-Verbal question looked up by its gsNvrQuestions id: the question as
 * a child sees it, the answer key and explanations, and its stage, which the
 * admin can change here.
 */
export default async function AdminNvrQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const { id: rawId = "" } = await searchParams;
  const id = Number(rawId.trim());
  const valid = Number.isSafeInteger(id) && id > 0;

  const q = valid
    ? await prisma.gsNvrQuestion.findFirst({ where: { id, programmeCode: programmeOf(session) } })
    : null;

  return (
    <>
      <Link href="/admin/nvr" className="inline-block text-sm font-medium text-ink-soft hover:text-brand transition">
        ← Non-Verbal
      </Link>

      <div className="card p-5">
        <NvrIdSearch defaultValue={rawId} />
      </div>

      {!q ? (
        <div className="card p-12 text-center text-ink-soft">
          {rawId ? `No Non-Verbal question with ID ${rawId}.` : "Enter a question ID above."}
        </div>
      ) : (
        <QuestionCard q={q} />
      )}
    </>
  );
}

type Question = NonNullable<Awaited<ReturnType<typeof prisma.gsNvrQuestion.findFirst>>>;

function QuestionCard({ q }: { q: Question }) {
  const stem = sanitiseFigure(q.stemFigure);
  const options = presentOptions({
    optionA: sanitiseFigure(q.optionA),
    optionB: sanitiseFigure(q.optionB),
    optionC: sanitiseFigure(q.optionC),
    optionD: sanitiseFigure(q.optionD),
  });
  const whyWrong: Record<string, string | null> = {
    A: q.whyWrongA,
    B: q.whyWrongB,
    C: q.whyWrongC,
    D: q.whyWrongD,
  };

  return (
    <article className="card p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-login-teal">NON-VERBAL REASONING</p>
          <p className="text-sm text-ink-soft mt-1">
            {[q.topic, q.subTopic, q.typeOfQuestion].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="chip shrink-0 bg-ground text-ink border-line-strong tabular">ID {String(q.id)}</span>
      </div>

      <StageEditor id={String(q.id)} stage={q.stage} />

      <div>
        <p className="font-semibold text-ink mb-3">{q.quest}</p>
        <FigureScale>
          {stem && <StemFigure markup={stem} />}
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {options.map((o) => {
              const isRight = o.label === q.ansChoice;
              return (
                <li
                  key={o.label}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                    isRight ? "border-green-500 bg-green-50 text-green-900" : "border-line text-ink-soft"
                  }`}
                >
                  <OptionFigure markup={o.content} />
                  <span className="text-xs font-semibold">
                    {o.label}
                    {isRight && " · Correct answer"}
                  </span>
                </li>
              );
            })}
          </ul>
        </FigureScale>
      </div>

      <div className="text-sm text-ink-soft space-y-2 pt-4 border-t border-line">
        {q.ansExplain && (
          <p>
            <strong className="text-ink">Why {q.ansChoice}:</strong> {q.ansExplain}
          </p>
        )}
        {options
          .filter((o) => o.label !== q.ansChoice && whyWrong[o.label])
          .map((o) => (
            <p key={o.label}>
              <strong className="text-ink">Why not {o.label}:</strong> {whyWrong[o.label]}
            </p>
          ))}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-ink-faint pt-4 border-t border-line">
        <dt>Year</dt>
        <dd>{q.yearName ?? "—"}</dd>
        <dt>Source</dt>
        <dd className="break-all">{q.assetOrigin ?? "—"}</dd>
        <dt>Added</dt>
        <dd>{q.createdAt ? new Date(q.createdAt).toLocaleString("en-GB") : "—"}</dd>
      </dl>
    </article>
  );
}
