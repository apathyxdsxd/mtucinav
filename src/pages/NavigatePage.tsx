import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FloorMap from '../components/FloorMap';
import NLPSearch from '../components/NLPSearch';
import { rooms, qrPoints, getNodeById } from '../data/floors';
import { findPath, type PathResult } from '../utils/pathfinding';

const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/0/03/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.svg';

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
          <h1>
            <img src={LOGO_URL} alt="МТУСИ" style={{ height: 28, filter: 'brightness(0) invert(1)' }} />
            МТУСИ Навигатор
          </h1>
        </div>
        <div className="landing fade-in">
          <div className="landing-icon" style={{ background: 'transparent', width: 'auto', height: 'auto' }}>
            <img src="/mtusi-logo.png" alt="МТУСИ" style={{ height: 100, borderRadius: 16 }} />
          </div>
          <h2>Добро пожаловать!</h2>
          <p>
            Отсканируйте QR-код в здании университета, чтобы определить ваше местоположение и построить маршрут.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
            <div className="card" style={{ textAlign: 'center', padding: 26, border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.6 }}>
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
          <h1>
            <img src={LOGO_URL} alt="МТУСИ" style={{ height: 28, filter: 'brightness(0) invert(1)' }} />
            МТУСИ Навигатор
          </h1>
        </div>
        <div className="landing fade-in">
          <div className="landing-icon" style={{ background: 'linear-gradient(135deg, #E11D48, #FB7185)' }}>❌</div>
          <h2>Точка не найдена</h2>
          <p>QR-код содержит неизвестную локацию: <code style={{ background: 'rgba(168,85,247,0.15)', padding: '2px 8px', borderRadius: 6, fontSize: 13, color: 'var(--accent-light)', fontWeight: 600 }}>{locParam}</code></p>
          <a href="/" className="btn btn-primary" style={{ marginTop: 24 }}>На главную</a>
        </div>
      </>
    );
  }

  return (
    <div className="fade-in">
      <div className="header">
        <h1>
          <img src={LOGO_URL} alt="МТУСИ" style={{ height: 28, filter: 'brightness(0) invert(1)' }} />
          МТУСИ Навигатор
        </h1>
        <p>📍 Этаж {currentNode.floor}, {locationText}</p>
      </div>

      <div style={{ padding: '14px 16px 28px', maxWidth: 920, margin: '0 auto' }}>
        {/* NLP Search */}
        <div className="card" style={{ position: 'relative', zIndex: 10, overflow: 'visible' }}>
          <NLPSearch
            onSelectRoom={(nodeId) => setSelectedDestination(nodeId)}
            currentNodeId={currentNode.id}
          />
        </div>

        {/* Destination selector */}
        <div className="card">
          <label style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent-light)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Или выберите вручную
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
              <span>Маршрут через этажи:{' '}
                {pathResult.floors.map((f, i) => (
                  <span key={f}>
                    <strong
                      style={{ cursor: 'pointer', textDecoration: f === viewFloor ? 'underline' : 'none' }}
                      onClick={() => setViewFloor(f)}
                    >
                      {f}
                    </strong>
                    {i < pathResult.floors.length - 1 && ' → '}
                  </span>
                ))}
                . Используйте лестницу.
              </span>
            ) : (
              <span>Следуйте по пунктирной линии на карте.</span>
            )}
          </div>
        )}

        {/* Floor tabs */}
        <div className="floor-tabs" style={{ marginBottom: 12 }}>
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
