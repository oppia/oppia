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

from __future__ import annotations

import datetime
import logging
import os
import re
import zipfile

from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import classifier_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_services
from core.domain import opportunity_services
from core.domain import param_domain
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import search_services
from core.domain import state_domain
from core.domain import stats_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subscription_services
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import translation_fetchers
from core.domain import translation_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
from extensions import domain

from typing import (
    Dict, Final, List, Optional, Sequence, Tuple, Type, Union, cast
)

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import feedback_models
    from mypy_imports import opportunity_models
    from mypy_imports import recommendations_models
    from mypy_imports import stats_models
    from mypy_imports import suggestion_models
    from mypy_imports import user_models

(
    feedback_models,
    exp_models,
    opportunity_models,
    recommendations_models,
    translation_models,
    stats_models,
    suggestion_models,
    user_models
) = models.Registry.import_models([
    models.Names.FEEDBACK,
    models.Names.EXPLORATION,
    models.Names.OPPORTUNITY,
    models.Names.RECOMMENDATIONS,
    models.Names.TRANSLATION,
    models.Names.STATISTICS,
    models.Names.SUGGESTION,
    models.Names.USER
])

search_services = models.Registry.import_search_services()

# TODO(msl): Test ExpSummaryModel changes if explorations are updated,
# reverted, deleted, created, rights changed.


TestCustArgDictType = Dict[
    str,
    Dict[str, Union[bool, Dict[str, Union[str, List[Dict[str, Union[str, Dict[
        str, Union[str, List[List[float]]]]
    ]]]]]]]
]


def count_at_least_editable_exploration_summaries(user_id: str) -> int:
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

    EXP_0_ID: Final = 'An_exploration_0_id'
    EXP_1_ID: Final = 'An_exploration_1_id'
    EXP_2_ID: Final = 'An_exploration_2_id'

    def setUp(self) -> None:
        """Before each individual test, create a dummy exploration."""
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))

        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.user_id_admin)


class ExplorationRevertClassifierTests(ExplorationServicesUnitTests):
    """Test that classifier models are correctly mapped when an exploration
    is reverted.
    """

    def test_raises_key_error_for_invalid_id(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            'tes_exp_id', title='some title', category='Algebra',
            language_code=constants.DEFAULT_LANGUAGE_CODE
        )
        exploration.objective = 'An objective'
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], 'NumericInput',
            content_id_generator
        )
        exp_services.save_new_exploration(self.owner_id, exploration)

        interaction_answer_groups = [{
            'rule_specs': [{
                    'inputs': {
                        'x': 60
                    },
                    'rule_type': 'IsLessThanOrEqualTo'
            }],
            'outcome': {
                'dest': feconf.DEFAULT_INIT_STATE_NAME,
                'dest_if_really_stuck': None,
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
        with self.assertRaisesRegex(
            Exception,
            'No classifier algorithm found for NumericInput interaction'
        ):
            with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
                with self.swap(feconf, 'MIN_TOTAL_TRAINING_EXAMPLES', 2):
                    with self.swap(feconf, 'MIN_ASSIGNED_LABELS', 1):
                        exp_services.update_exploration(
                            self.owner_id, 'tes_exp_id', change_list, '')

    def test_reverting_an_exploration_maintains_classifier_models(self) -> None:
        """Test that when exploration is reverted to previous version
        it maintains appropriate classifier models mapping.
        """
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            self.save_new_valid_exploration(
                self.EXP_0_ID, self.owner_id, title='Bridges in England',
                category='Architecture', language_code='en')

        interaction_answer_groups: List[state_domain.AnswerGroupDict] = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {
                    'x': {
                        'contentId': 'rule_input_3',
                        'normalizedStrSet': ['abc']
                    }
                },
            }],
            'outcome': {
                'dest': feconf.DEFAULT_INIT_STATE_NAME,
                'dest_if_really_stuck': None,
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
        interaction_id = exp.states[
            feconf.DEFAULT_INIT_STATE_NAME].interaction.id
        # Ruling out the possibility of None for mypy type checking.
        assert interaction_id is not None
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_id']
        job = classifier_services.get_classifier_training_job(
            self.EXP_0_ID, exp.version, feconf.DEFAULT_INIT_STATE_NAME,
            algorithm_id)
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

        new_job = classifier_services.get_classifier_training_job(
            self.EXP_0_ID, exp.version, feconf.DEFAULT_INIT_STATE_NAME,
            algorithm_id)
        # Ruling out the possibility of None for mypy type checking.
        assert new_job is not None
        assert job is not None
        self.assertEqual(job.job_id, new_job.job_id)


class ExplorationQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests query methods."""

    def test_raises_error_if_guest_user_try_to_publish_the_exploration(
        self
    ) -> None:
        guest_user = user_services.get_user_actions_info(None)
        with self.assertRaisesRegex(
            Exception,
            'To publish explorations and update users\' profiles, '
            'user must be logged in and have admin access.'
        ):
            exp_services.publish_exploration_and_update_user_profiles(
                guest_user, 'exp_id'
            )

    def test_get_exploration_titles_and_categories(self) -> None:
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories([]), {})

        self.save_new_default_exploration('A', self.owner_id, title='TitleA')
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A']), {
                'A': {
                    'category': 'Algebra',
                    'title': 'TitleA'
                }
            })

        self.save_new_default_exploration('B', self.owner_id, title='TitleB')
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A']), {
                'A': {
                    'category': 'Algebra',
                    'title': 'TitleA'
                }
            })
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A', 'B']), {
                'A': {
                    'category': 'Algebra',
                    'title': 'TitleA',
                },
                'B': {
                    'category': 'Algebra',
                    'title': 'TitleB',
                },
            })
        self.assertEqual(
            exp_services.get_exploration_titles_and_categories(['A', 'C']), {
                'A': {
                    'category': 'Algebra',
                    'title': 'TitleA'
                }
            })

    def test_get_interaction_id_for_state(self) -> None:
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        exp = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exp.has_state_name('Introduction'), True)
        self.assertEqual(exp.has_state_name('Fake state name'), False)
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_0_ID,
            _get_change_list(
                'Introduction', exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput') +
            _get_change_list(
                'Introduction',
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>Option A</p>'
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': '<p>Option B</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': False}
                }
            ),
            ''
        )
        self.assertEqual(exp_services.get_interaction_id_for_state(
            self.EXP_0_ID, 'Introduction'), 'MultipleChoiceInput')
        with self.assertRaisesRegex(
            Exception, 'There exist no state in the exploration'):
            exp_services.get_interaction_id_for_state(
                self.EXP_0_ID, 'Fake state name')


class ExplorationSummaryQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests exploration query methods which operate on ExplorationSummary
    objects.
    """

    EXP_ID_0: Final = '0_en_arch_bridges_in_england'
    EXP_ID_1: Final = '1_fi_arch_sillat_suomi'
    EXP_ID_2: Final = '2_en_welcome_introduce_oppia'
    EXP_ID_3: Final = '3_en_welcome_introduce_oppia_interactions'
    EXP_ID_4: Final = '4_en_welcome'
    EXP_ID_5: Final = '5_fi_welcome_vempain'
    EXP_ID_6: Final = '6_en_languages_learning_basic_verbs_in_spanish'
    EXP_ID_7: Final = '7_en_languages_private_exploration_in_spanish'

    def setUp(self) -> None:
        super().setUp()

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

    def test_get_exploration_summaries_with_no_query(self) -> None:
        # An empty query should return all explorations.
        (exp_ids, search_offset) = (
            exp_services.get_exploration_ids_matching_query('', [], []))
        self.assertEqual(sorted(exp_ids), [
            self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3,
            self.EXP_ID_4, self.EXP_ID_5, self.EXP_ID_6
        ])
        self.assertIsNone(search_offset)

    def test_get_exploration_summaries_with_deleted_explorations(self) -> None:
        # Ensure a deleted exploration does not show up in search results.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_0)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_1)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_3)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_5)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_6)

        exp_ids = (
            exp_services.get_exploration_ids_matching_query('', [], []))[0]
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_4])

        exp_services.delete_exploration(self.owner_id, self.EXP_ID_2)
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_4)

        # If no explorations are loaded, a blank query should not get any
        # explorations.
        self.assertEqual(
            exp_services.get_exploration_ids_matching_query('', [], []),
            ([], None))

    def test_get_exploration_summaries_with_deleted_explorations_multi(
        self
    ) -> None:
        # Ensure a deleted exploration does not show up in search results.
        exp_services.delete_explorations(
            self.owner_id,
            [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3,
             self.EXP_ID_5, self.EXP_ID_6])

        exp_ids = (
            exp_services.get_exploration_ids_matching_query('', [], []))[0]
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_4])

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_ID_2, self.EXP_ID_4])

        # If no explorations are loaded, a blank query should not get any
        # explorations.
        self.assertEqual(
            exp_services.get_exploration_ids_matching_query('', [], []),
            ([], None))

    def test_get_subscribed_users_activity_ids_with_deleted_explorations(
        self
    ) -> None:
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

    def test_search_exploration_summaries(self) -> None:
        # Search within the 'Architecture' category.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            '', ['Architecture'], [])
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_0, self.EXP_ID_1])

        # Search for explorations in Finnish.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            '', [], ['fi'])
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_1, self.EXP_ID_5])

        # Search for Finnish explorations in the 'Architecture' category.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            '', ['Architecture'], ['fi'])
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_1])

        # Search for explorations containing 'Oppia'.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            'Oppia', [], [])
        self.assertEqual(
            sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_3, self.EXP_ID_5])

        # Search for explorations containing 'Oppia' and 'Introduce'.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            'Oppia Introduce', [], [])
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_2, self.EXP_ID_3])

        # Search for explorations containing 'England' in English.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            'England', [], ['en'])
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_0])

        # Search for explorations containing 'in'.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            'in', [], [])
        self.assertEqual(
            sorted(exp_ids), [self.EXP_ID_0, self.EXP_ID_3, self.EXP_ID_6])

        # Search for explorations containing 'in' in the 'Architecture' and
        # 'Welcome' categories.
        exp_ids, _ = exp_services.get_exploration_ids_matching_query(
            'in', ['Architecture', 'Welcome'], [])
        self.assertEqual(sorted(exp_ids), [self.EXP_ID_0, self.EXP_ID_3])

    def test_exploration_summaries_pagination_in_filled_search_results(
        self
    ) -> None:
        # Ensure the maximum number of explorations that can fit on the search
        # results page is maintained by the summaries function.
        with self.swap(feconf, 'SEARCH_RESULTS_PAGE_SIZE', 3):
            # Need to load 3 pages to find all of the explorations. Since the
            # returned order is arbitrary, we need to concatenate the results
            # to ensure all explorations are returned. We validate the correct
            # length is returned each time.
            found_exp_ids = []

            # Page 1: 3 initial explorations.
            (exp_ids, search_offset) = (
                exp_services.get_exploration_ids_matching_query(
                    '', [], []))
            self.assertEqual(len(exp_ids), 3)
            self.assertIsNotNone(search_offset)
            found_exp_ids += exp_ids

            # Page 2: 3 more explorations.
            (exp_ids, search_offset) = (
                exp_services.get_exploration_ids_matching_query(
                    '', [], [], offset=search_offset))
            self.assertEqual(len(exp_ids), 3)
            self.assertIsNotNone(search_offset)
            found_exp_ids += exp_ids

            # Page 3: 1 final exploration.
            (exp_ids, search_offset) = (
                exp_services.get_exploration_ids_matching_query(
                    '', [], [], offset=search_offset))
            self.assertEqual(len(exp_ids), 1)
            self.assertIsNone(search_offset)
            found_exp_ids += exp_ids

            # Validate all explorations were seen.
            self.assertEqual(sorted(found_exp_ids), [
                self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3,
                self.EXP_ID_4, self.EXP_ID_5, self.EXP_ID_6])

    def test_get_exploration_ids_matching_query_with_stale_exploration_ids(
        self
    ) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        search_results_page_size_swap = self.swap(
            feconf, 'SEARCH_RESULTS_PAGE_SIZE', 6)
        max_iterations_swap = self.swap(exp_services, 'MAX_ITERATIONS', 1)

        def _mock_delete_documents_from_index(
            unused_doc_ids: List[str], unused_index: str
        ) -> None:
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
                exp_services.get_exploration_ids_matching_query('', [], []))

        self.assertEqual(
            observed_log_messages,
            [
                'Search index contains stale exploration ids: '
                '0_en_arch_bridges_in_england, 1_fi_arch_sillat_suomi',
                'Could not fulfill search request for query string ; at '
                'least 1 retries were needed.'
            ]
        )
        self.assertEqual(len(exp_ids), 4)


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_soft_deletion_of_exploration(self) -> None:
        """Test that soft deletion of exploration works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        # The exploration shows up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 1)

        exp_services.delete_exploration(self.owner_id, self.EXP_0_ID)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id An_exploration_0_id '
            'not found'):
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

    def test_deletion_of_multiple_explorations_empty(self) -> None:
        """Test that delete_explorations with empty list works correctly."""
        exp_services.delete_explorations(self.owner_id, [])
        self.process_and_flush_pending_tasks()

    def test_soft_deletion_of_multiple_explorations(self) -> None:
        """Test that soft deletion of explorations works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        # The explorations show up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 2)

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])
        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id An_exploration_0_id '
            'not found'):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id An_exploration_1_id '
            'not found'):
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

    def test_hard_deletion_of_exploration(self) -> None:
        """Test that hard deletion of exploration works correctly."""
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        # The exploration shows up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 1)

        exp_services.delete_exploration(
            self.owner_id, self.EXP_0_ID, force_deletion=True)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id An_exploration_0_id '
            'not found'):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        # The deleted exploration does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # The exploration model has been purged from the backend.
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_0_ID))

    def test_hard_deletion_of_multiple_explorations(self) -> None:
        """Test that hard deletion of explorations works correctly."""
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        # The explorations show up in queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 2)

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID], force_deletion=True)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id An_exploration_0_id '
            'not found'):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id An_exploration_1_id '
            'not found'):
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

    def test_summaries_of_hard_deleted_explorations(self) -> None:
        """Test that summaries of hard deleted explorations are
        correctly deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)

        exp_services.delete_exploration(
            self.owner_id, self.EXP_0_ID, force_deletion=True)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id An_exploration_0_id '
            'not found'):
            exp_fetchers.get_exploration_by_id(self.EXP_0_ID)

        # The deleted exploration summary does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_exploration_summaries(self.owner_id), 0)

        # The exploration summary model has been purged from the backend.
        self.assertIsNone(
            exp_models.ExpSummaryModel.get_by_id(self.EXP_0_ID))

    def test_recommendations_of_deleted_explorations_are_deleted(self) -> None:
        """Test that recommendations for deleted explorations are correctly
        deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        recommendations_models.ExplorationRecommendationsModel(
            id=self.EXP_0_ID,
            recommended_exploration_ids=[]
        ).put()
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        recommendations_models.ExplorationRecommendationsModel(
            id=self.EXP_1_ID,
            recommended_exploration_ids=[]
        ).put()

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])

        # The recommendations model has been purged from the backend.
        self.assertIsNone(
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                self.EXP_0_ID))
        self.assertIsNone(
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                self.EXP_1_ID))

    def test_opportunity_of_deleted_explorations_are_deleted(self) -> None:
        """Test that opportunity summary for deleted explorations are correctly
        deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        opportunity_models.ExplorationOpportunitySummaryModel(
            id=self.EXP_0_ID,
            topic_id='topic_id',
            topic_name='topic_name',
            story_id='story_id',
            story_title='story_title',
            chapter_title='chapter_title',
            content_count=1,
        ).put()
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        opportunity_models.ExplorationOpportunitySummaryModel(
            id=self.EXP_1_ID,
            topic_id='topic_id',
            topic_name='topic_name',
            story_id='story_id',
            story_title='story_title',
            chapter_title='chapter_title',
            content_count=1,
        ).put()

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])

        # The opportunity model has been purged from the backend.
        self.assertIsNone(
            opportunity_models.ExplorationOpportunitySummaryModel.get_by_id(
                self.EXP_0_ID))
        self.assertIsNone(
            opportunity_models.ExplorationOpportunitySummaryModel.get_by_id(
                self.EXP_1_ID))

    def test_activities_of_deleted_explorations_are_deleted(self) -> None:
        """Test that opportunity summary for deleted explorations are correctly
        deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        user_models.CompletedActivitiesModel(
            id=self.editor_id,
            exploration_ids=[self.EXP_0_ID],
        ).put()
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        user_models.IncompleteActivitiesModel(
            id=self.owner_id,
            exploration_ids=[self.EXP_1_ID],
        ).put()

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])
        self.process_and_flush_pending_tasks()

        self.assertEqual(
            user_models.CompletedActivitiesModel.get(
                self.editor_id, strict=True
            ).exploration_ids,
            []
        )
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get(
                self.owner_id, strict=True
            ).exploration_ids,
            []
        )

    def test_user_data_of_deleted_explorations_are_deleted(self) -> None:
        """Test that user data for deleted explorations are deleted."""
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_0_ID),
            user_id=self.owner_id,
            exploration_id=self.EXP_0_ID,
        ).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % ('other_user_id', self.EXP_0_ID),
            user_id='other_user_id',
            exploration_id=self.EXP_0_ID,
        ).put()
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.owner_id, self.EXP_1_ID),
            user_id=self.owner_id,
            exploration_id=self.EXP_1_ID,
        ).put()

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])
        self.process_and_flush_pending_tasks()

        # The user data model has been purged from the backend.
        self.assertIsNone(
            user_models.ExplorationUserDataModel.get(
                self.owner_id, self.EXP_0_ID))
        self.assertIsNone(
            user_models.ExplorationUserDataModel.get(
                'other_user_id', self.EXP_0_ID))
        self.assertIsNone(
            user_models.ExplorationUserDataModel.get(
                self.owner_id, self.EXP_1_ID))

    def test_deleted_explorations_are_removed_from_user_contributions(
        self
    ) -> None:
        """Test that user data for deleted explorations are deleted."""
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        user_models.UserContributionsModel(
            id=self.owner_id,
            created_exploration_ids=[self.EXP_0_ID, self.EXP_2_ID],
        ).put()
        user_models.UserContributionsModel(
            id='user_id',
            edited_exploration_ids=[self.EXP_0_ID, self.EXP_2_ID],
        ).put()
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)
        user_models.UserContributionsModel(
            id='other_user_id',
            created_exploration_ids=[self.EXP_0_ID, self.EXP_2_ID],
            edited_exploration_ids=[self.EXP_1_ID],
        ).put()

        exp_services.delete_explorations(
            self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])
        self.process_and_flush_pending_tasks()

        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.owner_id
            ).created_exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                'user_id'
            ).edited_exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                'other_user_id'
            ).created_exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                'other_user_id'
            ).edited_exploration_ids,
            []
        )

    def test_feedbacks_belonging_to_exploration_are_deleted(self) -> None:
        """Tests that feedbacks belonging to exploration are deleted."""
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        thread_1_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_0_ID,
            self.owner_id,
            'subject',
            'text'
        )
        thread_2_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_0_ID,
            self.owner_id,
            'subject 2',
            'text 2'
        )

        exp_services.delete_explorations(self.owner_id, [self.EXP_0_ID])

        self.assertIsNone(feedback_models.GeneralFeedbackThreadModel.get_by_id(
            thread_1_id))
        self.assertIsNone(feedback_models.GeneralFeedbackThreadModel.get_by_id(
            thread_2_id))

    def test_exploration_is_removed_from_index_when_deleted(self) -> None:
        """Tests that exploration is removed from the search index when
        deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)

        def mock_delete_docs(doc_ids: List[Dict[str, str]], index: str) -> None:
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(doc_ids, [self.EXP_0_ID])

        delete_docs_swap = self.swap(
            search_services, 'delete_documents_from_index', mock_delete_docs)

        with delete_docs_swap:
            exp_services.delete_exploration(self.owner_id, self.EXP_0_ID)

    def test_explorations_are_removed_from_index_when_deleted(self) -> None:
        """Tests that explorations are removed from the search index when
        deleted.
        """
        self.save_new_default_exploration(self.EXP_0_ID, self.owner_id)
        self.save_new_default_exploration(self.EXP_1_ID, self.owner_id)

        def mock_delete_docs(doc_ids: List[Dict[str, str]], index: str) -> None:
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(doc_ids, [self.EXP_0_ID, self.EXP_1_ID])

        delete_docs_swap = self.swap(
            search_services, 'delete_documents_from_index', mock_delete_docs)

        with delete_docs_swap:
            exp_services.delete_explorations(
                self.owner_id, [self.EXP_0_ID, self.EXP_1_ID])

    def test_no_errors_are_raised_when_creating_default_exploration(
        self
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_0_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)

    def test_that_default_exploration_fails_strict_validation(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_0_ID)
        with self.assertRaisesRegex(
            utils.ValidationError,
            'This state does not have any interaction specified.'
            ):
            exploration.validate(strict=True)

    def test_save_new_exploration_with_ml_classifiers(self) -> None:
        exploration_id = 'eid'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
                assets_list)

        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        state_with_training_data = exploration.states['Home']
        self.assertIsNotNone(
            state_with_training_data)
        self.assertEqual(len(state_with_training_data.to_dict()), 8)

    def test_save_and_retrieve_exploration(self) -> None:
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
        self.assertEqual(retrieved_exploration.category, 'Algebra')
        self.assertEqual(len(retrieved_exploration.states), 1)
        self.assertEqual(len(retrieved_exploration.param_specs), 1)
        self.assertEqual(
            list(retrieved_exploration.param_specs.keys())[0], 'theParameter')

    def test_save_and_retrieve_exploration_summary(self) -> None:
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

        self.process_and_flush_pending_tasks()
        retrieved_exp_summary = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_0_ID)

        self.assertEqual(retrieved_exp_summary.title, 'A new title')
        self.assertEqual(retrieved_exp_summary.category, 'A new category')
        self.assertEqual(retrieved_exp_summary.contributor_ids, [self.owner_id])

    def test_apply_change_list(self) -> None:
        self.save_new_linear_exp_with_state_names_and_interactions(
            self.EXP_0_ID, self.owner_id, ['State 1', 'State 2'],
            ['TextInput'], category='Algebra')

        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    }
                },
                'default_outcome': {},
                'ca_placeholder_0': {}
            }
        }
        change_list_voiceover = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': 'State 1',
            'new_value': recorded_voiceovers_dict
        })]
        changed_exploration_voiceover = (
            exp_services.apply_change_list(
                self.EXP_0_ID, change_list_voiceover))
        changed_exp_voiceover_obj = (
            changed_exploration_voiceover.states['State 1'].recorded_voiceovers
        )
        self.assertDictEqual(
            changed_exp_voiceover_obj.to_dict(),
            recorded_voiceovers_dict)
        change_list_objective = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'objective',
            'new_value': 'new objective'
        })]
        changed_exploration_objective = (
            exp_services.apply_change_list(
                self.EXP_0_ID,
                change_list_objective))
        self.assertEqual(
            changed_exploration_objective.objective,
            'new objective')

    def test_publish_exploration_and_update_user_profiles(self) -> None:
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)
        exp_services.update_exploration(
            self.editor_id, self.EXP_0_ID,
            [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'A new title'
                })
            ],
            'changed title'
        )
        exp_services.update_exploration(
            self.voice_artist_id, self.EXP_0_ID,
            [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'Another new title'
                })
            ],
            'changed title again'
        )
        owner_action = user_services.get_user_actions_info(self.owner_id)
        exp_services.publish_exploration_and_update_user_profiles(
            owner_action, self.EXP_0_ID)
        updated_summary = (
            exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID))
        contributer_ids = updated_summary.contributor_ids
        self.assertEqual(len(contributer_ids), 3)
        self.assertFalse(updated_summary.is_private())
        self.assertIn(self.owner_id, contributer_ids)
        self.assertIn(self.editor_id, contributer_ids)
        self.assertIn(self.voice_artist_id, contributer_ids)

    def test_is_voiceover_change_list(self) -> None:
        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    }
                },
                'default_outcome': {},
                'ca_placeholder_0': {}
            }
        }
        change_list_voiceover = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': 'State 1',
            'new_value': recorded_voiceovers_dict
        })]
        self.assertTrue(
            exp_services.is_voiceover_change_list(change_list_voiceover))
        not_voiceover_change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'New title'
        })]
        self.assertFalse(
            exp_services.is_voiceover_change_list(not_voiceover_change_list))

    def test_validation_for_valid_exploration(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id,
            category='Algebra'
        )
        errors = exp_services.validate_exploration_for_story(exploration, False)
        self.assertEqual(len(errors), 0)

    def test_validation_fail_for_exploration_for_invalid_language(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='end',
            language_code='bn', category='Algebra')
        error_string = (
            'Invalid language %s found for exploration '
            'with ID %s. This language is not supported for explorations '
            'in a story on the mobile app.' %
            (exploration.language_code, exploration.id))
        errors = exp_services.validate_exploration_for_story(exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(exploration, True)

    def test_validate_exploration_for_default_category(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Test')
        error_string = (
            'Expected all explorations in a story to '
            'be of a default category. '
            'Invalid exploration: %s' % exploration.id)
        errors = exp_services.validate_exploration_for_story(exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(exploration, True)

    def test_validate_exploration_for_param_specs(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        error_string = (
            'Expected no exploration in a story to have parameter '
            'values in it. Invalid exploration: %s' % exploration.id)
        errors = exp_services.validate_exploration_for_story(exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(exploration, True)

    def test_validate_exploration_for_invalid_interaction_id(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        error_string = (
            'Invalid interaction %s in exploration '
            'with ID: %s. This interaction is not supported for '
            'explorations in a story on the '
            'mobile app.' % ('CodeRepl', exploration.id))
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': exploration.init_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'CodeRepl'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': exploration.init_state_name,
                'property_name': (
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS),
                'new_value': {
                    'language': {
                        'value': 'python'
                    },
                    'placeholder': {
                        'value': '# Type your code here.'
                    },
                    'preCode': {
                        'value': ''
                    },
                    'postCode': {
                        'value': ''
                    }
                }
            })
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed to CodeRepl')
        updated_exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        errors = exp_services.validate_exploration_for_story(
            updated_exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(
            utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(
                updated_exploration, True)

    def test_validation_fail_for_end_exploration(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        error_string = (
            'Explorations in a story are not expected to contain '
            'exploration recommendations. Exploration with ID: '
            '%s contains exploration recommendations in its '
            'EndExploration interaction.' % (exploration.id))
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': exploration.init_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'EndExploration'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': exploration.init_state_name,
                'property_name': (
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS),
                'new_value': {
                    'recommendedExplorationIds': {
                        'value': [
                            'EXP_1',
                            'EXP_2'
                        ]
                    }
                }
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': (
                    exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
                'state_name': exploration.init_state_name,
                'new_value': None})
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            change_list, 'Changed to EndExploration')
        updated_exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        errors = exp_services.validate_exploration_for_story(
            updated_exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(
            utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(
                updated_exploration, True)

    def test_validation_fail_for_multiple_choice_exploration(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        error_string = (
            'Exploration in a story having MultipleChoiceInput '
            'interaction should have at least 4 choices present. '
            'Exploration with ID %s and state name %s have fewer than '
            '4 choices.' % (exploration.id, exploration.init_state_name))
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': exploration.init_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'MultipleChoiceInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': exploration.init_state_name,
                'property_name': (
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS),
                'new_value': {
                    'choices': {
                        'value': [
                            {
                                'content_id': 'ca_choices_0',
                                'html': '<p>1</p>'
                            },
                            {
                                'content_id': 'ca_choices_1',
                                'html': '<p>2</p>'
                            }
                        ]
                    },
                    'showChoicesInShuffledOrder': {
                        'value': True
                    }
                }
            })
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            change_list, 'Changed to MultipleChoiceInput')
        updated_exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        errors = exp_services.validate_exploration_for_story(
            updated_exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(
            utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(
                updated_exploration, True)

    def test_validation_fail_for_android_rte_content(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        error_string = (
            'RTE content in state %s of exploration '
            'with ID %s is not supported on mobile for explorations '
            'in a story.' % (exploration.init_state_name, exploration.id))
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('TextInput')
        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': (
                    '<oppia-noninteractive-collapsible content-with-value='
                    '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;'
                    'quot;" heading-with-value="&amp;quot;SubCollapsible&amp;'
                    'quot;"></oppia-noninteractive-collapsible><p>&nbsp;</p>')
            },
        }
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            init_state.interaction.id, solution_dict
        )
        init_state.update_interaction_solution(solution)
        exploration.states[exploration.init_state_name] = init_state
        errors = exp_services.validate_exploration_for_story(
            exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(
                exploration, True)

    def test_validation_fail_for_state_classifier_model(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        exploration.states[
            feconf.DEFAULT_INIT_STATE_NAME].classifier_model_id = '2'
        error_string = (
            'Explorations in a story are not expected to contain '
            'classifier models. State %s of exploration with ID %s '
            'contains classifier models.' % (
                feconf.DEFAULT_INIT_STATE_NAME, exploration.id
            ))
        errors = exp_services.validate_exploration_for_story(
            exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(
            utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(
                exploration, True)

    def test_validation_fail_for_answer_groups(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        exploration.states[
            feconf.DEFAULT_INIT_STATE_NAME
        ].interaction.answer_groups = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'state 1', None, state_domain.SubtitledHtml(
                    'feedback_1', '<p>state outcome html</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals', {
                        'x': {
                            'contentId': 'rule_input_Equals',
                            'normalizedStrSet': ['Test']
                        }
                    }
                )
            ],
            [
                'cheerful',
                'merry',
                'ecstatic',
                'glad',
                'overjoyed',
                'pleased',
                'thrilled',
                'smile'
            ],
            None
        )]
        error_string = (
            'Explorations in a story are not expected to contain '
            'training data for any answer group. State %s of '
            'exploration with ID %s contains training data in one of '
            'its answer groups.' % (
                feconf.DEFAULT_INIT_STATE_NAME, exploration.id
            )
        )
        errors = exp_services.validate_exploration_for_story(
            exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(
            utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(
                exploration, True)

    def test_validation_fail_for_default_outcome(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, category='Algebra')
        exploration.states[
            feconf.DEFAULT_INIT_STATE_NAME
        ].interaction.default_outcome = (
            state_domain.Outcome(
                'state 1', None, state_domain.SubtitledHtml(
                    'default_outcome', '<p>Default outcome for state 4</p>'
                ), False, [param_domain.ParamChange(
                    'ParamChange', 'RandomSelector', {
                        'list_of_values': ['3', '4'],
                        'parse_with_jinja': True
                    }
                )], None, None
            )
        )
        error_string = (
            'Explorations in a story are not expected to contain '
            'parameter values. State %s of exploration with ID %s '
            'contains parameter values in its default outcome.' % (
                feconf.DEFAULT_INIT_STATE_NAME, exploration.id
            )
        )
        errors = exp_services.validate_exploration_for_story(
            exploration, False)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0], error_string)
        with self.assertRaisesRegex(
            utils.ValidationError, error_string):
            exp_services.validate_exploration_for_story(
                exploration, True)

    def test_update_exploration_by_migration_bot(self) -> None:
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
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='end')
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertIsNone(migration_bot_contributions_model)

        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USER_ID, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'New title'
                })], 'Did migration.')

        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertIsNone(migration_bot_contributions_model)

    def test_update_exploration_by_migration_bot_not_updates_settings_model(
        self
    ) -> None:
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

    def test_get_multiple_explorations_from_model_by_id(self) -> None:
        self.save_new_valid_exploration(
            'exp_id_1', self.owner_id, title='title 1',
            category='category 1', objective='objective 1')
        self.save_new_valid_exploration(
            'exp_id_2', self.owner_id, title='title 2',
            category='category 2', objective='objective 2')

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

    def test_cannot_get_interaction_ids_mapping_by_version_with_invalid_handler(
        self
    ) -> None:
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
                            'dest_if_really_stuck': None,
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

        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'Exploration(id=exp_id_1, version=1, states_schema_version=3) '
                'does not match the latest schema version %s'
                % feconf.CURRENT_STATE_SCHEMA_VERSION)):
            (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    'exp_id_1', [1]))


class LoadingAndDeletionOfExplorationDemosTests(ExplorationServicesUnitTests):

    def test_loading_and_validation_and_deletion_of_demo_explorations(
        self
    ) -> None:
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
            processing_time = duration.seconds + (duration.microseconds / 1E6)
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

    def test_load_demo_with_invalid_demo_exploration_id_raises_error(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Invalid demo exploration id invalid_exploration_id'):
            exp_services.load_demo('invalid_exploration_id')

    def test_delete_demo_with_invalid_demo_exploration_id_raises_error(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Invalid demo exploration id invalid_exploration_id'):
            exp_services.delete_demo('invalid_exploration_id')


class ExplorationYamlImportingTests(test_utils.GenericTestBase):
    """Tests for loading explorations using imported YAML."""

    EXP_ID: Final = 'exp_id0'
    DEMO_EXP_ID: Final = '0'
    TEST_ASSET_PATH: Final = 'test_asset.txt'
    TEST_ASSET_CONTENT: Final = b'Hello Oppia'

    INTRO_AUDIO_FILE: Final = 'introduction_state.mp3'
    ANSWER_GROUP_AUDIO_FILE: Final = 'correct_answer_feedback.mp3'
    DEFAULT_OUTCOME_AUDIO_FILE: Final = 'unknown_answer_feedback.mp3'
    HINT_AUDIO_FILE: Final = 'answer_hint.mp3'
    SOLUTION_AUDIO_FILE: Final = 'answer_solution.mp3'

    YAML_WITH_AUDIO_TRANSLATIONS: str = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 47
states:
  Introduction:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: New state
          dest_if_really_stuck: null
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
        catchMisspellings:
          value: false
      default_outcome:
        dest: Introduction
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
      - hint_content:
          content_id: hint_1
          html: <p>hint one,</p>
      id: TextInput
      solution:
        answer_is_exclusive: false
        correct_answer: helloworld!
        explanation:
          content_id: solution
          html: <p>hello_world is a string</p>
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: %s
            needs_update: false
        default_outcome:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: %s
            needs_update: false
        feedback_1:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: %s
            needs_update: false
        hint_1:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: %s
            needs_update: false
        rule_input_3: {}
        solution:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: %s
            needs_update: false
    solicit_answer_details: false
    card_is_checkpoint: true
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        hint_1: {}
        rule_input_3: {}
        solution: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: New state
        dest_if_really_stuck: null
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
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
        ca_placeholder_2: {}
    solicit_answer_details: false
    card_is_checkpoint: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
        ca_placeholder_2: {}
states_schema_version: 42
tags: []
title: Title
""") % (
    INTRO_AUDIO_FILE, DEFAULT_OUTCOME_AUDIO_FILE, ANSWER_GROUP_AUDIO_FILE,
    HINT_AUDIO_FILE, SOLUTION_AUDIO_FILE)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_loading_recent_yaml_loads_exploration_for_user(self) -> None:
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(exp.to_yaml(), self.SAMPLE_YAML_CONTENT)

    def test_loading_recent_yaml_does_not_default_exp_title_category(
        self
    ) -> None:
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertNotEqual(exp.title, feconf.DEFAULT_EXPLORATION_TITLE)
        self.assertNotEqual(exp.category, feconf.DEFAULT_EXPLORATION_CATEGORY)

    def test_loading_yaml_with_assets_loads_assets_from_filesystem(
        self
    ) -> None:
        test_asset = (self.TEST_ASSET_PATH, self.TEST_ASSET_CONTENT)
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_YAML_CONTENT, self.EXP_ID, [test_asset])

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID)
        self.assertEqual(
            fs.get(self.TEST_ASSET_PATH), self.TEST_ASSET_CONTENT)

    def test_can_load_yaml_with_voiceovers(self) -> None:
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.YAML_WITH_AUDIO_TRANSLATIONS, self.EXP_ID, [])
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        state = exp.states[exp.init_state_name]
        interaction = state.interaction
        # Ruling out the possibility of None for mypy type checking.
        assert interaction.solution is not None
        assert interaction.default_outcome is not None
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

    def test_can_load_yaml_with_stripped_voiceovers(self) -> None:
        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.YAML_WITH_AUDIO_TRANSLATIONS, self.EXP_ID, [],
            strip_voiceovers=True)
        exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)

        state = exp.states[exp.init_state_name]
        interaction = state.interaction
        # Ruling out the possibility of None for mypy type checking.
        assert interaction.solution is not None
        assert interaction.default_outcome is not None
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

    def test_cannot_load_yaml_with_no_schema_version(self) -> None:
        yaml_with_no_schema_version = (
            """
        author_notes: ''
        auto_tts_enabled: true
        blurb: ''
        category: Category    
        edits_allowed: true
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
                  dest_if_really_stuck: null
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
                dest_if_really_stuck: null
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
                dest_if_really_stuck: null
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

        with self.assertRaisesRegex(
            Exception, 'Invalid YAML file: missing schema version'):
            exp_services.save_new_exploration_from_yaml_and_assets(
                self.owner_id, yaml_with_no_schema_version, self.EXP_ID, [])


class GetImageFilenamesFromExplorationTests(ExplorationServicesUnitTests):

    def test_get_image_filenames_from_exploration(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            'eid', title='title', category='category')
        exploration.add_states(['state1', 'state2', 'state3'])
        state1 = exploration.states['state1']
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        state2 = exploration.states['state2']
        state3 = exploration.states['state3']
        content1_dict: state_domain.SubtitledHtmlDict = {
            'content_id': content_id_generator.generate(
                translation_domain.ContentType.CONTENT),
            'html': (
                '<blockquote>Hello, this is state1</blockquote>'
                '<oppia-noninteractive-image filepath-with-value='
                '"&amp;quot;s1Content.png&amp;quot;" caption-with-value='
                '"&amp;quot;&amp;quot;" alt-with-value="&amp;quot;image>'
                '&amp;quot;"</oppia-noninteractive-image>')
        }
        content2_dict: state_domain.SubtitledHtmlDict = {
            'content_id': content_id_generator.generate(
                translation_domain.ContentType.CONTENT),
            'html': '<pre>Hello, this is state2</pre>'
        }
        content3_dict: state_domain.SubtitledHtmlDict = {
            'content_id': content_id_generator.generate(
                translation_domain.ContentType.CONTENT),
            'html': '<p>Hello, this is state3</p>'
        }
        state1.update_content(
            state_domain.SubtitledHtml.from_dict(content1_dict))
        state2.update_content(
            state_domain.SubtitledHtml.from_dict(content2_dict))
        state3.update_content(
            state_domain.SubtitledHtml.from_dict(content3_dict))

        self.set_interaction_for_state(
            state1, 'ImageClickInput', content_id_generator)
        self.set_interaction_for_state(
            state2, 'MultipleChoiceInput', content_id_generator)
        self.set_interaction_for_state(
            state3, 'ItemSelectionInput', content_id_generator)

        customization_args_dict1: Dict[
            str, Dict[str, Union[bool, domain.ImageAndRegionDict]]
        ] = {
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
        customization_args_choices: List[state_domain.SubtitledHtmlDict] = [{
                'content_id': content_id_generator.generate(
                    translation_domain.ContentType.CUSTOMIZATION_ARG,
                    extra_prefix='choices'),
                'html': (
                    '<p>This is value1 for MultipleChoice'
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&amp;quot;s2Choice1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value="&amp;quot;'
                    'image&amp;quot;"></oppia-noninteractive-image></p>'
                )
            }, {
                'content_id': content_id_generator.generate(
                    translation_domain.ContentType.CUSTOMIZATION_ARG,
                    extra_prefix='choices'),
                'html': (
                    '<p>This is value2 for MultipleChoice'
                    '<oppia-noninteractive-image filepath-with-value='
                    '"&amp;quot;s2Choice2.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                    '</p></p>')
            }]
        customization_args_dict2: Dict[
            str, Dict[str, Union[bool, List[state_domain.SubtitledHtmlDict]]]
        ] = {
            'choices': {'value': customization_args_choices},
            'showChoicesInShuffledOrder': {'value': True}
        }
        customization_args_choices = [{
            'content_id': content_id_generator.generate(
                translation_domain.ContentType.CUSTOMIZATION_ARG,
                extra_prefix='choices'),
            'html': (
                '<p>This is value1 for ItemSelection'
                '<oppia-noninteractive-image filepath-with-value='
                '"&amp;quot;s3Choice1.png&amp;quot;" caption-with-value='
                '"&amp;quot;&amp;quot;" alt-with-value='
                '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                '</p>')
        }, {
            'content_id': content_id_generator.generate(
                translation_domain.ContentType.CUSTOMIZATION_ARG,
                extra_prefix='choices'),
            'html': (
                '<p>This is value2 for ItemSelection'
                '<oppia-noninteractive-image filepath-with-value='
                '"&amp;quot;s3Choice2.png&amp;quot;" caption-with-value='
                '"&amp;quot;&amp;quot;" alt-with-value='
                '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                '</p>')
        }, {
            'content_id': content_id_generator.generate(
                translation_domain.ContentType.CUSTOMIZATION_ARG,
                extra_prefix='choices'),
            'html': (
                '<p>This is value3 for ItemSelection'
                '<oppia-noninteractive-image filepath-with-value='
                '"&amp;quot;s3Choice3.png&amp;quot;" caption-with-value='
                '"&amp;quot;&amp;quot;" alt-with-value='
                '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                '</p>')
        }]
        customization_args_dict3: Dict[
            str, Dict[str, Union[int, List[state_domain.SubtitledHtmlDict]]]
        ] = {
            'choices': {'value': customization_args_choices},
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 5}
        }
        state1.update_interaction_customization_args(customization_args_dict1)
        state2.update_interaction_customization_args(customization_args_dict2)
        state3.update_interaction_customization_args(customization_args_dict3)

        default_outcome1 = state_domain.Outcome(
            'state2', None, state_domain.SubtitledHtml(
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME),
                '<p>Default outcome for state1</p>'
            ), False, [], None, None
        )
        state1.update_interaction_default_outcome(default_outcome1)

        hint_list2 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.HINT),
                    (
                        '<p>Hello, this is html1 for state2</p>'
                        '<oppia-noninteractive-image filepath-with-value="'
                        '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                        '"&amp;quot;&amp;quot;" alt-with-value="&amp;quot;'
                        'image&amp;quot;"></oppia-noninteractive-image>'
                    )
                )
            ),
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.HINT),
                    '<p>Hello, this is html2 for state2</p>')
            ),
        ]
        state2.update_interaction_hints(hint_list2)

        state_answer_group_list2 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'state1', None, state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.FEEDBACK), (
                        '<p>Outcome1 for state2</p><oppia-noninteractive-image'
                        ' filepath-with-value='
                        '"&amp;quot;s2AnswerGroup.png&amp;quot;"'
                        ' caption-with-value="&amp;quot;&amp;quot;"'
                        ' alt-with-value="&amp;quot;image&amp;quot;">'
                        '</oppia-noninteractive-image>')
                    ), False, [], None, None), [
                        state_domain.RuleSpec('Equals', {'x': 0}),
                        state_domain.RuleSpec('Equals', {'x': 1})
                    ], [], None
        ), state_domain.AnswerGroup(
            state_domain.Outcome(
                'state3', None, state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.FEEDBACK),
                    '<p>Outcome2 for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec('Equals', {'x': 0})
            ],
            [],
            None
        )]
        state_answer_group_list3 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'state1', None, state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.FEEDBACK),
                    '<p>Outcome for state3</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals', {
                        'x':
                        [(
                            '<p>This is value1 for ItemSelection</p>'
                            '<oppia-noninteractive-image filepath-with-'
                            'value='
                            '"&amp;quot;s3Choice1.png&amp;quot;"'
                            ' caption-with-value="&amp;quot;&amp;quot;" '
                            'alt-with-value="&amp;quot;image&amp;quot;">'
                            '</oppia-noninteractive-image>')
                        ]}),
                state_domain.RuleSpec(
                    'Equals', {
                        'x':
                        [(
                            '<p>This is value3 for ItemSelection</p>'
                            '<oppia-noninteractive-image filepath-with-'
                            'value='
                            '"&amp;quot;s3Choice3.png&amp;quot;"'
                            ' caption-with-value="&amp;quot;&amp;quot;" '
                            'alt-with-value="&amp;quot;image&amp;quot;">'
                            '</oppia-noninteractive-image>')
                        ]})
            ],
            [],
            None
        )]

        state2.update_interaction_answer_groups(state_answer_group_list2)
        state3.update_interaction_answer_groups(state_answer_group_list3)

        exploration.update_next_content_id_index(
            content_id_generator.next_content_id_index)
        filenames = (
            exp_services.get_image_filenames_from_exploration(exploration))
        expected_output = ['s1ImagePath.png', 's1Content.png', 's2Choice1.png',
                           's2Choice2.png', 's3Choice1.png', 's3Choice2.png',
                           's3Choice3.png', 's2Hint1.png',
                           's2AnswerGroup.png']
        self.assertEqual(len(filenames), len(expected_output))
        for filename in expected_output:
            self.assertIn(filename, filenames)


class ZipFileExportUnitTests(ExplorationServicesUnitTests):
    """Test export methods for explorations represented as zip files."""

    DUMMY_IMAGE_TAG: Final = (
        '<oppia-noninteractive-image alt-with-value="&quot;Image&quot;" '
        'caption-with-value="&quot;&quot;"\n        filepath-with-value="'
        '&quot;abc.png&quot;"></oppia-noninteractive-image>'
    )
    SAMPLE_YAML_CONTENT: str = (
        """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: Algebra
edits_allowed: true
init_state_name: %s
language_code: en
next_content_id_index: 6
objective: The objective
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content_0
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        catchMisspellings:
          value: false
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: %s
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome_1
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content_0: {}
        default_outcome_1: {}
    solicit_answer_details: false
  New state:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content_3
      html: %s
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        catchMisspellings:
          value: false
        placeholder:
          value:
            content_id: ca_placeholder_5
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: New state
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome_4
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_5: {}
        content_3: {}
        default_outcome_4: {}
    solicit_answer_details: false
states_schema_version: %d
tags: []
title: A title
version: 2
""" % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    DUMMY_IMAGE_TAG,
    feconf.CURRENT_STATE_SCHEMA_VERSION))

    UPDATED_YAML_CONTENT = (
        """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: Algebra
edits_allowed: true
init_state_name: %s
language_code: en
next_content_id_index: 6
objective: The objective
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content_0
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        catchMisspellings:
          value: false
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: %s
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome_1
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content_0: {}
        default_outcome_1: {}
    solicit_answer_details: false
  Renamed state:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content_3
      html: %s
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        catchMisspellings:
          value: false
        placeholder:
          value:
            content_id: ca_placeholder_5
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: Renamed state
        dest_if_really_stuck: null
        feedback:
          content_id: default_outcome_4
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: TextInput
      solution: null
    linked_skill_id: null
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_5: {}
        content_3: {}
        default_outcome_4: {}
    solicit_answer_details: false
states_schema_version: %d
tags: []
title: A title
version: 3
""" % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.DEFAULT_INIT_STATE_NAME,
    DUMMY_IMAGE_TAG,
    feconf.CURRENT_STATE_SCHEMA_VERSION))

    def test_export_to_zip_file(self) -> None:
        """Test the export_to_zip_file() method."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective',
            category='Algebra')
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        init_state = exploration.states[exploration.init_state_name]
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.default_outcome is not None
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
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'New state',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': 'New state',
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': content_id_generator.generate((
                                        translation_domain
                                        .ContentType.CUSTOMIZATION_ARG),
                                    extra_prefix='placeholder'
                                    ),
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1},
                        'catchMisspellings': {'value': False}
                    }
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'New state',
                    'old_value': state_domain.SubtitledHtml(
                        'content_3', '').to_dict(),
                    'new_value': state_domain.SubtitledHtml(
                        'content_3',
                        '<oppia-noninteractive-image filepath-with-value='
                        '"&quot;abc.png&quot;" caption-with-value="&quot;'
                        '&quot;" alt-with-value="&quot;Image&quot;">'
                        '</oppia-noninteractive-image>').to_dict()
                }),
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                }), ], 'Add state name')

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID)
        fs.commit('image/abc.png', raw_image)
        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(zip_file_output)

        self.assertEqual(
            zf.namelist(), ['A title.yaml', 'assets/image/abc.png'])
        # Read function returns bytes, so we need to decode them before
        # we compare.
        self.assertEqual(
            zf.open('A title.yaml').read().decode('utf-8'),
            self.SAMPLE_YAML_CONTENT)

    def test_export_to_zip_file_with_unpublished_exploration(self) -> None:
        """Test the export_to_zip_file() method."""
        self.save_new_default_exploration(
            self.EXP_0_ID, self.owner_id, title='')

        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(zip_file_output)

        self.assertEqual(zf.namelist(), ['Unpublished_exploration.yaml'])

    def test_export_to_zip_file_with_a_nonstandard_char(self) -> None:
        """Test the export_to_zip_file() method with a nonstandard char."""
        self.save_new_default_exploration(
            self.EXP_0_ID, self.owner_id, title='What is a Fraction?')

        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(zip_file_output)

        self.assertEqual(zf.namelist(), ['What is a Fraction.yaml'])

    def test_export_to_zip_file_with_all_nonstandard_chars(self) -> None:
        """Test the export_to_zip_file() method with all nonstandard chars."""
        self.save_new_default_exploration(
            self.EXP_0_ID, self.owner_id, title='?!!!!!?')

        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(zip_file_output)

        self.assertEqual(zf.namelist(), ['exploration.yaml'])

    def test_export_to_zip_file_with_assets(self) -> None:
        """Test exporting an exploration with assets to a zip file."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective',
            category='Algebra')
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        init_state = exploration.states[exploration.init_state_name]
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.default_outcome is not None
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
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'New state',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': 'New state',
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': content_id_generator.generate((
                                        translation_domain
                                        .ContentType.CUSTOMIZATION_ARG),
                                    extra_prefix='placeholder'
                                    ),
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1},
                        'catchMisspellings': {'value': False}
                    }
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'New state',
                    'old_value': state_domain.SubtitledHtml(
                        'content_3', '').to_dict(),
                    'new_value': state_domain.SubtitledHtml(
                        'content_3',
                        '<oppia-noninteractive-image filepath-with-value='
                        '"&quot;abc.png&quot;" caption-with-value="'
                        '&quot;&quot;" alt-with-value="&quot;Image&quot;">'
                        '</oppia-noninteractive-image>').to_dict()
                }),
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index
                })], 'Add state name')

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb', encoding=None
        ) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID)
        fs.commit('image/abc.png', raw_image)
        # Audio files should not be included in asset downloads.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'cafe.mp3'), 'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        fs.commit('audio/cafe.mp3', raw_audio)

        zip_file_output = exp_services.export_to_zip_file(self.EXP_0_ID)
        zf = zipfile.ZipFile(zip_file_output)

        self.assertEqual(
            zf.namelist(), ['A title.yaml', 'assets/image/abc.png'])
        # Read function returns bytes, so we need to decode them before
        # we compare.
        self.assertEqual(
            zf.open('A title.yaml').read().decode('utf-8'),
            self.SAMPLE_YAML_CONTENT)
        self.assertEqual(zf.open('assets/image/abc.png').read(), raw_image)

    def test_export_by_versions(self) -> None:
        """Test export_to_zip_file() for different versions."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective',
            category='Algebra')
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.assertEqual(exploration.version, 1)

        init_state = exploration.states[exploration.init_state_name]
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.default_outcome is not None
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
            'state_name': 'New state',
            'content_id_for_state_content': content_id_generator.generate(
                    translation_domain.ContentType.CONTENT),
            'content_id_for_default_outcome': (
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME)
            )
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name':
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'state_name': 'New state',
            'new_value': {
                'placeholder': {
                    'value': {
                        'content_id': (
                            content_id_generator.generate(
                                translation_domain.ContentType
                                .CUSTOMIZATION_ARG,
                                extra_prefix='placeholder')
                        ),
                        'unicode_str': ''
                    }
                },
                'rows': {'value': 1},
                'catchMisspellings': {'value': False}
            }
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'New state',
            'old_value': state_domain.SubtitledHtml(
                'content_3', '').to_dict(),
            'new_value': state_domain.SubtitledHtml(
                'content_3',
                '<oppia-noninteractive-image filepath-with-value='
                '"&quot;abc.png&quot;" caption-with-value="&quot;&quot;" '
                'alt-with-value="&quot;Image&quot;">'
                '</oppia-noninteractive-image>').to_dict()
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'next_content_id_index',
            'new_value': content_id_generator.next_content_id_index

        })]
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID)
        fs.commit('image/abc.png', raw_image)
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
        zf = zipfile.ZipFile(zip_file_output)
        # Read function returns bytes, so we need to decode them before
        # we compare.
        self.assertEqual(
            zf.open('A title.yaml').read().decode('utf-8'),
            self.SAMPLE_YAML_CONTENT)

        # Download version 3.
        zip_file_output = exp_services.export_to_zip_file(
            self.EXP_0_ID, version=3)
        zf = zipfile.ZipFile(zip_file_output)
        # Read function returns bytes, so we need to decode them before
        # we compare.
        self.assertEqual(
            zf.open('A title.yaml').read().decode('utf-8'),
            self.UPDATED_YAML_CONTENT)


class YAMLExportUnitTests(ExplorationServicesUnitTests):
    """Test export methods for explorations represented as a dict whose keys
    are state names and whose values are YAML strings representing the state's
    contents.
    """

    _SAMPLE_INIT_STATE_CONTENT: str = (
        """card_is_checkpoint: true
classifier_model_id: null
content:
  content_id: content_0
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    catchMisspellings:
      value: false
    placeholder:
      value:
        content_id: ca_placeholder_2
        unicode_str: ''
    rows:
      value: 1
  default_outcome:
    dest: %s
    dest_if_really_stuck: null
    feedback:
      content_id: default_outcome_1
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
linked_skill_id: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    ca_placeholder_2: {}
    content_0: {}
    default_outcome_1: {}
solicit_answer_details: false
""") % (feconf.DEFAULT_INIT_STATE_NAME)

    SAMPLE_EXPORTED_DICT: Final = {
        feconf.DEFAULT_INIT_STATE_NAME: _SAMPLE_INIT_STATE_CONTENT,
        'New state': (
            """card_is_checkpoint: false
classifier_model_id: null
content:
  content_id: content_3
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    catchMisspellings:
      value: false
    placeholder:
      value:
        content_id: ca_placeholder_5
        unicode_str: ''
    rows:
      value: 1
  default_outcome:
    dest: New state
    dest_if_really_stuck: null
    feedback:
      content_id: default_outcome_4
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
linked_skill_id: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    ca_placeholder_5: {}
    content_3: {}
    default_outcome_4: {}
solicit_answer_details: false
""")
    }

    UPDATED_SAMPLE_DICT: Final = {
        feconf.DEFAULT_INIT_STATE_NAME: _SAMPLE_INIT_STATE_CONTENT,
        'Renamed state': (
            """card_is_checkpoint: false
classifier_model_id: null
content:
  content_id: content_3
  html: ''
interaction:
  answer_groups: []
  confirmed_unclassified_answers: []
  customization_args:
    catchMisspellings:
      value: false
    placeholder:
      value:
        content_id: ca_placeholder_5
        unicode_str: ''
    rows:
      value: 1
  default_outcome:
    dest: Renamed state
    dest_if_really_stuck: null
    feedback:
      content_id: default_outcome_4
      html: ''
    labelled_as_correct: false
    missing_prerequisite_skill_id: null
    param_changes: []
    refresher_exploration_id: null
  hints: []
  id: TextInput
  solution: null
linked_skill_id: null
param_changes: []
recorded_voiceovers:
  voiceovers_mapping:
    ca_placeholder_5: {}
    content_3: {}
    default_outcome_4: {}
solicit_answer_details: false
""")
    }

    def test_export_to_dict(self) -> None:
        """Test the export_to_dict() method."""
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, objective='The objective')
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        init_state = exploration.states[exploration.init_state_name]
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.default_outcome is not None
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
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'New state',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': 'New state',
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': content_id_generator.generate((
                                        translation_domain
                                        .ContentType.CUSTOMIZATION_ARG),
                                    extra_prefix='placeholder'
                                    ),
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1},
                        'catchMisspellings': {'value': False}
                    }
                }),
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'next_content_id_index',
                    'new_value': content_id_generator.next_content_id_index

                })], 'Add state name')

        dict_output = exp_services.export_states_to_yaml(
            self.EXP_0_ID, width=50)

        self.assertEqual(dict_output, self.SAMPLE_EXPORTED_DICT)

    def test_export_by_versions(self) -> None:
        """Test export_to_dict() for different versions."""
        self.maxDiff = None
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.assertEqual(exploration.version, 1)

        init_state = exploration.states[exploration.init_state_name]
        # Ruling out the possibility of None for mypy type checking.
        assert init_state.interaction.default_outcome is not None
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
            'state_name': 'New state',
            'content_id_for_state_content': (
                content_id_generator.generate(
                    translation_domain.ContentType.CONTENT)
            ),
            'content_id_for_default_outcome': (
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME)
            )
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'next_content_id_index',
            'new_value': content_id_generator.next_content_id_index

        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name':
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'state_name': 'New state',
            'new_value': {
                'placeholder': {
                    'value': {
                        'content_id': content_id_generator.generate((
                                        translation_domain
                                        .ContentType.CUSTOMIZATION_ARG),
                                    extra_prefix='placeholder'
                                    ),
                        'unicode_str': ''
                    }
                },
                'rows': {'value': 1},
                'catchMisspellings': {'value': False}
            }
        })]
        exploration.objective = 'The objective'
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID)
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


# Here new_value argument can accept values of type str, int, bool and other
# types too, so to make the argument generalized for every type of values we
# used Any type here.
def _get_change_list(
    state_name: str,
    property_name: str, new_value: change_domain.AcceptableChangeDictTypes
) -> List[exp_domain.ExplorationChange]:
    """Generates a change list for a single state change."""
    return [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'state_name': state_name,
        'property_name': property_name,
        'new_value': new_value
    })]


class UpdateStateTests(ExplorationServicesUnitTests):
    """Test updating a single state."""

    def setUp(self) -> None:
        super().setUp()
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
        self.interaction_answer_groups: List[
            state_domain.AnswerGroupDict
        ] = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': 0},
            }],
            'outcome': {
                'dest': self.init_state_name,
                'dest_if_really_stuck': None,
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
        self.interaction_default_outcome: state_domain.OutcomeDict = {
            'dest': self.init_state_name,
            'dest_if_really_stuck': None,
            'feedback': {
                'content_id': 'default_outcome',
                'html': '<p><strong>Incorrect</strong></p>'
            },
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        }

    def test_add_state_cmd(self) -> None:
        """Test adding of states."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        self.assertNotIn('new state', exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })], 'Add state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertIn('new state', exploration.states)

    def test_are_changes_mergeable_send_email(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State 1',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })], 'Added state')
        change_list_same_state_name = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'State 1',
            'content_id_for_state_content': (
                content_id_generator.generate(
                    translation_domain.ContentType.CONTENT)
            ),
            'content_id_for_default_outcome': (
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME)
            )
        })]
        updated_exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertFalse(exp_services.are_changes_mergeable(
            self.EXP_0_ID, updated_exploration.version - 1,
            change_list_same_state_name
        ))

    def test_rename_state_cmd(self) -> None:
        """Test updating of state name."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.assertIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })], 'Add state name')

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': 'state',
            })], 'Change state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertIn('state', exploration.states)
        self.assertNotIn(feconf.DEFAULT_INIT_STATE_NAME, exploration.states)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'new state',
            'new_state_name': 'new state changed name',
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Change state name')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertIn('new state changed name', exploration.states)

    def test_rename_state_cmd_with_unicode(self) -> None:
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

    def test_delete_state_cmd(self) -> None:
        """Test deleting a state name."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
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

    def test_delete_state_cmd_rejects_obsolete_translation_suggestions(
        self
    ) -> None:
        """Verify deleting a state name rejects corresponding suggestions."""
        # Add a new state with content.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        content_id = content_id_generator.generate(
            translation_domain.ContentType.CONTENT)
        change_list = [
            # Add state.
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'new state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            # Add content.
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'new state',
                'new_value': {
                    'content_id': content_id,
                    'html': '<p>old content html</p>'
                }
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Initial commit')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertIn('new state', exploration.states)

        # Create a translation suggestion for the state content.
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'new state',
            'content_id': content_id,
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'translation_html': '<p>Translation for original content.</p>',
            'data_format': 'html'
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID, 1, self.owner_id,
            add_translation_change_dict, 'test description')

        # The new translation suggestion should be in review.
        in_review_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        self.assertEqual(
            in_review_suggestion.status,
            suggestion_models.STATUS_IN_REVIEW)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_DELETE_STATE,
                'state_name': 'new state',
            })], 'delete state')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertNotIn('new state', exploration.states)

        # The translation suggestion should be rejected after the corresponding
        # state is deleted.
        rejected_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        self.assertEqual(
            rejected_suggestion.status,
            suggestion_models.STATUS_REJECTED)

    def test_update_param_changes(self) -> None:
        """Test updating of param_changes."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'param_specs',
            'new_value': {
                'myParam': {'obj_type': 'UnicodeString'}
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, '')
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'param_changes', self.param_changes), '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        param_changes = exploration.init_state.param_changes[0].to_dict()
        self.assertEqual(param_changes['name'], 'myParam')
        self.assertEqual(param_changes['generator_id'], 'RandomSelector')
        self.assertEqual(
            param_changes['customization_args'],
            {'list_of_values': ['1', '2'], 'parse_with_jinja': False})

    def test_update_invalid_param_changes(self) -> None:
        """Check that updates cannot be made to non-existent parameters."""
        with self.assertRaisesRegex(
            utils.ValidationError,
            r'The parameter with name \'myParam\' .* does not exist .*'
        ):
            exp_services.update_exploration(
                self.owner_id,
                self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                ''
            )

    def test_update_reserved_param_changes(self) -> None:
        param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'all',
            'generator_id': 'RandomSelector'
        }]
        with self.assertRaisesRegex(
            utils.ValidationError,
            re.escape(
                'The parameter name \'all\' is reserved. Please choose '
                'a different name for the parameter being set in')):
            exp_services.update_exploration(
                self.owner_id,
                self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name, 'param_changes', param_changes),
                ''
            )

    def test_update_invalid_generator(self) -> None:
        """Test for check that the generator_id in param_changes exists."""
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'param_specs',
            'new_value': {
                'myParam': {'obj_type': 'UnicodeString'}
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, '')

        self.param_changes[0]['generator_id'] = 'fake'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid generator ID'
        ):
            exp_services.update_exploration(
                self.owner_id,
                self.EXP_0_ID,
                _get_change_list(
                    self.init_state_name, 'param_changes', self.param_changes),
                ''
            )

    def test_update_interaction_id(self) -> None:
        """Test updating of interaction_id."""
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_0_ID,
            _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput') +
            _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>Option A</p>'
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': '<p>Option B</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': False}
                }),
            '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.interaction.id, 'MultipleChoiceInput')

        # Check that the property can be changed when working
        # on old version.
        # Adding a content change just to increase the version.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')
        change_list = _get_change_list(
            self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'Continue') + _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'buttonText': {
                        'value': {
                            'content_id': 'ca_buttonText_1',
                            'unicode_str': 'Continue'
                        }
                    }
                })
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_0_ID,
            change_list,
            '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.interaction.id, 'Continue')

    def test_update_interaction_customization_args(self) -> None:
        """Test updating of interaction customization_args."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput') +
            _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>Option A</p>'
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': '<p>Option B</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': False}
                }),
            '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(
            exploration.init_state.interaction.customization_args[
            'choices'].value,
            list
        )
        # Here we use cast because we are narrowing down the type from
        # various customization args value types to List[SubtitledHtml]
        # type, and this is done because here we are accessing 'choices'
        # key from MultipleChoiceInput customization arg whose value is
        # always of List[SubtitledHtml] type.
        choices = cast(
            List[state_domain.SubtitledHtml],
            exploration.init_state.interaction.customization_args[
                'choices'
            ].value
        )
        self.assertEqual(choices[0].html, '<p>Option A</p>')
        self.assertEqual(choices[0].content_id, 'ca_choices_0')
        self.assertEqual(choices[1].html, '<p>Option B</p>')
        self.assertEqual(choices[1].content_id, 'ca_choices_1')

        # Check that the property can be changed when working
        # on old version.
        # Adding a content change just to increase the version.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')
        change_list = _get_change_list(
            self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'Continue') + _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'buttonText': {
                        'value': {
                            'content_id': 'ca_buttonText_1',
                            'unicode_str': 'Continue'
                        }
                    }
                })
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        customization_args = (
            exploration.init_state.interaction.customization_args)
        # Here we use cast because we are narrowing down the type from various
        # customization args value types to 'SubtitledUnicode' type, and this
        # is done because here we are accessing 'buttontext' key from continue
        # customization arg whose value is always of SubtitledUnicode type.
        button_text_subtitle_unicode = cast(
            state_domain.SubtitledUnicode,
            customization_args['buttonText'].value
        )
        self.assertEqual(
            button_text_subtitle_unicode.unicode_str,
            'Continue')

    def test_update_interaction_customization_args_rejects_obsolete_translation_suggestions( # pylint: disable=line-too-long
        self
    ) -> None:
        # Add a Continue button interaction to the exploration.
        content_id = 'ca_buttonText_1'
        change_list = (
            _get_change_list(
                self.init_state_name, exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'Continue') +
            _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'buttonText': {
                        'value': {
                            'content_id': content_id,
                            'unicode_str': 'Continue'
                        }
                    }
                }))
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Initial commit')

        # Create a translation suggestion for the Continue button content.
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': self.init_state_name,
            'content_id': content_id,
            'language_code': 'hi',
            'content_html': 'Continue',
            'translation_html': '<p>Translation for original content.</p>',
            'data_format': 'html'
        }
        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_0_ID, 1, self.owner_id,
            add_translation_change_dict, 'test description')
        # The new translation suggestion should be in review.
        in_review_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        self.assertEqual(
            in_review_suggestion.status,
            suggestion_models.STATUS_IN_REVIEW)

        # Replace the Continue button content ID.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name,
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'buttonText': {
                        'value': {
                            'content_id': 'new_content_id',
                            'unicode_str': 'Continue'
                        }
                    }
                }),
            'Replace Continue button content ID')

        # The translation suggestion should be rejected after the corresponding
        # content ID is deleted.
        rejected_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        self.assertEqual(
            rejected_suggestion.status,
            suggestion_models.STATUS_REJECTED)

    def test_update_interaction_handlers_fails(self) -> None:
        """Test legacy interaction handler updating."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State 2',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })] +
            _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'TextInput') +
            _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'placeholder': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': ''
                        }
                    },
                    'rows': {'value': 1},
                    'catchMisspellings': {'value': False}
                }),
            'Add state name')

        self.interaction_default_outcome['dest'] = 'State 2'
        with self.assertRaisesRegex(
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

    def test_update_interaction_answer_groups(self) -> None:
        """Test updating of interaction_answer_groups."""
        # We create a second state to use as a rule destination.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State 2',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })] +
            _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'TextInput') +
            _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'placeholder': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': ''
                        }
                    },
                    'rows': {'value': 1},
                    'catchMisspellings': {'value': False}
                }),
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
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>Option A</p>'
                        }, {
                            'content_id': 'ca_choices_1',
                            'html': '<p>Option B</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': False}
                }) +
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
        # Ruling out the possibility of None for mypy type checking.
        assert init_interaction.default_outcome is not None
        self.assertEqual(init_interaction.default_outcome.dest, 'State 2')

        change_list = (
            _get_change_list(
                'State 2', exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'MultipleChoiceInput') +
            _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_1',
                            'html': '<p>Option A</p>'
                        }, {
                            'content_id': 'ca_choices_2',
                            'html': '<p>Option B</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': False}
                }) +
            _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
                [{
                    'rule_specs': [{
                        'rule_type': 'Equals',
                        'inputs': {'x': 0},
                    }],
                    'outcome': {
                        'dest': 'State 2',
                        'dest_if_really_stuck': None,
                        'feedback': {
                            'content_id': 'feedback_3',
                            'html': '<p>Try again</p>'
                        },
                        'labelled_as_correct': False,
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None
                    },
                    'training_data': [],
                    'tagged_skill_misconception_id': None
                }]) +
            _get_change_list(
                'State 2',
                exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
                {
                    'dest': 'State 2',
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': '<p><strong>Incorrect</strong></p>'
                    },
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                }))
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID,
            change_list,
            '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        second_state = exploration.states['State 2']
        second_state_interaction = second_state.interaction
        # Ruling out the possibility of None for mypy type checking.
        assert second_state_interaction.default_outcome is not None
        rule_specs = second_state_interaction.answer_groups[0].rule_specs
        outcome = second_state_interaction.answer_groups[0].outcome
        self.assertEqual(rule_specs[0].rule_type, 'Equals')
        self.assertEqual(rule_specs[0].inputs, {'x': 0})
        self.assertEqual(outcome.feedback.html, '<p>Try again</p>')
        self.assertEqual(outcome.dest, 'State 2')
        self.assertEqual(
            second_state_interaction.default_outcome.dest, 'State 2')

    def test_update_state_invalid_state(self) -> None:
        """Test that rule destination states cannot be non-existent."""
        self.interaction_answer_groups[0]['outcome']['dest'] = 'INVALID'
        with self.assertRaisesRegex(
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
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    {
                        'choices': {
                            'value': [{
                                'content_id': 'ca_choices_0',
                                'html': '<p>Option A</p>'
                            }, {
                                'content_id': 'ca_choices_1',
                                'html': '<p>Option B</p>'
                            }]
                        },
                        'showChoicesInShuffledOrder': {'value': False}
                    }) +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
                    self.interaction_answer_groups) +
                _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
                    self.interaction_default_outcome),
                '')

    def test_update_state_variable_types(self) -> None:
        """Test that parameters in rules must have the correct type."""
        self.interaction_answer_groups[0]['rule_specs'][0][
            'inputs']['x'] = 'abc'
        with self.assertRaisesRegex(
            Exception,
            'Value has the wrong type. It should be a NonnegativeInt. '
            'The value is abc'
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

    def test_update_content(self) -> None:
        """Test updating of content."""
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.content.html,
            '<p><strong>Test content</strong></p>')

    def test_update_solicit_answer_details(self) -> None:
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

        # Check that the property can be changed when working
        # on old version.
        # Adding a content change just to increase the version.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')

        change_list = _get_change_list(
            self.init_state_name,
            exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS,
            False)
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            '')

        # Assert that exploration's final version consist of all the
        # changes.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.content.html,
            '<p><strong>Test content</strong></p>')
        self.assertEqual(
            exploration.init_state.solicit_answer_details, False)

    def test_update_solicit_answer_details_with_non_bool_fails(self) -> None:
        """Test updating of solicit_answer_details with non bool value."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.solicit_answer_details, False)
        with self.assertRaisesRegex(
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

        # Check that the property can be changed when working
        # on old version.
        # Adding a content change just to upgrade the version.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')
        change_list = _get_change_list(
            self.init_state_name,
            exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS,
            'abc')
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list)
        self.assertTrue(changes_are_mergeable)
        with self.assertRaisesRegex(
            Exception, (
                'Expected solicit_answer_details to be a bool, received ')):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list, '')

        # Assert that exploration's final version consist of all the
        # changes.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.content.html,
            '<p><strong>Test content</strong></p>')
        self.assertEqual(
            exploration.init_state.solicit_answer_details, False)

    def test_update_linked_skill_id(self) -> None:
        """Test updating linked_skill_id."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.assertEqual(
            exploration.init_state.linked_skill_id, None)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State1',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })], 'Add state name')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.states['State1'].linked_skill_id, None)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                'State1',
                exp_domain.STATE_PROPERTY_LINKED_SKILL_ID,
                'string_1'),
            '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.states['State1'].linked_skill_id, 'string_1')

        # Check that the property can be changed when working
        # on old version.
        # Adding a content change just to upgrade the version.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')

        change_list = _get_change_list(
            'State1',
            exp_domain.STATE_PROPERTY_LINKED_SKILL_ID,
            'string_2')
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, '')
        # Assert that exploration's final version consist of all the
        # changes.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.content.html,
            '<p><strong>Test content</strong></p>')
        self.assertEqual(
            exploration.states['State1'].linked_skill_id, 'string_2')

    def test_update_card_is_checkpoint(self) -> None:
        """Test updating of card_is_checkpoint."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        self.assertEqual(
            exploration.init_state.card_is_checkpoint, True)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State1',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })], 'Add state name')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.states['State1'].card_is_checkpoint, False)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                'State1',
                exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                True),
            '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.states['State1'].card_is_checkpoint, True)

        # Check that the property can be changed when working
        # on old version.
        # Adding a content change just to upgrade the version.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')

        change_list = _get_change_list(
            'State1',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            False)
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, '')
        # Assert that exploration's final version consist of all the
        # changes.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.content.html,
            '<p><strong>Test content</strong></p>')
        self.assertEqual(
            exploration.states['State1'].card_is_checkpoint, False)

    def test_update_card_is_checkpoint_with_non_bool_fails(self) -> None:
        """Test updating of card_is_checkpoint with non bool value."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.card_is_checkpoint, True)
        with self.assertRaisesRegex(
            Exception, (
                'Expected card_is_checkpoint to be a bool, received ')):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                    'abc'),
                '')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.card_is_checkpoint, True)

        # Adding a content change just to upgrade the version.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, _get_change_list(
                self.init_state_name, 'content', {
                    'html': '<p><strong>Test content</strong></p>',
                    'content_id': 'content_0',
                }),
            '')

        change_list = _get_change_list(
            self.init_state_name,
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            'abc')
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list)
        self.assertTrue(changes_are_mergeable)
        with self.assertRaisesRegex(
            Exception, (
                'Expected card_is_checkpoint to be a bool, received ')):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                    'abc'),
                '')
        # Assert that exploration's final version consist of all the
        # changes.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(
            exploration.init_state.content.html,
            '<p><strong>Test content</strong></p>')
        self.assertEqual(
            exploration.init_state.card_is_checkpoint, True)

    def test_update_content_missing_key(self) -> None:
        """Test that missing keys in content yield an error."""
        with self.assertRaisesRegex(KeyError, 'content_id'):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name, 'content', {
                        'html': '<b>Test content</b>',
                    }),
                '')

    def test_set_edits_allowed(self) -> None:
        """Test update edits allowed field in an exploration."""
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.edits_allowed, True)

        exp_services.set_exploration_edits_allowed(self.EXP_0_ID, False)

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.edits_allowed, False)

    def test_migrate_exp_to_latest_version_migrates_to_version(self) -> None:
        """Test migrate exploration state schema to the latest version."""
        latest_schema_version = str(feconf.CURRENT_STATE_SCHEMA_VERSION)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '0',
                'to_version': latest_schema_version
            })
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, migration_change_list,
            'Ran Exploration Migration job.')
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(exploration.version, 2)
        self.assertEqual(
            str(exploration.states_schema_version),
            latest_schema_version)

    def test_migrate_exp_to_earlier_version_raises_exception(self) -> None:
        """Test migrate state schema to earlier version raises exception."""
        latest_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION
        not_latest_schema_version = str(latest_schema_version - 1)
        migration_change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '0',
                'to_version': not_latest_schema_version
            })
        ]
        exception_string = (
            'Expected to migrate to the latest state schema '
            'version %s, received %s' % (
                latest_schema_version, not_latest_schema_version)
        )
        with self.assertRaisesRegex(Exception, exception_string):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, migration_change_list,
                'Ran Exploration Migration job.')


class CommitMessageHandlingTests(ExplorationServicesUnitTests):
    """Test the handling of commit messages."""

    def setUp(self) -> None:
        super().setUp()
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')
        self.init_state_name = exploration.init_state_name

    def test_record_commit_message(self) -> None:
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

    def test_demand_commit_message(self) -> None:
        """Check published explorations demand commit messages."""
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        with self.assertRaisesRegex(
            ValueError,
            'Exploration is public so expected a commit message but received '
            'none.'
            ):
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, _get_change_list(
                    self.init_state_name,
                    exp_domain.STATE_PROPERTY_INTERACTION_STICKY, False), '')

    def test_unpublished_explorations_can_accept_commit_message(self) -> None:
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

    SECOND_USERNAME: Final = 'abc123'
    SECOND_EMAIL: Final = 'abc123@gmail.com'

    def test_get_last_updated_by_human_ms(self) -> None:
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

    def test_get_exploration_snapshots_metadata(self) -> None:
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
                'category': 'Algebra',
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
                'category': 'Algebra'
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
                'category': 'Algebra'
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
        change_list_swap = self.swap_to_always_return(
            exp_services, 'apply_change_list', value=v1_exploration)
        with change_list_swap, self.assertRaisesRegex(
            Exception, 'version 1, which is too old'):
            exp_services.update_exploration(
                second_committer_id, self.EXP_0_ID, None, 'commit_message')

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
                'category': 'Algebra'
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

    def test_versioning_with_add_and_delete_states(self) -> None:

        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'First title'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed title.')
        commit_dict_2 = {
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'version_number': 2,
        }
        snapshots_metadata = exp_services.get_exploration_snapshots_metadata(
            self.EXP_0_ID)
        self.assertEqual(len(snapshots_metadata), 2)

        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
            'content_id_for_state_content': (
                content_id_generator.generate(
                    translation_domain.ContentType.CONTENT)
            ),
            'content_id_for_default_outcome': (
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME)
            )
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'next_content_id_index',
            'new_value': content_id_generator.next_content_id_index
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name':
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'state_name': 'New state',
            'new_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {'value': 1},
                'catchMisspellings': {'value': False}
            }
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
        for ind in range(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # Perform an invalid action: delete a state that does not exist. This
        # should not create a new version.
        with self.assertRaisesRegex(ValueError, 'does not exist'):
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
        for ind in range(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # The final exploration should have exactly one state.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        self.assertEqual(len(exploration.states), 1)

    def test_versioning_with_reverting(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)

        # In version 1, the title was 'A title'.
        # In version 2, the title becomes 'V2 title'.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'V2 title'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed title.')

        # In version 3, a new state is added.
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
            'content_id_for_state_content': (
                content_id_generator.generate(
                    translation_domain.ContentType.CONTENT)
            ),
            'content_id_for_default_outcome': (
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME)
            )
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'next_content_id_index',
            'new_value': content_id_generator.next_content_id_index
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name':
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'state_name': 'New state',
            'new_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {'value': 1},
                'catchMisspellings': {'value': False}
            }
        })]
        exp_services.update_exploration(
            'committer_id_v3', exploration.id, change_list, 'Added new state')

        # It is not possible to revert from anything other than the most
        # current version.
        with self.assertRaisesRegex(Exception, 'too old'):
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

    def test_get_composite_change_list(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        # Upgrade to version 2.
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'old_value': 'A title',
                'new_value': 'new title'
            })], 'Changed title.')

        # Change list for version 3.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
            'content_id_for_state_content': (
                content_id_generator.generate(
                    translation_domain.ContentType.CONTENT)
            ),
            'content_id_for_default_outcome': (
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME))
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'next_content_id_index',
            'new_value': content_id_generator.next_content_id_index
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'old_value': None,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name':
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'state_name': 'New state',
            'old_value': None,
            'new_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {'value': 1},
                'catchMisspellings': {'value': False}
            }
        })]
        exp_services.update_exploration(
            'second_committer_id', exploration.id, change_list,
            'Added new state and interaction')

        # Change list for version 4.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_DELETE_STATE,
            'state_name': 'New state'
        })]
        exp_services.update_exploration(
            'committer_id_3', exploration.id, change_list,
            'Deleted state: New state')

        # Complete change list from version 1 to 4.
        composite_change_list_dict_expected = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
            'content_id_for_state_content': 'content_3',
            'content_id_for_default_outcome': 'default_outcome_4'
        }, {
            'cmd': 'edit_exploration_property',
            'property_name': 'next_content_id_index',
            'new_value': 5,
            'old_value': None
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'old_value': None,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name':
                exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'state_name': 'New state',
            'old_value': None,
            'new_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {'value': 1},
                'catchMisspellings': {'value': False}
            }
        }, {
            'cmd': exp_domain.CMD_DELETE_STATE,
            'state_name': 'New state'
        }]

        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: Trying to find change list from version %s '
            'of exploration to version %s.'
            % (4, 1)):
            exp_services.get_composite_change_list(
                self.EXP_0_ID, 4, 1)

        composite_change_list = exp_services.get_composite_change_list(
            self.EXP_0_ID, 2, 4)
        composite_change_list_dict = [change.to_dict()
                                      for change in composite_change_list]
        self.assertEqual(
            composite_change_list_dict_expected, composite_change_list_dict)

    def test_reverts_exp_to_safe_state_when_content_model_is_missing(
        self
    ) -> None:
        self.save_new_valid_exploration('0', self.owner_id)
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 1')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 2')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 3')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 4')

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 5)

        snapshot_content_model = (
            exp_models.ExplorationSnapshotContentModel.get(
                '0-5', strict=True))
        snapshot_content_model.delete()

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 4)

    def test_reverts_exp_to_safe_state_when_several_models_are_missing(
        self
    ) -> None:
        self.save_new_valid_exploration('0', self.owner_id)
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 1')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 2')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 3')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 4')

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 5)

        snapshot_content_model = (
            exp_models.ExplorationSnapshotContentModel.get(
                '0-5', strict=True))
        snapshot_content_model.delete()
        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                '0-4', strict=True))
        snapshot_metadata_model.delete()

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 3)

    def test_reverts_exp_to_safe_state_when_metadata_model_is_missing(
        self
    ) -> None:
        self.save_new_valid_exploration('0', self.owner_id)
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 1')
        exp_services.update_exploration(
                self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 2')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 3')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 4')

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 5)

        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                '0-5', strict=True))
        snapshot_metadata_model.delete()

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 4)

    def test_reverts_exp_to_safe_state_when_both_models_are_missing(
        self
    ) -> None:
        self.save_new_valid_exploration('0', self.owner_id)
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 1')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 2')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 3')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 4')

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 5)

        snapshot_content_model = (
            exp_models.ExplorationSnapshotContentModel.get(
                '0-5', strict=True))
        snapshot_content_model.delete()

        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                '0-5', strict=True))
        snapshot_metadata_model.delete()

        version = exp_services.rollback_exploration_to_safe_state('0')
        self.assertEqual(version, 4)

    def test_does_not_revert_exp_when_no_models_are_missing(self) -> None:
        self.save_new_valid_exploration('0', self.owner_id)
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 1')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 2')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 3')
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'new_value': {
                    'content_id': 'content_0',
                    'html': 'content 1'
                },
                'state_name': 'Introduction',
                'old_value': {
                    'content_id': 'content_0',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content'
            })], 'Update 4')

        version = exp_services.rollback_exploration_to_safe_state('0')

        self.assertEqual(version, 5)


class ExplorationCommitLogUnitTests(ExplorationServicesUnitTests):
    """Test methods relating to the exploration commit log."""

    ALBERT_EMAIL: Final = 'albert@example.com'
    BOB_EMAIL: Final = 'bob@example.com'
    ALBERT_NAME: Final = 'albert'
    BOB_NAME: Final = 'bob'

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'

    COMMIT_ALBERT_CREATE_EXP_1: Final = {
        'version': 1,
        'exploration_id': EXP_ID_1,
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New exploration created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_BOB_EDIT_EXP_1: Final = {
        'version': 2,
        'exploration_id': EXP_ID_1,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_CREATE_EXP_2: Final = {
        'version': 1,
        'exploration_id': 'eid2',
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New exploration created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_EXP_1: Final = {
        'version': 3,
        'exploration_id': 'eid1',
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert1 title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_EXP_2: Final = {
        'version': 2,
        'exploration_id': 'eid2',
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert2.',
        'post_commit_status': 'private'
    }

    COMMIT_BOB_REVERT_EXP_1: Final = {
        'username': 'bob',
        'version': 4,
        'exploration_id': 'eid1',
        'commit_type': 'revert',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Reverted exploration to version 2',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_DELETE_EXP_1: Final = {
        'version': 5,
        'exploration_id': 'eid1',
        'commit_type': 'delete',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': feconf.COMMIT_MESSAGE_EXPLORATION_DELETED,
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_PUBLISH_EXP_2: Final = {
        'version': None,
        'exploration_id': 'eid2',
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': False,
        'commit_message': 'exploration published.',
        'post_commit_status': 'public'
    }

    def setUp(self) -> None:
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
        super().setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.albert = user_services.get_user_actions_info(self.albert_id)
        self.bob = user_services.get_user_actions_info(self.bob_id)

        def populate_datastore() -> None:
            """Populates the database according to the sequence."""
            self.save_new_valid_exploration(
                self.EXP_ID_1, self.albert_id)

            change_list = [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })]
            exp_services.update_exploration(
                self.bob_id, self.EXP_ID_1, change_list, 'Changed title.')

            self.save_new_valid_exploration(
                self.EXP_ID_2, self.albert_id)

            change_list = [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            })]
            exp_services.update_exploration(
                self.albert_id, self.EXP_ID_1,
                change_list, 'Changed title to Albert1 title.')

            change_list = [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 2 Albert title'
            })]
            exp_services.update_exploration(
                self.albert_id, self.EXP_ID_2,
                change_list, 'Changed title to Albert2.')

            exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 3, 2)

            exp_services.delete_exploration(self.albert_id, self.EXP_ID_1)

            # This commit should not be recorded.
            with self.assertRaisesRegex(
                Exception, 'This exploration cannot be published'
                ):
                rights_manager.publish_exploration(self.bob, self.EXP_ID_2)

            rights_manager.publish_exploration(self.albert, self.EXP_ID_2)

        populate_datastore()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_get_next_page_of_all_non_private_commits_with_invalid_max_age(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'max_age must be a datetime.timedelta instance. or None.'):
            exp_services.get_next_page_of_all_non_private_commits(
                max_age='invalid_max_age')  # type: ignore[arg-type]

    def test_get_next_page_of_all_non_private_commits(self) -> None:
        all_commits = (
            exp_services.get_next_page_of_all_non_private_commits()[0])
        self.assertEqual(len(all_commits), 1)
        commit_dicts = [commit.to_dict() for commit in all_commits]
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_PUBLISH_EXP_2, commit_dicts[0])

        # TODO(frederikcreemers@gmail.com): Test max_age here.

    def test_raises_error_if_solution_is_provided_without_interaction_id(
        self
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            'test_id', 'title', 'Home')
        exp_services.save_new_exploration('Test_user', exploration)

        state_solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': True,
            'correct_answer': [
                '<p>state customization arg html 1</p>',
                '<p>state customization arg html 2</p>',
                '<p>state customization arg html 3</p>',
                '<p>state customization arg html 4</p>'
            ],
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is solution for state1</p>'
            }
        }
        change_list = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'Home',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION,
            'new_value': state_solution_dict,
        })
        with self.assertRaisesRegex(
            Exception,
            'solution cannot exist with None interaction id.'
        ):
            exp_services.apply_change_list('test_id', [change_list])


class ExplorationSearchTests(ExplorationServicesUnitTests):
    """Test exploration search."""

    USER_ID_1: Final = 'user_1'
    USER_ID_2: Final = 'user_2'

    def test_index_explorations_given_ids(self) -> None:
        all_exp_ids = ['id0', 'id1', 'id2', 'id3', 'id4']
        expected_exp_ids = all_exp_ids[:-1]
        all_exp_titles = [
            'title 0', 'title 1', 'title 2', 'title 3', 'title 4']
        expected_exp_titles = all_exp_titles[:-1]
        all_exp_categories = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4']
        expected_exp_categories = all_exp_categories[:-1]

        def mock_add_documents_to_index(
            docs: List[Dict[str, str]], index: str
        ) -> List[str]:
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

        for i in range(5):
            self.save_new_valid_exploration(
                all_exp_ids[i],
                self.owner_id,
                title=all_exp_titles[i],
                category=all_exp_categories[i])

        # We're only publishing the first 4 explorations, so we're not
        # expecting the last exploration to be indexed.
        for i in range(4):
            rights_manager.publish_exploration(
                self.owner, expected_exp_ids[i])

        with add_docs_swap:
            exp_services.index_explorations_given_ids(all_exp_ids)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_updated_exploration_is_added_correctly_to_index(self) -> None:
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

        def mock_add_documents_to_index(
            docs: List[Dict[str, str]], index: str
        ) -> None:
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

            self.process_and_flush_pending_tasks()
            self.assertEqual(actual_docs, [updated_exp_doc])
            self.assertEqual(add_docs_counter.times_called, 3)

    def test_get_number_of_ratings(self) -> None:
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

    def test_get_average_rating(self) -> None:
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)
        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)

        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 0)

        self.assertEqual(
            exp_services.get_average_rating({}), 0)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_0_ID, 5)
        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 5)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_0_ID, 2)

        exp = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertEqual(
            exp_services.get_average_rating(exp.ratings), 3.5)

    def test_get_lower_bound_wilson_rating_from_exp_summary(self) -> None:
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

    def test_valid_demo_file_path(self) -> None:
        for filename in os.listdir(feconf.SAMPLE_EXPLORATIONS_DIR):
            full_filepath = os.path.join(
                feconf.SAMPLE_EXPLORATIONS_DIR, filename)
            valid_exploration_path = os.path.isdir(full_filepath) or (
                filename.endswith('yaml'))
            self.assertTrue(valid_exploration_path)

    def test_get_demo_exploration_components_with_invalid_path_raises_error(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unrecognized file path: invalid_path'):
            exp_services.get_demo_exploration_components('invalid_path')


class ExplorationSummaryTests(ExplorationServicesUnitTests):
    """Test exploration summaries."""

    ALBERT_EMAIL: Final = 'albert@example.com'
    BOB_EMAIL: Final = 'bob@example.com'
    ALBERT_NAME: Final = 'albert'
    BOB_NAME: Final = 'bob'

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)

    def test_is_exp_summary_editable(self) -> None:
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
            rights_domain.ROLE_VIEWER)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_0_ID, self.editor_id,
            rights_domain.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_0_ID)
        self.assertTrue(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.owner_id))
        self.assertTrue(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.editor_id))
        self.assertFalse(exp_services.is_exp_summary_editable(
            exp_summary, user_id=self.viewer_id))

    def test_contributors_not_updated_on_revert(self) -> None:
        """Test that a user who only makes a revert on an exploration
        is not counted in the list of that exploration's contributors.
        """
        # Have Albert create a new exploration.
        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)
        # Have Albert update that exploration.
        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        # Have Bob revert Albert's update.
        exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 2, 1)

        # Verify that only Albert (and not Bob, who has not made any non-
        # revert changes) appears in the contributors list for this
        # exploration.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_1)
        self.assertEqual([self.albert_id], exploration_summary.contributor_ids)

    def _check_contributors_summary(
        self, exp_id: str, expected: Dict[str, int]
    ) -> None:
        """Check if contributors summary of the given exp is same as expected.

        Args:
            exp_id: str. The id of the exploration.
            expected: dict(unicode, int). Expected summary.

        Raises:
            AssertionError. Contributors summary of the given exp is not same
                as expected.
        """
        contributors_summary = exp_fetchers.get_exploration_summary_by_id(
            exp_id).contributors_summary
        self.assertEqual(expected, contributors_summary)

    def test_contributors_summary(self) -> None:
        # Have Albert create a new exploration. Version 1.
        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)
        self._check_contributors_summary(self.EXP_ID_1, {self.albert_id: 1})

        # Have Bob update that exploration. Version 2.
        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        self.process_and_flush_pending_tasks()
        self._check_contributors_summary(
            self.EXP_ID_1, {self.albert_id: 1, self.bob_id: 1})
        # Have Bob update that exploration. Version 3.
        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        self.process_and_flush_pending_tasks()
        self._check_contributors_summary(
            self.EXP_ID_1, {self.albert_id: 1, self.bob_id: 2})

        # Have Albert update that exploration. Version 4.
        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')
        self.process_and_flush_pending_tasks()
        self._check_contributors_summary(
            self.EXP_ID_1, {self.albert_id: 2, self.bob_id: 2})

        # Have Albert revert to version 3. Version 5.
        exp_services.revert_exploration(self.albert_id, self.EXP_ID_1, 4, 3)
        self._check_contributors_summary(
            self.EXP_ID_1, {self.albert_id: 1, self.bob_id: 2})

    def test_get_exploration_summary_by_id_with_invalid_exploration_id(
        self
    ) -> None:
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            'invalid_exploration_id', strict=False
        )

        self.assertIsNone(exploration_summary)

    def test_create_exploration_summary_with_deleted_contributor(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.albert_id)
        exp_services.update_exploration(
            self.bob_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'Exploration 1 title'
                })
            ],
            'Changed title.')
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.EXP_ID_1)

        self._check_contributors_summary(
            self.EXP_ID_1, {self.albert_id: 1, self.bob_id: 1})

        user_services.mark_user_for_deletion(self.bob_id)
        exp_services.regenerate_exploration_and_contributors_summaries(
            self.EXP_ID_1)

        self._check_contributors_summary(
            self.EXP_ID_1, {self.albert_id: 1})

    def test_regenerate_summary_with_new_contributor_with_invalid_exp_id(
        self
    ) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        with logging_swap:
            exp_services.regenerate_exploration_summary_with_new_contributor(
                'dummy_id', self.albert_id)

        self.assertEqual(
            observed_log_messages,
            ['Could not find exploration with ID dummy_id']
        )

    def test_raises_error_while_creating_summary_if_no_created_on_data_present(
        self
    ) -> None:
        self.save_new_valid_exploration('exp_id', 'owner_id')
        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        exp_rights = rights_manager.get_exploration_rights(
            'exp_id', strict=True)
        exploration.created_on = None
        with self.assertRaisesRegex(
            Exception, 'No data available for when the exploration was'
        ):
            exp_services.generate_new_exploration_summary(
                exploration, exp_rights
            )

    def test_raises_error_while_updating_summary_if_no_created_on_data_present(
        self
    ) -> None:
        self.save_new_valid_exploration('exp_id', 'owner_id')
        exploration = exp_fetchers.get_exploration_by_id('exp_id')
        exp_rights = rights_manager.get_exploration_rights(
            'exp_id', strict=True)

        exp_summary = exp_services.generate_new_exploration_summary(
            exploration, exp_rights
        )
        exploration.created_on = None
        with self.assertRaisesRegex(
            Exception, 'No data available for when the exploration was'
        ):
            exp_services.update_exploration_summary(
                exploration, exp_rights, exp_summary
            )


class ExplorationSummaryGetTests(ExplorationServicesUnitTests):
    """Test exploration summaries get_* functions."""

    ALBERT_EMAIL: Final = 'albert@example.com'
    BOB_EMAIL: Final = 'bob@example.com'
    ALBERT_NAME: Final = 'albert'
    BOB_NAME: Final = 'bob'

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'
    EXP_ID_3: Final = 'eid3'

    EXPECTED_VERSION_1: Final = 4
    EXPECTED_VERSION_2: Final = 2

    def setUp(self) -> None:
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
        super().setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.albert = user_services.get_user_actions_info(self.albert_id)
        self.bob = user_services.get_user_actions_info(self.bob_id)

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

        with self.assertRaisesRegex(
            Exception, 'This exploration cannot be published'
            ):
            rights_manager.publish_exploration(self.bob, self.EXP_ID_2)

        rights_manager.publish_exploration(self.albert, self.EXP_ID_2)

        self.save_new_valid_exploration(self.EXP_ID_3, self.albert_id)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_3)
        exp_services.delete_exploration(self.albert_id, self.EXP_ID_3)

    def test_get_non_private_exploration_summaries(self) -> None:

        actual_summaries = exp_services.get_non_private_exploration_summaries()

        expected_summaries = {
            self.EXP_ID_2: exp_domain.ExplorationSummary(
                self.EXP_ID_2, 'Exploration 2 Albert title',
                'Algebra', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_domain.ACTIVITY_STATUS_PUBLIC,
                False, [self.albert_id], [], [], [], [self.albert_id],
                {self.albert_id: 1},
                self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
                )}

        # Check actual summaries equal expected summaries.
        self.assertEqual(
            list(actual_summaries.keys()),
            list(expected_summaries.keys()))
        simple_props = ['id', 'title', 'category', 'objective',
                        'language_code', 'tags', 'ratings',
                        'scaled_average_rating', 'status',
                        'community_owned', 'owner_ids',
                        'editor_ids', 'voice_artist_ids', 'viewer_ids',
                        'contributor_ids', 'version',
                        'exploration_model_created_on',
                        'exploration_model_last_updated']
        for exp_id, actual_summary in actual_summaries.items():
            for prop in simple_props:
                self.assertEqual(
                    getattr(actual_summary, prop),
                    getattr(expected_summaries[exp_id], prop))

    def test_get_all_exploration_summaries(self) -> None:
        actual_summaries = exp_services.get_all_exploration_summaries()

        expected_summaries = {
            self.EXP_ID_1: exp_domain.ExplorationSummary(
                self.EXP_ID_1, 'Exploration 1 title',
                'Algebra', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_domain.ACTIVITY_STATUS_PRIVATE, False,
                [self.albert_id], [], [], [], [self.albert_id, self.bob_id],
                {self.albert_id: 1, self.bob_id: 1}, self.EXPECTED_VERSION_1,
                actual_summaries[self.EXP_ID_1].exploration_model_created_on,
                actual_summaries[self.EXP_ID_1].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_1].first_published_msec
            ),
            self.EXP_ID_2: exp_domain.ExplorationSummary(
                self.EXP_ID_2, 'Exploration 2 Albert title',
                'Algebra', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_domain.ACTIVITY_STATUS_PUBLIC,
                False, [self.albert_id], [], [], [], [self.albert_id],
                {self.albert_id: 1}, self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
            )
        }

        # Check actual summaries equal expected summaries.
        self.assertItemsEqual(actual_summaries, expected_summaries)

    def test_get_top_rated_exploration_summaries(self) -> None:
        exploration_summaries = (
            exp_services.get_top_rated_exploration_summaries(3))
        top_rated_summaries = (
            exp_models.ExpSummaryModel.get_top_rated(3))
        top_rated_summaries_model = (
            exp_fetchers.get_exploration_summaries_from_models(
                top_rated_summaries))
        self.assertItemsEqual(exploration_summaries, top_rated_summaries_model)

    def test_get_recently_published_exp_summaries(self) -> None:
        self.save_new_valid_exploration(self.EXP_0_ID, self.owner_id)
        self.save_new_valid_exploration(self.EXP_1_ID, self.owner_id)
        self.save_new_valid_exploration(self.EXP_2_ID, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_2_ID)
        exploration_summaries = (
            exp_services.get_recently_published_exp_summaries(3)
        )
        recently_published_summaries = (
            exp_models.ExpSummaryModel.get_recently_published(3))
        recently_publshed_summaries_model = (
            exp_fetchers.get_exploration_summaries_from_models(
                recently_published_summaries))
        self.assertEqual(len(exploration_summaries), 3)
        self.assertItemsEqual(
            exploration_summaries,
            recently_publshed_summaries_model)

    def test_get_story_id_linked_to_exploration(self) -> None:
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration(self.EXP_ID_1))
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.albert_id, name='Topic',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=['skill_4'], subtopics=[],
            next_subtopic_id=0)
        self.save_new_story(story_id, self.albert_id, topic_id)
        topic_services.add_canonical_story(self.albert_id, topic_id, story_id)
        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'title': 'Title 1'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'old_value': None,
                'new_value': self.EXP_ID_1
            })
        ]
        story_services.update_story(
            self.albert_id, story_id, change_list,
            'Added node.')
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration(self.EXP_ID_1),
            story_id)

    def test_get_user_exploration_data(self) -> None:
        self.save_new_valid_exploration(self.EXP_0_ID, self.albert_id)
        exploration_description = (
            exp_services.get_user_exploration_data(
                self.albert_id, self.EXP_0_ID))
        self.assertIsNotNone(exploration_description)

        exploration = self.save_new_valid_exploration(
            self.EXP_0_ID,
            self.albert_id)
        exploration.param_specs = {
            'myParam': param_domain.ParamSpec('UnicodeString')}
        init_state_name = exploration.init_state_name
        param_changes = [{
            'customization_args': {
                'list_of_values': ['1', '2'], 'parse_with_jinja': False
            },
            'name': 'myParam',
            'generator_id': 'RandomSelector'
        }]
        draft_change_list = _get_change_list(
            init_state_name, 'param_changes', param_changes)
        draft_change_list_dict = [
            change.to_dict() for change in draft_change_list]
        date_time = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.albert_id, self.EXP_0_ID),
            user_id=self.albert_id,
            exploration_id=self.EXP_0_ID,
            draft_change_list=draft_change_list_dict,
            draft_change_list_last_updated=date_time,
            draft_change_list_exp_version=1,
            draft_change_list_id=2).put()
        exploration_description_draft_applied = (
            exp_services.get_user_exploration_data(
                self.albert_id,
                self.EXP_0_ID,
                True))
        self.assertTrue(
            exploration_description_draft_applied['is_version_of_draft_valid'])
        self.save_new_valid_exploration(self.EXP_1_ID, self.bob_id)
        exploration_draft_not_applied = (
            exp_services.get_user_exploration_data(
                self.bob_id, self.EXP_1_ID, True))
        self.assertFalse(
            exploration_draft_not_applied['is_version_of_draft_valid'])


class ExplorationConversionPipelineTests(ExplorationServicesUnitTests):
    """Tests the exploration model -> exploration conversion pipeline."""

    NEW_EXP_ID: Final = 'exp_id1'

    UPGRADED_EXP_YAML: Final = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: category
edits_allowed: true
init_state_name: %r
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
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
    solicit_answer_details: false
  %r:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        buttonText:
          value:
            content_id: ca_buttonText
            unicode_str: Continue
      default_outcome:
        dest: END
        dest_if_really_stuck: null
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
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_buttonText: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
states_schema_version: %d
tags: []
title: Old Title
""") % (
    feconf.DEFAULT_INIT_STATE_NAME.encode('utf-8'),
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME.encode('utf-8'),
    feconf.CURRENT_STATE_SCHEMA_VERSION)

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    def setUp(self) -> None:
        super().setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)

        # Create standard exploration that should not be converted.
        new_exp = self.save_new_valid_exploration(
            self.NEW_EXP_ID, self.albert_id)
        self._up_to_date_yaml = new_exp.to_yaml()

    def test_get_exploration_from_model_with_invalid_schema_version_raise_error(
        self
    ) -> None:
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

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v41-v%d exploration state schemas at '
            'present.' % feconf.CURRENT_STATE_SCHEMA_VERSION):
            exp_fetchers.get_exploration_from_model(exp_model)

    def test_update_exploration_by_voice_artist(self) -> None:
        exp_id = 'exp_id'
        user_id = 'user_id'
        self.save_new_default_exploration(exp_id, user_id)
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'new title'
            })]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Voice artist does not have permission to make some '
            'changes in the change list.'):
            exp_services.update_exploration(
                user_id, exp_id, change_list, 'By voice artist', True)

    def test_update_exploration_linked_to_story(self) -> None:
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        exp_id = 'exp_id'
        user_id = 'user_id'
        self.save_new_default_exploration(exp_id, user_id)
        self.save_new_topic(
            topic_id, user_id, name='Topic',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=['skill_4'], subtopics=[],
            next_subtopic_id=0)
        self.save_new_story(story_id, user_id, topic_id)
        topic_services.add_canonical_story(user_id, topic_id, story_id)
        change_list_story = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'title': 'Title 1'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'old_value': None,
                'new_value': exp_id
            })
        ]
        story_services.update_story(
            user_id, story_id, change_list_story,
            'Added node.')
        change_list_exp = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'new title'
            })]
        opportunity_services.add_new_exploration_opportunities(
            story_id, [exp_id])
        exp_services.update_exploration(
            user_id, exp_id, change_list_exp, 'story linked')
        updated_exp = exp_fetchers.get_exploration_by_id(exp_id)
        self.assertEqual(updated_exp.title, 'new title')

    def test_update_exploration_with_empty_change_list_does_not_update(
        self
    ) -> None:
        exploration = self.save_new_default_exploration('exp_id', 'user_id')

        self.assertEqual(exploration.title, 'A title')
        self.assertEqual(exploration.category, 'Algebra')
        self.assertEqual(
            exploration.objective, feconf.DEFAULT_EXPLORATION_OBJECTIVE)
        self.assertEqual(exploration.language_code, 'en')

        exp_services.update_exploration(
            'user_id', 'exp_id', [], 'empty commit')

        exploration = exp_fetchers.get_exploration_by_id('exp_id')

        self.assertEqual(exploration.title, 'A title')
        self.assertEqual(exploration.category, 'Algebra')
        self.assertEqual(
            exploration.objective, feconf.DEFAULT_EXPLORATION_OBJECTIVE)
        self.assertEqual(exploration.language_code, 'en')

    def test_save_exploration_with_mismatch_of_versions_raises_error(
        self
    ) -> None:
        self.save_new_valid_exploration('exp_id', 'user_id')
        exploration_model = exp_models.ExplorationModel.get('exp_id')
        exploration = exp_fetchers.get_exploration_from_model(exploration_model)
        exploration.version = 2

        def _mock_apply_change_list(
            *unused_args: str, **unused_kwargs: str
        ) -> exp_domain.Exploration:
            """Mocks exp_fetchers.get_exploration_by_id()."""
            return exploration

        fetch_swap = self.swap(
            exp_services, 'apply_change_list',
            _mock_apply_change_list)

        with fetch_swap, self.assertRaisesRegex(
            Exception,
            'Unexpected error: trying to update version 1 of exploration '
            'from version 2. Please reload the page and try again.'):
            exp_services.update_exploration(
                'user_id', 'exp_id', [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'new title'
                })], 'changed title')

    def test_update_title(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.language_code, 'en')
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'language_code',
                'new_value': 'bn'
            })], 'Changed language code.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'new changed title'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list, 'Changed title.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.language_code, 'bn')
        self.assertEqual(exploration.title, 'new changed title')

    def test_update_language_code(self) -> None:
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'language_code',
            'new_value': 'en'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed language code again.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(exploration.language_code, 'en')

    def test_update_exploration_tags(self) -> None:
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'tags',
            'new_value': ['test', 'skill']
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed tags.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(exploration.tags, ['test', 'skill'])

    def test_update_exploration_author_notes(self) -> None:
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'author_notes',
            'new_value': 'author_notes_updated_again'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed author_notes.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(exploration.author_notes, 'author_notes_updated_again')

    def test_update_exploration_blurb(self) -> None:
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'blurb',
            'new_value': 'blurb_changed'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed blurb.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(exploration.blurb, 'blurb_changed')

    def test_update_exploration_param_changes(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.param_changes, [])

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'param_specs',
            'new_value': {
                'myParam': {'obj_type': 'UnicodeString'}
            }
        })]
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list, '')

        param_changes: List[param_domain.ParamChangeDict] = [{
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

    def test_update_exploration_init_state_name(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index
            })], 'Added new state.')

        self.assertEqual(
            exploration.init_state_name, feconf.DEFAULT_INIT_STATE_NAME)

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'init_state_name',
                    'new_value': 'State',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'State',
                    'property_name': 'card_is_checkpoint',
                    'new_value': True,
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'property_name': 'card_is_checkpoint',
                    'new_value': False,
                }),
            ], 'Changed init_state_name and checkpoints.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.init_state_name, 'State')

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'init_state_name',
            'new_value': feconf.DEFAULT_INIT_STATE_NAME,
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'State',
            'property_name': 'card_is_checkpoint',
            'new_value': False,
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'property_name': 'card_is_checkpoint',
            'new_value': True,
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 3, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed init_state_name and checkpoints again.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(
            exploration.init_state_name, feconf.DEFAULT_INIT_STATE_NAME)

    def test_update_exploration_auto_tts_enabled(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.auto_tts_enabled, False)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'auto_tts_enabled',
                'new_value': False
            })], 'Changed auto_tts_enabled.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.auto_tts_enabled, False)

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'auto_tts_enabled',
            'new_value': True
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed auto_tts_enabled again.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(exploration.auto_tts_enabled, True)

    def test_update_old_exploration_version_remains_editable(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.language_code, 'en')
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'language_code',
                'new_value': 'hi'
            })], 'Changed language code.')

        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.language_code, 'hi')

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'language_code',
            'new_value': 'en'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed language code again.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(exploration.language_code, 'en')

    def test_update_exploration_with_mark_translation_needs_update_changes(
        self
    ) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.NEW_EXP_ID,
            exploration.version, 'hi', 'content_0',
            translation_domain.TranslatedContent(
                'Translation',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        entity_translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, self.NEW_EXP_ID,
                exploration.version
            )
        )
        self.assertEqual(len(entity_translations), 1)
        self.assertFalse(
            entity_translations[0].translations['content_0'].needs_update)

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MARK_TRANSLATIONS_NEEDS_UPDATE,
                'content_id': 'content_0'
            })], 'Marked translation need update.')
        entity_translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, self.NEW_EXP_ID,
                exploration.version + 1
            )
        )
        self.assertEqual(len(entity_translations), 1)
        self.assertTrue(
            entity_translations[0].translations['content_0'].needs_update)

    def test_update_exploration_with_remove_translation_changes(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.NEW_EXP_ID,
            exploration.version, 'hi', 'content_0',
            translation_domain.TranslatedContent(
                'Translation 1',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION, self.NEW_EXP_ID,
            exploration.version, 'hi', 'default_outcome_1',
            translation_domain.TranslatedContent(
                'Translation 2',
                translation_domain.TranslatableContentFormat.HTML,
                False
            )
        )
        entity_translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, self.NEW_EXP_ID,
                exploration.version
            )
        )
        self.assertEqual(len(entity_translations), 1)
        self.assertTrue('content_0' in entity_translations[0].translations)
        self.assertTrue(
            'default_outcome_1' in entity_translations[0].translations)

        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_REMOVE_TRANSLATIONS,
                'content_id': 'content_0'
            })], 'Marked translation need update.')

        entity_translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, self.NEW_EXP_ID,
                exploration.version + 1
            )
        )
        self.assertEqual(len(entity_translations), 1)
        self.assertFalse('content_0' in entity_translations[0].translations)
        self.assertTrue(
            'default_outcome_1' in entity_translations[0].translations)

    def test_update_unclassified_answers(self) -> None:
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS,
            'state_name': exploration.init_state_name,
            'new_value': ['test', 'skill']
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed confirmed_unclassified_answers.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(
            exploration.init_state.interaction.confirmed_unclassified_answers,
            ['test', 'skill'])

    def test_update_interaction_hints(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.init_state.interaction.hints, [])

        hint_list: List[state_domain.HintDict] = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': (
                    '<p>Hello, this is html1 for state2'
                    '<oppia-noninteractive-image filepath-with-value="'
                    '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        hint_list_2: List[state_domain.HintDict] = [{
            'hint_content': {
                'content_id': 'hint_1',
                'html': (
                    '<p>Hello, this is html1 for state2'
                    '<oppia-noninteractive-image filepath-with-value="'
                    '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            }
        }, {
            'hint_content': {
                'content_id': 'hint_2',
                'html': (
                    '<p>Hello, this is html1 for state2'
                    '<oppia-noninteractive-image filepath-with-value="'
                    '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            }
        }]

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_HINTS,
            'state_name': exploration.init_state_name,
            'new_value': hint_list_2
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 2, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list, 'Changed hints.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(len(exploration.init_state.interaction.hints), 2)
        self.assertEqual(
            exploration.init_state.interaction.hints[0].hint_content.content_id,
            'hint_1')
        self.assertEqual(
            exploration.init_state.interaction.hints[1].hint_content.content_id,
            'hint_2')

    def test_update_interaction_hints_invalid_parameter_type(self) -> None:
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
                    '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            }
        }

        with self.assertRaisesRegex(
            Exception, 'Expected hints_list to be a list.*'):
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        hint_dict = {
            'hint_content': {
                'content_id': 'hint_1',
                'html': (
                    '<p>Hello, this is html1 for state2'
                    '<oppia-noninteractive-image filepath-with-value="'
                    '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            }
        }

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_HINTS,
            'state_name': exploration.init_state_name,
            'new_value': hint_dict
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 1, change_list)
        self.assertTrue(changes_are_mergeable)
        with self.assertRaisesRegex(
            Exception, 'Expected hints_list to be a list.*'):
            exp_services.update_exploration(
                self.albert_id, self.NEW_EXP_ID, change_list,
                'Changed hints.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        hint_dict = {
            'hint_content': {
                'content_id': 'hint_1',
                'html': (
                    '<p>Hello, this is html1 for state2'
                    '<oppia-noninteractive-image filepath-with-value="'
                    '&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    '"&amp;quot;&amp;quot;" alt-with-value='
                    '"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
                    '</p>')
            }
        }

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_HINTS,
            'state_name': exploration.init_state_name,
            'new_value': hint_dict
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 1, change_list)
        self.assertTrue(changes_are_mergeable)
        with self.assertRaisesRegex(
            Exception, 'Expected hints_list to be a list.*'):
            exp_services.update_exploration(
                self.albert_id, self.NEW_EXP_ID, change_list,
                'Changed hints.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(exploration.title, 'new title')

    def test_update_interaction_solutions(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertIsNone(exploration.init_state.interaction.solution)

        solution: Optional[state_domain.SolutionDict] = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            },
        }

        hint_list: List[state_domain.HintDict] = [{
            'hint_content': {
                'content_id': u'hint_1',
                'html': (
                    u'<p>Hello, this is html1 for state2'
                    u'<oppia-noninteractive-image filepath-with-value="'
                    u'&amp;quot;s2Hint1.png&amp;quot;" caption-with-value='
                    u'"&amp;quot;&amp;quot;" alt-with-value='
                    u'"&amp;quot;image&amp;quot;"></oppia-noninteractive-image>'
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
        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.solution is not None
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

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        solution_2 = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_oppia is a string</p>'
            },
        }

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION,
            'state_name': exploration.init_state_name,
            'new_value': solution_2
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 4, change_list)
        self.assertTrue(changes_are_mergeable)
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, change_list,
            'Changed interaction_solutions.')

        # Assert that final version consists all the changes.
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration.init_state.interaction.solution is not None
        self.assertEqual(exploration.title, 'new title')
        self.assertEqual(
            exploration.init_state.interaction.solution.to_dict(),
            solution_2)

    def test_cannot_update_recorded_voiceovers_with_invalid_type(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        with self.assertRaisesRegex(
            Exception, 'Expected recorded_voiceovers to be a dict'):
            exp_services.update_exploration(
                self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
                    'state_name': exploration.init_state_name,
                    'new_value': 'invalid_recorded_voiceovers'
                })], 'Changed recorded_voiceovers.')

        # Check that the property can be changed when working
        # on old version.
        # Add change to upgrade the version.
        exp_services.update_exploration(
            self.albert_id, self.NEW_EXP_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'new title'
            })], 'Changed title.')

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': exploration.init_state_name,
            'new_value': 'invalid_recorded_voiceovers'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.NEW_EXP_ID, 1, change_list)
        self.assertTrue(changes_are_mergeable)
        with self.assertRaisesRegex(
            Exception, 'Expected recorded_voiceovers to be a dict'):
            exp_services.update_exploration(
                self.albert_id, self.NEW_EXP_ID, change_list,
                'Changed recorded_voiceovers.')

    def test_get_exploration_validation_error(self) -> None:
        # Valid exploration version.
        info = exp_services.get_exploration_validation_error(
            self.NEW_EXP_ID, 0)
        self.assertIsNone(info)

        # Invalid exploration version.
        def _mock_exploration_validate_function(
            *args: str, **kwargs: str
        ) -> None:
            """Mocks exploration.validate()."""
            raise utils.ValidationError('Bad')

        validate_swap = self.swap(
            exp_domain.Exploration, 'validate',
            _mock_exploration_validate_function)
        with validate_swap:
            info = exp_services.get_exploration_validation_error(
                self.NEW_EXP_ID, 0)
            self.assertEqual(info, 'Bad')

    def test_revert_exploration_after_publish(self) -> None:
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.albert_id,
            end_state_name='EndState')
        exploration_model = exp_fetchers.get_exploration_by_id(self.EXP_0_ID)
        exp_services.update_exploration(
            self.albert_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'New title'
            })], 'Changed title')
        user_actions_info = user_services.get_user_actions_info(self.albert_id)
        rights_manager.publish_exploration(user_actions_info, self.EXP_0_ID)
        updated_exploration_model = exp_fetchers.get_exploration_by_id(
            self.EXP_0_ID)
        exp_services.revert_exploration(
            self.albert_id, self.EXP_0_ID, updated_exploration_model.version, 1)
        reverted_exploration = exp_fetchers.get_exploration_by_id(
            self.EXP_0_ID)
        self.assertEqual(exploration_model.title, reverted_exploration.title)
        self.assertEqual(3, reverted_exploration.version)

    def test_revert_exploration_with_mismatch_of_versions_raises_error(
        self
    ) -> None:
        self.save_new_valid_exploration('exp_id', 'user_id')

        exploration_model = exp_models.ExplorationModel.get('exp_id')
        exploration_model.version = 0

        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: trying to update version 0 of exploration '
            'from version 1. Please reload the page and try again.'):
            exp_services.revert_exploration('user_id', 'exp_id', 1, 0)


class EditorAutoSavingUnitTests(test_utils.GenericTestBase):
    """Test editor auto saving functions in exp_services."""

    EXP_ID1: Final = 'exp_id1'
    EXP_ID2: Final = 'exp_id2'
    EXP_ID3: Final = 'exp_id3'
    USERNAME: Final = 'user123'
    USER_ID: Final = 'user_id'
    COMMIT_MESSAGE: Final = 'commit message'
    DATETIME: Final = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')
    OLDER_DATETIME: Final = datetime.datetime.strptime('2016-01-16', '%Y-%m-%d')
    NEWER_DATETIME: Final = datetime.datetime.strptime('2016-03-16', '%Y-%m-%d')
    NEW_CHANGELIST: Final = [exp_domain.ExplorationChange({
        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
        'property_name': 'title',
        'new_value': 'New title'})]
    NEW_CHANGELIST_DICT: Final = [NEW_CHANGELIST[0].to_dict()]

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        # Create explorations.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID1, self.USER_ID)
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'param_specs',
            'new_value': {
                'myParam': {'obj_type': 'UnicodeString'}
            }
        })]
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID1, change_list, '')
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

    def test_draft_cleared_after_change_list_applied(self) -> None:
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID1, self.draft_change_list, '')
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID1))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)

    def test_draft_version_valid_returns_true(self) -> None:
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID1))
        self.assertTrue(exp_services.is_version_of_draft_valid(
            self.EXP_ID1, exp_user_data.draft_change_list_exp_version))

    def test_draft_version_valid_returns_false(self) -> None:
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID2))
        self.assertFalse(exp_services.is_version_of_draft_valid(
            self.EXP_ID2, exp_user_data.draft_change_list_exp_version))

    def test_draft_version_valid_when_no_draft_exists(self) -> None:
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID3))
        self.assertFalse(exp_services.is_version_of_draft_valid(
            self.EXP_ID3, exp_user_data.draft_change_list_exp_version))

    def test_create_or_update_draft_when_by_voice_artist(self) -> None:
        with self.assertRaisesRegex(
                utils.ValidationError,
                'Voice artist does not have permission to make some '
                'changes in the change list.'):
            exp_services.create_or_update_draft(
                self.EXP_ID1, self.USER_ID, self.NEW_CHANGELIST, 5,
                self.NEWER_DATETIME, True)

    def test_create_or_update_draft_when_older_draft_exists(self) -> None:
        exp_services.create_or_update_draft(
            self.EXP_ID1, self.USER_ID, self.NEW_CHANGELIST, 5,
            self.NEWER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID1)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        self.assertEqual(exp_user_data.exploration_id, self.EXP_ID1)
        self.assertEqual(
            exp_user_data.draft_change_list, self.NEW_CHANGELIST_DICT)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.NEWER_DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 5)
        self.assertEqual(exp_user_data.draft_change_list_id, 3)

    def test_create_or_update_draft_when_newer_draft_exists(self) -> None:
        exp_services.create_or_update_draft(
            self.EXP_ID1, self.USER_ID, self.NEW_CHANGELIST, 5,
            self.OLDER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID1)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        self.assertEqual(exp_user_data.exploration_id, self.EXP_ID1)
        self.assertEqual(
            exp_user_data.draft_change_list, self.draft_change_list_dict)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 2)
        self.assertEqual(exp_user_data.draft_change_list_id, 2)

    def test_create_or_update_draft_when_draft_does_not_exist(self) -> None:
        exp_services.create_or_update_draft(
            self.EXP_ID3, self.USER_ID, self.NEW_CHANGELIST, 5,
            self.NEWER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID3)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        self.assertEqual(exp_user_data.exploration_id, self.EXP_ID3)
        self.assertEqual(
            exp_user_data.draft_change_list, self.NEW_CHANGELIST_DICT)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.NEWER_DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 5)
        self.assertEqual(exp_user_data.draft_change_list_id, 1)

    def test_get_exp_with_draft_applied_when_draft_exists(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID1)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID1, self.USER_ID)
        self.assertIsNotNone(updated_exp)
        # Ruling out the possibility of None for mypy type checking.
        assert updated_exp is not None
        param_changes = updated_exp.init_state.param_changes[0].to_dict()
        self.assertEqual(param_changes['name'], 'myParam')
        self.assertEqual(param_changes['generator_id'], 'RandomSelector')
        self.assertEqual(
            param_changes['customization_args'],
            {'list_of_values': ['1', '2'], 'parse_with_jinja': False})

    def test_get_exp_with_draft_applied_when_draft_does_not_exist(
        self
    ) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID3)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID3, self.USER_ID)
        self.assertIsNone(updated_exp)

    def test_get_exp_with_draft_applied_when_draft_version_is_invalid(
        self
    ) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID2)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID2, self.USER_ID)
        self.assertIsNone(updated_exp)

    def test_draft_discarded(self) -> None:
        user_data_model = (
            exp_services.get_exp_user_data_model_with_draft_discarded(
                self.EXP_ID1,
                self.USER_ID
            )
        )
        assert user_data_model is not None
        user_data_model.update_timestamps()
        user_data_model.put()
        exp_user_data = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID1))
        self.assertIsNone(exp_user_data.draft_change_list)
        self.assertIsNone(exp_user_data.draft_change_list_last_updated)
        self.assertIsNone(exp_user_data.draft_change_list_exp_version)

    def test_create_or_update_draft_with_exploration_model_not_created(
        self
    ) -> None:
        self.save_new_valid_exploration(
            'exp_id', self.admin_id, title='title')

        rights_manager.assign_role_for_exploration(
            self.admin, 'exp_id', self.editor_id, rights_domain.ROLE_EDITOR)

        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.editor_id, 'exp_id')
        self.assertIsNone(exp_user_data)

        exp_services.create_or_update_draft(
            'exp_id', self.editor_id, self.NEW_CHANGELIST, 1,
            self.NEWER_DATETIME)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.editor_id, 'exp_id')
        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        self.assertEqual(exp_user_data.exploration_id, 'exp_id')
        self.assertEqual(
            exp_user_data.draft_change_list, self.NEW_CHANGELIST_DICT)
        self.assertEqual(
            exp_user_data.draft_change_list_last_updated, self.NEWER_DATETIME)
        self.assertEqual(exp_user_data.draft_change_list_exp_version, 1)
        self.assertEqual(exp_user_data.draft_change_list_id, 1)

    def test_get_exp_with_draft_applied_when_draft_has_invalid_math_tags(
        self
    ) -> None:
        """Test the method get_exp_with_draft_applied when the draft_changes
        have invalid math-tags in them.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exploration.add_states(['State1'])
        state = exploration.states['State1']
        choices_subtitled_html_dicts: List[state_domain.SubtitledHtmlDict] = [
            {
                'content_id': 'ca_choices_0',
                'html': '<p>state customization arg html 1</p>'
            },
            {
                'content_id': 'ca_choices_1',
                'html': '<p>state customization arg html 2</p>'
            },
            {
                'content_id': 'ca_choices_2',
                'html': '<p>state customization arg html 3</p>'
            },
            {
                'content_id': 'ca_choices_3',
                'html': '<p>state customization arg html 4</p>'
            }
        ]
        state_customization_args_dict: Dict[
            str, Dict[str, Union[int, List[state_domain.SubtitledHtmlDict]]]
        ] = {
            'choices': {
                'value': choices_subtitled_html_dicts
            },
            'maxAllowableSelectionCount': {
                'value': 1
            },
            'minAllowableSelectionCount': {
                'value': 1
            }
        }
        state.update_interaction_id('ItemSelectionInput')
        state.update_interaction_customization_args(
            state_customization_args_dict)
        exp_services.save_new_exploration(self.USER_ID, exploration)
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'State1',
            'property_name': 'widget_customization_args',
            'new_value': {
                'choices': {
                    'value': [
                        {
                            'content_id': 'ca_choices_0',
                            'html': '<p>1</p>'
                        },
                        {
                            'content_id': 'ca_choices_1',
                            'html': '<p>2</p>'
                        },
                        {
                            'content_id': 'ca_choices_2',
                            'html': (
                                '<oppia-noninteractive-math raw_latex-with'
                                '-value="&amp;quot;(x - a_1)(x - a_2)(x - a_3).'
                                '..(x - a_n)&amp;quot;"></oppia-noninteractive-'
                                'math>'
                            )
                        },
                        {
                            'content_id': 'ca_choices_3',
                            'html': '<p>4</p>'
                        }
                    ]
                },
                'maxAllowableSelectionCount': {
                    'value': 1
                },
                'minAllowableSelectionCount': {
                    'value': 1
                }
            }
        }).to_dict()]
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, 'exp_id'), user_id=self.USER_ID,
            exploration_id='exp_id',
            draft_change_list=change_list,
            draft_change_list_last_updated=self.DATETIME,
            draft_change_list_exp_version=1,
            draft_change_list_id=2).put()
        with self.swap(state_domain.SubtitledHtml, 'validate', lambda x: True):
            updated_exploration = exp_services.get_exp_with_draft_applied(
                'exp_id', self.USER_ID)
        self.assertIsNone(updated_exploration)


class ApplyDraftUnitTests(test_utils.GenericTestBase):
    """Test apply draft functions in exp_services."""

    EXP_ID1: Final = 'exp_id1'
    USER_ID: Final = 'user_id'
    DATETIME: Final = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')

    def setUp(self) -> None:
        super().setUp()
        # Create explorations.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID1, self.USER_ID)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'param_specs',
            'new_value': {
                'myParam': {'obj_type': 'UnicodeString'}
            }
        })]
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID1, change_list, '')

        migration_change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            'from_version': 54,
            'to_version': str(feconf.CURRENT_STATE_SCHEMA_VERSION)
        })]
        exp_services.update_exploration(
            self.USER_ID, self.EXP_ID1,
            migration_change_list, 'Migrate state schema.')

        state = exploration.states[exploration.init_state_name]
        self.draft_change_list = _get_change_list(
            exploration.init_state_name, 'content', {
                'content_id': state.content.content_id,
                'html': '<p>New html value</p>'
            })
        self.draft_change_list_dict = [
            change.to_dict() for change in self.draft_change_list]
        # Explorations with draft set.
        exp_user_data = user_models.ExplorationUserDataModel.create(
            self.USER_ID, self.EXP_ID1)
        exp_user_data.draft_change_list = self.draft_change_list_dict
        exp_user_data.draft_change_list_last_updated = self.DATETIME
        exp_user_data.draft_change_list_exp_version = 2
        exp_user_data.draft_change_list_id = 2
        exp_user_data.update_timestamps()
        exp_user_data.put()

    def test_get_exp_with_draft_applied_after_draft_upgrade(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID1)
        self.assertEqual(exploration.init_state.param_changes, [])
        updated_exp = exp_services.get_exp_with_draft_applied(
            self.EXP_ID1, self.USER_ID)
        self.assertIsNotNone(updated_exp)
        # Ruling out the possibility of None for mypy type checking.
        assert updated_exp is not None
        new_content_dict = updated_exp.init_state.content.to_dict()
        self.assertEqual(new_content_dict['html'], '<p>New html value</p>')
        self.assertEqual(new_content_dict['content_id'], 'content_0')

    def test_get_exp_with_draft_applied_when_draft_has_exp_property_changes(
        self
    ) -> None:
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'New title'
        }).to_dict()]
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID1), user_id=self.USER_ID,
            exploration_id=self.EXP_ID1,
            draft_change_list=change_list,
            draft_change_list_last_updated=self.DATETIME,
            draft_change_list_exp_version=2,
            draft_change_list_id=2).put()
        updated_exploration = exp_services.get_exp_with_draft_applied(
            self.EXP_ID1, self.USER_ID)
        self.assertFalse(updated_exploration is None)


class UpdateVersionHistoryUnitTests(ExplorationServicesUnitTests):
    """Tests for ensuring creation, deletion and updation of version history
    data is carried out correctly.
    """

    def setUp(self) -> None:
        super().setUp()
        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_0_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)
        self.exploration = exploration
        self.version_history_model_class: Type[
            exp_models.ExplorationVersionHistoryModel
        ] = (
            exp_models.ExplorationVersionHistoryModel)

    def test_creating_new_exploration_creates_version_history_model(
        self
    ) -> None:
        version_history_id = (
            self.version_history_model_class.get_instance_id(
                self.exploration.id, self.exploration.version))
        version_history_model = self.version_history_model_class.get(
            version_history_id)
        expected_state_version_history_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: state_domain.StateVersionHistory(
                None, None, self.owner_id
            ).to_dict()
        }

        self.assertEqual(
            version_history_model.state_version_history,
            expected_state_version_history_dict)
        self.assertEqual(
            version_history_model.metadata_last_edited_version_number, None)
        self.assertEqual(
            version_history_model.metadata_last_edited_committer_id,
            self.owner_id)
        self.assertIn(self.owner_id, version_history_model.committer_ids)

    def test_soft_deletion_does_not_delete_version_history_models(self) -> None:
        version_history_models_before_deletion: Sequence[
            exp_models.ExplorationVersionHistoryModel
        ] = (
            self.version_history_model_class.query(
                self.version_history_model_class.exploration_id ==
                    self.exploration.id
            ).fetch())
        exp_services.delete_exploration(self.owner_id, self.exploration.id)
        version_history_models_after_deletion: Sequence[
            exp_models.ExplorationVersionHistoryModel
        ] = (
            self.version_history_model_class.query(
                self.version_history_model_class.exploration_id ==
                    self.exploration.id
            ).fetch())

        self.assertEqual(
            version_history_models_before_deletion,
            version_history_models_after_deletion)

    def test_hard_deletion_deletes_version_history_models(self) -> None:
        version_history_models_before_deletion: Sequence[
            exp_models.ExplorationVersionHistoryModel
        ] = (
            self.version_history_model_class.query(
                self.version_history_model_class.exploration_id ==
                    self.exploration.id
            ).fetch())
        exp_services.delete_exploration(
            self.owner_id, self.exploration.id, force_deletion=True)
        version_history_models_after_deletion: Sequence[
            exp_models.ExplorationVersionHistoryModel
        ] = (
            self.version_history_model_class.query(
                self.version_history_model_class.exploration_id ==
                    self.exploration.id
            ).fetch())

        self.assertNotEqual(
            version_history_models_before_deletion,
            version_history_models_after_deletion)

    def test_version_history_on_add_state(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))

        self.assertEqual(
            old_model.state_version_history.get('New state'), None)
        content_id_generator = translation_domain.ContentIdGenerator(
            self.exploration.next_content_id_index)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'New state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index,
                'old_value': 0
            })], 'Added state')

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            new_model.state_version_history.get('New state'),
            state_domain.StateVersionHistory(
                None, None, self.owner_id).to_dict())

    def test_version_history_on_delete_state(self) -> None:
        content_id_generator: translation_domain.ContentIdGenerator = (
            translation_domain.ContentIdGenerator(
                self.exploration.next_content_id_index))
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'New state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index,
                'old_value': 0
            })], 'Added state')
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            old_model.state_version_history.get('New state'),
            state_domain.StateVersionHistory(
                None, None, self.owner_id).to_dict())

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_DELETE_STATE,
                'state_name': 'New state',
            })], 'Deleted state')
        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 3))

        self.assertEqual(
            new_model.state_version_history.get('New state'), None)

    def test_version_history_on_rename_state(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))
        new_state_name = 'Another name'

        self.assertEqual(
            old_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME),
            state_domain.StateVersionHistory(
                None, None, self.owner_id).to_dict())
        self.assertEqual(
            old_model.state_version_history.get(new_state_name), None)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': new_state_name
            })], 'Renamed state')

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            new_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME), None)
        self.assertEqual(
            new_model.state_version_history.get(new_state_name),
            state_domain.StateVersionHistory(
                1, feconf.DEFAULT_INIT_STATE_NAME, self.owner_id).to_dict())

    def test_version_history_on_cancelled_rename_state(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))
        new_state_name = 'Another name'
        expected_dict = state_domain.StateVersionHistory(
            None, None, self.owner_id).to_dict()

        self.assertEqual(
            old_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME), expected_dict)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'new_state_name': new_state_name
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': new_state_name,
                    'new_state_name': feconf.DEFAULT_INIT_STATE_NAME
                })
            ], 'Renamed state')

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            new_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME), expected_dict)

    def test_version_history_on_edit_state_property(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))

        self.assertEqual(
            old_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME),
            state_domain.StateVersionHistory(
                None, None, self.owner_id).to_dict())

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': 'ca_placeholder_0',
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1},
                        'catchMisspellings': {'value': False}
                    }
                })
            ], 'Edited interaction'
        )

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            new_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME),
            state_domain.StateVersionHistory(
                1, feconf.DEFAULT_INIT_STATE_NAME, self.owner_id).to_dict())

    def test_version_history_on_cancelled_edit_state_property(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))
        expected_dict = state_domain.StateVersionHistory(
            None, None, self.owner_id).to_dict()

        self.assertEqual(
            old_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME), expected_dict)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'new_value': None
                })
            ], 'Edited interaction id'
        )

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            new_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME), expected_dict)

    def test_version_history_on_only_translation_commits(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))
        expected_dict = state_domain.StateVersionHistory(
            None, None, self.owner_id).to_dict()

        self.assertEqual(
            old_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME), expected_dict)

        recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    }
                },
                'default_outcome_1': {}
            }
        }
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'new_value': recorded_voiceovers_dict
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Translation commits')

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            new_model.state_version_history.get(
                feconf.DEFAULT_INIT_STATE_NAME), expected_dict)

    def test_version_history_on_edit_exploration_property(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))

        self.assertEqual(old_model.metadata_last_edited_version_number, None)
        self.assertEqual(
            old_model.metadata_last_edited_committer_id, self.owner_id)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
              'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
              'property_name': 'title',
              'new_value': 'New title'})], 'Changed title')

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(new_model.metadata_last_edited_version_number, 1)
        self.assertEqual(
            new_model.metadata_last_edited_committer_id, self.owner_id)

    def test_version_history_on_cancelled_edit_exploration_property(
        self
    ) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))

        self.assertEqual(old_model.metadata_last_edited_version_number, None)
        self.assertEqual(
            old_model.metadata_last_edited_committer_id, self.owner_id)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'New title'}
                ), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': feconf.DEFAULT_EXPLORATION_TITLE}
                )
            ], 'Changed title')

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(new_model.metadata_last_edited_version_number, None)
        self.assertEqual(
            new_model.metadata_last_edited_committer_id, self.owner_id)

    def test_version_history_on_revert_exploration(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
              'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
              'property_name': 'title',
              'new_value': 'New title'})], 'Changed title')
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                    'new_state_name': 'Another state'
                })
            ], 'Renamed state')
        exp_services.revert_exploration(self.owner_id, self.EXP_0_ID, 3, 1)

        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 4))

        self.assertEqual(
            old_model.state_version_history,
            new_model.state_version_history)
        self.assertEqual(
            old_model.metadata_last_edited_version_number,
            new_model.metadata_last_edited_version_number)
        self.assertEqual(
            old_model.metadata_last_edited_committer_id,
            new_model.metadata_last_edited_committer_id)
        self.assertEqual(old_model.committer_ids, new_model.committer_ids)

    def test_version_history_on_cancelled_add_state(self) -> None:
        # In this case, the version history for that state should not be
        # recorded because it was added and deleted in the same commit.
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))
        content_id_generator = translation_domain.ContentIdGenerator(
            self.exploration.next_content_id_index)
        change_list = [
          exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'New state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
          }), exp_domain.ExplorationChange({
              'cmd': exp_domain.CMD_DELETE_STATE,
              'state_name': 'New state'
          })
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added and deleted state')
        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertIsNone(old_model.state_version_history.get('New state'))
        self.assertIsNone(new_model.state_version_history.get('New state'))

    def test_version_history_on_state_name_interchange(self) -> None:
        content_id_generator = translation_domain.ContentIdGenerator(
            self.exploration.next_content_id_index)
        change_list_from_v1_to_v2 = [
            exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'first',
                    'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'second',
                'content_id_for_state_content': (
                        content_id_generator.generate(
                            translation_domain.ContentType.CONTENT)
                    ),
                    'content_id_for_default_outcome': (
                        content_id_generator.generate(
                            translation_domain.ContentType.DEFAULT_OUTCOME)
                    )
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index,
                'old_value': 0
            })
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_from_v1_to_v2,
            'Added two new states')
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 2))

        self.assertEqual(
            old_model.state_version_history['first'],
            state_domain.StateVersionHistory(
                None, None, self.owner_id).to_dict())
        self.assertEqual(
            old_model.state_version_history['second'],
            state_domain.StateVersionHistory(
                None, None, self.owner_id).to_dict())

        # Correctly interchanging the state names.
        change_list_from_v2_to_v3 = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'first',
                'new_state_name': 'temporary'
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'second',
                'new_state_name': 'first'
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'temporary',
                'new_state_name': 'second'
            })
        ]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_from_v2_to_v3,
            'Added two new states')
        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 3))

        self.assertEqual(
            new_model.state_version_history['second'],
            state_domain.StateVersionHistory(
                2, 'first', self.owner_id).to_dict())
        self.assertEqual(
            new_model.state_version_history['first'],
            state_domain.StateVersionHistory(
                2, 'second', self.owner_id).to_dict())

    def test_new_committer_id_is_added_to_committer_ids_list(self) -> None:
        old_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 1))

        self.assertNotIn(self.editor_id, old_model.committer_ids)

        content_id_generator = translation_domain.ContentIdGenerator(
            self.exploration.next_content_id_index)
        exp_services.update_exploration(
            self.editor_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'New state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index,
                'old_value': 0
            })], 'Added a state')
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'Another state',
                'content_id_for_state_content': (
                    content_id_generator.generate(
                        translation_domain.ContentType.CONTENT)
                ),
                'content_id_for_default_outcome': (
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME)
                )
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'next_content_id_index',
                'new_value': content_id_generator.next_content_id_index,
                'old_value': 0
            })], 'Added a state')
        new_model = self.version_history_model_class.get(
            self.version_history_model_class.get_instance_id(self.EXP_0_ID, 3))

        self.assertIn(self.editor_id, new_model.committer_ids)


class LoggedOutUserProgressUpdateTests(test_utils.GenericTestBase):
    """Tests whether logged-out user progress is updated correctly"""

    EXP_ID: Final = 'exp_id0'
    UNIQUE_PROGRESS_URL_ID: Final = 'pid123'

    SAMPLE_EXPLORATION_YAML: str = (
"""
author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 47
states:
  Introduction:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: New state
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
        catchMisspellings:
          value: false
      default_outcome:
        dest: Introduction
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
      - hint_content:
          content_id: hint_1
          html: <p>hint one,</p>
      id: TextInput
      solution:
        answer_is_exclusive: false
        correct_answer: helloworld!
        explanation:
          content_id: solution
          html: <p>hello_world is a string</p>
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: introduction_state.mp3
            needs_update: false
        default_outcome:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: unknown_answer_feedback.mp3
            needs_update: false
        feedback_1:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: correct_answer_feedback.mp3
            needs_update: false
        hint_1:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: answer_hint.mp3
            needs_update: false
        rule_input_3: {}
        solution:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: answer_solution.mp3
            needs_update: false
    solicit_answer_details: false
    card_is_checkpoint: true
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        hint_1: {}
        rule_input_3: {}
        solution: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
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
      id: null
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    card_is_checkpoint: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 42
tags: []
title: Title
""")

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_EXPLORATION_YAML, self.EXP_ID, [])
        self.exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

    def test_logged_out_user_checkpoint_progress_is_updated_correctly(
        self
    ) -> None:
        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID
        )
        self.assertIsNone(logged_out_user_data)

        # First checkpoint reached.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'Introduction', 1)
        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_state_name,
            'Introduction')
        self.assertEqual(
            logged_out_user_data.
                most_recently_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            logged_out_user_data.
                most_recently_reached_checkpoint_state_name, 'Introduction')

        # Make 'New state' a checkpoint.
        # Now version of the exploration becomes 2.
        change_list = _get_change_list(
            'New state',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            True)
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, change_list, '')

        # Second checkpoint reached.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'New state', 2)
        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_exp_version, 2)
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_state_name,
            'New state')
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_exp_version,
            2)
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_state_name,
            'New state')

        # Unmark 'New state' as a checkpoint.
        # Now version of the exploration becomes 3.
        change_list = _get_change_list(
            'New state',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            False)
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, change_list, '')

        # First checkpoint reached again.
        # Since the previously furthest reached checkpoint 'New state' doesn't
        # exist in the current exploration, the first checkpoint behind
        # 'New state' that exists in current exploration ('Introduction'
        # state in this case) becomes the new furthest reached checkpoint.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'Introduction', 3)
        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_exp_version, 3)
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_state_name,
            'Introduction')
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_exp_version,
            3)
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_state_name,
            'Introduction')

        # Change state name of 'Introduction' state.
        # Now version of exploration becomes 4.
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Introduction',
                'new_state_name': 'Intro',
            })], 'Change state name'
        )

        # First checkpoint reached again.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'Intro', 4)
        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_exp_version, 4)
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_state_name,
            'Intro')
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_exp_version,
            4)
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_state_name,
            'Intro')

    def test_sync_logged_out_learner_checkpoint_progress_with_current_exp_version(  # pylint: disable=line-too-long
        self
    ) -> None:
        logged_out_user_data = (
            exp_services.sync_logged_out_learner_checkpoint_progress_with_current_exp_version( # pylint: disable=line-too-long
                self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID))
        self.assertIsNone(logged_out_user_data)

        # First checkpoint reached.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'Introduction', 1)
        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_state_name,
            'Introduction')
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_exp_version,
            1)
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_state_name,
            'Introduction')

        # Change state name of 'Introduction' state.
        # Now version of exploration becomes 2.
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': 'Introduction',
                'new_state_name': 'Intro',
            })], 'Change state name'
        )

        # This method is called when exploration data is fetched since now
        # latest exploration version > most recently interacted exploration
        # version.
        # Working - First the furthest reached checkpoint ('Introduction' in
        # this case) is searched in current exploration. It will not be found
        # since its state name is changed to 'Intro'. It will then search for
        # an checkpoint that had been reached in older exploration and also
        # exists in current exploration. If such checkpoint is not found,
        # furthest reached checkpoint is set to None. Similar workflow is
        # carried out for most recently reached checkpoint.
        logged_out_user_data = (
            exp_services.sync_logged_out_learner_checkpoint_progress_with_current_exp_version( # pylint: disable=line-too-long
                self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_exp_version, 2)
        self.assertIsNone(
            logged_out_user_data.furthest_reached_checkpoint_state_name)
        self.assertEqual(
            logged_out_user_data.most_recently_reached_checkpoint_exp_version,
            2)
        self.assertIsNone(
            logged_out_user_data.most_recently_reached_checkpoint_state_name)


class SyncLoggedInAndLoggedOutProgressTests(test_utils.GenericTestBase):
    """Tests whether logged-in user progress is synced correctly"""

    EXP_ID: Final = 'exp_id0'
    UNIQUE_PROGRESS_URL_ID: Final = 'pid123'

    SAMPLE_EXPLORATION_YAML: str = (
"""
author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: 47
states:
  Introduction:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups:
      - outcome:
          dest: New state
          feedback:
            content_id: feedback_1
            html: <p>Correct!</p>
          labelled_as_correct: false
          missing_prerequisite_skill_id: null
          param_changes: []
          refresher_exploration_id: null
        rule_specs:
        - inputs:
            x:
              contentId: rule_input_3
              normalizedStrSet:
              - InputString
          rule_type: Equals
        tagged_skill_misconception_id: null
        training_data: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_2
            unicode_str: ''
        rows:
          value: 1
        catchMisspellings:
          value: false
      default_outcome:
        dest: Introduction
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints:
      - hint_content:
          content_id: hint_1
          html: <p>hint one,</p>
      id: TextInput
      solution:
        answer_is_exclusive: false
        correct_answer: helloworld!
        explanation:
          content_id: solution
          html: <p>hello_world is a string</p>
    linked_skill_id: null
    next_content_id_index: 4
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_2: {}
        content:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: introduction_state.mp3
            needs_update: false
        default_outcome:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: unknown_answer_feedback.mp3
            needs_update: false
        feedback_1:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: correct_answer_feedback.mp3
            needs_update: false
        hint_1:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: answer_hint.mp3
            needs_update: false
        rule_input_3: {}
        solution:
          en:
            duration_secs: 0.0
            file_size_bytes: 99999
            filename: answer_solution.mp3
            needs_update: false
    solicit_answer_details: false
    card_is_checkpoint: true
    written_translations:
      translations_mapping:
        ca_placeholder_2: {}
        content: {}
        default_outcome: {}
        feedback_1: {}
        hint_1: {}
        rule_input_3: {}
        solution: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: Third state
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    card_is_checkpoint: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
  Third state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: Third state
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    linked_skill_id: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    card_is_checkpoint: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: 42
tags: []
title: Title
""")

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        exp_services.save_new_exploration_from_yaml_and_assets(
            self.owner_id, self.SAMPLE_EXPLORATION_YAML, self.EXP_ID, [])
        self.exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID)

    def test_logged_in_user_progress_is_updated_correctly(self) -> None:
        self.login(self.VIEWER_EMAIL)
        exp_user_data = exp_fetchers.get_exploration_user_data(
            self.viewer_id, self.EXP_ID)
        self.assertIsNone(exp_user_data)

        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID
        )
        self.assertIsNone(logged_out_user_data)

        # No sync occurs if there is no logged-out user data or if the data
        # has been cleared by the cron job.
        exp_services.sync_logged_out_learner_progress_with_logged_in_progress(
            self.viewer_id, self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID
        )
        exp_user_data = exp_fetchers.get_exploration_user_data(
            self.viewer_id, self.EXP_ID)
        self.assertIsNone(exp_user_data)

        # First checkpoint reached as logged out user.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'Introduction', 1)

        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            logged_out_user_data.furthest_reached_checkpoint_state_name,
            'Introduction')
        self.assertEqual(
            logged_out_user_data.
                most_recently_reached_checkpoint_exp_version, 1)
        self.assertEqual(
            logged_out_user_data.
                most_recently_reached_checkpoint_state_name, 'Introduction')

        exp_services.sync_logged_out_learner_progress_with_logged_in_progress(
            self.viewer_id, self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID
        )

        exp_user_data = exp_fetchers.get_exploration_user_data(
            self.viewer_id, self.EXP_ID)
        self.assertIsNotNone(exp_user_data)

        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        assert logged_out_user_data is not None

        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version,
            logged_out_user_data.most_recently_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            logged_out_user_data.most_recently_reached_checkpoint_state_name
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version,
            logged_out_user_data.furthest_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name,
            logged_out_user_data.furthest_reached_checkpoint_state_name
        )

        # Mark 'New state' as a checkpoint.
        # Now version of the exploration becomes 2.
        change_list = _get_change_list(
            'New state',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            True)
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, change_list, '')

        # New second checkpoint reached as logged out user.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'New state', 2)

        exp_services.sync_logged_out_learner_progress_with_logged_in_progress(
            self.viewer_id, self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID
        )

        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)

        exp_user_data = exp_fetchers.get_exploration_user_data(
            self.viewer_id, self.EXP_ID)

        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        assert logged_out_user_data is not None

        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version,
            logged_out_user_data.most_recently_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            logged_out_user_data.most_recently_reached_checkpoint_state_name
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version,
            logged_out_user_data.furthest_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name,
            logged_out_user_data.furthest_reached_checkpoint_state_name
        )

        # Mark 'Third state' as a checkpoint.
        # Now version of the exploration becomes 3.
        change_list = _get_change_list(
            'Third state',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            True)
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, change_list, '')

        # Unmark 'Next state' as a checkpoint.
        # Now version of the exploration becomes 4.
        change_list = _get_change_list(
            'New state',
            exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
            False)
        exp_services.update_exploration(
            self.owner_id, self.EXP_ID, change_list, '')

        # New third checkpoint reached as logged out user.
        exp_services.update_logged_out_user_progress(
            self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID, 'Third state', 4)

        exp_services.sync_logged_out_learner_progress_with_logged_in_progress(
            self.viewer_id, self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID
        )

        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)

        exp_user_data = exp_fetchers.get_exploration_user_data(
            self.viewer_id, self.EXP_ID)

        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        assert logged_out_user_data is not None

        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version,
            logged_out_user_data.most_recently_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            logged_out_user_data.most_recently_reached_checkpoint_state_name
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version,
            logged_out_user_data.furthest_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name,
            logged_out_user_data.furthest_reached_checkpoint_state_name
        )

        # Changing logged-in most recently reached state.
        user_services.update_learner_checkpoint_progress(
            self.viewer_id,
            self.EXP_ID,
            'Introduction',
            4
        )

        exp_services.sync_logged_out_learner_progress_with_logged_in_progress(
            self.viewer_id, self.EXP_ID, self.UNIQUE_PROGRESS_URL_ID
        )

        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)

        exp_user_data = exp_fetchers.get_exploration_user_data(
            self.viewer_id, self.EXP_ID)

        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        assert logged_out_user_data is not None

        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_exp_version,
            logged_out_user_data.most_recently_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.most_recently_reached_checkpoint_state_name,
            logged_out_user_data.most_recently_reached_checkpoint_state_name
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_exp_version,
            logged_out_user_data.furthest_reached_checkpoint_exp_version
        )
        self.assertEqual(
            exp_user_data.furthest_reached_checkpoint_state_name,
            logged_out_user_data.furthest_reached_checkpoint_state_name
        )

        self.logout()


class RegenerateMissingExpStatsUnitTests(test_utils.GenericTestBase):
    """Test apply draft functions in exp_services."""

    def test_when_exp_and_state_stats_models_exist(self) -> None:
        self.save_new_default_exploration('ID', 'owner_id')

        self.assertEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID'), (
                [], [], 1, 1))

    def test_fail_to_fetch_exploration_snapshots(self) -> None:
        observed_log_messages = []
        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)
        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        self.save_new_default_exploration('ID', 'owner_id')
        exp_snapshot_id = exp_models.ExplorationModel.get_snapshot_id('ID', 1)
        exp_snapshot = exp_models.ExplorationSnapshotMetadataModel.get_by_id(
            exp_snapshot_id)
        exp_snapshot.commit_cmds[0] = {}
        exp_snapshot.update_timestamps()
        exp_models.ExplorationSnapshotMetadataModel.put(exp_snapshot)

        with logging_swap:
            exp_services.regenerate_missing_stats_for_exploration('ID')
        self.assertEqual(
            observed_log_messages,
            [
                'Exploration(id=\'ID\') snapshots contains invalid '
                'commit_cmd: {}'
            ]
        )

    def test_handle_state_name_is_not_found_in_state_stats_mapping(
        self
    ) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_stats_list = (
            stats_services.get_multiple_exploration_stats_by_version(
                exp_id, [1, 2, 3]))
        assert exp_stats_list[0] is not None
        exp_stats_list[0].state_stats_mapping['new'] = (
            exp_stats_list[0].state_stats_mapping['Introduction'])
        del exp_stats_list[0].state_stats_mapping['Introduction']
        stats_services.save_stats_model(exp_stats_list[0])
        exp_stats_model_to_delete = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 3)
        )
        assert exp_stats_model_to_delete is not None
        exp_stats_model_to_delete.delete()
        error_message = (
            r'Exploration\(id=.*, exp_version=1\) has no State\(name=.*\)')
        with self.assertRaisesRegex(Exception, error_message):
            exp_services.regenerate_missing_stats_for_exploration(exp_id)

    def test_handle_missing_exp_stats_for_reverted_exp_version(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.revert_exploration(owner_id, exp_id, 5, 4)
        exp_stats_model_to_delete = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 6)
        )
        assert exp_stats_model_to_delete is not None
        exp_stats_model_to_delete.delete()

        self.assertItemsEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID1'),
            (
                [
                    'ExplorationStats(exp_id=\'ID1\', exp_version=6)',
                ], [], 5, 6
            )
        )

    def test_handle_missing_state_stats_for_reverted_exp_version(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.revert_exploration(owner_id, exp_id, 5, 4)
        exp_stats = stats_services.get_exploration_stats_by_id(exp_id, 6)
        assert exp_stats is not None
        exp_stats.state_stats_mapping = {}
        stats_services.save_stats_model(exp_stats)

        self.assertItemsEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID1'),
            (
                [], [
                    'StateStats(exp_id=\'ID1\', exp_version=6, '
                    'state_name=\'Introduction\')'
                ], 5, 6
            )
        )

    def test_when_few_exp_stats_models_are_missing(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 5'
            })], 'Changed title.')

        exp_stats_model_for_version_2 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 2)
        )
        exp_stats_model_for_version_4 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 4)
        )
        assert exp_stats_model_for_version_2 is not None
        assert exp_stats_model_for_version_4 is not None
        exp_stats_model_for_version_2.delete()
        exp_stats_model_for_version_4.delete()

        self.assertItemsEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID1'),
            (
                [
                    'ExplorationStats(exp_id=\'ID1\', exp_version=2)',
                    'ExplorationStats(exp_id=\'ID1\', exp_version=4)'
                ], [], 4, 6
            )
        )

    def test_when_v1_version_exp_stats_model_is_missing(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 5'
            })], 'Changed title.')
        exp_stats_model_for_version_1 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 1)
        )
        assert exp_stats_model_for_version_1 is not None
        exp_stats_model_for_version_1.delete()

        exp_stats_model_for_version_2 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 2)
        )
        assert exp_stats_model_for_version_2 is not None
        exp_stats_model_for_version_2.delete()

        exp_stats_model_for_version_3 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 3)
        )
        assert exp_stats_model_for_version_3 is not None
        exp_stats_model_for_version_3.delete()

        self.assertItemsEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID1'),
            (
                [
                    'ExplorationStats(exp_id=\'ID1\', exp_version=1)',
                    'ExplorationStats(exp_id=\'ID1\', exp_version=2)',
                    'ExplorationStats(exp_id=\'ID1\', exp_version=3)'
                ], [], 3, 6
            )
        )

    def test_generate_exp_stats_when_revert_commit_is_present(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.revert_exploration(owner_id, exp_id, 5, 3)

        exp_stats_model_for_version_1 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 1)
        )
        assert exp_stats_model_for_version_1 is not None
        exp_stats_model_for_version_1.delete()

        exp_stats_model_for_version_2 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 2)
        )
        assert exp_stats_model_for_version_2 is not None
        exp_stats_model_for_version_2.delete()

        self.assertItemsEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID1'),
            (
                [
                    'ExplorationStats(exp_id=\'ID1\', exp_version=1)',
                    'ExplorationStats(exp_id=\'ID1\', exp_version=2)'
                ], [], 4, 6
            )
        )

    def test_when_all_exp_stats_models_are_missing(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, owner_id)
        exp_stats_model_for_version_1 = (
            stats_models.ExplorationStatsModel.get_model(exp_id, 1)
        )
        assert exp_stats_model_for_version_1 is not None
        exp_stats_model_for_version_1.delete()

        with self.assertRaisesRegex(
            Exception, 'No ExplorationStatsModels found'):
            exp_services.regenerate_missing_stats_for_exploration('ID1')

    def test_when_few_state_stats_models_are_missing(self) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_default_exploration(exp_id, 'owner_id')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 1'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 5'
            })], 'Changed title.')
        exp_stats = stats_services.get_exploration_stats_by_id(exp_id, 2)
        assert exp_stats is not None
        exp_stats.state_stats_mapping = {}
        stats_services.save_stats_model(exp_stats)

        self.assertItemsEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID1'),
            (
                [],
                [
                    'StateStats(exp_id=\'ID1\', exp_version=2, '
                    'state_name=\'Introduction\')'
                ], 6, 5
            )
        )

    def test_when_few_state_stats_models_are_missing_for_old_exps(
        self
    ) -> None:
        exp_id = 'ID1'
        owner_id = 'owner_id'
        self.save_new_valid_exploration(
            exp_id, owner_id, title='title', category='Category 1',
            end_state_name='END')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 2'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 3'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 4'
            })], 'Changed title.')
        exp_services.update_exploration(
            owner_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'New title 5'
            })], 'Changed title.')
        exp_stats = stats_services.get_exploration_stats_by_id(exp_id, 2)
        assert exp_stats is not None
        exp_stats.state_stats_mapping = {}
        stats_services.save_stats_model(exp_stats)

        self.assertItemsEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID1'),
            (
                [],
                [
                    'StateStats(exp_id=\'ID1\', exp_version=2, '
                    'state_name=\'Introduction\')',
                    'StateStats(exp_id=\'ID1\', exp_version=2, '
                    'state_name=\'END\')',
                ], 8, 5
            )
        )
