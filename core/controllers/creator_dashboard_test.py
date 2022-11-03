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

"""Tests for the creator dashboard and the notifications dashboard."""

from __future__ import annotations

import logging
import os

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import creator_dashboard
from core.domain import collection_services
from core.domain import exp_services
from core.domain import feedback_domain
from core.domain import feedback_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models
    from mypy_imports import suggestion_models
    from mypy_imports import user_models

(
    user_models, suggestion_models, feedback_models
) = models.Registry.import_models([
    models.Names.USER, models.Names.SUGGESTION, models.Names.FEEDBACK
])


class OldContributorDashboardRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old contributor dashboard page URL
    to the new one.
    """

    def test_old_contributor_dashboard_page_url(self) -> None:
        """Test to validate that the old contributor dashboard page url
        redirects to the new one.
        """
        response = self.get_html_response(
            '/contributor_dashboard', expected_status_int=301)
        self.assertEqual(
            'http://localhost/contributor-dashboard',
            response.headers['location'])


class OldCreatorDashboardRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old creator dashboard page URL
    to the new one.
    """

    def test_old_creator_dashboard_page_url(self) -> None:
        """Test to validate that the old creator dashboard page url redirects
        to the new one.
        """
        response = self.get_html_response(
            '/creator_dashboard', expected_status_int=301)
        self.assertEqual(
            'http://localhost/creator-dashboard', response.headers['location'])


class HomePageTests(test_utils.GenericTestBase):

    def test_logged_out_homepage(self) -> None:
        """Test the logged-out version of the home page."""
        response = self.get_html_response('/')
        self.assertEqual(response.status_int, 200)
        self.assertIn('</lightweight-oppia-root>', response)


class CreatorDashboardHandlerTests(test_utils.GenericTestBase):

    COLLABORATOR_EMAIL: Final = 'collaborator@example.com'
    COLLABORATOR_USERNAME: Final = 'collaborator'

    OWNER_EMAIL_1: Final = 'owner1@example.com'
    OWNER_USERNAME_1: Final = 'owner1'
    OWNER_EMAIL_2: Final = 'owner2@example.com'
    OWNER_USERNAME_2: Final = 'owner2'

    EXP_ID: Final = 'exp_id'
    EXP_TITLE: Final = 'Exploration title'
    EXP_ID_1: Final = 'exp_id_1'
    EXP_TITLE_1: Final = 'Exploration title 1'
    EXP_ID_2: Final = 'exp_id_2'
    EXP_TITLE_2: Final = 'Exploration title 2'
    EXP_ID_3: Final = 'exp_id_3'
    EXP_TITLE_3: Final = 'Exploration title 3'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.OWNER_EMAIL_1, self.OWNER_USERNAME_1)
        self.signup(self.OWNER_EMAIL_2, self.OWNER_USERNAME_2)
        self.signup(self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner_id_1 = self.get_user_id_from_email(self.OWNER_EMAIL_1)
        self.owner_id_2 = self.get_user_id_from_email(self.OWNER_EMAIL_2)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.owner_1 = user_services.get_user_actions_info(self.owner_id_1)
        self.collaborator_id = self.get_user_id_from_email(
            self.COLLABORATOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_no_explorations(self) -> None:
        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self.logout()

    def test_no_explorations_and_visit_dashboard(self) -> None:
        self.login(self.OWNER_EMAIL)
        # Testing that creator only visit dashboard without any exploration
        # created.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 0)
        self.logout()

    def test_create_single_exploration_and_visit_dashboard(self) -> None:
        self.login(self.OWNER_EMAIL)
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        # Testing the quantity of exploration created and it should be 1.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.logout()

    def test_create_two_explorations_delete_one_and_visit_dashboard(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL_1)
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)
        # Testing the quantity of exploration and it should be 2.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)
        exp_services.delete_exploration(self.owner_id_1, self.EXP_ID_1)
        # Testing whether 1 exploration left after deletion of previous one.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.logout()

    def test_create_multiple_explorations_delete_all_and_visit_dashboard(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL_2)
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_2, title=self.EXP_TITLE_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_2, title=self.EXP_TITLE_2)
        self.save_new_default_exploration(
            self.EXP_ID_3, self.owner_id_2, title=self.EXP_TITLE_3)
        # Testing for quantity of explorations to be 3.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 3)
        # Testing for deletion of all created previously.
        exp_services.delete_exploration(self.owner_id_2, self.EXP_ID_1)
        exp_services.delete_exploration(self.owner_id_2, self.EXP_ID_2)
        exp_services.delete_exploration(self.owner_id_2, self.EXP_ID_3)
        # All explorations have been deleted, so the dashboard query should not
        # load any explorations.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 0)
        self.logout()

    def test_managers_can_see_explorations(self) -> None:
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        self.set_curriculum_admins([self.OWNER_USERNAME])

        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PUBLIC)

        self.logout()

    def test_collaborators_can_see_explorations(self) -> None:
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.collaborator_id,
            rights_domain.ROLE_EDITOR)
        self.set_curriculum_admins([self.OWNER_USERNAME])

        self.login(self.COLLABORATOR_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PUBLIC)

        self.logout()

    def test_viewer_cannot_see_explorations(self) -> None:
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.viewer_id,
            rights_domain.ROLE_VIEWER)
        self.set_curriculum_admins([self.OWNER_USERNAME])

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        self.logout()

    def test_can_see_feedback_thread_counts(self) -> None:
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)

        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        def mock_get_thread_analytics_multi(
            unused_exploration_ids: List[str]
        ) -> List[feedback_domain.FeedbackAnalytics]:
            return [feedback_domain.FeedbackAnalytics(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, 2, 3)]

        with self.swap(
            feedback_services, 'get_thread_analytics_multi',
            mock_get_thread_analytics_multi):

            response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
            self.assertEqual(len(response['explorations_list']), 1)

        self.logout()

    def test_can_see_subscribers(self) -> None:
        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscribers_list']), 0)

        # Subscribe to creator.
        subscription_services.subscribe_to_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscribers_list']), 1)
        self.assertEqual(
            response['subscribers_list'][0]['subscriber_username'],
            self.VIEWER_USERNAME)

        # Unsubscribe from creator.
        subscription_services.unsubscribe_from_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscribers_list']), 0)

    def test_get_topic_summary_dicts_with_new_structure_players_enabled(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['topic_summary_dicts']), 0)
        self.save_new_topic(
            'topic_id', self.owner_id, name='Name',
            description='Description',
            canonical_story_ids=['story_id_1', 'story_id_2'],
            additional_story_ids=['story_id_3'],
            uncategorized_skill_ids=['skill_id_1', 'skill_id_2'],
            subtopics=[], next_subtopic_id=1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['topic_summary_dicts']), 1)
        self.assertTrue(isinstance(response['topic_summary_dicts'], list))
        self.assertEqual(response['topic_summary_dicts'][0]['name'], 'Name')
        self.assertEqual(
            response['topic_summary_dicts'][0]['id'], 'topic_id')
        self.logout()

    def test_can_update_display_preference(self) -> None:
        self.login(self.OWNER_EMAIL)
        display_preference = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['display_preference']
        self.assertEqual(display_preference, 'card')
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.CREATOR_DASHBOARD_DATA_URL,
            {'display_preference': 'list'},
            csrf_token=csrf_token)
        display_preference = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['display_preference']
        self.assertEqual(display_preference, 'list')
        self.logout()

    def test_can_create_collections(self) -> None:
        self.set_collection_editors([self.OWNER_USERNAME])
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        collection_id = self.post_json(
            feconf.NEW_COLLECTION_URL, {}, csrf_token=csrf_token)[
                creator_dashboard.COLLECTION_ID_KEY]
        collection = collection_services.get_collection_by_id(collection_id)
        self.assertEqual(collection.id, collection_id)
        self.assertEqual(collection.title, feconf.DEFAULT_COLLECTION_TITLE)
        self.assertEqual(
            collection.objective, feconf.DEFAULT_COLLECTION_CATEGORY)
        self.assertEqual(
            collection.category, feconf.DEFAULT_COLLECTION_OBJECTIVE)
        self.assertEqual(
            collection.language_code, constants.DEFAULT_LANGUAGE_CODE)
        self.logout()

    def test_get_dashboard_stats(self) -> None:
        user_models.UserStatsModel(
            id=self.owner_id,
            total_plays=10,
            num_ratings=2,
            average_ratings=3.1111
        ).put()

        self.login(self.OWNER_EMAIL, is_super_admin=True)
        dashboard_stats = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['dashboard_stats']
        self.assertEqual(dashboard_stats, {
            'total_plays': 10,
            'num_ratings': 2,
            'average_ratings': 3.11,
            'total_open_feedback': 0
        })

    def test_last_week_stats_produce_exception(self) -> None:
        self.login(self.OWNER_EMAIL, is_super_admin=True)

        get_last_week_dashboard_stats_swap = self.swap(
            user_services,
            'get_last_week_dashboard_stats',
            lambda _: {
                'key_2': {
                    'num_ratings': 2,
                    'average_ratings': 3.1111,
                    'total_plays': 10
                }
            }
        )

        with get_last_week_dashboard_stats_swap:
            last_week_stats = self.get_json(
                feconf.CREATOR_DASHBOARD_DATA_URL)['last_week_stats']

        self.assertEqual(last_week_stats, {
            'key_2': {
                'num_ratings': 2,
                'average_ratings': 3.11,
                'total_plays': 10
            }
        })

    def test_broken_last_week_stats_produce_exception(self) -> None:
        self.login(self.OWNER_EMAIL, is_super_admin=True)

        get_last_week_dashboard_stats_swap = self.swap(
            user_services,
            'get_last_week_dashboard_stats',
            lambda _: {'key_1': 1, 'key_2': 2}
        )

        with self.capture_logging(min_level=logging.ERROR) as logs:
            with get_last_week_dashboard_stats_swap:
                last_week_stats = self.get_json(
                    feconf.CREATOR_DASHBOARD_DATA_URL)['last_week_stats']
            self.assertEqual(logs, [
                '\'last_week_stats\' should contain only one key-value pair'
                ' denoting last week dashboard stats of the user keyed by a'
                ' datetime string.\nNoneType: None'
            ])
        self.assertIsNone(last_week_stats)

    def test_get_collections_list(self) -> None:
        self.set_collection_editors([self.OWNER_USERNAME])
        self.login(self.OWNER_EMAIL)
        collection_list = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['collections_list']
        self.assertEqual(collection_list, [])
        self.save_new_default_collection(
            'collection_id', self.owner_id, title='A title',
            objective='An objective', category='A category')
        collection_list = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['collections_list']
        self.assertEqual(len(collection_list), 1)
        self.assertEqual(collection_list[0]['id'], 'collection_id')
        self.assertEqual(collection_list[0]['title'], 'A title')
        self.assertEqual(collection_list[0]['objective'], 'An objective')
        self.assertEqual(collection_list[0]['category'], 'A category')
        self.logout()

    def test_get_suggestions_list(self) -> None:
        self.login(self.OWNER_EMAIL)
        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['created_suggestions_list']
        self.assertEqual(suggestions, [])
        change_dict: Dict[str, Union[str, Dict[str, str]]] = {
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'state_name': 'Introduction',
            'new_value': ''
        }
        self.save_new_default_exploration('exploration_id', self.owner_id)
        suggestion_services.create_suggestion(
            'edit_exploration_state_content', 'exploration',
            'exploration_id', 1, self.owner_id, change_dict, '')
        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['created_suggestions_list'][0]
        change_dict['old_value'] = {
            'content_id': 'content',
            'html': ''
        }
        self.assertEqual(suggestions['change'], change_dict)
        # Test to check if suggestions populate old value of the change.
        self.assertEqual(
            suggestions['change']['old_value']['content_id'], 'content')
        self.logout()

    def test_get_suggestions_to_review_list(self) -> None:
        self.login(self.OWNER_EMAIL)

        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['suggestions_to_review_list']
        self.assertEqual(suggestions, [])

        change_dict: Dict[str, Union[str, Dict[str, str]]] = {
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'state_name': 'Introduction',
            'new_value': ''
        }
        self.save_new_default_exploration('exp1', self.owner_id)

        user_models.UserContributionProficiencyModel.create(
            self.owner_id, 'category1', 15)
        model1 = feedback_models.GeneralFeedbackThreadModel.create(
            'exploration.exp1.thread_1')
        model1.entity_type = 'exploration'
        model1.entity_id = 'exp1'
        model1.subject = 'subject'
        model1.update_timestamps()
        model1.put()

        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_IN_REVIEW, self.owner_id_1,
            self.owner_id_2, change_dict, 'category1',
            'exploration.exp1.thread_1', None)

        change_dict['old_value'] = {
            'content_id': 'content',
            'html': ''
        }
        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['suggestions_to_review_list']

        self.assertEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]['change'], change_dict)
        # Test to check if suggestions populate old value of the change.
        self.assertEqual(
            suggestions[0]['change']['old_value']['content_id'], 'content')

        self.logout()

    def test_creator_dashboard_page(self) -> None:
        self.login(self.OWNER_EMAIL)

        response = self.get_html_response(feconf.CREATOR_DASHBOARD_URL)
        self.assertIn(b'Creator Dashboard | Oppia', response.body)

        self.logout()


class CreationButtonsTests(test_utils.GenericTestBase):
    with utils.open_file(
        os.path.join(
            feconf.SAMPLE_EXPLORATIONS_DIR, 'welcome', 'welcome.yaml'),
        'rb', encoding=None
    ) as f:
        raw_yaml = f.read()

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

    def test_new_exploration_ids(self) -> None:
        """Test generation of exploration ids."""
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()
        exp_a_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, {}, csrf_token=csrf_token
        )[creator_dashboard.EXPLORATION_ID_KEY]
        self.assertEqual(len(exp_a_id), 12)

        self.logout()

    def test_can_non_admins_can_not_upload_exploration(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            feconf.UPLOAD_EXPLORATION_URL,
            {'yaml_file': ''},
            csrf_token=csrf_token,
            expected_status_int=401
        )
        self.assertEqual(
            response['error'],
            'You do not have credentials to upload explorations.')

        self.logout()

    def test_can_upload_exploration(self) -> None:
        with self.swap(constants, 'ALLOW_YAML_FILE_UPLOAD', True):
            self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
            self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

            csrf_token = self.get_new_csrf_token()
            explorations_list = self.get_json(
                feconf.CREATOR_DASHBOARD_DATA_URL)['explorations_list']
            self.assertEqual(explorations_list, [])
            exp_a_id = self.post_json(
                feconf.UPLOAD_EXPLORATION_URL,
                {},
                csrf_token=csrf_token,
                upload_files=[('yaml_file', 'unused_filename', self.raw_yaml)]
            )[creator_dashboard.EXPLORATION_ID_KEY]
            explorations_list = self.get_json(
                feconf.CREATOR_DASHBOARD_DATA_URL)['explorations_list']
            self.assertEqual(explorations_list[0]['id'], exp_a_id)
            self.logout()

    def test_can_not_upload_exploration_when_server_does_not_allow_file_upload(
        self
    ) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.UPLOAD_EXPLORATION_URL,
            {},
            csrf_token=csrf_token,
            upload_files=[('yaml_file', 'unused_filename', self.raw_yaml)],
            expected_status_int=400
        )
        self.logout()
