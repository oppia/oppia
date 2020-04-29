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

"""One off jobs for Oppia improvements."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import collections

from core.domain import prod_validation_jobs_one_off
from core.platform import models
import feconf
import python_utils

exp_models, imps_models = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.improvements])

_ENTITY_TYPE_MODELS = {
    feconf.ENTITY_TYPE_EXPLORATION: exp_models.ExplorationModel
}


def _target_exists(entity, target_type, target_id):
    """Checks whether the given target exists in the entity."""
    if isinstance(entity, exp_models.ExplorationModel):
        # Returning with this style allows us to hit 100% code coverage.
        if target_type == 'state' and target_id in entity.to_dict()['states']:
            return True
    return False


class TaskEntryModelAuditOneOffJob(
        prod_validation_jobs_one_off.ProdValidationAuditOneOffJob):
    """One off job for auditing task entries."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """This job validates TaskEntryModel instances."""
        return [imps_models.TaskEntryModel]

    @staticmethod
    def map(task):
        task_key = 'task{id:%s}' % task.id

        def _map_each(**group_messages):
            """Convienience function to build many reduce calls.

            Args:
                **group_messages: dict(str : list(*)). Defines the group keys of
                    each call, and the values sent alongside the task's ID.

            Yields:
                tuple(str, tuple(str, *)).
            """
            for group, messages in group_messages.items():
                for message in messages:
                    if not message:
                        continue
                    yield (group.upper(), (task_key, message))

        entity_cls = _ENTITY_TYPE_MODELS[task.entity_type]
        entity_key = '%s{id:%s}' % (task.entity_type, task.entity_id)

        if task.entity_version_end is not None:
            version_end = task.entity_version_end
        else:
            latest_entity = entity_cls.get(task.entity_id, strict=False)
            if latest_entity is not None:
                version_end = latest_entity.version + 1
            else:
                entity_id_error = '%s does not exist' % entity_key
                for y in _map_each(entity_id_error=[entity_id_error]):
                    yield y
                return

        if task.entity_version_start < version_end:
            version_range = list(
                python_utils.RANGE(task.entity_version_start, version_end))
        else:
            entity_version_error = 'invalid range: [%s, %s)' % (
                task.entity_version_start, version_end)
            for y in _map_each(entity_version_error=[entity_version_error]):
                yield y
            return

        try:
            versioned_entities = (
                entity_cls.get_multi_versions(task.entity_id, version_range))
        except Exception as e:
            entity_id_error = '%s' % e
            for y in _map_each(entity_id_error=[entity_id_error]):
                yield y
            return

        entity_type_targets = imps_models.ENTITY_TYPE_TARGETS[task.entity_type]
        if task.target_type and task.target_id:
            if task.target_type in entity_type_targets:
                should_check_target = True
                target_type_error = None
            else:
                should_check_target = False
                target_type_error = '%s is invalid target for %s entities' % (
                    task.target_type, task.entity_type)
        elif not task.target_type and not task.target_id:
            should_check_target = False
            target_type_error = None
        elif not task.target_type and task.target_id:
            should_check_target = False
            target_type_error = 'target_type is empty, but target_id is %s' % (
                task.target_id)
        else:
            should_check_target = False
            target_type_error = 'target_type is %s, but target_id is empty' % (
                task.target_type)

        target_id_errors = list()
        valid_versions = set()
        for entity in versioned_entities:
            if should_check_target:
                target_key = '%s{id:%s}' % (task.target_type, task.target_id)
                if _target_exists(entity, task.target_type, task.target_id):
                    target_id_error = None
                else:
                    target_id_error = '%s does not exist at version %s' % (
                        target_key, entity.version)
            else:
                target_id_error = None

            if target_id_error:
                target_id_errors.append(target_id_error)
            else:
                valid_versions.add(entity.version)

        for y in _map_each(
                entity_version_collision=valid_versions,
                target_id_error=target_id_errors,
                target_type_error=[target_type_error]):
            yield y

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
