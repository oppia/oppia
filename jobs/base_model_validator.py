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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import re

import apache_beam as beam

from core.domain import cron_services
from core.platform import models
import python_utils


(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()



ERROR_CATEGORY_CURRENT_TIME_CHECK = 'current time check'
ERROR_CATEGORY_ID_CHECK = 'id check'
ERROR_CATEGORY_TIME_FIELD_CHECK = 'time field relation check'
ERROR_CATEGORY_STALE_CHECK = 'stale check'

MAX_CLOCK_SKEW_SECS = datetime.timedelta(seconds=1)


class BaseValidatorDoFn(beam.DoFn):
    def clone(self, model, **new_values):
          """Clones the entity, adding or overriding constructor attributes.

          The cloned entity will have exactly the same property values as the
          original entity, except where overridden. By default, it will have no
          parent entity or key name, unless supplied.

          Args:
              model: datastore_services.Model. Model to clone.
              **new_values: dict(str: *). Keyword arguments to override when
                  invoking the cloned entity's constructor.

          Returns:
              *. A cloned, and possibly modified, copy of self. Subclasses of
              BaseModel will return a clone with the same type.
          """
          # Reference implementation: https://stackoverflow.com/a/2712401/4859885.
          cls = model.__class__
          props = {k: v.__get__(model, cls) for k, v in cls._properties.items()} # pylint: disable=protected-access
          props.update(new_values)
          return cls(id=model.id, **props)

class ValidateModelIdWithRegex(BaseValidatorDoFn):
    """DoFn to validate model ids against a given regex string."""

    def __init__(self, regex_string):
        """Initializes the ValidateModelIdWithRegex DoFn.

        Args:
            regex_string: str. A regex pattern for valid ids.
        """
        super(ValidateModelIdWithRegex, self).__init__()
        self.regex_string = regex_string

    def process(self, model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            model: datastore_services.Model. Entity to validate.

        Yields:
            beam.pvalue.TaggedOutput. An element of the output PCollection for
            the doFn which represents an error as a key value pair.
        """
        element = self.clone(model)
        regex_string = self.regex_string

        if not re.compile(regex_string).match(element.id):
            yield beam.pvalue.TaggedOutput('error_category_id_check', (
                'model %s' % ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    element.id)
            ))


class ValidateDeleted(BaseValidatorDoFn):
    """DoFn to check whether models marked for deletion are stale."""

    def process(self, model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            model: datastore_services.Model. Entity to validate.

        Yields:
            beam.pvalue.TaggedOutput. An element of the output PCollection for
            the doFn which represents an error as a key value pair.
        """
        element = self.clone(model)
        date_now = datetime.datetime.utcnow()

        date_before_which_models_should_be_deleted = (
            date_now -
            cron_services.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED
        )

        period_to_hard_delete_models_in_days = (
            cron_services.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)

        if element.last_updated < date_before_which_models_should_be_deleted:
            yield beam.pvalue.TaggedOutput('error_category_stale_check', (
                'entity %s' % ERROR_CATEGORY_STALE_CHECK,
                'Entity id %s: model marked as deleted is older than %s weeks'
                % (element.id, python_utils.divide(
                    period_to_hard_delete_models_in_days, 7))
            ))


class ValidateModelTimeFields(BaseValidatorDoFn):
    """DoFn to check whether created_on and last_updated timestamps are
    valid."""

    def process(self, model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            model: datastore_services.Model. Entity to validate.

        Yields:
            beam.pvalue.TaggedOutput. An element of the output PCollection for
            the doFn which represents an error as a key value pair.
        """

        element = self.clone(model)
        if element.created_on > (element.last_updated+ MAX_CLOCK_SKEW_SECS):
            yield beam.pvalue.TaggedOutput(
                'error_category_time_field_check', (
                    ERROR_CATEGORY_TIME_FIELD_CHECK,
                    'Entity id %s: The created_on field has a value %s which '
                    'is greater than the value %s of last_updated field'
                    % (element.id, element.created_on, element.last_updated)
                ))

        current_datetime = datetime.datetime.utcnow()
        if element.last_updated > current_datetime:
            yield beam.pvalue.TaggedOutput(
                'error_category_current_time_check', (
                    ERROR_CATEGORY_CURRENT_TIME_CHECK,
                    'Entity id %s: The last_updated field has a value %s which '
                    'is greater than the time when the job was run'
                    % (element.id, element.last_updated)
                ))


class BaseModelValidator(beam.PTransform):
    """Composite Beam Transform which returns a pipeline of validation
    errors."""

    def expand(self, model_pipe):
        """Function that takes in a beam.PCollection of datastore models and
        returns a beam.PCollection of validation errors.

        Args:
            model_pipe: beam.PCollection. A collection of models.

        Returns:
            beam.PCollection. A collection of errors represented as
            key-value pairs.
        """
        not_deleted, deleted = (model_pipe | beam.Map(
            self._check_deletion_status)
            .with_outputs('not_deleted', 'deleted'))

        deletion_errors = deleted | beam.ParDo(ValidateDeleted()).with_outputs()

        time_field_validation_errors = (not_deleted | beam.ParDo(
            ValidateModelTimeFields()).with_outputs())

        model_id_validation_errors = (not_deleted | beam.ParDo(
            ValidateModelIdWithRegex(self._get_model_id_regex()))
            .with_outputs())

        merged = ((
            deletion_errors.error_category_stale_check,
            time_field_validation_errors.error_category_time_field_check,
            time_field_validation_errors.error_category_current_time_check,
            model_id_validation_errors.error_category_id_check)
            | beam.Flatten())

        return merged

    def _get_model_id_regex(self):
        """Returns a regex for model id.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

    def _check_deletion_status(self, model):
        """Function that splits model PCollection based on deletion status.

        Args:
          model: datastore_services.Model. Entity to validate.

        Returns:
            beam.pvalue.TaggedOutput: A model which element of the output
            PCollection for the doFn.
        """

        if not model.deleted:
            return beam.pvalue.TaggedOutput('not_deleted', model)
        else:
            return beam.pvalue.TaggedOutput('deleted', model)
