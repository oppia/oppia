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


class Parameter(ndb.Model):
  """A generic parameter (like in a Mad Lib)."""
  name = ndb.StringProperty(required=True)
  value = ndb.StringProperty(required=True)


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
  # The widget html.
  html = ndb.TextProperty()
  # The widget JavaScript.
  js = ndb.TextProperty()
  # The raw widget code.
  raw = ndb.TextProperty()


class GenericWidget(ndb.Model):
  """A generic, reusable widget that is part of the widget repo."""
  # The id of the generic widget.
  hash_id = ndb.StringProperty(required=True)
  # The name of the generic widget.
  name = ndb.StringProperty(required=True)
  # The html of the generic widget.
  html = ndb.TextProperty()
  # The JS of the generic widget.
  js = ndb.TextProperty()
  # List of parameters to be supplied to the generic widget.
  params = ndb.StringProperty(repeated=True)
  # List of default arguments for the parameters in params.
  default_args = ndb.StringProperty(repeated=True)
  # The raw code for the generic widget.
  raw = ndb.TextProperty()


class PageContent(ndb.Model):
  """An exploration 'page' shown to the reader."""
  # The HTML to be displayed in each of the generated divs.
  html = ndb.TextProperty(repeated=True)
  # The code for each widget appearing on the page. This is a list of
  # widget hash_ids.
  widgets = ndb.JsonProperty(repeated=True)


class InputView(ndb.Model):
  """An input view shown to the reader."""
  # The name of the input view; this name should be unique.
  # TODO(sll): if AppEngine ever supports unique properties, declare this
  # property as unique.
  name = ndb.StringProperty(required=True)
  # The type of the classifier corresponding to this input view.
  classifier = ndb.StringProperty(choices=['none', 'finite', 'numeric',
                                           'set', 'text'],
                                  default='none')
  # The HTML snippet used to display this input view.
  html = ndb.TextProperty()


class State(ndb.Model):
  """A state. (An exploration is composed of many states.)"""
  # NB: This element's parent should be an Exploration.
  # A hash_id to show in the browser.
  hash_id = ndb.StringProperty(required=True)
  # Human-readable name for the state.
  name = ndb.StringProperty(default='Activity 1')
  # The text given to the reader in this state.
  text = ndb.JsonProperty(repeated=True)
  # The input view corresponding to this state.
  input_view = ndb.KeyProperty(kind=InputView, required=True)
  # The categories (different buckets) associated with this state's classifier.
  classifier_categories = ndb.StringProperty(repeated=True)
  # The action sets corresponding to the categories associated with this state.
  action_sets = ndb.KeyProperty(repeated=True)
  # Additional parameters that will be passed to the classification code
  # together with the student input (such as a canonical set for set input).
  classifier_params = ndb.StringProperty(repeated=True)


# TODO(sll): Add an anyone-can-edit mode.
class Exploration(ndb.Model):
  """An exploration (which is made up of several states)."""
  # A hash_id to show in the browser.
  hash_id = ndb.StringProperty(required=True)
  # Metadata for this exploration (name, category, etc.)
  metadata = ndb.JsonProperty()
  # What this exploration is called.
  title = ndb.StringProperty(default='New exploration')
  # The state which forms the start of this exploration.
  init_state = ndb.KeyProperty(kind=State, required=True)
  # The list of states this exploration consists of.
  states = ndb.KeyProperty(kind=State, repeated=True)
  # Whether this exploration is publicly viewable.
  is_public = ndb.BooleanProperty(default=False)


class AugmentedUser(ndb.Model):
  """Stores information about a particular user."""
  # The corresponding user.
  user = ndb.UserProperty(required=True)
  # The list of explorations that this user has editing rights for.
  editable_explorations = ndb.KeyProperty(kind=Exploration, repeated=True)


class Reader(ndb.Model):
  """A user/exploration combination."""
  # The user described by this Reader. Note that a user may have multiple
  # Reader instances (for different stories).
  reader = ndb.UserProperty(required=True)
  # The exploration described by this Reader.
  exploration = ndb.KeyProperty(kind=Exploration, required=True)
  # The page contents for this reader.
  pages = ndb.KeyProperty(kind=PageContent, repeated=True)
  # The reader's current page number.
  current_page = ndb.IntegerProperty(default=0)
  # The reader's current state.
  state = ndb.KeyProperty(kind=State, required=True)
  # The reader's parameters.
  parameters = ndb.KeyProperty(kind=Parameter, repeated=True)
  # Whether the reader has finished the story.
  finished = ndb.BooleanProperty(default=False)


class ActionSet(ndb.Model):
  """A set of actions to be performed in a single feedback interaction."""
  # The response category that corresponds to this set of actions.
  category_index = ndb.IntegerProperty(required=True)
  # The text to be added as a response to the reader's input.
  text = ndb.TextProperty(default='')
  # The destination exploration id that the reader should be sent to. If both
  # dest_exploration and dest are specified, dest_exploration takes precedence. But
  # dest should equal dest_exploration.init_state.
  # TODO(sll): Implement automatic checking of this constraint.
  dest_exploration = ndb.KeyProperty(kind=Exploration)
  # The destination state id that the reader should be sent to. It is None if
  # this action leads to an END state.
  dest = ndb.KeyProperty(kind=State)

