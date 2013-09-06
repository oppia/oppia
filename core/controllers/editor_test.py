# Copyright 2012 Google Inc. All Rights Reserved.
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
import unittest

from core.domain import exp_services
import feconf
import test_utils


class EditorTest(test_utils.GenericTestBase):

    def testEditorPage(self):
        """Test access to editor pages for the sample exploration."""
        response = self.testapp.get('/create/0/')
        self.assertEqual(response.status_int, 301)


@unittest.skipIf(feconf.PLATFORM != 'gae',
                 'login not implemented for non-GAE platform')
class StatsIntegrationTest(test_utils.GenericTestBase):
    """Test statistics recording using the default exploration."""

    TAGS = [test_utils.TestTags.SLOW_TEST]

    def test_state_stats_for_default_exploration(self):
        exp_services.reload_demos()

        # Check, from the editor perspective, that no stats have been recorded.
        self.login('editor@example.com', is_admin=True)

        response = self.testapp.get('/create/0/data')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'application/json')
        editor_exploration_json = json.loads(response.body)

        self.assertEqual(editor_exploration_json['num_visits'], 0)
        self.assertEqual(editor_exploration_json['num_completions'], 0)

        # Switch to the reader perspective. First submit the first
        # multiple-choice answer, then submit 'blah'.
        response = self.testapp.get('/learn/0/data')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'application/json')

        exploration_json = json.loads(response.body)
        self.assertEqual(exploration_json['title'], 'Welcome to Oppia!')

        state_id = exploration_json['state_id']
        response = self.testapp.post(str('/learn/0/%s' % state_id), {
            'payload': json.dumps({
                'answer': '0', 'block_number': 0, 'handler': 'submit',
                'state_history': exploration_json['state_history'],
            })
        })
        self.assertEqual(response.status_int, 200)

        exploration_json = json.loads(response.body)
        state_id = exploration_json['state_id']
        response = self.testapp.post(str('/learn/0/%s' % state_id), {
            'payload': json.dumps({
                'answer': 'blah', 'block_number': 0, 'handler': 'submit',
                'state_history': exploration_json['state_history'],
            })
        })

        # Now switch back to the editor perspective.
        self.login('editor@example.com', is_admin=True)

        response = self.testapp.get('/create/0/data')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'application/json')
        editor_exploration_json = json.loads(response.body)

        self.assertEqual(editor_exploration_json['num_visits'], 1)
        self.assertEqual(editor_exploration_json['num_completions'], 0)

        # TODO(sll): Add more checks here.
