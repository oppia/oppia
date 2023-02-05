# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for models related to Oppia improvement tasks."""

from __future__ import annotations

from core.constants import constants
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import improvements_models

base_models, improvements_models = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.IMPROVEMENTS
])


class ExplorationStatsTaskEntryModelTests(test_utils.GenericTestBase):
    """Unit tests for ExplorationStatsTaskEntryModel instances."""

    def test_get_field_name_mapping_to_takeout_keys(self) -> None:
        self.assertEqual(
            improvements_models.ExplorationStatsTaskEntryModel.
                get_field_name_mapping_to_takeout_keys(),
            {
                'resolver_id': 'task_ids_resolved_by_user',
                'issue_description': 'issue_descriptions',
                'status': 'statuses',
                'resolved_on': 'resolution_msecs'
            }
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'composite_entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'task_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'target_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'target_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'issue_description': base_models.EXPORT_POLICY.EXPORTED,
            'status': base_models.EXPORT_POLICY.EXPORTED,
            'resolver_id': base_models.EXPORT_POLICY.EXPORTED,
            'resolved_on': base_models.EXPORT_POLICY.EXPORTED,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            improvements_models.ExplorationStatsTaskEntryModel
            .get_export_policy(),
            expected_export_policy_dict
        )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            improvements_models.ExplorationStatsTaskEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.
                ONE_INSTANCE_SHARED_ACROSS_USERS
        )

    def test_has_reference_to_user_id(self) -> None:
        improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            'state name',
            'issue_description',
            constants.TASK_STATUS_RESOLVED,
            'uid')
        self.assertTrue(
            improvements_models.ExplorationStatsTaskEntryModel
            .has_reference_to_user_id('uid'))
        self.assertFalse(
            improvements_models.ExplorationStatsTaskEntryModel
            .has_reference_to_user_id('xid'))

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            improvements_models.ExplorationStatsTaskEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_apply_deletion_policy(self) -> None:
        model_class = improvements_models.ExplorationStatsTaskEntryModel
        model_class.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            'state name',
            'issue_description',
            status=constants.TASK_STATUS_OPEN,
            resolver_id='uid')
        self.assertTrue(model_class.has_reference_to_user_id('uid'))

        model_class.apply_deletion_policy('uid')
        self.assertFalse(model_class.has_reference_to_user_id('uid'))

    def test_export_data_without_any_tasks(self) -> None:
        self.assertEqual(
            improvements_models.ExplorationStatsTaskEntryModel.export_data(
                'uid'
            ),
            {
                'issue_descriptions': [],
                'resolution_msecs': [],
                'statuses': [],
                'task_ids_resolved_by_user': []
            })

    def test_export_data_with_task(self) -> None:
        task_id_1 = improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid_1',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            'state name',
            'issue_description_1',
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id='uid')
        task_id_2 = improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid_2',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            'state name',
            'issue_description_2',
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id='uid')
        self.assertEqual(
            improvements_models.ExplorationStatsTaskEntryModel.export_data(
                'uid'
            ),
            {
                'issue_descriptions': [
                    'issue_description_1', 'issue_description_2'],
                'resolution_msecs': [None, None],
                'statuses': ['resolved', 'resolved'],
                'task_ids_resolved_by_user': [task_id_1, task_id_2]
            })

    def test_generate_new_task_id(self) -> None:
        self.assertEqual(
            improvements_models.ExplorationStatsTaskEntryModel.generate_task_id(
                constants.TASK_ENTITY_TYPE_EXPLORATION,
                'eid',
                1,
                constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                constants.TASK_TARGET_TYPE_STATE,
                'tid'),
            'exploration.eid.1.high_bounce_rate.state.tid')

    def test_can_create_task_with_unicode_identifiers(self) -> None:
        improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid_\U0001F4C8',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            'tid_\U0001F4C8')

    def test_can_create_new_high_bounce_rate_task(self) -> None:
        improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=constants.TASK_STATUS_OPEN)

    def test_can_create_new_successive_incorrect_answers_task(self) -> None:
        improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            constants.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=constants.TASK_STATUS_OPEN)

    def test_can_create_new_needs_guiding_responses_task(self) -> None:
        improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            constants.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=constants.TASK_STATUS_OPEN)

    def test_can_create_new_ineffective_feedback_loop_task(self) -> None:
        improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            constants.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=constants.TASK_STATUS_OPEN)

    def test_can_not_create_duplicate_tasks(self) -> None:
        improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            constants.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=constants.TASK_STATUS_OPEN)

        with self.assertRaisesRegex(Exception, 'Task id .* already exists'):
            improvements_models.ExplorationStatsTaskEntryModel.create(
                constants.TASK_ENTITY_TYPE_EXPLORATION,
                'eid',
                1,
                constants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
                constants.TASK_TARGET_TYPE_STATE,
                'Introduction',
                'issue_description',
                status=constants.TASK_STATUS_OPEN)
