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
from core.domain import gadget_registry
from core.domain import interaction_registry
from core.domain import moderator_services
from core.domain import rating_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import rte_component_registry
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
    """Decorator that checks if the learner can play the given exploration."""
    def test_can_play(self, exploration_id, **kwargs):
        """Tests if the learner can play the exploration.

        Args:
            exploration_id: str. The ID of the exploration to test.
            kwargs: Any other keyword args.

        Returns:
            handler. The relevant response handler if the learner is allowed to
                play the exploration.

        Raises:
            PageNotFoundException: The learner cannot play the exploration.
        """
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            self.render_template(
                'pages/error/disabled_exploration.html',
                iframe_restriction=None)
            return

        # This check is needed in order to show the correct page when a 404
        # error is raised. The self.request.get('iframed') part of the check is
        # needed for backwards compatibility with older versions of the
        # embedding script.
        if (feconf.EXPLORATION_URL_EMBED_PREFIX in self.request.uri or
                self.request.get('iframed')):
            self.values['iframed'] = True

        # Checks whether the learner can play this activity.
        if rights_manager.Actor(self.user_id).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            return handler(self, exploration_id, **kwargs)
        else:
            raise self.PageNotFoundException

    return test_can_play


def _get_exploration_player_data(
        exploration_id, version, collection_id, can_edit):
    """Gets exploration metadata which is returned as a dictionary.

    Args:
        exploration_id: str. The ID of the exploration to get metadata for.
        version: int or None. If specified, the version of the exploration to
            get metadata for. However, if the exploration is being played
            outside the context of a collection, the value should be None.
        collection_id: str. The id of the collection which the exploration
            belongs to.
        can_edit: bool. Whether the exploration is editable by the learner.

    Returns:
        dict. A dictionary with metadata pertaining to the exploration
            such as GADGET_SPECS, can_edit, title, version etc.

    Raises:
        Exception: The given exploration cannot be fetched.
    """
    try:
        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=version)
    except Exception:
        raise Exception

    collection_title = None
    if collection_id:
        try:
            collection = collection_services.get_collection_by_id(
                collection_id)
            collection_title = collection.title
        except Exception:
            raise Exception

    version = exploration.version

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

    return {
        'GADGET_SPECS': gadget_registry.Registry.get_all_specs(),
        'INTERACTION_SPECS': interaction_registry.Registry.get_all_specs(),
        'DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER': (
            DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER.value),
        'additional_angular_modules': additional_angular_modules,
        'can_edit': can_edit,
        'dependencies_html': jinja2.utils.Markup(
            dependencies_html),
        'exploration_title': exploration.title,
        'exploration_version': version,
        'collection_id': collection_id,
        'collection_title': collection_title,
        'gadget_templates': jinja2.utils.Markup(gadget_templates),
        'interaction_templates': jinja2.utils.Markup(
            interaction_templates),
        'is_private': rights_manager.is_exploration_private(
            exploration_id),
        # Note that this overwrites the value in base.py.
        'meta_name': exploration.title,
        # Note that this overwrites the value in base.py.
        'meta_description': utils.capitalize_string(exploration.objective),
        'nav_mode': feconf.NAV_MODE_EXPLORE,
    }


class ExplorationPageEmbed(base.BaseHandler):
    """Page describing a single embedded exploration."""

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests.

        Args:
            exploration_id: str. The ID of the exploration requested by the
                learner.

        Raises:
            PageNotFoundException: The exploration data cannot be retrieved.
        """
        version_str = self.request.get('v')
        version = int(version_str) if version_str else None

        # Note: this is an optional argument and will be None when the
        # exploration is being played outside the context of a collection.
        collection_id = self.request.get('collection_id')
        can_edit = (
            bool(self.username) and
            self.username not in config_domain.BANNED_USERNAMES.value and
            rights_manager.Actor(self.user_id).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, exploration_id))

        try:
            exploration_data_values = _get_exploration_player_data(
                exploration_id, version, collection_id, can_edit)
        except Exception:
            raise self.PageNotFoundException

        self.values.update(exploration_data_values)
        self.values['iframed'] = True
        self.render_template(
            'pages/exploration_player/exploration_player.html',
            iframe_restriction=None)


class ExplorationPage(base.BaseHandler):
    """Page describing a single exploration."""

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests.

        Args:
            exploration_id: str. The ID of the exploration requested by the
              learner.

        Raises:
            PageNotFoundException: The exploration data cannot be retrieved.
        """
        version_str = self.request.get('v')
        version = int(version_str) if version_str else None

        if self.request.get('iframed'):
            redirect_url = '/embed/exploration/%s' % exploration_id
            if version_str:
                redirect_url += '?v=%s' % version_str
            self.redirect(redirect_url)
            return

        # Note: this is an optional argument and will be None when the
        # exploration is being played outside the context of a collection.
        collection_id = self.request.get('collection_id')
        can_edit = (
            bool(self.username) and
            self.username not in config_domain.BANNED_USERNAMES.value and
            rights_manager.Actor(self.user_id).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, exploration_id))

        try:
            exploration_data_values = _get_exploration_player_data(
                exploration_id, version, collection_id, can_edit)
        except Exception:
            raise self.PageNotFoundException

        self.values.update(exploration_data_values)
        self.values['iframed'] = False
        self.render_template(
            'pages/exploration_player/exploration_player.html')


class ExplorationHandler(base.BaseHandler):
    """Provides the initial data for a single exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def get(self, exploration_id):
        """Populates the data on the individual exploration page.

        Args:
            exploration_id: str. The ID of the exploration requested by the
              learner.

        Raises:
            PageNotFoundException: The exploration does not exist or is not
              available.
        """
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
                    feconf.ACTIVITY_TYPE_EXPLORATION, exploration_id)),
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
        """Handles learner answer POST requests.

        Args:
            exploration_id: str. The ID of the exploration the learner
                has posted an answer to.
        """
        old_state_name = self.payload.get('old_state_name')
        answer = self.payload.get('answer')
        # Parameters associated with the learner.
        params = self.payload.get('params', {})
        # The version of the exploration.
        version = self.payload.get('version')
        session_id = self.payload.get('session_id')
        client_time_spent_in_secs = self.payload.get(
            'client_time_spent_in_secs')
        # The answer group and rule spec indexes, which will be used to get
        # the rule spec string.
        answer_group_index = self.payload.get('answer_group_index')
        rule_spec_index = self.payload.get('rule_spec_index')
        classification_categorization = self.payload.get(
            'classification_categorization')

        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=version)

        old_interaction = exploration.states[old_state_name].interaction

        old_interaction_instance = (
            interaction_registry.Registry.get_interaction_by_id(
                old_interaction.id))

        normalized_answer = old_interaction_instance.normalize_answer(answer)

        event_services.AnswerSubmissionEventHandler.record(
            exploration_id, version, old_state_name,
            exploration.states[old_state_name].interaction.id,
            answer_group_index, rule_spec_index, classification_categorization,
            session_id, client_time_spent_in_secs, params, normalized_answer)
        self.render_json({})


class StateHitEventHandler(base.BaseHandler):
    """Tracks a learner hitting a new state."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests. Records that a learner has hit new a state in
         the exploration.

        Args:
            exploration_id: str. The ID of the exploration.
        """
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
    """Stateless handler that performs a classify() operation server-side."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, unused_exploration_id):
        """Handle POST requests.

        Args:
            unused_exploration_id: str. Although this is not used, it is passed
                in because it is needed by the require_playable decorator.

        Returns:
            dict. A classification result, which is a dictionary containing
                three keys.
                'outcome': dict. A dict representing the outcome of the answer
                    group matched. it contains three keys.
                        'dest': str. Exploration init state.
                        'feedback: list. A list of feedbacks relating to the
                            answer.
                        'param_changes': list. Any previous changes to the
                            answer if any.
                'answer_group_index': int. An index into the answer groups list
                    indicating which one was selected as the group which this
                    answer belongs to. This is equal to the number of answer
                    groups if the default outcome was matched.
                'rule_spec_index': int. An index into the rule specs list of
                    the matched answer group which was selected that indicates
                    which rule spec was matched. This is equal to 0 if the
                    default outcome is selected.
        """
        # A domain object representing the old state.
        old_state = exp_domain.State.from_dict(self.payload.get('old_state'))
        # The learner's raw answer.
        answer = self.payload.get('answer')
        # The learner's parameter values.
        params = self.payload.get('params')
        params['answer'] = answer
        result = classifier_services.classify(old_state, answer)
        self.render_json(result)


class ReaderFeedbackHandler(base.BaseHandler):
    """Submits feedback from the reader."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @require_playable
    def post(self, exploration_id):
        """Handles POST requests. Records the feedback submitted by a learner
        to an exploration.

        Args:
            exploration_id: str. The ID of the exploration the learner has
                submitted feedback to.
        """
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
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration the learner has just
                started.
        """
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
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration the learner has
                finished.
        """
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
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration the learner has
                left without finishing.
        """
        event_services.MaybeLeaveExplorationEventHandler.record(
            exploration_id,
            self.payload.get('version'),
            self.payload.get('state_name'),
            self.payload.get('session_id'),
            self.payload.get('client_time_spent_in_secs'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)


class RatingHandler(base.BaseHandler):
    """Records the rating of an exploration submitted by a learner.

    Note that this represents ratings submitted on completion of the
    exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests.

        Args:
            exploration_id: str. The ID of the exploration the learner wants to
                get the rating of.
        """
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

        Args:
            exploration_id: str. The ID of the exploration the learner is
                rating.
        """
        user_rating = self.payload.get('user_rating')
        rating_services.assign_rating_to_exploration(
            self.user_id, exploration_id, user_rating)
        self.render_json({})


class RecommendationsHandler(base.BaseHandler):
    """Provides recommendations to be displayed at the end of explorations.
    Which explorations are provided depends on whether the exploration was
    played within the context of a collection and whether the learner is logged
    in. If both are true, then the explorations are suggested from the
    collection, if there are upcoming explorations for the learner to complete.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @require_playable
    def get(self, exploration_id):
        """Handles GET requests.

        Args:
            exploration_id: str. The ID of the exploration the learner wants
                to get other recommendations for.
        """
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
                collection_services.get_next_exploration_ids_to_complete_by_user(  # pylint: disable=line-too-long
                    self.user_id, collection_id))
            auto_recommended_exp_ids = list(
                set(next_exp_ids_in_collection) -
                set(author_recommended_exp_ids))
        else:
            next_exp_ids_in_collection = []
            if collection_id:
                collection = collection_services.get_collection_by_id(
                    collection_id)
                next_exp_ids_in_collection = (
                    collection.get_next_exploration_ids_in_sequence(
                        exploration_id))
            if next_exp_ids_in_collection:
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


class FlagExplorationHandler(base.BaseHandler):
    """Handles operations relating to learner flagging of explorations."""

    @base.require_user
    def post(self, exploration_id):
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration the learner
                has flagged.
        """
        moderator_services.enqueue_flag_exploration_email_task(
            exploration_id,
            self.payload.get('report_text'),
            self.user_id)
        self.render_json(self.values)
