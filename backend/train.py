"""
Скрипт обучения и оценки TF-IDF модели.

Запуск: python train.py

Выводит:
- Метрики обучения
- Тестовые запросы с результатами
- Оценку качества (Precision@1, Precision@3)
"""

from search_engine import RoomSearchEngine


def main():
    engine = RoomSearchEngine()

    # 1. Обучение модели
    print("=" * 60)
    print("  ОБУЧЕНИЕ TF-IDF МОДЕЛИ")
    print("=" * 60)

    metrics = engine.train()
    print(f"\n📊 Метрики обучения:")
    print(f"   Размер словаря:     {metrics['vocabulary_size']}")
    print(f"   Документов:         {metrics['documents_count']}")
    print(f"   Матрица TF-IDF:     {metrics['matrix_shape']}")

    # 2. Сохранение модели
    engine.save_model()
    print(f"\n💾 Модель сохранена в data/model.joblib")

    # 3. Тестовые запросы
    print(f"\n{'=' * 60}")
    print("  ТЕСТОВЫЕ ЗАПРОСЫ")
    print("=" * 60)

    test_queries = [
        ("программирование", "f3-01"),
        ("базы данных", "f3-02"),
        ("матан", "f2-01"),
        ("столовая", "f1-05"),
        ("где Иванов", "f2-05"),
        ("компьютерные сети", "f3-04"),
        ("библиотека", "f1-04"),
        ("кафедра информатики", "f5-04"),
        ("спортзал", "f5-08"),
        ("робототехника", "f4-08"),
        ("машинное обучение", "f3-06"),
        ("SQL", "f3-02"),
        ("электроника", "f4-02"),
        ("диплом защита", "f5-01"),
        ("лаба", "f3-01"),
    ]

    correct_at_1 = 0
    correct_at_3 = 0
    total = len(test_queries)

    for query, expected_id in test_queries:
        results = engine.search(query, top_k=3)
        top1 = results[0]["node_id"] if results else "—"
        top3_ids = [r["node_id"] for r in results[:3]]

        is_correct_1 = top1 == expected_id
        is_correct_3 = expected_id in top3_ids

        if is_correct_1:
            correct_at_1 += 1
        if is_correct_3:
            correct_at_3 += 1

        status = "✅" if is_correct_1 else ("🟡" if is_correct_3 else "❌")

        print(f"\n  {status} Запрос: \"{query}\"")
        print(f"     Ожидалось: {expected_id}")
        for r in results:
            marker = " ←" if r["node_id"] == expected_id else ""
            print(f"     → {r['name']} (score: {r['score']:.4f}){marker}")

    # 4. Итоговые метрики
    p1 = correct_at_1 / total
    p3 = correct_at_3 / total

    print(f"\n{'=' * 60}")
    print("  МЕТРИКИ КАЧЕСТВА")
    print("=" * 60)
    print(f"\n  Precision@1:  {correct_at_1}/{total} = {p1:.1%}")
    print(f"  Precision@3:  {correct_at_3}/{total} = {p3:.1%}")
    print(f"\n  {'✅ Отличное качество!' if p1 >= 0.8 else '⚠️ Требуется доработка описаний аудиторий'}")


if __name__ == "__main__":
    main()
