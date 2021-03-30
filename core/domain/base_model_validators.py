# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Validators for base prod models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import datetime
import re

from constants import constants
from core.domain import rights_manager
from core.platform import models
import feconf
import python_utils
import utils

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()

ERROR_CATEGORY_COMMIT_CMD_CHECK = 'commit cmd check'
ERROR_CATEGORY_COMMIT_STATUS_CHECK = 'post commit status check'
ERROR_CATEGORY_COMMIT_MESSAGE_CHECK = 'commit message check'
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


class BaseModelValidator(python_utils.OBJECT):
    """Base class for validating models."""

    # The dict to store errors found during audit of model.
    errors = collections.defaultdict(list)
    # field_name_to_external_model_references is keyed by field name.
    # The field name represents a unique identifier provided by the storage
    # model for which the external model is being fetched. Each value consists
    # of a list of ExternalModelReference objects.
    field_name_to_external_model_references = collections.defaultdict(list)

    @classmethod
    def _add_error(cls, error_category, error_message):
        """Adds an error to the errors dict.

        This method can be overridden by subclasses, if needed.

        Args:
            error_category: str. The error category in which the error
                message should be added.
            error_message: str. The error message.
        """
        cls.errors[error_category].append(error_message)

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for model id.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

    @classmethod
    def _validate_model_id(cls, item):
        """Checks whether the id of model matches the regex specified for
        the model.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        regex_string = cls._get_model_id_regex(item)
        if not re.compile(regex_string).match(item.id):
            cls._add_error(
                'model %s' % ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))

    @classmethod
    def _get_model_domain_object_instance(cls, unused_item):
        """Returns a domain object instance created from the model.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            *. A domain object to validate.
        """
        return None

    @classmethod
    def _get_domain_object_validation_type(cls, unused_item):
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

    @classmethod
    def _validate_model_domain_object_instances(cls, item):
        """Checks that model instance passes the validation of the domain
        object for model.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        try:
            domain_object = (
                cls._get_model_domain_object_instance(item))
            if domain_object is None:
                # No domain object exists for this storage model class.
                return
            validation_type = cls._get_domain_object_validation_type(item)
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
            cls._add_error(
                ERROR_CATEGORY_DOMAIN_OBJECT_CHECK,
                'Entity id %s: Entity fails domain validation with the '
                'error %s' % (item.id, e))

    @classmethod
    def _get_external_id_relationships(cls, item):
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

    @classmethod
    def _validate_external_id_relationships(cls, item):
        """Check whether the external id properties on the model correspond
        to valid instances.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        for field_name, external_model_references in (
                cls.field_name_to_external_model_references.items()):
            for external_model_reference in external_model_references:
                model = external_model_reference.model_instance

                if model is None or model.deleted:
                    model_class = external_model_reference.model_class
                    model_id = external_model_reference.model_id
                    cls._add_error(
                        '%s %s' % (field_name, ERROR_CATEGORY_FIELD_CHECK),
                        'Entity id %s: based on field %s having'
                        ' value %s, expected model %s with id %s but it '
                        'doesn\'t exist' % (
                            item.id, field_name, model_id,
                            model_class.__name__, model_id))

    @classmethod
    def _fetch_field_name_to_external_model_references(cls, item):
        """Fetch external models based on _get_external_id_relationships.

        This should be called before we call other _validate methods.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        multiple_models_ids_to_fetch = {}

        for external_model_fetcher_details in (
                cls._get_external_id_relationships(item)):
            for error in external_model_fetcher_details.model_id_errors:
                cls._add_error(
                    ERROR_CATEGORY_INVALID_IDS_IN_FIELD,
                    'Entity id %s: %s' % (item.id, error))
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

            for (model_id, model_instance) in python_utils.ZIP(
                    model_ids, fetched_model_instances):
                cls.field_name_to_external_model_references[
                    field_name].append(
                        ExternalModelReference(
                            model_class, model_id, model_instance))

    @classmethod
    def _validate_model_time_fields(cls, item):
        """Checks the following relation for the model:
        model.created_on <= model.last_updated <= current time.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        # We add a tolerance of 1 second because, for some models, created_on
        # and last_updated are the same time, and occur within milliseconds of
        # each other. In such cases, created_on might end up being very slightly
        # greater than last_updated.
        if item.created_on > (
                item.last_updated + datetime.timedelta(seconds=1)):
            cls._add_error(
                ERROR_CATEGORY_TIME_FIELD_CHECK,
                'Entity id %s: The created_on field has a value %s which '
                'is greater than the value %s of last_updated field'
                % (item.id, item.created_on, item.last_updated))

        current_datetime = datetime.datetime.utcnow()
        if item.last_updated > current_datetime:
            cls._add_error(
                ERROR_CATEGORY_CURRENT_TIME_CHECK,
                'Entity id %s: The last_updated field has a value %s which '
                'is greater than the time when the job was run'
                % (item.id, item.last_updated))

    @classmethod
    def _get_custom_validation_functions(cls):
        """Returns the list of custom validation functions to run.

        This method can be overridden by subclasses, if needed.

        Each validation function should accept only a single arg, which is the
        model instance to validate.

        Returns:
            list(function). The list of custom validation functions to run.
        """
        return []

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        """Returns the list of custom validation functions to run.

        This method can be overridden by subclasses, if needed.

        Each validation function should accept two args, which are the
        model instance to validate and the external instances for the class.

        Returns:
            list(function). The list of custom validation functions to run.
        """
        return []

    @classmethod
    def validate(cls, item):
        """Run _fetch_field_name_to_external_model_references and all
        _validate functions.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        cls.errors.clear()
        cls.field_name_to_external_model_references.clear()
        cls._fetch_field_name_to_external_model_references(item)

        cls._validate_model_id(item)
        cls._validate_model_time_fields(item)
        cls._validate_model_domain_object_instances(item)
        cls._validate_external_id_relationships(item)

        for func in cls._get_custom_validation_functions():
            func(item)

        for func in cls._get_external_instance_custom_validation_functions():
            func(item, cls.field_name_to_external_model_references)

    @classmethod
    def validate_deleted(cls, item):
        """Validate that the models marked as deleted are hard-deleted after
        eight weeks.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        cls.errors.clear()
        date_now = datetime.datetime.utcnow()
        date_before_which_models_should_be_deleted = (
            date_now - feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED)
        period_to_hard_delete_models_in_days = (
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)
        if item.last_updated < date_before_which_models_should_be_deleted:
            cls._add_error(
                'entity %s' % ERROR_CATEGORY_STALE_CHECK,
                'Entity id %s: model marked as deleted is older than %s weeks'
                % (item.id, python_utils.divide(
                    period_to_hard_delete_models_in_days, 7))
            )


class BaseSummaryModelValidator(BaseModelValidator):
    """Base class for validating summary models."""

    @classmethod
    def _get_external_model_properties(cls):
        """Returns a tuple of external models and properties.

        This should be implemented by subclasses.

        Returns:
            tuple(str, str, dict). A tuple with first element as
            external model name, second element as a key to fetch
            external model details from
            cls.field_name_to_external_model_references
            and the third element as a properties dict with key as
            property name in summary model and value as property name
            in external model.

        Raises:
            NotImplementedError. This function has not yet been implemented.
        """
        raise NotImplementedError(
            'The _get_external_model_properties() method is missing from the '
            'derived class. It should be implemented in the derived class.')

    @classmethod
    def _validate_external_model_properties(
            cls, item, field_name_to_external_model_references):
        """Validate that properties of the model match the corresponding
        properties of the external model.

        Args:
            item: datastore_services.Model. BaseSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """

        for (
                external_model_name,
                external_model_field_key,
                external_model_properties_dict
            ) in cls._get_external_model_properties():

            external_model_references = (
                field_name_to_external_model_references[
                    external_model_field_key])

            for external_model_reference in external_model_references:
                external_model = external_model_reference.model_instance

                if external_model is None or external_model.deleted:
                    model_class = external_model_reference.model_class
                    model_id = external_model_reference.model_id
                    cls._add_error(
                        '%s %s' % (
                            external_model_field_key,
                            ERROR_CATEGORY_FIELD_CHECK),
                        'Entity id %s: based on field %s having value %s, '
                        'expected model %s with id %s but it doesn\'t'
                        ' exist' % (
                            item.id, external_model_field_key,
                            model_id, model_class.__name__, model_id))
                    continue
                for (property_name, external_model_property_name) in (
                        external_model_properties_dict.items()):
                    value_in_summary_model = getattr(item, property_name)
                    value_in_external_model = getattr(
                        external_model, external_model_property_name)

                    if value_in_summary_model != value_in_external_model:
                        cls._add_error(
                            '%s %s' % (
                                property_name, ERROR_CATEGORY_FIELD_CHECK),
                            'Entity id %s: %s field in entity: %s does not '
                            'match corresponding %s %s field: %s' % (
                                item.id, property_name,
                                value_in_summary_model,
                                external_model_name,
                                external_model_property_name,
                                value_in_external_model))

    @classmethod
    def validate(cls, item):
        """Run _fetch_field_name_to_external_model_references and
        all _validate functions.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        super(BaseSummaryModelValidator, cls).validate(item)

        cls._validate_external_model_properties(
            item, cls.field_name_to_external_model_references)


class BaseSnapshotContentModelValidator(BaseModelValidator):
    """Base class for validating snapshot content models."""

    # The name of the model which is to be used in the error messages.
    # This can be overridden by subclasses, if needed.
    MODEL_NAME = 'snapshot content'

    # The name of the external model in lowercase which is used to obtain
    # the name of the key for the fetch of external model and the name
    # of the external model to be used in error messages.
    # For example, if external model is CollectionRights, then
    # EXTERNAL_MODEL_NAME = collection rights, key to fetch = collection_rights
    # Name of model to be used in error message = CollectionRights
    # This should be overridden by subclasses.
    EXTERNAL_MODEL_NAME = ''

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9-_]{1,%s}-\\d+$' % base_models.ID_LENGTH

    @classmethod
    def _validate_base_model_version_from_item_id(
            cls, item, field_name_to_external_model_references):
        """Validate that external model corresponding to item.id
        has a version greater than or equal to the version in item.id.

        Args:
            item: datastore_services.Model. BaseSnapshotContentModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """

        if cls.EXTERNAL_MODEL_NAME == '':
            raise Exception('External model name should be specified')

        external_model_name = cls.EXTERNAL_MODEL_NAME
        if item.id.startswith('rights'):
            external_model_name = external_model_name + ' rights'

        name_split_by_space = external_model_name.split(' ')
        key_to_fetch = ('_').join(name_split_by_space)
        capitalized_external_model_name = ('').join([
            val.capitalize() for val in name_split_by_space])

        external_model_references = (
            field_name_to_external_model_references['%s_ids' % key_to_fetch])

        version = item.id[item.id.rfind('-') + 1:]

        for external_model_reference in external_model_references:
            external_model = external_model_reference.model_instance

            if external_model is None or external_model.deleted:
                model_class = external_model_reference.model_class
                model_id = external_model_reference.model_id
                cls._add_error(
                    '%s_ids %s' % (key_to_fetch, ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field %s_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, key_to_fetch, model_id,
                        model_class.__name__, model_id))
                continue
            if int(external_model.version) < int(version):
                cls._add_error(
                    '%s model %s' % (
                        cls.EXTERNAL_MODEL_NAME,
                        ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: %s model corresponding to '
                    'id %s has a version %s which is less than '
                    'the version %s in %s model id' % (
                        item.id, capitalized_external_model_name,
                        external_model.id, external_model.version, version,
                        cls.MODEL_NAME))

    @classmethod
    def validate(cls, item):
        """Run _fetch_field_name_to_external_model_references and
        all _validate functions.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        super(BaseSnapshotContentModelValidator, cls).validate(item)

        cls._validate_base_model_version_from_item_id(
            item, cls.field_name_to_external_model_references)


class BaseSnapshotMetadataModelValidator(BaseSnapshotContentModelValidator):
    """Base class for validating snapshot metadata models."""

    MODEL_NAME = 'snapshot metadata'

    @classmethod
    def _validate_commit_type(cls, item):
        """Validates that commit type is valid.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        if item.commit_type not in (
                base_models.VersionedModel.COMMIT_TYPE_CHOICES):
            cls._add_error(
                'commit %s' % ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Commit type %s is not allowed' % (
                    item.id, item.commit_type))

    @classmethod
    def _get_change_domain_class(cls, unused_item):
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
            'The _get_change_domain_class() method is missing from the derived '
            'class. It should be implemented in the derived class.')

    @classmethod
    def _validate_commit_cmds_schema(cls, item):
        """Validates schema of commit commands in commit_cmds dict.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        change_domain_object = cls._get_change_domain_class(item)
        if change_domain_object is None:
            # This is for cases where id of the entity is invalid
            # and no commit command domain object is found for the entity.
            # For example, if a CollectionCommitLogEntryModel does
            # not have id starting with collection/rights, there is
            # no commit command domain object defined for this model.
            cls._add_error(
                ERROR_CATEGORY_COMMIT_CMD_CHECK,
                'Entity id %s: No commit command domain object defined '
                'for entity with commands: %s' % (item.id, item.commit_cmds))
            return
        for commit_cmd_dict in item.commit_cmds:
            if not commit_cmd_dict:
                continue
            try:
                change_domain_object(commit_cmd_dict)
            except Exception as e:
                cmd_name = commit_cmd_dict.get('cmd')
                cls._add_error(
                    'commit cmd %s check' % cmd_name,
                    'Entity id %s: Commit command domain validation for '
                    'command: %s failed with error: %s' % (
                        item.id, commit_cmd_dict, e))

    @classmethod
    def _validate_commit_message_length(cls, item):
        """Validates that commit_message length is less than
        MAX_COMMIT_MESSAGE_LENGTH.

        Args:
            item: datastore_services.Model. Entity to validate.
        """

        if item.commit_message and (
                len(item.commit_message) > constants.MAX_COMMIT_MESSAGE_LENGTH):
            cls._add_error(
                ERROR_CATEGORY_COMMIT_MESSAGE_CHECK,
                'Entity id %s: Commit message larger than accepted length'
                % (item.id))

    @classmethod
    def validate(cls, item):
        """Run _fetch_field_name_to_external_model_references and all
        _validate functions.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        super(BaseSnapshotMetadataModelValidator, cls).validate(item)

        cls._validate_commit_type(item)
        cls._validate_commit_cmds_schema(item)
        cls._validate_commit_message_length(item)


class BaseCommitLogEntryModelValidator(BaseSnapshotMetadataModelValidator):
    """Base class for validating commit log entry models."""

    MODEL_NAME = 'commit log entry'

    @classmethod
    def _validate_post_commit_status(cls, item):
        """Validates that post_commit_status is either public or private.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        if item.post_commit_status not in [
                feconf.POST_COMMIT_STATUS_PUBLIC,
                feconf.POST_COMMIT_STATUS_PRIVATE]:
            cls._add_error(
                ERROR_CATEGORY_COMMIT_STATUS_CHECK,
                'Entity id %s: Post commit status %s is invalid' % (
                    item.id, item.post_commit_status))

    @classmethod
    def _validate_post_commit_status_is_public(cls, item):
        """Validates that post_commit_status is only public.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        if item.post_commit_status != feconf.POST_COMMIT_STATUS_PUBLIC:
            cls._add_error(
                ERROR_CATEGORY_COMMIT_STATUS_CHECK,
                'Entity id %s: Post commit status %s is invalid' % (
                    item.id, item.post_commit_status))

    @classmethod
    def _validate_post_commit_is_private(cls, item):
        """Validates that post_commit_is_private is true iff
        post_commit_status is private.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        if item.post_commit_status == feconf.POST_COMMIT_STATUS_PRIVATE and (
                not item.post_commit_is_private):
            cls._add_error(
                ERROR_CATEGORY_PRIVATE_COMMIT_CHECK,
                'Entity id %s: Post commit status is private but '
                'post_commit_is_private is False' % item.id)

        if item.post_commit_status == feconf.POST_COMMIT_STATUS_PUBLIC and (
                item.post_commit_is_private):
            cls._add_error(
                ERROR_CATEGORY_PRIVATE_COMMIT_CHECK,
                'Entity id %s: Post commit status is public but '
                'post_commit_is_private is True' % item.id)

    @classmethod
    def validate(cls, item):
        """Run _fetch_field_name_to_external_model_references and
        all _validate functions.

        Args:
            item: datastore_services.Model. Entity to validate.
        """
        super(BaseCommitLogEntryModelValidator, cls).validate(item)

        cls._validate_post_commit_status(item)

        if item.id.startswith('question') or item.id.startswith('skill'):
            cls._validate_post_commit_status_is_public(item)
        else:
            cls._validate_post_commit_is_private(item)


class BaseUserModelValidator(BaseModelValidator):
    """Class for validating BaseUserModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^%s$' % feconf.USER_ID_REGEX

    @classmethod
    def _validate_explorations_are_public(
            cls, item, field_name_to_external_model_references):
        """Validates that explorations for model are public.

        Args:
            item: datastore_services.Model. BaseUserModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        if 'exploration_ids' not in field_name_to_external_model_references:
            return

        exp_ids = []
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance

            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % ERROR_CATEGORY_FIELD_CHECK,
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            exp_ids.append(exploration_model.id)

        private_exp_ids = [
            exp_id for exp_id in exp_ids if (
                rights_manager.is_exploration_private(exp_id))]
        if private_exp_ids:
            cls._add_error(
                'public exploration check',
                'Entity id %s: Explorations with ids %s are private' % (
                    item.id, private_exp_ids))

    @classmethod
    def _validate_collections_are_public(
            cls, item, field_name_to_external_model_references):
        """Validates that collections for model are public.

        Args:
            item: datastore_services.Model. BaseUserModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        if 'collection_ids' not in field_name_to_external_model_references:
            return

        col_ids = []
        collection_model_references = (
            field_name_to_external_model_references['collection_ids'])

        for collection_model_reference in collection_model_references:
            collection_model = collection_model_reference.model_instance

            if collection_model is None or collection_model.deleted:
                model_class = collection_model_reference.model_class
                model_id = collection_model_reference.model_id
                cls._add_error(
                    'collection_ids %s' % ERROR_CATEGORY_FIELD_CHECK,
                    'Entity id %s: based on field collection_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            col_ids.append(collection_model.id)

        private_col_ids = [
            col_id for col_id in col_ids if (
                rights_manager.is_collection_private(col_id))]
        if private_col_ids:
            cls._add_error(
                'public collection check',
                'Entity id %s: Collections with ids %s are private' % (
                    item.id, private_col_ids))

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, unused_item):
        """Returns a list of common properties to dismatch. For example,
        the exploration ids present in a CompletedActivitiesModel
        should not be present in an IncompleteActivitiesModel. So,
        this function will return the following list for
        CompletedActivitiesModel:
        ['IncompleteActivitiesModel', 'exploration_ids', list of
        exploration_ids in completed activities, 'exploration_ids',
        list of exploration_ids in incomplete activities]

        This can be overridden by subclasses, if needed.

        Args:
            unused_item: datastore_services.Model. BaseUserModel to validate.

        Returns:
            list(tuple(str, str, list, str, list)). A list of tuple which
            consists of External model name, property name in model, list of
            property value in model, property name in external model, list of
            property value in external model.
        """
        return []

    @classmethod
    def _validate_common_properties_do_not_match(cls, item):
        """Validates that properties common with an external model
        are different in item and external model.

        Args:
            item: datastore_services.Model. BaseUserModel to validate.
        """
        common_properties = (
            cls._get_common_properties_of_external_model_which_should_not_match(
                item))
        for property_details in common_properties:
            (
                external_model_name, property_name_in_model, value_in_model,
                property_name_in_external_model, value_in_external_model
            ) = property_details
            common_values = [
                value
                for value in value_in_model if value in (
                    value_in_external_model)]
            if common_values:
                cls._add_error(
                    '%s match check' % property_name_in_model,
                    'Entity id %s: Common values for %s in entity and '
                    '%s in %s: %s' % (
                        item.id, property_name_in_model,
                        property_name_in_external_model, external_model_name,
                        common_values))
