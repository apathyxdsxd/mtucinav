"""
NLP-поиск аудиторий на основе TF-IDF + Cosine Similarity.

Модуль выполняет:
1. Загрузку данных аудиторий с текстовыми описаниями
2. Построение TF-IDF матрицы по корпусу описаний
3. Поиск наиболее релевантных аудиторий по текстовому запросу
"""

import json
import os
import re
from difflib import get_close_matches
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


class RoomSearchEngine:
    """Поисковый движок аудиторий на основе TF-IDF."""

    def __init__(self, data_path: str | None = None):
        self.data_path = data_path or str(
            Path(__file__).parent / "data" / "rooms_data.json"
        )
        self.rooms: list[dict] = []
        self.vectorizer: TfidfVectorizer | None = None
        self.tfidf_matrix = None
        self.is_trained = False

    def load_data(self) -> None:
        """Загрузка данных аудиторий из JSON."""
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.rooms = json.load(f)

    def _build_corpus(self) -> list[str]:
        """Построение текстового корпуса из данных аудиторий.

        Для каждой аудитории объединяются: название, номер, ключевые слова.
        Это позволяет искать по любому из этих полей.
        """
        corpus = []
        for room in self.rooms:
            keywords = room.get("keywords", "")
            text_parts = [
                room["name"],
                room["label"],
                keywords,
                keywords,
                keywords,
            ]
            # Объединяем и приводим к нижнему регистру
            combined = " ".join(text_parts).lower()
            corpus.append(combined)
        return corpus

    def train(self) -> dict:
        """Обучение TF-IDF модели на корпусе аудиторий.

        Returns:
            Метрики обучения: размер словаря, количество документов
        """
        self.load_data()
        corpus = self._build_corpus()

        self.vectorizer = TfidfVectorizer(
            # Разбиваем на слова и биграммы для лучшего покрытия
            ngram_range=(1, 2),
            # Минимальная частота: слово должно встречаться хотя бы 1 раз
            min_df=1,
            # Максимальная частота: убираем слова из >90% документов
            max_df=0.9,
            # Используем l2 нормализацию
            norm="l2",
            # Субчастотная нормализация TF
            sublinear_tf=True,
        )

        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.is_trained = True

        return {
            "vocabulary_size": len(self.vectorizer.vocabulary_),
            "documents_count": len(self.rooms),
            "matrix_shape": list(self.tfidf_matrix.shape),
        }

    def _correct_query(self, query: str) -> tuple[str, bool]:
        """Исправление опечаток в запросе на основе словаря модели.

        Для каждого слова запроса, которого нет в словаре TF-IDF,
        ищет ближайшее совпадение через difflib (расстояние Ратклиффа-Оберхелпа).

        Returns:
            (исправленный запрос, был ли исправлен)
        """
        if not self.vectorizer:
            return query, False

        vocabulary = set(self.vectorizer.vocabulary_.keys())
        # Только unigram-слова для корректировки
        vocab_words = {w for w in vocabulary if " " not in w and len(w) >= 3}

        words = query.split()
        corrected = []
        was_corrected = False

        for word in words:
            if word in vocabulary or len(word) < 3:
                corrected.append(word)
                continue

            matches = get_close_matches(word, vocab_words, n=1, cutoff=0.7)
            if matches:
                corrected.append(matches[0])
                was_corrected = True
            else:
                corrected.append(word)

        return " ".join(corrected), was_corrected

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Поиск аудиторий по текстовому запросу.

        Args:
            query: Текстовый запрос пользователя
            top_k: Количество результатов

        Returns:
            Список аудиторий с оценкой релевантности (score)
        """
        if not self.is_trained:
            self.train()

        # Предобработка запроса
        query_clean = query.lower().strip()
        if not query_clean:
            return []

        # Исправление опечаток
        query_corrected, was_corrected = self._correct_query(query_clean)

        # Преобразуем запрос в TF-IDF вектор
        query_vector = self.vectorizer.transform([query_corrected])

        # Вычисляем cosine similarity между запросом и всеми аудиториями
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # Сортируем по убыванию similarity
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            raw_score = float(similarities[idx])
            if raw_score > 0.0:
                # Усиливаем score но сохраняем разницу между хорошими и плохими совпадениями
                score = min(raw_score * 5, 0.99)
                room = self.rooms[idx]
                results.append({
                    "node_id": room["node_id"],
                    "floor": room["floor"],
                    "label": room["label"],
                    "name": room["name"],
                    "score": round(score, 4),
                    "confidence": _score_to_confidence(score),
                })

        # Если запрос был исправлен и нашлись результаты — сообщаем
        if was_corrected and results:
            results[0]["corrected_query"] = query_corrected

        return results

    def save_model(self, path: str | None = None) -> None:
        """Сохранение обученной модели на диск."""
        save_path = path or str(Path(__file__).parent / "data" / "model.joblib")
        joblib.dump(
            {
                "vectorizer": self.vectorizer,
                "tfidf_matrix": self.tfidf_matrix,
                "rooms": self.rooms,
            },
            save_path,
        )

    def load_model(self, path: str | None = None) -> None:
        """Загрузка обученной модели с диска."""
        load_path = path or str(Path(__file__).parent / "data" / "model.joblib")
        if not os.path.exists(load_path):
            self.train()
            self.save_model(load_path)
            return

        data = joblib.load(load_path)
        self.vectorizer = data["vectorizer"]
        self.tfidf_matrix = data["tfidf_matrix"]
        self.rooms = data["rooms"]
        self.is_trained = True


def _score_to_confidence(score: float) -> str:
    """Преобразование score в уровень уверенности."""
    if score >= 0.7:
        return "high"
    elif score >= 0.4:
        return "medium"
    else:
        return "low"
