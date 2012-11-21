# coding: utf-8
#
# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Data models used to store information about users and questions."""

__author__ = 'Sean Lip'

from google.appengine.ext import ndb


class Parameter(ndb.Model):
  """A generic parameter for a user's story path (like in a Mad Lib)."""
  name = ndb.StringProperty(required=True)
  value = ndb.StringProperty(required=True)


class Image(ndb.Model):
  """Represents an image."""
  # The id of the image.
  hash_id = ndb.StringProperty(required=True)
  # The image itself.
  image = ndb.BlobProperty()


class Widget(ndb.Model):
  """Represents a specific HTML/JS/CSS widget on a question page."""
  # The id of the widget.
  hash_id = ndb.StringProperty(required=True)
  # The widget html.
  html = ndb.TextProperty()
  # The widget JavaScript.
  js = ndb.TextProperty()
  # The raw widget code.
  raw = ndb.TextProperty()


class GenericWidget(ndb.Model):
  """Represents a generic, reusable widget that is part of the widget repo."""
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
  """Description of a story page shown to the student reader."""
  # The HTML to be displayed in each of the generated divs.
  html = ndb.TextProperty(repeated=True)
  # The code for each widget appearing on the page. This is a list of
  # widget hash_ids.
  widgets = ndb.JsonProperty(repeated=True)


class InputView(ndb.Model):
  """An input view to be shown to the reader."""
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
  """Representation of a state within a question."""
  # NB: This element's parent should be a Question.
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


class QuestionGroup(ndb.Model):
  """Representation of a question group (consisting of several questions)."""
  # NB: This element's parent should be a Question.
  # A hash_id to show in the browser.
  hash_id = ndb.StringProperty(required=True)
  # Human-readable name for the question group.
  name = ndb.StringProperty(default='[New Topic]')
  # The date before which the question group cannot be released.
  prereq_date = ndb.DateProperty(default=None)
  # The metric prerequisite parameters. This is a dict whose elements have the
  # form {metric_name: metric_value}, representing 'metric_name ≥ metric_value'.
  # NB: note that these are not 'sticky': if a reader's metric drops, he/she
  # loses access to this group.
  prereq_metrics = ndb.JsonProperty(default={})


class Question(ndb.Model):
  """Representation of a question (which is made up of several states)."""
  # NB: This element's parent should be a Chapter.
  # A hash_id to show in the browser.
  hash_id = ndb.StringProperty(required=True)
  # Human-readable name for the question.
  name = ndb.StringProperty(default='Question 1')
  # The state which forms the start of this question.
  init_state = ndb.KeyProperty(kind=State, required=True)
  # The list of states this question consists of.
  states = ndb.KeyProperty(kind=State, repeated=True)
  # The question group this question belongs to. It is 'None' if the question
  # has not yet been allocated to a group.
  question_group = ndb.KeyProperty(kind=QuestionGroup)


class Chapter(ndb.Model):
  """Representation of a chapter consisting of questions and question groups."""
  # NB: This element's parent should be a Story.
  # Human-readable name for the chapter.
  name = ndb.StringProperty(default='Introduction')
  # The list of question groups this chapter consists of.
  question_groups = ndb.KeyProperty(kind=QuestionGroup, repeated=True)
  # The list of questions this chapter contains consists of.
  questions = ndb.KeyProperty(kind=Question, repeated=True)
  # The date before which the chapter cannot be released.
  prereq_date = ndb.DateTimeProperty(default=None)
  # The metric prerequisite parameters. This is a dict whose elements have the
  # form {metric_name: metric_value}, representing 'metric_name ≥ metric_value'.
  # NB: note that these are not 'sticky': if a reader's metric drops, he/she
  # loses access to this chapter.
  prereq_metrics = ndb.StringProperty(repeated=True)


class Story(ndb.Model):
  """Representation of a story (which is made up of several chapters)."""
  # A hash_id to show in the browser.
  hash_id = ndb.StringProperty(required=True)
  # Human-readable name for the story.
  name = ndb.StringProperty(required=True)
  # Users who are allowed to edit the story.
  editors = ndb.UserProperty(repeated=True)
  # The list of chapters belonging to the story.
  chapters = ndb.KeyProperty(kind=Chapter, repeated=True)
  # Whether to display a link to the reader's profile page in the navbar.
  # TODO(sll): refactor the following into a story 'Settings' class.
  show_profile = ndb.BooleanProperty(default=True)
  # The amount of navigation permitted in the student's 'menu bar':
  # - 'story': there is no navigation, and a complete page history.
  # - 'question_group': students can navigate between question groups. There is
  #       no page history.
  navigation = ndb.StringProperty(
      choices=['story', 'question_group'], default='question_group')


class Reader(ndb.Model):
  """Describes a reader as he/she progresses through a story."""
  # The user described by this Reader. Note that a user may have multiple
  # Reader instances (for different stories).
  reader = ndb.UserProperty(required=True)
  # The page contents for this reader.
  pages = ndb.KeyProperty(kind=PageContent, repeated=True)
  # The reader's current page number.
  current_page = ndb.IntegerProperty(default=0)
  # The reader's current story.
  story = ndb.KeyProperty(kind=Story, required=True)
  # The reader's current question.
  question = ndb.KeyProperty(kind=Question, required=True)
  # The reader's current state.
  state = ndb.KeyProperty(kind=State, required=True)
  # The reader's metrics. This is a dict whose keys are the metric names and
  # whose values are the corresponding metric values.
  metrics = ndb.JsonProperty(default={})
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
  # The list of changes to metrics that should be performed as a response to the
  # reader's input. Each element is of the form {'key': ..., 'value': ...},
  # representing a change in 'key' by 'value'.
  metrics = ndb.JsonProperty(repeated=True)
  # The destination question id that the reader should be sent to. If both
  # dest_question and dest are specified, dest_question takes precedence. But
  # dest should equal dest_question.init_state.
  # TODO(sll): Implement automatic checking of this constraint.
  dest_question = ndb.KeyProperty(kind=Question)
  # The destination state id that the reader should be sent to. It is None if
  # this action leads to an END state.
  dest = ndb.KeyProperty(kind=State)
