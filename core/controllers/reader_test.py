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

    def setUp(self):
        super(ReaderControllerEndToEndTests, self).setUp()

    class ExplorationPlayer(object):
        """Simulates the frontend API for an exploration."""
        def __init__(self, testapp, assertEqual, assertRegexpMatches,
                     exploration_id):
            self.testapp = testapp
            self.assertEqual = assertEqual
            self.assertRegexpMatches = assertRegexpMatches
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

        def _submit_answer(self, answer):
            """Action representing submission of an answer to the backend."""
            return self._interact({
                'answer': answer, 'block_number': self.last_block_number,
                'handler': 'submit', 'params': self.last_params,
                'state_history': self.state_history,
            })

        def submit_and_compare(self, answer, expected_response):
            """Submits an answer and compares the output to a regex.

            The expected_output will be interpreted as a regex string.
            """
            response = self._submit_answer(answer)
            self.assertRegexpMatches(response['oppia_html'], expected_response)
            return self

    def init_player(self, exploration_id, expected_title, expected_response):
        """Initializes a reader playthrough.

        The expected_response will be interpreted as a regex string.
        """
        exp_services.delete_demo(exploration_id)
        exp_services.load_demo(exploration_id)

        player = self.ExplorationPlayer(
            self.testapp, self.assertEqual, self.assertRegexpMatches,
            exploration_id)

        response = player.get_initial_response()
        self.assertRegexpMatches(response['oppia_html'], expected_response)
        self.assertEqual(response['title'], expected_title)
        return player

    def test_welcome_exploration(self):
        """Test a reader's progression through the default exploration."""
        self.init_player(
            '0', 'Welcome to Oppia!', 'do you know where the name \'Oppia\''
        ).submit_and_compare(
            '0', 'In fact, the word Oppia means \'learn\'.'
        )

    def test_parametrized_adventure(self):
        """Test a reader's progression through the parametrized adventure."""
        self.init_player(
            '6', 'Parametrized Adventure',
            'Hello, brave adventurer! What is your name?'
        ).submit_and_compare(
            'My Name', 'Hello, I\'m My Name!.*get a pretty red'
        ).submit_and_compare(
            0, 'fork in the road'
        ).submit_and_compare(
            'ne', 'Hello, My Name. You have to pay a toll'
        )
