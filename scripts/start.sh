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
# This script starts up a development server running Oppia. It installs any
# missing third-party dependencies and starts up a local GAE development
# server.
#
# Run the script from the oppia root folder:
#
#   bash scripts/start.sh
#
# Note that the root folder MUST be named 'oppia'.

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
set -- "${remaining_params[@]}"


echo Checking whether GAE is installed in $GOOGLE_APP_ENGINE_HOME
if [ ! -f "$GOOGLE_APP_ENGINE_HOME/appcfg.py" ]; then
  echo Installing Google App Engine
  mkdir -p $GOOGLE_APP_ENGINE_HOME
  curl --silent https://storage.googleapis.com/appengine-sdks/deprecated/1919/google_appengine_1.9.19.zip -o gae-download.zip
  unzip gae-download.zip -d $TOOLS_DIR/google_appengine_1.9.19/
  rm gae-download.zip
fi

# Install third party dependencies.
bash scripts/install_third_party.sh

# Check that there isn't a server already running.
if ( nc -vz localhost 8181 >/dev/null 2>&1 ); then
  echo ""
  echo "  WARNING"
  echo "  Could not start new server. There is already an existing server"
  echo "  running at port 8181."
  echo ""
  exit 1
fi

# Launch a browser window.
if [ -f "/usr/bin/google-chrome" ]; then
  echo ""
  echo "  INFORMATION"
  echo "  Setting up a local development server at localhost:8181. Opening a"
  echo "  Chrome browser window pointing to this server."
  echo ""
  (sleep 5; /usr/bin/google-chrome http://localhost:8181/ )&
elif [ -e /Applications/Google\ Chrome.app ]; then
  echo ""
  echo "  INFORMATION"
  echo "  Setting up a local development server at localhost:8181. Opening a"
  echo "  Chrome browser window pointing to this server."
  echo ""
  (sleep 5; open /Applications/Google\ Chrome.app http://localhost:8181/ )&
else
  echo ""
  echo "  INFORMATION"
  echo "  Setting up a local development server. You can access this server"
  echo "  by navigating to localhost:8181 in a browser window."
  echo ""
fi

# Argument passed to dev_appserver.py to indicate whether or not to
# clear the datastore.
CLEAR_DATASTORE_ARG="--clear_datastore=true"
for arg in "$@"; do
  if [ "$arg" == "--save_datastore" ]; then
    CLEAR_DATASTORE_ARG=""
  fi
done

PYTHON_CMD="python"

# Check if Python exists.
# http://stackoverflow.com/questions/592620
if ! command -v $PYTHON_CMD >/dev/null 2>&1; then
  echo "You must have Python 2.7 in order to run Oppia."
fi

# Get the version of Python.
PYTHON_VERSION=$(python --version 2>&1)
EXPECTED_PYTHON_VERSION_PREFIX="2.7"
if [[ $PYTHON_VERSION =~ Python[[:space:]](.+) ]]; then
  PYTHON_VERSION=${BASH_REMATCH[1]}
else
  echo "Unrecognizable Python command output: ${PYTHON_VERSION}"
fi

# Check the version of Python. If its version does not start with 2.7, then
# try and see whether the 'python2.7' command exists.
if [[ $PYTHON_VERSION != "${EXPECTED_PYTHON_VERSION_PREFIX}*" ]]; then
  PYTHON_CMD="python2.7"
  if ! command -v $PYTHON_CMD >/dev/null 2>&1; then
    # TODO(bhenning): Implement a flag to allow the user to pass in a custom
    # path to Python 2.7 if the script cannot locate it.
    echo "Expected at least Python ${EXPECTED_PYTHON_VERSION_PREFIX}; you have Python ${PYTHON_VERSION}"
  fi
fi

# TODO(bhenning): Per discussions with Sean on Windows, it both 'python2.7' and
# 'python3.x' do not work as valid commands. Instead, only 'python' will work
# and whether 2.7 or 3.x is selected is based on whichever's bin folder appears
# first in the user's PATH variable. In order to fix this, the script should
# detect if it is running on Windows and, if it cannot find Python or the
# version of Python needed for Oppia, then it should emit a custom error message
# for Windows users explaining to them where to go to install Python 2.7 and how
# to make sure it is earlier than 3.x in their PATH in order to properly run
# Oppia.

# Set up a local dev instance.
# TODO(sll): do this in a new shell.
echo Starting GAE development server
# To turn emailing on, add the option '--enable_sendmail=yes' and change the relevant
# settings in feconf.py. Be careful with this -- you do not want to spam people
# accidentally!
$PYTHON_CMD $GOOGLE_APP_ENGINE_HOME/dev_appserver.py --host=0.0.0.0 --port=8181 $CLEAR_DATASTORE_ARG .
echo Done!
