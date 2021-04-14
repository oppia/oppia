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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import caching_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class ExplorationRetrievalTests(test_utils.GenericTestBase):
    """Test the exploration retrieval methods."""

    EXP_1_ID = 'exploration_1_id'
    EXP_2_ID = 'exploration_2_id'
    EXP_3_ID = 'exploration_3_id'

    def setUp(self):
        super(ExplorationRetrievalTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exploration_1 = self.save_new_default_exploration(
            self.EXP_1_ID, self.owner_id, title='Aa')
        self.exploration_2 = self.save_new_default_exploration(
            self.EXP_2_ID, self.owner_id, title='Bb')
        self.exploration_3 = self.save_new_default_exploration(
            self.EXP_3_ID, self.owner_id, title='Cc')

    def test_get_exploration_summaries_matching_ids(self):
        summaries = exp_fetchers.get_exploration_summaries_matching_ids([
            self.EXP_1_ID, self.EXP_2_ID, self.EXP_3_ID, 'nonexistent'])
        self.assertEqual(summaries[0].title, self.exploration_1.title)
        self.assertEqual(summaries[1].title, self.exploration_2.title)
        self.assertEqual(summaries[2].title, self.exploration_3.title)
        self.assertIsNone(summaries[3])

    def test_get_exploration_summaries_subscribed_to(self):
        summaries = exp_fetchers.get_exploration_summaries_subscribed_to(
            self.owner_id)
        self.assertEqual(summaries[0].title, self.exploration_1.title)
        self.assertEqual(summaries[1].title, self.exploration_2.title)
        self.assertEqual(summaries[2].title, self.exploration_3.title)

    def test_retrieval_of_explorations(self):
        """Test the get_exploration_by_id() method."""
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id('fake_eid')

        retrieved_exploration = (
            exp_fetchers.get_exploration_by_id(self.EXP_1_ID))
        self.assertEqual(self.exploration_1.id, retrieved_exploration.id)
        self.assertEqual(self.exploration_1.title, retrieved_exploration.title)

        with self.assertRaisesRegexp(
            Exception,
            'Entity for class ExplorationModel with id fake_exploration'
            ' not found'):
            exp_fetchers.get_exploration_by_id('fake_exploration')

    def test_retrieval_of_multiple_exploration_versions_for_fake_exp_id(self):
        with self.assertRaisesRegexp(
            ValueError, 'The given entity_id fake_exp_id is invalid'):
            (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    'fake_exp_id', [1, 2, 3]))

    def test_retrieval_of_multiple_exploration_versions(self):
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
                self.EXP_1_ID, list(python_utils.RANGE(1, latest_version + 1)))
        )

        self.assertEqual(len(explorations), 3)
        self.assertEqual(explorations[0].version, 1)
        self.assertEqual(explorations[1].version, 2)
        self.assertEqual(explorations[2].version, 3)

    def test_version_number_errors_for_get_multiple_exploration_versions(self):
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

        with self.assertRaisesRegexp(
            ValueError,
            'Requested version number 4 cannot be higher than the current '
            'version number 3.'):
            (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    self.EXP_1_ID, [1, 2, 3, 4]))

        with self.assertRaisesRegexp(
            ValueError,
            'At least one version number is invalid'):
            (
                exp_fetchers
                .get_multiple_versioned_exp_interaction_ids_mapping_by_version(
                    self.EXP_1_ID, [1, 2, 2.5, 3]))

    def test_retrieval_of_multiple_explorations(self):
        exps = {}
        chars = 'abcde'
        exp_ids = ['%s%s' % (self.EXP_1_ID, c) for c in chars]
        for _id in exp_ids:
            exp = self.save_new_valid_exploration(_id, self.owner_id)
            exps[_id] = exp

        result = exp_fetchers.get_multiple_explorations_by_id(
            exp_ids)
        for _id in exp_ids:
            self.assertEqual(result.get(_id).title, exps.get(_id).title)

        # Test retrieval of non-existent ids.
        result = exp_fetchers.get_multiple_explorations_by_id(
            exp_ids + ['doesnt_exist'], strict=False
        )
        for _id in exp_ids:
            self.assertEqual(result.get(_id).title, exps.get(_id).title)

        self.assertNotIn('doesnt_exist', result)

        with self.assertRaisesRegexp(
            Exception,
            'Couldn\'t find explorations with the following ids:\n'
            'doesnt_exist'):
            exp_fetchers.get_multiple_explorations_by_id(
                exp_ids + ['doesnt_exist'])


class ExplorationConversionPipelineTests(test_utils.GenericTestBase):
    """Tests the exploration model -> exploration conversion pipeline."""

    OLD_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'

    UPGRADED_EXP_YAML = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: A category
correctness_feedback_enabled: false
init_state_name: Introduction
language_code: en
objective: An objective
param_changes: []
param_specs: {}
schema_version: %d
states:
  End:
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
    python_utils.convert_to_bytes(feconf.DEFAULT_INIT_STATE_NAME),
    feconf.CURRENT_STATE_SCHEMA_VERSION)

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    def setUp(self):
        super(ExplorationConversionPipelineTests, self).setUp()

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

    def test_converts_exp_model_with_default_states_schema_version(self):
        exploration = exp_fetchers.get_exploration_by_id(self.OLD_EXP_ID)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(exploration.to_yaml(), self.UPGRADED_EXP_YAML)

    def test_does_not_convert_up_to_date_exploration(self):
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(exploration.to_yaml(), self._up_to_date_yaml)
