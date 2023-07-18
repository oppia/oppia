-include .docker.env

run-devserver:
	@echo "Updating the docker env variables..."
	@echo "    save_datastore        = $(save_datastore)"
	@echo "    disable_host_checking = $(disable_host_checking)"
	@echo "    no_auto_restart       = $(no_auto_restart)"
	@echo "    prod_env              = $(prod_env)"
	@echo "    maintenance_mode      = $(maintenance_mode)"
	@echo "    source_maps           = $(source_maps)"

	@echo "Starting the local development server..."
	save_datastore=$(save_datastore) \
	disable_host_checking=$(disable_host_checking) \
	no_auto_restart=$(no_auto_restart) \
	prod_env=$(prod_env) \
	maintenance_mode=$(maintenance_mode) \
	source_maps=$(source_maps) \
	docker compose up

setup-devserver:
	@echo "Creating .docker.env file for the env variables for Docker Setup..."
	@echo "# NOTE TO DEVELOPERS" > .docker.env
	@echo "# Please do not directly change the values of the variables specified in this file, as this may lead to unexpected behavior of your local development server." >> .docker.env
	@echo "# Changing the variables (which are flags for running the local development server) to true will enable the flag to your 'make run-devserver' command even if you do not explicitly pass the flag." >> .docker.env
	@echo "" >> .docker.env
	@echo "save_datastore = false" >> .docker.env
	@echo "disable_host_checking = false" >> .docker.env
	@echo "no_auto_restart = false" >> .docker.env
	@echo "prod_env = false" >> .docker.env
	@echo "maintenance_mode = false" >> .docker.env
	@echo "source_maps = false" >> .docker.env

	@echo "Building Docker Images for the dockerfiles..."
	docker compose build

clean:
	@echo "Cleaning up docker containers, images and volumes..."
	docker compose down
	docker rmi oppia-dev-server oppia-angular-build oppia-webpack-compiler oppia-datastore redis:6.2.4 elasticsearch:7.17.0 node:16.13.0-alpine
	docker volume rm oppia_cloud_datastore_emulator_cache oppia_firebase_emulator_cache oppia_proto_files oppia_frontend_proto_files oppia_node_modules oppia_redis_dump oppia_third_party

terminal:
	@echo "Opening terminal within docker container environment..."
	docker compose up -d
	docker exec -it angular-build sh

stop-devserver:
	@echo "Stopping the local development server and killing containers..."
	docker compose down
