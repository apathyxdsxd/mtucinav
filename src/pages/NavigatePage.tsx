import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FloorMap from '../components/FloorMap';
import { rooms, qrPoints, getNodeById } from '../data/floors';
import { findPath, type PathResult } from '../utils/pathfinding';

export default function NavigatePage() {
  const [searchParams] = useSearchParams();
  const locParam = searchParams.get('loc');

  const currentNode = useMemo(() => {
    if (!locParam) return null;
    let node = getNodeById(locParam);
    if (node) return node;
    const qr = qrPoints.find((q) => q.id === locParam || q.nodeId === locParam);
    if (qr) return getNodeById(qr.nodeId) ?? null;
    return null;
  }, [locParam]);

  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [viewFloor, setViewFloor] = useState<number>(currentNode?.floor ?? 1);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);

  useEffect(() => {
    if (currentNode) setViewFloor(currentNode.floor);
  }, [currentNode]);

  useEffect(() => {
    if (!currentNode || !selectedDestination) {
      setPathResult(null);
      return;
    }
    const result = findPath(currentNode.id, selectedDestination);
    setPathResult(result);
    if (result && result.floors.length > 0) {
      setViewFloor(currentNode.floor);
    }
  }, [currentNode, selectedDestination]);

  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, typeof rooms> = {};
    for (const room of rooms) {
      if (!grouped[room.floor]) grouped[room.floor] = [];
      grouped[room.floor].push(room);
    }
    return grouped;
  }, []);

  const pathNodesForFloor = pathResult?.nodes ?? [];
  const destNode = selectedDestination ? getNodeById(selectedDestination) : undefined;

  const locationText = currentNode
    ? currentNode.type === 'stairs'
      ? currentNode.label
      : currentNode.type === 'room'
      ? `Аудитория ${currentNode.label}`
      : 'Коридор'
    : '';

  // Landing page
  if (!locParam) {
    return (
      <>
        <div className="header">
          <h1>🏫 МТУЦИ Навигатор</h1>
        </div>
        <div className="landing fade-in">
          <div className="landing-icon">📍</div>
          <h2>Добро пожаловать!</h2>
          <p>
            Отсканируйте QR-код в здании университета, чтобы определить ваше местоположение и построить маршрут.
          </p>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
              <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
                Наведите камеру телефона на QR-код рядом с вами
              </p>
            </div>
            <a href="/qrcodes" className="btn btn-outline" style={{ width: '100%' }}>
              📋 QR-коды для печати
            </a>
          </div>
        </div>
      </>
    );
  }

  // Unknown location
  if (!currentNode) {
    return (
      <>
        <div className="header">
          <h1>🏫 МТУЦИ Навигатор</h1>
        </div>
        <div className="landing fade-in">
          <div className="landing-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>❌</div>
          <h2>Точка не найдена</h2>
          <p>QR-код содержит неизвестную локацию: <code style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>{locParam}</code></p>
          <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>На главную</a>
        </div>
      </>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="header">
        <h1>🏫 МТУЦИ Навигатор</h1>
        <p>📍 Этаж {currentNode.floor}, {locationText}</p>
      </div>

      <div style={{ padding: '12px 16px 24px', maxWidth: 920, margin: '0 auto' }}>
        {/* Destination selector */}
        <div className="card">
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-600)', marginBottom: 8, display: 'block' }}>
            Куда вам нужно?
          </label>
          <div className="select-wrapper">
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
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
        </div>

        {/* Route info */}
        {pathResult && (
          <div className={`route-info slide-down ${pathResult.floors.length > 1 ? 'multi' : 'success'}`} style={{ marginBottom: 12 }}>
            {pathResult.floors.length > 1 ? (
              <span>🚶 Маршрут через этажи: <strong>{pathResult.floors.join(' → ')}</strong>. Используйте лестницу.</span>
            ) : (
              <span>🚶 Следуйте по пунктирной линии на карте.</span>
            )}
          </div>
        )}

        {/* Floor tabs */}
        <div className="floor-tabs" style={{ marginBottom: 10 }}>
          {[1, 2, 3, 4, 5].map((f) => {
            const isOnPath = pathResult?.floors.includes(f);
            let cls = 'floor-tab';
            if (f === viewFloor) cls += ' active';
            else if (isOnPath) cls += ' on-path';
            return (
              <button key={f} className={cls} onClick={() => setViewFloor(f)}>
                {f} этаж
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
    </div>
  );
}
