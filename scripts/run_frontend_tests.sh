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
#   bash scripts/run_frontend_tests.sh
# The root folder MUST be named 'oppia'.
# It runs unit tests for frontend JavaScript code (using Karma).

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

# Parse additional command line arguments.
# Credit: http://stackoverflow.com/questions/192249
SKIP_INSTALL=false
RUN_MINIFIED_TESTS=false
for i in "$@"; do
  # Match each space-separated argument passed to the shell file to a separate
  # case label, based on a pattern. E.g. Match to --skip-install=*, where the
  # asterisk refers to any characters following the equals sign, other than
  # whitespace.
  case $i in
    --skip-install=*)
    # Extract the value right of the equal sign by substringing the $i variable
    # at the equal sign.
    # http://tldp.org/LDP/abs/html/string-manipulation.html
    SKIP_INSTALL="${i#*=}"
    # Shifts the argument parameters over by one. E.g. $2 becomes $1, etc.
    shift
    ;;

    --run-minified-tests=*)
    RUN_MINIFIED_TESTS="${i#*=}"
    shift
    ;;

    *)
    echo Error: Unknown command line option: $i
    ;;
  esac
done

if [ "$SKIP_INSTALL" = "false" ]; then
  # Install third party dependencies
  # TODO(sll): Make this work with fewer third-party dependencies.
  bash scripts/install_third_party.sh

  # Ensure that generated JS and CSS files are in place before running the tests.
  echo ""
  echo "  Running build task with concatenation only "
  echo ""

  $NODE_PATH/bin/node $NODE_MODULE_DIR/gulp/bin/gulp.js build

  echo ""
  echo "  Running build task with concatenation and minification"
  echo ""

  $NODE_PATH/bin/node $NODE_MODULE_DIR/gulp/bin/gulp.js build --minify=True

  install_node_module karma 0.12.16
  install_node_module karma-jasmine 0.1.0
  install_node_module karma-coverage 0.5.2
  install_node_module karma-ng-html2js-preprocessor 0.1.0
  install_node_module karma-chrome-launcher 0.1.4
fi

echo ""
echo "  View interactive frontend test coverage reports by navigating to"
echo ""
echo "    ../karma_coverage_reports"
echo ""
echo "  on your filesystem."
echo ""

echo ""
echo "  Running test in development environment"
echo ""

$NODE_MODULE_DIR/karma/bin/karma start core/tests/karma.conf.js

if [ "$RUN_MINIFIED_TESTS" = "true" ]; then
  echo ""
  echo "  Running test in production environment"
  echo ""

  $NODE_MODULE_DIR/karma/bin/karma start core/tests/karma.conf.js --minify=True
fi

echo Done!