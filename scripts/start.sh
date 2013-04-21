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

echo Checking whether sympy is installed in third_party
if [ ! -d "third_party/sympy-0.7.2" ]; then
  echo Installing sympy
  mkdir -p third_party/sympy-0.7.2/
  wget https://sympy.googlecode.com/files/sympy-0.7.2.tar.gz -O third_party/sympy-0.7.2/sympy-0.7.2.tar.gz
  tar -C third_party/sympy-0.7.2 -zxvf third_party/sympy-0.7.2/sympy-0.7.2.tar.gz
  rm third_party/sympy-0.7.2/sympy-0.7.2.tar.gz
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

echo Checking whether bootstrap is installed in third_party
if [ ! -d "third_party/static/bootstrap" ]; then
  echo Installing Bootstrap
  mkdir -p third_party/static/
  wget http://twitter.github.com/bootstrap/assets/bootstrap.zip -O bootstrap-download.zip
  unzip bootstrap-download.zip -d third_party/static/
  rm bootstrap-download.zip
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
fi

echo Checking whether d3.js is installed in third_party
if [ ! -d "third_party/static/d3js-3" ]; then
  echo Installing d3.js
  mkdir -p third_party/static/d3js-3/
  wget http://d3js.org/d3.v3.min.js -O third_party/static/d3js-3/d3.min.js
fi

echo Checking whether YUI is installed in third_party
if [ ! -d "third_party/static/yui3-3.8.1/build" ]; then
  echo Installing yui
  mkdir -p third_party/static/yui3-tmp
  wget https://github.com/yui/yui3/archive/v3.8.1.zip -O yui3-3.8.1.zip
  unzip yui3-3.8.1.zip -d third_party/static/yui3-tmp
  rm yui3-3.8.1.zip

  # Just get the modules we need.
  mkdir -p third_party/static/yui3-3.8.1/build

  # Contains yui-min.js
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/yui third_party/static/yui3-3.8.1/build

  # Derived using the YUI Configurator: http://yuilibrary.com/yui/configurator/
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/yui-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/oop third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/attribute-core third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/event-custom-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/event-custom-complex third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/attribute-observable third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/attribute-extras third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/attribute-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/base-core third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/base-observable third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/base-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/pluginhost-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/pluginhost-config third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/base-pluginhost third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/base-build third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/features third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/dom-core third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/dom-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/selector-native third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/selector third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/node-core third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/node-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/event-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/event-delegate third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/node-event-delegate third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/node-pluginhost third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/dom-style third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/dom-screen third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/node-screen third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/node-style third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/selector-css2 third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/selector-css3 third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/yui-throttle third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/frame third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/exec-command third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/editor-selection third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/editor-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/editor-bidi third_party/static/yui3-3.8.1/build

  # More dependencies that the YUI configurator didn't pick up
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/cssbutton third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/plugin third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/editor-para-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/editor-para third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/editor-br third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/editor-tab third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/createlink-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/widget-base third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/attribute-complex third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/classnamemanager third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/event-synthetic third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/event-focus third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/event-outside third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/substitute third_party/static/yui3-3.8.1/build
  mv third_party/static/yui3-tmp/yui3-3.8.1/build/stylesheet third_party/static/yui3-3.8.1/build

  mv third_party/static/yui3-tmp/yui3-3.8.1/HISTORY.md third_party/static/yui3-3.8.1
  mv third_party/static/yui3-tmp/yui3-3.8.1/index.js third_party/static/yui3-3.8.1
  mv third_party/static/yui3-tmp/yui3-3.8.1/LICENSE.md third_party/static/yui3-3.8.1
  mv third_party/static/yui3-tmp/yui3-3.8.1/package.json third_party/static/yui3-3.8.1
  mv third_party/static/yui3-tmp/yui3-3.8.1/README.md third_party/static/yui3-3.8.1
  rm -rf third_party/static/yui3-tmp
fi

echo Checking whether YUI Gallery is installed in third_party
if [ ! -d "third_party/static/yui3-gallery-20121107" ]; then
  echo Installing yui3 gallery
  mkdir -p third_party/static/
  wget https://github.com/yui/yui3-gallery/archive/gallery-2012.11.07-21-32.zip -O yui3-gallery-20121107.zip
  unzip yui3-gallery-20121107.zip -d third_party/static
  rm yui3-gallery-20121107.zip
  # Just get the modules we need.
  mkdir -p third_party/static/yui3-gallery-20121107/build
  mv third_party/static/yui3-gallery-gallery-2012.11.07-21-32/build/gallery-itsa* third_party/static/yui3-gallery-20121107/build
  mv third_party/static/yui3-gallery-gallery-2012.11.07-21-32/sandbox third_party/static/yui3-gallery-20121107/sandbox
  mv third_party/static/yui3-gallery-gallery-2012.11.07-21-32/gallery.js third_party/static/yui3-gallery-20121107
  mv third_party/static/yui3-gallery-gallery-2012.11.07-21-32/package.json third_party/static/yui3-gallery-20121107
  mv third_party/static/yui3-gallery-gallery-2012.11.07-21-32/README third_party/static/yui3-gallery-20121107
  rm -rf third_party/static/yui3-gallery-gallery-2012.11.07-21-32
fi


# Set up a local dev instance
echo Starting GAE development server in a new shell
echo "python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py \
--host=0.0.0.0 --port=8181 --clear_datastore=yes ."

sleep 5

echo Opening browser window pointing to an end user interface
/opt/google/chrome/chrome http://localhost:8181/ &


# Do a build.
python build.py

#sh scripts/test.sh

echo Done!
