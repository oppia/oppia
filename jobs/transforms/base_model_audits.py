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

from core.platform import models
import feconf
from jobs import job_utils
from jobs.decorators import audit_decorators
from jobs.types import audit_errors

import apache_beam as beam

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

BASE_MODEL_ID_PATTERN = r'^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH
MAX_CLOCK_SKEW_SECS = datetime.timedelta(seconds=1)


class ValidateDeletedModel(beam.DoFn):
    """DoFn to check whether models marked for deletion are stale.

    Doesn't use the AuditsExisting decorator because it audits deleted models,
    not existing ones.
    """

    def process(self, input_model):
        """Yields audit errors that are discovered in the input model.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelExpiredError. An error class for expired models.
        """
        model = job_utils.clone_model(input_model)

        expiration_date = (
            datetime.datetime.utcnow() -
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED)

        if model.last_updated < expiration_date:
            yield audit_errors.ModelExpiredError(model)


@audit_decorators.AuditsExisting(base_models.BaseModel)
class ValidateBaseModelId(beam.DoFn):
    """DoFn to validate model ids.

    IMPORTANT: Models with special ID checks should derive from this class and
    override __init__() to assign a different value to self._regex, or replace
    the process() method entirely. Be sure to decorate the new class with that
    specific model type.
    """

    def __init__(self):
        super(ValidateBaseModelId, self).__init__()
        # IMPORTANT: Only picklable objects can be stored on DoFns! This is
        # because DoFns are serialized with pickle when run on a pipeline (and
        # might be run on many different machines). Any other types assigned to
        # self, like compiled re patterns, ARE LOST AFTER DESERIALIZATION!
        # https://docs.python.org/3/library/pickle.html#what-can-be-pickled-and-unpickled
        self._pattern = BASE_MODEL_ID_PATTERN

    def process(self, input_model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelIdRegexError. An error class for models with invalid IDs.
        """
        model = job_utils.clone_model(input_model)

        if not re.match(self._pattern, model.id):
            yield audit_errors.ModelIdRegexError(model, self._pattern)


@audit_decorators.AuditsExisting(base_models.BaseCommitLogEntryModel)
class ValidatePostCommitIsPrivate(beam.DoFn):
    """DoFn to check if post_commmit_status is private when
    post_commit_is_private is true and vice-versa.
    """

    def process(self, input_model):
        """Function validates that post_commit_is_private is true iff
        post_commit_status is private

        Args:
            input_model: base_models.BaseCommitLogEntryModel.
                Entity to validate.

        Yields:
            ModelInvalidCommitStatus. Error for commit_type validation.
        """
        model = job_utils.clone_model(input_model)

        expected_post_commit_is_private = (
            model.post_commit_status == feconf.POST_COMMIT_STATUS_PRIVATE)
        if model.post_commit_is_private != expected_post_commit_is_private:
            yield audit_errors.InvalidCommitStatusError(model)


@audit_decorators.AuditsExisting(base_models.BaseModel)
class ValidateModelTimestamps(beam.DoFn):
    """DoFn to check whether created_on and last_updated timestamps are valid.
    """

    def process(self, input_model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelMutatedDuringJobError. Error for models mutated during the job.
            InconsistentTimestampsError. Error for models with inconsistent
            timestamps.
        """
        model = job_utils.clone_model(input_model)
        if model.created_on > (model.last_updated + MAX_CLOCK_SKEW_SECS):
            yield audit_errors.InconsistentTimestampsError(model)

        current_datetime = datetime.datetime.utcnow()
        if (model.last_updated - MAX_CLOCK_SKEW_SECS) > current_datetime:
            yield audit_errors.ModelMutatedDuringJobError(model)


@audit_decorators.AuditsExisting(base_models.BaseCommitLogEntryModel)
class ValidateCommitType(beam.DoFn):
    """DoFn to check whether commit type is valid."""

    def process(self, input_model):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelCommitTypeError. Error for commit_type validation.
        """
        model = job_utils.clone_model(input_model)

        if (model.commit_type not in
                base_models.VersionedModel.COMMIT_TYPE_CHOICES):
            yield audit_errors.InvalidCommitTypeError(model)
