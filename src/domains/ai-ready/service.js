import api from "api/client";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

const buildRelationships = ({ deals, activities }) => {
  const rel = [];

  deals.forEach((deal) => {
    const contactId = deal.contact_id || deal.contact?.id || deal.primary_contact_id;
    if (contactId) {
      rel.push({ from: `contact:${contactId}`, to: `deal:${deal.id}`, type: "contact_deal" });
    }
  });

  activities.forEach((activity) => {
    const dealId = activity.deal_id || activity.deal;
    const contactId = activity.contact_id || activity.contact;

    if (dealId) {
      rel.push({ from: `deal:${dealId}`, to: `activity:${activity.id}`, type: "deal_activity" });
    }
    if (contactId) {
      rel.push({ from: `contact:${contactId}`, to: `activity:${activity.id}`, type: "contact_activity" });
    }
  });

  return rel;
};

const buildTimeline = ({ deals, activities }) => {
  const dealEvents = deals.map((deal) => ({
    entityId: `deal:${deal.id}`,
    eventType: "deal.updated",
    timestamp: deal.updated_at || deal.created_at || new Date().toISOString(),
  }));

  const activityEvents = activities.map((activity) => ({
    entityId: `activity:${activity.id}`,
    eventType: String(activity.type || "activity.created").toLowerCase(),
    timestamp: activity.created_at || activity.timestamp || new Date().toISOString(),
  }));

  return [...dealEvents, ...activityEvents].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

const buildFallbackData = async () => {
  const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
    api.get("/contacts/"),
    api.get("/deals/"),
    api.get("/activities/"),
  ]);

  const contacts = normalizeList(contactsRes.data?.data);
  const deals = normalizeList(dealsRes.data?.data);
  const activities = normalizeList(activitiesRes.data?.data);

  return {
    entities: {
      contacts,
      deals,
      activities,
    },
    relationships: buildRelationships({ deals, activities }),
    timeline: buildTimeline({ deals, activities }),
    metadata: {
      workspaceId: localStorage.getItem("workspace_id") || "default",
      generatedAt: new Date().toISOString(),
    },
  };
};

export const getNormalizedWorkspaceData = async () => {
  try {
    const res = await api.get("/ai-ready/workspace/");
    return res.data?.data;
  } catch (_error) {
    return buildFallbackData();
  }
};
