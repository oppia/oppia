# coding: utf-8
#
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

"""Domain objects used within multiple extensions."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

_FUTURE_PATH = os.path.join('third_party', 'future-0.17.1')
sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
import builtins  # isort:skip
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class CustomizationArgSpec(python_utils.OBJECT):
    """Value object for a customization arg specification."""

    def __init__(self, name, description, schema, default_value):
        self.name = name
        self.description = description
        self.schema = schema
        self.default_value = default_value
