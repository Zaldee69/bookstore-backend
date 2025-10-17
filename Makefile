.PHONY: help build up down logs restart clean test migrate seed

# Default target
help:
	@echo "Book Backend - Docker Commands"
	@echo "Database: Supabase (Cloud)"
	@echo "Registry: Docker Hub"
	@echo ""
	@echo "Docker:"
	@echo "  make build         - Build Docker image"
	@echo "  make up            - Start container"
	@echo "  make down          - Stop container"
	@echo "  make restart       - Restart container"
	@echo "  make logs          - View logs"
	@echo "  make shell         - Open shell in container"
	@echo ""
	@echo "Database (Supabase):"
	@echo "  make migrate       - Run migrations"
	@echo "  make migrate-dev   - Create new migration"
	@echo "  make seed          - Seed database"
	@echo "  make db-studio     - Open Prisma Studio"
	@echo "  make db-reset      - Reset database (⚠️  deletes data)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         - Remove containers"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Check code quality"
	@echo "  make status        - Check status"
	@echo ""

# Production commands
build:
	@echo "🏗️  Building Docker images..."
	docker-compose build --no-cache

up:
	@echo "Starting production environment..."
	docker-compose up -d
	@echo "Services started!"
	@echo "API: http://localhost:3000"
	@echo "Health: http://localhost:3000/health"
	@echo "Docs: http://localhost:3000/docs"

down:
	@echo "Stopping containers..."
	docker-compose down
	@echo "Containers stopped!"

logs:
	docker-compose logs -f

restart:
	@echo "Restarting services..."
	docker-compose restart
	@echo "Services restarted!"

# Database commands
migrate:
	@echo "Running migrations..."
	docker-compose exec api npx prisma migrate deploy

migrate-dev:
	@echo "Creating new migration..."
	npx prisma migrate dev

seed:
	@echo "Seeding database..."
	docker-compose exec api npx prisma db seed

db-studio:
	@echo "Opening Prisma Studio..."
	npx prisma studio

db-reset:
	@echo "Resetting database (all data will be lost)..."
	@read -p "Are you sure? [y/N] " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker-compose exec api npx prisma migrate reset; \
	fi

# Maintenance commands
clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	@echo "Cleanup complete!"

test:
	@echo "Running tests..."
	npm test

lint:
	@echo "Checking code quality..."
	npm run build
	@echo "Code quality check passed!"

# Docker commands
shell:
	@echo "Opening shell in API container..."
	docker-compose exec api sh

# Status
status:
	@echo "Container Status:"
	docker-compose ps
	@echo ""
	@echo "Volume Usage:"
	docker volume ls | grep book-backend
	@echo ""
	@echo "Network:"
	docker network ls | grep book-backend
	@echo ""
	@echo "Database: Supabase (Cloud)"

# Quick start
quick-start: build up migrate seed
	@echo "Quick start complete!"
	@echo "API: http://localhost:3000"
	@echo "Docs: http://localhost:3000/docs"

