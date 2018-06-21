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

from constants import constants
from core.domain import classifier_services
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import learner_progress_services
from core.domain import param_domain
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

(classifier_models, stats_models) = models.Registry.import_models(
    [models.NAMES.classifier, models.NAMES.statistics])


class ReaderPermissionsTest(test_utils.GenericTestBase):
    """Test permissions for readers to view explorations."""

    EXP_ID = 'eid'

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(ReaderPermissionsTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

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
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)

    def test_published_explorations_are_visible_to_logged_in_users(self):
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)


class FeedbackIntegrationTest(test_utils.GenericTestBase):
    """Test the handler for giving feedback."""

    def test_give_feedback_handler(self):
        """Test giving feedback handler."""
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration.
        exp_id = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Viewer opens exploration.
        self.login(self.VIEWER_EMAIL)
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exp_id))
        state_name_1 = exploration_dict['exploration']['init_state_name']

        # Viewer gives 1st feedback.
        self.post_json(
            '/explorehandler/give_feedback/%s' % exp_id,
            {
                'state_name': state_name_1,
                'feedback': 'This is a feedback message.',
            }
        )

        self.logout()


class ExplorationStateClassifierMappingTests(test_utils.GenericTestBase):
    """Test the handler for initialising exploration with
    state_classifier_mapping.
    """

    def test_creation_of_state_classifier_mapping(self):
        super(ExplorationStateClassifierMappingTests, self).setUp()
        exploration_id = '15'

        self.login(self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        exp_services.delete_demo(exploration_id)
        # We enable ENABLE_ML_CLASSIFIERS so that the subsequent call to
        # save_exploration handles job creation for trainable states.
        # Since only one demo exploration has a trainable state, we modify our
        # values for MIN_ASSIGNED_LABELS and MIN_TOTAL_TRAINING_EXAMPLES to let
        # the classifier_demo_exploration.yaml be trainable. This is
        # completely for testing purposes.
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            with self.swap(feconf, 'MIN_TOTAL_TRAINING_EXAMPLES', 5):
                with self.swap(feconf, 'MIN_ASSIGNED_LABELS', 1):
                    exp_services.load_demo(exploration_id)

        # Retrieve job_id of created job (because of save_exp).
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 1)
        for job in all_jobs:
            job_id = job.id

        classifier_services.store_classifier_data(job_id, {})

        expected_state_classifier_mapping = {
            'text': {
                'algorithm_id': 'TextClassifier',
                'classifier_data': {},
                'data_schema_version': 1
            }
        }
        # Call the handler.
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, exploration_id))
        retrieved_state_classifier_mapping = exploration_dict[
            'state_classifier_mapping']

        self.assertEqual(
            expected_state_classifier_mapping,
            retrieved_state_classifier_mapping)


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

        # User checks rating.
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})

        # User rates and checks rating.
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

        # User re-rates and checks rating.
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


class RecommendationsHandlerTests(test_utils.GenericTestBase):
    """Backend integration tests for recommended explorations for after an
    exploration is completed.
    """
    # Demo explorations.
    EXP_ID_0 = '0'
    EXP_ID_1 = '1'
    EXP_ID_7 = '7'
    EXP_ID_8 = '8'

    # Explorations contained within the demo collection.
    EXP_ID_19 = '19'
    EXP_ID_20 = '20'
    EXP_ID_21 = '21'

    # Demo collection.
    COL_ID = '0'

    def setUp(self):
        super(RecommendationsHandlerTests, self).setUp()

        # Register users.
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        # Login and create activities.
        self.login(self.EDITOR_EMAIL)
        exp_services.load_demo(self.EXP_ID_0)
        exp_services.load_demo(self.EXP_ID_1)
        exp_services.load_demo(self.EXP_ID_7)
        exp_services.load_demo(self.EXP_ID_8)
        collection_services.load_demo(self.COL_ID)
        self.logout()

    def _get_exploration_ids_from_summaries(self, summaries):
        return sorted([summary['id'] for summary in summaries])

    def _get_recommendation_ids(
            self, exploration_id, collection_id=None,
            include_system_recommendations=None,
            author_recommended_ids_str='[]'):
        collection_id_param = (
            '&collection_id=%s' % collection_id
            if collection_id is not None else '')
        include_recommendations_param = (
            '&include_system_recommendations=%s' % (
                include_system_recommendations)
            if include_system_recommendations is not None else '')
        recommendations_url = (
            '/explorehandler/recommendations/%s?'
            'stringified_author_recommended_ids=%s%s%s' % (
                exploration_id, author_recommended_ids_str, collection_id_param,
                include_recommendations_param))

        response = self.testapp.get('/explore/%s' % exploration_id)
        csrf_token = self.get_csrf_token_from_response(response)
        summaries = self.get_json(recommendations_url, csrf_token)['summaries']
        return self._get_exploration_ids_from_summaries(summaries)

    # TODO(bhenning): Add tests for ensuring system explorations are properly
    # sampled when there are many matched for a given exploration ID.

    # TODO(bhenning): Verify whether recommended author-specified explorations
    # are also played within the context of collections, and whether that's
    # desirable.

    def _set_recommendations(self, exp_id, recommended_ids):
        recommendations_services.set_recommendations(exp_id, recommended_ids)

    def _complete_exploration_in_collection(self, exp_id):
        collection_services.record_played_exploration_in_collection_context(
            self.new_user_id, self.COL_ID, exp_id)

    def _complete_entire_collection_in_order(self):
        self._complete_exploration_in_collection(self.EXP_ID_19)
        self._complete_exploration_in_collection(self.EXP_ID_20)
        self._complete_exploration_in_collection(self.EXP_ID_21)
        self._complete_exploration_in_collection(self.EXP_ID_0)

    # Logged in standard viewer tests.
    def test_logged_in_with_no_sysexps_no_authexps_no_col_has_no_exps(self):
        """Check there are no recommended explorations when a user is logged in,
        finishes an exploration in-viewer, but there are no recommended
        explorations and no author exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_with_some_sysexps_no_authexps_no_col_has_some_exps(self):
        """Check there are recommended explorations when a user is logged in,
        finishes an exploration in-viewer, and there are system recommendations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [self.EXP_ID_1, self.EXP_ID_8])

    def test_logged_in_with_no_sysexps_some_authexps_no_col_has_some_exps(self):
        """Check there are some recommended explorations when a user is logged
        in, finishes an exploration in-viewer, and there are author-specified
        exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","8"]')
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_8])

    def test_logged_in_with_sysexps_and_authexps_no_col_has_some_exps(self):
        """Check there are recommended explorations when a user is logged in,
        finishes an exploration in-viewer, and there are both author-specified
        exploration IDs and recommendations from the system.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","8"]')
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_1, self.EXP_ID_7, self.EXP_ID_8])

    # Logged in in-editor tests.
    def test_logged_in_preview_no_authexps_no_col_has_no_exps(self):
        """Check there are no recommended explorations when a user is logged in,
        finishes an exploration in-editor (no system recommendations since it's
        a preview of the exploration), and there are no author exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(self.EXP_ID_0)
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_preview_with_authexps_no_col_has_some_exps(self):
        """Check there are some recommended explorations when a user is logged
        in, finishes an exploration in-editor (no system recommendations), and
        there are some author exploration IDs.
        """
        self.login(self.NEW_USER_EMAIL)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, author_recommended_ids_str='["7","8"]')
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_8])

    # Logged in collection tests.
    def test_logged_in_no_sysexps_no_authexps_first_exp_in_col_has_exp(self):
        """Check there is a recommended exploration when a user is logged in
        and completes the first exploration of a collection.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_19)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_in_no_sysexps_no_authexps_mid_exp_in_col_has_exps(self):
        """Check there are recommended explorations when a user is logged in
        and completes a middle exploration of the collection (since more
        explorations are needed to complete the collection).
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_20)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID)
        # The first exploration that the user has not yet visited is
        # recommended. Since, the collection is linear, in this method, finally,
        # the user would visit every node in the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_19])

    def test_logged_in_no_sysexps_no_authexps_all_exps_in_col_has_no_exps(self):
        """Check there are not recommended explorations when a user is logged in
        and completes all explorations of the collection.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_entire_collection_in_order()
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID)
        # No explorations are recommended since the collection was completed.
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_with_sysexps_no_authexps_first_exp_in_col_has_exp(self):
        """Check there is a recommended exploration when a user is logged in
        and completes the first exploration of a collection. Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(
            self.EXP_ID_19, [self.EXP_ID_1, self.EXP_ID_8])
        self._complete_exploration_in_collection(self.EXP_ID_19)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_in_with_sysexps_no_authexps_mid_exp_in_col_has_exps(self):
        """Check there are recommended explorations when a user is logged in
        and completes a middle exploration of the collection (since more
        explorations are needed to complete the collection). Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._set_recommendations(
            self.EXP_ID_20, [self.EXP_ID_1, self.EXP_ID_8])
        self._complete_exploration_in_collection(self.EXP_ID_20)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The first exploration that the user has not yet visited is
        # recommended. Since, the collection is linear, in this method, finally,
        # the user would visit every node in the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_19])

    def test_logged_in_sysexps_no_authexps_all_exps_in_col_has_no_exps(self):
        """Check there are not recommended explorations when a user is logged in
        and completes all explorations of the collection. This is true even if
        there are system recommendations for the last exploration.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_entire_collection_in_order()
        self._set_recommendations(
            self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # No explorations are recommended since the collection was completed.
        self.assertEqual(recommendation_ids, [])

    def test_logged_in_no_sysexps_with_authexps_first_exp_in_col_has_exps(self):
        """Check there is are recommended explorations when a user is logged in
        and completes the first exploration of a collection where that
        exploration also has author-specified explorations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_19)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","8"]')
        # The next exploration in the collection should be recommended along
        # with author specified explorations.
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_20, self.EXP_ID_7, self.EXP_ID_8])

    def test_logged_in_no_sysexps_with_authexps_mid_exp_in_col_has_exps(self):
        """Check there are recommended explorations when a user is logged in
        and completes a middle exploration of the collection, and that these
        recommendations include author-specified explorations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_exploration_in_collection(self.EXP_ID_20)
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","21"]')
        # The first & next explorations should be recommended, along with author
        # specified explorations.
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_19, self.EXP_ID_21, self.EXP_ID_7])

    def test_logged_in_no_sysexps_authexps_all_exps_in_col_has_exps(self):
        """Check there are still recommended explorations when a user is logged
        in and completes all explorations of the collection if the last
        exploration has author-specified explorations.
        """
        self.login(self.NEW_USER_EMAIL)
        self._complete_entire_collection_in_order()
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","8"]')
        # Only author specified explorations should be recommended since all
        # others in the collection have been completed.
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_8])

    # Logged out standard viewer tests.
    def test_logged_out_with_no_sysexps_no_authexps_no_col_has_no_exps(self):
        """Check there are no recommended explorations when a user is logged
        out, finishes an exploration in-viewer, but there are no recommended
        explorations and no author exploration IDs.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [])

    def test_logged_out_with_sysexps_no_authexps_no_col_has_some_exps(self):
        """Check there are recommended explorations when a user is logged out,
        finishes an exploration in-viewer, and there are system recommendations.
        """
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True)
        self.assertEqual(recommendation_ids, [self.EXP_ID_1, self.EXP_ID_8])

    def test_logged_out_no_sysexps_some_authexps_no_col_has_some_exps(self):
        """Check there are some recommended explorations when a user is logged
        out, finishes an exploration in-viewer, and there are author-specified
        exploration IDs.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","8"]')
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_8])

    def test_logged_out_with_sysexps_and_authexps_no_col_has_some_exps(self):
        """Check there are recommended explorations when a user is logged in,
        finishes an exploration in-viewer, and there are both author-specified
        exploration IDs and recommendations from the system.
        """
        self._set_recommendations(self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, include_system_recommendations=True,
            author_recommended_ids_str='["7","8"]')
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_1, self.EXP_ID_7, self.EXP_ID_8])

    # Logged out collection tests.
    def test_logged_out_no_sysexps_no_authexps_first_exp_in_col_has_exp(self):
        """Check there is a recommended exploration when a user is logged out
        and completes the first exploration of a collection.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_out_no_sysexps_no_authexps_mid_exp_in_col_has_exp(self):
        """Check there is a recommended exploration when a user is logged out
        and completes a middle exploration of the collection.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID)
        # Only the last exploration should be recommended since logged out users
        # follow a linear path through the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21])

    def test_logged_out_no_sysexps_no_authexps_last_exp_col_has_no_exps(self):
        """Check there are not recommended explorations when a user is logged
        out and completes the last exploration in the collection.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID)
        self.assertEqual(recommendation_ids, [])

    def test_logged_out_with_sysexps_no_authexps_first_exp_in_col_has_exp(self):
        """Check there is a recommended exploration when a user is logged out
        and completes the first exploration of a collection. Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self._set_recommendations(
            self.EXP_ID_19, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The next exploration in the collection should be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_20])

    def test_logged_out_with_sysexps_no_authexps_mid_exp_in_col_has_exp(self):
        """Check there is a recommended explorations when a user is logged out
        and completes a middle exploration of the collection. Note that even
        though the completed exploration has system recommendations, they are
        ignored in favor of the collection's own recommendations.
        """
        self._set_recommendations(
            self.EXP_ID_20, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # Only the last exploration should be recommended since logged out users
        # follow a linear path through the collection.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21])

    def test_logged_out_sysexps_no_authexps_last_exp_in_col_has_no_exps(self):
        """Check there are not recommended explorations when a user is logged
        out and completes the last exploration of the collection. This is true
        even if there are system recommendations for the last exploration.
        """
        self._set_recommendations(
            self.EXP_ID_0, [self.EXP_ID_1, self.EXP_ID_8])
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            include_system_recommendations=True)
        # The collection is completed, so no other explorations should be
        # recommended.
        self.assertEqual(recommendation_ids, [])

    def test_logged_out_no_sysexps_but_authexps_first_exp_in_col_has_exps(self):
        """Check there is are recommended explorations when a user is logged out
        and completes the first exploration of a collection where that
        exploration also has author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_19, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","8"]')
        # The next exploration in the collection should be recommended along
        # with author specified explorations.
        self.assertEqual(
            recommendation_ids, [self.EXP_ID_20, self.EXP_ID_7, self.EXP_ID_8])

    def test_logged_out_no_sysexps_with_authexps_mid_exp_in_col_has_exps(self):
        """Check there are recommended explorations when a user is logged out
        and completes a middle exploration of the collection where that
        exploration also has author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            author_recommended_ids_str='["7"]')
        # Both the next exploration & the author-specified explorations should
        # be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21, self.EXP_ID_7])

    def test_logged_out_no_sysexps_with_dup_authexps_mid_col_exp_has_exps(self):
        """test_logged_out_no_sysexps_with_authexps_mid_exp_in_col_has_exps but
        also checks that exploration IDs are de-duped if the next exploration
        overlaps with the author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_20, collection_id=self.COL_ID,
            author_recommended_ids_str='["7", "21"]')
        # Both the next exploration & the author-specified explorations should
        # be recommended.
        self.assertEqual(recommendation_ids, [self.EXP_ID_21, self.EXP_ID_7])

    def test_logged_out_no_sysexps_authexps_last_exp_in_col_has_exps(self):
        """Check there are still recommended explorations when a user is logged
        out and completes all explorations of the collection if the last
        exploration has author-specified explorations.
        """
        recommendation_ids = self._get_recommendation_ids(
            self.EXP_ID_0, collection_id=self.COL_ID,
            author_recommended_ids_str='["7","8"]')
        # Only author specified explorations should be recommended since all
        # others in the collection have been completed.
        self.assertEqual(recommendation_ids, [self.EXP_ID_7, self.EXP_ID_8])


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
        self.editor = user_services.UserActionsInfo(self.editor_id)

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
        rights_manager.publish_exploration(self.editor, self.EXP_ID)
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
        self.owner = user_services.UserActionsInfo(self.owner_id)

        # Save and publish explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Welcome',
            category='Architecture', language_code='fi')

        self.save_new_valid_exploration(
            self.EXP_ID_1_0, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')

        self.save_new_valid_exploration(
            self.EXP_ID_1_1, self.owner_id,
            title='Introduce Interactions in Oppia',
            category='Welcome', language_code='en')

        rights_manager.publish_exploration(self.owner, self.EXP_ID_0)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_1)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_1_0)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_1_1)

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
        rights_manager.publish_collection(self.owner, self.COL_ID_0)
        rights_manager.publish_collection(self.owner, self.COL_ID_1)

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

        # Remove one exploration.
        self.testapp.delete(str(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_0)))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_1])

        # Remove another exploration.
        self.testapp.delete(str(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_1)))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [])

    def test_remove_collection_from_incomplete_list_handler(self):
        """Test handler for removing collections from incomplete list."""

        self.login(self.USER_EMAIL)

        # Add two collections to incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Remove one collection.
        self.testapp.delete(str(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_0)))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_1])

        # Remove another collection.
        self.testapp.delete(str(
            '%s/%s/%s' %
            (
                feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_1)))
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])


class StorePlaythroughHandlerTest(test_utils.GenericTestBase):
    """Tests for the handler that records playthroughs."""

    def setUp(self):
        super(StorePlaythroughHandlerTest, self).setUp()
        self.exp_id = '15'

        self.login(self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        exp_services.load_demo(self.exp_id)
        self.exploration = exp_services.get_exploration_by_id(self.exp_id)
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp_id, self.exploration.version, 'EarlyQuit',
            {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])
        stats_models.ExplorationIssuesModel.create(
            self.exp_id, 1, [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': [playthrough_id],
                'schema_version': 1,
                'is_valid': True
            }])

        self.playthrough_data = {
            'id': None,
            'exp_id': self.exp_id,
            'exp_version': self.exploration.version,
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 250
                }
            },
            'actions': [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }]
        }

        response = self.testapp.get('/explore/%s' % self.exp_id)
        self.csrf_token = self.get_csrf_token_from_response(response)

    def test_new_playthrough_gets_stored(self):
        """Test that a new playthrough gets created and is added to an existing
        issue's list of playthrough IDs.
        """
        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 1)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 2)

    def test_new_exp_issue_gets_created(self):
        """Test that a new playthrough gets created and a new issue is created
        for it.
        """
        self.playthrough_data['issue_customization_args']['state_name'][
            'value'] = 'state_name2'

        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 2)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[1]['playthrough_ids']), 1)

    def test_playthrough_gets_added_to_cyclic_issues(self):
        """Test that a new cyclic playthrough gets added to the correct
        cyclic issue when it exists.
        """
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp_id, self.exploration.version, 'CyclicStateTransitions',
            {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        model.unresolved_issues.append({
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            'playthrough_ids': [playthrough_id],
            'schema_version': 1,
            'is_valid': True
        })
        model.put()

        self.playthrough_data = {
            'id': None,
            'exp_id': self.exp_id,
            'exp_version': self.exploration.version,
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            'actions': [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }],
        }

        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 2)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[1]['playthrough_ids']), 2)

    def test_cyclic_issues_of_different_order_creates_new_issue(self):
        """Test that a cyclic issue with the same list of states, but in
        a different order creates a new issue.
        """
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp_id, self.exploration.version, 'CyclicStateTransitions',
            {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }])

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        model.unresolved_issues.append({
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name1', 'state_name2', 'state_name1']
                },
            },
            'playthrough_ids': [playthrough_id],
            'schema_version': 1,
            'is_valid': True
        })
        model.put()

        self.playthrough_data = {
            'id': None,
            'exp_id': self.exp_id,
            'exp_version': self.exploration.version,
            'issue_type': 'CyclicStateTransitions',
            'issue_customization_args': {
                'state_names': {
                    'value': ['state_name1', 'state_name1', 'state_name2']
                },
            },
            'actions': [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }]
        }

        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 3)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[1]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[2]['playthrough_ids']), 1)

    def test_playthrough_not_stored_at_limiting_value(self):
        """Test that a playthrough is not stored when the maximum number of
        playthroughs per issue already exists.
        """
        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        model.unresolved_issues[0]['playthrough_ids'] = [
            'id1', 'id2', 'id3', 'id4', 'id5']
        model.put()

        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 1)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 5)

    def test_error_without_schema_version_in_payload_dict(self):
        """Test that passing a payload without schema version raises an
        exception.
        """
        payload_dict_without_schema_version = {
            'playthrough_data': self.playthrough_data
        }
        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            payload_dict_without_schema_version, self.csrf_token,
            expect_errors=True, expected_status_int=400)

    def test_error_on_invalid_playthrough_dict(self):
        """Test that passing an invalid playthrough dict raises an exception."""
        self.playthrough_data['issue_type'] = 'FakeIssueType'

        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token, expect_errors=True, expected_status_int=400)

    def test_playthrough_id_is_returned(self):
        """Test that playthrough ID is returned when it is stored for the first
        time and the playthrough is updated from the next time.
        """
        response = self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 1)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 2)
        playthrough_id = model.unresolved_issues[0]['playthrough_ids'][1]
        self.assertEqual(response['playthrough_id'], playthrough_id)
        self.assertEqual(response['playthrough_stored'], True)

    def test_playthrough_is_subsequently_updated(self):
        """Test that a playthrough is updated if the controller is called for
        the second time.
        """
        response = self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        playthrough_id = response['playthrough_id']
        self.playthrough_data['id'] = playthrough_id
        self.playthrough_data['issue_customization_args'][
            'time_spent_in_exp_in_msecs']['value'] = 150

        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 1)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 2)
        playthrough_id = model.unresolved_issues[0]['playthrough_ids'][1]
        playthrough = stats_services.get_playthrough_by_id(playthrough_id)
        self.assertEqual(
            playthrough.issue_customization_args['time_spent_in_exp_in_msecs'][
                'value'], 150)

    def test_updating_playthrough_issue(self):
        """Test that updating an existing playthrough's issue creates a new
        issue if the issue doesn't exist.
        """
        response = self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        self.process_and_flush_pending_tasks()

        playthrough_id = response['playthrough_id']
        self.playthrough_data['id'] = playthrough_id
        self.playthrough_data['issue_type'] = 'CyclicStateTransitions'
        self.playthrough_data['issue_customization_args'] = {
            'state_names': {
                'value': ['state1', 'state2', 'state1']
            }
        }

        self.post_json(
            '/explorehandler/store_playthrough/%s' % (self.exp_id),
            {
                'playthrough_data': self.playthrough_data,
                'issue_schema_version': 1
            }, self.csrf_token)
        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(len(model.unresolved_issues), 2)
        self.assertEqual(len(model.unresolved_issues[0]['playthrough_ids']), 1)
        self.assertEqual(len(model.unresolved_issues[1]['playthrough_ids']), 1)
        playthrough_id = model.unresolved_issues[1]['playthrough_ids'][0]
        playthrough = stats_services.get_playthrough_by_id(playthrough_id)
        self.assertEqual(playthrough.issue_type, 'CyclicStateTransitions')
        self.assertEqual(
            playthrough.issue_customization_args['state_names'][
                'value'], ['state1', 'state2', 'state1'])


class StatsEventHandlerTest(test_utils.GenericTestBase):
    """Tests for all the statistics event models recording handlers."""

    def setUp(self):
        super(StatsEventHandlerTest, self).setUp()
        self.exp_id = '15'

        self.login(self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        exp_services.load_demo(self.exp_id)
        exploration = exp_services.get_exploration_by_id(self.exp_id)

        self.exp_version = exploration.version
        self.state_name = 'Home'
        self.session_id = 'session_id1'
        state_stats_mapping = {
            self.state_name: stats_domain.StateStats.create_default()
        }
        exploration_stats = stats_domain.ExplorationStats(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0,
            state_stats_mapping)
        stats_services.create_stats_model(exploration_stats)

        self.aggregated_stats = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }

    def test_stats_events_handler(self):
        """Test the handler for handling batched events."""
        self.post_json('/explorehandler/stats_events/%s' % (
            self.exp_id), {
                'aggregated_stats': self.aggregated_stats,
                'exp_version': self.exp_version})

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_STATS), 1)
        self.process_and_flush_pending_tasks()

        # Check that the models are updated.
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        self.assertEqual(exploration_stats.num_starts_v2, 1)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 1)
        self.assertEqual(exploration_stats.num_completions_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].total_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].first_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].total_answers_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].useful_feedback_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].num_completions_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                self.state_name].num_times_solution_viewed_v2, 1)
