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
import controller_utils
import feconf
from models.exploration import Exploration
from models.state import Content
from models.state import State
from models.statistics import EventHandler
import utils

READER_MODE = 'reader'
DEFAULT_ANSWERS = {'NumericInput': 0, 'SetInput': {}, 'TextInput': ''}


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    def get(self, unused_exploration_id):
        """Handles GET requests."""
        self.values.update({
            'js': utils.get_js_controllers(['readerExploration']),
            'nav_mode': READER_MODE,
        })

        # The following allows embedding of Oppia explorations in other pages.
        if self.request.get('iframed') == 'true':
            self.values['iframed'] = True

        self.render_template('reader/reader_exploration.html')


class ExplorationHandler(BaseHandler):
    """Provides the data for a single exploration."""

    def get_params(self, state, existing_params=None):
        """Updates existing parameters based on changes in the given state."""
        if existing_params is None:
            existing_params = {}
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

        Args:
          *args: the value returned by a rule classifier. This is either:
              - a single boolean saying whether the rule was satisfied
              - a boolean as above, together with a dict of additional data.

        Returns:
          A two-element tuple: a boolean stating whether the category matched,
              and a dict with additional data.

        Raises:
          Exception: if a rule classifier returns invalid values.
        """
        # TODO(sll): All rules should return a 2-tuple instead.
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
        exploration = Exploration.get(exploration_id)
        init_state = exploration.init_state.get()
        params = self.get_params(init_state)
        init_html, init_widgets = controller_utils.parse_content_into_html(
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
            'state_id': init_state.id,
            'title': exploration.title,
            'widgets': init_widgets,
        })
        if init_state.interactive_widget in DEFAULT_ANSWERS:
            self.values['default_answer'] = (
                DEFAULT_ANSWERS[init_state.interactive_widget])
        self.response.write(json.dumps(self.values))

        EventHandler.record_exploration_visited(exploration_id)

    def transition(self, state, answer, params, interactive_widget_properties):
        """Handle feedback interactions with readers."""
        # TODO(sll): Move this to the models.state class.

        dest_id = None
        feedback = None
        default_recorded_answer = None

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
                # TODO(sll): This is a special case for multiple-choice input
                # which should really be handled generically. However, it's
                # not very interesting anyway because the reader's answer
                # in this case is already known (it's just the last of the
                # multiple-choice options given).
                recorded_answer = answer
                if state.interactive_widget == 'MultipleChoiceInput':
                    recorded_answer = (
                        state.interactive_params['choices'][int(answer)])

                default_recorded_answer = recorded_answer

            assert rule['code']

            if rule['code'] == 'True':
                dest_id = rule['dest']
                feedback = rule['feedback']
                break

            # Add the 'answer' variable, and prepend classifier.
            code = 'Classifier.' + rule['code'].replace('(', '(norm_answer,', 1)

            code = utils.parse_with_jinja(code, params)
            if code is None:
                continue

            return_value, unused_return_data = (
                self.normalize_classifier_return(eval(code)))

            if return_value:
                dest_id = rule['dest']
                feedback = rule['feedback']
                break

        return dest_id, feedback, default_recorded_answer


    def post(self, exploration_id, state_id):
        """Handles feedback interactions with readers."""
        values = {'error': []}

        exploration = Exploration.get(exploration_id)
        state = State.get(state_id, exploration)
        old_state = state

        payload = json.loads(self.request.get('payload'))

        # The 0-based index of the last content block already on the page.
        block_number = payload.get('block_number')
        params = self.get_params(state, payload.get('params'))
        # The reader's answer.
        answer = payload.get('answer')

        # Add the reader's answer to the parameter list. This must happen before
        # the interactive widget is constructed.
        params['answer'] = answer

        interactive_widget_properties = (
            InteractiveWidget.get_interactive_widget(
                state.interactive_widget,
                state_params_dict=params)['actions']['submit'])

        dest_id, feedback, default_recorded_answer = self.transition(
            state, answer, params, interactive_widget_properties)

        if default_recorded_answer:
            EventHandler.record_default_case_hit(
                exploration_id, state_id, default_recorded_answer)

        assert dest_id

        html_output, widget_output = '', []
        # TODO(sll): The following is a special-case for multiple choice input,
        # in which the choice text must be displayed instead of the choice
        # number. We might need to find a way to do this more generically.
        if state.interactive_widget == 'MultipleChoiceInput':
            answer = state.interactive_params['choices'][int(answer)]

        # Append reader's answer.
        html_output = feconf.JINJA_ENV.get_template(
            'reader_response.html').render(
                {'response': utils.encode_strings_as_ascii(answer)})

        if dest_id == utils.END_DEST:
            # This leads to a FINISHED state.
            if feedback:
                action_html, action_widgets = controller_utils.parse_content_into_html(
                    [Content(type='text', value=feedback)],
                    block_number,
                    params)
                html_output += action_html
                widget_output.append(action_widgets)
            EventHandler.record_exploration_completed(exploration_id)
        else:
            state = State.get(dest_id, exploration)

            # Append Oppia's feedback, if any.
            if feedback:
                action_html, action_widgets = controller_utils.parse_content_into_html(
                    [Content(type='text', value=feedback)],
                    block_number,
                    params)
                html_output += action_html
                widget_output.append(action_widgets)
            # Append text for the new state only if the new and old states
            # differ.
            if old_state.id != state.id:
                state_html, state_widgets = controller_utils.parse_content_into_html(
                    state.content, block_number, params)
                html_output += state_html
                widget_output.append(state_widgets)

        if state.interactive_widget in DEFAULT_ANSWERS:
            values['default_answer'] = DEFAULT_ANSWERS[state.interactive_widget]
        values['exploration_id'] = exploration.id
        values['state_id'] = state.id
        values['html'] = html_output
        values['widgets'] = widget_output
        values['block_number'] = block_number + 1
        values['interactive_widget_html'] = (
            'Congratulations, you\'ve finished this exploration!')
        values['params'] = params

        if dest_id != utils.END_DEST:
            values['interactive_widget_html'] = (
                InteractiveWidget.get_interactive_widget(
                    state.interactive_widget,
                    params=state.interactive_params,
                    state_params_dict=params)['raw']
            )

        self.response.write(json.dumps(values))


class RandomExplorationPage(BaseHandler):
    """Returns the page for a random exploration."""

    def get(self):
        """Handles GET requests."""
        explorations = Exploration.query().filter(
            Exploration.is_public == True).fetch(100)

        selected_exploration = random.choice(explorations)

        self.redirect('/learn/%s' % selected_exploration.id)
