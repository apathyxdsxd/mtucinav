"""
FastAPI бэкенд для NLP-поиска аудиторий МТУСИ Навигатора.

Endpoints:
  GET  /api/search?q=...&top_k=5  — поиск аудиторий по текстовому запросу
  GET  /api/rooms                  — список всех аудиторий
  GET  /api/health                 — проверка состояния сервера
  GET  /api/model-info             — информация о модели (для защиты диплома)
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from search_engine import RoomSearchEngine

app = FastAPI(
    title="МТУСИ Навигатор — NLP Search API",
    description="Поиск аудиторий на основе TF-IDF + Cosine Similarity",
    version="1.0.0",
)

# CORS — разрешаем запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация поискового движка
engine = RoomSearchEngine()
train_metrics = {}


class SearchResult(BaseModel):
    node_id: str
    floor: int
    label: str
    name: str
    score: float
    confidence: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total_found: int


@app.on_event("startup")
async def startup():
    """Загрузка/обучение модели при старте сервера."""
    global train_metrics
    train_metrics = engine.train()
    engine.save_model()
    print(f"✅ Модель загружена: {train_metrics}")


@app.get("/api/search", response_model=SearchResponse)
async def search_rooms(
    q: str = Query(..., min_length=1, description="Поисковый запрос"),
    top_k: int = Query(5, ge=1, le=20, description="Количество результатов"),
):
    """Поиск аудиторий по текстовому запросу (NLP).

    Примеры запросов:
    - "программирование" → ауд. 301
    - "где Иванов?" → ауд. 205
    - "столовая" → ауд. 105
    - "базы данных SQL" → ауд. 302
    """
    results = engine.search(q, top_k=top_k)
    return SearchResponse(
        query=q,
        results=results,
        total_found=len(results),
    )


@app.get("/api/rooms")
async def get_rooms():
    """Получить список всех аудиторий."""
    return engine.rooms


@app.get("/api/health")
async def health():
    """Проверка состояния сервера."""
    return {"status": "ok", "model_loaded": engine.is_trained}


@app.get("/api/model-info")
async def model_info():
    """Информация о модели (для защиты диплома).

    Возвращает:
    - Тип модели (TF-IDF)
    - Размер словаря
    - Количество документов
    - Параметры векторизатора
    """
    if not engine.vectorizer:
        return {"error": "Model not loaded"}

    params = engine.vectorizer.get_params()
    top_features = sorted(
        engine.vectorizer.vocabulary_.items(),
        key=lambda x: x[1],
    )[:20]

    return {
        "model_type": "TF-IDF + Cosine Similarity",
        "library": "scikit-learn",
        "vocabulary_size": len(engine.vectorizer.vocabulary_),
        "documents_count": len(engine.rooms),
        "vectorizer_params": {
            "ngram_range": params["ngram_range"],
            "min_df": params["min_df"],
            "max_df": params["max_df"],
            "norm": params["norm"],
            "sublinear_tf": params["sublinear_tf"],
        },
        "sample_features": [f[0] for f in top_features],
        "train_metrics": train_metrics,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
