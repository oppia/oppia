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

"""Domain objects for feedback models."""

from core.domain import user_services
import utils


class FeedbackThread(object):
    """Domain object for a feedback thread.

    Attributes:
        thread_id: str. The feedback thread ID.
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        state_name: str. The name of the state associated with
            the feedback thread.
        original_author_id: str. The ID of the original author.
        status: str. The current status of the thread. Status should
            be one of core.storage.feedback.gae_models.STATUS_CHOICES.
        subject: str. The subject of the feedback thread.
        summary: str. A summary of the feedback thread.
        has_suggestion: bool. Whether the feedback thread includes a
            suggestion.
        created_on: datetime.datetime. The time when the feedback thread was
            created.
        last_updated: datetime.datetime. The time when the feedback thread
            was last updated.
    """

    def __init__(
            self, thread_id, entity_type, entity_id, state_name,
            original_author_id, status, subject, summary, has_suggestion,
            message_count, created_on, last_updated):
        """Initializes a FeedbackThread object."""

        self.id = thread_id
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.state_name = state_name
        self.original_author_id = original_author_id
        self.status = status
        self.subject = subject
        self.summary = summary
        self.has_suggestion = has_suggestion
        self.message_count = message_count

        self.created_on = created_on
        self.last_updated = last_updated

    def to_dict(self):
        """Returns a dict representation of this FeedbackThread object.

        Returns:
            dict. A dict representation of the FeedbackThread object.
        """
        return {
            'last_updated': utils.get_time_in_millisecs(self.last_updated),
            'original_author_username': user_services.get_username(
                self.original_author_id) if self.original_author_id else None,
            'state_name': self.state_name,
            'status': self.status,
            'subject': self.subject,
            'summary': self.summary,
            'thread_id': self.id,
            'message_count': self.message_count
        }

    def get_full_message_id(self, message_id):
        """Returns the full id of the message.

        Args:
            message_id: int. The id of the message for which we have to fetch
                the complete message id.

        Returns:
            str. The full id corresponding to the given message id.
        """
        return '.'.join([self.id, str(message_id)])

    def get_last_two_message_ids(self):
        """Returns the full message ids of the last two messages of the thread.
        If the thread has only one message, the id of the second last message is
        None.

        Returns:
            list(str|None). The ids of the last two messages of the thread. If
                the message does not exist, None is returned.
        """
        message_ids = []
        last_message_id = self.message_count - 1
        message_ids.append(self.get_full_message_id(last_message_id))
        if self.message_count > 1:
            second_last_message_id = self.message_count - 2
            message_ids.append(self.get_full_message_id(second_last_message_id))
        else:
            message_ids.append(None)
        return message_ids


class FeedbackMessage(object):
    """Domain object for a feedback message.

    Attributes:
        full_message_id: str. The ID of the feedback message.
        thread_id: str. The ID of the feedback thread containing this
            message.
        message_id: str. The ID of the feedback thread message.
        author_id: str. The ID of the message's author.
        updated_status: str. The new status of the feedback thread.
        updated_subject: str. The new feedback thread subject.
        text: str. The text for the full feedback thread message.
        created_on: datetime.datetime. The time when the feedback message was
            created.
        last_updated: datetime.datetime. The time when the feedback message
            was last updated.
        received_via_email: bool. Whether the feedback was received via email.
    """

    def __init__(
            self, full_message_id, thread_id, message_id, author_id,
            updated_status, updated_subject, text, created_on,
            last_updated, received_via_email):
        self.id = full_message_id
        self.thread_id = thread_id
        self.message_id = message_id
        self.author_id = author_id
        self.updated_status = updated_status
        self.updated_subject = updated_subject
        self.text = text
        self.created_on = created_on
        self.last_updated = last_updated
        self.received_via_email = received_via_email

    @property
    def entity_id(self):
        """Returns the entity ID corresponding to this FeedbackMessage instance.

        Returns:
            str. The entity_id.
        """
        return self.id.split('.')[1]

    @property
    def entity_type(self):
        """Returns the entity type corresponding to this FeedbackMessage
        instance.

        Returns:
            str. The entity_type.
        """
        return self.id.split('.')[0]

    def to_dict(self):
        """Returns a dict representation of this FeedbackMessage object.

        Returns:
            dict. Dict representation of the FeedbackMessage object.
        """
        return {
            'author_username': (
                user_services.get_username(self.author_id)
                if self.author_id else None),
            'created_on': utils.get_time_in_millisecs(self.created_on),
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'message_id': self.message_id,
            'text': self.text,
            'updated_status': self.updated_status,
            'updated_subject': self.updated_subject,
            'received_via_email': self.received_via_email
        }


class FeedbackAnalytics(object):
    """Domain object representing feedback analytics for a specific entity.

    Attributes:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        num_open_threads: int. The number of open threads associated with the
            entity.
        num_total_threads: int. The total number of threads associated with the
            entity (regardless of status).
    """

    def __init__(
            self, entity_type, entity_id, num_open_threads, num_total_threads):
        """Initializes a FeedbackAnalytics object."""

        self.id = entity_id
        self.entity_type = entity_type
        self.num_open_threads = num_open_threads
        self.num_total_threads = num_total_threads

    def to_dict(self):
        """Returns the numbers of threads in the FeedbackAnalytics object.

        Attributes:
            dict. Dict representation of the numbers of threads in the
                FeedbackAnalytics object.
        """
        return {
            'num_open_threads': self.num_open_threads,
            'num_total_threads': self.num_total_threads
        }


class FeedbackMessageReference(object):
    """Domain object for feedback message references.

    Attributes:
        entity_type: str. The type of entity the feedback thread is linked to.
        entity_id: str. The id of the entity.
        thread_id: str. The ID of the feedback thread.
        message_id: str. The ID of the feedback thread message.
    """

    def __init__(self, entity_type, entity_id, thread_id, message_id):
        """Initializes FeedbackMessageReference object."""
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.thread_id = thread_id
        self.message_id = message_id

    def to_dict(self):
        """Returns dict representation of the FeedbackMessageReference object.

        Returns:
            dict. Dict representation of the FeedbackMessageReference object.
        """
        return {
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'thread_id': self.thread_id,
            'message_id': self.message_id
        }
