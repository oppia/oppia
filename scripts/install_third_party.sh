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
$NPM_INSTALL --only=dev
# This line removes the "npm ERR! missing:" messages. For reference, see this
# thread: https://github.com/npm/npm/issues/19393#issuecomment-374076889
$NPM_CMD dedupe

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
if [ ! -d "$TOOLS_DIR/pylint-1.9.4" ]; then
  echo Installing Pylint

  pip_install pylint==1.9.4 --target="$TOOLS_DIR/pylint-1.9.4"
fi

echo Checking if Pillow is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/Pillow-6.0.0" ]; then
  echo Installing Pillow

  pip_install Pillow==6.0.0 --target="$TOOLS_DIR/Pillow-6.0.0"

  if [[ $? != 0 && ${OS} == "Darwin" ]]; then
    echo "  Pillow install failed. See troubleshooting instructions at:"
    echo "    https://github.com/oppia/oppia/wiki/Troubleshooting#mac-os"
  fi

fi

echo Checking if pylint-quotes is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/pylint-quotes-0.2.1" ]; then
  echo Installing pylint-quotes
  # Note that the URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o pylint-quotes-0.2.1.tar.gz -L https://github.com/edaniszewski/pylint-quotes/archive/0.2.1.tar.gz
  tar xzf pylint-quotes-0.2.1.tar.gz -C $TOOLS_DIR
  rm pylint-quotes-0.2.1.tar.gz
fi

# Install webtest.
echo Checking if webtest is installed in third_party
if [ ! -d "$TOOLS_DIR/webtest-2.0.33" ]; then
  echo Installing webtest framework
  # Note that the github URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o webtest-2.0.33.zip -L https://github.com/Pylons/webtest/archive/2.0.33.zip
  unzip webtest-2.0.33.zip -d $TOOLS_DIR
  rm webtest-2.0.33.zip
fi

# Install isort.
echo Checking if isort is installed in third_party
if [ ! -d "$TOOLS_DIR/isort-4.3.20" ]; then
  echo Installing isort
  # Note that the URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o isort-4.3.20.tar.gz -L https://files.pythonhosted.org/packages/f1/84/5d66ddbe565e36682c336c841e51430384495b272c622ac229029f671be2/isort-4.3.20.tar.gz
  tar xzf isort-4.3.20.tar.gz -C $TOOLS_DIR
  rm isort-4.3.20.tar.gz
fi

# Install pycodestyle.
echo Checking if pycodestyle is installed in third_party
if [ ! -d "$TOOLS_DIR/pycodestyle-2.5.0" ]; then
  echo Installing pycodestyle
  # Note that the URL redirects, so we pass in -L to tell curl to follow the redirect.
  curl -o pycodestyle-2.5.0.tar.gz -L https://files.pythonhosted.org/packages/1c/d1/41294da5915f4cae7f4b388cea6c2cd0d6cd53039788635f6875dfe8c72f/pycodestyle-2.5.0.tar.gz
  tar xzf pycodestyle-2.5.0.tar.gz -C $TOOLS_DIR
  rm pycodestyle-2.5.0.tar.gz
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
if [ ! -d "$TOOLS_DIR/browsermob-proxy-0.8.0" ]; then
  echo Installing browsermob-proxy

  pip_install browsermob-proxy==0.8.0 --target="$TOOLS_DIR/browsermob-proxy-0.8.0"
fi

echo Checking if selenium is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/selenium-3.13.0" ]; then
  echo Installing selenium

  pip_install selenium==3.13.0 --target="$TOOLS_DIR/selenium-3.13.0"
fi

echo Checking if PyGithub is installed in $TOOLS_DIR
if [ ! -d "$TOOLS_DIR/PyGithub-1.43.7" ]; then
  echo Installing PyGithub

  pip_install PyGithub==1.43.7 --target="$TOOLS_DIR/PyGithub-1.43.7"
fi

# install pre-commit script
echo Installing pre-commit hook for git
$PYTHON_CMD $OPPIA_DIR/scripts/pre_commit_hook.py --install

# install pre-push script
echo Installing pre-push hook for git
$PYTHON_CMD $OPPIA_DIR/scripts/pre_push_hook.py --install
