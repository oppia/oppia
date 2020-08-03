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

from __future__ import absolute_import # pylint: disable=import-only-modules
from __future__ import unicode_literals # pylint: disable=import-only-modules

import datetime
import itertools

from core.domain import email_manager
from core.domain import feedback_domain
from core.domain import feedback_jobs_continuous
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
import feconf
import python_utils

(feedback_models, email_models, suggestion_models) = (
    models.Registry.import_models(
        [models.NAMES.feedback, models.NAMES.email, models.NAMES.suggestion]))
datastore_services = models.Registry.import_datastore_services()
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()

DEFAULT_SUGGESTION_THREAD_SUBJECT = 'Suggestion from a learner'
DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE = ''


def get_exp_id_from_thread_id(thread_id):
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
        entity_type, entity_id, original_author_id, subject, text,
        has_suggestion):
    """Creates a feedback thread and its first message.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        original_author_id: str. The author id who starts this thread.
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
    thread.put()
    create_message(
        thread_id, original_author_id, feedback_models.STATUS_CHOICES_OPEN,
        subject, text)
    return thread_id


def create_thread(
        entity_type, entity_id, original_author_id, subject, text,
        has_suggestion=False):
    """Creates a thread and its first message.

    Args:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        original_author_id: str. The author id who starts this thread.
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
        thread_id, author_id, updated_status, updated_subject, text,
        received_via_email=False):
    """Creates a new message for the thread and subscribes the author to the
    thread.

    Args:
        thread_id: str. The thread id the message belongs to.
        author_id: str. The author id who creates this message.
        updated_status: str. One of STATUS_CHOICES. New thread status.
            Must be supplied if this is the first message of a thread. For the
            rest of the thread, should exist only when the status changes.
        updated_subject: str. New thread subject. Must be supplied if this is
            the first message of a thread. For the rest of the thread, should
            exist only when the subject changes.
        text: str. The text of the feedback message. This may be ''.
        received_via_email: bool. Whether new message is received via email or
            web.
    """
    create_messages(
        [thread_id], author_id, updated_status, updated_subject, text,
        received_via_email=received_via_email)


def create_messages(
        thread_ids, author_id, updated_status, updated_subject, text,
        received_via_email=False):
    """Creates a new message for each of the threads in thread_ids and
    for each message, subscribes the author to the thread.

    Args:
        thread_ids: list(str). The thread ids the messages belong to.
        author_id: str. The author id who creates the messages.
        updated_status: str. One of STATUS_CHOICES. New thread status.
            Must be supplied if this is the first message of the threads.
            Otherwise, this property should only exist when the status
            changes.
        updated_subject: str. New thread subject. Must be supplied if this is
            the first message of the threads. Otherwise, this property should
            only exist when the subject changes.
        text: str. The text of the feedback message. This may be ''.
        received_via_email: bool. Whether new the message(s) are received via
            email or web.
    """
    from core.domain import event_services

    # Get the threads at the outset, in order to check that there are models
    # corresponding to each of the thread_ids.
    thread_models = feedback_models.GeneralFeedbackThreadModel.get_multi(
        thread_ids)
    thread_ids_that_do_not_have_models = []
    for index, thread in enumerate(thread_models):
        if thread is None:
            thread_ids_that_do_not_have_models.append(thread_ids[index])
    if len(thread_ids_that_do_not_have_models) > 0:
        raise Exception(
            'Thread(s) belonging to the GeneralFeedbackThreadModel class with '
            'id(s):[%s] were not found.' % (
                ' '.join(thread_ids_that_do_not_have_models))
        )

    # Get the corresponding message ids, which are required for message
    # creation.
    message_ids = (
        feedback_models.GeneralFeedbackMessageModel.get_message_counts(
            thread_ids)
    )

    # Create the new message instances.
    messages = feedback_models.GeneralFeedbackMessageModel.create_multi(
        thread_ids, message_ids)

    # Update the message instances.
    for index, message in enumerate(messages):
        message.thread_id = thread_ids[index]
        message.message_id = message_ids[index]
        message.author_id = author_id
        message.text = text
        message.received_via_email = received_via_email
        # Get the corresponding thread in storage.
        thread = thread_models[index]
        if updated_status:
            message.updated_status = updated_status
            if message.message_id == 0:
                # New thread.
                if thread.entity_type == feconf.ENTITY_TYPE_EXPLORATION:
                    event_services.FeedbackThreadCreatedEventHandler.record(
                        thread.entity_id)
            else:
                # Thread status changed.
                if thread.entity_type == feconf.ENTITY_TYPE_EXPLORATION:
                    (
                        event_services
                        .FeedbackThreadStatusChangedEventHandler
                        .record(
                            thread.entity_id, thread.status, updated_status)
                    )
        if updated_subject:
            message.updated_subject = updated_subject
    feedback_models.GeneralFeedbackMessageModel.put_multi(messages)

    # Update the message data cache of the threads.
    for thread in thread_models:
        thread.message_count += 1
        if text:
            thread.last_nonempty_message_text = text
            thread.last_nonempty_message_author_id = author_id

    # We do a put() even if the status and subject are not updated, so that the
    # last_updated time of the threads reflects the last time a message was
    # added to it.
    old_statuses = [thread.status for thread in thread_models]
    new_statuses = old_statuses
    if updated_status or updated_subject:
        new_statuses = []
        for index, thread in enumerate(thread_models):
            # Can't be the first thread.
            if message_ids[index] != 0:
                if updated_status and (updated_status != thread.status):
                    thread.status = updated_status
                if updated_subject and (updated_subject != thread.subject):
                    thread.subject = updated_subject
            new_statuses.append(thread.status)
    feedback_models.GeneralFeedbackThreadModel.put_multi(thread_models)

    # For each thread, we do a put on the suggestion linked (if it exists) to
    # the thread, so that the last_updated time changes to show that there is
    # activity in the thread.
    thread_ids_that_have_linked_suggestions = []
    for thread in thread_models:
        if thread.has_suggestion:
            thread_ids_that_have_linked_suggestions.append(thread.id)
    suggestions = (
        suggestion_models.GeneralSuggestionModel.get_multi(
            thread_ids_that_have_linked_suggestions)
    )
    suggestions_to_update = []
    for suggestion in suggestions:
        # As the thread is created before the suggestion, for the first message
        # we need not update the suggestion.
        if suggestion:
            suggestions_to_update.append(suggestion)
    suggestion_models.GeneralSuggestionModel.put_multi(suggestions_to_update)

    if (feconf.CAN_SEND_EMAILS and (
            feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS and
            user_services.is_user_registered(author_id))):
        for index, thread in enumerate(thread_models):
            _add_message_to_email_buffer(
                author_id, thread.id, message_ids[index],
                len(text), old_statuses[index], new_statuses[index])

    if author_id:
        subscription_services.subscribe_to_threads(author_id, thread_ids)
        add_message_ids_to_read_by_list(thread_ids, author_id, message_ids)


def update_messages_read_by_the_user(user_id, thread_id, message_ids):
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
    feedback_thread_user_model.put()


def add_message_ids_to_read_by_list(thread_ids, user_id, message_ids):
    """Adds the message ids to the list of message ids read by the user.

    Args:
        thread_ids: list(str). The ids of the threads.
        user_id: str. The id of the user reading the messages.
        message_ids: list(str). The ids of the messages.
    """
    # First get all of the GeneralFeedbackThreadUserModels that already exist.
    current_feedback_thread_user_models = (
        feedback_models.GeneralFeedbackThreadUserModel.get_multi(
            user_id, thread_ids))

    # Keep track of which thread_ids do not have models yet.
    missing_thread_ids = []
    # Keep track of the current_feedback_thread_user_models that aren't None.
    feedback_thread_user_models = []
    for index, feedback_model in enumerate(
            current_feedback_thread_user_models):
        if feedback_model is None:
            missing_thread_ids.append(thread_ids[index])
        else:
            feedback_thread_user_models.append(feedback_model)

    # Create the new GeneralFeedbackThreadUserModels for each of the thread_ids
    # that do not have a model yet.
    new_feedback_thread_user_models = []
    if len(missing_thread_ids) > 0:
        new_feedback_thread_user_models = (
            feedback_models.GeneralFeedbackThreadUserModel.create_multi(
                user_id, missing_thread_ids)
        )

    # The GeneralFeedbackThreadUserModels that need to be updated are the new
    # models that we created as well as the models that already existed.
    feedback_thread_user_models.extend(new_feedback_thread_user_models)

    # For each of the models, append the message_id to the
    # message_ids_read_by_user property.
    for index, feedback_model in enumerate(feedback_thread_user_models):
        feedback_model.message_ids_read_by_user.append(
            message_ids[index]
        )

    # Update these new models in the datastore.
    feedback_models.GeneralFeedbackThreadUserModel.put_multi(
        feedback_thread_user_models
    )


def _get_message_from_model(message_model):
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


def get_messages(thread_id):
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


def get_message(thread_id, message_id):
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
        page_size=feconf.FEEDBACK_TAB_PAGE_SIZE, urlsafe_start_cursor=None):
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
            next_urlsafe_start_cursor: str. The cursor to the next page.
            more: bool. Whether there are more messages available to fetch after
                this batch.
    """
    models_on_page, next_urlsafe_start_cursor, more = (
        feedback_models.GeneralFeedbackMessageModel.get_all_messages(
            page_size, urlsafe_start_cursor))
    messages_on_page = [_get_message_from_model(m) for m in models_on_page]
    return (messages_on_page, next_urlsafe_start_cursor, more)


def get_thread_analytics_multi(exploration_ids):
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
    return feedback_jobs_continuous.FeedbackAnalyticsAggregator.get_thread_analytics_multi( # pylint: disable=line-too-long
        exploration_ids)


def get_thread_analytics(exploration_id):
    """Fetches the FeedbackAnalytics for the given exploration.

    Args:
        exploration_id: str. The id of the exploration.

    Returns:
        FeedbackAnalytics. The feedback analytics of the given exploration.
    """
    return feedback_jobs_continuous.FeedbackAnalyticsAggregator.get_thread_analytics( # pylint: disable=line-too-long
        exploration_id)


def get_total_open_threads(feedback_analytics_list):
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


def get_multiple_threads(thread_ids):
    """Gets multiple feedback threads.

    Args:
        thread_ids: list(str). The list of thread ids.

    Returns:
        list(FeedbackThread). The list of feedback threads.
    """
    return [
        _get_thread_from_model(model)
        for model in feedback_models.GeneralFeedbackThreadModel.get_multi(
            thread_ids)
    ]


def _get_thread_from_model(thread_model):
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


def get_exp_thread_summaries(user_id, thread_ids):
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

    exp_thread_user_models, exp_models = (
        datastore_services.fetch_multiple_entities_by_ids_and_models([
            ('GeneralFeedbackThreadUserModel', exp_thread_user_model_ids),
            ('ExplorationModel', exp_model_ids),
        ]))

    threads = [_get_thread_from_model(m) for m in exp_thread_models]
    flattened_last_two_message_models_of_threads = (
        feedback_models.GeneralFeedbackMessageModel.get_multi(
            itertools.chain.from_iterable(
                t.get_last_two_message_ids() for t in threads)))
    last_two_message_models_of_threads = [
        flattened_last_two_message_models_of_threads[i:i + 2]
        for i in python_utils.RANGE(
            0, len(flattened_last_two_message_models_of_threads), 2)
    ]

    thread_summaries = []
    number_of_unread_threads = 0
    for thread, last_two_message_models, thread_user_model, exp_model in (
            python_utils.ZIP(
                threads, last_two_message_models_of_threads,
                exp_thread_user_models, exp_models)):
        message_ids_read_by_user = (
            () if thread_user_model is None else
            thread_user_model.message_ids_read_by_user)

        last_message_model, second_last_message_model = last_two_message_models
        # We don't need to check if the last message is None because all threads
        # have at least one message.
        last_message_is_read = (
            last_message_model.message_id in message_ids_read_by_user)
        author_last_message = (
            last_message_model.author_id and
            user_services.get_username(last_message_model.author_id))
        # The second-to-last message, however, might be None.
        second_last_message_is_read = (
            second_last_message_model is not None and
            second_last_message_model.message_id in message_ids_read_by_user)
        author_second_last_message = (
            second_last_message_model and
            second_last_message_model.author_id and
            user_services.get_username(second_last_message_model.author_id))

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


def get_threads(entity_type, entity_id):
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


def get_thread(thread_id):
    """Fetches the thread by thread id.

    Args:
        thread_id: str. The id of the thread.

    Returns:
        FeedbackThread. The resulting FeedbackThread domain object.
    """
    return _get_thread_from_model(
        feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))


def get_closed_threads(entity_type, entity_id, has_suggestion):
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


def get_all_threads(entity_type, entity_id, has_suggestion):
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


def enqueue_feedback_message_batch_email_task(user_id):
    """Adds a 'send feedback email' (batch) task into the task queue.

    Args:
        user_id: str. The user to be notified.
    """
    taskqueue_services.enqueue_email_task(
        feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS, {'user_id': user_id},
        feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS)


def enqueue_feedback_message_instant_email_task(user_id, reference):
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
    taskqueue_services.enqueue_email_task(
        feconf.TASK_URL_INSTANT_FEEDBACK_EMAILS, payload, 0)


def _enqueue_feedback_thread_status_change_email_task(
        user_id, reference, old_status, new_status):
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
    taskqueue_services.enqueue_email_task(
        feconf.TASK_URL_FEEDBACK_STATUS_EMAILS, payload, 0)


def get_feedback_message_references(user_id):
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


def _add_feedback_message_reference(user_id, reference):
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
        model.put()
    else:
        model = feedback_models.UnsentFeedbackEmailModel(
            id=user_id, feedback_message_references=[reference.to_dict()])
        model.put()
        enqueue_feedback_message_batch_email_task(user_id)


def update_feedback_email_retries(user_id):
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
        model.put()


def pop_feedback_message_references(user_id, num_references_to_pop):
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
        model.put()
        enqueue_feedback_message_batch_email_task(user_id)


def clear_feedback_message_references(user_id, exploration_id, thread_id):
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
        model.put()


def _get_all_recipient_ids(exploration_id, thread_id, author_id):
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
        recipient_list, feedback_message_reference, exploration_id,
        has_suggestion):
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
    for recipient_id, can_receive_email in python_utils.ZIP(
            recipient_list, can_recipients_receive_email):
        if can_receive_email:
            transaction_services.run_in_transaction(
                _add_feedback_message_reference, recipient_id,
                feedback_message_reference)


def _send_instant_emails(
        recipient_list, feedback_message_reference, exploration_id,
        has_suggestion):
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
    for recipient_id, can_receive_email in python_utils.ZIP(
            recipient_list, can_recipients_receive_email):
        if can_receive_email:
            transaction_services.run_in_transaction(
                enqueue_feedback_message_instant_email_task, recipient_id,
                feedback_message_reference)


def _send_feedback_thread_status_change_emails(
        recipient_list, feedback_message_reference, old_status, new_status,
        exploration_id, has_suggestion):
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
    for recipient_id, can_receive_email in python_utils.ZIP(
            recipient_list, can_recipients_receive_email):
        if can_receive_email:
            transaction_services.run_in_transaction(
                _enqueue_feedback_thread_status_change_email_task, recipient_id,
                feedback_message_reference, old_status, new_status)


def _ensure_each_recipient_has_reply_to_id(user_ids, thread_id):
    """Ensures that instance of FeedbackEmailReplyToIdModel exists for each user
    in user_ids.

    Args:
        user_ids: list(str). A list of user_ids.
        thread_id: str. The id of thread used to obtain
            FeedbackEmailReplyToIdModel for given user.
    """
    feedback_email_id_models = (
        email_models.GeneralFeedbackEmailReplyToIdModel.get_multi_by_user_ids(
            user_ids, thread_id))

    # Users are added to the thread incrementally. Therefore at any time there
    # can be at most one user who does not have FeedbackEmailReplyToIdModel
    # instance.
    for user_id in user_ids:
        if feedback_email_id_models[user_id] is None:
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                user_id, thread_id)


def _add_message_to_email_buffer(
        author_id, thread_id, message_id, message_length, old_status,
        new_status):
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

    _ensure_each_recipient_has_reply_to_id(other_recipient_ids, thread_id)

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
