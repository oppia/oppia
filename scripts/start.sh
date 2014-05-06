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
if [ ! -d "$GOOGLE_APP_ENGINE_HOME" ]; then
  echo Installing Google App Engine
  mkdir -p $GOOGLE_APP_ENGINE_HOME
  wget http://googleappengine.googlecode.com/files/google_appengine_1.8.8.zip -O gae-download.zip
  unzip gae-download.zip -d $TOOLS_DIR/google_appengine_1.8.8/
  rm gae-download.zip
fi

# webtest is used for tests.
echo Checking if webtest is installed in third_party
if [ ! -d "$TOOLS_DIR/webtest-1.4.2" ]; then
  echo Installing webtest framework
  # a bug in older versions of wget prevents it from properly getting the certificate and downloading pypi
  wget http://pypi.python.org/packages/source/W/WebTest/WebTest-1.4.2.zip --no-check-certificate -O webtest-download.zip
  unzip webtest-download.zip -d $TOOLS_DIR
  rm webtest-download.zip
  mv $TOOLS_DIR/WebTest-1.4.2 $TOOLS_DIR/webtest-1.4.2
fi

# Install third party dependencies
bash scripts/install_third_party.sh

if [ ! -f "/opt/google/chrome/chrome" ]; then
  echo ""
  echo "  INFORMATION"
  echo "  Setting up a local development server. You can access this server"
  echo "  by navigating to localhost:8181 in a browser window."
  echo ""
else
  echo ""
  echo "  INFORMATION"
  echo "  Setting up a local development server at localhost:8181. Opening a"
  echo "  Chrome browser window pointing to this server."
  echo ""
  (sleep 5; /opt/google/chrome/chrome http://localhost:8181/ )&
fi

# Set up a local dev instance
# TODO(sll): Do this in a new shell.
echo Starting GAE development server
python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py --host=0.0.0.0 --port=8181 --clear_datastore=yes .

echo Done!
