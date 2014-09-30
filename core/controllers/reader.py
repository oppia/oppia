# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the Oppia learner view."""

__author__ = 'Sean Lip'

import copy

from core.controllers import base
from core.domain import dependency_registry
from core.domain import event_services
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_domain
from core.domain import rights_manager
from core.domain import rule_domain
from core.domain import skins_services
from core.domain import widget_registry
import feconf
import jinja_utils
import utils

import jinja2


def require_playable(handler):
    """Decorator that checks if the user can play the given exploration."""
    def test_can_play(self, exploration_id, **kwargs):
        """Checks if the user for the current session is logged in."""
        if rights_manager.Actor(self.user_id).can_play(exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


def _get_updated_param_dict(param_dict, param_changes, exp_param_specs):
    """Updates a param dict using the given list of param_changes.

    Note that the list of parameter changes is ordered. Parameter
    changes later in the list may depend on parameter changes that have
    been set earlier in the same list.
    """
    new_param_dict = copy.deepcopy(param_dict)
    for pc in param_changes:
        try:
            obj_type = exp_param_specs[pc.name].obj_type
        except:
            raise Exception('Parameter %s not found' % pc.name)
        new_param_dict[pc.name] = pc.get_normalized_value(
            obj_type, new_param_dict)
    return new_param_dict


def _classify(
        exp_id, exp_param_specs, state, handler_name, answer, params):
    """Normalize the answer and return the first rule that it satisfies."""
    widget_instance = widget_registry.Registry.get_widget_by_id(
        feconf.INTERACTIVE_PREFIX, state.widget.widget_id)
    normalized_answer = widget_instance.normalize_answer(
        answer, handler_name)

    handler = next(
        h for h in state.widget.handlers if h.name == handler_name)
    fs = fs_domain.AbstractFileSystem(fs_domain.ExplorationFileSystem(exp_id))
    input_type = widget_instance.get_handler_by_name(handler_name).obj_type
    for rule_spec in handler.rule_specs:
        if rule_domain.evaluate_rule(
                rule_spec.definition, exp_param_specs, input_type, params,
                normalized_answer, fs):
            return rule_spec

    raise Exception(
        'No matching rule found for handler %s. Rule specs are %s.' % (
            handler.name,
            [rule_spec.to_dict() for rule_spec in handler.rule_specs]
        )
    )


def _get_next_state_dict(
        exp_param_specs, old_state_name, old_params, rule_spec, new_state):
    """Given state transition information, returns a dict containing
    the new state name, response HTML, and updated parameters.
    """
    finished = (rule_spec.dest == feconf.END_DEST)
    new_params = (
        {} if finished
        else _get_updated_param_dict(
            old_params, new_state.param_changes, exp_param_specs))

    return {
        'feedback_html': '<div>%s</div>' % jinja_utils.parse_string(
            rule_spec.get_feedback_string(), old_params),
        'finished': finished,
        'params': new_params,
        'question_html': (
            new_state.content[0].to_html(new_params)
            if not finished and old_state_name != rule_spec.dest
            else ''),
        'state_name': rule_spec.dest,
    }


class ExplorationPage(base.BaseHandler):
    """Page describing a single exploration."""

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests."""
        version = self.request.get('v')
        if not version:
            # The default value for a missing parameter seems to be ''.
            version = None
        else:
            version = int(version)

        try:
            exploration = exp_services.get_exploration_by_id(
                exploration_id, version=version)
        except Exception as e:
            raise self.PageNotFoundException(e)

        if not rights_manager.Actor(self.user_id).can_view(exploration_id):
            raise self.PageNotFoundException

        is_iframed = (self.request.get('iframed') == 'true')

        # TODO(sll): Cache these computations.
        interactive_widget_ids = exploration.get_interactive_widget_ids()
        widget_dependency_ids = (
            widget_registry.Registry.get_deduplicated_dependency_ids(
                interactive_widget_ids))
        widget_dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                widget_dependency_ids))

        widget_templates = (
            widget_registry.Registry.get_noninteractive_widget_html() +
            widget_registry.Registry.get_interactive_widget_html(
                interactive_widget_ids))

        self.values.update({
            'additional_angular_modules': additional_angular_modules,
            'exploration_version': version,
            'iframed': is_iframed,
            'is_private': rights_manager.is_exploration_private(
                exploration_id),
            'nav_mode': feconf.NAV_MODE_EXPLORE,
            'skin_templates': jinja2.utils.Markup(
                skins_services.Registry.get_skin_templates(
                    [exploration.default_skin])),
            'skin_js_url': skins_services.Registry.get_skin_js_url(
                exploration.default_skin),
            'skin_tag': jinja2.utils.Markup(
                skins_services.Registry.get_skin_tag(exploration.default_skin)
            ),
            'widget_dependencies_html': jinja2.utils.Markup(
                widget_dependencies_html),
            'widget_templates': jinja2.utils.Markup(widget_templates),
        })

        if is_iframed:
            self.render_template(
                'player/exploration_player.html', iframe_restriction=None)
        else:
            self.render_template('player/exploration_player.html')


class ExplorationHandler(base.BaseHandler):
    """Provides the initial data for a single exploration."""

    def get(self, exploration_id):
        """Populates the data on the individual exploration page."""
        # TODO(sll): Maybe this should send a complete state machine to the
        # frontend, and all interaction would happen client-side?
        version = self.request.get('v')
        version = int(version) if version else None

        try:
            exploration = exp_services.get_exploration_by_id(
                exploration_id, version=version)
        except Exception as e:
            raise self.PageNotFoundException(e)

        init_params = _get_updated_param_dict(
            {},
            exploration.param_changes + exploration.states[
                exploration.init_state_name].param_changes,
            exploration.param_specs)

        init_state = exploration.init_state
        session_id = utils.generate_random_string(24)

        self.values.update({
            'exploration': exploration.to_player_dict(),
            'is_logged_in': bool(self.user_id),
            'init_html': init_state.content[0].to_html(init_params),
            'params': init_params,
            'session_id': session_id,
            'state_name': exploration.init_state_name,
        })
        self.render_json(self.values)

        event_services.StateHitEventHandler.record(
            exploration_id, exploration.init_state_name, True)
        event_services.StartExplorationEventHandler.record(
            exploration_id, version, exploration.init_state_name,
            session_id, init_params, feconf.PLAY_TYPE_NORMAL)


class FeedbackHandler(base.BaseHandler):
    """Handles feedback to readers."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id, escaped_state_name):
        """Handles feedback interactions with readers."""
        old_state_name = self.unescape_state_name(escaped_state_name)
        # The reader's answer.
        answer = self.payload.get('answer')
        # The answer handler (submit, click, etc.)
        handler_name = self.payload.get('handler')
        # Parameters associated with the learner.
        old_params = self.payload.get('params', {})
        old_params['answer'] = answer
        # The version of the exploration.
        version = self.payload.get('version')

        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=version)
        exp_param_specs = exploration.param_specs
        old_state = exploration.states[old_state_name]

        # The editor preview mode will call _classify() directly.
        rule_spec = _classify(
            exploration_id, exp_param_specs, old_state, handler_name,
            answer, old_params)

        # This next block of code will not be replicated in the editor preview
        # mode.
        widget_instance = widget_registry.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, old_state.widget.widget_id)
        normalized_answer = widget_instance.normalize_answer(
            answer, handler_name)
        # TODO(sll): Should this also depend on `params`?
        event_services.AnswerSubmissionEventHandler.record(
            exploration_id, version, old_state_name, handler_name, rule_spec,
            widget_instance.get_stats_log_html(
                old_state.widget.customization_args, normalized_answer))
        # This is the end of the block of code referenced in the comment above.

        # In the editor preview mode, this line of code will be replicated
        # client-side.
        new_state = (
            None if rule_spec.dest == feconf.END_DEST
            else exploration.states[rule_spec.dest])

        # The editor preview mode will call _get_next_state_dict() directly.
        self.render_json(_get_next_state_dict(
            exp_param_specs, old_state_name, old_params, rule_spec, new_state))


class StateHitEventHandler(base.BaseHandler):
    """Tracks a learner hitting a new state."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        new_state_name = self.payload.get('new_state_name')
        first_time = self.payload.get('first_time')
        exploration_version = self.payload.get('exploration_version')
        session_id = self.payload.get('session_id')
        client_time_spent_in_secs = self.payload.get('client_time_spent_in_secs')
        old_params = self.payload.get('old_params')

        event_services.StateHitEventHandler.record(
            exploration_id, new_state_name, first_time)
        if new_state_name == feconf.END_DEST:
            event_services.MaybeLeaveExplorationEventHandler.record(
                exploration_id, exploration_version, feconf.END_DEST,
                session_id, client_time_spent_in_secs, old_params,
                feconf.PLAY_TYPE_NORMAL)


class ReaderFeedbackHandler(base.BaseHandler):
    """Submits feedback from the reader."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        state_name = self.payload.get('state_name')
        subject = self.payload.get('subject', 'Feedback from a learner')
        feedback = self.payload.get('feedback')
        include_author = self.payload.get('include_author')

        feedback_services.create_thread(
            exploration_id,
            state_name,
            self.user_id if include_author else None,
            subject,
            feedback)
        self.render_json(self.values)


class ReaderLeaveHandler(base.BaseHandler):
    """Tracks a reader leaving an exploration before completion."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id, escaped_state_name):
        """Handles POST requests."""
        event_services.MaybeLeaveExplorationEventHandler.record(
            exploration_id,
            self.payload.get('version'),
            self.unescape_state_name(escaped_state_name),
            self.payload.get('session_id'),
            self.payload.get('client_time_spent_in_secs'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)
