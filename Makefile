run:
	docker compose up

setup-devserver:
	docker compose build

stop-devserver:
	docker compose down