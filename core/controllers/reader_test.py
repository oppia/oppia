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

from core.controllers import reader
from core.domain import classifier_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import param_domain
from core.tests import test_utils
import feconf
import utils


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


class ReaderClassifyTests(test_utils.GenericTestBase):
    """Test reader.classify using the sample explorations.

    Since the end to end tests cover correct classification, and frontend tests
    test hard rules, ReaderClassifyTests is only checking that the string
    classifier is actually called.
    """

    def setUp(self):
        super(ReaderClassifyTests, self).setUp()
        self._init_classify_inputs('16')

    def _init_classify_inputs(self, exploration_id):
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
            assets_list)

        self.exp_id = exploration_id
        self.exp_state = (
            exp_services.get_exploration_by_id(exploration_id).states['Home'])

    def _is_string_classifier_called(self, answer):
        string_classifier_predict = (
            classifier_services.StringClassifier.predict_label_for_doc)
        predict_counter = test_utils.CallCounter(
            string_classifier_predict)

        with self.swap(
            classifier_services.StringClassifier,
            'predict_label_for_doc', predict_counter):

            response = reader.classify(self.exp_state, answer)

        answer_group_index = response['answer_group_index']
        rule_spec_index = response['rule_spec_index']
        answer_groups = self.exp_state.interaction.answer_groups
        if answer_group_index == len(answer_groups):
            return 'default'

        answer_group = answer_groups[answer_group_index]
        return (answer_group.get_classifier_rule_index() == rule_spec_index and
                predict_counter.times_called == 1)

    def test_string_classifier_classification(self):
        """All these responses trigger the string classifier."""
        with self.swap(feconf, 'ENABLE_STRING_CLASSIFIER', True):
            self.assertTrue(
                self._is_string_classifier_called(
                    'it\'s a permutation of 3 elements'))
            self.assertTrue(
                self._is_string_classifier_called(
                    'There are 3 options for the first ball, and 2 for the '
                    'remaining two. So 3*2=6.'))
            self.assertTrue(
                self._is_string_classifier_called('abc acb bac bca cbb cba'))
            self.assertTrue(
                self._is_string_classifier_called('dunno, just guessed'))


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
