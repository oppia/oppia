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

from typing import Any, Callable, Dict, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import stats_models
    from mypy_imports import transaction_services
    from mypy_imports import user_models

(stats_models, user_models) = models.Registry.import_models([
    models.Names.STATISTICS, models.Names.USER
])

transaction_services = models.Registry.import_transaction_services()


class BaseEventHandler:
    """Base class for event dispatchers."""

    # A string denoting the type of the event. Should be specified by
    # subclasses and considered immutable.
    EVENT_TYPE: Optional[str] = None

    # Here, `_handle_event` is added only to inform MyPy that
    # method `_handle_event` is always going to exists and it
    # has type Callable[..., None].
    _handle_event: Callable[..., None]

    # TODO(#16047): Here we use type Any because in child classes this
    # method can be redefined with any number of named and keyword arguments
    # with different kinds of types.
    @classmethod
    def record(cls, *args: Any, **kwargs: Any) -> None:
        """Process incoming events.

        Callers of event handlers should call this method, not _handle_event().

        Raises:
            NotImplementedError. The method _handle_event is not implemented in
                derived classes.
        """
        if getattr(cls, '_handle_event', None) is None:
            raise NotImplementedError(
                'Subclasses of BaseEventHandler should implement the '
                '_handle_event() method, using explicit arguments '
                '(no *args or **kwargs).'
            )

        cls._handle_event(*args, **kwargs)


class StatsEventsHandler(BaseEventHandler):
    """Event handler for incremental update of analytics model using aggregated
    stats data.
    """

    EVENT_TYPE: str = feconf.EVENT_TYPE_ALL_STATS

    @classmethod
    def _is_latest_version(cls, exp_id: str, exp_version: int) -> bool:
        """Verifies whether the exploration version for the stats to be stored
        corresponds to the latest version of the exploration.
        """
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        return exploration.version == exp_version

    @classmethod
    def _handle_event(
        cls,
        exploration_id: str,
        exp_version: int,
        aggregated_stats: Dict[str, Dict[str, Union[int, str]]]
    ) -> None:
        """Handle events for incremental update to analytics models using
        aggregated stats data.
        """
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

    EVENT_TYPE: str = feconf.EVENT_TYPE_ANSWER_SUBMITTED

    @classmethod
    def _handle_event(
        cls,
        exploration_id: str,
        exploration_version: int,
        state_name: str,
        interaction_id: str,
        answer_group_index: int,
        rule_spec_index: int,
        classification_categorization: str,
        session_id: str,
        time_spent_in_secs: float,
        params: Dict[str, Union[str, int]],
        normalized_answer: str
    ) -> None:
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

    EVENT_TYPE: str = feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION

    @classmethod
    def _handle_event(
        cls, exp_id: str, exp_version: int, state_name: str, session_id: str
    ) -> None:
        """Perform in-request processing of recording exploration actual start
        events.
        """
        stats_models.ExplorationActualStartEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id)


class SolutionHitEventHandler(BaseEventHandler):
    """Event handler for recording solution hit events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_SOLUTION_HIT

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent_in_state_secs: float
    ) -> None:
        """Perform in-request processing of recording solution hit events."""
        stats_models.SolutionHitEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class StartExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration start events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_START_EXPLORATION

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        params: Dict[str, str],
        play_type: str
    ) -> None:
        """Perform in-request processing of recording exploration start
        events.
        """
        stats_models.StartExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, params,
            play_type)
        handle_exploration_start(exp_id)


class MaybeLeaveExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration leave events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent: float,
        params: Dict[str, str],
        play_type: str
    ) -> None:
        """Perform in-request processing of recording exploration leave
        events.
        """
        stats_models.MaybeLeaveExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


class CompleteExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration completion events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_COMPLETE_EXPLORATION

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent: float,
        params: Dict[str, str],
        play_type: str
    ) -> None:
        """Perform in-request processing of recording exploration completion
        events.
        """
        stats_models.CompleteExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


class RateExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration rating events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_RATE_EXPLORATION

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        user_id: str,
        rating: int,
        old_rating: int
    ) -> None:
        """Perform in-request processing of recording exploration rating
        events.
        """
        stats_models.RateExplorationEventLogEntryModel.create(
            exp_id, user_id, rating, old_rating)
        handle_exploration_rating(exp_id, rating, old_rating)


class StateHitEventHandler(BaseEventHandler):
    """Event handler for recording state hit events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_STATE_HIT

    # TODO(sll): Remove params before sending this event to the jobs taskqueue.
    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        params: Dict[str, str],
        play_type: str
    ) -> None:
        """Perform in-request processing of recording state hit events."""
        stats_models.StateHitEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            params, play_type)


class StateCompleteEventHandler(BaseEventHandler):
    """Event handler for recording state complete events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_STATE_COMPLETED

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent_in_state_secs: float
    ) -> None:
        """Perform in-request processing of recording state complete events."""
        stats_models.StateCompleteEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class LeaveForRefresherExpEventHandler(BaseEventHandler):
    """Event handler for recording "leave for refresher exploration" events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        refresher_exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent_in_state_secs: float
    ) -> None:
        """Perform in-request processing of recording "leave for refresher
        exploration" events.
        """
        stats_models.LeaveForRefresherExplorationEventLogEntryModel.create(
            exp_id, refresher_exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class FeedbackThreadCreatedEventHandler(BaseEventHandler):
    """Event handler for recording new feedback thread creation events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_NEW_THREAD_CREATED

    @classmethod
    def _handle_event(cls, exp_id: str) -> None:
        """Perform in-request processing of recording new feedback thread
        creation events.
        """
        feedback_services.handle_new_thread_created(exp_id)


class FeedbackThreadStatusChangedEventHandler(BaseEventHandler):
    """Event handler for recording reopening feedback thread events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_THREAD_STATUS_CHANGED

    @classmethod
    def _handle_event(
        cls,
        exp_id: str,
        old_status: str,
        new_status: str
    ) -> None:
        """Perform in-request processing of recording reopening feedback
        thread events.
        """
        feedback_services.handle_thread_status_changed(
            exp_id, old_status, new_status)


def handle_exploration_start(exp_id: str) -> None:
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


def handle_exploration_rating(
    exp_id: str, rating: int, old_rating: Optional[int]
) -> None:
    """Handles a new rating for an exploration.

    Args:
        exp_id: str. The exploration which has been rated.
        rating: int. The new rating of the exploration.
        old_rating: int|None. The old rating of the exploration before
            refreshing, or None if the exploration hasn't been rated by the user
            yet.
    """
    exp_summary = exp_fetchers.get_exploration_summary_by_id(
        exp_id, strict=False
    )
    if exp_summary is not None:
        for user_id in exp_summary.owner_ids:
            _refresh_average_ratings_transactional(user_id, rating, old_rating)


@transaction_services.run_in_transaction_wrapper
def _refresh_average_ratings_transactional(
    user_id: str, new_rating: int, old_rating: Optional[int]
) -> None:
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
def _increment_total_plays_count_transactional(user_id: str) -> None:
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
