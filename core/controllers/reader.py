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

import logging

from core.controllers import base
from core.controllers import pages
from core.domain import config_domain
from core.domain import dependency_registry
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_domain
from core.domain import gadget_registry
from core.domain import interaction_registry
from core.domain import param_domain
from core.domain import rating_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import rte_component_registry
from core.domain import rule_domain
from core.domain import skins_services
import feconf
import utils

import jinja2


SHARING_OPTIONS = config_domain.ConfigProperty(
    'sharing_options', {
        'type': 'dict',
        'properties': [{
            'name': 'gplus',
            'schema': {
                'type': 'bool',
            }
        }, {
            'name': 'facebook',
            'schema': {
                'type': 'bool',
            }
        }, {
            'name': 'twitter',
            'schema': {
                'type': 'bool',
            }
        }]
    },
    'Sharing options to display in the learner view',
    default_value={
        'gplus': False,
        'facebook': False,
        'twitter': False,
    })

SHARING_OPTIONS_TWITTER_TEXT = config_domain.ConfigProperty(
    'sharing_options_twitter_text', {
        'type': 'unicode',
    },
    'Default text for the Twitter share message',
    default_value=(
        'Check out this interactive lesson from Oppia - a free, open-source '
        'learning platform!'))


def require_playable(handler):
    """Decorator that checks if the user can play the given exploration."""
    def test_can_play(self, exploration_id, **kwargs):
        if exploration_id in base.DISABLED_EXPLORATIONS.value:
            self.render_template(
                'error/disabled_exploration.html', iframe_restriction=None)
            return

        """Checks if the user for the current session is logged in."""
        if rights_manager.Actor(self.user_id).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


# TODO(bhenning): Add more tests for classification, such as testing multiple
# rule specs over multiple answer groups and making sure the best match over all
# those rules is picked.
def classify(exp_id, state, answer, params):
    """Normalize the answer and select among the answer groups the group in
    which the answer best belongs. The best group is decided by finding the
    first rule best satisfied by the answer. Returns a dict with the following
    keys:
        'outcome': A dict representing the outcome of the answer group matched.
        'rule_spec_string': A descriptive string representation of the rule
            matched.
        'answer_group_index': An index into the answer groups list indicating
            which one was selected as the group which this answer belongs to.
            This is equal to the number of answer groups if the default outcome
            was matched.
        'classification_certainty': A normalized value within the range of
            [0, 1] representing at which confidence level the answer belongs in
            the chosen answer group. A certainty of 1 means it is the best
            possible match. A certainty of 0 means it is matched to the default
            outcome.
    When the default rule is matched, outcome is the default_outcome of the
    state's interaction and the rule_spec_string is just 'Default.'
    """
    interaction_instance = interaction_registry.Registry.get_interaction_by_id(
        state.interaction.id)
    normalized_answer = interaction_instance.normalize_answer(answer)

    # Find the first group that satisfactorily matches the given answer. This is
    # done by ORing (maximizing) all truth values of all rules over all answer
    # groups. The group with the highest truth value is considered the best
    # match.
    best_matched_answer_group = None
    best_matched_answer_group_index = len(state.interaction.answer_groups)
    best_matched_rule_spec = None
    best_matched_truth_value = 0.0
    for (i, answer_group) in enumerate(state.interaction.answer_groups):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exp_id))
        input_type = interaction_instance.answer_type
        ored_truth_value = 0.0
        best_rule_spec = None
        for rule_spec in answer_group.rule_specs:
            evaluated_truth_value = rule_domain.evaluate_rule(
                rule_spec, input_type, params, normalized_answer, fs)
            if evaluated_truth_value > ored_truth_value:
                ored_truth_value = evaluated_truth_value
                best_rule_spec = rule_spec
        if ored_truth_value > best_matched_truth_value:
            best_matched_truth_value = ored_truth_value
            best_matched_rule_spec = best_rule_spec
            best_matched_answer_group = answer_group
            best_matched_answer_group_index = i

    # The best matched group must match above a certain threshold. If no group
    # meets this requirement, then the default 'group' automatically matches
    # resulting in the outcome of the answer being the default outcome of the
    # state.
    if (best_matched_truth_value >=
            feconf.DEFAULT_ANSWER_GROUP_CLASSIFICATION_THRESHOLD):
        return {
            'outcome': best_matched_answer_group.outcome.to_dict(),
            'rule_spec_string': (
                best_matched_rule_spec.stringify_classified_rule()),
            'answer_group_index': best_matched_answer_group_index,
            'classification_certainty': best_matched_truth_value
        }
    elif state.interaction.default_outcome is not None:
        return {
            'outcome': state.interaction.default_outcome.to_dict(),
            'rule_spec_string': exp_domain.DEFAULT_RULESPEC_STR,
            'answer_group_index': len(state.interaction.answer_groups),
            'classification_certainty': 0.0
        }

    raise Exception('Something has seriously gone wrong with the exploration. '
        'Oppia does not know what to do with this answer. Please contact the '
        'exploration owner.')


class ExplorationPage(base.BaseHandler):
    """Page describing a single exploration."""

    PAGE_NAME_FOR_CSRF = 'player'

    def _make_first_letter_uppercase(self, s):
        """Converts the first letter of a string to its uppercase equivalent,
        and returns the result.
        """
        # This guards against empty strings.
        if s:
            return s[0].upper() + s[1:]
        else:
            return s

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

        if not rights_manager.Actor(self.user_id).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            raise self.PageNotFoundException

        is_iframed = (self.request.get('iframed') == 'true')

        # TODO(sll): Cache these computations.
        gadget_types = exploration.get_gadget_types()
        interaction_ids = exploration.get_interaction_ids()
        dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                dependency_ids))

        gadget_templates = (
            gadget_registry.Registry.get_gadget_html(gadget_types))

        interaction_templates = (
            rte_component_registry.Registry.get_html_for_all_components() +
            interaction_registry.Registry.get_interaction_html(
                interaction_ids))

        self.values.update({
            'GADGET_SPECS': gadget_registry.Registry.get_all_specs(),
            'INTERACTION_SPECS': interaction_registry.Registry.get_all_specs(),
            'SHARING_OPTIONS': SHARING_OPTIONS.value,
            'SHARING_OPTIONS_TWITTER_TEXT': SHARING_OPTIONS_TWITTER_TEXT.value,
            'additional_angular_modules': additional_angular_modules,
            'can_edit': (
                bool(self.username) and
                self.username not in config_domain.BANNED_USERNAMES.value and
                rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id)
            ),
            'dependencies_html': jinja2.utils.Markup(
                dependencies_html),
            'exploration_title': exploration.title,
            'exploration_version': version,
            'gadget_templates': jinja2.utils.Markup(gadget_templates),
            'iframed': is_iframed,
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates),
            'is_private': rights_manager.is_exploration_private(
                exploration_id),
            # Note that this overwrites the value in base.py.
            'meta_name': exploration.title,
            # Note that this overwrites the value in base.py.
            'meta_description': self._make_first_letter_uppercase(
                exploration.objective),
            'nav_mode': feconf.NAV_MODE_EXPLORE,
            'skin_templates': jinja2.utils.Markup(
                skins_services.Registry.get_skin_templates(
                    [exploration.default_skin])),
            'skin_js_url': skins_services.Registry.get_skin_js_url(
                exploration.default_skin),
            'skin_tag': jinja2.utils.Markup(
                skins_services.Registry.get_skin_tag(exploration.default_skin)
            ),
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

        info_card_color = (
            feconf.CATEGORIES_TO_COLORS[exploration.category] if
            exploration.category in feconf.CATEGORIES_TO_COLORS else
            feconf.DEFAULT_COLOR)

        self.values.update({
            'can_edit': (
                self.user_id and
                rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id)),
            'exploration': exploration.to_player_dict(),
            'info_card_image_url': (
                '/images/gallery/exploration_background_%s_large.png' %
                info_card_color),
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
        # Parameters associated with the learner.
        old_params = self.payload.get('params', {})
        old_params['answer'] = answer
        # The version of the exploration.
        version = self.payload.get('version')
        rule_spec_string = self.payload.get('rule_spec_string')

        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=version)
        exp_param_specs = exploration.param_specs
        old_interaction = exploration.states[old_state_name].interaction

        old_interaction_instance = (
            interaction_registry.Registry.get_interaction_by_id(
                old_interaction.id))
        normalized_answer = old_interaction_instance.normalize_answer(answer)
        # TODO(sll): Should this also depend on `params`?
        event_services.AnswerSubmissionEventHandler.record(
            exploration_id, version, old_state_name, rule_spec_string,
            old_interaction_instance.get_stats_log_html(
                old_interaction.customization_args, normalized_answer))
        self.render_json({})


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

        # Record the state hit, if it is not the END state.
        if new_state_name is not None:
            event_services.StateHitEventHandler.record(
                exploration_id, exploration_version, new_state_name,
                session_id, old_params, feconf.PLAY_TYPE_NORMAL)
        else:
            logging.error('Unexpected StateHit event for the END state.')


class ClassifyHandler(base.BaseHandler):
    """Stateless handler that performs a classify() operation server-side and
    returns the corresponding classification result, which is a dict containing
    two keys:
        'outcome': A dict representing the outcome of the answer group matched.
        'rule_spec_string': A descriptive string representation of the rule
            matched.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        # A domain object representing the old state.
        old_state = exp_domain.State.from_dict(self.payload.get('old_state'))
        # The learner's raw answer.
        answer = self.payload.get('answer')
        # The learner's parameter values.
        params = self.payload.get('params')
        params['answer'] = answer

        self.render_json(classify(exploration_id, old_state, answer, params))


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
    """Tracks a learner starting an exploration."""

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


class ExplorationCompleteEventHandler(base.BaseHandler):
    """Tracks a learner completing an exploration.

    The state name recorded should be a state with a terminal interaction.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests."""
        event_services.CompleteExplorationEventHandler.record(
            exploration_id,
            self.payload.get('version'),
            self.payload.get('state_name'),
            self.payload.get('session_id'),
            self.payload.get('client_time_spent_in_secs'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)


class ExplorationMaybeLeaveHandler(base.BaseHandler):
    """Tracks a learner leaving an exploration without completing it.

    The state name recorded should be a state with a non-terminal interaction.
    """

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


class RatingHandler(base.BaseHandler):
    """Records the rating of an exploration submitted by a user.

    Note that this represents ratings submitted on completion of the
    exploration.
    """

    PAGE_NAME_FOR_CSRF = 'player'

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests."""
        self.values.update({
            'overall_ratings':
                rating_services.get_overall_ratings_for_exploration(
                    exploration_id),
            'user_rating': (
                rating_services.get_user_specific_rating_for_exploration(
                    self.user_id, exploration_id) if self.user_id else None)
        })
        self.render_json(self.values)

    @base.require_user
    def put(self, exploration_id):
        """Handles PUT requests for submitting ratings at the end of an
        exploration.
        """
        user_rating = self.payload.get('user_rating')
        rating_services.assign_rating_to_exploration(
            self.user_id, exploration_id, user_rating)
        self.render_json({})


class RecommendationsHandler(base.BaseHandler):
    """Provides recommendations to be displayed at the end of explorations."""

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests."""
        self.values.update({
            'recommended_exp_ids': (
                recommendations_services.get_exploration_recommendations(
                    exploration_id))
        })
        self.render_json(self.values)
