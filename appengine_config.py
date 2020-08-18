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

"""Configuration for App Engine."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

import pkg_resources
from google.appengine.ext import vendor

# Root path of the app.
ROOT_PATH = os.path.dirname(__file__)
_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
OPPIA_TOOLS_PATH = os.path.join(_PARENT_DIR, 'oppia_tools')

# oppia_tools/ is available locally (in both dev and prod mode). However,
# on the GAE production server, oppia_tools/ is not available, and the default
# PIL third-party library is used instead.
#
# We cannot special-case this using DEV_MODE because it is possible to run
# Oppia in production mode locally, where a built-in PIL won't be available.
# Hence the check for oppia_tools instead.
if os.path.isdir(OPPIA_TOOLS_PATH):
    PIL_PATH = os.path.join(
        OPPIA_TOOLS_PATH, 'Pillow-6.2.2')
    if not os.path.isdir(PIL_PATH):
        raise Exception('Invalid path for oppia_tools library: %s' % PIL_PATH)
    sys.path.insert(0, PIL_PATH)

vendor.add(os.path.join(ROOT_PATH, 'third_party'))
pkg_resources.working_set.add_entry(os.path.join(ROOT_PATH, 'third_party'))

