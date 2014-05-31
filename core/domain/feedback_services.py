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

"""Commands for feedback thread and message operations.
"""

__author__ = 'Koji Ashida'

from core.platform import models
(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
import utils


def get_threadlist(exploration_id):
    return [{
        'last_updated': utils.get_time_in_millisecs(t.last_updated),
        'original_author_id': t.original_author_id,
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
        exploration_id, thread.id, original_author_id,
        feedback_models.STATUS_CHOICES_OPEN, subject, text)


def get_messages(thread_id):
    return [{
        'author_id': m.author_id,
        'created_on': utils.get_time_in_millisecs(m.created_on),
        'message_id': m.message_id,
        'text': m.text,
        'updated_status': m.updated_status,
        'updated_subject': m.updated_subject,
    } for m in feedback_models.FeedbackMessageModel.get_messages(thread_id)]


def create_message(
        exploration_id, thread_id, author_id, updated_status,
        updated_subject, text):
    """Creates a new message for the thread.

    Returns False if the message with the ID already exists.
    """
    message_id = feedback_models.FeedbackMessageModel.message_count(thread_id)
    msg = feedback_models.FeedbackMessageModel.get(thread_id, message_id)
    if msg:
        raise Exception(
            'Message creation failed. Message %d thread %s already exits.' % (
                message_id, thread_id))
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
        updated = False
        if updated_status and updated_status != thread.status:
            thread.status = updated_status
            updated = True
        if updated_subject and updated_subject != thread.subject:
            thread.subject = updated_subject
            updated = True
    thread.put()
    return True
