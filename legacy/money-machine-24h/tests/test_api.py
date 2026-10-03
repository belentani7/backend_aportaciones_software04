"""
Test suite for Money Machine 24H API
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models import Base, Task, TaskStatus


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_money_machine.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides = {
        # Add your get_db dependency here if you have it defined
    }
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides = {}


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestTasksAPI:
    """Test task-related endpoints"""
    
    def test_list_tasks_empty(self, client):
        """Test listing tasks when database is empty"""
        response = client.get("/api/v1/tasks")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
    
    def test_create_task(self, client):
        """Test creating a new task"""
        task_data = {
            "name": "Test Task",
            "description": "A test task",
            "priority": 5,
            "max_retries": 3
        }
        response = client.post("/api/v1/tasks", json=task_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Task"
        assert data["status"] == "pending"
        assert data["priority"] == 5
    
    def test_get_task(self, client, db_session):
        """Test retrieving a specific task"""
        # Create a task first
        task = Task(name="Get Task Test", status=TaskStatus.PENDING)
        db_session.add(task)
        db_session.commit()
        
        response = client.get(f"/api/v1/tasks/{task.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task.id
        assert data["name"] == "Get Task Test"
    
    def test_get_task_not_found(self, client):
        """Test retrieving a non-existent task"""
        response = client.get("/api/v1/tasks/99999")
        assert response.status_code == 404
    
    def test_update_task(self, client, db_session):
        """Test updating a task"""
        task = Task(name="Update Test", status=TaskStatus.PENDING)
        db_session.add(task)
        db_session.commit()
        
        update_data = {"name": "Updated Name", "priority": 10}
        response = client.patch(f"/api/v1/tasks/{task.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["priority"] == 10
    
    def test_delete_task(self, client, db_session):
        """Test deleting a task"""
        task = Task(name="Delete Test", status=TaskStatus.PENDING)
        db_session.add(task)
        db_session.commit()
        
        response = client.delete(f"/api/v1/tasks/{task.id}")
        assert response.status_code == 204
        
        # Verify deletion
        response = client.get(f"/api/v1/tasks/{task.id}")
        assert response.status_code == 404
    
    def test_list_tasks_pagination(self, client, db_session):
        """Test task list pagination"""
        # Create multiple tasks
        for i in range(25):
            task = Task(name=f"Task {i}", priority=i)
            db_session.add(task)
        db_session.commit()
        
        response = client.get("/api/v1/tasks?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] == 25
        assert data["page"] == 1
        assert data["page_size"] == 10
    
    def test_filter_tasks_by_status(self, client, db_session):
        """Test filtering tasks by status"""
        # Create tasks with different statuses
        task1 = Task(name="Pending Task", status=TaskStatus.PENDING)
        task2 = Task(name="Completed Task", status=TaskStatus.COMPLETED)
        db_session.add_all([task1, task2])
        db_session.commit()
        
        response = client.get("/api/v1/tasks?status=pending")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "Pending Task"


class TestSchedulesAPI:
    """Test schedule-related endpoints"""
    
    def test_list_schedules(self, client):
        """Test listing schedules"""
        response = client.get("/api/v1/schedules")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_schedule(self, client, db_session):
        """Test creating a schedule"""
        # Create a task first
        task = Task(name="Schedule Test Task")
        db_session.add(task)
        db_session.commit()
        
        schedule_data = {
            "task_id": task.id,
            "frequency": "hourly",
            "interval_seconds": 3600,
            "enabled": True
        }
        response = client.post("/api/v1/schedules", json=schedule_data)
        assert response.status_code == 201
        data = response.json()
        assert data["task_id"] == task.id
        assert data["frequency"] == "hourly"
    
    def test_create_schedule_invalid_task(self, client):
        """Test creating a schedule with non-existent task"""
        schedule_data = {
            "task_id": 99999,
            "frequency": "daily"
        }
        response = client.post("/api/v1/schedules", json=schedule_data)
        assert response.status_code == 404
    
    def test_delete_schedule(self, client, db_session):
        """Test deleting a schedule"""
        task = Task(name="Schedule Delete Test")
        db_session.add(task)
        db_session.commit()
        
        from app.models import Schedule
        schedule = Schedule(task_id=task.id, frequency="once")
        db_session.add(schedule)
        db_session.commit()
        
        response = client.delete(f"/api/v1/schedules/{schedule.id}")
        assert response.status_code == 204


class TestResultsAPI:
    """Test results-related endpoints"""
    
    def test_list_results(self, client, db_session):
        """Test listing task results"""
        task = Task(name="Results Test")
        db_session.add(task)
        db_session.commit()
        
        response = client.get(f"/api/v1/tasks/{task.id}/results")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_results_not_found(self, client):
        """Test listing results for non-existent task"""
        response = client.get("/api/v1/tasks/99999/results")
        assert response.status_code == 404


class TestTaskExecution:
    """Test task execution endpoint"""
    
    def test_run_task_now(self, client, db_session):
        """Test triggering immediate task execution"""
        task = Task(name="Run Now Test", status=TaskStatus.PENDING)
        db_session.add(task)
        db_session.commit()
        
        response = client.post(f"/api/v1/tasks/{task.id}/run")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task.id
