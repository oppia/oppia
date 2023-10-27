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

build: ## Builds the all docker setup.
	$(MAKE) install_node
	docker compose build

run-devserver: # Runs the dev-server
	docker compose up angular-build -d
	$(MAKE) update.package
	docker cp oppia-angular-build:/app/oppia/node_modules .
	docker compose stop angular-build
	docker compose up dev-server -d --no-deps
	$(MAKE) update.requirements
	$(MAKE) run-offline

run-offline: # Runs the dev-server in offline mode
	$(MAKE) start-devserver
	@echo 'Please visit http://localhost:8181 to access the development server.'
	@echo 'Check dev-server logs using "make logs.dev-server"'
	@echo 'Stop the development server using "make stop"'

start-devserver: ## Starts the development server for the tests
	docker compose up dev-server -d
	@printf 'Please wait while the development server starts...\n\n'
	@while [[ $$(curl -s -o /tmp/status_code.txt -w '%{http_code}' http://localhost:8181) != "200" ]] || [[ $$(curl -s -o /tmp/status_code.txt -w '%{http_code}' http://localhost:8181/community-library) != "200" ]]; do \
		printf "▓"; \
		if [[ "$(prod_env)" = 'true' ]] && [[ -n $$(docker ps -q -f status=exited -f name=webpack-compiler) ]]; then \
			${SHELL_PREFIX} dev-server python -m scripts.generate_build_directory; \
		fi; \
		sleep 1; \
	done
	@printf '\n\n'
	@echo 'Development server started at port 8181.'

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
	${SHELL_PREFIX} angular-build yarn install --pure-lockfile
# Reverting the .yarnrc file to the original state, so that it works in python setup also.
	@echo 'yarn-path "../oppia_tools/yarn-1.22.15/bin/yarn"' > .yarnrc
	@echo 'cache-folder "../yarn_cache"' >> .yarnrc

logs.%: ## Shows the logs of the given docker service. Example: make logs.datastore
	docker compose logs -f $*

restart.%: ## Restarts the given docker service. Example: make restart.datastore
	docker compose restart $*

run_tests.lint: ## Runs the linter tests
	docker compose run --no-deps --entrypoint "/bin/sh -c 'git config --global --add safe.directory /app/oppia && python -m scripts.linters.pre_commit_linter $(PYTHON_ARGS)'" dev-server

run_tests.backend: ## Runs the backend tests
	$(MAKE) stop
	docker compose up datastore dev-server redis firebase -d --no-deps
	@echo '------------------------------------------------------'
	@echo '  Backend tests started....'
	@echo '------------------------------------------------------'
	$(SHELL_PREFIX) dev-server python -m scripts.run_backend_tests $(PYTHON_ARGS)
	@echo '------------------------------------------------------'
	@echo '  Backend tests has been executed successfully....'
	@echo '------------------------------------------------------'
	$(MAKE) stop

run_tests.frontend: ## Runs the frontend unit tests
	docker compose run --no-deps --entrypoint "python -m scripts.run_frontend_tests $(PYTHON_ARGS) --skip_install" dev-server

run_tests.typescript: ## Runs the typescript checks
	docker compose run --no-deps --entrypoint "python -m scripts.typescript_checks" dev-server

run_tests.custom_eslint: ## Runs the custome eslint tests
	docker compose run --no-deps --entrypoint "python -m scripts.run_custom_eslint_tests" dev-server

run_tests.mypy: ## Runs mypy checks
	docker compose run --no-deps --entrypoint "python -m scripts.run_mypy_checks" dev-server

run_tests.check_backend_associated_tests: ## Runs the backend associate tests
	docker compose run --no-deps --entrypoint "/bin/sh -c 'git config --global --add safe.directory /app/oppia && python -m scripts.check_backend_associated_test_file'" dev-server

run_tests.acceptance: ## Runs the acceptance tests for the parsed suite
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop 
# Adding node to the path.
	@if [ "$(OS_NAME)" = "Windows" ]; then \
		export PATH=$(cd .. && pwd)/oppia_tools/node-16.13.0:$(PATH); \
	else \
		export PATH=$(shell cd .. && pwd)/oppia_tools/node-16.13.0/bin:$(PATH); \
	fi
# Starting the development server for the acceptance tests.
	$(MAKE) start-devserver
	@echo '------------------------------------------------------'
	@echo '  Starting acceptance test for the suite: $(suite)'
	@echo '------------------------------------------------------'
	./node_modules/.bin/jasmine --config="./core/tests/puppeteer-acceptance-tests/jasmine.json" ./core/tests/puppeteer-acceptance-tests/spec/$(suite)
	@echo '------------------------------------------------------'
	@echo '  Acceptance test has been executed successfully....'
	@echo '------------------------------------------------------'
	$(MAKE) stop

CHROME_VERSION := $(shell google-chrome --version | awk '{print $$3}')

run_tests.e2e: ## Runs the e2e tests for the parsed suite
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop
# Adding node to the path.
	@if [ "$(OS_NAME)" = "Windows" ]; then \
		export PATH=$(cd .. && pwd)/oppia_tools/node-16.13.0:$(PATH); \
	else \
		export PATH=$(shell cd .. && pwd)/oppia_tools/node-16.13.0/bin:$(PATH); \
	fi
# Starting the development server for the e2e tests.
	$(MAKE) start-devserver
	@echo '------------------------------------------------------'
	@echo '  Starting e2e test for the suite: $(suite)'
	@echo '------------------------------------------------------'
	../oppia_tools/node-16.13.0/bin/npx wdio ./core/tests/wdio.conf.js --suite $(suite) $(CHROME_VERSION) --params.devMode=True --capabilities[0].maxInstances=3
	@echo '------------------------------------------------------'
	@echo '  e2e test has been executed successfully....'
	@echo '------------------------------------------------------'
	$(MAKE) stop

OS_NAME := $(shell uname)

install_node: ## Installs node-16.13.0 in the oppia_tools directory
	sh ./docker/install_node.sh
