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

"""Controllers for the Oppia reader view."""

__author__ = 'Sean Lip'

import json, logging, os
import base, classifiers, feconf, models, utils

from google.appengine.api import users
from google.appengine.ext import ndb

DEFAULT_CATALOG_CATEGORY_NAME = 'Miscellaneous'
READER_MODE = 'reader'


class MainPage(base.BaseHandler):
  """The reader's main page, which displays a catalog of explorations."""
  
  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    categories = {}
    for exploration in models.Exploration.query():
      category_name = exploration.metadata.get(
          'category', DEFAULT_CATALOG_CATEGORY_NAME)

      if not categories.get(category_name):
        categories[category_name] = {'explorations': [exploration]}
      else:
        # TODO(sll): make the following 'exploration' more explicit
        categories[category_name]['explorations'].append(exploration)

    self.values.update({
        'categories': categories,
        'js': utils.GetJsFile('readerMain'),
        'mode': READER_MODE,
    })
    self.response.out.write(
        base.JINJA_ENV.get_template('reader/reader_main.html').render(self.values))


class ExplorationPage(base.BaseHandler):
  """Page describing a single exploration."""

  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Handles GET requests.

    Args:
      exploration_id: string representing the exploration id.
    """
    self.values.update({
        'js': utils.GetJsFile('readerExploration'),
        'mode': READER_MODE,
    })

    # The following is needed for embedding Oppia explorations in other pages.
    if self.request.get('hideNavbar') == 'true':
      self.values['hide_navbar'] = True

    self.response.out.write(base.JINJA_ENV.get_template(
        'reader/reader_exploration.html').render(self.values))


class ExplorationHandler(base.BaseHandler):
  """Provides the data for a single exploration."""

  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Populates the data on the individual exploration page.

    Args:
      exploration_id: string representing the exploration id.
    """
    # TODO(sll): This should send a complete state machine to the frontend.
    # All interaction would happen client-side.
    exploration = utils.GetEntity(models.Exploration, exploration_id)
    logging.info(exploration.init_state)
    init_state = exploration.init_state.get()
    init_html, init_widgets = utils.ParseContentIntoHtml(init_state.text, 0)
    self.data_values.update({
        'html': init_html,
        'input_view': init_state.input_view.get().name,
        'state_id': init_state.hash_id,
        'title': exploration.title,
        'widgets': init_widgets,
    })
    self.data_values['input_template'] = utils.GetInputTemplate(self.data_values['input_view'])
    if self.data_values['input_view'] == utils.input_views.multiple_choice:
      self.data_values['categories'] = init_state.classifier_categories
    self.response.out.write(json.dumps(self.data_values))

  def post(self, exploration_id, state_id):  # pylint: disable-msg=C6409
    """Handles feedback interactions with readers.

    Args:
      exploration_id: string representing the exploration id.
      state_id: string representing the state id.
    """
    values = {'error': []}

    exploration = utils.GetEntity(models.Exploration, exploration_id)
    state = utils.GetEntity(models.State, state_id)
    old_state = state
    # Modify the reader's state based on the response received.
    response = self.request.get('answer')
    category = classifiers.Classify(state.input_view.get().classifier, response,
                                    state.classifier_categories)
    try:
      action_set = state.action_sets[category].get()
    except IndexError:
      # TODO(sll): handle the following error more gracefully. Perhaps use the
      # default category?
      logging.error('No action set found for response %s', response)
      return

    html_output = ''
    widget_output = []
    # Append reader's response.
    if state.input_view.get().classifier == 'finite':
      html_output = base.JINJA_ENV.get_template(
          'reader_response.html').render(
              {'response': state.classifier_categories[int(response)]})
    else:
      html_output = base.JINJA_ENV.get_template(
          'reader_response.html').render({'response': response})

    if not action_set.dest:
      # This leads to a FINISHED state.
      if action_set.text:
        action_html, action_widgets = utils.ParseContentIntoHtml(
            [{'type': 'text', 'value': action_set.text}], len(page.html))
        html_output += action_html
        html_output += 'FINISHED'
        widget_output.append(action_widgets)
    else:
      if action_set.dest_exploration:
        self.redirect('/learn/%s' % action_set.dest_exploration)
        return
      else:
        state = action_set.dest.get()

      # Append Oppia's feedback, if any.
      # TODO(sll): Rewrite this once the action_set.text becomes a content
      #     array.
      if action_set.text:
        action_html, action_widgets = utils.ParseContentIntoHtml(
            [{'type': 'text', 'value': action_set.text}], len(page.html))
        html_output += action_html
        widget_output.append(action_widgets)
      # Append text for the new state only if the new and old states differ.
      if old_state.hash_id != state.hash_id:
        state_html, state_widgets = utils.ParseContentIntoHtml(
            state.text, len(page.html))
        html_output += state_html
        widget_output.append(state_widgets)


    values['exploration_id'] = exploration.hash_id
    values['html'] = html_output
    values['widgets'] = widget_output
    if not action_set.dest:
      values['input_view'] = utils.input_views.finished
      values['input_template'] = ' '
    else:
      values['input_view'] = (state.input_view.get().name)
      values['input_template'] = utils.GetInputTemplate(values['input_view'])
    if values['input_view'] == utils.input_views.multiple_choice:
      values['categories'] = state.classifier_categories
    utils.Log(values)
    self.response.out.write(json.dumps(values))
