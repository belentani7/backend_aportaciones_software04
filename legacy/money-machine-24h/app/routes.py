from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    Result,
    Schedule,
    ScheduleFrequency,
    Task,
    TaskStatus,
    init_db,
)
from app.scheduler import get_scheduler

logger = structlog.get_logger(__name__)
router = APIRouter()
settings = get_settings()
_session_factory = init_db(settings.DATABASE_URL)


def get_db() -> Session:
    session = _session_factory()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    payload: Optional[str] = None
    priority: int = Field(default=0, ge=0, le=100)
    max_retries: int = Field(default=3, ge=0, le=10)


class TaskUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    payload: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = Field(None, ge=0, le=100)
    max_retries: Optional[int] = Field(None, ge=0, le=10)


class TaskResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: TaskStatus
    payload: Optional[str]
    result: Optional[str]
    priority: int
    retries: int
    max_retries: int
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    execution_time_ms: Optional[float]

    class Config:
        from_attributes = True


class ScheduleCreate(BaseModel):
    task_id: int
    frequency: ScheduleFrequency = ScheduleFrequency.ONCE
    interval_seconds: Optional[int] = Field(None, ge=1)
    cron_expression: Optional[str] = None
    next_run_at: Optional[datetime] = None
    enabled: bool = True


class ScheduleResponse(BaseModel):
    id: int
    task_id: int
    frequency: ScheduleFrequency
    interval_seconds: Optional[int]
    cron_expression: Optional[str]
    next_run_at: Optional[datetime]
    last_run_at: Optional[datetime]
    enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ResultResponse(BaseModel):
    id: int
    task_id: int
    output: Optional[str]
    metrics_json: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Task routes
# ---------------------------------------------------------------------------

@router.get("/tasks", response_model=PaginatedResponse, tags=["tasks"])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[TaskStatus] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    total = query.count()
    items = (
        query.order_by(Task.priority.desc(), Task.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PaginatedResponse(
        items=[TaskResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/tasks", response_model=TaskResponse, status_code=201, tags=["tasks"])
def create_task(body: TaskCreate, db: Session = Depends(get_db)):
    task = Task(
        name=body.name,
        description=body.description,
        payload=body.payload,
        priority=body.priority,
        max_retries=body.max_retries,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    logger.info("task_created", task_id=task.id, name=task.name)
    return TaskResponse.model_validate(task)


@router.get("/tasks/{task_id}", response_model=TaskResponse, tags=["tasks"])
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse, tags=["tasks"])
def update_task(task_id: int, body: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    logger.info("task_updated", task_id=task.id, fields=list(update_data.keys()))
    return TaskResponse.model_validate(task)


@router.delete("/tasks/{task_id}", status_code=204, tags=["tasks"])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    logger.info("task_deleted", task_id=task_id)


@router.post("/tasks/{task_id}/run", response_model=TaskResponse, tags=["tasks"])
def run_task_now(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    scheduler = get_scheduler()
    schedule = Schedule(
        task_id=task.id,
        frequency=ScheduleFrequency.ONCE,
        enabled=True,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    scheduler.reschedule(schedule.id)
    logger.info("task_triggered", task_id=task.id)
    return TaskResponse.model_validate(task)


# ---------------------------------------------------------------------------
# Schedule routes
# ---------------------------------------------------------------------------

@router.get("/schedules", response_model=list[ScheduleResponse], tags=["schedules"])
def list_schedules(db: Session = Depends(get_db)):
    return [ScheduleResponse.model_validate(s) for s in db.query(Schedule).all()]


@router.post("/schedules", response_model=ScheduleResponse, status_code=201, tags=["schedules"])
def create_schedule(body: ScheduleCreate, db: Session = Depends(get_db)):
    task = db.query(Task).get(body.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    schedule = Schedule(
        task_id=body.task_id,
        frequency=body.frequency,
        interval_seconds=body.interval_seconds,
        cron_expression=body.cron_expression,
        next_run_at=body.next_run_at,
        enabled=int(body.enabled),
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    scheduler = get_scheduler()
    scheduler.reschedule(schedule.id)
    logger.info("schedule_created", schedule_id=schedule.id, task_id=body.task_id)
    return ScheduleResponse.model_validate(schedule)


@router.delete("/schedules/{schedule_id}", status_code=204, tags=["schedules"])
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).get(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    scheduler = get_scheduler()
    scheduler.reschedule(schedule.id)
    db.delete(schedule)
    db.commit()
    logger.info("schedule_deleted", schedule_id=schedule_id)


# ---------------------------------------------------------------------------
# Results routes
# ---------------------------------------------------------------------------

@router.get("/tasks/{task_id}/results", response_model=list[ResultResponse], tags=["results"])
def list_results(
    task_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    task = db.query(Task).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    results = (
        db.query(Result)
        .filter(Result.task_id == task_id)
        .order_by(Result.created_at.desc())
        .limit(limit)
        .all()
    )
    return [ResultResponse.model_validate(r) for r in results]
