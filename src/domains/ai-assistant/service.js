import api from "api/client";
import {
  buildContactContext,
  buildDashboardContext,
  buildDealContext,
  buildGraphContext,
  buildWorkspaceContext,
} from "domains/ai-context/service";
import {
  addPinnedEntity,
  appendConversationEntry,
  getWorkspaceMemory,
  inferPreferencePatch,
  updateMemoryPreferences,
} from "./memory";
import { buildPromptEnvelope, selectTemplate } from "./promptTemplates";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";

const normalizeResponse = (payload) => {
  if (!payload || typeof payload !== "object") {
    return {
      answer: "I could not generate a response right now.",
      insights: [],
      suggestions: [],
      relatedEntities: [],
    };
  }

  return {
    answer: payload.answer || "No answer available.",
    insights: Array.isArray(payload.insights) ? payload.insights : [],
    suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
    relatedEntities: Array.isArray(payload.relatedEntities) ? payload.relatedEntities : [],
  };
};

const parseIntent = (message = "") => {
  const text = String(message).toLowerCase();

  if (text.includes("top deal") || text.includes("largest deal")) return "top_deals";
  if (text.includes("most active contact") || text.includes("active contact")) return "active_contacts";
  if (text.includes("pipeline slow") || text.includes("bottleneck") || text.includes("pipeline")) return "pipeline";
  if (text.includes("risk") || text.includes("at risk")) return "risk";
  if (text.includes("next action") || text.includes("what should i do") || text.includes("suggest")) return "next_actions";
  if (text.includes("revenue") || text.includes("trend")) return "revenue";
  if (text.includes("summary")) return "summary";
  return "general";
};

const persistMemoryFromInteraction = ({ workspaceId, userMessage, response }) => {
  const preferencePatch = inferPreferencePatch(userMessage);
  if (Object.keys(preferencePatch).length > 0) {
    updateMemoryPreferences(workspaceId, preferencePatch);
  }

  appendConversationEntry(workspaceId, {
    role: "user",
    content: userMessage,
    view: "workspace",
    createdAt: Date.now(),
  });

  appendConversationEntry(workspaceId, {
    role: "assistant",
    content: response?.answer || "",
    structured: response,
    view: "workspace",
    createdAt: Date.now(),
  });

  (response?.relatedEntities || []).slice(0, 3).forEach((entity) => {
    if (entity?.type && entity?.id) {
      addPinnedEntity(workspaceId, {
        type: entity.type,
        id: entity.id,
        name: entity.name,
      });
    }
  });
};

const summarizePipeline = (context) => {
  const stages = context?.workspace?.pipelineSummary?.stages || [];
  const bottleneck = context?.workspace?.pipelineSummary?.bottleneck;

  if (!stages.length) {
    return {
      answer: "Pipeline summary is currently unavailable.",
      insights: ["No funnel stage data found in the workspace snapshot."],
      suggestions: ["Add or sync pipeline stage data for richer analysis."],
      relatedEntities: [],
    };
  }

  return {
    answer: bottleneck
      ? `Your largest pipeline concentration is in ${bottleneck.stage} (${bottleneck.count} deals).`
      : "Pipeline is distributed across stages.",
    insights: stages.slice(0, 5).map(
      (stage) => `${stage.stage}: ${stage.count} deals (${stage.share}% of pipeline)`
    ),
    suggestions: [
      "Review deals in the largest stage for qualification blockers.",
      "Set stage exit SLAs to reduce stagnation.",
      "Prioritize high-value deals with no recent activity.",
    ],
    relatedEntities: stages.slice(0, 3).map((stage) => ({
      type: "stage",
      name: stage.stage,
    })),
  };
};

const buildFallbackAnswer = ({ message, context }) => {
  const intent = parseIntent(message);
  const topDeals = context?.workspace?.topDeals || [];
  const riskDeals = context?.workspace?.riskDeals || [];
  const activeContacts = context?.analyticsSnapshot?.contact?.mostEngagedContacts || [];
  const stats = context?.workspace?.stats || {};

  if (intent === "top_deals") {
    return {
      answer: `You currently have ${topDeals.length} top-value deals worth a combined ${topDeals
        .reduce((acc, deal) => acc + Number(deal.value || 0), 0)
        .toLocaleString()}.`,
      insights: topDeals.slice(0, 5).map(
        (deal) => `${deal.name || `Deal ${deal.id}`}: $${Number(deal.value || 0).toLocaleString()}`
      ),
      suggestions: [
        "Review next milestones for the top 3 deals.",
        "Ensure stakeholders are mapped for each high-value deal.",
      ],
      relatedEntities: topDeals.slice(0, 5).map((deal) => ({ type: "deal", id: deal.id, name: deal.name })),
    };
  }

  if (intent === "active_contacts") {
    return {
      answer: `Most active contacts are based on engagement signals from deals and activities.`,
      insights: activeContacts.slice(0, 5).map(
        (contact) => `${contact.name}: engagement ${contact.engagement}`
      ),
      suggestions: [
        "Schedule follow-ups with top engaged contacts this week.",
        "Use lead scores to prioritize outreach cadence.",
      ],
      relatedEntities: activeContacts.slice(0, 5).map((contact) => ({
        type: "contact",
        id: contact.contactId,
        name: contact.name,
      })),
    };
  }

  if (intent === "pipeline") {
    return summarizePipeline(context);
  }

  if (intent === "risk") {
    return {
      answer: `I found ${riskDeals.length} deals with medium-to-high risk indicators.`,
      insights: riskDeals.slice(0, 5).map(
        (deal) => `${deal.name}: ${deal.riskLevel} risk, ${deal.daysSinceUpdate} days since update`
      ),
      suggestions: [
        "Trigger follow-up tasks for high-risk deals immediately.",
        "Escalate stalled high-value deals to senior reps.",
      ],
      relatedEntities: riskDeals.slice(0, 5).map((deal) => ({
        type: "deal",
        id: deal.id,
        name: deal.name,
      })),
    };
  }

  if (intent === "next_actions") {
    const pipelineResponse = summarizePipeline(context);
    return {
      answer: "Based on your current CRM signals, here are the highest-impact next actions.",
      insights: pipelineResponse.insights.slice(0, 3),
      suggestions: [
        "Focus on deals with no activity in the last 10+ days.",
        "Contact top engaged contacts with open deal opportunities.",
        "Run a stage-by-stage review for conversion bottlenecks.",
      ],
      relatedEntities: [
        ...(riskDeals.slice(0, 3).map((deal) => ({ type: "deal", id: deal.id, name: deal.name })) || []),
      ],
    };
  }

  if (intent === "revenue") {
    return {
      answer: "Workspace revenue trend insights are generated from deal value and activity momentum.",
      insights: [
        `Total deal value in pipeline: $${Number(stats.totalDealValue || 0).toLocaleString()}`,
        `Won deals: ${stats.wonDeals || 0}`,
        `Total deals: ${stats.totalDeals || 0}`,
      ],
      suggestions: [
        "Increase win rate by prioritizing late-stage deals with clear next steps.",
        "Use activity volume trends to forecast weekly deal movement.",
      ],
      relatedEntities: topDeals.slice(0, 3).map((deal) => ({ type: "deal", id: deal.id, name: deal.name })),
    };
  }

  if (intent === "summary") {
    return {
      answer: "Here is your current CRM workspace summary.",
      insights: [
        `Deals: ${stats.totalDeals || 0}`,
        `Contacts: ${stats.totalContacts || 0}`,
        `Activities: ${stats.totalActivities || 0}`,
      ],
      suggestions: [
        "Open Analytics to review conversion and activity trends.",
        "Use the Relationship Graph to identify influence paths.",
      ],
      relatedEntities: [],
    };
  }

  return {
    answer: "I can help with deal summaries, pipeline bottlenecks, contact engagement, risks, and next actions.",
    insights: [
      "Try: 'What are my top deals?'",
      "Try: 'Show pipeline insights'",
      "Try: 'Suggest next actions for this workspace'",
    ],
    suggestions: [
      "Ask for a deal summary when viewing a specific deal page.",
      "Ask for contact intelligence when viewing a contact page.",
    ],
    relatedEntities: [],
  };
};

export const getAIContext = async (workspaceId, currentView, selectedEntityId) => {
  const effectiveWorkspaceId = workspaceId || getWorkspaceId();
  const view = currentView || "workspace";

  if (view === "deal" && selectedEntityId) return buildDealContext(selectedEntityId);
  if (view === "contact" && selectedEntityId) return buildContactContext(selectedEntityId);
  if (view === "dashboard") return buildDashboardContext();
  if (view === "graph") return buildGraphContext();
  void effectiveWorkspaceId;
  return buildWorkspaceContext();
};

export const sendAIMessage = async (payload) => {
  const workspaceId = payload?.context?.workspaceId || getWorkspaceId();
  const context =
    payload?.context?.snapshot ||
    (await getAIContext(
      workspaceId,
      payload?.context?.currentView,
      payload?.context?.selectedEntityId
    ));

  const intent = parseIntent(payload?.message || "");
  const memory = getWorkspaceMemory(workspaceId);
  const template = selectTemplate({
    intent,
    currentView: payload?.context?.currentView,
  });

  const promptEnvelope = buildPromptEnvelope({
    message: payload?.message,
    context,
    template,
    memory,
  });

  const normalizedPayload = {
    message: payload?.message || "",
    context: {
      ...(payload?.context || {}),
      snapshot: context,
    },
    template: {
      id: template.id,
      title: template.title,
    },
    promptEnvelope,
  };

  try {
    const res = await api.post("/ai-assistant/chat/", normalizedPayload);
    const response = normalizeResponse(res.data?.data);
    persistMemoryFromInteraction({
      workspaceId,
      userMessage: payload?.message,
      response,
    });
    return response;
  } catch (_error) {
    const response = normalizeResponse(buildFallbackAnswer({
      message: payload?.message,
      context,
    }));
    persistMemoryFromInteraction({
      workspaceId,
      userMessage: payload?.message,
      response,
    });
    return response;
  }
};

export const summarizeDeal = async (dealId) => {
  try {
    const res = await api.get(`/ai-assistant/deals/${dealId}/summary/`);
    return normalizeResponse(res.data?.data);
  } catch (_error) {
    const context = await buildDealContext(dealId);
    const deal = context?.currentEntity?.data || {};

    return normalizeResponse({
      answer: `${deal.name || `Deal ${dealId}`} is currently in ${deal.stage_name || deal.stage?.name || "an active stage"}.`,
      insights: [
        `Deal value: $${Number(deal.value || 0).toLocaleString()}`,
        `Status: ${deal.status || "Open"}`,
        `Recent activities: ${context?.recentActivity?.length || 0}`,
      ],
      suggestions: [
        "Confirm next meeting and decision criteria.",
        "Update stakeholder map and risks.",
      ],
      relatedEntities: [
        { type: "deal", id: deal.id || dealId, name: deal.name || `Deal ${dealId}` },
      ],
    });
  }
};

export const summarizeContact = async (contactId) => {
  try {
    const res = await api.get(`/ai-assistant/contacts/${contactId}/summary/`);
    return normalizeResponse(res.data?.data);
  } catch (_error) {
    const context = await buildContactContext(contactId);
    const contact = context?.currentEntity?.data || {};

    return normalizeResponse({
      answer: `${contact.name || `Contact ${contactId}`} has a ${contact?.score?.level || "low"} lead score profile.`,
      insights: [
        `Lead score: ${contact?.score?.score || 0}`,
        `Recent activities: ${context?.recentActivity?.length || 0}`,
        `Email: ${contact?.email || "-"}`,
      ],
      suggestions: [
        "Personalize follow-up using recent interaction topics.",
        "Link this contact to active opportunities if missing.",
      ],
      relatedEntities: [
        { type: "contact", id: contact.id || contactId, name: contact.name || `Contact ${contactId}` },
      ],
    });
  }
};

export const summarizeWorkspace = async () => {
  try {
    const res = await api.get("/ai-assistant/workspace/summary/");
    return normalizeResponse(res.data?.data);
  } catch (_error) {
    const context = await buildWorkspaceContext();
    const stats = context?.workspace?.stats || {};
    const bottleneck = context?.workspace?.pipelineSummary?.bottleneck;

    return normalizeResponse({
      answer: "Workspace summary generated from live CRM intelligence context.",
      insights: [
        `Deals: ${stats.totalDeals || 0}`,
        `Contacts: ${stats.totalContacts || 0}`,
        `Activities: ${stats.totalActivities || 0}`,
        bottleneck ? `Largest stage concentration: ${bottleneck.stage}` : "No stage bottleneck detected",
      ],
      suggestions: [
        "Review high-value stale deals for immediate action.",
        "Use analytics to optimize stage conversion.",
      ],
      relatedEntities: (context?.workspace?.topDeals || []).slice(0, 3).map((deal) => ({
        type: "deal",
        id: deal.id,
        name: deal.name,
      })),
    });
  }
};
