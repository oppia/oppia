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

"""One off jobs related to Oppia improvement tasks."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import collections

from core.domain import prod_validation_jobs_one_off
from core.platform import models
import feconf
import python_utils

exp_models, impv_models = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.improvements])


def _get_task_status_errors(task):
    """Yields error messages related to status for the task."""
    if task.status == impv_models.STATUS_OPEN:
        if task.closed_by:
            yield 'task is open but closed_by user is %s' % task.closed_by
        if task.closed_on:
            yield 'task is open but closed_on date is %s' % task.closed_on
        if task.entity_version_end:
            yield 'task is open but entity_version_end is %s' % (
                task.entity_version_end)
    elif task.status == impv_models.STATUS_RESOLVED:
        if not task.closed_by:
            yield 'task is resolved but closed_by user is empty'
        if not task.closed_on:
            yield 'task is resolved but closed_on date is empty'
        if not task.entity_version_end:
            yield 'task is resolved but entity_version_end is unbounded'
    elif task.status == impv_models.STATUS_DEPRECATED:
        if not task.closed_on:
            yield 'task is deprecated but closed_on date is empty'
        if not task.entity_version_end:
            yield 'task is deprecated but entity_version_end is unbounded'


def _get_target_type_errors(task):
    """Yields error messages related to target_type for the task."""
    entity_type_targets = impv_models.ENTITY_TYPE_TARGETS[task.entity_type]
    if task.target_type and task.target_type not in entity_type_targets:
        yield 'invalid target_type for %s entity: %s' % (
            task.entity_type, task.target_type)
    elif not task.target_type and task.target_id:
        yield 'target_type is empty, but target_id is %s' % task.target_id
    elif task.target_type and not task.target_id:
        yield 'target_type is %s, but target_id is empty' % task.target_type


def _target_exists(entity, target_type, target_id):
    """Checks whether the given target exists in the entity."""
    if isinstance(entity, exp_models.ExplorationModel):
        # Returning with this style allows us to hit 100% code coverage.
        if target_type == 'state' and target_id in entity.states:
            return True
    return False


def _get_target_id_errors(task, versioned_entities):
    """Yields error messages related to target_id for the task."""
    entity_type_targets = impv_models.ENTITY_TYPE_TARGETS[task.entity_type]
    if task.target_id is None or task.target_type not in entity_type_targets:
        return

    for entity in versioned_entities:
        if not _target_exists(entity, task.target_type, task.target_id):
            yield '%s{id: %s} does not exist at version %s' % (
                task.target_type, task.target_id, entity.version)


class TaskEntryModelAuditOneOffJob(
        prod_validation_jobs_one_off.ProdValidationAuditOneOffJob):
    """One off job for auditing task entries."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """This job validates TaskEntryModel instances."""
        return [impv_models.TaskEntryModel]

    @staticmethod
    def map(task):
        task_key = 'task{id: %s}' % task.id
        entity_key = '%s{id: %s}' % (task.entity_type, task.entity_id)

        # ENTITY_TYPE_ERROR check: unrecoverable.
        if task.entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            entity_cls = exp_models.ExplorationModel
        else:
            entity_type_error = 'unsupported entity_type: %s' % task.entity_type
            yield ('ENTITY_TYPE_ERROR', (task_key, entity_type_error))
            return

        # ENTITY_ID_ERROR check: unrecoverable.
        if task.entity_version_end is not None:
            version_end = task.entity_version_end
        else:
            latest_entity = entity_cls.get(task.entity_id, strict=False)
            if latest_entity is not None:
                version_end = latest_entity.version + 1
            else:
                entity_id_error = '%s does not exist' % entity_key
                yield ('ENTITY_ID_ERROR', (task_key, entity_id_error))
                return

        # ENTITY_VERSION_ERROR check: unrecoverable.
        if task.entity_version_start < version_end:
            version_range = list(
                python_utils.RANGE(task.entity_version_start, version_end))
            try:
                versioned_entities = entity_cls.get_multi_versions(
                    task.entity_id, version_range)
            except Exception:
                entity_version_error = (
                    '%s is not valid in the version range: [%s, %s)' % (
                        entity_key, task.entity_version_start, version_end))
                yield ('ENTITY_VERSION_ERROR', (task_key, entity_version_error))
                return
        else:
            if task.entity_version_start == version_end:
                entity_version_error = 'empty range: [%s, %s)' % (
                    task.entity_version_start, version_end)
            else:
                entity_version_error = 'invalid range: [%s, %s)' % (
                    task.entity_version_start, version_end)
            yield ('ENTITY_VERSION_ERROR', (task_key, entity_version_error))
            return

        # Recoverable checks.
        for version in version_range:
            yield ('ENTITY_VERSION_COLLISION', (task_key, version))
        for task_status_error in _get_task_status_errors(task):
            yield ('TASK_STATUS_ERROR', (task_key, task_status_error))
        for target_type_error in _get_target_type_errors(task):
            yield ('TARGET_TYPE_ERROR', (task_key, target_type_error))
        for target_id_error in _get_target_id_errors(task, versioned_entities):
            yield ('TARGET_ID_ERROR', (task_key, target_id_error))

    @staticmethod
    def reduce(group, task_key_value_pairs):
        """Checks that the given entity contains the expected relationships."""
        task_key_values = collections.defaultdict(list)
        for task_key_value_pair in task_key_value_pairs:
            task_key, value = ast.literal_eval(task_key_value_pair)
            task_key_values[task_key].append(value)

        if group == 'ENTITY_VERSION_COLLISION':
            version_coverage = collections.defaultdict(list)
            for task_key, versions in task_key_values.items():
                for version in versions:
                    version_coverage[version].append(task_key)

            task_key_values.clear()
            for version, task_keys in version_coverage.items():
                if len(task_keys) > 1:
                    for task_key in task_keys:
                        task_key_values[task_key].append(
                            'collision at version %s' % version)

        for task_key, values in task_key_values.items():
            for value in values:
                yield '%s at %s: %s' % (group, task_key, value)
