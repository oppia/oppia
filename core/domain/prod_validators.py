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

from core.domain import base_model_validators
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import user_services
from core.platform import models
import feconf
import python_utils
import utils

(
    base_models, collection_models, exp_models,
    feedback_models, job_models, question_models,
    skill_models, story_models, subtopic_models,
    suggestion_models, topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.exploration,
    models.NAMES.feedback, models.NAMES.job, models.NAMES.question,
    models.NAMES.skill, models.NAMES.story, models.NAMES.subtopic,
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
