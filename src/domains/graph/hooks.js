import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { subscribeToWorkspaceEvents } from "lib/websocketClient";
import { getEntityGraph, getWorkspaceGraph } from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";
const getWorkspaceGraphKey = (workspaceId) => [QUERY_KEYS.GRAPH, workspaceId];
const getEntityGraphKey = (workspaceId, entityId) => [QUERY_KEYS.ENTITY_GRAPH, workspaceId, entityId];

const safeList = (value) => (Array.isArray(value) ? value : []);

const updateNodeMetadata = (graphData, payload) => {
  if (!graphData || !Array.isArray(graphData.nodes)) return graphData;

  const nodeIdCandidates = [
    `deal:${payload?.id}`,
    `contact:${payload?.id}`,
    `activity:${payload?.id}`,
    `activity:${payload?.activity_id}`,
    `contact:${payload?.contact_id}`,
    `deal:${payload?.deal_id}`,
  ].filter(Boolean);

  const touched = new Set(nodeIdCandidates.map(String));

  return {
    ...graphData,
    nodes: graphData.nodes.map((node) => {
      if (!touched.has(String(node.id))) return node;
      return {
        ...node,
        metadata: { ...(node.metadata || {}), ...payload, _recentlyUpdated: true },
      };
    }),
  };
};

const appendActivityNode = (graphData, payload) => {
  if (!graphData || !Array.isArray(graphData.nodes)) return graphData;

  const activityId = payload?.id || payload?.activity_id;
  if (!activityId) return graphData;

  const activityNodeId = `activity:${activityId}`;
  const exists = graphData.nodes.some((node) => String(node.id) === activityNodeId);

  const activityNode = {
    id: activityNodeId,
    type: "activity",
    label: payload?.message || payload?.note || payload?.type || `Activity ${activityId}`,
    metadata: { ...payload, _recentlyUpdated: true },
  };

  const newEdges = [];
  if (payload?.deal_id || payload?.deal) {
    newEdges.push({
      from: `deal:${payload.deal_id || payload.deal}`,
      to: activityNodeId,
      relation: "has_activity",
    });
  }
  if (payload?.contact_id || payload?.contact) {
    newEdges.push({
      from: `contact:${payload.contact_id || payload.contact}`,
      to: activityNodeId,
      relation: "performed_activity",
    });
  }

  return {
    ...graphData,
    nodes: exists ? graphData.nodes.map((node) => (String(node.id) === activityNodeId ? activityNode : node)) : [activityNode, ...graphData.nodes],
    edges: [...safeList(graphData.edges), ...newEdges],
  };
};

export const useWorkspaceGraph = (options = {}) => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  useEffect(() => {
    const events = ["deal.updated", "contact.updated", "activity.created"];

    const unsubscribers = events.map((eventType) =>
      subscribeToWorkspaceEvents(workspaceId, eventType, (payload) => {
        queryClient.setQueriesData({ queryKey: getWorkspaceGraphKey(workspaceId) }, (oldData) => {
          if (eventType === "activity.created") {
            return appendActivityNode(oldData, payload);
          }
          return updateNodeMetadata(oldData, payload);
        });
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, workspaceId]);

  return useQuery({
    queryKey: getWorkspaceGraphKey(workspaceId),
    queryFn: getWorkspaceGraph,
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useEntityGraph = (entityId, options = {}) => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!entityId) return;

    const events = ["deal.updated", "contact.updated", "activity.created"];

    const unsubscribers = events.map((eventType) =>
      subscribeToWorkspaceEvents(workspaceId, eventType, (payload) => {
        queryClient.setQueriesData({ queryKey: getEntityGraphKey(workspaceId, entityId) }, (oldData) => {
          if (eventType === "activity.created") {
            return appendActivityNode(oldData, payload);
          }
          return updateNodeMetadata(oldData, payload);
        });
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [entityId, queryClient, workspaceId]);

  return useQuery({
    queryKey: getEntityGraphKey(workspaceId, entityId),
    queryFn: () => getEntityGraph(entityId),
    enabled: !!entityId,
    staleTime: 60 * 1000,
    ...options,
  });
};
