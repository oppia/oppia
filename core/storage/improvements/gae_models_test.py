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

"""Tests for Exploration models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import uuid

from core.platform import models
from core.tests import test_utils
import feconf

base_models, exp_models, imps_models, user_models = (
    models.Registry.import_models([
        models.NAMES.base_model, models.NAMES.exploration,
        models.NAMES.improvements, models.NAMES.user]))


class TaskEntryModelTest(test_utils.GenericTestBase):
    """Unit tests for TaskEntryModel instances."""

    def test_generate_new_task_id(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            'TASK_TYPE', 'ENTITY_TYPE', 'ENTITY_ID')
        self.assertIn('TASK_TYPE', task_id)
        self.assertIn('ENTITY_TYPE', task_id)
        self.assertIn('ENTITY_ID', task_id)
        different_task_id = imps_models.TaskEntryModel.generate_new_task_id(
            'TASK_TYPE', 'ENTITY_TYPE', 'ENTITY_ID')
        self.assertNotEqual(task_id, different_task_id)

    def test_error_reported_if_too_many_collisions(self):
        # TaskEntryModel uses uuid.uuid4() to randomize task IDs.
        with self.swap(uuid, 'uuid4', lambda: 'always-same'):
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
            feconf.TASK_TYPE_HIGH_BOUNCE_RATE, feconf.ENTITY_TYPE_EXPLORATION,
            'exp_id')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1, None, None)

    def test_can_create_new_sia_task(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1, None, None)

    def test_can_create_new_ngr_task(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1, None, None)

    def test_can_generate_task_id_with_unicode_entity_id(self):
        task_id = imps_models.TaskEntryModel.generate_new_task_id(
            feconf.TASK_TYPE_HIGH_BOUNCE_RATE, feconf.ENTITY_TYPE_EXPLORATION,
            'exp_id\U0001F4C8')
        imps_models.TaskEntryModel.create(
            task_id, feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id\U0001F4C8', 1)
