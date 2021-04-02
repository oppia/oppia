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
import python_utils
import utils

import apache_beam as beam

base_models, user_models = (
    models.Registry.import_models([models.NAMES.base_model, models.NAMES.user]))


DEFAULT_ID_REGEX_STRING = '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH
MAX_CLOCK_SKEW_SECS = datetime.timedelta(seconds=1)

VALIDATION_MODE_NEUTRAL = 'neutral'
VALIDATION_MODE_STRICT = 'strict'
VALIDATION_MODE_NON_STRICT = 'non-strict'


class ExternalModelFetcherDetails(python_utils.OBJECT):
    """Value object providing the class and ids to fetch an external model.
    NOTE TO DEVELOPERS: For UserSettingsModel, use the
    UserSettingsModelFetcherDetails class instead of this one.
    """

    def __init__(self, field_name, model_class, model_ids):
        """Initializes an ExternalModelFetcherDetails domain object.

        Args:
            field_name: str. A specific name used as an identifier by the
                storage model which is used to identify the external model
                reference. For example: 'exp_ids': ExplorationModel, exp_ids
                is the field name to identify the external model
                ExplorationModel.
            model_class: ClassObject. The external model class.
            model_ids: list(str). The list of external model ids to fetch the
                external models.

        Raises:
            Exception. This class was used instead of
                UserSettingsModelFetcherDetails for the UserSettingsModel.
        """
        if model_class == user_models.UserSettingsModel:
            raise Exception(
                'When fetching instances of UserSettingsModel, please use ' +
                'UserSettingsModelFetcherDetails instead of ' +
                'ExternalModelFetcherDetails')
        validated_model_ids = []
        model_id_errors = []
        for model_id in model_ids:
            if not model_id:
                model_id_errors.append(
                    'A model id in the field \'%s\' '
                    'is empty' % field_name)
            else:
                validated_model_ids.append(model_id)
        self.field_name = field_name
        self.model_class = model_class
        self.model_ids = validated_model_ids
        self.model_id_errors = model_id_errors


class UserSettingsModelFetcherDetails(python_utils.OBJECT):
    """Value object providing ids to fetch the user settings model."""

    def __init__(
            self, field_name, model_ids,
            may_contain_system_ids, may_contain_pseudonymous_ids):
        """Initializes the UserSettingsModelFetcherDetails domain object.

        Args:
            field_name: str. A specific name used as an identifier by the
                storage model which is used to identify the user settings model
                reference. For example: `'committer_id': UserSettingsModel`
                means that committer_id is a field which contains a user_id
                used to identify the external model UserSettingsModel.
            model_ids: list(str). The list of user settings model IDs for which
                to fetch the UserSettingsModels.
            may_contain_system_ids: bool. Whether the model IDs contain
                system IDs which should be omitted before attempting to fetch
                the corresponding models. Set may_contain_system_ids to True if
                and only if this field can contain admin or bot IDs.
            may_contain_pseudonymous_ids: bool. Whether the model ids contain
                pseudonymous IDs which should be omitted before attempting to
                fetch the corresponding models. Set may_contain_pseudonymous_ids
                to True if and only if this field can contain user IDs that
                are pseudonymized as part of Wipeout. In other words, these
                fields can only be in models that have LOCALLY_PSEUDONYMIZE as
                their DELETION_POLICY.
        """
        model_id_errors = []
        validated_model_ids = []
        for model_id in model_ids:
            if model_id in feconf.SYSTEM_USERS.values():
                if not may_contain_system_ids:
                    model_id_errors.append(
                        'The field \'%s\' should not contain '
                        'system IDs' % field_name)
            elif utils.is_pseudonymous_id(model_id):
                if not may_contain_pseudonymous_ids:
                    model_id_errors.append(
                        'The field \'%s\' should not contain '
                        'pseudonymous IDs' % field_name)
            elif not utils.is_user_id_valid(
                    model_id,
                    allow_system_user_id=False,
                    allow_pseudonymous_id=False
            ):
                model_id_errors.append(
                    'The user id %s in the field \'%s\' is '
                    'invalid' % (model_id, field_name))
            else:
                validated_model_ids.append(model_id)
        self.field_name = field_name
        self.model_class = user_models.UserSettingsModel
        self.model_ids = validated_model_ids
        self.model_id_errors = model_id_errors


class ExternalModelReference(python_utils.OBJECT):
    """Value object representing an external model linked to a storage model."""

    def __init__(
            self, model_class, model_id, model_instance):
        """Initializes an ExternalModelReference domain object.

        Args:
            model_class: ClassObject. The model class.
            model_id: str. The id of the model.
            model_instance: datastore_services.Model. The gae model object.
        """
        self.model_class = model_class
        self.model_id = model_id
        self.model_instance = model_instance


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


class ValidateModelDomainObjectInstances(beam.DoFn):
    """DoFn to check whether the model instance passes the validation of the
    domain object for model.
    """

    def process(
            self, item, get_model_domain_object,
            get_domain_object_validation_type):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            item: datastore_services.Model. A domain object to
                validate.
            get_model_domain_object: function. A function to fetch
                domain object.
            get_domain_object_validation_type: function. A function to fetch
                the validation type of the domain object.

        Yields:
            ModelDomainObjectValidateError. Error for domain object validation.
        """
        try:
            domain_object = get_model_domain_object(item)
            validation_type = get_domain_object_validation_type(item)
            if domain_object is None:
                return
            if validation_type == VALIDATION_MODE_NEUTRAL:
                domain_object.validate()
            elif validation_type == VALIDATION_MODE_STRICT:
                domain_object.validate(strict=True)
            elif validation_type == VALIDATION_MODE_NON_STRICT:
                domain_object.validate(strict=False)
            else:
                raise Exception(
                    'Invalid validation type for domain object: %s' % (
                        validation_type))
        except Exception as e:
            yield errors.ModelDomainObjectValidateError(item, e)


class ValidateIdsInModelFields(beam.DoFn):
    """DoFn to check whether the ids in the fields of the model are valid.
    """

    def process(self, item, get_external_id_relationships):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            item: datastore_services.Model. Entity to validate.
            get_external_id_relationships: function. A function to fetch
                external id relationships.

        Yields:
            IdsInModelFieldValidationError. Error for ids in model field
            validation.
        """
        for external_model_fetcher_details in (
                get_external_id_relationships(item)):
            for error in external_model_fetcher_details.model_id_errors:
                yield errors.IdsInModelFieldValidationError(item, error)


class FetchFieldNameToExternalIdRelationships(beam.DoFn):
    """DoFn to fetch external models based on _get_external_id_relationships.
    """

    def process(self, item, get_external_id_relationships):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            item: datastore_services.Model. Entity to validate.
            get_external_id_relationships: function. The function to fetch
                external id relationships for the model.

        Yields:
            tuple(datastore_services.Model, str, ExternalModelReference). A
            tuple that consists of the model to be validated, the field
            name and the ExternalModelReference.
        """
        def mock_datastore_fetch(ids_and_models):
            all_models_grouped_by_model_type = []
            for (_, entity_ids) in ids_and_models:
                all_models_grouped_by_model_type.append(
                    [None for _ in python_utils.RANGE(len(entity_ids))])
            return all_models_grouped_by_model_type

        multiple_models_ids_to_fetch = {}

        for external_model_fetcher_details in (
                get_external_id_relationships(item)):
            multiple_models_ids_to_fetch[
                external_model_fetcher_details.field_name] = (
                    external_model_fetcher_details.model_class,
                    external_model_fetcher_details.model_ids)

        # Currently using the mock datastore fetch. Once the models
        # can be fetched, we can replace it.
        fetched_model_instances_for_all_ids = mock_datastore_fetch(
            list(multiple_models_ids_to_fetch.values()))

        for index, field_name in enumerate(multiple_models_ids_to_fetch):
            (model_class, model_ids) = (
                multiple_models_ids_to_fetch[field_name])
            fetched_model_instances = (
                fetched_model_instances_for_all_ids[index])

            external_model_references = []
            for (model_id, model_instance) in python_utils.ZIP(
                    model_ids, fetched_model_instances):
                external_model_references.append(
                    ExternalModelReference(
                        model_class, model_id, model_instance))
            yield (item, field_name, external_model_references)


class ValidateExternalIdRelationships(beam.DoFn):
    """DoFn to check whether the external id properties on the model correspond
    to valid instances.
    """

    def process(self, model_and_field_name_and_external_model_references):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            model_and_field_name_and_external_model_references:
                tuple(datastore_services.Model, str, ExternalModelReference).
                A tuple that consists of the model to be validated, the field
                name and the ExternalModelReference.

        Yields:
            ModelFieldCheckValidateError. Error for external id relationships.
        """
        item, field_name, external_model_references = (
            model_and_field_name_and_external_model_references)
        for external_model_reference in external_model_references:
            model = external_model_reference.model_instance

            if model is None or model.deleted:
                model_class = external_model_reference.model_class
                model_id = external_model_reference.model_id
                yield errors.ModelFieldCheckValidateError(
                    item, field_name, model_id, model_class)


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

        ids_in_field_validation_error = (
            existing_models
            | beam.ParDo(
                ValidateIdsInModelFields(),
                self._get_external_id_relationships)
        )

        model_and_field_name_and_external_model_references = (
            existing_models
            | beam.ParDo(
                FetchFieldNameToExternalIdRelationships(),
                self._get_external_id_relationships))

        external_id_relationships_validation_errors = (
            model_and_field_name_and_external_model_references
            | beam.ParDo(ValidateExternalIdRelationships())
        )

        model_domain_object_validation_errors = (
            existing_models
            | beam.ParDo(
                ValidateModelDomainObjectInstances(),
                self._get_model_domain_object_instance,
                self._get_domain_object_validation_type)
        )

        error_pcolls = (
            deletion_errors, timestamp_errors, id_errors,
            ids_in_field_validation_error,
            model_domain_object_validation_errors,
            external_id_relationships_validation_errors)
        return error_pcolls | beam.Flatten()

    def _get_model_domain_object_instance(self, unused_item):
        """Returns a domain object instance created from the model.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            *. A domain object to validate.
        """
        return None

    def _get_domain_object_validation_type(self, unused_item):
        """Returns the type of domain object validation to be performed.

        Some of the storage models support a strict/non strict mode depending
        on whether the model is published or not. Currently the models which
        provide this feature are collection, exploration and topic models.

        Other models do not support any strict/non strict validation. So,
        this function returns neutral mode in the base class. It can be
        overridden by subclasses to enable strict/non strict mode, if needed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. The type of validation mode: neutral, strict or non strict.
        """
        return VALIDATION_MODE_NEUTRAL

    def _get_external_id_relationships(self, item):
        """Returns a mapping of external id to model class.

        This should be implemented by subclasses.

        Args:
            item: datastore_services.Model. Entity to validate.

        Returns:
            list(ExternalModelFetcherDetails). A list whose values are
            ExternalModelFetcherDetails instances each representing
            the class and ids for a single type of external model to fetch.

        Raises:
            NotImplementedError. This function has not yet been implemented.
        """
        raise NotImplementedError(
            'The _get_external_id_relationships() method is missing from the '
            'derived class. It should be implemented in the derived class.')
