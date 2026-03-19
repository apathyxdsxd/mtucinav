import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { qrPoints } from '../data/floors';

const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/0/03/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.svg';

function AnimatedCounter({ end, duration = 800 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [end, duration]);

  return <>{count}</>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      className="qrp-copy-btn no-print"
      onClick={handleCopy}
      title="Скопировать ссылку"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span>{copied ? 'Скопировано' : 'Копировать'}</span>
    </button>
  );
}

const FLOORS = [1, 2, 3, 4, 5];

export default function QRCodesPage() {
  const baseUrl = window.location.origin;
  const [filterFloor, setFilterFloor] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'rooms' | 'other'>('all');
  const [search, setSearch] = useState('');
  const floorRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const filtered = qrPoints.filter((qr) => {
    if (filterFloor && qr.floor !== filterFloor) return false;
    if (filterType === 'rooms' && !qr.nodeId.match(/f\d+-\d+/)) return false;
    if (filterType === 'other' && qr.nodeId.match(/f\d+-\d+/)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!qr.label.toLowerCase().includes(q) && !qr.nodeId.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped: Record<number, typeof qrPoints> = {};
  for (const qr of filtered) {
    if (!grouped[qr.floor]) grouped[qr.floor] = [];
    grouped[qr.floor].push(qr);
  }

  const totalRooms = qrPoints.filter(q => q.nodeId.match(/f\d+-\d+/)).length;
  const totalOther = qrPoints.length - totalRooms;
  const totalFloors = new Set(qrPoints.map(q => q.floor)).size;

  const scrollToFloor = (floor: number) => {
    setFilterFloor(0);
    setTimeout(() => {
      const el = floorRefs.current[floor];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="qrp-page fade-in">
      <div className="header">
        <h1>
          <img src={LOGO_URL} alt="МТУСИ" style={{ height: 28, filter: 'brightness(0) invert(1)' }} />
          МТУСИ Навигатор
        </h1>
        <p>QR-коды для размещения в здании</p>
      </div>

      <div className="qrp-container">
        {/* Stats row */}
        <div className="qrp-stats no-print">
          <div className="qrp-stat-card">
            <div className="qrp-stat-icon qrp-stat-icon--purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className="qrp-stat-info">
              <span className="qrp-stat-number"><AnimatedCounter end={qrPoints.length} /></span>
              <span className="qrp-stat-label">QR-кодов</span>
            </div>
          </div>

          <div className="qrp-stat-card">
            <div className="qrp-stat-icon qrp-stat-icon--blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="qrp-stat-info">
              <span className="qrp-stat-number"><AnimatedCounter end={totalRooms} /></span>
              <span className="qrp-stat-label">Аудиторий</span>
            </div>
          </div>

          <div className="qrp-stat-card">
            <div className="qrp-stat-icon qrp-stat-icon--amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="qrp-stat-info">
              <span className="qrp-stat-number"><AnimatedCounter end={totalOther} /></span>
              <span className="qrp-stat-label">Навигация</span>
            </div>
          </div>

          <div className="qrp-stat-card">
            <div className="qrp-stat-icon qrp-stat-icon--green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="12" y2="18" />
              </svg>
            </div>
            <div className="qrp-stat-info">
              <span className="qrp-stat-number"><AnimatedCounter end={totalFloors} /></span>
              <span className="qrp-stat-label">Этажей</span>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="qrp-toolbar card no-print">
          <div className="qrp-search-wrap">
            <svg className="qrp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="qrp-search"
              placeholder="Поиск по названию или ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="qrp-search-clear" onClick={() => setSearch('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="qrp-filters-row">
            <div className="qrp-floor-pills">
              <button
                className={`qrp-pill ${filterFloor === 0 ? 'qrp-pill--active' : ''}`}
                onClick={() => setFilterFloor(0)}
              >
                Все
              </button>
              {FLOORS.map((f) => (
                <button
                  key={f}
                  className={`qrp-pill ${filterFloor === f ? 'qrp-pill--active' : ''}`}
                  onClick={() => setFilterFloor(f)}
                >
                  {f} этаж
                </button>
              ))}
            </div>

            <div className="qrp-actions">
              <select
                className="qrp-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'rooms' | 'other')}
              >
                <option value="all">Все точки</option>
                <option value="rooms">Аудитории</option>
                <option value="other">Лестницы / коридоры</option>
              </select>

              <button className="btn btn-primary" onClick={() => window.print()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                </svg>
                Печать ({filtered.length})
              </button>

              <a href="/" className="btn btn-outline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Назад
              </a>
            </div>
          </div>

          {/* Quick scroll links */}
          {filterFloor === 0 && (
            <div className="qrp-quick-nav">
              <span className="qrp-quick-nav-label">Перейти:</span>
              {FLOORS.map((f) => (
                grouped[f] ? (
                  <button
                    key={f}
                    className="qrp-quick-link"
                    onClick={() => scrollToFloor(f)}
                  >
                    {f} этаж
                  </button>
                ) : null
              ))}
            </div>
          )}

          <div className="qrp-results-count">
            Найдено: <strong>{filtered.length}</strong> из {qrPoints.length}
          </div>
        </div>

        {/* Floor sections */}
        {filtered.length === 0 && (
          <div className="qrp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <p>Ничего не найдено</p>
            <span>Попробуйте изменить параметры поиска</span>
          </div>
        )}

        {FLOORS.map((floor) => {
          const floorQRs = grouped[floor];
          if (!floorQRs || floorQRs.length === 0) return null;
          return (
            <div
              key={floor}
              className="qrp-floor-section"
              ref={(el) => { floorRefs.current[floor] = el; }}
            >
              <div className="qrp-floor-header">
                <div className="qrp-floor-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="16" y2="14" />
                  </svg>
                  Этаж {floor}
                </div>
                <span className="qrp-floor-count">{floorQRs.length} QR-кодов</span>
                <div className="qrp-floor-line" />
              </div>

              <div className="qr-grid qrp-grid">
                {floorQRs.map((qr, index) => {
                  const url = `${baseUrl}/?loc=${qr.nodeId}`;
                  const isRoom = !!qr.nodeId.match(/f\d+-\d+/);
                  return (
                    <div
                      key={qr.id}
                      className={`qrp-card ${isRoom ? 'qrp-card--room' : 'qrp-card--nav'}`}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="qrp-card-inner">
                        <div className="qrp-card-type-badge">
                          {isRoom ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                              </svg>
                              Аудитория
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 17V7l-5 5" /><path d="M6 17h12" />
                              </svg>
                              Навигация
                            </>
                          )}
                        </div>

                        <div className="qrp-card-label">{qr.label}</div>

                        <div className="qrp-qr-wrap">
                          <QRCodeSVG
                            value={url}
                            size={140}
                            level="M"
                            includeMargin
                            bgColor="transparent"
                            fgColor="#1a1a2e"
                            className="qrp-qr-svg"
                          />
                        </div>

                        <div className="qrp-card-hint">Отсканируйте для навигации</div>
                        <div className="qrp-card-url">{url}</div>

                        <CopyButton text={url} />
                      </div>
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
