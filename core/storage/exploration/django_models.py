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

from core import django_utils
import core.storage.base_model.models as base_models

from django.db import models
from django.core.exceptions import ValidationError

import feconf

QUERY_LIMIT = 100


class StateModel(base_models.BaseModel):
    """A state, represented as a JSON blob."""

    def __init__(self, *args, **kwargs):
        exploration_id = kwargs.get('exploration_id')
        if exploration_id:
            del kwargs['exploration_id']
        super(StateModel, self).__init__(*args, **kwargs)

    @classmethod
    def get(cls, exploration_id, state_id, strict=True):
        """Gets a state by id."""
        return super(StateModel, cls).get(state_id, strict=strict)

    # JSON representation of a state.
    # TODO(sll): Prepend the exploration id to the id of this entity.
    value = django_utils.JSONField(default={}, isdict=True)
    # When this entity was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this entity was last updated.
    last_updated = models.DateTimeField(auto_now=True)


class ExplorationModel(base_models.BaseModel):
    """Storage model for an Oppia exploration.

    This class should only be imported by the exploration domain file, the
    exploration services file, and the Exploration model test file.
    """
    # The current version number of this exploration. In each PUT operation,
    # this number is incremented and a snapshot of the modified exploration is
    # stored as an ExplorationSnapshotModel.
    version = models.IntegerField(default=0)

    # The category this exploration belongs to.
    category = models.CharField(max_length=100)
    # What this exploration is called.
    title = models.CharField(max_length=100, default='New exploration')
    # The list of state ids this exploration consists of. This list should not
    # be empty.
    state_ids = django_utils.ListField(default=[], blank=True)

    def validate_param_specs(value):
        """Validator for the param_specs property."""
        try:
            assert isinstance(value, dict)
            for key in value:
                assert isinstance(key, basestring)
                assert len(value[key]) == 1
                assert 'obj_type' in value[key]
        except AssertionError:
            raise ValidationError(
                'The \'param_specs\' property must be a dict of param_specs; '
                'received %s' % value
            )

    # The dict of parameter specifications associated with this exploration.
    # Each specification is a dict whose keys are param names and whose values
    # are each dicts with a single key, 'obj_type', whose value is a string.
    param_specs = django_utils.JSONField(
        blank=True, default={}, primitivelist=True,
        validators=[validate_param_specs]
    )

    # The list of parameter changes to be performed once at the start of a
    # reader's encounter with an exploration.
    param_changes = django_utils.JSONField(
        blank=True, default=[], primitivelist=True, validators=[]
    )

    # Whether this exploration is publicly viewable.
    is_public = models.BooleanField(default=False)

    # The id for the image to show as a preview of the exploration.
    image_id = models.CharField(blank=True, max_length=100, null=True)
    # List of ids of users who can edit this exploration. If the exploration is
    # a demo exploration, the list is empty. Otherwise, the first element is
    # the original creator of the exploration.
    editor_ids = django_utils.ListField(default=[], blank=True)
    # The default HTML template to use for displaying the exploration to the
    # reader. This is a filename in data/skins (without the .html suffix).
    default_skin = models.CharField(max_length=100, default='conversation_v1')

    @classmethod
    def get_all_explorations(cls):
        """Returns an filterable iterable containing all explorations."""
        return cls.objects.all()

    @classmethod
    def get_public_explorations(cls):
        """Returns an iterable containing publicly-available explorations."""
        return cls.get_all_explorations().filter(is_public=True)

    @classmethod
    def get_viewable_explorations(cls, user_id):
        """Returns a list of explorations viewable by the given user."""
        public_explorations = cls.get_public_explorations()
        if user_id:
            editable_explorations = cls.objects.filter(editor_ids__icontains=user_id)
            return list(set(public_explorations).union(editable_explorations))
        else:
            return public_explorations

    @classmethod
    def get_exploration_count(cls):
        """Returns the total number of explorations."""
        return cls.get_all_explorations().count()

    def delete(self):
        """Deletes the exploration."""
        super(ExplorationModel, self).delete()

    def put(self, committer_id, properties, snapshot=None, commit_message=''):
        """Updates the exploration using the properties dict, then saves it.

        If snapshot is not null, increments the exploration version and saves
        a serialized copy or a diff in the history log.
        """
        if not isinstance(committer_id, basestring):
            raise Exception('Invalid committer id: %s' % committer_id)

        if properties is None:
            properties = {}

        for key in self.attr_list():
            if key in properties:
                setattr(self, key, properties[key])

        if snapshot and snapshot != feconf.NULL_SNAPSHOT:
            self.version += 1
            if self.version == 1:
                commit_message = 'Exploration first published.'
            ExplorationSnapshotModel.save_snapshot(
                self.id, self.version, committer_id,
                ExplorationSnapshotContentModel.FORMAT_TYPE_FULL,
                snapshot, commit_message)

        super(ExplorationModel, self).put()


class ExplorationSnapshotModel(base_models.BaseModel):
    """Storage model for an Oppia exploration snapshot."""

    @classmethod
    def _get_snapshot_id(cls, exploration_id, version_number):
        return '%s-%s' % (exploration_id, version_number)

    @property
    def exploration_id(self):
        return self.id.split('-')[0]

    @property
    def version_number(self):
        return self.id.split('-')[1]

    # The id of the user who committed this revision.
    committer_id = models.CharField(max_length=100)
    # A brief commit message.
    # TODO(sll): Make this a required property?
    commit_message = models.CharField(max_length=500, blank=True)

    # When this entity was first created.
    created_on = models.DateTimeField(auto_now_add=True)
    # When this entity was last updated.
    # TODO(sll): Actually, it should never be updated; it should be read-only.
    # Add a check for this.
    last_updated = models.DateTimeField(auto_now=True)

    @classmethod
    def get_metadata(cls, exploration_id, version_number):
        """Returns a dict representing an exploration snapshot."""
        snapshot_id = cls._get_snapshot_id(exploration_id, version_number)
        snapshot = cls.get(snapshot_id)
        return {
            'committer_id': snapshot.committer_id,
            'commit_message': snapshot.commit_message,
            'created_on': snapshot.created_on.strftime(
                feconf.HUMAN_READABLE_DATETIME_FORMAT),
            'version_number': version_number,
        }

    @classmethod
    def save_snapshot(cls, exploration_id, version_number, committer_id,
                      snapshot_format, json_blob, commit_message):
        """Saves a new snapshot for the given exploration."""

        if not isinstance(version_number, int) or version_number < 0:
            raise Exception('Invalid version number: %s' % version_number)

        snapshot_id = cls._get_snapshot_id(exploration_id, version_number)

        # Ensure that this id has not been used.
        if cls.get(snapshot_id, strict=False) is not None:
            raise Exception(
                'Snapshot with exploration id %s and version number %s '
                'already exists' % (exploration_id, version_number))

        # Save the snapshot content.    
        ExplorationSnapshotContentModel.save_snapshot_content(
            snapshot_id, snapshot_format, json_blob)

        snapshot_model = cls(id=snapshot_id, committer_id=committer_id,
                             commit_message=commit_message)
        snapshot_model.put()


class ExplorationSnapshotContentModel(base_models.BaseModel):
    """Storage model for the content of an exploration snapshot."""

    @classmethod
    def _get_snapshot_id(cls, exploration_id, version_number):
        return '%s-%s' % (exploration_id, version_number)

    @property
    def exploration_id(self):
        return self.id.split('-')[0]

    @property
    def version_number(self):
        return self.id.split('-')[1]

    FORMAT_TYPE_FULL = 'full'
    FORMAT_TYPE_DIFF = 'diff'

    def _pre_put_hook(self):
        if self.format not in [self.FORMAT_TYPE_FULL, self.FORMAT_TYPE_DIFF]:
            raise Exception('Invalid snapshot format: %s' % self.format)

    # The format of the snapshot (the full serialization, or a diff from the
    # previous snapshot; these correspond to the possible values
    # FORMAT_TYPE_FULL or FORMAT_TYPE_DIFF, respectively).
    format = models.CharField(max_length=10)
    # The snapshot content, as a JSON blob.
    content = django_utils.JSONField(default={}, isdict=True)

    @classmethod
    def get_snapshot_content(cls, exploration_id, version_number):
        """Returns the exploration snapshot content."""
        snapshot_id = cls._get_snapshot_id(exploration_id, version_number)

        snapshot = cls.get(snapshot_id)
        return {
            'format': snapshot.format,
            'content': snapshot.content
        }

    @classmethod
    def save_snapshot_content(cls, snapshot_id, snapshot_format, json_blob):
        """Saves a new snapshot content for the given exploration.

        This method should only be called from ExplorationSnapshotModel.
        """

        if not json_blob:
            raise Exception(
                'Empty content submitted for exploration snapshot.')

        snapshot_content_model = cls(
            id=snapshot_id, format=snapshot_format, content=json_blob)
        snapshot_content_model.put()
