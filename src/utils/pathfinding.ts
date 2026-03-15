import { allNodes, allEdges, type MapNode } from '../data/floors';

interface GraphEdge {
  to: string;
  weight: number;
}

type Graph = Map<string, GraphEdge[]>;

function buildGraph(): Graph {
  const graph: Graph = new Map();

  for (const node of allNodes) {
    graph.set(node.id, []);
  }

  for (const edge of allEdges) {
    graph.get(edge.from)?.push({ to: edge.to, weight: edge.weight });
    graph.get(edge.to)?.push({ to: edge.from, weight: edge.weight });
  }

  return graph;
}

const graph = buildGraph();

export interface PathResult {
  path: string[];
  nodes: MapNode[];
  totalWeight: number;
  floors: number[]; // all floors the path passes through
}

// Dijkstra's algorithm
export function findPath(fromId: string, toId: string): PathResult | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of allNodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }

  dist.set(fromId, 0);

  while (true) {
    // Find unvisited node with minimum distance
    let minDist = Infinity;
    let current: string | null = null;

    for (const [id, d] of dist) {
      if (!visited.has(id) && d < minDist) {
        minDist = d;
        current = id;
      }
    }

    if (current === null || current === toId) break;
    visited.add(current);

    const neighbors = graph.get(current) || [];
    for (const { to, weight } of neighbors) {
      if (visited.has(to)) continue;
      const newDist = minDist + weight;
      if (newDist < (dist.get(to) ?? Infinity)) {
        dist.set(to, newDist);
        prev.set(to, current);
      }
    }
  }

  // Reconstruct path
  if (dist.get(toId) === Infinity) return null;

  const path: string[] = [];
  let current: string | null = toId;
  while (current) {
    path.unshift(current);
    current = prev.get(current) ?? null;
  }

  const nodes = path
    .map((id) => allNodes.find((n) => n.id === id)!)
    .filter(Boolean);

  const floors = [...new Set(nodes.map((n) => n.floor))];

  return {
    path,
    nodes,
    totalWeight: dist.get(toId)!,
    floors,
  };
}
