#!/bin/sh

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
#   bash scripts/django_testrunner.sh
# The root folder MUST be named 'oppia'.
# It installs dependencies in a virtualenv and runs django tests.

virtualenv venv
source venv/bin/activate
pip install -r requirements.txt

python manage.py test oppia.storage.base_model.test_django \
oppia.storage.image.test_django oppia.storage.parameter.test_django oppia.storage.state.test_django \
oppia.storage.exploration.test_django ;
