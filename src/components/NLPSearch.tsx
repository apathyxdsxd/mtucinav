import { useState, useRef, useEffect, useCallback } from 'react';

interface SearchResult {
  node_id: string;
  floor: number;
  label: string;
  name: string;
  score: number;
  confidence: string;
}

interface NLPSearchProps {
  onSelectRoom: (nodeId: string) => void;
  currentNodeId?: string;
}

const API_URL = 'http://localhost:8000';

export default function NLPSearch({ onSelectRoom, currentNodeId }: NLPSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Проверка доступности бэкенда
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((r) => r.json())
      .then(() => setBackendAvailable(true))
      .catch(() => setBackendAvailable(false));
  }, []);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}&top_k=5`);
      const data = await res.json();
      setResults(data.results);
      setIsOpen(data.results.length > 0);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    onSelectRoom(result.node_id);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  if (backendAvailable === false) {
    return null; // Бэкенд недоступен — скрываем поиск
  }

  return (
    <div className="nlp-search" ref={containerRef}>
      <div className="nlp-search-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <span>NLP-поиск аудиторий</span>
        <span className="nlp-badge">ML</span>
      </div>

      <div className="nlp-input-wrap">
        <input
          type="text"
          className="nlp-input"
          placeholder="Например: &laquo;программирование&raquo;, &laquo;столовая&raquo;, &laquo;Иванов&raquo;..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {loading && <div className="nlp-spinner" />}
        {query && !loading && (
          <button className="nlp-clear" onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="nlp-results">
          {results.map((r) => (
            <button
              key={r.node_id}
              className={`nlp-result-item ${r.node_id === currentNodeId ? 'nlp-result-current' : ''}`}
              onClick={() => handleSelect(r)}
              disabled={r.node_id === currentNodeId}
            >
              <div className="nlp-result-main">
                <span className="nlp-result-name">{r.name}</span>
                <span className="nlp-result-floor">Этаж {r.floor}</span>
              </div>
              <div className="nlp-result-meta">
                <div className={`nlp-confidence nlp-confidence--${r.confidence}`}>
                  {Math.round(r.score * 100)}%
                </div>
                {r.node_id === currentNodeId && <span className="nlp-result-here">вы здесь</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
