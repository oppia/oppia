# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Domain object for a parameters of a query."""

from core.domain import email_manager
from core.platform import models
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


def save_new_query_model(
        submitter_id, inactive_in_last_n_days=None,
        has_not_logged_in_for_n_days=None, created_at_least_n_exps=None,
        created_fewer_than_n_exps=None, edited_at_least_n_exps=None,
        edited_fewer_than_n_exps=None):
    """Saves a new UserQueryModel instance in user_models.

    Args:
        submitter_id: str. ID of the UserQueryModel instance.
        inactive_in_last_n_days: int. Number of days user is inactive.
        has_not_logged_in_for_n_days: int. Number of days user hasn't logged in.
        created_at_least_n_exps: int. Minimum number of explorations created
            by user.
        created_fewer_than_n_exps: int. Maximum number of explorations created
            by user.
        edited_at_least_n_exps: int|None. Minimum number of
            explorations edited by user.
        edited_fewer_than_n_exps: int|None. Maximum number of
            explorations edited by user.

    Returns:
        query_id: str. ID of the UserQueryModel instance.
    """
    query_id = user_models.UserQueryModel.get_new_id('')
    user_models.UserQueryModel(
        id=query_id, inactive_in_last_n_days=inactive_in_last_n_days,
        has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
        created_at_least_n_exps=created_at_least_n_exps,
        created_fewer_than_n_exps=created_fewer_than_n_exps,
        edited_at_least_n_exps=edited_at_least_n_exps,
        edited_fewer_than_n_exps=edited_fewer_than_n_exps,
        submitter_id=submitter_id,
        query_status=feconf.USER_QUERY_STATUS_PROCESSING,
        user_ids=[]).put()
    return query_id


def send_email_to_qualified_users(
        query_id, email_subject, email_body, email_intent, max_recipients):
    """Send email to maximum 'max_recipients' qualified users.

    Args:
        query_id: str. ID of the UserQueryModel instance.
        email_subject: str. Subject of the email to be sent.
        email_body: str. Body of the email to be sent.
        email_intent: str. Intent of the email.
        max_recipients: int. Maximum number of recipients send emails to.
    """
    query_model = user_models.UserQueryModel.get(query_id)
    query_model.query_status = feconf.USER_QUERY_STATUS_ARCHIVED
    recipient_ids = query_model.user_ids

    if max_recipients:
        recipient_ids = recipient_ids[:max_recipients]

    bulk_email_model_id = email_manager.send_user_query_email(
        query_model.submitter_id, recipient_ids, email_subject,
        email_body, email_intent)
    query_model.sent_email_model_id = bulk_email_model_id
    query_model.put()

    # Store BulkEmailModel in UserBulkEmailsModel of each recipient.
    for recipient_id in recipient_ids:
        recipient_bulk_email_model = (
            user_models.UserBulkEmailsModel.get(recipient_id, strict=False))

        if recipient_bulk_email_model is None:
            recipient_bulk_email_model = user_models.UserBulkEmailsModel(
                id=recipient_id, sent_email_model_ids=[])

        recipient_bulk_email_model.sent_email_model_ids.append(
            bulk_email_model_id)
        recipient_bulk_email_model.put()
