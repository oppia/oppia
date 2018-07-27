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
#
# Optional arguments:
#   --skip-install=true/false If true, skips installing dependencies. The
#         default value is false.
#   --run-minified-tests=true/false Whether to run frontend karma tests on both
#         minified and non-minified code. The default value is false.
#
# The root folder MUST be named 'oppia'.
# It runs unit tests for frontend JavaScript code (using Karma).
#
# Note: You can replace 'it' with 'fit' or 'describe' with 'fdescribe' to run a
# single test or test suite.

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

# echo ""
# echo "  View interactive frontend test coverage reports by navigating to"
# echo ""
# echo "    ../karma_coverage_reports"
# echo ""
# echo "  on your filesystem."
# echo ""

# echo ""
# echo "  Running test in development environment"
# echo ""
# $PYTHON_CMD scripts/build.py
# $XVFB_PREFIX $NODE_MODULE_DIR/karma/bin/karma start core/tests/karma.conf.js

# if [ "$RUN_MINIFIED_TESTS" = "true" ]; then
#   echo ""
#   echo "  Running test in production environment"
#   echo ""
#   $PYTHON_CMD scripts/build.py --prod_env
#   $XVFB_PREFIX $NODE_MODULE_DIR/karma/bin/karma start core/tests/karma.conf.js --prod_env=True
# fi

echo Done!
