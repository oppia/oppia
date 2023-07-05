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

"""Service functions related to Oppia improvement tasks."""

from __future__ import annotations

import collections
import itertools
import operator

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import improvements_domain
from core.platform import models

from typing import Dict, Iterator, List, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import improvements_models

(improvements_models,) = (
    models.Registry.import_models([models.Names.IMPROVEMENTS])
)
datastore_services = models.Registry.import_datastore_services()


def _yield_all_tasks_ordered_by_status(
    composite_entity_id: str
) -> Iterator[improvements_domain.TaskEntry]:
    """Yields all of the tasks corresponding to the given entity in storage.

    Args:
        composite_entity_id: str. The identifier for the specific entity being
            queried. Must be generated from:
            ExplorationStatsTaskEntryModel.generate_composite_entity_id.

    Yields:
        improvements_domain.TaskEntry. All of the tasks corresponding to the
        given composite_entity_id.
    """
    model_class = improvements_models.ExplorationStatsTaskEntryModel
    results: Sequence[improvements_models.ExplorationStatsTaskEntryModel] = []
    query = model_class.query(
        model_class.composite_entity_id == composite_entity_id
    ).order(model_class.status)
    cursor, more = (None, True)
    while more:
        results, cursor, more = query.fetch_page(
            feconf.MAX_TASK_MODELS_PER_FETCH, start_cursor=cursor
        )
        for task_model in results:
            yield get_task_entry_from_model(task_model)


def get_task_entry_from_model(
    task_entry_model: improvements_models.ExplorationStatsTaskEntryModel
) -> improvements_domain.TaskEntry:
    """Returns a domain object corresponding to the given task entry model.

    Args:
        task_entry_model: improvements_models.ExplorationStatsTaskEntryModel.
            The task entry model to get the corresponding domain object.

    Returns:
        improvements_domain.TaskEntry. The corresponding domain object.
    """
    return improvements_domain.TaskEntry(
        task_entry_model.entity_type, task_entry_model.entity_id,
        task_entry_model.entity_version, task_entry_model.task_type,
        task_entry_model.target_type, task_entry_model.target_id,
        task_entry_model.issue_description, task_entry_model.status,
        task_entry_model.resolver_id, task_entry_model.resolved_on)


def fetch_exploration_tasks(
    exploration: exp_domain.Exploration
) -> Tuple[List[improvements_domain.TaskEntry], Dict[str, List[str]]]:
    """Returns a tuple encoding the open and resolved tasks corresponding to the
    exploration.

    Args:
        exploration: exp_domain.Exploration. The exploration to fetch tasks for.

    Returns:
        tuple. Contains the following 2 items:
            open_tasks: list(improvements_domain.TaskEntry). The list of open
                tasks.
            resolved_task_types_by_state_name: dict(str: list(str)). Maps state
                names to the types of resolved tasks corresponding to them, if
                any. Absent state names imply that the state has no resolved
                tasks.
    """
    composite_entity_id = (
        improvements_models.ExplorationStatsTaskEntryModel
        .generate_composite_entity_id(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            exploration.id,
            exploration.version
        )
    )
    tasks_grouped_by_status = itertools.groupby(
        _yield_all_tasks_ordered_by_status(composite_entity_id),
        operator.attrgetter('status'))

    open_tasks: List[improvements_domain.TaskEntry] = []
    resolved_task_types_by_state_name = collections.defaultdict(list)
    for status_group, tasks in tasks_grouped_by_status:
        if status_group == constants.TASK_STATUS_OPEN:
            open_tasks.extend(tasks)
        elif status_group == constants.TASK_STATUS_RESOLVED:
            for t in tasks:
                resolved_task_types_by_state_name[t.target_id].append(
                    t.task_type)
    return open_tasks, dict(resolved_task_types_by_state_name)


def fetch_exploration_task_history_page(
    exploration: exp_domain.Exploration,
    urlsafe_start_cursor: Optional[str] = None
) -> Tuple[List[improvements_domain.TaskEntry], Optional[str], bool]:
    """Fetches a page from the given exploration's history of resolved tasks.

    Args:
        exploration: exp_domain.Exploration. The exploration to fetch the
            history page for.
        urlsafe_start_cursor: str or None. Starting point for the search. When
            None, the starting point is the very beginning of the history
            results (i.e. starting from the most recently resolved task entry).

    Returns:
        tuple. Contains the following 3 items:
            results: list(improvements_domain.TaskEntry). The query results.
            urlsafe_cursor: str or None. a query cursor pointing to the "next"
                batch of results. If there are no more results, this might be
                None.
            more: bool. Indicates whether there are (likely) more results after
                this batch. If False, there are no more results; if True, there
                are probably more results.
    """
    model_class = improvements_models.ExplorationStatsTaskEntryModel
    results: Sequence[improvements_models.ExplorationStatsTaskEntryModel] = []
    start_cursor = (
        datastore_services.make_cursor(urlsafe_cursor=urlsafe_start_cursor)
        if urlsafe_start_cursor else None
    )
    results, cursor, more = model_class.query(
        model_class.entity_type == constants.TASK_ENTITY_TYPE_EXPLORATION,
        model_class.entity_id == exploration.id,
        model_class.status == constants.TASK_STATUS_RESOLVED
    ).order(
        -model_class.resolved_on
    ).fetch_page(
        feconf.MAX_TASK_MODELS_PER_HISTORY_PAGE, start_cursor=start_cursor
    )
    # The urlsafe returns bytes and we need to decode them to string.
    return (
        [get_task_entry_from_model(model) for model in results],
        cursor.urlsafe().decode('utf-8') if cursor else None,
        more
    )


def put_tasks(
    tasks: List[improvements_domain.TaskEntry],
    update_last_updated_time: bool = True
) -> None:
    """Puts each of the given tasks into storage if necessary, conditionally
    updating their last updated time.

    If the values of a task are the same as the corresponding model in storage,
    then that model will not be updated as part of the put operation.

    Args:
        tasks: list(improvements_domain.TaskEntry). Domain objects for each task
            being placed into storage.
        update_last_updated_time: bool. Whether to update the last_updated field
            of the task models.
    """
    task_models = improvements_models.ExplorationStatsTaskEntryModel.get_multi(
        [t.task_id for t in tasks])
    models_to_put = []
    for task, model in zip(tasks, task_models):
        if model is None:
            models_to_put.append(
                improvements_models.ExplorationStatsTaskEntryModel(
                    id=task.task_id,
                    composite_entity_id=task.composite_entity_id,
                    entity_type=task.entity_type,
                    entity_id=task.entity_id,
                    entity_version=task.entity_version,
                    task_type=task.task_type,
                    target_type=task.target_type,
                    target_id=task.target_id,
                    issue_description=task.issue_description,
                    status=task.status,
                    resolver_id=task.resolver_id,
                    resolved_on=task.resolved_on))
        elif apply_changes_to_model(task, model):
            models_to_put.append(model)
    improvements_models.ExplorationStatsTaskEntryModel.update_timestamps_multi(
        models_to_put, update_last_updated_time=update_last_updated_time)
    improvements_models.ExplorationStatsTaskEntryModel.put_multi(models_to_put)


def apply_changes_to_model(
    task_entry: improvements_domain.TaskEntry,
    task_entry_model: improvements_models.ExplorationStatsTaskEntryModel
) -> bool:
    """Makes changes to the given model when differences are found.

    Args:
        task_entry: improvements_domain.TaskEntry. The TaskEntry domain object
            to be check if changes made to the TaskEntry model.
        task_entry_model: improvements_models.ExplorationStatsTaskEntryModel.
            The TaskEntry model object to be compared with TaskEntry domain
            object.

    Returns:
        bool. Whether any change was made to the model.

    Raises:
        Exception. Wrong model provided.
    """
    if task_entry_model.id != task_entry.task_id:
        raise Exception('Wrong model provided')
    changes_were_made_to_model = False
    if task_entry_model.issue_description != task_entry.issue_description:
        task_entry_model.issue_description = task_entry.issue_description
        changes_were_made_to_model = True
    if task_entry_model.status != task_entry.status:
        task_entry_model.status = task_entry.status
        task_entry_model.resolver_id = task_entry.resolver_id
        task_entry_model.resolved_on = task_entry.resolved_on
        changes_were_made_to_model = True
    return changes_were_made_to_model
