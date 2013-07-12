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
GOOGLE_APP_ENGINE_HOME=$RUNTIME_HOME/google_appengine_1.7.7/google_appengine
# Note that if the following line is changed so that it uses webob_1_1_1, PUT requests from the frontend fail.
PYTHONPATH=.:$GOOGLE_APP_ENGINE_HOME:$GOOGLE_APP_ENGINE_HOME/lib/webob_0_9:./third_party/webtest-1.4.2
export PYTHONPATH=$PYTHONPATH

echo Checking whether GAE is installed in $GOOGLE_APP_ENGINE_HOME
if [ ! -d "$GOOGLE_APP_ENGINE_HOME" ]; then
  echo Installing Google App Engine
  mkdir -p $GOOGLE_APP_ENGINE_HOME
  wget http://googleappengine.googlecode.com/files/google_appengine_1.7.7.zip -O gae-download.zip
  unzip gae-download.zip -d $RUNTIME_HOME/google_appengine_1.7.7/
  rm gae-download.zip
fi

echo Checking whether the Closure Compiler is installed in third_party
if [ ! -d "third_party/closure-compiler" ]; then
  echo Installing Closure Compiler
  mkdir -p third_party/closure-compiler
  wget http://closure-compiler.googlecode.com/files/compiler-latest.zip -O closure-compiler-download.zip
  unzip closure-compiler-download.zip -d third_party/closure-compiler
  rm closure-compiler-download.zip
fi

# Static resources.
echo Checking whether angular-ui is installed in third_party
if [ ! -d "third_party/static/angular-ui-0.4.0" ]; then
  echo Installing Angular UI
  mkdir -p third_party/static/
  wget https://github.com/angular-ui/angular-ui/archive/v0.4.0.zip -O angular-ui-download.zip
  unzip angular-ui-download.zip -d third_party/static/
  rm angular-ui-download.zip
fi

echo Checking whether select2 is installed in third_party
if [ ! -d "third_party/static/select2" ]; then
  echo Installing select2
  mkdir -p third_party/static/
  wget https://github.com/ivaynberg/select2/archive/master.zip -O select2-download.zip
  unzip select2-download.zip -d third_party/static/
  rm select2-download.zip
  mv third_party/static/select2-master third_party/static/select2
fi

echo Checking whether jquery is installed in third_party
if [ ! -d "third_party/static/jquery-1.7.1" ]; then
  echo Installing JQuery
  mkdir -p third_party/static/jquery-1.7.1/
  wget https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js -O third_party/static/jquery-1.7.1/jquery.min.js
fi

echo Checking whether jqueryui is installed in third_party
if [ ! -d "third_party/static/jqueryui-1.8.17" ]; then
  echo Installing JQueryUI
  mkdir -p third_party/static/jqueryui-1.8.17/
  wget https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/jquery-ui.min.js -O third_party/static/jqueryui-1.8.17/jquery-ui.min.js
fi

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

echo Checking whether d3.js is installed in third_party
if [ ! -d "third_party/static/d3js-3" ]; then
  echo Installing d3.js
  mkdir -p third_party/static/d3js-3/
  wget http://d3js.org/d3.v3.min.js -O third_party/static/d3js-3/d3.min.js
fi

echo Checking whether YUI2 is installed in third_party
if [ ! -d "third_party/static/yui2-2.9.0" ]; then
  echo Downloading YUI2 JavaScript and CSS files
  mkdir -p third_party/static/yui2-2.9.0
  wget "http://yui.yahooapis.com/combo?2.9.0/build/yahoo-dom-event/yahoo-dom-event.js&2.9.0/build/container/container_core-min.js&2.9.0/build/menu/menu-min.js&2.9.0/build/element/element-min.js&2.9.0/build/button/button-min.js&2.9.0/build/editor/editor-min.js" -O third_party/static/yui2-2.9.0/yui2-2.9.0.js
  wget "http://yui.yahooapis.com/combo?2.9.0/build/assets/skins/sam/skin.css" -O third_party/static/yui2-2.9.0/yui2-2.9.0.css
fi

# Do a build.
python build.py

# Run the tests.
sh scripts/test.sh

# Set up a local dev instance
echo Starting GAE development server
python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py --host=0.0.0.0 --port=8181 --clear_datastore=yes .

sleep 5

echo Opening browser window pointing to an end user interface
/opt/google/chrome/chrome http://localhost:8181/ &

echo Done!
