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

"""Validators for user models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import base_model_validators
from core.domain import user_domain
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models

import utils

(
    base_models, collection_models, email_models,
    exp_models, feedback_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.email,
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])


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