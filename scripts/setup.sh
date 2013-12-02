# Copyright 2013 Google Inc. All Rights Reserved.
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
  echo 'done'
  return 0
fi
export SETUP_DONE=true

if [ -z "$BASH_VERSION" ]
then
  echo ""
  echo "  Please run me using bash: "
  echo ""
  echo "     bash scripts/$0"
  echo ""
  return 1
fi

# TODO: Consider using getopts command.
declare -a remaining_params
for arg in "$@"; do
  if [ "$arg" == "--nojsrepl" ]; then
    NO_JSREPL=true
  else
    remaining_params+=($arg)
  fi
done
export NO_JSREPL
export remaining_params

echo Checking name of current directory
EXPECTED_PWD='oppia'
if [ ${PWD##*/} != $EXPECTED_PWD ]; then
  echo This script should be run from the oppia/ root folder.
  return 1
fi

export OPPIA_DIR=`pwd`
export COMMON_DIR=$OPPIA_DIR/..
export TOOLS_DIR=$COMMON_DIR/oppia_tools
export THIRD_PARTY_DIR=$OPPIA_DIR/third_party
export NODE_MODULE_DIR=$COMMON_DIR/node_modules
export ME=$(whoami)

mkdir -p $TOOLS_DIR
mkdir -p $THIRD_PARTY_DIR

mkdir -p $NODE_MODULE_DIR
chown -R $ME $NODE_MODULE_DIR || sudo chown -R $ME $NODE_MODULE_DIR
chmod -R 744 $NODE_MODULE_DIR || sudo chmod -R 744 $NODE_MODULE_DIR

# Adjust the path to include a reference to node.
export PATH=$TOOLS_DIR/node-0.10.1/bin:$PATH
export MACHINE_TYPE=`uname -m`
export OS=`uname`

export NPM_INSTALL="$TOOLS_DIR/node-0.10.1/bin/npm install"
