# Money Machine 24H

Autonomous revenue-generation engine. FastAPI + APScheduler + SQLAlchemy + PostgreSQL.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Start all services (database, redis, api, worker, scheduler)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

API will be available at `http://localhost:8000`

### Option 2: Local Development

```bash
# Copy environment file
cp .env.example .env

# Install dependencies
make install

# Create demo data
make seed

# Start API server
make run

# Start scheduler (in separate terminal)
make scheduler
```

## 📚 API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `GET http://localhost:8000/health`
- **Metrics**: `GET http://localhost:8000/metrics`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tasks` | List tasks (paginated, filterable) |
| `POST` | `/api/v1/tasks` | Create task |
| `GET` | `/api/v1/tasks/{id}` | Get task |
| `PATCH` | `/api/v1/tasks/{id}` | Update task |
| `DELETE` | `/api/v1/tasks/{id}` | Delete task |
| `POST` | `/api/v1/tasks/{id}/run` | Trigger immediate execution |
| `GET` | `/api/v1/schedules` | List schedules |
| `POST` | `/api/v1/schedules` | Create schedule |
| `DELETE` | `/api/v1/schedules/{id}` | Delete schedule |
| `GET` | `/api/v1/tasks/{id}/results` | Task execution results |

## 🛠️ Make Targets

```
make install       Install runtime deps
make dev           Install dev deps + pre-commit
make run           Start API (reload)
make scheduler     Start 24H scheduler
make seed          Seed demo data
make test          Run pytest
make test-cov      Run pytest with coverage
make lint          Ruff check
make format        Ruff format
make typecheck     Mypy
make clean         Remove artifacts
make migrate       Alembic upgrade head
make docker-up     Docker compose up
make docker-down   Docker compose down
```

## 🏗️ Architecture

```
money-machine-24h/
├── alembic/                 # Database migrations
│   ├── versions/            # Migration scripts
│   └── env.py               # Alembic configuration
├── app/
│   ├── __init__.py
│   ├── config.py            # pydantic-settings
│   ├── main.py              # FastAPI app + middleware
│   ├── models.py            # SQLAlchemy models
│   ├── routes.py            # API CRUD + schemas
│   ├── scheduler.py         # APScheduler 24H engine
│   ├── core/                # Security, database, config
│   ├── services/            # Business logic
│   └── tasks/               # Celery tasks
├── scripts/
│   ├── run_scheduler.py     # Scheduler entry point
│   └── seed.py              # Demo data seeder
├── tests/                   # Pytest test suite
├── docker-compose.yml       # Docker orchestration
├── Dockerfile               # Container image
├── init.sql                 # Database initialization
├── requirements.txt         # Python dependencies
├── Makefile                 # Build commands
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage report
make test-cov

# Run specific test file
pytest tests/test_api.py -v

# Run specific test class
pytest tests/test_api.py::TestTasksAPI -v
```

## 🔒 Security Features

- **Password Hashing**: bcrypt via passlib
- **JWT Authentication**: python-jose
- **Data Encryption**: cryptography library (AES-256)
- **Rate Limiting**: slowapi
- **CORS Protection**: Configurable origins
- **Audit Logging**: Immutable change tracking

## 📊 Monitoring

- **Prometheus Metrics**: Available at `/metrics`
- **Structured Logging**: JSON logs with structlog
- **Health Checks**: `/health` endpoint
- **Request Timing**: X-Process-Time header

## 🔄 Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply all migrations
make migrate

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./money_machine.db` | Database connection string |
| `SECRET_KEY` | `change-me-in-production` | Secret key for JWT |
| `DEBUG` | `false` | Enable debug mode |
| `LOG_LEVEL` | `INFO` | Logging level |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |
| `CORS_ORIGINS` | `["*"]` | Allowed CORS origins |

## 📝 License

Proprietary — Belentani Agency AI Omega
