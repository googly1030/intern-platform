# InternAudit AI - Makefile
# Quick commands for development and deployment

.PHONY: help dev up down build clean logs shell db-migrate db-reset test lint format install

# Default target
.DEFAULT_GOAL := help

# ===========================================
# HELP
# ===========================================
help: ## Show this help message
	@echo "InternAudit AI - Available Commands"
	@echo "===================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ===========================================
# DEVELOPMENT
# ===========================================
dev: ## Start development environment (API only)
	docker compose up api db redis

up: ## Start all services
	docker compose up -d

up-tools: ## Start all services including admin tools (pgAdmin, Redis Commander)
	docker compose --profile tools up -d

up-workers: ## Start all services including background workers
	docker compose --profile workers up -d

down: ## Stop all services
	docker compose down

down-all: ## Stop all services and remove volumes
	docker compose down -v

# ===========================================
# BUILD
# ===========================================
build: ## Build all containers
	docker compose build

rebuild: ## Rebuild containers (no cache)
	docker compose build --no-cache

# ===========================================
# LOGS & SHELL
# ===========================================
logs: ## Show all logs
	docker compose logs -f

logs-api: ## Show API logs
	docker compose logs -f api

logs-worker: ## Show worker logs
	docker compose logs -f worker

shell: ## Open shell in API container
	docker compose exec api /bin/bash

shell-db: ## Open psql shell
	docker compose exec db psql -U postgres -d intern_audit

shell-redis: ## Open redis-cli shell
	docker compose exec redis redis-cli

# ===========================================
# DATABASE
# ===========================================
db-migrate: ## Run database migrations
	docker compose exec api alembic upgrade head

db-migration: ## Create a new migration (usage: make db-migration msg="description")
	docker compose exec api alembic revision --autogenerate -m "$(msg)"

db-downgrade: ## Rollback last migration
	docker compose exec api alembic downgrade -1

db-reset: ## Reset database (drop and recreate)
	docker compose exec api alembic downgrade base
	docker compose exec api alembic upgrade head

db-seed: ## Seed database with sample data
	docker compose exec api python -m app.utils.seed

# ===========================================
# TESTING & QUALITY
# ===========================================
test: ## Run tests
	docker compose exec api pytest

test-cov: ## Run tests with coverage
	docker compose exec api pytest --cov=app --cov-report=html

lint: ## Run linter (ruff)
	docker compose exec api ruff check .

format: ## Format code (ruff)
	docker compose exec api ruff format .

typecheck: ## Run type checker (mypy)
	docker compose exec api mypy app

# ===========================================
# INSTALLATION
# ===========================================
install: ## Install Python dependencies locally
	cd backend && pip install -r requirements.txt

install-dev: ## Install development dependencies
	cd backend && pip install -r requirements.txt && pip install pytest pytest-asyncio ruff mypy

playwright-install: ## Install Playwright browsers
	playwright install chromium

# ===========================================
# CLEANUP
# ===========================================
clean: ## Remove generated files
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage

prune: ## Remove unused Docker resources
	docker system prune -f

# ===========================================
# QUICK START
# ===========================================
init: install build up db-migrate ## Initialize project (install, build, start, migrate)
	@echo "✅ InternAudit AI is ready!"
	@echo "   API: http://localhost:8000"
	@echo "   Docs: http://localhost:8000/docs"

reset-all: down-all clean build db-migrate ## Full reset (destroy, clean, rebuild, migrate)
	@echo "✅ Project reset complete!"

# ===========================================
# UTILS
# ===========================================
ps: ## Show running containers
	docker compose ps

urls: ## Show service URLs
	@echo "Service URLs:"
	@echo "  API:           http://localhost:8000"
	@echo "  API Docs:      http://localhost:8000/docs"
	@echo "  Redis GUI:     http://localhost:8081 (make up-tools)"
	@echo "  pgAdmin:       http://localhost:5050 (make up-tools)"
