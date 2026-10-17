/**
 * The line above a quiz's question card: the level on the left in the logo's
 * green, the topic on the right. It sits outside the card, so it holds still
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
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-display text-2xl font-bold text-[#12a874] shrink-0">
        {level}
        {isTopicTest && `${level ? " · " : ""}whole topic`}
      </span>
      <h1 className="font-display text-2xl font-bold text-ink text-right">
        {title}
      </h1>
    </div>
  );
}
