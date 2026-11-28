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

from core import feconf, utils
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
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_RESOLVED,
            self.owner_id,
            self.MOCK_DATE,
        )
        self.assertEqual(
            task_entry.task_id,
            'exploration.eid.1.high_bounce_rate.state.Introduction',
        )

    def test_composite_entity_id_has_expected_value(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_RESOLVED,
            self.owner_id,
            self.MOCK_DATE,
        )
        self.assertEqual(task_entry.composite_entity_id, 'exploration.eid.1')

    def test_to_dict_has_expected_value(self) -> None:
        # Data url for images/avatar/user_blue_72px.png.
        # Generated using utils.convert_png_to_data_url.
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_RESOLVED,
            self.owner_id,
            self.MOCK_DATE,
        )
        self.assertEqual(
            task_entry.to_dict(),
            {
                'entity_type': 'exploration',
                'entity_id': self.exp_id,
                'entity_version': 1,
                'task_type': 'high_bounce_rate',
                'target_type': 'state',
                'target_id': 'Introduction',
                'issue_description': 'issue description',
                'status': 'resolved',
                'resolver_username': None,
                'resolved_on_msecs': utils.get_time_in_millisecs(
                    self.MOCK_DATE
                ),
            },
        )

    def test_can_create_open_task_with_corresponding_values(self) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_OPEN,
            None,
            None,
        )

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
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_OBSOLETE,
            None,
            None,
        )

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
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_RESOLVED,
            self.owner_id,
            self.MOCK_DATE,
        )

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
        self,
    ) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_OPEN,
            self.owner_id,
            self.MOCK_DATE,
        )

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
        self,
    ) -> None:
        task_entry = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp_id,
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_OBSOLETE,
            self.owner_id,
            self.MOCK_DATE,
        )

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


class TaskEntryValidateTests(test_utils.GenericTestBase):
    """Unit tests for TaskEntry.validate()."""

    MOCK_DATE = datetime.datetime(2020, 6, 15, 9, 0, 0, 123456)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def _new_task(
        self, status: str = constants.TASK_STATUS_OPEN
    ) -> improvements_domain.TaskEntry:
        """Returns a valid task with the given status.

        Args:
            status: str. The status of the task.

        Returns:
            improvements_domain.TaskEntry. A valid task entry.
        """
        return improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            status,
            self.owner_id,
            self.MOCK_DATE,
        )

    def test_valid_tasks_pass_validation(self) -> None:
        for status in improvements_domain.ALLOWED_STATUSES:
            self._new_task(status=status).validate()

    def test_issue_description_may_be_none(self) -> None:
        task = self._new_task()
        task.issue_description = None
        task.validate()

    def test_pseudonymous_resolver_id_passes_validation(self) -> None:
        task = self._new_task(status=constants.TASK_STATUS_RESOLVED)
        task.resolver_id = 'pid_%s' % ('a' * 32)
        task.validate()

    def test_invalid_entity_type_fails_validation(self) -> None:
        task = self._new_task()
        task.entity_type = 'skill'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid entity_type: skill'
        ):
            task.validate()

    def test_invalid_entity_id_fails_validation(self) -> None:
        task = self._new_task()
        task.entity_id = 'not a valid id!'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid entity_id: not a valid id!'
        ):
            task.validate()

    def test_entity_version_below_one_fails_validation(self) -> None:
        task = self._new_task()
        task.entity_version = 0
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected entity_version to be at least 1, received 0',
        ):
            task.validate()

    def test_invalid_task_type_fails_validation(self) -> None:
        task = self._new_task()
        task.task_type = 'unknown_task'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid task_type: unknown_task'
        ):
            task.validate()

    def test_invalid_target_type_fails_validation(self) -> None:
        task = self._new_task()
        task.target_type = 'card'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid target_type: card'
        ):
            task.validate()

    def test_empty_target_id_fails_validation(self) -> None:
        task = self._new_task()
        task.target_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected target_id to be non-empty'
        ):
            task.validate()

    def test_empty_issue_description_fails_validation(self) -> None:
        task = self._new_task()
        task.issue_description = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected issue_description to be None or non-empty',
        ):
            task.validate()

    def test_invalid_status_fails_validation(self) -> None:
        task = self._new_task()
        task.status = 'closed'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid status: closed'
        ):
            task.validate()

    def test_resolved_task_without_resolver_id_fails_validation(self) -> None:
        task = self._new_task(status=constants.TASK_STATUS_RESOLVED)
        task.resolver_id = None
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected a resolved task to have a resolver_id',
        ):
            task.validate()

    def test_resolved_task_with_invalid_resolver_id_fails_validation(
        self,
    ) -> None:
        task = self._new_task(status=constants.TASK_STATUS_RESOLVED)
        task.resolver_id = 'not_a_user_id'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid resolver_id: not_a_user_id'
        ):
            task.validate()

    def test_resolved_task_without_resolved_on_fails_validation(self) -> None:
        task = self._new_task(status=constants.TASK_STATUS_RESOLVED)
        task.resolved_on = None
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected a resolved task to have a resolved_on time',
        ):
            task.validate()

    def test_unresolved_task_with_resolver_id_fails_validation(self) -> None:
        for status in (
            constants.TASK_STATUS_OPEN,
            constants.TASK_STATUS_OBSOLETE,
        ):
            task = self._new_task(status=status)
            task.resolver_id = self.owner_id
            with self.assertRaisesRegex(
                utils.ValidationError,
                'Expected a task with status %s to have no resolver_id '
                'or resolved_on' % status,
            ):
                task.validate()

    def test_unresolved_task_with_resolved_on_fails_validation(self) -> None:
        task = self._new_task(status=constants.TASK_STATUS_OBSOLETE)
        task.resolved_on = self.MOCK_DATE
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected a task with status obsolete to have no resolver_id '
            'or resolved_on',
        ):
            task.validate()
