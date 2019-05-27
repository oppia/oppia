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

import datetime
import re

from constants import constants
from core import jobs
from core.domain import activity_domain
from core.platform import models
import feconf
import schema_utils

(
    activity_models, audit_models, collection_models, email_models, exp_models,
    feedback_models, user_models,) = (
        models.Registry.import_models([
            models.NAMES.activity, models.NAMES.audit, models.NAMES.collection,
            models.NAMES.email, models.NAMES.exploration, models.NAMES.feedback,
            models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()


class BaseModelValidator(object):
    """Base class for validating models."""

    errors = {}
    # external_models is keyed by field name. Each value consists
    # of the model class and a list of (external_key, external_model_instance)
    # tuples.
    external_models = {}

    @classmethod
    def _get_model_id_regex(cls, item):
        """Defines a regex for model id.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        raise NotImplementedError

    @classmethod
    def _validate_model_id(cls, item):
        """Checks whether the id of model matches the regex specified for
        the model.

        Args:
            item: ndb.Model. Entity to validate.
        """
        regex_string = cls._get_model_id_regex(item)
        if not re.compile(regex_string).match(str(item.id)):
            cls.errors['model id check'] = (
                'Model id %s: Model id does not match regex pattern') % item.id

    @classmethod
    def _get_json_properties_schema(cls):
        """Defines a schema for model properties.

        Returns:
            dict(str, dict). A dictionary whose keys are names of model
            properties and values are schema for these properties.
        """
        raise NotImplementedError

    @classmethod
    def _validate_model_json_properties(cls, item):
        """Checks that the properties defined in the model follow a specified
        schema.

        Args:
            item: ndb.Model. Entity to validate.
        """
        properties_schema_dict = cls._get_json_properties_schema()

        for property_name, property_schema in (
                properties_schema_dict.iteritems()):
            try:
                schema_utils.normalize_against_schema(
                    getattr(item, property_name), property_schema)
            except Exception as e:
                cls.errors['%s schema check' % property_name] = (
                    'Model id %s: Property does not match the schema '
                    'with the error %s' % (item.id, e))

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        """Defines a domain object instance created from the model.

        Returns:
            A domain object instance.
        """
        raise NotImplementedError

    @classmethod
    def _validate_model_domain_object_instances(cls, item):
        """Checks that model instance passes the validation of the domain
        object for model.
        """
        model_domain_object_instances = cls._get_model_domain_object_instances(
            item)
        for model_domain_object_instance in model_domain_object_instances:
            try:
                model_domain_object_instance.validate()
            except Exception as e:
                cls.errors['domain object check'] = (
                    'Model id %s: Model fails domain validation with the '
                    'error %s' % (item.id, e))

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
                cls.external_models.iteritems()):
            for model_id, model in model_id_model_tuples:
                if model is None or model.deleted:
                    cls.errors['%s field check' % field_name] = (
                        'Model id %s: based on field %s having'
                        ' value %s, expect model %s with id %s but it doesn\'t'
                        ' exist' % (
                            item.id, field_name, model_id,
                            str(model_class.__name__), model_id))

    @classmethod
    def _fetch_external_models(cls, item):
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
            cls.external_models[field_name] = (
                model_class, zip(field_values, external_models))

    @classmethod
    def _validate_model_time_fields(cls, item):
        """Checks the following relation for the model:
        model.created_on <= model.last_updated <= current time.
        """
        if item.created_on > item.last_updated:
            cls.errors['time field relation check'] = (
                'Model id %s: The created_on field has a value %s which is '
                'greater than the value %s of last_updated field'
                ) % (item.id, item.created_on, item.last_updated)

        current_datetime = datetime.datetime.utcnow()
        if item.last_updated > current_datetime:
            cls.errors['current time check'] = (
                'Model id %s: The last_updated field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.last_updated)

    @classmethod
    def _get_validation_functions(cls):
        """Returns the list of validation function to run.

        Each validation function should accept only a single arg, which is the
        model instance to validate.
        """
        raise NotImplementedError

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_models and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        cls.errors.clear()
        cls.external_models.clear()
        cls._fetch_external_models(item)

        cls._validate_model_id(item)
        cls._validate_model_time_fields(item)
        cls._validate_model_json_properties(item)
        cls._validate_model_domain_object_instances(item)
        cls._validate_external_id_relationships(item)
        for func in cls._get_validation_functions():
            func(item)


class ActivityReferencesModelValidator(BaseModelValidator):
    """Class for validating ActivityReferencesModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        regex_list = [
            item + '$' for item in feconf.ALL_ACTIVITY_REFERENCE_LIST_TYPES]
        regex_string = '|'.join(regex_list)
        return regex_string

    @classmethod
    def _get_json_properties_schema(cls):
        activity_references_dict_schema = {
            'type': 'dict',
            'properties': [{
                'name': 'type',
                'schema': {
                    'type': 'unicode',
                },
            }, {
                'name': 'id',
                'schema': {
                    'type': 'unicode'
                }
            }]
        }
        activity_references_schema = {
            'type': 'list',
            'items': activity_references_dict_schema
        }

        return {
            'activity_references': activity_references_schema
        }

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        model_domain_object_instances = []

        try:
            for obj in item.activity_references:
                model_domain_object_instances.append(
                    activity_domain.ActivityReference(obj['type'], obj['id']))
        except Exception as e:
            cls.errors['fetch properties'] = (
                'Model id %s: Model properties cannot be fetched completely '
                'with the error %s') % (item.id, e)
            return []

        return model_domain_object_instances

    @classmethod
    def _get_external_id_relationships(cls, item):
        exploration_ids = []
        collection_ids = []

        try:
            for obj in item.activity_references:
                if obj['type'] == constants.ACTIVITY_TYPE_EXPLORATION:
                    exploration_ids.append(obj['id'])
                elif obj['type'] == constants.ACTIVITY_TYPE_COLLECTION:
                    collection_ids.append(obj['id'])
        except Exception as e:
            cls.errors['fetch properties'] = (
                'Model id %s: Model properties cannot be fetched completely '
                'with the error %s') % (item.id, e)
            return {}

        return {
            'exploration_ids': (exp_models.ExplorationModel, exploration_ids),
            'collection_ids': (
                collection_models.CollectionModel, collection_ids),
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class RoleQueryAuditModelValidator(BaseModelValidator):
    """Class for validating RoleQueryAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        regex_string = '%s\\.\\d*\\.%s\\.\\d*$' % (item.user_id, item.intent)
        return regex_string

    @classmethod
    def _get_json_properties_schema(cls):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {'user_id': (user_models.UserSettingsModel, [item.user_id])}

    @classmethod
    def _validate_user_id_belongs_to_admin(cls, item):
        """Validate that user id of model belongs to an admin.

        Args:
            item: RoleQueryAuditModel to validate.
        """
        _, user_id_models = (cls.external_models['user_id'])
        user_id_model = user_id_models[0][1]
        if user_id_model and not user_id_model.deleted:
            if user_id_model.role != feconf.ROLE_ID_ADMIN:
                cls.errors['admin check'] = (
                    'Model id %s: User id %s in model does not belong '
                    'to an admin') % (item.id, item.user_id)

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_user_id_belongs_to_admin]


class SentEmailModelValidator(BaseModelValidator):
    """Class for validating SentEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        regex_string = '%s\\.\\..*$' % item.intent
        return regex_string

    @classmethod
    def _get_json_properties_schema(cls):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'recipient_id': (
                user_models.UserSettingsModel, [item.recipient_id]),
            'sender_id': (user_models.UserSettingsModel, [item.sender_id]),
        }

    @classmethod
    def _validate_sent_datetime(cls, item):
        """Validate that sent_datetime of model is less than current time.

        Args:
            item: SentEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls.errors['sent datetime check'] = (
                'Model id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.sent_datetime)

    @classmethod
    def _validate_sender_email(cls, item):
        """Validate that sender email corresponds to email of user obtained
        by using the sender_id.

        Args:
            item: SentEmailModel to validate.
        """
        _, sender_models = (cls.external_models['sender_id'])
        sender_model = sender_models[0][1]
        if sender_model and not sender_model.deleted:
            if sender_model.email != item.sender_email:
                cls.errors['sender email check'] = (
                    'Model id %s: Sender email %s in model does not match '
                    'with email %s of user obtained through sender id') % (
                        item.id, item.sender_email, sender_model.email)

    @classmethod
    def _validate_recipient_email(cls, item):
        """Validate that recipient email corresponds to email of user obtained
        by using the recipient_id.

        Args:
            item: SentEmailModel to validate.
        """
        _, recipient_models = (cls.external_models['recipient_id'])
        recipient_model = recipient_models[0][1]
        if recipient_model and not recipient_model.deleted:
            if recipient_model.email != item.recipient_email:
                cls.errors['recipient email check'] = (
                    'Model id %s: Recipient email %s in model does not match '
                    'with email %s of user obtained through recipient id') % (
                        item.id, item.recipient_email, recipient_model.email)

    @classmethod
    def _get_validation_functions(cls):
        return [
            cls._validate_sent_datetime, cls._validate_sender_email,
            cls._validate_recipient_email]


class BulkEmailModelValidator(BaseModelValidator):
    """Class for validating BulkEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'recipient_id': (
                user_models.UserSettingsModel, item.recipient_ids),
            'sender_id': (user_models.UserSettingsModel, [item.sender_id]),
        }

    @classmethod
    def _validate_id_length(cls, item):
        """Validate that model id has length 12.

        Args:
            item: BulkEmailModel to validate.
        """
        if len(item.id) != 12:
            cls.errors['model id length check'] = (
                'Model id %s: Model id should be of length 12 but instead has '
                'length %s' % (item.id, len(item.id)))

    @classmethod
    def _validate_sent_datetime(cls, item):
        """Validate that sent_datetime of model is less than current time.

        Args:
            item: BulkEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls.errors['sent datetime check'] = (
                'Model id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.sent_datetime)

    @classmethod
    def _validate_sender_email(cls, item):
        """Validate that sender email corresponds to email of user obtained
        by using the sender_id.

        Args:
            item: BulkEmailModel to validate.
        """
        _, sender_models = (cls.external_models['sender_id'])
        sender_model = sender_models[0][1]
        if sender_model and not sender_model.deleted:
            if sender_model.email != item.sender_email:
                cls.errors['sender email check'] = (
                    'Model id %s: Sender email %s in model does not match '
                    'with email %s of user obtained through sender id') % (
                        item.id, item.sender_email, sender_model.email)

    @classmethod
    def _get_validation_functions(cls):
        return [
            cls._validate_id_length, cls._validate_sent_datetime,
            cls._validate_sender_email]


class GeneralFeedbackEmailReplyToIdModelValidator(BaseModelValidator):
    """Class for validating GeneralFeedbackEmailReplyToIdModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'item.id.user_id': (
                user_models.UserSettingsModel, [
                    item.id[:item.id.find('.')]]),
            'item.id.thread_id': (
                feedback_models.GeneralFeedbackThreadModel, [
                    item.id[item.id.find('.') + 1:]]),
        }

    @classmethod
    def _validate_reply_to_id_length(cls, item):
        """Validate that reply_to_id length is less than or equal to
        REPLY_TO_ID_LENGTH.

        Args:
            item: GeneralFeedbackEmailReplyToIdModel to validate.
        """
        if len(item.reply_to_id) > email_models.REPLY_TO_ID_LENGTH:
            cls.errors['reply_to_id length check'] = (
                'Model id %s: reply_to_id %s should have length less than or '
                'equal to %s but instead has length %s' % (
                    item.id, item.reply_to_id, email_models.REPLY_TO_ID_LENGTH,
                    len(item.reply_to_id)))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_reply_to_id_length]


class UserSubscriptionsModelValidator(BaseModelValidator):
    """Class for validating UserSubscriptionsModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

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
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

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
            cls.external_models['state_id_mapping_model'])
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
    activity_models.ActivityReferencesModel: ActivityReferencesModelValidator,
    audit_models.RoleQueryAuditModel: RoleQueryAuditModelValidator,
    email_models.SentEmailModel: SentEmailModelValidator,
    email_models.BulkEmailModel: BulkEmailModelValidator,
    email_models.GeneralFeedbackEmailReplyToIdModel: (
        GeneralFeedbackEmailReplyToIdModelValidator),
    exp_models.ExplorationModel: ExplorationModelValidator,
    user_models.UserSubscriptionsModel: UserSubscriptionsModelValidator,
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
