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

"""Tests for Improvements models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import uuid

from core.platform import models
from core.tests import test_utils
import feconf

base_models, imps_models = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.improvements])


def _always_return(value):
    """Creates a function which always returns the input value."""
    return lambda: value


class TaskEntryModelTest(test_utils.GenericTestBase):
    """Unit tests for TaskEntryModel instances."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            imps_models.TaskEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_export_policy(self):
        self.assertEqual(
            imps_models.TaskEntryModel.get_export_policy(),
            base_models.EXPORT_POLICY.CONTAINS_USER_DATA)

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            imps_models.TaskEntryModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD)

    def test_has_reference_to_user_id(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        task = imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1)
        task.closed_by = 'user_id'
        task.put()
        self.assertTrue(
            imps_models.TaskEntryModel.has_reference_to_user_id('user_id'))
        self.assertFalse(
            imps_models.TaskEntryModel.has_reference_to_user_id('x_id'))

    def test_apply_deletion_policy(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        task = imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1)
        task.closed_by = 'user_id'
        task.put()
        self.assertTrue(
            imps_models.TaskEntryModel.has_reference_to_user_id('user_id'))

        imps_models.TaskEntryModel.apply_deletion_policy('user_id')

        self.assertFalse(
            imps_models.TaskEntryModel.has_reference_to_user_id('user_id'))

    def test_export_data(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        task = imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1)
        task.closed_by = 'user_id'
        task.put()

        self.assertEqual(imps_models.TaskEntryModel.export_data('user_id'), {
            'task_ids_closed_by_user': [task_id]
        })

    def test_generate_new_task_id(self):
        task_type, entity_type, entity_id = (
            'TASK_TYPE', 'ENTITY_TYPE', 'ENTITY_ID')
        task_ids = [
            imps_models.TaskEntryModel.generate_new_task_id(
                task_type, entity_type, entity_id),
            imps_models.TaskEntryModel.generate_new_task_id(
                task_type, entity_type, entity_id),
        ]
        self.assertIn(task_type, task_ids[0])
        self.assertIn(task_type, task_ids[1])
        self.assertIn(entity_type, task_ids[0])
        self.assertIn(entity_type, task_ids[1])
        self.assertIn(entity_id, task_ids[0])
        self.assertIn(entity_id, task_ids[1])
        # Although made of the same components, the IDs shouldn't compare equal.
        self.assertNotEqual(task_ids[0], task_ids[1])

    def test_error_reported_if_too_many_collisions(self):
        # TaskEntryModel uses uuid.uuid4() as its source of randomness for IDs.
        with self.swap(uuid, 'uuid4', _always_return('duplicate-uuid')):
            task_id = imps_models.TaskEntryModel.generate_new_task_id(
                feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
            task = imps_models.TaskEntryModel.create(
                task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1)
            task.put()
            with self.assertRaisesRegexp(Exception, 'too many collisions'):
                imps_models.TaskEntryModel.generate_new_task_id(
                    feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
                    feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')

    def test_can_create_new_hbr_task(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1)

    def test_can_create_new_sia_task(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1)

    def test_can_create_new_ngr_task(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1)

    def test_can_generate_task_id_with_unicode_entity_id(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id\U0001F4C8')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id\U0001F4C8', 1)
