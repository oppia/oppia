# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Commands for feedback thread and message operations."""

from __future__ import annotations

import datetime
import itertools

from core import feconf
from core.domain import email_manager
from core.domain import feedback_domain
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models

from typing import Dict, Final, List, Optional, Tuple, Type, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import feedback_models
    from mypy_imports import question_models
    from mypy_imports import skill_models
    from mypy_imports import suggestion_models
    from mypy_imports import topic_models
    from mypy_imports import transaction_services

(
    base_models,
    exp_models,
    feedback_models,
    question_models,
    skill_models,
    suggestion_models,
    topic_models
) = models.Registry.import_models([
    models.Names.BASE_MODEL,
    models.Names.EXPLORATION,
    models.Names.FEEDBACK,
    models.Names.QUESTION,
    models.Names.SKILL,
    models.Names.SUGGESTION,
    models.Names.TOPIC
])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

DEFAULT_SUGGESTION_THREAD_SUBJECT: Final = 'Suggestion from a learner'
DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE: Final = ''

TARGET_TYPE_TO_TARGET_MODEL: Dict[str, Type[base_models.BaseModel]] = {
    feconf.ENTITY_TYPE_EXPLORATION: exp_models.ExplorationModel,
    feconf.ENTITY_TYPE_QUESTION: question_models.QuestionModel,
    feconf.ENTITY_TYPE_SKILL: skill_models.SkillModel,
    feconf.ENTITY_TYPE_TOPIC: topic_models.TopicModel
}


def get_exp_id_from_thread_id(thread_id: str) -> str:
    """Returns the exploration_id part of the thread_id.

    TODO(#8370): Once feedback threads are generalized, this function needs to
    be updated to get the id from any general entity, not just explorations. At
    the moment, it still assumes that the thread id is associated to an
    exploration.

    Args:
        thread_id: str. The id of the thread.

    Returns:
        str. The exploration id part of the thread_id.
    """
    return thread_id.split('.')[1]


def _create_models_for_thread_and_first_message(
    entity_type: str,
    entity_id: str,
    original_author_id: Optional[str],
    subject: str,
    text: str,
    has_suggestion: bool
) -> str:
    """Creates a feedback thread and its first message.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        original_author_id: str|None. The author id who starts this thread, or
            None if the author is anonymous.
        subject: str. The subject of this thread.
        text: str. The text of the feedback message. This may be ''.
        has_suggestion: bool. Whether this thread has a related learner
            suggestion.

    Returns:
        str. The id of the new thread.
    """
    thread_id = (
        feedback_models.GeneralFeedbackThreadModel.generate_new_thread_id(
            entity_type, entity_id))
    thread = feedback_models.GeneralFeedbackThreadModel.create(thread_id)
    thread.entity_type = entity_type
    thread.entity_id = entity_id
    thread.original_author_id = original_author_id
    # The feedback analytics jobs rely on the thread status being set to 'open'
    # when a new thread is created. If this is changed, changes need to be made
    # there as well.
    thread.status = feedback_models.STATUS_CHOICES_OPEN
    thread.subject = subject
    thread.has_suggestion = has_suggestion
    thread.message_count = 0
    thread.update_timestamps()
    thread.put()
    create_message(
        thread_id, original_author_id, feedback_models.STATUS_CHOICES_OPEN,
        subject, text)
    return thread_id


def create_thread(
    entity_type: str,
    entity_id: str,
    original_author_id: Optional[str],
    subject: str,
    text: str,
    has_suggestion: bool = False
) -> str:
    """Creates a thread and its first message.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        original_author_id: str|None. The author id who starts this thread, or
            None if the author is anonymous.
        subject: str. The subject of this thread.
        text: str. The text of the feedback message. This may be ''.
        has_suggestion: bool. Whether the thread has a suggestion attached to
            it.

    Returns:
        str. The id of the new thread.
    """
    return _create_models_for_thread_and_first_message(
        entity_type, entity_id, original_author_id, subject, text,
        has_suggestion)


def create_message(
    thread_id: str,
    author_id: Optional[str],
    updated_status: Optional[str],
    updated_subject: Optional[str],
    text: str,
    received_via_email: bool = False,
    should_send_email: bool = True
) -> feedback_domain.FeedbackMessage:
    """Creates a new message for the thread and subscribes the author to the
    thread.

    Args:
        thread_id: str. The thread id the message belongs to.
        author_id: str|None. The author id who creates this message, or None
            if the author is anonymous.
        updated_status: str|None. One of STATUS_CHOICES. New thread status.
            Must be supplied if this is the first message of a thread. For the
            rest of the thread, should exist only when the status changes.
        updated_subject: str|None. New thread subject. Must be supplied if this
            is the first message of a thread. For the rest of the thread, should
            exist only when the subject changes.
        text: str. The text of the feedback message. This may be ''.
        received_via_email: bool. Whether new message is received via email or
            web.
        should_send_email: bool. Whether the new message(s) need to be added to
            the email buffer.

    Returns:
        FeedbackMessage. The domain object representing the new message added
        in the datastore.

    Raises:
        Exception. GeneralFeedbackThreadModel entity not found.
    """
    return create_messages(
        [thread_id], author_id, updated_status, updated_subject, text,
        received_via_email=received_via_email,
        should_send_email=should_send_email)[0]


def create_messages(
    thread_ids: List[str],
    author_id: Optional[str],
    updated_status: Optional[str],
    updated_subject: Optional[str],
    text: str,
    received_via_email: bool = False,
    should_send_email: bool = True
) -> List[feedback_domain.FeedbackMessage]:
    """Creates a new message for each of the distinct threads in thread_ids and
    for each message, subscribes the author to the thread.

    Args:
        thread_ids: list(str). The thread ids to append the messages to.
        author_id: str|None. The id of the author who creates the messages, or
            None if the author is anonymous.
        updated_status: str|None. One of STATUS_CHOICES. Applied to each thread.
            Must be supplied if this is the first message of the threads.
            Otherwise, this property should only exist when the status
            changes.
        updated_subject: str|None. New thread subject. Applied to each thread.
            Must be supplied if this is the first message of the threads.
            Otherwise, this property should only exist when the subject changes.
        text: str. The text of the feedback message. This may be ''.
        received_via_email: bool. Whether the new message(s) are received via
            email or web.
        should_send_email: bool. Whether the new message(s) need to be added to
            the email buffer.

    Returns:
        list(FeedbackMessage). The domain objects representing the new messages
        added in the datastore.

    Raises:
        Exception. Thread_ids must be distinct.
        Exception. One or more GeneralFeedbackThreadModel entities not found.
    """
    from core.domain import event_services

    # Check that the thread_ids are distinct.
    if len(set(thread_ids)) != len(thread_ids):
        raise Exception(
            'Thread ids must be distinct when calling create_messsages.')

    # Get the threads at the outset, in order to check that there are models
    # corresponding to each of the thread_ids.
    thread_models_with_none = (
        feedback_models.GeneralFeedbackThreadModel.get_multi(
            thread_ids
        )
    )
    thread_models: List[feedback_models.GeneralFeedbackThreadModel] = []
    thread_ids_that_do_not_have_models = []
    for index, thread_model in enumerate(thread_models_with_none):
        if thread_model is None:
            thread_ids_that_do_not_have_models.append(thread_ids[index])
        else:
            thread_models.append(thread_model)
    if len(thread_ids_that_do_not_have_models) > 0:
        multiple_thread_models_are_missing = (
            len(thread_ids_that_do_not_have_models) > 1
        )
        raise Exception(
            'Thread%s belonging to the GeneralFeedbackThreadModel class with '
            'id%s:[%s] %s not found.' % (
                's' if multiple_thread_models_are_missing else '',
                's' if multiple_thread_models_are_missing else '',
                ' '.join(thread_ids_that_do_not_have_models),
                'were' if multiple_thread_models_are_missing else 'was'
            )
        )

    # Get the corresponding message ids, which are required for message
    # creation.
    message_ids = (
        feedback_models.GeneralFeedbackMessageModel.get_message_counts(
            thread_ids)
    )

    # Create a list of FullyQualifiedMessageIdentifier objects so that each
    # (thread_id, message_id) pair is kept together.
    message_identifiers = []
    for thread_id, message_id in zip(thread_ids, message_ids):
        message_identifiers.append(
            feedback_domain.FullyQualifiedMessageIdentifier(
                thread_id, message_id))

    # Create the GeneralFeedbackMessageModel instances.
    message_models = feedback_models.GeneralFeedbackMessageModel.create_multi(
        message_identifiers)

    # Update the message instances.
    for index, message_model in enumerate(message_models):
        message_model.thread_id = thread_ids[index]
        message_model.message_id = message_ids[index]
        message_model.author_id = author_id
        message_model.text = text
        message_model.received_via_email = received_via_email
        # Get the corresponding thread in storage.
        thread_model = thread_models[index]
        if updated_status:
            message_model.updated_status = updated_status
            if message_model.message_id == 0:
                # New thread.
                if thread_model.entity_type == feconf.ENTITY_TYPE_EXPLORATION:
                    event_services.FeedbackThreadCreatedEventHandler.record(
                        thread_model.entity_id)
            else:
                # Thread status changed.
                if thread_model.entity_type == feconf.ENTITY_TYPE_EXPLORATION:
                    (
                        event_services
                        .FeedbackThreadStatusChangedEventHandler
                        .record(
                            thread_model.entity_id, thread_model.status,
                            updated_status)
                    )
        if updated_subject:
            message_model.updated_subject = updated_subject
    feedback_models.GeneralFeedbackMessageModel.update_timestamps_multi(
        message_models)
    feedback_models.GeneralFeedbackMessageModel.put_multi(message_models)

    # Update the message data cache of the threads.
    for thread_model in thread_models:
        thread_model.message_count += 1
        if text:
            thread_model.last_nonempty_message_text = text
            thread_model.last_nonempty_message_author_id = author_id

    # We do a put() even if the status and subject are not updated, so that the
    # last_updated time of the threads reflects the last time a message was
    # added to it.
    old_statuses = [thread_model.status for thread_model in thread_models]
    new_statuses = old_statuses
    if updated_status or updated_subject:
        new_statuses = []
        for index, thread_model in enumerate(thread_models):
            # Can't be the first thread.
            if message_ids[index] != 0:
                if updated_status and (updated_status != thread_model.status):
                    thread_model.status = updated_status
                if updated_subject and (
                        updated_subject != thread_model.subject):
                    thread_model.subject = updated_subject
            new_statuses.append(thread_model.status)
    feedback_models.GeneralFeedbackThreadModel.update_timestamps_multi(
        thread_models)
    feedback_models.GeneralFeedbackThreadModel.put_multi(thread_models)

    # For each thread, we do a put on the suggestion linked (if it exists) to
    # the thread, so that the last_updated time changes to show that there is
    # activity in the thread.
    thread_ids_that_have_linked_suggestions = []
    for thread_model in thread_models:
        if thread_model.has_suggestion:
            thread_ids_that_have_linked_suggestions.append(thread_model.id)
    general_suggestion_models = (
        suggestion_models.GeneralSuggestionModel.get_multi(
            thread_ids_that_have_linked_suggestions)
    )
    suggestion_models_to_update = []
    for suggestion_model in general_suggestion_models:
        # As the thread is created before the suggestion, for the first message
        # we need not update the suggestion.
        if suggestion_model:
            suggestion_models_to_update.append(suggestion_model)
    suggestion_models.GeneralSuggestionModel.update_timestamps_multi(
        suggestion_models_to_update)
    suggestion_models.GeneralSuggestionModel.put_multi(
        suggestion_models_to_update)

    if (feconf.CAN_SEND_EMAILS and (
            feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS and
            author_id is not None and
            user_services.is_user_registered(author_id)) and
            # TODO(#12079): Figure out a better way to avoid sending feedback
            # thread emails for contributor dashboard suggestions.
            (len(text) > 0 or old_statuses[index] != new_statuses[index]) and
            should_send_email):
        for index, thread_model in enumerate(thread_models):
            _add_message_to_email_buffer(
                author_id, thread_model.id, message_ids[index],
                len(text), old_statuses[index], new_statuses[index])

    if author_id:
        subscription_services.subscribe_to_threads(author_id, thread_ids)
        add_message_ids_to_read_by_list(author_id, message_identifiers)

    # Convert the GeneralFeedbackMessageModels into a list of FeedbackMessage
    # domain objects.
    feedback_messages = [
        _get_message_from_model(message_model) for message_model in
        message_models
    ]

    return feedback_messages


def _get_threads_user_info_keys(
    thread_ids: List[str]
) -> List[datastore_services.Key]:
    """Gets the feedback thread user model keys belonging to thread.

    Args:
        thread_ids: list(str). The ids of the threads.

    Returns:
        list(datastore_services.Key). The keys of the feedback thread user
        model.
    """
    if thread_ids:
        datastore_keys = feedback_models.GeneralFeedbackThreadUserModel.query(
            feedback_models.GeneralFeedbackThreadUserModel.thread_id.IN(
                thread_ids)
        ).fetch(keys_only=True)
        # Here, we are narrowing down the type from sequence to list.
        assert isinstance(datastore_keys, list)
        return datastore_keys
    else:
        return []


def delete_threads_for_multiple_entities(
    entity_type: str, entity_ids: List[str]
) -> None:
    """Deletes a thread, its messages and thread user models. When the thread
    belongs to exploration deletes feedback analytics. When the thread has a
    suggestion deletes the suggestion.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_ids: list(str). The ids of the entities.
    """
    threads = []
    for entity_id in entity_ids:
        threads.extend(get_threads(entity_type, entity_id))

    model_keys = []
    for thread in threads:
        for message in get_messages(thread.id):
            model_keys.append(
                datastore_services.Key(
                    feedback_models.GeneralFeedbackMessageModel, message.id)
            )
        model_keys.append(
            datastore_services.Key(
                feedback_models.GeneralFeedbackThreadModel, thread.id)
        )
        if thread.has_suggestion:
            model_keys.append(
                datastore_services.Key(
                    suggestion_models.GeneralSuggestionModel, thread.id)
            )

    model_keys += _get_threads_user_info_keys([thread.id for thread in threads])

    if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
        for entity_id in entity_ids:
            model_keys.append(
                datastore_services.Key(
                    feedback_models.FeedbackAnalyticsModel, entity_id)
            )

    datastore_services.delete_multi(model_keys)


def update_messages_read_by_the_user(
    user_id: str, thread_id: str, message_ids: List[int]
) -> None:
    """Replaces the list of message ids read by the message ids given to the
    function.

    Args:
        user_id: str. The id of the user reading the messages.
        thread_id: str. The id of the thread.
        message_ids: list(int). The ids of the messages in the thread read by
            the user.
    """
    feedback_thread_user_model = (
        feedback_models.GeneralFeedbackThreadUserModel.get(
            user_id, thread_id) or
        feedback_models.GeneralFeedbackThreadUserModel.create(
            user_id, thread_id))
    feedback_thread_user_model.message_ids_read_by_user = message_ids
    feedback_thread_user_model.update_timestamps()
    feedback_thread_user_model.put()


def add_message_ids_to_read_by_list(
    user_id: str,
    message_identifiers: List[feedback_domain.FullyQualifiedMessageIdentifier]
) -> None:
    """Adds the given message IDs to the list of message IDs read by the user.

    Args:
        user_id: str. The id of the user reading the messages.
        message_identifiers: list(FullyQualifiedMessageIdentifier). Each
            message_identifier contains a thread_id and the corresponding
            message_id that will be added to the thread's list of message IDs
            read by the user.
    """
    # Extract the thread_ids and message_ids from the
    # FullyQualifiedMessageIdentifier objects.
    thread_ids = [
        message_identifier.thread_id for message_identifier
        in message_identifiers
    ]
    message_ids = [
        message_identifier.message_id for message_identifier
        in message_identifiers
    ]

    # Get all of the GeneralFeedbackThreadUserModels that already exist. These
    # models will be None if a GeneralFeedbackThreadUserModel does not exist
    # for the user_id and thread_id yet.
    current_feedback_thread_user_models_with_possible_nones = (
        feedback_models.GeneralFeedbackThreadUserModel.get_multi(
            user_id, thread_ids))

    # Keep track of which thread_ids do not have feedback thread user models
    # yet.
    thread_ids_missing_user_models = []
    # Keep track of the message_ids corresponding to the thread_ids that do not
    # have feedback thread user models yet.
    message_ids_for_missing_user_models = []
    # Keep track of the feedback thread user models that already exist and
    # aren't None. This list will be used when we update the datastore.
    current_feedback_thread_user_models = []

    for index, feedback_thread_user_model in enumerate(
            current_feedback_thread_user_models_with_possible_nones):
        if feedback_thread_user_model is None:
            thread_ids_missing_user_models.append(thread_ids[index])
            message_ids_for_missing_user_models.append(message_ids[index])
        else:
            current_feedback_thread_user_models.append(
                feedback_thread_user_model)
            # Add the message_id to the messages read by the user.
            feedback_thread_user_model.message_ids_read_by_user.append(
                message_ids[index])

    # Create the new GeneralFeedbackThreadUserModels for each of the thread_ids
    # that do not have a model yet.
    new_feedback_thread_user_models = []
    if thread_ids_missing_user_models:
        new_feedback_thread_user_models = (
            feedback_models.GeneralFeedbackThreadUserModel.create_multi(
                user_id, thread_ids_missing_user_models)
        )

    # For each of the new models, append the message_id to the
    # message_ids_read_by_user property.
    for index, feedback_thread_user_model in enumerate(
            new_feedback_thread_user_models):
        feedback_thread_user_model.message_ids_read_by_user.append(
            message_ids_for_missing_user_models[index]
        )

    # Update both the new and previously existing models in the datastore.
    current_feedback_thread_user_models.extend(
        new_feedback_thread_user_models)
    feedback_models.GeneralFeedbackThreadUserModel.update_timestamps_multi(
        current_feedback_thread_user_models)
    feedback_models.GeneralFeedbackThreadUserModel.put_multi(
        current_feedback_thread_user_models)


def _get_message_from_model(
    message_model: feedback_models.GeneralFeedbackMessageModel
) -> feedback_domain.FeedbackMessage:
    """Converts the FeedbackMessageModel to a FeedbackMessage.

    Args:
        message_model: FeedbackMessageModel. The FeedbackMessageModel to be
            converted.

    Returns:
        FeedbackMessage. The resulting FeedbackMessage domain object.
    """
    return feedback_domain.FeedbackMessage(
        message_model.id, message_model.thread_id, message_model.message_id,
        message_model.author_id, message_model.updated_status,
        message_model.updated_subject, message_model.text,
        message_model.created_on, message_model.last_updated,
        message_model.received_via_email)


def get_messages(thread_id: str) -> List[feedback_domain.FeedbackMessage]:
    """Fetches all messages of the given thread.

    Args:
        thread_id: str. The id of the thread.

    Returns:
        list(FeedbackMessage). Contains all the messages in the thread.
    """
    return [
        _get_message_from_model(model)
        for model in feedback_models.GeneralFeedbackMessageModel.get_messages(
            thread_id)
    ]


def get_message(
    thread_id: str, message_id: int
) -> feedback_domain.FeedbackMessage:
    """Fetches the message indexed by thread_id and message_id.

    Args:
        thread_id: str. The id of the thread.
        message_id: int. The id of the message, relative to the thread.

    Returns:
        FeedbackMessage. The fetched message.
    """
    return _get_message_from_model(
        feedback_models.GeneralFeedbackMessageModel.get(thread_id, message_id))


def get_next_page_of_all_feedback_messages(
    page_size: int = feconf.FEEDBACK_TAB_PAGE_SIZE,
    urlsafe_start_cursor: Optional[str] = None
) -> Tuple[List[feedback_domain.FeedbackMessage], Optional[str], bool]:
    """Fetches a single page from the list of all feedback messages that have
    been posted to any exploration on the site.

    Args:
        page_size: int. The number of feedback messages to display per page.
            Defaults to feconf.FEEDBACK_TAB_PAGE_SIZE.
        urlsafe_start_cursor: str or None. The cursor which represents the
            current position to begin the fetch from. If None, the fetch is
            started from the beginning of the list of all messages.

    Returns:
        tuple(messages_on_page, next_urlsafe_start_cursor, more). Where:
            messages_on_page: list(FeedbackMessage). Contains the slice of
                messages that are part of the page pointed to by the given start
                cursor.
            next_urlsafe_start_cursor: str|None. The cursor to the next page.
            more: bool. Whether there are more messages available to fetch after
                this batch.
    """
    models_on_page, next_urlsafe_start_cursor, more = (
        feedback_models.GeneralFeedbackMessageModel.get_all_messages(
            page_size, urlsafe_start_cursor))
    messages_on_page = [_get_message_from_model(m) for m in models_on_page]
    return (messages_on_page, next_urlsafe_start_cursor, more)


def get_thread_analytics_multi(
    exploration_ids: List[str]
) -> List[feedback_domain.FeedbackAnalytics]:
    """Fetches all FeedbackAnalytics, for all the given exploration ids.

    A FeedbackAnalytics contains the exploration id the analytics belongs to,
    how many open threads exist for the exploration, how many total threads
    exist for the exploration.

    Args:
        exploration_ids: list(str). A list of exploration ids.

    Returns:
        list(FeedbackAnalytics). Analytics in the the same order as the input
        list. If an exploration id is invalid, the number of threads in the
        corresponding FeedbackAnalytics object will be zero.
    """
    feedback_thread_analytics_models = (
        feedback_models.FeedbackAnalyticsModel.get_multi(exploration_ids))
    return [
        feedback_domain.FeedbackAnalytics(
            feconf.ENTITY_TYPE_EXPLORATION, exp_id,
            model.num_open_threads if model is not None else 0,
            model.num_total_threads if model is not None else 0)
        for exp_id, model in zip(
            exploration_ids, feedback_thread_analytics_models)
    ]


def get_thread_analytics(
    exploration_id: str
) -> feedback_domain.FeedbackAnalytics:
    """Fetches the FeedbackAnalytics for the given exploration.

    Args:
        exploration_id: str. The id of the exploration.

    Returns:
        FeedbackAnalytics. The feedback analytics of the given exploration.
    """
    return get_thread_analytics_multi([exploration_id])[0]


def get_total_open_threads(
    feedback_analytics_list: List[feedback_domain.FeedbackAnalytics]
) -> int:
    """Gets the count of all open threads from the given list of
    FeedbackAnalytics domain objects.

    Args:
        feedback_analytics_list: list(FeedbackAnalytics). A list of
            FeedbackAnalytics objects to get the count of all open threads.

    Returns:
        int. The count of all open threads for the given the given list of
        FeedbackAnalytics domain objects.
    """
    return sum(a.num_open_threads for a in feedback_analytics_list)


def get_multiple_threads(
    thread_ids: List[str]
) -> List[feedback_domain.FeedbackThread]:
    """Gets multiple feedback threads.

    Args:
        thread_ids: list(str). The list of thread ids.

    Returns:
        list(FeedbackThread). The list of feedback threads.
    """
    return [
        _get_thread_from_model(model)
        for model in feedback_models.GeneralFeedbackThreadModel.get_multi(
            thread_ids
        )
        if model is not None
    ]


def _get_thread_from_model(
    thread_model: feedback_models.GeneralFeedbackThreadModel
) -> feedback_domain.FeedbackThread:
    """Converts the given FeedbackThreadModel to a FeedbackThread object.

    Args:
        thread_model: FeedbackThreadModel. The FeedbackThread model object to be
            converted to FeedbackThread object.

    Returns:
        FeedbackThread. The corresponding FeedbackThread domain object.
    """
    message_count = (
        thread_model.message_count or
        feedback_models.GeneralFeedbackMessageModel.get_message_count(
            thread_model.id))
    return feedback_domain.FeedbackThread(
        thread_model.id, thread_model.entity_type, thread_model.entity_id, None,
        thread_model.original_author_id, thread_model.status,
        thread_model.subject, thread_model.summary, thread_model.has_suggestion,
        message_count, thread_model.created_on, thread_model.last_updated,
        thread_model.last_nonempty_message_text,
        thread_model.last_nonempty_message_author_id)


def get_exp_thread_summaries(
    user_id: str, thread_ids: List[str]
) -> Tuple[List[feedback_domain.FeedbackThreadSummary], int]:
    """Returns a list of summaries corresponding to the exploration threads from
    the given thread ids. Non-exploration threads are not included in the list.
    It also returns the number of threads that are currently not read by the
    user.

    Args:
        user_id: str. The id of the user.
        thread_ids: list(str). The ids of the threads for which we have to fetch
            the summaries.

    Returns:
        tuple(thread_summaries, number_of_unread_threads). Where:
            thread_summaries: list(FeedbackThreadSummary).
            number_of_unread_threads: int. The number of threads not read by the
                user.
    """
    # We need to fetch the thread models first to filter out the threads which
    # don't refer to an exploration.
    exp_thread_models = [
        model for model in feedback_models.GeneralFeedbackThreadModel.get_multi(
            thread_ids)
        if model and model.entity_type == feconf.ENTITY_TYPE_EXPLORATION
    ]

    exp_thread_user_model_ids = [
        feedback_models.GeneralFeedbackThreadUserModel.generate_full_id(
            user_id, model.id)
        for model in exp_thread_models
    ]
    exp_model_ids = [model.entity_id for model in exp_thread_models]

    # Here we use cast because we are narrowing down the return type
    # of following method from List[Optional[Model]] to List[Optional[
    # exp_models.ExplorationModel]].
    exp_thread_user_models, exploration_models = (
        cast(
            Tuple[
                List[Optional[feedback_models.GeneralFeedbackThreadUserModel]],
                List[Optional[exp_models.ExplorationModel]]
            ],
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                [
                    (
                        'GeneralFeedbackThreadUserModel',
                        exp_thread_user_model_ids
                    ),
                    ('ExplorationModel', exp_model_ids)
                ]
            )
        )
    )

    threads = [_get_thread_from_model(m) for m in exp_thread_models]
    flattened_last_two_message_models_of_threads = (
        feedback_models.GeneralFeedbackMessageModel.get_multi(
            list(itertools.chain.from_iterable(
                t.get_last_two_message_ids() for t in threads))))
    last_two_message_models_of_threads = [
        flattened_last_two_message_models_of_threads[i:i + 2]
        for i in range(0, len(flattened_last_two_message_models_of_threads), 2)
    ]

    thread_summaries = []
    number_of_unread_threads = 0
    for thread, last_two_message_models, thread_user_model, exp_model in (
            zip(
                threads, last_two_message_models_of_threads,
                exp_thread_user_models, exploration_models)):
        message_ids_read_by_user = (
            () if thread_user_model is None else
            thread_user_model.message_ids_read_by_user)

        last_message_model, second_last_message_model = last_two_message_models
        # We don't need to check if the last message is None because all threads
        # have at least one message.
        # Ruling out the possibility of None for mypy type checking.
        assert last_message_model is not None
        last_message_is_read = (
            last_message_model.message_id in message_ids_read_by_user)
        author_last_message = (
            last_message_model.author_id and
            user_services.get_username(last_message_model.author_id))
        # The second-to-last message, however, might be None.
        second_last_message_is_read = (
            second_last_message_model is not None and
            second_last_message_model.message_id in message_ids_read_by_user)
        author_second_last_message = None
        if second_last_message_model is not None:
            # TODO(#15621): The explicit declaration of type for ndb properties
            # should be removed. Currently, these ndb properties are annotated
            # with Any return type. Once we have proper return type we can
            # remove this.
            author_id: str = second_last_message_model.author_id
            author_second_last_message = (
                author_id and
                user_services.get_username(author_id)
            )
        # Ruling out the possibility of None for mypy type checking.
        assert exp_model is not None
        if not last_message_is_read:
            number_of_unread_threads += 1
        thread_summaries.append(
            feedback_domain.FeedbackThreadSummary(
                thread.status, thread.original_author_id, thread.last_updated,
                last_message_model.text, thread.message_count,
                last_message_is_read, second_last_message_is_read,
                author_last_message, author_second_last_message,
                exp_model.title, exp_model.id, thread.id))
    return thread_summaries, number_of_unread_threads


def get_threads(
    entity_type: str, entity_id: str
) -> List[feedback_domain.FeedbackThread]:
    """Fetches all the threads for the given entity id.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.

    Returns:
        list(FeedbackThread). The corresponding Suggestion domain object.
    """
    thread_models = feedback_models.GeneralFeedbackThreadModel.get_threads(
        entity_type, entity_id)
    return [_get_thread_from_model(m) for m in thread_models]


def get_thread(thread_id: str) -> feedback_domain.FeedbackThread:
    """Fetches the thread by thread id.

    Args:
        thread_id: str. The id of the thread.

    Returns:
        FeedbackThread. The resulting FeedbackThread domain object.
    """
    return _get_thread_from_model(
        feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))


def get_closed_threads(
    entity_type: str, entity_id: str, has_suggestion: bool
) -> List[feedback_domain.FeedbackThread]:
    """Fetches all closed threads of the given entity id.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        has_suggestion: bool. If it's True, return a list of all closed threads
            that have a suggestion, otherwise return a list of all closed
            threads that do not have a suggestion.

    Returns:
        list(FeedbackThread). The resulting FeedbackThread domain objects.
    """
    return [
        thread for thread in get_threads(entity_type, entity_id)
        if (
            thread.has_suggestion == has_suggestion and
            thread.status != feedback_models.STATUS_CHOICES_OPEN)
    ]


def get_all_threads(
    entity_type: str, entity_id: str, has_suggestion: bool
) -> List[feedback_domain.FeedbackThread]:
    """Fetches all threads (regardless of their status) that correspond to the
    given entity id.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        has_suggestion: bool. If it's True, return a list of all threads that
            have a suggestion, otherwise return a list of all threads that do
            not have a suggestion.

    Returns:
        list(FeedbackThread). The resulting FeedbackThread domain objects.
    """
    return [
        thread for thread in get_threads(entity_type, entity_id)
        if thread.has_suggestion == has_suggestion
    ]


def enqueue_feedback_message_batch_email_task(user_id: str) -> None:
    """Adds a 'send feedback email' (batch) task into the task queue.

    Args:
        user_id: str. The user to be notified.
    """
    taskqueue_services.enqueue_task(
        feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS, {'user_id': user_id},
        feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS)


def enqueue_feedback_message_instant_email_task_transactional(
    user_id: str, reference: feedback_domain.FeedbackMessageReference
) -> None:
    """Adds a 'send feedback email' (instant) task into the task queue.

    Args:
        user_id: str. The user to be notified.
        reference: FeedbackMessageReference. A reference that contains the data
            needed to identify the feedback message.
    """
    payload = {
        'user_id': user_id,
        'reference_dict': reference.to_dict()
    }
    taskqueue_services.enqueue_task(
        feconf.TASK_URL_INSTANT_FEEDBACK_EMAILS, payload, 0)


@transaction_services.run_in_transaction_wrapper
def _enqueue_feedback_thread_status_change_email_task_transactional(
    user_id: str,
    reference: feedback_domain.FeedbackMessageReference,
    old_status: str,
    new_status: str
) -> None:
    """Adds a task for sending email when a feedback thread status is changed.

    Args:
        user_id: str. The user to be notified.
        reference: FeedbackMessageReference. The feedback message reference
            object to be converted to dict.
        old_status: str. One of STATUS_CHOICES.
        new_status: str. One of STATUS_CHOICES.
    """
    payload = {
        'user_id': user_id,
        'reference_dict': reference.to_dict(),
        'old_status': old_status,
        'new_status': new_status
    }
    taskqueue_services.enqueue_task(
        feconf.TASK_URL_FEEDBACK_STATUS_EMAILS, payload, 0)


def get_feedback_message_references(
    user_id: str
) -> List[feedback_domain.FeedbackMessageReference]:
    """Fetches all FeedbackMessageReference objects written by the given user。

    Args:
        user_id: str. If the user id is invalid or there is no message for this
            user, return an empty list.

    Returns:
        list(FeedbackMessageReference). The resulting FeedbackMessageReference
        domain objects.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)
    feedback_message_references = (
        () if model is None else model.feedback_message_references)
    return [
        feedback_domain.FeedbackMessageReference(
            reference['entity_type'], reference['entity_id'],
            reference['thread_id'], reference['message_id'])
        for reference in feedback_message_references
    ]


@transaction_services.run_in_transaction_wrapper
def _add_feedback_message_reference_transactional(
    user_id: str, reference: feedback_domain.FeedbackMessageReference
) -> None:
    """Adds a new message to the feedback message buffer that is used to
    generate the next notification email to the given user.

    Args:
        user_id: str. If there's an UnsentFeedbackEmailModel for the given user,
            update the instance with given reference, otherwise create a new
            instance.
        reference: FeedbackMessageReference. The new message reference to add to
            the buffer.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)
    if model is not None:
        model.feedback_message_references.append(reference.to_dict())
        model.update_timestamps()
        model.put()
    else:
        model = feedback_models.UnsentFeedbackEmailModel(
            id=user_id, feedback_message_references=[reference.to_dict()])
        model.update_timestamps()
        model.put()
        enqueue_feedback_message_batch_email_task(user_id)


@transaction_services.run_in_transaction_wrapper
def update_feedback_email_retries_transactional(user_id: str) -> None:
    """If sufficient time has passed, increment the number of retries for the
    corresponding user's UnsentEmailFeedbackModel.

    Args:
        user_id: str. The id of the given user.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id)
    time_since_buffered = (
        (datetime.datetime.utcnow() - model.created_on).seconds)

    if (time_since_buffered >
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS):
        model.retries += 1
        model.update_timestamps()
        model.put()


@transaction_services.run_in_transaction_wrapper
def pop_feedback_message_references_transactional(
    user_id: str, num_references_to_pop: int
) -> None:
    """Pops feedback message references of the given user which have been
    processed already.

    Args:
        user_id: str. The id of the current user.
        num_references_to_pop: int. Number of feedback message references that
            have been processed already.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id)
    remaining_references = (
        model.feedback_message_references[num_references_to_pop:])
    model.delete()

    if remaining_references:
        # We recreate the model in order to re-initialize its 'created_on'
        # property and reset the retries count to 0. If we don't do this, then
        # the retries count will be incorrect.
        model = feedback_models.UnsentFeedbackEmailModel(
            id=user_id, feedback_message_references=remaining_references)
        model.update_timestamps()
        model.put()
        enqueue_feedback_message_batch_email_task(user_id)


@transaction_services.run_in_transaction_wrapper
def clear_feedback_message_references_transactional(
    user_id: str, exploration_id: str, thread_id: str
) -> None:
    """Removes feedback message references associated with a feedback thread.

    Args:
        user_id: str. The user who created this reference.
        exploration_id: str. The id of the exploration.
        thread_id: str. The id of the thread.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)
    if model is None:
        # Model exists only if user has received feedback on exploration.
        return

    updated_references = [
        reference for reference in model.feedback_message_references
        if (reference['entity_id'] != exploration_id or
            reference['thread_id'] != thread_id)
    ]

    if not updated_references:
        # Note that any tasks remaining in the email queue will still be
        # processed, but if the model for the given user does not exist,
        # no email will be sent.

        # Note that, since the task in the queue is not deleted, the following
        # scenario may occur: If creator attends to arrived feedback before
        # email is sent then model will be deleted but task will still execute
        # after its countdown. Arrival of new feedback (before task is executed)
        # will create new model and task. But actual email will be sent by first
        # task. It means that email may be sent just after a few minutes of
        # feedback's arrival.

        # In PR #2261, we decided to leave things as they are for now, since it
        # looks like the obvious solution of keying tasks by user id doesn't
        # work (see #2258). However, this may be worth addressing in the future.
        model.delete()
    else:
        model.feedback_message_references = updated_references
        model.update_timestamps()
        model.put()


def _get_all_recipient_ids(
    exploration_id: str, thread_id: str, author_id: str
) -> Tuple[List[str], List[str]]:
    """Fetches all authors of the exploration excluding the given author and all
    the other recipients.

    Args:
        exploration_id: str. The id of the exploration.
        thread_id: str. The id of the thread.
        author_id: str. One author of the given exploration_id.

    Returns:
        tuple(batch_recipients, other_recipients). Where:
            batch_recipients: list(str). The user_ids of the authors excluding
                the given author.
            other_recipients: list(str). The user_ids of the other participants
                in this thread, excluding owners of the exploration and the
                given author.
    """
    exploration_rights = rights_manager.get_exploration_rights(exploration_id)

    owner_ids = set(exploration_rights.owner_ids)
    participant_ids = {
        message.author_id for message in get_messages(thread_id)
        if user_services.is_user_registered(message.author_id)
    }

    batch_recipient_ids = owner_ids - {author_id}
    other_recipient_ids = participant_ids - batch_recipient_ids - {author_id}

    return (list(batch_recipient_ids), list(other_recipient_ids))


def _send_batch_emails(
    recipient_list: List[str],
    feedback_message_reference: feedback_domain.FeedbackMessageReference,
    exploration_id: str,
    has_suggestion: bool
) -> None:
    """Adds the given FeedbackMessageReference to each of the recipient's email
    buffers. The collected messages will be sent out as a batch after a short
    delay.

    Args:
        recipient_list: list(str). A list of user_ids of all recipients of the
            email.
        feedback_message_reference: FeedbackMessageReference. The reference to
            add to each email buffer.
        exploration_id: str. The id of exploration that received new message.
        has_suggestion: bool. Whether this thread has a related learner
            suggestion.
    """
    can_recipients_receive_email = email_manager.can_users_receive_thread_email(
        recipient_list, exploration_id, has_suggestion)
    for recipient_id, can_receive_email in zip(
            recipient_list, can_recipients_receive_email):
        if can_receive_email:
            _add_feedback_message_reference_transactional(
                recipient_id, feedback_message_reference)


def _send_instant_emails(
    recipient_list: List[str],
    feedback_message_reference: feedback_domain.FeedbackMessageReference,
    exploration_id: str,
    has_suggestion: bool
) -> None:
    """Adds the given FeedbackMessageReference to each of the recipient's email
    buffers. The collected messages will be sent out immediately.

    Args:
        recipient_list: list(str). A list of user_ids of all recipients of the
            email.
        feedback_message_reference: FeedbackMessageReference. The reference to
            add to each email buffer.
        exploration_id: str. The id of exploration that received new message.
        has_suggestion: bool. Whether this thread has a related learner
            suggestion.
    """
    can_recipients_receive_email = email_manager.can_users_receive_thread_email(
        recipient_list, exploration_id, has_suggestion)
    for recipient_id, can_receive_email in zip(
            recipient_list, can_recipients_receive_email):
        if can_receive_email:
            enqueue_feedback_message_instant_email_task_transactional(
                recipient_id, feedback_message_reference)


def _send_feedback_thread_status_change_emails(
    recipient_list: List[str],
    feedback_message_reference: feedback_domain.FeedbackMessageReference,
    old_status: str,
    new_status: str,
    exploration_id: str,
    has_suggestion: bool
) -> None:
    """Notifies the given recipients about the status change.

    Args:
        recipient_list: list(str). A list of recipient ids.
        feedback_message_reference: FeedbackMessageReference. The reference to
            add to each email buffer.
        old_status: str. One of STATUS_CHOICES.
        new_status: str. One of STATUS_CHOICES.
        exploration_id: str. The id of the exploration that received a new
            message.
        has_suggestion: bool. Whether this thread has a related learner
            suggestion.
    """
    can_recipients_receive_email = email_manager.can_users_receive_thread_email(
        recipient_list, exploration_id, has_suggestion)
    for recipient_id, can_receive_email in zip(
            recipient_list, can_recipients_receive_email):
        if can_receive_email:
            _enqueue_feedback_thread_status_change_email_task_transactional(
                recipient_id, feedback_message_reference, old_status,
                new_status)


def _add_message_to_email_buffer(
    author_id: str,
    thread_id: str,
    message_id: int,
    message_length: int,
    old_status: str,
    new_status: str
) -> None:
    """Sends the given message to the recipients of the given thread. If status
    has changed, notify the recipients as well.

    Args:
        author_id: str. The id of the author of message.
        thread_id: str. The id of the thread that received new message.
        message_id: int. The id of the new message.
        message_length: int. Length of the feedback message to be sent.
        old_status: str. One of STATUS_CHOICES. Value of old thread status.
        new_status: str. One of STATUS_CHOICES. Value of new thread status.
    """
    thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
    exploration_id = thread.entity_id
    has_suggestion = thread.has_suggestion
    feedback_message_reference = feedback_domain.FeedbackMessageReference(
        thread.entity_type, thread.entity_id, thread_id, message_id)
    batch_recipient_ids, other_recipient_ids = (
        _get_all_recipient_ids(exploration_id, thread_id, author_id))

    if old_status != new_status:
        # Send email for feedback thread status change.
        _send_feedback_thread_status_change_emails(
            other_recipient_ids, feedback_message_reference, old_status,
            new_status, exploration_id, has_suggestion)

    if message_length:
        # Send feedback message email only if message text is non empty (the
        # message text can be empty in the case when only status is changed).
        _send_batch_emails(
            batch_recipient_ids, feedback_message_reference, exploration_id,
            has_suggestion)
        _send_instant_emails(
            other_recipient_ids, feedback_message_reference, exploration_id,
            has_suggestion)


def delete_exploration_feedback_analytics(exp_ids: List[str]) -> None:
    """Deletes the FeedbackAnalyticsModel models corresponding to
    the given exp_ids.

    Args:
        exp_ids: list(str). A list of exploration IDs whose feedback analytics
            models are to be deleted.
    """
    feedback_analytics_models = (
        feedback_models.FeedbackAnalyticsModel.get_multi(
            exp_ids))
    feedback_analytics_models_to_be_deleted = [
        model for model in feedback_analytics_models
        if model is not None]
    feedback_models.FeedbackAnalyticsModel.delete_multi(
        feedback_analytics_models_to_be_deleted)


def handle_new_thread_created(exp_id: str) -> None:
    """Reacts to new threads added to an exploration.

    Args:
        exp_id: str. The exploration ID associated with the thread.
    """
    _increment_total_threads_count_transactional(exp_id)
    _increment_open_threads_count_transactional(exp_id)


def handle_thread_status_changed(
    exp_id: str,
    old_status: str,
    new_status: str
) -> None:
    """Reacts to changes in an exploration thread's status.

    Args:
        exp_id: str. The exploration ID associated with the thread.
        old_status: str. The old status of the thread.
        new_status: str. The updated status of the thread.
    """
    # Status changed from closed to open.
    if (old_status != feedback_models.STATUS_CHOICES_OPEN and
            new_status == feedback_models.STATUS_CHOICES_OPEN):
        _increment_open_threads_count_transactional(exp_id)
    # Status changed from open to closed.
    elif (old_status == feedback_models.STATUS_CHOICES_OPEN and
          new_status != feedback_models.STATUS_CHOICES_OPEN):
        _decrement_open_threads_count_transactional(exp_id)


@transaction_services.run_in_transaction_wrapper
def _increment_open_threads_count_transactional(exp_id: str) -> None:
    """Increments count of open threads by one."""
    model = (
        feedback_models.FeedbackAnalyticsModel.get(exp_id, strict=False) or
        feedback_models.FeedbackAnalyticsModel(id=exp_id, num_open_threads=0))
    model.num_open_threads = (model.num_open_threads or 0) + 1
    model.update_timestamps()
    model.put()


@transaction_services.run_in_transaction_wrapper
def _increment_total_threads_count_transactional(exp_id: str) -> None:
    """Increments count of total threads by one."""
    model = (
        feedback_models.FeedbackAnalyticsModel.get(exp_id, strict=False) or
        feedback_models.FeedbackAnalyticsModel(id=exp_id, num_total_threads=0))
    model.num_total_threads = (model.num_total_threads or 0) + 1
    model.update_timestamps()
    model.put()


@transaction_services.run_in_transaction_wrapper
def _decrement_open_threads_count_transactional(exp_id: str) -> None:
    """Decrements count of open threads by one."""
    model = (
        feedback_models.FeedbackAnalyticsModel.get(exp_id, strict=False) or
        feedback_models.FeedbackAnalyticsModel(id=exp_id, num_open_threads=0))
    model.num_open_threads = (model.num_open_threads or 1) - 1
    model.update_timestamps()
    model.put()
