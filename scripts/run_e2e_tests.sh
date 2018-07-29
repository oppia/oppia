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
#   --skip-install=true/false If true, skips installing dependencies. The
#         default value is false.
#   --sharding=true/false Disables/Enables parallelization of protractor tests.
#   --sharding-instances=# Sets the number of parallel browsers to open while
#         sharding.
#   --prod_env Run the tests in prod mode. Static resources are served from
#         build directory and use cache slugs.
# Sharding must be disabled (either by passing in false to --sharding or 1 to
# --sharding-instances) if running any tests in isolation (fit or fdescribe).
#   --suite=suite_name Performs test for different suites.
#   For performing a full test, no argument is required.
#   For performing tests on accessibility, use --suite=accessibility
#   For performing tests on collections, use --suite=collections
#   For performing embedding tests, use --suite=embedding
#   For performing tests on editor and player, use --suite=editorAndPlayer
#   For performing tests on editorFeatures, use --suite=editorFeatures
#   For performing tests on extensions, use --suite=extensions
#   For performing tests on library, use --suite=library
#   For performing tests on learnerDashboard, use --suite=learnerDashboard
#   For performing tests on state editor, use --suite=stateEditor
#   For performing users tests, use --suite=users
#
# The root folder MUST be named 'oppia'.
#
# Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run a
# single test or test suite.

function cleanup {
  # Send a kill signal to the dev server.
  kill `ps aux | grep "[Dd]ev_appserver.py --host=0.0.0.0 --port=9001" | awk '{print $2}'`

  # The [Pp] is to avoid the grep finding the 'grep protractor/node_modules/webdriver-manager/selenium' process
  # as well. The awk command gets just the process ID from the grepped line.
  kill `ps aux | grep [Pp]rotractor/node_modules/webdriver-manager/selenium | awk '{print $2}'`

  # Wait for the servers to go down; suppress "connection refused" error output
  # from nc since that is exactly what we are expecting to happen.
  while ( nc -vz localhost 4444 >/dev/null 2>&1 ); do sleep 1; done
  while ( nc -vz localhost 9001 >/dev/null 2>&1 ); do sleep 1; done

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
source $(dirname $0)/setup.sh || exit 1
source $(dirname $0)/setup_gae.sh || exit 1
if [ "$TRAVIS" == 'true' ]; then
  source $(dirname $0)/install_chrome_on_travis.sh || exit 1
fi

export DEFAULT_SKIP_INSTALLING_THIRD_PARTY_LIBS=false
export DEFAULT_RUN_MINIFIED_TESTS=false
maybeInstallDependencies "$@"

if ( nc -vz localhost 8181 ); then
  echo ""
  echo "  There is already a server running on localhost:8181."
  echo "  Please terminate it before running the end-to-end tests."
  echo "  Exiting."
  echo ""
  exit 1
fi


# Forces the cleanup function to run on exit.
# Developers: note that at the end of this script, the cleanup() function at
# the top of the file is run.
trap cleanup EXIT


# Argument passed to feconf.py to help choose production templates folder.
FORCE_PROD_MODE=False
for arg in "$@"; do
  # Used to emulate running Oppia in a production environment.
  if [ "$arg" == "--prod_env" ]; then
    FORCE_PROD_MODE=True
    echo "  Generating files for production mode..."
  fi
done

if [[ "$FORCE_PROD_MODE" == "True" ]]; then
  $PYTHON_CMD scripts/build.py --prod_env
else
  $PYTHON_CMD scripts/build.py
fi

feconf_env_variable="FORCE_PROD_MODE = $FORCE_PROD_MODE"
sed -i.bak -e s/"FORCE_PROD_MODE = .*"/"$feconf_env_variable"/ feconf.py
# Delete the modified feconf.py file(-i.bak)
rm feconf.py.bak

# Start a selenium process. The program sends thousands of lines of useless
# info logs to stderr so we discard them.
# TODO(jacob): Find a webdriver or selenium argument that controls log level.
($NODE_MODULE_DIR/.bin/webdriver-manager start 2>/dev/null)&
# Start a demo server.
($PYTHON_CMD $GOOGLE_APP_ENGINE_HOME/dev_appserver.py --host=0.0.0.0 --port=9001 --clear_datastore=yes --dev_appserver_log_level=critical --log_level=critical --skip_sdk_update_check=true .)&

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
if [ "$SHARDING" = "false" ] || [ "$SHARD_INSTANCES" = "1" ]; then
  $NODE_MODULE_DIR/.bin/protractor core/tests/protractor.conf.js --suite "$SUITE"
else
  $NODE_MODULE_DIR/.bin/protractor core/tests/protractor.conf.js --capabilities.shardTestFiles="$SHARDING" --capabilities.maxInstances=$SHARD_INSTANCES --suite "$SUITE"
fi
