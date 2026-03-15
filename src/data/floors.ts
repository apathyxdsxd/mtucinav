// Floor data: 5 floors, 10 rooms each
// Layout per floor:
//
//  [R01] [R02] [R03] [R04] [R05]
//  ──S1──●─────●─────●─────●──S2──   (corridor with stairs at ends)
//  [R06] [R07] [R08] [R09] [R10]
//

export interface MapNode {
  id: string;
  x: number;
  y: number;
  floor: number;
  type: 'room' | 'corridor' | 'stairs';
  label?: string;
}

export interface MapEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Room {
  id: string;
  nodeId: string;
  floor: number;
  label: string;
}

export interface QRPoint {
  id: string;
  nodeId: string;
  floor: number;
  label: string;
  description: string;
}

// Room positions on each floor (relative coords, SVG viewBox 0 0 1000 600)
const ROOM_POSITIONS_TOP = [
  { dx: 100, dy: 80, suffix: '01' },
  { dx: 250, dy: 80, suffix: '02' },
  { dx: 400, dy: 80, suffix: '03' },
  { dx: 550, dy: 80, suffix: '04' },
  { dx: 700, dy: 80, suffix: '05' },
];

const ROOM_POSITIONS_BOTTOM = [
  { dx: 100, dy: 420, suffix: '06' },
  { dx: 250, dy: 420, suffix: '07' },
  { dx: 400, dy: 420, suffix: '08' },
  { dx: 550, dy: 420, suffix: '09' },
  { dx: 700, dy: 420, suffix: '10' },
];

// Corridor nodes (hallway intersections)
const CORRIDOR_POSITIONS = [
  { dx: 100, dy: 280, suffix: 'h1' },
  { dx: 250, dy: 280, suffix: 'h2' },
  { dx: 400, dy: 280, suffix: 'h3' },
  { dx: 550, dy: 280, suffix: 'h4' },
  { dx: 700, dy: 280, suffix: 'h5' },
];

// Stairs at both ends
const STAIRS_POSITIONS = [
  { dx: 30, dy: 280, suffix: 'stairs-left' },
  { dx: 820, dy: 280, suffix: 'stairs-right' },
];

function buildFloorNodes(floor: number): MapNode[] {
  const nodes: MapNode[] = [];

  // Room nodes (top row)
  for (const r of ROOM_POSITIONS_TOP) {
    nodes.push({
      id: `f${floor}-${r.suffix}`,
      x: r.dx,
      y: r.dy,
      floor,
      type: 'room',
      label: `${floor}${r.suffix}`,
    });
  }

  // Room nodes (bottom row)
  for (const r of ROOM_POSITIONS_BOTTOM) {
    nodes.push({
      id: `f${floor}-${r.suffix}`,
      x: r.dx,
      y: r.dy,
      floor,
      type: 'room',
      label: `${floor}${r.suffix}`,
    });
  }

  // Corridor nodes
  for (const c of CORRIDOR_POSITIONS) {
    nodes.push({
      id: `f${floor}-${c.suffix}`,
      x: c.dx,
      y: c.dy,
      floor,
      type: 'corridor',
    });
  }

  // Stairs
  for (const s of STAIRS_POSITIONS) {
    nodes.push({
      id: `f${floor}-${s.suffix}`,
      x: s.dx,
      y: s.dy,
      floor,
      type: 'stairs',
      label: 'Лестница',
    });
  }

  return nodes;
}

function buildFloorEdges(floor: number): MapEdge[] {
  const edges: MapEdge[] = [];
  const e = (from: string, to: string, w: number) =>
    edges.push({ from: `f${floor}-${from}`, to: `f${floor}-${to}`, weight: w });

  // Connect rooms to corridor nodes (vertical connections)
  const roomCorridorPairs = [
    ['01', 'h1'], ['02', 'h2'], ['03', 'h3'], ['04', 'h4'], ['05', 'h5'],
    ['06', 'h1'], ['07', 'h2'], ['08', 'h3'], ['09', 'h4'], ['10', 'h5'],
  ];
  for (const [room, hall] of roomCorridorPairs) {
    e(room, hall, 2);
  }

  // Connect corridor nodes horizontally
  e('stairs-left', 'h1', 1);
  e('h1', 'h2', 2);
  e('h2', 'h3', 2);
  e('h3', 'h4', 2);
  e('h4', 'h5', 2);
  e('h5', 'stairs-right', 1);

  return edges;
}

function buildStairsEdges(): MapEdge[] {
  const edges: MapEdge[] = [];
  for (let f = 1; f < 5; f++) {
    edges.push({
      from: `f${f}-stairs-left`,
      to: `f${f + 1}-stairs-left`,
      weight: 3,
    });
    edges.push({
      from: `f${f}-stairs-right`,
      to: `f${f + 1}-stairs-right`,
      weight: 3,
    });
  }
  return edges;
}

// Build all data
export const allNodes: MapNode[] = [];
export const allEdges: MapEdge[] = [];
export const rooms: Room[] = [];
export const qrPoints: QRPoint[] = [];

for (let f = 1; f <= 5; f++) {
  const floorNodes = buildFloorNodes(f);
  allNodes.push(...floorNodes);
  allEdges.push(...buildFloorEdges(f));

  // Collect rooms
  for (const node of floorNodes) {
    if (node.type === 'room') {
      rooms.push({
        id: node.id,
        nodeId: node.id,
        floor: f,
        label: `Аудитория ${node.label}`,
      });
    }
  }

  // QR scan points: stairs + corridor
  qrPoints.push({
    id: `qr-f${f}-stairs-left`,
    nodeId: `f${f}-stairs-left`,
    floor: f,
    label: `Этаж ${f}, Лестница (левая)`,
    description: `QR-код у левой лестницы, ${f} этаж`,
  });
  qrPoints.push({
    id: `qr-f${f}-h3`,
    nodeId: `f${f}-h3`,
    floor: f,
    label: `Этаж ${f}, Центр коридора`,
    description: `QR-код в центре коридора, ${f} этаж`,
  });
  qrPoints.push({
    id: `qr-f${f}-stairs-right`,
    nodeId: `f${f}-stairs-right`,
    floor: f,
    label: `Этаж ${f}, Лестница (правая)`,
    description: `QR-код у правой лестницы, ${f} этаж`,
  });

  // QR scan points: each room
  for (const node of floorNodes) {
    if (node.type === 'room') {
      qrPoints.push({
        id: `qr-${node.id}`,
        nodeId: node.id,
        floor: f,
        label: `Аудитория ${node.label}`,
        description: `QR-код у аудитории ${node.label}, ${f} этаж`,
      });
    }
  }
}

allEdges.push(...buildStairsEdges());

// Helper: get nodes for a specific floor
export function getFloorNodes(floor: number): MapNode[] {
  return allNodes.filter((n) => n.floor === floor);
}

// Helper: get node by ID
export function getNodeById(id: string): MapNode | undefined {
  return allNodes.find((n) => n.id === id);
}

// Helper: get rooms grouped by floor
export function getRoomsByFloor(floor: number): Room[] {
  return rooms.filter((r) => r.floor === floor);
}
