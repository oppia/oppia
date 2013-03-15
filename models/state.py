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

"""Model for an Oppia state."""

__author__ = 'Sean Lip'

from google.appengine.ext import ndb


class Content(ndb.Model):
    """Non-interactive content in a state."""
    type = ndb.StringProperty(choices=['text', 'image', 'video', 'widget'])
    value = ndb.StringProperty(default='')


class State(ndb.Model):
    """A state. (An exploration is composed of many states.)"""
    # NB: This element's parent should be an Exploration.
    # Human-readable name for the state.
    name = ndb.StringProperty(default='Activity 1')
    # The content displayed to the reader in this state.
    content = ndb.StructuredProperty(Content, repeated=True)
    # The id of the interactive widget class for this state.
    interactive_widget = ndb.StringProperty(default='Continue')
    # Parameter overrides for the interactive widget view, stored as key-value
    # pairs.
    interactive_params = ndb.JsonProperty(default={})
    # Rulesets for the interactive widget. Each ruleset is a key-value pair: the
    # key is the name of the reader's action (submit, click, etc.) and the value
    # is a list of rules, each represented as a dict with six elements:
    # - rule: the raw classification rule
    # - inputs: parameters for that classification rule
    # - code: Python code to check whether the answer satisfies the category
    # - dest: the destination state id
    # - feedback: feedback text
    # - param_changes: parameter changes
    # TODO(yanamal): Implement the parameter changes parts (the rest are done).
    # TODO(sll): Add validation.
    interactive_rulesets = ndb.JsonProperty(default={'submit': []})
    # Parameter changes associated with this state.
    param_changes = ndb.JsonProperty(default={})

    @property
    def id(self):
        return self.key.id()

    @classmethod
    def create(cls, state_id, exploration, name):
        """Creates a new state."""
        new_state = cls(
            id=state_id,
            parent=exploration.key,
            name=name,
            interactive_rulesets={'submit': [{
                'rule': 'Default',
                'inputs': {},
                'code': 'True',
                'dest': state_id,
                'feedback': '',
                'param_changes': [],
            }]}
        )
        new_state.put()
        return new_state

    @classmethod
    def get(cls, state_id, exploration):
        """Gets a state by id. If it does not exist, returns None."""
        return cls.get_by_id(state_id, parent=exploration.key)

    def as_dict(self):
        """Gets a Python dict representation of the state."""
        state_dict = self.internals_as_dict()
        state_dict['id'] = self.id
        state_dict['name'] = self.name
        return state_dict

    def internals_as_dict(self):
        """Gets a Python dict of the internals of the state."""
        state_dict = {
            'content': [{'type': item.type, 'value': item.value} for
                        item in self.content],
            'param_changes': self.param_changes,
            'widget': {
                'id': self.interactive_widget,
                'params': self.interactive_params,
                'rules': self.interactive_rulesets,
            }
        }

        return state_dict
