.PHONY: install dev run scheduler seed test test-cov lint format typecheck clean migrate docker-up docker-down db-shell

install:
	pip install -r requirements.txt

dev:
	pip install -r requirements.txt
	pip install pre-commit
	pre-commit install

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

scheduler:
	python scripts/run_scheduler.py

seed:
	python scripts/seed.py

test:
	pytest tests/ -v

test-cov:
	pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

lint:
	ruff check app/ scripts/

format:
	ruff format app/ scripts/

typecheck:
	mypy app/ scripts/

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	rm -rf .mypy_cache

migrate:
	alembic upgrade head

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

db-shell:
	sqlite3 money_machine.db
