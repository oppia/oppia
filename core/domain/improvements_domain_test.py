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

"""Unit tests for improvements tasks services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import improvements_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

base_models, improvements_models = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.improvements])


class TaskEntryTests(test_utils.GenericTestBase):
    """Unit tests for the TaskEntry domain object."""

    MOCK_DATE = datetime.datetime(2020, 6, 15, 9, 0, 0, 123456)

    def setUp(self):
        super(TaskEntryTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp_id = 'eid'
        self.save_new_valid_exploration(self.exp_id, self.owner_id)
        self.maxDiff = None

    def test_task_id_has_expected_value(self):
        task = improvements_domain.TaskEntry(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            improvements_models.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(
            task.task_id,
            'exploration.eid.1.high_bounce_rate.state.Introduction')

    def test_composite_entity_id_has_expected_value(self):
        task = improvements_domain.TaskEntry(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            improvements_models.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(
            task.composite_entity_id, 'exploration.eid.1')

    def test_to_dict_has_expected_value(self):
        task = improvements_domain.TaskEntry(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            improvements_models.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(task.to_dict(), {
            'entity_type': 'exploration',
            'entity_id': self.exp_id,
            'entity_version': 1,
            'task_type': 'high_bounce_rate',
            'target_type': 'state',
            'target_id': 'Introduction',
            'issue_description': 'issue description',
            'status': 'resolved',
            'resolver_username': self.OWNER_USERNAME,
            'resolver_profile_picture_data_url': (
                user_services.DEFAULT_IDENTICON_DATA_URL),
            'resolved_on_msecs': utils.get_time_in_millisecs(self.MOCK_DATE),
        })

    def test_to_dict_with_non_existing_resolver_id_raises_exception(self):
        invalid_resolver_id = 'non_existing_user_id'
        task = improvements_domain.TaskEntry(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            improvements_models.TASK_STATUS_RESOLVED, invalid_resolver_id,
            self.MOCK_DATE)
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            task.to_dict()

    def test_open_updates_status_related_fields(self):
        task = improvements_domain.TaskEntry(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            improvements_models.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(task.status, improvements_models.TASK_STATUS_RESOLVED)
        self.assertEqual(task.resolver_id, self.owner_id)
        self.assertEqual(task.resolved_on, self.MOCK_DATE)

        task.open()
        self.assertEqual(task.status, improvements_models.TASK_STATUS_OPEN)
        self.assertIsNone(task.resolver_id)
        self.assertIsNone(task.resolved_on)

    def test_obsolete_updates_status_related_fields(self):
        task = improvements_domain.TaskEntry(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            improvements_models.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(task.status, improvements_models.TASK_STATUS_RESOLVED)
        self.assertEqual(task.resolver_id, self.owner_id)
        self.assertEqual(task.resolved_on, self.MOCK_DATE)

        task.obsolete()
        self.assertEqual(task.status, improvements_models.TASK_STATUS_OBSOLETE)
        self.assertIsNone(task.resolver_id)
        self.assertIsNone(task.resolved_on)

    def test_resolve_updates_status_related_fields(self):
        task = improvements_domain.TaskEntry(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            improvements_models.TASK_STATUS_OPEN, None, None)
        self.assertEqual(task.status, improvements_models.TASK_STATUS_OPEN)
        self.assertIsNone(task.resolver_id)
        self.assertIsNone(task.resolved_on)

        with self.mock_datetime_utcnow(self.MOCK_DATE):
            task.resolve(self.owner_id)
        self.assertEqual(task.status, improvements_models.TASK_STATUS_RESOLVED)
        self.assertEqual(task.resolver_id, self.owner_id)
        self.assertEqual(task.resolved_on, self.MOCK_DATE)
