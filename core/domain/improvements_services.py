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


def _yield_all_tasks_ordered_by_status(entity_type, entity_id, entity_version):
    """Yields all tasks in storage corresponding to the given entity."""
    query = _MODEL.query(
        _MODEL.composite_entity_id == _MODEL.generate_composite_entity_id(
            entity_type, entity_id, entity_version)).order(_MODEL.status)
    cursor, has_more = None, True
    while has_more:
        task_models, cursor, has_more = query.fetch_page(
            feconf.MAX_TASK_MODELS_PER_FETCH, start_cursor=cursor)
        for task_model in task_models:
            yield improvements_domain.TaskEntry.from_model(task_model)


def fetch_exploration_improvements_tasks(exp):
    """Returns a dict describing all tasks for the given versioned exploration.

    Args:
        exp: exp_domain.Exploration.

    Returns:
        dict. Contains the following keys:
            open_tasks: list(dict). A list of the dict representations of each
                open task.
            resolved_task_types_by_state_name: dict(str: list(str)). Maps state
                names to a list of resolved task types. Absent keys imply that
                the state has no resolved tasks.
    """
    tasks_grouped_by_status = itertools.groupby(
        _yield_all_tasks_ordered_by_status(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION, exp.id, exp.version),
        operator.attrgetter('status'))

    open_tasks = []
    resolved_task_types_by_state_name = collections.defaultdict(list)
    for tasks, status in tasks_grouped_by_status:
        if status == improvements_models.TASK_STATUS_OPEN:
            open_tasks.extend(tasks)
        elif status == improvements_models.TASK_STATUS_RESOLVED:
            for t in tasks:
                resolved_task_types_by_state_name[t.target_id].append(
                    t.task_type)
    return {
        'open_tasks': [t.to_dict() for t in open_tasks],
        'resolved_task_types_by_state_name': resolved_task_types_by_state_name,
    }


def fetch_improvements_task_history_page(entity_type, entity_id, cursor=None):
    return (
        _MODEL.query(
            _MODEL.entity_type == entity_type,
            _MODEL.entity_id == entity_id,
            _MODEL.status == improvements_models.TASK_STATUS_RESOLVED)
        .order(-_MODEL.last_updated)
        .fetch_page(
            feconf.MAX_TASK_MODELS_PER_HISTORY_PAGE, start_cursor=cursor))


def put_tasks(tasks, update_last_updated_time=True):
    _MODEL.put_multi([
        model if model is not None else task.to_model()
        for task, model in python_utils.ZIP(
            tasks, _MODEL.get_multi([t.task_id for t in tasks]))
    ], update_last_updated_time=update_last_updated_time)
