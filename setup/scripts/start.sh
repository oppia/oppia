# Run this script from the oppia root folder:
#   sh internal/scripts/start.sh
# The root folder MUST be named 'oppia'.
# It sets up the third-party files and the local GAE.

set -e

echo Checking name of current directory
EXPECTED_PWD='oppia'
if [ ${PWD##*/} != $EXPECTED_PWD ]; then
  echo This script should be run from a folder named oppia.
  exit 1
fi

RUNTIME_HOME=../oppia_runtime
GOOGLE_APP_ENGINE_HOME=$RUNTIME_HOME/google_appengine
PYTHONPATH=.:$GOOGLE_APP_ENGINE_HOME

echo Checking whether GAE is installed in $GOOGLE_APP_ENGINE_HOME
if [ ! -d "$GOOGLE_APP_ENGINE_HOME" ]; then
  echo Installing Google App Engine
  mkdir -p $GOOGLE_APP_ENGINE_HOME
  wget http://googleappengine.googlecode.com/files/google_appengine_1.7.3.zip -O gae-download.zip
  unzip gae-download.zip -d $RUNTIME_HOME/
  rm gae-download.zip
fi

echo Checking whether angular-ui is installed in third_party
if [ ! -d "third_party/angular-ui" ]; then
  echo Installing Angular UI
  mkdir -p third_party/
  wget https://github.com/angular-ui/angular-ui/archive/v0.3.1.zip -O angular-ui-download.zip
  unzip angular-ui-download.zip -d third_party/
  rm angular-ui-download.zip
  mv third_party/angular-ui-0.3.1 third_party/angular-ui
fi

echo Checking whether bootstrap is installed in third_party
if [ ! -d "third_party/bootstrap" ]; then
  echo Installing Bootstrap
  mkdir -p third_party/
  wget http://twitter.github.com/bootstrap/assets/bootstrap.zip -O bootstrap-download.zip
  unzip bootstrap-download.zip -d third_party/
  rm bootstrap-download.zip
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
  wget https://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular-sanitize.min.js -O third_party/angularjs/angular-sanitize.min.js
fi

echo Checking whether d3.js is installed in third_party
if [ ! -d "third_party/d3js" ]; then
  echo Installing d3.js
  mkdir -p third_party/d3js/
  wget http://d3js.org/d3.v3.min.js -O third_party/d3js/d3.min.js
fi

echo Checking whether jsplumb is installed in third_party
if [ ! -d "third_party/jsplumb" ]; then
  echo Installing JSPlumb
  mkdir -p third_party/jsplumb/
  wget https://jsplumb.googlecode.com/files/jquery.jsPlumb-1.3.15-all.js -O third_party/jsplumb/jsPlumb.js
fi

echo Deleting old *.pyc files
find . -iname "*.pyc" -exec rm -f {} \;

echo Starting GAE development server in a new shell
gnome-terminal -e "python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py \
--address=0.0.0.0 --port=8080 --clear_datastore ."

sleep 3

echo Opening browser window pointing to an end user interface
/opt/google/chrome/chrome http://localhost:8080/ &

echo Done!
