# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for Constants object and cosntants.json file."""

import os
import json

from core.tests import test_utils #pylint: disable=relative-import

class ConstantsTests(test_utils.GenericTestBase):

    def test_constants_file_is_existing(self):
        """Test if the constants file is existing."""
        self.assertTrue(os.path.isfile(os.path.join(
            'assets', 'constants.js')))

    def test_constants_file_contains_valid_json(self):
        """Test if the constants file is valid json file."""
        with open(os.path.join('assets', 'constants.js'), 'r') as f:
            text = f.read()
            first_bracket_index = text.find('{')
            self.assertTrue(first_bracket_index >= 0)
            last_bracket_index = text.rfind('}')
            self.assertTrue(last_bracket_index >= 0)
            json_text = text[first_bracket_index:last_bracket_index + 1]
            self.assertTrue(isinstance(json.loads(json_text), dict))
