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

from __future__ import annotations

from core.constants import constants
from core.domain import email_manager
from core.domain import user_query_domain
from core.platform import models

from typing import Dict, List, Literal, Optional, Tuple, overload

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


def _get_user_query_from_model(
    user_query_model: user_models.UserQueryModel
) -> user_query_domain.UserQuery:
    """Transform user query model to domain object.

    Args:
        user_query_model: UserQueryModel. The model to be converted.

    Returns:
        UserQuery. User query domain object.
    """
    attributes = {
        predicate['backend_attr']: getattr(
            user_query_model, predicate['backend_attr'])
        for predicate in constants.EMAIL_DASHBOARD_PREDICATE_DEFINITION
    }
    user_query_params = user_query_domain.UserQueryParams(**attributes)

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


@overload
def get_user_query(
    query_id: str, *, strict: Literal[True] = ...
) -> user_query_domain.UserQuery: ...


@overload
def get_user_query(
    query_id: str, *, strict: Literal[False] = ...
) -> Optional[user_query_domain.UserQuery]: ...


def get_user_query(
    query_id: str, strict: bool = False
) -> Optional[user_query_domain.UserQuery]:
    """Gets the user query with some ID.

    Args:
        query_id: str. The ID of the query.
        strict: bool. Whether to raise an error if the user query doesn't exist.

    Returns:
        UserQuery|None. Returns the user query domain object. Can be None if
        there is no user query model.
    """
    user_query_model = user_models.UserQueryModel.get(query_id, strict=strict)
    return (
        _get_user_query_from_model(user_query_model)
        if user_query_model else None
    )


def get_recent_user_queries(
    num_queries_to_fetch: int, cursor: Optional[str]
) -> Tuple[List[user_query_domain.UserQuery], Optional[str]]:
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


def _save_user_query(user_query: user_query_domain.UserQuery) -> str:
    """Save the user query into the datastore.

    Args:
        user_query: UserQuery. The user query to save.

    Returns:
        str. The ID of the user query that was saved.
    """
    user_query.validate()

    user_query_dict = {
        'submitter_id': user_query.submitter_id,
        'query_status': user_query.status,
        'user_ids': user_query.user_ids,
        'sent_email_model_id': user_query.sent_email_model_id,
        'deleted': user_query.deleted
    }
    user_query_dict.update(dict(user_query.params._asdict()))

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
    submitter_id: str, query_params: Dict[str, int]
) -> str:
    """Saves a new user query.

    Args:
        submitter_id: str. ID of the UserQueryModel instance.
        query_params: dict. Parameters of the UserQueryParams collection.

    Returns:
        str. The ID of the newly saved user query.
    """
    query_id = user_models.UserQueryModel.get_new_id('')
    user_query_params = user_query_domain.UserQueryParams(**query_params)
    user_query = (
        user_query_domain.UserQuery.create_default(
            query_id, user_query_params, submitter_id))
    return _save_user_query(user_query)


def archive_user_query(user_query_id: str) -> None:
    """Delete the user query.

    Args:
        user_query_id: str. The ID of the user query to delete.
    """
    user_query = get_user_query(user_query_id, strict=True)
    user_query.archive()
    _save_user_query(user_query)


def send_email_to_qualified_users(
    query_id: str,
    email_subject: str,
    email_body: str,
    email_intent: str,
    max_recipients: Optional[int]
) -> None:
    """Send email to maximum 'max_recipients' qualified users.

    Args:
        query_id: str. ID of the UserQueryModel instance.
        email_subject: str. Subject of the email to be sent.
        email_body: str. Body of the email to be sent.
        email_intent: str. Intent of the email.
        max_recipients: int|None. Maximum number of recipients send emails to.
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
