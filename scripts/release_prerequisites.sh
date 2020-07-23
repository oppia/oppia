#!/usr/bin/env bash

# Copyright 2020 The Oppia Authors. All Rights Reserved.
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
# This script downloads the release_scripts required to deploy Oppia release.
# Run the script from the oppia root folder:
#
#   bash scripts/release_prerequisites.sh
#
# Note that the root folder MUST be named 'oppia'.

git clone git@github.com:oppia/release-scripts.git ../release-scripts
rm -rf scripts/release_scripts
cp -R ../release-scripts/scripts/release_scripts scripts/
rm -rf ../release-scripts
