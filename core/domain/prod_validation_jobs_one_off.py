# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for validating prod models."""
from core import jobs
from core.platform import models

(user_models, exp_models, collection_models, feedback_models) = (
    models.Registry.import_models([
        models.NAMES.user, models.NAMES.exploration,
        models.NAMES.collection, models.NAMES.feedback]))
datastore_services = models.Registry.import_datastore_services()


class BaseModelValidator(object):
    """Base class for validating models."""

    errors = {}
    # external_model_instances is keyed by field name. Each value consists
    # of the model class and a list of (external_key, external_model) tuples.
    external_model_instances = {}

    @classmethod
    def _get_external_id_relationships(cls, item):
        """Defines a mapping of external id to model class.

        Args:
            item: ndb.Model. Entity to validate.

        Returns:
            dict(str, (ndb.Model, list(str)). A dictionary whose keys are
            field names of the model to validate, and whose values are tuples
            that consist of the external model class and list of keys to fetch.
        """
        raise NotImplementedError

    @classmethod
    def _validate_external_id_relationships(cls, item):
        """Check whether the external id properties on the model correspond
        to valid instances.

        Args:
            item: ndb.Model. Entity to validate.
        """
        for field_name, (model_class, model_id_model_tuples) in (
                cls.external_model_instances.iteritems()):
            for model_id, model in model_id_model_tuples:
                if model is None or model.deleted:
                    cls.errors['%s field check' % field_name] = (
                        'Model id %s: based on field %s having'
                        ' value %s, expect model %s with id %s but it doesn\'t'
                        ' exist' % (
                            item.id, field_name, model_id,
                            str(model_class.__name__), model_id))

    @classmethod
    def _fetch_external_model_instances(cls, item):
        """Fetch external models based on _get_external_id_relationships.

        This should be called before we call other _validate methods.

        Args:
            item: ndb.Model. Entity to validate.
        """
        multiple_models_keys_to_fetch = {}
        for field_name_debug, (model_class, keys_to_fetch) in (
                cls._get_external_id_relationships(item).iteritems()):
            multiple_models_keys_to_fetch[field_name_debug] = (
                model_class, keys_to_fetch)
        fetched_model_instances = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                multiple_models_keys_to_fetch.values()))
        for (field_name, (model_class, field_values)), external_models in zip(
                multiple_models_keys_to_fetch.iteritems(),
                fetched_model_instances):
            cls.external_model_instances[field_name] = (
                model_class, zip(field_values, external_models))

    @classmethod
    def _get_validation_functions(cls):
        """Returns the list of validation function to run.

        Each validation function should accept only a single arg, which is the
        model instance to validate.
        """
        raise NotImplementedError

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_model_instances and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        cls.errors.clear()
        cls.external_model_instances.clear()
        cls._fetch_external_model_instances(item)

        cls._validate_external_id_relationships(item)
        for func in cls._get_validation_functions():
            func(item)


class UserSubscriptionsModelValidator(BaseModelValidator):
    """Class for validating UserSubscriptionsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'activity_ids': (exp_models.ExplorationModel, item.activity_ids),
            'collection_ids': (
                collection_models.CollectionModel,
                item.collection_ids),
            'general_feedback_thread_ids': (
                feedback_models.GeneralFeedbackThreadModel,
                item.general_feedback_thread_ids),
            'creator_ids': (user_models.UserSettingsModel, item.creator_ids),
            'id': (user_models.UserSettingsModel, [item.id]),
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class ExplorationModelValidator(BaseModelValidator):
    """Class for validating ExplorationModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        state_id_mapping_model_ids = [
            '%s.%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'state_id_mapping_model': (
                exp_models.StateIdMappingModel,
                state_id_mapping_model_ids)
        }

    @classmethod
    def _validate_state_name(cls, item):
        """Validate that state name of StateIdMappingModel matches
        corresponding ExplorationModel states.

        Args:
            item: ExplorationModel to validate.
        """
        _, state_id_mapping_model_tuples = (
            cls.external_model_instances['state_id_mapping_model'])
        state_id_mapping_model = state_id_mapping_model_tuples[0][1]
        if state_id_mapping_model:
            if (
                    len(state_id_mapping_model.state_names_to_ids) !=
                    len(item.states)):
                cls.errors['exploration state check'] = (
                    'Model id %s: Corresponding StateIdMappingModel %s has '
                    '%d states but model has %d' % (
                        item.id, state_id_mapping_model.id,
                        len(state_id_mapping_model.state_names_to_ids),
                        len(item.states)))
            for state_name in (
                    state_id_mapping_model.state_names_to_ids.iterkeys()):
                if state_name not in item.states:
                    cls.errors['exploration state check'] = (
                        'Model id %s: Corresponding StateIdMappingModel %s has '
                        'state name %s but model doesn\'t' %
                        (item.id, state_id_mapping_model.id, state_name))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_state_name]


MODEL_TO_VALIDATOR_MAPPING = {
    user_models.UserSubscriptionsModel: UserSubscriptionsModelValidator,
    exp_models.ExplorationModel: ExplorationModelValidator,
}


class ProdValidationAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits and validates production models."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return MODEL_TO_VALIDATOR_MAPPING.keys()

    @staticmethod
    def map(model_instance):
        if not model_instance.deleted:
            if type(model_instance) in MODEL_TO_VALIDATOR_MAPPING:  # pylint: disable=unidiomatic-typecheck
                model_name = model_instance.__class__.__name__
                validator_cls = MODEL_TO_VALIDATOR_MAPPING[type(model_instance)]
                validator = validator_cls()
                validator.validate(model_instance)
                if len(validator.errors) > 0:
                    for error_key, error_val in (
                            validator.errors.iteritems()):
                        yield (
                            'failed validation check for %s of %s' % (
                                error_key, model_name),
                            error_val)
                else:
                    yield (
                        'fully-validated %s' % model_name, 1)

    @staticmethod
    def reduce(key, values):
        if 'fully-validated' in key:
            yield (key, len(values))
        else:
            yield (key, values)
