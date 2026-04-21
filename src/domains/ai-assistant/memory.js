const STORAGE_PREFIX = "crm_ai_memory_v1";

const buildStorageKey = (workspaceId) => `${STORAGE_PREFIX}:${workspaceId || "default"}`;

const defaultMemory = {
  preferences: {
    responseStyle: "concise",
    focusAreas: ["pipeline", "risk", "next_actions"],
  },
  pinnedEntities: [],
  conversation: [],
  lastUpdatedAt: null,
};

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

const nowIso = () => new Date().toISOString();

export const getWorkspaceMemory = (workspaceId) => {
  const raw = localStorage.getItem(buildStorageKey(workspaceId));
  const parsed = safeParse(raw);

  if (!parsed || typeof parsed !== "object") {
    return { ...defaultMemory };
  }

  return {
    ...defaultMemory,
    ...parsed,
    preferences: {
      ...defaultMemory.preferences,
      ...(parsed.preferences || {}),
    },
    pinnedEntities: Array.isArray(parsed.pinnedEntities) ? parsed.pinnedEntities : [],
    conversation: Array.isArray(parsed.conversation) ? parsed.conversation : [],
  };
};

export const saveWorkspaceMemory = (workspaceId, memory) => {
  const payload = {
    ...defaultMemory,
    ...(memory || {}),
    lastUpdatedAt: nowIso(),
  };

  localStorage.setItem(buildStorageKey(workspaceId), JSON.stringify(payload));
  return payload;
};

export const appendConversationEntry = (workspaceId, entry) => {
  const memory = getWorkspaceMemory(workspaceId);

  const nextConversation = [
    ...(memory.conversation || []),
    {
      id: entry?.id || `msg-${Date.now()}`,
      role: entry?.role || "assistant",
      content: entry?.content || "",
      structured: entry?.structured || null,
      view: entry?.view || "workspace",
      createdAt: entry?.createdAt || Date.now(),
    },
  ].slice(-40);

  return saveWorkspaceMemory(workspaceId, {
    ...memory,
    conversation: nextConversation,
  });
};

export const clearConversationMemory = (workspaceId) => {
  const memory = getWorkspaceMemory(workspaceId);

  return saveWorkspaceMemory(workspaceId, {
    ...memory,
    conversation: [],
  });
};

export const updateMemoryPreferences = (workspaceId, patch = {}) => {
  const memory = getWorkspaceMemory(workspaceId);

  const preferences = {
    ...(memory.preferences || {}),
    ...(patch || {}),
  };

  return saveWorkspaceMemory(workspaceId, {
    ...memory,
    preferences,
  });
};

export const addPinnedEntity = (workspaceId, entity) => {
  if (!entity?.type || !entity?.id) return getWorkspaceMemory(workspaceId);

  const memory = getWorkspaceMemory(workspaceId);
  const key = `${entity.type}:${entity.id}`;

  const deduped = (memory.pinnedEntities || []).filter(
    (item) => `${item.type}:${item.id}` !== key
  );

  const nextPinned = [{ ...entity, pinnedAt: nowIso() }, ...deduped].slice(0, 20);

  return saveWorkspaceMemory(workspaceId, {
    ...memory,
    pinnedEntities: nextPinned,
  });
};

export const inferPreferencePatch = (message = "") => {
  const text = String(message || "").toLowerCase();

  const patch = {};

  if (text.includes("short") || text.includes("brief") || text.includes("concise")) {
    patch.responseStyle = "concise";
  }

  if (text.includes("detailed") || text.includes("deep") || text.includes("thorough")) {
    patch.responseStyle = "detailed";
  }

  if (text.includes("risk") || text.includes("at risk")) {
    patch.focusAreas = ["risk", "pipeline", "next_actions"];
  }

  if (text.includes("pipeline") || text.includes("stage")) {
    patch.focusAreas = ["pipeline", "conversion", "next_actions"];
  }

  return patch;
};
