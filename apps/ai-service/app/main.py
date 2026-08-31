from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

app = FastAPI(
    title="TickTick Clone AI Service",
    description="Умные функции: разбиение задач, приоритеты, рекомендации",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskSplitRequest(BaseModel):
    title: str
    description: Optional[str] = None


class TaskSplitResponse(BaseModel):
    subtasks: List[str]


class PriorityRequest(BaseModel):
    title: str
    description: Optional[str] = None


class PriorityResponse(BaseModel):
    priority: str  # NONE | LOW | MEDIUM | HIGH
    due_suggestion: Optional[str] = None
    confidence: float


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/split-task", response_model=TaskSplitResponse)
def split_task(req: TaskSplitRequest):
    """
    Умное разбиение большой задачи на подзадачи.
    Пока простой эвристический алгоритм (можно заменить на LLM).
    """
    title = req.title.lower()
    subtasks = []

    if "подготовить" in title or "организовать" in title:
        subtasks = [
            "Составить список необходимого",
            "Заказать / купить материалы",
            "Подготовить место / оборудование",
            "Выполнить основную работу",
            "Проверить результат",
        ]
    elif "написать" in title or "создать" in title:
        subtasks = [
            "Собрать информацию и материалы",
            "Составить план / структуру",
            "Написать черновик",
            "Отредактировать и проверить",
            "Финализировать и опубликовать",
        ]
    else:
        # Общий fallback
        words = req.title.split()
        if len(words) > 4:
            mid = len(words) // 2
            subtasks = [
                " ".join(words[:mid]),
                " ".join(words[mid:]),
                "Проверить и доработать",
            ]
        else:
            subtasks = [
                f"Подготовка к: {req.title}",
                f"Выполнение: {req.title}",
                "Проверка результата",
            ]

    return TaskSplitResponse(subtasks=subtasks)


@app.post("/suggest-priority", response_model=PriorityResponse)
def suggest_priority(req: PriorityRequest):
    """
    Автоматическое определение приоритета по тексту задачи.
    """
    text = (req.title + " " + (req.description or "")).lower()

    high_keywords = ["срочно", "важно", "критично", "дедлайн", "asap", "сегодня"]
    medium_keywords = ["нужно", "следует", "на этой неделе", "скоро"]

    if any(k in text for k in high_keywords):
        return PriorityResponse(priority="HIGH", due_suggestion="сегодня", confidence=0.85)
    if any(k in text for k in medium_keywords):
        return PriorityResponse(priority="MEDIUM", due_suggestion="на этой неделе", confidence=0.7)

    return PriorityResponse(priority="LOW", confidence=0.6)


@app.get("/")
def root():
    return {
        "message": "TickTick Clone AI Service",
        "endpoints": ["/health", "/split-task", "/suggest-priority"],
    }
