import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "components/card";
import { useWorkspaceGraph } from "domains/graph/hooks";

const WIDTH = 960;
const HEIGHT = 560;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

const colorByType = {
  contact: "#0EA5E9",
  deal: "#8B5CF6",
  activity: "#F59E0B",
};

const extractNumericId = (nodeId) => {
  const parts = String(nodeId || "").split(":");
  return parts[1] || nodeId;
};

const getNodeRoute = (node) => {
  const id = extractNumericId(node?.id);
  if (node.type === "deal") return `/admin/deals/${id}`;
  if (node.type === "contact") return `/admin/contacts/${id}`;
  if (node.type === "activity") {
    const dealId = node?.metadata?.deal_id || node?.metadata?.deal;
    return dealId ? `/admin/deals/${dealId}` : "/admin/data-tables";
  }
  return "/admin/default";
};

const edgeConnectsNode = (edge, nodeId) => String(edge.from) === String(nodeId) || String(edge.to) === String(nodeId);

export default function EntityGraphView() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const { data, isLoading, error, refetch } = useWorkspaceGraph();

  const nodes = useMemo(() => (Array.isArray(data?.nodes) ? data.nodes : []), [data?.nodes]);
  const edges = useMemo(() => (Array.isArray(data?.edges) ? data.edges : []), [data?.edges]);

  const filteredNodeSet = useMemo(() => {
    const list = typeFilter === "all" ? nodes : nodes.filter((node) => node.type === typeFilter);
    return new Set(list.map((node) => String(node.id)));
  }, [nodes, typeFilter]);

  const filteredNodes = useMemo(
    () => nodes.filter((node) => filteredNodeSet.has(String(node.id))),
    [nodes, filteredNodeSet]
  );

  const filteredEdges = useMemo(
    () =>
      edges.filter(
        (edge) => filteredNodeSet.has(String(edge.from)) && filteredNodeSet.has(String(edge.to))
      ),
    [edges, filteredNodeSet]
  );

  const laidOutNodes = useMemo(() => {
    const count = filteredNodes.length || 1;
    const radius = Math.min(WIDTH, HEIGHT) * 0.34;

    return filteredNodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / count;
      return {
        ...node,
        x: CENTER_X + radius * Math.cos(angle),
        y: CENTER_Y + radius * Math.sin(angle),
      };
    });
  }, [filteredNodes]);

  const nodeMap = useMemo(() => {
    const map = new Map();
    laidOutNodes.forEach((node) => map.set(String(node.id), node));
    return map;
  }, [laidOutNodes]);

  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return new Set();

    const set = new Set([String(selectedNodeId)]);
    filteredEdges.forEach((edge) => {
      if (edgeConnectsNode(edge, selectedNodeId)) {
        set.add(String(edge.from));
        set.add(String(edge.to));
      }
    });
    return set;
  }, [filteredEdges, selectedNodeId]);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-500">{error?.message || "Failed to load graph"}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">Entity Relationship Graph</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Contacts, deals, and activities connected in one workspace graph.
          </p>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white"
        >
          <option value="all">All entities</option>
          <option value="contact">Contacts</option>
          <option value="deal">Deals</option>
          <option value="activity">Activities</option>
        </select>
      </div>

      <Card extra="rounded-2xl border border-gray-200 p-4 dark:!border-white/10 dark:bg-navy-800">
        <div className="overflow-auto">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[560px] w-full min-w-[860px] rounded-xl bg-gray-50 dark:bg-navy-900">
            {filteredEdges.map((edge, idx) => {
              const from = nodeMap.get(String(edge.from));
              const to = nodeMap.get(String(edge.to));
              if (!from || !to) return null;

              const highlighted = selectedNodeId ? edgeConnectsNode(edge, selectedNodeId) : false;

              return (
                <line
                  key={`${edge.from}-${edge.to}-${idx}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={highlighted ? "#1B254B" : "#CBD5E1"}
                  strokeWidth={highlighted ? 2.5 : 1.2}
                  opacity={highlighted ? 1 : 0.55}
                />
              );
            })}

            {laidOutNodes.map((node) => {
              const selected = String(node.id) === String(selectedNodeId);
              const connected = selectedNodeId ? connectedNodes.has(String(node.id)) : false;
              const faded = selectedNodeId && !connected;

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    r={selected ? 26 : 20}
                    fill={colorByType[node.type] || "#64748B"}
                    opacity={faded ? 0.25 : connected || !selectedNodeId ? 0.95 : 1}
                    stroke={selected ? "#1B254B" : "white"}
                    strokeWidth={selected ? 4 : 2}
                    className="cursor-pointer"
                    onClick={() => setSelectedNodeId(node.id)}
                    onDoubleClick={() => navigate(getNodeRoute(node))}
                  />
                  <text
                    y={42}
                    textAnchor="middle"
                    className="fill-navy-700 text-[11px] font-semibold dark:fill-white"
                  >
                    {(node.label || "").slice(0, 20)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-300">
          Click node to highlight connections. Double-click node to open detail.
        </p>
      </Card>
    </div>
  );
}
