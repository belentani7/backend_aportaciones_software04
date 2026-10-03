from __future__ import annotations

import signal
import sys
import time

import structlog

from app.config import get_settings
from app.models import init_db
from app.scheduler import MoneyScheduler

logger = structlog.get_logger(__name__)
settings = get_settings()


def main() -> None:
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.PrintLoggerFactory(),
    )

    logger.info("scheduler_boot", database_url=settings.DATABASE_URL)
    session_factory = init_db(settings.DATABASE_URL)
    scheduler = MoneyScheduler(session_factory)

    def _shutdown(signum, frame):
        logger.info("scheduler_signal", signal=signum)
        scheduler.shutdown(wait=True)
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    scheduler.start()
    logger.info("scheduler_running", pid=__import__("os").getpid())

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        scheduler.shutdown(wait=True)
        logger.info("scheduler_exited")


if __name__ == "__main__":
    main()
