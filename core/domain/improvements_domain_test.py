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

"""Unit tests for domain objects related to Oppia improvement tasks."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.domain import improvements_domain
from core.tests import test_utils


class TaskEntryTests(test_utils.GenericTestBase):
    """Unit tests for the TaskEntry domain object."""

    MOCK_DATE = datetime.datetime(2020, 6, 15, 9, 0, 0, 123456)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp_id = 'eid'
        self.save_new_valid_exploration(self.exp_id, self.owner_id)
        self.maxDiff = None

    def test_task_id_has_expected_value(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(
            task_entry.task_id,
            'exploration.eid.1.high_bounce_rate.state.Introduction')

    def test_composite_entity_id_has_expected_value(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(task_entry.composite_entity_id, 'exploration.eid.1')

    def test_to_dict_has_expected_value(self) -> None:
        # Data url for images/avatar/user_blue_72px.png.
        # Generated using utils.convert_png_to_data_url.
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        self.assertEqual(task_entry.to_dict(), {
            'entity_type': 'exploration',
            'entity_id': self.exp_id,
            'entity_version': 1,
            'task_type': 'high_bounce_rate',
            'target_type': 'state',
            'target_id': 'Introduction',
            'issue_description': 'issue description',
            'status': 'resolved',
            'resolver_username': None,
            'resolved_on_msecs': utils.get_time_in_millisecs(self.MOCK_DATE),
        })

    def test_can_create_open_task_with_corresponding_values(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OPEN, None, None)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'open')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)

    def test_can_create_obsolete_task_with_corresponding_values(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OBSOLETE, None, None)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'obsolete')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)

    def test_can_create_resolved_task_with_corresponding_value(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'resolved')
        self.assertEqual(task_entry.resolver_id, self.owner_id)
        self.assertEqual(task_entry.resolved_on, self.MOCK_DATE)

    def test_constructor_ignores_resolution_args_when_task_is_open(
        self
    ) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OPEN, self.owner_id, self.MOCK_DATE)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'open')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)

    def test_constructor_ignores_resolution_args_when_task_is_obsolete(
        self
    ) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.exp_id, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_OBSOLETE, self.owner_id,
            self.MOCK_DATE)

        self.assertEqual(task_entry.entity_type, 'exploration')
        self.assertEqual(task_entry.entity_id, self.exp_id)
        self.assertEqual(task_entry.entity_version, 1)
        self.assertEqual(task_entry.task_type, 'high_bounce_rate')
        self.assertEqual(task_entry.target_type, 'state')
        self.assertEqual(task_entry.target_id, 'Introduction')
        self.assertEqual(task_entry.issue_description, 'issue description')
        self.assertEqual(task_entry.status, 'obsolete')
        self.assertIsNone(task_entry.resolver_id)
        self.assertIsNone(task_entry.resolved_on)
