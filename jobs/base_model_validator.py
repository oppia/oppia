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

import collections
import datetime
import re

from core.domain import cron_services
from core.platform import models
from jobs import base_model_validator_errors as errors
from jobs import jobs_utils
import python_utils

import apache_beam as beam

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


MAX_CLOCK_SKEW_SECS = datetime.timedelta(seconds=1)

VALIDATION_MODE_NEUTRAL = 'neutral'
VALIDATION_MODE_STRICT = 'strict'
VALIDATION_MODE_NON_STRICT = 'non-strict'


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


class ValidateModelDomainObjectInstances(beam.doFn):
    """DoFn to check whether the model instance passes the validation of the
    domain object for model.
    """

    def process(self, domain_object, validation_type):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            domain_object: datastore_services.Model. A domain object to
            validate.
            validation_type: str. The type of validation mode: neutral,
            strict or non strict.

        Yields:
            ModelDomainObjectValidateError. Error for domain object validation.
        """
        try:
            if domain_object is None:
                pass
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
            yield errors.ModelDomainObjectValidateError(domain_object, e)


class ValidateIdsInModelFields(beam.doFn):
    """DoFn to check whether the ids in the fields of the model are valid.
    """

    def process(self, external_model_fetcher_details_and_model):
        external_model_fetcher_details, model = external_model_fetcher_details_and_model
        for error in external_model_fetcher_details.model_id_errors:
            yield errors.IdsInModelFieldValidationError(model, error)


class FetchFieldNameToExternalIdRelationships(beam.doFn):
    """DoFn to fetch external models based on _get_external_id_relationships.
    """

    def process(self, item, get_external_id_relationships_fn):
        """Function that defines how to process each element in a pipeline of
        models.

        Args:
            item: datastore_services.Model. Entity to validate.
            get_external_id_relationships_fn: function. The function to fetch 
                external id relationships for the model.
        
        yields:
            tuple(datastore_services.Model, str, ExternalModelReference).
                A tuple that consists of the model to be validated, the field
                name and the ExternalModelReference.
        """
        multiple_models_ids_to_fetch = {}

        for external_model_fetcher_details in (
                get_external_id_relationships_fn(item)):
            multiple_models_ids_to_fetch[
                external_model_fetcher_details.field_name] = (
                    external_model_fetcher_details.model_class,
                    external_model_fetcher_details.model_ids)

        fetched_model_instances_for_all_ids = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                list(multiple_models_ids_to_fetch.values())))

        for index, field_name in enumerate(multiple_models_ids_to_fetch):
            (model_class, model_ids) = (
                multiple_models_ids_to_fetch[field_name])
            fetched_model_instances = (
                fetched_model_instances_for_all_ids[index])

            external_model_references = []
            for (model_id, model_instance) in python_utils.ZIP(
                    model_ids, fetched_model_instances):
                external_model_references.append(ExternalModelReference(model_class, model_id, model_instance))    
            yield (item, field_name, external_model_references)


class ValidateExternalIdRelationships(beam.doFn):
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
    """Composite beam Transform which returns a pipeline of validation
    errors.
    """

    # field_name_to_external_model_references is keyed by field name.
    # The field name represents a unique identifier provided by the storage
    # model for which the external model is being fetched. Each value consists
    # of a list of ExternalModelReference objects.
    field_name_to_external_model_references = collections.defaultdict(list)


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

        ids_in_field_validation_error = (
            not_deleted
            | beam.Map(
                lambda x: (self._get_external_id_relationships(x), x))
            | beam.ParDo(ValidateIdsInModelFields())
        )

        model_and_field_name_and_external_model_references = (
            not_deleted
            | beam.ParDo(FetchFieldNameToExternalIdRelationships(), self._get_external_id_relationships))

        external_id_relationships_validation_errors = (
            model_and_field_name_and_external_model_references
            | beam.ParDo(ValidateExternalIdRelationships)
        )

        external_id_relationships_validation_errors = (
            model_and_field_name_and_external_model_references
            | beam.ParDo(ValidateExternalIdRelationships)
        )


        model_domain_object_validation_errors = (
            not_deleted
            | beam.ParDo(
                ValidateModelDomainObjectInstances(),
                self._get_model_domain_object_instance(),
                self._get_domain_object_validation_type)
        )

        return (
            (
                deletion_errors,
                time_field_validation_errors,
                model_id_validation_errors,
                ids_in_field_validation_error,
                model_domain_object_validation_errors,
                external_id_relationships_validation_errors)
            | beam.Flatten())

    def _get_model_id_regex(self):
        """Returns a regex for model id.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

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
