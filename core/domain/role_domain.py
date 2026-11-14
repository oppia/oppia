# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for role-query audit records."""

from __future__ import annotations

from core import feconf, utils

from typing import Optional


class RoleQueryAudit:
    """The caller-provided payload of a role-query audit record."""

    def __init__(
        self,
        user_id: str,
        intent: str,
        role: Optional[str] = None,
        username: Optional[str] = None,
    ) -> None:
        """Initializes an audit payload without storage metadata.

        Args:
            user_id: str. The acting or affected user ID supplied by the caller.
            intent: str. The role action being recorded.
            role: str|None. The exact role value supplied by the caller.
            username: str|None. The exact username value or query.
        """
        self.user_id = user_id
        self.intent = intent
        self.role = role
        self.username = username

    def validate(self) -> None:
        """Validates the payload format without looking up current users.

        Raises:
            ValidationError. A property has an invalid type or value.
        """
        if not isinstance(self.user_id, str):
            raise utils.ValidationError(
                'user_id must be a string, but got %r' % self.user_id
            )
        # The shared helper matches a prefix; the length check excludes suffixes.
        if len(self.user_id) != feconf.USER_ID_LENGTH or not (
            utils.is_user_id_valid(self.user_id)
        ):
            raise utils.ValidationError(
                'user_id=%r has the wrong format' % self.user_id
            )
        if not isinstance(self.intent, str):
            raise utils.ValidationError(
                'intent must be a string, but got %r' % self.intent
            )
        if self.intent not in (
            feconf.ROLE_ACTION_ADD,
            feconf.ROLE_ACTION_REMOVE,
            feconf.ROLE_ACTION_VIEW_BY_ROLE,
            feconf.ROLE_ACTION_VIEW_BY_USERNAME,
        ):
            raise utils.ValidationError(
                'Invalid role-query intent: %s' % self.intent
            )
        if self.role is not None and not isinstance(self.role, str):
            raise utils.ValidationError(
                'role must be a string or None, but got %r' % self.role
            )
        if self.username is not None and not isinstance(self.username, str):
            raise utils.ValidationError(
                'username must be a string or None, but got %r' % self.username
            )
