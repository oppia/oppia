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
    """Domain object for a feedback thread.
    
    Attributes:
        full_thread_id: str. The feedback thread ID.
        exploration_id: str. The associated exploration's ID.
        state_name: str. The name of the state associated with 
            the feedback thread.
        original_author_id: str. The ID of the original author.
        status: string(select). The current status of the 
            thread.
        subject: str. The subject of the feedback thread.
        summary: str. A summary of the feedback thread.
        has_suggestion: bool. Indicates whether a given exploration has a 
            change suggestion.
        created_on: str. The date in which the feedback thread was created. 
        last_updated: str. The date in which the feedback thread was last 
            updated.
    """

    def __init__(self, full_thread_id, exploration_id, state_name,
                 original_author_id, status, subject, summary, has_suggestion,
                 created_on, last_updated):
        """Initializes a FeedbackThread object.
        """

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
        """
        
        Returns:
            str. The full feedback thread ID from the main object.
        """
        return FeedbackThread.get_thread_id_from_full_thread_id(self.id)


    def to_dict(self):
        """
        
        Returns:
            list(dict). Dicts mapping key-value pairs based on the 
            corresponding data fetched regarding the given feedback thread.
        """        
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
        """
        
        Returns:
            str. The full feedback thread ID split by a period(.) separator.
        """
        return full_thread_id.split('.')[0]

    @staticmethod
    def get_thread_id_from_full_thread_id(full_thread_id):
        """
        
        Returns:
            str. The full feedback thread ID split by a period(.) separator.
        """
        return full_thread_id.split('.')[1]


class FeedbackMessage(object):
    """Domain object for a feedback message.
    
    Attributes:
        full_message_id: str. The ID to the full feedback thread 
            message.
        full_thread_id: str. The containing feedback thread 
            ID. 
        message_id: str. The ID of the feedback thread message.
        author_id: str. The ID of the message's author.
        updated_status: str. The new status of the feedback 
            thread.
        updated_subject: str. The new feedback thread subject.
        text: This is the text for the full feedback thread message.
    """

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
        """
        
        Returns:
            str. Exploration ID split by the period(.) separator.
        """
        return self.id.split('.')[0]

    def to_dict(self):
        """
        
        Returns:
            list(dict). Dicts mapping key-value pairs based on the 
            corresponding data fetched regarding the given feedback message.
        """
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
    
    Attributes:
        exploration_id: str. The associated exploration's ID.
        num_open_threads: int. The number of open threads under 
            a given exploration.
        num_total_threads: int. The number of total threads under 
            a given exploration (regardless of status).
    """

    def __init__(self, exploration_id, num_open_threads, num_total_threads):
        """Initializes a FeedbackAnalytics object.
        """
        self.id = exploration_id
        self.num_open_threads = num_open_threads
        self.num_total_threads = num_total_threads

    def to_dict(self):
        """
        
        Returns:
            list(dict). Dicts mapping key-value pairs based on the 
            corresponding data fetched regarding the number of open and total
            threads respectively.
        """
        return {
            'num_open_threads': self.num_open_threads,
            'num_total_threads': self.num_total_threads
        }
        

class Suggestion(object):
    """Domain object for a suggestion.
    
    Attributes:
        full_thread_id: str. The suggestion thread ID.
        author_id: str. The ID of the message's author.
        exploration_id: str. The associated exploration's ID.
        exploration_version: This represents the version of the exploration 
            associated with the suggestion.
        state_name: The name of the state attached to the suggestion.
        description: A description of the change suggestion.
        state_content: The state's "suggested" content.
    """

    def __init__(self, full_thread_id, author_id, exploration_id,
                 exploration_version, state_name, description, state_content):
        """Initializes a Suggestion object. 
        """
        self.id = full_thread_id
        self.author_id = author_id
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_name = state_name
        self.description = description
        self.state_content = state_content

    def get_author_name(self):
        """
        
        Returns:
            str. The ID of the specified author in the call.
        """
        return user_services.get_username(self.author_id)

    def to_dict(self):
        """
        
        Returns:
            list(dict). Dicts mapping key-value pairs based on the 
            corresponding data fetched regarding the a given suggestion thread.
        """
        return {
            'author_name': self.get_author_name(),
            'exploration_id': self.exploration_id,
            'exploration_version': self.exploration_version,
            'state_name': self.state_name,
            'description': self.description,
            'state_content': self.state_content
        }


class FeedbackMessageReference(object):
    """Domain object for feedback message references
    
    Attributes:
        exploration_id: str. The associated exploration's ID.
        thread_id: str. The feedback thread's ID.
        message_id: str. The ID of the feedback thread message.
    """

    def __init__(self, exploration_id, thread_id, message_id):
        """Initializes a FeedbackMessageReference object.
        """
        self.exploration_id = exploration_id
        self.thread_id = thread_id
        self.message_id = message_id

    def to_dict(self):
        """
        
        Returns:
            list(dict). Dicts mapping key-value pairs based on the 
            corresponding data fetched regarding a particular feedback message
            reference.
        """
        return {
            'exploration_id': self.exploration_id,
            'thread_id': self.thread_id,
            'message_id': self.message_id
        }
