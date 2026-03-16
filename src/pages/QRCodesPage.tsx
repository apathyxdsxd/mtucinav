import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { qrPoints } from '../data/floors';

export default function QRCodesPage() {
  const baseUrl = window.location.origin;
  const [filterFloor, setFilterFloor] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'rooms' | 'other'>('all');

  const filtered = qrPoints.filter((qr) => {
    if (filterFloor && qr.floor !== filterFloor) return false;
    if (filterType === 'rooms' && !qr.nodeId.match(/f\d+-\d+/)) return false;
    if (filterType === 'other' && qr.nodeId.match(/f\d+-\d+/)) return false;
    return true;
  });

  const grouped: Record<number, typeof qrPoints> = {};
  for (const qr of filtered) {
    if (!grouped[qr.floor]) grouped[qr.floor] = [];
    grouped[qr.floor].push(qr);
  }

  const totalRooms = qrPoints.filter(q => q.nodeId.match(/f\d+-\d+/)).length;
  const totalOther = qrPoints.length - totalRooms;

  return (
    <div className="fade-in">
      <div className="header">
        <h1><img src="https://upload.wikimedia.org/wikipedia/commons/0/03/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.svg" alt="МТУСИ" style={{ height: 28, filter: 'brightness(0) invert(1)' }} /> МТУСИ Навигатор</h1>
        <p>QR-коды для размещения в здании</p>
      </div>

      <div style={{ padding: '16px 20px 40px', maxWidth: 960, margin: '0 auto' }}>
        <div className="card no-print">
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
            Всего: <strong>{qrPoints.length}</strong> кодов ({totalRooms} аудиторий + {totalOther} коридоров/лестниц) &middot; URL: <code style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{baseUrl}</code>
          </p>

          <div className="filters">
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(Number(e.target.value))}
            >
              <option value={0}>Все этажи</option>
              {[1, 2, 3, 4, 5].map((f) => (
                <option key={f} value={f}>Этаж {f}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'rooms' | 'other')}
            >
              <option value="all">Все точки</option>
              <option value="rooms">Только аудитории</option>
              <option value="other">Лестницы / коридоры</option>
            </select>
            <button className="btn btn-primary" onClick={() => window.print()}>
              🖨️ Печать ({filtered.length})
            </button>
            <a href="/" className="btn btn-outline">← Назад</a>
          </div>
        </div>

        {[1, 2, 3, 4, 5].map((floor) => {
          const floorQRs = grouped[floor];
          if (!floorQRs || floorQRs.length === 0) return null;
          return (
            <div key={floor}>
              <div className="section-title">Этаж {floor}</div>
              <div className="qr-grid">
                {floorQRs.map((qr) => {
                  const url = `${baseUrl}/?loc=${qr.nodeId}`;
                  const isRoom = !!qr.nodeId.match(/f\d+-\d+/);
                  return (
                    <div key={qr.id} className={`qr-card ${isRoom ? 'room' : 'stairs'}`}>
                      <h3>МТУСИ Навигатор</h3>
                      <div className="qr-label">{qr.label}</div>
                      <QRCodeSVG
                        value={url}
                        size={150}
                        level="M"
                        includeMargin
                      />
                      <div className="qr-hint">Отсканируйте для навигации</div>
                      <div className="qr-url">{url}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
