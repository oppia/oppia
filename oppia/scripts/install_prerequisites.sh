#!/usr/bin/env bash

# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

# INSTRUCTIONS:
#
# This script sets up a development dependencies for running Oppia.
# Run the script from the oppia root folder:
#
#   bash scripts/install_prerequisites.sh
#
# Note that the root folder MUST be named 'oppia'.

sudo apt-get update
sudo apt-get install curl
sudo apt-get install git
sudo apt-get install unzip
sudo apt-get install openjdk-11-jre

# Prerequirements for pyenv.
sudo apt-get install make
sudo apt-get install build-essential
sudo apt-get install libssl-dev
sudo apt-get install zlib1g-dev
sudo apt-get install libbz2-dev
sudo apt-get install libreadline-dev
sudo apt-get install libsqlite3-dev
sudo apt-get install wget
sudo apt-get install llvm
sudo apt-get install libncursesw5-dev
sudo apt-get install xz-utils
sudo apt-get install tk-dev
sudo apt-get install libxml2-dev
sudo apt-get install libxmlsec1-dev
sudo apt-get install libffi-dev
sudo apt-get install liblzma-dev
