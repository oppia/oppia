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

"""Tests for the improvements controllers."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import improvements_domain
from core.domain import improvements_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import python_utils

(improvements_models,) = (
    models.Registry.import_models([models.NAMES.improvements]))


class ImprovementsTestBase(test_utils.GenericTestBase):
    """Base class with helper methods related to building improvement tasks."""

    def _new_obsolete_task(
            self, state_name=feconf.DEFAULT_INIT_STATE_NAME,
            task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            exploration_version=1):
        """Constructs a new default obsolete task with the provided values.

        Args:
            state_name: str. The name of the state the task should target.
            task_type: str. The type of the task.
            exploration_version: int. The version of the exploration the task
                should target.

        Returns:
            improvements_domain.TaskEntry. A new obsolete task entry.
        """
        return improvements_domain.TaskEntry(
            entity_type=improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_ID,
            entity_version=exploration_version,
            task_type=task_type,
            target_type=improvements_models.TASK_TARGET_TYPE_STATE,
            target_id=state_name,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_OBSOLETE,
            resolver_id=None,
            resolved_on=None)

    def _new_open_task(
            self, state_name=feconf.DEFAULT_INIT_STATE_NAME,
            task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            exploration_version=1):
        """Constructs a new default open task with the provided values.

        Args:
            state_name: str. The name of the state the task should target.
            task_type: str. The type of the task.
            exploration_version: int. The version of the exploration the task
                should target.

        Returns:
            improvements_domain.TaskEntry. A new open task entry.
        """
        return improvements_domain.TaskEntry(
            entity_type=improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_ID,
            entity_version=exploration_version,
            task_type=task_type,
            target_type=improvements_models.TASK_TARGET_TYPE_STATE,
            target_id=state_name,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_OPEN,
            resolver_id=None,
            resolved_on=None)

    def _new_resolved_task(
            self, state_name=feconf.DEFAULT_INIT_STATE_NAME,
            task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            exploration_version=1):
        """Constructs a new default resolved task with the provided values.

        Args:
            state_name: str. The name of the state the task should target.
            task_type: str. The type of the task.
            exploration_version: int. The version of the exploration the task
                should target.

        Returns:
            improvements_domain.TaskEntry. A new resolved task entry.
        """
        return improvements_domain.TaskEntry(
            entity_type=improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_ID,
            entity_version=exploration_version,
            task_type=task_type,
            target_type=improvements_models.TASK_TARGET_TYPE_STATE,
            target_id=state_name,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_RESOLVED,
            resolver_id=self.owner_id,
            resolved_on=self.MOCK_DATE)


class ExplorationImprovementsHandlerTests(ImprovementsTestBase):

    EXP_ID = 'eid'
    MOCK_DATE = datetime.datetime(2020, 6, 22)

    def setUp(self):
        super(ExplorationImprovementsHandlerTests, self).setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp = self.save_new_valid_exploration(self.EXP_ID, self.owner_id)

    def get_url(self, exp_id=EXP_ID):
        """Returns the URL corresponding to the handler.

        Args:
            exp_id: str. The exploration id to fetch. Uses self's EXP_ID
                constant by default.

        Returns:
            str. The URL of the handler.
        """
        return '%s/%s/%s' % (
            feconf.IMPROVEMENTS_URL_PREFIX,
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            exp_id)

    def test_get_with_invalid_exploration_returns_invalid_input_page(self):
        self.get_json(
            self.get_url(exp_id='bad_exp_id'), expected_status_int=401)

    def test_get_with_non_creator_returns_401_error(self):
        with self.login_context(self.VIEWER_EMAIL):
            self.get_json(self.get_url(), expected_status_int=401)

    def test_get_when_no_tasks_exist_returns_response_with_empty_fields(self):
        with self.login_context(self.OWNER_EMAIL):
            self.assertEqual(self.get_json(self.get_url()), {
                'open_tasks': [],
                'resolved_task_types_by_state_name': {},
            })

    def test_get_returns_open_tasks(self):
        task_entries = [
            self._new_open_task(state_name=name) for name in ['A', 'B', 'C']]
        improvements_services.put_tasks(task_entries)

        with self.login_context(self.OWNER_EMAIL):
            self.assertEqual(self.get_json(self.get_url()), {
                'open_tasks': [t.to_dict() for t in task_entries],
                'resolved_task_types_by_state_name': {},
            })

    def test_get_returns_resolved_tasks(self):
        task_entries = [
            self._new_resolved_task(
                state_name=name,
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE)
            for name in ['A', 'B', 'C']]
        improvements_services.put_tasks(task_entries)

        with self.login_context(self.OWNER_EMAIL):
            self.assertEqual(self.get_json(self.get_url()), {
                'open_tasks': [],
                'resolved_task_types_by_state_name': {
                    'A': ['high_bounce_rate'],
                    'B': ['high_bounce_rate'],
                    'C': ['high_bounce_rate'],
                },
            })

    def test_post_with_non_creator_returns_401_error(self):
        with self.login_context(self.VIEWER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': 1,
                    'task_type': 'high_bounce_rate',
                    'target_id': 'Introduction',
                    'issue_description': 'issue description',
                    'status': 'open',
                }]
            }, csrf_token=self.get_new_csrf_token(), expected_status_int=401)

    def test_post_without_csrf_token_returns_401_error(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': self.exp.version,
                    'task_type': improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                    'target_id': feconf.DEFAULT_INIT_STATE_NAME,
                    'issue_description': 'issue description',
                    'status': improvements_models.TASK_STATUS_OPEN,
                }]
            }, csrf_token=None, expected_status_int=401)

    def test_post_can_create_new_open_task_in_storage(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': self.exp.version,
                    'task_type': improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                    'target_id': feconf.DEFAULT_INIT_STATE_NAME,
                    'issue_description': 'issue description',
                    'status': improvements_models.TASK_STATUS_OPEN,
                }]
            }, csrf_token=self.get_new_csrf_token())

        task_id = improvements_models.TaskEntryModel.generate_task_id(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp.id,
            self.exp.version,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME)
        task_entry_model = improvements_models.TaskEntryModel.get_by_id(task_id)

        self.assertIsNotNone(task_entry_model)
        self.assertEqual(task_entry_model.id, task_id)
        self.assertEqual(
            task_entry_model.entity_type,
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION)
        self.assertEqual(task_entry_model.entity_id, self.exp.id)
        self.assertEqual(task_entry_model.entity_version, self.exp.version)
        self.assertEqual(
            task_entry_model.task_type,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE)
        self.assertEqual(
            task_entry_model.target_type,
            improvements_models.TASK_TARGET_TYPE_STATE)
        self.assertEqual(
            task_entry_model.target_id, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(
            task_entry_model.issue_description, 'issue description')
        self.assertEqual(
            task_entry_model.status, improvements_models.TASK_STATUS_OPEN)
        self.assertIsNone(task_entry_model.resolver_id)
        self.assertIsNone(task_entry_model.resolved_on)

    def test_post_can_create_new_open_task_in_storage(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': self.exp.version,
                    'task_type': improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                    'target_id': feconf.DEFAULT_INIT_STATE_NAME,
                    'issue_description': 'issue description',
                    'status': improvements_models.TASK_STATUS_OBSOLETE,
                }]
            }, csrf_token=self.get_new_csrf_token())

        task_id = improvements_models.TaskEntryModel.generate_task_id(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp.id,
            self.exp.version,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME)
        task_entry_model = improvements_models.TaskEntryModel.get_by_id(task_id)

        self.assertIsNotNone(task_entry_model)
        self.assertEqual(task_entry_model.id, task_id)
        self.assertEqual(
            task_entry_model.entity_type,
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION)
        self.assertEqual(task_entry_model.entity_id, self.exp.id)
        self.assertEqual(task_entry_model.entity_version, self.exp.version)
        self.assertEqual(
            task_entry_model.task_type,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE)
        self.assertEqual(
            task_entry_model.target_type,
            improvements_models.TASK_TARGET_TYPE_STATE)
        self.assertEqual(
            task_entry_model.target_id, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(
            task_entry_model.issue_description, 'issue description')
        self.assertEqual(
            task_entry_model.status, improvements_models.TASK_STATUS_OBSOLETE)
        self.assertIsNone(task_entry_model.resolver_id)
        self.assertIsNone(task_entry_model.resolved_on)

    def test_post_can_create_new_resolved_task_in_storage_with_utcnow(self):
        login_context = self.login_context(self.OWNER_EMAIL)
        mock_datetime_utcnow = self.mock_datetime_utcnow(self.MOCK_DATE)
        with login_context, mock_datetime_utcnow:
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': self.exp.version,
                    'task_type': improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                    'target_id': feconf.DEFAULT_INIT_STATE_NAME,
                    'issue_description': 'issue description',
                    'status': improvements_models.TASK_STATUS_RESOLVED,
                }]
            }, csrf_token=self.get_new_csrf_token())

        task_id = improvements_models.TaskEntryModel.generate_task_id(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            self.exp.id,
            self.exp.version,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME)
        task_entry_model = improvements_models.TaskEntryModel.get_by_id(task_id)

        self.assertIsNotNone(task_entry_model)
        self.assertEqual(task_entry_model.id, task_id)
        self.assertEqual(
            task_entry_model.entity_type,
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION)
        self.assertEqual(task_entry_model.entity_id, self.exp.id)
        self.assertEqual(task_entry_model.entity_version, self.exp.version)
        self.assertEqual(
            task_entry_model.task_type,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE)
        self.assertEqual(
            task_entry_model.target_type,
            improvements_models.TASK_TARGET_TYPE_STATE)
        self.assertEqual(
            task_entry_model.target_id, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(
            task_entry_model.issue_description, 'issue description')
        self.assertEqual(
            task_entry_model.status, improvements_models.TASK_STATUS_RESOLVED)
        self.assertEqual(task_entry_model.resolver_id, self.owner_id)
        self.assertEqual(task_entry_model.resolved_on, self.MOCK_DATE)
