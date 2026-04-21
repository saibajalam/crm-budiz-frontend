import Card from "components/card";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiSearch,
  FiUser,
  FiVideo,
} from "react-icons/fi";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

const formatDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown Date";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const groupByDate = (activities) => {
  return activities.reduce((acc, activity) => {
    const key = formatDateKey(activity.created_at || activity.timestamp || new Date().toISOString());
    if (!acc[key]) acc[key] = [];
    acc[key].push(activity);
    return acc;
  }, {});
};

const getMessage = (item) => {
  if (item.note) return item.note;
  if (item.message) return item.message;
  if (item.description) return item.description;
  return "Activity updated";
};

const activityTypeOptions = ["ALL", "CALL", "NOTE", "EMAIL", "STATUS_CHANGE", "MEETING"];

const getType = (item) => (item?.type || "NOTE").toUpperCase();

const getIconByType = (type) => {
  switch (type) {
    case "CALL":
      return <FiPhone className="h-4 w-4" />;
    case "EMAIL":
      return <FiMail className="h-4 w-4" />;
    case "MEETING":
      return <FiVideo className="h-4 w-4" />;
    case "STATUS_CHANGE":
      return <FiCheckCircle className="h-4 w-4" />;
    case "NOTE":
    default:
      return <FiMessageSquare className="h-4 w-4" />;
  }
};

const isImportantActivity = (item) => {
  const type = getType(item);
  if (type === "STATUS_CHANGE") return true;
  const message = getMessage(item).toLowerCase();
  return message.includes("moved") || message.includes("stage") || message.includes("qualified");
};

const normalizeFilters = (filters = {}) => ({
  type: filters.type || "ALL",
  q: filters.q || "",
  user: filters.user || "",
  from: filters.from || "",
  to: filters.to || "",
});

const metadataEntries = (item) => {
  const metadata = item?.metadata || item?.meta || {};
  return Object.entries(metadata).slice(0, 3);
};

export default function ActivityTimeline({ data, isLoading, filters, onFiltersChange }) {
  const currentFilters = normalizeFilters(filters);
  const activities = normalizeList(data)
    .filter((item) => {
      const type = getType(item);
      if (currentFilters.type !== "ALL" && currentFilters.type !== type) return false;

      const text = `${getMessage(item)} ${item.user_name || item.user || item.actor || ""}`.toLowerCase();
      if (currentFilters.q && !text.includes(currentFilters.q.toLowerCase())) return false;

      const actor = String(item.user_name || item.user || item.actor || "").toLowerCase();
      if (currentFilters.user && !actor.includes(currentFilters.user.toLowerCase())) return false;

      const ts = new Date(item.created_at || item.timestamp || Date.now()).getTime();
      if (currentFilters.from) {
        const fromTs = new Date(currentFilters.from).getTime();
        if (!Number.isNaN(fromTs) && ts < fromTs) return false;
      }
      if (currentFilters.to) {
        const toTs = new Date(currentFilters.to).getTime();
        if (!Number.isNaN(toTs) && ts > toTs + 86399999) return false;
      }
      return true;
    })
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at || b.timestamp || 0).getTime() -
        new Date(a.created_at || a.timestamp || 0).getTime()
    );

  const grouped = groupByDate(activities);
  const dates = Object.keys(grouped);

  return (
    <Card extra="h-full rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
      <div className="mb-4 flex flex-col gap-3">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">Activity Timeline</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2">
            <FiSearch className="pointer-events-none absolute left-3 top-2.5 text-gray-400" />
            <input
              value={currentFilters.q}
              onChange={(e) => onFiltersChange?.({ ...currentFilters, q: e.target.value })}
              placeholder="Search activities"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </label>

          <select
            value={currentFilters.type}
            onChange={(e) => onFiltersChange?.({ ...currentFilters, type: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          >
            {activityTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All Types" : type.replace("_", " ")}
              </option>
            ))}
          </select>

          <input
            value={currentFilters.user}
            onChange={(e) => onFiltersChange?.({ ...currentFilters, user: e.target.value })}
            placeholder="User"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />

          <div className="flex gap-2 xl:col-span-1">
            <input
              type="date"
              value={currentFilters.from}
              onChange={(e) => onFiltersChange?.({ ...currentFilters, from: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
            <input
              type="date"
              value={currentFilters.to}
              onChange={(e) => onFiltersChange?.({ ...currentFilters, to: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : dates.length === 0 ? (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-white/20 dark:text-gray-400">
          No activities yet
        </div>
      ) : (
        <div className="max-h-[520px] space-y-5 overflow-y-auto pr-2">
          {dates.map((dateKey) => (
            <div key={dateKey}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                {dateKey}
              </p>
              <div className="space-y-2">
                {grouped[dateKey].map((item, idx) => (
                  <div
                    key={item.id || `${dateKey}-${idx}`}
                    className={`rounded-xl border bg-white p-3 transition-colors hover:bg-gray-50 dark:bg-navy-900 dark:hover:bg-navy-700 ${
                      isImportantActivity(item)
                        ? "border-amber-300 shadow-sm dark:border-amber-300/50"
                        : "border-gray-200 dark:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-brand-500">
                        {getIconByType(getType(item))}
                        <span>{getType(item)}</span>
                        {isImportantActivity(item) ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                            Important
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {new Date(item.created_at || item.timestamp || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-navy-700 dark:text-white">{getMessage(item)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <FiUser className="h-3 w-3" />
                        {item.user_name || item.user || item.actor || "System"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="h-3 w-3" />
                        {new Date(item.created_at || item.timestamp || Date.now()).toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar className="h-3 w-3" />
                        {dateKey}
                      </span>
                    </div>

                    {metadataEntries(item).length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {metadataEntries(item).map(([key, value]) => (
                          <span
                            key={key}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-white/10 dark:text-gray-300"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
