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

from core.domain import config_domain
from core.domain import exp_services
from core.domain import improvements_domain
from core.domain import improvements_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(improvements_models,) = (
    models.Registry.import_models([models.NAMES.improvements]))


class ImprovementsTestBase(test_utils.GenericTestBase):
    """Base class with helper methods related to building improvement tasks."""

    EXP_ID = 'eid'
    MOCK_DATE = datetime.datetime(2020, 6, 22)

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
            exploration_version=1, resolved_on=MOCK_DATE):
        """Constructs a new default resolved task with the provided values.

        Args:
            state_name: str. The name of the state the task should target.
            task_type: str. The type of the task.
            exploration_version: int. The version of the exploration the task
                should target.
            resolved_on: datetime.datetime. Time at which the task was resolved.

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
            resolved_on=resolved_on)


class ExplorationImprovementsHandlerTests(ImprovementsTestBase):

    def setUp(self):
        super(ExplorationImprovementsHandlerTests, self).setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp = self.save_new_valid_exploration(self.EXP_ID, self.owner_id)

    def get_url(self, exp_id=None):
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
            self.EXP_ID if exp_id is None else exp_id)

    def test_get_with_invalid_exploration_returns_invalid_input_page(self):
        with self.login_context(self.OWNER_EMAIL):
            self.get_json(
                self.get_url(exp_id='bad_exp_id'), expected_status_int=404)

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

    def test_post_invalid_exploration_returns_invalid_input_page(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(exp_id='bad_exp_id'), {
                'task_entries': [{
                    'entity_version': 1,
                    'task_type': 'high_bounce_rate',
                    'target_id': 'Introduction',
                    'issue_description': 'issue description',
                    'status': 'open',
                }]
            }, csrf_token=self.get_new_csrf_token(), expected_status_int=404)

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

    def test_post_with_missing_task_entries_returns_401_error(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
            }, csrf_token=self.get_new_csrf_token(), expected_status_int=400)

    def test_post_with_missing_entity_version_returns_401_error(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    # 'entity_version': 1.
                    'task_type': 'high_bounce_rate',
                    'target_id': 'Introduction',
                    'issue_description': 'issue description',
                    'status': 'open',
                }]
            }, csrf_token=self.get_new_csrf_token(), expected_status_int=400)

    def test_post_with_missing_task_type_returns_401_error(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': 1,
                    # 'task_type': 'high_bounce_rate'.
                    'target_id': 'Introduction',
                    'issue_description': 'issue description',
                    'status': 'open',
                }]
            }, csrf_token=self.get_new_csrf_token(), expected_status_int=400)

    def test_post_with_missing_target_id_returns_401_error(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': 1,
                    'task_type': 'high_bounce_rate',
                    # 'target_id': 'Introduction'.
                    'issue_description': 'issue description',
                    'status': 'open',
                }]
            }, csrf_token=self.get_new_csrf_token(), expected_status_int=400)

    def test_post_with_missing_issue_description_is_allowed(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': 1,
                    'task_type': 'high_bounce_rate',
                    'target_id': 'Introduction',
                    # 'issue_description': 'issue description'.
                    'status': 'open',
                }]
            }, csrf_token=self.get_new_csrf_token())

        task_entry_model = improvements_models.TaskEntryModel.get_by_id(
            improvements_models.TaskEntryModel.generate_task_id(
                improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
                self.exp.id,
                self.exp.version,
                improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                improvements_models.TASK_TARGET_TYPE_STATE,
                feconf.DEFAULT_INIT_STATE_NAME))

        self.assertIsNotNone(task_entry_model)
        self.assertIsNone(task_entry_model.issue_description)

    def test_post_with_missing_status_returns_401_error(self):
        with self.login_context(self.OWNER_EMAIL):
            self.post_json(self.get_url(), {
                'task_entries': [{
                    'entity_version': 1,
                    'task_type': 'high_bounce_rate',
                    'target_id': 'Introduction',
                    'issue_description': 'issue description',
                    # 'status': 'open'.
                }]
            }, csrf_token=self.get_new_csrf_token(), expected_status_int=400)

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

    def test_post_can_create_new_obsolete_task_in_storage(self):
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


class ExplorationImprovementsHistoryHandlerTests(ImprovementsTestBase):

    def setUp(self):
        super(ExplorationImprovementsHistoryHandlerTests, self).setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp = self.save_new_valid_exploration(self.EXP_ID, self.owner_id)

    def get_url(self, exp_id=None, cursor=None):
        """Returns the URL corresponding to the handler.

        Args:
            exp_id: str. The exploration id to fetch. Uses self's EXP_ID
                constant by default.
            cursor: str or None. Starting point for the search. When None, the
                starting point is the very beginning of the history results
                (i.e. starting from the most recently resolved task entry).

        Returns:
            str. The URL of the handler.
        """
        url = '%s/%s/%s' % (
            feconf.IMPROVEMENTS_HISTORY_URL_PREFIX,
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            self.EXP_ID if exp_id is None else exp_id)
        if cursor is not None:
            url = '%s?cursor=%s' % (url, cursor)
        return url

    def test_get_with_invalid_exploration_returns_invalid_input_page(self):
        with self.login_context(self.OWNER_EMAIL):
            self.get_json(
                self.get_url(exp_id='bad_exp_id'), expected_status_int=404)

    def test_get_with_non_creator_returns_401_error(self):
        with self.login_context(self.VIEWER_EMAIL):
            self.get_json(self.get_url(), expected_status_int=401)

    def test_get_with_invalid_cursor_returns_500_error(self):
        with self.login_context(self.OWNER_EMAIL):
            self.get_json(self.get_url(cursor=234), expected_status_int=500)

    def test_get_when_no_tasks_exist_returns_response_with_empty_fields(self):
        with self.login_context(self.OWNER_EMAIL):
            self.assertEqual(self.get_json(self.get_url()), {
                'results': [],
                'cursor': None,
                'more': False,
            })

    def test_get_with_cursor_as_none_returns_first_page(self):
        task_entries = [
            self._new_resolved_task(
                state_name='State %d' % i,
                resolved_on=self.MOCK_DATE + datetime.timedelta(minutes=i * 5))
            for i in python_utils.RANGE(1, 26)]
        improvements_services.put_tasks(task_entries)
        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url(cursor=None))
        self.assertEqual(
            [t['target_id'] for t in json_response['results']], [
                'State 25', 'State 24', 'State 23', 'State 22', 'State 21',
                'State 20', 'State 19', 'State 18', 'State 17', 'State 16',
            ])
        self.assertIsNotNone(json_response['cursor'])
        self.assertTrue(json_response['more'])

    def test_get_can_build_full_task_list_after_enough_fetches(self):
        task_entries = [
            self._new_resolved_task(
                state_name='State %d' % i,
                resolved_on=self.MOCK_DATE + datetime.timedelta(minutes=i * 5))
            for i in python_utils.RANGE(1, 26)]
        improvements_services.put_tasks(task_entries)

        with self.login_context(self.OWNER_EMAIL):
            all_results, cursor, more = [], None, True
            while more:
                json_response = self.get_json(self.get_url(cursor=cursor))
                all_results.extend(json_response['results'])
                cursor = json_response['cursor']
                more = json_response['more']
        self.assertEqual(
            [t['target_id'] for t in all_results], [
                'State 25', 'State 24', 'State 23', 'State 22', 'State 21',
                'State 20', 'State 19', 'State 18', 'State 17', 'State 16',
                'State 15', 'State 14', 'State 13', 'State 12', 'State 11',
                'State 10', 'State 9', 'State 8', 'State 7', 'State 6',
                'State 5', 'State 4', 'State 3', 'State 2', 'State 1',
            ])


class ExplorationImprovementsConfigHandlerTests(test_utils.GenericTestBase):

    EXP_ID = 'eid'

    def setUp(self):
        super(ExplorationImprovementsConfigHandlerTests, self).setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp = self.save_new_valid_exploration(self.EXP_ID, self.owner_id)

    def get_url(self, exp_id=None):
        """Returns the URL corresponding to the handler.

        Args:
            exp_id: str. The exploration id to fetch. Uses self's EXP_ID
                constant by default.

        Returns:
            str. The URL of the handler.
        """
        return '%s/%s/%s' % (
            feconf.IMPROVEMENTS_CONFIG_URL_PREFIX,
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            self.EXP_ID if exp_id is None else exp_id)

    def test_get_for_public_exploration_as_non_owning_user_fails(self):
        self.publish_exploration(self.owner_id, self.EXP_ID)
        with self.login_context(self.VIEWER_EMAIL):
            self.get_json(self.get_url(), expected_status_int=401)

    def test_get_for_private_exploration_as_non_owning_user_fails(self):
        # Fail to call `publish_exploration`.
        with self.login_context(self.VIEWER_EMAIL):
            self.get_json(self.get_url(), expected_status_int=401)

    def test_get_for_non_existing_exploration_fails(self):
        with self.login_context(self.OWNER_EMAIL):
            self.get_json(
                self.get_url(exp_id='bad_exp_id'), expected_status_int=404)

    def test_get_returns_exploration_id(self):
        self.set_config_property(
            config_domain.IS_IMPROVEMENTS_TAB_ENABLED, False)

        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertEqual(json_response['exploration_id'], self.EXP_ID)

    def test_get_returns_exploration_version(self):
        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertEqual(json_response['exploration_version'], 1)

        # Update to version 2.
        exp_services.update_exploration(self.owner_id, self.EXP_ID, None, '')

        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertEqual(json_response['exploration_version'], 2)

    def test_improvements_tab_disabled(self):
        self.set_config_property(
            config_domain.IS_IMPROVEMENTS_TAB_ENABLED, False)

        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertFalse(json_response['is_improvements_tab_enabled'])

    def test_improvements_tab_enabled(self):
        self.set_config_property(
            config_domain.IS_IMPROVEMENTS_TAB_ENABLED, True)

        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertTrue(json_response['is_improvements_tab_enabled'])

    def test_custom_high_bounce_rate_creation_threshold(self):
        self.set_config_property((
            config_domain
            .HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD), 0.35)

        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertAlmostEqual(
            json_response[
                'high_bounce_rate_task_state_bounce_rate_creation_threshold'],
            0.35)

    def test_custom_high_bounce_rate_obsoletion_threshold(self):
        self.set_config_property(
            (
                config_domain
                .HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD),
            0.05)

        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertAlmostEqual(
            json_response[
                'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold'],
            0.05)

    def test_custom_high_bounce_rate_task_minimum_exploration_starts(self):
        self.set_config_property(
            config_domain.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS,
            20)

        with self.login_context(self.OWNER_EMAIL):
            json_response = self.get_json(self.get_url())

        self.assertAlmostEqual(
            json_response['high_bounce_rate_task_minimum_exploration_starts'],
            20)
