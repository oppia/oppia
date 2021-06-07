# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Validators for Apache Beam job models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.platform import models
from jobs import registry as jobs_registry

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])


class BeamJobRunModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BeamJobRunModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for the BeamJobRunResultModel id.

        Args:
            unused_item: beam_job_models.BeamJobRunResultModel. Model to
                validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        # Base 64 encoding of a uuid is always 22 characters long.
        return '^[A-Za-z0-9]{22}$'

    @classmethod
    def validate_job_name(cls, item):
        """Validates that the job_name field refers to an actual job.

        Args:
            item: beam_job_models.BeamJobRunModel. The item to validate.
        """
        if item.job_name not in jobs_registry.get_all_job_names():
            cls._add_error(
                'beam_job_name_error',
                'Entity id %s: The job_name field has a value %s which is '
                'not among the job names in jobs.registry.get_all_jobs()' % (
                    item.id, item.job_name))

    @classmethod
    def _get_external_id_relationships(cls, unused_item):
        """BeamJobRunModel does not need to correspond to any model."""
        return []

    @classmethod
    def _get_custom_validation_functions(cls):
        """Returns the list of custom validation functions to run.

        Returns:
            list(function). The list of custom validation functions to run.
        """
        return [cls.validate_job_name]


class BeamJobRunResultModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BeamJobRunResultModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for the BeamJobRunResultModel id.

        Args:
            unused_item: beam_job_models.BeamJobRunResultModel. Model to
                validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        # Base 64 encoding of a uuid is always 22 characters long.
        return '^[A-Za-z0-9]{22}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        """Returns a mapping of external id to model class.

        Args:
            item: beam_job_models.BeamJobRunResultModel. Entity to validate.

        Returns:
            list(ExternalModelFetcherDetails). A list whose values are
            ExternalModelFetcherDetails instances each representing the class
            and ids for a single type of external model to fetch.
        """
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'beam_job_ids', beam_job_models.BeamJobRunModel, [item.job_id])
        ]

    @classmethod
    def _get_custom_validation_functions(cls):
        """Returns the list of custom validation functions to run.

        Returns:
            list(function). The list of custom validation functions to run.
        """
        return []
