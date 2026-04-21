import api from "api/client";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

const average = (arr) => {
  if (!arr.length) return 0;
  return arr.reduce((acc, value) => acc + value, 0) / arr.length;
};

const toDateKey = (value) => {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toISOString().slice(0, 10);
};

export const getDealAnalytics = async (params = {}) => {
  try {
    const res = await api.get("/analytics/deals/", { params });
    return res.data?.data;
  } catch (_error) {
    const dealsRes = await api.get("/deals/", { params });
    const deals = normalizeList(dealsRes.data?.data);

    const totalDeals = deals.length;
    const wonDeals = deals.filter((deal) => String(deal.status || "").toLowerCase().includes("won"));
    const lostDeals = deals.filter((deal) => String(deal.status || "").toLowerCase().includes("lost"));
    const values = deals.map((deal) => Number(deal.value || 0));

    const byStage = deals.reduce((acc, deal) => {
      const stageName = deal.stage_name || deal.stage?.name || `Stage ${deal.stage || "Unknown"}`;
      acc[stageName] = (acc[stageName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDeals,
      winRate: totalDeals ? Math.round((wonDeals.length / totalDeals) * 100) : 0,
      lostRate: totalDeals ? Math.round((lostDeals.length / totalDeals) * 100) : 0,
      averageDealValue: Number(average(values).toFixed(2)),
      funnel: Object.entries(byStage).map(([stage, count]) => ({ stage, count })),
    };
  }
};

export const getActivityAnalytics = async (params = {}) => {
  try {
    const res = await api.get("/analytics/activities/", { params });
    return res.data?.data;
  } catch (_error) {
    const activitiesRes = await api.get("/activities/", { params });
    const activities = normalizeList(activitiesRes.data?.data);

    const byDate = activities.reduce((acc, item) => {
      const key = toDateKey(item.created_at || item.timestamp);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byType = activities.reduce((acc, item) => {
      const key = String(item.type || "NOTE").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const userRank = activities.reduce((acc, item) => {
      const key = item.user_name || item.user || item.actor || "System";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      activitiesPerDay: Object.entries(byDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => (a.date > b.date ? 1 : -1)),
      activityDistribution: Object.entries(byType).map(([type, count]) => ({ type, count })),
      userRanking: Object.entries(userRank)
        .map(([user, count]) => ({ user, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
};

export const getContactAnalytics = async (params = {}) => {
  try {
    const res = await api.get("/analytics/contacts/", { params });
    return res.data?.data;
  } catch (_error) {
    const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
      api.get("/contacts/", { params }),
      api.get("/deals/", { params }),
      api.get("/activities/", { params }),
    ]);

    const contacts = normalizeList(contactsRes.data?.data);
    const deals = normalizeList(dealsRes.data?.data);
    const activities = normalizeList(activitiesRes.data?.data);

    const engagement = contacts.map((contact) => {
      const dealsCount = deals.filter((deal) => String(deal.contact_id || deal.contact?.id) === String(contact.id)).length;
      const activityCount = activities.filter(
        (activity) =>
          String(activity.contact_id || activity.contact) === String(contact.id)
      ).length;
      return {
        contactId: contact.id,
        name: contact.name || contact.email || `Contact ${contact.id}`,
        engagement: dealsCount + activityCount,
      };
    });

    return {
      mostEngagedContacts: engagement.sort((a, b) => b.engagement - a.engagement).slice(0, 8),
      leadScoreDistribution: [
        { bucket: "High", count: engagement.filter((item) => item.engagement >= 8).length },
        { bucket: "Medium", count: engagement.filter((item) => item.engagement >= 4 && item.engagement < 8).length },
        { bucket: "Low", count: engagement.filter((item) => item.engagement < 4).length },
      ],
    };
  }
};
