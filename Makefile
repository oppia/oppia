SHELL := /bin/bash

SHELL_PREFIX = docker compose exec

ALL_SERVICES = datastore dev-server firebase elasticsearch webpack-compiler angular-build redis

OS_NAME := $(shell uname)

FLAGS = save_datastore disable_host_checking no_auto_restart prod_env maintenance_mode source_maps use_firebase_localhost

sharding_instances := 3

# This escapes any special characters and remove any spaces in the PATH. We do this to resolve errors in WSL due to windows paths.
FIXED_PATH=$(shell echo "$(PATH)" | sed 's/ /\\ /g' | sed 's/(/\\(/g' | sed 's/)/\\)/g')


ifeq ($(OS_NAME),Darwin)
    CHROME_VERSION := $(shell /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version | awk '{print $$3}')
else
    CHROME_VERSION := $(shell google-chrome --version | awk '{print $$3}')
endif

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
	@egrep '## .*' $(MAKEFILE_LIST) | sed -e 's/##//' | awk 'BEGIN {FS = ":"}; {if ($$2 == "") printf "%-10s\n", $$1; else printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo "List of docker services name: \033[32m $(ALL_SERVICES) \033[0m"


build.%: ## Builds the given docker service. Example: make build.datastore
	docker compose build $*

build: ## Builds the all docker setup.
	$(MAKE) install_node
	$(MAKE) install_hooks
	docker compose build

run-devserver: ## Runs the dev-server
# TODO(#19888): Implement a more efficient method for connecting the folders rather than resorting to copying using docker cp.
	docker compose up angular-build -d
	$(MAKE) update.package
	docker cp oppia-angular-build:/app/oppia/node_modules .
	docker compose stop angular-build
	docker compose up dev-server -d --no-deps
	$(MAKE) update.requirements
	$(MAKE) start-devserver

run-offline: ## Runs the dev-server in offline mode
	## Users can pass this check by simply running `make start-devserver`
	$(MAKE) check.dev-container-healthy
	$(MAKE) start-devserver

start-devserver: ## Starts the development server
	docker compose up dev-server -d
	@printf 'Please wait while the development server starts...\n\n'
	@while [[ $$(curl -s -o .dev/status_code.txt -w '%{http_code}' http://localhost:8181) != "200" ]] || [[ $$(curl -s -o .dev/status_code.txt -w '%{http_code}' http://localhost:8181/community-library) != "200" ]]; do \
		printf "▓"; \
		if [[ "$(prod_env)" = 'true' ]] && [[ -n $$(docker ps -q -f status=exited -f name=webpack-compiler) ]]; then \
			${SHELL_PREFIX} dev-server python -m scripts.generate_build_directory; \
		fi; \
		sleep 1; \
	done
	@printf '\n\n'
	@echo 'Please visit http://localhost:8181 to access the development server.'
	@echo 'Check dev-server logs using "make logs.dev-server"'
	@echo 'Stop the development server using "make stop"'

install_hooks:  ## Install required hooks
	bash ./docker/pre_push_hook.sh --install
	bash ./docker/pre_commit_hook.sh --install

clean: ## Cleans the docker containers and volumes.
	docker rm $$(docker ps -aq --filter "ancestor=oppia-dev-server") || true
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
# Following script fixed issue with google module not being importable
	${SHELL_PREFIX} dev-server python -m docker.fix_google_module

update.package: ## Installs the npm requirements for the project
# TODO(#18260): Permanently change the yarn configurations in `.yarnrc` when permanently moving to Docker Setup.
# Creating a .yarnrc file to use yarn under docker
	@echo 'cache-folder "/root/.yarn-cache"' > .yarnrc
	${SHELL_PREFIX} angular-build yarn install --pure-lockfile
# Reverting the .yarnrc file to the original state, so that it works in python setup also.
	@echo 'yarn-path "../oppia_tools/yarn-1.22.15/bin/yarn"' > .yarnrc
	@echo 'cache-folder "../yarn_cache"' >> .yarnrc

check.dev-container-healthy:
	@run_devserver_prompt="Please, run \`make run-devserver\` (requires internet) once before running \`make run-offline\`"; \
	if [ -f ".dev/containers-health.json" ]; then \
		if jq -e ".devserver != true" ".dev/containers-health.json" > /dev/null; then \
			echo "Container is unhealthy"; \
			echo $$run_devserver_prompt; \
			exit 1; \
		fi \
	else \
		echo "Can't check container health!"; \
		echo $$run_devserver_prompt; \
		exit 1; \
	fi

run-dsadmin: ## Runs DSAdmin inside the dev-server container.
	@docker exec oppia-cloud-datastore /bin/sh -c '../dsadmin --project=dev-project-id --datastore-emulator-host=localhost:8089 &';
	@echo 'Please visit http://localhost:8080 to access the DSAdmin.';

logs.%: ## Shows the logs of the given docker service. Example: make logs.datastore
	docker compose logs -f $*

restart.%: ## Restarts the given docker service. Example: make restart.datastore
	docker compose restart $*

run_tests.prettier: ## Runs the prettier checks
	docker compose run --no-deps --rm --entrypoint "npx prettier --check ." dev-server

run_tests.third_party_size_check: ## Runs the third party size check
	docker compose run --no-deps --rm --entrypoint "python -m scripts.third_party_size_check" dev-server

run_tests.lint: ## Runs the linter tests
	docker compose run --no-deps --rm --entrypoint "/bin/sh -c 'git config --global --add safe.directory /app/oppia && python -m scripts.linters.run_lint_checks $(PYTHON_ARGS)'" dev-server

run_tests.backend: ## Runs the backend tests
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop
	docker compose up datastore dev-server redis firebase -d --no-deps 
	@echo '------------------------------------------------------'
	@echo '  Backend tests started....'
	@echo '------------------------------------------------------'
	$(SHELL_PREFIX) dev-server sh -c "git config --global --add safe.directory /app/oppia && python -m scripts.run_backend_tests $(PYTHON_ARGS)"
	@echo '------------------------------------------------------'
	@echo '  Backend tests have been executed successfully....'
	@echo '------------------------------------------------------'
	$(MAKE) stop

run_tests.check_backend_test_coverage: ## Runs the check for overall backend test coverage
	$(MAKE) start-devserver
	$(SHELL_PREFIX) dev-server python -m scripts.check_backend_test_coverage
	$(MAKE) stop

run_tests.frontend: ## Runs the frontend unit tests
	docker compose run --no-deps --rm --entrypoint "python -m scripts.run_frontend_tests $(PYTHON_ARGS) --skip_install" dev-server

run_tests.typescript: ## Runs the typescript checks
	docker compose run --no-deps --rm --entrypoint "python -m scripts.run_typescript_checks $(PYTHON_ARGS)" dev-server

run_tests.custom_eslint: ## Runs the custome eslint tests
	docker compose run --no-deps --rm --entrypoint "python -m scripts.run_custom_eslint_tests" dev-server

run_tests.mypy: ## Runs mypy checks
	docker compose run --no-deps --rm --entrypoint "python -m scripts.run_mypy_checks" dev-server

run_tests.check_backend_associated_tests: ## Runs the backend associate tests
	docker compose run --no-deps --rm --entrypoint "/bin/sh -c 'git config --global --add safe.directory /app/oppia && python -m scripts.check_backend_associated_test_file'" dev-server

run_tests.acceptance: ## Runs the acceptance tests for the parsed suite
## Flag for Acceptance tests
## suite: The suite to run the acceptance tests
## MOBILE: Run acceptance test in mobile viewport.
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop
# Adding node to the path.
	@if [ "$(OS_NAME)" = "Windows" ]; then \
		export PATH=$(cd .. && pwd)/oppia_tools/node-16.13.0:$(FIXED_PATH); \
	else \
		export PATH=$(shell cd .. && pwd)/oppia_tools/node-16.13.0/bin:$(FIXED_PATH); \
	fi
# Adding env variable for mobile view
	@export MOBILE=${MOBILE:-false}
# Starting the development server for the acceptance tests.
	$(MAKE) start-devserver
	@echo '------------------------------------------------------'
	@echo '  Starting acceptance test for the suite: $(suite)'
	@echo '------------------------------------------------------'
	@if [ -d ./core/tests/puppeteer-acceptance-tests/build ]; then \
		rm -rf ./core/tests/puppeteer-acceptance-tests/build; \
	fi
	../oppia_tools/node-16.13.0/bin/node ./node_modules/typescript/bin/tsc -p ./tsconfig.puppeteer-acceptance-tests.json
	cp -r ./core/tests/puppeteer-acceptance-tests/data ./core/tests/puppeteer-acceptance-tests/build/
	SPEC_NAME=$(suite) ../oppia_tools/node-16.13.0/bin/node ./node_modules/.bin/jest --config="./core/tests/puppeteer-acceptance-tests/jest.config.js" ./core/tests/puppeteer-acceptance-tests/specs/$(suite).spec.ts
	@echo '------------------------------------------------------'
	@echo '  Acceptance test has been executed successfully....'
	@echo '------------------------------------------------------'
	$(MAKE) stop

run_tests.e2e: ## Runs the e2e tests for the parsed suite
## Flags for the e2e tests
## suite: The suite to run the e2e tests
## sharding_instances: Sets the number of parallel browsers to open while sharding.
## CHROME_VERSION: Uses the specified version of the chrome driver.
## MOBILE: Run e2e test in mobile viewport.
## DEBUG: Runs the webdriverio test in debugging mode.
## VIDEO_RECORDING_IS_ENABLED: Record the e2e test.
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop
# Adding node to the path.
	@if [ "$(OS_NAME)" = "Windows" ]; then \
		export PATH=$(cd .. && pwd)/oppia_tools/node-16.13.0:$(FIXED_PATH); \
	else \
		export PATH=$(shell cd .. && pwd)/oppia_tools/node-16.13.0/bin:$(FIXED_PATH); \
	fi
# Adding env variable for the mobile view
	@export MOBILE=${MOBILE:-false}
# Adding env variable for the video recording
	@export VIDEO_RECORDING_IS_ENABLED=${VIDEO_RECORDING_IS_ENABLED:-0}
# Starting the development server for the e2e tests.
	$(MAKE) start-devserver
	@echo '------------------------------------------------------'
	@echo '  Starting e2e test for the suite: $(suite)'
	@echo '------------------------------------------------------'
	../oppia_tools/node-16.13.0/bin/node ./node_modules/.bin/wdio ./core/tests/wdio.conf.js --suite $(suite) $(CHROME_VERSION) --params.devMode=True --capabilities[0].maxInstances=${sharding_instances} DEBUG=${DEBUG:-false}
	@echo '------------------------------------------------------'
	@echo '  e2e test has been executed successfully....'
	@echo '------------------------------------------------------'
	$(MAKE) stop

run_tests.check_tests_are_captured_in_ci: ## Runs the check to ensure that all e2e and acceptence tests are captured in CI
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop
	docker compose up dev-server -d --no-deps
	$(SHELL_PREFIX) dev-server python -m scripts.check_tests_are_captured_in_ci
	$(MAKE) stop

run_tests.lighthouse_accessibility: ## Runs the lighthouse accessibility tests for the parsed shard
## Flag for Lighthouse test
## shard: The shard number to run the lighthouse tests
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop
# Starting the development server for the lighthouse tests.
	$(MAKE) start-devserver use_firebase_endpoint=true
	@echo '-----------------------------------------------------------------------'
	@echo '  Starting Lighthouse Accessibility tests  '
	@echo '-----------------------------------------------------------------------'
	$(SHELL_PREFIX) dev-server sh -c "python -m scripts.run_lighthouse_tests --mode accessibility $(PYTHON_ARGS)"
	@echo '-----------------------------------------------------------------------'
	@echo '  Lighthouse tests has been executed successfully....'
	@echo '-----------------------------------------------------------------------'
	$(MAKE) stop

run_tests.lighthouse_performance: ## Runs the lighthouse performance tests for the parsed shard
## Flag for Lighthouse test
## shard: The shard number to run the lighthouse tests
	@echo 'Shutting down any previously started server.'
	$(MAKE) stop
# Starting the development server for the lighthouse tests.
	$(MAKE) start-devserver use_firebase_endpoint=true
	@echo '-----------------------------------------------------------------------'
	@echo '  Starting Lighthouse Performance tests  '
	@echo '-----------------------------------------------------------------------'
	$(SHELL_PREFIX) dev-server sh -c "python -m scripts.run_lighthouse_tests --mode performance $(PYTHON_ARGS)""
	@echo '-----------------------------------------------------------------------'
	@echo '  Lighthouse tests has been executed successfully....'
	@echo '-----------------------------------------------------------------------'
	$(MAKE) stop

install_node: ## Installs node-16.13.0 in the oppia_tools directory
	sh ./docker/install_node.sh
