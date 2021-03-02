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

"""Beam functions and transforms to provide validation for models. The
BaseModelValidator is intended to be a class that other validators can inherit
from. It takes in a Beam PCollection of models and returns a PCollection of the
validation errors found in the input. The Beam.DoFn classes are functions that
are called in the BaseModelValidator to perform validations.

When writing subclasses to BaseModelValidator, call the new added
validation functions in the expand function, and then flatten the output
with the result of the super function.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import re

from core.domain import cron_services
from core.platform import models
from jobs import base_model_validator_errors as errors
from jobs import jobs_utils

import apache_beam as beam

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])


MAX_CLOCK_SKEW_SECS = datetime.timedelta(seconds=1)


class ValidateModelIdWithRegex(beam.DoFn):
    """DoFn to validate model ids against a given regex string."""

    def process(self, input_model, regex_string):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            input_model: datastore_services.Model. Entity to validate.
            regex_string: str. Regex pattern for valid ids to match.

        Yields:
            ModelInvalidIdError. An error class for models with invalid IDs.
        """
        regex = re.compile(regex_string)
        model = jobs_utils.clone_model(input_model)

        if not regex.match(model.id):
            yield errors.ModelInvalidIdError(model)


class ValidateDeleted(beam.DoFn):
    """DoFn to check whether models marked for deletion are stale."""

    def process(self, input_model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelExpiredError. An error class for expired models.
        """
        model = jobs_utils.clone_model(input_model)
        date_now = datetime.datetime.utcnow()

        expiration_date = (
            date_now -
            cron_services.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED)

        if model.last_updated < expiration_date:
            yield errors.ModelExpiredError(model)


class ValidateModelTimeFields(beam.DoFn):
    """DoFn to check whether created_on and last_updated timestamps are
    valid.
    """

    def process(self, input_model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelMutatedDuringJobError. Error for timestamp validation.
            ModelTimestampRelationshipError. Error for timestamp validation.
        """
        model = jobs_utils.clone_model(input_model)
        if model.created_on > (model.last_updated + MAX_CLOCK_SKEW_SECS):
            yield errors.ModelTimestampRelationshipError(model)

        current_datetime = datetime.datetime.utcnow()
        if (model.last_updated - MAX_CLOCK_SKEW_SECS) > current_datetime:
            yield errors.ModelMutatedDuringJobError(model)


class BaseModelValidator(beam.PTransform):
    """Composite beam Transform which returns a pipeline of validation
    errors.
    """

    def expand(self, model_pipe):
        """Function that takes in a beam.PCollection of datastore models and
        returns a beam.PCollection of validation errors.

        Args:
            model_pipe: beam.PCollection. A collection of models.

        Returns:
            beam.PCollection. A collection of errors represented as
            key-value pairs.
        """
        not_deleted, deleted = (
            model_pipe
            | 'SplitByDeleted' >> beam.Partition(lambda m, _: int(m.deleted), 2)
        )

        deletion_errors = deleted | beam.ParDo(ValidateDeleted())

        time_field_validation_errors = (
            not_deleted | beam.ParDo(ValidateModelTimeFields()))

        model_id_validation_errors = (
            not_deleted
            | beam.ParDo(
                ValidateModelIdWithRegex(), self._get_model_id_regex())
        )

        return (
            (
                deletion_errors,
                time_field_validation_errors,
                model_id_validation_errors)
            | beam.Flatten())

    def _get_model_id_regex(self):
        """Returns a regex for model id.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH
