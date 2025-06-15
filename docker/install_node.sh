#!/bin/bash
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

#!/bin/bash
# Check if node is installed. If it is, skip installation.
if [ -d "../oppia_tools/node-16.13.0" ]; then
    echo "Node.js is already installed. Skipping the installation."
    exit 0
fi

# Install node.js if it is not installed.
OS_NAME=$(uname)
echo "Installing Node.js..."

if [ "$(getconf LONG_BIT)" = "64" ] || [ "$(uname -m)" = "x86_64" ]; then
    if [ "$OS_NAME" = "Darwin" ]; then
        node_file_name="node-v16.13.0-darwin-x64"
    elif [ "$OS_NAME" = "Linux" ]; then
        node_file_name="node-v16.13.0-linux-x64"
    else
        echo "System's Operating System is not compatible."
        exit 1
    fi
else
    node_file_name="node-v16.13.0"
fi
curl -o node-download "https://nodejs.org/dist/v16.13.0/$node_file_name.tar.gz"
mkdir -p ../oppia_tools
tar -xvf node-download -C ../oppia_tools
rm node-download

# Build node.js if it is installed using source code (more info https://github.com/nodejs/node/blob/v16.x/BUILDING.md#building-nodejs-1).
# The process of building from source code is intended for non-x64 Linux/Darwin systems.
if [ "$node_file_name" = "node-v16.13.0" ]; then
    cd ../oppia_tools/node-16.13.0
    ./configure
    make
fi

# Rename node directory to node-16.13.0.
cd ../oppia_tools &&
if [ "$node_file_name" != "node-v16.13.0" ]; then
    mv $node_file_name node-16.13.0
fi

echo "Node.js installation completed."
