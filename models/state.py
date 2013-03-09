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


class State(ndb.Model):
    """A state. (An exploration is composed of many states.)"""
    # NB: This element's parent should be an Exploration.
    # A hash_id to show in the browser.
    hash_id = ndb.StringProperty(required=True)
    # Human-readable name for the state.
    name = ndb.StringProperty(default='Activity 1')
    # The content displayed to the reader in this state.
    content = ndb.JsonProperty(repeated=True)
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

    @classmethod
    def get(cls, state_id):
        state = cls.query().filter(cls.hash_id == state_id).get()
        # TODO(sll): Raise an exception if the state is not found.
        return state

    def as_dict(self):
        """Gets a Python dict representation of the state."""
        state_dict = self.internals_as_dict()
        state_dict['id'] = self.hash_id
        state_dict['name'] = self.name
        return state_dict

    def internals_as_dict(self):
        """Gets a Python dict of the internals of the state."""
        state_dict = {
            'content': self.content,
            'param_changes': self.param_changes,
            'widget': {
                'id': self.interactive_widget,
                'params': self.interactive_params,
                'rules': self.interactive_rulesets,
            }
        }

        return state_dict
