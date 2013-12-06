#!/usr/bin/env bash

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
#   bash scripts/test.sh
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


echo Checking whether coverage is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/coverage-3.6" ]; then
  echo Installing coverage
  rm -rf $TOOLS_DIR/coverage
  wget --no-check-certificate http://pypi.python.org/packages/source/c/coverage/coverage-3.6.tar.gz#md5=67d4e393f4c6a5ffc18605409d2aa1ac -O coverage.tar.gz
  tar xvzf coverage.tar.gz -C $TOOLS_DIR
  rm coverage.tar.gz
fi

python $COVERAGE_HOME/coverage run ./core/tests/gae_suite.py $@
python $COVERAGE_HOME/coverage report --omit="$TOOLS_DIR/*","$THIRD_PARTY_DIR/*","/usr/share/pyshared/*" --show-missing

echo Done!
