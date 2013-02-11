#!/bin/sh
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
