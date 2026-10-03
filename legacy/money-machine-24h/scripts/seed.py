from __future__ import annotations

import structlog

from app.config import get_settings
from app.models import Schedule, ScheduleFrequency, Task, TaskStatus, init_db

logger = structlog.get_logger(__name__)
settings = get_settings()


def seed() -> None:
    session_factory = init_db(settings.DATABASE_URL)
    session = session_factory()

    existing = session.query(Task).count()
    if existing > 0:
        logger.info("seed_skipped", existing_tasks=existing)
        session.close()
        return

    tasks_data = [
        {
            "name": "market-scan",
            "description": "Scan market opportunities across configured channels",
            "payload": '{"channels": ["twitter", "reddit", "hn"]}',
            "priority": 10,
            "max_retries": 3,
        },
        {
            "name": "content-generator",
            "description": "Generate marketing content from trending topics",
            "payload": '{"template": "blog_post", "tone": "professional"}',
            "priority": 5,
            "max_retries": 2,
        },
        {
            "name": "revenue-tracker",
            "description": "Aggregate revenue metrics from payment providers",
            "payload": '{"providers": ["stripe", "paypal"]}',
            "priority": 8,
            "max_retries": 5,
        },
        {
            "name": "lead-nurturer",
            "description": "Send follow-up sequences to qualified leads",
            "payload": '{"sequence": "cold-outreach-v2", "batch_size": 50}',
            "priority": 7,
            "max_retries": 3,
        },
        {
            "name": "analytics-digest",
            "description": "Compile daily analytics digest and alert anomalies",
            "payload": '{"metrics": ["visits", "conversions", "revenue"], "anomaly_threshold": 2.0}',
            "priority": 6,
            "max_retries": 2,
        },
    ]

    schedules_data = [
        (0, ScheduleFrequency.HOURLY, 3600),
        (1, ScheduleFrequency.DAILY, None),
        (2, ScheduleFrequency.HOURLY, 1800),
        (3, ScheduleFrequency.DAILY, None),
        (4, ScheduleFrequency.DAILY, None),
    ]

    created_tasks = []
    for data in tasks_data:
        task = Task(
            name=data["name"],
            description=data["description"],
            payload=data["payload"],
            priority=data["priority"],
            max_retries=data["max_retries"],
            status=TaskStatus.PENDING,
        )
        session.add(task)
        session.flush()
        created_tasks.append(task)
        logger.info("seed_task_created", task_id=task.id, name=task.name)

    for task_idx, freq, interval in schedules_data:
        schedule = Schedule(
            task_id=created_tasks[task_idx].id,
            frequency=freq,
            interval_seconds=interval,
            enabled=1,
        )
        session.add(schedule)
        logger.info("seed_schedule_created", task_id=created_tasks[task_idx].id, frequency=freq.value)

    session.commit()
    logger.info("seed_complete", tasks=len(created_tasks), schedules=len(schedules_data))
    session.close()


if __name__ == "__main__":
    seed()
