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

from core.platform import models
from core.tests import test_utils
import feconf

base_models, exp_models, imps_models, user_models = (
    models.Registry.import_models([
        models.NAMES.base_model, models.NAMES.exploration,
        models.NAMES.improvements, models.NAMES.user]))


class TaskEntryModelTest(test_utils.GenericTestBase):

    def setUp(self):
        super(TaskEntryModelTest, self).setUp()
        self.OWNER_EMAIL = 'creator@example.com'
        self.OWNER_NAME = 'Creator'
        self.signup(self.OWNER_EMAIL, self.OWNER_NAME)
        self.OWNER_ID = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.EXP_ID = 'expid'
        self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)

    def test_can_create_new_hbr_task(self):
        imps_models.TaskEntryModel.create(
            'taskid', feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, 1, None, None)

    def test_can_create_new_sia_task(self):
        imps_models.TaskEntryModel.create(
            'taskid', feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, 1, None, None)

    def test_can_create_new_ngr_task(self):
        imps_models.TaskEntryModel.create(
            'taskid', feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, 1, None, None)
