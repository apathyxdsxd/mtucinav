import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { qrPoints } from '../data/floors';

export default function QRCodesPage() {
  const baseUrl = window.location.origin;
  const [filterFloor, setFilterFloor] = useState<number>(0); // 0 = all
  const [filterType, setFilterType] = useState<'all' | 'rooms' | 'other'>('all');

  const filtered = qrPoints.filter((qr) => {
    if (filterFloor && qr.floor !== filterFloor) return false;
    if (filterType === 'rooms' && !qr.nodeId.match(/f\d+-\d+/)) return false;
    if (filterType === 'other' && qr.nodeId.match(/f\d+-\d+/)) return false;
    return true;
  });

  // Group by floor
  const grouped: Record<number, typeof qrPoints> = {};
  for (const qr of filtered) {
    if (!grouped[qr.floor]) grouped[qr.floor] = [];
    grouped[qr.floor].push(qr);
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24 }}>📋 QR-коды для навигации</h1>
      <p style={{ color: '#666', marginBottom: 8 }}>
        Распечатайте и разместите QR-коды в соответствующих местах здания.
        Всего: <strong>{qrPoints.length}</strong> кодов ({qrPoints.filter(q => q.nodeId.match(/f\d+-\d+/)).length} аудиторий + {qrPoints.filter(q => !q.nodeId.match(/f\d+-\d+/)).length} коридоров/лестниц).
      </p>
      <p style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
        Базовый URL: <code>{baseUrl}</code>
      </p>

      {/* Filters */}
      <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
        >
          <option value={0}>Все этажи</option>
          {[1, 2, 3, 4, 5].map((f) => (
            <option key={f} value={f}>Этаж {f}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'rooms' | 'other')}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
        >
          <option value="all">Все точки</option>
          <option value="rooms">Только аудитории</option>
          <option value="other">Только лестницы/коридоры</option>
        </select>
        <button
          onClick={() => window.print()}
          style={{
            background: '#4A90D9',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          🖨️ Распечатать ({filtered.length} шт.)
        </button>
      </div>

      {/* QR codes grouped by floor */}
      {[1, 2, 3, 4, 5].map((floor) => {
        const floorQRs = grouped[floor];
        if (!floorQRs || floorQRs.length === 0) return null;
        return (
          <div key={floor}>
            <h2 style={{ fontSize: 18, margin: '24px 0 12px', borderBottom: '2px solid #4A90D9', paddingBottom: 4 }}>
              Этаж {floor}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {floorQRs.map((qr) => {
                const url = `${baseUrl}/?loc=${qr.nodeId}`;
                const isRoom = qr.nodeId.match(/f\d+-\d+/);
                return (
                  <div
                    key={qr.id}
                    className="qr-card"
                    style={{
                      border: `2px solid ${isRoom ? '#333' : '#FF9800'}`,
                      borderRadius: 12,
                      padding: 16,
                      textAlign: 'center',
                      background: '#fff',
                      pageBreakInside: 'avoid',
                    }}
                  >
                    <h3 style={{ margin: '0 0 2px', fontSize: 14, color: '#666' }}>🏫 МТУЦИ Навигатор</h3>
                    <p style={{ margin: '0 0 10px', fontWeight: 'bold', fontSize: 16 }}>
                      {qr.label}
                    </p>
                    <QRCodeSVG
                      value={url}
                      size={160}
                      level="M"
                      includeMargin
                    />
                    <p style={{ margin: '8px 0 0', fontSize: 11, color: '#666' }}>
                      Отсканируйте для навигации
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 9, color: '#aaa', wordBreak: 'break-all' }}>
                      {url}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          h1 { font-size: 18px !important; }
          .qr-card { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
