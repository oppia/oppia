#!/usr/bin/env bash

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

set -e
source $(dirname $0)/setup.sh || exit 1

# Download and install required JS and zip files.
echo Installing third-party JS libraries and zip files.
$PYTHON_CMD scripts/install_third_party.py

# Check if the OS supports node.js installation; if not, return to the calling
# script.
if [ ! "${OS}" == "Darwin" -a ! "${OS}" == "Linux" ]; then
  echo ""
  echo "  WARNING: Unsupported OS for installation of node.js."
  echo "  If you are running this script on Windows, see the instructions"
  echo "  here regarding installation of node.js:"
  echo ""
  echo "    https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows%29"
  echo ""
  echo "  STATUS: Installation completed except for node.js. Exiting."
  echo ""
  exit 0
fi

# If the OS supports it, download and install node.js.
echo Checking if node.js is installed in $TOOLS_DIR
if [ ! -d "$NODE_PATH" ]; then
  echo Installing Node.js
  if [ ${OS} == "Darwin" ]; then
    if [ ${MACHINE_TYPE} == 'x86_64' ]; then
      NODE_FILE_NAME=node-v4.2.1-darwin-x64
    else
      NODE_FILE_NAME=node-v4.2.1-darwin-x86
    fi
  elif [ ${OS} == "Linux" ]; then
    if [ ${MACHINE_TYPE} == 'x86_64' ]; then
      NODE_FILE_NAME=node-v4.2.1-linux-x64
    else
      NODE_FILE_NAME=node-v4.2.1-linux-x86
    fi
  fi

  curl --silent http://nodejs.org/dist/v4.2.1/$NODE_FILE_NAME.tar.gz -o node-download.tgz
  tar xzf node-download.tgz --directory $TOOLS_DIR
  mv $TOOLS_DIR/$NODE_FILE_NAME $NODE_PATH
  rm node-download.tgz
fi

# Prevent SELF_SIGNED_CERT_IN_CHAIN error as per
#
#   http://blog.npmjs.org/post/78085451721
#
$NPM_CMD config set ca ""

# Download and install Skulpt. Skulpt is built using a Python script included
# within the Skulpt repository (skulpt.py). This script normally requires
# GitPython, however the patches to it below (with the sed operations) lead to
# it no longer being required. The Python script is used to avoid having to
# manually recreate the Skulpt dist build process in install_third_party.py.
# Note that skulpt.py will issue a warning saying its dist command will not
# work properly without GitPython, but it does actually work due to the
# patches.

echo Checking whether Skulpt is installed in third_party
if [ ! "$NO_SKULPT" -a ! -d "$THIRD_PARTY_DIR/static/skulpt-0.10.0" ]; then
  if [ ! -d "$TOOLS_DIR/skulpt-0.10.0" ]; then
    echo Downloading Skulpt
    cd $TOOLS_DIR
    mkdir skulpt-0.10.0
    cd skulpt-0.10.0
    git clone https://github.com/skulpt/skulpt
    cd skulpt

    # Use a specific Skulpt release.
    git checkout 0.10.0

    # Add a temporary backup file so that this script works on both Linux and
    # Mac.
    TMP_FILE=`mktemp /tmp/backup.XXXXXXXXXX`

    echo Compiling Skulpt

    # The Skulpt setup function needs to be tweaked. It fails without certain
    # third party commands. These are only used for unit tests and generating
    # documentation and are not necessary when building Skulpt.
    sed -e "s/ret = test()/ret = 0/" $TOOLS_DIR/skulpt-0.10.0/skulpt/skulpt.py |\
    sed -e "s/  doc()/  pass#doc()/" > $TMP_FILE
    mv $TMP_FILE $TOOLS_DIR/skulpt-0.10.0/skulpt/skulpt.py
    $PYTHON_CMD $TOOLS_DIR/skulpt-0.10.0/skulpt/skulpt.py dist

    # Return to the Oppia root folder.
    cd $OPPIA_DIR
  fi

  # Move the build directory to the static resources folder.
  mkdir -p $THIRD_PARTY_DIR/static/skulpt-0.10.0
  cp -r $TOOLS_DIR/skulpt-0.10.0/skulpt/dist/* $THIRD_PARTY_DIR/static/skulpt-0.10.0
fi

# Note that numpy needs to be built after downloading. If you are having
# trouble, please ensure that you have pip installed (see "Installing Oppia"
# on the Oppia developers' wiki page).
echo Checking if numpy is installed in $TOOLS_DIR/pip_packages
if [ ! -d "$TOOLS_DIR/numpy-1.6.1" ]; then
  echo Installing numpy
  pip install numpy==1.6.1 --target="$TOOLS_DIR/numpy-1.6.1"
fi

# Install third-party node modules needed for the build process.
install_node_module gulp 3.9.0
install_node_module through2 2.0.0
install_node_module yargs 3.29.0
install_node_module gulp-concat 2.6.0
install_node_module gulp-minify-css 1.2.1
install_node_module gulp-util 3.0.7
install_node_module jscs 2.3.0
