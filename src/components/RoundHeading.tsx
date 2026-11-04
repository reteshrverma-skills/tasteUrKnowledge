import { QuizSchoolLogo } from "@/components/QuizSchoolLogo";

/**
 * The line above a quiz's question card: the school's logo, if any, and the
 * level on the left in the logo's green, the topic on the right. It sits outside the card, so it holds still
 * while the questions change.
 */
export function RoundHeading({
  level,
  title,
  isTopicTest = false,
}: {
  level?: string | null;
  title?: string | null;
  isTopicTest?: boolean;
}) {
  if (!level && !title) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 font-display text-2xl font-bold text-[#12a874] shrink-0">
        <QuizSchoolLogo />
        <span>
          {level}
          {isTopicTest && `${level ? " · " : ""}whole topic`}
        </span>
      </span>
      <h1 className="font-display text-2xl font-bold text-ink text-right">
        {title}
      </h1>
    </div>
  );
}
