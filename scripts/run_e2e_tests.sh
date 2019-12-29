#!/usr/bin/env bash

# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

##########################################################################

# INSTRUCTIONS:
#
# Run this script from the oppia root folder:
#   bash scripts/run_e2e_tests.sh
#
# Optional arguments:
#   --browserstack Run the tests on browserstack using the
#         protractor-browserstack.conf.js file.
#   --skip-install=true/false If true, skips installing dependencies. The
#         default value is false.
#   --sharding=true/false Disables/Enables parallelization of protractor tests.
#   --sharding-instances=# Sets the number of parallel browsers to open while
#         sharding.
#   --prod_env Run the tests in prod mode. Static resources are served from
#         build directory and use cache slugs.
#   --community_dashboard_enabled Run the test after enabling the community
#         dashboard page.
# Sharding must be disabled (either by passing in false to --sharding or 1 to
# --sharding-instances) if running any tests in isolation (fit or fdescribe).
#   --suite=suite_name Performs test for different suites, here suites are the
#         name of the test files present in core/tests/protractor_desktop/ and
#         core/test/protractor/ dirs. e.g. for the file
#         core/tests/protractor/accessibility.js use --suite=accessibility.
#         For performing a full test, no argument is required.
#
# The root folder MUST be named 'oppia'.
#
# Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run a
# single test or test suite.

function cleanup {
  # Send a kill signal to the dev server and Selenium server. The awk command
  # gets just the process ID from the grepped line.
  kill `ps aux | grep "[Dd]ev_appserver.py --host=0.0.0.0 --port=9001" | awk '{print $2}'` || true
  kill `ps aux | grep node_modules/webdriver-manager/selenium | awk '{print $2}'` || true

  if [ -d "../protractor-screenshots" ]; then
    echo ""
    echo "  Note: If ADD_SCREENSHOT_REPORTER is set to true in"
    echo "  core/tests/protractor.conf.js, you can view screenshots"
    echo "  of the failed tests in ../protractor-screenshots/"
    echo ""
  fi

  echo Done!
}

if [ -z "$BASH_VERSION" ]
then
  echo ""
  echo "  Please run me using bash: "
  echo ""
  echo "     bash $0"
  echo ""
  return 1
fi

set -e
python -m scripts.install_third_party_libs
python -m scripts.setup
python -m scripts.setup_gae
if [ "$TRAVIS" == 'true' ]; then
  python -m scripts.install_chrome_on_travis
fi

if ( nc -vz localhost 8181 ); then
  echo ""
  echo "  There is already a server running on localhost:8181."
  echo "  Please terminate it before running the end-to-end tests."
  echo "  Exiting."
  echo ""
  exit 1
fi

if ( nc -vz localhost 9001 ); then
  echo ""
  echo " There is a already a server running on localhost:9001."
  echo " Please terminate it before running the end-to-end tests."
  echo " Exiting."
  echo ""
  exit 1
fi

export OPPIA_DIR=`pwd`
# Set COMMON_DIR to the absolute path of the directory above OPPIA_DIR. This
# is necessary becaue COMMON_DIR (or subsequent variables which refer to it)
# may use it in a situation where relative paths won't work as expected (such
# as $PYTHONPATH).
export COMMON_DIR=$(cd $OPPIA_DIR/..; pwd)
export TOOLS_DIR=$COMMON_DIR/oppia_tools
export NODE_PATH=$TOOLS_DIR/node-10.18.0
export PATH=$NODE_PATH/bin:$PATH

# Forces the cleanup function to run on exit.
# Developers: note that at the end of this script, the cleanup() function at
# the top of the file is run.
trap cleanup EXIT

# Argument passed to feconf.py to help choose production templates folder.
DEV_MODE=true
RUN_ON_BROWSERSTACK=False

# Currently, the community dashboard page is disabled.
community_dashboard_status_variable="COMMUNITY_DASHBOARD_ENABLED = False"
for arg in "$@"; do
  # Used to emulate running Oppia in a production environment.
  if [ "$arg" == "--prod_env" ]; then
    DEV_MODE=false
    echo "  Generating files for production mode..."
  fi

  # Used to enable the community dashboard page.
  if [ "$arg" == "--community_dashboard_enabled" ]; then
    community_dashboard_status_variable="COMMUNITY_DASHBOARD_ENABLED = True"
  fi

  # Used to run the e2e tests on browserstack.
  if [ "$arg" == "--browserstack" ]; then
    RUN_ON_BROWSERSTACK=True
    echo "  Running the tests on browserstack..."
  fi
done

# Update the community dashboard status in feconf.py file.
sed -i.bak -e s/"COMMUNITY_DASHBOARD_ENABLED = .*"/"$community_dashboard_status_variable"/ feconf.py


if [[ "$DEV_MODE" == "true" ]]; then
  constants_env_variable="\"DEV_MODE\": true"
  sed -i.bak -e s/"\"DEV_MODE\": .*"/"$constants_env_variable"/ assets/constants.ts
  python -m scripts.build
  APP_YAML_FILEPATH="app_dev.yaml"

  node_modules/webpack/bin/webpack.js --config webpack.dev.config.ts
else
  constants_env_variable="\"DEV_MODE\": false"
  sed -i.bak -e s/"\"DEV_MODE\": .*"/"$constants_env_variable"/ assets/constants.ts
  python -m scripts.build --prod_env
  APP_YAML_FILEPATH="app.yaml"
fi

# Delete the modified constants.ts and feconf.py file(-i.bak)
rm assets/constants.ts.bak
rm feconf.py.bak

# Start a selenium server using chromedriver 2.41.
# The 'detach' option continues the flow once the server is up and runnning.
# The 'quiet' option prints only the necessary information about the server start-up
# process.
node_modules/.bin/webdriver-manager update --versions.chrome 2.41
node_modules/.bin/webdriver-manager start --versions.chrome 2.41 --detach --quiet

# Start a selenium process. The program sends thousands of lines of useless
# info logs to stderr so we discard them.
# TODO(jacob): Find a webdriver or selenium argument that controls log level.
(node_modules/.bin/webdriver-manager start 2>/dev/null)&
# Start a demo server.
(python ../oppia_tools/google_appengine_1.9.67/google_appengine/dev_appserver.py --host=0.0.0.0 --port=9001 --clear_datastore=yes --dev_appserver_log_level=critical --log_level=critical --skip_sdk_update_check=true $APP_YAML_FILEPATH)&

# Wait for the servers to come up.
while ! nc -vz localhost 4444; do sleep 1; done
while ! nc -vz localhost 9001; do sleep 1; done

# Delete outdated screenshots
if [ -d "../protractor-screenshots" ]; then
  rm -r ../protractor-screenshots
fi

# Parse additional command line arguments that may be passed to protractor.
# Credit: http://stackoverflow.com/questions/192249
# Passing different suites and sharding parameters for tests.
SUITE="full"
SHARDING=true
SHARD_INSTANCES=3
for j in "$@"; do
  # Match each space-separated argument passed to the shell file to a separate
  # case label, based on a pattern. E.g. Match to -suite=*, -sharding=*, where the
  # asterisk refers to any characters following the equals sign, other than
  # whitespace.
  case $j in
    --suite=*)
    # Extract the value right of the equal sign by substringing the $i variable
    # at the equal sign.
    # http://tldp.org/LDP/abs/html/string-manipulation.html
    SUITE="${j#*=}"
    # Shifts the argument parameters over by one. E.g. $2 becomes $1, etc.
    shift
    ;;

    --sharding=*)
    SHARDING="${j#*=}"
    shift
    ;;

    --sharding-instances=*)
    SHARD_INSTANCES="${j#*=}"
    shift
    ;;

    --prod_env*)
    shift
    ;;

    --browserstack*)
    shift
    ;;

    --community_dashboard_enabled*)
    shift
    ;;

    *)
    echo "Error: Unknown command line option: $j"
    ;;
  esac
done

# Run the end-to-end tests. The conditional is used to run protractor without
# any sharding parameters if it is disabled. This helps with isolated tests.
# Isolated tests do not work properly unless no sharding parameters are passed
# in at all.
# TODO(bhenning): Figure out if this is a bug with protractor.
if [ "$RUN_ON_BROWSERSTACK" == "False" ]; then
  if [ "$SHARDING" = "false" ] || [ "$SHARD_INSTANCES" = "1" ]; then
    node_modules/protractor/bin/protractor core/tests/protractor.conf.js --suite "$SUITE" --params.devMode="$DEV_MODE"
  else
    node_modules/protractor/bin/protractor core/tests/protractor.conf.js --capabilities.shardTestFiles="$SHARDING" --capabilities.maxInstances=$SHARD_INSTANCES --suite "$SUITE" --params.devMode="$DEV_MODE"
  fi
else
  if [ "$SHARDING" = "false" ] || [ "$SHARD_INSTANCES" = "1" ]; then
    node_modules/protractor/bin/protractor core/tests/protractor-browserstack.conf.js --suite "$SUITE" --params.devMode="$DEV_MODE"
  else
    node_modules/protractor/bin/protractor core/tests/protractor-browserstack.conf.js --capabilities.shardTestFiles="$SHARDING" --capabilities.maxInstances=$SHARD_INSTANCES --suite "$SUITE" --params.devMode="$DEV_MODE"
  fi
fi
