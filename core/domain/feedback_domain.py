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

"""Domain objects for feedback models"""

from core.domain import user_services
import utils


class FeedbackThread(object):
    """Domain object for a feedback thread."""

    def __init__(self, full_thread_id, exploration_id, state_name,
                 original_author_id, status, subject, summary, has_suggestion,
                 created_on, last_updated):
        self.id = full_thread_id
        self.exploration_id = exploration_id
        self.state_name = state_name
        self.original_author_id = original_author_id
        self.status = status
        self.subject = subject
        self.summary = summary
        self.has_suggestion = has_suggestion

        self.created_on = created_on
        self.last_updated = last_updated

    def get_thread_id(self):
        return FeedbackThread.get_thread_id_from_full_thread_id(self.id)

    def to_dict(self):
        return {
            'last_updated': utils.get_time_in_millisecs(self.last_updated),
            'original_author_username': user_services.get_username(
                self.original_author_id) if self.original_author_id else None,
            'state_name': self.state_name,
            'status': self.status,
            'subject': self.subject,
            'summary': self.summary,
            'thread_id': self.get_thread_id()
        }

    @staticmethod
    def get_exp_id_from_full_thread_id(full_thread_id):
        return full_thread_id.split('.')[0]

    @staticmethod
    def get_thread_id_from_full_thread_id(full_thread_id):
        return full_thread_id.split('.')[1]


class FeedbackMessage(object):
    """Domain object for a feedback message."""

    def __init__(self, full_message_id, full_thread_id, message_id, author_id,
                 updated_status, updated_subject, text,
                 created_on, last_updated):
        self.id = full_message_id
        self.full_thread_id = full_thread_id
        self.message_id = message_id
        self.author_id = author_id
        self.updated_status = updated_status
        self.updated_subject = updated_subject
        self.text = text
        self.created_on = created_on
        self.last_updated = last_updated

    @property
    def exploration_id(self):
        return self.id.split('.')[0]

    def to_dict(self):
        return {
            'author_username': (
                user_services.get_username(self.author_id)
                if self.author_id else None),
            'created_on': utils.get_time_in_millisecs(self.created_on),
            'exploration_id': self.exploration_id,
            'message_id': self.message_id,
            'text': self.text,
            'updated_status': self.updated_status,
            'updated_subject': self.updated_subject,
        }


class FeedbackAnalytics(object):
    """Domain object representing feedback analytics
    for a specific exploration.
    """

    def __init__(self, exploration_id, num_open_threads, num_total_threads):
        self.id = exploration_id
        self.num_open_threads = num_open_threads
        self.num_total_threads = num_total_threads

    def to_dict(self):
        return {
            'num_open_threads': self.num_open_threads,
            'num_total_threads': self.num_total_threads
        }


class Suggestion(object):
    """Domain object for a suggestion."""

    def __init__(self, full_thread_id, author_id, exploration_id,
                 exploration_version, state_name, description, state_content):
        self.id = full_thread_id
        self.author_id = author_id
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_name = state_name
        self.description = description
        self.state_content = state_content

    def get_author_name(self):
        return user_services.get_username(self.author_id)

    def to_dict(self):
        return {
            'author_name': self.get_author_name(),
            'exploration_id': self.exploration_id,
            'exploration_version': self.exploration_version,
            'state_name': self.state_name,
            'description': self.description,
            'state_content': self.state_content
        }


class FeedbackMessageReference(object):
    """Domain object for feedback message references"""

    def __init__(self, exploration_id, thread_id, message_id):
        self.exploration_id = exploration_id
        self.thread_id = thread_id
        self.message_id = message_id

    def to_dict(self):
        return {
            'exploration_id': self.exploration_id,
            'thread_id': self.thread_id,
            'message_id': self.message_id
        }
