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
#   bash scripts/run_js_integration_tests.sh
# The root folder MUST be named 'oppia'.
# It runs integration tests.

function cleanup {
  # Send a kill signal to the dev server.
  #
  # The [Pp] is to avoid the grep finding the 'grep protractor/selenium' process
  # as well. The awk command gets just the process ID from the grepped line.
  kill `ps aux | grep [Pp]rotractor/selenium | awk '{print $2}'`

  # Send a kill signal to the dev server.
  kill `ps aux | grep "[Dd]ev_appserver.py --host=0.0.0.0 --port=4445" | awk '{print $2}'`

  # Wait for the servers to go down; suppress "connection refused" error output
  # from nc since that is exactly what we are expecting to happen.
  while ( nc -vz localhost 4444 >/dev/null 2>&1 ); do sleep 1; done
  while ( nc -vz localhost 4445 >/dev/null 2>&1 ); do sleep 1; done

  echo Done!
}

# Forces the cleanup function to run on exit.
trap cleanup EXIT


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

# Install third party dependencies
bash scripts/install_third_party.sh

echo Checking whether Karma is installed in $TOOLS_DIR
if [ ! -h "$NODE_MODULE_DIR/.bin/karma" ]; then
  echo Installing Karma
  $NPM_INSTALL karma@0.8.7
fi

echo Checking whether Protractor is installed in $TOOLS_DIR
if [ ! -h "$NODE_MODULE_DIR/.bin/protractor" ]; then
  echo Installing Protractor
  $NPM_INSTALL protractor@0.21.0
fi

$NODE_MODULE_DIR/.bin/webdriver-manager update

# Start a selenium process.
($NODE_MODULE_DIR/.bin/webdriver-manager start )&
# Start a demo server.
(python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py --host=0.0.0.0 --port=4445 --clear_datastore=yes .)&

# Wait for the servers to come up.
while ! nc -vz localhost 4444; do sleep 1; done
while ! nc -vz localhost 4445; do sleep 1; done

# Run the integration tests.
$NODE_MODULE_DIR/.bin/protractor core/tests/protractor.conf.js

# Developers: note that at the end of this script, the cleanup() function at
# the top of the file is run.
