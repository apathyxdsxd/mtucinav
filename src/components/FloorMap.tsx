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
            <stop offset="0%" stopColor="#EDE9FE" />
            <stop offset="50%" stopColor="#F5F3FF" />
            <stop offset="100%" stopColor="#EDE9FE" />
          </linearGradient>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="stairsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="currentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="destGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="roomGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#FAFAFE" />
          </linearGradient>
          <filter id="roomShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.08" />
          </filter>
          <filter id="glowBlue">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#7C3AED" floodOpacity="0.5" />
          </filter>
          <filter id="glowGreen">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10B981" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Floor label */}
        <text x="440" y="30" textAnchor="middle" fontSize="15" fontWeight="800" fill="#A78BFA" letterSpacing="2">
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
                <text x={s.x} y={s.y - 36} textAnchor="middle" fontSize="11" fill="#059669" fontWeight="800">
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

          let fill = 'url(#roomGrad)';
          let stroke = '#DDD6FE';
          let textColor = '#3F3F46';
          let filterAttr = 'url(#roomShadow)';

          if (isCurrent) {
            fill = 'url(#currentGrad)';
            stroke = '#059669';
            textColor = 'white';
            filterAttr = 'url(#glowGreen)';
          } else if (isDestination) {
            fill = 'url(#destGrad)';
            stroke = '#E11D48';
            textColor = 'white';
          } else if (isOnPath) {
            fill = '#F5F3FF';
            stroke = '#7C3AED';
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
                <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.95)" fontWeight="700" letterSpacing="0.8">
                  ● ВЫ ЗДЕСЬ
                </text>
              )}
              {isDestination && (
                <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.95)" fontWeight="700" letterSpacing="0.8">
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
                fill={isCurrent ? 'url(#currentGrad)' : '#C4B5FD'}
                filter={isCurrent ? 'url(#glowGreen)' : undefined}
              />
              {isCurrent && (
                <text x={c.x} y={c.y - 18} textAnchor="middle" fontSize="11" fill="#059669" fontWeight="800">
                  ● ВЫ ЗДЕСЬ
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(24, 462)">
          <rect x={0} y={0} width={12} height={12} rx={3} fill="url(#currentGrad)" />
          <text x={16} y={10} fontSize="10" fill="#71717A" fontWeight="600">Вы здесь</text>
          <rect x={85} y={0} width={12} height={12} rx={3} fill="url(#destGrad)" />
          <text x={101} y={10} fontSize="10" fill="#71717A" fontWeight="600">Цель</text>
          <rect x={140} y={0} width={12} height={12} rx={3} fill="url(#stairsGrad)" />
          <text x={156} y={10} fontSize="10" fill="#71717A" fontWeight="600">Лестница</text>
          <rect x={228} y={0} width={12} height={12} rx={3} fill="url(#pathGrad)" />
          <text x={244} y={10} fontSize="10" fill="#71717A" fontWeight="600">На маршруте</text>
          <rect x={330} y={1} width={30} height={10} rx={2} fill="none" stroke="url(#pathGrad)" strokeWidth={2} strokeDasharray="4 3" />
          <text x={366} y={10} fontSize="10" fill="#71717A" fontWeight="600">Маршрут</text>
        </g>
      </svg>
    </div>
  );
}
