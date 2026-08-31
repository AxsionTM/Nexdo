FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# main:app — module main.py, FastAPI instance named app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
