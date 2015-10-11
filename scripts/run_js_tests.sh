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

echo Checking whether karma is installed in $TOOLS_DIR
if [ ! -d "$NODE_MODULE_DIR/karma" ]; then
  echo Installing karma
  $NPM_INSTALL karma@0.12.16
fi

echo Checking whether karma-chrome-launcher is installed in $TOOLS_DIR
if [ ! -d "$NODE_MODULE_DIR/karma-chrome-launcher" ]; then
  echo Installing karma-chrome-launcher
  $NPM_INSTALL karma-chrome-launcher@0.1.4
fi

echo Checking whether karma-jasmine is installed in $TOOLS_DIR
if [ ! -d "$NODE_MODULE_DIR/karma-jasmine" ]; then
  echo Installing karma-jasmine
  # Install karma as well, in case people have an older version.
  $NPM_INSTALL karma@0.12.16
  $NPM_INSTALL karma-jasmine@0.1.0
fi

echo Checking whether karma-coverage is installed in $TOOLS_DIR
if [ ! -d "$NODE_MODULE_DIR/karma-coverage" ]; then
  echo Installing karma-coverage
  $NPM_INSTALL karma-coverage@0.5.2
fi

echo Checking whether karma-ng-html2js-preprocessor is installed in $TOOLS_DIR
if [ ! -d "$NODE_MODULE_DIR/karma-ng-html2js-preprocessor" ]; then
  echo Installing karma-ng-html2js-preprocessor
  $NPM_INSTALL karma-ng-html2js-preprocessor@0.1.0
fi

echo ""
echo "  View interactive frontend test coverage reports by navigating to"
echo ""
echo "    ../karma_coverage_reports"
echo ""
echo "  on your filesystem."
echo ""

$NODE_MODULE_DIR/karma/bin/karma start core/tests/karma.conf.js

echo Done!
