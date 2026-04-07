.DEFAULT_GOAL := help
GAMES ?= 2000

.PHONY: help install dev demo build test lint typecheck simulate check docker clean

help: ## Показать список целей
	@grep -E '^[a-z-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

install: ## Установить зависимости веб-клиента и бота
	cd web && npm ci
	cd bot && npm ci

dev: ## Поднять веб-клиент в режиме разработки на :3000
	cd web && npm run dev

demo: ## Собрать и запустить веб-клиент без ключей на :3000
	cd web && npm run build && npm run start

build: ## Продакшен-сборка веб-клиента и бота
	cd web && npm run build
	cd bot && npm run build

test: ## Запустить тесты обоих пакетов
	cd web && npm test
	cd bot && npm test

lint: ## Проверить стиль
	cd web && npm run lint
	cd bot && npm run lint

typecheck: ## Проверить типы
	cd web && npm run typecheck
	cd bot && npm run typecheck

simulate: ## Прогнать партии и напечатать таблицы баланса (GAMES=2000)
	cd web && npm run simulate -- --games $(GAMES)

check: lint typecheck test ## Всё, что гоняет CI

docker: ## Поднять веб-клиент в контейнере
	docker compose up --build

clean: ## Убрать сборки и кеши
	rm -rf web/.next web/node_modules web/*.tsbuildinfo
	rm -rf bot/dist bot/node_modules
