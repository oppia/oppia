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
#   bash scripts/test.sh
# The root folder MUST be named 'oppia'.
# It runs tests.

if [ -z "$BASH_VERSION" ]
then
  echo ""
  echo "  Please run me using bash: "
  echo ""
  echo "     bash scripts/$0"
  echo ""
  return 1
fi

set -e
source $(dirname $0)/setup.sh || exit 1
source $(dirname $0)/setup_gae.sh || exit 1


# Note: you can safely delete all of the following code (up to the end of the
# file) if it leads to errors on your system. It runs checks to see how well
# the tests cover the code.

echo Checking if coverage is installed on the system
IS_COVERAGE_INSTALLED=$(python - << EOF
import sys
try:
    import coverage as coverage_module
except:
    coverage_module = None
if coverage_module:
    sys.stderr.write('Coverage is installed in %s\n' % coverage_module.__path__)
    print 1
else:
    sys.stderr.write('Coverage is NOT installed\n')
    print 0
EOF
)

if [ $IS_COVERAGE_INSTALLED = 0 ]; then
  echo Installing coverage
  sudo rm -rf $TOOLS_DIR/coverage
  wget http://pypi.python.org/packages/source/c/coverage/coverage-3.6.tar.gz#md5=67d4e393f4c6a5ffc18605409d2aa1ac -O coverage.tar.gz
  tar xvzf coverage.tar.gz -C $TOOLS_DIR
  rm coverage.tar.gz
  mv $TOOLS_DIR/coverage-3.6 $TOOLS_DIR/coverage

  cd $TOOLS_DIR/coverage
  sudo python setup.py install
  cd ../../../
  sudo rm -rf $TOOLS_DIR/coverage
fi

coverage run ./core/tests/gae_suite.py $@
coverage report --omit="$TOOLS_DIR/*","$THIRD_PARTY_DIR/*","/usr/share/pyshared/*" --show-missing

echo Done!
