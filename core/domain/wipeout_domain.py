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

(user_models,) = models.Registry.import_models([models.NAMES.user])


class PendingDeletionRequest(python_utils.OBJECT):
    """Domain object for a PendingDeletionRequest."""

    def __init__(
            self, user_id, email, deletion_complete, exploration_ids,
            collection_ids, story_mappings):
        """Constructs a PendingDeletionRequest domain object.

        Args:
            user_id: str. The ID of the user who is being deleted.
            email: str. The email of the user who is being deleted.
            deletion_complete: bool. Whether the deletion is completed.
            exploration_ids: list(str). Private explorations that are marked as
                deleted and need to be hard deleted.
            collection_ids: list(str). Private collections that are marked as
                deleted and need to be hard deleted.
            story_mappings: dict(str, str). Mapping between the story IDs and
                pseudonymized user IDs.
        """
        self.user_id = user_id
        self.email = email
        self.deletion_complete = deletion_complete
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids
        self.story_mappings = story_mappings

    @classmethod
    def create_default(cls, user_id, email, exploration_ids, collection_ids):
        """Creates a PendingDeletionRequest object with default values.

        Args:
            user_id: str. The ID of the user who is being deleted.
            email: str. The email of the user who is being deleted.
            exploration_ids: list(str).
            collection_ids: list(str).

        Returns:
            PendingDeletionRequest. The default pending deletion request
            domain object.
        """
        return cls(user_id, email, False, exploration_ids, collection_ids, None)
