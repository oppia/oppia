#!/usr/bin/env bash

# Copyright 2016 The Oppia Authors. All Rights Reserved.
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
#   bash scripts/run_performance_tests.sh
# 
# The root folder MUST be named 'oppia'.

function cleanup {
  # Send a kill signal to the dev server.
  kill `ps aux | grep "[Dd]ev_appserver.py --host=0.0.0.0 --port=9501" | awk '{print $2}'`

  # Wait for the servers to go down; suppress "connection refused" error output
  # from nc since that is exactly what we are expecting to happen.
  while ( nc -vz localhost 9501 >/dev/null 2>&1 ); do sleep 1; done

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

export DEFAULT_SKIP_INSTALLING_THIRD_PARTY_LIBS=false
export DEFAULT_RUN_MINIFIED_TESTS=false
maybeInstallDependencies "$@"

if ( nc -vz localhost 8181 ); then
  echo ""
  echo "  There is already a server running on localhost:8181."
  echo "  Please terminate it before running the performance tests."
  echo "  Exiting."
  echo ""
  exit 1
fi
  

# Forces the cleanup function to run on exit.
# Developers: note that at the end of this script, the cleanup() function at
# the top of the file is run.
trap cleanup EXIT

# Change execute status of browsermob-proxy
chmod 744 $TOOLS_DIR/browsermob-proxy-2.1.1/bin/browsermob-proxy

# Start a demo server.
($PYTHON_CMD $GOOGLE_APP_ENGINE_HOME/dev_appserver.py --host=0.0.0.0 --port=9501 --clear_datastore=yes --dev_appserver_log_level=critical --log_level=critical --skip_sdk_update_check=true .)&

# Wait for the servers to come up.
while ! nc -vz localhost 9501; do sleep 1; done

$PYTHON_CMD scripts/backend_tests.py --test_target=core.tests.performance_tests.splash_test $@ 

chmod 644 $TOOLS_DIR/browsermob-proxy-2.1.1/bin/browsermob-proxy
rm bmp.log server.log
