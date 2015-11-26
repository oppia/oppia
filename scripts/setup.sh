# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

# This file should not be invoked directly, but sourced from other sh scripts.
# Bash execution environent set up for all scripts.


if [ "$SETUP_DONE" ]; then
  echo 'Environment setup completed.'
  return 0
fi
export SETUP_DONE=true

if [ -z "$BASH_VERSION" ]
then
  echo ""
  echo "  Please run me using bash: "
  echo ""
  echo "    bash scripts/$0"
  echo ""
  return 1
fi

# TODO(sll): Consider using getopts command.
declare -a remaining_params
for arg in "$@"; do
  if [ "$arg" == "--nojsrepl" ] || [ "$arg" == "--noskulpt" ]; then
    NO_SKULPT=true
  else
    remaining_params+=($arg)
  fi
done
export NO_SKULPT
export remaining_params

EXPECTED_PWD='oppia'
# The second option allows this script to also be run from deployment folders.
if [[ ${PWD##*/} != $EXPECTED_PWD ]] && [[ ${PWD##*/} != deploy-* ]]; then
  echo ""
  echo "  WARNING   This script should be run from the oppia/ root folder."
  echo ""
  return 1
fi

export OPPIA_DIR=`pwd`
# Set COMMON_DIR to the absolute path of the directory above OPPIA_DIR. This
# is necessary becaue COMMON_DIR (or subsequent variables which refer to it)
# may use it in a situation where relative paths won't work as expected (such
# as $PYTHONPATH).
export COMMON_DIR=$(cd $OPPIA_DIR/..; pwd)
export TOOLS_DIR=$COMMON_DIR/oppia_tools
export THIRD_PARTY_DIR=$OPPIA_DIR/third_party
export NODE_MODULE_DIR=$COMMON_DIR/node_modules
export ME=$(whoami)

mkdir -p $TOOLS_DIR
mkdir -p $THIRD_PARTY_DIR
mkdir -p $NODE_MODULE_DIR

# Adjust the path to include a reference to node.
export NODE_PATH=$TOOLS_DIR/node-4.2.1
export PATH=$NODE_PATH/bin:$PATH
export MACHINE_TYPE=`uname -m`
export OS=`uname`

if [ ! "${OS}" == "Darwin" -a ! "${OS}" == "Linux" ]; then
  # If the OS is Windows, node will be installed globally.
  export NPM_CMD=npm
else
  # Otherwise, npm will be installed locally, in NODE_PATH.
  export NPM_CMD=$NODE_PATH/bin/npm
  # Also, change ownership of $NODE_MODULE_DIR. (For Windows,
  # chown does not seem to be available in git bash.)
  chown -R $ME $NODE_MODULE_DIR
  chmod -R 744 $NODE_MODULE_DIR
fi

export NPM_INSTALL="$NPM_CMD install"

# Adjust path to support the default Chrome locations for Unix, Windows and Mac OS.
if [[ $TRAVIS == 'true' ]]; then
  export CHROME_BIN="chromium-browser"
elif [ -f "/usr/bin/google-chrome" ]; then
  # Unix.
  export CHROME_BIN="/usr/bin/google-chrome"
elif [ -f "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" ]; then
  # Windows.
  export CHROME_BIN="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
else
  # Mac OS.
  export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

# This function takes a command for python as its only input.
# It checks this input for a specific version of python and returns false
# if it does not match the expected prefix.
function test_python_version() {
  EXPECTED_PYTHON_VERSION_PREFIX="2.7"
  PYTHON_VERSION=$($1 --version 2>&1)
  if [[ $PYTHON_VERSION =~ Python[[:space:]](.+) ]]; then
    PYTHON_VERSION=${BASH_REMATCH[1]}
  else
    echo "Unrecognizable Python command output: ${PYTHON_VERSION}"
    # Return a false condition if output of tested command is unrecognizable.
    return 0
  fi
  if [[ "${PYTHON_VERSION}" = "${EXPECTED_PYTHON_VERSION_PREFIX}*" ]]; then
    # The value '1' indicates a true return value,
    # indicating the version of the input Python command is the expected Python version.
    return 1
  else
    return 0
  fi
}

# First, check the default Python command (which should be found within the user's $PATH).
PYTHON_CMD="python"
# Test whether the 'python' or 'python2.7' commands exist and finally fails when
# no suitable python version 2.7 can be found.
if ! test_python_version $PYTHON_CMD; then
  echo "Unable to find 'python'. Trying python2.7 instead..."
  PYTHON_CMD="python2.7"
  if ! test_python_version $PYTHON_CMD; then
    echo "Could not find a suitable Python environment. Exiting."
    # If OS is Windows, print helpful error message about adding Python to path.
    if [ ! "${OS}" == "Darwin" -a ! "${OS}" == "Linux" ]; then
        echo "It looks like you are using Windows. If you have Python installed,"
        echo "make sure it is in your PATH and that PYTHONPATH is set."
        echo "If you have two versions of Python (ie, Python 2.7 and 3), specify 2.7 before other versions of Python when setting the PATH."
        echo "Here are some helpful articles:"
        echo "http://docs.python-guide.org/en/latest/starting/install/win/"
        echo "http://stackoverflow.com/questions/3701646/how-to-add-to-the-pythonpath-in-windows-7"
    fi
    # Exit when no suitable Python environment can be found.
    exit 1
  fi
fi
export PYTHON_CMD
