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

"""Domain objects for Wipeout."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import python_utils
import utils

USER_DELETION_SUCCESS = 'SUCCESS'
USER_DELETION_ALREADY_DONE = 'ALREADY DONE'

USER_VERIFICATION_NOT_DELETED = 'NOT DELETED'
USER_VERIFICATION_SUCCESS = 'SUCCESS'
USER_VERIFICATION_FAILURE = 'FAILURE'


class PendingDeletionRequest(python_utils.OBJECT):
    """Domain object for a PendingDeletionRequest."""

    def __init__(
            self,
            user_id,
            email,
            role,
            normalized_long_term_username,
            deletion_complete,
            pseudonymizable_entity_mappings):
        """Constructs a PendingDeletionRequest domain object.

        Args:
            user_id: str. The ID of the user who is being deleted.
            email: str. The email of the user who is being deleted.
            normalized_long_term_username: str|None. The normalized username of
                the user who is being deleted. Can be None when the user was on
                the Oppia site only for a short time and thus the username
                hasn't been well-established yet.
            role: str. The role of the user who is being related.
            deletion_complete: bool. Whether the deletion is completed.
            pseudonymizable_entity_mappings: dict(str, str). Mapping between
                the entity IDs and pseudonymized user IDs.
        """
        self.user_id = user_id
        self.email = email
        self.normalized_long_term_username = normalized_long_term_username
        self.role = role
        self.deletion_complete = deletion_complete
        self.pseudonymizable_entity_mappings = pseudonymizable_entity_mappings

    @classmethod
    def create_default(
            cls, user_id, email, role, normalized_long_term_username=None):
        """Creates a PendingDeletionRequest object with default values.

        Args:
            user_id: str. The ID of the user who is being deleted.
            email: str. The email of the user who is being deleted.
            normalized_long_term_username: str|None. The normalized username of
                the user who is being deleted. Can be None when the user was on
                the Oppia site only for a short time and thus the username
                hasn't been well-established yet.
            role: str. The role of the user who is being deleted.

        Returns:
            PendingDeletionRequest. The default pending deletion request
            domain object.
        """
        return cls(
            user_id, email, role, normalized_long_term_username, False, {})

    def validate(self):
        """Checks that the domain object is valid.

        Raises:
            ValidationError. The field pseudonymizable_entity_mappings
                contains wrong key.
        """
        for key in self.pseudonymizable_entity_mappings.keys():
            if key not in [name.value for name in models.NAMES]:
                raise utils.ValidationError(
                    'pseudonymizable_entity_mappings contain wrong key')
