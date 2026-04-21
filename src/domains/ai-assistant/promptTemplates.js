const PROMPT_TEMPLATES = {
  general: {
    id: "general",
    title: "General CRM Assistant",
    instruction:
      "Answer as a CRM copilot. Be practical, business-aware, and cite concrete workspace signals when available.",
    outputStyle: "structured",
  },
  top_deals: {
    id: "top_deals",
    title: "Top Deals Analysis",
    instruction:
      "Rank and summarize highest-value opportunities, highlight urgency and actionability.",
    outputStyle: "structured",
  },
  active_contacts: {
    id: "active_contacts",
    title: "Contact Engagement Analysis",
    instruction:
      "Focus on contact engagement, activity momentum, and lead score implications.",
    outputStyle: "structured",
  },
  pipeline: {
    id: "pipeline",
    title: "Pipeline Diagnostics",
    instruction:
      "Explain bottlenecks, conversion friction, and where movement is stalling.",
    outputStyle: "structured",
  },
  risk: {
    id: "risk",
    title: "Risk Intelligence",
    instruction:
      "Detect at-risk deals and provide prevention recommendations ordered by impact.",
    outputStyle: "structured",
  },
  next_actions: {
    id: "next_actions",
    title: "Action Planner",
    instruction:
      "Generate prioritized next actions with rationale and likely outcomes.",
    outputStyle: "structured",
  },
  revenue: {
    id: "revenue",
    title: "Revenue Trend Analyzer",
    instruction:
      "Interpret revenue and win/loss trends using available analytics.",
    outputStyle: "structured",
  },
  summary: {
    id: "summary",
    title: "Executive Summary",
    instruction:
      "Provide a concise executive summary of workspace performance.",
    outputStyle: "structured",
  },
};

const VIEW_TEMPLATE_PRIORITY = {
  deal: ["summary", "next_actions", "risk"],
  contact: ["active_contacts", "summary", "next_actions"],
  dashboard: ["summary", "revenue", "pipeline"],
  analytics: ["revenue", "pipeline", "summary"],
  kanban: ["pipeline", "risk", "next_actions"],
  graph: ["summary", "pipeline", "active_contacts"],
  workspace: ["summary", "next_actions", "pipeline"],
};

export const getPromptTemplateRegistry = () => PROMPT_TEMPLATES;

export const getTemplateByIntent = (intent) => {
  return PROMPT_TEMPLATES[intent] || PROMPT_TEMPLATES.general;
};

export const getViewDefaultTemplate = (currentView = "workspace") => {
  const priorities = VIEW_TEMPLATE_PRIORITY[currentView] || VIEW_TEMPLATE_PRIORITY.workspace;
  const first = priorities[0] || "general";
  return getTemplateByIntent(first);
};

export const selectTemplate = ({ intent, currentView }) => {
  if (intent && PROMPT_TEMPLATES[intent]) {
    return PROMPT_TEMPLATES[intent];
  }
  return getViewDefaultTemplate(currentView);
};

const buildStyleInstruction = (responseStyle = "concise") => {
  if (responseStyle === "detailed") {
    return "Use detailed reasoning, include 4-6 insights, and provide clear decision rationale.";
  }
  return "Keep response concise and actionable, with no fluff.";
};

export const buildPromptEnvelope = ({
  message,
  context,
  template,
  memory,
}) => {
  const responseStyle = memory?.preferences?.responseStyle || "concise";
  const focusAreas = Array.isArray(memory?.preferences?.focusAreas)
    ? memory.preferences.focusAreas
    : [];

  const systemPrompt = [
    "You are an embedded AI CRM copilot.",
    template?.instruction || PROMPT_TEMPLATES.general.instruction,
    buildStyleInstruction(responseStyle),
    focusAreas.length ? `Prioritize focus areas: ${focusAreas.join(", ")}.` : "",
    "Output JSON with keys: answer, insights, suggestions, relatedEntities.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    templateId: template?.id || "general",
    templateTitle: template?.title || "General CRM Assistant",
    systemPrompt,
    userPrompt: message || "",
    contextSnapshot: context,
    memorySnapshot: {
      preferences: memory?.preferences || {},
      pinnedEntities: memory?.pinnedEntities || [],
      recentConversation: (memory?.conversation || []).slice(-6),
    },
  };
};
