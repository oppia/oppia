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

"""Domain objects for wipeout."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import user_services
from core.platform import models
import python_utils

current_user_services = models.Registry.import_current_user_services()
(base_models, story_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.story, models.NAMES.user])
transaction_services = models.Registry.import_transaction_services()

MAX_NUMBER_OF_OPS_IN_TRANSACTION = 25

class PendingDeletionRequest(python_utils.OBJECT):
    """Domain object for a PendingDeletionRequest."""

    def __init__(
            self, user_id, email, deletion_complete, exploration_ids,
            collection_ids, story_mappings):
        """Constructs a PendingDeletionRequest domain object.

        Args:
            user_id: str.
            email: str.
            deletion_complete: bool.
            exploration_ids: list(str).
            collection_ids: list(str).
            story_mappings: dict(str, str).
        """
        self.user_id = user_id
        self.email = email
        self.deletion_complete = deletion_complete
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids
        self.story_mappings = story_mappings

    @classmethod
    def create_default(cls, user_id, email, exploration_ids, collection_ids):
        """Creates a Subtopic object with default values.

        Args:
            email: str.
            exploration_ids: list(str).
            collection_ids: list(str).

        Returns:
            PendingDeletionRequest. A pending deletion request given email, title and empty skill ids
            list.
        """
        return cls(user_id, email, False, exploration_ids, collection_ids, None)

    def validate(self):
        """Validates various properties of the Subtopic object.

        Raises:
            ValidationError: One or more attributes of the subtopic are
                invalid.
        """
        self.require_valid_thumbnail_filename(self.thumbnail_filename)
        if self.thumbnail_bg_color is not None and not (
                self.require_valid_thumbnail_bg_color(self.thumbnail_bg_color)):
            raise utils.ValidationError(
                'Subtopic thumbnail background color %s is not supported.' % (
                    self.thumbnail_bg_color))
        if self.thumbnail_bg_color and self.thumbnail_filename is None:
            raise utils.ValidationError(
                'Subtopic thumbnail image is not provided.')
        if self.thumbnail_filename and self.thumbnail_bg_color is None:
            raise utils.ValidationError(
                'Subtopic thumbnail background color is not specified.')
        if not isinstance(self.id, int):
            raise utils.ValidationError(
                'Expected subtopic id to be an int, received %s' % self.id)

        if not isinstance(self.title, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected subtopic title to be a string, received %s' %
                self.title)

        title_limit = android_validation_constants.MAX_CHARS_IN_SUBTOPIC_TITLE
        if len(self.title) > title_limit:
            raise utils.ValidationError(
                'Expected subtopic title to be less than %d characters, '
                'received %s' % (title_limit, self.title))

        if not isinstance(self.skill_ids, list):
            raise utils.ValidationError(
                'Expected skill ids to be a list, received %s' %
                self.skill_ids)

        for skill_id in self.skill_ids:
            if not isinstance(skill_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each skill id to be a string, received %s' %
                    skill_id)

        if len(self.skill_ids) > len(set(self.skill_ids)):
            raise utils.ValidationError(
                'Expected all skill ids to be distinct.')