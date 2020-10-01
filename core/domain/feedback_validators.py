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

"""Validators for feedback models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.platform import models
import python_utils

(
    base_models, email_models, exp_models,
    feedback_models, question_models, skill_models,
    suggestion_models, topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.email, models.NAMES.exploration,
    models.NAMES.feedback, models.NAMES.question, models.NAMES.skill,
    models.NAMES.suggestion, models.NAMES.topic, models.NAMES.user
])

USER_ID_REGEX = 'uid_[a-z]{32}'
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
            item: ndb.Model. GeneralFeedbackEmailReplyToIdModel to validate.
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
        if item.original_author_id:
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
        return field_name_to_external_model_references

    @classmethod
    def _validate_entity_type(cls, item):
        """Validate the entity type is valid.

        Args:
            item: ndb.Model. GeneralFeedbackThreadModel to validate.
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
            item: ndb.Model. GeneralFeedbackThreadModel to validate.
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
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_entity_type,
            cls._validate_has_suggestion]


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
        author_ids = []
        if item.author_id:
            author_ids = [item.author_id]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'author_ids', user_models.UserSettingsModel, author_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'feedback_thread_ids',
                feedback_models.GeneralFeedbackThreadModel, [item.thread_id])]

    @classmethod
    def _validate_message_id(
            cls, item, field_name_to_external_model_references):
        """Validate that message_id is less than the message count for
        feedback thread corresponding to the entity.

        Args:
            item: ndb.Model. GeneralFeedbackMessageModel to validate.
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
                    ' value %s, expect model %s with id %s but it doesn\'t'
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
            item: ndb.Model. UnsentFeedbackEmailModel to validate.
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
