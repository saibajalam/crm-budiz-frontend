import api from "api/client";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

const daysSince = (value) => {
  const date = new Date(value || Date.now()).getTime();
  if (Number.isNaN(date)) return 9999;
  const diff = Date.now() - date;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const computeContactScore = ({ contact, deals, activities }) => {
  const relatedDeals = deals.filter(
    (deal) => String(deal.contact_id || deal.contact?.id || deal.primary_contact_id) === String(contact.id)
  );

  const relatedActivities = activities.filter(
    (activity) => String(activity.contact_id || activity.contact) === String(contact.id)
  );

  const dealsScore = relatedDeals.length * 14;
  const valueScore = relatedDeals.reduce((acc, deal) => acc + Number(deal.value || 0), 0) / 1000;
  const activityScore = relatedActivities.length * 4;

  const mostRecentDays = relatedActivities.length
    ? Math.min(...relatedActivities.map((activity) => daysSince(activity.created_at || activity.timestamp)))
    : 9999;

  const recentMultiplier = mostRecentDays <= 7 ? 1.2 : mostRecentDays <= 30 ? 1.05 : 0.9;

  const progressionScore = relatedDeals.reduce((acc, deal) => {
    const stage = String(deal.stage_name || deal.stage?.name || deal.stage || "").toLowerCase();
    if (stage.includes("qualified")) return acc + 8;
    if (stage.includes("proposal")) return acc + 10;
    if (stage.includes("negotiation")) return acc + 12;
    if (stage.includes("closed") || stage.includes("won")) return acc + 16;
    return acc + 3;
  }, 0);

  const raw = (dealsScore + valueScore + activityScore + progressionScore) * recentMultiplier;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const level = score >= 75 ? "high" : score >= 45 ? "medium" : "low";

  return {
    contactId: contact.id,
    score,
    level,
    breakdown: {
      dealsScore: Math.round(dealsScore),
      valueScore: Math.round(valueScore),
      activityScore: Math.round(activityScore),
      progressionScore: Math.round(progressionScore),
      recentMultiplier,
    },
  };
};

const buildFallbackScores = async () => {
  const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
    api.get("/contacts/"),
    api.get("/deals/"),
    api.get("/activities/"),
  ]);

  const contacts = normalizeList(contactsRes.data?.data);
  const deals = normalizeList(dealsRes.data?.data);
  const activities = normalizeList(activitiesRes.data?.data);

  return contacts.map((contact) => computeContactScore({ contact, deals, activities }));
};

export const getLeadScores = async () => {
  try {
    const res = await api.get("/scoring/leads/");
    return res.data?.data;
  } catch (_error) {
    return buildFallbackScores();
  }
};

export const getContactScore = async (contactId) => {
  try {
    const res = await api.get(`/scoring/contacts/${contactId}/`);
    return res.data?.data;
  } catch (_error) {
    const scores = await buildFallbackScores();
    return scores.find((score) => String(score.contactId) === String(contactId)) || {
      contactId,
      score: 0,
      level: "low",
      breakdown: {
        dealsScore: 0,
        valueScore: 0,
        activityScore: 0,
        progressionScore: 0,
        recentMultiplier: 1,
      },
    };
  }
};
