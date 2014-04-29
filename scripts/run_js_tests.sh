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
if [ ! -h "$NODE_MODULE_DIR/.bin/karma" ]; then
  echo Installing Karma
  $NPM_INSTALL karma@0.8.7
fi

echo Checking whether PhantomJS is installed in $TOOLS_DIR
if [ ! -h "$NODE_MODULE_DIR/.bin/phantomjs" ]; then
  echo Installing PhantomJS
  $NPM_INSTALL phantomjs@1.9
fi

$NODE_MODULE_DIR/.bin/karma start core/tests/karma.conf.js

echo Done!
