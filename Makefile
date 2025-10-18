.PHONY: help build up down logs restart clean test migrate seed

help:
	@echo "Book Backend Commands"
	@echo ""
	@echo "Docker:"
	@echo "  make build         - Build image"
	@echo "  make up            - Start container"
	@echo "  make down          - Stop container"
	@echo "  make restart       - Restart"
	@echo "  make logs          - View logs"
	@echo "  make shell         - Container shell"
	@echo ""
	@echo "Database:"
	@echo "  make migrate       - Run migrations"
	@echo "  make migrate-dev   - New migration"
	@echo "  make seed          - Seed data"
	@echo "  make db-studio     - Prisma Studio"
	@echo "  make db-reset      - Reset DB (careful!)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         - Clean containers"
	@echo "  make status        - Check status"
	@echo ""

build:
	docker-compose build --no-cache

up:
	docker-compose up -d
	@echo "API: http://localhost:3000"
	@echo "Docs: http://localhost:3000/docs"

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

migrate:
	docker-compose exec api npx prisma migrate deploy

migrate-dev:
	npx prisma migrate dev

seed:
	docker-compose exec api npx prisma db seed

db-studio:
	npx prisma studio

db-reset:
	@read -p "Reset database? [y/N] " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker-compose exec api npx prisma migrate reset; \
	fi

clean:
	docker-compose down -v
	docker system prune -f

test:
	npm test

lint:
	npm run build

shell:
	docker-compose exec api sh

status:
	@echo "Status:"
	@docker-compose ps
	@echo ""
	@docker volume ls | grep book-backend || true
	@docker network ls | grep book-backend || true

quick-start: build up migrate seed
	@echo "Ready: http://localhost:3000"

