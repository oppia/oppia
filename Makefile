SHELL := /bin/bash

SHELL_PREFIX=docker compose exec
ALL_SERVICES = datastore dev-server firebase elasticsearch webpack-compiler angular-build redis

FLAGS = save_datastore disable_host_checking no_auto_restart prod_env maintenance_mode source_maps
$(foreach flag, $(FLAGS), $(eval $(flag) = false))

.PHONY: help run-devserver build clean terminal stop-devserver \
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

run-devserver: # Runs the dev-server
	docker compose up dev-server -d --no-deps
	$(MAKE) update.requirements
	docker compose up angular-build -d
	$(MAKE) update.package
	$(MAKE) run-offline

run-offline: # Runs the dev-server in offline mode
	docker compose up dev-server -d
	@printf 'Please wait while the development server starts...\n\n'
	@while [[ $$(curl -s -o /tmp/status_code.txt -w '%{http_code}' http://localhost:8181) != "200" ]] || [[ $$(curl -s -o /tmp/status_code.txt -w '%{http_code}' http://localhost:8181/community-library) != "200" ]]; do \
		sleep 5; \
	done
	@echo 'Development server started at port 8181.'
	@echo 'Please visit http://localhost:8181 to access the development server.'
	@echo 'Check dev-server logs using "make logs.dev-server"'
	@echo 'Stop the development server using "make stop"'

init: build run-devserver ## Initializes the build and runs dev-server.

clean: ## Cleans the docker containers and volumes.
	docker compose down --rmi all --volumes

shell.%: ## Opens a shell in the given docker service. Example: make shell.datastore
	docker exec -it $* /bin/sh

stop: ## Stops all the services.
	docker compose stop
	@echo "Development server shut down successfully."

stop.%: ## Stops the given docker service. Example: make stop.datastore
	docker compose stop $*

update.requirements: ## Installs the python requirements for the project
	${SHELL_PREFIX} dev-server pip install -r requirements.txt
	${SHELL_PREFIX} dev-server pip install -r requirements_dev.txt

update.package: ## Installs the npm requirements for the project
# TODO(#18260): Permanently change the yarn configurations in `.yarnrc` when permanently moving to Docker Setup.
# Creating a .yarnrc file to use yarn under docker
	@echo 'cache-folder "/root/.yarn-cache"' > .yarnrc
	${SHELL_PREFIX} angular-build yarn install
# Reverting the .yarnrc file to the original state, so that it works in python setup also.
	@echo 'yarn-path "../oppia_tools/yarn-1.22.15/bin/yarn"' > .yarnrc
	@echo 'cache-folder "../yarn_cache"' >> .yarnrc

logs.%: ## Shows the logs of the given docker service. Example: make logs.datastore
	docker compose logs -f $*

restart.%: ## Restarts the given docker service. Example: make restart.datastore
	docker compose restart $*

run-backend-tests: ## [Not ready for use] Runs the backend tests
	@echo "Run the backend test on the following module: $(RUN_ARGS)"
	@echo "Not in use, under construction!"
