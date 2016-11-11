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
        query_id, email_subject, email_body, email_intent, email_option,
        num_of_users_to_send):
    """Send email to maximum 'num_of_users_to_send' qualified users."""
    query_model = user_models.UserQueryModel.get(query_id)
    query_model.query_status = feconf.USER_QUERY_STATUS_ARCHIVED

    if email_option == feconf.USER_QUERY_EMAIL_OPTION_ALL:
        bulk_email_model_id = email_manager.send_user_query_email(
            query_model.submitter_id, query_model.user_ids, email_subject,
            email_body, email_intent)
        query_model.sent_email_model_id = bulk_email_model_id
        query_model.put()
    elif email_option == feconf.USER_QUERY_EMAIL_OPTION_CUSTOM:
        recipient_ids = query_model.user_ids[:num_of_users_to_send]
        bulk_email_model_id = email_manager.send_user_query_email(
            query_model.submitter_id, recipient_ids, email_subject,
            email_body, email_intent)
        query_model.sent_email_model_id = bulk_email_model_id
        query_model.put()
    elif email_option == feconf.USER_QUERY_EMAIL_OPTION_CANCEL:
        query_model.query_status = feconf.USER_QUERY_STATUS_ARCHIVED
        query_model.put()
    else:
        raise Exception('Invalid email option.')
