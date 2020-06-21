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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import itertools
import operator

from core.domain import improvements_domain
from core.platform import models
import feconf
import python_utils

from google.appengine.datastore import datastore_query

(improvements_models,) = (
    models.Registry.import_models([models.NAMES.improvements]))


def _yield_all_tasks_ordered_by_status(composite_entity_id):
    """Yields all of the tasks corresponding to the given entity in storage.

    Args:
        composite_entity_id: str. The identifier for the specific entity being
            queried. Must be generated from:
            TaskEntryModel.generate_composite_entity_id.

    Yields:
        improvements_domain.TaskEntry. All of the tasks corresponding to the
            given composite_entity_id.
    """
    query = improvements_models.TaskEntryModel.query(
        improvements_models.TaskEntryModel.composite_entity_id ==
        composite_entity_id).order(improvements_models.TaskEntryModel.status)
    cursor, more = (None, True)
    while more:
        results, cursor, more = query.fetch_page(
            feconf.MAX_TASK_MODELS_PER_FETCH, start_cursor=cursor)
        for task_model in results:
            yield get_task_entry_from_model(task_model)


def get_task_entry_from_model(task_entry_model):
    """Returns a domain object corresponding to the given task entry model.

    Args:
        task_entry_model: improvements_models.TaskEntryModel.

    Returns:
        improvements_domain.TaskEntry. The corresponding domain object.
    """
    return improvements_domain.TaskEntry(
        task_entry_model.entity_type, task_entry_model.entity_id,
        task_entry_model.entity_version, task_entry_model.task_type,
        task_entry_model.target_type, task_entry_model.target_id,
        task_entry_model.issue_description, task_entry_model.status,
        task_entry_model.resolver_id, task_entry_model.resolved_on)


def fetch_exploration_tasks(exploration):
    """Returns a tuple encoding the open and resolved tasks corresponding to the
    exploration.

    Args:
        exploration: exp_domain.Exploration.

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
        improvements_models.TaskEntryModel.generate_composite_entity_id(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            exploration.id, exploration.version))
    tasks_grouped_by_status = itertools.groupby(
        _yield_all_tasks_ordered_by_status(composite_entity_id),
        operator.attrgetter('status'))

    open_tasks = []
    resolved_task_types_by_state_name = collections.defaultdict(list)
    for status_group, tasks in tasks_grouped_by_status:
        if status_group == improvements_models.TASK_STATUS_OPEN:
            open_tasks.extend(tasks)
        elif status_group == improvements_models.TASK_STATUS_RESOLVED:
            for t in tasks:
                resolved_task_types_by_state_name[t.target_id].append(
                    t.task_type)
    return open_tasks, dict(resolved_task_types_by_state_name)


def fetch_exploration_task_history_page(exploration, urlsafe_start_cursor=None):
    """Fetches a page from the given exploration's history of resolved tasks.

    Args:
        exploration: exp_domain.Exploration.
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
    start_cursor = (
        urlsafe_start_cursor and
        datastore_query.Cursor(urlsafe=urlsafe_start_cursor))
    results, cursor, more = (
        improvements_models.TaskEntryModel.query(
            improvements_models.TaskEntryModel.entity_type == (
                improvements_models.TASK_ENTITY_TYPE_EXPLORATION),
            improvements_models.TaskEntryModel.entity_id == exploration.id,
            improvements_models.TaskEntryModel.status == (
                improvements_models.TASK_STATUS_RESOLVED))
        .order(-improvements_models.TaskEntryModel.resolved_on)
        .fetch_page(
            feconf.MAX_TASK_MODELS_PER_HISTORY_PAGE, start_cursor=start_cursor))
    return (
        [get_task_entry_from_model(model) for model in results],
        cursor and cursor.urlsafe(),
        more)


def put_tasks(tasks, update_last_updated_time=True):
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
    task_models = improvements_models.TaskEntryModel.get_multi(
        [t.task_id for t in tasks])
    models_to_put = []
    for task, model in python_utils.ZIP(tasks, task_models):
        if model is None:
            models_to_put.append(
                improvements_models.TaskEntryModel(
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
    improvements_models.TaskEntryModel.put_multi(
        models_to_put, update_last_updated_time=update_last_updated_time)


def apply_changes_to_model(task_entry, task_entry_model):
    """Makes changes to the given model when differences are found.

    Args:
        task_entry: improvements_domain.TaskEntry.
        task_entry_model: improvements_models.TaskEntryModel.

    Returns:
        bool. Whether any change was made to the model.
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
