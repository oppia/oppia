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

import collections
import datetime
import re

from core.domain import cron_services
from core.domain import rights_manager
from core.platform import models
import feconf
import python_utils
import utils

import apache_beam as beam

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


ERROR_CATEGORY_COMMIT_CMD_CHECK = 'commit cmd check'
ERROR_CATEGORY_COMMIT_STATUS_CHECK = 'post commit status check'
ERROR_CATEGORY_COUNT_CHECK = 'count check'
ERROR_CATEGORY_CURRENT_TIME_CHECK = 'current time check'
ERROR_CATEGORY_DATETIME_CHECK = 'datetime check'
ERROR_CATEGORY_DOMAIN_OBJECT_CHECK = 'domain object check'
ERROR_CATEGORY_EMAIL_CHECK = 'email check'
ERROR_CATEGORY_ERROR_CHECK = 'error check'
ERROR_CATEGORY_FIELD_CHECK = 'field check'
ERROR_CATEGORY_FIRST_PUBLISHED_MSEC_CHECK = 'first published msec check'
ERROR_CATEGORY_ID_CHECK = 'id check'
ERROR_CATEGORY_LAST_UPDATED_CHECK = 'last updated check'
ERROR_CATEGORY_LENGTH_CHECK = 'length check'
ERROR_CATEGORY_NAME_CHECK = 'name check'
ERROR_CATEGORY_OUTPUT_CHECK = 'output check'
ERROR_CATEGORY_PRIVATE_COMMIT_CHECK = 'post commit is private check'
ERROR_CATEGORY_PROPERTY_FETCH_CHECK = 'fetch properties'
ERROR_CATEGORY_RATED_ON_CHECK = 'rated on check'
ERROR_CATEGORY_RATINGS_CHECK = 'ratings check'
ERROR_CATEGORY_REFERENCE_CHECK = 'reference check'
ERROR_CATEGORY_AUTHOR_CHECK = 'author check'
ERROR_CATEGORY_REVIEWER_CHECK = 'reviewer check'
ERROR_CATEGORY_STATE_NAME_CHECK = 'state name check'
ERROR_CATEGORY_SUMMARY_CHECK = 'summary check'
ERROR_CATEGORY_TIME_FIELD_CHECK = 'time field relation check'
ERROR_CATEGORY_TYPE_CHECK = 'type check'
ERROR_CATEGORY_VERSION_CHECK = 'version check'
ERROR_CATEGORY_STALE_CHECK = 'stale check'
ERROR_CATEGORY_INVALID_IDS_IN_FIELD = 'invalid ids in field'

VALIDATION_MODE_NEUTRAL = 'neutral'
VALIDATION_MODE_STRICT = 'strict'
VALIDATION_MODE_NON_STRICT = 'non-strict'


class ValidateModelIdWithRegex(beam.DoFn):
    """DoFn to validate model ids against a given regex string."""

    def __init__(self, regex_string):
        """Initializes the ValidateModelIdWithRegex DoFn.

        Args:
          regex_string: str. A regex pattern for valid ids.
        """
        super(init)
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
        element = model.clone()
        regex_string = self.regex_string

        if not re.compile(regex_string).match(element.id):
            yield beam.pvalue.TaggedOutput('error_category_id_check', (
                'model %s' % ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    element.id)
            ))
        yield element


class ValidateDeleted(beam.DoFn):
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
        element = model.clone()
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
        yield element


class ValidateModelTimeFields(beam.DoFn):
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

        element = model.clone()
        if element.created_on > (element.last_updated
                                 + datetime.timedelta(seconds=1)):
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
        yield element


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
        models, deleted = (model_pipe | beam.Map(
            self._check_deletion_status)
            .with_outputs('not_deleted', 'deleted'))

        deletion_errors = deleted | beam.ParDo(ValidateDeleted()).with_outputs()

        time_field_validation_errors = (models | beam.ParDo(
            ValidateModelTimeFields()).with_outputs())

        model_id_validation_errors = (models | beam.ParDo(
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
          model. datastore_services.Model. Entity to validate.

        Returns:
          beam.pvalue.TaggedOutput. A model which element of the output
          PCollection for the doFn.
        """

        if not model.deleted:
            return beam.pvalue.TaggedOutput('not_deleted', model)
        else:
            return beam.pvalue.TaggedOutput('deleted', model)
