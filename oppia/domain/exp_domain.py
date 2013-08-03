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

"""Domain object for an Oppia exploration."""

__author__ = 'Sean Lip'

import feconf
from oppia.domain import base_domain
from oppia.platform import models
(state_models,) = models.Registry.import_models([models.NAMES.state])


class Exploration(base_domain.BaseDomainObject):
    """Domain object for an Oppia exploration.

    All methods and properties in this file should be independent of the
    specific storage model used.
    """
    def __init__(self, exploration_model):
        self.id = exploration_model.id
        self.category = exploration_model.category
        self.title = exploration_model.title
        self.state_ids = exploration_model.state_ids
        self.parameters = exploration_model.parameters
        self.is_public = exploration_model.is_public
        self.image_id = exploration_model.image_id
        self.editor_ids = exploration_model.editor_ids
        self.default_skin = exploration_model.default_skin

    def validate(self):
        """Validates the exploration before it is committed to storage."""
        if not self.state_ids:
            raise self.ObjectValidationError('This exploration has no states.')

        # TODO(sll): Check that the template path pointed to by default_skin
        # exists.

        # TODO(sll): We may not need this once appropriate tests are in
        # place and all state deletion operations are guarded against. Then
        # we can remove it if speed becomes an issue.
        for state_id in self.state_ids:
            if not self.get_state_by_id(state_id, strict=False):
                raise self.ObjectValidationError('Invalid state_id %s.')

        if not self.is_demo and not self.editor_ids:
            raise self.ObjectValidationError('This exploration has no editors.')

    # Derived attributes of an exploration.
    @property
    def init_state_id(self):
        """The id of the starting state of this exploration."""
        return self.state_ids[0]

    @property
    def init_state(self):
        """The state which forms the start of this exploration."""
        return self.get_state_by_id(self.init_state_id)

    @property
    def is_demo(self):
        """Whether the exploration is one of the demo explorations."""
        return self.id.isdigit() and (
            0 <= int(self.id) < len(feconf.DEMO_EXPLORATIONS))

    # Methods relating to owners and editors.
    def is_forkable_by(self, user_id):
        """Whether the given user has rights to fork this exploration.

        This is a policy decision, and the criterion here can be changed.
        For example, it may depend on whether the user has completed the
        exploration or earned admin credentials.
        """
        return self.is_demo or self.is_editable_by(user_id)

    def is_editable_by(self, user_id):
        """Whether the given user has rights to edit this exploration."""
        return user_id in self.editor_ids

    def is_owned_by(self, user_id):
        """Whether the given user owns the exploration."""
        return (not self.is_demo) and (user_id == self.editor_ids[0])

    def add_editor(self, editor_id):
        """Adds a new editor. Does not commit changes."""
        self.editor_ids.append(editor_id)

    # Methods relating to states comprising this exploration.
    def has_state_named(self, state_name):
        """Whether the exploration contains a state with the given name."""
        return any([self.get_state_by_id(state_id).name == state_name
                    for state_id in self.state_ids])

    def get_state_by_id(self, state_id, strict=True):
        """Returns a state of the exploration, given its id."""
        if state_id not in self.state_ids:
            raise ValueError(
                'Invalid state id %s for exploration %s' % (state_id, self.id))

        return state_models.State.get(state_id, strict=strict)

    def rename_state(self, state_id, new_state_name):
        """Renames a state of this exploration. Commits changes."""
        if new_state_name == feconf.END_DEST:
            raise ValueError('Invalid state name: %s' % feconf.END_DEST)

        state = self.get_state_by_id(state_id)
        if state.name == new_state_name:
            return

        if self.has_state_named(new_state_name):
            raise ValueError('Duplicate state name: %s' % new_state_name)

        state.name = new_state_name
        state.put()
