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
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A1128" />
            <stop offset="100%" stopColor="#130D1F" />
          </linearGradient>
          <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.12)" />
            <stop offset="50%" stopColor="rgba(168,85,247,0.18)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.12)" />
          </linearGradient>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          <linearGradient id="stairsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="currentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="destGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
          <linearGradient id="roomGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
          <filter id="roomShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#A855F7" floodOpacity="0.1" />
          </filter>
          <filter id="glowPurple">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#A855F7" floodOpacity="0.5" />
          </filter>
          <filter id="glowGreen">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#34D399" floodOpacity="0.6" />
          </filter>
          <filter id="glowRed">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FB7185" floodOpacity="0.5" />
          </filter>
          <filter id="glowYellow">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FBBF24" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* SVG Background */}
        <rect width="880" height="500" fill="url(#bgGrad)" rx="16" />

        {/* Grid pattern */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(168,85,247,0.04)" strokeWidth="1"/>
        </pattern>
        <rect width="880" height="500" fill="url(#grid)" rx="16" />

        {/* Floor label */}
        <text x="440" y="30" textAnchor="middle" fontSize="13" fontWeight="800" fill="rgba(168,85,247,0.5)" letterSpacing="3" style={{ textTransform: 'uppercase' } as React.CSSProperties}>
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
            <rect x={c.x - 3} y={80 + ROOM_H - 5} width={6} height={280 - 80 - ROOM_H + 10} rx={3} fill="rgba(168,85,247,0.08)" />
            <rect x={c.x - 3} y={280} width={6} height={420 - 280 - 10} rx={3} fill="rgba(168,85,247,0.08)" />
          </g>
        ))}

        {/* Path overlay — between corridors and rooms/stairs */}
        {pathLine && (
          <g>
            <polyline
              points={pathLine}
              fill="none"
              stroke="rgba(168,85,247,0.25)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={pathLine}
              fill="none"
              stroke="url(#pathGrad)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="10 6"
              filter="url(#glowPurple)"
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
                rx={10}
                fill={isCurrent ? 'url(#currentGrad)' : isOnPath ? 'url(#pathGrad)' : 'url(#stairsGrad)'}
                filter={isCurrent ? 'url(#glowGreen)' : 'url(#glowYellow)'}
              />
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={s.x - 10}
                  y1={s.y - 16 + i * 11}
                  x2={s.x + 10}
                  y2={s.y - 16 + i * 11}
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
              {isCurrent && (
                <text x={s.x} y={s.y - 36} textAnchor="middle" fontSize="10" fill="#34D399" fontWeight="800" letterSpacing="0.5">
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
          let stroke = 'rgba(168,85,247,0.2)';
          let textColor = 'rgba(248,250,252,0.9)';
          let filterAttr = 'url(#roomShadow)';

          if (isCurrent) {
            fill = 'url(#currentGrad)';
            stroke = '#34D399';
            textColor = 'white';
            filterAttr = 'url(#glowGreen)';
          } else if (isDestination) {
            fill = 'url(#destGrad)';
            stroke = '#FB7185';
            textColor = 'white';
            filterAttr = 'url(#glowRed)';
          } else if (isOnPath) {
            fill = 'rgba(168,85,247,0.15)';
            stroke = '#A855F7';
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
                rx={12}
                fill={fill}
                stroke={stroke}
                strokeWidth={isCurrent || isDestination ? 2 : 1}
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
                <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.9)" fontWeight="700" letterSpacing="1">
                  ● ВЫ ЗДЕСЬ
                </text>
              )}
              {isDestination && (
                <text x={room.x} y={room.y + 20} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.9)" fontWeight="700" letterSpacing="1">
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
                fill={isCurrent ? 'url(#currentGrad)' : 'rgba(168,85,247,0.35)'}
                filter={isCurrent ? 'url(#glowGreen)' : undefined}
              />
              {!isCurrent && (
                <circle cx={c.x} cy={c.y} r={6} fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth={1} />
              )}
              {isCurrent && (
                <text x={c.x} y={c.y - 18} textAnchor="middle" fontSize="10" fill="#34D399" fontWeight="800">
                  ● ВЫ ЗДЕСЬ
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(24, 464)">
          <rect x={0} y={0} width={12} height={12} rx={4} fill="url(#currentGrad)" />
          <text x={16} y={10} fontSize="10" fill="rgba(248,250,252,0.5)" fontWeight="600">Вы здесь</text>
          <rect x={85} y={0} width={12} height={12} rx={4} fill="url(#destGrad)" />
          <text x={101} y={10} fontSize="10" fill="rgba(248,250,252,0.5)" fontWeight="600">Цель</text>
          <rect x={140} y={0} width={12} height={12} rx={4} fill="url(#stairsGrad)" />
          <text x={156} y={10} fontSize="10" fill="rgba(248,250,252,0.5)" fontWeight="600">Лестница</text>
          <rect x={228} y={0} width={12} height={12} rx={4} fill="url(#pathGrad)" />
          <text x={244} y={10} fontSize="10" fill="rgba(248,250,252,0.5)" fontWeight="600">На маршруте</text>
          <rect x={330} y={1} width={30} height={10} rx={3} fill="none" stroke="url(#pathGrad)" strokeWidth={2} strokeDasharray="4 3" />
          <text x={366} y={10} fontSize="10" fill="rgba(248,250,252,0.5)" fontWeight="600">Маршрут</text>
        </g>
      </svg>
    </div>
  );
}
