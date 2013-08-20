# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Model for an Oppia exploration."""

__author__ = 'Sean Lip'

import core.storage.base_model.gae_models as base_models

from google.appengine.ext import ndb


QUERY_LIMIT = 100


class ExplorationSnapshotModel(base_models.BaseModel):
    """Storage model for an Oppia exploration snapshot."""

    @classmethod
    def _get_snapshot_id(cls, exploration_id, version_number):
        return '%s-%s' % (exploration_id, version_number)

    # The serialized version of the exploration, from which it can be
    # reconstituted later. Either this or diff_from_previous_version
    # should be set, but not both.
    serialized_exploration = ndb.JsonProperty()
    # The diff from the previous version. It should be possible to apply this
    # diff to the previous exploration to get the serialized form of the
    # current exploration. Either this or serialized_exploration should be
    # set, but not both.
    diff_from_previous_version = ndb.JsonProperty()

    # The id of the user who committed this revision.
    committer_id = ndb.StringProperty(required=True)
    # A brief commit message.
    # TODO(sll): Make this a required property?
    commit_message = ndb.TextProperty()

    # When this entity was first created.
    created = ndb.DateTimeProperty(auto_now_add=True)
    # When this entity was last updated.
    # TODO(sll): Actually, it should never be updated; it should be read-only.
    # Add a check for this.
    last_updated = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def save_snapshot(cls, exploration_id, version_number, committer_id,
                      json_blob, commit_message, is_diff):
        """Saves a new snapshot for the given exploration."""
        # TODO(sll): Run this in a transaction.

        if not isinstance(version_number, int) or version_number < 0:
            raise Exception('Invalid version number: %s' % version_number)

        snapshot_id = cls._get_snapshot_id(exploration_id, version_number)

        # Ensure that this id has not been used.
        if cls.get(snapshot_id, strict=False) is not None:
            raise Exception(
                'Snapshot with exploration id %s and version number %s '
                'already exists' % (exploration_id, version_number))

        if not json_blob:
            raise Exception('No change detected for versioned exploration.')
    
        snapshot_model = cls(id=snapshot_id, committer_id=committer_id,
                             commit_message=commit_message)
        if is_diff:
            snapshot_model.diff_from_previous_version = json_blob
        else:
            snapshot_model.serialized_exploration = json_blob

        snapshot_model.put()
