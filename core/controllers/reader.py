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

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import classifier_services
from core.domain import collection_services
from core.domain import config_domain
from core.domain import dependency_registry
from core.domain import event_services
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import interaction_registry
from core.domain import learner_progress_services
from core.domain import moderator_services
from core.domain import rating_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import summary_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

import jinja2

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])

MAX_SYSTEM_RECOMMENDATIONS = 4

DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER = config_domain.ConfigProperty(
    'default_twitter_share_message_player', {
        'type': 'unicode',
    },
    'Default text for the Twitter share message for the learner view',
    default_value=(
        'Check out this interactive lesson from Oppia - a free, open-source '
        'learning platform!'))


def _get_exploration_player_data(
        exploration_id, version, collection_id, can_edit):
    """Returns a dict of exploration player data.

    Args:
        exploration_id: str. The ID of the exploration.
        version: int or None. The version of the exploration.
        collection_id: str. ID of the collection.
        can_edit: bool. Whether the given user can edit this activity.

    Returns:
        dict. A dict of exploration player data.
        The keys and values of the dict are as follows:
        - 'INTERACTION_SPECS': dict. A dict containing the full specs of each
            interaction. Contains interaction ID and a list of instances of
            all interactions.
        - 'DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER': str. Text for the Twitter
            share message.
        - 'additional_angular_modules': list. A de-duplicated list of strings,
            each representing an additional angular module that should be
            loaded.
        - 'can_edit': bool. Whether the given user can edit this activity.
        - 'dependencies_html': str. The additional HTML to insert on the page.
        - 'exploration_title': str. Title of exploration.
        - 'exploration_version': int. The version of the exploration.
        - 'collection_id': str. ID of the collection.
        - 'collection_title': str. Title of collection.
        - 'interaction_templates': str. The HTML bodies of the interactions
            required by the given exploration ID.
        - 'is_private': bool. Whether the exploration is private or not.
        - 'meta_name': str. Title of exploration.
        - 'meta_description': str. Objective of exploration.
        - 'nav_mode': str. 'explore'.
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
    interaction_ids = exploration.get_interaction_ids()
    dependency_ids = (
        interaction_registry.Registry.get_deduplicated_dependency_ids(
            interaction_ids))
    dependencies_html, additional_angular_modules = (
        dependency_registry.Registry.get_deps_html_and_angular_modules(
            dependency_ids))

    interaction_templates = (
        interaction_registry.Registry.get_interaction_html(
            interaction_ids))

    return {
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

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        version_str = self.request.get('v')
        version = int(version_str) if version_str else None
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        # Note: this is an optional argument and will be None when the
        # exploration is being played outside the context of a collection.
        collection_id = self.request.get('collection_id')
        can_edit = rights_manager.check_can_edit_activity(
            self.user, exploration_rights)

        # This check is needed in order to show the correct page when a 404
        # error is raised. The self.request.get('iframed') part of the check is
        # needed for backwards compatibility with older versions of the
        # embedding script.
        if (feconf.EXPLORATION_URL_EMBED_PREFIX in self.request.uri or
                self.request.get('iframed')):
            self.values['iframed'] = True
        try:
            # If the exploration does not exist, a 404 error is raised.
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

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        version_str = self.request.get('v')
        version = int(version_str) if version_str else None
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)

        if self.request.get('iframed'):
            redirect_url = '/embed/exploration/%s' % exploration_id
            if version_str:
                redirect_url += '?v=%s' % version_str
            self.redirect(redirect_url)
            return

        # Note: this is an optional argument and will be None when the
        # exploration is being played outside the context of a collection or if
        # the 'parent' parameter is present.
        if self.request.get('parent'):
            collection_id = None
        else:
            collection_id = self.request.get('collection_id')
        can_edit = rights_manager.check_can_edit_activity(
            self.user, exploration_rights)

        try:
            # If the exploration does not exist, a 404 error is raised.
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

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Populates the data on the individual exploration page.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        version = self.request.get('v')
        version = int(version) if version else None

        try:
            exploration = exp_services.get_exploration_by_id(
                exploration_id, version=version)
        except Exception as e:
            raise self.PageNotFoundException(e)

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=False)
        user_settings = user_services.get_user_settings(self.user_id)

        preferred_audio_language_code = None
        if user_settings is not None:
            preferred_audio_language_code = (
                user_settings.preferred_audio_language_code)

        # Retrieve all classifiers for the exploration.
        state_classifier_mapping = {}
        classifier_training_jobs = (
            classifier_services.get_classifier_training_jobs(
                exploration_id, exploration.version, exploration.states))
        for index, state_name in enumerate(exploration.states):
            if classifier_training_jobs[index] is not None:
                classifier_data = classifier_training_jobs[
                    index].classifier_data
                algorithm_id = classifier_training_jobs[index].algorithm_id
                data_schema_version = (
                    classifier_training_jobs[index].data_schema_version)
                state_classifier_mapping[state_name] = {
                    'algorithm_id': algorithm_id,
                    'classifier_data': classifier_data,
                    'data_schema_version': data_schema_version
                }

        self.values.update({
            'can_edit': (
                rights_manager.check_can_edit_activity(
                    self.user, exploration_rights)),
            'exploration': exploration.to_player_dict(),
            'exploration_id': exploration_id,
            'is_logged_in': bool(self.user_id),
            'session_id': utils.generate_new_session_id(),
            'version': exploration.version,
            'preferred_audio_language_code': preferred_audio_language_code,
            'state_classifier_mapping': state_classifier_mapping,
            'auto_tts_enabled': exploration.auto_tts_enabled,
            'correctness_feedback_enabled': (
                exploration.correctness_feedback_enabled),
        })
        self.render_json(self.values)


class StorePlaythroughHandler(base.BaseHandler):
    """Handles a useful playthrough coming in from the frontend to store it. If
    the playthrough already exists, it is updated in the datastore.
    """

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests. Appends to existing list of playthroughs or
        deletes it if already full.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        playthrough_data = self.payload.get('playthrough_data')
        try:
            unused_playthrough = stats_domain.Playthrough.from_backend_dict(
                playthrough_data)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        try:
            issue_schema_version = self.payload['issue_schema_version']
        except KeyError as e:
            raise self.InvalidInputException(e)

        exp_version = playthrough_data['exp_version']

        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            exploration_id, exp_version)
        exp_issues = stats_services.get_exp_issues_from_model(exp_issues_model)

        customization_args = playthrough_data['issue_customization_args']

        # If playthrough already exists, update it in the datastore.
        if 'id' in playthrough_data:
            playthrough = stats_domain.Playthrough.from_dict(playthrough_data)
            stats_services.update_playthroughs_multi(
                [playthrough_data['id']], [playthrough])
            self.render_json({})
            return

        issue_found = False
        playthrough_id = None
        for index, issue in enumerate(exp_issues.unresolved_issues):
            if issue.issue_type == playthrough_data['issue_type']:
                issue_customization_args = issue.issue_customization_args
                # In case issue_keyname is 'state_names', the ordering of the
                # list is important i.e. [a,b,c] is different from [b,c,a].
                issue_keyname = stats_models.ISSUE_TYPE_KEYNAME_MAPPING[
                    issue.issue_type]
                if (issue_customization_args[issue_keyname] ==
                        customization_args[issue_keyname]):
                    issue_found = True
                    if (len(issue.playthrough_ids) <
                            feconf.MAX_PLAYTHROUGHS_FOR_ISSUE):
                        playthrough_id = stats_models.PlaythroughModel.create(
                            playthrough_data['exp_id'],
                            playthrough_data['exp_version'],
                            playthrough_data['issue_type'],
                            playthrough_data['issue_customization_args'],
                            playthrough_data['actions'])
                        exp_issues.unresolved_issues[
                            index].playthrough_ids.append(playthrough_id)
                    break

        if not issue_found:
            playthrough_id = stats_models.PlaythroughModel.create(
                playthrough_data['exp_id'],
                playthrough_data['exp_version'],
                playthrough_data['issue_type'],
                playthrough_data['issue_customization_args'],
                playthrough_data['actions'])
            issue = stats_domain.ExplorationIssue(
                playthrough_data['issue_type'],
                playthrough_data['issue_customization_args'],
                [playthrough_id], issue_schema_version, True)

            exp_issues.unresolved_issues.append(issue)

        stats_services.save_exp_issues_model_transactional(exp_issues)
        self.render_json({'playthrough_id': playthrough_id})


class StatsEventsHandler(base.BaseHandler):
    """Handles a batch of events coming in from the frontend."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    def _require_aggregated_stats_are_valid(self, aggregated_stats):
        """Checks whether the aggregated stats dict has the correct keys.

        Args:
            aggregated_stats: dict. Dict comprising of aggregated stats.
        """
        exploration_stats_properties = [
            'num_starts',
            'num_actual_starts',
            'num_completions'
        ]
        state_stats_properties = [
            'total_answers_count',
            'useful_feedback_count',
            'total_hit_count',
            'first_hit_count',
            'num_times_solution_viewed',
            'num_completions'
        ]

        for exp_stats_property in exploration_stats_properties:
            if exp_stats_property not in aggregated_stats:
                raise self.InvalidInputException(
                    '%s not in aggregated stats dict.' % (exp_stats_property))
        for state_name in aggregated_stats['state_stats_mapping']:
            for state_stats_property in state_stats_properties:
                if state_stats_property not in aggregated_stats[
                        'state_stats_mapping'][state_name]:
                    raise self.InvalidInputException(
                        '%s not in state stats mapping of %s in aggregated '
                        'stats dict.' % (state_stats_property, state_name))

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        aggregated_stats = self.payload.get('aggregated_stats')
        exp_version = self.payload.get('exp_version')
        try:
            self._require_aggregated_stats_are_valid(aggregated_stats)
        except self.InvalidInputException as e:
            logging.error(e)
        event_services.StatsEventsHandler.record(
            exploration_id, exp_version, aggregated_stats)
        self.render_json({})


class AnswerSubmittedEventHandler(base.BaseHandler):
    """Tracks a learner submitting an answer."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        old_state_name = self.payload.get('old_state_name')
        # The reader's answer.
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

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests.

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
        self.render_json({})


class StateCompleteEventHandler(base.BaseHandler):
    """Tracks a learner complete a state. Here, 'completing' means answering
    the state and progressing to a new state.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests."""
        event_services.StateCompleteEventHandler.record(
            exploration_id, self.payload.get('exp_version'),
            self.payload.get('state_name'), self.payload.get('session_id'),
            self.payload.get('time_spent_in_state_secs'))
        self.render_json({})


class LeaveForRefresherExpEventHandler(base.BaseHandler):
    """Tracks a learner leaving an exploration for a refresher exploration."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests."""
        event_services.LeaveForRefresherExpEventHandler.record(
            exploration_id, self.payload.get('refresher_exp_id'),
            self.payload.get('exp_version'), self.payload.get('state_name'),
            self.payload.get('session_id'),
            self.payload.get('time_spent_in_state_secs'))
        self.render_json({})


class ReaderFeedbackHandler(base.BaseHandler):
    """Submits feedback from the reader."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
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

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        event_services.StartExplorationEventHandler.record(
            exploration_id, self.payload.get('version'),
            self.payload.get('state_name'),
            self.payload.get('session_id'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)
        self.render_json({})


class ExplorationActualStartEventHandler(base.BaseHandler):
    """Tracks a learner actually starting an exploration. These are the learners
    who traverse past the initial state.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests."""
        event_services.ExplorationActualStartEventHandler.record(
            exploration_id, self.payload.get('exploration_version'),
            self.payload.get('state_name'), self.payload.get('session_id'))
        self.render_json({})


class SolutionHitEventHandler(base.BaseHandler):
    """Tracks a learner clicking on the 'View Solution' button."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests."""
        event_services.SolutionHitEventHandler.record(
            exploration_id, self.payload.get('exploration_version'),
            self.payload.get('state_name'), self.payload.get('session_id'),
            self.payload.get('time_spent_in_state_secs'))
        self.render_json({})


class ExplorationCompleteEventHandler(base.BaseHandler):
    """Tracks a learner completing an exploration.

    The state name recorded should be a state with a terminal interaction.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
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

        if user_id:
            learner_progress_services.mark_exploration_as_completed(
                user_id, exploration_id)

        if user_id and collection_id:
            collection_services.record_played_exploration_in_collection_context(
                user_id, collection_id, exploration_id)
            next_exp_id_to_complete = (
                collection_services.get_next_exploration_id_to_complete_by_user( # pylint: disable=line-too-long
                    user_id, collection_id))

            if not next_exp_id_to_complete:
                learner_progress_services.mark_collection_as_completed(
                    user_id, collection_id)
            else:
                learner_progress_services.mark_collection_as_incomplete(
                    user_id, collection_id)

        self.render_json(self.values)


class ExplorationMaybeLeaveHandler(base.BaseHandler):
    """Tracks a learner leaving an exploration without completing it.

    The state name recorded should be a state with a non-terminal interaction.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_play_exploration
    def post(self, exploration_id):
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        version = self.payload.get('version')
        state_name = self.payload.get('state_name')
        user_id = self.user_id
        collection_id = self.payload.get('collection_id')

        if user_id:
            learner_progress_services.mark_exploration_as_incomplete(
                user_id, exploration_id, state_name, version)

        if user_id and collection_id:
            learner_progress_services.mark_collection_as_incomplete(
                user_id, collection_id)

        event_services.MaybeLeaveExplorationEventHandler.record(
            exploration_id,
            version,
            state_name,
            self.payload.get('session_id'),
            self.payload.get('client_time_spent_in_secs'),
            self.payload.get('params'),
            feconf.PLAY_TYPE_NORMAL)
        self.render_json(self.values)


class LearnerIncompleteActivityHandler(base.BaseHandler):
    """Handles operations related to the activities in the incomplete list of
    the user.
    """
    @acl_decorators.can_access_learner_dashboard
    def delete(self, activity_type, activity_id):
        """Removes exploration or collection from incomplete list.

        Args:
            activity_type: str. The activity type. Currently, it can take values
                "exploration" or "collection".
            activity_id: str. The ID of the activity to be deleted.
        """
        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
            learner_progress_services.remove_exp_from_incomplete_list(
                self.user_id, activity_id)
        elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
            learner_progress_services.remove_collection_from_incomplete_list(
                self.user_id, activity_id)

        self.render_json(self.values)


class RatingHandler(base.BaseHandler):
    """Records the rating of an exploration submitted by a user.

    Note that this represents ratings submitted on completion of the
    exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
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

    @acl_decorators.can_rate_exploration
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

    # TODO(bhenning): Move the recommendation selection logic & related tests to
    # the domain layer as service methods or to the frontend to reduce the
    # amount of logic needed in this handler.

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
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

        system_recommended_exp_ids = []
        next_exp_id = None

        if collection_id:
            if self.user_id:
                next_exp_id = (
                    collection_services.get_next_exploration_id_to_complete_by_user(  # pylint: disable=line-too-long
                        self.user_id, collection_id))
            else:
                collection = collection_services.get_collection_by_id(
                    collection_id)
                next_exp_id = (
                    collection.get_next_exploration_id_in_sequence(
                        exploration_id))
        elif include_system_recommendations:
            system_chosen_exp_ids = (
                recommendations_services.get_exploration_recommendations(
                    exploration_id))
            filtered_exp_ids = list(
                set(system_chosen_exp_ids) - set(author_recommended_exp_ids))
            system_recommended_exp_ids = random.sample(
                filtered_exp_ids,
                min(MAX_SYSTEM_RECOMMENDATIONS, len(filtered_exp_ids)))

        recommended_exp_ids = set(
            author_recommended_exp_ids + system_recommended_exp_ids)
        if next_exp_id is not None:
            recommended_exp_ids.add(next_exp_id)

        self.values.update({
            'summaries': (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    recommended_exp_ids)),
        })
        self.render_json(self.values)


class FlagExplorationHandler(base.BaseHandler):
    """Handles operations relating to learner flagging of explorations."""

    @acl_decorators.can_flag_exploration
    def post(self, exploration_id):
        """Handles POST requests.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        moderator_services.enqueue_flag_exploration_email_task(
            exploration_id,
            self.payload.get('report_text'),
            self.user_id)
        self.render_json(self.values)
