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

"""Validators for email models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import itertools
import re

from constants import constants
from core.domain import base_model_validators
from core.platform import models
import feconf

(
    base_models, email_models, feedback_models, suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.email, models.NAMES.feedback,
    models.NAMES.suggestion, models.NAMES.user
])


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
            item: ndb.Model. SentEmailModel to validate.
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
            item: ndb.Model. SentEmailModel to validate.
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
                    ' value %s, expect model %s with id %s but it doesn\'t'
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
            item: ndb.Model. BulkEmailModel to validate.
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
            item: ndb.Model. BulkEmailModel to validate.
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
                    ' value %s, expect model %s with id %s but it doesn\'t'
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

class UserEmailPreferencesModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserEmailPreferencesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel, [item.id])]


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
            item: ndb.Model. UserQueryModel to validate.
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
                    ' value %s, expect model %s with id %s but it doesn\'t'
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
            item: ndb.Model. UserBulkEmailsModel to validate.
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
                    ' value %s, expect model %s with id %s but it doesn\'t'
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
            item: ndb.Model. UserSkillMasteryModel to validate.
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


