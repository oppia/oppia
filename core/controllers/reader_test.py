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

from core.domain import exp_services
import test_utils


class ReaderControllerEndToEndTests(test_utils.GenericTestBase):
    """Test the reader controller using the sample explorations."""

    TAGS = [test_utils.TestTags.SLOW_TEST]

    def setUp(self):
        super(ReaderControllerEndToEndTests, self).setUp()
        exp_services.reload_demos()

    class ExplorationPlayer(object):
        """Simulates the frontend API for an exploration."""
        def __init__(self, testapp, assertEqual, exploration_id):
            self.testapp = testapp
            self.assertEqual = assertEqual
            self.exploration_id = exploration_id
            self.last_block_number = 0
            self.last_params = {}
            self.last_state_id = None
            self.state_history = []

        def get_initial_response(self):
            """Returns the result of an initial GET request to the server."""
            json_response = self.testapp.get(
                '/learn/%s/data' % self.exploration_id)
            self.assertEqual(json_response.status_int, 200)
            self.assertEqual(json_response.content_type, 'application/json')

            response = json.loads(json_response.body)

            self.last_block_number = response['block_number']
            self.last_params = response['params']
            self.last_state_id = response['state_id']
            self.state_history = [self.last_state_id]
            self.assertEqual(response['state_history'], self.state_history)

            return response

        def _interact(self, reader_payload):
            """Returns the result of subsequent feedback interactions."""
            url_path = '/learn/%s/%s' % (
                self.exploration_id, self.last_state_id)
            json_response = self.testapp.post(
                str(url_path), {'payload': json.dumps(reader_payload)}
            )
            self.assertEqual(json_response.status_int, 200)
            self.assertEqual(json_response.content_type, 'application/json')

            response = json.loads(json_response.body)

            self.last_block_number = response['block_number']
            self.last_params = response['params']
            self.last_state_id = response['state_id']
            self.state_history += [self.last_state_id]
            self.assertEqual(response['state_history'], self.state_history)

            return response

        def submit_answer(self, answer):
            """Action representing submission of an answer to the backend."""
            return self._interact({
                'answer': answer, 'block_number': self.last_block_number,
                'handler': 'submit', 'params': self.last_params,
                'state_history': self.state_history,
            })

    def test_welcome_exploration(self):
        """Test a reader's progression through the default exploration."""
        player = self.ExplorationPlayer(self.testapp, self.assertEqual, '0')

        response = player.get_initial_response()
        self.assertIn(
            'do you know where the name \'Oppia\'', response['oppia_html'])
        self.assertEqual(response['title'], 'Welcome to Oppia!')

        response = player.submit_answer('0')
        self.assertIn(
            'In fact, the word Oppia means \'learn\'.', response['oppia_html'])

    def test_parametrized_adventure(self):
        """Test a reader's progression through the parametrized adventure."""
        player = self.ExplorationPlayer(self.testapp, self.assertEqual, '6')

        response = player.get_initial_response()
        self.assertIn(
            'Hello, brave adventurer! What is your name?',
            response['oppia_html'])
        self.assertEqual(response['title'], 'Parametrized Adventure')

        response = player.submit_answer('My Name')
        self.assertIn('Hello, I\'m My Name!', response['oppia_html'])
        self.assertIn('get a pretty red', response['oppia_html'])

        response = player.submit_answer(0)
        self.assertIn('fork in the road', response['oppia_html'])

        response = player.submit_answer('ne')
        self.assertIn(
            'Hello, My Name. You have to pay a toll', response['oppia_html'])
