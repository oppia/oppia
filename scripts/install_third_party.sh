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
python scripts/install_third_party.py

# Check if the OS supports node.js and jsrepl installation.
if [ ! "${OS}" == "Darwin" -a ! "${OS}" == "Linux" ]; then
  echo ""
  echo "  WARNING: Unsupported OS for installation of node.js and jsrepl."
  echo "  If you are running this script on Windows, see the instructions"
  echo "  here regarding installation of node.js:"
  echo ""
  echo "    https://code.google.com/p/oppia/wiki/WindowsGuidelines"
  echo ""
  echo "  STATUS: Installation completed except for node.js and jsrepl. Exiting."
  echo ""
else
  # If the OS supports it, download and install node.js and jsrepl.
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
    fi

    wget http://nodejs.org/dist/v0.10.1/$NODE_FILE_NAME.tar.gz -O node-download.tgz
    tar xzf node-download.tgz --directory $TOOLS_DIR
    mv $TOOLS_DIR/$NODE_FILE_NAME $TOOLS_DIR/node-0.10.1
    rm node-download.tgz
  fi

  # Prevent SELF_SIGNED_CERT_IN_CHAIN error as per
  #
  #   http://blog.npmjs.org/post/78085451721/npms-self-signed-certificate-is-no-more
  #
  $TOOLS_DIR/node-0.10.1/bin/npm config set ca ""

  echo Checking whether jsrepl is installed in third_party
  if [ ! "$NO_JSREPL" -a ! -d "$THIRD_PARTY_DIR/static/jsrepl" ]; then
    echo Installing CoffeeScript
    $NPM_INSTALL coffee-script@1.2.0 ||
    {
      echo ""
      echo "  [oppia-message]"
      echo ""
      echo "  Instructions:"
      echo "    If the script fails here, please try running these commands (you"
      echo "    may need to use sudo):"
      echo ""
      echo "      chown -R $ME ~/.npm"
      echo "      rm -rf ~/tmp"
      echo ""
      echo "    Then run the script again."
      echo ""
      echo "  What is happening:"
      echo "    npm, a package manager that Oppia uses to install some of its"
      echo "    dependencies, is putting things into the ~/tmp and ~/.npm"
      echo "    folders, and then encounters issues with permissions."
      echo ""
      echo "  More information:"
      echo "    http://stackoverflow.com/questions/16151018/npm-throws-error-without-sudo"
      echo "    https://github.com/isaacs/npm/issues/3664"
      echo "    https://github.com/isaacs/npm/issues/2952"
      echo ""

      exit 1
    }

    echo Installing uglify
    $NPM_INSTALL uglify-js

    if [ ! -d "$TOOLS_DIR/jsrepl/build" ]; then
      echo Downloading jsrepl
      cd $TOOLS_DIR
      rm -rf jsrepl
      git clone git://github.com/replit/jsrepl.git
      cd jsrepl
      # Use a specific version of the JSRepl repository.
      git checkout 13f89c2cab0ee9163e0077102478958a14afb781

      git submodule update --init --recursive

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
      sed -e 's,uglifyjs,'$NODE_MODULE_DIR'/.bin/uglifyjs,' > $TMP_FILE
      mv $TMP_FILE Cakefile
      export NODE_PATH=$NODE_MODULE_DIR
      $NODE_MODULE_DIR/.bin/cake bake

      # Return to the Oppia root folder.
      cd $OPPIA_DIR
    fi

    # Move the build directory to the static resources folder.
    mkdir -p $THIRD_PARTY_DIR/static/jsrepl
    cp -r $TOOLS_DIR/jsrepl/build/* $THIRD_PARTY_DIR/static/jsrepl
  fi
fi
