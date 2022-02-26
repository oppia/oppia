# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for user."""

from __future__ import annotations

import collections
import datetime

from core import feconf
from core import utils

from typing import List, Optional


UserQueryParams = collections.namedtuple(
    'UserQueryParams',
    [
        'inactive_in_last_n_days',
        'has_not_logged_in_for_n_days',
        'created_at_least_n_exps',
        'created_fewer_than_n_exps',
        'edited_at_least_n_exps',
        'edited_fewer_than_n_exps',
        'created_collection'
    ],
    defaults=(None, None, None, None, None, None, None)
)


class UserQuery:
    """Domain object for the UserQueryModel."""

    def __init__(
        self,
        query_id: str,
        query_params: UserQueryParams,
        submitter_id: str,
        query_status: str,
        user_ids: List[str],
        sent_email_model_id: Optional[str] = None,
        created_on: Optional[datetime.datetime] = None,
        deleted: bool = False
    ) -> None:
        """Create user query domain object.

        Args:
            query_id: str. The id of the query.
            query_params: UserQueryParams. The params of this query.
            submitter_id: str. The ID of the user that submitted the query.
            query_status: str. The status of the query. Can only contain values
                from feconf.ALLOWED_USER_QUERY_STATUSES.
            user_ids: list(str). The IDs of users that the query applies to.
            sent_email_model_id: str|None. The send email model ID that was sent
                to the users.
            created_on: DateTime. The time when the query was created.
            deleted: bool. Whether the query is deleted.
        """
        self.id = query_id
        self.params = query_params
        self.submitter_id = submitter_id
        self.status = query_status
        self.user_ids = user_ids
        self.sent_email_model_id = sent_email_model_id
        self.created_on = created_on
        self.deleted = deleted

    def validate(self) -> None:
        """Validates various properties of the UserQuery.

        Raises:
            ValidationError. Expected submitter ID to be a valid user ID.
            ValidationError. Invalid status.
            ValidationError. Expected user ID in user_ids to be a valid user ID.
        """
        if not utils.is_user_id_valid(self.submitter_id):
            raise utils.ValidationError(
                'Expected submitter ID to be a valid user ID, received %s' %
                self.submitter_id)

        if self.status not in feconf.ALLOWED_USER_QUERY_STATUSES:
            raise utils.ValidationError('Invalid status: %s' % self.status)

        for user_id in self.user_ids:
            if not utils.is_user_id_valid(user_id):
                raise utils.ValidationError(
                    'Expected user ID in user_ids to be a valid user ID, '
                    'received %s' % user_id)

    @classmethod
    def create_default(
        cls,
        query_id: str,
        query_params: UserQueryParams,
        submitter_id: str
    ) -> UserQuery:
        """Create default user query.

        Args:
            query_id: str. The id of the query.
            query_params: UserQueryParams. The params of this query.
            submitter_id: str. The ID of the user that submitted the query.

        Returns:
            UserQuery. The default user query.
        """
        return cls(
            query_id, query_params, submitter_id,
            feconf.USER_QUERY_STATUS_PROCESSING, []
        )

    def archive(self, sent_email_model_id: Optional[str] = None) -> None:
        """Archive the query.

        Args:
            sent_email_model_id: str|None. The SentEmailModel ID representing
                the email that was sent to the users. Can be None if the query
                was archived without sending email.
        """
        if sent_email_model_id:
            self.sent_email_model_id = sent_email_model_id

        self.status = feconf.USER_QUERY_STATUS_ARCHIVED
        self.deleted = True
