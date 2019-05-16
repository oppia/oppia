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

"""Tests for the library page and associated handlers."""

import json
import logging
import os

from constants import constants
from core.domain import activity_domain
from core.domain import activity_services
from core.domain import exp_domain
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import summary_services
from core.domain import user_services
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import utils

CAN_EDIT_STR = 'can_edit'


class LibraryPageTests(test_utils.GenericTestBase):

    def setUp(self):
        super(LibraryPageTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)

    def test_library_page(self):
        """Test access to the library page."""
        response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
        response.mustcontain('ng-controller="Library"')

    def test_library_handler_with_exceeding_query_limit_logs_error(self):
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual({
            'iframed': False,
            'is_admin': False,
            'is_topic_manager': False,
            'is_moderator': False,
            'is_super_admin': False,
            'activity_list': [],
            'additional_angular_modules': [],
            'search_cursor': None
        }, response_dict)

        # Load a public demo exploration.
        exp_services.load_demo('0')

        observed_log_messages = []

        def _mock_logging_function(msg, *_):
            """Mocks logging.error()."""
            observed_log_messages.append(msg)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        default_query_limit_swap = self.swap(feconf, 'DEFAULT_QUERY_LIMIT', 1)
        # Load the search results with an empty query.
        with default_query_limit_swap, logging_swap:
            self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)

            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                (
                    '1 activities were fetched to load the library page. '
                    'You may be running up against the default query limits.'
                )
            )

    def test_library_handler_with_given_category_and_language_code(self):
        self.login(self.ADMIN_EMAIL)

        exp_id = exp_services.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        exp_services.index_explorations_given_ids([exp_id])
        response_dict = self.get_json(
            feconf.LIBRARY_SEARCH_DATA_URL, params={
                'category': 'A category',
                'language_code': 'en'
            })
        activity_list = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [exp_id]))

        self.assertEqual(response_dict['activity_list'], activity_list)

        self.logout()

    def test_library_handler_demo_exploration(self):
        """Test the library data handler on demo explorations."""
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual({
            'iframed': False,
            'is_admin': False,
            'is_topic_manager': False,
            'is_moderator': False,
            'is_super_admin': False,
            'activity_list': [],
            'additional_angular_modules': [],
            'search_cursor': None
        }, response_dict)

        # Load a public demo exploration.
        exp_services.load_demo('0')

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['activity_list']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

        self.set_admins([self.ADMIN_USERNAME])

        # Run migration job to create exploration summaries.
        # This is not necessary, but serves as additional check that
        # the migration job works well and gives correct results.
        self.process_and_flush_pending_tasks()
        job_id = (exp_jobs_one_off.ExpSummariesCreationOneOffJob.create_new())
        exp_jobs_one_off.ExpSummariesCreationOneOffJob.enqueue(job_id)
        self.assertGreaterEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        # Change title and category.
        exp_services.update_exploration(
            self.editor_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'A new title!'
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'category',
                'new_value': 'A new category'
            })],
            'Change title and category')

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['activity_list']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'A new category',
            'title': 'A new title!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

    def test_library_handler_for_created_explorations(self):
        """Test the library data handler for manually created explorations."""
        self.set_admins([self.ADMIN_USERNAME])

        self.login(self.ADMIN_EMAIL)
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertDictContainsSubset({
            'is_admin': True,
            'is_moderator': True,
            'is_super_admin': False,
            'activity_list': [],
            'user_email': self.ADMIN_EMAIL,
            'username': self.ADMIN_USERNAME,
            'search_cursor': None,
        }, response_dict)

        # Create exploration A.
        exploration = self.save_new_valid_exploration(
            'A', self.admin_id, title='Title A', category='Category A',
            objective='Objective A')
        exp_services._save_exploration(  # pylint: disable=protected-access
            self.admin_id, exploration, 'Exploration A', [])

        # Test that the private exploration isn't displayed.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(response_dict['activity_list'], [])

        # Create exploration B.
        exploration = self.save_new_valid_exploration(
            'B', self.admin_id, title='Title B', category='Category B',
            objective='Objective B')
        exp_services._save_exploration(  # pylint: disable=protected-access
            self.admin_id, exploration, 'Exploration B', [])
        rights_manager.publish_exploration(self.admin, 'B')

        # Publish exploration A.
        rights_manager.publish_exploration(self.admin, 'A')

        exp_services.index_explorations_given_ids(['A', 'B'])

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['activity_list']), 2)
        self.assertDictContainsSubset({
            'id': 'B',
            'category': 'Category B',
            'title': 'Title B',
            'language_code': 'en',
            'objective': 'Objective B',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][1])
        self.assertDictContainsSubset({
            'id': 'A',
            'category': 'Category A',
            'title': 'Title A',
            'language_code': 'en',
            'objective': 'Objective A',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

        # Delete exploration A.
        exp_services.delete_exploration(self.admin_id, 'A')

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['activity_list']), 1)
        self.assertDictContainsSubset({
            'id': 'B',
            'category': 'Category B',
            'title': 'Title B',
            'language_code': 'en',
            'objective': 'Objective B',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])


class LibraryIndexHandlerTests(test_utils.GenericTestBase):

    EXP_ID = 'exp_id'

    def setUp(self):
        super(LibraryIndexHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

    def test_library_index_handler_updates_featured_activity_summary_dicts(
            self):
        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertEqual(response['activity_summary_dicts_by_category'], [])

        activity_services.update_featured_activity_references([
            activity_domain.ActivityReference(
                constants.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID)
        ])
        featured_activity_summary_dicts = (
            summary_services.get_featured_activity_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE]))
        expected_dict = {
            'activity_summary_dicts': featured_activity_summary_dicts,
            'categories': [],
            'header_i18n_id': feconf.LIBRARY_CATEGORY_FEATURED_ACTIVITIES,
            'has_full_results_page': False,
            'full_results_url': None
            }

        response = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertEqual(
            response['activity_summary_dicts_by_category'][0], expected_dict)

        self.logout()

    def test_library_index_handler_updates_top_rated_activity_summary_dicts(
            self):
        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertEqual(response['activity_summary_dicts_by_category'], [])

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_ID, 5)
        top_rated_activity_summary_dicts = (
            summary_services.get_top_rated_exploration_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE],
                feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE))
        expected_dict = {
            'activity_summary_dicts': top_rated_activity_summary_dicts,
            'categories': [],
            'header_i18n_id': feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS,
            'has_full_results_page': True,
            'full_results_url': feconf.LIBRARY_TOP_RATED_URL,
            'protractor_id': 'top-rated'
            }

        response = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertEqual(
            response['activity_summary_dicts_by_category'][0], expected_dict)

        self.logout()


class LibraryGroupPageTests(test_utils.GenericTestBase):

    def test_library_group_pages(self):
        """Test access to the top rated and recently published pages."""
        self.get_html_response(feconf.LIBRARY_TOP_RATED_URL)

        self.get_html_response(feconf.LIBRARY_RECENTLY_PUBLISHED_URL)

    def test_handler_updates_preferred_language_codes(self):
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.login(self.OWNER_EMAIL)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED})

        self.assertEqual(
            response_dict['preferred_language_codes'],
            [constants.DEFAULT_LANGUAGE_CODE])

        user_services.update_preferred_language_codes(owner_id, ['es'])
        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED})

        self.assertEqual(
            response_dict['preferred_language_codes'], ['es'])

        self.logout()

    def test_handler_for_recently_published_library_group_page(self):
        """Test library handler for recently published group page."""
        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED})
        self.assertDictContainsSubset({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'activity_list': [],
            'preferred_language_codes': ['en'],
        }, response_dict)

        # Load a public demo exploration.
        exp_services.load_demo('0')

        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED})
        self.assertEqual(len(response_dict['activity_list']), 1)
        self.assertDictContainsSubset({
            'header_i18n_id': 'I18N_LIBRARY_GROUPS_RECENTLY_PUBLISHED',
            'preferred_language_codes': ['en'],
        }, response_dict)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

    def test_handler_for_top_rated_library_group_page(self):
        """Test library handler for top rated group page."""

        # Load a public demo exploration.
        exp_services.load_demo('0')

        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_TOP_RATED})
        self.assertDictContainsSubset({
            'is_admin': False,
            'is_moderator': False,
            'is_super_admin': False,
            'activity_list': [],
            'preferred_language_codes': ['en'],
        }, response_dict)

        # Assign rating to exploration to test handler for top rated
        # explorations page.
        rating_services.assign_rating_to_exploration('user', '0', 2)

        # Test whether the response contains the exploration we have rated.
        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_TOP_RATED})
        self.assertDictContainsSubset({
            'header_i18n_id': 'I18N_LIBRARY_GROUPS_TOP_RATED_EXPLORATIONS',
            'preferred_language_codes': ['en'],
        }, response_dict)
        self.assertEqual(len(response_dict['activity_list']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

        # Load another public demo exploration.
        exp_services.load_demo('1')

        # Assign rating to exploration to test handler for top rated
        # explorations page.
        rating_services.assign_rating_to_exploration('user', '1', 4)

        # Test whether the response contains both the explorations we have
        # rated and they are returned in decending order of rating.
        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_TOP_RATED})
        self.assertEqual(len(response_dict['activity_list']), 2)
        self.assertDictContainsSubset({
            'id': '1',
            'category': 'Programming',
            'title': 'Project Euler Problem 1',
            'language_code': 'en',
            'objective': 'solve Problem 1 on the Project Euler site',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][1])


class CategoryConfigTests(test_utils.GenericTestBase):

    def test_thumbnail_icons_exist_for_each_category(self):
        all_categories = constants.CATEGORIES_TO_COLORS.keys()

        # Test that an icon exists for each default category.
        for category in all_categories:
            utils.get_file_contents(os.path.join(
                self.get_static_asset_filepath(), 'assets', 'images',
                'subjects', '%s.svg' % category.replace(' ', '')))

        # Test that the default icon exists.
        utils.get_file_contents(os.path.join(
            self.get_static_asset_filepath(), 'assets', 'images', 'subjects',
            '%s.svg' % constants.DEFAULT_THUMBNAIL_ICON))


class ExplorationSummariesHandlerTests(test_utils.GenericTestBase):

    PRIVATE_EXP_ID_EDITOR = 'eid0'
    PUBLIC_EXP_ID_EDITOR = 'eid1'
    PRIVATE_EXP_ID_VIEWER = 'eid2'

    def setUp(self):
        super(ExplorationSummariesHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.save_new_valid_exploration(
            self.PRIVATE_EXP_ID_EDITOR, self.editor_id)
        self.save_new_valid_exploration(
            self.PUBLIC_EXP_ID_EDITOR, self.editor_id)
        self.save_new_valid_exploration(
            self.PRIVATE_EXP_ID_VIEWER, self.viewer_id)

        rights_manager.publish_exploration(
            self.editor, self.PUBLIC_EXP_ID_EDITOR)

    def test_handler_with_invalid_stringified_exp_ids_raises_error_404(self):
        # 'stringified_exp_ids' should be a list.
        self.get_json(
            feconf.EXPLORATION_SUMMARIES_DATA_URL,
            params={
                'stringified_exp_ids': json.dumps(self.PRIVATE_EXP_ID_EDITOR)
            }, expected_status_int=404)

        # 'stringified_exp_ids' should contain exploration ids for which valid
        # explorations are created. No exploration is created for exp id 2.
        self.get_json(
            feconf.EXPLORATION_SUMMARIES_DATA_URL,
            params={
                'stringified_exp_ids': json.dumps([
                    2, self.PUBLIC_EXP_ID_EDITOR,
                    self.PRIVATE_EXP_ID_VIEWER])
            }, expected_status_int=404)

    def test_can_get_public_exploration_summaries(self):
        self.login(self.VIEWER_EMAIL)

        response_dict = self.get_json(
            feconf.EXPLORATION_SUMMARIES_DATA_URL,
            params={
                'stringified_exp_ids': json.dumps([
                    self.PRIVATE_EXP_ID_EDITOR, self.PUBLIC_EXP_ID_EDITOR,
                    self.PRIVATE_EXP_ID_VIEWER])
            })
        self.assertIn('summaries', response_dict)

        summaries = response_dict['summaries']
        self.assertEqual(len(summaries), 1)

        self.assertEqual(summaries[0]['id'], self.PUBLIC_EXP_ID_EDITOR)
        self.assertEqual(summaries[0]['status'], 'public')

        self.logout()

    def test_can_get_editable_private_exploration_summaries(self):
        self.login(self.VIEWER_EMAIL)

        response_dict = self.get_json(
            feconf.EXPLORATION_SUMMARIES_DATA_URL,
            params={
                'stringified_exp_ids': json.dumps([
                    self.PRIVATE_EXP_ID_EDITOR, self.PUBLIC_EXP_ID_EDITOR,
                    self.PRIVATE_EXP_ID_VIEWER]),
                'include_private_explorations': True
            })
        self.assertIn('summaries', response_dict)

        summaries = response_dict['summaries']
        self.assertEqual(len(summaries), 2)

        self.assertEqual(summaries[0]['id'], self.PUBLIC_EXP_ID_EDITOR)
        self.assertEqual(summaries[0]['status'], 'public')
        self.assertEqual(summaries[1]['id'], self.PRIVATE_EXP_ID_VIEWER)
        self.assertEqual(summaries[1]['status'], 'private')

        # If the viewer user is granted edit access to the editor user's
        # private exploration, then it will show up for the next request.
        rights_manager.assign_role_for_exploration(
            self.editor, self.PRIVATE_EXP_ID_EDITOR, self.viewer_id,
            rights_manager.ROLE_EDITOR)

        response_dict = self.get_json(
            feconf.EXPLORATION_SUMMARIES_DATA_URL,
            params={
                'stringified_exp_ids': json.dumps([
                    self.PRIVATE_EXP_ID_EDITOR, self.PUBLIC_EXP_ID_EDITOR,
                    self.PRIVATE_EXP_ID_VIEWER]),
                'include_private_explorations': True
            })
        self.assertIn('summaries', response_dict)

        summaries = response_dict['summaries']
        self.assertEqual(len(summaries), 3)

        self.assertEqual(summaries[0]['id'], self.PRIVATE_EXP_ID_EDITOR)
        self.assertEqual(summaries[0]['status'], 'private')
        self.assertEqual(summaries[1]['id'], self.PUBLIC_EXP_ID_EDITOR)
        self.assertEqual(summaries[1]['status'], 'public')
        self.assertEqual(summaries[2]['id'], self.PRIVATE_EXP_ID_VIEWER)
        self.assertEqual(summaries[2]['status'], 'private')

        self.logout()

    def test_cannot_get_private_exploration_summaries_when_logged_out(self):
        response_dict = self.get_json(
            feconf.EXPLORATION_SUMMARIES_DATA_URL,
            params={
                'stringified_exp_ids': json.dumps([
                    self.PRIVATE_EXP_ID_EDITOR, self.PUBLIC_EXP_ID_EDITOR,
                    self.PRIVATE_EXP_ID_VIEWER]),
                'include_private_explorations': True
            })
        self.assertIn('summaries', response_dict)

        summaries = response_dict['summaries']
        self.assertEqual(len(summaries), 1)

        self.assertEqual(summaries[0]['id'], self.PUBLIC_EXP_ID_EDITOR)
        self.assertEqual(summaries[0]['status'], 'public')


class CollectionSummariesHandlerTests(test_utils.GenericTestBase):

    COLLECTION_ID = 'colid'

    def setUp(self):
        super(CollectionSummariesHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def test_can_get_collection_summaries(self):
        self.login(self.EDITOR_EMAIL)

        response_dict = self.get_json(
            feconf.COLLECTION_SUMMARIES_DATA_URL,
            params={
                'stringified_collection_ids': json.dumps([self.COLLECTION_ID])
            })
        self.assertEqual(response_dict['summaries'], [])

        self.save_new_valid_collection(
            self.COLLECTION_ID, self.editor_id)
        self.publish_collection(self.editor_id, self.COLLECTION_ID)

        response_dict = self.get_json(
            feconf.COLLECTION_SUMMARIES_DATA_URL,
            params={
                'stringified_collection_ids': json.dumps([self.COLLECTION_ID])
            })
        self.assertIn('summaries', response_dict)

        summaries = response_dict['summaries']
        self.assertEqual(len(summaries), 1)

        self.assertEqual(summaries[0]['id'], self.COLLECTION_ID)
        self.assertEqual(summaries[0]['category'], 'A category')
        self.assertEqual(summaries[0]['title'], 'A title')
        self.assertEqual(summaries[0]['objective'], 'An objective')

        self.logout()
