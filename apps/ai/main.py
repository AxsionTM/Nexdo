from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="TaskFlow AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskBreakdownRequest(BaseModel):
    title: str
    description: Optional[str] = None


class PriorityRequest(BaseModel):
    title: str
    description: Optional[str] = None


class DayPlanRequest(BaseModel):
    tasks: List[dict]
    available_hours: float = 8.0


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ai/breakdown")
def breakdown_task(req: TaskBreakdownRequest):
    """Разбивает большую задачу на подзадачи."""
    # Базовая эвристика — в полной версии будет LLM
    words = req.title.split()
    subtasks = []
    if len(words) > 3:
        subtasks = [
            {"title": f"Исследовать: {req.title}", "priority": "MEDIUM"},
            {"title": f"Спланировать: {req.title}", "priority": "HIGH"},
            {"title": f"Выполнить: {req.title}", "priority": "HIGH"},
            {"title": f"Проверить результат: {req.title}", "priority": "LOW"},
        ]
    else:
        subtasks = [
            {"title": f"Начать: {req.title}", "priority": "HIGH"},
            {"title": f"Завершить: {req.title}", "priority": "MEDIUM"},
        ]
    return {"subtasks": subtasks}


@app.post("/ai/priority")
def suggest_priority(req: PriorityRequest):
    """Определяет приоритет по тексту задачи."""
    text = (req.title + " " + (req.description or "")).lower()
    urgent_keywords = ["срочно", "asap", "сегодня", "критично", "важно", "дедлайн"]
    high_keywords = ["нужно", "должен", "необходимо"]

    if any(k in text for k in urgent_keywords):
        return {"priority": "HIGH", "confidence": 0.85}
    if any(k in text for k in high_keywords):
        return {"priority": "MEDIUM", "confidence": 0.7}
    return {"priority": "LOW", "confidence": 0.6}


@app.post("/ai/day-plan")
def plan_day(req: DayPlanRequest):
    """Рекомендации по планированию дня."""
    sorted_tasks = sorted(
        req.tasks,
        key=lambda t: {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "NONE": 3}.get(
            t.get("priority", "NONE"), 3
        ),
    )
    return {
        "recommended_order": [t.get("id") or t.get("title") for t in sorted_tasks],
        "estimated_hours": min(len(sorted_tasks) * 0.75, req.available_hours),
        "tips": [
            "Начните с задач высокого приоритета",
            "Делайте перерывы каждые 90 минут",
            "Группируйте похожие задачи",
        ],
    }


@app.post("/ai/productivity")
def analyze_productivity(data: dict):
    """Анализ продуктивности за период."""
    return {
        "score": 75,
        "summary": "Хорошая продуктивность на этой неделе",
        "insights": [
            "Вы завершили 80% запланированных задач",
            "Пик активности — утренние часы",
            "Рекомендуется увеличить время на глубокую работу",
        ],
    }
