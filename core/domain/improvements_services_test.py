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
from core.domain import improvements_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

base_models, improvements_models = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.improvements])


class ImprovementsServicesTestBase(test_utils.GenericTestBase):
    """Base class with helper methods for the improvements_services tests."""

    EXP_ID = 'eid'
    MOCK_DATE = datetime.datetime(2020, 6, 15)

    def setUp(self):
        super(ImprovementsServicesTestBase, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp = self.save_new_valid_exploration(self.EXP_ID, self.owner_id)

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
            improvements_domain.TaskEntry.
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
            improvements_domain.TaskEntry.
        """
        task = self._new_obsolete_task(
            state_name=state_name, task_type=task_type,
            exploration_version=exploration_version)
        task.open()
        return task

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
            improvements_domain.TaskEntry.
        """
        task = self._new_obsolete_task(
            state_name=state_name, task_type=task_type,
            exploration_version=exploration_version)
        with self.mock_datetime_utcnow(self.MOCK_DATE):
            task.resolve(self.owner_id)
        return task


class PutTasksTests(ImprovementsServicesTestBase):
    """Unit tests for the put_tasks function."""

    def test_puts_brand_new_tasks_in_storage(self):
        open_task = self._new_open_task(state_name='Start')
        obsolete_task = self._new_obsolete_task(state_name='Middle')
        resolved_task = self._new_resolved_task(state_name='End')

        improvements_services.put_tasks(
            [open_task, obsolete_task, resolved_task])

        open_task_model = (
            improvements_models.TaskEntryModel.get_by_id(open_task.task_id))
        obsolete_task_model = (
            improvements_models.TaskEntryModel.get_by_id(obsolete_task.task_id))
        resolved_task_model = (
            improvements_models.TaskEntryModel.get_by_id(resolved_task.task_id))

        self.assertEqual(
            open_task.to_dict(),
            improvements_domain.TaskEntry.from_model(
                open_task_model).to_dict())
        self.assertEqual(
            obsolete_task.to_dict(),
            improvements_domain.TaskEntry.from_model(
                obsolete_task_model).to_dict())
        self.assertEqual(
            resolved_task.to_dict(),
            improvements_domain.TaskEntry.from_model(
                resolved_task_model).to_dict())

    def test_updates_pre_existing_models(self):
        task = self._new_open_task()
        created_on = datetime.datetime(2020, 6, 15, 5)
        updated_on = created_on + datetime.timedelta(minutes=5)

        with self.mock_datetime_utcnow(created_on):
            task.to_model().put()

        model = improvements_models.TaskEntryModel.get_by_id(task.task_id)
        self.assertEqual(model.resolver_id, None)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

        with self.mock_datetime_utcnow(self.MOCK_DATE):
            task.resolve(self.owner_id)

        with self.mock_datetime_utcnow(updated_on):
            improvements_services.put_tasks([task])

        model = improvements_models.TaskEntryModel.get_by_id(task.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, updated_on)

    def test_no_update_made_when_no_changes_in_model(self):
        task = self._new_resolved_task()
        created_on = datetime.datetime(2020, 6, 15, 5)
        updated_on = created_on + datetime.timedelta(minutes=5)

        with self.mock_datetime_utcnow(created_on):
            task.to_model().put()

        model = improvements_models.TaskEntryModel.get_by_id(task.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

        with self.mock_datetime_utcnow(updated_on):
            improvements_services.put_tasks([task])

        model = improvements_models.TaskEntryModel.get_by_id(task.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

    def test_updates_but_does_not_change_last_updated_time(self):
        task = self._new_open_task()
        created_on = datetime.datetime(2020, 6, 15, 5)
        updated_on = created_on + datetime.timedelta(minutes=5)

        with self.mock_datetime_utcnow(created_on):
            task.to_model().put()

        model = improvements_models.TaskEntryModel.get_by_id(task.task_id)
        self.assertEqual(model.resolver_id, None)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

        with self.mock_datetime_utcnow(self.MOCK_DATE):
            task.resolve(self.owner_id)

        with self.mock_datetime_utcnow(updated_on):
            improvements_services.put_tasks(
                [task], update_last_updated_time=False)

        model = improvements_models.TaskEntryModel.get_by_id(task.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)


class FetchExplorationTasksTests(ImprovementsServicesTestBase):
    """Unit tests for the fetch_exploration_tasks function."""

    def setUp(self):
        super(FetchExplorationTasksTests, self).setUp()
        self.maxDiff = None

    def test_empty_output(self):
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))
        self.assertEqual(open_tasks, [])
        self.assertEqual(resolved_task_types_by_state_name, {})

    def test_returns_all_open_tasks_even_when_per_fetch_limit_exceeded(self):
        tasks = [
            self._new_open_task(state_name='State %d' % (i,))
            for i in python_utils.RANGE(
                int(feconf.MAX_TASK_MODELS_PER_FETCH * 2.5))
        ]
        improvements_services.put_tasks(tasks)
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))

        self.assertEqual(resolved_task_types_by_state_name, {})
        self.assertItemsEqual(
            [t.to_dict() for t in tasks], [t.to_dict() for t in open_tasks])

    def test_returns_resolved_task_mapping(self):
        tasks = [
            self._new_resolved_task(
                state_name='A',
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE),
            self._new_resolved_task(
                state_name='B',
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE),
            self._new_resolved_task(
                state_name='B',
                task_type=(
                    improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES)),
            self._new_resolved_task(
                state_name='C',
                task_type=(
                    improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP)),
            self._new_resolved_task(
                state_name='D',
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE),
            self._new_resolved_task(
                state_name='D',
                task_type=(
                    improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES)),
            self._new_resolved_task(
                state_name='D',
                task_type=(
                    improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP)),
            self._new_resolved_task(
                state_name='D',
                task_type=(
                    improvements_models.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS))
        ]
        improvements_services.put_tasks(tasks)
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))

        self.assertEqual(open_tasks, [])
        self.assertItemsEqual(list(resolved_task_types_by_state_name.keys()), [
            'A',
            'B',
            'C',
            'D',
        ])
        self.assertItemsEqual(resolved_task_types_by_state_name['A'], [
            'high_bounce_rate',
        ])
        self.assertItemsEqual(resolved_task_types_by_state_name['B'], [
            'high_bounce_rate',
            'needs_guiding_responses',
        ])
        self.assertItemsEqual(resolved_task_types_by_state_name['C'], [
            'ineffective_feedback_loop',
        ])
        self.assertItemsEqual(resolved_task_types_by_state_name['D'], [
            'high_bounce_rate',
            'needs_guiding_responses',
            'ineffective_feedback_loop',
            'successive_incorrect_answers',
        ])

    def test_ignores_obsolete_tasks(self):
        tasks = [
            self._new_obsolete_task(state_name='State %d' % (i,))
            for i in python_utils.RANGE(50)
        ]
        improvements_services.put_tasks(tasks)
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))

        self.assertEqual(open_tasks, [])
        self.assertEqual(resolved_task_types_by_state_name, {})

    def test_tasks_for_most_recent_version_are_fetched(self):
        tasks = [
            # Version 1 tasks.
            self._new_open_task(
                state_name='A',
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=1),
            self._new_open_task(
                state_name='B',
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=1),
            self._new_open_task(
                state_name='C',
                task_type=improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
                exploration_version=1),
            # Version 2 tasks.
            self._new_open_task(
                state_name='A',
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=2),
            self._new_resolved_task(
                state_name='B',
                task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=2),
            self._new_resolved_task(
                state_name='C',
                task_type=improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
                exploration_version=2),
        ]
        improvements_services.put_tasks(tasks)

        self.exp.version = 2
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))

        self.assertItemsEqual(
            [t.to_dict() for t in open_tasks], [tasks[3].to_dict()])
        self.assertEqual(resolved_task_types_by_state_name, {
            'B': ['high_bounce_rate'],
            'C': ['needs_guiding_responses'],
        })


class FetchTaskHistoryPageTests(ImprovementsServicesTestBase):
    """Unit tests for the fetch_task_history_page function."""

    def setUp(self):
        super(FetchTaskHistoryPageTests, self).setUp()
        timedelta = datetime.timedelta(minutes=5)
        for i in python_utils.RANGE(1, 26):
            task = self._new_obsolete_task(
                state_name='State %d' % (i,), exploration_version=i)
            with self.mock_datetime_utcnow(self.MOCK_DATE + (timedelta * i)):
                task.resolve(self.owner_id)
                task.to_model().put()

    def test_get_first_task_history_page(self):
        task_page, cursor, has_more = (
            improvements_services.fetch_exploration_task_history_page(self.exp))

        self.assertEqual([t.target_id for t in task_page], [
            'State 25', 'State 24', 'State 23', 'State 22', 'State 21',
            'State 20', 'State 19', 'State 18', 'State 17', 'State 16',
        ])
        self.assertTrue(has_more)
        self.assertIsNotNone(cursor)

    def test_get_all_task_history_pages(self):
        aggregated_tasks, cursor, has_more = [], None, True
        while has_more:
            task_page, cursor, has_more = (
                improvements_services.fetch_exploration_task_history_page(
                    self.exp, cursor=cursor))
            aggregated_tasks.extend(task_page)

        self.assertEqual([t.target_id for t in aggregated_tasks], [
            'State 25', 'State 24', 'State 23', 'State 22', 'State 21',
            'State 20', 'State 19', 'State 18', 'State 17', 'State 16',
            'State 15', 'State 14', 'State 13', 'State 12', 'State 11',
            'State 10', 'State 9', 'State 8', 'State 7', 'State 6',
            'State 5', 'State 4', 'State 3', 'State 2', 'State 1',
        ])
        self.assertFalse(has_more)

    def test_get_first_task_history_page_regardless_of_previous_calls(self):
        initial_first_page, second_page_cursor, has_more = (
            improvements_services.fetch_exploration_task_history_page(self.exp))
        self.assertIsNotNone(second_page_cursor)
        self.assertTrue(has_more)
        # Make a call for the second page.
        improvements_services.fetch_exploration_task_history_page(
            self.exp, cursor=second_page_cursor)
        # Make another call for the first page.
        repeated_first_page, repeated_second_page_cursor, repeated_has_more = (
            improvements_services.fetch_exploration_task_history_page(self.exp))

        self.assertEqual(
            [t.to_dict() for t in initial_first_page],
            [t.to_dict() for t in repeated_first_page])
        self.assertEqual(second_page_cursor, repeated_second_page_cursor)
        self.assertEqual(has_more, repeated_has_more)
