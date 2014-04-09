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

__author__ = 'Sean Lip'

import unittest

from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
import feconf
import test_utils


class ReaderPermissionsTest(test_utils.GenericTestBase):
    """Test permissions for readers to view explorations."""

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(ReaderPermissionsTest, self).setUp()

        self.first_editor_email = 'editor@example.com'
        self.first_editor_id = self.get_user_id_from_email(
            self.first_editor_email)

        self.register_editor(self.first_editor_email)

        self.EXP_ID = 'eid'

        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exploration.states[exploration.init_state_name].widget.handlers[
            0].rule_specs[0].dest = feconf.END_DEST
        exp_services.save_new_exploration(self.first_editor_id, exploration)

    def test_unpublished_explorations_are_invisible_to_logged_out_users(self):
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_unpublished_explorations_are_invisible_to_unconnected_users(self):
        self.login('person@example.com')
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_explorations_are_invisible_to_other_editors(self):
        other_editor = 'another@example.com'

        other_exploration = exp_domain.Exploration.create_default_exploration(
            'eid2', 'A title', 'A category')
        exp_services.save_new_exploration(other_editor, other_exploration)

        self.login(other_editor)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_explorations_are_visible_to_their_editors(self):
        self.login(self.first_editor_email)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.assertEqual(response.status_int, 200)
        self.assertIn('This is a preview', response.body)
        self.logout()

    def test_unpublished_explorations_are_visible_to_admins(self):
        config_services.set_property(
            feconf.ADMIN_COMMITTER_ID, 'admin_emails', ['admin@example.com'])

        self.login('admin@example.com')
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.assertEqual(response.status_int, 200)
        self.assertIn('This is a preview', response.body)
        self.logout()

    def test_published_explorations_are_visible_to_anyone(self):
        rights_manager.publish_exploration(self.first_editor_id, self.EXP_ID)

        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)
        self.assertNotIn('This is a preview', response.body)


class ReaderControllerEndToEndTests(test_utils.GenericTestBase):
    """Test the reader controller using the sample explorations."""

    TAGS = [test_utils.TestTags.SLOW_TEST]

    def setUp(self):
        super(ReaderControllerEndToEndTests, self).setUp()

    def _submit_answer(self, answer):
        """Action representing submission of an answer to the backend."""
        url = '%s/%s/%s' % (
            feconf.EXPLORATION_TRANSITION_URL_PREFIX,
            self.EXP_ID, self.last_state_name)
        reader_dict = self.post_json(url, {
            'answer': answer, 'handler': 'submit', 'params': self.last_params,
            'state_history': self.state_history,
        })

        self.last_params = reader_dict['params']
        self.last_state_name = reader_dict['state_name']
        self.state_history += [self.last_state_name]
        self.assertEqual(reader_dict['state_history'], self.state_history)

        return reader_dict

    def submit_and_compare(self, answer, expected_feedback, expected_question):
        """Submits an answer and compares the output to a regex.

        `expected_response` will be interpreted as a regex string.
        """
        reader_dict = self._submit_answer(answer)
        self.assertRegexpMatches(
            reader_dict['feedback_html'], expected_feedback)
        self.assertRegexpMatches(
            reader_dict['question_html'], expected_question)
        return self

    def init_player(self, exploration_id, expected_title, expected_response):
        """Starts a reader session and gets the first state from the server.

        `expected_response` will be interpreted as a regex string.
        """
        exp_services.delete_demo(exploration_id)
        exp_services.load_demo(exploration_id)

        self.EXP_ID = exploration_id

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))

        self.last_params = reader_dict['params']
        self.last_state_name = reader_dict['state_name']
        self.state_history = [self.last_state_name]

        self.assertEqual(reader_dict['state_history'], self.state_history)
        self.assertRegexpMatches(reader_dict['init_html'], expected_response)
        self.assertEqual(reader_dict['title'], expected_title)

    def test_welcome_exploration(self):
        """Test a reader's progression through the default exploration."""
        self.init_player(
            '0', 'Welcome to Oppia!', 'do you know where the name \'Oppia\'')
        self.submit_and_compare(
            '0', 'Yes!', 'In fact, the word Oppia means \'learn\'.')
        self.submit_and_compare('Finish', 'Check your spelling!', '')
        self.submit_and_compare(
            'Finnish', 'Yes! Oppia is the Finnish word for learn.',
            'What is the value of')

    def test_binary_search(self):
        """Test the binary search (lazy magician) exploration."""
        self.init_player(
            '2', 'The Lazy Magician', 'How does he do it?')
        self.submit_and_compare('Dont know', 'we should watch him first',
            'town square')
        self.submit_and_compare(0, '', 'Is it')
        self.submit_and_compare(2, '', 'Do you want to play again?')
        self.submit_and_compare(1, '', 'how do you think he does it?')
        self.submit_and_compare('middle',
            'he\'s always picking a number in the middle',
            'what number the magician picked')
        self.submit_and_compare(0, 'Exactly!', 'try it out')
        self.submit_and_compare(10, '', 'best worst case')
        self.submit_and_compare(
            0, '', 'to be sure our strategy works in all cases')
        self.submit_and_compare(0, 'try to guess', '')
 
    def test_parametrized_adventure(self):
        """Test a reader's progression through the parametrized adventure."""
        self.init_player(
            '8', 'Parameterized Adventure', 'Hello, brave adventurer')
        self.submit_and_compare(
            'My Name', '', 'Hello, I\'m My Name!.*get a pretty red')
        self.submit_and_compare(0, '', 'fork in the road')
        self.submit_and_compare(
            'ne', '', 'Hello, My Name. You have to pay a toll')

    def test_huge_answers(self):
        """Test correct behavior if huge answers are submitted."""
        self.init_player(
            '0', 'Welcome to Oppia!', 'do you know where the name \'Oppia\'')
        self.submit_and_compare(
            '0', '', 'In fact, the word Oppia means \'learn\'.')
        # This could potentially cause errors in stats_models when the answer
        # is persisted to the backend.
        self.submit_and_compare(
            'a' * 1000500, 'Sorry, nope, we didn\'t get it', '')
