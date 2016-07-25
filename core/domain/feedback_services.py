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

"""Commands for feedback thread and message operations."""

import datetime

from core.domain import feedback_domain
from core.domain import feedback_jobs_continuous
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
import feconf

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()

DEFAULT_SUGGESTION_THREAD_SUBJECT = 'Suggestion from a learner'
DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE = ''


def _create_models_for_thread_and_first_message(
        exploration_id, state_name, original_author_id, subject, text,
        has_suggestion):
    """Creates a thread and the first message in it.

    Note that `state_name` may be None.
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
    """Public API for creating threads."""

    _create_models_for_thread_and_first_message(
        exploration_id, state_name, original_author_id, subject, text, False)


def create_message(
        exploration_id, thread_id, author_id, updated_status, updated_subject,
        text):
    """Creates a new message for the thread and subscribes the author to the
    thread.

    Returns False if the message with the ID already exists.
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
    msg.put()

    # We do a put() even if the status and subject are not updated, so that the
    # last_updated time of the thread reflects the last time a message was
    # added to it.
    if message_id != 0 and (updated_status or updated_subject):
        if updated_status and updated_status != thread.status:
            thread.status = updated_status
        if updated_subject and updated_subject != thread.subject:
            thread.subject = updated_subject
    thread.put()

    if (user_services.is_user_registered(author_id) and len(text) > 0 and
            feconf.CAN_SEND_EMAILS_TO_USERS and
            feconf.CAN_SEND_FEEDBACK_MESSAGE_EMAILS):
            # send feedback message email if user is registered.
        add_message_to_email_buffer(
            author_id, exploration_id, thread_id, message_id)

    if author_id:
        subscription_services.subscribe_to_thread(author_id, full_thread_id)

    return True


def _get_message_from_model(message_model):
    return feedback_domain.FeedbackMessage(
        message_model.id, message_model.thread_id, message_model.message_id,
        message_model.author_id, message_model.updated_status,
        message_model.updated_subject, message_model.text,
        message_model.created_on, message_model.last_updated)


def get_messages(exploration_id, thread_id):
    return [
        _get_message_from_model(m)
        for m in feedback_models.FeedbackMessageModel.get_messages(
            exploration_id, thread_id)]


def get_message(exploration_id, thread_id, message_id):
    return _get_message_from_model(
        feedback_models.FeedbackMessageModel.get(
            exploration_id, thread_id, message_id))


def get_next_page_of_all_feedback_messages(
        page_size=feconf.FEEDBACK_TAB_PAGE_SIZE, urlsafe_start_cursor=None):
    """Returns a page of feedback messages in reverse time order.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    results, new_urlsafe_start_cursor, more = (
        feedback_models.FeedbackMessageModel.get_all_messages(
            page_size, urlsafe_start_cursor))

    result_messages = [_get_message_from_model(m) for m in results]
    return (result_messages, new_urlsafe_start_cursor, more)

def get_thread_analytics_multi(exploration_ids):
    """Returns a dict with feedback thread analytics for the given exploration
    ids.
    """
    return feedback_jobs_continuous.FeedbackAnalyticsAggregator.get_thread_analytics_multi( # pylint: disable=line-too-long
        exploration_ids)


def get_thread_analytics(exploration_id):
    """Returns a dict with feedback thread analytics for the given exploration.

    The returned dict has two keys:
    - 'num_open_threads': the number of open feedback threads for this
        exploration.
    - 'num_total_threads': the total number of feedback threads for this
        exploration.
    """
    return feedback_jobs_continuous.FeedbackAnalyticsAggregator.get_thread_analytics( # pylint: disable=line-too-long
        exploration_id)


def get_total_open_threads(feedback_thread_analytics):
    """Returns the count of all open threads for the given
    FeedbackThreadAnalytics domain objects."""
    return sum(
        feedback.num_open_threads for feedback in feedback_thread_analytics)


def create_suggestion(exploration_id, author_id, exploration_version,
                      state_name, description, suggestion_content):
    """Creates a new SuggestionModel object and the corresponding
    FeedbackThreadModel object."""

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
    enqueue_suggestion_email_task(exploration_id, thread_id)


def _get_suggestion_from_model(suggestion_model):
    return feedback_domain.Suggestion(
        suggestion_model.id, suggestion_model.author_id,
        suggestion_model.exploration_id, suggestion_model.exploration_version,
        suggestion_model.state_name, suggestion_model.description,
        suggestion_model.state_content)


def get_suggestion(exploration_id, thread_id):
    model = feedback_models.SuggestionModel.get_by_exploration_and_thread_id(
        exploration_id, thread_id)
    return _get_suggestion_from_model(model) if model else None


def _get_thread_from_model(thread_model):
    return feedback_domain.FeedbackThread(
        thread_model.id, thread_model.exploration_id, thread_model.state_name,
        thread_model.original_author_id, thread_model.status,
        thread_model.subject, thread_model.summary, thread_model.has_suggestion,
        thread_model.created_on, thread_model.last_updated)


def get_threads(exploration_id):
    thread_models = feedback_models.FeedbackThreadModel.get_threads(
        exploration_id)
    return [_get_thread_from_model(model) for model in thread_models]


def get_open_threads(exploration_id, has_suggestion):
    """If has_suggestion is True, return a list of all open threads that have a
    suggestion, otherwise return a list of all open threads that do not have a
    suggestion."""

    threads = get_threads(exploration_id)
    open_threads = []
    for thread in threads:
        if (thread.has_suggestion == has_suggestion and
                thread.status == feedback_models.STATUS_CHOICES_OPEN):
            open_threads.append(thread)
    return open_threads

def get_closed_threads(exploration_id, has_suggestion):
    """If has_suggestion is True, return a list of all closed threads that have
    a suggestion, otherwise return a list of all closed threads that do not have
    a suggestion."""

    threads = get_threads(exploration_id)
    closed_threads = []
    for thread in threads:
        if (thread.has_suggestion == has_suggestion and
                thread.status != feedback_models.STATUS_CHOICES_OPEN):
            closed_threads.append(thread)
    return closed_threads


def get_all_threads(exploration_id, has_suggestion):
    """Returns a list of all threads with suggestions if has_suggestion is True;
    otherwise, returns a list of all threads with no suggestions."""

    threads = get_threads(exploration_id)
    all_threads = []
    for thread in threads:
        if thread.has_suggestion == has_suggestion:
            all_threads.append(thread)
    return all_threads


def enqueue_feedback_message_email_task(user_id):
    """Adds a 'send feedback email' task into the taskqueue."""

    taskqueue_services.enqueue_task(
        feconf.FEEDBACK_MESSAGE_EMAIL_HANDLER_URL, {'user_id': user_id},
        feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS)


def enqueue_suggestion_email_task(exploration_id, thread_id):
    """Adds a 'send suggestion email' task into taskqueue."""

    payload = {
        'exploration_id': exploration_id,
        'thread_id': thread_id
    }
    # Suggestion emails are sent immidiately.
    taskqueue_services.enqueue_task(
        feconf.SUGGESTION_EMAIL_HANDLER_URL, payload, 0)


def get_feedback_message_references(user_id):
    """Returns a list of feedback message references corresponding to the given
    user id. If the user id is invalid or there are no messages for this user,
    returns an empty list."""

    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)

    if model is None:
        # Model may not exist if user has already attended to feedback.
        return []

    return [feedback_domain.FeedbackMessageReference(
        reference['exploration_id'], reference['thread_id'],
        reference['message_id']
    ) for reference in model.feedback_message_references]


def _add_feedback_message_reference(user_id, reference):
    """Creates a new instance of UnsentFeedbackEmailModel or update existing
    model instance for sending feedback message email."""

    model = feedback_models.UnsentFeedbackEmailModel.get(user_id, strict=False)
    if model is not None:
        model.feedback_message_references.append(reference.to_dict())
        model.put()
    else:
        model = feedback_models.UnsentFeedbackEmailModel(
            id=user_id,
            feedback_message_references=[reference.to_dict()])
        model.put()
        enqueue_feedback_message_email_task(user_id)


def update_feedback_email_retries(user_id):
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id)
    time_since_buffered = (
        (datetime.datetime.utcnow() - model.created_on).seconds)

    if (time_since_buffered >
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS):
        model.retries += 1
        model.put()


def pop_feedback_message_references(user_id, references_length):
    """Pop feedback message references which have been processed already.

    Args:
    - user_id: id of the receiving user.
    - references_length: no. of feedback message references that have been
    processed already."""
    model = feedback_models.UnsentFeedbackEmailModel.get(user_id)

    if references_length == len(model.feedback_message_references):
        model.delete()
    else:
        message_references = (
            model.feedback_message_references[references_length:])
        model.delete()
        # We delete and recreate the model in order to re-initialize its
        # 'created_on' property and reset the retries count to 0.
        # If we don't do this, then the retries count will be incorrect.
        model = feedback_models.UnsentFeedbackEmailModel(
            id=user_id,
            feedback_message_references=message_references)
        model.put()
        enqueue_feedback_message_email_task(user_id)


def clear_feedback_message_references(user_id, exploration_id, thread_id):
    """Removes feedback message references associated with a feedback thread."""
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


def add_message_to_email_buffer(author_id, exploration_id, thread_id,
                                message_id):
    exploration_rights = rights_manager.get_exploration_rights(exploration_id)
    feedback_message_reference = feedback_domain.FeedbackMessageReference(
        exploration_id, thread_id, message_id)

    for owner_id in exploration_rights.owner_ids:
        owner_preferences = user_services.get_email_preferences(owner_id)
        if (owner_id != author_id and
                owner_preferences['can_receive_feedback_message_email']):
            transaction_services.run_in_transaction(
                _add_feedback_message_reference, owner_id,
                feedback_message_reference)
