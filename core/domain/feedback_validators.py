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
from core.domain import feedback_services
from core.platform import models
import feconf
import python_utils

(
    base_models, exp_models, feedback_models, suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.suggestion, models.NAMES.user
])


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
                base_model_validators.UserSettingsModelFetcherDetails(
                    'author_ids', [item.original_author_id],
                    may_contain_system_ids=False,
                    may_contain_pseudonymous_ids=True
                ))
        if item.has_suggestion:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'suggestion_ids', suggestion_models.GeneralSuggestionModel,
                    [item.id]))
        if item.entity_type in feedback_services.TARGET_TYPE_TO_TARGET_MODEL:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    '%s_ids' % item.entity_type,
                    feedback_services.TARGET_TYPE_TO_TARGET_MODEL[
                        item.entity_type], [item.entity_id]))
        if item.last_nonempty_message_author_id:
            field_name_to_external_model_references.append(
                base_model_validators.UserSettingsModelFetcherDetails(
                    'last_nonempty_message_author_ids',
                    [item.last_nonempty_message_author_id],
                    may_contain_system_ids=True,
                    may_contain_pseudonymous_ids=True
                ))
        return field_name_to_external_model_references

    @classmethod
    def _validate_entity_type(cls, item):
        """Validate the entity type is valid.

        Args:
            item: datastore_services.Model. GeneralFeedbackThreadModel to
                validate.
        """
        if item.entity_type not in (
                feedback_services.TARGET_TYPE_TO_TARGET_MODEL):
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
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_entity_type,
            cls._validate_has_suggestion
        ]


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
        if item.author_id:
            field_name_to_external_model_references.append(
                base_model_validators.UserSettingsModelFetcherDetails(
                    'author_ids', [item.author_id],
                    may_contain_system_ids=True,
                    may_contain_pseudonymous_ids=True
                )
            )
        return field_name_to_external_model_references

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


class GeneralFeedbackThreadUserModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating GeneralFeedbackThreadUserModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: [user_id].[thread_id]
        thread_id_string = '%s\\.[A-Za-z0-9-_]{1,%s}\\.[A-Za-z0-9-_=]{1,}' % (
            ('|').join(feconf.SUGGESTION_TARGET_TYPE_CHOICES),
            base_models.ID_LENGTH)
        regex_string = '^%s\\.%s$' % (
            feconf.USER_ID_REGEX, thread_id_string)
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
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_ids', user_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]


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
        return '^%s$' % feconf.USER_ID_REGEX

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
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
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
