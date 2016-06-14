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

"""Controllers for the Oppia exploration learner view."""

import json
import logging
import random

import jinja2

from core.controllers import base
from core.domain import classifier_services
from core.domain import collection_services
from core.domain import config_domain
from core.domain import dependency_registry
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_domain
from core.domain import gadget_registry
from core.domain import interaction_registry
from core.domain import rating_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import rte_component_registry
from core.domain import rule_domain
from core.domain import summary_services
import feconf
import utils


MAX_SYSTEM_RECOMMENDATIONS = 4

DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER = config_domain.ConfigProperty(
    'default_twitter_share_message_player', {
        'type': 'unicode',
    },
    'Default text for the Twitter share message for the learner view',
    default_value=(
        'Check out this interactive lesson from Oppia - a free, open-source '
        'learning platform!'))


def require_playable(handler):
    """Decorator that checks if the user can play the given exploration."""
    def test_can_play(self, exploration_id, **kwargs):
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            self.render_template(
                'error/disabled_exploration.html', iframe_restriction=None)
            return

        # Checks if the user for the current session is logged in.
        if rights_manager.Actor(self.user_id).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


def classify_hard_rule(state, params, input_type, normalized_answer, fs):
    """Find the first hard rule that matches."""
    best_matched_answer_group = None
    best_matched_answer_group_index = len(state.interaction.answer_groups)
    best_matched_rule_spec_index = None
    best_matched_truth_value = rule_domain.CERTAIN_FALSE_VALUE

    for (answer_group_index, answer_group) in enumerate(
            state.interaction.answer_groups):
        ored_truth_value = rule_domain.CERTAIN_FALSE_VALUE
        for (rule_spec_index, rule_spec) in enumerate(
                answer_group.rule_specs):
            if rule_spec.rule_type != rule_domain.FUZZY_RULE_TYPE:
                evaluated_truth_value = rule_domain.evaluate_rule(
                    rule_spec, input_type, params, normalized_answer, fs)
                if evaluated_truth_value > ored_truth_value:
                    ored_truth_value = evaluated_truth_value
                    best_rule_spec_index = rule_spec_index
        if ored_truth_value == rule_domain.CERTAIN_TRUE_VALUE:
            best_matched_truth_value = ored_truth_value
            best_matched_answer_group = answer_group
            best_matched_answer_group_index = answer_group_index
            best_matched_rule_spec_index = best_rule_spec_index
            return {
                'outcome': best_matched_answer_group.outcome.to_dict(),
                'answer_group_index': best_matched_answer_group_index,
                'classification_certainty': best_matched_truth_value,
                'rule_spec_index': best_matched_rule_spec_index,
            }

    return None


def classify_soft_rule(state, params, input_type, normalized_answer, fs):
    """Find the maximum soft rule that matches. This is done by ORing
    (maximizing) all truth values of all rules over all answer groups. The
    group with the highest truth value is considered the best match.
    """
    best_matched_answer_group = None
    best_matched_answer_group_index = len(state.interaction.answer_groups)
    best_matched_rule_spec_index = None
    best_matched_truth_value = rule_domain.CERTAIN_FALSE_VALUE

    for (answer_group_index, answer_group) in enumerate(
            state.interaction.answer_groups):
        fuzzy_rule_spec_index = answer_group.get_fuzzy_rule_index()
        if fuzzy_rule_spec_index is not None:
            fuzzy_rule_spec = answer_group.rule_specs[fuzzy_rule_spec_index]
        else:
            fuzzy_rule_spec = None
        if fuzzy_rule_spec is not None:
            evaluated_truth_value = rule_domain.evaluate_rule(
                fuzzy_rule_spec, input_type, params, normalized_answer, fs)
            if evaluated_truth_value == rule_domain.CERTAIN_TRUE_VALUE:
                best_matched_truth_value = evaluated_truth_value
                best_matched_rule_spec_index = fuzzy_rule_spec_index
                best_matched_answer_group = answer_group
                best_matched_answer_group_index = answer_group_index
                return {
                    'outcome': best_matched_answer_group.outcome.to_dict(),
                    'answer_group_index': best_matched_answer_group_index,
                    'classification_certainty': best_matched_truth_value,
                    'rule_spec_index': best_matched_rule_spec_index,
                }

    return None


def classify_string_classifier_rule(state, normalized_answer):
    """Run the classifier if no prediction has been made yet. Currently this
    is behind a development flag.
    """
    best_matched_answer_group = None
    best_matched_answer_group_index = len(state.interaction.answer_groups)
    best_matched_rule_spec_index = None
    best_matched_truth_value = rule_domain.CERTAIN_FALSE_VALUE

    sc = classifier_services.StringClassifier()
    training_examples = [
        [doc, []] for doc in state.interaction.confirmed_unclassified_answers]
    for (answer_group_index, answer_group) in enumerate(
            state.interaction.answer_groups):
        fuzzy_rule_spec_index = answer_group.get_fuzzy_rule_index()
        if fuzzy_rule_spec_index is not None:
            fuzzy_rule_spec = answer_group.rule_specs[fuzzy_rule_spec_index]
        else:
            fuzzy_rule_spec = None
        if fuzzy_rule_spec is not None:
            training_examples.extend([
                [doc, [str(answer_group_index)]]
                for doc in fuzzy_rule_spec.inputs['training_data']])
    if len(training_examples) > 0:
        sc.load_examples(training_examples)
        doc_ids = sc.add_examples_for_predicting([normalized_answer])
        predicted_label = sc.predict_label_for_doc(doc_ids[0])
        if (predicted_label !=
                classifier_services.StringClassifier.DEFAULT_LABEL):
            predicted_answer_group_index = int(predicted_label)
            predicted_answer_group = state.interaction.answer_groups[
                predicted_answer_group_index]
            best_matched_truth_value = rule_domain.CERTAIN_TRUE_VALUE
            for rule_spec in predicted_answer_group.rule_specs:
                if rule_spec.rule_type == rule_domain.FUZZY_RULE_TYPE:
                    best_matched_rule_spec_index = fuzzy_rule_spec_index
                    break
            best_matched_answer_group = predicted_answer_group
            best_matched_answer_group_index = predicted_answer_group_index
            return {
                'outcome': best_matched_answer_group.outcome.to_dict(),
                'answer_group_index': best_matched_answer_group_index,
                'classification_certainty': best_matched_truth_value,
                'rule_spec_index': best_matched_rule_spec_index,
            }
        else:
            return None

    return None


# TODO(bhenning): Add more tests for classification, such as testing multiple
# rule specs over multiple answer groups and making sure the best match over all
# those rules is picked.
def classify(exp_id, state, answer, params):
    """Normalize the answer and select among the answer groups the group in
    which the answer best belongs. The best group is decided by finding the
    first rule best satisfied by the answer. Returns a dict with the following
    keys:
        'outcome': A dict representing the outcome of the answer group matched.
        'answer_group_index': An index into the answer groups list indicating
            which one was selected as the group which this answer belongs to.
            This is equal to the number of answer groups if the default outcome
            was matched.
        'classification_certainty': A normalized value within the range of
            [0, 1] representing at which confidence level the answer belongs in
            the chosen answer group. A certainty of 1 means it is the best
            possible match. A certainty of 0 means it is matched to the default
            outcome.
        'rule_spec_index': An index into the rule specs list of the matched
            answer group which was selected that indicates which rule spec was
            matched. This is equal to 0 if the default outcome is selected.
    When the default rule is matched, outcome is the default_outcome of the
    state's interaction.
    """
    interaction_instance = interaction_registry.Registry.get_interaction_by_id(
        state.interaction.id)
    normalized_answer = interaction_instance.normalize_answer(answer)

    fs = fs_domain.AbstractFileSystem(fs_domain.ExplorationFileSystem(exp_id))
    input_type = interaction_instance.answer_type

    response = classify_hard_rule(
        state, params, input_type, normalized_answer, fs)
    if response is None:
        response = classify_soft_rule(
            state, params, input_type, normalized_answer, fs)
    if (interaction_instance.is_string_classifier_trainable and
            feconf.ENABLE_STRING_CLASSIFIER and response is None):
        response = classify_string_classifier_rule(state, normalized_answer)

    # The best matched group must match above a certain threshold. If no group
    # meets this requirement, then the default 'group' automatically matches
    # resulting in the outcome of the answer being the default outcome of the
    # state.
    if (response is not None and response['classification_certainty'] >=
            feconf.DEFAULT_ANSWER_GROUP_CLASSIFICATION_THRESHOLD):
        return response
    elif state.interaction.default_outcome is not None:
        return {
            'outcome': state.interaction.default_outcome.to_dict(),
            'answer_group_index': len(state.interaction.answer_groups),
            'classification_certainty': 0.0,
            'rule_spec_index': 0
        }

    raise Exception(
        'Something has seriously gone wrong with the exploration. Oppia does '
        'not know what to do with this answer. Please contact the '
        'exploration owner.')


class ExplorationPage(base.BaseHandler):
    """Page describing a single exploration."""

    PAGE_NAME_FOR_CSRF = 'player'

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests."""
        version_str = self.request.get('v')
        version = int(version_str) if version_str else None

        # Note: this is an optional argument and will be None when the
        # exploration is being played outside the context of a collection.
        collection_id = self.request.get('collection_id')

        try:
            exploration = exp_services.get_exploration_by_id(
                exploration_id, version=version)
        except Exception as e:
            raise self.PageNotFoundException(e)

        collection_title = None
        if collection_id:
            try:
                collection = collection_services.get_collection_by_id(
                    collection_id)
                collection_title = collection.title
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
            'DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER': (
                DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER.value),
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
            'collection_id': collection_id,
            'collection_title': collection_title,
            'gadget_templates': jinja2.utils.Markup(gadget_templates),
            'iframed': is_iframed,
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates),
            'is_private': rights_manager.is_exploration_private(
                exploration_id),
            # Note that this overwrites the value in base.py.
            'meta_name': exploration.title,
            # Note that this overwrites the value in base.py.
            'meta_description': utils.capitalize_string(exploration.objective),
            'nav_mode': feconf.NAV_MODE_EXPLORE,
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

        self.values.update({
            'can_edit': (
                self.user_id and
                rights_manager.Actor(self.user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id)),
            'exploration': exploration.to_player_dict(),
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_new_session_id(),
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
        # The answer group and rule spec indexes, which will be used to get
        # the rule spec string.
        answer_group_index = self.payload.get('answer_group_index')
        rule_spec_index = self.payload.get('rule_spec_index')

        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=version)

        old_interaction = exploration.states[old_state_name].interaction

        if answer_group_index == len(old_interaction.answer_groups):
            rule_spec_string = exp_domain.DEFAULT_RULESPEC_STR
        else:
            rule_spec_string = (
                old_interaction.answer_groups[answer_group_index].rule_specs[
                    rule_spec_index].stringify_classified_rule())

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
        # TODO(sll): why do we not record the value of this anywhere?
        client_time_spent_in_secs = self.payload.get(  # pylint: disable=unused-variable
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
    three keys:
        'outcome': A dict representing the outcome of the answer group matched.
        'answer_group_index': The index of the matched answer group.
        'rule_spec_index': The index of the matched rule spec in the matched
            answer group.
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

        # This will be None if the exploration is not being played within the
        # context of a collection.
        collection_id = self.payload.get('collection_id')
        user_id = self.user_id

        event_services.CompleteExplorationEventHandler.record(
            exploration_id,
            self.payload.get('version'),
            self.payload.get('state_name'),
            self.payload.get('session_id'),
            self.payload.get('client_time_spent_in_secs'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)

        if user_id and collection_id:
            collection_services.record_played_exploration_in_collection_context(
                user_id, collection_id, exploration_id)


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
    """Provides recommendations to be displayed at the end of explorations.
    Which explorations are provided depends on whether the exploration was
    played within the context of a collection and whether the user is logged in.
    If both are true, then the explorations are suggested from the collection,
    if there are upcoming explorations for the learner to complete.
    """

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests."""
        collection_id = self.request.get('collection_id')
        include_system_recommendations = self.request.get(
            'include_system_recommendations')
        try:
            author_recommended_exp_ids = json.loads(self.request.get(
                'stringified_author_recommended_ids'))
        except Exception:
            raise self.PageNotFoundException

        auto_recommended_exp_ids = []
        if self.user_id and collection_id:
            next_exp_ids_in_collection = (
                collection_services.get_next_exploration_ids_to_complete_by_user( # pylint: disable=line-too-long
                    self.user_id, collection_id))
            auto_recommended_exp_ids = list(
                set(next_exp_ids_in_collection) -
                set(author_recommended_exp_ids))
        elif include_system_recommendations:
            system_chosen_exp_ids = (
                recommendations_services.get_exploration_recommendations(
                    exploration_id))
            filtered_exp_ids = list(
                set(system_chosen_exp_ids) -
                set(author_recommended_exp_ids))
            auto_recommended_exp_ids = random.sample(
                filtered_exp_ids,
                min(MAX_SYSTEM_RECOMMENDATIONS, len(filtered_exp_ids)))

        self.values.update({
            'summaries': (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    author_recommended_exp_ids + auto_recommended_exp_ids)),
        })
        self.render_json(self.values)
