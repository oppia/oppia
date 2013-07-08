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

from apps.base_model.domain import BaseDomainObject
from apps.exploration.models import ExplorationModel
from apps.state.models import State
import feconf


# TODO(sll): Add an anyone-can-edit mode.
class Exploration(BaseDomainObject):
    """Domain object for an Oppia exploration.

    All methods and properties in this file should be independent of the
    specific storage model used.
    """

    id = None
    category = None
    title = None
    state_ids = None
    parameters = None
    is_public = None
    image_id = None
    editor_ids = None

    _exploration_model = None

    def __init__(self, exploration_model):
        self._exploration_model = exploration_model

        self.id = exploration_model.id
        self.category = exploration_model.category
        self.title = exploration_model.title
        self.state_ids = exploration_model.state_ids
        self.parameters = exploration_model.parameters
        self.is_public = exploration_model.is_public
        self.image_id = exploration_model.image_id
        self.editor_ids = exploration_model.editor_ids

    def _pre_put_hook(self):
        """Validates the exploration before it is put into the datastore."""
        if not self.state_ids:
            raise self.ObjectValidationError('This exploration has no states.')

        # TODO(sll): We may not need this once appropriate tests are in
        # place and all state deletion operations are guarded against. Then
        # we can remove it if speed becomes an issue.
        for state_id in self.state_ids:
            if not State.get(state_id, strict=False):
                raise self.ObjectValidationError('Invalid state_id %s.')

        if not self.is_demo and not self.editor_ids:
            raise self.ObjectValidationError('This exploration has no editors.')

    @classmethod
    def get(cls, exploration_id, strict=True):
        """Returns a domain object representing an exploration."""
        exploration_model = ExplorationModel.get(exploration_id, strict=strict)
        if exploration_model is None:
            return None
        return cls(exploration_model)

    def put(self):
        """Saves the exploration."""
        self._pre_put_hook()

        # TODO(sll): Make this discover the properties automatically, then move
        # it to the base domain class.
        properties = {
            'category': self.category,
            'title': self.title,
            'state_ids': self.state_ids,
            'parameters': self.parameters,
            'is_public': self.is_public,
            'image_id': self.image_id,
            'editor_ids': self.editor_ids,
        }
        self._exploration_model.put(properties)

    def delete(self):
        """Deletes the exploration."""
        for state_id in self.state_ids:
            State.get(state_id).delete()
        self._exploration_model.delete()

    @property
    def init_state(self):
        """The state which forms the start of this exploration."""
        return State.get(self.state_ids[0])

    @property
    def is_demo(self):
        """Whether the exploration is one of the demo explorations."""
        return self.id.isdigit() and (
            0 <= int(self.id) < len(feconf.DEMO_EXPLORATIONS))

    def is_editable_by(self, user_id):
        """Whether the given user has rights to edit this exploration."""
        return user_id in self.editor_ids

    def is_owned_by(self, user_id):
        """Whether the given user owns the exploration."""
        return (not self.is_demo) and (user_id == self.editor_ids[0])

    def _has_state_named(self, state_name):
        """Whether the exploration contains a state with the given name."""
        return any([State.get(state_id).name == state_name
                    for state_id in self.state_ids])

    def add_state(self, state_name, state_id=None):
        """Adds a new state, and returns it. Commits changes."""
        if self._has_state_named(state_name):
            raise Exception('Duplicate state name %s' % state_name)

        state_id = state_id or State.get_new_id(state_name)
        new_state = State(id=state_id, name=state_name)
        new_state.put()

        self.state_ids.append(new_state.id)
        self.put()

        return new_state

    def rename_state(self, state, new_state_name):
        """Renames a state of this exploration."""
        if state.name == new_state_name:
            return

        if self._has_state_named(new_state_name):
            raise Exception('Duplicate state name: %s' % new_state_name)

        state.name = new_state_name
        state.put()

    def delete_state(self, state_id):
        """Deletes the given state. Commits changes."""
        if state_id not in self.state_ids:
            raise Exception('State %s not in exploration %s' %
                            (state_id, self.id))

        # Do not allow deletion of initial states.
        if self.state_ids[0] == state_id:
            raise Exception('Cannot delete initial state of an exploration.')

        # Find all destinations in the exploration which equal the deleted
        # state, and change them to loop back to their containing state.
        for other_state_id in self.state_ids:
            other_state = State.get(other_state_id)
            changed = False
            for handler in other_state.widget.handlers:
                for rule in handler.rules:
                    if rule.dest == state_id:
                        rule.dest = other_state_id
                        changed = True
            if changed:
                other_state.put()

        # Delete the state with id state_id.
        State.get(state_id).delete()
        self.state_ids.remove(state_id)
        self.put()

    def add_editor(self, editor_id):
        """Adds a new editor. Does not commit changes."""
        self.editor_ids.append(editor_id)
