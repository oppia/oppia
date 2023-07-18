SHELL_PREFIX=docker-compose exec -e
ALL_SERVICES = datastore dev-server firebase elasticsearch webpack-compiler angular-build redis

FLAGS = save_datastore disable_host_checking no_auto_restart prod_env maintenance_mode source_maps
$(foreach flag, $(FLAGS), $(eval $(flag) = false))

# Parameters ##################################################################
#
# For backend tests, use the rest as test path/module and turn them into do-nothing targets.
ifeq ($(firstword $(MAKECMDGOALS)),$(filter $(firstword $(MAKECMDGOALS)), run-backend-tests))
  RUN_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  $(eval $(RUN_ARGS):;@:)
endif

# TODO add all the targets here.
.PHONY: help run-devserver setup-devserver clean terminal stop-devserver \
	$(addsuffix stop., $(ALL_SERVICES)) $(addsuffix logs., $(ALL_SERVICES)) \
	$(addsuffix restart., $(ALL_SERVICES))

echo_flags:
	@echo "Flags:"
	@$(foreach flag,$(FLAGS), \
        echo "  $(flag) = $($(flag))"; \
    )

help: ## Display this help message.
	@echo "Please use \`make <target>' where <target> is one of the followings."
	@awk -F ':.*?## ' '/^[a-zA-Z]/ && NF==2 {printf "\033[36m  %-28s\033[0m %s\n", $$1, $$2}' Makefile | sort
	@echo "List of docker services name: \033[32m $(ALL_SERVICES) \033[0m"


build.%: ## Builds the given docker service. Example: make build.datastore
	docker compose build $*

build: ## Builds the all docker services.
	docker compose build

run-devserver: # Runs the devserver
	docker compose up -d dev-server

init: build run-devserver ## Initializes the build and runs devserver.

clean: stop ## Cleans the docker containers and volumes.
	docker rmi oppia-dev-server oppia-angular-build oppia-webpack-compiler oppia-datastore redis:6.2.4 elasticsearch:7.17.0 node:16.13.0-alpine
	docker volume rm oppia_cloud_datastore_emulator_cache oppia_firebase_emulator_cache oppia_proto_files oppia_frontend_proto_files oppia_node_modules oppia_redis_dump oppia_third_party

shell.%: ## Opens a shell in the given docker service. Example: make shell.datastore
	docker exec -it $* /bin/sh

stop:
	docker compose down

update.requirements: ## Installs the python requirements for the project
	${SHELL_PREFIX} dev-server pip install -r requirements.txt

update.package: ## Installs the npm requirements for the project
	${SHELL_PREFIX} angular-build npm install

stop.%: ## Stops the given docker service. Example: make stop.datastore
	docker compose stop $*

logs.%: ## Shows the logs of the given docker service. Example: make logs.datastore
	docker compose logs -f $*

restart.%: ## Restarts the given docker service. Example: make restart.datastore
	docker compose restart $*

run-backend-tests: ## [Not ready for use] Runs the backend tests
	@echo "Run the backend test on the following module: $(RUN_ARGS)"
	@echo "Not in use, under construction!"
