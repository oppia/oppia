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

import uuid

from core.platform import models
from core.tests import test_utils
import feconf

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
            'closed_by')

    def test_has_reference_to_user_id(self):
        improvements_models.TaskEntryModel.get_or_create_task(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='expid',
            entity_version=1,
            task_type=feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            status='open',
            closed_by='user_id')

        self.assertTrue(
            improvements_models.TaskEntryModel.has_reference_to_user_id(
                'user_id'))
        self.assertFalse(
            improvements_models.TaskEntryModel.has_reference_to_user_id(
                'x_id'))

    def test_get_deletion_policy(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        improvements_models.TaskEntryModel.get_or_create_task(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='expid',
            entity_version=1,
            task_type=feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            status='open',
            closed_by='user_id')

        self.assertTrue(
            improvements_models.TaskEntryModel.has_reference_to_user_id(
                'user_id'))

        improvements_models.TaskEntryModel.apply_deletion_policy('user_id')

        self.assertFalse(
            improvements_models.TaskEntryModel.has_reference_to_user_id(
                'user_id'))

    def test_get_export_policy(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.get_export_policy(),
            base_models.EXPORT_POLICY.CONTAINS_USER_DATA)

    def test_export_data_without_any_tasks(self):
        self.assertEqual(
            improvements_models.TaskEntryModel.export_data('user_id'),
            {'task_ids_closed_by_user': []})

    def test_export_data_with_task(self):
        task_id = improvements_models.TaskEntryModel.generate_task_id(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='expid',
            entity_version=1,
            task_type=feconf.TASK_TYPE_HIGH_BOUNCE_RATE)
        improvements_models.TaskEntryModel.get_or_create_task(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='expid',
            entity_version=1,
            task_type=feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            status='open',
            closed_by='user_id')

        self.assertEqual(
            improvements_models.TaskEntryModel.export_data('user_id'),
            {'task_ids_closed_by_user': [task_id]})

    def test_generate_new_task_id(self):
        entity_type, entity_id, entity_version = (
            'TEST_ONLY_ENTITY_TYPE', 'entity_id', 1)
        task_type = 'TEST_ONLY_TASK_TYPE'
        target_type, target_id = 'TEST_ONLY_TARGET_TYPE', 'target_id'
        self.assertEqual(
            improvements_models.TaskEntryModel.generate_task_id(
                entity_type, entity_id, entity_version, task_type, target_type,
                target_id),
            'TEST_ONLY_ENTITY_TYPE.entity_id.1.TEST_ONLY_TASK_TYPE.'
            'TEST_ONLY_TARGET_TYPE.target_id')

    def test_generate_new_task_id_with_empty_target(self):
        entity_type, entity_id, entity_version = (
            'TEST_ONLY_ENTITY_TYPE', 'entity_id', 1)
        task_type = 'TEST_ONLY_TASK_TYPE'
        self.assertEqual(
            improvements_models.TaskEntryModel.generate_task_id(
                entity_type, entity_id, entity_version, task_type, None, None),
            'TEST_ONLY_ENTITY_TYPE.entity_id.1.TEST_ONLY_TASK_TYPE..')

    def test_can_create_task_with_unicode_identifiers(self):
        entity_type, entity_id, entity_version = (
            'TEST_ONLY_ENTITY_TYPE', 'entity_id_\U0001F4C8', 1)
        task_type = 'TEST_ONLY_TASK_TYPE'
        target_type, target_id = 'TEST_ONLY_TARGET_TYPE', 'target_id_\U0001F4C8'

        improvements_models.TaskEntryModel.get_or_create_task(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_version=entity_version,
            task_type=task_type,
            target_type=target_type,
            target_id=target_id)

    def test_can_create_new_high_bounce_rate_task(self):
        improvements_models.TaskEntryModel.get_or_create_task(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='expid',
            entity_version=1,
            task_type=feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type='state',
            target_id='Introduction',
            status='open')

    def test_can_create_new_successive_incorrect_answers_task(self):
        improvements_models.TaskEntryModel.get_or_create_task(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='expid',
            entity_version=1,
            task_type=feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            target_type='state',
            target_id='Introduction',
            status='open')

    def test_can_create_new_needs_guiding_responses_task(self):
        improvements_models.TaskEntryModel.get_or_create_task(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='expid',
            entity_version=1,
            task_type=feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            target_type='state',
            target_id='Introduction',
            status='open')
