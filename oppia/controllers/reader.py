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

import feconf
from oppia.apps.exploration import exp_domain
from oppia.apps.exploration import exp_services
import oppia.apps.state.models as state_models
from oppia.apps.statistics import stats_services
import oppia.apps.widget.models as widget_models
from oppia.controllers import base
import utils

READER_MODE = 'reader'


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

            html += feconf.OPPIA_JINJA_ENV.get_template(
                'reader/content.html').render({
                    'type': content.type, 'value': value})
        elif content.type == 'widget':
            # Ignore empty widget specifications.
            if not content.value:
                continue

            widget_dict = json.loads(content.value)
            widget = widget_models.NonInteractiveWidget.get_with_params(
                widget_dict['id'], widget_dict['params'])
            html += feconf.OPPIA_JINJA_ENV.get_template(
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


class ExplorationPage(base.BaseHandler):
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


class ExplorationHandler(base.BaseHandler):
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
            exploration = exp_domain.Exploration.get(exploration_id)
        except Exception as e:
            raise self.PageNotFoundException(e)

        init_state = exploration.init_state
        # TODO: get params from exploration specification instead
        params = self._get_exploration_params(exploration)
        params = get_params(init_state, params)
        init_html, init_widgets = parse_content_into_html(
            init_state.content, 0, params)
        interactive_html = widget_models.InteractiveWidget.get_raw_code(
            init_state.widget.widget_id,
            params=utils.parse_dict_with_params(
                init_state.widget.params, params)
        )

        self.values.update({
            'block_number': 0,
            'interactive_html': interactive_html,
            'interactive_params': init_state.widget.params,
            'oppia_html': init_html,
            'params': params,
            'state_id': exploration.init_state_id,
            'title': exploration.title,
            'iframe_output': init_widgets,
        })
        self.render_json(self.values)

        stats_services.EventHandler.record_exploration_visited(exploration_id)
        stats_services.EventHandler.record_state_hit(
            exploration_id, exploration.init_state_id)


class FeedbackHandler(base.BaseHandler):
    """Handles feedback to readers."""

    def _append_answer_to_stats_log(
            self, old_state, answer, exploration_id, old_state_id, rule):
        """Append the reader's answer to the statistics log."""
        # TODO(sll): Parse this using old_params, but do not convert into
        # a JSON string.
        recorded_answer_params = old_state.widget.params
        recorded_answer_params.update({
            'answer': answer,
        })
        recorded_answer = widget_models.InteractiveWidget.get_stats_log_html(
            old_state.widget.widget_id, params=recorded_answer_params)

        if recorded_answer:
            stats_services.EventHandler.record_rule_hit(
                exploration_id, old_state_id, rule, recorded_answer)
            # Add this answer to the state's 'unresolved answers' list.
            if recorded_answer not in old_state.unresolved_answers:
                old_state.unresolved_answers[recorded_answer] = 0
            old_state.unresolved_answers[recorded_answer] += 1
            old_state.put()

    def _get_feedback(self, feedback, block_number, params):
        """Gets the HTML and iframes with Oppia's feedback."""
        if not feedback:
            return '', []
        else:
            feedback_bits = [cgi.escape(bit) for bit in feedback.split('\n')]
            return parse_content_into_html(
                [state_models.Content(
                    type='text', value='<br>'.join(feedback_bits))],
                block_number, params)

    def _append_content(self, sticky, finished, old_params, new_state,
                        block_number, state_has_changed, html_output,
                        iframe_output):
        """Appends content for the new state to the output variables."""
        if finished:
            return {}, html_output, iframe_output, ''
        else:
            # Populate new parameters.
            new_params = get_params(new_state, existing_params=old_params)

            if state_has_changed:
                # Append the content for the new state.
                state_html, state_widgets = parse_content_into_html(
                    new_state.content, block_number, new_params)

                if html_output and state_html:
                    html_output += '<br>'
                html_output += state_html

                iframe_output += state_widgets

            interactive_html = '' if sticky else (
                widget_models.InteractiveWidget.get_raw_code(
                    new_state.widget.widget_id,
                    params=utils.parse_dict_with_params(
                        new_state.widget.params, new_params)
                )
            )

            return (new_params, html_output, iframe_output, interactive_html)

    def post(self, exploration_id, state_id):
        """Handles feedback interactions with readers."""
        values = {}

        exploration = exp_domain.Exploration.get(exploration_id)
        old_state = exploration.get_state_by_id(state_id)

        # The reader's answer.
        answer = self.payload.get('answer')
        # The answer handler (submit, click, etc.)
        handler = self.payload.get('handler')
        # The 0-based index of the last content block already on the page.
        block_number = self.payload.get('block_number') + 1
        # Parameters associated with the reader.
        old_params = self.payload.get('params', {})
        old_params['answer'] = answer

        rule = old_state.classify(handler, answer, old_params)
        feedback = rule.get_feedback_string()
        new_state_id = rule.dest
        if new_state_id == feconf.END_DEST:
            new_state = None
        else:
            new_state = exploration.get_state_by_id(new_state_id)

        stats_services.EventHandler.record_state_hit(
            exploration_id, new_state_id)

        # If the new state widget is the same as the old state widget, and the
        # new state widget is sticky, do not render the reader response. The
        # interactive widget in the frontend should take care of this.
        # TODO(sll): This special-casing is not great; we should
        # make the interface for updating the frontend more generic so that
        # all the updates happen in the same place. Perhaps in the non-sticky
        # case we should call a frontend method named appendFeedback() or
        # similar.
        sticky = (
            new_state_id != feconf.END_DEST and
            new_state.widget.sticky and
            new_state.widget.widget_id == old_state.widget.widget_id
        )

        self._append_answer_to_stats_log(
            old_state, answer, exploration_id, state_id, rule)

        # Append the reader's answer to the response HTML.
        reader_response_html = ''
        reader_response_iframe = ''
        if not sticky:
            reader_response_html, reader_response_iframe = (
                widget_models.InteractiveWidget.get_reader_response_html(
                    old_state.widget.widget_id,
                    utils.parse_dict_with_params(
                        old_state.widget.params, old_params))
            )
        values['reader_response_html'] = reader_response_html
        values['reader_response_iframe'] = reader_response_iframe

        # Add Oppia's feedback to the response HTML.
        html_output, iframe_output = self._get_feedback(
            feedback, block_number, old_params)

        # Add the content for the new state to the response HTML.
        finished = (new_state_id == feconf.END_DEST)
        state_has_changed = (old_state.id != new_state_id)
        new_params, html_output, iframe_output, interactive_html = (
            self._append_content(
                sticky, finished, old_params, new_state, block_number,
                state_has_changed, html_output, iframe_output))

        values.update({
            'interactive_html': interactive_html,
            'exploration_id': exploration_id,
            'state_id': new_state_id,
            'oppia_html': html_output,
            'iframe_output': iframe_output,
            'block_number': block_number,
            'params': new_params,
            'finished': finished,
        })

        self.render_json(values)


class RandomExplorationPage(base.BaseHandler):
    """Returns the page for a random exploration."""

    def get(self):
        """Handles GET requests."""
        explorations = exp_services.get_public_explorations()

        # Don't use the first exploration; users will have seen that already
        # on the main page.
        selected_exploration = utils.get_random_choice(explorations[1:])

        self.redirect('/learn/%s' % selected_exploration.id)
