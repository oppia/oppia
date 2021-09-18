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
# Prerequirements for python.
sudo apt-get install -y curl git openjdk-8-jre python3-setuptools python3-dev \
    python3-pip unzip python3-yaml python-matplotlib python3-matplotlib
pip3 install --upgrade pip==21.2.3
# Prerequirements for pyenv.
sudo apt-get install -y make build-essential libssl-dev libbz2-dev \
    libreadline-dev libsqlite3-dev wget llvm libncursesw5-dev xz-utils tk-dev \
    libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
