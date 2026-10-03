from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Optional

import structlog
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Result, Schedule, ScheduleFrequency, Task, TaskStatus

logger = structlog.get_logger(__name__)


class MoneyScheduler:
    def __init__(self, session_factory) -> None:
        self._session_factory = session_factory
        settings = get_settings()
        self._scheduler = BackgroundScheduler(
            max_instances=settings.SCHEDULER_MAX_INSTANCES,
            coalesce=settings.SCHEDULER_COALESCING,
            job_defaults={
                "misfire_grace_time": settings.SCHEDULER_MISFIRE_GRACE_TIME,
            },
        )
        self._running = False

    def start(self) -> None:
        if self._running:
            logger.warning("scheduler_already_running")
            return
        self._scheduler.start()
        self._running = True
        logger.info("scheduler_started")
        self._sync_jobs()

    def shutdown(self, wait: bool = True) -> None:
        if not self._running:
            return
        self._scheduler.shutdown(wait=wait)
        self._running = False
        logger.info("scheduler_stopped")

    def _sync_jobs(self) -> None:
        session: Session = self._session_factory()
        try:
            schedules = session.query(Schedule).filter(Schedule.enabled == 1).all()
            existing_ids = {job.id for job in self._scheduler.get_jobs()}
            for sched in schedules:
                job_id = f"schedule_{sched.id}"
                if sched.id not in existing_ids:
                    self._add_job(session, sched, job_id)
            logger.info("jobs_synced", count=len(schedules))
        finally:
            session.close()

    def _add_job(self, session: Session, schedule: Schedule, job_id: str) -> None:
        trigger = self._build_trigger(schedule)
        if trigger is None:
            logger.warning("invalid_schedule", schedule_id=schedule.id)
            return
        self._scheduler.add_job(
            func=self._execute_task,
            trigger=trigger,
            args=[schedule.id],
            id=job_id,
            replace_existing=True,
        )
        logger.info("job_added", job_id=job_id, frequency=schedule.frequency.value)

    def _build_trigger(self, schedule: Schedule):
        if schedule.frequency == ScheduleFrequency.ONCE:
            if schedule.next_run_at:
                return CronTrigger(run_date=schedule.next_run_at)
            return None
        if schedule.frequency == ScheduleFrequency.HOURLY:
            interval = schedule.interval_seconds or 3600
            return IntervalTrigger(seconds=interval)
        if schedule.frequency == ScheduleFrequency.DAILY:
            return CronTrigger(hour="*", minute="0", second="0")
        if schedule.frequency == ScheduleFrequency.WEEKLY:
            return CronTrigger(day_of_week="mon", hour="0", minute="0")
        if schedule.frequency == ScheduleFrequency.MONTHLY:
            return CronTrigger(day=1, hour="0", minute="0")
        return None

    def _execute_task(self, schedule_id: int) -> None:
        session: Session = self._session_factory()
        try:
            schedule = session.query(Schedule).get(schedule_id)
            if schedule is None:
                logger.warning("schedule_not_found", schedule_id=schedule_id)
                return
            task = session.query(Task).get(schedule.task_id)
            if task is None:
                logger.warning("task_not_found", task_id=schedule.task_id)
                return

            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now(timezone.utc)
            schedule.last_run_at = datetime.now(timezone.utc)
            session.commit()

            start = time.monotonic()
            output = self._run_task_logic(task)
            elapsed_ms = (time.monotonic() - start) * 1000

            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc)
            task.execution_time_ms = elapsed_ms
            task.result = output

            result = Result(task_id=task.id, output=output)
            session.add(result)

            schedule.next_run_at = self._compute_next_run(schedule)
            session.commit()

            logger.info(
                "task_completed",
                task_id=task.id,
                name=task.name,
                elapsed_ms=round(elapsed_ms, 2),
            )
        except Exception as exc:
            session.rollback()
            if task is not None:
                task.status = TaskStatus.FAILED
                task.error_message = str(exc)[:2000]
                task.retries += 1
                if task.retries >= task.max_retries:
                    task.status = TaskStatus.FAILED
                session.commit()
            logger.error("task_failed", task_id=schedule.task_id, error=str(exc))
        finally:
            session.close()

    def _run_task_logic(self, task: Task) -> str:
        logger.info("executing_task", task_id=task.id, name=task.name, payload=task.payload)
        if task.payload:
            return f"executed:{task.name}:ok"
        return f"executed:{task.name}:no-payload"

    def _compute_next_run(self, schedule: Schedule) -> Optional[datetime]:
        if schedule.frequency == ScheduleFrequency.ONCE:
            return None
        now = datetime.now(timezone.utc)
        if schedule.frequency == ScheduleFrequency.HOURLY:
            interval = schedule.interval_seconds or 3600
            from datetime import timedelta
            return now + timedelta(seconds=interval)
        return None

    @property
    def jobs(self):
        return self._scheduler.get_jobs()

    def reschedule(self, schedule_id: int) -> bool:
        session: Session = self._session_factory()
        try:
            schedule = session.query(Schedule).get(schedule_id)
            if schedule is None:
                return False
            job_id = f"schedule_{schedule.id}"
            existing = self._scheduler.get_job(job_id)
            if existing:
                existing.remove()
            if schedule.enabled:
                self._add_job(session, schedule, job_id)
            return True
        finally:
            session.close()


_scheduler_instance: Optional[MoneyScheduler] = None


def get_scheduler(session_factory=None) -> MoneyScheduler:
    global _scheduler_instance
    if _scheduler_instance is None:
        if session_factory is None:
            from app.models import init_db
            settings = get_settings()
            session_factory = init_db(settings.DATABASE_URL)
        _scheduler_instance = MoneyScheduler(session_factory)
    return _scheduler_instance
