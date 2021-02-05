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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import email_manager
from core.domain import user_query_domain
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])


def _get_user_query_from_model(user_query_model):
    """Transform user query model to domain object.

    Args:
        user_query_model: UserQueryModel. The model to be converted.

    Returns:
        UserQuery. User query domain object.
    """
    user_query_params = user_query_domain.UserQueryParams(
        user_query_model.inactive_in_last_n_days,
        user_query_model.has_not_logged_in_for_n_days,
        user_query_model.created_at_least_n_exps,
        user_query_model.created_fewer_than_n_exps,
        user_query_model.edited_at_least_n_exps,
        user_query_model.edited_fewer_than_n_exps
    )
    return user_query_domain.UserQuery(
        user_query_model.id,
        user_query_params,
        user_query_model.submitter_id,
        user_query_model.query_status,
        user_query_model.user_ids,
        user_query_model.sent_email_model_id,
        user_query_model.created_on,
        user_query_model.deleted,
    )


def get_user_query(query_id, strict=False):
    """Gets the user query with some ID.

    Args:
        query_id: str. The ID of the query.
        strict: bool. Whether to raise an error if the user query doesn't exist.

    Returns:
        UserQuery. The user query.
    """
    user_query_model = user_models.UserQueryModel.get(query_id, strict=strict)
    return (
        _get_user_query_from_model(user_query_model)
        if user_query_model else None
    )


def get_recent_user_queries(num_queries_to_fetch, cursor):
    """Get recent user queries.

    Args:
        num_queries_to_fetch: int. Number of user queries to fetch.
        cursor: str|None. The list of returned entities starts from this
            datastore cursor. Can be None if there are no more entities.

    Returns:
        tuple(list(QueryModel), str). Returns tuple with the list of user
        queries and the next cursor that can be used when doing subsequent
        queries.
    """
    user_query_models, next_cursor, _ = user_models.UserQueryModel.fetch_page(
        num_queries_to_fetch, cursor)

    return (
        [_get_user_query_from_model(model) for model in user_query_models],
        next_cursor
    )


def _save_user_query(user_query):
    """Save the user query into the datastore.

    Args:
        user_query: UserQuery. The user query to save.

    Returns:
        str. The ID of the user query that was saved.
    """
    user_query.validate()

    user_query_dict = {
        'inactive_in_last_n_days': user_query.params.inactive_in_last_n_days,
        'has_not_logged_in_for_n_days': (
            user_query.params.has_not_logged_in_for_n_days),
        'created_at_least_n_exps': user_query.params.created_at_least_n_exps,
        'created_fewer_than_n_exps': (
            user_query.params.created_fewer_than_n_exps),
        'edited_at_least_n_exps': user_query.params.edited_at_least_n_exps,
        'edited_fewer_than_n_exps': user_query.params.edited_fewer_than_n_exps,
        'submitter_id': user_query.submitter_id,
        'query_status': user_query.status,
        'user_ids': user_query.user_ids,
        'sent_email_model_id': user_query.sent_email_model_id,
        'deleted': user_query.deleted
    }

    user_query_model = (
        user_models.UserQueryModel.get(user_query.id, strict=False))
    if user_query_model is not None:
        user_query_model.populate(**user_query_dict)
    else:
        user_query_dict['id'] = user_query.id
        user_query_model = user_models.UserQueryModel(**user_query_dict)

    user_query_model.update_timestamps()
    user_query_model.put()

    return user_query_model.id


def save_new_user_query(
        submitter_id, inactive_in_last_n_days=None,
        has_not_logged_in_for_n_days=None, created_at_least_n_exps=None,
        created_fewer_than_n_exps=None, edited_at_least_n_exps=None,
        edited_fewer_than_n_exps=None):
    """Saves a new user query.

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
        str. The ID of the newly saved user query.
    """
    query_id = user_models.UserQueryModel.get_new_id('')
    user_query_params = user_query_domain.UserQueryParams(
        inactive_in_last_n_days=inactive_in_last_n_days,
        has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
        created_at_least_n_exps=created_at_least_n_exps,
        created_fewer_than_n_exps=created_fewer_than_n_exps,
        edited_at_least_n_exps=edited_at_least_n_exps,
        edited_fewer_than_n_exps=edited_fewer_than_n_exps
    )
    user_query = (
        user_query_domain.UserQuery.create_default(
            query_id, user_query_params, submitter_id))
    return _save_user_query(user_query)


def archive_user_query(user_query_id):
    """Delete the user query.

    Args:
        user_query_id: str. The ID of the user query to delete.
    """
    user_query = get_user_query(user_query_id, strict=True)
    user_query.archive()
    _save_user_query(user_query)


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
    user_query = get_user_query(query_id, strict=True)
    recipient_ids = user_query.user_ids

    if max_recipients:
        recipient_ids = recipient_ids[:max_recipients]

    bulk_email_model_id = email_manager.send_user_query_email(
        user_query.submitter_id, recipient_ids, email_subject,
        email_body, email_intent
    )

    user_query.archive(sent_email_model_id=bulk_email_model_id)
    _save_user_query(user_query)

    # Store BulkEmailModel in UserBulkEmailsModel of each recipient.
    for recipient_id in recipient_ids:
        recipient_bulk_email_model = (
            user_models.UserBulkEmailsModel.get(recipient_id, strict=False))

        if recipient_bulk_email_model is None:
            recipient_bulk_email_model = user_models.UserBulkEmailsModel(
                id=recipient_id, sent_email_model_ids=[])

        recipient_bulk_email_model.sent_email_model_ids.append(
            bulk_email_model_id)
        recipient_bulk_email_model.update_timestamps()
        recipient_bulk_email_model.put()
