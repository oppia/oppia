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

import datetime

from core.domain import feedback_domain
from core.domain import feedback_jobs_continuous
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.domain import email_manager
from core.platform import models
import feconf

(feedback_models, email_models) = models.Registry.import_models(
    [models.NAMES.feedback, models.NAMES.email])
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()

DEFAULT_SUGGESTION_THREAD_SUBJECT = 'Suggestion from a learner'
DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE = ''


def _create_models_for_thread_and_first_message(
        exploration_id, state_name, original_author_id, subject, text,
        has_suggestion):
    """Creates a feedback thread and its first message.

    Args:
        exploration_id: str. The exploration id the thread belongs to.
        state_name: str or None. The state name for the thread. If None,
            this indicates that the thread pertains to the exploration as a
            whole.
        original_author_id: str. The author id who starts this thread.
        subject: str. The subject of this thread.
        text: str. The text of the feedback message. This may be ''.
        has_suggestion: bool. Whether this thread has a related
            learner suggestion.

    Returns:
        The thread id we created.
    """
    thread_id = feedback_models.FeedbackThreadModel.generate_new_thread_id(
        exploration_id)
    thread = feedback_models.FeedbackThreadModel.create(
        exploration_id, thread_id)
    thread.exploration_id = exploration_id
    thread.state_name = state_name
    thread.original_author_id = original_author_id
    # The feedback analytics jobs rely on the thread status being set to 'open'
    # when a new thread is created. If this is changed, changes need to be
    # made there as well
    thread.status = feedback_models.STATUS_CHOICES_OPEN
    thread.subject = subject
    thread.has_suggestion = has_suggestion
    thread.put()
    create_message(
        exploration_id, thread_id, original_author_id,
        feedback_models.STATUS_CHOICES_OPEN, subject, text)
    return thread_id


def create_thread(
        exploration_id, state_name, original_author_id, subject, text):
    """Creates a thread and its first message.

    Args:
        exploration_id: str. The exploration id the thread belongs to.
        state_name: str or None. The state name for the thread. If None, this
            indicates that the thread pertains to the exploration as a whole.
        original_author_id: str. The author id who starts this thread.
        subject: str. The subject of this thread.
        text: str. The text of the feedback message. This may be ''.
    """
    _create_models_for_thread_and_first_message(
        exploration_id, state_name, original_author_id, subject, text, False)


def create_message(
        exploration_id, thread_id, author_id, updated_status, updated_subject,
        text, received_via_email=False):
    """Creates a new message for the thread and subscribes the author to the
    thread.

    Args:
        exploration_id: str. The exploration id the thread belongs to.
        thread_id: str. The thread id the message belongs to.
        author_id: str. The author id who creates this message.
        updated_status: str, one of STATUS_CHOICES. New thread status.
            Must be supplied if this is the first message of a thread. For the
            rest of the thread, should exist only when the status changes.
        updated_subject: str. New thread subject. Must be supplied if this is
            the first message of a thread. For the rest of the thread, should
            exist only when the subject changes.
        text: str. The text of the feedback message. This may be ''.
        received_via_email: bool. Whether new message is received via email or
            web.
    """
    from core.domain import event_services
    # Get the thread at the outset, in order to check that the thread_id passed
    # in is valid.
    full_thread_id = (
        feedback_models.FeedbackThreadModel.generate_full_thread_id(
            exploration_id, thread_id))
    thread = feedback_models.FeedbackThreadModel.get(full_thread_id)

    message_id = feedback_models.FeedbackMessageModel.get_message_count(
        exploration_id, thread_id)
    msg = feedback_models.FeedbackMessageModel.create(
        exploration_id, thread_id, message_id)
    msg.thread_id = full_thread_id
    msg.message_id = message_id
    msg.author_id = author_id
    if updated_status:
        if message_id == 0:
            # New thread.
            event_services.FeedbackThreadCreatedEventHandler.record(
                thread.exploration_id)
        else:
            # Thread status changed.
            event_services.FeedbackThreadStatusChangedEventHandler.record(
                thread.exploration_id, thread.status, updated_status)

        msg.updated_status = updated_status
    if updated_subject:
        msg.updated_subject = updated_subject
    msg.text = text
    msg.received_via_email = received_via_email
    msg.put()

    # We do a put() even if the status and subject are not updated, so that the
    # last_updated time of the thread reflects the last time a message was
    # added to it.
    old_status = thread.status
    if message_id != 0 and (updated_status or updated_subject):
        if updated_status and updated_status != thread.status:
            thread.status = updated_status
        if updated_subject and updated_subject != thread.subject:
            thread.subject = updated_subject
    new_status = thread.status
    thread.put()

    if (user_services.is_user_registered(author_id) and
            feconf.CAN_SEND_EMAILS and
            feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS):
            # send feedback message email if user is registered.
        _add_message_to_email_buffer(
            author_id, exploration_id, thread_id, message_id, len(text),
            old_status, new_status)

    if author_id:
        subscription_services.subscribe_to_thread(author_id, full_thread_id)


def _get_message_from_model(message_model):
    """Converts the FeedbackMessageModel to a FeedbackMessage.

    Args:
        message_model: FeedbackMessageModel. The FeedbackMessageModel to
            be converted.

    Returns:
        FeedbackMessage. The resulting FeedbackMessage domain object.
    """
    return feedback_domain.FeedbackMessage(
        message_model.id, message_model.thread_id, message_model.message_id,
        message_model.author_id, message_model.updated_status,
        message_model.updated_subject, message_model.text,
        message_model.created_on, message_model.last_updated,
        message_model.received_via_email)


def get_messages(exploration_id, thread_id):
    """Fetches all messages of the given thread indexed by
        [exploration_id].[thread_id].

    Args:
        exploration_id: str.
        thread_id: str.

    Returns:
        list of FeedbackMessage. Contains all the messages in the thread.
    """
    return [
        _get_message_from_model(m)
        for m in feedback_models.FeedbackMessageModel.get_messages(
            exploration_id, thread_id)]


def get_message(exploration_id, thread_id, message_id):
    """Fetches the message indexed by [exploration_id].[thread_id].[message_id].

    Args:
        exploration_id: str.
        thread_id: str.
        message_id: int.

    Returns:
        FeedbackMessage. The fetched message.
    """
    return _get_message_from_model(
        feedback_models.FeedbackMessageModel.get(
            exploration_id, thread_id, message_id))


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
        tuple of (messages, new_urlsafe_start_cursor, more), where
            messages: list of FeedbackMessage. Contains all the messages we
                want.
            new_urlsafe_start_cursor: str. The new cursor.
            more: bool. Whether there are more messages available to fetch after
                this batch.
    """
    results, new_urlsafe_start_cursor, more = (
        feedback_models.FeedbackMessageModel.get_all_messages(
            page_size, urlsafe_start_cursor))

    result_messages = [_get_message_from_model(m) for m in results]
    return (result_messages, new_urlsafe_start_cursor, more)

def get_thread_analytics_multi(exploration_ids):
    """Fetches all FeedbackAnalytics, for all the given exploration ids.

    A FeedbackAnalytics contains the exploration id the analytics
    belongs to, how many open threads exist for the exploration,
    how many total threads exist for the exploration.

    Args:
        exploration_ids: list of str. A list of exploration ids.

    Returns:
        list of FeedbackAnalytics. It's in the the same order as the input
        list. If the exploration id is invalid, the number of threads in the
        corresponding FeedbackAnalytics object will be zero.
    """
    return feedback_jobs_continuous.FeedbackAnalyticsAggregator.get_thread_analytics_multi( # pylint: disable=line-too-long
        exploration_ids)


def get_thread_analytics(exploration_id):
    """Fetches the FeedbackAnalytics for the given exploration id.

    Args:
        exploration_id: str.

    Returns:
        list of FeedbackAnalytics.
    """
    return feedback_jobs_continuous.FeedbackAnalyticsAggregator.get_thread_analytics( # pylint: disable=line-too-long
        exploration_id)


def get_total_open_threads(feedback_thread_analytics):
    """Gets the count of all open threads for the given FeedbackThreadAnalytics
    domain object.

    Args:
        feedback_thread_analytics: FeedbackThreadAnalytics.

    Returns:
        int. The count of all open threads for the given FeedbackThreadAnalytics
        domain object.
    """
    return sum(
        feedback.num_open_threads for feedback in feedback_thread_analytics)


def create_suggestion(exploration_id, author_id, exploration_version,
                      state_name, description, suggestion_content):
    """Creates a new SuggestionModel and the corresponding FeedbackThreadModel
    domain object.

    Args:
        exploration_id: str. The exploration id the suggestion belongs to.
        author_id: str. ID of the user who submitted the suggestion.
        exploration_version: int. The exploration version for
            which the suggestion was made.
        state_name: str or None. The state name for the thread. If None,
            this indicates that the thread pertains to the exploration as a
            whole.
        description: str. Learner-provided description of suggestion changes.
        suggestion_content: dict. Only contains two keys, "type" and "value".
            For historical reasons, the value of "type" is always "text" while
            the value of "value" is the actual content of the suggestion.
    """
    thread_id = _create_models_for_thread_and_first_message(
        exploration_id, state_name, author_id, description,
        DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE, True)
    feedback_models.SuggestionModel.create(
        exploration_id, thread_id, author_id, exploration_version, state_name,
        description, suggestion_content)

    full_thread_id = (
        feedback_models.FeedbackThreadModel.generate_full_thread_id(
            exploration_id, thread_id))
    subscription_services.subscribe_to_thread(author_id, full_thread_id)
    _enqueue_suggestion_email_task(exploration_id, thread_id)


def _get_suggestion_from_model(suggestion_model):
    """Converts the given SuggestionModel to a Suggestion object.

    Args:
        suggestion_model: SuggestionModel.

    Returns:
        Suggestion. The corresponding Suggestion domain object.
    """
    return feedback_domain.Suggestion(
        suggestion_model.id, suggestion_model.author_id,
        suggestion_model.exploration_id, suggestion_model.exploration_version,
        suggestion_model.state_name, suggestion_model.description,
        suggestion_model.state_content)


def get_suggestion(exploration_id, thread_id):
    """Fetches the Suggestion for the given thread.

    Args:
        exploration_id: str. The exploration id of the given thread.
        thread_id: str. The thread id of the given thread.

    Returns:
        Suggestion, or None if there's no associated suggestion.
    """
    model = feedback_models.SuggestionModel.get_by_exploration_and_thread_id(
        exploration_id, thread_id)
    return _get_suggestion_from_model(model) if model else None


def _get_thread_from_model(thread_model):
    """Converts the given FeedbackThreadModel to a FeedbackThread object.

    Args:
        thread_model: FeedbackThreadModel.

    Returns:
        FeedbackThread. The corresponding FeedbackThread domain object.
    """
    return feedback_domain.FeedbackThread(
        thread_model.id, thread_model.exploration_id, thread_model.state_name,
        thread_model.original_author_id, thread_model.status,
        thread_model.subject, thread_model.summary, thread_model.has_suggestion,
        thread_model.created_on, thread_model.last_updated)


def get_most_recent_messages(exp_id):
    """Fetch the most recently updated feedback threads for a given exploration,
    and then get the latest feedback message out of each thread.

    Args:
        exp_id: str.

    Returns:
       A list of FeedbackMessage.
    """
    thread_models = (
        feedback_models.FeedbackThreadModel.get_threads(
            exp_id, limit=feconf.OPEN_FEEDBACK_COUNT_DASHBOARD))

    message_models = []
    for thread_model in thread_models:
        message_models.append(
            feedback_models.FeedbackMessageModel.get_most_recent_message(
                exp_id, thread_model.thread_id))

    return [
        _get_message_from_model(message_model)
        for message_model in message_models]


def get_threads(exploration_id):
    """Fetches all the threads for the given exploration id.

    Args:
        exploration_id: str.

    Returns:
        list of FeedbackThread. The corresponding Suggestion domain object.
    """
    thread_models = feedback_models.FeedbackThreadModel.get_threads(
        exploration_id)
    return [_get_thread_from_model(model) for model in thread_models]


def get_thread(exploration_id, thread_id):
    """Fetches the thread for the given exploration id and thread id.

    Args:
        exploration_id: str.
        thread_id: str.

    Returns:
        FeedbackThread. The resulting FeedbackThread domain object.
    """
    model = feedback_models.FeedbackThreadModel.get_by_exp_and_thread_id(
        exploration_id, thread_id)
    return _get_thread_from_model(model)


def get_open_threads(exploration_id, has_suggestion):
    """Fetches all open threads for the given exploration id.

    Args:
        exploration_id: str.
        has_suggestion: bool. If it's True, return a list of all open threads
            that have a suggestion, otherwise return a list of all open threads
            that do not have a suggestion.

    Returns:
        list of FeedbackThread. The resulting FeedbackThread domain objects.
    """

    threads = get_threads(exploration_id)
    open_threads = []
    for thread in threads:
        if (thread.has_suggestion == has_suggestion and
                thread.status == feedback_models.STATUS_CHOICES_OPEN):
            open_threads.append(thread)
    return open_threads


def get_closed_threads(exploration_id, has_suggestion):
    """Fetches all closed threads of the given exploration id.

    Args:
        exploration_id: str.
        has_suggestion: bool. If it's True, return a list of all closed threads
            that have a suggestion, otherwise return a list of all closed
            threads that do not have a suggestion.

    Returns:
        list of FeedbackThread. The resulting FeedbackThread domain objects.
    """
    threads = get_threads(exploration_id)
    closed_threads = []
    for thread in threads:
        if (thread.has_suggestion == has_suggestion and
                thread.status != feedback_models.STATUS_CHOICES_OPEN):
            closed_threads.append(thread)
    return closed_threads


def get_all_threads(exploration_id, has_suggestion):
    """Fetches all threads (regardless of their status) that correspond to the
    given exploration id.

    Args:
        exploration_id: str.
        has_suggestion: bool. If it's True, return a list of all threads
            that have a suggestion, otherwise return a list of all threads
            that do not have a suggestion.

    Returns:
        list of FeedbackThread. The resulting FeedbackThread domain objects.
    """
    threads = get_threads(exploration_id)
    all_threads = []
    for thread in threads:
        if thread.has_suggestion == has_suggestion:
            all_threads.append(thread)
    return all_threads


def get_all_thread_participants(exploration_id, thread_id):
    """Fetches all participants of the given thread.

    Args:
        exploration_id: str.
        thread_id: str.

    Returns:
        set(str). A set containing all author_ids of participants in the thread.
    """
    return set([m.author_id for m in get_messages(exploration_id, thread_id)
                if user_services.is_user_registered(m.author_id)])


def enqueue_feedback_message_batch_email_task(user_id):
    """Adds a 'send feedback email' (batch) task into the task queue.

    Args:
        user_id: str. The user to be notified.
    """
    taskqueue_services.enqueue_task(
        feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS, {'user_id': user_id},
        feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS)


def enqueue_feedback_message_instant_email_task(user_id, reference):
    """Adds a 'send feedback email' (instant) task into the task queue.

    Args:
        user_id: str. The user to be notified.
        reference: FeedbackMessageReference. A reference that contains
            the data needed to identify the feedback message.
    """

    payload = {
        'user_id': user_id,
        'reference_dict': reference.to_dict()
    }
    taskqueue_services.enqueue_task(
        feconf.TASK_URL_INSTANT_FEEDBACK_EMAILS, payload, 0)


def _enqueue_feedback_thread_status_change_email_task(
        user_id, reference, old_status, new_status):
    """Adds a task for sending email when a feedback thread status is changed.

    Args:
        user_id: str. The user to be notified.
        reference: FeedbackMessageReference.
        old_status: str, one of STATUS_CHOICES.
        new_status: str, one of STATUS_CHOICES.
    """

    payload = {
        'user_id': user_id,
        'reference_dict': reference.to_dict(),
        'old_status': old_status,
        'new_status': new_status
    }
    taskqueue_services.enqueue_task(
        feconf.TASK_URL_FEEDBACK_STATUS_EMAILS, payload, 0)


def _enqueue_suggestion_email_task(exploration_id, thread_id):
    """Adds a 'send suggestion email' task into the task queue.

    Args:
        exploration_id: str.
        thread_id: str.
    """

    payload = {
        'exploration_id': exploration_id,
        'thread_id': thread_id
    }
    # Suggestion emails are sent immediately.
    taskqueue_services.enqueue_task(
        feconf.TASK_URL_SUGGESTION_EMAILS, payload, 0)


def get_feedback_message_references(user_id):
    """Fetches all FeedbackMessageReference objects written by the given user。

    Args:
        user_id: str. If the user id is invalid or there is no message for this
            user, return an empty list.

    Returns:
        list of FeedbackMessageReference. The resulting FeedbackMessageReference
        domain objects.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)

    if model is None:
        # Model may not exist if user has already attended to feedback.
        return []

    return [feedback_domain.FeedbackMessageReference(
        reference['exploration_id'], reference['thread_id'],
        reference['message_id']
    ) for reference in model.feedback_message_references]


def _add_feedback_message_reference(user_id, reference):
    """Adds a new message to the feedback message buffer that is used to
    generate the next notification email to the given user.

    Args:
        user_id: str. If there's an UnsentFeedbackEmailModel for the given
            user, update the instance with given reference, otherwise
            create a new instance
        reference: FeedbackMessageReference. The new message reference to
            add to the buffer.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)
    if model is not None:
        model.feedback_message_references.append(reference.to_dict())
        model.put()
    else:
        model = feedback_models.UnsentFeedbackEmailModel(
            id=user_id,
            feedback_message_references=[reference.to_dict()])
        model.put()
        enqueue_feedback_message_batch_email_task(user_id)


def update_feedback_email_retries(user_id):
    """If sufficient time has passed, increment the number of retries for
    the corresponding user's UnsentEmailFeedbackModel.

    Args:
        user_id: str.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id)
    time_since_buffered = (
        (datetime.datetime.utcnow() - model.created_on).seconds)

    if (time_since_buffered >
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS):
        model.retries += 1
        model.put()


def pop_feedback_message_references(user_id, num_references_to_pop):
    """Pops feedback message references of the given user
    which have been processed already.

    Args:
        user_id: str.
        num_references_to_pop: int. Number of feedback message references
            that have been processed already.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id)

    if num_references_to_pop == len(model.feedback_message_references):
        model.delete()
    else:
        message_references = (
            model.feedback_message_references[num_references_to_pop:])
        model.delete()
        # We delete and recreate the model in order to re-initialize its
        # 'created_on' property and reset the retries count to 0.
        # If we don't do this, then the retries count will be incorrect.
        model = feedback_models.UnsentFeedbackEmailModel(
            id=user_id,
            feedback_message_references=message_references)
        model.put()
        enqueue_feedback_message_batch_email_task(user_id)


def clear_feedback_message_references(user_id, exploration_id, thread_id):
    """Removes feedback message references associated with a feedback thread.

    Args:
        user_id: str. The user who created this reference.
        exploration_id: str.
        thread_id: str.
    """
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)
    if model is None:
        # Model exists only if user has received feedback on exploration.
        return

    updated_references = []
    for reference in model.feedback_message_references:
        if (reference['exploration_id'] != exploration_id or
                reference['thread_id'] != thread_id):
            updated_references.append(reference)

    if not updated_references:
        # Note that any tasks remaining in the email queue will still be
        # processed, but if the model for the given user does not exist,
        # no email will be sent.

        # Note that, since the task in the queue is not deleted, the following
        # scenario may occur: If creator attends to arrived feedback bedore
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
    """Fetches all authors of the exploration excluding the given author and
    all the other recipients.

    Args:
        exploration_id: str.
        thread_id: str.
        author_id: str. One author of the given exploration_id.

    Returns:
         tuple of (batch_recipients, other_recipients)
            batch_recipients: set(str). The user_ids of the authors excluding
                the given author.
            other_recipients: set(str). The user_ids of the other participants
                in this thread, excluding owners of the exploration and the
                given author.
    """
    exploration_rights = rights_manager.get_exploration_rights(exploration_id)

    owner_ids = set(exploration_rights.owner_ids)
    participant_ids = get_all_thread_participants(exploration_id, thread_id)
    sender_id = set([author_id])

    batch_recipient_ids = owner_ids - sender_id
    other_recipient_ids = participant_ids - batch_recipient_ids - sender_id

    return (batch_recipient_ids, other_recipient_ids)


def _send_batch_emails(
        recipient_list, feedback_message_reference, exploration_id,
        has_suggestion):
    """Adds the given FeedbackMessageReference to each of the
    recipient's email buffers. The collected messages will be
    sent out as a batch after a short delay.

    Args:
        recipient_list: list of str. A list of user_ids of all recipients
            of the email.
        feedback_message_reference: FeedbackMessageReference.
            The reference to add to each email buffer.
        exploration_id: str. ID of exploration that received new message.
        has_suggestion: bool. Whether this thread has a related
            learner suggestion.
    """
    can_users_receive_email = (
        email_manager.can_users_receive_thread_email(
            recipient_list, exploration_id, has_suggestion))
    for index, recipient_id in enumerate(recipient_list):
        if can_users_receive_email[index]:
            transaction_services.run_in_transaction(
                _add_feedback_message_reference, recipient_id,
                feedback_message_reference)


def _send_instant_emails(
        recipient_list, feedback_message_reference, exploration_id,
        has_suggestion):
    """Adds the given FeedbackMessageReference to each of the
    recipient's email buffers. The collected messages will be
    sent out immediately.

    Args:
        recipient_list: list of str. A list of user_ids of all
            recipients of the email.
        feedback_message_reference: FeedbackMessageReference.
        exploration_id: str. ID of exploration that received new message.
        has_suggestion: bool. Whether this thread has a related
            learner suggestion.
    """
    can_users_receive_email = (
        email_manager.can_users_receive_thread_email(
            recipient_list, exploration_id, has_suggestion))
    for index, recipient_id in enumerate(recipient_list):
        if can_users_receive_email[index]:
            transaction_services.run_in_transaction(
                enqueue_feedback_message_instant_email_task, recipient_id,
                feedback_message_reference)


def _send_feedback_thread_status_change_emails(
        recipient_list, feedback_message_reference, old_status, new_status,
        exploration_id, has_suggestion):
    """Notifies the given recipients about the status change.

    Args:
        recipient_list: list of str. A list of recipient ids.
        feedback_message_reference: FeedbackMessageReference
        old_status: str, one of STATUS_CHOICES
        new_status: str, one of STATUS_CHOICES
        exploration_id: str. ID of exploration that received new message.
        has_suggestion: bool. Whether this thread has a related
            learner suggestion.
    """
    can_users_receive_email = (
        email_manager.can_users_receive_thread_email(
            recipient_list, exploration_id, has_suggestion))
    for index, recipient_id in enumerate(recipient_list):
        if can_users_receive_email[index]:
            transaction_services.run_in_transaction(
                _enqueue_feedback_thread_status_change_email_task,
                recipient_id, feedback_message_reference,
                old_status, new_status)


def _ensure_each_recipient_has_reply_to_id(user_ids, exploration_id, thread_id):
    """Ensures that instance of FeedbackEmailReplyToIdModel exists
    for each user in user_ids.

    Args:
        user_ids: list of str. A list of user_ids.
        exploration_id: str. The id of exploration used to obtain
            FeedbackEmailReplyToIdModel for given user.
        thread_id: str. The id of thread used to obtain
            FeedbackEmailReplyToIdModel for given user.
    """
    feedback_email_id_models = (
        email_models.FeedbackEmailReplyToIdModel.get_multi_by_user_ids(
            user_ids, exploration_id, thread_id))

    # Users are added to thread incrementally. Therefore at a time there can be
    # at most one user who does not have FeedbackEmailReplyToIdModel instance.
    for user_id in user_ids:
        if feedback_email_id_models[user_id] is None:
            new_model = email_models.FeedbackEmailReplyToIdModel.create(
                user_id, exploration_id, thread_id)
            new_model.put()


def _add_message_to_email_buffer(
        author_id, exploration_id, thread_id, message_id, message_length,
        old_status, new_status):
    """Sends the given message to the recipients of the given thread.

    Sends the given message to the recipients of the given thread. If
    status has changed, notify the recipients as well.

    Args:
        author_id: str. ID of author of message.
        exploration_id: str. ID of exploration that received new message.
        thread_id: str. ID of thread that received new message.
        message_id: int. ID of new message.
        message_length: int. Length of the feedback message to be sent.
        old_status: str, one of STATUS_CHOICES. Value of old thread status.
        new_status: str, one of STATUS_CHOICES. Value of new thread status.
    """
    thread = (
        feedback_models.FeedbackThreadModel.get_by_exp_and_thread_id(
            exploration_id, thread_id))
    has_suggestion = thread.has_suggestion

    feedback_message_reference = feedback_domain.FeedbackMessageReference(
        exploration_id, thread_id, message_id)
    batch_recipient_ids, other_recipient_ids = (
        _get_all_recipient_ids(exploration_id, thread_id, author_id))

    _ensure_each_recipient_has_reply_to_id(
        other_recipient_ids, exploration_id, thread_id)

    if old_status != new_status:
        # Send email for feedback thread status change.
        _send_feedback_thread_status_change_emails(
            other_recipient_ids, feedback_message_reference,
            old_status, new_status, exploration_id, has_suggestion)

    if message_length > 0:
        # Send feedback message email only if message text is non empty.
        # It can be empty in the case when only status is changed.
        _send_batch_emails(
            batch_recipient_ids, feedback_message_reference,
            exploration_id, has_suggestion)
        _send_instant_emails(
            other_recipient_ids, feedback_message_reference,
            exploration_id, has_suggestion)
