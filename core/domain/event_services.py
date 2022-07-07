# coding: utf-8
#
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

"""Classes for handling events."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import feedback_services
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import taskqueue_services
from core.platform import models

(feedback_models, stats_models, user_models) = models.Registry.import_models([
    models.NAMES.feedback, models.NAMES.statistics, models.NAMES.user])

transaction_services = models.Registry.import_transaction_services()


class BaseEventHandler:
    """Base class for event dispatchers."""

    # A string denoting the type of the event. Should be specified by
    # subclasses and considered immutable.
    EVENT_TYPE = None

    @classmethod
    def _handle_event(cls, *args, **kwargs):
        """Perform in-request processing of an incoming event."""
        raise NotImplementedError(
            'Subclasses of BaseEventHandler should implement the '
            '_handle_event() method, using explicit arguments '
            '(no *args or **kwargs).')

    @classmethod
    def record(cls, *args, **kwargs):
        """Process incoming events.

        Callers of event handlers should call this method, not _handle_event().
        """
        cls._handle_event(*args, **kwargs)


class StatsEventsHandler(BaseEventHandler):
    """Event handler for incremental update of analytics model using aggregated
    stats data.
    """

    EVENT_TYPE = feconf.EVENT_TYPE_ALL_STATS

    @classmethod
    def _is_latest_version(cls, exp_id, exp_version):
        """Verifies whether the exploration version for the stats to be stored
        corresponds to the latest version of the exploration.
        """
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        return exploration.version == exp_version

    @classmethod
    def _handle_event(cls, exploration_id, exp_version, aggregated_stats):
        if 'undefined' in aggregated_stats['state_stats_mapping']:
            logging.error(
                'Aggregated stats contains an undefined state name: %s'
                % list(aggregated_stats['state_stats_mapping'].keys()))
            return
        if cls._is_latest_version(exploration_id, exp_version):
            taskqueue_services.defer(
                taskqueue_services.FUNCTION_ID_UPDATE_STATS,
                taskqueue_services.QUEUE_NAME_STATS,
                exploration_id,
                exp_version, aggregated_stats)


class AnswerSubmissionEventHandler(BaseEventHandler):
    """Event handler for recording answer submissions."""

    EVENT_TYPE = feconf.EVENT_TYPE_ANSWER_SUBMITTED

    @classmethod
    def _handle_event(
            cls, exploration_id, exploration_version, state_name,
            interaction_id, answer_group_index, rule_spec_index,
            classification_categorization, session_id, time_spent_in_secs,
            params, normalized_answer):
        """Records an event when an answer triggers a rule. The answer recorded
        here is a Python-representation of the actual answer submitted by the
        user.
        """
        # TODO(sll): Escape these args?
        stats_services.record_answer(
            exploration_id, exploration_version, state_name, interaction_id,
            stats_domain.SubmittedAnswer(
                normalized_answer, interaction_id, answer_group_index,
                rule_spec_index, classification_categorization, params,
                session_id, time_spent_in_secs))

        feedback_is_useful = (
            classification_categorization != (
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION))

        stats_models.AnswerSubmittedEventLogEntryModel.create(
            exploration_id, exploration_version, state_name, session_id,
            time_spent_in_secs, feedback_is_useful)


class ExplorationActualStartEventHandler(BaseEventHandler):
    """Event handler for recording exploration actual start events."""

    EVENT_TYPE = feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id):
        stats_models.ExplorationActualStartEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id)


class SolutionHitEventHandler(BaseEventHandler):
    """Event handler for recording solution hit events."""

    EVENT_TYPE = feconf.EVENT_TYPE_SOLUTION_HIT

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        stats_models.SolutionHitEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class StartExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration start events."""

    EVENT_TYPE = feconf.EVENT_TYPE_START_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id, params,
            play_type):
        stats_models.StartExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, params,
            play_type)
        handle_exploration_start(exp_id)


class MaybeLeaveExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration leave events."""

    EVENT_TYPE = feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type):
        stats_models.MaybeLeaveExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


class CompleteExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration completion events."""

    EVENT_TYPE = feconf.EVENT_TYPE_COMPLETE_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type):
        stats_models.CompleteExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


class RateExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration rating events."""

    EVENT_TYPE = feconf.EVENT_TYPE_RATE_EXPLORATION

    @classmethod
    def _handle_event(cls, exp_id, user_id, rating, old_rating):
        stats_models.RateExplorationEventLogEntryModel.create(
            exp_id, user_id, rating, old_rating)
        handle_exploration_rating(exp_id, rating, old_rating)


class StateHitEventHandler(BaseEventHandler):
    """Event handler for recording state hit events."""

    EVENT_TYPE = feconf.EVENT_TYPE_STATE_HIT

    # TODO(sll): Remove params before sending this event to the jobs taskqueue.
    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id,
            params, play_type):
        stats_models.StateHitEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            params, play_type)


class StateCompleteEventHandler(BaseEventHandler):
    """Event handler for recording state complete events."""

    EVENT_TYPE = feconf.EVENT_TYPE_STATE_COMPLETED

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        stats_models.StateCompleteEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class LeaveForRefresherExpEventHandler(BaseEventHandler):
    """Event handler for recording "leave for refresher exploration" events."""

    EVENT_TYPE = feconf.EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP

    @classmethod
    def _handle_event(
            cls, exp_id, refresher_exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        stats_models.LeaveForRefresherExplorationEventLogEntryModel.create(
            exp_id, refresher_exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class FeedbackThreadCreatedEventHandler(BaseEventHandler):
    """Event handler for recording new feedback thread creation events."""

    EVENT_TYPE = feconf.EVENT_TYPE_NEW_THREAD_CREATED

    @classmethod
    def _handle_event(cls, exp_id):
        feedback_services.handle_new_thread_created(exp_id)


class FeedbackThreadStatusChangedEventHandler(BaseEventHandler):
    """Event handler for recording reopening feedback thread events."""

    EVENT_TYPE = feconf.EVENT_TYPE_THREAD_STATUS_CHANGED

    @classmethod
    def _handle_event(cls, exp_id, old_status, new_status):
        feedback_services.handle_thread_status_changed(
            exp_id, old_status, new_status)


def handle_exploration_start(exp_id):
    """Handles a user's start of an exploration.

    Args:
        exp_id: str. The exploration which has been started.
    """
    exp_summary = exp_fetchers.get_exploration_summary_by_id(
        exp_id, strict=False
    )
    if exp_summary is not None:
        for user_id in exp_summary.owner_ids:
            _increment_total_plays_count_transactional(user_id)


def handle_exploration_rating(exp_id, rating, old_rating):
    """Handles a new rating for an exploration.

    Args:
        exp_id: str. The exploration which has been rated.
        rating: int. The new rating of the exploration.
        old_rating: int. The old rating of the exploration before
            refreshing.
    """
    exp_summary = exp_fetchers.get_exploration_summary_by_id(
        exp_id, strict=False
    )
    if exp_summary is not None:
        for user_id in exp_summary.owner_ids:
            _refresh_average_ratings_transactional(user_id, rating, old_rating)


@transaction_services.run_in_transaction_wrapper
def _refresh_average_ratings_transactional(user_id, new_rating, old_rating):
    """Refreshes the average rating for a user.

    Args:
        user_id: str. The id of the user.
        new_rating: int. The new rating of the exploration.
        old_rating: int|None. The old rating of the exploration before
            refreshing, or None if the exploration hasn't been rated by the user
            yet.
    """
    user_stats_model = user_models.UserStatsModel.get(user_id, strict=False)
    if user_stats_model is None:
        user_models.UserStatsModel(
            id=user_id, average_ratings=new_rating, num_ratings=1).put()
        return

    num_ratings = user_stats_model.num_ratings
    average_ratings = user_stats_model.average_ratings
    if average_ratings is None:
        average_ratings = new_rating
        num_ratings += 1
    else:
        sum_of_ratings = (average_ratings * num_ratings) + new_rating
        if old_rating is None:
            num_ratings += 1
        else:
            sum_of_ratings -= old_rating
        average_ratings = sum_of_ratings / float(num_ratings)
    user_stats_model.average_ratings = average_ratings
    user_stats_model.num_ratings = num_ratings
    user_stats_model.update_timestamps()
    user_stats_model.put()


@transaction_services.run_in_transaction_wrapper
def _increment_total_plays_count_transactional(user_id):
    """Increments the total plays count of the exploration.

    Args:
        user_id: str. The id of the user.
    """
    user_stats_model = user_models.UserStatsModel.get(user_id, strict=False)
    if user_stats_model is None:
        user_models.UserStatsModel(id=user_id, total_plays=1).put()
    else:
        user_stats_model.total_plays += 1
        user_stats_model.update_timestamps()
        user_stats_model.put()
