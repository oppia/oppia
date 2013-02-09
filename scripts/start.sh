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


# Set up a local dev instance
echo Starting GAE development server in a new shell
gnome-terminal -e "python $GOOGLE_APP_ENGINE_HOME/dev_appserver.py \
--address=0.0.0.0 --port=8080 --clear_datastore ."

sleep 5

echo Opening browser window pointing to an end user interface
/opt/google/chrome/chrome http://localhost:8080/ &


# Do a build.
python build.py

# Code for running tests
echo Checking if webtest is installed in third_party
if [ ! -d "third_party/webtest" ]; then
  echo Installing webtest framework
  wget http://pypi.python.org/packages/source/W/WebTest/WebTest-1.4.2.zip -O webtest-download.zip
  unzip webtest-download.zip -d third_party
  rm webtest-download.zip
  mv third_party/WebTest-1.4.2 third_party/webtest
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
coverage report --omit="third_party/*","../oppia_runtime/*","/usr/share/pyshared/*"

echo Done!
