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

from core.domain import base_model_validators
from core.platform import models

(
    base_models, email_models, feedback_models,
    suggestion_models, user_models,) = models.Registry.import_models([
        models.NAMES.base_model, models.NAMES.email, models.NAMES.feedback,
        models.NAMES.suggestion, models.NAMES.user])


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
            base_model_validators.UserSettingsModelFetcherDetails(
                'recipient_id', [item.recipient_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.UserSettingsModelFetcherDetails(
                'sender_id', [item.sender_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=False)]

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
            base_model_validators.UserSettingsModelFetcherDetails(
                'recipient_id', item.recipient_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.UserSettingsModelFetcherDetails(
                'sender_id', [item.sender_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]

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
