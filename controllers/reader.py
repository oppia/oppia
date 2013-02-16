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

import importlib
import json
import logging
import random

from controllers.base import BaseHandler
from controllers.widgets import InteractiveWidget
import feconf
from models.models import Exploration, State
from models.stats import EventHandler
import utils

DEFAULT_CATALOG_CATEGORY_NAME = 'Miscellaneous'
READER_MODE = 'reader'
DEFAULT_ANSWERS = {'NumericInput': 0, 'SetInput': {}, 'TextInput': ''}


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    def get(self, exploration_id):  # pylint: disable-msg=C6409
        """Handles GET requests.

        Args:
            exploration_id: string representing the exploration id.
        """
        self.values.update({
            'js': utils.GetJsFilesWithBase(['readerExploration']),
            'nav_mode': READER_MODE,
        })

        # The following is needed for embedding Oppia explorations in other pages.
        if self.request.get('iframed') == 'true':
            self.values['iframed'] = True

        self.response.out.write(feconf.JINJA_ENV.get_template(
            'reader/reader_exploration.html').render(self.values))


class ExplorationHandler(BaseHandler):
    """Provides the data for a single exploration."""

    def get(self, exploration_id):  # pylint: disable-msg=C6409
        """Populates the data on the individual exploration page.

        Args:
            exploration_id: string representing the exploration id.
        """
        # TODO(sll): Maybe this should send a complete state machine to the
        # frontend, and all interaction would happen client-side?
        exploration = utils.GetEntity(Exploration, exploration_id)
        logging.info(exploration.init_state)
        init_state = exploration.init_state.get()
        init_html, init_widgets = utils.ParseContentIntoHtml(init_state.content, 0)
        interactive_widget_html = InteractiveWidget.get_interactive_widget(
            init_state.interactive_widget, True)['raw']

        self.data_values.update({
            'block_number': 0,
            'html': init_html,
            'interactive_widget_html': interactive_widget_html,
            'interactive_params': init_state.interactive_params,
            'state_id': init_state.hash_id,
            'title': exploration.title,
            'widgets': init_widgets,
        })
        if init_state.interactive_widget in DEFAULT_ANSWERS:
            self.data_values['default_answer'] = DEFAULT_ANSWERS[init_state.interactive_widget]
        if init_state.interactive_widget == 'MultipleChoiceInput':
            # self.data_values['categories'] = init_state.classifier_categories
            pass
        self.response.out.write(json.dumps(self.data_values))

        EventHandler.record_exploration_visited(exploration_id)

    def post(self, exploration_id, state_id):  # pylint: disable-msg=C6409
        """Handles feedback interactions with readers.

        Args:
            exploration_id: string representing the exploration id.
            state_id: string representing the state id.
        """
        values = {'error': []}

        exploration = utils.GetEntity(Exploration, exploration_id)
        state = utils.GetEntity(State, state_id)
        old_state = state
        # The 0-based index of the last content block already on the page.
        block_number = int(self.request.get('block_number'))

        # The reader's answer.
        answer = self.request.get('answer')
        dest = None
        feedback = None

        interactive_widget_properties = InteractiveWidget.get_interactive_widget(
            state.interactive_widget)['actions']['submit']

        if interactive_widget_properties['classifier'] != 'None':
            # Import the relevant classifier module to be used in eval() below.
            classifier_module = '.'.join([
                'classifiers',
                interactive_widget_properties['classifier'],
                interactive_widget_properties['classifier']])
            Classifier = importlib.import_module(classifier_module)

        for ind, rule in enumerate(state.interactive_rulesets['submit']):
            if ind == len(state.interactive_rulesets['submit']) - 1:
                EventHandler.record_default_case_hit(exploration_id, answer)

            assert rule['code']

            if eval(rule['code']) == True:
                dest = rule['dest']
                feedback = rule['feedback']
                break

        assert dest

        html_output, widget_output = '', []
        # Append reader's answer.
        if interactive_widget_properties['classifier'] == 'MultipleChoiceClassifier':
            # html_output = feconf.JINJA_ENV.get_template(
            #     'reader_response.html').render(
            #         {'response': state.classifier_categories[int(answer)]})
            pass
        else:
            html_output = feconf.JINJA_ENV.get_template(
                'reader_response.html').render({'response': answer})

        if dest == '-1':
            # This leads to a FINISHED state.
            if feedback:
                action_html, action_widgets = utils.ParseContentIntoHtml(
                    [{'type': 'text', 'value': feedback}], block_number)
                html_output += action_html
                widget_output.append(action_widgets)
            EventHandler.record_exploration_completed(exploration_id)
        else:
            state = utils.GetEntity(State, dest)

            # Append Oppia's feedback, if any.
            if feedback:
                action_html, action_widgets = utils.ParseContentIntoHtml(
                    [{'type': 'text', 'value': feedback}], block_number)
                html_output += action_html
                widget_output.append(action_widgets)
            # Append text for the new state only if the new and old states differ.
            if old_state.hash_id != state.hash_id:
                state_html, state_widgets = utils.ParseContentIntoHtml(
                        state.content, block_number)
                html_output += state_html
                widget_output.append(state_widgets)

        if state.interactive_widget in DEFAULT_ANSWERS:
            values['default_answer'] = DEFAULT_ANSWERS[state.interactive_widget]
        values['exploration_id'] = exploration.hash_id
        values['state_id'] = state.hash_id
        values['html'] = html_output
        values['widgets'] = widget_output
        values['block_number'] = block_number + 1
        if dest:
            if state.interactive_widget == 'MultipleChoiceInput':
                # values['categories'] = state.classifier_categories
                pass
        values['interactive_widget_html'] = (
            'Congratulations, you\'ve finished this exploration!')
        if dest != '-1':
            values['interactive_widget_html'] = InteractiveWidget.get_interactive_widget(
                state.interactive_widget, True)['raw']

        utils.Log(values)
        self.response.out.write(json.dumps(values))


class RandomExplorationPage(BaseHandler):
    """Returns the page for a random exploration."""

    def get(self):
        """Handles GET requests."""
        explorations = Exploration.query().filter(
            Exploration.is_public == True).fetch(100)

        selected_exploration = random.choice(explorations)

        self.redirect('/learn/%s' % selected_exploration.hash_id)
