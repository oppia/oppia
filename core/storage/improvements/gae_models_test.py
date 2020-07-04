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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils

base_models, improvements_models = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.improvements])


def _always_returns(value):
    """Creates a function which always returns the input value."""
    return lambda: value


class TaskEntryModelTests(test_utils.GenericTestBase):
    """Unit tests for TaskEntryModel instances."""

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD)

    def test_get_user_id_migration_field(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.get_user_id_migration_field(),
            'resolver_id')

    def test_has_reference_to_user_id(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'state name',
            'issue_description',
            improvements_models.TASK_STATUS_RESOLVED,
            'uid')
        self.assertTrue(
            improvements_models.TaskEntryModel.has_reference_to_user_id('uid'))
        self.assertFalse(
            improvements_models.TaskEntryModel.has_reference_to_user_id('xid'))

    def test_get_deletion_policy(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'state name',
            'issue_description',
            status=improvements_models.TASK_STATUS_OPEN,
            resolver_id='uid')
        self.assertTrue(
            improvements_models.TaskEntryModel.has_reference_to_user_id('uid'))

        improvements_models.TaskEntryModel.apply_deletion_policy('uid')
        self.assertFalse(
            improvements_models.TaskEntryModel.has_reference_to_user_id('uid'))

    def test_get_export_policy(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.get_export_policy(),
            base_models.EXPORT_POLICY.CONTAINS_USER_DATA)

    def test_export_data_without_any_tasks(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.export_data('uid'),
            {'task_ids_resolved_by_user': []})

    def test_export_data_with_task(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'state name',
            'issue_description',
            status=improvements_models.TASK_STATUS_RESOLVED,
            resolver_id='uid')
        self.assertEqual(
            improvements_models.TaskEntryModel.export_data('uid'),
            {'task_ids_resolved_by_user': [task_id]})

    def test_generate_new_task_id(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.generate_task_id(
                improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
                'eid',
                1,
                improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                improvements_models.TASK_TARGET_TYPE_STATE,
                'tid'),
            'exploration.eid.1.high_bounce_rate.state.tid')

    def test_can_create_task_with_unicode_identifiers(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid_\U0001F4C8',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'tid_\U0001F4C8')

    def test_can_create_new_high_bounce_rate_task(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=improvements_models.TASK_STATUS_OPEN)

    def test_can_create_new_successive_incorrect_answers_task(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=improvements_models.TASK_STATUS_OPEN)

    def test_can_create_new_needs_guiding_responses_task(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=improvements_models.TASK_STATUS_OPEN)

    def test_can_create_new_ineffective_feedback_loop_task(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=improvements_models.TASK_STATUS_OPEN)

    def test_can_not_create_duplicate_tasks(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'Introduction',
            'issue_description',
            status=improvements_models.TASK_STATUS_OPEN)

        with self.assertRaisesRegexp(Exception, 'Task id .* already exists'):
            improvements_models.TaskEntryModel.create(
                improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
                'eid',
                1,
                improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
                improvements_models.TASK_TARGET_TYPE_STATE,
                'Introduction',
                'issue_description',
                status=improvements_models.TASK_STATUS_OPEN)
