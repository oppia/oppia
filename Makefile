include .docker.env

run-devserver:
	@echo "Updating the docker env variables..."
	@echo "save_datastore=$(save_datastore)"
	@echo "disable_host_checking=$(disable_host_checking)"
	@echo "prod_env=$(prod_env)"
	@echo "maintenance_mode=$(maintenance_mode)"
	@echo "source_maps=$(source_maps)"
	docker compose up

# for Shivkant while developing the dockerized devserver, otherwise seems to reason for devs use this
build-n-run-devserver:
	@echo "Updating the docker env variables..."
	@echo "save_datastore=$(save_datastore)"
	@echo "disable_host_checking=$(disable_host_checking)"
	@echo "prod_env=$(prod_env)"
	@echo "maintenance_mode=$(maintenance_mode)"
	@echo "source_maps=$(source_maps)"
	docker compose up --build

setup-devserver:
	docker compose build

terminal:
# check if server is up, if not start it
	docker exec -it oppia-webserver bash

stop-devserver:
	docker compose down