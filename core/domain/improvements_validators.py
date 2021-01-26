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

""" Validators for Improvements models. """

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.domain import base_model_validators
from core.platform import models


(exp_models, improvements_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.improvements])


class TaskEntryModelValidator(base_model_validators.BaseModelValidator):
    """One off job for auditing task entries."""

    # The name of the model which is to be used in the error messages.
    MODEL_NAME = 'task entry'

    @classmethod
    def _get_model_id_regex(cls, item):
        return re.escape(improvements_models.TaskEntryModel.generate_task_id(
            item.entity_type, item.entity_id, item.entity_version,
            item.task_type, item.target_type, item.target_id))

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'resolver_ids',
                [item.resolver_id] if item.resolver_id is not None else [],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'entity_ids', exp_models.ExplorationModel, [item.entity_id])]

    @classmethod
    def _validate_composite_entity_id(cls, item):
        """Validates the composite_entity_id field of the given item.

        Args:
            item: improvements_models.TaskEntryModel. The TaskEntry model
                object to get the composite entity id.
        """
        expected_composite_entity_id = (
            improvements_models.TaskEntryModel.generate_composite_entity_id(
                item.entity_type, item.entity_id, item.entity_version))
        if item.composite_entity_id != expected_composite_entity_id:
            cls._add_error(
                'composite_entity_id %s' % (
                    base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                'Entity id %s: composite_entity_id "%s" should be "%s"' % (
                    item.id,
                    item.composite_entity_id,
                    expected_composite_entity_id))

    @classmethod
    def _validate_status(cls, item):
        """Validates the fields of the item relating to the status field.

        Args:
            item: improvements_models.TaskEntryModel. The item to check the
                status for.
        """
        if item.status == improvements_models.TASK_STATUS_OPEN:
            if item.resolver_id:
                cls._add_error(
                    'status %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: status is open but resolver_id is "%s", '
                    'should be empty.' % (item.id, item.resolver_id))
            if item.resolved_on:
                cls._add_error(
                    'status %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: status is open but resolved_on is "%s", '
                    'should be empty.' % (item.id, item.resolved_on))
        elif item.status == improvements_models.TASK_STATUS_RESOLVED:
            if item.resolver_id is None:
                cls._add_error(
                    'status %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: status is resolved but resolver_id is not '
                    'set' % (item.id,))
            if item.resolved_on is None:
                cls._add_error(
                    'status %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: status is resolved but resolved_on is not '
                    'set' % (item.id,))

    @classmethod
    def _validate_target_id(cls, item):
        """Validate that the given item contains an existing exploration state
        name.

        Args:
            item: improvements_models.TaskEntryModel. The item to fetch and
                check the target id.
        """
        try:
            exp_model = exp_models.ExplorationModel.get(
                item.entity_id, strict=True, version=item.entity_version)
        except Exception:
            cls._add_error(
                'target_id %s' % (
                    base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                'Entity id %s: exploration with id "%s" does not exist at '
                'version %d' % (item.id, item.entity_id, item.entity_version))
            return

        if item.target_id not in exp_model.states.keys():
            cls._add_error(
                'target_id %s' % (
                    base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                'Entity id %s: exploration with id "%s" does not have a state '
                'named "%s" at version %d' % (
                    item.id, item.entity_id, item.target_id,
                    item.entity_version))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_composite_entity_id,
            cls._validate_status,
            cls._validate_target_id,
        ]
