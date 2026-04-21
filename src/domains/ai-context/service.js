import { getActivities } from "domains/activities/service";
import {
  getActivityAnalytics,
  getContactAnalytics,
  getDealAnalytics,
} from "domains/analytics/service";
import { getNormalizedWorkspaceData } from "domains/ai-ready/service";
import { getContactById, getContacts } from "domains/contacts/service";
import { getDealActivities, getDealById, getDeals } from "domains/deals/service";
import { getWorkspaceGraph } from "domains/graph/service";
import { getDealContacts } from "domains/relationships/service";
import { getContactScore, getLeadScores } from "domains/scoring/service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

const byNewest = (a, b) => {
  const aDate = new Date(a?.updated_at || a?.created_at || a?.timestamp || 0).getTime();
  const bDate = new Date(b?.updated_at || b?.created_at || b?.timestamp || 0).getTime();
  return bDate - aDate;
};

const byValueDesc = (a, b) => Number(b?.value || 0) - Number(a?.value || 0);

const toDays = (value) => {
  const ts = new Date(value || Date.now()).getTime();
  if (Number.isNaN(ts)) return 9999;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
};

const buildPipelineSummary = (funnel = []) => {
  const safeFunnel = Array.isArray(funnel) ? funnel : [];
  const total = safeFunnel.reduce((acc, stage) => acc + Number(stage.count || 0), 0);

  const stages = safeFunnel.map((stage) => ({
    stage: stage.stage,
    count: Number(stage.count || 0),
    share: total ? Math.round((Number(stage.count || 0) / total) * 100) : 0,
  }));

  const bottleneck = stages.length
    ? stages.slice().sort((a, b) => b.count - a.count)[0]
    : null;

  return {
    total,
    stages,
    bottleneck,
  };
};

const buildRiskDeals = (deals = [], leadScores = []) => {
  const scoreByContact = new Map();
  (Array.isArray(leadScores) ? leadScores : []).forEach((entry) => {
    scoreByContact.set(String(entry.contactId), entry);
  });

  return deals
    .map((deal) => {
      const daysSinceUpdate = toDays(deal.updated_at || deal.created_at);
      const contactId = deal.contact_id || deal.contact?.id || deal.primary_contact_id;
      const contactScore = scoreByContact.get(String(contactId));
      const stageName = String(deal.stage_name || deal.stage?.name || deal.stage || "").toLowerCase();
      const staleScore = daysSinceUpdate > 21 ? 2 : daysSinceUpdate > 10 ? 1 : 0;
      const earlyStageScore =
        stageName.includes("new") || stageName.includes("lead") || stageName.includes("qualified")
          ? 1
          : 0;
      const lowEngagementScore = contactScore?.level === "low" ? 1 : 0;
      const riskScore = staleScore + earlyStageScore + lowEngagementScore;

      return {
        id: deal.id,
        name: deal.name || `Deal ${deal.id}`,
        value: Number(deal.value || 0),
        stage: deal.stage_name || deal.stage?.name || deal.stage || "Unknown",
        daysSinceUpdate,
        riskLevel: riskScore >= 3 ? "high" : riskScore === 2 ? "medium" : "low",
      };
    })
    .filter((deal) => deal.riskLevel !== "low")
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
    .slice(0, 6);
};

const buildWorkspaceStats = (deals = [], activities = [], contacts = []) => {
  const totalValue = deals.reduce((acc, deal) => acc + Number(deal.value || 0), 0);
  const wonDeals = deals.filter((deal) => String(deal.status || "").toLowerCase().includes("won"));

  return {
    totalDeals: deals.length,
    totalContacts: contacts.length,
    totalActivities: activities.length,
    totalDealValue: totalValue,
    wonDeals: wonDeals.length,
  };
};

export const buildWorkspaceContext = async () => {
  const workspaceId = getWorkspaceId();

  const [dealsRaw, contactsRaw, activitiesRaw, dealAnalytics, activityAnalytics, contactAnalytics, aiReadyData, leadScores] =
    await Promise.all([
      getDeals(),
      getContacts(),
      getActivities({ page_size: 100 }),
      getDealAnalytics(),
      getActivityAnalytics(),
      getContactAnalytics(),
      getNormalizedWorkspaceData(),
      getLeadScores(),
    ]);

  const deals = normalizeList(dealsRaw);
  const contacts = normalizeList(contactsRaw);
  const activities = normalizeList(activitiesRaw).slice().sort(byNewest);
  const topDeals = deals.slice().sort(byValueDesc).slice(0, 5);

  return {
    workspace: {
      stats: buildWorkspaceStats(deals, activities, contacts),
      pipelineSummary: buildPipelineSummary(dealAnalytics?.funnel),
      topDeals,
      riskDeals: buildRiskDeals(deals, leadScores),
    },
    currentEntity: {
      type: "workspace",
      data: {
        workspaceId,
      },
    },
    recentActivity: activities.slice(0, 10),
    relationships: aiReadyData?.relationships || [],
    analyticsSnapshot: {
      deal: dealAnalytics,
      activity: activityAnalytics,
      contact: contactAnalytics,
    },
  };
};

export const buildDealContext = async (dealId) => {
  const [workspaceContext, deal, dealActivitiesRaw, dealContactsRaw] = await Promise.all([
    buildWorkspaceContext(),
    getDealById(dealId),
    getDealActivities(dealId, { page_size: 50 }),
    getDealContacts(dealId).catch(() => []),
  ]);

  const dealActivities = normalizeList(dealActivitiesRaw).slice().sort(byNewest);
  const dealContacts = normalizeList(dealContactsRaw);

  return {
    ...workspaceContext,
    currentEntity: {
      type: "deal",
      data: {
        ...deal,
        linkedContacts: dealContacts,
      },
    },
    recentActivity: dealActivities.slice(0, 15),
    relationships: workspaceContext.relationships.filter((edge) => {
      const targetDealId = `deal:${dealId}`;
      return edge?.from === targetDealId || edge?.to === targetDealId;
    }),
  };
};

export const buildDashboardContext = async () => {
  const workspaceContext = await buildWorkspaceContext();

  return {
    ...workspaceContext,
    currentEntity: {
      type: "dashboard",
      data: workspaceContext.workspace,
    },
  };
};

export const buildGraphContext = async () => {
  const [workspaceContext, graphData] = await Promise.all([
    buildWorkspaceContext(),
    getWorkspaceGraph(),
  ]);

  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

  return {
    ...workspaceContext,
    currentEntity: {
      type: "graph",
      data: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        typeDistribution: nodes.reduce((acc, node) => {
          acc[node.type] = (acc[node.type] || 0) + 1;
          return acc;
        }, {}),
      },
    },
    relationships: edges,
  };
};

export const buildContactContext = async (contactId) => {
  const [workspaceContext, contact, activitiesRaw, score] = await Promise.all([
    buildWorkspaceContext(),
    getContactById(contactId),
    getActivities({ contact_id: contactId, page_size: 50 }).catch(() => []),
    getContactScore(contactId),
  ]);

  const contactActivities = normalizeList(activitiesRaw).slice().sort(byNewest);

  return {
    ...workspaceContext,
    currentEntity: {
      type: "contact",
      data: {
        ...contact,
        score,
      },
    },
    recentActivity: contactActivities.slice(0, 15),
    relationships: workspaceContext.relationships.filter((edge) => {
      const targetId = `contact:${contactId}`;
      return edge?.from === targetId || edge?.to === targetId;
    }),
  };
};
