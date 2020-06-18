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

(improvements_models,) = (
    models.Registry.import_models([models.NAMES.improvements]))

_MODEL = improvements_models.TaskEntryModel


def _yield_all_tasks_ordered_by_status(composite_entity_id):
    """Yields all tasks corresponding to the given entity in storage."""
    query = _MODEL.query(
        _MODEL.composite_entity_id == composite_entity_id).order(_MODEL.status)
    cursor, has_more = (None, True)
    while has_more:
        task_models, cursor, has_more = query.fetch_page(
            feconf.MAX_TASK_MODELS_PER_FETCH, start_cursor=cursor)
        for task_model in task_models:
            yield improvements_domain.TaskEntry.from_model(task_model)


def fetch_exploration_tasks(exploration):
    """Returns a dict describing all tasks for the given versioned exploration.

    Args:
        exploration: exp_domain.Exploration.

    Returns:
        tuple. Contains the following two items:
            open_tasks: list(improvements_domain.TaskEntry). The list of the
                tasks which are open.
            resolved_task_types_by_state_name: dict(str: list(str)). Maps state
                names to the list of resolved task types. Absent keys imply that
                the state has no resolved tasks.
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
    return (open_tasks, dict(resolved_task_types_by_state_name))


def fetch_exploration_task_history_page(exploration, cursor=None):
    """Fetches a page of tasks from the provided entity's history of tasks.

    Args:
        exploration: exp_domain.Exploration.
        cursor: *. Starting point for search. When None, the starting point is
            the very beginning of the history results.

    Returns:
        tuple. Contains the following three items:
            results: list. The query results.
            cursor: a query cursor pointing to the "next" batch of results. If
                there are no more results, this might be None.
            more: bool. Indicates whether there are (likely) more results after
                this batch. If False, there are no more results; if True, there
                are probably more results.
    """
    return (
        _MODEL.query(
            _MODEL.entity_type == (
                improvements_models.TASK_ENTITY_TYPE_EXPLORATION),
            _MODEL.entity_id == exploration.id,
            _MODEL.status == improvements_models.TASK_STATUS_RESOLVED)
        .order(-_MODEL.last_updated)
        .fetch_page(
            feconf.MAX_TASK_MODELS_PER_HISTORY_PAGE, start_cursor=cursor))


def put_tasks(tasks, update_last_updated_time=True):
    """Puts each of the given tasks into storage, optionally updating their last
    updated time.

    Args:
        tasks: list(improvements_domain.TaskEntry). Domain object instances for
            each task to be placed into stored.
        update_last_updated_time: bool. Whether to update the last_updated field
            of the task models.
    """
    task_models = _MODEL.get_multi([t.task_id for t in tasks])
    for i, (task, model) in enumerate(python_utils.ZIP(tasks, task_models)):
        if model is None:
            task_models[i] = task.to_model()
        elif not task.apply_changes(model):
            task_models[i] = None
    _MODEL.put_multi(
        [m for m in task_models if m is not None],
        update_last_updated_time=update_last_updated_time)
