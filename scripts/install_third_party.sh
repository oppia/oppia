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

set -e
source $(dirname $0)/setup.sh || exit 1


echo Checking if node.js is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/node-0.10.1" ]; then
  echo Installing Node.js
  if [ ${OS} == "Darwin" ]; then
    if [ ${MACHINE_TYPE} == 'x86_64' ]; then
      NODE_FILE_NAME=node-v0.10.1-darwin-x64
    else
      NODE_FILE_NAME=node-v0.10.1-darwin-x86
    fi
  elif [ ${OS} == "Linux" ]; then
    if [ ${MACHINE_TYPE} == 'x86_64' ]; then
      NODE_FILE_NAME=node-v0.10.1-linux-x64
    else
      NODE_FILE_NAME=node-v0.10.1-linux-x86
    fi
  else
    echo
    echo     Unsupported OS: failed to determine correct URL for node.js binary.
    echo     See the install_third_party.sh script for details.
    echo
  fi

  wget http://nodejs.org/dist/v0.10.1/$NODE_FILE_NAME.tar.gz -O node-download.tgz
  tar xzf node-download.tgz --directory $TOOLS_DIR
  mv $TOOLS_DIR/$NODE_FILE_NAME $TOOLS_DIR/node-0.10.1
  rm node-download.tgz
fi

echo Checking whether jsrepl is installed in third_party
if [ ! "$NO_JSREPL" -a ! -d "$THIRD_PARTY_DIR/static/jsrepl" ]; then
  echo Checking whether coffeescript has been installed via node.js
  if [ ! -d "$TOOLS_DIR/node-0.10.1/lib/node_modules/coffee-script" ]; then
    echo Installing CoffeeScript
    $TOOLS_DIR/node-0.10.1/bin/npm install -g coffee-script@1.2.0 || sudo $TOOLS_DIR/node-0.10.1/bin/npm install -g coffee-script@1.2.0
  fi
  echo Checking whether uglify has been installed via node.js
  if [ ! -d "$TOOLS_DIR/node-0.10.1/lib/node_modules/uglify-js" ]; then
    echo Installing uglify
    $TOOLS_DIR/node-0.10.1/bin/npm install -g uglify-js || sudo $TOOLS_DIR/node-0.10.1/bin/npm install -g uglify-js
  fi

  if [ ! -d "$TOOLS_DIR/jsrepl/build" ]; then
    echo Downloading jsrepl
    cd $TOOLS_DIR
    git clone git://github.com/replit/jsrepl.git
    cd jsrepl
    git submodule update --init --recursive
    # Use a specific version of the JSRepl repository.
    git checkout 13f89c2cab0ee9163e0077102478958a14afb781

    # Add a temporary backup file so that this script works on both Linux and Mac.
    TMP_FILE=`mktemp /tmp/backup.XXXXXXXXXX`

    echo Compiling jsrepl
    # Sed fixes some issues:
    # - Reducing jvm memory requirement from 4G to 1G.
    # - This version of node uses fs.existsSync.
    # - CoffeeScript is having trouble with octal representation.
    # - Use our installed version of uglifyjs.
    sed -e 's/Xmx4g/Xmx1g/' Cakefile |\
    sed -e 's/path\.existsSync/fs\.existsSync/' |\
    sed -e 's/0o755/493/' |\
    sed -e 's,uglifyjs,$NODE_PATH/uglify-js/bin/uglifyjs,' > $TMP_FILE
    mv $TMP_FILE Cakefile
    export NODE_PATH=$TOOLS_DIR/node-0.10.1/lib/node_modules
    $TOOLS_DIR/node-0.10.1/bin/cake bake

    # Return to the Oppia root folder.
    cd $OPPIA_DIR
  fi

  # Move the build directory to the static resources folder.
  mkdir -p $THIRD_PARTY_DIR/static/jsrepl
  mv $TOOLS_DIR/jsrepl/build/* $THIRD_PARTY_DIR/static/jsrepl

  chown -R $ME $TOOLS_DIR/node-0.10.1/bin || sudo chown -R $ME $TOOLS_DIR/node-0.10.1/bin
  chmod -R 744 $TOOLS_DIR/node-0.10.1/bin || sudo chmod -R 744 $TOOLS_DIR/node-0.10.1/bin
  chown -R $ME $TOOLS_DIR/node-0.10.1/lib/node_modules || sudo chown -R $ME $TOOLS_DIR/node-0.10.1/lib/node_modules
  chmod -R 744 $TOOLS_DIR/node-0.10.1/lib/node_modules || sudo chmod -R 744 $TOOLS_DIR/node-0.10.1/lib/node_modules
fi

# Static resources.
echo Checking whether ui-bootstrap is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/static/ui-bootstrap-0.6.0" ]; then
  echo Installing UI Bootstrap
  mkdir -p $THIRD_PARTY_DIR/static/ui-bootstrap-0.6.0
  wget https://raw.github.com/angular-ui/bootstrap/gh-pages/ui-bootstrap-tpls-0.6.0.js -O $THIRD_PARTY_DIR/static/ui-bootstrap-0.6.0/ui-bootstrap-tpls-0.6.0.js
  wget https://raw.github.com/angular-ui/bootstrap/gh-pages/ui-bootstrap-tpls-0.6.0.min.js -O $THIRD_PARTY_DIR/static/ui-bootstrap-0.6.0/ui-bootstrap-tpls-0.6.0.min.js
fi

echo Checking whether select2 is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/static/select2-3.4.1" ]; then
  echo Installing select2
  mkdir -p $THIRD_PARTY_DIR/static/
  wget https://github.com/ivaynberg/select2/archive/3.4.1.zip -O select2-download.zip
  unzip select2-download.zip -d $THIRD_PARTY_DIR/static/
  rm select2-download.zip
fi

echo Checking whether jwysiwyg is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/static/jwysiwyg-496497" ]; then
  echo Installing jwysiwyg
  mkdir -p $THIRD_PARTY_DIR/static/
  wget https://github.com/jwysiwyg/jwysiwyg/archive/496497b0772067a0064b627c02893d989ccc7cc9.zip -O jwysiwyg-download.zip
  unzip jwysiwyg-download.zip -d $THIRD_PARTY_DIR/static/
  rm jwysiwyg-download.zip
  mv $THIRD_PARTY_DIR/static/jwysiwyg-496497b0772067a0064b627c02893d989ccc7cc9 $THIRD_PARTY_DIR/static/jwysiwyg-496497
fi

echo Checking whether jquery is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/static/jquery-2.0.3" ]; then
  echo Installing JQuery
  mkdir -p $THIRD_PARTY_DIR/static/jquery-2.0.3/
  wget https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.js -O $THIRD_PARTY_DIR/static/jquery-2.0.3/jquery.js
  wget https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js -O $THIRD_PARTY_DIR/static/jquery-2.0.3/jquery.min.js
  wget https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.map -O $THIRD_PARTY_DIR/static/jquery-2.0.3/jquery.min.map
fi

echo Checking whether jqueryui is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/static/jqueryui-1.10.3" ]; then
  echo Installing JQueryUI
  mkdir -p $THIRD_PARTY_DIR/static/jqueryui-1.10.3/
  wget https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js -O $THIRD_PARTY_DIR/static/jqueryui-1.10.3/jquery-ui.min.js
  wget http://jqueryui.com/resources/download/jquery-ui-themes-1.10.3.zip -O jquery-ui-themes.zip
  unzip jquery-ui-themes.zip -d $THIRD_PARTY_DIR/static/jqueryui-1.10.3/
  rm jquery-ui-themes.zip
fi

echo Checking whether angularjs is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3" ]; then
  echo Installing AngularJS and angular-sanitize
  mkdir -p $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular.min.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular.min.js.map -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular.min.js.map

  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-resource.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-resource.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-resource.min.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-resource.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-resource.min.js.map -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-resource.min.js.map

  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-route.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-route.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-route.min.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-route.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-route.min.js.map -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-route.min.js.map

  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-sanitize.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-sanitize.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-sanitize.min.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-sanitize.min.js
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0-rc.3/angular-sanitize.min.js.map -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-sanitize.min.js.map  

  # Files for tests.
  wget http://code.angularjs.org/1.2.0-rc.3/angular-mocks.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-mocks.js
  wget http://code.angularjs.org/1.2.0-rc.3/angular-scenario.js -O $THIRD_PARTY_DIR/static/angularjs-1.2.0-rc.3/angular-scenario.js
fi

echo Checking whether d3.js is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/static/d3js-3.2.8" ]; then
  echo Installing d3.js
  mkdir -p $THIRD_PARTY_DIR/static/d3js-3.2.8/
  wget https://raw.github.com/mbostock/d3/v3.2.8/d3.min.js -O $THIRD_PARTY_DIR/static/d3js-3.2.8/d3.min.js
fi

echo Checking whether bleach is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/bleach-1.2.2" ]; then
  echo Installing bleach
  mkdir -p $THIRD_PARTY_DIR/bleach-1.2.2
  wget https://github.com/jsocol/bleach/archive/v1.2.2.zip -O bleach-download.zip
  unzip bleach-download.zip -d $THIRD_PARTY_DIR/
  rm bleach-download.zip
fi

echo Checking whether html5lib is installed in $THIRD_PARTY_DIR
if [ ! -d "$THIRD_PARTY_DIR/html5lib-python-0.95" ]; then
  echo Installing html5lib
  mkdir -p $THIRD_PARTY_DIR/html5lib-python-0.95
  wget https://github.com/html5lib/html5lib-python/archive/0.95.zip -O html5lib-download.zip
  unzip html5lib-download.zip -d $THIRD_PARTY_DIR/
  rm html5lib-download.zip
fi
