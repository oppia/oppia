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

"""Tests for the page that allows learners to play through an exploration."""

import os

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import learner_progress_services
from core.domain import param_domain
from core.domain import rights_manager
from core.tests import test_utils
import feconf


class ReaderPermissionsTest(test_utils.GenericTestBase):
    """Test permissions for readers to view explorations."""

    EXP_ID = 'eid'

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(ReaderPermissionsTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title=self.UNICODE_TEST_STRING,
            category=self.UNICODE_TEST_STRING)

    def test_unpublished_explorations_are_invisible_to_logged_out_users(self):
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_unpublished_explorations_are_invisible_to_unconnected_users(self):
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_explorations_are_invisible_to_other_editors(self):
        other_editor_email = 'another@example.com'
        self.signup(other_editor_email, 'othereditorusername')

        other_exploration = exp_domain.Exploration.create_default_exploration(
            'eid2')
        exp_services.save_new_exploration(
            other_editor_email, other_exploration)

        self.login(other_editor_email)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_explorations_are_visible_to_their_editors(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_unpublished_explorations_are_visible_to_admins(self):
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_published_explorations_are_visible_to_logged_out_users(self):
        rights_manager.publish_exploration(self.editor_id, self.EXP_ID)

        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)

    def test_published_explorations_are_visible_to_logged_in_users(self):
        rights_manager.publish_exploration(self.editor_id, self.EXP_ID)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)


class ClassifyHandlerTest(test_utils.GenericTestBase):
    """Test the handler for classification."""

    def setUp(self):
        """Before the test, create an exploration_dict."""
        super(ClassifyHandlerTest, self).setUp()
        self.enable_string_classifier = self.swap(
            feconf, 'ENABLE_STRING_CLASSIFIER', True)

        # Reading YAML exploration into a dictionary.
        yaml_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                 '../tests/data/string_classifier_test.yaml')
        with open(yaml_path, 'r') as yaml_file:
            self.yaml_content = yaml_file.read()

        self.login(self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration.
        self.exp_id = '0'
        self.title = 'Testing String Classifier'
        self.category = 'Test'
        exp_services.delete_demo(self.exp_id)
        exp_services.load_demo(self.exp_id)

        # Creating the exploration domain object.
        self.exploration = exp_domain.Exploration.from_untitled_yaml(
            self.exp_id,
            self.title,
            self.category,
            self.yaml_content)

    def test_classification_handler(self):
        """Test the classification handler for a right answer."""

        with self.enable_string_classifier:
            # Testing the handler for a correct answer.
            old_state_dict = self.exploration.states['Home'].to_dict()
            answer = 'Permutations'
            params = {}
            res = self.post_json('/explorehandler/classify/%s' % self.exp_id,
                                 {'params' : params,
                                  'old_state' : old_state_dict,
                                  'answer' : answer})
            self.assertEqual(res['outcome']['feedback'][0],
                             '<p>Detected permutation.</p>')


class FeedbackIntegrationTest(test_utils.GenericTestBase):
    """Test the handler for giving feedback."""

    def test_give_feedback_handler(self):
        """Test giving feedback handler."""
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Viewer opens exploration
        self.login(self.VIEWER_EMAIL)
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        state_name_1 = exploration_dict['exploration']['init_state_name']

        # Viewer gives 1st feedback
        self.post_json(
            '/explorehandler/give_feedback/%s' % exp_id,
            {
                'state_name': state_name_1,
                'feedback': 'This is a feedback message.',
            }
        )

        self.logout()


class ExplorationParametersUnitTests(test_utils.GenericTestBase):
    """Test methods relating to exploration parameters."""

    def test_get_init_params(self):
        """Test the get_init_params() method."""
        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exp_param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }
        new_params = self.get_updated_param_dict(
            {}, [independent_pc, dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        new_params = self.get_updated_param_dict(
            {}, [dependent_pc, independent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': ''})

    def test_update_learner_params(self):
        """Test the update_learner_params() method."""
        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exp_param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }

        old_params = {}
        new_params = self.get_updated_param_dict(
            old_params, [independent_pc, dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})
        self.assertEqual(old_params, {})

        old_params = {'a': 'secondValue'}
        new_params = self.get_updated_param_dict(
            old_params, [dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'secondValue', 'b': 'secondValue'})
        self.assertEqual(old_params, {'a': 'secondValue'})

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        old_params = {}
        new_params = self.get_updated_param_dict(
            old_params, [dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'b': ''})
        self.assertEqual(old_params, {})


class RatingsIntegrationTests(test_utils.GenericTestBase):
    """Integration tests of ratings recording and display."""

    EXP_ID = '0'

    def setUp(self):
        super(RatingsIntegrationTests, self).setUp()
        exp_services.load_demo(self.EXP_ID)

    def test_assign_and_read_ratings(self):
        """Test the PUT and GET methods for ratings."""

        self.signup('user@example.com', 'user')
        self.login('user@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))

        # User checks rating
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})

        # User rates and checks rating
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 2
            }, csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 2)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 1, '3': 0, '4': 0, '5': 0})

        # User re-rates and checks rating
        self.login('user@example.com')
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 5
            }, csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 5)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 1})

        self.logout()

    def test_non_logged_in_users_cannot_rate(self):
        """Check non logged-in users can view but not submit ratings."""

        self.signup('user@example.com', 'user')
        self.login('user@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))
        self.logout()

        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 1
            }, csrf_token, expected_status_int=401, expect_errors=True
        )

    def test_ratings_by_different_users(self):
        """Check that ratings by different users do not interfere."""

        self.signup('a@example.com', 'a')
        self.signup('b@example.com', 'b')

        self.login('a@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 4
            }, csrf_token
        )
        self.logout()

        self.login('b@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 4
            }, csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 4)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 2, '5': 0})
        self.logout()


class FlagExplorationHandlerTests(test_utils.GenericTestBase):
    """Backend integration tests for flagging an exploration."""

    EXP_ID = '0'
    REPORT_TEXT = 'AD'

    def setUp(self):
        super(FlagExplorationHandlerTests, self).setUp()

        # Register users.
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)

        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])

        # Load exploration 0.
        exp_services.load_demo(self.EXP_ID)

        # Login and create exploration.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id,
            title='Welcome to Oppia!',
            category='This is just a spam category',
            objective='Test a spam exploration.')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        rights_manager.publish_exploration(self.editor_id, self.EXP_ID)
        self.logout()

    def test_that_emails_are_sent(self):
        """Check that emails are sent to moderaters when a logged-in
        user reports.
        """

        # Login and flag exploration.
        self.login(self.NEW_USER_EMAIL)

        response = self.testapp.get('/explore/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)

        self.post_json(
            '%s/%s' % (feconf.FLAG_EXPLORATION_URL_PREFIX, self.EXP_ID), {
                'report_text': self.REPORT_TEXT,
            }, csrf_token)

        self.logout()

        expected_email_html_body = (
            'Hello Moderator,<br>'
            'newuser has flagged exploration '
            '"Welcome to Oppia!"'
            ' on the following grounds: <br>'
            'AD .<br>'
            'You can modify the exploration by clicking '
            '<a href="https://www.oppia.org/create/0">'
            'here</a>.<br>'
            '<br>'
            'Thanks!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hello Moderator,\n'
            'newuser has flagged exploration '
            '"Welcome to Oppia!"'
            ' on the following grounds: \n'
            'AD .\n'
            'You can modify the exploration by clicking here.\n'
            '\n'
            'Thanks!\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx:
            self.process_and_flush_pending_tasks()

            messages = self.mail_stub.get_sent_messages(to=self.MODERATOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

    def test_non_logged_in_users_cannot_report(self):
        """Check that non-logged in users cannot report."""

        self.login(self.NEW_USER_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))
        self.logout()

        # Create report for exploration.
        self.post_json(
            '%s/%s' % (feconf.FLAG_EXPLORATION_URL_PREFIX, self.EXP_ID), {
                'report_text': self.REPORT_TEXT,
            }, csrf_token, expected_status_int=401, expect_errors=True)


class LearnerProgressTest(test_utils.GenericTestBase):
    """Tests for tracking learner progress."""

    EXP_ID_0 = 'exp_0'
    EXP_ID_1 = 'exp_1'
    # The first number corresponds to the collection to which the exploration
    # belongs. The second number corresponds to the exploration id.
    EXP_ID_1_0 = 'exp_2'
    EXP_ID_1_1 = 'exp_3'
    COL_ID_0 = 'col_0'
    COL_ID_1 = 'col_1'
    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    def setUp(self):
        super(LearnerProgressTest, self).setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Save and publish explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Welcome to Gadgets',
            category='Architecture', language_code='fi')

        self.save_new_valid_exploration(
            self.EXP_ID_1_0, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')

        self.save_new_valid_exploration(
            self.EXP_ID_1_1, self.owner_id,
            title='Introduce Interactions in Oppia',
            category='Welcome', language_code='en')

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_0)
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_1)
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_1_0)
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_1_1)

        # Save a new collection.
        self.save_new_default_collection(
            self.COL_ID_0, self.owner_id, title='Welcome',
            category='Architecture')

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture')

        # Add two explorations to the previously saved collection and publish
        # it.
        for exp_id in [self.EXP_ID_1_0, self.EXP_ID_1_1]:
            collection_services.update_collection(
                self.owner_id, self.COL_ID_1, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': exp_id
                }], 'Added new exploration')

        # Publish the collections.
        rights_manager.publish_collection(self.owner_id, self.COL_ID_0)
        rights_manager.publish_collection(self.owner_id, self.COL_ID_1)

    def test_independent_exp_complete_event_handler(self):
        """Test handler for completion of explorations not in the context of
        collections.
        """

        self.login(self.USER_EMAIL)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        payload = {
            'client_time_spent_in_secs': 0,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'final',
            'version': 1
        }

        # When an exploration is completed but is not in the context of a
        # collection, it is just added to the completed explorations list.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_0,
            payload, csrf_token)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0])
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])

        # Test another exploration.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_1_0,
            payload, csrf_token)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1_0])
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])

    def test_exp_complete_event_in_collection(self):
        """Test handler for completion of explorations in the context of
        collections.
        """

        self.login(self.USER_EMAIL)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        payload = {
            'client_time_spent_in_secs': 0,
            'collection_id': self.COL_ID_1,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'final',
            'version': 1
        }

        # If the exploration is completed in the context of a collection,
        # then in addition to the exploration being added to the completed
        # list, the collection is also added to the incomplete/complete list
        # dependent on whether there are more explorations left to complete.

        # Here we test the case when the collection is partially completed.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_1_0,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_1])
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_1_0])

        # Now we test the case when the collection is completed.
        self.post_json(
            '/explorehandler/exploration_complete_event/%s' % self.EXP_ID_1_1,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_1])
        self.assertEqual(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id), [self.EXP_ID_1_0, self.EXP_ID_1_1])

    def test_exp_incomplete_event_handler(self):
        """Test handler for leaving an exploration incomplete."""

        self.login(self.USER_EMAIL)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        payload = {
            'client_time_spent_in_secs': 0,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'middle',
            'version': 1
        }

        # Add the incomplete exploration id to the incomplete list.
        self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_0,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0])

        # Adding the exploration again has no effect.
        self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_0,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0])

        payload = {
            'client_time_spent_in_secs': 0,
            'collection_id': self.COL_ID_1,
            'params': {},
            'session_id': '1PZTCw9JY8y-8lqBeuoJS2ILZMxa5m8N',
            'state_name': 'middle',
            'version': 1
        }

        # If the exploration is played in the context of a collection, the
        # collection is also added to the incomplete list.
        self.post_json(
            '/explorehandler/exploration_maybe_leave_event/%s' % self.EXP_ID_1_0, # pylint: disable=line-too-long
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1_0])
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_1])

    def test_remove_exp_from_incomplete_list_handler(self):
        """Test handler for removing explorations from the partially completed
        list.
        """

        self.login(self.USER_EMAIL)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        state_name = 'state_name'
        version = 1

        # Add two explorations to the partially completed list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        payload = {
            'exploration_id': self.EXP_ID_0
        }

        # Remove one exploration.
        self.post_json(
            '%s/remove_in_progress_exploration' % feconf.LEARNER_DASHBOARD_URL,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_1])

        payload = {
            'exploration_id': self.EXP_ID_1
        }

        # Remove another exploration.
        self.post_json(
            '%s/remove_in_progress_exploration' % feconf.LEARNER_DASHBOARD_URL,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [])

    def test_remove_collection_from_incomplete_list_handler(self):
        """Test handler for removing collections from incomplete list."""

        self.login(self.USER_EMAIL)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        # Add two collections to incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

        payload = {
            'collection_id': self.COL_ID_0
        }

        # Remove one collection.
        self.post_json(
            '%s/remove_in_progress_collection' % feconf.LEARNER_DASHBOARD_URL,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_1])

        payload = {
            'collection_id': self.COL_ID_1
        }

        # Remove another collection.
        self.post_json(
            '%s/remove_in_progress_collection' % feconf.LEARNER_DASHBOARD_URL,
            payload, csrf_token)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])
