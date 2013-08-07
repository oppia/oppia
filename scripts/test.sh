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

set -e

echo Checking name of current directory
EXPECTED_PWD='oppia'
if [ ${PWD##*/} != $EXPECTED_PWD ]; then
  echo This script should be run from the oppia/ root folder.
  exit 1
fi

echo Deleting old *.pyc files
find . -iname "*.pyc" -exec rm -f {} \;

RUNTIME_HOME=../gae_runtime
GOOGLE_APP_ENGINE_HOME=$RUNTIME_HOME/google_appengine_1.7.7/google_appengine
THIRD_PARTY_DIR=third_party
# Note that if the following line is changed so that it uses webob_1_1_1, PUT requests from the frontend fail.
PYTHONPATH=.:$GOOGLE_APP_ENGINE_HOME:$GOOGLE_APP_ENGINE_HOME/lib/webob_0_9:$THIRD_PARTY_DIR/webtest-1.4.2
export PYTHONPATH=$PYTHONPATH
# Adjust the path to include a reference to node.
PATH=$PATH:$THIRD_PARTY_DIR/node-0.10.1/bin
MACHINE_TYPE=`uname -m`

# webtest is used for tests.
echo Checking if webtest is installed in third_party
if [ ! -d "$THIRD_PARTY_DIR/webtest-1.4.2" ]; then
  echo Installing webtest framework
  wget http://pypi.python.org/packages/source/W/WebTest/WebTest-1.4.2.zip -O webtest-download.zip
  unzip webtest-download.zip -d $THIRD_PARTY_DIR
  rm webtest-download.zip
  mv $THIRD_PARTY_DIR/WebTest-1.4.2 $THIRD_PARTY_DIR/webtest-1.4.2
fi

# Some Angular JS lib files are needed for frontend tests.
echo Checking whether angularjs is installed in third_party
if [ ! -d "$THIRD_PARTY_DIR/static/angularjs-1.0.7" ]; then
  echo Installing AngularJS and angular-sanitize
  mkdir -p $THIRD_PARTY_DIR/static/angularjs-1.0.7/
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.js -O $THIRD_PARTY_DIR/static/angularjs-1.0.7/angular.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.min.js -O $THIRD_PARTY_DIR/static/angularjs-1.0.7/angular.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular-resource.min.js -O $THIRD_PARTY_DIR/static/angularjs-1.0.7/angular-resource.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular-sanitize.min.js -O $THIRD_PARTY_DIR/static/angularjs-1.0.7/angular-sanitize.min.js

  # Files for tests.
  wget http://code.angularjs.org/1.0.7/angular-mocks.js -O $THIRD_PARTY_DIR/static/angularjs-1.0.7/angular-mocks.js
  wget http://code.angularjs.org/1.0.7/angular-scenario.js -O $THIRD_PARTY_DIR/static/angularjs-1.0.7/angular-scenario.js
fi

# Node is needed to install karma.
echo Checking if node.js is installed in third_party
if [ ! -d "$THIRD_PARTY_DIR/node-0.10.1" ]; then
  echo Installing Node.js
  if [ ${MACHINE_TYPE} == 'x86_64' ]; then
    wget http://nodejs.org/dist/v0.10.1/node-v0.10.1-linux-x64.tar.gz -O node-download.tgz
    tar xzf node-download.tgz --directory $THIRD_PARTY_DIR
    mv $THIRD_PARTY_DIR/node-v0.10.1-linux-x64 $THIRD_PARTY_DIR/node-0.10.1
    rm node-download.tgz
  else
    wget http://nodejs.org/dist/v0.10.1/node-v0.10.1-linux-x86.tar.gz -O node-download.tgz
    tar xzf node-download.tgz --directory $THIRD_PARTY_DIR
    mv $THIRD_PARTY_DIR/node-v0.10.1-linux-x86 $THIRD_PARTY_DIR/node-0.10.1
    rm node-download.tgz
  fi
fi

echo Checking whether Karma has been installed via node.js
if [ ! -d "$THIRD_PARTY_DIR/node-0.10.1/lib/node_modules/karma" ]; then
  echo Installing Karma
  $THIRD_PARTY_DIR/node-0.10.1/bin/npm install -g karma@0.8.7
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
  sudo rm -rf $THIRD_PARTY_DIR/coverage
  wget http://pypi.python.org/packages/source/c/coverage/coverage-3.6.tar.gz#md5=67d4e393f4c6a5ffc18605409d2aa1ac -O coverage.tar.gz
  tar xvzf coverage.tar.gz -C $THIRD_PARTY_DIR
  rm coverage.tar.gz
  mv $THIRD_PARTY_DIR/coverage-3.6 $THIRD_PARTY_DIR/coverage

  cd $THIRD_PARTY_DIR/coverage
  sudo python setup.py install
  cd ../../../
  sudo rm -rf $THIRD_PARTY_DIR/coverage
fi

coverage run ./core/tests/suite.py $@
coverage report --omit="$THIRD_PARTY_DIR/*","$RUNTIME_HOME/*","/usr/share/pyshared/*" --show-missing

echo Done!
