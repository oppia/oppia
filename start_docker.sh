#!/bin/bash

# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

# Start docker
# Command: bash start_docker.sh /path/to/oppia/folder

args=($@)
oppia_loc=${args[0]}

# Creates the image
docker build -t oppia -f ubuntu_dockerfile .

# Using the image a contianer is created.
docker run -p 8181:8181 -p 9099:9099 -p 4400:4400 -v ${oppia_loc}:/home/opensource/oppia -it oppia /bin/bash
