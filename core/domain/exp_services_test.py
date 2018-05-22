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

import StringIO
import copy
import datetime
import os
import zipfile

from core.domain import exp_domain
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_domain
from core.domain import param_domain
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])
search_services = models.Registry.import_search_services()
transaction_services = models.Registry.import_transaction_services()

# TODO(msl): test ExpSummaryModel changes if explorations are updated,
# reverted, deleted, created, rights changed.


def _count_at_least_editable_exploration_summaries(user_id):
    return len(exp_services._get_exploration_summaries_from_models(  # pylint: disable=protected-access
        exp_models.ExpSummaryModel.get_at_least_editable(
            user_id=user_id)))


class ExplorationServicesUnitTests(test_utils.GenericTestBase):
    """Test the exploration services module."""
    EXP_ID = 'An_exploration_id'

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(ExplorationServicesUnitTests, self).setUp()

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        user_services.create_new_user(self.editor_id, self.EDITOR_EMAIL)
        user_services.create_new_user(self.viewer_id, self.VIEWER_EMAIL)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.set_admins([self.ADMIN_USERNAME])
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)


class ExplorationQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests query methods."""

    def test_get_exploration_titles_and_categories(self):
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories([]), {})

        self.save_new_default_exploration('A', self.owner_id, 'TitleA')
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A']), {
                'A': {
                    'category': 'A category',
                    'title': 'TitleA'
                }
            })

        self.save_new_default_exploration('B', self.owner_id, 'TitleB')
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
                    '', None))
            self.assertEqual(len(exp_ids), 3)
            self.assertIsNotNone(search_cursor)
            found_exp_ids += exp_ids

            # Page 2: 3 more explorations.
            (exp_ids, search_cursor) = (
                exp_services.get_exploration_ids_matching_query(
                    '', search_cursor))
            self.assertEqual(len(exp_ids), 3)
            self.assertIsNotNone(search_cursor)
            found_exp_ids += exp_ids

            # Page 3: 1 final exploration.
            (exp_ids, search_cursor) = (
                exp_services.get_exploration_ids_matching_query(
                    '', search_cursor))
            self.assertEqual(len(exp_ids), 1)
            self.assertIsNone(search_cursor)
            found_exp_ids += exp_ids

            # Validate all explorations were seen.
            self.assertEqual(sorted(found_exp_ids), [
                self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3,
                self.EXP_ID_4, self.EXP_ID_5, self.EXP_ID_6])


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_retrieval_of_explorations(self):
        """Test the get_exploration_by_id() method."""
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_services.get_exploration_by_id('fake_eid')

        exploration = self.save_new_default_exploration(
            self.EXP_ID, self.owner_id)
        retrieved_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.id, retrieved_exploration.id)
        self.assertEqual(exploration.title, retrieved_exploration.title)

        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id('fake_exploration')

    def test_retrieval_of_multiple_exploration_versions_for_fake_exp_id(self):
        with self.assertRaisesRegexp(
            ValueError, 'The given entity_id fake_exp_id is invalid'):
            exp_services.get_multiple_explorations_by_version(
                'fake_exp_id', [1, 2, 3])

    def test_retrieval_of_multiple_exploration_versions(self):
        self.save_new_default_exploration(self.EXP_ID, self.owner_id)

        # Update exploration to version 2.
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        # Update exploration to version 3.
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state 2',
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        exploration_latest = exp_services.get_exploration_by_id(self.EXP_ID)
        latest_version = exploration_latest.version

        explorations = exp_services.get_multiple_explorations_by_version(
            self.EXP_ID, range(1, latest_version + 1))

        self.assertEqual(len(explorations), 3)
        self.assertEqual(explorations[0].version, 1)
        self.assertEqual(explorations[1].version, 2)
        self.assertEqual(explorations[2].version, 3)

    def test_version_number_errors_for_get_multiple_exploration_versions(self):
        self.save_new_default_exploration(self.EXP_ID, self.owner_id)

        # Update exploration to version 2.
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        # Update exploration to version 3.
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state 2',
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        with self.assertRaisesRegexp(
            ValueError,
            'Requested version number 4 cannot be higher than the current '
            'version number 3.'):
            exp_services.get_multiple_explorations_by_version(
                self.EXP_ID, [1, 2, 3, 4])

        with self.assertRaisesRegexp(
            ValueError,
            'At least one version number is invalid'):
            exp_services.get_multiple_explorations_by_version(
                self.EXP_ID, [1, 2, 2.5, 3])

    def test_retrieval_of_multiple_explorations(self):
        exps = {}
        chars = 'abcde'
        exp_ids = ['%s%s' % (self.EXP_ID, c) for c in chars]
        for _id in exp_ids:
            exp = self.save_new_valid_exploration(_id, self.owner_id)
            exps[_id] = exp

        result = exp_services.get_multiple_explorations_by_id(
            exp_ids)
        for _id in exp_ids:
            self.assertEqual(result.get(_id).title, exps.get(_id).title)

        # Test retrieval of non-existent ids.
        result = exp_services.get_multiple_explorations_by_id(
            exp_ids + ['doesnt_exist'], strict=False
        )
        for _id in exp_ids:
            self.assertEqual(result.get(_id).title, exps.get(_id).title)

        self.assertNotIn('doesnt_exist', result)

        with self.assertRaises(Exception):
            exp_services.get_multiple_explorations_by_id(
                exp_ids + ['doesnt_exist'])

    def test_soft_deletion_of_explorations(self):
        """Test that soft deletion of explorations works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_exploration(self.EXP_ID, self.owner_id)
        # The exploration shows up in queries.
        self.assertEqual(
            _count_at_least_editable_exploration_summaries(self.owner_id), 1)

        exp_services.delete_exploration(self.owner_id, self.EXP_ID)
        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id(self.EXP_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # But the models still exist in the backend.
        self.assertIn(
            self.EXP_ID,
            [exp.id for exp in exp_models.ExplorationModel.get_all(
                include_deleted=True)]
        )

        # The exploration summary is deleted however.
        self.assertNotIn(
            self.EXP_ID,
            [exp.id for exp in exp_models.ExpSummaryModel.get_all(
                include_deleted=True)]
        )

    def test_hard_deletion_of_explorations(self):
        """Test that hard deletion of explorations works correctly."""
        self.save_new_default_exploration(self.EXP_ID, self.owner_id)
        # The exploration shows up in queries.
        self.assertEqual(
            _count_at_least_editable_exploration_summaries(self.owner_id), 1)

        exp_services.delete_exploration(
            self.owner_id, self.EXP_ID, force_deletion=True)
        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id(self.EXP_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # The exploration model has been purged from the backend.
        self.assertNotIn(
            self.EXP_ID,
            [exp.id for exp in exp_models.ExplorationModel.get_all(
                include_deleted=True)]
        )

    def test_summaries_of_hard_deleted_explorations(self):
        """Test that summaries of hard deleted explorations are
        correctly deleted.
        """
        self.save_new_default_exploration(self.EXP_ID, self.owner_id)

        exp_services.delete_exploration(
            self.owner_id, self.EXP_ID, force_deletion=True)
        with self.assertRaises(Exception):
            exp_services.get_exploration_by_id(self.EXP_ID)

        # The deleted exploration summary does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # The exploration summary model has been purged from the backend.
        self.assertNotIn(
            self.EXP_ID,
            [exp.id for exp in exp_models.ExpSummaryModel.get_all(
                include_deleted=True)]
        )

    def test_explorations_are_removed_from_index_when_deleted(self):
        """Tests that explorations are removed from the search index when
        deleted.
        """
        self.save_new_default_exploration(self.EXP_ID, self.owner_id)

        def mock_delete_docs(doc_ids, index):
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(doc_ids, [self.EXP_ID])

        delete_docs_swap = self.swap(
            search_services, 'delete_documents_from_index', mock_delete_docs)

        with delete_docs_swap:
            exp_services.delete_exploration(self.owner_id, self.EXP_ID)

    def test_no_errors_are_raised_when_creating_default_exploration(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)

    def test_that_default_exploration_fails_strict_validation(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'This state does not have any interaction specified.'
            ):
            exploration.validate(strict=True)

    def test_save_and_retrieve_exploration(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'param_specs',
                'new_value': {
                    'theParameter':
                        param_domain.ParamSpec('UnicodeString').to_dict()
                }
            }],
            '')

        retrieved_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(retrieved_exploration.title, 'A title')
        self.assertEqual(retrieved_exploration.category, 'A category')
        self.assertEqual(len(retrieved_exploration.states), 1)
        self.assertEqual(len(retrieved_exploration.param_specs), 1)
        self.assertEqual(
            retrieved_exploration.param_specs.keys()[0], 'theParameter')

    def test_save_and_retrieve_exploration_summary(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)

        # Change param spec.
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'param_specs',
                'new_value': {
                    'theParameter':
                        param_domain.ParamSpec('UnicodeString').to_dict()
                }
            }], '')

        # Change title and category.
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'A new title'
            }, {
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'category',
                'new_value': 'A new category'
            }], 'Change title and category')

        retrieved_exp_summary = exp_services.get_exploration_summary_by_id(
            self.EXP_ID)

        self.assertEqual(retrieved_exp_summary.title, 'A new title')
        self.assertEqual(retrieved_exp_summary.category, 'A new category')
        self.assertEqual(retrieved_exp_summary.contributor_ids, [self.owner_id])

    def test_update_exploration_by_migration_bot(self):
        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='end')
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USER_ID, self.EXP_ID, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Did migration.')


class LoadingAndDeletionOfExplorationDemosTest(ExplorationServicesUnitTests):

    def test_loading_and_validation_and_deletion_of_demo_explorations(self):
        """Test loading, validation and deletion of the demo explorations."""
        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(), 0)

        demo_exploration_ids = feconf.DEMO_EXPLORATIONS.keys()
        self.assertGreaterEqual(
            len(demo_exploration_ids), 1,
            msg='There must be at least one demo exploration.')

        for exp_id in demo_exploration_ids:
            start_time = datetime.datetime.utcnow()

            exp_services.load_demo(exp_id)
            exploration = exp_services.get_exploration_by_id(exp_id)
            warnings = exploration.validate(strict=True)
            if warnings:
                raise Exception(warnings)

            duration = datetime.datetime.utcnow() - start_time
            processing_time = duration.seconds + duration.microseconds / 1E6
            self.log_line(
                'Loaded and validated exploration %s (%.2f seconds)' %
                (exploration.title.encode('utf-8'), processing_time))

        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(),
            len(demo_exploration_ids))

        for exp_id in demo_exploration_ids:
            exp_services.delete_demo(exp_id)
        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(), 0)


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
        exp = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exp.to_yaml(), self.SAMPLE_YAML_CONTENT)

    def test_loading_recent_yaml_does_not_default_exp_title_category(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertNotEqual(exp.title, feconf.DEFAULT_EXPLORATION_TITLE)
        self.assertNotEqual(exp.category, feconf.DEFAULT_EXPLORATION_CATEGORY)

    def test_loading_exploration_from_yaml_does_not_override_existing_id(self):
        # Load a a demo exploration.
        exp_services.load_demo(self.DEMO_EXP_ID)

        # Override the demo exploration using the import method.
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.DEMO_EXP_ID, [])

        # The demo exploration should not have been overwritten.
        exp = exp_services.get_exploration_by_id(self.DEMO_EXP_ID)
        self.assertNotEqual(exp.to_yaml(), self.SAMPLE_YAML_CONTENT)

    def test_loading_untitled_yaml_defaults_exploration_title_category(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_UNTITLED_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exp.title, feconf.DEFAULT_EXPLORATION_TITLE)
        self.assertEqual(exp.category, feconf.DEFAULT_EXPLORATION_CATEGORY)

    def test_loading_old_yaml_migrates_exp_to_latest_schema_version(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_UNTITLED_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exp.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

    def test_loading_yaml_with_assets_loads_assets_from_filesystem(self):
        test_asset = (self.TEST_ASSET_PATH, self.TEST_ASSET_CONTENT)
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [test_asset])

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(self.EXP_ID))
        self.assertEqual(fs.get(self.TEST_ASSET_PATH), self.TEST_ASSET_CONTENT)

    def test_can_load_yaml_with_audio_translations(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.YAML_WITH_AUDIO_TRANSLATIONS, self.EXP_ID, [])
        exp = exp_services.get_exploration_by_id(self.EXP_ID)

        state = exp.states[exp.init_state_name]
        interaction = state.interaction
        content_translations = state.content.audio_translations
        answer_group_translations = (
            interaction.answer_groups[0].outcome.feedback.audio_translations)
        default_outcome_translations = (
            interaction.default_outcome.feedback.audio_translations)
        hint_translations = interaction.hints[0].hint_content.audio_translations
        solution_translations = (
            interaction.solution.explanation.audio_translations)

        self.assertEqual(
            content_translations['en'].filename, self.INTRO_AUDIO_FILE)
        self.assertEqual(
            answer_group_translations['en'].filename,
            self.ANSWER_GROUP_AUDIO_FILE)
        self.assertEqual(
            default_outcome_translations['en'].filename,
            self.DEFAULT_OUTCOME_AUDIO_FILE)
        self.assertEqual(
            hint_translations['en'].filename, self.HINT_AUDIO_FILE)
        self.assertEqual(
            solution_translations['en'].filename, self.SOLUTION_AUDIO_FILE)

    def test_can_load_yaml_with_stripped_audio_translations(self):
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.YAML_WITH_AUDIO_TRANSLATIONS, self.EXP_ID, [],
            strip_audio_translations=True)
        exp = exp_services.get_exploration_by_id(self.EXP_ID)

        state = exp.states[exp.init_state_name]
        interaction = state.interaction
        content_translations = state.content.audio_translations
        answer_group_translations = (
            interaction.answer_groups[0].outcome.feedback.audio_translations)
        default_outcome_translations = (
            interaction.default_outcome.feedback.audio_translations)
        hint_translations = interaction.hints[0].hint_content.audio_translations
        solution_translations = (
            interaction.solution.explanation.audio_translations)

        self.assertEqual(content_translations, {})
        self.assertEqual(answer_group_translations, {})
        self.assertEqual(default_outcome_translations, {})
        self.assertEqual(hint_translations, {})
        self.assertEqual(solution_translations, {})


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
      audio_translations: {}
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
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  New state:
    classifier_model_id: null
    content:
      audio_translations: {}
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
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: %d
tags: []
title: A title
""" % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION))

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
      audio_translations: {}
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
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
  Renamed state:
    classifier_model_id: null
    content:
      audio_translations: {}
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
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    param_changes: []
states_schema_version: %d
tags: []
title: A title
""" % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION))

    def test_export_to_zip_file(self):
        """Test the export_to_zip_file() method."""
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, objective='The objective')
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exploration.add_states(['New state'])
        exploration.states['New state'].update_interaction_id('TextInput')
        exp_services._save_exploration(self.owner_id, exploration, '', [])

        zip_file_output = exp_services.export_to_zip_file(self.EXP_ID)
        zf = zipfile.ZipFile(StringIO.StringIO(zip_file_output))

        self.assertEqual(zf.namelist(), ['A title.yaml'])
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)

    def test_export_to_zip_file_with_assets(self):
        """Test exporting an exploration with assets to a zip file."""
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, objective='The objective')
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exploration.add_states(['New state'])
        exploration.states['New state'].update_interaction_id('TextInput')
        exp_services._save_exploration(self.owner_id, exploration, '', [])

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(self.EXP_ID))
        fs.commit(self.owner_id, 'abc.png', raw_image)

        zip_file_output = exp_services.export_to_zip_file(self.EXP_ID)
        zf = zipfile.ZipFile(StringIO.StringIO(zip_file_output))

        self.assertEqual(zf.namelist(), ['A title.yaml', 'assets/abc.png'])
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)
        self.assertEqual(zf.open('assets/abc.png').read(), raw_image)

    def test_export_by_versions(self):
        """Test export_to_zip_file() for different versions."""
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, objective='The objective')
        self.assertEqual(exploration.version, 1)

        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }]
        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(self.EXP_ID))
        fs.commit(self.owner_id, 'abc.png', raw_image)
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 2)

        change_list = [{
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'New state',
            'new_state_name': 'Renamed state'
        }]
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 3)

        # Download version 2.
        zip_file_output = exp_services.export_to_zip_file(self.EXP_ID, 2)
        zf = zipfile.ZipFile(StringIO.StringIO(zip_file_output))
        self.assertEqual(
            zf.open('A title.yaml').read(), self.SAMPLE_YAML_CONTENT)

        # Download version 3.
        zip_file_output = exp_services.export_to_zip_file(self.EXP_ID, 3)
        zf = zipfile.ZipFile(StringIO.StringIO(zip_file_output))
        self.assertEqual(
            zf.open('A title.yaml').read(), self.UPDATED_YAML_CONTENT)


class YAMLExportUnitTests(ExplorationServicesUnitTests):
    """Test export methods for explorations represented as a dict whose keys
    are state names and whose values are YAML strings representing the state's
    contents.
    """
    _SAMPLE_INIT_STATE_CONTENT = ("""classifier_model_id: null
content:
  audio_translations: {}
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
      audio_translations: {}
      html: ''
    labelled_as_correct: false
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
""") % (feconf.DEFAULT_INIT_STATE_NAME)

    SAMPLE_EXPORTED_DICT = {
        feconf.DEFAULT_INIT_STATE_NAME: _SAMPLE_INIT_STATE_CONTENT,
        'New state': ("""classifier_model_id: null
content:
  audio_translations: {}
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
      audio_translations: {}
      html: ''
    labelled_as_correct: false
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
""")
    }

    UPDATED_SAMPLE_DICT = {
        feconf.DEFAULT_INIT_STATE_NAME: _SAMPLE_INIT_STATE_CONTENT,
        'Renamed state': ("""classifier_model_id: null
content:
  audio_translations: {}
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
      audio_translations: {}
      html: ''
    labelled_as_correct: false
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
param_changes: []
""")
    }

    def test_export_to_dict(self):
        """Test the export_to_dict() method."""
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, objective='The objective')
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exploration.add_states(['New state'])
        exploration.states['New state'].update_interaction_id('TextInput')
        exp_services._save_exploration(self.owner_id, exploration, '', [])

        dict_output = exp_services.export_states_to_yaml(self.EXP_ID, width=50)

        self.assertEqual(dict_output, self.SAMPLE_EXPORTED_DICT)

    def test_export_by_versions(self):
        """Test export_to_dict() for different versions."""
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id)
        self.assertEqual(exploration.version, 1)

        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }]
        exploration.objective = 'The objective'
        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(self.EXP_ID))
        fs.commit(self.owner_id, 'abc.png', raw_image)
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 2)

        change_list = [{
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'New state',
            'new_state_name': 'Renamed state'
        }]
        exp_services.update_exploration(
            self.owner_id, exploration.id, change_list, '')
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.version, 3)

        # Download version 2.
        dict_output = exp_services.export_states_to_yaml(
            self.EXP_ID, version=2, width=50)
        self.assertEqual(dict_output, self.SAMPLE_EXPORTED_DICT)

        # Download version 3.
        dict_output = exp_services.export_states_to_yaml(
            self.EXP_ID, version=3, width=50)
        self.assertEqual(dict_output, self.UPDATED_SAMPLE_DICT)


def _get_change_list(state_name, property_name, new_value):
    """Generates a change list for a single state change."""
    return [{
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'state_name': state_name,
        'property_name': property_name,
        'new_value': new_value
    }]


class UpdateStateTests(ExplorationServicesUnitTests):
    """Test updating a single state."""

    def setUp(self):
        super(UpdateStateTests, self).setUp()
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id)

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
                    'audio_translations': {},
                    'html': 'Try again'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
            },
            'training_data': []
        }]
        # Default outcome specification for an interaction.
        self.interaction_default_outcome = {
            'dest': self.init_state_name,
            'feedback': {
                'audio_translations': {},
                'html': '<b>Incorrect</b>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
        }

    def test_add_state_cmd(self):
        """ Test adding of states."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)

        self.assertNotIn('new state', exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
            }], 'Add state name')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertIn('new state', exploration.states)

    def test_rename_state_cmd(self):
        """Test updating of state name."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)

        self.assertIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': 'state',
            }], 'Change state name')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertIn('state', exploration.states)
        self.assertNotIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

    def test_rename_state_cmd_with_unicode(self):
        """Test updating of state name to one that uses unicode characters."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)

        self.assertNotIn(u'¡Hola! αβγ', exploration.states)
        self.assertIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': u'¡Hola! αβγ',
            }], 'Change state name')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertIn(u'¡Hola! αβγ', exploration.states)
        self.assertNotIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

    def test_delete_state_cmd(self):
        """Test deleting a state name."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
            }], 'Add state name')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)

        self.assertIn('new state', exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, [{
                'cmd': exp_domain.CMD_DELETE_STATE,
                'state_name': 'new state',
            }], 'delete state')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertNotIn('new state', exploration.states)

    def test_update_param_changes(self):
        """Test updating of param_changes."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        exp_services._save_exploration(self.owner_id, exploration, '', [])
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, _get_change_list(
                self.init_state_name, 'param_changes', self.param_changes), '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
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
                self.owner_id, self.EXP_ID, _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                '')

    def test_update_invalid_generator(self):
        """Test for check that the generator_id in param_changes exists."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        exp_services._save_exploration(self.owner_id, exploration, '', [])

        self.param_changes[0]['generator_id'] = 'fake'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid generator id fake'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID,
                _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                '')

    def test_update_interaction_id(self):
        """Test updating of interaction_id."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput'), '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.id, 'MultipleChoiceInput')

    def test_update_interaction_customization_args(self):
        """Test updating of interaction customization_args."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID,
            _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput') +
            _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {'choices': {'value': ['Option A', 'Option B']}}),
            '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.customization_args[
                'choices']['value'], ['Option A', 'Option B'])

    def test_update_interaction_handlers_fails(self):
        """Test legacy interaction handler updating."""
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.add_states(['State 2'])
        exploration.states['State 2'].update_interaction_id('TextInput')
        exp_services._save_exploration(self.owner_id, exploration, '', [])

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.interaction_default_outcome['dest'] = 'State 2'
        with self.assertRaisesRegexp(
            utils.InvalidInputException,
            'Editing interaction handlers is no longer supported'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID,
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
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        exploration.add_states(['State 2'])
        exploration.states['State 2'].update_interaction_id('TextInput')
        exp_services._save_exploration(self.owner_id, exploration, '', [])

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.interaction_default_outcome['dest'] = 'State 2'
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID,
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

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        init_state = exploration.init_state
        init_interaction = init_state.interaction
        rule_specs = init_interaction.answer_groups[0].rule_specs
        outcome = init_interaction.answer_groups[0].outcome
        self.assertEqual(rule_specs[0].rule_type, 'Equals')
        self.assertEqual(rule_specs[0].inputs, {'x': 0})
        self.assertEqual(outcome.feedback.html, 'Try again')
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
                self.owner_id, self.EXP_ID,
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
                self.owner_id, self.EXP_ID,
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
        with self.assertRaisesRegexp(Exception, 'invalid literal for int()'):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID,
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
            self.owner_id, self.EXP_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<b>Test content</b>',
                    'audio_translations': {},
                }),
            '')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            exploration.init_state.content.html, '<b>Test content</b>')

    def test_update_content_missing_key(self):
        """Test that missing keys in content yield an error."""
        with self.assertRaisesRegexp(KeyError, 'audio_translations'):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, _get_change_list(
                    self.init_state_name, 'content', {
                        'html': '<b>Test content</b>',
                    }),
                '')


class CommitMessageHandlingTests(ExplorationServicesUnitTests):
    """Test the handling of commit messages."""

    def setUp(self):
        super(CommitMessageHandlingTests, self).setUp()
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        self.init_state_name = exploration.init_state_name

    def test_record_commit_message(self):
        """Check published explorations record commit messages."""
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_STICKY,
                False), 'A message')

        self.assertEqual(
            exp_services.get_exploration_snapshots_metadata(
                self.EXP_ID)[1]['commit_message'],
            'A message')

    def test_demand_commit_message(self):
        """Check published explorations demand commit messages."""
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

        with self.assertRaisesRegexp(
            ValueError,
            'Exploration is public so expected a commit message but received '
            'none.'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_STICKY, False), '')

    def test_unpublished_explorations_can_accept_commit_message(self):
        """Test unpublished explorations can accept optional commit messages."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_STICKY, False
            ), 'A message')

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_STICKY, True
            ), '')

        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, _get_change_list(
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
            self.EXP_ID, self.owner_id, end_state_name='End')

        timestamp_after_first_edit = utils.get_current_time_in_millisecs()

        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USER_ID, self.EXP_ID, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Did migration.')

        self.assertLess(
            original_timestamp,
            exp_services._get_last_updated_by_human_ms(self.EXP_ID))
        self.assertLess(
            exp_services._get_last_updated_by_human_ms(self.EXP_ID),
            timestamp_after_first_edit)

    def test_get_exploration_snapshots_metadata(self):
        self.signup(self.SECOND_EMAIL, self.SECOND_USERNAME)
        second_committer_id = self.get_user_id_from_email(self.SECOND_EMAIL)

        v1_exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)
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
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)
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
        change_list = [{
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'First title'
        }]
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, change_list, 'Changed title.')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)
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
            'commit_cmds': change_list,
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
        new_change_list = [{
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'New title'
        }]

        exp_services.update_exploration(
            second_committer_id, self.EXP_ID, new_change_list,
            'Second commit.')

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)
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
            'commit_cmds': change_list,
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[1])
        self.assertDictContainsSubset({
            'commit_cmds': new_change_list,
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
            self.EXP_ID, self.owner_id)

        exploration.title = 'First title'
        exp_services._save_exploration(
            self.owner_id, exploration, 'Changed title.', [])
        commit_dict_2 = {
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'version_number': 2,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)
        self.assertEqual(len(snapshots_metadata), 2)

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }]
        exp_services.update_exploration(
            'second_committer_id', exploration.id, change_list,
            'Added new state')

        commit_dict_3 = {
            'committer_id': 'second_committer_id',
            'commit_message': 'Added new state',
            'version_number': 3,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset(
            commit_dict_3, snapshots_metadata[2])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        for ind in range(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # Perform an invalid action: delete a state that does not exist. This
        # should not create a new version.
        with self.assertRaisesRegexp(ValueError, 'does not exist'):
            exploration.delete_state('invalid_state_name')

        # Now delete the new state.
        change_list = [{
            'cmd': exp_domain.CMD_DELETE_STATE,
            'state_name': 'New state'
        }]
        exp_services.update_exploration(
            'committer_id_3', exploration.id, change_list,
            'Deleted state: New state')

        commit_dict_4 = {
            'committer_id': 'committer_id_3',
            'commit_message': 'Deleted state: New state',
            'version_number': 4,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)
        self.assertEqual(len(snapshots_metadata), 4)
        self.assertDictContainsSubset(commit_dict_4, snapshots_metadata[3])
        self.assertDictContainsSubset(commit_dict_3, snapshots_metadata[2])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        for ind in range(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # The final exploration should have exactly one state.
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(len(exploration.states), 1)

    def test_versioning_with_reverting(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id)

        # In version 1, the title was 'A title'.
        # In version 2, the title becomes 'V2 title'.
        exploration.title = 'V2 title'
        exp_services._save_exploration(
            self.owner_id, exploration, 'Changed title.', [])

        # In version 3, a new state is added.
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }]
        exp_services.update_exploration(
            'committer_id_v3', exploration.id, change_list, 'Added new state')

        # It is not possible to revert from anything other than the most
        # current version.
        with self.assertRaisesRegexp(Exception, 'too old'):
            exp_services.revert_exploration(
                'committer_id_v4', self.EXP_ID, 2, 1)

        # Version 4 is a reversion to version 1.
        exp_services.revert_exploration('committer_id_v4', self.EXP_ID, 3, 1)
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exploration.title, 'A title')
        self.assertEqual(len(exploration.states), 1)
        self.assertEqual(exploration.version, 4)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_ID)

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

        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert = user_services.UserActionsInfo(self.albert_id)
        self.bob = user_services.UserActionsInfo(self.bob_id)

        # This needs to be done in a toplevel wrapper because the datastore
        # puts to the event log are asynchronous.
        @transaction_services.toplevel_wrapper
        def populate_datastore():
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

    def test_get_next_page_of_all_non_private_commits(self):
        all_commits = (
            exp_services.get_next_page_of_all_non_private_commits()[0])
        self.assertEqual(len(all_commits), 1)
        commit_dicts = [commit.to_dict() for commit in all_commits]
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_PUBLISH_EXP_2, commit_dicts[0])

        #TODO(frederikcreemers@gmail.com) test max_age here.


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

        for i in xrange(5):
            self.save_new_valid_exploration(
                all_exp_ids[i],
                self.owner_id,
                all_exp_titles[i],
                category=all_exp_categories[i])

        # We're only publishing the first 4 explorations, so we're not
        # expecting the last exploration to be indexed.
        for i in xrange(4):
            rights_manager.publish_exploration(
                self.owner, expected_exp_ids[i])

        with add_docs_swap:
            exp_services.index_explorations_given_ids(all_exp_ids)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_get_number_of_ratings(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp = exp_services.get_exploration_summary_by_id(self.EXP_ID)

        self.assertEqual(exp_services.get_number_of_ratings(exp.ratings), 0)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_ID, 5)
        self.assertEqual(
            exp_services.get_number_of_ratings(exp.ratings), 1)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 3)
        self.process_and_flush_pending_tasks()
        exp = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            exp_services.get_number_of_ratings(exp.ratings), 2)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_2, self.EXP_ID, 5)
        self.process_and_flush_pending_tasks()
        exp = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            exp_services.get_number_of_ratings(exp.ratings), 3)

    def test_get_average_rating(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp = exp_services.get_exploration_summary_by_id(self.EXP_ID)

        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 0)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_ID, 5)
        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 5)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 2)

        exp = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 3.5)

    def test_get_lower_bound_wilson_rating_from_exp_summary(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp = exp_services.get_exploration_summary_by_id(self.EXP_ID)

        self.assertEqual(
            exp_services.get_scaled_average_rating(exp.ratings), 0)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_ID, 5)
        self.assertAlmostEqual(
            exp_services.get_scaled_average_rating(exp.ratings),
            1.8261731658956, places=4)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 4)

        exp = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertAlmostEqual(
            exp_services.get_scaled_average_rating(exp.ratings),
            2.056191454757, places=4)


class ExplorationSummaryTests(ExplorationServicesUnitTests):
    """Test exploration summaries."""
    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'

    def test_is_exp_summary_editable(self):
        self.save_new_default_exploration(self.EXP_ID, self.owner_id)

        # Check that only the owner may edit.
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertTrue(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.owner_id))
        self.assertFalse(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.editor_id))
        self.assertFalse(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.viewer_id))

        # Owner makes viewer a viewer and editor an editor.
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
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
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        # Have Albert create a new exploration.
        self.save_new_valid_exploration(self.EXP_ID_1, albert_id)
        # Have Albert update that exploration.
        exp_services.update_exploration(
            albert_id, self.EXP_ID_1, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        # Have Bob revert Albert's update.
        exp_services.revert_exploration(bob_id, self.EXP_ID_1, 2, 1)

        # Verify that only Albert (and not Bob, who has not made any non-
        # revert changes) appears in the contributors list for this
        # exploration.
        exploration_summary = exp_services.get_exploration_summary_by_id(
            self.EXP_ID_1)
        self.assertEqual([albert_id], exploration_summary.contributor_ids)

    def _check_contributors_summary(self, exp_id, expected):
        contributors_summary = exp_services.get_exploration_summary_by_id(
            exp_id).contributors_summary
        self.assertEqual(expected, contributors_summary)

    def test_contributors_summary(self):
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        # Have Albert create a new exploration. Version 1.
        self.save_new_valid_exploration(self.EXP_ID_1, albert_id)
        self._check_contributors_summary(self.EXP_ID_1, {albert_id: 1})

        # Have Bob update that exploration. Version 2.
        exp_services.update_exploration(
            bob_id, self.EXP_ID_1, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 1, bob_id: 1})
        # Have Bob update that exploration. Version 3.
        exp_services.update_exploration(
            bob_id, self.EXP_ID_1, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 1, bob_id: 2})

        # Have Albert update that exploration. Version 4.
        exp_services.update_exploration(
            albert_id, self.EXP_ID_1, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 2, bob_id: 2})

        # Have Albert revert to version 3. Version 5.
        exp_services.revert_exploration(albert_id, self.EXP_ID_1, 4, 3)
        self._check_contributors_summary(
            self.EXP_ID_1, {albert_id: 1, bob_id: 2})


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

        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert = user_services.UserActionsInfo(self.albert_id)
        self.bob = user_services.UserActionsInfo(self.bob_id)

        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)

        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')

        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            }], 'Changed title to Albert1 title.')

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_2, [{
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 2 Albert title'
            }], 'Changed title to Albert2 title.')

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
                False, [self.albert_id], [], [], [self.albert_id],
                {self.albert_id: 1},
                self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
                )}

        # check actual summaries equal expected summaries.
        self.assertEqual(actual_summaries.keys(),
                         expected_summaries.keys())
        simple_props = ['id', 'title', 'category', 'objective',
                        'language_code', 'tags', 'ratings',
                        'scaled_average_rating', 'status',
                        'community_owned', 'owner_ids',
                        'editor_ids', 'viewer_ids',
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
                rights_manager.ACTIVITY_STATUS_PRIVATE,
                False, [self.albert_id], [], [], [self.albert_id, self.bob_id],
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
                False, [self.albert_id], [], [], [self.albert_id],
                {self.albert_id: 1}, self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
            )
        }

        # check actual summaries equal expected summaries.
        self.assertEqual(actual_summaries.keys(),
                         expected_summaries.keys())
        simple_props = ['id', 'title', 'category', 'objective',
                        'language_code', 'tags', 'ratings', 'status',
                        'community_owned', 'owner_ids',
                        'editor_ids', 'viewer_ids', 'contributor_ids',
                        'version', 'exploration_model_created_on',
                        'exploration_model_last_updated']
        for exp_id in actual_summaries:
            for prop in simple_props:
                self.assertEqual(getattr(actual_summaries[exp_id], prop),
                                 getattr(expected_summaries[exp_id], prop))


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
      audio_translations: {}
      html: Congratulations, you have finished!
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
  %s:
    classifier_model_id: null
    content:
      audio_translations: {}
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
          audio_translations: {}
          html: ''
        labelled_as_correct: false
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: Continue
      solution: null
    param_changes: []
states_schema_version: %d
tags: []
title: Old Title
""") % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    def setUp(self):
        super(ExplorationConversionPipelineTests, self).setUp()

        # Setup user who will own the test explorations.
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)

        # Create exploration that uses a states schema version of 0 and ensure
        # it is properly converted.
        self.save_new_exp_with_states_schema_v0(
            self.OLD_EXP_ID, self.albert_id, 'Old Title')

        # Create standard exploration that should not be converted.
        new_exp = self.save_new_valid_exploration(
            self.NEW_EXP_ID, self.albert_id)
        self._up_to_date_yaml = new_exp.to_yaml()

    def test_converts_exp_model_with_default_states_schema_version(self):
        exploration = exp_services.get_exploration_by_id(self.OLD_EXP_ID)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
        self.assertEqual(exploration.to_yaml(), self.UPGRADED_EXP_YAML)

    def test_does_not_convert_up_to_date_exploration(self):
        exploration = exp_services.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
        self.assertEqual(exploration.to_yaml(), self._up_to_date_yaml)

    def test_migration_then_reversion_maintains_valid_exploration(self):
        """This integration test simulates the behavior of the domain layer
        prior to the introduction of a states schema. In particular, it deals
        with an exploration that was created before any states schema
        migrations occur. The exploration is constructed using multiple change
        lists, then a migration job is run. The test thereafter tests if
        reverting to a version prior to the migration still maintains a valid
        exploration. It tests both the exploration domain object and the
        exploration model stored in the datastore for validity.

        Note: It is important to distinguish between when the test is testing
        the exploration domain versus its model. It is operating at the domain
        layer when using exp_services.get_exploration_by_id. Otherwise, it
        loads the model explicitly using exp_models.ExplorationModel.get and
        then converts it to an exploration domain object for validation using
        exp_services.get_exploration_from_model. This is NOT the same process
        as exp_services.get_exploration_by_id as it skips many steps which
        include the conversion pipeline (which is crucial to this test).
        """
        exp_id = 'exp_id2'

        # Create a exploration with states schema version 0.
        self.save_new_exp_with_states_schema_v0(
            exp_id, self.albert_id, 'Old Title')

        # Load the exploration without using the conversion pipeline. All of
        # these changes are to happen on an exploration with states schema
        # version 0.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)

        # In version 1, the title was 'Old title'.
        # In version 2, the title becomes 'New title'.
        exploration_model.title = 'New title'
        exploration_model.commit(
            self.albert_id, 'Changed title.', [])

        # Version 2 of exploration.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)

        # Store state id mapping model for new exploration.
        exploration = exp_services.get_exploration_from_model(exploration_model)
        exp_services.create_and_save_state_id_mapping_model(exploration, [])

        # In version 3, a new state is added.
        new_state = copy.deepcopy(
            self.VERSION_0_STATES_DICT[feconf.DEFAULT_INIT_STATE_NAME])
        new_state['interaction']['id'] = 'TextInput'
        exploration_model.states['New state'] = new_state

        # Properly link in the new state to avoid an invalid exploration.
        init_state = exploration_model.states[feconf.DEFAULT_INIT_STATE_NAME]
        init_handler = init_state['interaction']['handlers'][0]
        init_handler['rule_specs'][0]['dest'] = 'New state'

        exploration_model.commit(
            'committer_id_v3', 'Added new state', [])

        # Version 3 of exploration.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)

        # Store state id mapping model for new exploration.
        exploration = exp_services.get_exploration_from_model(exploration_model)

        # Change list for version 3.
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }]
        exp_services.create_and_save_state_id_mapping_model(
            exploration, change_list)

        # Version 4 is an upgrade based on the migration job.

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)

        self.process_and_flush_pending_tasks()

        # Verify the latest version of the exploration has the most up-to-date
        # states schema version.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)
        exploration = exp_services.get_exploration_from_model(
            exploration_model, run_conversion=False)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

        # The exploration should be valid after conversion.
        exploration.validate(strict=True)

        # Version 5 is a reversion to version 1.
        exp_services.revert_exploration('committer_id_v4', exp_id, 4, 1)

        # The exploration model itself should now be the old version
        # (pre-migration).
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)
        self.assertEqual(exploration_model.states_schema_version, 0)

        # The exploration domain object should be updated since it ran through
        # the conversion pipeline.
        exploration = exp_services.get_exploration_by_id(exp_id)

        # The reversion after migration should still be an up-to-date
        # exploration. exp_services.get_exploration_by_id will automatically
        # keep it up-to-date.
        self.assertEqual(exploration.to_yaml(), self.UPGRADED_EXP_YAML)

        # The exploration should be valid after reversion.
        exploration.validate(strict=True)

        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            exp_id)

        # These are used to verify the correct history has been recorded after
        # both migration and reversion.
        commit_dict_5 = {
            'committer_id': 'committer_id_v4',
            'commit_message': 'Reverted exploration to version 1',
            'version_number': 5,
        }
        commit_dict_4 = {
            'committer_id': feconf.MIGRATION_BOT_USERNAME,
            'commit_message':
                'Update exploration states from schema version 0 to %d.' %
                feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION,
            'commit_cmds': [{
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '0',
                'to_version': str(
                    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
            }],
            'version_number': 4,
        }

        # Ensure there have been 5 commits.
        self.assertEqual(len(snapshots_metadata), 5)

        # Ensure the correct commit logs were entered during both migration and
        # reversion. Also, ensure the correct commit command was written during
        # migration.
        self.assertDictContainsSubset(commit_dict_4, snapshots_metadata[3])
        self.assertDictContainsSubset(commit_dict_5, snapshots_metadata[4])
        self.assertLess(
            snapshots_metadata[3]['created_on_ms'],
            snapshots_metadata[4]['created_on_ms'])

        # Ensure that if a converted, then reverted, then converted exploration
        # is saved, it will be the up-to-date version within the datastore.
        exp_services.update_exploration(
            self.albert_id, exp_id, [], 'Resave after reversion')
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)
        exploration = exp_services.get_exploration_from_model(
            exploration_model,
            run_conversion=False)

        # This exploration should be both up-to-date and valid.
        self.assertEqual(exploration.to_yaml(), self.UPGRADED_EXP_YAML)
        exploration.validate(strict=True)

    def test_loading_old_exploration_does_not_break_domain_object_ctor(self):
        """This test attempts to load an exploration that is stored in the data
        store as pre-states schema version 0. The
        exp_services.get_exploration_by_id function should properly load and
        convert the exploration without any issues. Structural changes to the
        states schema will not break the exploration domain class constructor.
        """
        exp_id = 'exp_id3'

        # Create a exploration with states schema version 0 and an old states
        # blob.
        self.save_new_exp_with_states_schema_v0(
            exp_id, self.albert_id, 'Old Title')

        # Ensure the exploration was converted.
        exploration = exp_services.get_exploration_by_id(exp_id)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

        # The converted exploration should be up-to-date and properly
        # converted.
        self.assertEqual(exploration.to_yaml(), self.UPGRADED_EXP_YAML)


class SuggestionActionUnitTests(test_utils.GenericTestBase):
    """Test learner suggestion action functions in exp_services."""
    THREAD_ID1 = '1111'
    EXP_ID1 = 'exp_id1'
    EXP_ID2 = 'exp_id2'
    USER_EMAIL = 'user@123.com'
    EDITOR_EMAIL = 'editor@123.com'
    USERNAME = 'user123'
    EDITOR_USERNAME = 'editor123'
    COMMIT_MESSAGE = 'commit message'
    EMPTY_COMMIT_MESSAGE = ' '

    def _generate_thread_id(self, unused_exp_id):
        return self.THREAD_ID1

    def _return_true(self, unused_thread_id, unused_exploration_id):
        return True

    def _return_false(self, unused_thread_id, unused_exploration_id):
        return False

    def _check_commit_message(
            self, unused_user_id, unused_exploration_id, unused_change_list,
            commit_message, is_suggestion):
        self.assertTrue(is_suggestion)
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                self.USERNAME, self.COMMIT_MESSAGE))

    def setUp(self):
        super(SuggestionActionUnitTests, self).setUp()
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        user_services.create_new_user(self.user_id, self.USER_EMAIL)
        user_services.create_new_user(self.editor_id, self.EDITOR_EMAIL)
        self.signup(self.USER_EMAIL, self.USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        exploration = self.save_new_valid_exploration(
            self.EXP_ID1, self.editor_id)
        self.save_new_valid_exploration(self.EXP_ID2, self.editor_id)
        self.initial_state_name = exploration.init_state_name
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self._generate_thread_id):
            feedback_services.create_suggestion(
                self.EXP_ID1, self.user_id, 3, self.initial_state_name,
                'description', 'new text')
            feedback_services.create_suggestion(
                self.EXP_ID2, self.user_id, 3, self.initial_state_name,
                'description', 'new text')

    def test_accept_suggestion_valid_suggestion(self):
        with self.swap(
            exp_services, '_is_suggestion_valid',
            self._return_true):
            with self.swap(
                exp_services, 'update_exploration',
                self._check_commit_message):
                exp_services.accept_suggestion(
                    self.editor_id, self.THREAD_ID1, self.EXP_ID1,
                    self.COMMIT_MESSAGE, False)
        thread = feedback_models.FeedbackThreadModel.get(
            feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID1, self.THREAD_ID1))
        thread_messages = feedback_services.get_messages(
            self.EXP_ID1, self.THREAD_ID1)
        last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_FIXED)
        self.assertEqual(last_message.text, 'Suggestion accepted.')

    def test_accept_suggestion_invalid_suggestion(self):
        with self.swap(
            exp_services, '_is_suggestion_valid',
            self._return_false):
            with self.assertRaisesRegexp(
                Exception,
                'Invalid suggestion: The state for which it was made '
                'has been removed/renamed.'
                ):
                exp_services.accept_suggestion(
                    self.editor_id, self.THREAD_ID1, self.EXP_ID2,
                    self.COMMIT_MESSAGE, False)
        thread = feedback_models.FeedbackThreadModel.get(
            feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID2, self.THREAD_ID1))
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_OPEN)

    def test_accept_suggestion_empty_commit_message(self):
        with self.assertRaisesRegexp(
            Exception, 'Commit message cannot be empty.'):
            exp_services.accept_suggestion(
                self.editor_id, self.THREAD_ID1, self.EXP_ID2,
                self.EMPTY_COMMIT_MESSAGE, False)
        thread = feedback_models.FeedbackThreadModel.get(
            feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID2, self.THREAD_ID1))
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_OPEN)

    def test_accept_suggestion_that_has_already_been_handled(self):
        exception_message = 'Suggestion has already been accepted/rejected'
        with self.swap(
            exp_services, '_is_suggestion_handled',
            self._return_true):
            with self.assertRaisesRegexp(Exception, exception_message):
                exp_services.accept_suggestion(
                    self.editor_id, self.THREAD_ID1, self.EXP_ID2,
                    self.COMMIT_MESSAGE, False)

    def test_reject_suggestion(self):
        exp_services.reject_suggestion(
            self.editor_id, self.THREAD_ID1, self.EXP_ID2)
        thread = feedback_models.FeedbackThreadModel.get(
            feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID2, self.THREAD_ID1))
        self.assertEqual(
            thread.status,
            feedback_models.STATUS_CHOICES_IGNORED)

    def test_reject_suggestion_that_has_already_been_handled(self):
        exception_message = 'Suggestion has already been accepted/rejected'
        with self.swap(
            exp_services, '_is_suggestion_handled',
            self._return_true):
            with self.assertRaisesRegexp(Exception, exception_message):
                exp_services.reject_suggestion(
                    self.editor_id, self.THREAD_ID1, self.EXP_ID2)


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
    NEW_CHANGELIST = [{
        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
        'property_name': 'title',
        'new_value': 'New title'}]

    def setUp(self):
        super(EditorAutoSavingUnitTests, self).setUp()
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
        # Explorations with draft set.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID1), user_id=self.USER_ID,
            exploration_id=self.EXP_ID1,
            draft_change_list=self.draft_change_list,
            draft_change_list_last_updated=self.DATETIME,
            draft_change_list_exp_version=2,
            draft_change_list_id=2).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID2), user_id=self.USER_ID,
            exploration_id=self.EXP_ID2,
            draft_change_list=self.draft_change_list,
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
            exp_user_data.draft_change_list, self.NEW_CHANGELIST)
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
            exp_user_data.draft_change_list, self.draft_change_list)
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
            exp_user_data.draft_change_list, self.NEW_CHANGELIST)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.NEWER_DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 5)
        self.assertEqual(exp_user_data.draft_change_list_id, 1)

    def test_get_exp_with_draft_applied_when_draft_exists(self):
        exploration = exp_services.get_exploration_by_id(self.EXP_ID1)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID1, self.USER_ID)
        param_changes = updated_exp.init_state.param_changes[0]
        self.assertEqual(param_changes._name, 'myParam')
        self.assertEqual(param_changes._generator_id, 'RandomSelector')
        self.assertEqual(
            param_changes._customization_args,
            {'list_of_values': ['1', '2'], 'parse_with_jinja': False})

    def test_get_exp_with_draft_applied_when_draft_does_not_exist(self):
        exploration = exp_services.get_exploration_by_id(self.EXP_ID3)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID3, self.USER_ID)
        self.assertEqual(updated_exp.init_state.param_changes, [])

    def test_get_exp_with_draft_applied_when_draft_version_is_invalid(self):
        exploration = exp_services.get_exploration_by_id(self.EXP_ID2)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID2, self.USER_ID)
        self.assertEqual(updated_exp.init_state.param_changes, [])

    def test_draft_discarded(self):
        exp_services.discard_draft(self.EXP_ID1, self.USER_ID,)
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID1))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)


class GetExplorationAndExplorationRightsTest(ExplorationServicesUnitTests):

    def test_get_exploration_and_exploration_rights_object(self):
        exploration_id = self.EXP_ID
        self.save_new_valid_exploration(
            exploration_id, self.owner_id, objective='The objective')

        (exp, exp_rights) = (
            exp_services.get_exploration_and_exploration_rights_by_id(
                exploration_id))
        self.assertEqual(exp.id, exploration_id)
        self.assertEqual(exp_rights.id, exploration_id)

        (exp, exp_rights) = (
            exp_services.get_exploration_and_exploration_rights_by_id(
                'fake_id'))
        self.assertIsNone(exp)
        self.assertIsNone(exp_rights)


class ExplorationStateIdMappingTests(test_utils.GenericTestBase):
    """Tests for functions associated with creating and updating state id
    mapping.
    """

    EXP_ID = 'eid'

    def setUp(self):
        """Initialize owner before each test case."""
        super(ExplorationStateIdMappingTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_that_correct_state_id_mapping_model_is_stored(self):
        """Test that correct mapping model is stored for new and edited
        exploration.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exploration = self.save_new_valid_exploration(
                self.EXP_ID, self.owner_id)

        mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, exploration.version)
        expected_mapping = {
            exploration.init_state_name: 0
        }

        self.assertEqual(mapping.exploration_id, self.EXP_ID)
        self.assertEqual(mapping.exploration_version, 1)
        self.assertEqual(
            mapping.largest_state_id_used, 0)
        self.assertDictEqual(mapping.state_names_to_ids, expected_mapping)

        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [{
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                }], 'Add state name')

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        expected_mapping = {
            new_exploration.init_state_name: 0,
            'new state': 1
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 1)

    def test_that_state_id_mapping_model_is_deleted(self):
        """Test that state id mapping model is correctly deleted."""
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exploration = self.save_new_valid_exploration(
                self.EXP_ID, self.owner_id)
            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [{
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                }], 'Add state name')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)

        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exp_services.delete_state_id_mapping_model_for_exploration(
                exploration.id, exploration.version)

        with self.assertRaisesRegexp(
            Exception,
            "Entity for class StateIdMappingModel with id eid.2 not found"):
            exp_services.get_state_id_mapping(
                exploration.id, exploration.version)

        with self.assertRaisesRegexp(
            Exception,
            "Entity for class StateIdMappingModel with id eid.1 not found"):
            exp_services.get_state_id_mapping(
                exploration.id, exploration.version - 1)


    def test_that_mapping_is_correct_when_exploration_is_reverted(self):
        """Test that state id mapping is correct when exploration is reverted
        to old version.
        """
        with self.swap(feconf, 'ENABLE_STATE_ID_MAPPING', True):
            exploration = self.save_new_valid_exploration(
                self.EXP_ID, self.owner_id)

            exp_services.update_exploration(
                self.owner_id, self.EXP_ID, [{
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'new state',
                }], 'Add state name')

            # Revert exploration to version 1.
            exp_services.revert_exploration(self.owner_id, self.EXP_ID, 2, 1)

        new_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        new_mapping = exp_services.get_state_id_mapping(
            self.EXP_ID, new_exploration.version)

        # Expected mapping is same as initial version's mapping.
        expected_mapping = {
            exploration.init_state_name: 0
        }
        self.assertEqual(
            new_mapping.exploration_version, new_exploration.version)
        self.assertEqual(new_mapping.state_names_to_ids, expected_mapping)
        self.assertEqual(new_mapping.largest_state_id_used, 1)
