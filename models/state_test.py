# coding: utf-8
#
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

__author__ = 'Jeremy Emerson'

from state import Content, State
import test_utils


class StateModelUnitTests(test_utils.AppEngineTestBase):
    """Test the state model."""

    def testStateClass(self):
        """Test State Class."""
        # TODO(sll): Need to test that this model's parent must be an
        # exploration.
        o = State(id='The hash id')
        o.name = 'The name'
        o.content = [Content(type='text', value='The content')]
        self.assertEqual(o.key.id(), 'The hash id')
        self.assertEqual(o.name, 'The name')
        self.assertEqual(len(o.content), 1)
        self.assertEqual(o.content[0].type, 'text')
        self.assertEqual(o.content[0].value, 'The content')
