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

import oppia.storage.base_model.models as base_models
import oppia.storage.parameter.models as param_models

from django.db import models

from oppia.django_utils import JSONField, ListField

QUERY_LIMIT = 100


class ExplorationModel(base_models.IdModel):
    """Storage model for an Oppia exploration.

    This class should only be imported by the exploration domain file, the
    exploration services file, and the Exploration model test file.
    """
    # TODO(sll): Write a test that ensures that the only files that are
    # allowed to import this class are the ones described above.

    # The category this exploration belongs to.
    category = models.CharField(max_length=100)
    # What this exploration is called.
    title = models.CharField(max_length=100, default='New exploration')
    # The list of state ids this exploration consists of. This list should not
    # be empty.
    state_ids = ListField(default=[], blank=True)
    # The list of parameters associated with this exploration.
    parameters = JSONField(blank=True, default=[], schema=[param_models.Parameter])

    # Whether this exploration is publicly viewable.
    is_public = models.BooleanField(default=False)

    # The id for the image to show as a preview of the exploration.
    image_id = models.CharField(blank=True, max_length=100, null=True)
    # List of ids of users who can edit this exploration. If the exploration is
    # a demo exploration, the list is empty. Otherwise, the first element is
    # the original creator of the exploration.
    editor_ids = ListField(default=[], blank=True)
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

    def put(self, properties=None):
        """Updates the exploration using the properties dict, then saves it."""
        if properties is None:
            properties = {}

        # In NDB, self._properties returns the list of ndb properties of a
        # model.
        for key in self.attr_list():
            if key in properties:
                setattr(self, key, properties[key])
        super(ExplorationModel, self).put()
