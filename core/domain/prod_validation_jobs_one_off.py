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

import collections
import datetime
import itertools
import re

from constants import constants
from core import jobs
from core.domain import activity_domain
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
import feconf

(
    activity_models, audit_models, base_models,
    collection_models, config_models, email_models,
    exp_models, feedback_models, file_models,
    question_models, recommendations_models,
    skill_models, story_models, topic_models,
    user_models,) = (
        models.Registry.import_models([
            models.NAMES.activity, models.NAMES.audit, models.NAMES.base_model,
            models.NAMES.collection, models.NAMES.config, models.NAMES.email,
            models.NAMES.exploration, models.NAMES.feedback, models.NAMES.file,
            models.NAMES.question, models.NAMES.recommendations,
            models.NAMES.skill, models.NAMES.story, models.NAMES.topic,
            models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()

ALLOWED_AUDIO_EXTENSIONS = feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()
ALLOWED_IMAGE_EXTENSIONS = list(itertools.chain.from_iterable(
    feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.values()))
ASSETS_PATH_REGEX = '/exploration/[A-Za-z0-9]{1,12}/assets/'
IMAGE_PATH_REGEX = (
    '%simage/[A-Za-z0-9_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_IMAGE_EXTENSIONS)))
AUDIO_PATH_REGEX = (
    '%saudio/[A-Za-z0-9_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_AUDIO_EXTENSIONS)))
FILE_MODELS_REGEX = '(%s|%s)' % (IMAGE_PATH_REGEX, AUDIO_PATH_REGEX)


class BaseModelValidator(object):
    """Base class for validating models."""

    # The dict to store errors found during audit of model.
    errors = collections.defaultdict(list)
    # external_instance_details is keyed by field name. Each value consists
    # of a list of (model class, external_key, external_model_instance)
    # tuples.
    external_instance_details = {}

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for model id.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: ndb.Model. Entity to validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

    @classmethod
    def _validate_model_id(cls, item):
        """Checks whether the id of model matches the regex specified for
        the model.

        Args:
            item: ndb.Model. Entity to validate.
        """
        regex_string = cls._get_model_id_regex(item)
        if not re.compile(regex_string).match(str(item.id)):
            cls.errors['model id check'].append((
                'Entity id %s: Entity id does not match regex pattern') % (
                    item.id))

    @classmethod
    def _get_model_domain_object_instance(cls, unused_item):
        """Returns a domain object instance created from the model.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: ndb.Model. Entity to validate.

        Returns:
            *: A domain object to validate.
        """
        return None

    @classmethod
    def _validate_model_domain_object_instances(cls, item):
        """Checks that model instance passes the validation of the domain
        object for model.

        Args:
            item: ndb.Model. Entity to validate.
        """
        model_domain_object_instance = cls._get_model_domain_object_instance(
            item)

        if model_domain_object_instance is None:
            # No domain object exists for this storage model class.
            return

        try:
            model_domain_object_instance.validate()
        except Exception as e:
            cls.errors['domain object check'].append((
                'Entity id %s: Entity fails domain validation with the '
                'error %s' % (item.id, e)))

    @classmethod
    def _get_external_id_relationships(cls, item):
        """Returns a mapping of external id to model class.

        This should be implemented by subclasses.

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
        for field_name, model_class_model_id_model_tuples in (
                cls.external_instance_details.iteritems()):
            for model_class, model_id, model in (
                    model_class_model_id_model_tuples):
                if model is None or model.deleted:
                    cls.errors['%s field check' % field_name].append((
                        'Entity id %s: based on field %s having'
                        ' value %s, expect model %s with id %s but it doesn\'t'
                        ' exist' % (
                            item.id, field_name, model_id,
                            str(model_class.__name__), model_id)))

    @classmethod
    def _fetch_external_instance_details(cls, item):
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
        for (
                field_name, (model_class, field_values)), (
                    external_instance_details) in zip(
                        multiple_models_keys_to_fetch.iteritems(),
                        fetched_model_instances):
            cls.external_instance_details[field_name] = (
                zip(
                    [model_class] * len(field_values),
                    field_values, external_instance_details))

    @classmethod
    def _validate_model_time_fields(cls, item):
        """Checks the following relation for the model:
        model.created_on <= model.last_updated <= current time.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.created_on > item.last_updated:
            cls.errors['time field relation check'].append((
                'Entity id %s: The created_on field has a value %s which is '
                'greater than the value %s of last_updated field'
                ) % (item.id, item.created_on, item.last_updated))

        current_datetime = datetime.datetime.utcnow()
        if item.last_updated > current_datetime:
            cls.errors['current time check'].append((
                'Entity id %s: The last_updated field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.last_updated))

    @classmethod
    def _get_custom_validation_functions(cls):
        """Returns the list of custom validation functions to run.

        This method can be overridden by subclasses, if needed.

        Each validation function should accept only a single arg, which is the
        model instance to validate.
        """
        return []

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        cls.errors.clear()
        cls.external_instance_details.clear()
        cls._fetch_external_instance_details(item)

        cls._validate_model_id(item)
        cls._validate_model_time_fields(item)
        cls._validate_model_domain_object_instances(item)
        cls._validate_external_id_relationships(item)

        for func in cls._get_custom_validation_functions():
            func(item)


class BaseSummaryModelValidator(BaseModelValidator):
    """Base class for validating summary models."""

    @classmethod
    def _get_related_model_properties(cls):
        """Returns a tuple of related external_models and properties.

        This should be implemented by subclasses.

        Returns:
            tuple(str, list(tuple), dict): A tuple with first element as
                related model name, second element as a tuple of
                cls.external_instance_details and the third element
                as a properties dict with key as property name in summary
                model and value as property name in related model.
        """
        raise NotImplementedError

    @classmethod
    def _validate_related_model_properties(cls, item):
        """Validate that properties of the model match the corresponding
        properties of the related model.

        Args:
            item: ndb.Model. BaseSummaryModel to validate.
        """

        for (
                related_model_name,
                related_model_class_model_id_model_tuples,
                related_model_properties_dict
            ) in cls._get_related_model_properties():

            for (_, _, related_model) in (
                    related_model_class_model_id_model_tuples):
                for (property_name, related_model_property_name) in (
                        related_model_properties_dict.iteritems()):
                    value_in_summary_model = getattr(item, property_name)
                    value_in_related_model = getattr(
                        related_model, related_model_property_name)

                    if value_in_summary_model != value_in_related_model:
                        cls.errors['%s field check' % property_name].append((
                            'Entity id %s: %s field in entity: %s does not '
                            'match corresponding %s %s field: %s') % (
                                item.id, property_name,
                                value_in_summary_model,
                                related_model_name, related_model_property_name,
                                value_in_related_model))

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseSummaryModelValidator, cls).validate(item)

        cls._validate_related_model_properties(item)


class BaseSnapshotContentModelValidator(BaseModelValidator):
    """Base class for validating snapshot content models."""

    # The name of the model which is to be used in the error messages.
    # This can be overridden by subclasses, if needed.
    model_name = 'snapshot content'

    # The name of the related model in lowercase which is used to obtain
    # the name of the key for the fetch of related model and the name
    # of the related model to be used in error messages.
    # For example, if related model is CollectionRights, then
    # related_model_name = collection rights, key to fetch = collection_rights
    # Name of model to be used in error message = CollectionRights
    # This should be overridden by subclasses.
    related_model_name = ''

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _validate_base_model_version_from_item_id(cls, item):
        """Validate that related model corresponding to item.id
        has a version greater than or equal to the version in item.id.

        Args:
            item: ndb.Model. BaseSnapshotContentModel to validate.
        """

        if cls.related_model_name == '':
            raise Exception('Related model name should be specified')

        related_model_name = cls.related_model_name
        if item.id.startswith('rights'):
            related_model_name = related_model_name + ' rights'

        name_split_by_space = related_model_name.split(' ')
        key_to_fetch = ('_').join(name_split_by_space)
        capitalized_related_model_name = ('').join([
            val.capitalize() for val in name_split_by_space])

        related_model_class_model_id_model_tuples = (
            cls.external_instance_details['%s_ids' % key_to_fetch])

        version = item.id[item.id.rfind('-') + 1:]
        for (_, _, related_model) in (
                related_model_class_model_id_model_tuples):
            if int(related_model.version) < int(version):
                cls.errors[
                    '%s model version check' % cls.related_model_name].append((
                        'Entity id %s: %s model corresponding to '
                        'id %s has a version %s which is less than '
                        'the version %s in %s model id' % (
                            item.id, capitalized_related_model_name,
                            related_model.id, related_model.version, version,
                            cls.model_name)))

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseSnapshotContentModelValidator, cls).validate(item)

        cls._validate_base_model_version_from_item_id(item)


class BaseSnapshotMetadataModelValidator(BaseSnapshotContentModelValidator):
    """Base class for validating snapshot metadata models."""

    model_name = 'snapshot metadata'

    @classmethod
    def _validate_commit_type(cls, item):
        """Validates that commit type is valid.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.commit_type not in (
                base_models.VersionedModel.COMMIT_TYPE_CHOICES):
            cls.errors['commit type check'].append((
                'Entity id %s: Commit type %s is not allowed') % (
                    item.id, item.commit_type))

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        """Returns a Change domain class.

        This should be implemented by subclasses.

        Args:
            unused_item: ndb.Model. Entity to validate.

        Returns:
            change_domain.BaseChange: A domain object class for the
                changes made by commit commands of the model.
        """
        raise NotImplementedError

    @classmethod
    def _validate_commit_cmds_schema(cls, item):
        """Validates schema of commit commands in commit_cmds dict.

        Args:
            item: ndb.Model. Entity to validate.
        """
        change_domain_object = cls._get_change_domain_class(item)
        for commit_cmd_dict in item.commit_cmds:
            if not commit_cmd_dict:
                continue
            try:
                change_domain_object(commit_cmd_dict)
            except Exception as e:
                cmd_name = commit_cmd_dict.get('cmd')
                cls.errors['commit cmd %s check' % cmd_name].append((
                    'Entity id %s: Commit command domain validation for '
                    'command: %s failed with error: %s') % (
                        item.id, commit_cmd_dict, e))

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseSnapshotMetadataModelValidator, cls).validate(item)

        cls._validate_commit_type(item)
        cls._validate_commit_cmds_schema(item)


class BaseCommitLogEntryModelValidator(BaseSnapshotMetadataModelValidator):
    """Base class for validating commit log entry models."""

    model_name = 'commit log entry'

    @classmethod
    def _validate_post_commit_status(cls, item):
        """Validates that post_commit_status is either public or private.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.post_commit_status not in [
                feconf.POST_COMMIT_STATUS_PUBLIC,
                feconf.POST_COMMIT_STATUS_PRIVATE]:
            cls.errors['post commit status check'].append((
                'Entity id %s: Post commit status %s is invalid') % (
                    item.id, item.post_commit_status))

    @classmethod
    def _validate_post_commit_is_private(cls, item):
        """Validates that post_commit_is_private is true iff
        post_commit_status is private.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.post_commit_status == feconf.POST_COMMIT_STATUS_PRIVATE and (
                not item.post_commit_is_private):
            cls.errors['post commit is private check'].append((
                'Entity id %s: Post commit status is private but '
                'post_commit_is_private is False') % item.id)

        if item.post_commit_status == feconf.POST_COMMIT_STATUS_PUBLIC and (
                item.post_commit_is_private):
            cls.errors['post commit is private check'].append((
                'Entity id %s: Post commit status is public but '
                'post_commit_is_private is True') % item.id)

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseCommitLogEntryModelValidator, cls).validate(item)

        cls._validate_post_commit_status(item)
        cls._validate_post_commit_is_private(item)


class ActivityReferencesModelValidator(BaseModelValidator):
    """Class for validating ActivityReferencesModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: featured.
        regex_string = '^(%s)$' % '|'.join(
            feconf.ALL_ACTIVITY_REFERENCE_LIST_TYPES)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        activity_references_list = []

        try:
            for reference in item.activity_references:
                activity_references_list.append(
                    activity_domain.ActivityReference(
                        reference['type'], reference['id']))
        except Exception as e:
            cls.errors['fetch properties'].append((
                'Entity id %s: Entity properties cannot be fetched completely '
                'with the error %s') % (item.id, e))
            return None

        return activity_domain.ActivityReferences(activity_references_list)

    @classmethod
    def _get_external_id_relationships(cls, item):
        exploration_ids = []
        collection_ids = []

        try:
            for reference in item.activity_references:
                if reference['type'] == constants.ACTIVITY_TYPE_EXPLORATION:
                    exploration_ids.append(reference['id'])
                elif reference['type'] == constants.ACTIVITY_TYPE_COLLECTION:
                    collection_ids.append(reference['id'])
        except Exception as e:
            cls.errors['fetch properties'].append((
                'Entity id %s: Entity properties cannot be fetched completely '
                'with the error %s') % (item.id, e))
            return {}

        return {
            'exploration_ids': (exp_models.ExplorationModel, exploration_ids),
            'collection_ids': (
                collection_models.CollectionModel, collection_ids),
        }


class RoleQueryAuditModelValidator(BaseModelValidator):
    """Class for validating RoleQueryAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [user_id].[timestamp_in_sec].[intent].[random_number]
        regex_string = '^%s\\.\\d*\\.%s\\.\\d*$' % (item.user_id, item.intent)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {'user_ids': (user_models.UserSettingsModel, [item.user_id])}


class CollectionModelValidator(BaseModelValidator):
    """Class for validating CollectionModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'exploration_ids': (
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in item.collection_contents[
                    'nodes']]),
            'collection_commit_log_entry_ids': (
                collection_models.CollectionCommitLogEntryModel,
                ['collection-%s-%s' % (item.id, version) for version in range(
                    1, item.version + 1)]),
            'collection_summary_ids': (
                collection_models.CollectionSummaryModel, [item.id]),
            'collection_rights_ids': (
                collection_models.CollectionRightsModel, [item.id]),
            'snapshot_metadata_ids': (
                collection_models.CollectionSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                collection_models.CollectionSnapshotContentModel,
                snapshot_model_ids),
        }


class CollectionSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionSnapshotMetadataModel."""

    related_model_name = 'collection'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return collection_domain.CollectionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_ids': (
                collection_models.CollectionModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class CollectionSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating CollectionSnapshotContentModel."""

    related_model_name = 'collection'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_ids': (
                collection_models.CollectionModel,
                [item.id[:item.id.find('-')]]),
        }


class CollectionRightsModelValidator(BaseModelValidator):
    """Class for validating CollectionRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'collection_ids': (
                collection_models.CollectionModel, [item.id]),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'snapshot_metadata_ids': (
                collection_models.CollectionRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                collection_models.CollectionRightsSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ndb.Model. CollectionRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        epoch = datetime.datetime.utcfromtimestamp(0)
        current_msec = (
            datetime.datetime.utcnow() - epoch).total_seconds() * 1000.0
        if item.first_published_msec > current_msec:
            cls.errors['first published msec check'].append((
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class CollectionRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionRightsSnapshotMetadataModel."""

    related_model_name = 'collection rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_manager.CollectionRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_rights_ids': (
                collection_models.CollectionRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class CollectionRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating CollectionRightsSnapshotContentModel."""

    related_model_name = 'collection rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_rights_ids': (
                collection_models.CollectionRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class CollectionCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating CollectionCommitLogEntryModel."""

    related_model_name = 'collection'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [collection/rights]-[collection_id]-[collection_version].
        regex_string = '^(collection|rights)-%s-\\d*$' % (
            item.collection_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_manager.CollectionRightsChange
        else:
            return collection_domain.CollectionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'collection_ids': (
                collection_models.CollectionModel, [item.collection_id]),
        }
        if item.id.startswith('rights'):
            external_id_relationships['collection_rights_ids'] = (
                collection_models.CollectionRightsModel, [item.collection_id])
        return external_id_relationships


class CollectionSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating CollectionSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_ids': (
                collection_models.CollectionModel, [item.id]),
            'collection_rights_ids': (
                collection_models.CollectionRightsModel, [item.id]),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'contributor_user_ids': (
                user_models.UserSettingsModel, item.contributor_ids)
        }

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: ndb.Model. CollectionSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            item.contributors_summary.keys())
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls.errors['contributors summary check'].append((
                'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s') % (
                    item.id, sorted(item.contributor_ids),
                    sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_node_count(cls, item):
        """Validate that node_count of model is equal to number of nodes
        in CollectionModel.collection_contents.

        Args:
            item: ndb.Model. CollectionSummaryModel to validate.
        """
        collection_model_class_model_id_model_tuples = (
            cls.external_instance_details['collection_ids'])

        for (_, _, collection_model) in (
                collection_model_class_model_id_model_tuples):
            nodes = collection_model.collection_contents['nodes']
            if item.node_count != len(nodes):
                cls.errors['node count check'].append((
                    'Entity id %s: Node count: %s does not match the number of '
                    'nodes in collection_contents dict: %s') % (
                        item.id, item.node_count, nodes))

    @classmethod
    def _validate_ratings_is_empty(cls, item):
        """Validate that ratings for the entity is empty.

        Args:
            item: ndb.Model. CollectionSummaryModel to validate.
        """
        if item.ratings:
            cls.errors['ratings check'].append(
                'Entity id %s: Expected ratings for the entity to be '
                'empty but received %s' % (item.id, item.ratings))

    @classmethod
    def _get_related_model_properties(cls):
        collection_model_class_model_id_model_tuples = (
            cls.external_instance_details['collection_ids'])
        collection_rights_model_class_model_id_model_tuples = (
            cls.external_instance_details['collection_rights_ids'])

        collection_model_properties_dict = {
            'title': 'title',
            'category': 'category',
            'objective': 'objective',
            'language_code': 'language_code',
            'tags': 'tags',
            'collection_model_created_on': 'created_on',
            'collection_model_last_updated': 'last_updated'
        }

        collection_rights_model_properties_dict = {
            'status': 'status',
            'community_owned': 'community_owned',
            'owner_ids': 'owner_ids',
            'editor_ids': 'editor_ids',
            'viewer_ids': 'viewer_ids',
        }

        return [(
            'collection',
            collection_model_class_model_id_model_tuples,
            collection_model_properties_dict
        ), (
            'collection rights',
            collection_rights_model_class_model_id_model_tuples,
            collection_rights_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_node_count,
            cls._validate_ratings_is_empty,
            cls._validate_contributors_summary,
            ]


class ConfigPropertyModelValidator(BaseModelValidator):
    """Class for validating ConfigPropertyModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^.*$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'snapshot_metadata_ids': (
                config_models.ConfigPropertySnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                config_models.ConfigPropertySnapshotContentModel,
                snapshot_model_ids),
        }


class ConfigPropertySnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating ConfigPropertySnapshotMetadataModel."""

    related_model_name = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^.*-\\d*$'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return config_domain.ConfigPropertyChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'config_property_ids': (
                config_models.ConfigPropertyModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class ConfigPropertySnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating ConfigPropertySnapshotContentModel."""

    related_model_name = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^.*-\\d*$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'config_property_ids': (
                config_models.ConfigPropertyModel,
                [item.id[:item.id.find('-')]]),
        }


class SentEmailModelValidator(BaseModelValidator):
    """Class for validating SentEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [intent].[random hash]
        regex_string = '^%s\\.\\.[A-Za-z0-9]{1,%s}$' % (
            item.intent, base_models.ID_LENGTH)
        return regex_string

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
            item: ndb.Model. SentEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls.errors['sent datetime check'].append((
                'Entity id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.sent_datetime))

    @classmethod
    def _validate_sender_email(cls, item):
        """Validate that sender email corresponds to email of user obtained
        by using the sender_id.

        Args:
            item: ndb.Model. SentEmailModel to validate.
        """
        sender_model_class_model_id_model_tuples = (
            cls.external_instance_details['sender_id'])

        for (_, _, sender_model) in (
                sender_model_class_model_id_model_tuples):
            if sender_model and not sender_model.deleted:
                if sender_model.email != item.sender_email:
                    cls.errors['sender email check'].append((
                        'Entity id %s: Sender email %s in entity does not '
                        'match with email %s of user obtained through '
                        'sender id %s') % (
                            item.id, item.sender_email, sender_model.email,
                            item.sender_id))

    @classmethod
    def _validate_recipient_email(cls, item):
        """Validate that recipient email corresponds to email of user obtained
        by using the recipient_id.

        Args:
            item: ndb.Model. SentEmailModel to validate.
        """
        recipient_model_class_model_id_model_tuples = (
            cls.external_instance_details['recipient_id'])

        for (_, _, recipient_model) in (
                recipient_model_class_model_id_model_tuples):
            if recipient_model and not recipient_model.deleted:
                if recipient_model.email != item.recipient_email:
                    cls.errors['recipient email check'].append((
                        'Entity id %s: Recipient email %s in entity does '
                        'not match with email %s of user obtained through '
                        'recipient id %s') % (
                            item.id, item.recipient_email,
                            recipient_model.email, item.recipient_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_sent_datetime,
            cls._validate_sender_email,
            cls._validate_recipient_email]


class BulkEmailModelValidator(BaseModelValidator):
    """Class for validating BulkEmailModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'recipient_id': (
                user_models.UserSettingsModel, item.recipient_ids),
            'sender_id': (user_models.UserSettingsModel, [item.sender_id]),
        }

    @classmethod
    def _validate_sent_datetime(cls, item):
        """Validate that sent_datetime of model is less than current time.

        Args:
            item: ndb.Model. BulkEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls.errors['sent datetime check'].append((
                'Entity id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.sent_datetime))

    @classmethod
    def _validate_sender_email(cls, item):
        """Validate that sender email corresponds to email of user obtained
        by using the sender_id.

        Args:
            item: ndb.Model. BulkEmailModel to validate.
        """
        sender_model_class_model_id_model_tuples = (
            cls.external_instance_details['sender_id'])

        for (_, _, sender_model) in (
                sender_model_class_model_id_model_tuples):
            if sender_model and not sender_model.deleted:
                if sender_model.email != item.sender_email:
                    cls.errors['sender email check'].append((
                        'Entity id %s: Sender email %s in entity does not '
                        'match with email %s of user obtained through '
                        'sender id %s') % (
                            item.id, item.sender_email, sender_model.email,
                            item.sender_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_sent_datetime,
            cls._validate_sender_email]


class GeneralFeedbackEmailReplyToIdModelValidator(BaseModelValidator):
    """Class for validating GeneralFeedbackEmailReplyToIdModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return (
            '^\\d*\\.(exploration|topic)\\.[A-Za-z0-9]{1,12}\\.'
            '[A-Za-z0-9=+/]{1,}')

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
            item: ndb.Model. GeneralFeedbackEmailReplyToIdModel to validate.
        """
        # The reply_to_id of model is created using utils.get_random_int
        # method by using a upper bound as email_models.REPLY_TO_ID_LENGTH.
        # So, the reply_to_id length should be less than or equal to
        # email_models.REPLY_TO_ID_LENGTH.
        if len(item.reply_to_id) > email_models.REPLY_TO_ID_LENGTH:
            cls.errors['reply_to_id length check'].append((
                'Entity id %s: reply_to_id %s should have length less than or '
                'equal to %s but instead has length %s' % (
                    item.id, item.reply_to_id, email_models.REPLY_TO_ID_LENGTH,
                    len(item.reply_to_id))))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_reply_to_id_length]


class ExplorationModelValidator(BaseModelValidator):
    """Class for validating ExplorationModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return exp_services.get_exploration_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'exploration_commit_log_entry_ids': (
                exp_models.ExplorationCommitLogEntryModel,
                ['exploration-%s-%s' % (item.id, version) for version in range(
                    1, item.version + 1)]),
            'exp_summary_ids': (
                exp_models.ExpSummaryModel, [item.id]),
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel, [item.id]),
            'snapshot_metadata_ids': (
                exp_models.ExplorationSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                exp_models.ExplorationSnapshotContentModel,
                snapshot_model_ids),
        }


class ExplorationSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationSnapshotMetadataModel."""

    related_model_name = 'exploration'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return exp_domain.ExplorationChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class ExplorationSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating ExplorationSnapshotContentModel."""

    related_model_name = 'exploration'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id[:item.id.find('-')]]),
        }


class ExplorationRightsModelValidator(BaseModelValidator):
    """Class for validating ExplorationRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        cloned_from_exploration_id = []
        if item.cloned_from:
            cloned_from_exploration_id.append(item.cloned_from)
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id]),
            'cloned_from_exploration_ids': (
                exp_models.ExplorationModel,
                cloned_from_exploration_id),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'snapshot_metadata_ids': (
                exp_models.ExplorationRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                exp_models.ExplorationRightsSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ndb.Model. ExplorationRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        epoch = datetime.datetime.utcfromtimestamp(0)
        current_msec = (
            datetime.datetime.utcnow() - epoch).total_seconds() * 1000.0
        if item.first_published_msec > current_msec:
            cls.errors['first published msec check'].append((
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class ExplorationRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationRightsSnapshotMetadataModel."""

    related_model_name = 'exploration rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_manager.ExplorationRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class ExplorationRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating ExplorationRightsSnapshotContentModel."""

    related_model_name = 'exploration rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class ExplorationCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating ExplorationCommitLogEntryModel."""

    related_model_name = 'exploration'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exploration/rights]-[exploration_id]-[exploration-version].
        regex_string = '^(exploration|rights)-%s-\\d*$' % (
            item.exploration_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_manager.ExplorationRightsChange
        else:
            return exp_domain.ExplorationChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.exploration_id]),
        }
        if item.id.startswith('rights'):
            external_id_relationships['exploration_rights_ids'] = (
                exp_models.ExplorationRightsModel, [item.exploration_id])
        return external_id_relationships


class ExpSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating ExpSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return exp_services.get_exploration_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id]),
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel, [item.id]),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'contributor_user_ids': (
                user_models.UserSettingsModel, item.contributor_ids)
        }

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: ndb.Model. ExpSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            item.contributors_summary.keys())
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls.errors['contributors summary check'].append((
                'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s') % (
                    item.id, sorted(item.contributor_ids),
                    sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ndb.Model. ExpSummaryModel to validate.
        """
        if not item.first_published_msec:
            return

        epoch = datetime.datetime.utcfromtimestamp(0)
        current_msec = (
            datetime.datetime.utcnow() - epoch).total_seconds() * 1000.0
        if item.first_published_msec > current_msec:
            cls.errors['first published msec check'].append((
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec))

    @classmethod
    def _validate_exploration_model_last_updated(cls, item):
        """Validate that item.exploration_model_last_updated matches the
        time when a last commit was made by a human contributor.

        Args:
            item: ndb.Model. ExpSummaryModel to validate.
        """
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])
        for (_, _, exploration_model) in (
                exploration_model_class_model_id_model_tuples):
            if not exploration_model or exploration_model.deleted:
                continue
            last_human_update_ms = exp_services.get_last_updated_by_human_ms(
                exploration_model.id)
            last_human_update_time = datetime.datetime.fromtimestamp(
                last_human_update_ms / 1000.0)
            if item.exploration_model_last_updated != last_human_update_time:
                cls.errors['exploration model last updated check'].append((
                    'Entity id %s: The exploration_model_last_updated '
                    'field: %s does not match the last time a commit was '
                    'made by a human contributor: %s') % (
                        item.id, item.exploration_model_last_updated,
                        last_human_update_time))

    @classmethod
    def _get_related_model_properties(cls):
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])
        exploration_rights_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_rights_ids'])

        exploration_model_properties_dict = {
            'title': 'title',
            'category': 'category',
            'objective': 'objective',
            'language_code': 'language_code',
            'tags': 'tags',
            'exploration_model_created_on': 'created_on',
        }

        exploration_rights_model_properties_dict = {
            'first_published_msec': 'first_published_msec',
            'status': 'status',
            'community_owned': 'community_owned',
            'owner_ids': 'owner_ids',
            'editor_ids': 'editor_ids',
            'viewer_ids': 'viewer_ids',
        }

        return [(
            'exploration',
            exploration_model_class_model_id_model_tuples,
            exploration_model_properties_dict
        ), (
            'exploration rights',
            exploration_rights_model_class_model_id_model_tuples,
            exploration_rights_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_first_published_msec,
            cls._validate_contributors_summary,
            cls._validate_exploration_model_last_updated]


class FileMetadataModelValidator(BaseModelValidator):
    """Class for validating FileMetadataModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^%s$' % FILE_MODELS_REGEX

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]

        # Item id is of the format:
        # /exploration/exp_id/assets/(image|audio)/filepath.
        exp_val = '/exploration/'
        assets_val = '/assets'
        start_index = item.id.find(exp_val) + len(exp_val)
        end_index = item.id.find(assets_val)
        exp_id = item.id[start_index:end_index]

        return {
            'snapshot_metadata_ids': (
                file_models.FileMetadataSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                file_models.FileMetadataSnapshotContentModel,
                snapshot_model_ids),
            'exploration_ids': (exp_models.ExplorationModel, [exp_id])
        }


class FileMetadataSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating FileMetadataSnapshotMetadataModel."""

    related_model_name = 'file metadata'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '%s-\\d*$' % FILE_MODELS_REGEX

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return fs_domain.FileMetadataChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_metadata_ids': (
                file_models.FileMetadataModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class FileMetadataSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating FileMetadataSnapshotContentModel."""

    related_model_name = 'file metadata'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '%s-\\d*$' % FILE_MODELS_REGEX

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_metadata_ids': (
                file_models.FileMetadataModel,
                [item.id[:item.id.find('-')]]),
        }


class FileModelValidator(BaseModelValidator):
    """Class for validating FileModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^%s$' % FILE_MODELS_REGEX

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]

        # Item id is of the format:
        # /exploration/exp_id/assets/(image|audio)/filepath.
        exp_val = '/exploration/'
        assets_val = '/assets'
        start_index = item.id.find(exp_val) + len(exp_val)
        end_index = item.id.find(assets_val)
        exp_id = item.id[start_index:end_index]

        return {
            'snapshot_metadata_ids': (
                file_models.FileSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                file_models.FileSnapshotContentModel,
                snapshot_model_ids),
            'exploration_ids': (exp_models.ExplorationModel, [exp_id])
        }


class FileSnapshotMetadataModelValidator(BaseSnapshotMetadataModelValidator):
    """Class for validating FileSnapshotMetadataModel."""

    related_model_name = 'file'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '%s-\\d*$' % FILE_MODELS_REGEX

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return fs_domain.FileChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_ids': (
                file_models.FileModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class FileSnapshotContentModelValidator(BaseSnapshotContentModelValidator):
    """Class for validating FileSnapshotContentModel."""

    related_model_name = 'file'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '%s-\\d*$' % FILE_MODELS_REGEX

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'file_ids': (
                file_models.FileModel,
                [item.id[:item.id.find('-')]]),
        }


class ExplorationRecommendationsModelValidator(BaseModelValidator):
    """Class for validating ExplorationRecommendationsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel,
                [item.id] + item.recommended_exploration_ids),
        }

    @classmethod
    def _validate_item_id_not_in_recommended_exploration_ids(cls, item):
        """Validate that model id is not present in recommended exploration ids.

        Args:
            item: ndb.Model. ExplorationRecommendationsModel to validate.
        """
        if item.id in item.recommended_exploration_ids:
            cls.errors['item exploration id check'].append((
                'Entity id %s: The exploration id: %s for which the entity is '
                'created is also present in the recommended exploration ids '
                'for entity') % (item.id, item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_item_id_not_in_recommended_exploration_ids]


class TopicSimilaritiesModelValidator(BaseModelValidator):
    """Class for validating TopicSimilaritiesModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: topics.
        return '^%s$' % recommendations_models.TOPIC_SIMILARITIES_ID

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_topic_similarities(cls, item):
        """Validate the topic similarities to be symmetric and have real
        values between 0.0 and 1.0.

        Args:
            item: ndb.Model. TopicSimilaritiesModel to validate.
        """

        topics = item.content.keys()
        data = '%s\n' % (',').join(topics)

        for topic1 in topics:
            similarity_list = []
            for topic2 in item.content[topic1]:
                similarity_list.append(str(item.content[topic1][topic2]))
            if len(similarity_list):
                data = data + '%s\n' % (',').join(similarity_list)

        try:
            recommendations_services.validate_topic_similarities(data)
        except Exception as e:
            cls.errors['topic similarity check'].append(
                'Entity id %s: Topic similarity validation for content: %s '
                'fails with error: %s' % (item.id, item.content, e))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_topic_similarities]


class SkillModelValidator(BaseModelValidator):
    """Class for validating SkillModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return skill_services.get_skill_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        superseding_skill_ids = []
        if item.superseding_skill_id:
            superseding_skill_ids = [item.superseding_skill_id]
        return {
            'skill_commit_log_entry_ids': (
                skill_models.SkillCommitLogEntryModel,
                ['skill-%s-%s' % (item.id, version) for version in range(
                    1, item.version + 1)]),
            'skill_summary_ids': (
                skill_models.SkillSummaryModel, [item.id]),
            'skill_rights_ids': (
                skill_models.SkillRightsModel, [item.id]),
            'superseding_skill_ids': (
                skill_models.SkillModel, superseding_skill_ids),
            'snapshot_metadata_ids': (
                skill_models.SkillSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                skill_models.SkillSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_all_questions_merged(cls, item):
        """Validate that all_questions_merged is True only if
        superseding_skill_id is not None and there are no
        questions linked with the skill. The superseding skill
        id check is already performed in domain object validation,
        so it is not repeated here.

        Args:
            item: ndb.Model. SkillModel to validate.
        """
        questions_ids_linked_with_skill = (
            question_models.QuestionSkillLinkModel.get_all_question_ids_linked_to_skill_id( # pylint: disable=line-too-long
                item.id))
        if item.all_questions_merged and questions_ids_linked_with_skill:
            cls.errors['all questions merged check'].append(
                'Entity id %s: all_questions_merged is True but there '
                'are following question ids still linked to the skill: %s' % (
                    item.id, questions_ids_linked_with_skill))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_all_questions_merged]


class SkillSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating SkillSnapshotMetadataModel."""

    related_model_name = 'skill'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return skill_domain.SkillChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_ids': (
                skill_models.SkillModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class SkillSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating SkillSnapshotContentModel."""

    related_model_name = 'skill'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_ids': (
                skill_models.SkillModel,
                [item.id[:item.id.find('-')]]),
        }


class SkillRightsModelValidator(BaseModelValidator):
    """Class for validating SkillRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'skill_ids': (
                skill_models.SkillModel, [item.id]),
            'creator_user_ids': (
                user_models.UserSettingsModel, [item.creator_id]),
            'snapshot_metadata_ids': (
                skill_models.SkillRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                skill_models.SkillRightsSnapshotContentModel,
                snapshot_model_ids),
        }


class SkillRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating SkillRightsSnapshotMetadataModel."""

    related_model_name = 'skill rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return skill_domain.SkillRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_rights_ids': (
                skill_models.SkillRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class SkillRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating SkillRightsSnapshotContentModel."""

    related_model_name = 'skill rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_rights_ids': (
                skill_models.SkillRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class SkillCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating SkillCommitLogEntryModel."""

    related_model_name = 'skill'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [skill/rights]-[skill_id]-[skill_version].
        regex_string = '^(skill|rights)-%s-\\d*$' % (
            item.skill_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return skill_domain.SkillRightsChange
        else:
            return skill_domain.SkillChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'skill_ids': (
                skill_models.SkillModel, [item.skill_id]),
        }
        if item.id.startswith('rights'):
            external_id_relationships['skill_rights_ids'] = (
                skill_models.SkillRightsModel, [item.skill_id])
        return external_id_relationships


class SkillSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating SkillSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return skill_services.get_skill_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_ids': (
                skill_models.SkillModel, [item.id]),
            'skill_rights_ids': (
                skill_models.SkillRightsModel, [item.id])
        }

    @classmethod
    def _validate_misconception_count(cls, item):
        """Validate that misconception_count of model is equal to
        number of misconceptions in SkillModel.misconceptions.

        Args:
            item: ndb.Model. SkillSummaryModel to validate.
        """
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        for (_, _, skill_model) in (
                skill_model_class_model_id_model_tuples):
            if item.misconception_count != len(skill_model.misconceptions):
                cls.errors['misconception count check'].append((
                    'Entity id %s: Misconception count: %s does not match '
                    'the number of misconceptions in skill model: %s') % (
                        item.id, item.misconception_count,
                        skill_model.misconceptions))

    @classmethod
    def _validate_worked_examples_count(cls, item):
        """Validate that worked examples count of model is equal to
        number of misconceptions in SkillModel.skill_contents.worked_examples.

        Args:
            item: ndb.Model. SkillSummaryModel to validate.
        """
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        for (_, _, skill_model) in (
                skill_model_class_model_id_model_tuples):
            if item.worked_examples_count != len(
                    skill_model.skill_contents['worked_examples']):
                cls.errors['worked examples count check'].append((
                    'Entity id %s: Worked examples count: %s does not match '
                    'the number of worked examples in skill_contents '
                    'in skill model: %s') % (
                        item.id, item.worked_examples_count,
                        skill_model.skill_contents['worked_examples']))

    @classmethod
    def _get_related_model_properties(cls):
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        skill_model_properties_dict = {
            'description': 'description',
            'language_code': 'language_code',
            'skill_model_created_on': 'created_on',
            'skill_model_last_updated': 'last_updated'
        }

        return [(
            'skill',
            skill_model_class_model_id_model_tuples,
            skill_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_misconception_count,
            cls._validate_worked_examples_count
            ]


class StoryModelValidator(BaseModelValidator):
    """Class for validating StoryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_services.get_story_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'story_commit_log_entry_ids': (
                story_models.StoryCommitLogEntryModel,
                ['story-%s-%s' % (item.id, version) for version in range(
                    1, item.version + 1)]),
            'story_summary_ids': (
                story_models.StorySummaryModel, [item.id]),
            'story_rights_ids': (
                story_models.StoryRightsModel, [item.id]),
            'snapshot_metadata_ids': (
                story_models.StorySnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                story_models.StorySnapshotContentModel,
                snapshot_model_ids),
            'exploration_ids': (
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in (
                    item.story_contents['nodes'])])
        }


class StorySnapshotMetadataModelValidator(BaseSnapshotMetadataModelValidator):
    """Class for validating StorySnapshotMetadataModel."""

    related_model_name = 'story'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return story_domain.StoryChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class StorySnapshotContentModelValidator(BaseSnapshotContentModelValidator):
    """Class for validating StorySnapshotContentModel."""

    related_model_name = 'story'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.id[:item.id.find('-')]]),
        }


class StoryRightsModelValidator(BaseModelValidator):
    """Class for validating StoryRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'story_ids': (
                story_models.StoryModel, [item.id]),
            'manager_user_ids': (
                user_models.UserSettingsModel, item.manager_ids),
            'snapshot_metadata_ids': (
                story_models.StoryRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                story_models.StoryRightsSnapshotContentModel,
                snapshot_model_ids),
        }


class StoryRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating StoryRightsSnapshotMetadataModel."""

    related_model_name = 'story rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return story_domain.StoryRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_rights_ids': (
                story_models.StoryRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class StoryRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating StoryRightsSnapshotContentModel."""

    related_model_name = 'story rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_rights_ids': (
                story_models.StoryRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class StoryCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating StoryCommitLogEntryModel."""

    related_model_name = 'story'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [story]-[story_id]-[story_version].
        regex_string = '^(story)-%s-\\d*$' % (
            item.story_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return story_domain.StoryChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.story_id]),
        }


class StorySummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating StorySummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_services.get_story_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.id]),
            'story_rights_ids': (
                story_models.StoryRightsModel, [item.id]),
        }

    @classmethod
    def _validate_node_count(cls, item):
        """Validate that node_count of model is equal to number of nodes
        in StoryModel.story_contents.

        Args:
            item: ndb.Model. StorySummaryModel to validate.
        """
        story_model_class_model_id_model_tuples = cls.external_instance_details[
            'story_ids']

        for (_, _, story_model) in story_model_class_model_id_model_tuples:
            nodes = story_model.story_contents['nodes']
            if item.node_count != len(nodes):
                cls.errors['node count check'].append((
                    'Entity id %s: Node count: %s does not match the '
                    'number of nodes in story_contents dict: %s') % (
                        item.id, item.node_count, nodes))

    @classmethod
    def _get_related_model_properties(cls):
        story_model_class_model_id_model_tuples = cls.external_instance_details[
            'story_ids']

        story_model_properties_dict = {
            'title': 'title',
            'language_code': 'language_code',
            'description': 'description',
            'story_model_created_on': 'created_on',
            'story_model_last_updated': 'last_updated'
        }

        return [(
            'story',
            story_model_class_model_id_model_tuples,
            story_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_node_count]


class TopicModelValidator(BaseModelValidator):
    """Class for validating TopicModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_services.get_topic_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        skill_ids = item.uncategorized_skill_ids
        for subtopic in item.subtopics:
            skill_ids = skill_ids + subtopic['skill_ids']
        return {
            'topic_commit_log_entry_ids': (
                topic_models.TopicCommitLogEntryModel,
                ['topic-%s-%s' % (item.id, version) for version in range(
                    1, item.version + 1)]),
            'topic_summary_ids': (
                topic_models.TopicSummaryModel, [item.id]),
            'topic_rights_ids': (
                topic_models.TopicRightsModel, [item.id]),
            'snapshot_metadata_ids': (
                topic_models.TopicSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                topic_models.TopicSnapshotContentModel,
                snapshot_model_ids),
            'story_ids': (
                story_models.StoryModel,
                item.canonical_story_ids + item.additional_story_ids),
            'skill_ids': (skill_models.SkillModel, skill_ids),
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel,
                ['%s-%s' % (
                    item.id, subtopic['id']) for subtopic in item.subtopics])
        }

    @classmethod
    def _validate_canonical_name_matches_name_in_lowercase(cls, item):
        """Validate that canonical name of the model is same as name of the
        model in lowercase.

        Args:
            item: ndb.Model. TopicModel to validate.
        """
        name = item.name
        if name.lower() != item.canonical_name:
            cls.errors['canonical name check'].append(
                'Entity id %s: Entity name %s in lowercase does not match '
                'canonical name %s' % (item.id, item.name, item.canonical_name))

    @classmethod
    def _validate_uncategorized_skill_ids_not_in_subtopic_skill_ids(cls, item):
        """Validate that uncategorized_skill_ids of model is not present in
        any subtopic of the model.

        Args:
            item: ndb.Model. TopicModel to validate.
        """
        for skill_id in item.uncategorized_skill_ids:
            for subtopic in item.subtopics:
                if skill_id in subtopic['skill_ids']:
                    cls.errors['uncategorized skill ids check'].append(
                        'Entity id %s: uncategorized skill id %s is present '
                        'in subtopic for entity with id %s' % (
                            item.id, skill_id, subtopic['id']))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_canonical_name_matches_name_in_lowercase,
            cls._validate_uncategorized_skill_ids_not_in_subtopic_skill_ids]


class TopicSnapshotMetadataModelValidator(BaseSnapshotMetadataModelValidator):
    """Class for validating TopicSnapshotMetadataModel."""

    related_model_name = 'topic'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class TopicSnapshotContentModelValidator(BaseSnapshotContentModelValidator):
    """Class for validating TopicSnapshotContentModel."""

    related_model_name = 'topic'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id[:item.id.find('-')]]),
        }


class TopicRightsModelValidator(BaseModelValidator):
    """Class for validating TopicRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id]),
            'manager_user_ids': (
                user_models.UserSettingsModel, item.manager_ids),
            'snapshot_metadata_ids': (
                topic_models.TopicRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                topic_models.TopicRightsSnapshotContentModel,
                snapshot_model_ids),
        }


class TopicRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating TopicRightsSnapshotMetadataModel."""

    related_model_name = 'topic rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_rights_ids': (
                topic_models.TopicRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class TopicRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating TopicRightsSnapshotContentModel."""

    related_model_name = 'topic rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_rights_ids': (
                topic_models.TopicRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class TopicCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating TopicCommitLogEntryModel."""

    related_model_name = 'topic'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [topic/rights]-[topic_id]-[topic_version].
        regex_string = '^(topic|rights)-%s-\\d*$' % (
            item.topic_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return topic_domain.TopicRightsChange
        else:
            return topic_domain.TopicChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'topic_ids': (
                topic_models.TopicModel, [item.topic_id]),
        }
        if item.id.startswith('rights'):
            external_id_relationships['topic_rights_ids'] = (
                topic_models.TopicRightsModel, [item.topic_id])
        return external_id_relationships


class TopicSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating TopicSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_services.get_topic_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id]),
            'topic_rights_ids': (
                topic_models.TopicRightsModel, [item.id]),
        }

    @classmethod
    def _validate_canonical_story_count(cls, item):
        """Validate that canonical story count of model is equal to
        number of story ids in TopicModel.canonical_story_ids.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            if item.canonical_story_count != len(
                    topic_model.canonical_story_ids):
                cls.errors['canonical story count check'].append((
                    'Entity id %s: Canonical story count: %s does not '
                    'match the number of story ids in canonical_story_ids in '
                    'topic model: %s') % (
                        item.id, item.canonical_story_count,
                        topic_model.canonical_story_ids))

    @classmethod
    def _validate_additional_story_count(cls, item):
        """Validate that additional story count of model is equal to
        number of story ids in TopicModel.additional_story_ids.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            if item.additional_story_count != len(
                    topic_model.additional_story_ids):
                cls.errors['additional story count check'].append((
                    'Entity id %s: Additional story count: %s does not '
                    'match the number of story ids in additional_story_ids in '
                    'topic model: %s') % (
                        item.id, item.additional_story_count,
                        topic_model.additional_story_ids))

    @classmethod
    def _validate_uncategorized_skill_count(cls, item):
        """Validate that uncategorized skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            if item.uncategorized_skill_count != len(
                    topic_model.uncategorized_skill_ids):
                cls.errors['uncategorized skill count check'].append((
                    'Entity id %s: Uncategorized skill count: %s does not '
                    'match the number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s') % (
                        item.id, item.uncategorized_skill_count,
                        topic_model.uncategorized_skill_ids))

    @classmethod
    def _validate_total_skill_count(cls, item):
        """Validate that total skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids and skill
        ids in subtopics of TopicModel.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            subtopic_skill_ids = []
            for subtopic in topic_model.subtopics:
                subtopic_skill_ids = subtopic_skill_ids + subtopic['skill_ids']
            if item.total_skill_count != len(
                    topic_model.uncategorized_skill_ids + subtopic_skill_ids):
                cls.errors['total skill count check'].append((
                    'Entity id %s: Total skill count: %s does not '
                    'match the total number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s and skill_ids '
                    'in subtopics of topic model: %s') % (
                        item.id, item.total_skill_count,
                        topic_model.uncategorized_skill_ids,
                        subtopic_skill_ids))

    @classmethod
    def _validate_subtopic_count(cls, item):
        """Validate that subtopic count of model is equal to
        number of subtopics in TopicModel.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            if item.subtopic_count != len(topic_model.subtopics):
                cls.errors['subtopic count check'].append((
                    'Entity id %s: Subtopic count: %s does not '
                    'match the total number of subtopics in topic '
                    'model: %s ') % (
                        item.id, item.subtopic_count, topic_model.subtopics))

    @classmethod
    def _get_related_model_properties(cls):
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        topic_model_properties_dict = {
            'name': 'name',
            'canonical_name': 'canonical_name',
            'language_code': 'language_code',
            'topic_model_created_on': 'created_on',
            'topic_model_last_updated': 'last_updated'
        }

        return [(
            'topic',
            topic_model_class_model_id_model_tuples,
            topic_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_canonical_story_count,
            cls._validate_additional_story_count,
            cls._validate_uncategorized_skill_count,
            cls._validate_total_skill_count,
            cls._validate_subtopic_count]


class SubtopicPageModelValidator(BaseModelValidator):
    """Class for validating SubtopicPageModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s-\\d*$' % (item.topic_id)

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return subtopic_page_services.get_subtopic_page_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in range(
                1, item.version + 1)]
        return {
            'subtopic_page_commit_log_entry_ids': (
                topic_models.SubtopicPageCommitLogEntryModel,
                ['subtopicpage-%s-%s' % (item.id, version) for version in range(
                    1, item.version + 1)]),
            'snapshot_metadata_ids': (
                topic_models.SubtopicPageSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                topic_models.SubtopicPageSnapshotContentModel,
                snapshot_model_ids),
            'topic_ids': (
                topic_models.TopicModel, [item.topic_id])
        }

    @classmethod
    def _get_custom_validation_functions(cls):
        return []


class SubtopicPageSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating SubtopicPageSnapshotMetadataModel."""

    related_model_name = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return subtopic_page_domain.SubtopicPageChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel, [item.id[:item.id.rfind('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class SubtopicPageSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating SubtopicPageSnapshotContentModel."""

    related_model_name = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel, [item.id[:item.id.rfind('-')]]),
        }


class SubtopicPageCommitLogEntryModelValidator(
        BaseCommitLogEntryModelValidator):
    """Class for validating SubtopicPageCommitLogEntryModel."""

    related_model_name = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [subtopicpage]-[subtopic_id]-[subtopic_version].
        regex_string = '^(subtopicpage)-%s-\\d*$' % (
            item.subtopic_page_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return subtopic_page_domain.SubtopicPageChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel, [item.subtopic_page_id]),
        }


class UserSubscriptionsModelValidator(BaseModelValidator):
    """Class for validating UserSubscriptionsModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^\\d*$'

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
    skill_models.SkillModel: SkillModelValidator,
    skill_models.SkillSnapshotMetadataModel: (
        SkillSnapshotMetadataModelValidator),
    skill_models.SkillSnapshotContentModel: (
        SkillSnapshotContentModelValidator),
    skill_models.SkillRightsModel: SkillRightsModelValidator,
    skill_models.SkillRightsSnapshotMetadataModel: (
        SkillRightsSnapshotMetadataModelValidator),
    skill_models.SkillRightsSnapshotContentModel: (
        SkillRightsSnapshotContentModelValidator),
    skill_models.SkillCommitLogEntryModel: (
        SkillCommitLogEntryModelValidator),
    skill_models.SkillSummaryModel: SkillSummaryModelValidator,
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
    topic_models.TopicModel: TopicModelValidator,
    topic_models.TopicSnapshotMetadataModel: (
        TopicSnapshotMetadataModelValidator),
    topic_models.TopicSnapshotContentModel: (
        TopicSnapshotContentModelValidator),
    topic_models.TopicRightsModel: TopicRightsModelValidator,
    topic_models.TopicRightsSnapshotMetadataModel: (
        TopicRightsSnapshotMetadataModelValidator),
    topic_models.TopicRightsSnapshotContentModel: (
        TopicRightsSnapshotContentModelValidator),
    topic_models.TopicCommitLogEntryModel: (
        TopicCommitLogEntryModelValidator),
    topic_models.TopicSummaryModel: TopicSummaryModelValidator,
    topic_models.SubtopicPageModel: SubtopicPageModelValidator,
    topic_models.SubtopicPageSnapshotMetadataModel: (
        SubtopicPageSnapshotMetadataModelValidator),
    topic_models.SubtopicPageSnapshotContentModel: (
        SubtopicPageSnapshotContentModelValidator),
    topic_models.SubtopicPageCommitLogEntryModel: (
        SubtopicPageCommitLogEntryModelValidator),
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
                        (',').join(set(error_val)))
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


class SkillModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillModel]


class SkillSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSnapshotMetadataModel]


class SkillSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSnapshotContentModel]


class SkillRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillRightsModel]


class SkillRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillRightsSnapshotMetadataModel]


class SkillRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillRightsSnapshotContentModel]


class SkillCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillCommitLogEntryModel]


class SkillSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSummaryModel]


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


class TopicModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]


class TopicSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicSnapshotMetadataModel]


class TopicSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicSnapshotContentModel]


class TopicRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicRightsModel]


class TopicRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicRightsSnapshotMetadataModel]


class TopicRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicRightsSnapshotContentModel]


class TopicCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicCommitLogEntryModel]


class TopicSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicSummaryModel]


class SubtopicPageModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageModel]


class SubtopicPageSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageSnapshotMetadataModel]


class SubtopicPageSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageSnapshotContentModel]


class SubtopicPageCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageCommitLogEntryModel]


class UserSubscriptionsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserSubscriptionsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]
