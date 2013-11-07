#!/usr/bin/env bash

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

# INSTRUCTIONS:                                                          
#                                                                        
# Run this script from the oppia root folder:
#   bash scripts/start_django.sh
# It installs the dependencies in a virtualenv, runs tests and then starts 
# django development server.

set -e
source $(dirname $0)/setup.sh || exit 1


bash scripts/install_third_party.sh
bash scripts/django_testrunner.sh
source ../venv/bin/activate
python manage.py syncdb --noinput
python main.py
