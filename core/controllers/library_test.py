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

from __future__ import annotations

import json
import logging
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import activity_domain
from core.domain import activity_services
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import summary_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()

CAN_EDIT_STR = 'can_edit'


class OldLibraryRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old library page URL to the new one."""

    def test_old_library_page_url(self):
        """Test to validate that the old library page url redirects
        to the new one.
        """
        response = self.get_html_response('/library', expected_status_int=301)
        self.assertEqual(
            'http://localhost/community-library', response.headers['location'])


class LibraryPageTests(test_utils.GenericTestBase):

    def setUp(self):
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)

    def test_library_page(self):
        """Test access to the library page."""
        response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
        response.mustcontain('<oppia-root></oppia-root>')

    def test_library_handler_demo_exploration(self):
        """Test the library data handler on demo explorations."""
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual({
            'is_super_admin': False,
            'activity_list': [],
            'search_cursor': None
        }, response_dict)

        # Load a public demo exploration.
        exp_services.load_demo('0')
        self.process_and_flush_pending_tasks()

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['activity_list']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

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
        self.process_and_flush_pending_tasks()

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['activity_list']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'A new category',
            'title': 'A new title!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

    def test_library_handler_for_created_explorations(self):
        """Test the library data handler for manually created explorations."""
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.login(self.CURRICULUM_ADMIN_EMAIL)
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertDictContainsSubset({
            'is_super_admin': False,
            'activity_list': [],
            'user_email': self.CURRICULUM_ADMIN_EMAIL,
            'username': self.CURRICULUM_ADMIN_USERNAME,
            'search_cursor': None,
        }, response_dict)

        # Create exploration A.
        exploration = self.save_new_valid_exploration(
            'A', self.admin_id, title='Title A', category='Category A',
            objective='Objective A')
        exp_models = (
            exp_services._compute_models_for_updating_exploration( # pylint: disable=protected-access
                self.admin_id,
                exploration,
                'Exploration A',
                []
            )
        )
        datastore_services.update_timestamps_multi(exp_models)
        datastore_services.put_multi(exp_models)

        # Test that the private exploration isn't displayed.
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual(response_dict['activity_list'], [])

        # Create exploration B.
        exploration = self.save_new_valid_exploration(
            'B', self.admin_id, title='Title B', category='Category B',
            objective='Objective B')
        exp_models = (
            exp_services._compute_models_for_updating_exploration( # pylint: disable=protected-access
                self.admin_id,
                exploration,
                'Exploration B',
                []
            )
        )
        datastore_services.update_timestamps_multi(exp_models)
        datastore_services.put_multi(exp_models)
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
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][1])
        self.assertDictContainsSubset({
            'id': 'A',
            'category': 'Category A',
            'title': 'Title A',
            'language_code': 'en',
            'objective': 'Objective A',
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
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
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

    def test_library_handler_with_exceeding_query_limit_logs_error(self):
        response_dict = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)
        self.assertEqual({
            'is_super_admin': False,
            'activity_list': [],
            'search_cursor': None
        }, response_dict)

        # Load a public demo exploration.
        exp_services.load_demo('0')

        observed_log_messages = []

        def _mock_logging_function(msg, *_):
            """Mocks logging.error()."""
            observed_log_messages.append(msg)

        logging_swap = self.swap(logging, 'exception', _mock_logging_function)
        default_query_limit_swap = self.swap(feconf, 'DEFAULT_QUERY_LIMIT', 1)
        # Load the search results with an empty query.
        with default_query_limit_swap, logging_swap:
            self.get_json(feconf.LIBRARY_SEARCH_DATA_URL)

            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                '1 activities were fetched to load the library page. '
                'You may be running up against the default query limits.')

    def test_library_handler_with_given_category_and_language_code(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL)

        exp_id = exp_fetchers.get_new_exploration_id()
        self.save_new_valid_exploration(exp_id, self.admin_id)
        self.publish_exploration(self.admin_id, exp_id)
        exp_services.index_explorations_given_ids([exp_id])
        response_dict = self.get_json(
            feconf.LIBRARY_SEARCH_DATA_URL, params={
                'category': '("Algebra")',
                'language_code': '("en")'
            })
        activity_list = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [exp_id]))

        self.assertEqual(response_dict['activity_list'], activity_list)

        self.logout()

    def test_library_handler_with_invalid_category(self):
        response_1 = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL, params={
            'category': 'missing-outer-parens',
            'language_code': '("en")'
        }, expected_status_int=400)

        error_msg = (
            'Schema validation for \'category\' failed: Validation '
            'failed: is_search_query_string ({}) for '
            'object missing-outer-parens'
        )
        self.assertEqual(response_1['error'], error_msg)

        response_2 = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL, params={
            'category': '(missing-inner-quotes)',
            'language_code': '("en")'
        }, expected_status_int=400)

        error_msg = (
            'Schema validation for \'category\' failed: Validation '
            'failed: is_search_query_string ({}) for '
            'object (missing-inner-quotes)'
        )
        self.assertEqual(response_2['error'], error_msg)

    def test_library_handler_with_invalid_language_code(self):
        response_1 = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL, params={
            'category': '("A category")',
            'language_code': 'missing-outer-parens'
        }, expected_status_int=400)

        error_msg = (
            'Schema validation for \'language_code\' failed: Validation '
            'failed: is_search_query_string ({}) for '
            'object missing-outer-parens'
        )
        self.assertEqual(response_1['error'], error_msg)

        response_2 = self.get_json(feconf.LIBRARY_SEARCH_DATA_URL, params={
            'category': '("A category")',
            'language_code': '(missing-inner-quotes)'
        }, expected_status_int=400)

        error_msg = (
            'Schema validation for \'language_code\' failed: Validation '
            'failed: is_search_query_string ({}) for '
            'object (missing-inner-quotes)'
        )
        self.assertEqual(response_2['error'], error_msg)


class LibraryIndexHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_library_index_handler_for_user_preferred_language(self):
        """Test whether the handler returns the correct language preference."""
        # Since the default language is 'en', the language preference for the
        # viewer is changed to 'de' to test if the preference returned is user's
        # preference.
        self.login(self.VIEWER_EMAIL)
        # Check if the language preference is default.
        response_dict = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertDictContainsSubset({
            'activity_summary_dicts_by_category': [],
            'preferred_language_codes': ['en'],
        }, response_dict)

        csrf_token = self.get_new_csrf_token()

        # Change the user's preferred language to de.
        self.put_json(
            feconf.PREFERENCES_DATA_URL,
            {'update_type': 'preferred_language_codes', 'data': ['de']},
            csrf_token=csrf_token)
        response_dict = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertDictContainsSubset({
            'activity_summary_dicts_by_category': [],
            'preferred_language_codes': ['de'],
        }, response_dict)

    def test_library_index_handler_update_top_rated_activity_summary_dict(self):
        """Test the handler for top rated explorations."""
        response_dict = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertDictContainsSubset({
            'activity_summary_dicts_by_category': [],
            'preferred_language_codes': ['en'],
        }, response_dict)

        # Load a demo.
        exp_services.load_demo('0')
        rating_services.assign_rating_to_exploration('user', '0', 2)
        response_dict = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)

        self.assertEqual(
            len(response_dict['activity_summary_dicts_by_category']), 1)
        self.assertDictContainsSubset({
            'preferred_language_codes': ['en'],
        }, response_dict)
        activity_summary_dicts_by_category = (
            response_dict['activity_summary_dicts_by_category'][0])
        self.assertDictContainsSubset({
            'categories': [],
            'header_i18n_id': (
                feconf.LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS),
            'has_full_results_page': True,
            'full_results_url': feconf.LIBRARY_TOP_RATED_URL,
            'protractor_id': 'top-rated',
        }, activity_summary_dicts_by_category)

        activity_summary_dicts = (
            activity_summary_dicts_by_category['activity_summary_dicts'])
        self.assertEqual(
            len(activity_summary_dicts), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, activity_summary_dicts[0])

    def test_library_index_handler_updates_featured_activity_summary_dict(self):
        """Test the handler for featured explorations."""
        response_dict = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertDictContainsSubset({
            'activity_summary_dicts_by_category': [],
            'preferred_language_codes': ['en'],
        }, response_dict)

        # Load a demo.
        exp_services.load_demo('0')
        exploration_ref = activity_domain.ActivityReference(
            constants.ACTIVITY_TYPE_EXPLORATION, '0')
        activity_services.update_featured_activity_references([exploration_ref])

        response_dict = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)

        self.assertEqual(
            len(response_dict['activity_summary_dicts_by_category']), 1)
        self.assertDictContainsSubset({
            'preferred_language_codes': ['en'],
        }, response_dict)
        activity_summary_dicts_by_category = (
            response_dict['activity_summary_dicts_by_category'][0])

        self.assertDictContainsSubset({
            'categories': [],
            'header_i18n_id': (
                feconf.LIBRARY_CATEGORY_FEATURED_ACTIVITIES),
            'has_full_results_page': False,
            'full_results_url': None,
        }, activity_summary_dicts_by_category)

        activity_summary_dicts = (
            activity_summary_dicts_by_category['activity_summary_dicts'])

        self.assertEqual(
            len(activity_summary_dicts), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, activity_summary_dicts[0])


class LibraryGroupPageTests(test_utils.GenericTestBase):

    def setUp(self):
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_library_group_pages(self):
        """Test access to the top rated and recently published pages."""
        self.get_html_response(feconf.LIBRARY_TOP_RATED_URL)

        self.get_html_response(feconf.LIBRARY_RECENTLY_PUBLISHED_URL)

    def test_library_group_page_for_user_preferred_language(self):
        """Test whether the handler returns the correct language preference."""
        # Since the default language is 'en', the language preference for the
        # viewer is changed to 'de' to test if the preference returned is user's
        # preference.
        self.login(self.VIEWER_EMAIL)
        # Check if the language preference is default.
        response_dict = self.get_json(feconf.LIBRARY_INDEX_DATA_URL)
        self.assertDictContainsSubset({
            'activity_summary_dicts_by_category': [],
            'preferred_language_codes': ['en'],
        }, response_dict)

        csrf_token = self.get_new_csrf_token()

        self.put_json(
            feconf.PREFERENCES_DATA_URL,
            {'update_type': 'preferred_language_codes', 'data': ['de']},
            csrf_token=csrf_token)

        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED})
        self.assertDictContainsSubset({
            'preferred_language_codes': ['de'],
        }, response_dict)

    def test_handler_for_recently_published_library_group_page(self):
        """Test library handler for recently published group page."""
        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_RECENTLY_PUBLISHED})
        self.assertDictContainsSubset({
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
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])

    def test_handler_for_top_rated_library_group_page(self):
        """Test library handler for top rated group page."""

        # Load a public demo exploration.
        exp_services.load_demo('0')

        response_dict = self.get_json(
            feconf.LIBRARY_GROUP_DATA_URL,
            params={'group_name': feconf.LIBRARY_GROUP_TOP_RATED})
        self.assertDictContainsSubset({
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
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
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
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][0])
        self.assertDictContainsSubset({
            'id': '0',
            'category': 'Welcome',
            'title': 'Welcome to Oppia!',
            'language_code': 'en',
            'objective': 'become familiar with Oppia\'s capabilities',
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, response_dict['activity_list'][1])


class CategoryConfigTests(test_utils.GenericTestBase):

    def test_thumbnail_icons_exist_for_each_category(self):
        all_categories = list(constants.CATEGORIES_TO_COLORS.keys())

        # Test that an icon exists for each default category.
        for category in all_categories:
            utils.get_file_contents(os.path.join(
                self.get_static_asset_filepath(), 'assets', 'images',
                'subjects', '%s.svg' % category.replace(' ', '')))

        # Test that the default icon exists.
        utils.get_file_contents(os.path.join(
            self.get_static_asset_filepath(), 'assets', 'images', 'subjects',
            '%s.svg' % constants.DEFAULT_THUMBNAIL_ICON))


class LibraryRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old 'gallery' page URL to the
    library index page."""

    def test_old_gallery_page_url(self):
        """Test to validate that the old gallery page url redirects
        to the library index page.
        """
        response = self.get_html_response('/gallery', expected_status_int=302)
        self.assertEqual(
            'http://localhost/community-library', response.headers['location'])


class ExplorationSummariesHandlerTests(test_utils.GenericTestBase):

    PRIVATE_EXP_ID_EDITOR = 'eid0'
    PUBLIC_EXP_ID_EDITOR = 'eid1'
    PRIVATE_EXP_ID_VIEWER = 'eid2'

    def setUp(self):
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.editor = user_services.get_user_actions_info(self.editor_id)

        self.save_new_valid_exploration(
            self.PRIVATE_EXP_ID_EDITOR, self.editor_id)
        self.save_new_valid_exploration(
            self.PUBLIC_EXP_ID_EDITOR, self.editor_id)
        self.save_new_valid_exploration(
            self.PRIVATE_EXP_ID_VIEWER, self.viewer_id)

        rights_manager.publish_exploration(
            self.editor, self.PUBLIC_EXP_ID_EDITOR)

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
            rights_domain.ROLE_EDITOR)

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


class CollectionSummariesHandlerTests(test_utils.GenericTestBase):
    """Test Collection Summaries Handler."""

    def test_access_collection(self):
        response_dict = self.get_json(
            feconf.COLLECTION_SUMMARIES_DATA_URL,
            params={'stringified_collection_ids': json.dumps('0')})
        self.assertDictContainsSubset({
            'summaries': [],
        }, response_dict)

        # Load a collection.
        collection_services.load_demo('0')
        response_dict = self.get_json(
            feconf.COLLECTION_SUMMARIES_DATA_URL,
            params={'stringified_collection_ids': json.dumps('0')})
        self.assertEqual(len(response_dict['summaries']), 1)
        self.assertDictContainsSubset({
            'id': '0',
            'title': 'Introduction to Collections in Oppia',
            'category': 'Welcome',
            'objective': 'To introduce collections using demo explorations.',
            'language_code': 'en',
            'tags': [],
            'node_count': 4,
        }, response_dict['summaries'][0])
