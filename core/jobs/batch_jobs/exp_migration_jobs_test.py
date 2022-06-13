# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.exp_migration_jobs."""

from __future__ import annotations

import datetime

from core import feconf, schema_utils
from core.domain import exp_domain, exp_services, exp_fetchers, rights_manager, caching_services, interaction_registry
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class MigrateExplorationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = exp_migration_jobs.MigrateExplorationJob

    NEW_EXP_ID = 'exp_1'
    EXP_TITLE = 'title'

    def setUp(self):
        super().setUp()

    def create_exploration_with_states_schema_version(
            self, states_schema_version, exp_id, user_id, states_dict):
        """Saves a new default exploration with the given states dictionary in
        the given state schema version. All passed state dictionaries in
        'states_dict' must have the states schema version indicated by
        'states_schema_version'.
        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating explorations. This is
        because the latter approach would result in an exploration with the
        *current* states schema version.
        Args:
            states_schema_version: int. The state schema version.
            exp_id: str. The exploration ID.
            user_id: str. The user_id of the creator.
            states_dict: dict. The dict representation of all the states, in the
                given states schema version.
        """
        exp_model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title='title',
            objective='Old objective',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=states_schema_version,
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states=states_dict,
            param_specs={},
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights(exp_id, user_id)

        commit_message = 'New exploration created with title \'title\'.'
        exp_model.commit(
            user_id, commit_message, [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])
        exp_rights = exp_models.ExplorationRightsModel.get_by_id(exp_id)
        exp_summary_model = exp_models.ExpSummaryModel(
            id=exp_id,
            title='title',
            category='category',
            objective='Old objective',
            language_code='en',
            tags=[],
            ratings=feconf.get_empty_ratings(),
            scaled_average_rating=feconf.EMPTY_SCALED_AVERAGE_RATING,
            status=exp_rights.status,
            community_owned=exp_rights.community_owned,
            owner_ids=exp_rights.owner_ids,
            contributor_ids=[],
            contributors_summary={},
        )
        exp_summary_model.put()

        return exp_model, exp_summary_model

    def set_interaction_for_state(self, state, interaction_id):
        """Sets the interaction_id, sets the fully populated default interaction
        customization arguments, and increments next_content_id_index as needed.
        Args:
            state: State. The state domain object to set the interaction for.
            interaction_id: str. The interaction id to set. Also sets the
                default customization args for the given interaction id.
        """
        # We wrap next_content_id_index in a dict so that modifying it in the
        # inner function modifies the value.
        next_content_id_index_dict = {'value': state.next_content_id_index}

        def traverse_schema_and_assign_content_ids(value, schema, contentId):
            """Generates content_id from recursively traversing the schema, and
            assigning to the current value.
            Args:
                value: *. The current traversed value in customization
                    arguments.
                schema: dict. The current traversed schema.
                contentId: str. The content_id generated so far.
            """
            is_subtitled_html_spec = (
                    schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                    schema['obj_type'] ==
                    schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML)
            is_subtitled_unicode_spec = (
                    schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                    schema['obj_type'] ==
                    schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE)

            if is_subtitled_html_spec or is_subtitled_unicode_spec:
                value['content_id'] = '%s_%i' % (
                    contentId, next_content_id_index_dict['value'])
                next_content_id_index_dict['value'] += 1
            elif schema['type'] == schema_utils.SCHEMA_TYPE_LIST:
                for x in value:
                    traverse_schema_and_assign_content_ids(
                        x, schema['items'], contentId)
            elif schema['type'] == schema_utils.SCHEMA_TYPE_DICT:
                for schema_property in schema['properties']:
                    traverse_schema_and_assign_content_ids(
                        x[schema_property.name],
                        schema_property['schema'],
                        '%s_%s' % (contentId, schema_property.name))

        interaction = (
            interaction_registry.Registry.get_interaction_by_id(interaction_id))
        ca_specs = interaction.customization_arg_specs
        customization_args = {}

        for ca_spec in ca_specs:
            ca_name = ca_spec.name
            ca_value = ca_spec.default_value
            traverse_schema_and_assign_content_ids(
                ca_value, ca_spec.schema, 'ca_%s' % ca_name)
            customization_args[ca_name] = {'value': ca_value}

        state.update_interaction_id(interaction_id)
        state.update_interaction_customization_args(customization_args)
        state.update_next_content_id_index(next_content_id_index_dict['value'])


    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrated_exp_is_not_migrated(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
        init_state = exploration.states[exploration.init_state_name]
        self.set_interaction_for_state(init_state, 'EndExploration')
        init_state.update_interaction_default_outcome(None)
        exp_services.save_new_exploration(feconf.SYSTEM_COMMITTER_ID, exploration)

        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1')
        ])

        exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(exp_model.version, 1)
        exp_services.delete_exploration(feconf.SYSTEM_COMMITTER_ID, exp_model.id)

    def test_broken_cache_is_reported(self) -> None:
        cache_swap = self.swap_to_always_raise(
            caching_services, 'delete_multi', Exception('cache deletion error')
        )

        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
            exp_services.save_new_exploration(feconf.SYSTEM_COMMITTER_ID, exploration)

            self.assertEqual(exploration.states_schema_version, 48)

        with cache_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='CACHE DELETION ERROR: "cache deletion error": 1'),
                job_run_result.JobRunResult(stdout="EXP MIGRATED SUCCESS: 1", stderr="")
            ])

        migrated_exp_model = exp_models.ExplorationModel.get(self.NEW_EXP_ID)
        self.assertEqual(migrated_exp_model.states_schema_version, feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_unmigrated_exp_is_migrated(self) -> None:
        swap_states_schema_48 = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 48)
        swap_exp_schema_53 = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 53)

        with swap_states_schema_48, swap_exp_schema_53:
            exploration = exp_domain.Exploration.create_default_exploration(
                self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
            exp_services.save_new_exploration(feconf.SYSTEM_COMMITTER_ID, exploration)

            self.assertEqual(exploration.states_schema_version, 48)

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='EXP PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout="CACHE DELETION SUCCESS: 1", stderr=""),
            job_run_result.JobRunResult(stdout="EXP MIGRATED SUCCESS: 1", stderr="")
        ])

        exp_services.delete_exploration(feconf.SYSTEM_COMMITTER_ID, self.NEW_EXP_ID)



    # def test_unmigrated_exp_is_migrated(self) -> None:
    #     exploration = exp_domain.Exploration.create_default_exploration(
    #         self.NEW_EXP_ID, title=self.EXP_TITLE, category='category')
    #     init_state = exploration.states[exploration.init_state_name]
    #     self.set_interaction_for_state(init_state, 'EndExploration')
    #     init_state.update_interaction_default_outcome(None)
    #     exp_services.save_new_exploration(feconf.SYSTEM_COMMITTER_ID, exploration)

