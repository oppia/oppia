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
#   bash scripts/run_js_tests.sh
# The root folder MUST be named 'oppia'.
# It runs tests.

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
# TODO(sll): Make this work with fewer third-party dependencies.
bash scripts/install_third_party.sh

echo Checking whether Karma is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/node-0.10.1/lib/node_modules/karma" ]; then
  echo Installing Karma
  $TOOLS_DIR/node-0.10.1/bin/npm install -g karma@0.8.7 || sudo $TOOLS_DIR/node-0.10.1/bin/npm install -g karma@0.8.7

  chown -R $ME $TOOLS_DIR/node-0.10.1/bin || sudo chown -R $ME $TOOLS_DIR/node-0.10.1/bin
  chmod -R 744 $TOOLS_DIR/node-0.10.1/bin || sudo chmod -R 744 $TOOLS_DIR/node-0.10.1/bin
  chown -R $ME $TOOLS_DIR/node-0.10.1/lib/node_modules || sudo chown -R $ME $TOOLS_DIR/node-0.10.1/lib/node_modules
  chmod -R 744 $TOOLS_DIR/node-0.10.1/lib/node_modules || sudo chmod -R 744 $TOOLS_DIR/node-0.10.1/lib/node_modules
fi

export NODEJS_HOME=$TOOLS_DIR/node-0.10.1/bin/
export PATH=$PATH:$NODEJS_HOME

$TOOLS_DIR/node-0.10.1/bin/karma start core/tests/karma.conf.js

echo Done!
