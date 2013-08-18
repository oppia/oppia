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
import core.storage.exploration_snapshot.gae_models as exp_snapshot_models

from google.appengine.ext import ndb


QUERY_LIMIT = 100


class ExplorationModel(base_models.BaseModel):
    """Storage model for the Oppia exploration at HEAD.

    Previous versions of this exploration are stored, in serialized form, using
    ExplorationSnapshotModels.

    This class should only be imported by the exploration domain file, the
    exploration services file, and the Exploration model test file.
    """
    # TODO(sll): Write a test that ensures that the only files that are
    # allowed to import this class are the ones described above.

    # The current version number of this exploration. In each PUT operation,
    # this number is incremented and a snapshot of the modified exploration is
    # stored as an ExplorationSnapshotModel.
    version = ndb.IntegerProperty(default=0)

    # The category this exploration belongs to.
    category = ndb.StringProperty(required=True)
    # What this exploration is called.
    title = ndb.StringProperty(default='New exploration')
    # The list of state ids this exploration consists of. This list should not
    # be empty.
    state_ids = ndb.StringProperty(repeated=True)
    # The list of parameters associated with this exploration.
    parameters = ndb.JsonProperty(repeated=True)
    # Whether this exploration is publicly viewable.
    is_public = ndb.BooleanProperty(default=False)
    # The id for the image to show as a preview of the exploration.
    image_id = ndb.StringProperty()
    # List of ids of users who can edit this exploration. If the exploration is
    # a demo exploration, the list is empty. Otherwise, the first element is
    # the original creator of the exploration.
    editor_ids = ndb.StringProperty(repeated=True)
    # The default HTML template to use for displaying the exploration to the
    # reader. This is a filename in data/skins (without the .html suffix).
    default_skin = ndb.StringProperty(default='conversation')

    @classmethod
    def get_public_explorations(cls):
        """Returns an iterable containing publicly-available explorations."""
        return cls.get_all().filter(cls.is_public == True).fetch(QUERY_LIMIT)

    @classmethod
    def get_viewable_explorations(cls, user_id):
        """Returns a list of explorations viewable by the given user_id."""
        return cls.get_all().filter(
            ndb.OR(cls.is_public == True, cls.editor_ids == user_id)
        ).fetch(QUERY_LIMIT)

    @classmethod
    def get_exploration_count(cls):
        """Returns the total number of explorations."""
        return cls.get_all().count()

    def put(self, committer_id, properties, snapshot=None):
        """Updates the exploration using the properties dict, then saves it.

        If snapshot is not None, increments the exploration version and saves
        a serialized copy or a diff in the history log.
        """
        if not isinstance(committer_id, basestring):
            raise Exception('Invalid committer id: %s' % committer_id)

        if properties is None:
            properties = {}

        # In NDB, self._properties returns the list of ndb properties of a
        # model.
        for key in self._properties:
            if key in properties:
                setattr(self, key, properties[key])

        if snapshot is not None:
            self.version += 1
            exp_snapshot_models.ExplorationSnapshotModel.save_snapshot(
                self.id, self.version, committer_id, snapshot, False)

        super(ExplorationModel, self).put()
