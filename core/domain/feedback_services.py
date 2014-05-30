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


def get_threadlist(exploration_id):
    result = []
    for t in feedback_models.FeedbackThreadModel.get_threads(exploration_id):
        result.append({
            'thread_id': t.id,
            'state_name': t.state_name,
            'original_author_id': t.original_author_id,
            'status': t.status,
            'subject': t.subject,
            'summary': t.summary,
        })
    return result


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


def get_thread(thread_id):
    result = []
    for t in feedback_models.FeedbackMessageModel.get_thread(thread_id):
        result.append({
            'message_id': t.message_id,
            'author_id': t.author_id,
            'updated_status': t.updated_status,
            'updated_subject': t.updated_subject,
            'text': t.text,
        })
    return result


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

    if message_id != 0 and (updated_status or updated_subject):
        thread = feedback_models.FeedbackThreadModel.get(thread_id)
        updated = False
        if updated_status and updated_status != thread.status:
            thread.status = updated_status
            updated = True
        if updated_subject and updated_subject != thread.subject:
            thread.subject = updated_subject
            updated = True
        if updated:
            thread.put()
    return True
