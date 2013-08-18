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

QUERY_LIMIT = 100


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

    def validate_parameters(value):
        """Validator for the parameters property."""
        try:
            assert isinstance(value, list)
            for val in value:
                assert isinstance(val, dict)
                assert all(
                    [prop in val for prop in ['name', 'obj_type', 'values']])
        except AssertionError:
            raise ValidationError(
                "The 'parameters' property must be a list of parameter dicts"
            )

    # The list of parameters associated with this exploration.
    parameters = django_utils.JSONField(
        blank=True, default=[], primitivelist=True, validators=[validate_parameters]
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
    default_skin = models.CharField(max_length=100, default='conversation')

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

    def put(self, committer_id, properties, snapshot=None):
        """Updates the exploration using the properties dict, then saves it.

        If snapshot is not None, increments the exploration version and saves
        a serialized copy or a diff in the history log.
        """
        if not isinstance(committer_id, basestring):
            raise Exception('Invalid committer id: %s' % committer_id)

        if properties is None:
            properties = {}

        for key in self.attr_list():
            if key in properties:
                setattr(self, key, properties[key])

        if snapshot is not None:
            self.version += 1
            # TODO(sll): Implement versioning for Django.

        super(ExplorationModel, self).put()
