# coding: utf-8
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

"""Models for Oppia."""

__author__ = 'Sean Lip'

from google.appengine.ext import ndb


class Image(ndb.Model):
    """An image."""
    # The id of the image.
    hash_id = ndb.StringProperty(required=True)
    # The image itself.
    image = ndb.BlobProperty()


class Widget(ndb.Model):
    """A specific HTML/JS/CSS widget."""
    # The id of the widget.
    hash_id = ndb.StringProperty(required=True)
    # The raw widget code.
    raw = ndb.TextProperty()


class GenericWidget(ndb.Model):
    """A generic, reusable widget that is part of the widget repo."""
    # The id of the generic widget.
    hash_id = ndb.StringProperty(required=True)
    # The name of the generic widget.
    name = ndb.StringProperty(required=True)
    # The category to which this widget belongs.
    category = ndb.StringProperty(required=True)
    # The description of the generic widget.
    description = ndb.TextProperty()
    # The raw code for the generic widget.
    raw = ndb.TextProperty()
    # Parameter names, definitions, types and default arguments for this widget.
    params = ndb.JsonProperty(repeated=True)


class Parameter(ndb.Model):
    """A parameter definition for an exploration."""
    # The name of the parameter
    name = ndb.StringProperty(required=True)
    # The possible starting values to choose from
    starting_values = ndb.StringProperty(repeated=True)


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
    # The classifier corresponding to the interactive widget.
    classifier = ndb.StringProperty()
    # Rulesets for the interactive widget. Each ruleset is a key-value pair: the key
    # is the name of the reader's action (submit, click, etc.) and the value is a list
    # of rules, each represented as a dict with six elements:
    # - rule: the raw classification rule
    # - inputs: parameters for that classification rule
    # - code: the actual Python code to check whether the answer satisfies the category
    # - dest: the destination state or exploration
    # - feedback: feedback text
    # - param_changes: parameter changes
    # TODO(sll): Implement the Python code and parameter changes parts (the rest are done).
    # TODO(sll): Add validation.
    interactive_rulesets = ndb.JsonProperty()
    # Parameter overrides for the interactive widget view, stored as key-value
    # pairs.
    interactive_params = ndb.JsonProperty(default={})


# TODO(sll): Add an anyone-can-edit mode.
class Exploration(ndb.Model):
    """An exploration (which is made up of several states)."""
    # A hash_id to show in the browser.
    hash_id = ndb.StringProperty(required=True)
    # The original creator of this exploration.
    owner = ndb.UserProperty()
    # The category this exploration belongs to.
    # TODO(sll): Should this be a 'repeated' property?
    category = ndb.StringProperty(required=True)
    # What this exploration is called.
    title = ndb.StringProperty(default='New exploration')
    # The state which forms the start of this exploration.
    init_state = ndb.KeyProperty(kind=State, required=True)
    # The list of states this exploration consists of.
    states = ndb.KeyProperty(kind=State, repeated=True)
    # The list of parameters associated with this exploration
    parameters = ndb.KeyProperty(kind=Parameter, repeated=True)
    # Whether this exploration is publicly viewable.
    is_public = ndb.BooleanProperty(default=False)
    # The id for the image to show as a preview of the exploration.
    image_id = ndb.StringProperty()


class AugmentedUser(ndb.Model):
    """Stores information about a particular user."""
    # The corresponding user.
    user = ndb.UserProperty(required=True)
    # The list of explorations that this user has editing rights for.
    editable_explorations = ndb.KeyProperty(kind=Exploration, repeated=True)
