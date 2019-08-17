# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

##########################################################################

# This file should not be invoked directly, but sourced from other sh scripts.
# Bash execution environent set up for all scripts.

import argparse
import os
import shutil
import subprocess
import sys
import tarfile

from . import build

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--skip_install',
    help='optional; if specified, skips installing dependencies',
    action='store_true')
_PARSER.add_argument(
    '--run_minified_tests',
    help='optional; if specified, runs frontend karma tests on both minified '
    'and non-minified code',
    action='store_true')
_PARSER.add_argument(
    '--nojsrepl',
    help='optional; if specified, skips installation of skulpt.',
    action='store_true')
_PARSER.add_argument(
    '--noskulpt',
    help='optional; if specified, skips installation of skulpt.',
    action='store_true')


def delete_directory_tree(directory_path):
    """Recursively delete an existing directory tree. Does not do anything if
    directory does not exists.

    Args:
        directory_path: str. Directory path to be deleted.
    """
    if not os.path.exists(directory_path):
        return
    shutil.rmtree(directory_path)


def maybeInstallDependencies(
        default_skip_installing_third_party_libs, default_run_minified_tests):
    # Parse additional command line arguments.
    SKIP_INSTALLING_THIRD_PARTY_LIBS = default_skip_installing_third_party_libs
    RUN_MINIFIED_TESTS = default_run_minified_tests
    parsed_args = _PARSER.parse_args()
    SKIP_INSTALLING_THIRD_PARTY_LIBS = parsed_args.skip_install
    RUN_MINIFIED_TESTS = parsed_args.run_minified_tests


  if SKIP_INSTALLING_THIRD_PARTY_LIBS == 'false':
    # Install third party dependencies
    subprocess.call('scripts/install_third_party.sh', shell=True)

    # Ensure that generated JS and CSS files are in place before running the
    # tests.
    print ''
    print '  Running build task with concatenation only '
    print ''

    build.build()

  if RUN_MINIFIED_TESTS == 'true':
    print ''
    print '  Running build task with concatenation and minification'
    print ''

    subprocess.call('scripts/build.py --prod_env'.split())


if [ '$SETUP_DONE' ]; then
  print 'Environment setup completed.'
  return 0
fi

    if parsed_args.nojsrepl or parsed_args.noskulpt:
        NO_SKULPT=true

export NO_SKULPT

EXPECTED_PWD='oppia'
# The second option allows this script to also be run from deployment folders.
if not os.getcwd().endswith(EXPECTED_PWD) and not os.getcwd().endswith(
        'deploy-'):
  print ''
  print '  WARNING   This script should be run from the oppia/ root folder.'
  print ''
  sys.exit(1)

# Set COMMON_DIR to the absolute path of the directory above OPPIA_DIR. This
# is necessary becaue COMMON_DIR (or subsequent variables which refer to it)
# may use it in a situation where relative paths won't work as expected (such
# as $PYTHONPATH).
CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
export COMMON_DIR=$(cd $OPPIA_DIR/..; pwd)
export TOOLS_DIR=$COMMON_DIR/oppia_tools
export THIRD_PARTY_DIR=$OPPIA_DIR/third_party
export NODE_MODULE_DIR=$OPPIA_DIR/node_modules
export ME=$(whoami)

os.mkdir(OPPIA_TOOLS_DIR)
os.mkdir('third_party/')
os.mkdir('node_modules/')

# Adjust the path to include a reference to node.
NODE_PATH = os.path.join(TOOLS_DIR, 'node-10.15.3')
export PATH=$NODE_PATH/bin:$PATH
export MACHINE_TYPE=`uname -m`
export OS=`uname`

os_info = os.uname()
if os_info[0] != 'Darwin' and os_info[0] != 'Linux':
  # Node is a requirement for all installation scripts. Here, we check if the
  # OS supports node.js installation; if not, we exit with an error.
  print ''
  print '  WARNING: Unsupported OS for installation of node.js.'
  print '  If you are running this script on Windows, see the instructions'
  print '  here regarding installation of node.js:'
  print ''
  print '    https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows%29'
  print ''
  print '  STATUS: Installation completed except for node.js. Exiting.'
  print ''
  sys.exit(1)
else
  # Otherwise, npm will be installed locally, in NODE_PATH.
  export NPM_CMD=$NODE_PATH/bin/npm
fi

export NPM_INSTALL='$NPM_CMD install'

# Download and install node.js.
print 'Checking if node.js is installed in %s' % TOOLS_DIR
if not os.path.exists(NODE_PATH):
  print 'Installing Node.js'
  if os_info[0] == 'Darwin':
    if os_info[4] == 'x86_64':
        NODE_FILE_NAME = 'node-v10.15.3-darwin-x64'
    else
        NODE_FILE_NAME = 'node-v10.15.3-darwin-x86'
  elif os_info[0] == 'Linux':
    if os_info[4] == 'x86_64':
      NODE_FILE_NAME = 'node-v10.15.3-linux-x64'
    else
      NODE_FILE_NAME = 'node-v10.15.3-linux-x86'

urllib.urlretrieve(
    'https://nodejs.org/dist/v10.15.3/%s.tar.gz' % NODE_FILE_NAME,
    filename='node-download.tgz')
tar = tarfile.open('node-download.tgz')
tar.extractall(path=TOOLS_DIR)
tar.close()
delete_directory_tree('node-download.tgz')

  # Change ownership of $NODE_MODULE_DIR.
  # Note: on some machines, these commands seem to take quite a long time.
  os.chown('node_modules/', os.getuid(), -1)
  os.chmod('node_modules/', 744)

# Adjust path to support the default Chrome locations for Unix, Windows and Mac OS.
if [ '$TRAVIS' == true ]; then
  export CHROME_BIN='/usr/bin/chromium-browser'
elif [ '$VAGRANT' == true ] || [ -f '/etc/is_vagrant_vm' ]; then
  # XVFB is required for headless testing in Vagrant
  sudo apt-get install xvfb chromium-browser
  export CHROME_BIN='/usr/bin/chromium-browser'
  # Used in frontend and e2e tests. Only gets set if using Vagrant VM.
  export XVFB_PREFIX='/usr/bin/xvfb-run'
  # Enforce proper ownership on oppia, oppia_tools, and node_modules or else NPM installs will fail.
  sudo chown -R vagrant.vagrant /home/vagrant/oppia /home/vagrant/oppia_tools /home/vagrant/node_modules
elif [ -f '/usr/bin/google-chrome' ]; then
  # Unix.
  export CHROME_BIN='/usr/bin/google-chrome'
elif [ -f '/usr/bin/chromium-browser' ]; then
  # Unix.
  export CHROME_BIN='/usr/bin/chromium-browser'
elif [ -f '/c/Program Files (x86)/Google/Chrome/Application/chrome.exe' ]; then
  # Windows.
  export CHROME_BIN='/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'
elif [ -f '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe' ]; then
  # WSL
  export CHROME_BIN='/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'
elif [ -f '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ]; then
  # Mac OS.
  export CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
else
  print 'Chrome is not found, stopping ...'
  exit 1
fi

# This function takes a command for python as its only input.
# It checks this input for a specific version of python and returns false
# if it does not match the expected prefix.
function test_python_version() {
  EXPECTED_PYTHON_VERSION_PREFIX='2.7'
  PYTHON_VERSION=$($1 --version 2>&1)
  if [[ $PYTHON_VERSION =~ Python[[:space:]](.+) ]]; then
    PYTHON_VERSION=${BASH_REMATCH[1]}
  else
    print 'Unrecognizable Python command output: ${PYTHON_VERSION}'
    # Return a false condition if output of tested command is unrecognizable.
    return 1
  fi
  if [[ '${PYTHON_VERSION}' = ${EXPECTED_PYTHON_VERSION_PREFIX}* ]]; then
    # Return 0 to indicate a successful match.
    # Return 1 to indicate a failed match.
    return 0
  else
    return 1
  fi
}

# First, check the default Python command (which should be found within the user's $PATH).
PYTHON_CMD='python'
# Test whether the 'python' or 'python2.7' commands exist and finally fails when
# no suitable python version 2.7 can be found.
if ! test_python_version $PYTHON_CMD; then
  print 'Unable to find 'python'. Trying python2.7 instead...'
  PYTHON_CMD='python2.7'
  if ! test_python_version $PYTHON_CMD; then
    print 'Could not find a suitable Python environment. Exiting.'
    # If OS is Windows, print helpful error message about adding Python to path.
    if [ ! '${OS}' == 'Darwin' -a ! '${OS}' == 'Linux' ]; then
        print 'It looks like you are using Windows. If you have Python installed,'
        print 'make sure it is in your PATH and that PYTHONPATH is set.'
        print 'If you have two versions of Python (ie, Python 2.7 and 3), specify 2.7 before other versions of Python when setting the PATH.'
        print 'Here are some helpful articles:'
        print 'http://docs.python-guide.org/en/latest/starting/install/win/'
        print 'https://stackoverflow.com/questions/3701646/how-to-add-to-the-pythonpath-in-windows-7'
    fi
    # Exit when no suitable Python environment can be found.
    return 1
  fi
fi
export PYTHON_CMD

export SETUP_DONE=true
