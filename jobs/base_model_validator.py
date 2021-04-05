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
from jobs import base_model_validator_errors as errors
from jobs import jobs_utils

import apache_beam as beam

base_models, user_models = (
    models.Registry.import_models([models.NAMES.base_model, models.NAMES.user]))


DEFAULT_ID_REGEX_STRING = '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH
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
            InvalidIdError. An error class for models with invalid IDs.
        """
        model = jobs_utils.clone_model(input_model)

        if not re.match(regex_string, model.id):
            yield errors.InvalidIdError(model, regex_string)


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
        model = jobs_utils.clone_model(input_model)

        expected_post_commit_is_private = (
            model.post_commit_status == feconf.POST_COMMIT_STATUS_PRIVATE)
        if model.post_commit_is_private != expected_post_commit_is_private:
            yield errors.InvalidCommitStatusError(model)


class ValidateDeletedModel(beam.DoFn):
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

        expiration_date = (
            datetime.datetime.utcnow() -
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED)

        if model.last_updated < expiration_date:
            yield errors.ModelExpiredError(model)


class ValidateModelTimestamps(beam.DoFn):
    """DoFn to check whether created_on and last_updated timestamps are
    valid.
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
        model = jobs_utils.clone_model(input_model)
        if model.created_on > (model.last_updated + MAX_CLOCK_SKEW_SECS):
            yield errors.InconsistentTimestampsError(model)

        current_datetime = datetime.datetime.utcnow()
        if (model.last_updated - MAX_CLOCK_SKEW_SECS) > current_datetime:
            yield errors.ModelMutatedDuringJobError(model)


class ValidateCommitCmdsSchema(beam.DoFn):
    """DoFn to validate schema of commit commands in commit_cmds dict.
    """

    def process(cls, input_model, get_change_domain_class):
        """Validates schema of commit commands in commit_cmds dict.

        Args:
            input_model: datastore_services.Model. Entity to validate.
            
        Yields:
            ModelMutatedDuringJobError. [subject to change]
            InconsistentTimestampsError. [subject to change]            
        """
        model = jobs_utils.clone_model(input_model)
        change_domain_object = get_change_domain_class(model)
        if change_domain_object is None:
            # This is for cases where id of the entity is invalid
            # and no commit command domain object is found for the entity.
            # For example, if a CollectionCommitLogEntryModel does
            # not have id starting with collection/rights, there is
            # no commit command domain object defined for this model.
            yield errors.MissingCommitCommandDomainObjError(model)
            return
        for commit_cmd_dict in model.commit_cmds:
            if not commit_cmd_dict:
                continue
            try:
                change_domain_object(commit_cmd_dict)
            except Exception as e:
                cmd_name = commit_cmd_dict.get('cmd')
                yield errors.CommitCommandValidationFailedError(cmd_name, model, commit_cmd_dict, e)


class BaseModelValidator(beam.PTransform):
    """Composite PTransform which returns a pipeline of validation errors."""

    @classmethod
    def get_model_id_regex(cls):
        """Returns a regex for model id.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return DEFAULT_ID_REGEX_STRING

    def expand(self, input_models):
        """Transforms a PCollection of models into validation errors.

        Args:
            input_models: beam.PCollection. A collection of models.

        Returns:
            beam.PCollection. A collection of errors represented as
            key-value pairs.
        """
        existing_models, deleted_models = (
            input_models
            | 'Split by deleted' >> beam.Partition(
                lambda model, unused_num_partitions: int(model.deleted), 2)
        )
        deletion_errors = (
            deleted_models
            | 'Validate deleted models' >> beam.ParDo(ValidateDeletedModel())
        )
        timestamp_errors = (
            existing_models
            | 'Validate timestamps' >> beam.ParDo(ValidateModelTimestamps())
        )
        id_errors = (
            existing_models
            | 'Validate id' >> beam.ParDo(
                ValidateModelIdWithRegex(), self.get_model_id_regex())
        )

        error_pcolls = (deletion_errors, timestamp_errors, id_errors)
        return error_pcolls | beam.Flatten()

class BaseSummaryModelValidator(BaseModelValidator):
    pass


class BaseSnapshotContentModelValidator(BaseModelValidator):
    pass


class BaseSnapshotMetadataModelValidator(BaseSnapshotContentModelValidator):

    @classmethod
    def get_change_domain_class(cls, unused_item):
        """Returns a Change domain class.

        This should be implemented by subclasses.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            change_domain.BaseChange. A domain object class for the
            changes made by commit commands of the model.

        Raises:
            NotImplementedError. This function has not yet been implemented.
        """
        raise NotImplementedError(
            'The get_change_domain_class() method is missing from the derived '
            'class. It should be implemented in the derived class.')
    
    def expand(self, input_models : Dict[str]) -> None:
        """Transforms a PCollection of models into validation errors.

        Args:
            input_models: beam.PCollection. A collection of models.

        Returns:
            beam.PCollection. A collection of errors represented as
            key-value pairs.
        """
        existing_models, deleted_models = (
            input_models
            | 'Split by deleted' >> beam.Partition(
                lambda model, unused_num_partitions: int(model.deleted), 2)
        )
        commit_cmmds_erros = (
            existing_models
            | 'Validate commit command schemas' >> beam.ParDo(
                ValidateCommitCmdsSchema(), self.get_change_domain_class())  
            )
        )

        error_pcolls = (commit_cmmds_erros)
        return error_pcolls | beam.Flatten()
