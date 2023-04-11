# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Jobs related to PlatformParameterModel."""

from __future__ import annotations

from core.domain import platform_parameter_registry
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models

(config_models, ) = models.Registry.import_models([models.Names.CONFIG])
datastore_services = models.Registry.import_datastore_services()


def _populate_platform_parameter_model(
    platform_param_id: str,
    platform_param_model: config_models.PlatformParameterModel
) -> config_models.PlatformParameterModel:
    """Populates the PlatformParameterModel by adding new field to it.

    Args:
        platform_param_id: str. The id of the model which is the name
            of the platform-parameter.
        platform_param_model: config_models.PlatformParameterModel. The
            PlatformParameterModel.

    Returns:
        config_models.PlatformParameterModel. The populated
        PlatformParameterModel.
    """
    param_with_init_settings = (
        platform_parameter_registry.Registry.parameter_registry[
        platform_param_id])
    platform_param_domain_dict = {
        'name': param_with_init_settings.name,
        'description': param_with_init_settings.description,
        'data_type': param_with_init_settings.data_type,
        'rules': platform_param_model.rules,
        'rule_schema_version': platform_param_model.rule_schema_version,
        'default_value': param_with_init_settings.default_value,
        'is_feature': param_with_init_settings.is_feature,
        'feature_stage': param_with_init_settings.feature_stage,
    }
    platform_param_dict = {
        'rules': platform_param_domain_dict['rules'],
        'rule_schema_version': (
            platform_param_domain_dict['rule_schema_version']),
        'is_feature': platform_param_domain_dict['is_feature']
    }
    platform_param_model.populate(**platform_param_dict)
    return platform_param_model


class PopulatePlatformParameterModelOneOffJob(base_jobs.JobBase):
    """Adds a field to PlatformParameterModel."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the platform-parameter
        migration.

        Returns:
            PCollection. A PCollection of results from the platform-parameter
            migration.
        """
        all_platform_parameter_models = (
            self.pipeline
            | 'Get all non-deleted platform-parameter models' >> (
                ndb_io.GetModels(
                    config_models.PlatformParameterModel.get_all())
                )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add platform-parameter keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda platform_parameter_model: platform_parameter_model.id)
        )

        populate_platform_parameter_models = (
            all_platform_parameter_models
            | 'Populate models' >> beam.MapTuple(
                _populate_platform_parameter_model)
        )

        populated_plat_parameter_job_run_result = (
            populate_platform_parameter_models
            | 'Generate results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'PLATFORM PARAMETER PROCESSED'))
        )

        unused_put_result = (
            populate_platform_parameter_models
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return populated_plat_parameter_job_run_result


class AuditPopulatePlatformParameterModelOneOffJob(base_jobs.JobBase):
    """This audit job replicates the migration job but does not commit
    the changes to the datastore.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the platform-parameter
        audit.

        Returns:
            PCollection. A PCollection of results from the platform-parameter
            audit.
        """
        all_platform_parameter_models = (
            self.pipeline
            | 'Get all non-deleted platform-parameter models' >> (
                ndb_io.GetModels(
                    config_models.PlatformParameterModel.get_all()))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add platform-parameter keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda platform_parameter_model: platform_parameter_model.id)
        )

        populate_platform_parameter_models = (
            all_platform_parameter_models
            | 'Populate models' >> beam.MapTuple(
                _populate_platform_parameter_model)
        )

        populated_plat_parameter_job_run_result = (
            populate_platform_parameter_models
            | 'Generate results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'AUDIT PLATFORM PARAMETER PROCESSED'))
        )

        return populated_plat_parameter_job_run_result


class ValidatePlatformParameterModelOneOffJob(base_jobs.JobBase):
    """Validate the PlatformParameterModel."""

    @staticmethod
    def _validate_platform_parameter_model(
        platform_param_id: str
    ) -> Tuple[str, bool, str]:
        """Validate if the feature has the data type as bool.

        Args:
            platform_param_id: str. The id of the PlatformParameterModel.

        Returns:
            Tuple[str, bool, str]. Here the first index represents the id
            of the model, second index represents whether the model has
            a type of bool or not, third index represents the type of the model.
        """
        param_with_init_settings = (
            platform_parameter_registry.Registry.parameter_registry[
            platform_param_id])

        if not param_with_init_settings.data_type == 'bool':
            return (
                platform_param_id, False, param_with_init_settings.data_type)
        return (platform_param_id, True, param_with_init_settings.data_type)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the platform-parameter
        validation.

        Returns:
            PCollection. A PCollection of results from the platform-parameter
            validation.
        """
        all_platform_parameter_models = (
            self.pipeline
            | 'Get all non-deleted platform-parameter models' >> (
                ndb_io.GetModels(
                    config_models.PlatformParameterModel.get_all())
                )
            | 'Filter feature flag platform parameters' >> beam.Filter(
                lambda model: model.is_feature)
            | 'Map the models with id' >> beam.Map(
                lambda model: model.id)
        )

        total_platform_features = (
            all_platform_parameter_models
            | 'Report total platform features' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PLATFORM FEATURES'))
        )

        validated_platform_parameter_models = (
            all_platform_parameter_models
            | 'Validate platform parameter model' >> beam.Map(
                self._validate_platform_parameter_model)
        )

        platform_param_with_failed_validation = (
            validated_platform_parameter_models
            | 'Filter models with failed validation' >> beam.Filter(
                lambda model: model[1] is False)
        )

        report_platform_param_with_failed_validation = (
            platform_param_with_failed_validation
            | 'Report result for models with failed validation' >> beam.Map(
                lambda data: (job_run_result.JobRunResult.as_stderr(
                    'The platform feature with id %s do not have type bool, '
                    'instead it has %s' %(data[0], data[2])))
            )
        )

        platform_param_with_success_validation = (
            validated_platform_parameter_models
            | 'Filter models with success validation' >> beam.Filter(
                lambda model: model[1] is True)
        )

        report_platform_param_with_success_validation = (
            platform_param_with_success_validation
            | 'Generate results for valid platform features' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'VALID PLATFORM FEATURES'))
        )

        return (
            (
                total_platform_features,
                report_platform_param_with_failed_validation,
                report_platform_param_with_success_validation
            )
            | 'Combine results' >> beam.Flatten()
        )
