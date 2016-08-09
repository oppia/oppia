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

# Argument passed to dev_appserver.py to indicate whether or not to
# clear the datastore.
CLEAR_DATASTORE_ARG="--clear_datastore=true"
# Argument passed to gulpfile.js to help build with minification.
MINIFICATION=false
for arg in "$@"; do
  if [ "$arg" == "--save_datastore" ]; then
    CLEAR_DATASTORE_ARG=""
  fi
  # Used to emulate running Oppia in a production environment.
  if [ "$arg" == "--prod_env" ]; then
    MINIFICATION=true
    $PYTHON_CMD scripts/build.py
  fi
done

yaml_env_variable="MINIFICATION: $MINIFICATION"
sed -i.bak -e s/"MINIFICATION: .*"/"$yaml_env_variable"/ app.yaml
# Delete the modified yaml file(-i.bak)
rm app.yaml.bak

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

# Set up a local dev instance.
# TODO(sll): do this in a new shell.
echo Starting GAE development server
# To turn emailing on, add the option '--enable_sendmail=yes' and change the relevant
# settings in feconf.py. Be careful with this -- you do not want to spam people
# accidentally!

if [[ "$MINIFICATION" == "true" ]]; then
  # This starts up a dev server which uses minified resources.
  $NODE_PATH/bin/node $NODE_MODULE_DIR/gulp/bin/gulp.js start_devserver --prod_env=True --gae_devserver_path=$GOOGLE_APP_ENGINE_HOME/dev_appserver.py --clear_datastore=$CLEAR_DATASTORE_ARG
else
  $NODE_PATH/bin/node $NODE_MODULE_DIR/gulp/bin/gulp.js start_devserver --gae_devserver_path=$GOOGLE_APP_ENGINE_HOME/dev_appserver.py --clear_datastore=$CLEAR_DATASTORE_ARG
fi

echo Done!
