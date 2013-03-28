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

import cgi
import json

from controllers.base import BaseHandler
import controller_utils
import feconf
from models.exploration import Exploration
from models.state import Content
from models.state import State
from models.statistics import EventHandler
from models.widget import InteractiveWidget
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

        exploration = Exploration.get(exploration_id)
        if exploration is None:
            raise self.InvalidInputException(
                'Exploration %s not found' % exploration_id)

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
                existing_params[key] = utils.get_random_choice(values)
        return existing_params

    def get(self, exploration_id):
        """Populates the data on the individual exploration page."""
        # TODO(sll): Maybe this should send a complete state machine to the
        # frontend, and all interaction would happen client-side?
        exploration = Exploration.get(exploration_id)
        init_state = exploration.init_state.get()
        params = self.get_params(init_state)
        init_html, init_widgets = controller_utils.parse_content_into_html(
            init_state.content, 0, params)
        interactive_widget_html = InteractiveWidget.get_with_params(
            init_state.widget.widget_id,
            params=utils.parse_dict_with_params(
                init_state.widget.params, params)
        )['raw']

        self.values.update({
            'block_number': 0,
            'interactive_widget_html': interactive_widget_html,
            'interactive_params': init_state.widget.params,
            'oppia_html': init_html,
            'params': params,
            'state_id': init_state.id,
            'title': exploration.title,
            'widgets': init_widgets,
        })
        if init_state.widget.widget_id in DEFAULT_ANSWERS:
            self.values['default_answer'] = (
                DEFAULT_ANSWERS[init_state.widget.widget_id])
        self.response.write(json.dumps(self.values))

        EventHandler.record_exploration_visited(exploration_id)

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
            InteractiveWidget.get_with_params(
                state.widget.widget_id)['actions']['submit'])

        dest_id, feedback, default_recorded_answer = state.transition(
            answer, params, interactive_widget_properties)

        if default_recorded_answer:
            EventHandler.record_default_case_hit(
                exploration_id, state_id, default_recorded_answer)

        assert dest_id

        html_output, widget_output = '', []
        # TODO(sll): The following is a special-case for multiple choice input,
        # in which the choice text must be displayed instead of the choice
        # number. We might need to find a way to do this more generically.
        if state.widget.widget_id == 'MultipleChoiceInput':
            answer = state.widget.params['choices'][int(answer)]

        # Append reader's answer.
        values['reader_html'] = feconf.JINJA_ENV.get_template(
            'reader_response.html').render({'response': answer})

        if dest_id == feconf.END_DEST:
            # This leads to a FINISHED state.
            if feedback:
                action_html, action_widgets = controller_utils.parse_content_into_html(
                    [Content(type='text', value=cgi.escape(feedback))],
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
                    [Content(type='text', value=cgi.escape(feedback))],
                    block_number,
                    params)
                html_output += action_html
                widget_output.append(action_widgets)
            # Append text for the new state only if the new and old states
            # differ.
            if old_state.id != state.id:
                state_html, state_widgets = controller_utils.parse_content_into_html(
                    state.content, block_number, params)
                # Separate text for the new state and feedback for the old state
                # by an additional line.
                if state_html and feedback:
                    html_output += '<br>'
                html_output += state_html
                widget_output.append(state_widgets)

        if state.widget.widget_id in DEFAULT_ANSWERS:
            values['default_answer'] = DEFAULT_ANSWERS[state.widget.widget_id]
        values['exploration_id'] = exploration.id
        values['state_id'] = state.id
        values['oppia_html'] = html_output
        values['widgets'] = widget_output
        values['block_number'] = block_number + 1
        values['params'] = params

        if dest_id != feconf.END_DEST:
            values['finished'] = False
            values['interactive_widget_html'] = (
                InteractiveWidget.get_with_params(
                    state.widget.widget_id,
                    params=utils.parse_dict_with_params(
                        state.widget.params, params)
                )['raw']
            )
        else:
            values['finished'] = True
            values['interactive_widget_html'] = ''

        self.response.write(json.dumps(values))


class RandomExplorationPage(BaseHandler):
    """Returns the page for a random exploration."""

    def get(self):
        """Handles GET requests."""
        explorations = Exploration.query().filter(
            Exploration.is_public == True).fetch(100)

        # Don't use the default exploration; users will have seen that already
        # on the main page.
        # TODO(sll): Is the first exploration in the list always the default
        # one?
        selected_exploration = utils.get_random_choice(explorations[1:])

        self.redirect('/learn/%s' % selected_exploration.id)
