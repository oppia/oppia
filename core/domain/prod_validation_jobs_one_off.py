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

import csv
import datetime
import re

from constants import constants
from core import jobs
from core.domain import activity_domain
from core.domain import collection_services
from core.domain import commit_commands_domain
from core.domain import exp_services
from core.domain import recommendations_services
from core.domain import story_services
from core.platform import models
import feconf
import schema_utils

(
    activity_models, audit_models, collection_models, config_models,
    email_models, exp_models, feedback_models, file_models,
    recommendations_models, story_models, user_models,) = (
        models.Registry.import_models([
            models.NAMES.activity, models.NAMES.audit, models.NAMES.collection,
            models.NAMES.config, models.NAMES.email, models.NAMES.exploration,
            models.NAMES.feedback, models.NAMES.file,
            models.NAMES.recommendations, models.NAMES.story,
            models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()


class BaseModelValidator(object):
    """Base class for validating models."""

    errors = {}
    # external_models is keyed by field name. Each value consists
    # of the model class and a list of (external_key, external_model_instance)
    # tuples.
    external_models = {}
    is_commit_log_entry_model = False
    is_snapshot_metadata_model = False

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
    def _get_json_properties_schema(cls, item):
        """Defines a schema for model properties.

        Args:
            item: ndb.Model. Entity to validate.

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
        properties_schema_dict = cls._get_json_properties_schema(item)

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
    def _validate_commit_type(cls, item):
        """Validates that commit type is valid."""
        if item.commit_type not in ['create', 'edit', 'revert', 'delete']:
            cls.errors['commit type check'] = (
                'Model id %s: Commit type %s is not allowed') % (
                    item.id, item.commit_type)

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        """Defines a Commit command domain class.

        Returns:
            A domain object instance.
        """
        raise NotImplementedError

    @classmethod
    def _validate_commit_cmds_schema(cls, item):
        """Validates schema of commit commands in commit_cmds dict."""
        for commit_cmd_dict in item.commit_cmds:
            if len(commit_cmd_dict.keys()):
                name = commit_cmd_dict['cmd']
                parameters = commit_cmd_dict
                parameters.pop('cmd', None)
                commit_cmd_domain_object = cls._get_commit_cmd_domain_class()(
                    name=name, parameters=parameters)
                try:
                    commit_cmd_domain_object.validate()
                except Exception as e:
                    cls.errors['commit cmd %s check' % name] = (
                        'Model id %s: Commit command domain validation failed '
                        'with error: %s') % (item.id, e)

    @classmethod
    def _validate_post_commit_status(cls, item):
        """Validates that post_commit_status is either public or private."""
        if item.post_commit_status not in ['public', 'private']:
            cls.errors['post commit status check'] = (
                'Model id %s: Post commit status %s is invalid') % (
                    item.id, item.post_commit_status)

    @classmethod
    def _validate_post_commit_is_private(cls, item):
        """Validates that post_commit_is_private is true iff
        post_commit_status is private.
        """
        if item.post_commit_status == 'private' and not (
                item.post_commit_is_private):
            cls.errors['post commit is private check'] = (
                'Model id %s: Post commit status is private but '
                'post_commit_is_private is False') % item.id

        if item.post_commit_status == 'public' and (
                item.post_commit_is_private):
            cls.errors['post commit is private check'] = (
                'Model id %s: Post commit status is public but '
                'post_commit_is_private is True') % item.id

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

        if cls.is_commit_log_entry_model:
            cls._validate_commit_type(item)
            cls._validate_commit_cmds_schema(item)
            cls._validate_post_commit_status(item)
            cls._validate_post_commit_is_private(item)

        if cls.is_snapshot_metadata_model:
            cls._validate_commit_type(item)
            cls._validate_commit_cmds_schema(item)

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
    def _get_json_properties_schema(cls, item):
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
    def _get_commit_cmd_domain_class(cls):
        return None

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
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

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


class CollectionModelValidator(BaseModelValidator):
    """Class for validating CollectionModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        model_domain_object_instances = [
            collection_services.get_collection_from_model(item)]

        return model_domain_object_instances

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        nodes = item.collection_contents['nodes']
        exploration_model_ids = [node['exploration_id'] for node in nodes]
        collection_commit_log_entry_model_ids = [
            'collection-%s-%s' % (item.id, version) for version in range(
                1, item.version + 1)]
        collection_summary_model_ids = [item.id]
        collection_rights_model_ids = [item.id]
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'exploration_model': (
                exp_models.ExplorationModel, exploration_model_ids),
            'collection_commit_log_entry_model': (
                collection_models.CollectionCommitLogEntryModel,
                collection_commit_log_entry_model_ids),
            'collection_summary_model': (
                collection_models.CollectionSummaryModel,
                collection_summary_model_ids),
            'collection_rights_model': (
                collection_models.CollectionRightsModel,
                collection_rights_model_ids),
            'snapshot_metadata_model': (
                collection_models.CollectionSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                collection_models.CollectionSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class CollectionSnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating CollectionSnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.CollectionCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_model': (
                collection_models.CollectionModel,
                [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_collection_model_version_from_item_id(cls, item):
        """Validate that collection model corresponding to snapshot
        metadata model has a version greater than or equal to the in item.id.

        Args:
            item: CollectionSnapshotMetadataModel to validate.
        """
        _, collection_model_tuples = cls.external_models['collection_model']

        collection_model = collection_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(collection_model.version) < int(version):
            cls.errors['collection model version check'] = (
                'Model id %s: Collection model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot metadata model id' % (
                    item.id, collection_model.id, collection_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_collection_model_version_from_item_id]


class CollectionSnapshotContentModelValidator(BaseModelValidator):
    """Class for validating CollectionSnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_model': (
                collection_models.CollectionModel,
                [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_collection_model_version_from_item_id(cls, item):
        """Validate that collection model corresponding to snapshot
        content model has a version greater than or equal to the in item.id.

        Args:
            item: CollectionSnapshotContentModel to validate.
        """
        _, collection_model_tuples = cls.external_models['collection_model']

        collection_model = collection_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(collection_model.version) < int(version):
            cls.errors['collection model version check'] = (
                'Model id %s: Collection model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot content model id' % (
                    item.id, collection_model.id, collection_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_collection_model_version_from_item_id]


class CollectionRightsModelValidator(BaseModelValidator):
    """Class for validating CollectionRightsModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'collection_model': (
                collection_models.CollectionModel, [item.id]),
            'owner_user_model': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_model': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_model': (
                user_models.UserSettingsModel, item.viewer_ids),
            'snapshot_metadata_model': (
                collection_models.CollectionRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                collection_models.CollectionRightsSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: CollectionRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        epoch = datetime.datetime.utcfromtimestamp(0)
        current_msec = (
            datetime.datetime.utcnow() - epoch).total_seconds() * 1000.0
        if item.first_published_msec > current_msec:
            cls.errors['first published msec check'] = (
                'Model id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec)

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_first_published_msec]


class CollectionRightsSnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating CollectionRightsSnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.CollectionRightsCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_rights_model': (
                collection_models.CollectionRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_collection_model_version_from_item_id(cls, item):
        """Validate that collection rights model corresponding to snapshot
        metadata model has a version greater than or equal to the version in
        item.id.

        Args:
            item: CollectionRightsSnapshotMetadataModel to validate.
        """
        _, collection_rights_model_tuples = cls.external_models[
            'collection_rights_model']

        collection_rights_model = collection_rights_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(collection_rights_model.version) < int(version):
            cls.errors['collection rights model version check'] = (
                'Model id %s: Collection Rights model corresponding to '
                'id %s has a version %s which is less '
                'than the version %s in snapshot metadata model id' % (
                    item.id, collection_rights_model.id,
                    collection_rights_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_collection_model_version_from_item_id]


class CollectionRightsSnapshotContentModelValidator(BaseModelValidator):
    """Class for validating CollectionRightsSnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_rights_model': (
                collection_models.CollectionRightsModel,
                [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_collection_model_version_from_item_id(cls, item):
        """Validate that collection rights model corresponding to snapshot
        content model has a version greater than or equal to the version in
        item.id.

        Args:
            item: CollectionRightsSnapshotContentModel to validate.
        """
        _, collection_rights_model_tuples = cls.external_models[
            'collection_rights_model']

        collection_rights_model = collection_rights_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(collection_rights_model.version) < int(version):
            cls.errors['collection rights model version check'] = (
                'Model id %s: Collection Rights model corresponding to '
                'id %s has a version %s which is less '
                'than the version %s in snapshot content model id' % (
                    item.id, collection_rights_model.id,
                    collection_rights_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_collection_model_version_from_item_id]


class CollectionCommitLogEntryModelValidator(BaseModelValidator):
    """Class for validating CollectionCommitLogEntryModel."""

    is_commit_log_entry_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        regex_string = '(collection|rights)-%s-\\d*$' % (
            item.collection_id)

        return regex_string

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.CollectionCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_model': (
                collection_models.CollectionModel, [item.collection_id]),
        }

    @classmethod
    def _validate_collection_model_version_from_item_id(cls, item):
        """Validate that collection model corresponding to item.collection_id
        has a version greater than or equal to the exp version in item.id.

        Args:
            item: CollectionCommitLogEntryModel to validate.
        """
        _, collection_model_tuples = cls.external_models['collection_model']

        collection_model = collection_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(collection_model.version) < int(version):
            cls.errors['collection model version check'] = (
                'Model id %s: Collection model corresponding to collection '
                'id %s has a version %s which is less than the version %s in '
                'commit log model id' % (
                    item.id, item.collection_id, collection_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_collection_model_version_from_item_id]


class CollectionSummaryModelValidator(BaseModelValidator):
    """Class for validating CollectionSummaryModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        non_negative_int_schema = {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 0
            }]
        }
        ratings_schema = {
            'type': 'dict',
            'properties': [{
                'name': '%s' % rating_value,
                'schema': non_negative_int_schema,
            } for rating_value in ['1', '2', '3', '4', '5']]
        }

        if item.ratings and len(item.ratings.keys()):
            return {'ratings': ratings_schema}
        else:
            return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_model': (
                collection_models.CollectionModel, [item.id]),
            'collection_rights_model': (
                collection_models.CollectionRightsModel, [item.id]),
            'owner_user_model': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_model': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_model': (
                user_models.UserSettingsModel, item.viewer_ids),
            'contributor_user_model': (
                user_models.UserSettingsModel, item.contributor_ids)
        }

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: CollectionSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            item.contributors_summary.keys())
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls.errors['contributors summary check'] = (
                'Model id %s: Contributor ids: %s do not match the contributor '
                'ids obtained using contributors summary: %s') % (
                    item.id, (',').join(sorted(item.contributor_ids)),
                    (',').join(
                        sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_language_code(cls, item):
        """Validate that language code is present in allowed language codes.

        Args:
            item: CollectionSummaryModel to validate.
        """
        allowed_language_codes = [
            language_item['code'] for language_item in (
                constants.ALL_LANGUAGE_CODES)]

        if item.language_code not in allowed_language_codes:
            cls.errors['language code check'] = (
                'Model id %s: Language code %s for model is unsupported' % (
                    item.id, item.language_code))

    @classmethod
    def _validate_node_count(cls, item):
        """Validate that node_count of model is equal to number of nodes
        collection_contents in collection model.

        Args:
            item: CollectionSummaryModel to validate.
        """
        _, collection_model_tuples = cls.external_models[
            'collection_model']
        collection_model = collection_model_tuples[0][1]
        nodes = collection_model.collection_contents['nodes']
        if item.node_count != len(nodes):
            cls.errors['node count check'] = (
                'Model id %s: Node count: %s does not match the number of '
                'nodes in collection_contents dict: %s') % (
                    item.id, item.node_count, len(nodes))

    @classmethod
    def _validate_related_model_properties(cls, item):
        """Validate that model properties match the corresponding collection
        model and collection rights model properties.

        Args:
            item: CollectionSummaryModel to validate.
        """
        _, collection_model_tuples = cls.external_models[
            'collection_model']
        _, collection_rights_model_tuples = cls.external_models[
            'collection_rights_model']
        collection_model = collection_model_tuples[0][1]
        collection_rights_model = collection_rights_model_tuples[0][1]

        if item.title != collection_model.title:
            cls.errors['title field check'] = (
                'Model id %s: title field in model: %s does not match '
                'corresponding collection title field: %s') % (
                    item.id, item.title, collection_model.title)

        if item.category != collection_model.category:
            cls.errors['category field check'] = (
                'Model id %s: category field in model: %s does not match '
                'corresponding collection category field: %s') % (
                    item.id, item.category, collection_model.category)

        if item.objective != collection_model.objective:
            cls.errors['objective field check'] = (
                'Model id %s: objective field in model: %s does not match '
                'corresponding collection objective field: %s') % (
                    item.id, item.objective, collection_model.objective)

        if item.language_code != collection_model.language_code:
            cls.errors['language_code field check'] = (
                'Model id %s: language_code field in model: %s does not match '
                'corresponding collection language_code field: %s') % (
                    item.id, item.language_code,
                    collection_model.language_code)

        if item.tags != collection_model.tags:
            cls.errors['tags field check'] = (
                'Model id %s: tags field in model: %s does not match '
                'corresponding collection tags field: %s') % (
                    item.id, (',').join(item.tags),
                    (',').join(collection_model.tags))

        if item.collection_model_created_on != collection_model.created_on:
            cls.errors['collection_model_created_on field check'] = (
                'Model id %s: collection_model_created_on field in model: %s '
                'does not match corresponding collection created_on '
                'field: %s') % (
                    item.id, item.collection_model_created_on,
                    collection_model.created_on)

        if item.status != collection_rights_model.status:
            cls.errors['status field check'] = (
                'Model id %s: status field in model: %s does not match '
                'corresponding collection rights status field: %s') % (
                    item.id, item.status, collection_rights_model.status)

        if item.community_owned != collection_rights_model.community_owned:
            cls.errors['community_owned field check'] = (
                'Model id %s: community_owned field in model: %s does not '
                'match corresponding collection rights community_owned '
                'field: %s') % (
                    item.id, item.community_owned,
                    collection_rights_model.community_owned)

        if item.owner_ids != collection_rights_model.owner_ids:
            cls.errors['owner_ids field check'] = (
                'Model id %s: owner_ids field in model: %s does not match '
                'corresponding collection rights owner_ids field: %s') % (
                    item.id, (',').join(item.owner_ids),
                    (',').join(collection_rights_model.owner_ids))

        if item.editor_ids != collection_rights_model.editor_ids:
            cls.errors['editor_ids field check'] = (
                'Model id %s: editor_ids field in model: %s does not match '
                'corresponding collection rights editor_ids field: %s') % (
                    item.id, (',').join(item.editor_ids),
                    (',').join(collection_rights_model.editor_ids))

        if item.viewer_ids != collection_rights_model.viewer_ids:
            cls.errors['viewer_ids field check'] = (
                'Model id %s: viewer_ids field in model: %s does not match '
                'corresponding collection rights viewer_ids field: %s') % (
                    item.id, (',').join(item.viewer_ids),
                    (',').join(collection_rights_model.viewer_ids))

    @classmethod
    def _get_validation_functions(cls):
        return [
            cls._validate_language_code, cls._validate_node_count,
            cls._validate_contributors_summary,
            cls._validate_related_model_properties]


class ConfigPropertyModelValidator(BaseModelValidator):
    """Class for validating ConfigPropertyModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'snapshot_metadata_model': (
                config_models.ConfigPropertySnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                config_models.ConfigPropertySnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class ConfigPropertySnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating ConfigPropertySnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.ConfigPropertyCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'config_property_model': (
                config_models.ConfigPropertyModel,
                [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_config_property_model_version_from_item_id(cls, item):
        """Validate that config property model corresponding to snapshot
        metadata model has a version greater than or equal to the in item.id.

        Args:
            item: ConfigPropertySnapshotMetadataModel to validate.
        """
        _, config_property_model_tuples = cls.external_models[
            'config_property_model']

        config_property_model = config_property_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(config_property_model.version) < int(version):
            cls.errors['config property model version check'] = (
                'Model id %s: ConfigProperty model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot metadata model id' % (
                    item.id, config_property_model.id,
                    config_property_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_config_property_model_version_from_item_id]


class ConfigPropertySnapshotContentModelValidator(BaseModelValidator):
    """Class for validating ConfigPropertySnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'config_property_model': (
                config_models.ConfigPropertyModel,
                [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_config_property_model_version_from_item_id(cls, item):
        """Validate that config property model corresponding to snapshot
        content model has a version greater than or equal to the in item.id.

        Args:
            item: ConfigPropertySnapshotContentModel to validate.
        """
        _, config_property_model_tuples = cls.external_models[
            'config_property_model']

        config_property_model = config_property_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(config_property_model.version) < int(version):
            cls.errors['config property model version check'] = (
                'Model id %s: ConfigProperty model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot content model id' % (
                    item.id, config_property_model.id,
                    config_property_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_config_property_model_version_from_item_id]


class SentEmailModelValidator(BaseModelValidator):
    """Class for validating SentEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        regex_string = '%s\\.\\..*$' % item.intent
        return regex_string

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

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
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

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
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

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


class ExplorationModelValidator(BaseModelValidator):
    """Class for validating ExplorationModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        model_domain_object_instances = [
            exp_services.get_exploration_from_model(item)]

        return model_domain_object_instances

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        state_id_mapping_model_ids = [
            '%s.%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        exploration_commit_log_entry_model_ids = [
            'exploration-%s-%s' % (item.id, version) for version in range(
                1, item.version + 1)]
        exp_summary_model_ids = [item.id]
        exploration_rights_model_ids = [item.id]
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'state_id_mapping_model': (
                exp_models.StateIdMappingModel,
                state_id_mapping_model_ids),
            'exploration_commit_log_entry_model': (
                exp_models.ExplorationCommitLogEntryModel,
                exploration_commit_log_entry_model_ids),
            'exp_summary_model': (
                exp_models.ExpSummaryModel, exp_summary_model_ids),
            'exploration_rights_model': (
                exp_models.ExplorationRightsModel,
                exploration_rights_model_ids),
            'snapshot_metadata_model': (
                exp_models.ExplorationSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                exp_models.ExplorationSnapshotContentModel,
                snapshot_model_ids),
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


class ExplorationSnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating ExplorationSnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.ExplorationCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_model': (
                exp_models.ExplorationModel, [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_exploration_model_version_from_item_id(cls, item):
        """Validate that exploration model corresponding to snapshot
        metadata model has a version greater than or equal to the in item.id.

        Args:
            item: ExplorationSnapshotMetadataModel to validate.
        """
        _, exploration_model_tuples = cls.external_models['exploration_model']

        exploration_model = exploration_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(exploration_model.version) < int(version):
            cls.errors['exploration model version check'] = (
                'Model id %s: Exploration model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot metadata model id' % (
                    item.id, exploration_model.id, exploration_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_exploration_model_version_from_item_id]


class ExplorationSnapshotContentModelValidator(BaseModelValidator):
    """Class for validating ExplorationSnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_model': (
                exp_models.ExplorationModel, [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_exploration_model_version_from_item_id(cls, item):
        """Validate that exploration model corresponding to snapshot
        content model has a version greater than or equal to the in item.id.

        Args:
            item: ExplorationSnapshotContentModel to validate.
        """
        _, exploration_model_tuples = cls.external_models['exploration_model']

        exploration_model = exploration_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(exploration_model.version) < int(version):
            cls.errors['exploration model version check'] = (
                'Model id %s: Exploration model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot content model id' % (
                    item.id, exploration_model.id, exploration_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_exploration_model_version_from_item_id]


class ExplorationRightsModelValidator(BaseModelValidator):
    """Class for validating ExplorationRightsModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        cloned_from_exploration_id = []
        if item.cloned_from:
            cloned_from_exploration_id.append(item.cloned_from)
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'exploration_model': (
                exp_models.ExplorationModel, [item.id]),
            'cloned_from_exploration_model': (
                exp_models.ExplorationModel,
                cloned_from_exploration_id),
            'owner_user_model': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_model': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_model': (
                user_models.UserSettingsModel, item.viewer_ids),
            'snapshot_metadata_model': (
                exp_models.ExplorationRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                exp_models.ExplorationRightsSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ExplorationRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        epoch = datetime.datetime.utcfromtimestamp(0)
        current_msec = (
            datetime.datetime.utcnow() - epoch).total_seconds() * 1000.0
        if item.first_published_msec > current_msec:
            cls.errors['first published msec check'] = (
                'Model id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec)

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_first_published_msec]


class ExplorationRightsSnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating ExplorationRightsSnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.ExplorationRightsCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_rights_model': (
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_exploration_model_version_from_item_id(cls, item):
        """Validate that exploration rights model corresponding to snapshot
        metadata model has a version greater than or equal to the version in
        item.id.

        Args:
            item: ExplorationRightsSnapshotMetadataModel to validate.
        """
        _, exploration_rights_model_tuples = cls.external_models[
            'exploration_rights_model']

        exploration_rights_model = exploration_rights_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(exploration_rights_model.version) < int(version):
            cls.errors['exploration rights model version check'] = (
                'Model id %s: Exploration Rights model corresponding to '
                'id %s has a version %s which is less '
                'than the version %s in snapshot metadata model id' % (
                    item.id, exploration_rights_model.id,
                    exploration_rights_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_exploration_model_version_from_item_id]


class ExplorationRightsSnapshotContentModelValidator(BaseModelValidator):
    """Class for validating ExplorationRightsSnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_rights_model': (
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_exploration_model_version_from_item_id(cls, item):
        """Validate that exploration rights model corresponding to snapshot
        content model has a version greater than or equal to the version in
        item.id.

        Args:
            item: ExplorationRightsSnapshotContentModel to validate.
        """
        _, exploration_rights_model_tuples = cls.external_models[
            'exploration_rights_model']

        exploration_rights_model = exploration_rights_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(exploration_rights_model.version) < int(version):
            cls.errors['exploration rights model version check'] = (
                'Model id %s: Exploration Rights model corresponding to '
                'id %s has a version %s which is less '
                'than the version %s in snapshot content model id' % (
                    item.id, exploration_rights_model.id,
                    exploration_rights_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_exploration_model_version_from_item_id]


class ExplorationCommitLogEntryModelValidator(BaseModelValidator):
    """Class for validating ExplorationCommitLogEntryModel."""

    is_commit_log_entry_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        regex_string = '(exploration|rights)-%s-\\d*$' % (
            item.exploration_id)

        return regex_string

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.ExplorationCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_model': (
                exp_models.ExplorationModel, [item.exploration_id]),
        }

    @classmethod
    def _validate_exploration_model_version_from_item_id(cls, item):
        """Validate that exploration model corresponding to item.exploration_id
        has a version greater than or equal to the exp version in item.id.

        Args:
            item: ExplorationCommitLogEntryModel to validate.
        """
        _, exploration_model_tuples = cls.external_models['exploration_model']

        exploration_model = exploration_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(exploration_model.version) < int(version):
            cls.errors['exploration model version check'] = (
                'Model id %s: Exploration model corresponding to exploration '
                'id %s has a version %s which is less than the version %s in '
                'commit log model id' % (
                    item.id, item.exploration_id, exploration_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_exploration_model_version_from_item_id]


class ExpSummaryModelValidator(BaseModelValidator):
    """Class for validating ExpSummaryModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        non_negative_int_schema = {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 0
            }]
        }
        ratings_schema = {
            'type': 'dict',
            'properties': [{
                'name': '%s' % rating_value,
                'schema': non_negative_int_schema,
            } for rating_value in ['1', '2', '3', '4', '5']]
        }

        if item.ratings and len(item.ratings.keys()):
            return {'ratings': ratings_schema}
        else:
            return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_model': (
                exp_models.ExplorationModel, [item.id]),
            'exploration_rights_model': (
                exp_models.ExplorationRightsModel, [item.id]),
            'owner_user_model': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_model': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_model': (
                user_models.UserSettingsModel, item.viewer_ids),
            'contributor_user_model': (
                user_models.UserSettingsModel, item.contributor_ids)
        }

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: ExpSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            item.contributors_summary.keys())
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls.errors['contributors summary check'] = (
                'Model id %s: Contributor ids: %s do not match the contributor '
                'ids obtained using contributors summary: %s') % (
                    item.id, (',').join(sorted(item.contributor_ids)),
                    (',').join(
                        sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_language_code(cls, item):
        """Validate that language code is present in allowed language codes.

        Args:
            item: ExpSummaryModel to validate.
        """
        allowed_language_codes = [
            language_item['code'] for language_item in (
                constants.ALL_LANGUAGE_CODES)]

        if item.language_code not in allowed_language_codes:
            cls.errors['language code check'] = (
                'Model id %s: Language code %s for model is unsupported' % (
                    item.id, item.language_code))

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ExpSummaryModel to validate.
        """
        if not item.first_published_msec:
            return

        epoch = datetime.datetime.utcfromtimestamp(0)
        current_msec = (
            datetime.datetime.utcnow() - epoch).total_seconds() * 1000.0
        if item.first_published_msec > current_msec:
            cls.errors['first published msec check'] = (
                'Model id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec)

    @classmethod
    def _validate_related_model_properties(cls, item):
        """Validate that model properties match the corresponding exploration
        model and exploration rights model properties.

        Args:
            item: ExpSummaryModel to validate.
        """
        _, exploration_model_tuples = cls.external_models[
            'exploration_model']
        _, exploration_rights_model_tuples = cls.external_models[
            'exploration_rights_model']
        exploration_model = exploration_model_tuples[0][1]
        exploration_rights_model = exploration_rights_model_tuples[0][1]

        if item.title != exploration_model.title:
            cls.errors['title field check'] = (
                'Model id %s: title field in model: %s does not match '
                'corresponding exploration title field: %s') % (
                    item.id, item.title, exploration_model.title)

        if item.category != exploration_model.category:
            cls.errors['category field check'] = (
                'Model id %s: category field in model: %s does not match '
                'corresponding exploration category field: %s') % (
                    item.id, item.category, exploration_model.category)

        if item.objective != exploration_model.objective:
            cls.errors['objective field check'] = (
                'Model id %s: objective field in model: %s does not match '
                'corresponding exploration objective field: %s') % (
                    item.id, item.objective, exploration_model.objective)

        if item.language_code != exploration_model.language_code:
            cls.errors['language_code field check'] = (
                'Model id %s: language_code field in model: %s does not match '
                'corresponding exploration language_code field: %s') % (
                    item.id, item.language_code,
                    exploration_model.language_code)

        if item.tags != exploration_model.tags:
            cls.errors['tags field check'] = (
                'Model id %s: tags field in model: %s does not match '
                'corresponding exploration tags field: %s') % (
                    item.id, (',').join(item.tags),
                    (',').join(exploration_model.tags))

        if item.exploration_model_created_on != exploration_model.created_on:
            cls.errors['exploration_model_created_on field check'] = (
                'Model id %s: exploration_model_created_on field in model: %s '
                'does not match corresponding exploration created_on '
                'field: %s') % (
                    item.id, item.exploration_model_created_on,
                    exploration_model.created_on)

        if item.first_published_msec != (
                exploration_rights_model.first_published_msec):
            cls.errors['first_published_msec field check'] = (
                'Model id %s: first_published_msec field in model: %s does '
                'not match corresponding exploration rights '
                'first_published_msec field: %s') % (
                    item.id, item.first_published_msec,
                    exploration_rights_model.first_published_msec)

        if item.status != exploration_rights_model.status:
            cls.errors['status field check'] = (
                'Model id %s: status field in model: %s does not match '
                'corresponding exploration rights status field: %s') % (
                    item.id, item.status, exploration_rights_model.status)

        if item.community_owned != exploration_rights_model.community_owned:
            cls.errors['community_owned field check'] = (
                'Model id %s: community_owned field in model: %s does not '
                'match corresponding exploration rights community_owned '
                'field: %s') % (
                    item.id, item.community_owned,
                    exploration_rights_model.community_owned)

        if item.owner_ids != exploration_rights_model.owner_ids:
            cls.errors['owner_ids field check'] = (
                'Model id %s: owner_ids field in model: %s does not match '
                'corresponding exploration rights owner_ids field: %s') % (
                    item.id, (',').join(item.owner_ids),
                    (',').join(exploration_rights_model.owner_ids))

        if item.editor_ids != exploration_rights_model.editor_ids:
            cls.errors['editor_ids field check'] = (
                'Model id %s: editor_ids field in model: %s does not match '
                'corresponding exploration rights editor_ids field: %s') % (
                    item.id, (',').join(item.editor_ids),
                    (',').join(exploration_rights_model.editor_ids))

        if item.viewer_ids != exploration_rights_model.viewer_ids:
            cls.errors['viewer_ids field check'] = (
                'Model id %s: viewer_ids field in model: %s does not match '
                'corresponding exploration rights viewer_ids field: %s') % (
                    item.id, (',').join(item.viewer_ids),
                    (',').join(exploration_rights_model.viewer_ids))

    @classmethod
    def _get_validation_functions(cls):
        return [
            cls._validate_language_code, cls._validate_first_published_msec,
            cls._validate_contributors_summary,
            cls._validate_related_model_properties]


class FileMetadataModelValidator(BaseModelValidator):
    """Class for validating FileMetadataModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        exploration_model_ids = []
        if item.id.startswith('/'):
            next_index = item.id[1:].find('/')
            if next_index == -1:
                next_index = len(item.id)
            else:
                next_index = next_index + 1
            exploration_model_ids = [item.id[1: next_index]]
        else:
            exploration_model_ids = [item.id[:item.id.find('/')]]
        return {
            'snapshot_metadata_model': (
                file_models.FileMetadataSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                file_models.FileMetadataSnapshotContentModel,
                snapshot_model_ids),
            'exploration_model': (
                exp_models.ExplorationModel,
                exploration_model_ids)
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class FileMetadataSnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating FileMetadataSnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.FileMetadataCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_metadata_model': (
                file_models.FileMetadataModel,
                [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_file_metadata_model_version_from_item_id(cls, item):
        """Validate that file_metadata model corresponding to snapshot
        metadata model has a version greater than or equal to the in item.id.

        Args:
            item: FileMetadataSnapshotMetadataModel to validate.
        """
        _, file_metadata_model_tuples = cls.external_models[
            'file_metadata_model']

        file_metadata_model = file_metadata_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(file_metadata_model.version) < int(version):
            cls.errors['file_metadata model version check'] = (
                'Model id %s: FileMetadata model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot metadata model id' % (
                    item.id, file_metadata_model.id,
                    file_metadata_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_file_metadata_model_version_from_item_id]


class FileMetadataSnapshotContentModelValidator(BaseModelValidator):
    """Class for validating FileMetadataSnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_metadata_model': (
                file_models.FileMetadataModel,
                [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_file_metadata_model_version_from_item_id(cls, item):
        """Validate that file_metadata model corresponding to snapshot
        content model has a version greater than or equal to the in item.id.

        Args:
            item: FileMetadataSnapshotContentModel to validate.
        """
        _, file_metadata_model_tuples = cls.external_models[
            'file_metadata_model']

        file_metadata_model = file_metadata_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(file_metadata_model.version) < int(version):
            cls.errors['file_metadata model version check'] = (
                'Model id %s: FileMetadata model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot content model id' % (
                    item.id, file_metadata_model.id,
                    file_metadata_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_file_metadata_model_version_from_item_id]


class FileModelValidator(BaseModelValidator):
    """Class for validating FileModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        exploration_model_ids = []
        if item.id.startswith('/'):
            next_index = item.id[1:].find('/')
            if next_index == -1:
                next_index = len(item.id)
            else:
                next_index = next_index + 1
            exploration_model_ids = [item.id[1: next_index]]
        else:
            exploration_model_ids = [item.id[:item.id.find('/')]]
        return {
            'snapshot_metadata_model': (
                file_models.FileSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                file_models.FileSnapshotContentModel,
                snapshot_model_ids),
            'exploration_model': (
                exp_models.ExplorationModel,
                exploration_model_ids)
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class FileSnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating FileSnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.FileCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_model': (
                file_models.FileModel,
                [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_file_model_version_from_item_id(cls, item):
        """Validate that file model corresponding to snapshot
        metadata model has a version greater than or equal to the in item.id.

        Args:
            item: FileSnapshotMetadataModel to validate.
        """
        _, file_model_tuples = cls.external_models[
            'file_model']

        file_model = file_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(file_model.version) < int(version):
            cls.errors['file model version check'] = (
                'Model id %s: File model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot metadata model id' % (
                    item.id, file_model.id,
                    file_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_file_model_version_from_item_id]


class FileSnapshotContentModelValidator(BaseModelValidator):
    """Class for validating FileSnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_model': (
                file_models.FileModel,
                [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_file_model_version_from_item_id(cls, item):
        """Validate that file model corresponding to snapshot
        content model has a version greater than or equal to the in item.id.

        Args:
            item: FileSnapshotContentModel to validate.
        """
        _, file_model_tuples = cls.external_models[
            'file_model']

        file_model = file_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(file_model.version) < int(version):
            cls.errors['file model version check'] = (
                'Model id %s: File model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot content model id' % (
                    item.id, file_model.id,
                    file_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_file_model_version_from_item_id]


class ExplorationRecommendationsModelValidator(BaseModelValidator):
    """Class for validating ExplorationRecommendationsModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        exploration_ids = [item.id]
        exploration_ids = exploration_ids + item.recommended_exploration_ids
        return {
            'exploration_model': (
                exp_models.ExplorationModel, exploration_ids),
        }

    @classmethod
    def _validate_item_id_not_in_recommended_exploration_ids(cls, item):
        """Validate that model id is not present in recommended exploration ids.

        Args:
            item: ExplorationRecommendationsModel to validate.
        """
        if item.id in item.recommended_exploration_ids:
            cls.errors['item exploration id check'] = (
                'Model id %s: The exploration id: %s for which the model is '
                'created is also present in the recommended exploration ids '
                'for model') % (item.id, item.id)

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_item_id_not_in_recommended_exploration_ids]


class TopicSimilaritiesModelValidator(BaseModelValidator):
    """Class for validating TopicSimilaritiesModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '%s$' % recommendations_models.TOPIC_SIMILARITIES_ID

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_topic_similarities(cls, item):
        """Validate the topic similarities to be symmetric and have real
        values between 0.0 and 1.0.

        Args:
            item: TopicSimilaritiesModel to validate.
        """

        topics = item.content.keys()
        data = '%s\n' % (',').join(topics)

        for topic1 in topics:
            similarity_list = []
            for topic2 in item.content[topic1]:
                similarity_list.append(str(item.content[topic1][topic2]))
            if len(similarity_list):
                data = data + '%s\n' % (',').join(similarity_list)

        data = data.splitlines()
        data = list(csv.reader(data))
        topics_list = data[0]
        topics_length = len(topics_list)
        topic_similarities_values = data[1:]

        invalid_model = False

        if len(topic_similarities_values) != topics_length:
            invalid_model = True
            cls.errors['topic similarities column check'] = (
                'Model id %s: Length of topic similarities columns does '
                'not match length of topic list') % item.id

        for topic in topics_list:
            if topic not in recommendations_services.RECOMMENDATION_CATEGORIES:
                cls.errors['topic check'] = (
                    'Model id %s: Topic %s not in list of known topics') % (
                        item.id, topic)

        if invalid_model:
            return

        for index, topic in enumerate(topics_list):
            if len(topic_similarities_values[index]) != topics_length:
                invalid_model = topic_similarities_values
                cls.errors['topic similarities row %s check' % index] = (
                    'Model id %s: Length of topic similarities rows does '
                    'not match length of topic list') % item.id

        if invalid_model:
            return

        for row_ind in range(topics_length):
            for col_ind in range(topics_length):
                similarity = topic_similarities_values[row_ind][col_ind]
                try:
                    similarity = float(similarity)
                except Exception:
                    cls.errors['similarity type check'] = (
                        'Model id %s: Expected similarity to be a float, '
                        'received %s') % (item.id, similarity)

                if similarity < 0.0 or similarity > 1.0:
                    cls.errors['similarity value check'] = (
                        'Model id %s: Expected similarity to be between 0.0 '
                        'and 1.0, received %s') % (item.id, similarity)

        for row_ind in range(topics_length):
            for col_ind in range(topics_length):
                if (topic_similarities_values[row_ind][col_ind] !=
                        topic_similarities_values[col_ind][row_ind]):
                    cls.errors['symmetry check'] = (
                        'Model id %s: Expected topic similarities to be '
                        'symmetric') % item.id

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_topic_similarities]


class StoryModelValidator(BaseModelValidator):
    """Class for validating StoryModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        model_domain_object_instances = [
            story_services.get_story_from_model(item)]

        return model_domain_object_instances

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        story_commit_log_entry_model_ids = [
            'story-%s-%s' % (item.id, version) for version in range(
                1, item.version + 1)]
        story_summary_model_ids = [item.id]
        story_rights_model_ids = [item.id]
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        exploration_model_ids = [
            node['exploration_id'] for node in item.story_contents['nodes']]
        return {
            'story_commit_log_entry_model': (
                story_models.StoryCommitLogEntryModel,
                story_commit_log_entry_model_ids),
            'story_summary_model': (
                story_models.StorySummaryModel, story_summary_model_ids),
            'story_rights_model': (
                story_models.StoryRightsModel,
                story_rights_model_ids),
            'snapshot_metadata_model': (
                story_models.StorySnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                story_models.StorySnapshotContentModel,
                snapshot_model_ids),
            'exploration_model': (
                exp_models.ExplorationModel,
                exploration_model_ids)
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class StorySnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating StorySnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.StoryCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_model': (
                story_models.StoryModel, [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_story_model_version_from_item_id(cls, item):
        """Validate that story model corresponding to snapshot
        metadata model has a version greater than or equal to the in item.id.

        Args:
            item: StorySnapshotMetadataModel to validate.
        """
        _, story_model_tuples = cls.external_models['story_model']

        story_model = story_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(story_model.version) < int(version):
            cls.errors['story model version check'] = (
                'Model id %s: Story model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot metadata model id' % (
                    item.id, story_model.id, story_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_story_model_version_from_item_id]


class StorySnapshotContentModelValidator(BaseModelValidator):
    """Class for validating StorySnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_model': (
                story_models.StoryModel, [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_story_model_version_from_item_id(cls, item):
        """Validate that story model corresponding to snapshot
        content model has a version greater than or equal to the in item.id.

        Args:
            item: StorySnapshotContentModel to validate.
        """
        _, story_model_tuples = cls.external_models['story_model']

        story_model = story_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(story_model.version) < int(version):
            cls.errors['story model version check'] = (
                'Model id %s: Story model corresponding to '
                'id %s has a version %s which is less than the version %s in '
                'snapshot content model id' % (
                    item.id, story_model.id, story_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_story_model_version_from_item_id]


class StoryRightsModelValidator(BaseModelValidator):
    """Class for validating StoryRightsModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'story_model': (
                story_models.StoryModel, [item.id]),
            'manager_user_model': (
                user_models.UserSettingsModel, item.manager_ids),
            'snapshot_metadata_model': (
                story_models.StoryRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_model': (
                story_models.StoryRightsSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _get_validation_functions(cls):
        return []


class StoryRightsSnapshotMetadataModelValidator(BaseModelValidator):
    """Class for validating StoryRightsSnapshotMetadataModel."""

    is_snapshot_metadata_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.StoryRightsCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_rights_model': (
                story_models.StoryRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_model': (
                user_models.UserSettingsModel, [item.committer_id])
        }

    @classmethod
    def _validate_story_model_version_from_item_id(cls, item):
        """Validate that story rights model corresponding to snapshot
        metadata model has a version greater than or equal to the version in
        item.id.

        Args:
            item: StoryRightsSnapshotMetadataModel to validate.
        """
        _, story_rights_model_tuples = cls.external_models[
            'story_rights_model']

        story_rights_model = story_rights_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(story_rights_model.version) < int(version):
            cls.errors['story rights model version check'] = (
                'Model id %s: Story Rights model corresponding to '
                'id %s has a version %s which is less '
                'than the version %s in snapshot metadata model id' % (
                    item.id, story_rights_model.id,
                    story_rights_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_story_model_version_from_item_id]


class StoryRightsSnapshotContentModelValidator(BaseModelValidator):
    """Class for validating StoryRightsSnapshotContentModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_rights_model': (
                story_models.StoryRightsModel,
                [item.id[:item.id.find('-')]]),
        }

    @classmethod
    def _validate_story_model_version_from_item_id(cls, item):
        """Validate that story rights model corresponding to snapshot
        content model has a version greater than or equal to the version in
        item.id.

        Args:
            item: StoryRightsSnapshotContentModel to validate.
        """
        _, story_rights_model_tuples = cls.external_models[
            'story_rights_model']

        story_rights_model = story_rights_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(story_rights_model.version) < int(version):
            cls.errors['story rights model version check'] = (
                'Model id %s: Story Rights model corresponding to '
                'id %s has a version %s which is less '
                'than the version %s in snapshot content model id' % (
                    item.id, story_rights_model.id,
                    story_rights_model.version, version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_story_model_version_from_item_id]


class StoryCommitLogEntryModelValidator(BaseModelValidator):
    """Class for validating StoryCommitLogEntryModel."""

    is_commit_log_entry_model = True

    @classmethod
    def _get_model_id_regex(cls, item):
        regex_string = '(story|rights)-%s-\\d*$' % (
            item.story_id)

        return regex_string

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return commit_commands_domain.StoryCommitCmd

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_model': (
                story_models.StoryModel, [item.story_id]),
        }

    @classmethod
    def _validate_story_model_version_from_item_id(cls, item):
        """Validate that story model corresponding to item.story_id
        has a version greater than or equal to the exp version in item.id.

        Args:
            item: StoryCommitLogEntryModel to validate.
        """
        _, story_model_tuples = cls.external_models['story_model']

        story_model = story_model_tuples[0][1]
        version = item.id[item.id.rfind('-') + 1:]
        if int(story_model.version) < int(version):
            cls.errors['story model version check'] = (
                'Model id %s: Story model corresponding to story '
                'id %s has a version %s which is less than the version %s in '
                'commit log model id' % (
                    item.id, item.story_id, story_model.version,
                    version))

    @classmethod
    def _get_validation_functions(cls):
        return [cls._validate_story_model_version_from_item_id]


class StorySummaryModelValidator(BaseModelValidator):
    """Class for validating StorySummaryModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_model': (
                story_models.StoryModel, [item.id]),
            'story_rights_model': (
                story_models.StoryRightsModel, [item.id]),
        }

    @classmethod
    def _validate_language_code(cls, item):
        """Validate that language code is present in allowed language codes.

        Args:
            item: StorySummaryModel to validate.
        """
        allowed_language_codes = [
            language_item['code'] for language_item in (
                constants.ALL_LANGUAGE_CODES)]

        if item.language_code not in allowed_language_codes:
            cls.errors['language code check'] = (
                'Model id %s: Language code %s for model is unsupported' % (
                    item.id, item.language_code))

    @classmethod
    def _validate_node_count(cls, item):
        """Validate that node_count of model is equal to number of nodes
        story_contents in story model.

        Args:
            item: StorySummaryModel to validate.
        """
        _, story_model_tuples = cls.external_models[
            'story_model']
        story_model = story_model_tuples[0][1]
        nodes = story_model.story_contents['nodes']
        if item.node_count != len(nodes):
            cls.errors['node count check'] = (
                'Model id %s: Node count: %s does not match the number of '
                'nodes in story_contents dict: %s') % (
                    item.id, item.node_count, len(nodes))

    @classmethod
    def _validate_related_model_properties(cls, item):
        """Validate that model properties match the corresponding story
        model and story rights model properties.

        Args:
            item: StorySummaryModel to validate.
        """
        _, story_model_tuples = cls.external_models[
            'story_model']
        story_model = story_model_tuples[0][1]

        if item.title != story_model.title:
            cls.errors['title field check'] = (
                'Model id %s: title field in model: %s does not match '
                'corresponding story title field: %s') % (
                    item.id, item.title, story_model.title)

        if item.language_code != story_model.language_code:
            cls.errors['language_code field check'] = (
                'Model id %s: language_code field in model: %s does not match '
                'corresponding story language_code field: %s') % (
                    item.id, item.language_code,
                    story_model.language_code)

        if item.description != story_model.description:
            cls.errors['description field check'] = (
                'Model id %s: description field in model: %s does not match '
                'corresponding story description field: %s') % (
                    item.id, item.description, story_model.description)

        if item.story_model_created_on != story_model.created_on:
            cls.errors['story_model_created_on field check'] = (
                'Model id %s: story_model_created_on field in model: %s '
                'does not match corresponding story created_on '
                'field: %s') % (
                    item.id, item.story_model_created_on,
                    story_model.created_on)

    @classmethod
    def _get_validation_functions(cls):
        return [
            cls._validate_language_code, cls._validate_node_count,
            cls._validate_related_model_properties]


class UserSubscriptionsModelValidator(BaseModelValidator):
    """Class for validating UserSubscriptionsModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '.'

    @classmethod
    def _get_json_properties_schema(cls, item):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_commit_cmd_domain_class(cls):
        return None

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


MODEL_TO_VALIDATOR_MAPPING = {
    activity_models.ActivityReferencesModel: ActivityReferencesModelValidator,
    audit_models.RoleQueryAuditModel: RoleQueryAuditModelValidator,
    collection_models.CollectionModel: CollectionModelValidator,
    collection_models.CollectionSnapshotMetadataModel: (
        CollectionSnapshotMetadataModelValidator),
    collection_models.CollectionSnapshotContentModel: (
        CollectionSnapshotContentModelValidator),
    collection_models.CollectionRightsModel: CollectionRightsModelValidator,
    collection_models.CollectionRightsSnapshotMetadataModel: (
        CollectionRightsSnapshotMetadataModelValidator),
    collection_models.CollectionRightsSnapshotContentModel: (
        CollectionRightsSnapshotContentModelValidator),
    collection_models.CollectionCommitLogEntryModel: (
        CollectionCommitLogEntryModelValidator),
    collection_models.CollectionSummaryModel: CollectionSummaryModelValidator,
    config_models.ConfigPropertyModel: ConfigPropertyModelValidator,
    config_models.ConfigPropertySnapshotMetadataModel: (
        ConfigPropertySnapshotMetadataModelValidator),
    config_models.ConfigPropertySnapshotContentModel: (
        ConfigPropertySnapshotContentModelValidator),
    email_models.SentEmailModel: SentEmailModelValidator,
    email_models.BulkEmailModel: BulkEmailModelValidator,
    email_models.GeneralFeedbackEmailReplyToIdModel: (
        GeneralFeedbackEmailReplyToIdModelValidator),
    exp_models.ExplorationModel: ExplorationModelValidator,
    exp_models.ExplorationSnapshotMetadataModel: (
        ExplorationSnapshotMetadataModelValidator),
    exp_models.ExplorationSnapshotContentModel: (
        ExplorationSnapshotContentModelValidator),
    exp_models.ExplorationRightsModel: ExplorationRightsModelValidator,
    exp_models.ExplorationRightsSnapshotMetadataModel: (
        ExplorationRightsSnapshotMetadataModelValidator),
    exp_models.ExplorationRightsSnapshotContentModel: (
        ExplorationRightsSnapshotContentModelValidator),
    exp_models.ExplorationCommitLogEntryModel: (
        ExplorationCommitLogEntryModelValidator),
    exp_models.ExpSummaryModel: ExpSummaryModelValidator,
    file_models.FileMetadataModel: FileMetadataModelValidator,
    file_models.FileMetadataSnapshotMetadataModel: (
        FileMetadataSnapshotMetadataModelValidator),
    file_models.FileMetadataSnapshotContentModel: (
        FileMetadataSnapshotContentModelValidator),
    file_models.FileModel: FileModelValidator,
    file_models.FileSnapshotMetadataModel: FileSnapshotMetadataModelValidator,
    file_models.FileSnapshotContentModel: FileSnapshotContentModelValidator,
    recommendations_models.ExplorationRecommendationsModel: (
        ExplorationRecommendationsModelValidator),
    recommendations_models.TopicSimilaritiesModel: (
        TopicSimilaritiesModelValidator),
    story_models.StoryModel: StoryModelValidator,
    story_models.StorySnapshotMetadataModel: (
        StorySnapshotMetadataModelValidator),
    story_models.StorySnapshotContentModel: (
        StorySnapshotContentModelValidator),
    story_models.StoryRightsModel: StoryRightsModelValidator,
    story_models.StoryRightsSnapshotMetadataModel: (
        StoryRightsSnapshotMetadataModelValidator),
    story_models.StoryRightsSnapshotContentModel: (
        StoryRightsSnapshotContentModelValidator),
    story_models.StoryCommitLogEntryModel: (
        StoryCommitLogEntryModelValidator),
    story_models.StorySummaryModel: StorySummaryModelValidator,
    user_models.UserSubscriptionsModel: UserSubscriptionsModelValidator,
}


class ProdValidationAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits and validates production models."""

    @classmethod
    def entity_classes_to_map_over(cls):
        raise NotImplementedError

    @staticmethod
    def map(model_instance):
        if not model_instance.deleted:
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


class ActivityReferencesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ActivityReferencesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [activity_models.ActivityReferencesModel]


class RoleQueryAuditModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates RoleQueryAuditModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [audit_models.RoleQueryAuditModel]


class CollectionModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionModel]


class CollectionSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionSnapshotMetadataModel]


class CollectionSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionSnapshotContentModel]


class CollectionRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionRightsModel]


class CollectionRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionRightsSnapshotMetadataModel]


class CollectionRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionRightsSnapshotContentModel]


class CollectionCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionCommitLogEntryModel]


class CollectionSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionSummaryModel]


class ConfigPropertyModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ConfigPropertyModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.ConfigPropertyModel]


class ConfigPropertySnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ConfigPropertySnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.ConfigPropertySnapshotMetadataModel]


class ConfigPropertySnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ConfigPropertySnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.ConfigPropertySnapshotContentModel]


class SentEmailModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SentEmailModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.SentEmailModel]


class BulkEmailModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates BulkEmailModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.BulkEmailModel]


class GeneralFeedbackEmailReplyToIdModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates GeneralFeedbackEmailReplyToIdModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.GeneralFeedbackEmailReplyToIdModel]


class ExplorationModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]


class ExplorationSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationSnapshotMetadataModel]


class ExplorationSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationSnapshotContentModel]


class ExplorationRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsModel]


class ExplorationRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotMetadataModel]


class ExplorationRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotContentModel]


class ExplorationCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationCommitLogEntryModel]


class ExpSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExpSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel]


class FileMetadataModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates FileMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileMetadataModel]


class FileModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates FileModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileModel]


class FileSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates FileSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileSnapshotMetadataModel]


class FileSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates FileSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileSnapshotContentModel]


class FileMetadataSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates FileMetadataSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileMetadataSnapshotMetadataModel]


class FileMetadataSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates FileMetadataSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileMetadataSnapshotContentModel]


class ExplorationRecommendationsModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRecommendationsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [recommendations_models.ExplorationRecommendationsModel]


class TopicSimilaritiesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSimilaritiesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [recommendations_models.TopicSimilaritiesModel]


class StoryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]


class StorySnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySnapshotMetadataModel]


class StorySnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySnapshotContentModel]


class StoryRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryRightsModel]


class StoryRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryRightsSnapshotMetadataModel]


class StoryRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryRightsSnapshotContentModel]


class StoryCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryCommitLogEntryModel]


class StorySummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySummaryModel]


class UserSubscriptionsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserSubscriptionsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]
