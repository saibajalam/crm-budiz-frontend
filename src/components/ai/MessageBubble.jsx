const listClass = "mt-2 list-disc space-y-1 pl-4 text-xs text-gray-600 dark:text-gray-300";

export default function MessageBubble({ message, isTyping }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const structured = message.structured;

  if (isSystem) {
    return (
      <div className="mx-auto rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-500 dark:bg-white/5 dark:text-gray-300">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3 py-2 ${
          isUser
            ? "bg-brand-500 text-white"
            : "border border-gray-200 bg-white text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white"
        }`}
      >
        <p className="text-sm leading-relaxed">
          {message.content || (isTyping ? "Thinking..." : "")}
          {isTyping ? <span className="animate-pulse"> |</span> : null}
        </p>

        {!isUser && structured?.insights?.length ? (
          <ul className={listClass}>
            {structured.insights.slice(0, 4).map((item, idx) => (
              <li key={`insight-${idx}`}>{item}</li>
            ))}
          </ul>
        ) : null}

        {!isUser && structured?.suggestions?.length ? (
          <div className="mt-2 rounded-lg bg-lightPrimary p-2 text-xs dark:bg-navy-900">
            <p className="font-semibold text-brand-500">Suggestions</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-gray-600 dark:text-gray-300">
              {structured.suggestions.slice(0, 3).map((item, idx) => (
                <li key={`suggestion-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
