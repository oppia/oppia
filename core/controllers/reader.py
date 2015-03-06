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
from core.domain import config_domain
from core.domain import dependency_registry
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_domain
from core.domain import interaction_registry
from core.domain import param_domain
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import rte_component_registry
from core.domain import rule_domain
from core.domain import skins_services
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


def classify(
        exp_id, exp_param_specs, state, handler_name, answer, params):
    """Normalize the answer and return the first rulespec that it satisfies."""
    interaction_instance = interaction_registry.Registry.get_interaction_by_id(
        state.interaction.id)
    normalized_answer = interaction_instance.normalize_answer(
        answer, handler_name)

    handler = next(
        h for h in state.interaction.handlers if h.name == handler_name)
    fs = fs_domain.AbstractFileSystem(fs_domain.ExplorationFileSystem(exp_id))
    input_type = interaction_instance.get_handler_by_name(
        handler_name).obj_type
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


class ExplorationPage(base.BaseHandler):
    """Page describing a single exploration."""

    PAGE_NAME_FOR_CSRF = 'player'

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

        version = exploration.version

        if not rights_manager.Actor(self.user_id).can_view(exploration_id):
            raise self.PageNotFoundException

        is_iframed = (self.request.get('iframed') == 'true')

        # TODO(sll): Cache these computations.
        interaction_ids = exploration.get_interaction_ids()
        dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                dependency_ids))

        interaction_templates = (
            rte_component_registry.Registry.get_html_for_all_components() +
            interaction_registry.Registry.get_interaction_html(
                interaction_ids))

        self.values.update({
            'INTERACTION_SPECS': interaction_registry.Registry.get_all_specs(),
            'additional_angular_modules': additional_angular_modules,
            'can_edit': (
                bool(self.username) and
                self.username not in config_domain.BANNED_USERNAMES.value and
                rights_manager.Actor(self.user_id).can_edit(exploration_id)
            ),
            'dependencies_html': jinja2.utils.Markup(
                dependencies_html),
            'exploration_title': exploration.title,
            'exploration_version': version,
            'iframed': is_iframed,
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates),
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
            'title': exploration.title,
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
        version = self.request.get('v')
        version = int(version) if version else None

        try:
            exploration = exp_services.get_exploration_by_id(
                exploration_id, version=version)
        except Exception as e:
            raise self.PageNotFoundException(e)

        intro_card_color = (
            feconf.CATEGORIES_TO_COLORS[exploration.category] if
            exploration.category in feconf.CATEGORIES_TO_COLORS else
            feconf.DEFAULT_COLOR)

        self.values.update({
            'can_edit': (
                self.user_id and
                rights_manager.Actor(self.user_id).can_edit(exploration_id)),
            'exploration': exploration.to_player_dict(),
            'intro_card_image_url': (
                '/images/gallery/exploration_background_%s_large.png' %
                intro_card_color),
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_random_string(24),
            'version': exploration.version,
        })
        self.render_json(self.values)


class AnswerSubmittedEventHandler(base.BaseHandler):
    """Tracks a learner submitting an answer."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        old_state_name = self.payload.get('old_state_name')
        # The reader's answer.
        answer = self.payload.get('answer')
        # The answer handler (submit, click, etc.)
        handler_name = self.payload.get('handler')
        # Parameters associated with the learner.
        old_params = self.payload.get('params', {})
        old_params['answer'] = answer
        # The version of the exploration.
        version = self.payload.get('version')
        rule_spec_dict = self.payload.get('rule_spec')

        rule_spec = exp_domain.RuleSpec.from_dict_and_obj_type(
            rule_spec_dict, rule_spec_dict['obj_type'])

        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=version)
        exp_param_specs = exploration.param_specs
        old_interaction = exploration.states[old_state_name].interaction

        old_interaction_instance = (
            interaction_registry.Registry.get_interaction_by_id(
                old_interaction.id))
        normalized_answer = old_interaction_instance.normalize_answer(
            answer, handler_name)
        # TODO(sll): Should this also depend on `params`?
        event_services.AnswerSubmissionEventHandler.record(
            exploration_id, version, old_state_name, handler_name, rule_spec,
            old_interaction_instance.get_stats_log_html(
                old_interaction.customization_args, normalized_answer))


class StateHitEventHandler(base.BaseHandler):
    """Tracks a learner hitting a new state."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        new_state_name = self.payload.get('new_state_name')
        exploration_version = self.payload.get('exploration_version')
        session_id = self.payload.get('session_id')
        client_time_spent_in_secs = self.payload.get(
            'client_time_spent_in_secs')
        old_params = self.payload.get('old_params')

        if new_state_name == feconf.END_DEST:
            event_services.MaybeLeaveExplorationEventHandler.record(
                exploration_id, exploration_version, feconf.END_DEST,
                session_id, client_time_spent_in_secs, old_params,
                feconf.PLAY_TYPE_NORMAL)
        else:
            event_services.StateHitEventHandler.record(
                exploration_id, exploration_version, new_state_name,
                session_id, old_params, feconf.PLAY_TYPE_NORMAL)


class ClassifyHandler(base.BaseHandler):
    """Stateless handler that performs a classify() operation server-side and
    returns the corresponding rule_spec (as a dict).
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        exp_param_specs_dict = self.payload.get('exp_param_specs', {})
        exp_param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in exp_param_specs_dict.iteritems()
        }
        # A domain object representing the old state.
        old_state = exp_domain.State.from_dict(self.payload.get('old_state'))
        # The name of the rule handler triggered.
        handler_name = self.payload.get('handler')
        # The learner's raw answer.
        answer = self.payload.get('answer')
        # The learner's parameter values.
        params = self.payload.get('params')
        params['answer'] = answer

        rule_spec = classify(
            exploration_id, exp_param_specs, old_state, handler_name,
            answer, params)

        self.render_json(rule_spec.to_dict_with_obj_type())


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


class ExplorationStartEventHandler(base.BaseHandler):
    """Tracks a reader starting an exploration."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        event_services.StartExplorationEventHandler.record(
            exploration_id, self.payload.get('version'),
            self.payload.get('state_name'),
            self.payload.get('session_id'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)


class ExplorationMaybeLeaveHandler(base.BaseHandler):
    """Tracks a reader leaving an exploration before completion."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        event_services.MaybeLeaveExplorationEventHandler.record(
            exploration_id,
            self.payload.get('version'),
            self.payload.get('state_name'),
            self.payload.get('session_id'),
            self.payload.get('client_time_spent_in_secs'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)


# TODO(sll): This is a placeholder function. It should be deleted and the
# backend tests should submit directly to the handlers (to maintain parity with
# production and to avoid code skew).
def submit_answer_in_tests(
        exploration_id, state_name, answer, params, handler_name, version):
    """This function should only be used by tests."""
    params['answer'] = answer

    exploration = exp_services.get_exploration_by_id(
        exploration_id, version=version)
    exp_param_specs = exploration.param_specs
    old_state = exploration.states[state_name]

    rule_spec = classify(
        exploration_id, exp_param_specs, old_state, handler_name,
        answer, params)

    old_interaction_instance = (
        interaction_registry.Registry.get_interaction_by_id(
            old_state.interaction.id))
    normalized_answer = old_interaction_instance.normalize_answer(
        answer, handler_name)
    # TODO(sll): Should this also depend on `params`?
    event_services.AnswerSubmissionEventHandler.record(
        exploration_id, version, state_name, handler_name, rule_spec,
        old_interaction_instance.get_stats_log_html(
            old_state.interaction.customization_args, normalized_answer))

    new_state = (
        None if rule_spec.dest == feconf.END_DEST
        else exploration.states[rule_spec.dest])
    finished = (rule_spec.dest == feconf.END_DEST)
    new_params = _get_updated_param_dict(
        params, {} if finished else new_state.param_changes,
        exp_param_specs)

    return {
        'feedback_html': jinja_utils.parse_string(
            rule_spec.get_feedback_string(), params),
        'finished': finished,
        'params': new_params,
        'question_html': (
            new_state.content[0].to_html(new_params)
            if not finished else ''),
        'state_name': rule_spec.dest if not finished else None,
    }


class RatingHandler(base.BaseHandler):
    """Records the rating of an exploration submitted by a user."""

    PAGE_NAME_FOR_CSRF = 'player'

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests."""
        self.values.update({
            'overall_ratings':
                rating_services.get_overall_ratings(exploration_id),
            'user_rating': rating_services.get_user_specific_rating(
                self.user_id, exploration_id) if self.user_id else None
        })
        self.render_json(self.values)

    @base.require_user
    def put(self, exploration_id):
        """Handles PUT requests."""
        user_rating = self.payload.get('user_rating')
        rating_services.assign_rating(
            self.user_id, exploration_id, user_rating)
        self.render_json({})

