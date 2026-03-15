import { getFloorNodes, type MapNode } from '../data/floors';

interface FloorMapProps {
  floor: number;
  currentNodeId?: string;
  destinationNodeId?: string;
  pathNodes?: MapNode[];
  onRoomClick?: (nodeId: string) => void;
}

const ROOM_W = 100;
const ROOM_H = 70;

export default function FloorMap({
  floor,
  currentNodeId,
  destinationNodeId,
  pathNodes,
  onRoomClick,
}: FloorMapProps) {
  const nodes = getFloorNodes(floor);
  const floorPathNodes = pathNodes?.filter((n) => n.floor === floor) || [];

  const roomNodes = nodes.filter((n) => n.type === 'room');
  const corridorNodes = nodes.filter((n) => n.type === 'corridor');
  const stairsNodes = nodes.filter((n) => n.type === 'stairs');

  // Build path line for this floor
  const pathLine =
    floorPathNodes.length > 1
      ? floorPathNodes.map((n) => `${n.x},${n.y}`).join(' ')
      : '';

  return (
    <svg
      viewBox="0 0 880 520"
      style={{ width: '100%', maxWidth: 880, background: '#f8f9fa', borderRadius: 12 }}
    >
      {/* Floor label */}
      <text x="440" y="30" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">
        Этаж {floor}
      </text>

      {/* Corridor line */}
      <line
        x1={stairsNodes[0]?.x ?? 30}
        y1={280}
        x2={stairsNodes[1]?.x ?? 820}
        y2={280}
        stroke="#ccc"
        strokeWidth={8}
        strokeLinecap="round"
      />

      {/* Vertical corridor connections */}
      {corridorNodes.map((c) => (
        <g key={c.id}>
          <line x1={c.x} y1={80 + ROOM_H} x2={c.x} y2={280} stroke="#ccc" strokeWidth={4} />
          <line x1={c.x} y1={280} x2={c.x} y2={420 - 10} stroke="#ccc" strokeWidth={4} />
        </g>
      ))}

      {/* Path overlay */}
      {pathLine && (
        <polyline
          points={pathLine}
          fill="none"
          stroke="#4A90D9"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="12 6"
          style={{ filter: 'drop-shadow(0 0 4px rgba(74,144,217,0.5))' }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="18"
            to="0"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </polyline>
      )}

      {/* Stairs */}
      {stairsNodes.map((s) => (
        <g key={s.id}>
          <rect
            x={s.x - 22}
            y={s.y - 30}
            width={44}
            height={60}
            rx={6}
            fill={
              s.id === currentNodeId
                ? '#4CAF50'
                : floorPathNodes.some((n) => n.id === s.id)
                ? '#4A90D9'
                : '#FF9800'
            }
            stroke="#e65100"
            strokeWidth={2}
          />
          {/* Stairs icon - small lines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={s.x - 12}
              y1={s.y - 18 + i * 12}
              x2={s.x + 12}
              y2={s.y - 18 + i * 12}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </g>
      ))}

      {/* Rooms */}
      {roomNodes.map((room) => {
        const isCurrent = room.id === currentNodeId;
        const isDestination = room.id === destinationNodeId;
        const isOnPath = floorPathNodes.some((n) => n.id === room.id);

        let fill = '#e3e8ef';
        let stroke = '#999';
        let textColor = '#333';

        if (isCurrent) {
          fill = '#4CAF50';
          stroke = '#2E7D32';
          textColor = 'white';
        } else if (isDestination) {
          fill = '#F44336';
          stroke = '#C62828';
          textColor = 'white';
        } else if (isOnPath) {
          fill = '#BBDEFB';
          stroke = '#4A90D9';
        }

        return (
          <g
            key={room.id}
            onClick={() => onRoomClick?.(room.id)}
            style={{ cursor: onRoomClick ? 'pointer' : 'default' }}
          >
            <rect
              x={room.x - ROOM_W / 2}
              y={room.y - ROOM_H / 2}
              width={ROOM_W}
              height={ROOM_H}
              rx={8}
              fill={fill}
              stroke={stroke}
              strokeWidth={2}
            />
            <text
              x={room.x}
              y={room.y + 5}
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill={textColor}
            >
              {room.label}
            </text>
            {isCurrent && (
              <text x={room.x} y={room.y + 22} textAnchor="middle" fontSize="10" fill={textColor}>
                📍 Вы здесь
              </text>
            )}
            {isDestination && (
              <text x={room.x} y={room.y + 22} textAnchor="middle" fontSize="10" fill={textColor}>
                🏁 Цель
              </text>
            )}
          </g>
        );
      })}

      {/* Corridor intersection dots */}
      {corridorNodes.map((c) => {
        const isCurrent = c.id === currentNodeId;
        return (
          <circle
            key={c.id}
            cx={c.x}
            cy={c.y}
            r={isCurrent ? 10 : 5}
            fill={isCurrent ? '#4CAF50' : '#aaa'}
          />
        );
      })}

      {/* Current location indicator for corridor/stairs */}
      {nodes
        .filter((n) => n.id === currentNodeId && n.type !== 'room')
        .map((n) => (
          <text key={`loc-${n.id}`} x={n.x} y={n.y - 40} textAnchor="middle" fontSize="13" fill="#4CAF50" fontWeight="bold">
            📍 Вы здесь
          </text>
        ))}

      {/* Legend */}
      <g transform="translate(20, 480)">
        <rect x={0} y={0} width={14} height={14} rx={3} fill="#4CAF50" />
        <text x={20} y={12} fontSize="12" fill="#555">Вы здесь</text>
        <rect x={100} y={0} width={14} height={14} rx={3} fill="#F44336" />
        <text x={120} y={12} fontSize="12" fill="#555">Цель</text>
        <rect x={180} y={0} width={14} height={14} rx={3} fill="#FF9800" />
        <text x={200} y={12} fontSize="12" fill="#555">Лестница</text>
        <line x1={280} y1={7} x2={310} y2={7} stroke="#4A90D9" strokeWidth={3} strokeDasharray="6 3" />
        <text x={316} y={12} fontSize="12" fill="#555">Маршрут</text>
      </g>
    </svg>
  );
}
