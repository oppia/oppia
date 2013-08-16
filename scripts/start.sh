#!/bin/sh

# Copyright 2013 Google Inc. All Rights Reserved.
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
#   bash scripts/start.sh
# The root folder MUST be named 'oppia'.
# It sets up the third-party files and the local GAE, and runs tests.

set -e

if [ -z "$BASH_VERSION" ]
then
  echo ""
  echo "  Please run me using bash: "
  echo ""
  echo "     bash scripts/start.sh"
  echo ""
  exit 1
fi

# TODO: Consider using getopts command.
for arg in "$@"; do
  if [ "$arg" == "--nojsrepl" ]; then
    NO_JSREPL=true
  fi
done
export NO_JSREPL

echo Checking name of current directory
EXPECTED_PWD='oppia'
if [ ${PWD##*/} != $EXPECTED_PWD ]; then
  echo This script should be run from the oppia/ root folder.
  exit 1
fi

echo Deleting old *.pyc files
find . -iname "*.pyc" -exec rm -f {} \;

RUNTIME_HOME=../gae_runtime
GOOGLE_APP_ENGINE_HOME=$RUNTIME_HOME/google_appengine_1.7.7/google_appengine
THIRD_PARTY_DIR=third_party
# Note that if the following line is changed so that it uses webob_1_1_1, PUT requests from the frontend fail.
PYTHONPATH=.:$GOOGLE_APP_ENGINE_HOME:$GOOGLE_APP_ENGINE_HOME/lib/webob_0_9:$THIRD_PARTY_DIR/webtest-1.4.2
export PYTHONPATH=$PYTHONPATH
# Adjust the path to include a reference to node.
PATH=`pwd`/$THIRD_PARTY_DIR/node-0.10.1/bin:$PATH
MACHINE_TYPE=`uname -m`

mkdir -p $THIRD_PARTY_DIR

echo Checking whether GAE is installed in $GOOGLE_APP_ENGINE_HOME
if [ ! -d "$GOOGLE_APP_ENGINE_HOME" ]; then
  echo Installing Google App Engine
  mkdir -p $GOOGLE_APP_ENGINE_HOME
  wget http://googleappengine.googlecode.com/files/google_appengine_1.7.7.zip -O gae-download.zip
  unzip gae-download.zip -d $RUNTIME_HOME/google_appengine_1.7.7/
  rm gae-download.zip
fi

# Install third party dependencies
bash scripts/install_third_party.sh

# Do a build.
python build.py

# Run the tests.
bash scripts/test.sh

# Set up a local dev instance
echo Starting GAE development server
python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py --host=0.0.0.0 --port=8181 --clear_datastore=yes .

sleep 5

echo Opening browser window pointing to an end user interface
/opt/google/chrome/chrome http://localhost:8181/ &

echo Done!
