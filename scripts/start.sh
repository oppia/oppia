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
#   sh scripts/start.sh
# The root folder MUST be named 'oppia'.
# It sets up the third-party files and the local GAE, and runs tests.

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
GOOGLE_APP_ENGINE_HOME=$RUNTIME_HOME/google_appengine
# Note that if the following line is changed so that it uses webob_1_1_1, PUT requests from the frontend fail.
PYTHONPATH=.:$GOOGLE_APP_ENGINE_HOME:$GOOGLE_APP_ENGINE_HOME/lib/webob_0_9:./third_party/webtest
export PYTHONPATH=$PYTHONPATH

echo Checking whether GAE is installed in $GOOGLE_APP_ENGINE_HOME
if [ ! -d "$GOOGLE_APP_ENGINE_HOME" ]; then
  echo Installing Google App Engine
  mkdir -p $GOOGLE_APP_ENGINE_HOME
  wget http://googleappengine.googlecode.com/files/google_appengine_1.7.4.zip -O gae-download.zip
  unzip gae-download.zip -d $RUNTIME_HOME/
  rm gae-download.zip
fi

echo Checking whether angular-ui is installed in third_party
if [ ! -d "third_party/angular-ui" ]; then
  echo Installing Angular UI
  mkdir -p third_party/
  wget https://github.com/angular-ui/angular-ui/archive/v0.4.0.zip -O angular-ui-download.zip
  unzip angular-ui-download.zip -d third_party/
  rm angular-ui-download.zip
  mv third_party/angular-ui-0.4.0 third_party/angular-ui
fi

echo Checking whether bootstrap is installed in third_party
if [ ! -d "third_party/bootstrap" ]; then
  echo Installing Bootstrap
  mkdir -p third_party/
  wget http://twitter.github.com/bootstrap/assets/bootstrap.zip -O bootstrap-download.zip
  unzip bootstrap-download.zip -d third_party/
  rm bootstrap-download.zip
fi

echo Checking whether select2 is installed in third_party
if [ ! -d "third_party/select2" ]; then
  echo Installing select2
  mkdir -p third_party/
  wget https://github.com/ivaynberg/select2/archive/master.zip -O select2-download.zip
  unzip select2-download.zip -d third_party/
  rm select2-download.zip
  mv third_party/select2-master third_party/select2
fi

echo Checking whether the Closure Compiler is installed in third_party
if [ ! -d "third_party/closure-compiler" ]; then
  echo Installing Closure Compiler
  mkdir -p third_party/closure-compiler
  wget http://closure-compiler.googlecode.com/files/compiler-latest.zip -O closure-compiler-download.zip
  unzip closure-compiler-download.zip -d third_party/closure-compiler
  rm closure-compiler-download.zip
fi

echo Checking whether jquery is installed in third_party
if [ ! -d "third_party/jquery" ]; then
  echo Installing JQuery
  mkdir -p third_party/jquery/
  wget https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js -O third_party/jquery/jquery.min.js
fi

echo Checking whether jqueryui is installed in third_party
if [ ! -d "third_party/jqueryui" ]; then
  echo Installing JQueryUI
  mkdir -p third_party/jqueryui/
  wget https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/jquery-ui.min.js -O third_party/jqueryui/jquery-ui.min.js
fi

echo Checking whether angularjs is installed in third_party
if [ ! -d "third_party/angularjs" ]; then
  echo Installing AngularJS and angular-sanitize
  mkdir -p third_party/angularjs/
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular.min.js -O third_party/angularjs/angular.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular-resource.min.js -O third_party/angularjs/angular-resource.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular-sanitize.min.js -O third_party/angularjs/angular-sanitize.min.js
fi

echo Checking whether d3.js is installed in third_party
if [ ! -d "third_party/d3js" ]; then
  echo Installing d3.js
  mkdir -p third_party/d3js/
  wget http://d3js.org/d3.v3.min.js -O third_party/d3js/d3.min.js
fi

echo Checking whether YUI is installed in third_party
if [ ! -d "third_party/yui" ]; then
  echo Installing yui
  mkdir -p third_party/yui/
  wget http://yui.yahooapis.com/3.8.1/build/yui/yui-min.js -O third_party/yui/yui-min.js
fi

echo Checking whether sympy is installed in third_party
if [ ! -d "third_party/sympy-0.7.2" ]; then
  echo Installing sympy
  mkdir -p third_party/sympy-0.7.2/
  wget https://sympy.googlecode.com/files/sympy-0.7.2.tar.gz -O third_party/sympy-0.7.2/sympy-0.7.2.tar.gz
  tar -C third_party/sympy-0.7.2 -zxvf third_party/sympy-0.7.2/sympy-0.7.2.tar.gz
  rm third_party/sympy-0.7.2/sympy-0.7.2.tar.gz
fi


# webtest is used for tests.
echo Checking if webtest is installed in third_party
if [ ! -d "third_party/webtest" ]; then
  echo Installing webtest framework
  wget http://pypi.python.org/packages/source/W/WebTest/WebTest-1.4.2.zip -O webtest-download.zip
  unzip webtest-download.zip -d third_party
  rm webtest-download.zip
  mv third_party/WebTest-1.4.2 third_party/webtest
fi

# Set up a local dev instance
echo Starting GAE development server in a new shell
gnome-terminal -e "python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py \
--address=0.0.0.0 --port=8080 --clear_datastore ."

sleep 5

echo Opening browser window pointing to an end user interface
/opt/google/chrome/chrome http://localhost:8080/ &


# Do a build.
python build.py

sh scripts/test.sh

echo Done!
