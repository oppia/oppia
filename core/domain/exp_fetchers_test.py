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

"""Unit tests for core.domain.exp_fetchers."""

from __future__ import annotations

from core import feconf
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


class ExplorationRetrievalTests(test_utils.GenericTestBase):
    """Test the exploration retrieval methods."""

    EXP_1_ID: Final = 'exploration_1_id'
    EXP_2_ID: Final = 'exploration_2_id'
    EXP_3_ID: Final = 'exploration_3_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exploration_1 = self.save_new_default_exploration(
            self.EXP_1_ID, self.owner_id, title='Aa')
        self.exploration_2 = self.save_new_default_exploration(
            self.EXP_2_ID, self.owner_id, title='Bb')
        self.exploration_3 = self.save_new_default_exploration(
            self.EXP_3_ID, self.owner_id, title='Cc')

    def test_get_exploration_summaries_matching_ids(self) -> None:
        summaries = exp_fetchers.get_exploration_summaries_matching_ids([
            self.EXP_1_ID, self.EXP_2_ID, self.EXP_3_ID, 'nonexistent'])
        # Here, we are Ruling out the possibility of None for individual
        # elements of the list. Because `summaries` is of List[Optional[...]]
        # type.
        assert summaries[0] is not None
        self.assertEqual(summaries[0].title, self.exploration_1.title)
        assert summaries[1] is not None
        self.assertEqual(summaries[1].title, self.exploration_2.title)
        assert summaries[2] is not None
        self.assertEqual(summaries[2].title, self.exploration_3.title)
        self.assertIsNone(summaries[3])

    def test_get_exploration_summaries_subscribed_to(self) -> None:
        summaries = exp_fetchers.get_exploration_summaries_subscribed_to(
            self.owner_id)
        self.assertEqual(summaries[0].title, self.exploration_1.title)
        self.assertEqual(summaries[1].title, self.exploration_2.title)
        self.assertEqual(summaries[2].title, self.exploration_3.title)

    def test_get_new_exploration_id(self) -> None:
        self.assertIsNotNone(
            exp_fetchers.get_new_exploration_id()
        )

    def test_get_new_unique_progress_url_id(self) -> None:
        self.assertIsNotNone(
            exp_fetchers.get_new_unique_progress_url_id()
        )

    def test_get_exploration_summary_by_id(self) -> None:
        fake_eid = 'fake_eid'
        fake_exp = exp_fetchers.get_exploration_summary_by_id(
            fake_eid, strict=False
        )
        self.assertIsNone(fake_exp)
        exp_summary = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_1_ID
        )
        self.assertIsNotNone(exp_summary)
        self.assertEqual(exp_summary.id, self.EXP_1_ID)

    def test_get_exploration_summaries_from_models(self) -> None:
        exp_ids = [self.EXP_1_ID, self.EXP_2_ID, self.EXP_3_ID]
        exp_summary_models = []
        exp_summary_models_with_none = exp_models.ExpSummaryModel.get_multi(
            exp_ids
        )
        for model in exp_summary_models_with_none:
            # Ruling out the possibility of None for mypy type checking.
            assert model is not None
            exp_summary_models.append(model)

        exp_summary_dict = (
            exp_fetchers.get_exploration_summaries_from_models(
                exp_summary_models
            )
        )
        for key in exp_summary_dict:
            self.assertIn(key, exp_ids)

    def test_retrieval_of_fake_exploration(self) -> None:
        self.assertIsNone(
            exp_fetchers.get_exploration_by_id('fake_eid', strict=False)
        )

    def test_get_exploration_summaries_where_user_has_role(self) -> None:
        exp_ids = [self.EXP_1_ID, self.EXP_2_ID, self.EXP_3_ID]
        exp_summaries = (
            exp_fetchers.get_exploration_summaries_where_user_has_role(
                self.owner_id
            ))
        self.assertEqual(len(exp_summaries), 3)
        for exp_summary in exp_summaries:
            self.assertIn(exp_summary.id, exp_ids)

    def test_retrieval_of_explorations(self) -> None:
        """Test the get_exploration_by_id() method."""
        with self.assertRaisesRegex(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id('fake_eid')

        retrieved_exploration = (
            exp_fetchers.get_exploration_by_id(self.EXP_1_ID))
        self.assertEqual(self.exploration_1.id, retrieved_exploration.id)
        self.assertEqual(self.exploration_1.title, retrieved_exploration.title)

        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationModel with id fake_exploration'
            ' not found'):
            exp_fetchers.get_exploration_by_id('fake_exploration')

    def test_retrieval_of_multiple_exploration_versions_for_fake_exp_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'The given entity_id fake_exp_id is invalid'):
            (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    'fake_exp_id', [1, 2, 3]))

    def test_retrieval_of_exp_versions_for_invalid_state_schema_version(
        self
    ) -> None:
        error_regex = (
            'Exploration\\(id=%s, version=%s, states_schema_version=%s\\) '
                'does not match the latest schema version %s' % (
                    self.EXP_1_ID,
                    '1',
                    '52',
                    '60'
                )
        )
        with self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 60):
            with self.assertRaisesRegex(Exception, error_regex):
                (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    self.EXP_1_ID, [1])
                )

    def test_retrieval_of_multiple_exploration_versions(self) -> None:
        # Update exploration to version 2.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
        })]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_1_ID, change_list, '')

        # Update exploration to version 3.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state 2',
        })]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_1_ID, change_list, '')

        exploration_latest = exp_fetchers.get_exploration_by_id(self.EXP_1_ID)
        latest_version = exploration_latest.version

        explorations = (
            exp_fetchers
            .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                self.EXP_1_ID, list(range(1, latest_version + 1)))
        )

        self.assertEqual(len(explorations), 3)
        self.assertEqual(explorations[0].version, 1)
        self.assertEqual(explorations[1].version, 2)
        self.assertEqual(explorations[2].version, 3)

    def test_version_number_errors_for_get_multiple_exploration_versions(
        self
    ) -> None:
        # Update exploration to version 2.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
        })]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_1_ID, change_list, '')

        # Update exploration to version 3.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state 2',
        })]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_1_ID, change_list, '')

        with self.assertRaisesRegex(
            ValueError,
            'Requested version number 4 cannot be higher than the current '
            'version number 3.'):
            (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    self.EXP_1_ID, [1, 2, 3, 4]))

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            ValueError,
            'At least one version number is invalid'):
            (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    self.EXP_1_ID, [1, 2, 2.5, 3]))  # type: ignore[list-item]

    def test_retrieval_of_multiple_uncached_explorations(self) -> None:
        exp_ids = [self.EXP_1_ID, self.EXP_2_ID, self.EXP_3_ID]
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None, exp_ids)
        uncached_explorations = exp_fetchers.get_multiple_explorations_by_id(
         exp_ids, False
        )
        self.assertEqual(len(uncached_explorations), 3)
        for key in uncached_explorations:
            self.assertIn(key, uncached_explorations)

    def test_retrieval_of_multiple_explorations(self) -> None:
        exps = {}
        chars = 'abcde'
        exp_ids = ['%s%s' % (self.EXP_1_ID, c) for c in chars]
        for _id in exp_ids:
            exp = self.save_new_valid_exploration(_id, self.owner_id)
            exps[_id] = exp

        result = exp_fetchers.get_multiple_explorations_by_id(
            exp_ids)
        for _id in exp_ids:
            self.assertEqual(result[_id].title, exps[_id].title)

        # Test retrieval of non-existent ids.
        result = exp_fetchers.get_multiple_explorations_by_id(
            exp_ids + ['doesnt_exist'], strict=False
        )
        for _id in exp_ids:
            self.assertEqual(result[_id].title, exps[_id].title)

        self.assertNotIn('doesnt_exist', result)

        with self.assertRaisesRegex(
            Exception,
            'Couldn\'t find explorations with the following ids:\n'
            'doesnt_exist'):
            exp_fetchers.get_multiple_explorations_by_id(
                exp_ids + ['doesnt_exist'])

    def test_exploration_user_data_is_none_before_starting_exploration(
        self
    ) -> None:
        auth_id = 'test_id'
        user_email = 'test@email.com'
        user_id = user_services.create_new_user(auth_id, user_email).user_id
        self.assertIsNone(exp_fetchers.get_exploration_user_data(
            user_id, self.EXP_1_ID))

    def test_get_exploration_user_data(self) -> None:
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'
        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        user_services.update_learner_checkpoint_progress(
            user_id, self.EXP_1_ID, 'Introduction', 1)
        expected_user_data_dict = {
            'rating': None,
            'rated_on': None,
            'draft_change_list': None,
            'draft_change_list_last_updated': None,
            'draft_change_list_exp_version': None,
            'draft_change_list_id': 0,
            'mute_suggestion_notifications': (
                feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
            'mute_feedback_notifications': (
                feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE),
            'furthest_reached_checkpoint_exp_version': 1,
            'furthest_reached_checkpoint_state_name': 'Introduction',
            'most_recently_reached_checkpoint_exp_version': 1,
            'most_recently_reached_checkpoint_state_name': 'Introduction'
        }
        exp_user_data = exp_fetchers.get_exploration_user_data(
            user_id, self.EXP_1_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_user_data is not None
        self.assertEqual(expected_user_data_dict, exp_user_data.to_dict())

    def test_get_exploration_version_history(self) -> None:
        version_history = exp_fetchers.get_exploration_version_history(
            self.EXP_1_ID, 2
        )

        self.assertIsNone(version_history)

        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'New state'
                })
            ], 'A commit message.'
        )
        version_history = exp_fetchers.get_exploration_version_history(
            self.EXP_1_ID, 2
        )

        self.assertIsNotNone(version_history)
        if version_history is not None:
            self.assertEqual(version_history.committer_ids, [self.owner_id])
            self.assertEqual(
                version_history.state_version_history['New state'].to_dict(),
                state_domain.StateVersionHistory(
                    None, None, self.owner_id
                ).to_dict()
            )


class LoggedOutUserProgressTests(test_utils.GenericTestBase):
    """Tests the fetching of the logged-out user progress."""

    UNIQUE_PROGRESS_URL_ID = 'pid123'
    EXP_1_ID = 'exploration_1_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exploration_1 = self.save_new_default_exploration(
            self.EXP_1_ID, self.owner_id, title='Aa')

    def test_get_logged_out_user_progress(self) -> None:

        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        self.assertIsNone(logged_out_user_data)

        exp_services.update_logged_out_user_progress(
            self.EXP_1_ID, self.UNIQUE_PROGRESS_URL_ID, 'Introduction', 1)

        expected_progress_dict = {
            'exploration_id': self.EXP_1_ID,
            'furthest_reached_checkpoint_state_name': 'Introduction',
            'furthest_reached_checkpoint_exp_version': 1,
            'most_recently_reached_checkpoint_state_name': 'Introduction',
            'most_recently_reached_checkpoint_exp_version': 1,
            'last_updated': None
        }
        logged_out_user_data = exp_fetchers.get_logged_out_user_progress(
            self.UNIQUE_PROGRESS_URL_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert logged_out_user_data is not None
        self.assertEqual(
            expected_progress_dict['exploration_id'],
            logged_out_user_data.exploration_id)
        self.assertEqual(
            expected_progress_dict['furthest_reached_checkpoint_state_name'],
            logged_out_user_data.furthest_reached_checkpoint_state_name)
        self.assertEqual(
            expected_progress_dict['furthest_reached_checkpoint_exp_version'],
            logged_out_user_data.furthest_reached_checkpoint_exp_version)
        self.assertEqual(
            expected_progress_dict['most_recently_reached_checkpoint_state_name'], # pylint: disable=line-too-long
            logged_out_user_data.most_recently_reached_checkpoint_state_name)
        self.assertEqual(
            expected_progress_dict['most_recently_reached_checkpoint_exp_version'], # pylint: disable=line-too-long
            logged_out_user_data.most_recently_reached_checkpoint_exp_version)


class ExplorationConversionPipelineTests(test_utils.GenericTestBase):
    """Tests the exploration model -> exploration conversion pipeline."""

    OLD_EXP_ID: Final = 'exp_id0'
    NEW_EXP_ID: Final = 'exp_id1'

    UPGRADED_EXP_YAML: Final = (
        """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: Algebra
correctness_feedback_enabled: false
edits_allowed: true
init_state_name: Introduction
language_code: en
objective: An objective
param_changes: []
param_specs: {}
schema_version: %d
states:
  End:
    card_is_checkpoint: false
    classifier_model_id: null
    content:
      content_id: content
      html: ''
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
    written_translations:
      translations_mapping:
        content: {}
  %s:
    card_is_checkpoint: true
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args:
        placeholder:
          value:
            content_id: ca_placeholder_0
            unicode_str: ''
        rows:
          value: 1
      default_outcome:
        dest: End
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
    next_content_id_index: 1
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        ca_placeholder_0: {}
        content: {}
        default_outcome: {}
states_schema_version: %d
tags: []
title: Old Title
""") % (
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_STATE_SCHEMA_VERSION)

    ALBERT_EMAIL: Final = 'albert@example.com'
    ALBERT_NAME: Final = 'albert'

    def setUp(self) -> None:
        super().setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)

        # Create exploration that uses an old states schema version and ensure
        # it is properly converted.
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            self.save_new_valid_exploration(
                self.OLD_EXP_ID, self.albert_id, title='Old Title',
                end_state_name='End')

        # Create standard exploration that should not be converted.
        new_exp = self.save_new_valid_exploration(
            self.NEW_EXP_ID, self.albert_id)
        self._up_to_date_yaml = new_exp.to_yaml()

        # Clear the cache to prevent fetches of old data under the previous
        # state schema version scheme.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [self.OLD_EXP_ID, self.NEW_EXP_ID])

    def test_converts_exp_model_with_default_states_schema_version(
        self
    ) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.OLD_EXP_ID)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(exploration.to_yaml(), self.UPGRADED_EXP_YAML)

    def test_does_not_convert_up_to_date_exploration(self) -> None:
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(exploration.to_yaml(), self._up_to_date_yaml)

    def test_migration_with_invalid_state_schema(self) -> None:
        self.save_new_valid_exploration('fake_eid', self.albert_id)
        swap_earlier_state_to_60 = (
            self.swap(feconf, 'EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION', 60)
        )
        swap_current_state_61 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 61)
        with swap_earlier_state_to_60, swap_current_state_61:
            exploration_model = exp_models.ExplorationModel.get(
            'fake_eid', strict=True, version=None)
            error_regex = (
            'Sorry, we can only process v%d\\-v%d exploration state schemas at '
            'present.' % (
            feconf.EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
            )
            with self.assertRaisesRegex(Exception, error_regex):
                exp_fetchers.get_exploration_from_model(exploration_model)

    def test_migration_then_reversion_maintains_valid_exploration(self) -> None:
        """This integration test simulates the behavior of the domain layer
        prior to the introduction of a states schema. In particular, it deals
        with an exploration that was created before any states schema
        migrations occur. The exploration is constructed using multiple change
        lists, then a migration is run. The test thereafter tests if
        reverting to a version prior to the migration still maintains a valid
        exploration. It tests both the exploration domain object and the
        exploration model stored in the datastore for validity.
        Note: It is important to distinguish between when the test is testing
        the exploration domain versus its model. It is operating at the domain
        layer when using exp_fetchers.get_exploration_by_id. Otherwise, it
        loads the model explicitly using exp_models.ExplorationModel.get and
        then converts it to an exploration domain object for validation using
        exp_fetchers.get_exploration_from_model. This is NOT the same process
        as exp_fetchers.get_exploration_by_id as it skips many steps which
        include the conversion pipeline (which is crucial to this test).
        """
        exp_id: str = 'exp_id2'
        end_state_name: str = 'End'

        # Create an exploration with an old states schema version.
        swap_states_schema_41 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)
        swap_exp_schema_46 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 46)
        with swap_states_schema_41, swap_exp_schema_46:
            self.save_new_valid_exploration(
                exp_id, self.albert_id, title='Old Title',
                end_state_name=end_state_name)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None,
            [exp_id])

        # Load the exploration without using the conversion pipeline. All of
        # these changes are to happen on an exploration with states schema
        # version 41.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)

        # In version 1, the title was 'Old title'.
        # In version 2, the title becomes 'New title'.
        exploration_model.title = 'New title'
        exploration_model.commit(self.albert_id, 'Changed title.', [])

        # Version 2 of exploration.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)

        # Store state id mapping model for new exploration.
        exp_fetchers.get_exploration_from_model(exploration_model)

        # In version 3, a new state is added.
        exploration_model.states['New state'] = {
            'solicit_answer_details': False,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_0': {},
                }
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_0': {},
                }
            },
            'param_changes': [],
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': '<p>Unicode Characters 😍😍😍😍</p>'
            },
            'next_content_id_index': 5,
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'buttonText': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': 'Click me!',
                        },
                    },
                },
                'default_outcome': {
                    'dest': end_state_name,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': '',
                    },
                    'labelled_as_correct': False,
                    'missing_prerequisite_skill_id': None,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                },
                'hints': [],
                'id': 'Continue',
                'solution': None,
            },
        }

        # Properly link in the new state to avoid an invalid exploration.
        init_state = exploration_model.states[feconf.DEFAULT_INIT_STATE_NAME]
        init_state['interaction']['default_outcome']['dest'] = 'New state'

        exploration_model.commit('committer_id_v3', 'Added new state', [])

        # Version 3 of exploration.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)

        # Version 4 is an upgrade based on the migration job.
        commit_cmds = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
            'from_version': str(exploration_model.states_schema_version),
            'to_version': str(feconf.CURRENT_STATE_SCHEMA_VERSION)
        })]
        exp_services.update_exploration(
            feconf.MIGRATION_BOT_USERNAME, exploration_model.id, commit_cmds,
            'Update exploration states from schema version %d to %d.' % (
                exploration_model.states_schema_version,
                feconf.CURRENT_STATE_SCHEMA_VERSION))

        # Verify the latest version of the exploration has the most up-to-date
        # states schema version.
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)
        exploration = exp_fetchers.get_exploration_from_model(
            exploration_model, run_conversion=False)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # The exploration should be valid after conversion.
        exploration.validate(strict=True)

        # Version 5 is a reversion to version 1.
        exp_services.revert_exploration('committer_id_v4', exp_id, 4, 1)

        # The exploration model itself should now be the old version
        # (pre-migration).
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)
        self.assertEqual(exploration_model.states_schema_version, 41)

        # The exploration domain object should be updated since it ran through
        # the conversion pipeline.
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        # The reversion after migration should still be an up-to-date
        # exploration. exp_fetchers.get_exploration_by_id will automatically
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
                'Update exploration states from schema version 41 to %d.' %
                feconf.CURRENT_STATE_SCHEMA_VERSION,
            'commit_cmds': [{
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': '41',
                'to_version': str(feconf.CURRENT_STATE_SCHEMA_VERSION)
            }],
            'version_number': 4,
        }

        # Ensure there have been 5 commits.
        self.assertEqual(len(snapshots_metadata), 5)

        # Ensure the correct commit logs were entered during both migration and
        # reversion. Also, ensure the correct commit command was written during
        # migration.
        # These asserts check whether one dict is subset of the other.
        # The format is assertDictEqual(a, {**a, **b}) where a is the superset
        # and b is the subset.
        self.assertDictEqual(
            snapshots_metadata[3], {**snapshots_metadata[3], **commit_dict_4})
        self.assertDictEqual(
            snapshots_metadata[4], {**snapshots_metadata[4], **commit_dict_5})
        self.assertLess(
            snapshots_metadata[3]['created_on_ms'],
            snapshots_metadata[4]['created_on_ms'])

        # Ensure that if a converted, then reverted, then converted exploration
        # is saved, it will be the up-to-date version within the datastore.
        exp_services.update_exploration(
            self.albert_id, exp_id, [], 'Resave after reversion')
        exploration_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=None)
        exploration = exp_fetchers.get_exploration_from_model(
            exploration_model, run_conversion=False)

        # This exploration should be both up-to-date and valid.
        self.assertEqual(exploration.to_yaml(), self.UPGRADED_EXP_YAML)
        exploration.validate()
