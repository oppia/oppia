# coding: utf-8
#
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

"""Unit tests for core.domain.exp_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import logging
import os
import re
import zipfile

from core.domain import classifier_services
from core.domain import draft_upgrade_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import param_domain
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import state_domain
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(exp_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.user])
gae_image_services = models.Registry.import_gae_image_services()
search_services = models.Registry.import_search_services()
transaction_services = models.Registry.import_transaction_services()

# TODO(msl): Test ExpSummaryModel changes if explorations are updated,
# reverted, deleted, created, rights changed.


def count_at_least_editable_exploration_summaries(user_id):
    """Counts exp summaries that are at least editable by the given user.

    Args:
        user_id: unicode. The id of the given user.

    Returns:
        int. The number of exploration summaries that are at least editable
            by the given user.
    """
    return len(exp_fetchers.get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_at_least_editable(
            user_id=user_id)))


class ExplorationServicesUnitTests(test_utils.GenericTestBase):
    """Test the exploration services module."""
    EXP_0_ID = 'An_exploration_0_id'
    EXP_1_ID = 'An_exploration_1_id'

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(ExplorationServicesUnitTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.user_id_admin)


class ExplorationRevertClassifierTests(ExplorationServicesUnitTests):
    """Test that classifier models are correctly mapped when an exploration
    is reverted.
    """

    def test_reverting_an_exploration_maintains_classifier_models(self):
        """Test that when exploration is reverted to previous version
        it maintains appropriate classifier models mapping.
        """
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            self.save_new_valid_exploration(
                self.EXP_0_ID, self.owner_id, title='Bridges in England',
                category='Architecture', language_code='en')

        interaction_answer_groups = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': 'abc'},
            }],
            'outcome': {
                'dest': feconf.DEFAULT_INIT_STATE_NAME,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Try again</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': ['answer1', 'answer2', 'answer3'],
            'tagged_skill_misconception_id': None
        }]

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': interaction_answer_groups
        })]

        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            with self.swap(feconf, 'MIN_TOTAL_TRAINING_EXAMPLES', 2):
                with self.swap(feconf, 'MIN_ASSIGNED_LABELS', 1):
                    exp_services.update_exploration(
                        self.owner_id, self.EXP_0_ID, change_list, '')

        exp = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        job = classifier_services.get_classifier_training_jobs(
            self.EXP_0_ID, exp.version, [feconf.DEFAULT_INIT_STATE_NAME])[0]
        self.assertIsNotNone(job)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'A new title'
        })]

        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            with self.swap(feconf, 'MIN_TOTAL_TRAINING_EXAMPLES', 2):
                with self.swap(feconf, 'MIN_ASSIGNED_LABELS', 1):
                    exp_services.update_exploration(
                        self.owner_id, self.EXP_0_ID, change_list, '')

                    exp = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
                    # Revert exploration to previous version.
                    exp_services.revert_exploration(
                        self.owner_id, self.EXP_0_ID, exp.version,
                        exp.version - 1)

        exp = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        new_job = classifier_services.get_classifier_training_jobs(
            self.EXP_0_ID, exp.version, [feconf.DEFAULT_INIT_STATE_NAME])[0]
        self.assertIsNotNone(new_job)
        self.assertEqual(job.job_id, new_job.job_id)


class ExplorationQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests query methods."""

    def test_get_exploration_titles_and_categories(self):
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories([]), {})

        self.save_new_default_exploration('A', self.owner_id, title='TitleA')
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A']), {
                'A': {
                    'category': 'A category',
                    'title': 'TitleA'
                }
            })

        self.save_new_default_exploration('B', self.owner_id, title='TitleB')
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A']), {
                'A': {
                    'category': 'A category',
                    'title': 'TitleA'
                }
            })
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A', 'B']), {
                'A': {
                    'category': 'A category',
                    'title': 'TitleA',
                },
                'B': {
                    'category': 'A category',
                    'title': 'TitleB',
                },
            })
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A', 'C']), {
                'A': {
                    'category': 'A category',
                    'title': 'TitleA'
                }
            })

    def test_get_interaction_id_for_state(self):
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        exp = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exp.has_state_name('Introduction'), True)
        self.assertEqual(exp.has_state_name('Fake state name'), False)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                'Introduction', exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput'), '')
        self.assertEqual(exp_services.get_interaction_id_for_state(
            self.EXP_0_ID, 'Introduction'), 'MultipleChoiceInput')
        with self.assertRaisesRegexp(
            Exception, 'There exist no state in the exploration'):
            exp_services.get_interaction_id_for_state(
                self.EXP_0_ID, 'Fake state name')


class ExplorationSummaryQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests exploration query methods which operate on ExplorationSummary
    objects.
    """
    EXP_ID_0 = '0_en_arch_bridges_in_england'
    EXP_ID_1 = '1_fi_arch_sillat_suomi'
    EXP_ID_2 = '2_en_welcome_introduce_oppia'
    EXP_ID_3 = '3_en_welcome_introduce_oppia_interactions'
    EXP_ID_4 = '4_en_welcome'
    EXP_ID_5 = '5_fi_welcome_vempain'
    EXP_ID_6 = '6_en_languages_learning_basic_verbs_in_spanish'
    EXP_ID_7 = '7_en_languages_private_exploration_in_spanish'

    def setUp(self):
        super(ExplorationSummaryQueriesUnitTests, self).setUp()

        # Setup the explorations to fit into 2 different categoriers and 2
        # different language groups. Also, ensure 2 of them have similar
        # titles.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id, title='Introduce Oppia',
            category='Welcome', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.owner_id,
            title='Introduce Interactions in Oppia',
            category='Welcome', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_4, self.owner_id, title='Welcome',
            category='Welcome', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_5, self.owner_id, title='Tervetuloa Oppia',
            category='Welcome', language_code='fi')
        self.save_new_valid_exploration(
            self.EXP_ID_6, self.owner_id,
            title='Learning basic verbs in Spanish',
            category='Languages', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_7, self.owner_id,
            title='Private exploration in Spanish',
            category='Languages', language_code='en')

        # Publish explorations 0-6. Private explorations should not show up in
        # a search query, even if they're indexed.
        rights_manager.publish_exploration(self.owner, self.EXP_ID_0)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_1)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_2)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_3)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_4)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_5)
        rights_manager.publish_exploration(self.owner, self.EXP_ID_6)

        # Add the explorations to the search index.
        exp_services.index_explorations_given_ids([
            self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3,
            self.EXP_ID_4, self.EXP_ID_5, self.EXP_ID_6])

    def _create_search_query(self, terms, categories, languages):
        """Creates search query from list of arguments.

        Args:
            terms: list(str). A list of terms to be added in the query.
            categories: list(str). A list of categories to be added in the
                query.
            languages: list(str). A list of languages to be added in the query.

        Returns:
            str. A search query string.
        """
        query = ' '.join(terms)
        if categories:
            query += ' category=(' + ' OR '.join([
                '"%s"' % category for category in categories]) + ')'
        if languages:
            query += ' language_code=(' + ' OR '.join([
                '"%s"' % language for language in languages]) + ')'
        return query

    def test_get_exploration_summaries_with_no_query(self):
        # An empty query should return all explorations.
        (exp_ids, search_cursor) = (
            exp_services.get_exploration_ids_matching_query(''))
        self.assertEqual(sorted(exp_ids), [
            self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3,
            self.EXP_ID_4, self.EXP_ID_5, self.EXP_ID_6
        ])
        self.assertIsNone(search_cursor)

    def test_get_exploration_summaries_with_deleted_explorations(self):
        # Ensure a deleted exploration does not show up in search results.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_0)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_1)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_3)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_5)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_6)

        exp_ids = (
            exp_services.get_exploration_ids_matching_query(''))[0]
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_4])

        exp_services.delete_exploration(self.owner_id, self.EXP_ID_2)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_4)

        # If no explorations are loaded, a blank query should not get any
        # explorations.
        self.assertEqual(
            exp_services.get_exploration_ids_matching_query(''),
            ([], None))

    def test_get_exploration_summaries_with_deleted_explorations_multi(self):
        # Ensure a deleted exploration does not show up in search results.
        exp_services.delete_explorations(
            self.owner_id,
            [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3,
             self.EXP_ID_5, self.EXP_ID_6])

        exp_ids = (
            exp_services.get_exploration_ids_matching_query(''))[0]
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_4])

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_ID_2, self.EXP_ID_4])

        # If no explorations are loaded, a blank query should not get any
        # explorations.
        self.assertEqual(
            exp_services.get_exploration_ids_matching_query(''),
            ([], None))

    def test_get_subscribed_users_activity_ids_with_deleted_explorations(self):
        # Ensure a deleted exploration does not show up in subscribed users
        # activity ids.
        subscription_services.subscribe_to_exploration(
            self.owner_id, self.EXP_ID_0)
        self.assertIn(
            self.EXP_ID_0,
            subscription_services.get_exploration_ids_subscribed_to(
                self.owner_id))
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_0)
        self.process_and_flush_pending_tasks()
        self.assertNotIn(
            self.EXP_ID_0,
            subscription_services.get_exploration_ids_subscribed_to(
                self.owner_id))

    def test_search_exploration_summaries(self):
        # Search within the 'Architecture' category.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query([], ['Architecture'], []))
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_0, self.EXP_ID_1])

        # Search for explorations in Finnish.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query([], [], ['fi']))
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_1, self.EXP_ID_5])

        # Search for Finnish explorations in the 'Architecture' category.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query([], ['Architecture'], ['fi']))
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_1])

        # Search for explorations containing 'Oppia'.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query(['Oppia'], [], []))
        self.assertEqual(
            sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_3, self.EXP_ID_5])

        # Search for explorations containing 'Oppia' and 'Introduce'.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query(['Oppia', 'Introduce'], [], []))
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_3])

        # Search for explorations containing 'England' in English.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query(['England'], [], ['en']))
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_0])

        # Search for explorations containing 'in'.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query(['in'], [], []))
        self.assertEqual(
            sorted(exp_ids), [self.EXP_ID_0, self.EXP_ID_3, self.EXP_ID_6])

        # Search for explorations containing 'in' in the 'Architecture' and
        # 'Welcome' categories.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            self._create_search_query(['in'], ['Architecture', 'Welcome'], []))
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_0, self.EXP_ID_3])

    def test_exploration_summaries_pagination_in_filled_search_results(self):
        # Ensure the maximum number of explorations that can fit on the search
        # results page is maintained by the summaries function.
        with self.swap(feconf, 'SEARCH_RESULTS_PAGE_SIZE', 3):
            # Need to load 3 pages to find all of the explorations. Since the
            # returned order is arbitrary, we need to concatenate the results
            # to ensure all explorations are returned. We validate the correct
            # length is returned each time.
            found_exp_ids = []

            # Page 1: 3 initial explorations.
            (exp_ids, search_cursor) = (
                exp_services.get_exploration_ids_matching_query(
                    ''))
            self.assertEqual(len(exp_ids), 3)
            self.assertIsNotNone(search_cursor)
            found_exp_ids += exp_ids

            # Page 2: 3 more explorations.
            (exp_ids, search_cursor) = (
                exp_services.get_exploration_ids_matching_query(
                    '', cursor=search_cursor))
            self.assertEqual(len(exp_ids), 3)
            self.assertIsNotNone(search_cursor)
            found_exp_ids += exp_ids

            # Page 3: 1 final exploration.
            (exp_ids, search_cursor) = (
                exp_services.get_exploration_ids_matching_query(
                    '', cursor=search_cursor))
            self.assertEqual(len(exp_ids), 1)
            self.assertIsNone(search_cursor)
            found_exp_ids += exp_ids

            # Validate all explorations were seen.
            self.assertEqual(sorted(found_exp_ids), [
                self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3,
                self.EXP_ID_4, self.EXP_ID_5, self.EXP_ID_6])

    def test_get_exploration_ids_matching_query_with_stale_exploration_ids(
            self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        search_results_page_size_swap = self.swap(
            feconf, 'SEARCH_RESULTS_PAGE_SIZE', 6)
        max_iterations_swap = self.swap(exp_services, 'MAX_ITERATIONS', 1)

        def _mock_delete_documents_from_index(unused_doc_ids, unused_index):
            """Mocks delete_documents_from_index() so that the exploration is
            not deleted from the document on deleting the exploration. This is
            required to fetch stale exploration ids.
            """
            pass

        with self.swap(
            search_services, 'delete_documents_from_index',
            _mock_delete_documents_from_index):
            exp_services.delete_exploration(self.owner_id, self.EXP_ID_0)
            exp_services.delete_exploration(self.owner_id, self.EXP_ID_1)

        with logging_swap, search_results_page_size_swap, max_iterations_swap:
            (exp_ids, _) = (
                exp_services.get_exploration_ids_matching_query(''))

        self.assertEqual(
            observed_log_messages,
            [
                'Search index contains stale exploration ids: '
                '1_fi_arch_sillat_suomi, 0_en_arch_bridges_in_england',
                'Could not fulfill search request for query string ; at '
                'least 1 retries were needed.'
            ]
        )
        self.assertEqual(len(exp_ids), 4)


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_soft_deletion_of_exploration(self):
        """Test that soft deletion of exploration works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        # The exploration shows up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 1)

        exp_services.delete_exploration(self.owner_id, self.EXP_0_ID)
        with self.assertRaises(Exception):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # But the model still exists in the backend.
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_0_ID))

        # The exploration summary is deleted, however.
        self.assertIsNone(exp_models.ExpSummaryModel.get_by_id(self.EXP_0_ID))

        # The delete commit exists.
        self.assertIsNotNone(
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-%s' % (self.EXP_0_ID, 1)))

        # The snapshot models exist.
        exp_snapshot_id = (
            exp_models.ExplorationModel.get_snapshot_id(self.EXP_0_ID, 1))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                exp_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                exp_snapshot_id))
        exp_rights_snapshot_id = (
            exp_models.ExplorationRightsModel.get_snapshot_id(self.EXP_0_ID, 1))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                exp_rights_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                exp_rights_snapshot_id))

    def test_deletion_of_multiple_explorations_empty(self):
        """Test that delete_explorations with empty list works correctly."""
        exp_services.delete_explorations(self.owner_id, [])
        self.process_and_flush_pending_tasks()

    def test_soft_deletion_of_multiple_explorations(self):
        """Test that soft deletion of explorations works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        # The explorations show up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 2)

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])
        with self.assertRaises(Exception):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        with self.assertRaises(Exception):
            exp_fetchers.get_exploration_by_id(self.EXP_1_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # But the models still exist in the backend.
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_0_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_1_ID))

        # The exploration summaries are deleted, however.
        self.assertIsNone(exp_models.ExpSummaryModel.get_by_id(self.EXP_0_ID))
        self.assertIsNone(exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID))

        # The delete commits exist.
        self.assertIsNotNone(
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-%s' % (self.EXP_0_ID, 1)))
        self.assertIsNotNone(
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-%s' % (self.EXP_1_ID, 1)))

        # The snapshot models exist.
        exp_0_snapshot_id = (
            exp_models.ExplorationModel.get_snapshot_id(self.EXP_0_ID, 1))
        exp_1_snapshot_id = (
            exp_models.ExplorationModel.get_snapshot_id(self.EXP_1_ID, 1))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                exp_0_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                exp_0_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                exp_1_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                exp_1_snapshot_id))
        exp_0_rights_snapshot_id = (
            exp_models.ExplorationRightsModel.get_snapshot_id(self.EXP_0_ID, 1))
        exp_1_rights_snapshot_id = (
            exp_models.ExplorationRightsModel.get_snapshot_id(self.EXP_1_ID, 1))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                exp_0_rights_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                exp_0_rights_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                exp_1_rights_snapshot_id))
        self.assertIsNotNone(
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                exp_1_rights_snapshot_id))

    def test_hard_deletion_of_exploration(self):
        """Test that hard deletion of exploration works correctly."""
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        # The exploration shows up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 1)

        exp_services.delete_exploration(
            self.owner_id, self.EXP_0_ID, force_deletion=True)
        with self.assertRaises(Exception):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # The exploration model has been purged from the backend.
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_0_ID))

    def test_hard_deletion_of_multiple_explorations(self):
        """Test that hard deletion of explorations works correctly."""
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        # The explorations show up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 2)

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID], force_deletion=True)
        with self.assertRaises(Exception):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        with self.assertRaises(Exception):
            exp_fetchers.get_exploration_by_id(self.EXP_1_ID)

        # The deleted explorations does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # The exploration models have been purged from the backend.
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_0_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_1_ID))

        # The exploration summary models have been purged from the backend.
        self.assertIsNone(
            exp_models.ExpSummaryModel.get_by_id(self.EXP_0_ID))
        self.assertIsNone(
            exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID))

    def test_summaries_of_hard_deleted_explorations(self):
        """Test that summaries of hard deleted explorations are
        correctly deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)

        exp_services.delete_exploration(
            self.owner_id, self.EXP_0_ID, force_deletion=True)
        with self.assertRaises(Exception):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        # The deleted exploration summary does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # The exploration summary model has been purged from the backend.
        self.assertIsNone(
            exp_models.ExpSummaryModel.get_by_id(self.EXP_0_ID))

    def test_exploration_is_removed_from_index_when_deleted(self):
        """Tests that exploration is removed from the search index when
        deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)

        def mock_delete_docs(doc_ids, index):
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(doc_ids, [self.EXP_0_ID])

        delete_docs_swap = self.swap(
            search_services, 'delete_documents_from_index', mock_delete_docs)

        with delete_docs_swap:
            exp_services.delete_exploration(self.owner_id, self.EXP_0_ID)

    def test_explorations_are_removed_from_index_when_deleted(self):
        """Tests that explorations are removed from the search index when
        deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)

        def mock_delete_docs(doc_ids, index):
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(doc_ids, [self.EXP_0_ID, self.EXP_1_ID])

        delete_docs_swap = self.swap(
            search_services, 'delete_documents_from_index', mock_delete_docs)

        with delete_docs_swap:
            exp_services.delete_explorations(
                self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])

    def test_no_errors_are_raised_when_creating_default_exploration(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_0_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)

    def test_that_default_exploration_fails_strict_validation(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_0_ID)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'This state does not have any interaction specified.'
            ):
            exploration.validate(strict=True)

    def test_save_and_retrieve_exploration(self):
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'param_specs',
                'new_value': {
                    'theParameter':
                        param_domain.ParamSpec('UnicodeString').to_dict()
                }
            })],
            '')

        retrieved_exploration = exp_fetchers.get_exploration_by_id(
            self.EXP_0_ID)
        self.assertEqual(retrieved_exploration.title, 'A title')
        self.assertEqual(retrieved_exploration.category, 'A category')
        self.assertEqual(len(retrieved_exploration.states), 1)
        self.assertEqual(len(retrieved_exploration.param_specs), 1)
        self.assertEqual(
            list(retrieved_exploration.param_specs.keys())[0], 'theParameter')

    def test_save_and_retrieve_exploration_summary(self):
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)

        # Change param spec.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'param_specs',
                'new_value': {
                    'theParameter':
                        param_domain.ParamSpec('UnicodeString').to_dict()
                }
            })], '')

        # Change title and category.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'A new title'
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'category',
                'new_value': 'A new category'
            })], 'Change title and category')

        retrieved_exp_summary = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_0_ID)

        self.assertEqual(retrieved_exp_summary.title, 'A new title')
        self.assertEqual(retrieved_exp_summary.category, 'A new category')
        self.assertEqual(retrieved_exp_summary.contributor_ids, [self.owner_id])

    def test_update_exploration_by_migration_bot(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='end')
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USER_ID, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'New title'
                })], 'Did migration.')

    def test_update_exploration_by_migration_bot_not_updates_contribution_model(
            self):
        user_services.create_user_contributions(
            feconf.MIGRATION_BOT_USER_ID, [], [])
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='end')
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertTrue(
            self.EXP_0_ID not in (
                migration_bot_contributions_model.edited_exploration_ids))

        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USER_ID, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'New title'
                })], 'Did migration.')

        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertTrue(
            self.EXP_0_ID not in (
                migration_bot_contributions_model.edited_exploration_ids))

    def test_update_exploration_by_migration_bot_not_updates_settings_model(
            self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='end')
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USER_ID, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'New title'
                })], 'Did migration.')

        migration_bot_settings_model = (
            user_services.get_user_settings_from_username(
                feconf.MIGRATION_BOT_USERNAME))
        self.assertEqual(migration_bot_settings_model, None)

    def test_get_multiple_explorations_from_model_by_id(self):
        rights_manager.create_new_exploration_rights(
            'exp_id_1', self.owner_id)

        exploration_model = exp_models.ExplorationModel(
            id='exp_id_1',
            category='category 1',
            title='title 1',
            objective='objective 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME
        )

        exploration_model.commit(
            self.owner_id, 'exploration model created',
            [{
                'cmd': 'create',
                'title': 'title 1',
                'category': 'category 1',
            }])

        rights_manager.create_new_exploration_rights(
            'exp_id_2', self.owner_id)

        exploration_model = exp_models.ExplorationModel(
            id='exp_id_2',
            category='category 2',
            title='title 2',
            objective='objective 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME
        )

        exploration_model.commit(
            self.owner_id, 'exploration model created',
            [{
                'cmd': 'create',
                'title': 'title 2',
                'category': 'category 2',
            }])

        explorations = exp_fetchers.get_multiple_explorations_by_id(
            ['exp_id_1', 'exp_id_2'])

        self.assertEqual(len(explorations), 2)
        self.assertEqual(explorations['exp_id_1'].title, 'title 1')
        self.assertEqual(explorations['exp_id_1'].category, 'category 1')
        self.assertEqual(
            explorations['exp_id_1'].objective, 'objective 1')

        self.assertEqual(explorations['exp_id_2'].title, 'title 2')
        self.assertEqual(explorations['exp_id_2'].category, 'category 2')
        self.assertEqual(
            explorations['exp_id_2'].objective, 'objective 2')

    def test_get_state_classifier_mapping(self):
        yaml_path = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        with python_utils.open_file(
            yaml_path, 'rb', encoding=None) as yaml_file:
            yaml_content = yaml_file.read()

        exploration = exp_fetchers.get_exploration_by_id('exp_id', strict=False)
        self.assertIsNone(exploration)

        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, yaml_content, 'exp_id', [])

        state_classifier_mapping = exp_services.get_user_exploration_data(
            'user_id', 'exp_id')['state_classifier_mapping']

        self.assertEqual(len(state_classifier_mapping), 1)

        self.assertEqual(
            state_classifier_mapping['Home']['data_schema_version'], 1)
        self.assertEqual(
            state_classifier_mapping['Home']['algorithm_id'], 'TextClassifier')

    def test_cannot_get_multiple_explorations_by_version_with_invalid_handler(
            self):
        rights_manager.create_new_exploration_rights(
            'exp_id_1', self.owner_id)

        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: {
                'content': [{'type': 'text', 'value': ''}],
                'param_changes': [],
                'interaction': {
                    'customization_args': {},
                    'id': 'Continue',
                    'handlers': [{
                        'name': 'invalid_handler_name',
                        'rule_specs': [{
                            'dest': 'END',
                            'feedback': [],
                            'param_changes': [],
                            'definition': {'rule_type': 'default'}
                        }]
                    }]
                },
            }
        }

        exploration_model = exp_models.ExplorationModel(
            id='exp_id_1',
            category='category 1',
            title='title 1',
            objective='objective 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states_schema_version=3,
            states=states_dict
        )

        exploration_model.commit(
            self.owner_id, 'exploration model created',
            [{
                'cmd': 'create',
                'title': 'title 1',
                'category': 'category 1',
            }])

        with self.assertRaisesRegexp(
            Exception,
            re.escape(
                'Exploration exp_id_1, versions [1] could not be converted to '
                'latest schema version.')):
            exp_fetchers.get_multiple_explorations_by_version('exp_id_1', [1])


class LoadingAndDeletionOfExplorationDemosTests(ExplorationServicesUnitTests):

    def test_loading_and_validation_and_deletion_of_demo_explorations(self):
        """Test loading, validation and deletion of the demo explorations."""
        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(), 0)

        demo_exploration_ids = list(feconf.DEMO_EXPLORATIONS.keys())
        self.assertGreaterEqual(
            len(demo_exploration_ids), 1,
            msg='There must be at least one demo exploration.')

        for exp_id in demo_exploration_ids:
            start_time = datetime.datetime.utcnow()

            exp_services.load_demo(exp_id)
            exploration = exp_fetchers.get_exploration_by_id(exp_id)
            exploration.validate(strict=True)

            duration = datetime.datetime.utcnow() - start_time
            processing_time = duration.seconds + python_utils.divide(
                duration.microseconds, 1E6)
            self.log_line(
                'Loaded and validated exploration %s (%.2f seconds)' %
                (exploration.title, processing_time))

        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(),
            len(demo_exploration_ids))

        for exp_id in demo_exploration_ids:
            exp_services.delete_demo(exp_id)
        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(), 0)

    def test_load_demo_with_invalid_demo_exploration_id_raises_error(self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid demo exploration id invalid_exploration_id'):
            exp_services.load_demo('invalid_exploration_id')

    def test_delete_demo_with_invalid_demo_exploration_id_raises_error(self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid demo exploration id invalid_exploration_id'):
            exp_services.delete_demo('invalid_exploration_id')


class ExplorationYamlImportingTests(test_utils.GenericTestBase):
    """Tests for loading explorations using imported YAML."""
    EXP_ID = 'exp_id0'
    DEMO_EXP_ID = '0'
    TEST_ASSET_PATH = 'test_asset.file'
    TEST_ASSET_CONTENT = 'Hello Oppia'

    INTRO_AUDIO_FILE = 'introduction_state.mp3'
    ANSWER_GROUP_AUDIO_FILE = 'correct_answer_feedback.mp3'
    DEFAULT_OUTCOME_AUDIO_FILE = 'unknown_answer_feedback.mp3'
    HINT_AUDIO_FILE = 'answer_hint.mp3'
    SOLUTION_AUDIO_FILE = 'answer_solution.mp3'

    YAML_WITH_AUDIO_TRANSLATIONS = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 23
states:
  Introduction:
    classifier_model_id: null
    content:
      audio_translations:
        en:
            filename: %s
            file_size_bytes: 99999
            needs_update: false
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: New state
          feedback:
            audio_translations:
                en:
                    filename: %s
                    file_size_bytes: 99999
                    needs_update: false
            html: Correct!
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x: InputString
          rule_type: Equals
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: Introduction
        feedback:
          audio_translations:
            en:
                filename: %s
                file_size_bytes: 99999
                needs_update: false
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
        - hint_content:
            html: hint one,
            audio_translations:
                en:
                    filename: %s
                    file_size_bytes: 99999
                    needs_update: false
      id: TextInput
      solution:
        answer_is_exclusive: false
        correct_answer: helloworld!
        explanation:
            html: hello_world is a string
            audio_translations:
                en:
                    filename: %s
                    file_size_bytes: 99999
                    needs_update: false
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: New state
        feedback:
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    param_changes: []
states_schema_version: 18
tags: []
title: Title
""") % (
    INTRO_AUDIO_FILE, ANSWER_GROUP_AUDIO_FILE, DEFAULT_OUTCOME_AUDIO_FILE,
    HINT_AUDIO_FILE, SOLUTION_AUDIO_FILE)

    def setUp(self):
        super(ExplorationYamlImportingTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_loading_recent_yaml_loads_exploration_for_user(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exp.to_yaml(), self.SAMPLE_YAML_CONTENT)

    def test_loading_recent_yaml_does_not_default_exp_title_category(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertNotEqual(exp.title, feconf.DEFAULT_EXPLORATION_TITLE)
        self.assertNotEqual(exp.category, feconf.DEFAULT_EXPLORATION_CATEGORY)

    def test_loading_untitled_yaml_defaults_exploration_title_category(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_UNTITLED_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exp.title, feconf.DEFAULT_EXPLORATION_TITLE)
        self.assertEqual(exp.category, feconf.DEFAULT_EXPLORATION_CATEGORY)

    def test_loading_old_yaml_migrates_exp_to_latest_schema_version(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_UNTITLED_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exp.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_loading_yaml_with_assets_loads_assets_from_filesystem(self):
        test_asset = (self.TEST_ASSET_PATH, self.TEST_ASSET_CONTENT)
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [test_asset])

        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertEqual(
            fs.get(self.TEST_ASSET_PATH), self.TEST_ASSET_CONTENT)

    def test_can_load_yaml_with_voiceovers(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.YAML_WITH_AUDIO_TRANSLATIONS, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        state = exp.states[exp.init_state_name]
        interaction = state.interaction
        content_id = state.content.content_id
        voiceovers_mapping = state.recorded_voiceovers.voiceovers_mapping
        content_voiceovers = voiceovers_mapping[content_id]
        feedback_id = interaction.answer_groups[0].outcome.feedback.content_id
        answer_group_voiceovers = voiceovers_mapping[feedback_id]
        default_outcome_id = interaction.default_outcome.feedback.content_id
        default_outcome_voiceovers = voiceovers_mapping[default_outcome_id]
        hint_id = interaction.hints[0].hint_content.content_id
        hint_voiceovers = voiceovers_mapping[hint_id]
        solution_id = interaction.solution.explanation.content_id
        solution_voiceovers = voiceovers_mapping[solution_id]

        self.assertEqual(
            content_voiceovers['en'].filename, self.INTRO_AUDIO_FILE)
        self.assertEqual(
            answer_group_voiceovers['en'].filename,
            self.ANSWER_GROUP_AUDIO_FILE)
        self.assertEqual(
            default_outcome_voiceovers['en'].filename,
            self.DEFAULT_OUTCOME_AUDIO_FILE)
        self.assertEqual(hint_voiceovers['en'].filename, self.HINT_AUDIO_FILE)
        self.assertEqual(
            solution_voiceovers['en'].filename, self.SOLUTION_AUDIO_FILE)

    def test_can_load_yaml_with_stripped_voiceovers(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.YAML_WITH_AUDIO_TRANSLATIONS, self.EXP_ID, [],
            strip_voiceovers=True)
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        state = exp.states[exp.init_state_name]
        interaction = state.interaction
        content_id = state.content.content_id
        voiceovers_mapping = state.recorded_voiceovers.voiceovers_mapping
        content_voiceovers = voiceovers_mapping[content_id]
        feedback_id = interaction.answer_groups[0].outcome.feedback.content_id
        answer_group_voiceovers = voiceovers_mapping[feedback_id]
        default_outcome_id = interaction.default_outcome.feedback.content_id
        default_outcome_voiceovers = voiceovers_mapping[default_outcome_id]
        hint_id = interaction.hints[0].hint_content.content_id
        hint_voiceovers = voiceovers_mapping[hint_id]
        solution_id = interaction.solution.explanation.content_id
        solution_voiceovers = voiceovers_mapping[solution_id]

        self.assertEqual(content_voiceovers, {})
        self.assertEqual(answer_group_voiceovers, {})
        self.assertEqual(default_outcome_voiceovers, {})
        self.assertEqual(hint_voiceovers, {})
        self.assertEqual(solution_voiceovers, {})

    def test_cannot_load_yaml_with_no_schema_version(self):
        yaml_with_no_schema_version = ("""
        author_notes: ''
        auto_tts_enabled: true
        blurb: ''
        category: Category
        correctness_feedback_enabled: false
        init_state_name: Introduction
        language_code: en
        objective: ''
        param_changes: []
        param_specs: {}
        states:
          Introduction:
            classifier_model_id: null
            content:
              audio_translations:
                en:
                    filename: %s
                    file_size_bytes: 99999
                    needs_update: false
              html: ''
            interaction:
              answer_groups:
              - outcome:
                  dest: New state
                  feedback:
                    audio_translations:
                        en:
                            filename: %s
                            file_size_bytes: 99999
                            needs_update: false
                    html: Correct!
                  labelled_as_correct: false
                  missing_prerequisite_skill_id: null
                  param_changes: []
                  refresher_exploration_id: null
                rule_specs:
                - inputs:
                    x: InputString
                  rule_type: Equals
              confirmed_unclassified_answers: []
              customization_args: {}
              default_outcome:
                dest: Introduction
                feedback:
                  audio_translations:
                    en:
                        filename: %s
                        file_size_bytes: 99999
                        needs_update: false
                  html: ''
                labelled_as_correct: false
                missing_prerequisite_skill_id: null
                param_changes: []
                refresher_exploration_id: null
              hints:
                - hint_content:
                    html: hint one,
                    audio_translations:
                        en:
                            filename: %s
                            file_size_bytes: 99999
                            needs_update: false
              id: TextInput
              solution:
                answer_is_exclusive: false
                correct_answer: helloworld!
                explanation:
                    html: hello_world is a string
                    audio_translations:
                        en:
                            filename: %s
                            file_size_bytes: 99999
                            needs_update: false
            param_changes: []
          New state:
            classifier_model_id: null
            content:
              audio_translations: {}
              html: ''
            interaction:
              answer_groups: []
              confirmed_unclassified_answers: []
              customization_args: {}
              default_outcome:
                dest: New state
                feedback:
                  audio_translations: {}
                  html: ''
                labelled_as_correct: false
                missing_prerequisite_skill_id: null
                param_changes: []
                refresher_exploration_id: null
              hints: []
              id: null
              solution: null
            param_changes: []
        states_schema_version: 18
        tags: []
        title: Title
        """) % (
            self.INTRO_AUDIO_FILE, self.ANSWER_GROUP_AUDIO_FILE,
            self.DEFAULT_OUTCOME_AUDIO_FILE,
            self.HINT_AUDIO_FILE, self.SOLUTION_AUDIO_FILE)

        with self.assertRaisesRegexp(
            Exception, 'Invalid YAML file: missing schema version'):
            exp_services.save_new_exploration_from_yaml_and_assets(
                self.owner_id, yaml_with_no_schema_version, self.EXP_ID, None)


class GetImageFilenamesFromExplorationTests(ExplorationServicesUnitTests):

    def test_get_image_filenames_from_exploration(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title='title', category='category')
        exploration.add_states(['state1', 'state2', 'state3'])
        state1 = exploration.states['state1']
        state2 = exploration.states['state2']
        state3 = exploration.states['state3']
        content1_dict = {
            'content_id': 'content',
            'html': (
                '<blockquote>Hello, this is state1</blockquote>'
                '<oppia-noninteractive-image filepath-with-value='
                '"&amp;quot;s1Content.png&amp;quot;" caption-with-value='
                '"&amp;quot;&amp;quot;" alt-with-value="&amp;quot;&amp;quot;">'
                '</oppia-noninteractive-image>')
        }
        content2_dict = {
            'content_id': 'content',
            'html': '<pre>Hello, this is state2</pre>'
        }
        content3_dict = {
            'content_id': 'content',
            'html': '<p>Hello, this is state3</p>'
        }
        state1.update_content(
            state_domain.SubtitledHtml.from_dict(content1_dict))
        state2.update_content(
            state_domain.SubtitledHtml.from_dict(content2_dict))
        state3.update_content(
            state_domain.SubtitledHtml.from_dict(content3_dict))

        state1.update_interaction_id('ImageClickInput')
        state2.update_interaction_id('MultipleChoiceInput')
        state3.update_interaction_id('ItemSelectionInput')

        customization_args_dict1 = {
            'highlightRegionsOnHover': {'value': True},
            'imageAndRegions': {
                'value': {
                    'imagePath': 's1ImagePath.png',
                    'labeledRegions': [{
                        'label': 'classdef',
                        'region': {
                            'area': [
                                [0.004291845493562232, 0.004692192192192192],
                                [0.40987124463519314, 0.05874624624624625]
                            ],
                            'regionType': 'Rectangle'
                        }
                    }]
                }
            }
        }
        customization_args_dict2 = {
            'choices': {'value': [
                (
                    '<p>This is value1 for MultipleChoice'
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&amp;quot;s2Choice1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;&amp;quot;"></oppia-noninteractive-image></p>'
                ),
                (
                    '<p>This is value2 for MultipleChoice'
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&amp;quot;s2Choice2.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    '</p></p>')
            ]}
        }
        customization_args_dict3 = {
            'choices': {'value': [
                (
                    '<p>This is value1 for ItemSelection'
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&amp;quot;s3Choice1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    '</p>'),
                (
                    '<p>This is value2 for ItemSelection'
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&amp;quot;s3Choice2.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    '</p>'),
                (
                    '<p>This is value3 for ItemSelection'
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&amp;quot;s3Choice3.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            ]}
        }
        state1.update_interaction_customization_args(customization_args_dict1)
        state2.update_interaction_customization_args(customization_args_dict2)
        state3.update_interaction_customization_args(customization_args_dict3)

        default_outcome1 = state_domain.Outcome(
            'state2', state_domain.SubtitledHtml(
                'default_outcome', '<p>Default outcome for state1</p>'),
            False, [], None, None
        )
        state1.update_interaction_default_outcome(default_outcome1)

        hint_list2 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1',
                    (
                        '<p>Hello, this is html1 for state2</p>'
                        '<oppia-noninteractive-image filepath-with-value="'
                        '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                        '"&amp;quot;&amp;quot;" alt-with-value='
                        '"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    )
                )
            ),
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_2', '<p>Hello, this is html2 for state2</p>')
            ),
        ]
        state2.update_interaction_hints(hint_list2)

        answer_group_list2 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': 0}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': 1}
            }],
            'outcome': {
                'dest': 'state1',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': (
                        '<p>Outcome1 for state2</p><oppia-noninteractive-image'
                        ' filepath-with-value='
                        '"&amp;quot;s2AnswerGroup.png&amp;quot;"'
                        ' caption-with-value="&amp;quot;&amp;quot;"'
                        ' alt-with-value="&amp;quot;&amp;quot;">'
                        '</oppia-noninteractive-image>')
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }, {
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': 0}
            }],
            'outcome': {
                'dest': 'state3',
                'feedback': {
                    'content_id': 'feedback_2',
                    'html': '<p>Outcome2 for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]
        answer_group_list3 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': [
                    (
                        '<p>This is value1 for ItemSelection</p>'
                        '<oppia-noninteractive-image filepath-with-value='
                        '"&amp;quot;s3Choice1.png&amp;quot;"'
                        ' caption-with-value="&amp;quot;&amp;quot;" '
                        'alt-with-value="&amp;quot;&amp;quot;">'
                        '</oppia-noninteractive-image>')
                ]}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': [
                    (
                        '<p>This is value3 for ItemSelection</p>'
                        '<oppia-noninteractive-image filepath-with-value='
                        '"&amp;quot;s3Choice3.png&amp;quot;"'
                        ' caption-with-value="&amp;quot;&amp;quot;" '
                        'alt-with-value="&amp;quot;&amp;quot;">'
                        '</oppia-noninteractive-image>')
                ]}
            }],
            'outcome': {
                'dest': 'state1',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Outcome for state3</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]
        state2.update_interaction_answer_groups(answer_group_list2)
        state3.update_interaction_answer_groups(answer_group_list3)

        filenames = (
            exp_services.get_image_filenames_from_exploration(exploration))
        expected_output = ['s1ImagePath.png', 's1Content.png', 's2Choice1.png',
                           's2Choice2.png', 's3Choice1.png', 's3Choice2.png',
                           's3Choice3.png', 's2Hint1.png',
                           's2AnswerGroup.png']
        self.assertEqual(len(filenames), len(expected_output))
        for filename in expected_output:
            self.assertIn(filename, filenames)


# pylint: disable=protected-access
class ZipFileExportUnitTests(ExplorationServicesUnitTests):
    """Test export methods for explorations represented as zip files."""

    SAMPLE_YAML_CONTENT = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: A category
correctness_feedback_enabled: false
init_state_name: %s
language_code: en
objective: The objective
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: %s
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: New state
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: %d
tags: []
title: A title
""" % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_STATE_SCHEMA_VERSION))

    UPDATED_YAML_CONTENT = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: A category
correctness_feedback_enabled: false
init_state_name: %s
language_code: en
objective: The objective
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: %s
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
  Renamed state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value: ''
        rows:
          value: 1
      default_outcome:
        dest: Renamed state
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: %d
tags: []
title: A title
""" % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_STATE_SCHEMA_VERSION))

    def test_export_to_zip_file(self):
        """Test the export_to_zip_file() method."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective')
        init_state = exploration.states[exploration.init_state_name]
        default_outcome_dict = init_state.interaction.default_outcome.to_dict()
        default_outcome_dict['dest'] = exploration.init_state_name
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
                    'state_name': exploration.init_state_name,
                    'new_value': default_outcome_dict
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'New state',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'New state',
                    'new_value': 'TextInput'
                })], 'Add state name')

        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(python_utils.string_io(
            buffer_value=zip_file_output))

        self.assertEqual(zf.namelist(), ['A title.yaml'])
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)

    def test_export_to_zip_file_with_unpublished_exploration(self):
        """Test the export_to_zip_file() method."""
        self.save_new_default_exploration(
            self.EXP_0_ID, self.owner_id, title='')

        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(python_utils.string_io(
            buffer_value=zip_file_output))

        self.assertEqual(zf.namelist(), ['Unpublished_exploration.yaml'])

    def test_export_to_zip_file_with_assets(self):
        """Test exporting an exploration with assets to a zip file."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective')
        init_state = exploration.states[exploration.init_state_name]
        default_outcome_dict = init_state.interaction.default_outcome.to_dict()
        default_outcome_dict['dest'] = exploration.init_state_name
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
                    'state_name': exploration.init_state_name,
                    'new_value': default_outcome_dict
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'New state',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'New state',
                    'new_value': 'TextInput'
                })], 'Add state name')

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID))
        fs.commit('abc.png', raw_image)

        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(python_utils.string_io(
            buffer_value=zip_file_output))

        self.assertEqual(zf.namelist(), ['A title.yaml', 'assets/abc.png'])
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)
        self.assertEqual(zf.open('assets/abc.png').read(), raw_image)

    def test_export_by_versions(self):
        """Test export_to_zip_file() for different versions."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective')
        self.assertEqual(exploration.version, 1)

        init_state = exploration.states[exploration.init_state_name]
        default_outcome_dict = init_state.interaction.default_outcome.to_dict()
        default_outcome_dict['dest'] = exploration.init_state_name
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
            'state_name': exploration.init_state_name,
            'new_value': default_outcome_dict
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        })]
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID))
        fs.commit('abc.png', raw_image)
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.version, 2)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'New state',
            'new_state_name': 'Renamed state'
        })]
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.version, 3)

        # Download version 2.
        zip_file_output = exp_services.export_to_zip_file(
            self.EXP_0_ID, version=2)
        zf = zipfile.ZipFile(python_utils.string_io(
            buffer_value=zip_file_output))
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)

        # Download version 3.
        zip_file_output = exp_services.export_to_zip_file(
            self.EXP_0_ID, version=3)
        zf = zipfile.ZipFile(python_utils.string_io(
            buffer_value=zip_file_output))
        self.assertEqual(
            zf.open('A title.yaml').read(), self.UPDATED_YAML_CONTENT)


class YAMLExportUnitTests(ExplorationServicesUnitTests):
    """Test export methods for explorations represented as a dict whose keys
    are state names and whose values are YAML strings representing the state's
    contents.
    """
    _SAMPLE_INIT_STATE_CONTENT = ("""classifier_model_id: null
content:
  content_id: content
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    placeholder:
      value: ''
    rows:
      value: 1
  default_outcome:
    dest: %s
    feedback:
      content_id: default_outcome
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    content: {}
    default_outcome: {}
solicit_answer_details: false
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
""") % (feconf.DEFAULT_INIT_STATE_NAME)

    SAMPLE_EXPORTED_DICT = {
        feconf.DEFAULT_INIT_STATE_NAME: _SAMPLE_INIT_STATE_CONTENT,
        'New state': ("""classifier_model_id: null
content:
  content_id: content
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    placeholder:
      value: ''
    rows:
      value: 1
  default_outcome:
    dest: New state
    feedback:
      content_id: default_outcome
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    content: {}
    default_outcome: {}
solicit_answer_details: false
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
""")
    }

    UPDATED_SAMPLE_DICT = {
        feconf.DEFAULT_INIT_STATE_NAME: _SAMPLE_INIT_STATE_CONTENT,
        'Renamed state': ("""classifier_model_id: null
content:
  content_id: content
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    placeholder:
      value: ''
    rows:
      value: 1
  default_outcome:
    dest: Renamed state
    feedback:
      content_id: default_outcome
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    content: {}
    default_outcome: {}
solicit_answer_details: false
written_translations:
  translations_mapping:
    content: {}
    default_outcome: {}
""")
    }

    def test_export_to_dict(self):
        """Test the export_to_dict() method."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective')
        init_state = exploration.states[exploration.init_state_name]
        default_outcome_dict = init_state.interaction.default_outcome.to_dict()
        default_outcome_dict['dest'] = exploration.init_state_name
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
                    'state_name': exploration.init_state_name,
                    'new_value': default_outcome_dict
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'New state',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'New state',
                    'new_value': 'TextInput'
                })], 'Add state name')

        dict_output = exp_services.export_states_to_yaml(
            self.EXP_0_ID, width=50)

        self.assertEqual(dict_output, self.SAMPLE_EXPORTED_DICT)

    def test_export_by_versions(self):
        """Test export_to_dict() for different versions."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)
        self.assertEqual(exploration.version, 1)

        init_state = exploration.states[exploration.init_state_name]
        default_outcome_dict = init_state.interaction.default_outcome.to_dict()
        default_outcome_dict['dest'] = exploration.init_state_name
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
            'state_name': exploration.init_state_name,
            'new_value': default_outcome_dict
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        })]
        exploration.objective = 'The objective'
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID))
        fs.commit('abc.png', raw_image)
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.version, 2)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'New state',
            'new_state_name': 'Renamed state'
        })]
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.version, 3)

        # Download version 2.
        dict_output = exp_services.export_states_to_yaml(
            self.EXP_0_ID, version=2, width=50)
        self.assertEqual(dict_output, self.SAMPLE_EXPORTED_DICT)

        # Download version 3.
        dict_output = exp_services.export_states_to_yaml(
            self.EXP_0_ID, version=3, width=50)
        self.assertEqual(dict_output, self.UPDATED_SAMPLE_DICT)


def _get_change_list(state_name, property_name, new_value):
    """Generates a change list for a single state change."""
    return [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'state_name': state_name,
        'property_name': property_name,
        'new_value': new_value
    })]


class UpdateStateTests(ExplorationServicesUnitTests):
    """Test updating a single state."""

    def setUp(self):
        super(UpdateStateTests, self).setUp()
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)

        self.init_state_name = exploration.init_state_name

        self.param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'myParam',
            'generator_id': 'RandomSelector'
        }]
        # List of answer groups to add into an interaction.
        self.interaction_answer_groups = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': 0},
            }],
            'outcome': {
                'dest': self.init_state_name,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Try again</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]
        # Default outcome specification for an interaction.
        self.interaction_default_outcome = {
            'dest': self.init_state_name,
            'feedback': {
                'content_id': 'default_outcome',
                'html': '<p><strong>Incorrect</strong></p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        }

    def test_add_state_cmd(self):
        """Test adding of states."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        self.assertNotIn('new state', exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
            })], 'Add state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertIn('new state', exploration.states)

    def test_rename_state_cmd(self):
        """Test updating of state name."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        self.assertIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': 'state',
            })], 'Change state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertIn('state', exploration.states)
        self.assertNotIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

    def test_rename_state_cmd_with_unicode(self):
        """Test updating of state name to one that uses unicode characters."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        self.assertNotIn(u'¡Hola! αβγ', exploration.states)
        self.assertIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': u'¡Hola! αβγ',
            })], 'Change state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertIn(u'¡Hola! αβγ', exploration.states)
        self.assertNotIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

    def test_delete_state_cmd(self):
        """Test deleting a state name."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
            })], 'Add state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        self.assertIn('new state', exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_DELETE_STATE,
                'state_name': 'new state',
            })], 'delete state')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertNotIn('new state', exploration.states)

    def test_update_param_changes(self):
        """Test updating of param_changes."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        exp_services._save_exploration(self.owner_id, exploration, '', [])
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'param_changes', self.param_changes), '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        param_changes = exploration.init_state.param_changes[0]
        self.assertEqual(param_changes._name, 'myParam')
        self.assertEqual(param_changes._generator_id, 'RandomSelector')
        self.assertEqual(
            param_changes._customization_args,
            {'list_of_values': ['1', '2'], 'parse_with_jinja': False})

    def test_update_invalid_param_changes(self):
        """Check that updates cannot be made to non-existent parameters."""
        with self.assertRaisesRegexp(
            utils.ValidationError,
            r'The parameter with name \'myParam\' .* does not exist .*'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                '')

    def test_update_reserved_param_changes(self):
        param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'all',
            'generator_id': 'RandomSelector'
        }]
        with self.assertRaisesRegexp(
            utils.ValidationError,
            r'The parameter name \'all\' is reserved. Please choose '
            'a different name for the parameter being set in'):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name, 'param_changes', param_changes),
                '')

    def test_update_invalid_generator(self):
        """Test for check that the generator_id in param_changes exists."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        exp_services._save_exploration(self.owner_id, exploration, '', [])

        self.param_changes[0]['generator_id'] = 'fake'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid generator id fake'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                '')

    def test_update_interaction_id(self):
        """Test updating of interaction_id."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput'), '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.interaction.id, 'MultipleChoiceInput')

    def test_update_interaction_customization_args(self):
        """Test updating of interaction customization_args."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput') +
            _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {'choices': {'value': ['Option A', 'Option B']}}),
            '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.interaction.customization_args[
                'choices']['value'], ['Option A', 'Option B'])

    def test_update_interaction_handlers_fails(self):
        """Test legacy interaction handler updating."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State 2',
            })] + _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'TextInput'),
            'Add state name')

        self.interaction_default_outcome['dest'] = 'State 2'
        with self.assertRaisesRegexp(
            utils.InvalidInputException,
            'Editing interaction handlers is no longer supported'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_HANDLERS,
                    self.interaction_answer_groups),
                '')

    def test_update_interaction_answer_groups(self):
        """Test updating of interaction_answer_groups."""
        # We create a second state to use as a rule destination.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State 2',
            })] + _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'TextInput'),
            'Add state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.interaction_default_outcome['dest'] = 'State 2'
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput') +
            _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
                self.interaction_answer_groups) +
            _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
                self.interaction_default_outcome),
            '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        init_state = exploration.init_state
        init_interaction = init_state.interaction
        rule_specs = init_interaction.answer_groups[0].rule_specs
        outcome = init_interaction.answer_groups[0].outcome
        self.assertEqual(rule_specs[0].rule_type, 'Equals')
        self.assertEqual(rule_specs[0].inputs, {'x': 0})
        self.assertEqual(outcome.feedback.html, '<p>Try again</p>')
        self.assertEqual(outcome.dest, self.init_state_name)
        self.assertEqual(init_interaction.default_outcome.dest, 'State 2')

    def test_update_state_invalid_state(self):
        """Test that rule destination states cannot be non-existent."""
        self.interaction_answer_groups[0]['outcome']['dest'] = 'INVALID'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'The destination INVALID is not a valid state'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
                    self.interaction_answer_groups) +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
                    self.interaction_default_outcome),
                '')

    def test_update_state_missing_keys(self):
        """Test that missing keys in interaction_answer_groups produce an
        error.
        """
        del self.interaction_answer_groups[0]['rule_specs'][0]['inputs']
        with self.assertRaisesRegexp(KeyError, 'inputs'):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ID, 'NumericInput') +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
                    self.interaction_answer_groups) +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
                    self.interaction_default_outcome),
                '')

    def test_update_state_variable_types(self):
        """Test that parameters in rules must have the correct type."""
        self.interaction_answer_groups[0]['rule_specs'][0][
            'inputs']['x'] = 'abc'
        with self.assertRaisesRegexp(
            Exception,
            'abc has the wrong type. It should be a NonnegativeInt.'):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'MultipleChoiceInput') +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
                    self.interaction_answer_groups) +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
                    self.interaction_default_outcome),
                '')

    def test_update_content(self):
        """Test updating of content."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content',
                }),
            '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.content.html,
            '<p><strong>Test content</strong></p>')

    def test_add_translation(self):
        """Test updating of content."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        self.assertEqual(exploration.get_translation_counts(), {})

        change_list = _get_change_list(
            self.init_state_name, 'content', {
                'html': '<p><strong>Test content</strong></p>',
                'content_id': 'content',
            })

        change_list.append(exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': self.init_state_name,
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '<p><strong>Test content</strong></p>',
            'translation_html': '<p>Translated text</p>'
        }))
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        self.assertEqual(exploration.get_translation_counts(), {
            'hi': 1
        })

    def test_update_solicit_answer_details(self):
        """Test updating of solicit_answer_details."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.solicit_answer_details, False)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS,
                True),
            '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.solicit_answer_details, True)

    def test_update_solicit_answer_details_with_non_bool_fails(self):
        """Test updating of solicit_answer_details with non bool value."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.solicit_answer_details, False)
        with self.assertRaisesRegexp(
            Exception, (
                'Expected solicit_answer_details to be a bool, received ')):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS,
                    'abc'),
                '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.solicit_answer_details, False)

    def test_update_content_missing_key(self):
        """Test that missing keys in content yield an error."""
        with self.assertRaisesRegexp(KeyError, 'content_id'):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name, 'content', {
                        'html': '<b>Test content</b>',
                    }),
                '')

    def test_update_written_translations(self):
        """Test update content translations."""
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'hi': {
                        'html': '<p>Test!</p>',
                        'needs_update': True
                    }
                },
                'default_outcome': {}
            }
        }
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'written_translations',
                written_translations_dict), 'Added text translations.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.written_translations.to_dict(),
            written_translations_dict)

    def test_update_written_translations_with_list_fails(self):
        """Test update content translation with a list fails."""
        with self.assertRaisesRegexp(
            Exception, 'Expected written_translations to be a dict, received '):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name, 'written_translations',
                    [1, 2]), 'Added fake text translations.')


class CommitMessageHandlingTests(ExplorationServicesUnitTests):
    """Test the handling of commit messages."""

    def setUp(self):
        super(CommitMessageHandlingTests, self).setUp()
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')
        self.init_state_name = exploration.init_state_name

    def test_record_commit_message(self):
        """Check published explorations record commit messages."""
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_STICKY,
                False), 'A message')

        self.assertEqual(
            exp_services.get_exploration_snapshots_metadata(
                self.EXP_0_ID)[1]['commit_message'],
            'A message')

    def test_demand_commit_message(self):
        """Check published explorations demand commit messages."""
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        with self.assertRaisesRegexp(
            ValueError,
            'Exploration is public so expected a commit message but received '
            'none.'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_STICKY, False), '')

    def test_unpublished_explorations_can_accept_commit_message(self):
        """Test unpublished explorations can accept optional commit messages."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_STICKY, False
            ), 'A message')

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_STICKY, True
            ), '')

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_STICKY, True
            ), None)


class ExplorationSnapshotUnitTests(ExplorationServicesUnitTests):
    """Test methods relating to exploration snapshots."""
    SECOND_USERNAME = 'abc123'
    SECOND_EMAIL = 'abc123@gmail.com'

    def test_get_last_updated_by_human_ms(self):
        original_timestamp = utils.get_current_time_in_millisecs()

        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        timestamp_after_first_edit = utils.get_current_time_in_millisecs()

        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USER_ID, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'New title'
                })], 'Did migration.')

        self.assertLess(
            original_timestamp,
            exp_services.get_last_updated_by_human_ms(self.EXP_0_ID))
        self.assertLess(
            exp_services.get_last_updated_by_human_ms(self.EXP_0_ID),
            timestamp_after_first_edit)

    def test_get_exploration_snapshots_metadata(self):
        self.signup(self.SECOND_EMAIL, self.SECOND_USERNAME)
        second_committer_id = self.get_user_id_from_email(self.SECOND_EMAIL)

        v1_exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 1)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category',
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertIn('created_on_ms', snapshots_metadata[0])

        # Publish the exploration. This does not affect the exploration version
        # history.
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 1)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertIn('created_on_ms', snapshots_metadata[0])

        # Modify the exploration. This affects the exploration version history.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'First title'
        })]
        change_list_dict = [change.to_dict() for change in change_list]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed title.')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 2)
        self.assertIn('created_on_ms', snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list_dict,
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[1])
        self.assertLess(
            snapshots_metadata[0]['created_on_ms'],
            snapshots_metadata[1]['created_on_ms'])

        # Using the old version of the exploration should raise an error.
        with self.assertRaisesRegexp(Exception, 'version 1, which is too old'):
            exp_services._save_exploration(
                second_committer_id, v1_exploration, '', [])

        # Another person modifies the exploration.
        new_change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'New title'
        })]
        new_change_list_dict = [change.to_dict() for change in new_change_list]

        exp_services.update_exploration(
            second_committer_id, self.EXP_0_ID, new_change_list,
            'Second commit.')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New exploration created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list_dict,
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[1])
        self.assertDictContainsSubset({
            'commit_cmds': new_change_list_dict,
            'committer_id': second_committer_id,
            'commit_message': 'Second commit.',
            'commit_type': 'edit',
            'version_number': 3,
        }, snapshots_metadata[2])
        self.assertLess(
            snapshots_metadata[1]['created_on_ms'],
            snapshots_metadata[2]['created_on_ms'])

    def test_versioning_with_add_and_delete_states(self):

        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)

        exploration.title = 'First title'
        exp_services._save_exploration(
            self.owner_id, exploration, 'Changed title.', [])
        commit_dict_2 = {
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'version_number': 2,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 2)

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        })]
        exp_services.update_exploration(
            'second_committer_id', exploration.id, change_list,
            'Added new state')

        commit_dict_3 = {
            'committer_id': 'second_committer_id',
            'commit_message': 'Added new state',
            'version_number': 3,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset(
            commit_dict_3, snapshots_metadata[2])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        for ind in python_utils.RANGE(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # Perform an invalid action: delete a state that does not exist. This
        # should not create a new version.
        with self.assertRaisesRegexp(ValueError, 'does not exist'):
            exploration.delete_state('invalid_state_name')

        # Now delete the new state.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_DELETE_STATE,
            'state_name': 'New state'
        })]
        exp_services.update_exploration(
            'committer_id_3', exploration.id, change_list,
            'Deleted state: New state')

        commit_dict_4 = {
            'committer_id': 'committer_id_3',
            'commit_message': 'Deleted state: New state',
            'version_number': 4,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 4)
        self.assertDictContainsSubset(commit_dict_4, snapshots_metadata[3])
        self.assertDictContainsSubset(commit_dict_3, snapshots_metadata[2])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        for ind in python_utils.RANGE(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # The final exploration should have exactly one state.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(len(exploration.states), 1)

    def test_versioning_with_reverting(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)

        # In version 1, the title was 'A title'.
        # In version 2, the title becomes 'V2 title'.
        exploration.title = 'V2 title'
        exp_services._save_exploration(
            self.owner_id, exploration, 'Changed title.', [])

        # In version 3, a new state is added.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        })]
        exp_services.update_exploration(
            'committer_id_v3', exploration.id, change_list, 'Added new state')

        # It is not possible to revert from anything other than the most
        # current version.
        with self.assertRaisesRegexp(Exception, 'too old'):
            exp_services.revert_exploration(
                'committer_id_v4', self.EXP_0_ID, 2, 1)

        # Version 4 is a reversion to version 1.
        exp_services.revert_exploration('committer_id_v4', self.EXP_0_ID, 3, 1)
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.title, 'A title')
        self.assertEqual(len(exploration.states), 1)
        self.assertEqual(exploration.version, 4)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)

        commit_dict_4 = {
            'committer_id': 'committer_id_v4',
            'commit_message': 'Reverted exploration to version 1',
            'version_number': 4,
        }
        commit_dict_3 = {
            'committer_id': 'committer_id_v3',
            'commit_message': 'Added new state',
            'version_number': 3,
        }
        self.assertEqual(len(snapshots_metadata), 4)
        self.assertDictContainsSubset(commit_dict_3, snapshots_metadata[2])
        self.assertDictContainsSubset(commit_dict_4, snapshots_metadata[3])
        self.assertLess(
            snapshots_metadata[2]['created_on_ms'],
            snapshots_metadata[3]['created_on_ms'])


class ExplorationCommitLogUnitTests(ExplorationServicesUnitTests):
    """Test methods relating to the exploration commit log."""
    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'

    COMMIT_ALBERT_CREATE_EXP_1 = {
        'username': ALBERT_NAME,
        'version': 1,
        'exploration_id': EXP_ID_1,
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New exploration created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_BOB_EDIT_EXP_1 = {
        'username': BOB_NAME,
        'version': 2,
        'exploration_id': EXP_ID_1,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_CREATE_EXP_2 = {
        'username': ALBERT_NAME,
        'version': 1,
        'exploration_id': 'eid2',
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New exploration created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_EXP_1 = {
        'username': 'albert',
        'version': 3,
        'exploration_id': 'eid1',
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert1 title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_EXP_2 = {
        'username': 'albert',
        'version': 2,
        'exploration_id': 'eid2',
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert2.',
        'post_commit_status': 'private'
    }

    COMMIT_BOB_REVERT_EXP_1 = {
        'username': 'bob',
        'version': 4,
        'exploration_id': 'eid1',
        'commit_type': 'revert',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Reverted exploration to version 2',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_DELETE_EXP_1 = {
        'username': 'albert',
        'version': 5,
        'exploration_id': 'eid1',
        'commit_type': 'delete',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': feconf.COMMIT_MESSAGE_EXPLORATION_DELETED,
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_PUBLISH_EXP_2 = {
        'username': 'albert',
        'version': None,
        'exploration_id': 'eid2',
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': False,
        'commit_message': 'exploration published.',
        'post_commit_status': 'public'
    }

    def setUp(self):
        """Populate the database of explorations to be queried against.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Bob edits the title of EXP_ID_1.
        - (3) Albert creates EXP_ID_2.
        - (4) Albert edits the title of EXP_ID_1.
        - (5) Albert edits the title of EXP_ID_2.
        - (6) Bob reverts Albert's last edit to EXP_ID_1.
        - (7) Albert deletes EXP_ID_1.
        - Bob tries to publish EXP_ID_2, and is denied access.
        - (8) Albert publishes EXP_ID_2.
        """
        super(ExplorationCommitLogUnitTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.albert = user_services.UserActionsInfo(self.albert_id)
        self.bob = user_services.UserActionsInfo(self.bob_id)

        # This needs to be done in a toplevel wrapper because the datastore
        # puts to the event log are asynchronous.
        @transaction_services.toplevel_wrapper
        def populate_datastore():
            """Populates the database according to the sequence."""
            exploration_1 = self.save_new_valid_exploration(
                self.EXP_ID_1, self.albert_id)

            exploration_1.title = 'Exploration 1 title'
            exp_services._save_exploration(
                self.bob_id, exploration_1, 'Changed title.', [])

            exploration_2 = self.save_new_valid_exploration(
                self.EXP_ID_2, self.albert_id)

            exploration_1.title = 'Exploration 1 Albert title'
            exp_services._save_exploration(
                self.albert_id, exploration_1,
                'Changed title to Albert1 title.', [])

            exploration_2.title = 'Exploration 2 Albert title'
            exp_services._save_exploration(
                self.albert_id, exploration_2, 'Changed title to Albert2.', [])

            exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 3, 2)

            exp_services.delete_exploration(self.albert_id, self.EXP_ID_1)

            # This commit should not be recorded.
            with self.assertRaisesRegexp(
                Exception, 'This exploration cannot be published'
                ):
                rights_manager.publish_exploration(self.bob, self.EXP_ID_2)

            rights_manager.publish_exploration(self.albert, self.EXP_ID_2)

        populate_datastore()

    def test_get_next_page_of_all_non_private_commits_with_invalid_max_age(
            self):
        with self.assertRaisesRegexp(
            Exception,
            'max_age must be a datetime.timedelta instance. or None.'):
            exp_services.get_next_page_of_all_non_private_commits(
                max_age='invalid_max_age')

    def test_get_next_page_of_all_non_private_commits(self):
        all_commits = (
            exp_services.get_next_page_of_all_non_private_commits()[0])
        self.assertEqual(len(all_commits), 1)
        commit_dicts = [commit.to_dict() for commit in all_commits]
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_PUBLISH_EXP_2, commit_dicts[0])

        # TODO(frederikcreemers@gmail.com): Test max_age here.


class ExplorationSearchTests(ExplorationServicesUnitTests):
    """Test exploration search."""
    USER_ID_1 = 'user_1'
    USER_ID_2 = 'user_2'

    def test_index_explorations_given_ids(self):
        all_exp_ids = ['id0', 'id1', 'id2', 'id3', 'id4']
        expected_exp_ids = all_exp_ids[:-1]
        all_exp_titles = [
            'title 0', 'title 1', 'title 2', 'title 3', 'title 4']
        expected_exp_titles = all_exp_titles[:-1]
        all_exp_categories = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4']
        expected_exp_categories = all_exp_categories[:-1]

        def mock_add_documents_to_index(docs, index):
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)
            ids = [doc['id'] for doc in docs]
            titles = [doc['title'] for doc in docs]
            categories = [doc['category'] for doc in docs]
            self.assertEqual(set(ids), set(expected_exp_ids))
            self.assertEqual(set(titles), set(expected_exp_titles))
            self.assertEqual(set(categories), set(expected_exp_categories))
            return ids

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(
            search_services,
            'add_documents_to_index',
            add_docs_counter)

        for i in python_utils.RANGE(5):
            self.save_new_valid_exploration(
                all_exp_ids[i],
                self.owner_id,
                title=all_exp_titles[i],
                category=all_exp_categories[i])

        # We're only publishing the first 4 explorations, so we're not
        # expecting the last exploration to be indexed.
        for i in python_utils.RANGE(4):
            rights_manager.publish_exploration(
                self.owner, expected_exp_ids[i])

        with add_docs_swap:
            exp_services.index_explorations_given_ids(all_exp_ids)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_updated_exploration_is_added_correctly_to_index(self):
        exp_id = 'id0'
        exp_title = 'title 0'
        exp_category = 'cat0'
        actual_docs = []
        initial_exp_doc = {
            'category': 'cat0',
            'id': 'id0',
            'language_code': 'en',
            'objective': 'An objective',
            'rank': 20,
            'tags': [],
            'title': 'title 0'}
        updated_exp_doc = {
            'category': 'cat1',
            'id': 'id0',
            'language_code': 'en',
            'objective': 'An objective',
            'rank': 20,
            'tags': [],
            'title': 'title 0'
        }

        def mock_add_documents_to_index(docs, index):
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)
            actual_docs.extend(docs)

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(
            search_services,
            'add_documents_to_index',
            add_docs_counter)

        with add_docs_swap:
            self.save_new_valid_exploration(
                exp_id, self.owner_id, title=exp_title, category=exp_category,
                end_state_name='End')

            rights_manager.publish_exploration(self.owner, exp_id)
            self.assertEqual(actual_docs, [initial_exp_doc])
            self.assertEqual(add_docs_counter.times_called, 2)

            actual_docs = []
            exp_services.update_exploration(
                self.owner_id, exp_id, [
                    exp_domain.ExplorationChange({
                        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                        'property_name': 'category',
                        'new_value': 'cat1'})], 'update category')
            self.assertEqual(actual_docs, [updated_exp_doc])
            self.assertEqual(add_docs_counter.times_called, 3)


    def test_get_number_of_ratings(self):
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)
        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)

        self.assertEqual(exp_services.get_number_of_ratings(exp.ratings), 0)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_0_ID, 5)
        self.assertEqual(
            exp_services.get_number_of_ratings(exp.ratings), 1)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_0_ID, 3)
        self.process_and_flush_pending_tasks()
        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertEqual(
            exp_services.get_number_of_ratings(exp.ratings), 2)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_2, self.EXP_0_ID, 5)
        self.process_and_flush_pending_tasks()
        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertEqual(
            exp_services.get_number_of_ratings(exp.ratings), 3)

    def test_get_average_rating(self):
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)
        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)

        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 0)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_0_ID, 5)
        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 5)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_0_ID, 2)

        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 3.5)

    def test_get_lower_bound_wilson_rating_from_exp_summary(self):
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)
        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)

        self.assertEqual(
            exp_services.get_scaled_average_rating(exp.ratings), 0)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_0_ID, 5)
        self.assertAlmostEqual(
            exp_services.get_scaled_average_rating(exp.ratings),
            1.8261731658956, places=4)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_0_ID, 4)

        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertAlmostEqual(
            exp_services.get_scaled_average_rating(exp.ratings),
            2.056191454757, places=4)

    def test_valid_demo_file_path(self):
        for filename in os.listdir(feconf.SAMPLE_EXPLORATIONS_DIR):
            full_filepath = os.path.join(
                feconf.SAMPLE_EXPLORATIONS_DIR, filename)
            valid_exploration_path = os.path.isdir(full_filepath) or (
                filename.endswith('yaml'))
            self.assertTrue(valid_exploration_path)

    def test_get_demo_exploration_components_with_invalid_path_raises_error(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Unrecognized file path: invalid_path'):
            exp_services.get_demo_exploration_components('invalid_path')


class ExplorationSummaryTests(ExplorationServicesUnitTests):
    """Test exploration summaries."""
    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'

    def test_is_exp_summary_editable(self):
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)

        # Check that only the owner may edit.
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertTrue(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.owner_id))
        self.assertFalse(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.editor_id))
        self.assertFalse(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.viewer_id))

        # Owner makes viewer a viewer and editor an editor.
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_0_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_0_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertTrue(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.owner_id))
        self.assertTrue(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.editor_id))
        self.assertFalse(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.viewer_id))

    def test_contributors_not_updated_on_revert(self):
        """Test that a user who only makes a revert on an exploration
        is not counted in the list of that exploration's contributors.
        """
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)

        # Have Albert create a new exploration.
        self.save_new_valid_exploration(self.EXP_ID_1, albert_id)
        # Have Albert update that exploration.
        exp_services.update_exploration(
            albert_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        # Have Bob revert Albert's update.
        exp_services.revert_exploration(bob_id, self.EXP_ID_1, 2, 1)

        # Verify that only Albert (and not Bob, who has not made any non-
        # revert changes) appears in the contributors list for this
        # exploration.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_1)
        self.assertEqual([albert_id], exploration_summary.contributor_ids)

    def _check_contributors_summary(self, exp_id, expected):
        """Check if contributors summary of the given exp is same as expected.

        Args:
            exp_id: str. The id of the exploration.
            expected: dict(unicode, int). Expected summary.

        Raises:
            AssertionError: Contributors summary of the given exp is not same
                as expected.
        """
        contributors_summary = exp_fetchers.get_exploration_summary_by_id(
            exp_id).contributors_summary
        self.assertEqual(expected, contributors_summary)

    def test_contributors_summary(self):
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)

        # Have Albert create a new exploration. Version 1.
        self.save_new_valid_exploration(self.EXP_ID_1, albert_id)
        self._check_contributors_summary(self.EXP_ID_1, {albert_id: 1})

        # Have Bob update that exploration. Version 2.
        exp_services.update_exploration(
            bob_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 1, bob_id: 1})
        # Have Bob update that exploration. Version 3.
        exp_services.update_exploration(
            bob_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 1, bob_id: 2})

        # Have Albert update that exploration. Version 4.
        exp_services.update_exploration(
            albert_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 2, bob_id: 2})

        # Have Albert revert to version 3. Version 5.
        exp_services.revert_exploration(albert_id, self.EXP_ID_1, 4, 3)
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 1, bob_id: 2})

    def test_get_exploration_summary_by_id_with_invalid_exploration_id(self):
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            'invalid_exploration_id')

        self.assertIsNone(exploration_summary)


class ExplorationSummaryGetTests(ExplorationServicesUnitTests):
    """Test exploration summaries get_* functions."""
    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'
    EXP_ID_3 = 'eid3'

    EXPECTED_VERSION_1 = 4
    EXPECTED_VERSION_2 = 2

    def setUp(self):
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Bob edits the title of EXP_ID_1.
        - (3) Albert creates EXP_ID_2.
        - (4) Albert edits the title of EXP_ID_1.
        - (5) Albert edits the title of EXP_ID_2.
        - (6) Bob reverts Albert's last edit to EXP_ID_1.
        - Bob tries to publish EXP_ID_2, and is denied access.
        - (7) Albert publishes EXP_ID_2.
        - (8) Albert creates EXP_ID_3.
        - (9) Albert publishes EXP_ID_3.
        - (10) Albert deletes EXP_ID_3.
        """
        super(ExplorationSummaryGetTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.albert = user_services.UserActionsInfo(self.albert_id)
        self.bob = user_services.UserActionsInfo(self.bob_id)

        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)

        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')

        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            })], 'Changed title to Albert1 title.')

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_2, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 2 Albert title'
            })], 'Changed title to Albert2 title.')

        exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 3, 2)

        with self.assertRaisesRegexp(
            Exception, 'This exploration cannot be published'
            ):
            rights_manager.publish_exploration(self.bob, self.EXP_ID_2)

        rights_manager.publish_exploration(self.albert, self.EXP_ID_2)

        self.save_new_valid_exploration(self.EXP_ID_3, self.albert_id)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_3)
        exp_services.delete_exploration(self.albert_id, self.EXP_ID_3)

    def test_get_non_private_exploration_summaries(self):

        actual_summaries = exp_services.get_non_private_exploration_summaries()

        expected_summaries = {
            self.EXP_ID_2: exp_domain.ExplorationSummary(
                self.EXP_ID_2, 'Exploration 2 Albert title',
                'A category', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_manager.ACTIVITY_STATUS_PUBLIC,
                False, [self.albert_id], [], [], [], [self.albert_id],
                {self.albert_id: 1},
                self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
                )}

        # Check actual summaries equal expected summaries.
        self.assertEqual(list(actual_summaries.keys()),
                         list(expected_summaries.keys()))
        simple_props = ['id', 'title', 'category', 'objective',
                        'language_code', 'tags', 'ratings',
                        'scaled_average_rating', 'status',
                        'community_owned', 'owner_ids',
                        'editor_ids', 'voice_artist_ids', 'viewer_ids',
                        'contributor_ids', 'version',
                        'exploration_model_created_on',
                        'exploration_model_last_updated']
        for exp_id in actual_summaries:
            for prop in simple_props:
                self.assertEqual(getattr(actual_summaries[exp_id], prop),
                                 getattr(expected_summaries[exp_id], prop))

    def test_get_all_exploration_summaries(self):
        actual_summaries = exp_services.get_all_exploration_summaries()

        expected_summaries = {
            self.EXP_ID_1: exp_domain.ExplorationSummary(
                self.EXP_ID_1, 'Exploration 1 title',
                'A category', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_manager.ACTIVITY_STATUS_PRIVATE, False,
                [self.albert_id], [], [], [], [self.albert_id, self.bob_id],
                {self.albert_id: 1, self.bob_id: 1}, self.EXPECTED_VERSION_1,
                actual_summaries[self.EXP_ID_1].exploration_model_created_on,
                actual_summaries[self.EXP_ID_1].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_1].first_published_msec
            ),
            self.EXP_ID_2: exp_domain.ExplorationSummary(
                self.EXP_ID_2, 'Exploration 2 Albert title',
                'A category', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_manager.ACTIVITY_STATUS_PUBLIC,
                False, [self.albert_id], [], [], [], [self.albert_id],
                {self.albert_id: 1}, self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
            )
        }

        # Check actual summaries equal expected summaries.
        self.assertItemsEqual(actual_summaries, expected_summaries)


class ExplorationConversionPipelineTests(ExplorationServicesUnitTests):
    """Tests the exploration model -> exploration conversion pipeline."""
    OLD_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'

    UPGRADED_EXP_YAML = ("""author_notes: ''
auto_tts_enabled: true
blurb: ''
category: category
correctness_feedback_enabled: false
init_state_name: %s
language_code: en
objective: Old objective
param_changes: []
param_specs: {}
schema_version: %d
states:
  END:
    classifier_model_id: null
    content:
      content_id: content
      html: <p>Congratulations, you have finished!</p>
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        recommendedExplorationIds:
          value: []
      default_outcome: null
      hints: []
      id: EndExploration
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
  %s:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value: Continue
      default_outcome:
        dest: END
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: Continue
      solution: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: %d
tags: []
title: Old Title
""") % (
    python_utils.convert_to_bytes(feconf.DEFAULT_INIT_STATE_NAME),
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    python_utils.convert_to_bytes(feconf.DEFAULT_INIT_STATE_NAME),
    feconf.CURRENT_STATE_SCHEMA_VERSION)

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    def setUp(self):
        super(ExplorationConversionPipelineTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)

        # Create exploration that uses a states schema version of 0 and ensure
        # it is properly converted.
        self.save_new_exp_with_states_schema_v0(
            self.OLD_EXP_ID, self.albert_id, 'Old Title')

        # Create standard exploration that should not be converted.
        new_exp = self.save_new_valid_exploration(
            self.NEW_EXP_ID, self.albert_id)
        self._up_to_date_yaml = new_exp.to_yaml()

    def test_get_exploration_from_model_with_invalid_schema_version_raise_error(
            self):
        exp_model = exp_models.ExplorationModel(
            id='exp_id',
            category='category',
            title='title',
            objective='Old objective',
            states_schema_version=(feconf.CURRENT_STATE_SCHEMA_VERSION + 1),
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME
        )

        rights_manager.create_new_exploration_rights('exp_id', self.albert_id)

        exp_model.commit(
            self.albert_id, 'New exploration created', [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d and unversioned exploration '
            'state schemas at present.' % feconf.CURRENT_STATE_SCHEMA_VERSION):
            exp_fetchers.get_exploration_from_model(exp_model)

    def test_update_exploration_with_empty_change_list_does_not_update(self):
        exploration = self.save_new_default_exploration('exp_id', 'user_id')

        self.assertEqual(exploration.title, 'A title')
        self.assertEqual(exploration.category, 'A category')
        self.assertEqual(
            exploration.objective, feconf.DEFAULT_EXPLORATION_OBJECTIVE)
        self.assertEqual(exploration.language_code, 'en')

        exp_services.update_exploration(
            'user_id', 'exp_id', None, 'empty commit')

        exploration = exp_fetchers.get_exploration_by_id('exp_id')

        self.assertEqual(exploration.title, 'A title')
        self.assertEqual(exploration.category, 'A category')
        self.assertEqual(
            exploration.objective, feconf.DEFAULT_EXPLORATION_OBJECTIVE)
        self.assertEqual(exploration.language_code, 'en')

    def test_save_exploration_with_mismatch_of_versions_raises_error(self):
        self.save_new_valid_exploration('exp_id', 'user_id')

        exploration_model = exp_models.ExplorationModel.get('exp_id')
        exploration_model.version = 0

        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: trying to update version 0 of exploration '
            'from version 1. Please reload the page and try again.'):
            exp_services.update_exploration(
                'user_id', 'exp_id', [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'new title'
                })], 'changed title')

    def test_update_exploration_as_suggestion_with_invalid_commit_message(self):
        self.save_new_valid_exploration('exp_id', 'user_id')

        exploration_model = exp_models.ExplorationModel.get('exp_id')
        exploration_model.version = 0

        with self.assertRaisesRegexp(
            Exception, 'Invalid commit message for suggestion.'):
            exp_services.update_exploration(
                'user_id', 'exp_id', [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'new title'
                })], '', is_suggestion=True)

    def test_update_exploration_with_invalid_commit_message(self):
        self.save_new_valid_exploration('exp_id', 'user_id')

        exploration_model = exp_models.ExplorationModel.get('exp_id')
        exploration_model.version = 0

        with self.assertRaisesRegexp(
            Exception,
            'Commit messages for non-suggestions may not start with'):
            exp_services.update_exploration(
                'user_id', 'exp_id', [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'new title'
                })], feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX)

    def test_update_language_code(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.language_code, 'en')
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'language_code',
                'new_value': 'bn'
            })], 'Changed language code.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.language_code, 'bn')

    def test_update_exploration_tags(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.tags, [])
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'tags',
                'new_value': ['test']
            })], 'Changed tags.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.tags, ['test'])

    def test_update_exploration_author_notes(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.author_notes, '')
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'author_notes',
                'new_value': 'author_notes'
            })], 'Changed author_notes.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.author_notes, 'author_notes')

    def test_update_exploration_blurb(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.blurb, '')
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'blurb',
                'new_value': 'blurb'
            })], 'Changed blurb.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.blurb, 'blurb')

    def test_update_exploration_param_changes(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.param_changes, [])

        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        exp_services._save_exploration(self.albert_id, exploration, '', [])

        param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'myParam',
            'generator_id': 'RandomSelector'
        }]

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'param_changes',
                'new_value': param_changes
            })], 'Changed param_changes.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        self.assertEqual(len(exploration.param_changes), 1)
        self.assertEqual(
            exploration.param_changes[0].to_dict(), param_changes[0])

    def test_update_exploration_init_state_name(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State'
            })], 'Added new state.')

        self.assertEqual(
            exploration.init_state_name, feconf.DEFAULT_INIT_STATE_NAME)

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'init_state_name',
                'new_value': 'State'
            })], 'Changed init_state_name.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.init_state_name, 'State')

    def test_update_exploration_auto_tts_enabled(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.auto_tts_enabled, True)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'auto_tts_enabled',
                'new_value': False
            })], 'Changed auto_tts_enabled.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.auto_tts_enabled, False)

    def test_update_exploration_correctness_feedback_enabled(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.correctness_feedback_enabled, False)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'correctness_feedback_enabled',
                'new_value': True
            })], 'Changed correctness_feedback_enabled.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.correctness_feedback_enabled, True)

    def test_update_unclassified_answers(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.confirmed_unclassified_answers,
            [])

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS,
                'state_name': exploration.init_state_name,
                'new_value': ['test']
            })], 'Changed confirmed_unclassified_answers.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.confirmed_unclassified_answers,
            ['test'])

    def test_update_interaction_hints(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.hints, [])

        hint_list = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': (
                    '<p>Hello, this is html1 for state2'
                    '<oppia-noninteractive-image filepath-with-value="'
                    '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            }
        }]

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_HINTS,
                'state_name': exploration.init_state_name,
                'new_value': hint_list
            })], 'Changed hints.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        self.assertEqual(len(exploration.init_state.interaction.hints), 1)
        self.assertEqual(
            exploration.init_state.interaction.hints[0].hint_content.content_id,
            'hint_1')

    def test_update_interaction_hints_invalid_parameter_type(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.hints, [])

        # The passed hints should be a list.
        hint_dict = {
            'hint_content': {
                'content_id': 'hint_1',
                'html': (
                    '<p>Hello, this is html1 for state2'
                    '<oppia-noninteractive-image filepath-with-value="'
                    '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            }
        }

        with self.assertRaisesRegexp(Exception,
                                     'Expected hints_list to be a list.*'):
            hints_update = exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_HINTS,
                'state_name': exploration.init_state_name,
                'new_value': hint_dict
            })
            exp_services.update_exploration(
                self.albert_id, self.NEW_EXP_ID, [hints_update],
                'Changed hints.'
            )

    def test_update_interaction_solutions(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertIsNone(exploration.init_state.interaction.solution)

        solution = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            },
        }

        hint_list = [{
            'hint_content': {
                'content_id': u'hint_1',
                'html': (
                    u'<p>Hello, this is html1 for state2'
                    u'<oppia-noninteractive-image filepath-with-value="'
                    u'&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    u'"&amp;quot;&amp;quot;" alt-with-value='
                    u'"&amp;quot;&amp;quot;"></oppia-noninteractive-image>'
                    u'</p>')
            }
        }]

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_HINTS,
                'state_name': exploration.init_state_name,
                'new_value': hint_list
            })], 'Changed hints.')

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION,
                'state_name': exploration.init_state_name,
                'new_value': solution
            })], 'Changed interaction_solutions.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.solution.to_dict(),
            solution)
        solution = None
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION,
                'state_name': exploration.init_state_name,
                'new_value': solution
            })], 'Changed interaction_solutions.')
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.solution,
            None)

    def test_cannot_update_recorded_voiceovers_with_invalid_type(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        with self.assertRaisesRegexp(
            Exception, 'Expected recorded_voiceovers to be a dict'):
            exp_services.update_exploration(
                self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
                    'state_name': exploration.init_state_name,
                    'new_value': 'invalid_recorded_voiceovers'
                })], 'Changed recorded_voiceovers.')

    def test_revert_exploration_with_mismatch_of_versions_raises_error(self):
        self.save_new_valid_exploration('exp_id', 'user_id')

        exploration_model = exp_models.ExplorationModel.get('exp_id')
        exploration_model.version = 0

        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: trying to update version 0 of exploration '
            'from version 1. Please reload the page and try again.'):
            exp_services.revert_exploration('user_id', 'exp_id', 1, 0)


class EditorAutoSavingUnitTests(test_utils.GenericTestBase):
    """Test editor auto saving functions in exp_services."""
    EXP_ID1 = 'exp_id1'
    EXP_ID2 = 'exp_id2'
    EXP_ID3 = 'exp_id3'
    USERNAME = 'user123'
    USER_ID = 'user_id'
    COMMIT_MESSAGE = 'commit message'
    DATETIME = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')
    OLDER_DATETIME = datetime.datetime.strptime('2016-01-16', '%Y-%m-%d')
    NEWER_DATETIME = datetime.datetime.strptime('2016-03-16', '%Y-%m-%d')
    NEW_CHANGELIST = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
        'property_name': 'title',
        'new_value': 'New title'})]
    NEW_CHANGELIST_DICT = [NEW_CHANGELIST[0].to_dict()]

    def setUp(self):
        super(EditorAutoSavingUnitTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.set_admins([self.ADMIN_USERNAME])
        # Create explorations.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID1, self.USER_ID)
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        exp_services._save_exploration(self.USER_ID, exploration, '', [])
        self.save_new_valid_exploration(self.EXP_ID2, self.USER_ID)
        self.save_new_valid_exploration(self.EXP_ID3, self.USER_ID)
        self.init_state_name = exploration.init_state_name
        self.param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'myParam',
            'generator_id': 'RandomSelector'
        }]
        self.draft_change_list = _get_change_list(
            self.init_state_name, 'param_changes', self.param_changes)
        self.draft_change_list_dict = [
            change.to_dict() for change in self.draft_change_list]
        # Explorations with draft set.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID1), user_id=self.USER_ID,
            exploration_id=self.EXP_ID1,
            draft_change_list=self.draft_change_list_dict,
            draft_change_list_last_updated=self.DATETIME,
            draft_change_list_exp_version=2,
            draft_change_list_id=2).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID2), user_id=self.USER_ID,
            exploration_id=self.EXP_ID2,
            draft_change_list=self.draft_change_list_dict,
            draft_change_list_last_updated=self.DATETIME,
            draft_change_list_exp_version=4,
            draft_change_list_id=10).put()
        # Exploration with no draft.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID3), user_id=self.USER_ID,
            exploration_id=self.EXP_ID3).put()

    def test_draft_cleared_after_change_list_applied(self):
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID1, self.draft_change_list, '')
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID1))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)

    def test_draft_version_valid_returns_true(self):
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID1))
        self.assertTrue(exp_services.is_version_of_draft_valid(
            self.EXP_ID1, exp_user_data.draft_change_list_exp_version))

    def test_draft_version_valid_returns_false(self):
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID2))
        self.assertFalse(exp_services.is_version_of_draft_valid(
            self.EXP_ID2, exp_user_data.draft_change_list_exp_version))

    def test_draft_version_valid_when_no_draft_exists(self):
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID3))
        self.assertFalse(exp_services.is_version_of_draft_valid(
            self.EXP_ID3, exp_user_data.draft_change_list_exp_version))

    def test_create_or_update_draft_when_older_draft_exists(self):
        exp_services.create_or_update_draft(
            self.EXP_ID1, self.USER_ID, self.NEW_CHANGELIST, 5,
            self.NEWER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID1)
        self.assertEqual(exp_user_data.exploration_id, self.EXP_ID1)
        self.assertEqual(
            exp_user_data.draft_change_list, self.NEW_CHANGELIST_DICT)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.NEWER_DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 5)
        self.assertEqual(exp_user_data.draft_change_list_id, 3)

    def test_create_or_update_draft_when_newer_draft_exists(self):
        exp_services.create_or_update_draft(
            self.EXP_ID1, self.USER_ID, self.NEW_CHANGELIST, 5,
            self.OLDER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID1)
        self.assertEqual(exp_user_data.exploration_id, self.EXP_ID1)
        self.assertEqual(
            exp_user_data.draft_change_list, self.draft_change_list_dict)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 2)
        self.assertEqual(exp_user_data.draft_change_list_id, 2)

    def test_create_or_update_draft_when_draft_does_not_exist(self):
        exp_services.create_or_update_draft(
            self.EXP_ID3, self.USER_ID, self.NEW_CHANGELIST, 5,
            self.NEWER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID3)
        self.assertEqual(exp_user_data.exploration_id, self.EXP_ID3)
        self.assertEqual(
            exp_user_data.draft_change_list, self.NEW_CHANGELIST_DICT)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.NEWER_DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 5)
        self.assertEqual(exp_user_data.draft_change_list_id, 1)

    def test_get_exp_with_draft_applied_when_draft_exists(self):
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID1)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID1, self.USER_ID)
        self.assertIsNotNone(updated_exp)
        param_changes = updated_exp.init_state.param_changes[0]
        self.assertEqual(param_changes._name, 'myParam')
        self.assertEqual(param_changes._generator_id, 'RandomSelector')
        self.assertEqual(
            param_changes._customization_args,
            {'list_of_values': ['1', '2'], 'parse_with_jinja': False})

    def test_get_exp_with_draft_applied_when_draft_does_not_exist(self):
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID3)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID3, self.USER_ID)
        self.assertIsNone(updated_exp)

    def test_get_exp_with_draft_applied_when_draft_version_is_invalid(self):
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID2)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID2, self.USER_ID)
        self.assertIsNone(updated_exp)

    def test_draft_discarded(self):
        exp_services.discard_draft(self.EXP_ID1, self.USER_ID,)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID1))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)

    def test_create_or_update_draft_with_exploration_model_not_created(self):
        self.save_new_valid_exploration(
            'exp_id', self.admin_id, title='title')

        rights_manager.assign_role_for_exploration(
            self.admin, 'exp_id', self.editor_id, rights_manager.ROLE_EDITOR)

        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.editor_id, 'exp_id')
        self.assertIsNone(exp_user_data)

        exp_services.create_or_update_draft(
            'exp_id', self.editor_id, self.NEW_CHANGELIST, 1,
            self.NEWER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.editor_id, 'exp_id')
        self.assertEqual(exp_user_data.exploration_id, 'exp_id')
        self.assertEqual(
            exp_user_data.draft_change_list, self.NEW_CHANGELIST_DICT)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.NEWER_DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 1)
        self.assertEqual(exp_user_data.draft_change_list_id, 1)


class ApplyDraftUnitTests(test_utils.GenericTestBase):
    """Test apply draft functions in exp_services."""

    EXP_ID1 = 'exp_id1'
    USERNAME = 'user123'
    USER_ID = 'user_id'
    COMMIT_MESSAGE = 'commit message'
    DATETIME = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')

    def setUp(self):
        super(ApplyDraftUnitTests, self).setUp()
        # Create explorations.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID1, self.USER_ID)
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        self.init_state_name = exploration.init_state_name
        self.param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'myParam',
            'generator_id': 'RandomSelector'
        }]

        self.draft_change_list = _get_change_list(
            self.init_state_name, 'param_changes', self.param_changes)
        self.draft_change_list_dict = [
            change.to_dict() for change in self.draft_change_list]
        # Explorations with draft set.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID1), user_id=self.USER_ID,
            exploration_id=self.EXP_ID1,
            draft_change_list=self.draft_change_list_dict,
            draft_change_list_last_updated=self.DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=2).put()

        migration_change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            'from_version': '0',
            'to_version': '1'
        })]
        exp_services._save_exploration(
            self.USER_ID, exploration, 'Migrate state schema.',
            migration_change_list)

    def test_get_exp_with_draft_applied_after_draft_upgrade(self):
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID1)
        self.assertEqual(exploration.init_state.param_changes, [])
        draft_upgrade_services.DraftUpgradeUtil._convert_states_v0_dict_to_v1_dict = (  # pylint: disable=line-too-long
            classmethod(lambda cls, changelist: changelist))
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID1, self.USER_ID)
        self.assertIsNotNone(updated_exp)
        param_changes = updated_exp.init_state.param_changes[0]
        self.assertEqual(param_changes._name, 'myParam')
        self.assertEqual(param_changes._generator_id, 'RandomSelector')
        self.assertEqual(
            param_changes._customization_args,
            {'list_of_values': ['1', '2'], 'parse_with_jinja': False})
