import api from "api/client";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

const buildGraphFromEntities = ({ contacts, deals, activities, entityId }) => {
  const contactNodes = contacts.map((contact) => ({
    id: `contact:${contact.id}`,
    type: "contact",
    label: contact.name || contact.email || `Contact ${contact.id}`,
    metadata: contact,
  }));

  const dealNodes = deals.map((deal) => ({
    id: `deal:${deal.id}`,
    type: "deal",
    label: deal.name || `Deal ${deal.id}`,
    metadata: deal,
  }));

  const activityNodes = activities.map((activity) => ({
    id: `activity:${activity.id}`,
    type: "activity",
    label: activity.note || activity.message || activity.type || `Activity ${activity.id}`,
    metadata: activity,
  }));

  const contactLookup = new Set(contacts.map((contact) => String(contact.id)));
  const dealLookup = new Set(deals.map((deal) => String(deal.id)));

  const edges = [];

  deals.forEach((deal) => {
    const contactId = deal.contact_id || deal.contact?.id || deal.primary_contact_id;
    if (contactId && contactLookup.has(String(contactId))) {
      edges.push({
        from: `contact:${contactId}`,
        to: `deal:${deal.id}`,
        relation: "owns_deal",
      });
    }
  });

  activities.forEach((activity) => {
    const dealId = activity.deal_id || activity.deal;
    const contactId = activity.contact_id || activity.contact;

    if (dealId && dealLookup.has(String(dealId))) {
      edges.push({
        from: `deal:${dealId}`,
        to: `activity:${activity.id}`,
        relation: "has_activity",
      });
    }

    if (contactId && contactLookup.has(String(contactId))) {
      edges.push({
        from: `contact:${contactId}`,
        to: `activity:${activity.id}`,
        relation: "performed_activity",
      });
    }
  });

  const allNodes = [...contactNodes, ...dealNodes, ...activityNodes];
  if (!entityId) return { nodes: allNodes, edges };

  const normalizedEntityId = String(entityId).includes(":") ? String(entityId) : `deal:${entityId}`;

  const connectedNodeIds = new Set([normalizedEntityId]);
  edges.forEach((edge) => {
    if (edge.from === normalizedEntityId || edge.to === normalizedEntityId) {
      connectedNodeIds.add(edge.from);
      connectedNodeIds.add(edge.to);
    }
  });

  return {
    nodes: allNodes.filter((node) => connectedNodeIds.has(node.id)),
    edges: edges.filter((edge) => connectedNodeIds.has(edge.from) && connectedNodeIds.has(edge.to)),
  };
};

const buildFallbackGraph = async (entityId) => {
  const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
    api.get("/contacts/"),
    api.get("/deals/"),
    api.get("/activities/"),
  ]);

  return buildGraphFromEntities({
    contacts: normalizeList(contactsRes.data?.data),
    deals: normalizeList(dealsRes.data?.data),
    activities: normalizeList(activitiesRes.data?.data),
    entityId,
  });
};

export const getEntityGraph = async (entityId) => {
  try {
    const res = await api.get(`/graph/entities/${entityId}/`);
    return res.data?.data;
  } catch (_error) {
    return buildFallbackGraph(entityId);
  }
};

export const getWorkspaceGraph = async () => {
  try {
    const res = await api.get("/graph/workspace/");
    return res.data?.data;
  } catch (_error) {
    return buildFallbackGraph();
  }
};
