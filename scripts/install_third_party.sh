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

# Install third-party node modules needed for the build process.
install_node_module ajv 5.0.0
install_node_module babel-eslint 10.0.1
install_node_module browserstack-local 1.3.3
install_node_module dotenv 6.0.0
install_node_module eslint 4.19.0
install_node_module eslint-plugin-angular 0.12.0
install_node_module eslint-plugin-html 4.0.1
install_node_module gulp 3.9.0
install_node_module gulp-clean-css 2.0.2
install_node_module gulp-concat 2.6.0
install_node_module gulp-sourcemaps 1.6.0
install_node_module gulp-uglify 2.0.1
install_node_module gulp-util 3.0.7
install_node_module htmllint 0.7.2
install_node_module htmllint-cli 0.0.7
install_node_module @mapbox/stylelint-processor-arbitrary-tags 0.2.0
install_node_module postcss-syntax 0.10.0
install_node_module stylelint 9.2.1
install_node_module stylelint-config-standard 18.2.0
install_node_module through2 2.0.0
install_node_module typescript 3.3.3
install_node_module @types/angular 1.6.54
install_node_module @types/angular-animate 1.5.10
install_node_module @types/angular-mocks 1.7.0
install_node_module @types/ckeditor 4.9.2
install_node_module @types/d3 3.5.40
install_node_module @types/google.visualization 0.0.46
install_node_module @types/jasmine 3.3.8
install_node_module @types/jasmine-jquery 1.5.33
install_node_module @types/jasminewd2 2.0.6
install_node_module @types/jquery 3.3.29
install_node_module @types/jqueryui 1.12.1
install_node_module @types/leaflet 1.4.0
install_node_module @types/mathjax 0.0.35
install_node_module @types/mathjs 5.0.0
install_node_module @types/mousetrap 1.6.1
install_node_module @types/node 6.14.3
install_node_module @types/select2 4.0.48
install_node_module @types/q 1.5.1
install_node_module @types/selenium-webdriver 2.53.43
install_node_module uglify-js 3.3.11
install_node_module yargs 3.29.0

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
    sed -e "s/  doc()/  pass#doc()/" |\
    # This and the next command disable unit and compressed unit tests for the
    # compressed distribution of Skulpt. These tests don't work on some
    # Ubuntu environments and cause a libreadline dependency issue.
    sed -e "s/ret = os.system(\"{0}/ret = 0 #os.system(\"{0}/" |\
    sed -e "s/ret = rununits(opt=True)/ret = 0/" > $TMP_FILE
    mv $TMP_FILE $TOOLS_DIR/skulpt-0.10.0/skulpt/skulpt.py
    $PYTHON_CMD $TOOLS_DIR/skulpt-0.10.0/skulpt/skulpt.py dist

    # Return to the Oppia root folder.
    cd $OPPIA_DIR
  fi

  # Move the build directory to the static resources folder.
  mkdir -p $THIRD_PARTY_DIR/static/skulpt-0.10.0
  cp -r $TOOLS_DIR/skulpt-0.10.0/skulpt/dist/* $THIRD_PARTY_DIR/static/skulpt-0.10.0
fi

# Checking if pip is installed. If you are having
# trouble, please ensure that you have pip installed (see "Installing Oppia"
# on the Oppia developers' wiki page).
echo Checking if pip is installed on the local machine
if ! type pip > /dev/null 2>&1 ; then
    echo ""
    echo "  Pip is required to install Oppia dependencies, but pip wasn't found"
    echo "  on your local machine."
    echo ""
    echo "  Please see \"Installing Oppia\" on the Oppia developers' wiki page:"

    if [ "${OS}" == "Darwin" ] ; then
      echo "    https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-OS%29"
    else
      echo "    https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux%29"
    fi

    # If pip is not installed, quit.
    exit 1
fi

function pip_install {
  # Attempt standard pip install, or pass in --system if the local environment requires it.
  # See https://github.com/pypa/pip/issues/3826 for context on when this situation may occur.
  pip install "$@" || pip install --system "$@"
}

echo Checking if pylint is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/pylint-1.9.3" ]; then
  echo Installing Pylint

  pip_install pylint==1.9.3 --target="$TOOLS_DIR/pylint-1.9.3"
  # Add __init__.py file so that pylint dependency backports are resolved
  # correctly.
  touch $TOOLS_DIR/pylint-1.9.3/backports/__init__.py
fi

echo Checking if pylint-quotes is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/pylint-quotes-0.1.9" ]; then
  echo Installing pylint-quotes
  # Note that the URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o pylint-quotes-0.1.9.tar.gz -L https://github.com/edaniszewski/pylint-quotes/archive/0.1.9.tar.gz
  tar xzf pylint-quotes-0.1.9.tar.gz -C $TOOLS_DIR
  rm pylint-quotes-0.1.9.tar.gz
fi

# Install webtest.
echo Checking if webtest is installed in third_party
if [ ! -d "$TOOLS_DIR/webtest-1.4.2" ]; then
  echo Installing webtest framework
  # Note that the github URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o webtest-download.zip -L https://github.com/Pylons/webtest/archive/1.4.2.zip
  unzip webtest-download.zip -d $TOOLS_DIR
  rm webtest-download.zip
fi

# Install isort.
echo Checking if isort is installed in third_party
if [ ! -d "$TOOLS_DIR/isort-4.2.15" ]; then
  echo Installing isort
  # Note that the URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o isort-4.2.15.tar.gz -L https://pypi.python.org/packages/4d/d5/7c8657126a43bcd3b0173e880407f48be4ac91b4957b51303eab744824cf/isort-4.2.15.tar.gz
  tar xzf isort-4.2.15.tar.gz -C $TOOLS_DIR
  rm isort-4.2.15.tar.gz
fi

# Install pycodestyle.
echo Checking if pycodestyle is installed in third_party
if [ ! -d "$TOOLS_DIR/pycodestyle-2.3.1" ]; then
  echo Installing pycodestyle
  # Note that the URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o pycodestyle-2.3.1.tar.gz -L https://pypi.python.org/packages/e1/88/0e2cbf412bd849ea6f1af1f97882add46a374f4ba1d2aea39353609150ad/pycodestyle-2.3.1.tar.gz
  tar xzf pycodestyle-2.3.1.tar.gz -C $TOOLS_DIR
  rm pycodestyle-2.3.1.tar.gz
fi

# Install esprima.
echo Checking if esprima is installed in third_party
if [ ! -d "$TOOLS_DIR/esprima-4.0.1" ]; then
  echo Installing esprima
  # Note that the URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o esprima-4.0.1.tar.gz -L https://files.pythonhosted.org/packages/cc/a1/50fccd68a12bcfc27adfc9969c090286670a9109a0259f3f70943390b721/esprima-4.0.1.tar.gz
  tar xzf esprima-4.0.1.tar.gz -C $TOOLS_DIR
  rm esprima-4.0.1.tar.gz
fi

# Python API for browsermob-proxy.
echo Checking if browsermob-proxy is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/browsermob-proxy-0.7.1" ]; then
  echo Installing browsermob-proxy

  pip_install browsermob-proxy==0.7.1 --target="$TOOLS_DIR/browsermob-proxy-0.7.1"
fi

echo Checking if selenium is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/selenium-2.53.2" ]; then
  echo Installing selenium

  pip_install selenium==2.53.2 --target="$TOOLS_DIR/selenium-2.53.2"
fi

echo Checking if PIL is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/PIL-1.1.7" ]; then
  echo Installing PIL

  pip_install http://effbot.org/downloads/Imaging-1.1.7.tar.gz --target="$TOOLS_DIR/PIL-1.1.7"

  if [[ $? != 0 && ${OS} == "Darwin" ]]; then
    echo "  PIL install failed. See troubleshooting instructions at:"
    echo "    https://github.com/oppia/oppia/wiki/Troubleshooting#mac-os"
  fi
fi

echo Checking if PyGithub is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/PyGithub-1.43.5" ]; then
  echo Installing PyGithub

  pip install PyGithub==1.43.5 --target="$TOOLS_DIR/PyGithub-1.43.5"
fi

# install pre-push script
echo Installing pre-push hook for git
$PYTHON_CMD $OPPIA_DIR/scripts/pre_push_hook.py --install
