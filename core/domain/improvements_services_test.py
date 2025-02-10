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

"""Unit tests for service functions related to Oppia improvement tasks."""

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.domain import improvements_domain
from core.domain import improvements_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import improvements_models

(improvements_models,) = (
    models.Registry.import_models([models.Names.IMPROVEMENTS]))


class ImprovementsServicesTestBase(test_utils.GenericTestBase):
    """Base class with helper methods for the improvements_services tests."""

    EXP_ID: Final = 'eid'
    MOCK_DATE: Final = datetime.datetime(2020, 6, 15)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp = self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        # Necessary to provide sufficient debug information when failures occur.
        self.maxDiff = None

    def _new_obsolete_task(
        self,
        state_name: str = feconf.DEFAULT_INIT_STATE_NAME,
        task_type: str = constants.TASK_TYPE_HIGH_BOUNCE_RATE,
        exploration_version: int = 1
    ) -> improvements_domain.TaskEntry:
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
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_ID,
            entity_version=exploration_version,
            task_type=task_type,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id=state_name,
            issue_description='issue description',
            status=constants.TASK_STATUS_OBSOLETE,
            resolver_id=None,
            resolved_on=None)

    def _new_open_task(
        self,
        state_name: str = feconf.DEFAULT_INIT_STATE_NAME,
        task_type: str = constants.TASK_TYPE_HIGH_BOUNCE_RATE,
        exploration_version: int = 1
    ) -> improvements_domain.TaskEntry:
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
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_ID,
            entity_version=exploration_version,
            task_type=task_type,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id=state_name,
            issue_description='issue description',
            status=constants.TASK_STATUS_OPEN,
            resolver_id=None,
            resolved_on=None)

    def _new_resolved_task(
        self,
        state_name: str = feconf.DEFAULT_INIT_STATE_NAME,
        task_type: str = constants.TASK_TYPE_HIGH_BOUNCE_RATE,
        exploration_version: int = 1
    ) -> improvements_domain.TaskEntry:
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
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_ID,
            entity_version=exploration_version,
            task_type=task_type,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id=state_name,
            issue_description='issue description',
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id=self.owner_id,
            resolved_on=self.MOCK_DATE)


class GetTaskEntryFromModelTests(ImprovementsServicesTestBase):
    """Unit tests for the get_task_entry_from_model function."""

    def test_returns_same_fields_as_model(self) -> None:
        task_id = improvements_models.ExplorationStatsTaskEntryModel.create(
            constants.TASK_ENTITY_TYPE_EXPLORATION, self.EXP_ID, 1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME, 'issue description',
            constants.TASK_STATUS_RESOLVED, self.owner_id,
            self.MOCK_DATE)
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(task_id))
        task_entry = (
            improvements_services.get_task_entry_from_model(task_entry_model))

        self.assertEqual(task_entry.task_id, task_entry_model.id)
        self.assertEqual(
            task_entry.composite_entity_id,
            task_entry_model.composite_entity_id)
        self.assertEqual(task_entry.entity_type, task_entry_model.entity_type)
        self.assertEqual(
            task_entry.entity_version, task_entry_model.entity_version)
        self.assertEqual(task_entry.task_type, task_entry_model.task_type)
        self.assertEqual(task_entry.target_type, task_entry_model.target_type)
        self.assertEqual(task_entry.target_id, task_entry_model.target_id)
        self.assertEqual(
            task_entry.issue_description, task_entry_model.issue_description)
        self.assertEqual(task_entry.status, task_entry_model.status)
        self.assertEqual(task_entry.resolver_id, task_entry_model.resolver_id)
        self.assertEqual(task_entry.resolved_on, task_entry_model.resolved_on)


class FetchExplorationTasksTests(ImprovementsServicesTestBase):
    """Unit tests for the fetch_exploration_tasks function."""

    def test_fetch_when_no_models_exist(self) -> None:
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))
        self.assertEqual(open_tasks, [])
        self.assertEqual(resolved_task_types_by_state_name, {})

    def test_fetch_when_number_of_open_tasks_exceed_single_fetch_limit(
        self
    ) -> None:
        tasks = [
            self._new_open_task(state_name='State %d' % (i,))
            for i in range(int(feconf.MAX_TASK_MODELS_PER_FETCH * 2.5))
        ]
        improvements_services.put_tasks(tasks)
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))

        self.assertEqual(resolved_task_types_by_state_name, {})
        self.assertItemsEqual(
            [t.to_dict() for t in tasks],
            [t.to_dict() for t in open_tasks])

    def test_fetch_identifies_the_resolved_tasks_of_each_state(self) -> None:
        tasks = [
            self._new_resolved_task(
                state_name='A',
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE),
            self._new_resolved_task(
                state_name='B',
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE),
            self._new_resolved_task(
                state_name='B',
                task_type=(
                    constants.TASK_TYPE_NEEDS_GUIDING_RESPONSES)),
            self._new_resolved_task(
                state_name='C',
                task_type=(
                    constants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP)),
            self._new_resolved_task(
                state_name='D',
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE),
            self._new_resolved_task(
                state_name='D',
                task_type=(
                    constants.TASK_TYPE_NEEDS_GUIDING_RESPONSES)),
            self._new_resolved_task(
                state_name='D',
                task_type=(
                    constants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP)),
            self._new_resolved_task(
                state_name='D',
                task_type=(
                    constants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS))
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
        self.assertItemsEqual(
            resolved_task_types_by_state_name['A'], ['high_bounce_rate'])
        self.assertItemsEqual(
            resolved_task_types_by_state_name['B'], [
                'high_bounce_rate',
                'needs_guiding_responses',
            ])
        self.assertItemsEqual(
            resolved_task_types_by_state_name['C'], [
                'ineffective_feedback_loop',
            ])
        self.assertItemsEqual(
            resolved_task_types_by_state_name['D'], [
                'high_bounce_rate',
                'needs_guiding_responses',
                'ineffective_feedback_loop',
                'successive_incorrect_answers',
            ])

    def test_fetch_ignores_obsolete_tasks(self) -> None:
        tasks = [
            self._new_obsolete_task(state_name='State %d' % (i,))
            for i in range(50)
        ]
        improvements_services.put_tasks(tasks)
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))

        self.assertEqual(open_tasks, [])
        self.assertEqual(resolved_task_types_by_state_name, {})

    def test_fetch_only_returns_tasks_for_the_given_exploration_version(
        self
    ) -> None:
        tasks = [
            # Version 1 tasks.
            self._new_open_task(
                state_name='A',
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=1),
            self._new_open_task(
                state_name='B',
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=1),
            self._new_open_task(
                state_name='C',
                task_type=constants.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
                exploration_version=1),
            # Version 2 tasks.
            self._new_open_task(
                state_name='A',
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=2),
            self._new_resolved_task(
                state_name='B',
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                exploration_version=2),
            self._new_resolved_task(
                state_name='C',
                task_type=constants.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
                exploration_version=2),
        ]
        improvements_services.put_tasks(tasks)

        self.exp.version = 2
        open_tasks, resolved_task_types_by_state_name = (
            improvements_services.fetch_exploration_tasks(self.exp))

        self.assertItemsEqual(
            [t.to_dict() for t in open_tasks], [tasks[3].to_dict()])
        self.assertEqual(
            resolved_task_types_by_state_name, {
                'B': ['high_bounce_rate'],
                'C': ['needs_guiding_responses'],
            })


class FetchExplorationTaskHistoryPageTests(ImprovementsServicesTestBase):
    """Unit tests for the fetch_exploration_task_history_page function."""

    def setUp(self) -> None:
        super().setUp()
        task_entries = []
        for i in range(1, 26):
            task_entry = self._new_resolved_task(
                state_name='State %d' % (i,), exploration_version=i)
            task_entry.resolved_on = (
                self.MOCK_DATE + datetime.timedelta(minutes=5 * i))

            task_entries.append(task_entry)
        improvements_services.put_tasks(
            task_entries, update_last_updated_time=False)

    def test_fetch_returns_first_page_of_history(self) -> None:
        results, cursor, more = (
            improvements_services.fetch_exploration_task_history_page(self.exp))

        self.assertEqual([t.target_id for t in results], [
            'State 25', 'State 24', 'State 23', 'State 22', 'State 21',
            'State 20', 'State 19', 'State 18', 'State 17', 'State 16',
        ])
        self.assertTrue(more)
        self.assertIsNotNone(cursor)

    def test_fetch_until_no_more_pages_returns_every_resolved_task(
        self
    ) -> None:
        aggregated_tasks, cursor, more = [], None, True
        while more:
            results, cursor, more = (
                improvements_services.fetch_exploration_task_history_page(
                    self.exp, urlsafe_start_cursor=cursor))
            aggregated_tasks.extend(results)

        self.assertEqual([t.target_id for t in aggregated_tasks], [
            'State 25', 'State 24', 'State 23', 'State 22', 'State 21',
            'State 20', 'State 19', 'State 18', 'State 17', 'State 16',
            'State 15', 'State 14', 'State 13', 'State 12', 'State 11',
            'State 10', 'State 9', 'State 8', 'State 7', 'State 6',
            'State 5', 'State 4', 'State 3', 'State 2', 'State 1',
        ])
        self.assertFalse(more)

    def test_fetch_first_page_after_fetching_next_page_returns_same_results(
        self
    ) -> None:
        initial_results, initial_cursor, initial_more = (
            improvements_services.fetch_exploration_task_history_page(self.exp))
        self.assertIsNotNone(initial_cursor)
        self.assertTrue(initial_more)
        # Make a call for the second page.
        improvements_services.fetch_exploration_task_history_page(
            self.exp, urlsafe_start_cursor=initial_cursor)
        # Make another call for the first page.
        subsequent_results, subsequent_cursor, subsequent_more = (
            improvements_services.fetch_exploration_task_history_page(self.exp))

        self.assertEqual(
            [t.to_dict() for t in initial_results],
            [t.to_dict() for t in subsequent_results])
        self.assertEqual(initial_cursor, subsequent_cursor)
        self.assertEqual(initial_more, subsequent_more)


class PutTasksTests(ImprovementsServicesTestBase):
    """Unit tests for the put_tasks function."""

    def test_put_for_task_entries_which_do_not_exist_creates_new_models(
        self
    ) -> None:
        open_task = self._new_open_task(state_name='Start')
        obsolete_task = self._new_obsolete_task(state_name='Middle')
        resolved_task = self._new_resolved_task(state_name='End')

        improvements_services.put_tasks(
            [open_task, obsolete_task, resolved_task])

        open_task_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                open_task.task_id))
        obsolete_task_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                obsolete_task.task_id))
        resolved_task_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                resolved_task.task_id))

        open_task_entry = improvements_services.get_task_entry_from_model(
            open_task_model)
        obsolete_task_entry = improvements_services.get_task_entry_from_model(
            obsolete_task_model)
        resolved_task_entry = improvements_services.get_task_entry_from_model(
            resolved_task_model)
        self.assertEqual(open_task.to_dict(), open_task_entry.to_dict())
        self.assertEqual(
            obsolete_task.to_dict(),
            obsolete_task_entry.to_dict())
        self.assertEqual(
            resolved_task.to_dict(),
            resolved_task_entry.to_dict())

    def test_put_for_tasks_entries_which_exist_updates_the_models(self) -> None:
        task_entry = self._new_open_task()
        created_on = datetime.datetime(2020, 6, 15, 5)
        updated_on = created_on + datetime.timedelta(minutes=5)

        with self.mock_datetime_utcnow(created_on):
            improvements_services.put_tasks([task_entry])

        model = improvements_models.ExplorationStatsTaskEntryModel.get(
            task_entry.task_id)
        self.assertEqual(model.resolver_id, None)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

        task_entry = self._new_resolved_task()

        with self.mock_datetime_utcnow(updated_on):
            improvements_services.put_tasks([task_entry])

        model = improvements_models.ExplorationStatsTaskEntryModel.get(
            task_entry.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, updated_on)

    def test_put_for_task_entries_that_are_not_changing_does_nothing(
        self
    ) -> None:
        task_entry = self._new_resolved_task()
        created_on = datetime.datetime(2020, 6, 15, 5)
        updated_on = created_on + datetime.timedelta(minutes=5)

        with self.mock_datetime_utcnow(created_on):
            improvements_services.put_tasks([task_entry])

        model = improvements_models.ExplorationStatsTaskEntryModel.get(
            task_entry.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

        with self.mock_datetime_utcnow(updated_on):
            improvements_services.put_tasks([task_entry])

        model = improvements_models.ExplorationStatsTaskEntryModel.get(
            task_entry.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

    def test_put_for_updated_task_entries_without_changing_last_updated(
        self
    ) -> None:
        task_entry = self._new_open_task()
        created_on = datetime.datetime(2020, 6, 15, 5)
        updated_on = created_on + datetime.timedelta(minutes=5)

        with self.mock_datetime_utcnow(created_on):
            improvements_services.put_tasks([task_entry])

        model = improvements_models.ExplorationStatsTaskEntryModel.get(
            task_entry.task_id)
        self.assertEqual(model.resolver_id, None)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)

        task_entry = self._new_resolved_task()

        with self.mock_datetime_utcnow(updated_on):
            improvements_services.put_tasks(
                [task_entry], update_last_updated_time=False)

        model = improvements_models.ExplorationStatsTaskEntryModel.get(
            task_entry.task_id)
        self.assertEqual(model.resolver_id, self.owner_id)
        self.assertEqual(model.created_on, created_on)
        self.assertEqual(model.last_updated, created_on)


class ApplyChangesToModelTests(ImprovementsServicesTestBase):
    """Unit tests for the apply_changes_to_model function."""

    def test_passing_mismatching_task_entries_raises_an_exception(self) -> None:
        task_entry = self._new_open_task()
        improvements_services.put_tasks([task_entry])
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                task_entry.task_id))
        task_entry.target_id = 'Different State'

        with self.assertRaisesRegex(Exception, 'Wrong model provided'):
            improvements_services.apply_changes_to_model(
                task_entry, task_entry_model)

    def test_returns_false_when_task_is_equalivalent_to_model(self) -> None:
        task_entry = self._new_open_task()
        improvements_services.put_tasks([task_entry])
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                task_entry.task_id))

        self.assertFalse(
            improvements_services.apply_changes_to_model(
                task_entry, task_entry_model))

    def test_makes_changes_when_issue_description_is_different(self) -> None:
        task_entry = self._new_open_task()
        improvements_services.put_tasks([task_entry])
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                task_entry.task_id))
        task_entry.issue_description = 'new issue description'

        self.assertTrue(
            improvements_services.apply_changes_to_model(
                task_entry, task_entry_model))
        self.assertEqual(
            task_entry_model.issue_description, 'new issue description')

    def test_makes_changes_to_status_related_fields_if_status_is_different(
        self
    ) -> None:
        task_entry = self._new_open_task()
        improvements_services.put_tasks([task_entry])
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                task_entry.task_id))
        task_entry = self._new_resolved_task()

        self.assertTrue(
            improvements_services.apply_changes_to_model(
                task_entry, task_entry_model))
        self.assertEqual(
            task_entry_model.status, constants.TASK_STATUS_RESOLVED)
        self.assertEqual(task_entry_model.resolver_id, self.owner_id)
        self.assertEqual(task_entry_model.resolved_on, self.MOCK_DATE)

    def test_no_changes_made_if_only_resolver_id_is_different(self) -> None:
        task_entry = self._new_open_task()
        improvements_services.put_tasks([task_entry])
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                task_entry.task_id))
        task_entry.resolver_id = self.owner_id

        self.assertFalse(
            improvements_services.apply_changes_to_model(
                task_entry, task_entry_model))
        self.assertEqual(
            task_entry_model.status, constants.TASK_STATUS_OPEN)
        self.assertIsNone(task_entry_model.resolver_id)
        self.assertIsNone(task_entry_model.resolved_on)

    def test_no_changes_made_if_only_resolved_on_is_different(self) -> None:
        task_entry = self._new_open_task()
        improvements_services.put_tasks([task_entry])
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                task_entry.task_id))
        # Here we use MyPy ignore because `resolved_on` can only accept
        # datetime values but for testing purposes here we are providing
        # string value which causes MyPy to throw an error. Thus to avoid
        # the error, we used ignore here.
        task_entry.resolved_on = self.owner_id  # type: ignore[assignment]

        self.assertFalse(
            improvements_services.apply_changes_to_model(
                task_entry, task_entry_model))
        self.assertEqual(
            task_entry_model.status, constants.TASK_STATUS_OPEN)
        self.assertIsNone(task_entry_model.resolved_on)
        self.assertIsNone(task_entry_model.resolved_on)
