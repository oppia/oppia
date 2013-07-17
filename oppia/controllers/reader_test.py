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

__author__ = 'Sean Lip'

import json

from oppia.controllers import admin
import test_utils


class ReaderControllerUnitTests(test_utils.AppEngineTestBase):
    """Test the reader controller."""

    def test_exploration_end_to_end(self):
        """Test a reader's progression through the default exploration."""
        admin.reload_demos()

        response = self.testapp.get('/learn/0/data')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'application/json')

        exploration_json = json.loads(response.body)
        self.assertIn('do you know where the name \'Oppia\'',
                      exploration_json['oppia_html'])
        self.assertEqual(exploration_json['title'], 'Welcome to Oppia!')
        state_id = exploration_json['state_id']

        payload = {'answer': '0', 'block_number': 0, 'handler': 'submit'}
        response = self.testapp.post(
            str('/learn/0/%s' % state_id), {'payload': json.dumps(payload)})
        self.assertEqual(response.status_int, 200)

        exploration_json = json.loads(response.body)
        self.assertIn('In fact, the word Oppia means \'learn\'.',
                      exploration_json['oppia_html'])
