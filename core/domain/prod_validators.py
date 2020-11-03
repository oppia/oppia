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

"""Validators for prod models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import itertools
import re

from constants import constants
from core.domain import base_model_validators
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import learner_progress_services
from core.domain import platform_parameter_domain
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_domain
from core.domain import user_services
from core.domain import voiceover_services
from core.domain import wipeout_service
from core.platform import models
import feconf
import python_utils
import utils

(
    base_models, collection_models, config_models,
    email_models, exp_models, feedback_models,
    job_models, question_models, skill_models, story_models,
    subtopic_models, suggestion_models, topic_models,
    user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.config,
    models.NAMES.email, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.job, models.NAMES.question, models.NAMES.skill,
    models.NAMES.story, models.NAMES.subtopic,
    models.NAMES.suggestion, models.NAMES.topic, models.NAMES.user

])

ALLOWED_AUDIO_EXTENSIONS = list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())
ALLOWED_IMAGE_EXTENSIONS = list(itertools.chain.from_iterable(
    iter(feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.values())))
ASSETS_PATH_REGEX = '/exploration/[A-Za-z0-9-_]{1,12}/assets/'
IMAGE_PATH_REGEX = (
    '%simage/[A-Za-z0-9-_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_IMAGE_EXTENSIONS)))
AUDIO_PATH_REGEX = (
    '%saudio/[A-Za-z0-9-_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_AUDIO_EXTENSIONS)))
USER_ID_REGEX = 'uid_[a-z]{32}'
ALL_CONTINUOUS_COMPUTATION_MANAGERS_CLASS_NAMES = [
    'DashboardRecentUpdatesAggregator',
    'ExplorationRecommendationsAggregator',
    'FeedbackAnalyticsAggregator',
    'InteractionAnswerSummariesAggregator',
    'SearchRanker',
    'StatisticsAggregator',
    'UserImpactAggregator',
    'UserStatsAggregator']
TARGET_TYPE_TO_TARGET_MODEL = {
    suggestion_models.TARGET_TYPE_EXPLORATION: (
        exp_models.ExplorationModel),
    suggestion_models.TARGET_TYPE_QUESTION: (
        question_models.QuestionModel),
    suggestion_models.TARGET_TYPE_SKILL: (
        skill_models.SkillModel),
    suggestion_models.TARGET_TYPE_TOPIC: (
        topic_models.TopicModel)
}
VALID_SCORE_CATEGORIES_FOR_TYPE_QUESTION = [
    '%s\\.[A-Za-z0-9-_]{1,%s}' % (
        suggestion_models.SCORE_TYPE_QUESTION, base_models.ID_LENGTH)]


class RoleQueryAuditModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating RoleQueryAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [user_id].[timestamp_in_sec].[intent].[random_number]
        regex_string = '^%s\\.\\d+\\.%s\\.\\d+$' % (item.user_id, item.intent)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_ids', user_models.UserSettingsModel, [item.user_id])]


class UsernameChangeAuditModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating UsernameChangeAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [committer_id].[timestamp_in_sec]
        # committer_id refers to the user that is making the change.
        regex_string = '^%s\\.\\d+$' % item.committer_id
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]


class CollectionModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating CollectionModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        collection_rights = rights_manager.get_collection_rights(
            item.id, strict=False)

        if collection_rights is None:
            return base_model_validators.VALIDATION_MODE_NEUTRAL

        if rights_manager.is_collection_private(item.id):
            return base_model_validators.VALIDATION_MODE_NON_STRICT

        return base_model_validators.VALIDATION_MODE_STRICT

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in item.collection_contents[
                    'nodes']]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_commit_log_entry_ids',
                collection_models.CollectionCommitLogEntryModel,
                ['collection-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_summary_ids',
                collection_models.CollectionSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                collection_models.CollectionSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                collection_models.CollectionSnapshotContentModel,
                snapshot_model_ids)]


class CollectionSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return collection_domain.CollectionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]


class CollectionSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating CollectionSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids',
                collection_models.CollectionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class CollectionRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating CollectionRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids',
                collection_models.CollectionModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'owner_user_ids',
                user_models.UserSettingsModel, item.owner_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'editor_user_ids',
                user_models.UserSettingsModel, item.editor_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'viewer_user_ids',
                user_models.UserSettingsModel, item.viewer_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                collection_models.CollectionRightsSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                collection_models.CollectionRightsSnapshotContentModel,
                snapshot_model_ids)]

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: datastore_services.Model. CollectionRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_FIRST_PUBLISHED_MSEC_CHECK,
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                % (item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class CollectionRightsSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'collection rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_domain.CollectionRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel, [item.committer_id])]


class CollectionRightsSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating CollectionRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'collection rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class CollectionCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating CollectionCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [collection/rights]-[collection_id]-[collection_version].
        regex_string = '^(collection|rights)-%s-\\d+$' % (
            item.collection_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_domain.CollectionRightsChange
        elif item.id.startswith('collection'):
            return collection_domain.CollectionChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids',
                collection_models.CollectionModel, [item.collection_id])]
        if item.id.startswith('rights'):
            external_id_relationships.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'collection_rights_ids',
                    collection_models.CollectionRightsModel,
                    [item.collection_id]))
        return external_id_relationships


class CollectionSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating CollectionSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids',
                collection_models.CollectionModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'owner_user_ids',
                user_models.UserSettingsModel, item.owner_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'editor_user_ids',
                user_models.UserSettingsModel, item.editor_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'viewer_user_ids',
                user_models.UserSettingsModel, item.viewer_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'contributor_user_ids',
                user_models.UserSettingsModel, item.contributor_ids)]

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: datastore_services.Model. CollectionSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            list(item.contributors_summary.keys()))
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls._add_error(
                'contributors %s' % (
                    base_model_validators.ERROR_CATEGORY_SUMMARY_CHECK),
                'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s' % (
                    item.id, sorted(item.contributor_ids),
                    sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_node_count(
            cls, item, field_name_to_external_model_references):
        """Validate that node_count of model is equal to number of nodes
        in CollectionModel.collection_contents.

        Args:
            item: datastore_services.Model. CollectionSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        collection_model_references = (
            field_name_to_external_model_references['collection_ids'])

        for collection_model_reference in collection_model_references:
            collection_model = collection_model_reference.model_instance
            if collection_model is None or collection_model.deleted:
                model_class = collection_model_reference.model_class
                model_id = collection_model_reference.model_id
                cls._add_error(
                    'collection_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field collection_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            nodes = collection_model.collection_contents['nodes']
            if item.node_count != len(nodes):
                cls._add_error(
                    'node %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Node count: %s does not match the number of '
                    'nodes in collection_contents dict: %s' % (
                        item.id, item.node_count, nodes))

    @classmethod
    def _validate_ratings_is_empty(cls, item):
        """Validate that ratings for the entity is empty.

        Args:
            item: datastore_services.Model. CollectionSummaryModel to validate.
        """
        if item.ratings:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATINGS_CHECK,
                'Entity id %s: Expected ratings for the entity to be '
                'empty but received %s' % (item.id, item.ratings))

    @classmethod
    def _get_external_model_properties(cls):
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
            'collection_ids',
            collection_model_properties_dict
        ), (
            'collection rights',
            'collection_rights_ids',
            collection_rights_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_ratings_is_empty,
            cls._validate_contributors_summary,
            ]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_node_count]


class ConfigPropertyModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating ConfigPropertyModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                config_models.ConfigPropertySnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                config_models.ConfigPropertySnapshotContentModel,
                snapshot_model_ids)]


class ConfigPropertySnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating ConfigPropertySnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return config_domain.ConfigPropertyChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'config_property_ids',
                config_models.ConfigPropertyModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel, [item.committer_id])]


class ConfigPropertySnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating ConfigPropertySnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'config_property_ids',
                config_models.ConfigPropertyModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class SentEmailModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating SentEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [intent].[random hash]
        regex_string = '^%s\\.\\.[A-Za-z0-9-_]{1,%s}$' % (
            item.intent, base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'recipient_id',
                user_models.UserSettingsModel, [item.recipient_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'sender_id', user_models.UserSettingsModel, [item.sender_id])]

    @classmethod
    def _validate_sent_datetime(cls, item):
        """Validate that sent_datetime of model is less than current time.

        Args:
            item: datastore_services.Model. SentEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls._add_error(
                'sent %s' % base_model_validators.ERROR_CATEGORY_DATETIME_CHECK,
                'Entity id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run' % (
                    item.id, item.sent_datetime))

    @classmethod
    def _validate_recipient_email(
            cls, item, field_name_to_external_model_references):
        """Validate that recipient email corresponds to email of user obtained
        by using the recipient_id.

        Args:
            item: datastore_services.Model. SentEmailModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        recipient_model_references = (
            field_name_to_external_model_references['recipient_id'])

        for recipient_model_reference in recipient_model_references:
            recipient_model = recipient_model_reference.model_instance
            if recipient_model is None or recipient_model.deleted:
                model_class = recipient_model_reference.model_class
                model_id = recipient_model_reference.model_id
                cls._add_error(
                    'recipient_id %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field recipient_id having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if recipient_model.email != item.recipient_email:
                cls._add_error(
                    'recipient %s' % (
                        base_model_validators.ERROR_CATEGORY_EMAIL_CHECK),
                    'Entity id %s: Recipient email %s in entity does '
                    'not match with email %s of user obtained through '
                    'recipient id %s' % (
                        item.id, item.recipient_email,
                        recipient_model.email, item.recipient_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_sent_datetime]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_recipient_email]


class BulkEmailModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BulkEmailModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'recipient_id',
                user_models.UserSettingsModel, item.recipient_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'sender_id', user_models.UserSettingsModel, [item.sender_id])]

    @classmethod
    def _validate_sent_datetime(cls, item):
        """Validate that sent_datetime of model is less than current time.

        Args:
            item: datastore_services.Model. BulkEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls._add_error(
                'sent %s' % base_model_validators.ERROR_CATEGORY_DATETIME_CHECK,
                'Entity id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run' % (
                    item.id, item.sent_datetime))

    @classmethod
    def _validate_sender_email(
            cls, item, field_name_to_external_model_references):
        """Validate that sender email corresponds to email of user obtained
        by using the sender_id.

        Args:
            item: datastore_services.Model. BulkEmailModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        sender_model_references = (
            field_name_to_external_model_references['sender_id'])

        for sender_model_reference in sender_model_references:
            sender_model = sender_model_reference.model_instance
            if sender_model is None or sender_model.deleted:
                model_class = sender_model_reference.model_class
                model_id = sender_model_reference.model_id
                cls._add_error(
                    'sender_id %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field sender_id having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if sender_model.email != item.sender_email:
                cls._add_error(
                    'sender %s' % (
                        base_model_validators.ERROR_CATEGORY_EMAIL_CHECK),
                    'Entity id %s: Sender email %s in entity does not '
                    'match with email %s of user obtained through '
                    'sender id %s' % (
                        item.id, item.sender_email, sender_model.email,
                        item.sender_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_sent_datetime]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_sender_email]


class GeneralFeedbackEmailReplyToIdModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating GeneralFeedbackEmailReplyToIdModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return (
            '^%s\\.(%s)\\.[A-Za-z0-9-_]{1,%s}\\.'
            '[A-Za-z0-9=+/]{1,}') % (
                USER_ID_REGEX,
                ('|').join(suggestion_models.TARGET_TYPE_CHOICES),
                base_models.ID_LENGTH)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'item.id.user_id',
                user_models.UserSettingsModel, [
                    item.id[:item.id.find('.')]]),
            base_model_validators.ExternalModelFetcherDetails(
                'item.id.thread_id',
                feedback_models.GeneralFeedbackThreadModel, [
                    item.id[item.id.find('.') + 1:]])]

    @classmethod
    def _validate_reply_to_id_length(cls, item):
        """Validate that reply_to_id length is less than or equal to
        REPLY_TO_ID_LENGTH.

        Args:
            item: datastore_services.Model. GeneralFeedbackEmailReplyToIdModel
                to validate.
        """
        # The reply_to_id of model is created using utils.get_random_int
        # method by using a upper bound as email_models.REPLY_TO_ID_LENGTH.
        # So, the reply_to_id length should be less than or equal to
        # email_models.REPLY_TO_ID_LENGTH.
        if len(item.reply_to_id) > email_models.REPLY_TO_ID_LENGTH:
            cls._add_error(
                'reply_to_id %s' % (
                    base_model_validators.ERROR_CATEGORY_LENGTH_CHECK),
                'Entity id %s: reply_to_id %s should have length less than or '
                'equal to %s but instead has length %s' % (
                    item.id, item.reply_to_id, email_models.REPLY_TO_ID_LENGTH,
                    len(item.reply_to_id)))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_reply_to_id_length]


class ExplorationModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating ExplorationModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return exp_fetchers.get_exploration_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        exp_rights = rights_manager.get_exploration_rights(
            item.id, strict=False)

        if exp_rights is None:
            return base_model_validators.VALIDATION_MODE_NEUTRAL

        if rights_manager.is_exploration_private(item.id):
            return base_model_validators.VALIDATION_MODE_NON_STRICT

        return base_model_validators.VALIDATION_MODE_STRICT

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_commit_log_entry_ids',
                exp_models.ExplorationCommitLogEntryModel,
                ['exploration-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'exp_summary_ids',
                exp_models.ExpSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_rights_ids',
                exp_models.ExplorationRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                exp_models.ExplorationSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                exp_models.ExplorationSnapshotContentModel,
                snapshot_model_ids)]


class ExplorationSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return exp_domain.ExplorationChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel, [item.committer_id])]


class ExplorationSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating ExplorationSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class ExplorationRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating ExplorationRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        cloned_from_exploration_id = []
        if item.cloned_from:
            cloned_from_exploration_id.append(item.cloned_from)
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel, [item.id]),
            # TODO (#10828): Remove validation for cloned_from
            # exp ids after the field is entirely removed from
            # all models.
            base_model_validators.ExternalModelFetcherDetails(
                'cloned_from_exploration_ids',
                exp_models.ExplorationModel,
                cloned_from_exploration_id),
            base_model_validators.ExternalModelFetcherDetails(
                'owner_user_ids',
                user_models.UserSettingsModel, item.owner_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'editor_user_ids',
                user_models.UserSettingsModel, item.editor_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'viewer_user_ids',
                user_models.UserSettingsModel, item.viewer_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                exp_models.ExplorationRightsSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                exp_models.ExplorationRightsSnapshotContentModel,
                snapshot_model_ids)]

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: datastore_services.Model. ExplorationRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_FIRST_PUBLISHED_MSEC_CHECK,
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run' % (
                    item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class ExplorationRightsSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'exploration rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_domain.ExplorationRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_rights_ids',
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel, [item.committer_id])]


class ExplorationRightsSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating ExplorationRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'exploration rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_rights_ids',
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class ExplorationCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating ExplorationCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exploration/rights]-[exploration_id]-[exploration-version].
        regex_string = '^(exploration|rights)-%s-\\d+$' % (
            item.exploration_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_domain.ExplorationRightsChange
        elif item.id.startswith('exploration'):
            return exp_domain.ExplorationChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel, [item.exploration_id])]
        if item.id.startswith('rights'):
            external_id_relationships.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'exploration_rights_ids', exp_models.ExplorationRightsModel,
                    [item.exploration_id]))
        return external_id_relationships


class ExpSummaryModelValidator(base_model_validators.BaseSummaryModelValidator):
    """Class for validating ExpSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return exp_fetchers.get_exploration_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_rights_ids',
                exp_models.ExplorationRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'owner_user_ids',
                user_models.UserSettingsModel, item.owner_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'editor_user_ids',
                user_models.UserSettingsModel, item.editor_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'viewer_user_ids',
                user_models.UserSettingsModel, item.viewer_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'contributor_user_ids',
                user_models.UserSettingsModel, item.contributor_ids)]

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: datastore_services.Model. ExpSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            list(item.contributors_summary.keys()))
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls._add_error(
                'contributors %s' % (
                    base_model_validators.ERROR_CATEGORY_SUMMARY_CHECK),
                'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s' % (
                    item.id, sorted(item.contributor_ids),
                    sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: datastore_services.Model. ExpSummaryModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_FIRST_PUBLISHED_MSEC_CHECK,
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run' % (
                    item.id, item.first_published_msec))

    @classmethod
    def _validate_exploration_model_last_updated(
            cls, item, field_name_to_external_model_references):
        """Validate that item.exploration_model_last_updated matches the
        time when a last commit was made by a human contributor.

        Args:
            item: datastore_services.Model. ExpSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            last_human_update_ms = exp_services.get_last_updated_by_human_ms(
                exploration_model.id)
            last_human_update_time = datetime.datetime.fromtimestamp(
                python_utils.divide(last_human_update_ms, 1000.0))
            if item.exploration_model_last_updated != last_human_update_time:
                cls._add_error(
                    'exploration model %s' % (
                        base_model_validators.ERROR_CATEGORY_LAST_UPDATED_CHECK
                    ),
                    'Entity id %s: The exploration_model_last_updated '
                    'field: %s does not match the last time a commit was '
                    'made by a human contributor: %s' % (
                        item.id, item.exploration_model_last_updated,
                        last_human_update_time))

    @classmethod
    def _get_external_model_properties(cls):
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
            'exploration_ids',
            exploration_model_properties_dict
        ), (
            'exploration rights',
            'exploration_rights_ids',
            exploration_rights_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_first_published_msec,
            cls._validate_contributors_summary]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_exploration_model_last_updated]


class GeneralFeedbackThreadModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating GeneralFeedbackThreadModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [ENTITY_TYPE].[ENTITY_ID].[GENERATED_STRING].
        regex_string = '%s\\.%s\\.[A-Za-z0-9=+/]{1,}$' % (
            item.entity_type, item.entity_id)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.ExternalModelFetcherDetails(
                'message_ids',
                feedback_models.GeneralFeedbackMessageModel,
                ['%s.%s' % (item.id, i) for i in python_utils.RANGE(
                    item.message_count)])
        ]
        if (
                item.original_author_id and
                user_services.is_user_id_valid(item.original_author_id)
        ):
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'author_ids', user_models.UserSettingsModel,
                    [item.original_author_id]))
        if item.has_suggestion:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'suggestion_ids', suggestion_models.GeneralSuggestionModel,
                    [item.id]))
        if item.entity_type in TARGET_TYPE_TO_TARGET_MODEL:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    '%s_ids' % item.entity_type,
                    TARGET_TYPE_TO_TARGET_MODEL[item.entity_type],
                    [item.entity_id]))
        if (
                item.last_nonempty_message_author_id and
                user_services.is_user_id_valid(
                    item.last_nonempty_message_author_id)
        ):
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'last_nonempty_message_author_ids',
                    user_models.UserSettingsModel,
                    [item.last_nonempty_message_author_id]))
        return field_name_to_external_model_references

    @classmethod
    def _validate_entity_type(cls, item):
        """Validate the entity type is valid.

        Args:
            item: datastore_services.Model. GeneralFeedbackThreadModel to
                validate.
        """
        if item.entity_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls._add_error(
                'entity %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Entity type %s is not allowed' % (
                    item.id, item.entity_type))

    @classmethod
    def _validate_has_suggestion(cls, item):
        """Validate that has_suggestion is False only if no suggestion
        with id same as thread id exists.

        Args:
            item: datastore_services.Model. GeneralFeedbackThreadModel to
                validate.
        """
        if not item.has_suggestion:
            suggestion_model = (
                suggestion_models.GeneralSuggestionModel.get_by_id(item.id))
            if suggestion_model is not None and not suggestion_model.deleted:
                cls._add_error(
                    'has suggestion check',
                    'Entity id %s: has suggestion for entity is false '
                    'but a suggestion exists with id same as entity id' % (
                        item.id))

    @classmethod
    def _validate_original_author_id(cls, item):
        """Validate that original author ID is in correct format.

        Args:
            item: GeneralFeedbackThreadModel. The model to validate.
        """
        if (
                item.original_author_id and
                not user_services.is_user_or_pseudonymous_id(
                    item.original_author_id)
        ):
            cls._add_error(
                'final %s' % (
                    base_model_validators.ERROR_CATEGORY_AUTHOR_CHECK),
                'Entity id %s: Original author ID %s is in a wrong format. '
                'It should be either pid_<32 chars> or uid_<32 chars>.'
                % (item.id, item.original_author_id))

    @classmethod
    def _validate_last_nonempty_message_author_id(cls, item):
        """Validate that last nonempty message author ID is in correct format.

        Args:
            item: GeneralFeedbackThreadModel. The model to validate.
        """
        if (
                item.last_nonempty_message_author_id and
                not user_services.is_user_or_pseudonymous_id(
                    item.last_nonempty_message_author_id)
        ):
            cls._add_error(
                'final %s' % (
                    base_model_validators.ERROR_CATEGORY_AUTHOR_CHECK),
                'Entity id %s: Last non-empty message author ID %s is in a '
                'wrong format. It should be either pid_<32 chars> or '
                'uid_<32 chars>.' % (
                    item.id, item.last_nonempty_message_author_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_entity_type,
            cls._validate_has_suggestion,
            cls._validate_original_author_id,
            cls._validate_last_nonempty_message_author_id]


class GeneralFeedbackMessageModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating GeneralFeedbackMessageModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [thread_id].[message_id]
        regex_string = '^%s\\.%s$' % (item.thread_id, item.message_id)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.ExternalModelFetcherDetails(
                'feedback_thread_ids',
                feedback_models.GeneralFeedbackThreadModel,
                [item.thread_id]
            )
        ]
        if (
                item.author_id and
                user_services.is_user_id_valid(item.author_id)
        ):
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'author_ids',
                    user_models.UserSettingsModel,
                    [item.author_id]
                )
            )
        return field_name_to_external_model_references

    @classmethod
    def _validate_author_id(cls, item):
        """Validate that author ID is in correct format.

        Args:
            item: GeneralFeedbackMessageModel. The model to validate.
        """
        if (
                item.author_id and
                not user_services.is_user_or_pseudonymous_id(item.author_id)
        ):
            cls._add_error(
                'final %s' % (
                    base_model_validators.ERROR_CATEGORY_AUTHOR_CHECK),
                'Entity id %s: Author ID %s is in a wrong format. '
                'It should be either pid_<32 chars> or uid_<32 chars>.'
                % (item.id, item.author_id))

    @classmethod
    def _validate_message_id(
            cls, item, field_name_to_external_model_references):
        """Validate that message_id is less than the message count for
        feedback thread corresponding to the entity.

        Args:
            item: datastore_services.Model. GeneralFeedbackMessageModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        feedback_thread_model_references = (
            field_name_to_external_model_references['feedback_thread_ids'])

        for feedback_thread_model_reference in feedback_thread_model_references:
            feedback_thread_model = (
                feedback_thread_model_reference.model_instance)
            if feedback_thread_model is None or feedback_thread_model.deleted:
                model_class = feedback_thread_model_reference.model_class
                model_id = feedback_thread_model_reference.model_id
                cls._add_error(
                    'feedback_thread_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field feedback_thread_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.message_id >= feedback_thread_model.message_count:
                cls._add_error(
                    'message %s' % (
                        base_model_validators.ERROR_CATEGORY_ID_CHECK),
                    'Entity id %s: message id %s not less than total count '
                    'of messages %s in feedback thread model with id %s '
                    'corresponding to the entity' % (
                        item.id, item.message_id,
                        feedback_thread_model.message_count,
                        feedback_thread_model.id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_message_id]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_author_id]


class GeneralFeedbackThreadUserModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating GeneralFeedbackThreadUserModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: [user_id].[thread_id]
        thread_id_string = '%s\\.[A-Za-z0-9-_]{1,%s}\\.[A-Za-z0-9-_=]{1,}' % (
            ('|').join(suggestion_models.TARGET_TYPE_CHOICES),
            base_models.ID_LENGTH)
        regex_string = '^%s\\.%s$' % (USER_ID_REGEX, thread_id_string)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        message_ids = []
        user_ids = []
        if '.' in item.id:
            index = item.id.find('.')
            user_ids = [item.id[:index]]
            message_ids = ['%s.%s' % (
                item.id[index + 1:], message_id) for message_id in (
                    item.message_ids_read_by_user)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'message_ids',
                feedback_models.GeneralFeedbackMessageModel, message_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'user_ids', user_models.UserSettingsModel, user_ids)]


class FeedbackAnalyticsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating FeedbackAnalyticsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel, [item.id])]


class UnsentFeedbackEmailModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating UnsentFeedbackEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^%s$' % USER_ID_REGEX

    @classmethod
    def _get_external_id_relationships(cls, item):
        message_ids = []
        for reference in item.feedback_message_references:
            try:
                message_ids.append('%s.%s' % (
                    reference['thread_id'], reference['message_id']))
            except Exception:
                cls._add_error(
                    'feedback message %s' % (
                        base_model_validators.ERROR_CATEGORY_REFERENCE_CHECK),
                    'Entity id %s: Invalid feedback reference: %s' % (
                        item.id, reference))
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_ids', user_models.UserSettingsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'message_ids', feedback_models.GeneralFeedbackMessageModel,
                message_ids)]

    @classmethod
    def _validate_entity_type_and_entity_id_feedback_reference(cls, item):
        """Validate that entity_type and entity_type are same as corresponding
        values in thread_id of feedback_reference.

        Args:
            item: datastore_services.Model. UnsentFeedbackEmailModel to
                validate.
        """
        for reference in item.feedback_message_references:
            try:
                split_thread_id = reference['thread_id'].split('.')
                if split_thread_id[0] != reference['entity_type'] or (
                        split_thread_id[1] != reference['entity_id']):
                    cls._add_error(
                        'feedback message %s' % (
                            base_model_validators.ERROR_CATEGORY_REFERENCE_CHECK
                        ),
                        'Entity id %s: Invalid feedback reference: %s' % (
                            item.id, reference))
            except Exception:
                cls._add_error(
                    'feedback message %s' % (
                        base_model_validators.ERROR_CATEGORY_REFERENCE_CHECK),
                    'Entity id %s: Invalid feedback reference: %s' % (
                        item.id, reference))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_entity_type_and_entity_id_feedback_reference]


class JobModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating JobModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [job_type]-[current time]-[random int]
        regex_string = '^%s-\\d*-\\d*$' % item.job_type
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _validate_time_fields(cls, item):
        """Validate the time fields in entity.

        Args:
            item: datastore_services.Model. JobModel to validate.
        """
        if item.time_started_msec and (
                item.time_queued_msec > item.time_started_msec):
            cls._add_error(
                'time queued check',
                'Entity id %s: time queued %s is greater '
                'than time started %s' % (
                    item.id, item.time_queued_msec, item.time_started_msec))

        if item.time_finished_msec and (
                item.time_started_msec > item.time_finished_msec):
            cls._add_error(
                'time started check',
                'Entity id %s: time started %s is greater '
                'than time finished %s' % (
                    item.id, item.time_started_msec, item.time_finished_msec))

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.time_finished_msec > current_time_msec:
            cls._add_error(
                'time finished check',
                'Entity id %s: time finished %s is greater '
                'than the current time' % (
                    item.id, item.time_finished_msec))

    @classmethod
    def _validate_error(cls, item):
        """Validate error is not None only if status is not canceled
        or failed.

        Args:
            item: datastore_services.Model. JobModel to validate.
        """
        if item.error and item.status_code not in [
                job_models.STATUS_CODE_FAILED, job_models.STATUS_CODE_CANCELED]:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_ERROR_CHECK,
                'Entity id %s: error: %s for job is not empty but '
                'job status is %s' % (item.id, item.error, item.status_code))

        if not item.error and item.status_code in [
                job_models.STATUS_CODE_FAILED, job_models.STATUS_CODE_CANCELED]:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_ERROR_CHECK,
                'Entity id %s: error for job is empty but '
                'job status is %s' % (item.id, item.status_code))

    @classmethod
    def _validate_output(cls, item):
        """Validate output for entity is present only if status is
        completed.

        Args:
            item: datastore_services.Model. JobModel to validate.
        """
        if item.output and item.status_code != job_models.STATUS_CODE_COMPLETED:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_OUTPUT_CHECK,
                'Entity id %s: output: %s for job is not empty but '
                'job status is %s' % (item.id, item.output, item.status_code))

        if item.output is None and (
                item.status_code == job_models.STATUS_CODE_COMPLETED):
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_OUTPUT_CHECK,
                'Entity id %s: output for job is empty but '
                'job status is %s' % (item.id, item.status_code))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_time_fields,
            cls._validate_error,
            cls._validate_output]


class ContinuousComputationModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating ContinuousComputationModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: Name of continuous computation manager class.
        regex_string = '^(%s)$' % ('|').join(
            ALL_CONTINUOUS_COMPUTATION_MANAGERS_CLASS_NAMES)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _validate_time_fields(cls, item):
        """Validate the time fields in entity.

        Args:
            item: datastore_services.Model. ContinuousComputationModel to
                validate.
        """
        if item.last_started_msec > item.last_finished_msec and (
                item.last_started_msec > item.last_stopped_msec):
            cls._add_error(
                'last started check',
                'Entity id %s: last started %s is greater '
                'than both last finished %s and last stopped %s' % (
                    item.id, item.last_started_msec, item.last_finished_msec,
                    item.last_stopped_msec))

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.last_finished_msec > current_time_msec:
            cls._add_error(
                'last finished check',
                'Entity id %s: last finished %s is greater '
                'than the current time' % (
                    item.id, item.last_finished_msec))

        if item.last_stopped_msec > current_time_msec:
            cls._add_error(
                'last stopped check',
                'Entity id %s: last stopped %s is greater '
                'than the current time' % (
                    item.id, item.last_stopped_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_time_fields]


class QuestionModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating QuestionModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return question_fetchers.get_question_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_commit_log_entry_ids',
                question_models.QuestionCommitLogEntryModel,
                ['question-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'question_summary_ids',
                question_models.QuestionSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                question_models.QuestionSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                question_models.QuestionSnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'linked_skill_ids',
                skill_models.SkillModel, item.linked_skill_ids)]

    @classmethod
    def _validate_inapplicable_skill_misconception_ids(cls, item):
        """Validate that inapplicable skill misconception ids are valid.

        Args:
            item: datastore_services.Model. QuestionModel to validate.
        """
        inapplicable_skill_misconception_ids = (
            item.inapplicable_skill_misconception_ids)
        skill_misconception_id_mapping = {}
        skill_ids = []
        for skill_misconception_id in inapplicable_skill_misconception_ids:
            skill_id, misconception_id = skill_misconception_id.split('-')
            skill_misconception_id_mapping[skill_id] = misconception_id
            skill_ids.append(skill_id)

        skills = skill_fetchers.get_multi_skills(skill_ids, strict=False)
        for skill in skills:
            if skill is not None:
                misconception_ids = [
                    misconception.id
                    for misconception in skill.misconceptions
                ]
                expected_misconception_id = (
                    skill_misconception_id_mapping[skill.id])
                if int(expected_misconception_id) not in misconception_ids:
                    cls._add_error(
                        'misconception id',
                        'Entity id %s: misconception with the id %s does '
                        'not exist in the skill with id %s' % (
                            item.id, expected_misconception_id, skill.id))
        missing_skill_ids = utils.compute_list_difference(
            skill_ids,
            [skill.id for skill in skills if skill is not None])
        for skill_id in missing_skill_ids:
            cls._add_error(
                'skill id',
                'Entity id %s: skill with the following id does not exist:'
                ' %s' % (item.id, skill_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_inapplicable_skill_misconception_ids]


class ExplorationContextModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating ExplorationContextModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.story_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exp_ids', exp_models.ExplorationModel, [item.id])]


class QuestionSkillLinkModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating QuestionSkillLinkModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '%s:%s' % (item.question_id, item.skill_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel,
                [item.question_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, [item.skill_id])]


class QuestionSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating QuestionSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return question_domain.QuestionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]


class QuestionSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating QuestionSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class QuestionCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating QuestionCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [question]-[question_id]-[question_version].
        regex_string = '^(question)-%s-\\d+$' % (
            item.question_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('question'):
            return question_domain.QuestionChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel,
                [item.question_id])]


class QuestionSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating QuestionSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return question_services.get_question_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel, [item.id])]

    @classmethod
    def _validate_question_content(
            cls, item, field_name_to_external_model_references):
        """Validate that question_content model is equal to
        QuestionModel.question_state_data.content.html.

        Args:
            item: datastore_services.Model. QuestionSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        question_model_references = (
            field_name_to_external_model_references['question_ids'])

        for question_model_reference in question_model_references:
            question_model = question_model_reference.model_instance
            if question_model is None or question_model.deleted:
                model_class = question_model_reference.model_class
                model_id = question_model_reference.model_id
                cls._add_error(
                    'question_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field question_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            content_html = question_model.question_state_data['content']['html']
            if item.question_content != content_html:
                cls._add_error(
                    'question content check',
                    'Entity id %s: Question content: %s does not match '
                    'content html in question state data in question '
                    'model: %s' % (
                        item.id, item.question_content,
                        content_html))

    @classmethod
    def _get_external_model_properties(cls):
        question_model_properties_dict = {
            'question_model_created_on': 'created_on',
            'question_model_last_updated': 'last_updated'
        }

        return [(
            'question',
            'question_ids',
            question_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_question_content]


class StoryModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating StoryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_fetchers.get_story_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_commit_log_entry_ids',
                story_models.StoryCommitLogEntryModel,
                ['story-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'story_summary_ids',
                story_models.StorySummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                story_models.StorySnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                story_models.StorySnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in (
                    item.story_contents['nodes'])])]


class StorySnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating StorySnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return story_domain.StoryChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]


class StorySnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating StorySnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class StoryCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating StoryCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [story]-[story_id]-[story_version].
        regex_string = '^(story)-%s-\\d+$' % (
            item.story_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('story'):
            return story_domain.StoryChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.story_id]),
        ]


class StorySummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating StorySummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_fetchers.get_story_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.id])]

    @classmethod
    def _validate_node_titles(
            cls, item, field_name_to_external_model_references):
        """Validate that node_titles of model is equal to list of node titles
        in StoryModel.story_contents.

        Args:
            item: datastore_services.Model. StorySummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        story_model_references = (
            field_name_to_external_model_references['story_ids'])

        for story_model_reference in story_model_references:
            story_model = story_model_reference.model_instance
            if story_model is None or story_model.deleted:
                model_class = story_model_reference.model_class
                model_id = story_model_reference.model_id
                cls._add_error(
                    'story_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field story_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            nodes = story_model.story_contents['nodes']
            node_titles = [node.title for node in nodes]
            if item.node_titles != node_titles:
                cls._add_error(
                    'node titles check',
                    'Entity id %s: Node titles: %s does not match the '
                    'nodes in story_contents dict: %s' % (
                        item.id, item.node_titles, nodes))

    @classmethod
    def _get_external_model_properties(cls):
        story_model_properties_dict = {
            'title': 'title',
            'language_code': 'language_code',
            'description': 'description',
            'story_model_created_on': 'created_on',
            'story_model_last_updated': 'last_updated'
        }

        return [(
            'story',
            'story_ids',
            story_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_node_titles]


class GeneralSuggestionModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating GeneralSuggestionModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: same as thread id:
        # [target_type].[target_id].[GENERATED_STRING].
        regex_string = '^%s\\.%s\\.[A-Za-z0-9=+/]{1,}$' % (
            item.target_type, item.target_id)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            return suggestion_services.get_suggestion_from_model(item)
        else:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.ExternalModelFetcherDetails(
                'feedback_thread_ids',
                feedback_models.GeneralFeedbackThreadModel, [item.id])
        ]
        if user_services.is_user_id_valid(item.author_id):
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'author_ids',
                    user_models.UserSettingsModel,
                    [item.author_id]
                )
            )
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    '%s_ids' % item.target_type,
                    TARGET_TYPE_TO_TARGET_MODEL[item.target_type],
                    [item.target_id]))
        if item.final_reviewer_id and user_services.is_user_id_valid(
                item.final_reviewer_id):
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'reviewer_ids', user_models.UserSettingsModel,
                    [item.final_reviewer_id]))
        return field_name_to_external_model_references

    @classmethod
    def _validate_target_type(cls, item):
        """Validate the target type is valid.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
        """
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))

    @classmethod
    def _validate_target_version_at_submission(
            cls, item, field_name_to_external_model_references):
        """Validate the target version at submission is less than or
        equal to the version of the target model.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))
            return

        target_model_references = (
            field_name_to_external_model_references[
                '%s_ids' % item.target_type])

        for target_model_reference in target_model_references:
            target_model = target_model_reference.model_instance
            if target_model is None or target_model.deleted:
                model_class = target_model_reference.model_class
                model_id = target_model_reference.model_id
                cls._add_error(
                    '%s_ids %s' % (
                        item.target_type,
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field %s_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, item.target_type,
                        model_id, model_class.__name__, model_id))
                continue
            if item.target_version_at_submission > target_model.version:
                cls._add_error(
                    'target version at submission check',
                    'Entity id %s: target version %s in entity is greater '
                    'than the version %s of %s corresponding to '
                    'id %s' % (
                        item.id, item.target_version_at_submission,
                        target_model.version, item.target_type, item.target_id))

    @classmethod
    def _validate_final_reviewer_id(cls, item):
        """Validate that final reviewer id is None if suggestion is
        under review.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
        """
        if item.final_reviewer_id is None and (
                item.status != suggestion_models.STATUS_IN_REVIEW):
            cls._add_error(
                'final %s' % (
                    base_model_validators.ERROR_CATEGORY_REVIEWER_CHECK),
                'Entity id %s: Final reviewer id is empty but '
                'suggestion is %s' % (item.id, item.status))

        if item.final_reviewer_id:
            if item.status == suggestion_models.STATUS_IN_REVIEW:
                cls._add_error(
                    'final %s' % (
                        base_model_validators.ERROR_CATEGORY_REVIEWER_CHECK),
                    'Entity id %s: Final reviewer id %s is not empty but '
                    'suggestion is in review' % (
                        item.id, item.final_reviewer_id))

    @classmethod
    def _validate_score_category(
            cls, item, field_name_to_external_model_references):
        """Validate that the score_category subtype for suggestions matches the
        exploration category.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))
            return
        score_category_type = (
            item.score_category.split(
                suggestion_models.SCORE_CATEGORY_DELIMITER)[0])
        score_category_sub_type = (
            item.score_category.split(
                suggestion_models.SCORE_CATEGORY_DELIMITER)[1])
        if item.target_type == suggestion_models.TARGET_TYPE_EXPLORATION:
            target_model_references = (
                field_name_to_external_model_references[
                    '%s_ids' % item.target_type])

            for target_model_reference in target_model_references:
                target_model = target_model_reference.model_instance
                if target_model is None or target_model.deleted:
                    model_class = target_model_reference.model_class
                    model_id = target_model_reference.model_id
                    cls._add_error(
                        '%s_ids %s' % (
                            item.target_type,
                            base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                        'Entity id %s: based on field %s_ids having'
                        ' value %s, expected model %s with id %s but it '
                        'doesn\'t exist' % (
                            item.id, item.target_type,
                            model_id, model_class.__name__, model_id))
                    continue
                if target_model.category != score_category_sub_type:
                    cls._add_error(
                        'score category sub%s' % (
                            base_model_validators.ERROR_CATEGORY_TYPE_CHECK),
                        'Entity id %s: score category sub %s does not match'
                        ' target exploration category %s' % (
                            item.id, score_category_sub_type,
                            target_model.category))
        if score_category_type == suggestion_models.SCORE_TYPE_QUESTION:
            score_category_regex = (
                '^(%s)$' % ('|').join(VALID_SCORE_CATEGORIES_FOR_TYPE_QUESTION))
            if not re.compile(score_category_regex).match(item.score_category):
                cls._add_error(
                    'score category check',
                    'Entity id %s: Score category %s is invalid' % (
                        item.id, item.score_category))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_target_type,
            cls._validate_final_reviewer_id]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_target_version_at_submission,
            cls._validate_score_category]


class GeneralVoiceoverApplicationModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating GeneralVoiceoverApplicationModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        """Returns a domain object instance created from the model.

        Args:
            item: GeneralVoiceoverApplicationModel. Entity to validate.

        Returns:
            *. A domain object to validate.
        """
        return voiceover_services.get_voiceover_application_by_id(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = []
        if user_services.is_user_id_valid(item.author_id):
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'author_ids',
                    user_models.UserSettingsModel,
                    [item.author_id]
                )
            )
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    '%s_ids' % item.target_type,
                    TARGET_TYPE_TO_TARGET_MODEL[item.target_type],
                    [item.target_id]))
        if (
                item.final_reviewer_id and
                user_services.is_user_id_valid(item.final_reviewer_id)
        ):
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'final_reviewer_ids', user_models.UserSettingsModel,
                    [item.final_reviewer_id]))
        return field_name_to_external_model_references

    @classmethod
    def _validate_final_reviewer_id(cls, item):
        """Validate that final reviewer ID is in correct format.

        Args:
            item: GeneralSuggestionModel. The model to validate.
        """
        if not user_services.is_user_or_pseudonymous_id(item.final_reviewer_id):
            cls._add_error(
                'final %s' % (
                    base_model_validators.ERROR_CATEGORY_REVIEWER_CHECK),
                'Entity id %s: Final reviewer ID %s is in a wrong format. '
                'It should be either pid_<32 chars> or uid_<32 chars>.'
                % (item.id, item.final_reviewer_id))

    @classmethod
    def _validate_author_id(cls, item):
        """Validate that author ID is in correct format.

        Args:
            item: GeneralSuggestionModel. The model to validate.
        """
        if not user_services.is_user_or_pseudonymous_id(item.author_id):
            cls._add_error(
                'final %s' % (
                    base_model_validators.ERROR_CATEGORY_AUTHOR_CHECK),
                'Entity id %s: Author ID %s is in a wrong format. '
                'It should be either pid_<32 chars> or uid_<32 chars>.'
                % (item.id, item.author_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_final_reviewer_id, cls._validate_author_id]


class CommunityContributionStatsModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating CommunityContributionStatsModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Since this is a singleton model, it has only one valid ID:
        # community_contribution_stats.
        return '^%s$' % (
            suggestion_models.COMMUNITY_CONTRIBUTION_STATS_MODEL_ID)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return (
            suggestion_services
            .create_community_contribution_stats_from_model(item)
        )

    @classmethod
    def _validate_translation_reviewer_counts(cls, item):
        """For each language code, validate that the translation reviewer
        count matches the number of translation reviewers in the datastore.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        supported_language_codes = [
            language_code['id'] for language_code in
            constants.SUPPORTED_AUDIO_LANGUAGES
        ]
        all_user_contribution_rights_models = (
            user_models.UserContributionRightsModel.get_all()
        )
        for language_code in supported_language_codes:
            expected_translation_reviewer_count = (
                all_user_contribution_rights_models.filter(
                    (
                        user_models.UserContributionRightsModel
                        .can_review_translation_for_language_codes
                    ) == language_code)
                .count()
            )
            if language_code in item.translation_reviewer_counts_by_lang_code:
                model_translation_reviewer_count = (
                    item.translation_reviewer_counts_by_lang_code[
                        language_code]
                )
                if model_translation_reviewer_count != (
                        expected_translation_reviewer_count):
                    cls._add_error(
                        'translation reviewer %s' % (
                            base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                        'Entity id %s: Translation reviewer count for language'
                        ' code %s: %s does not match the expected translation '
                        'reviewer count for language code %s: %s' % (
                            item.id, language_code,
                            model_translation_reviewer_count, language_code,
                            expected_translation_reviewer_count)
                        )
            elif expected_translation_reviewer_count != 0:
                cls._add_error(
                    'translation reviewer count %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: The translation reviewer count for '
                    'language code %s is %s, expected model '
                    'CommunityContributionStatsModel to have the language code '
                    '%s in its translation reviewer counts but it doesn\'t '
                    'exist.' % (
                        item.id, language_code,
                        expected_translation_reviewer_count, language_code)
                )

    @classmethod
    def _validate_translation_suggestion_counts(cls, item):
        """For each language code, validate that the translation suggestion
        count matches the number of translation suggestions in the datastore
        that are currently in review.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        supported_language_codes = [
            language_code['id'] for language_code in
            constants.SUPPORTED_AUDIO_LANGUAGES
        ]
        all_translation_suggestion_models_in_review = (
            suggestion_models.GeneralSuggestionModel.get_all()
            .filter(suggestion_models.GeneralSuggestionModel.status == (
                suggestion_models.STATUS_IN_REVIEW))
            .filter(
                suggestion_models.GeneralSuggestionModel.suggestion_type == (
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT))
        )
        for language_code in supported_language_codes:
            expected_translation_suggestion_count = (
                all_translation_suggestion_models_in_review.filter(
                    suggestion_models.GeneralSuggestionModel.language_code == (
                        language_code))
                .count()
            )
            if language_code in item.translation_suggestion_counts_by_lang_code:
                model_translation_suggestion_count = (
                    item.translation_suggestion_counts_by_lang_code[
                        language_code]
                )
                if model_translation_suggestion_count != (
                        expected_translation_suggestion_count):
                    cls._add_error(
                        'translation suggestion %s' % (
                            base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                        'Entity id %s: Translation suggestion count for '
                        'language code %s: %s does not match the expected '
                        'translation suggestion count for language code %s: '
                        '%s' % (
                            item.id, language_code,
                            model_translation_suggestion_count, language_code,
                            expected_translation_suggestion_count)
                        )
            elif expected_translation_suggestion_count != 0:
                cls._add_error(
                    'translation suggestion count %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: The translation suggestion count for '
                    'language code %s is %s, expected model '
                    'CommunityContributionStatsModel to have the language code '
                    '%s in its translation suggestion counts but it doesn\'t '
                    'exist.' % (
                        item.id, language_code,
                        expected_translation_suggestion_count, language_code)
                )

    @classmethod
    def _validate_question_reviewer_count(cls, item):
        """Validate that the question reviewer count matches the number of
        question reviewers in the datastore.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        expected_question_reviewer_count = (
            user_models.UserContributionRightsModel.query(
                ( # pylint: disable=singleton-comparison
                    user_models.UserContributionRightsModel
                    .can_review_questions
                ) == True)
            .count()
        )
        if item.question_reviewer_count != expected_question_reviewer_count:
            cls._add_error(
                'question reviewer %s' % (
                    base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                'Entity id %s: Question reviewer count: %s does not '
                'match the expected question reviewer count: %s.' % (
                    item.id, item.question_reviewer_count,
                    expected_question_reviewer_count)
            )

    @classmethod
    def _validate_question_suggestion_count(cls, item):
        """Validate that the question suggestion count matches the number of
        question suggestions in the datastore that are currently in review.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        expected_question_suggestion_count = (
            suggestion_models.GeneralSuggestionModel.get_all()
            .filter(
                suggestion_models.GeneralSuggestionModel.status == (
                    suggestion_models.STATUS_IN_REVIEW))
            .filter(
                suggestion_models.GeneralSuggestionModel.suggestion_type == (
                    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION))
            .count()
        )
        if item.question_suggestion_count != expected_question_suggestion_count:
            cls._add_error(
                'question suggestion %s' % (
                    base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                'Entity id %s: Question suggestion count: %s does not '
                'match the expected question suggestion count: %s.' % (
                    item.id, item.question_suggestion_count,
                    expected_question_suggestion_count)
            )

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_translation_reviewer_counts,
            cls._validate_translation_suggestion_counts,
            cls._validate_question_reviewer_count,
            cls._validate_question_suggestion_count
        ]


class TopicModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating TopicModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_fetchers.get_topic_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        topic_rights = topic_fetchers.get_topic_rights(
            item.id, strict=False)

        if topic_rights is None:
            return base_model_validators.VALIDATION_MODE_NEUTRAL

        if topic_rights.topic_is_published:
            return base_model_validators.VALIDATION_MODE_STRICT

        return base_model_validators.VALIDATION_MODE_NON_STRICT

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        skill_ids = item.uncategorized_skill_ids
        for subtopic in item.subtopics:
            skill_ids = skill_ids + subtopic['skill_ids']
        skill_ids = list(set(skill_ids))
        canonical_story_ids = [
            reference['story_id']
            for reference in item.canonical_story_references]
        additional_story_ids = [
            reference['story_id']
            for reference in item.additional_story_references]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_commit_log_entry_ids',
                topic_models.TopicCommitLogEntryModel,
                ['topic-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_summary_ids', topic_models.TopicSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                topic_models.TopicSnapshotMetadataModel, snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids', topic_models.TopicSnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                canonical_story_ids + additional_story_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, skill_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                ['%s-%s' % (
                    item.id, subtopic['id']) for subtopic in item.subtopics])]

    @classmethod
    def _validate_canonical_name_is_unique(cls, item):
        """Validate that canonical name of the model unique.

        Args:
            item: datastore_services.Model. TopicModel to validate.
        """
        topic_models_list = topic_models.TopicModel.query().filter(
            topic_models.TopicModel.canonical_name == (
                item.canonical_name)).filter(
                    topic_models.TopicModel.deleted == False).fetch() # pylint: disable=singleton-comparison
        topic_model_ids = [
            topic_model.id
            for topic_model in topic_models_list if topic_model.id != item.id]
        if topic_model_ids:
            cls._add_error(
                'unique %s' % base_model_validators.ERROR_CATEGORY_NAME_CHECK,
                'Entity id %s: canonical name %s matches with canonical '
                'name of topic models with ids %s' % (
                    item.id, item.canonical_name, topic_model_ids))

    @classmethod
    def _validate_canonical_name_matches_name_in_lowercase(cls, item):
        """Validate that canonical name of the model is same as name of the
        model in lowercase.

        Args:
            item: datastore_services.Model. TopicModel to validate.
        """
        name = item.name
        if name.lower() != item.canonical_name:
            cls._add_error(
                'canonical %s' % (
                    base_model_validators.ERROR_CATEGORY_NAME_CHECK),
                'Entity id %s: Entity name %s in lowercase does not match '
                'canonical name %s' % (item.id, item.name, item.canonical_name))

    @classmethod
    def _validate_uncategorized_skill_ids_not_in_subtopic_skill_ids(cls, item):
        """Validate that uncategorized_skill_ids of model is not present in
        any subtopic of the model.

        Args:
            item: datastore_services.Model. TopicModel to validate.
        """
        for skill_id in item.uncategorized_skill_ids:
            for subtopic in item.subtopics:
                if skill_id in subtopic['skill_ids']:
                    cls._add_error(
                        'uncategorized skill %s' % (
                            base_model_validators.ERROR_CATEGORY_ID_CHECK),
                        'Entity id %s: uncategorized skill id %s is present '
                        'in subtopic for entity with id %s' % (
                            item.id, skill_id, subtopic['id']))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_canonical_name_is_unique,
            cls._validate_canonical_name_matches_name_in_lowercase,
            cls._validate_uncategorized_skill_ids_not_in_subtopic_skill_ids]


class TopicSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating TopicSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]


class TopicSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating TopicSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class TopicRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating TopicRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'manager_user_ids', user_models.UserSettingsModel,
                item.manager_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                topic_models.TopicRightsSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                topic_models.TopicRightsSnapshotContentModel,
                snapshot_model_ids)]


class TopicRightsSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating TopicRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'topic rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]


class TopicRightsSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating TopicRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'topic rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class TopicCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating TopicCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'topic'

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
        elif item.id.startswith('topic'):
            return topic_domain.TopicChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel, [item.topic_id])]
        if item.id.startswith('rights'):
            external_id_relationships.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'topic_rights_ids', topic_models.TopicRightsModel,
                    [item.topic_id]))
        return external_id_relationships


class TopicSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating TopicSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_services.get_topic_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel, [item.id])]

    @classmethod
    def _validate_canonical_story_count(
            cls, item, field_name_to_external_model_references):
        """Validate that canonical story count of model is equal to
        number of story ids in TopicModel.canonical_story_ids.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            pubished_canonical_story_ids = [
                reference['story_id']
                for reference in topic_model.canonical_story_references
                if reference['story_is_published']]
            if item.canonical_story_count != len(pubished_canonical_story_ids):
                cls._add_error(
                    'canonical story %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Canonical story count: %s does not '
                    'match the number of story ids in canonical_story_ids in '
                    'topic model: %s' % (
                        item.id, item.canonical_story_count,
                        pubished_canonical_story_ids))

    @classmethod
    def _validate_additional_story_count(
            cls, item, field_name_to_external_model_references):
        """Validate that additional story count of model is equal to
        number of story ids in TopicModel.additional_story_ids.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            published_additional_story_ids = [
                reference['story_id']
                for reference in topic_model.additional_story_references
                if reference['story_is_published']]
            if (
                    item.additional_story_count !=
                    len(published_additional_story_ids)):
                cls._add_error(
                    'additional story %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Additional story count: %s does not '
                    'match the number of story ids in additional_story_ids in '
                    'topic model: %s' % (
                        item.id, item.additional_story_count,
                        published_additional_story_ids))

    @classmethod
    def _validate_uncategorized_skill_count(
            cls, item, field_name_to_external_model_references):
        """Validate that uncategorized skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.uncategorized_skill_count != len(
                    topic_model.uncategorized_skill_ids):
                cls._add_error(
                    'uncategorized skill %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Uncategorized skill count: %s does not '
                    'match the number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s' % (
                        item.id, item.uncategorized_skill_count,
                        topic_model.uncategorized_skill_ids))

    @classmethod
    def _validate_total_skill_count(
            cls, item, field_name_to_external_model_references):
        """Validate that total skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids and skill
        ids in subtopics of TopicModel.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            subtopic_skill_ids = []
            for subtopic in topic_model.subtopics:
                subtopic_skill_ids = subtopic_skill_ids + subtopic['skill_ids']
            if item.total_skill_count != len(
                    topic_model.uncategorized_skill_ids + subtopic_skill_ids):
                cls._add_error(
                    'total skill %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Total skill count: %s does not '
                    'match the total number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s and skill_ids '
                    'in subtopics of topic model: %s' % (
                        item.id, item.total_skill_count,
                        topic_model.uncategorized_skill_ids,
                        subtopic_skill_ids))

    @classmethod
    def _validate_subtopic_count(
            cls, item, field_name_to_external_model_references):
        """Validate that subtopic count of model is equal to
        number of subtopics in TopicModel.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.subtopic_count != len(topic_model.subtopics):
                cls._add_error(
                    'subtopic %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Subtopic count: %s does not '
                    'match the total number of subtopics in topic '
                    'model: %s ' % (
                        item.id, item.subtopic_count, topic_model.subtopics))

    @classmethod
    def _get_external_model_properties(cls):
        topic_model_properties_dict = {
            'name': 'name',
            'canonical_name': 'canonical_name',
            'language_code': 'language_code',
            'topic_model_created_on': 'created_on',
            'topic_model_last_updated': 'last_updated'
        }

        return [(
            'topic',
            'topic_ids',
            topic_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_canonical_story_count,
            cls._validate_additional_story_count,
            cls._validate_uncategorized_skill_count,
            cls._validate_total_skill_count,
            cls._validate_subtopic_count]


class SubtopicPageModelValidator(base_model_validators.BaseModelValidator):
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
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_commit_log_entry_ids',
                subtopic_models.SubtopicPageCommitLogEntryModel,
                ['subtopicpage-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                subtopic_models.SubtopicPageSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                subtopic_models.SubtopicPageSnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel, [item.topic_id])]

    @classmethod
    def _get_custom_validation_functions(cls):
        return []


class SubtopicPageSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating SubtopicPageSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return subtopic_page_domain.SubtopicPageChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids', user_models.UserSettingsModel,
                [item.committer_id])]


class SubtopicPageSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating SubtopicPageSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class SubtopicPageCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating SubtopicPageCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [subtopicpage]-[subtopic_id]-[subtopic_version].
        regex_string = '^(subtopicpage)-%s-\\d*$' % (
            item.subtopic_page_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('subtopicpage'):
            return subtopic_page_domain.SubtopicPageChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                [item.subtopic_page_id])]


class UserSettingsModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating UserSettingsModels."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_services.get_user_settings(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        # Note that some users have an associated UserContributionsModel.
        # However, this only applies for users who have made contributions,
        # and not for all users, so we don't check for it here.
        return []

    @classmethod
    def _validate_time_fields_of_user_actions(cls, item):
        """Validates that value for time fields for user actions is
        less than the current time when the job is run.

        Args:
            item: datastore_services.Model. UserSettingsModel to validate.
        """
        time_fields = {
            'last agreed to terms': item.last_agreed_to_terms,
            'last started state editor tutorial': (
                item.last_started_state_editor_tutorial),
            'last started state translation tutorial': (
                item.last_started_state_translation_tutorial),
            'last logged in': item.last_logged_in,
            'last edited an exploration': item.last_edited_an_exploration,
            'last created an exploration': item.last_created_an_exploration
        }
        current_time = datetime.datetime.utcnow()
        for time_field_name, time_field_value in time_fields.items():
            if time_field_value is not None and time_field_value > current_time:
                cls._add_error(
                    '%s check' % time_field_name,
                    'Entity id %s: Value for %s: %s is greater than the '
                    'time when job was run' % (
                        item.id, time_field_name, time_field_value))

        current_msec = utils.get_current_time_in_millisecs()
        if item.first_contribution_msec is not None and (
                item.first_contribution_msec > current_msec):
            cls._add_error(
                'first contribution check',
                'Entity id %s: Value for first contribution msec: %s is '
                'greater than the time when job was run' % (
                    item.id, item.first_contribution_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_time_fields_of_user_actions]


class CompletedActivitiesModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating CompletedActivitiesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids)]

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, item):
        return [(
            'IncompleteActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_incomplete_exp_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_incomplete_collection_ids(item.id)
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class IncompleteActivitiesModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating IncompleteActivitiesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids)]

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, item):
        return [(
            'CompletedActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_completed_exp_ids(item.id)
        ), (
            'CompletedActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_completed_collection_ids(item.id)
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class ExpUserLastPlaythroughModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating ExpUserLastPlaythroughModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.exploration_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.user_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                [item.exploration_id])]

    @classmethod
    def _validate_exp_id_is_marked_as_incomplete(cls, item):
        """Validates that exploration id for model is marked as
        incomplete.

        Args:
            item: datastore_services.Model. ExpUserLastPlaythroughModel to
                validate.
        """
        if item.exploration_id not in (
                learner_progress_services.get_all_incomplete_exp_ids(
                    item.user_id)):
            cls._add_error(
                'incomplete exp %s' % (
                    base_model_validators.ERROR_CATEGORY_ID_CHECK),
                'Entity id %s: Exploration id %s for entity is not marked '
                'as incomplete' % (item.id, item.exploration_id))

    @classmethod
    def _validate_exp_version(
            cls, item, field_name_to_external_model_references):
        """Validates that last played exp version is less than or equal to
        for version of the exploration.

        Args:
            item: datastore_services.Model. ExpUserLastPlaythroughModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.last_played_exp_version > exploration_model.version:
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_VERSION_CHECK,
                    'Entity id %s: last played exp version %s is greater than '
                    'current version %s of exploration with id %s' % (
                        item.id, item.last_played_exp_version,
                        exploration_model.version, exploration_model.id))

    @classmethod
    def _validate_state_name(
            cls, item, field_name_to_external_model_references):
        """Validates that state name is a valid state in the exploration
        corresponding to the entity.

        Args:
            item: datastore_services.Model. ExpUserLastPlaythroughModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.last_played_state_name not in (
                    exploration_model.states.keys()):
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_STATE_NAME_CHECK,
                    'Entity id %s: last played state name %s is not present '
                    'in exploration states %s for exploration id %s' % (
                        item.id, item.last_played_state_name,
                        list(exploration_model.states.keys()),
                        exploration_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_exp_id_is_marked_as_incomplete]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_exp_version,
            cls._validate_state_name
        ]


class LearnerPlaylistModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating LearnerPlaylistModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids)]

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, item):
        return [(
            'CompletedActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_completed_exp_ids(item.id)
        ), (
            'CompletedActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_completed_collection_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_incomplete_exp_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_incomplete_collection_ids(item.id)
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class UserContributionsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserContributionsModels."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_services.get_user_contributions(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'created_exploration_ids', exp_models.ExplorationModel,
                item.created_exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'edited_exploration_ids', exp_models.ExplorationModel,
                item.edited_exploration_ids)]


class UserEmailPreferencesModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserEmailPreferencesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id])]


class UserSubscriptionsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserSubscriptionsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'activity_ids', exp_models.ExplorationModel, item.activity_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'general_feedback_thread_ids',
                feedback_models.GeneralFeedbackThreadModel,
                item.general_feedback_thread_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'creator_ids', user_models.UserSettingsModel, item.creator_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'subscriber_ids', user_models.UserSubscribersModel,
                item.creator_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'id', user_models.UserSettingsModel, [item.id])]

    @classmethod
    def _validate_last_checked(cls, item):
        """Validates that last checked time field is less than the time
        when job was run.

        Args:
            item: datastore_services.Model. UserSubscriptionsModel to validate.
        """
        current_time = datetime.datetime.utcnow()
        if item.last_checked is not None and item.last_checked > current_time:
            cls._add_error(
                'last checked check',
                'Entity id %s: last checked %s is greater than '
                'the time when job was run' % (
                    item.id, item.last_checked))

    @classmethod
    def _validate_user_id_in_subscriber_ids(
            cls, item, field_name_to_external_model_references):
        """Validates that user id is present in list of
        subscriber ids of the creators the user has subscribed to.

        Args:
            item: datastore_services.Model. UserSubscriptionsModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        subscriber_model_references = (
            field_name_to_external_model_references['subscriber_ids'])

        for subscriber_model_reference in subscriber_model_references:
            subscriber_model = subscriber_model_reference.model_instance
            if subscriber_model is None or subscriber_model.deleted:
                model_class = subscriber_model_reference.model_class
                model_id = subscriber_model_reference.model_id
                cls._add_error(
                    'subscriber_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field subscriber_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.id not in subscriber_model.subscriber_ids:
                cls._add_error(
                    'subscriber %s' % (
                        base_model_validators.ERROR_CATEGORY_ID_CHECK),
                    'Entity id %s: User id is not present in subscriber ids of '
                    'creator with id %s to whom the user has subscribed' % (
                        item.id, subscriber_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_last_checked]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_user_id_in_subscriber_ids]


class UserSubscribersModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserSubscribersModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subscriber_ids', user_models.UserSettingsModel,
                item.subscriber_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'subscription_ids', user_models.UserSubscriptionsModel,
                item.subscriber_ids)]

    @classmethod
    def _validate_user_id_not_in_subscriber_ids(cls, item):
        """Validates that user id is not present in list of
        subscribers of user.

        Args:
            item: datastore_services.Model. UserSubscribersModel to validate.
        """
        if item.id in item.subscriber_ids:
            cls._add_error(
                'subscriber %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: User id is present in subscriber ids '
                'for user' % item.id)

    @classmethod
    def _validate_user_id_in_creator_ids(
            cls, item, field_name_to_external_model_references):
        """Validates that user id is present in list of
        creator ids to which the subscribers of user have
        subscribed.

        Args:
            item: datastore_services.Model. UserSubscribersModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        subscription_model_references = (
            field_name_to_external_model_references['subscription_ids'])

        for subscription_model_reference in subscription_model_references:
            subscription_model = subscription_model_reference.model_instance
            if subscription_model is None or subscription_model.deleted:
                model_class = subscription_model_reference.model_class
                model_id = subscription_model_reference.model_id
                cls._add_error(
                    'subscription_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field subscription_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.id not in subscription_model.creator_ids:
                cls._add_error(
                    'subscription creator %s' % (
                        base_model_validators.ERROR_CATEGORY_ID_CHECK),
                    'Entity id %s: User id is not present in creator ids to '
                    'which the subscriber of user with id %s has subscribed' % (
                        item.id, subscription_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_user_id_not_in_subscriber_ids]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_user_id_in_creator_ids]


class UserRecentChangesBatchModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserRecentChangesBatchModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id])]

    @classmethod
    def _validate_job_queued_msec(cls, item):
        """Validates that job queued msec is less than the time
        when job was run.

        Args:
            item: datastore_services.Model. UserRecentChangesBatchModel to
                validate.
        """
        current_msec = utils.get_current_time_in_millisecs()
        if item.job_queued_msec > current_msec:
            cls._add_error(
                'job queued msec check',
                'Entity id %s: job queued msec %s is greater than '
                'the time when job was run' % (
                    item.id, item.job_queued_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_job_queued_msec]


class UserStatsModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating UserStatsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id])]

    @classmethod
    def _validate_schema_version(cls, item):
        """Validates that schema version is less than current version.

        Args:
            item: datastore_services.Model. UserStatsModel to validate.
        """
        if item.schema_version > feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION:
            cls._add_error(
                'schema %s' % (
                    base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                'Entity id %s: schema version %s is greater than '
                'current version %s' % (
                    item.id, item.schema_version,
                    feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION))

    @classmethod
    def _validate_weekly_creator_stats_list(cls, item):
        """Validates that each item weekly_creator_stats_list is keyed
        by a datetime field and value as a dict with keys: num_ratings,
        average_ratings, total_plays. Values for these keys should be
        integers.

        Args:
            item: datastore_services.Model. UserStatsModel to validate.
        """
        current_time_str = datetime.datetime.utcnow().strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        for stat in item.weekly_creator_stats_list:
            for key, value in stat.items():
                allowed_properties = [
                    'average_ratings', 'num_ratings', 'total_plays']
                try:
                    datetime.datetime.strptime(
                        key, feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
                    assert key <= current_time_str
                    assert isinstance(value, dict)
                    assert sorted(value.keys()) == allowed_properties
                    for property_name in allowed_properties:
                        assert isinstance(value[property_name], int)
                except Exception:
                    cls._add_error(
                        'weekly creator stats list',
                        'Entity id %s: Invalid stats dict: %s' % (
                            item.id, stat))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_schema_version,
            cls._validate_weekly_creator_stats_list]


class ExplorationUserDataModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating ExplorationUserDataModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.exploration_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.user_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                [item.exploration_id])]

    @classmethod
    def _validate_draft_change_list(cls, item):
        """Validates that commands in draft change list follow
        the schema of ExplorationChange domain object.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.draft_change_list is None:
            return
        for change_dict in item.draft_change_list:
            try:
                exp_domain.ExplorationChange(change_dict)
            except Exception as e:
                cls._add_error(
                    'draft change list check',
                    'Entity id %s: Invalid change dict %s due to error %s' % (
                        item.id, change_dict, e))

    @classmethod
    def _validate_rating(cls, item):
        """Validates that rating is in the interval [1, 5].

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.rating is not None and (item.rating < 1 or item.rating > 5):
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATINGS_CHECK,
                'Entity id %s: Expected rating to be in range [1, 5], '
                'received %s' % (item.id, item.rating))

    @classmethod
    def _validate_rated_on(cls, item):
        """Validates that rated on is less than the time when job
        was run.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.rating is not None and not item.rated_on:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATED_ON_CHECK,
                'Entity id %s: rating %s exists but rated on is None' % (
                    item.id, item.rating))
        current_time = datetime.datetime.utcnow()
        if item.rated_on is not None and item.rated_on > current_time:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATED_ON_CHECK,
                'Entity id %s: rated on %s is greater than the time '
                'when job was run' % (item.id, item.rated_on))

    @classmethod
    def _validate_draft_change_list_last_updated(cls, item):
        """Validates that draft change list last updated is less than
        the time when job was run.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.draft_change_list and not item.draft_change_list_last_updated:
            cls._add_error(
                'draft change list %s' % (
                    base_model_validators.ERROR_CATEGORY_LAST_UPDATED_CHECK),
                'Entity id %s: draft change list %s exists but '
                'draft change list last updated is None' % (
                    item.id, item.draft_change_list))
        current_time = datetime.datetime.utcnow()
        if item.draft_change_list_last_updated is not None and (
                item.draft_change_list_last_updated > current_time):
            cls._add_error(
                'draft change list %s' % (
                    base_model_validators.ERROR_CATEGORY_LAST_UPDATED_CHECK),
                'Entity id %s: draft change list last updated %s is '
                'greater than the time when job was run' % (
                    item.id, item.draft_change_list_last_updated))

    @classmethod
    def _validate_exp_version(
            cls, item, field_name_to_external_model_references):
        """Validates that draft change exp version is less than version
        of the exploration corresponding to the model.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.draft_change_list_exp_version > exploration_model.version:
                cls._add_error(
                    'exp %s' % (
                        base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: draft change list exp version %s is '
                    'greater than version %s of corresponding exploration '
                    'with id %s' % (
                        item.id, item.draft_change_list_exp_version,
                        exploration_model.version, exploration_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_draft_change_list,
            cls._validate_rating,
            cls._validate_rated_on,
            cls._validate_draft_change_list_last_updated]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_exp_version]


class CollectionProgressModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating CollectionProgressModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.collection_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.user_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                [item.collection_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.completed_explorations),
            base_model_validators.ExternalModelFetcherDetails(
                'completed_activities_ids',
                user_models.CompletedActivitiesModel, [item.user_id])]

    @classmethod
    def _validate_completed_exploration(
            cls, item, field_name_to_external_model_references):
        """Validates that completed exploration ids belong to
        the collection and are present in CompletedActivitiesModel
        for the user.

        Args:
            item: datastore_services.Model. CollectionProgressModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        completed_exp_ids = item.completed_explorations
        completed_activities_model_references = (
            field_name_to_external_model_references['completed_activities_ids'])

        for completed_activities_model_reference in (
                completed_activities_model_references):
            completed_activities_model = (
                completed_activities_model_reference.model_instance)
            if completed_activities_model is None or (
                    completed_activities_model.deleted):
                model_class = completed_activities_model_reference.model_class
                model_id = completed_activities_model_reference.model_id
                cls._add_error(
                    'completed_activities_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field completed_activities_ids '
                    'having value %s, expected model %s with id %s but it '
                    'doesn\'t exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            missing_exp_ids = [
                exp_id
                for exp_id in completed_exp_ids if exp_id not in (
                    completed_activities_model.exploration_ids)]
            if missing_exp_ids:
                cls._add_error(
                    'completed exploration check',
                    'Entity id %s: Following completed exploration ids %s '
                    'are not present in CompletedActivitiesModel for the '
                    'user' % (item.id, missing_exp_ids))

        collection_model_references = (
            field_name_to_external_model_references['collection_ids'])

        for collection_model_reference in collection_model_references:
            collection_model = collection_model_reference.model_instance
            if collection_model is None or collection_model.deleted:
                model_class = collection_model_reference.model_class
                model_id = collection_model_reference.model_id
                cls._add_error(
                    'collection_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field collection_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            collection_node_ids = [
                node['exploration_id'] for node in (
                    collection_model.collection_contents['nodes'])]
            invalid_exp_ids = [
                exp_id
                for exp_id in completed_exp_ids if exp_id not in (
                    collection_node_ids)]
            if invalid_exp_ids:
                cls._add_error(
                    'completed exploration check',
                    'Entity id %s: Following completed exploration ids %s do '
                    'not belong to the collection with id %s corresponding '
                    'to the entity' % (
                        item.id, invalid_exp_ids, collection_model.id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public,
            cls._validate_completed_exploration
        ]


class StoryProgressModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating StoryProgressModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.story_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.user_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.story_id])]

    @classmethod
    def _validate_story_is_public(
            cls, item, field_name_to_external_model_references):
        """Validates that story is public.

        Args:
            item: datastore_services.Model. StoryProgressModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        story_model_references = (
            field_name_to_external_model_references['story_ids'])

        for story_model_reference in story_model_references:
            story_model = story_model_reference.model_instance
            if story_model is None or story_model.deleted:
                model_class = story_model_reference.model_class
                model_id = story_model_reference.model_id
                cls._add_error(
                    'story_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field story_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            topic_id = story_model.corresponding_topic_id
            if topic_id:
                topic = topic_models.TopicModel.get_by_id(topic_id)
                all_story_references = (
                    topic.canonical_story_references +
                    topic.additional_story_references)
                story_is_published = False
                for reference in all_story_references:
                    if reference['story_id'] == story_model.id:
                        story_is_published = reference['story_is_published']
                if not story_is_published:
                    cls._add_error(
                        'public story check',
                        'Entity id %s: Story with id %s corresponding to '
                        'entity is private' % (item.id, story_model.id))

    @classmethod
    def _validate_completed_nodes(
            cls, item, field_name_to_external_model_references):
        """Validates that completed nodes belong to the story.

        Args:
            item: datastore_services.Model. StoryProgressModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        completed_activity_model = user_models.CompletedActivitiesModel.get(
            item.user_id)
        story_model_references = (
            field_name_to_external_model_references['story_ids'])

        for story_model_reference in story_model_references:
            story_model = story_model_reference.model_instance
            if story_model is None or story_model.deleted:
                model_class = story_model_reference.model_class
                model_id = story_model_reference.model_id
                cls._add_error(
                    'story_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field story_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            story_node_ids = [
                node['id'] for node in story_model.story_contents['nodes']]
            invalid_node_ids = [
                node_id
                for node_id in item.completed_node_ids if node_id not in (
                    story_node_ids)]
            if invalid_node_ids:
                cls._add_error(
                    'completed node check',
                    'Entity id %s: Following completed node ids %s do '
                    'not belong to the story with id %s corresponding '
                    'to the entity' % (
                        item.id, invalid_node_ids, story_model.id))

            # Checks that the explorations corresponding to completed nodes
            # exist, are marked as completed in CompletedActivitiesModel
            # and are public.
            private_exp_ids = []
            missing_exp_ids = []
            unmarked_exp_ids = []
            completed_exp_ids = []
            for node in story_model.story_contents['nodes']:
                if node['id'] in item.completed_node_ids:
                    completed_exp_ids.append(node['exploration_id'])
                    if node['exploration_id'] not in (
                            completed_activity_model.exploration_ids):
                        unmarked_exp_ids.append(node['exploration_id'])
                    if rights_manager.is_exploration_private(
                            node['exploration_id']):
                        private_exp_ids.append(node['exploration_id'])

            exp_model_list = exp_models.ExplorationModel.get_multi(
                completed_exp_ids)
            for index, exp_model in enumerate(exp_model_list):
                if exp_model is None or exp_model.deleted:
                    missing_exp_ids.append(completed_exp_ids[index])

            error_msg = ''
            if private_exp_ids:
                error_msg = error_msg + (
                    'Following exploration ids are private %s. ' % (
                        private_exp_ids))
            if missing_exp_ids:
                error_msg = error_msg + (
                    'Following exploration ids are missing %s. ' % (
                        missing_exp_ids))
            if unmarked_exp_ids:
                error_msg = error_msg + (
                    'Following exploration ids are not marked in '
                    'CompletedActivitiesModel %s.' % unmarked_exp_ids)

            if error_msg:
                cls._add_error(
                    'explorations in completed node check',
                    'Entity id %s: %s' % (item.id, error_msg))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_story_is_public,
            cls._validate_completed_nodes]


class UserQueryModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating UserQueryModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, (
                    item.user_ids + [item.submitter_id])),
            base_model_validators.ExternalModelFetcherDetails(
                'sent_email_model_ids', email_models.BulkEmailModel,
                [item.sent_email_model_id])]

    @classmethod
    def _validate_sender_and_recipient_ids(
            cls, item, field_name_to_external_model_references):
        """Validates that sender id of BulkEmailModel matches the
        submitter id of query and all recipient ids are present in
        user ids who satisfy the query. It is not necessary that
        all user ids are present in recipient ids since email
        is only sent to a limited maximum of qualified users.
        It also checks that a UserBulkEmailsModel exists for each
        of the recipients.

        Args:
            item: datastore_services.Model. UserQueryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        email_model_references = (
            field_name_to_external_model_references['sent_email_model_ids'])

        for email_model_reference in email_model_references:
            email_model = email_model_reference.model_instance
            if email_model is None or email_model.deleted:
                model_class = email_model_reference.model_class
                model_id = email_model_reference.model_id
                cls._add_error(
                    'sent_email_model_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field sent_email_model_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            extra_recipient_ids = [
                user_id
                for user_id in email_model.recipient_ids if user_id not in (
                    item.user_ids)]
            if extra_recipient_ids:
                cls._add_error(
                    'recipient check',
                    'Entity id %s: Email model %s for query has following '
                    'extra recipients %s which are not qualified as per '
                    'the query'
                    % (item.id, email_model.id, extra_recipient_ids))
            if email_model.sender_id != item.submitter_id:
                cls._add_error(
                    'sender check',
                    'Entity id %s: Sender id %s in email model with id %s '
                    'does not match submitter id %s of query' % (
                        item.id, email_model.sender_id,
                        email_model.id, item.submitter_id))

            recipient_user_ids = [
                recipient_id
                for recipient_id in email_model.recipient_ids if (
                    recipient_id in item.user_ids)]
            user_bulk_emails_model_list = (
                user_models.UserBulkEmailsModel.get_multi(
                    recipient_user_ids))
            for index, user_bulk_emails_model in enumerate(
                    user_bulk_emails_model_list):
                if user_bulk_emails_model is None or (
                        user_bulk_emails_model.deleted):
                    cls._add_error(
                        'user bulk %s' % (
                            base_model_validators.ERROR_CATEGORY_EMAIL_CHECK),
                        'Entity id %s: UserBulkEmails model is missing for '
                        'recipient with id %s' % (
                            item.id, recipient_user_ids[index]))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_sender_and_recipient_ids]


class UserBulkEmailsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserBulkEmailsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'sent_email_model_ids', email_models.BulkEmailModel,
                item.sent_email_model_ids)]

    @classmethod
    def _validate_user_id_in_recipient_id_for_emails(
            cls, item, field_name_to_external_model_references):
        """Validates that user id is present in recipient ids
        for bulk email model.

        Args:
            item: datastore_services.Model. UserBulkEmailsModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
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
        email_model_references = (
            field_name_to_external_model_references['sent_email_model_ids'])

        for email_model_reference in email_model_references:
            email_model = email_model_reference.model_instance
            if email_model is None or email_model.deleted:
                model_class = email_model_reference.model_class
                model_id = email_model_reference.model_id
                cls._add_error(
                    'sent_email_model_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field sent_email_model_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.id not in email_model.recipient_ids:
                cls._add_error(
                    'recipient check',
                    'Entity id %s: user id is not present in recipient ids '
                    'of BulkEmailModel with id %s' % (item.id, email_model.id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_user_id_in_recipient_id_for_emails]


class UserSkillMasteryModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserSkillMasteryModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.skill_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.user_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, [item.skill_id])]

    @classmethod
    def _validate_skill_mastery(cls, item):
        """Validates that skill mastery is in range [0.0, 1.0].

        Args:
            item: datastore_services.Model. UserSkillMasteryModel to validate.
        """
        if item.degree_of_mastery < 0 or item.degree_of_mastery > 1:
            cls._add_error(
                'skill mastery check',
                'Entity id %s: Expected degree of mastery to be in '
                'range [0.0, 1.0], received %s' % (
                    item.id, item.degree_of_mastery))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_skill_mastery]


class UserContributionProficiencyModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserContributionProficiencyModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.score_category, item.user_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.user_id])]

    @classmethod
    def _validate_score(cls, item):
        """Validates that score is non-negative.

        Args:
            item: datastore_services.Model. UserContributionProficiencyModel to
                validate.
        """
        if item.score < 0:
            cls._add_error(
                'score check',
                'Entity id %s: Expected score to be non-negative, '
                'received %s' % (item.id, item.score))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_score]


class UserContributionRightsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserContributionRightsModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_domain.UserContributionRights(
            item.id, item.can_review_translation_for_language_codes,
            item.can_review_voiceover_for_language_codes,
            item.can_review_questions)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.id])]


class PendingDeletionRequestModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating PendingDeletionRequestModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _validate_user_settings_are_marked_deleted(cls, item):
        """Validates that explorations for model are marked as deleted.

        Args:
            item: PendingDeletionRequestModel. Pending deletion request model
                to validate.
        """
        user_model = user_models.UserSettingsModel.get_by_id(item.id)
        if user_model is None or not user_model.deleted:
            cls._add_error(
                'deleted user settings',
                'Entity id %s: User settings model is not marked as deleted'
                % (item.id))

    @classmethod
    def _validate_activity_mapping_contains_only_allowed_keys(cls, item):
        """Validates that pseudonymizable_entity_mappings keys are only from
        the core.platform.models.NAMES enum.

        Args:
            item: PendingDeletionRequestModel. Pending deletion request model
                to validate.
        """
        incorrect_keys = []
        allowed_keys = [
            name for name in
            models.MODULES_WITH_PSEUDONYMIZABLE_CLASSES.__dict__]
        for key in item.pseudonymizable_entity_mappings.keys():
            if key not in allowed_keys:
                incorrect_keys.append(key)

        if incorrect_keys:
            cls._add_error(
                'correct pseudonymizable_entity_mappings check',
                'Entity id %s: pseudonymizable_entity_mappings '
                'contains keys %s that are not allowed' % (
                    item.id, incorrect_keys))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_user_settings_are_marked_deleted,
            cls._validate_activity_mapping_contains_only_allowed_keys]


class DeletedUserModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating DeletedUserModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _validate_user_is_properly_deleted(cls, item):
        """Validates that user settings do not exist for the deleted user ID.

        Args:
            item: DeletedUserModel. Pending deletion request model to validate.
        """

        if not wipeout_service.verify_user_deleted(
                item.id, include_delete_at_end_models=True):
            cls._add_error(
                'user properly deleted',
                'Entity id %s: The deletion verification fails' % (item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_user_is_properly_deleted]


class PseudonymizedUserModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating PseudonymizedUserModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^pid_[a-z]{32}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_user_settings_with_same_id_not_exist(cls, item):
        """Validates that the UserSettingsModel with the same ID as this model
        does not exist.

        Args:
            item: PseudonymizedUserModel. PseudonymizedUserModel to validate.
        """
        user_model = user_models.UserSettingsModel.get_by_id(item.id)
        if user_model is not None:
            cls.errors['deleted user settings'].append(
                'Entity id %s: User settings model exists' % (item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_user_settings_with_same_id_not_exist]


class UserAuthDetailsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserAuthDetailsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id])]


class PlatformParameterModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating PlatformParameterModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                config_models.PlatformParameterSnapshotMetadataModel,
                snapshot_model_ids
            ),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                config_models.PlatformParameterSnapshotContentModel,
                snapshot_model_ids
            ),
        ]


class PlatformParameterSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating PlatformParameterSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'platform parameter'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return platform_parameter_domain.PlatformParameterChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'platform_parameter_ids',
                config_models.PlatformParameterModel,
                [item.id[:item.id.find('-')]]
            ),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel,
                [item.committer_id]
            )
        ]


class PlatformParameterSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating PlatformParameterSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'platform parameter'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'platform_parameter_ids',
                config_models.PlatformParameterModel,
                [item.id[:item.id.find('-')]]
            )
        ]
