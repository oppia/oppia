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

__author__ = 'Koji Ashida'

from core.domain import user_services
from core.platform import models
(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
import feconf
import utils


def get_threadlist(exploration_id):
    return [{
        'last_updated': utils.get_time_in_millisecs(t.last_updated),
        'original_author_username': user_services.get_username(
            t.original_author_id) if t.original_author_id else None,
        'state_name': t.state_name,
        'status': t.status,
        'subject': t.subject,
        'summary': t.summary,
        'thread_id': t.id,
    } for t in feedback_models.FeedbackThreadModel.get_threads(exploration_id)]


def create_thread(
        exploration_id, state_name, original_author_id, subject, text):
    """Creates a thread and the first message in it."""
    thread_id = feedback_models.FeedbackThreadModel.generate_new_thread_id(
        exploration_id)
    thread = feedback_models.FeedbackThreadModel.create(
        exploration_id, thread_id)
    thread.exploration_id = exploration_id
    thread.state_name = state_name
    thread.original_author_id = original_author_id
    thread.status = feedback_models.STATUS_CHOICES_OPEN
    thread.subject = subject
    thread.put()
    create_message(
        thread.id, original_author_id,
        feedback_models.STATUS_CHOICES_OPEN, subject, text)


def _get_message_dict(message_instance):
    return {
        'author_username': (
            user_services.get_username(message_instance.author_id)
            if message_instance.author_id else None),
        'created_on': utils.get_time_in_millisecs(message_instance.created_on),
        'exploration_id': message_instance.exploration_id,
        'message_id': message_instance.message_id,
        'text': message_instance.text,
        'updated_status': message_instance.updated_status,
        'updated_subject': message_instance.updated_subject,
    }


def get_messages(thread_id):
    return [
        _get_message_dict(m)
        for m in feedback_models.FeedbackMessageModel.get_messages(thread_id)]


def create_message(
        thread_id, author_id, updated_status, updated_subject, text):
    """Creates a new message for the thread.

    Returns False if the message with the ID already exists.
    """
    message_id = feedback_models.FeedbackMessageModel.get_message_count(
        thread_id)
    msg = feedback_models.FeedbackMessageModel.create(thread_id, message_id)
    msg.thread_id = thread_id
    msg.message_id = message_id
    msg.author_id = author_id
    if updated_status:
        msg.updated_status = updated_status
    if updated_subject:
        msg.updated_subject = updated_subject
    msg.text = text
    msg.put()

    # We do a put() even if the status and subject are not updated, so that the
    # last_updated time of the thread reflects the last time a message was
    # added to it.
    thread = feedback_models.FeedbackThreadModel.get(thread_id)
    if message_id != 0 and (updated_status or updated_subject):
        if updated_status and updated_status != thread.status:
            thread.status = updated_status
        if updated_subject and updated_subject != thread.subject:
            thread.subject = updated_subject
    thread.put()
    return True


def get_next_page_of_all_feedback_messages(
        page_size=feconf.DEFAULT_PAGE_SIZE, urlsafe_start_cursor=None):
    """Returns a page of feedback messages in reverse time order.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    results, new_urlsafe_start_cursor, more = (
        feedback_models.FeedbackMessageModel.get_all_messages(
            page_size, urlsafe_start_cursor))

    result_dicts = [_get_message_dict(m) for m in results]
    return (result_dicts, new_urlsafe_start_cursor, more)


def get_last_updated_time(exploration_id):
    """Returns the most recent time a thread for this exploration was updated.

    If this exploration has no threads, returns None.
    """
    threadlist = get_threadlist(exploration_id)
    return max(
        [thread['last_updated'] for thread in threadlist]
    ) if threadlist else None
