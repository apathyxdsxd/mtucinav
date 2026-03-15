import { getFloorNodes, type MapNode } from '../data/floors';

interface FloorMapProps {
  floor: number;
  currentNodeId?: string;
  destinationNodeId?: string;
  pathNodes?: MapNode[];
  onRoomClick?: (nodeId: string) => void;
}

const ROOM_W = 100;
const ROOM_H = 65;

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

  const pathLine =
    floorPathNodes.length > 1
      ? floorPathNodes.map((n) => `${n.x},${n.y}`).join(' ')
      : '';

  return (
    <div className="map-container">
      <svg viewBox="0 0 880 500" style={{ width: '100%', display: 'block' }}>
        {/* Background */}
        <defs>
          <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="stairsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="currentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="destGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <filter id="roomShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
          </filter>
          <filter id="glowBlue">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.4" />
          </filter>
          <filter id="glowGreen">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#22c55e" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Floor label */}
        <text x="440" y="30" textAnchor="middle" fontSize="17" fontWeight="700" fill="#94a3b8" letterSpacing="1">
          ЭТАЖ {floor}
        </text>

        {/* Corridor background */}
        <rect
          x={(stairsNodes[0]?.x ?? 30) - 5}
          y={265}
          width={(stairsNodes[1]?.x ?? 820) - (stairsNodes[0]?.x ?? 30) + 10}
          height={30}
          rx={15}
          fill="url(#corridorGrad)"
        />

        {/* Vertical corridors */}
        {corridorNodes.map((c) => (
          <g key={c.id}>
            <rect x={c.x - 4} y={80 + ROOM_H - 5} width={8} height={280 - 80 - ROOM_H + 10} rx={4} fill="#e2e8f0" />
            <rect x={c.x - 4} y={280} width={8} height={420 - 280 - 10} rx={4} fill="#e2e8f0" />
          </g>
        ))}

        {/* Path overlay */}
        {pathLine && (
          <g filter="url(#glowBlue)">
            <polyline
              points={pathLine}
              fill="none"
              stroke="url(#pathGrad)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="10 6"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="16"
                to="0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </polyline>
          </g>
        )}

        {/* Stairs */}
        {stairsNodes.map((s) => {
          const isCurrent = s.id === currentNodeId;
          const isOnPath = floorPathNodes.some((n) => n.id === s.id);
          return (
            <g key={s.id}>
              <rect
                x={s.x - 20}
                y={s.y - 28}
                width={40}
                height={56}
                rx={8}
                fill={isCurrent ? 'url(#currentGrad)' : isOnPath ? 'url(#pathGrad)' : 'url(#stairsGrad)'}
                filter={isCurrent ? 'url(#glowGreen)' : 'url(#roomShadow)'}
              />
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={s.x - 10}
                  y1={s.y - 16 + i * 11}
                  x2={s.x + 10}
                  y2={s.y - 16 + i * 11}
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
              {isCurrent && (
                <text x={s.x} y={s.y - 36} textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="700">
                  ● ВЫ ЗДЕСЬ
                </text>
              )}
            </g>
          );
        })}

        {/* Rooms */}
        {roomNodes.map((room) => {
          const isCurrent = room.id === currentNodeId;
          const isDestination = room.id === destinationNodeId;
          const isOnPath = floorPathNodes.some((n) => n.id === room.id);

          let fill = 'white';
          let stroke = '#d1d5db';
          let textColor = '#374151';
          let filterAttr = 'url(#roomShadow)';

          if (isCurrent) {
            fill = 'url(#currentGrad)';
            stroke = '#16a34a';
            textColor = 'white';
            filterAttr = 'url(#glowGreen)';
          } else if (isDestination) {
            fill = 'url(#destGrad)';
            stroke = '#dc2626';
            textColor = 'white';
          } else if (isOnPath) {
            fill = '#eff6ff';
            stroke = '#3b82f6';
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
                rx={10}
                fill={fill}
                stroke={stroke}
                strokeWidth={isCurrent || isDestination ? 2.5 : 1.5}
                filter={filterAttr}
              />
              <text
                x={room.x}
                y={isCurrent || isDestination ? room.y + 1 : room.y + 5}
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
                fill={textColor}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {room.label}
              </text>
              {isCurrent && (
                <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.9)" fontWeight="600" letterSpacing="0.5">
                  ● ВЫ ЗДЕСЬ
                </text>
              )}
              {isDestination && (
                <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.9)" fontWeight="600" letterSpacing="0.5">
                  ◎ ЦЕЛЬ
                </text>
              )}
            </g>
          );
        })}

        {/* Corridor dots */}
        {corridorNodes.map((c) => {
          const isCurrent = c.id === currentNodeId;
          return (
            <g key={c.id}>
              <circle
                cx={c.x}
                cy={c.y}
                r={isCurrent ? 10 : 4}
                fill={isCurrent ? 'url(#currentGrad)' : '#cbd5e1'}
                filter={isCurrent ? 'url(#glowGreen)' : undefined}
              />
              {isCurrent && (
                <text x={c.x} y={c.y - 18} textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="700">
                  ● ВЫ ЗДЕСЬ
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(24, 462)">
          <rect x={0} y={0} width={12} height={12} rx={3} fill="url(#currentGrad)" />
          <text x={17} y={10} fontSize="11" fill="#6b7280" fontWeight="500">Вы здесь</text>
          <rect x={90} y={0} width={12} height={12} rx={3} fill="url(#destGrad)" />
          <text x={107} y={10} fontSize="11" fill="#6b7280" fontWeight="500">Цель</text>
          <rect x={160} y={0} width={12} height={12} rx={3} fill="url(#stairsGrad)" />
          <text x={177} y={10} fontSize="11" fill="#6b7280" fontWeight="500">Лестница</text>
          <line x1={250} y1={6} x2={274} y2={6} stroke="url(#pathGrad)" strokeWidth={3} strokeDasharray="5 3" strokeLinecap="round" />
          <text x={280} y={10} fontSize="11" fill="#6b7280" fontWeight="500">Маршрут</text>
        </g>
      </svg>
    </div>
  );
}
