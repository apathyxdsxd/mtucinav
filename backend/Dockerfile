FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Обучаем модель при сборке, чтобы не тратить время на старте
RUN python -c "from search_engine import RoomSearchEngine; e = RoomSearchEngine(); e.train(); e.save_model()"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
