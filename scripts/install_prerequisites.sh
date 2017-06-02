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

if [ -e "/etc/is_vagrant_vm" ]
then
  source $(dirname $0)/vagrant_lockfile.sh || exit 1
fi

sudo apt-get update
sudo apt-get install curl
sudo apt-get install git
sudo apt-get install openjdk-7-jre
sudo apt-get install python-setuptools
sudo apt-get install python-dev
sudo apt-get install python-pip
sudo apt-get install unzip
sudo apt-get install python-yaml
sudo pip install --upgrade pip
