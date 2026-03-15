import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FloorMap from '../components/FloorMap';
import { rooms, qrPoints, getNodeById } from '../data/floors';
import { findPath, type PathResult } from '../utils/pathfinding';

export default function NavigatePage() {
  const [searchParams] = useSearchParams();
  const locParam = searchParams.get('loc'); // e.g. "f2-stairs-left" or "f3-h3"

  // Resolve current location from QR code
  const currentNode = useMemo(() => {
    if (!locParam) return null;
    // Try direct node ID
    let node = getNodeById(locParam);
    if (node) return node;
    // Try QR point mapping
    const qr = qrPoints.find((q) => q.id === locParam || q.nodeId === locParam);
    if (qr) return getNodeById(qr.nodeId) ?? null;
    return null;
  }, [locParam]);

  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [viewFloor, setViewFloor] = useState<number>(currentNode?.floor ?? 1);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);

  useEffect(() => {
    if (currentNode) {
      setViewFloor(currentNode.floor);
    }
  }, [currentNode]);

  // Compute path
  useEffect(() => {
    if (!currentNode || !selectedDestination) {
      setPathResult(null);
      return;
    }
    const result = findPath(currentNode.id, selectedDestination);
    setPathResult(result);
    // Show the destination floor if path found
    if (result && result.floors.length > 0) {
      setViewFloor(currentNode.floor);
    }
  }, [currentNode, selectedDestination]);

  // Group rooms by floor for the selector
  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, typeof rooms> = {};
    for (const room of rooms) {
      if (!grouped[room.floor]) grouped[room.floor] = [];
      grouped[room.floor].push(room);
    }
    return grouped;
  }, []);

  // Path nodes for current view floor
  const pathNodesForFloor = pathResult?.nodes ?? [];

  // Destination node
  const destNode = selectedDestination ? getNodeById(selectedDestination) : undefined;

  if (!locParam) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>🏫 МТУЦИ Навигатор</h1>
        <p style={{ fontSize: 18, color: '#666', maxWidth: 400, margin: '20px auto' }}>
          Отсканируйте QR-код в здании университета, чтобы определить ваше местоположение и начать навигацию.
        </p>
        <div style={{
          background: '#f0f4ff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          margin: '20px auto',
        }}>
          <p style={{ fontSize: 16 }}>📱 Наведите камеру телефона на QR-код рядом с вами</p>
        </div>
        <p style={{ marginTop: 24 }}>
          <a href="/qrcodes" style={{ color: '#4A90D9', fontSize: 16 }}>
            📋 Страница с QR-кодами для печати
          </a>
        </p>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>❌ Точка не найдена</h1>
        <p>QR-код содержит неизвестную локацию: <code>{locParam}</code></p>
        <a href="/" style={{ color: '#4A90D9' }}>На главную</a>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: 920, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>🏫 МТУЦИ Навигатор</h1>
      <p style={{ color: '#4CAF50', fontWeight: 'bold', margin: '4px 0 16px' }}>
        📍 Вы находитесь: Этаж {currentNode.floor},{' '}
        {currentNode.type === 'stairs'
          ? currentNode.label
          : currentNode.type === 'room'
          ? `Аудитория ${currentNode.label}`
          : 'Коридор'}
      </p>

      {/* Destination selector */}
      <div style={{
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}>
        <label style={{ fontWeight: 'bold', fontSize: 16 }}>
          Куда вам нужно?
        </label>
        <select
          value={selectedDestination}
          onChange={(e) => setSelectedDestination(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 12px',
            fontSize: 16,
            marginTop: 8,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        >
          <option value="">— Выберите аудиторию —</option>
          {[1, 2, 3, 4, 5].map((f) => (
            <optgroup key={f} label={`Этаж ${f}`}>
              {roomsByFloor[f]?.map((room) => (
                <option
                  key={room.id}
                  value={room.nodeId}
                  disabled={room.nodeId === currentNode.id}
                >
                  {room.label}
                  {room.nodeId === currentNode.id ? ' (вы здесь)' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Path info */}
      {pathResult && (
        <div style={{
          background: '#e8f5e9',
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          fontSize: 14,
        }}>
          {pathResult.floors.length > 1 ? (
            <p>
              🚶 Маршрут проходит через этажи:{' '}
              <strong>{pathResult.floors.join(' → ')}</strong>.
              Используйте лестницу для перехода между этажами.
            </p>
          ) : (
            <p>🚶 Маршрут на текущем этаже. Следуйте по пунктирной линии.</p>
          )}
        </div>
      )}

      {/* Floor tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((f) => {
          const isOnPath = pathResult?.floors.includes(f);
          return (
            <button
              key={f}
              onClick={() => setViewFloor(f)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: viewFloor === f ? '2px solid #4A90D9' : '1px solid #ddd',
                borderRadius: 8,
                background: viewFloor === f ? '#4A90D9' : isOnPath ? '#E3F2FD' : '#fff',
                color: viewFloor === f ? '#fff' : '#333',
                fontWeight: viewFloor === f ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {f} эт.
            </button>
          );
        })}
      </div>

      {/* Map */}
      <FloorMap
        floor={viewFloor}
        currentNodeId={currentNode.floor === viewFloor ? currentNode.id : undefined}
        destinationNodeId={destNode?.floor === viewFloor ? destNode.id : undefined}
        pathNodes={pathNodesForFloor}
      />
    </div>
  );
}
