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

import apps.exploration.services as exp_services
from apps.state.models import Content
from apps.statistics.services import EventHandler
from apps.widget.models import InteractiveWidget
from apps.widget.models import NonInteractiveWidget
from controllers.base import BaseHandler
import feconf
import utils

READER_MODE = 'reader'
DEFAULT_ANSWERS = {'NumericInput': 0, 'SetInput': {}, 'TextInput': ''}


def get_params(state, existing_params=None):
    """Updates existing parameters based on changes in the given state."""
    if existing_params is None:
        existing_params = {}
    # Modify params using param_changes.
    for item in state.param_changes:
        # Pick a random parameter for this key.
        value = item.value
        existing_params[item.name] = (
            None if value is None else utils.parse_with_jinja(
                value, existing_params, value))
    return existing_params


def parse_content_into_html(content_array, block_number, params=None):
    """Takes a Content array and transforms it into HTML.

    Args:
        content_array: an array, each of whose members is of type Content. This
            object has two keys: type and value. The 'type' is one of the
            following:
                - 'text'; then the value is a text string
                - 'image'; then the value is an image ID
                - 'video'; then the value is a video ID
                - 'widget'; then the value is a JSON-encoded dict with keys
                    'id' and 'params', from which the raw widget HTML can be
                    constructed
        block_number: the number of content blocks preceding this one.
        params: any parameters used for templatizing text strings.

    Returns:
        the HTML string representing the array.

    Raises:
        InvalidInputException: if content has no 'type' attribute, or an invalid
            'type' attribute.
    """
    if params is None:
        params = {}

    html = ''
    widget_array = []
    widget_counter = 0
    for content in content_array:
        if content.type in ['text', 'image', 'video']:
            if content.type == 'text':
                value = utils.parse_with_jinja(content.value, params)
            else:
                value = content.value

            html += feconf.JINJA_ENV.get_template(
                'reader/content.html').render({
                    'type': content.type, 'value': value})
        elif content.type == 'widget':
            # Ignore empty widget specifications.
            if not content.value:
                continue

            widget_dict = json.loads(content.value)
            widget = NonInteractiveWidget.get_with_params(
                widget_dict['id'], widget_dict['params'])
            html += feconf.JINJA_ENV.get_template(
                'reader/content.html').render({
                    'blockIndex': block_number,
                    'index': widget_counter,
                    'type': content.type,
                })
            widget_array.append({
                'blockIndex': block_number,
                'index': widget_counter,
                'raw': widget['raw'],
            })
            widget_counter += 1
        else:
            raise utils.InvalidInputException(
                'Invalid content type %s', content.type)
    return html, widget_array


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    def get(self, unused_exploration_id):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': READER_MODE,
        })

        # The following allows embedding of Oppia explorations in other pages.
        if self.request.get('iframed') == 'true':
            self.values['iframed'] = True

        self.render_template('reader/reader_exploration.html')


class ExplorationHandler(BaseHandler):
    """Provides the initial data for a single exploration."""

    def _get_exploration_params(self, exploration):
        # TODO(yanamal/sll): consider merging with get_params somehow, since the
        # process is largely the same
        params = {}
        for item in exploration.parameters:
            value = item.value
            params[item.name] = (None if value is None else
                                 utils.parse_with_jinja(value, params, value))
        return params

    def get(self, exploration_id):
        """Populates the data on the individual exploration page."""
        # TODO(sll): Maybe this should send a complete state machine to the
        # frontend, and all interaction would happen client-side?
        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except Exception as e:
            raise self.PageNotFoundException(e)

        init_state = exploration.init_state
        # TODO: get params from exploration specification instead
        params = self._get_exploration_params(exploration)
        params = get_params(init_state, params)
        init_html, init_widgets = parse_content_into_html(
            init_state.content, 0, params)
        interactive_widget_html = InteractiveWidget.get_raw_code(
            init_state.widget.widget_id,
            params=utils.parse_dict_with_params(
                init_state.widget.params, params)
        )

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
        self.render_json(self.values)

        EventHandler.record_exploration_visited(exploration_id)
        EventHandler.record_state_hit(exploration_id, init_state.id)


class FeedbackHandler(BaseHandler):
    """Handles feedback to readers."""

    def _append_feedback(self, feedback, html_output, widget_output,
                         block_number, params):
        """Appends Oppia's feedback to the output variables."""
        feedback_bits = [cgi.escape(bit) for bit in feedback.split('\n')]
        action_html, action_widgets = parse_content_into_html(
            [Content(type='text', value='<br>'.join(feedback_bits))],
            block_number, params)
        html_output += action_html
        widget_output += action_widgets
        return html_output, widget_output

    def post(self, exploration_id, state_id):
        """Handles feedback interactions with readers."""
        values = {'error': []}

        state = exp_services.get_state_by_id(exploration_id, state_id)
        old_state = state

        payload = json.loads(self.request.get('payload'))

        # The 0-based index of the last content block already on the page.
        block_number = payload.get('block_number') + 1
        # The reader's answer.
        answer = payload.get('answer')
        # The answer handler (submit, click, etc.)
        handler = payload.get('handler')

        params = payload.get('params', {})
        # Add the reader's answer to the parameter list.
        params['answer'] = answer

        dest_id, feedback, rule, recorded_answer = state.transition(
            answer, params, handler)
        assert dest_id

        if recorded_answer is not None:
            recorded_answer = json.dumps(recorded_answer)
            EventHandler.record_rule_hit(
                exploration_id, state_id, rule, recorded_answer)
            # Add this answer to the state's 'unresolved answers' list.
            if recorded_answer not in old_state.unresolved_answers:
                old_state.unresolved_answers[recorded_answer] = 0
            old_state.unresolved_answers[recorded_answer] += 1
            # TODO(sll): Make this async?
            old_state.put()

        html_output, widget_output = '', []
        old_params = params

        if dest_id == feconf.END_DEST:
            # This leads to a FINISHED state.
            if feedback:
                html_output, widget_output = self._append_feedback(
                    feedback, html_output, widget_output, block_number,
                    old_params)
            EventHandler.record_exploration_completed(exploration_id)
        else:
            state = exp_services.get_state_by_id(exploration_id, dest_id)
            EventHandler.record_state_hit(exploration_id, dest_id)

            if feedback:
                html_output, widget_output = self._append_feedback(
                    feedback, html_output, widget_output, block_number,
                    old_params)

            # Populate new parameters.
            params = get_params(state, existing_params=old_params)
            # Append text for the new state only if the new and old states
            # differ.
            if old_state.id != state.id:
                state_html, state_widgets = parse_content_into_html(
                    state.content, block_number, params)
                # Separate text for the new state and feedback for the old state
                # by an additional line.
                if state_html and feedback:
                    html_output += '<br>'
                html_output += state_html
                widget_output += state_widgets

        # Render the response in the response in the customized html if
        # - the response is not rendered in the sticky interactive widget, and
        # - there is a static rendering html provided for that widget.
        sticky = (
            dest_id != feconf.END_DEST and
            state.widget.sticky and
            state.widget.widget_id == old_state.widget.widget_id
        )
        custom_response = ''
        if not sticky:
            response_params = utils.parse_dict_with_params(
                old_state.widget.params, old_params)
            response_params['answer'] = old_params['answer']
            response_params['iframe_content'] = False
            custom_response = InteractiveWidget.get_raw_static_code(
                old_state.widget.widget_id, response_params)

            if custom_response:
                response_params['iframe_content'] = True
                values['response_iframe'] = (
                    InteractiveWidget.get_raw_static_code(
                        old_state.widget.widget_id, response_params)
                )

        # Append reader's answer.
        response = custom_response if custom_response else answer
        if sticky:
            response = ''
        values['reader_html'] = feconf.JINJA_ENV.get_template(
            'reader/reader_response.html').render({
                'response': response,
                'custom_response': bool(custom_response),
            })

        if state.widget.widget_id in DEFAULT_ANSWERS:
            values['default_answer'] = DEFAULT_ANSWERS[state.widget.widget_id]
        values.update({
            'exploration_id': exploration_id, 'state_id': state.id,
            'oppia_html': html_output, 'widgets': widget_output,
            'block_number': block_number, 'params': params,
            'finished': (dest_id == feconf.END_DEST),
        })

        if dest_id != feconf.END_DEST:
            if sticky:
                values['interactive_widget_html'] = ''
                values['sticky_interactive_widget'] = True
            else:
                values['interactive_widget_html'] = (
                    InteractiveWidget.get_raw_code(
                        state.widget.widget_id,
                        params=utils.parse_dict_with_params(
                            state.widget.params, params)
                    )
                )
        else:
            values['interactive_widget_html'] = ''

        self.render_json(values)


class RandomExplorationPage(BaseHandler):
    """Returns the page for a random exploration."""

    def get(self):
        """Handles GET requests."""
        explorations = exp_services.get_public_explorations().fetch(100)

        # Don't use the first exploration; users will have seen that already
        # on the main page.
        selected_exploration = utils.get_random_choice(explorations[1:])

        self.redirect('/learn/%s' % selected_exploration.id)
