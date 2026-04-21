export default function LeadScoreBadge({ score = 0, level = "low" }) {
  const safeScore = Number(score || 0);

  const styleByLevel = {
    high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    low: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  };

  const normalizedLevel = styleByLevel[level] ? level : "low";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${styleByLevel[normalizedLevel]}`}
      title={`Lead score: ${safeScore}`}
    >
      <span>{safeScore}</span>
      <span className="uppercase">{normalizedLevel}</span>
    </span>
  );
}
