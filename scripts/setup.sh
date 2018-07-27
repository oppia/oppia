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


function maybeInstallDependencies {
  # Parse additional command line arguments.
  # Credit: https://stackoverflow.com/questions/192249
  export SKIP_INSTALLING_THIRD_PARTY_LIBS=$DEFAULT_SKIP_INSTALLING_THIRD_PARTY_LIBS
  export RUN_MINIFIED_TESTS=$DEFAULT_RUN_MINIFIED_TESTS
  for i in "$@"; do
    # Match each space-separated argument passed to the shell file to a separate
    # case label, based on a pattern. E.g. Match to --skip-install=*, where the
    # asterisk refers to any characters following the equals sign, other than
    # whitespace.
    case $i in
      --skip-install=*)
      # Extract the value right of the equal sign by substringing the $i
      # variable at the equal sign.
      # http://tldp.org/LDP/abs/html/string-manipulation.html
      SKIP_INSTALLING_THIRD_PARTY_LIBS="${i#*=}"
      # Shifts the argument parameters over by one. E.g. $2 becomes $1, etc.
      shift
      ;;

      --run-minified-tests=*)
      RUN_MINIFIED_TESTS="${i#*=}"
      shift
      ;;

    esac
  done

  if [ "$SKIP_INSTALLING_THIRD_PARTY_LIBS" = "false" ]; then
    # Install third party dependencies
    # TODO(sll): Make this work with fewer third-party dependencies.
    bash scripts/install_third_party.sh

    # Ensure that generated JS and CSS files are in place before running the
    # tests.
    echo ""
    echo "  Running build task with concatenation only "
    echo ""

    $NODE_PATH/bin/node $NODE_MODULE_DIR/gulp/bin/gulp.js build

    # install_node_module jasmine-core 2.5.2
    # install_node_module karma 1.5.0
    # install_node_module karma-jasmine 1.1.0
    # install_node_module karma-jasmine-jquery 0.1.1
    # install_node_module karma-json-fixtures-preprocessor 0.0.6
    # install_node_module karma-coverage 1.1.1
    # install_node_module karma-ng-html2js-preprocessor 1.0.0
    # install_node_module karma-chrome-launcher 2.0.0
    install_node_module protractor 5.3.1
    install_node_module protractor-screenshot-reporter 0.0.5
    install_node_module jasmine-spec-reporter 3.2.0

    $NODE_MODULE_DIR/.bin/webdriver-manager update --versions.chrome 2.40
  fi

  # if [ "$RUN_MINIFIED_TESTS" = "true" ]; then
  #   echo ""
  #   echo "  Running build task with concatenation and minification"
  #   echo ""

  #   $NODE_PATH/bin/node $NODE_MODULE_DIR/gulp/bin/gulp.js build --minify=True
  # fi
}

if [ "$SETUP_DONE" ]; then
  echo 'Environment setup completed.'
  return 0
fi

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
export NODE_PATH=$TOOLS_DIR/node-6.9.1
export PATH=$NODE_PATH/bin:$PATH
export MACHINE_TYPE=`uname -m`
export OS=`uname`

if [ ! "${OS}" == "Darwin" -a ! "${OS}" == "Linux" ]; then
  # Node is a requirement for all installation scripts. Here, we check if the
  # OS supports node.js installation; if not, we exit with an error.
  echo ""
  echo "  WARNING: Unsupported OS for installation of node.js."
  echo "  If you are running this script on Windows, see the instructions"
  echo "  here regarding installation of node.js:"
  echo ""
  echo "    https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows%29"
  echo ""
  echo "  STATUS: Installation completed except for node.js. Exiting."
  echo ""
  return 1
else
  # Otherwise, npm will be installed locally, in NODE_PATH.
  export NPM_CMD=$NODE_PATH/bin/npm
fi

export NPM_INSTALL="$NPM_CMD install"

# Download and install node.js.
echo Checking if node.js is installed in $TOOLS_DIR
if [ ! -d "$NODE_PATH" ]; then
  echo Installing Node.js
  if [ ${OS} == "Darwin" ]; then
    if [ ${MACHINE_TYPE} == 'x86_64' ]; then
      NODE_FILE_NAME=node-v6.9.1-darwin-x64
    else
      NODE_FILE_NAME=node-v6.9.1-darwin-x86
    fi
  elif [ ${OS} == "Linux" ]; then
    if [ ${MACHINE_TYPE} == 'x86_64' ]; then
      NODE_FILE_NAME=node-v6.9.1-linux-x64
    else
      NODE_FILE_NAME=node-v6.9.1-linux-x86
    fi
  fi

  curl -o node-download.tgz https://nodejs.org/dist/v6.9.1/$NODE_FILE_NAME.tar.gz
  tar xzf node-download.tgz --directory $TOOLS_DIR
  mv $TOOLS_DIR/$NODE_FILE_NAME $NODE_PATH
  rm node-download.tgz

  # Change ownership of $NODE_MODULE_DIR.
  # Note: on some machines, these commands seem to take quite a long time.
  chown -R $ME $NODE_MODULE_DIR
  chmod -R 744 $NODE_MODULE_DIR
fi

# Adjust path to support the default Chrome locations for Unix, Windows and Mac OS.
if [ "$TRAVIS" = true ]; then
  export CHROME_BIN="/usr/bin/chromium-browser"
elif [ "$VAGRANT" = true ] || [ -f "/etc/is_vagrant_vm" ]; then
  # XVFB is required for headless testing in Vagrant
  sudo apt-get install xvfb chromium-browser
  export CHROME_BIN="/usr/bin/chromium-browser"
  # Used in frontend and e2e tests. Only gets set if using Vagrant VM.
  export XVFB_PREFIX="/usr/bin/xvfb-run"
  # Enforce proper ownership on oppia, oppia_tools, and node_modules or else NPM installs will fail.
  sudo chown -R vagrant.vagrant /home/vagrant/oppia /home/vagrant/oppia_tools /home/vagrant/node_modules
elif [ -f "/usr/bin/google-chrome" ]; then
  # Unix.
  export CHROME_BIN="/usr/bin/google-chrome"
elif [ -f "/usr/bin/chromium-browser" ]; then
  # Unix.
  export CHROME_BIN="/usr/bin/chromium-browser"
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
    return 1
  fi
  if [[ "${PYTHON_VERSION}" = ${EXPECTED_PYTHON_VERSION_PREFIX}* ]]; then
    # Return 0 to indicate a successful match.
    # Return 1 to indicate a failed match.
    return 0
  else
    return 1
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
        echo "https://stackoverflow.com/questions/3701646/how-to-add-to-the-pythonpath-in-windows-7"
    fi
    # Exit when no suitable Python environment can be found.
    return 1
  fi
fi
export PYTHON_CMD

# List all node modules that are currently installed. The "npm list" command is
# slow, so we precompute this here and refer to it as needed.
echo "Generating list of installed node modules..."
NPM_INSTALLED_MODULES="$($NPM_CMD list)"
export NPM_INSTALLED_MODULES
echo "Generation completed."

install_node_module() {
  # Usage: install_node_module [module_name] [module_version]
  #
  # module_name: the name of the node module
  # module_version: the expected version of the module

  echo Checking whether $1 is installed
  if [ ! -d "$NODE_MODULE_DIR/$1" ]; then
    echo installing $1
    $NPM_INSTALL $1@$2
  else
    if [[ $NPM_INSTALLED_MODULES != *"$1@$2"* ]]; then
      echo Version of $1 does not match $2. Reinstalling $1...
      $NPM_INSTALL $1@$2
      # Regenerate the list of installed modules.
      NPM_INSTALLED_MODULES="$($NPM_CMD list)"
    fi
  fi
}
export -f install_node_module

export SETUP_DONE=true
