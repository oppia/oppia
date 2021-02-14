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

"""Validators for classifier models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import classifier_domain
from core.domain import classifier_services
from core.platform import models

base_models, exp_models = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])


class ClassifierTrainingJobModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating ClassifierTrainingJobModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exp_id].[random_hash]
        regex_string = '^%s\\.[A-Za-z0-9-_]{1,%s}$' % (
            item.exp_id, base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return classifier_services.get_classifier_training_job_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel, [item.exp_id])]

    @classmethod
    def _validate_exp_version(
            cls, item, field_name_to_external_model_references):
        """Validate that exp version is less than or equal to the version
        of exploration corresponding to exp_id.

        Args:
            item: datastore_services.Model. ClassifierTrainingJobModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exp_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exp_model_reference in exp_model_references:
            exp_model = exp_model_reference.model_instance
            if exp_model is None or exp_model.deleted:
                model_class = exp_model_reference.model_class
                model_id = exp_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.exp_version > exp_model.version:
                cls._add_error(
                    'exp %s' % (
                        base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: Exploration version %s in entity is greater '
                    'than the version %s of exploration corresponding to '
                    'exp_id %s' % (
                        item.id, item.exp_version, exp_model.version,
                        item.exp_id))

    @classmethod
    def _validate_state_name(
            cls, item, field_name_to_external_model_references):
        """Validate that state name is a valid state in the
        exploration corresponding to exp_id.

        Args:
            item: datastore_services.Model. ClassifierTrainingJobModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exp_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exp_model_reference in exp_model_references:
            exp_model = exp_model_reference.model_instance
            if exp_model is None or exp_model.deleted:
                model_class = exp_model_reference.model_class
                model_id = exp_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.state_name not in exp_model.states.keys():
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_STATE_NAME_CHECK,
                    'Entity id %s: State name %s in entity is not present '
                    'in states of exploration corresponding to '
                    'exp_id %s' % (
                        item.id, item.state_name, item.exp_id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_exp_version,
            cls._validate_state_name]


class StateTrainingJobsMappingModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating StateTrainingJobsMappingModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exp_id].[exp_version].[state_name]
        regex_string = '^%s\\.%s\\.%s$' % (
            item.exp_id, item.exp_version, item.state_name)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return classifier_domain.StateTrainingJobsMapping(
            item.exp_id, item.exp_version, item.state_name,
            item.algorithm_ids_to_job_ids)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel, [item.exp_id])]

    @classmethod
    def _validate_exp_version(
            cls, item, field_name_to_external_model_references):
        """Validate that exp version is less than or equal to the version
        of exploration corresponding to exp_id.

        Args:
            item: datastore_services.Model. StateTrainingJobsMappingModel
                to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exp_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exp_model_reference in exp_model_references:
            exp_model = exp_model_reference.model_instance
            if exp_model is None or exp_model.deleted:
                model_class = exp_model_reference.model_class
                model_id = exp_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.exp_version > exp_model.version:
                cls._add_error(
                    'exp %s' % (
                        base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: Exploration version %s in entity is greater '
                    'than the version %s of exploration corresponding to '
                    'exp_id %s' % (
                        item.id, item.exp_version, exp_model.version,
                        item.exp_id))

    @classmethod
    def _validate_state_name(
            cls, item, field_name_to_external_model_references):
        """Validate that state name is a valid state in the
        exploration corresponding to exp_id.

        Args:
            item: datastore_services.Model. StateTrainingJobsMappingModel
                to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exp_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exp_model_reference in exp_model_references:
            exp_model = exp_model_reference.model_instance
            if exp_model is None or exp_model.deleted:
                model_class = exp_model_reference.model_class
                model_id = exp_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.state_name not in exp_model.states.keys():
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_STATE_NAME_CHECK,
                    'Entity id %s: State name %s in entity is not present '
                    'in states of exploration corresponding to '
                    'exp_id %s' % (
                        item.id, item.state_name, item.exp_id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_exp_version,
            cls._validate_state_name]
