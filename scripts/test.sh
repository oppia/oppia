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
#   sh scripts/test.sh
# The root folder MUST be named 'oppia'.
# It runs tests.

set -e

echo Checking name of current directory
EXPECTED_PWD='oppia'
if [ ${PWD##*/} != $EXPECTED_PWD ]; then
  echo This script should be run from a folder named oppia.
  exit 1
fi

echo Deleting old *.pyc files
find . -iname "*.pyc" -exec rm -f {} \;

RUNTIME_HOME=../oppia_runtime
GOOGLE_APP_ENGINE_HOME=$RUNTIME_HOME/google_appengine_1.7.7/google_appengine
# Note that if the following line is changed so that it uses webob_1_1_1, PUT requests from the frontend fail.
PYTHONPATH=.:$GOOGLE_APP_ENGINE_HOME:$GOOGLE_APP_ENGINE_HOME/lib/webob_0_9:./third_party/webtest-1.4.2:./third_party/mock-1.0.1
export PYTHONPATH=$PYTHONPATH

# webtest is used for tests.
echo Checking if webtest is installed in third_party
if [ ! -d "third_party/webtest-1.4.2" ]; then
  echo Installing webtest framework
  wget http://pypi.python.org/packages/source/W/WebTest/WebTest-1.4.2.zip -O webtest-download.zip
  unzip webtest-download.zip -d third_party
  rm webtest-download.zip
  mv third_party/WebTest-1.4.2 third_party/webtest-1.4.2
fi

# mock is also used for tests.
echo Checking if mock is installed in third_party
if [ ! -d "third_party/mock-1.0.1" ]; then
  echo Installing webtest framework
  wget https://pypi.python.org/packages/source/m/mock/mock-1.0.1.zip#md5=869f08d003c289a97c1a6610faf5e913 -O mock-1.0.1.zip
  unzip mock-1.0.1.zip -d third_party
  rm mock-1.0.1.zip
fi

# Some Angular JS lib files are needed for frontend tests.
echo Checking whether angularjs is installed in third_party
if [ ! -d "third_party/static/angularjs-1.0.3" ]; then
  echo Installing AngularJS and angular-sanitize
  mkdir -p third_party/static/angularjs-1.0.3/
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular.min.js -O third_party/static/angularjs-1.0.3/angular.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular-resource.min.js -O third_party/static/angularjs-1.0.3/angular-resource.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular-sanitize.min.js -O third_party/static/angularjs-1.0.3/angular-sanitize.min.js

  # Files for tests.
  wget http://code.angularjs.org/1.0.3/angular-mocks.js -O third_party/static/angularjs-1.0.3/angular-mocks.js
  wget http://code.angularjs.org/1.0.3/angular-scenario.js -O third_party/static/angularjs-1.0.3/angular-scenario.js
fi

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
  sudo rm -rf third_party/coverage
  wget http://pypi.python.org/packages/source/c/coverage/coverage-3.6.tar.gz#md5=67d4e393f4c6a5ffc18605409d2aa1ac -O coverage.tar.gz
  tar xvzf coverage.tar.gz -C third_party
  rm coverage.tar.gz
  mv third_party/coverage-3.6 third_party/coverage

  cd third_party/coverage
  sudo python setup.py install
  cd ../../
  sudo rm -rf third_party/coverage
fi

coverage run ./tests/suite.py
coverage report --omit="third_party/*","../oppia_runtime/*","/usr/share/pyshared/*" --show-missing

echo Done!
