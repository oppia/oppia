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
from models.exploration import Exploration
from models.state import State
from models.stats import EventHandler
import utils

READER_MODE = 'reader'
DEFAULT_ANSWERS = {'NumericInput': 0, 'SetInput': {}, 'TextInput': ''}


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    def get(self, exploration_id):
        """Handles GET requests."""
        self.values.update({
            'js': utils.get_js_controllers(['readerExploration']),
            'nav_mode': READER_MODE,
        })

        # The following is needed for embedding Oppia explorations in other pages.
        if self.request.get('iframed') == 'true':
            self.values['iframed'] = True

        self.response.out.write(feconf.JINJA_ENV.get_template(
            'reader/reader_exploration.html').render(self.values))


class ExplorationHandler(BaseHandler):
    """Provides the data for a single exploration."""

    def get_params(self, state, existing_params={}):
        """Updates existing parameters based on the changes in the given state."""
        # Modify params using param_changes.
        # TODO(sll): Define this behavior. Currently a new parameter is set
        # only if it doesn't exist, but it might be the case that the parameter
        # should be reset each time the state is entered.
        for (key, values) in state.param_changes.iteritems():
            if key not in existing_params:
                # Pick a random parameter for this key.
                existing_params[key] = random.choice(values)
        return existing_params

    def normalize_classifier_return(self, *args):
        """Normalizes the return value of a classifier to a two-element tuple.

        Returns:
          A two-element tuple: a boolean stating whether the category matched,
              and a dict with additional data.
        """
        if len(args) > 2:
            raise Exception('Invalid classifier return values: %s' % args)

        assert isinstance(args[0], bool)
        if len(args) == 1:
            return (args[0], {})
        else:
            assert isinstance(args[1], dict)
            return (args[0], args[1])

    def get(self, exploration_id):
        """Populates the data on the individual exploration page."""
        # TODO(sll): Maybe this should send a complete state machine to the
        # frontend, and all interaction would happen client-side?
        exploration = utils.get_entity(Exploration, exploration_id)
        logging.info(exploration.init_state)
        init_state = exploration.init_state.get()
        params = self.get_params(init_state)
        init_html, init_widgets = utils.parse_content_into_html(
            init_state.content, 0, params)
        interactive_widget_html = InteractiveWidget.get_interactive_widget(
            init_state.interactive_widget,
            params=init_state.interactive_params,
            state_params_dict=params
        )['raw']

        self.values.update({
            'block_number': 0,
            'html': init_html,
            'interactive_widget_html': interactive_widget_html,
            'interactive_params': init_state.interactive_params,
            'params': params,
            'state_id': init_state.hash_id,
            'title': exploration.title,
            'widgets': init_widgets,
        })
        if init_state.interactive_widget in DEFAULT_ANSWERS:
            self.values['default_answer'] = DEFAULT_ANSWERS[init_state.interactive_widget]
        if init_state.interactive_widget == 'MultipleChoiceInput':
            # self.values['categories'] = init_state.classifier_categories
            pass
        self.response.out.write(json.dumps(self.values))

        EventHandler.record_exploration_visited(exploration_id)

    def post(self, exploration_id, state_id):
        """Handles feedback interactions with readers."""
        values = {'error': []}

        exploration = utils.get_entity(Exploration, exploration_id)
        state = utils.get_entity(State, state_id)
        old_state = state
        # The 0-based index of the last content block already on the page.
        block_number = int(self.request.get('block_number'))
        params = self.request.get('params')
        if params:
            params = json.loads(params)
        else:
            params = {}

        params = self.get_params(state, params)

        # The reader's answer.
        answer = json.loads(self.request.get('answer'))
        dest_id = None
        feedback = None

        # Add the reader's answer to the parameter list. This must happen before
        # the interactive widget is constructed.
        params['answer'] = answer

        interactive_widget_properties = InteractiveWidget.get_interactive_widget(
            state.interactive_widget, state_params_dict=params)['actions']['submit']

        if interactive_widget_properties['classifier'] != 'None':
            # Import the relevant classifier module to be used in eval() below.
            classifier_module = '.'.join([
                feconf.SAMPLE_CLASSIFIERS_DIR.replace('/', '.'),
                interactive_widget_properties['classifier'],
                interactive_widget_properties['classifier']])
            Classifier = importlib.import_module(classifier_module)
            logging.info(Classifier.__name__)

        norm_answer = Classifier.DEFAULT_NORMALIZER(answer)
        if norm_answer is None:
            raise self.InvalidInputException(
                'Invalid input: could not normalize the answer.')

        for ind, rule in enumerate(state.interactive_rulesets['submit']):
            if ind == len(state.interactive_rulesets['submit']) - 1:
                EventHandler.record_default_case_hit(
                    exploration_id, state_id, answer)

            assert rule['code']

            if rule['code'] == 'True':
                dest_id = rule['dest']
                feedback = rule['feedback']
                break

            # Add the 'answer' variable, and prepend classifier.
            code = 'Classifier.' + rule['code'].replace('(', '(norm_answer,')

            code = utils.parse_with_jinja(code, params)
            if code is None:
                continue

            return_value, return_data = (
                self.normalize_classifier_return(eval(code)))

            if return_value:
                dest_id = rule['dest']
                feedback = rule['feedback']
                break

        assert dest_id

        html_output, widget_output = '', []
        # TODO(sll): The following is a special-case for multiple choice input,
        # in which the choice text must be displayed instead of the choice number.
        # We might need to find a way to do this more generically.
        if state.interactive_widget == 'MultipleChoiceInput':
            answer = state.interactive_params['choices'][int(answer)]

        # Append reader's answer.
        html_output = feconf.JINJA_ENV.get_template(
            'reader_response.html').render({'response': answer})

        if dest_id == utils.END_DEST:
            # This leads to a FINISHED state.
            if feedback:
                action_html, action_widgets = utils.parse_content_into_html(
                    [{'type': 'text', 'value': feedback}], block_number, params)
                html_output += action_html
                widget_output.append(action_widgets)
            EventHandler.record_exploration_completed(exploration_id)
        else:
            state = utils.get_entity(State, dest_id)

            # Append Oppia's feedback, if any.
            if feedback:
                action_html, action_widgets = utils.parse_content_into_html(
                    [{'type': 'text', 'value': feedback}], block_number, params)
                html_output += action_html
                widget_output.append(action_widgets)
            # Append text for the new state only if the new and old states differ.
            if old_state.hash_id != state.hash_id:
                state_html, state_widgets = utils.parse_content_into_html(
                    state.content, block_number, params)
                html_output += state_html
                widget_output.append(state_widgets)

        if state.interactive_widget in DEFAULT_ANSWERS:
            values['default_answer'] = DEFAULT_ANSWERS[state.interactive_widget]
        values['exploration_id'] = exploration.hash_id
        values['state_id'] = state.hash_id
        values['html'] = html_output
        values['widgets'] = widget_output
        values['block_number'] = block_number + 1
        values['interactive_widget_html'] = (
            'Congratulations, you\'ve finished this exploration!')
        values['params'] = params

        if dest_id != utils.END_DEST:
            values['interactive_widget_html'] = InteractiveWidget.get_interactive_widget(
                state.interactive_widget,
                params=state.interactive_params,
                state_params_dict=params)['raw']

        logging.info(values)
        self.response.out.write(json.dumps(values))


class RandomExplorationPage(BaseHandler):
    """Returns the page for a random exploration."""

    def get(self):
        """Handles GET requests."""
        explorations = Exploration.query().filter(
            Exploration.is_public == True).fetch(100)

        selected_exploration = random.choice(explorations)

        self.redirect('/learn/%s' % selected_exploration.hash_id)
