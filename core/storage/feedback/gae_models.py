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

"""Models for Oppia feedback threads and messages."""

__author__ = 'Koji Ashida'

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
import feconf
import utils

from google.appengine.ext import ndb

STATUS_CHOICES_OPEN = 'open'
STATUS_CHOICES_FIXED = 'fixed'
STATUS_CHOICES_IGNORED = 'ignored'
STATUS_CHOICES_COMPLIMENT = 'compliment'
STATUS_CHOICES_NOT_ACTIONABLE = 'not_actionable'
STATUS_CHOICES = [
    STATUS_CHOICES_OPEN,
    STATUS_CHOICES_FIXED,
    STATUS_CHOICES_IGNORED,
    STATUS_CHOICES_COMPLIMENT,
    STATUS_CHOICES_NOT_ACTIONABLE,
]


class FeedbackThreadModel(base_models.BaseModel):
    """Threads for each exploration.

    The id/key of instances of this class has the form
        [EXPLORATION_ID].[THREAD_ID]
    """
    # ID of the exploration the thread is about.
    exploration_id = ndb.StringProperty(required=True, indexed=True)
    # ID of state the thread is for. Does not exist if the thread is about the
    # entire exploration.
    state_name = ndb.StringProperty(indexed=True)
    # ID of the user who started the thread. This may be None if the feedback
    # was given anonymously by a learner.
    original_author_id = ndb.StringProperty(indexed=True)
    # Latest status of the thread.
    status = ndb.StringProperty(
        default=STATUS_CHOICES_OPEN,
        choices=STATUS_CHOICES,
        required=True,
        indexed=True,
    )
    # Latest subject of the thread.
    subject = ndb.StringProperty(indexed=False)
    # Summary text of the thread.
    summary = ndb.TextProperty(indexed=False)

    @classmethod
    def generate_new_thread_id(cls, exploration_id):
        """Generates a new thread id, unique within the exploration.

        Exploration ID + the generated thread ID is globally unique.
        """
        MAX_RETRIES = 10
        RAND_RANGE = 127 * 127
        for i in range(MAX_RETRIES):
            thread_id = (
                utils.base64_from_int(utils.get_current_time_in_millisecs()) +
                utils.base64_from_int(utils.get_random_int(RAND_RANGE)))
            if not cls.get_by_exp_and_thread_id(exploration_id, thread_id):
                return thread_id
        raise Exception(
            'New thread id generator is producing too many collisions.')

    @classmethod
    def _generate_id(cls, exploration_id, thread_id):
        return '.'.join([exploration_id, thread_id])

    @classmethod
    def create(cls, exploration_id, thread_id):
        """Creates a new FeedbackThreadModel entry.

        Throws an exception if a thread with the given exploration ID and
        thread ID combination exists already.
        """
        instance_id = cls._generate_id(exploration_id, thread_id)
        if cls.get_by_id(instance_id):
            raise Exception('Feedback thread ID conflict on create.')
        return cls(id=instance_id)

    @classmethod
    def get_by_exp_and_thread_id(cls, exploration_id, thread_id):
        """Gets the FeedbackThreadModel entry for the given ID.

        Returns None if the thread is not found or is already deleted.
        """
        return cls.get_by_id(cls._generate_id(exploration_id, thread_id))

    @classmethod
    def get_threads(cls, exploration_id):
        """Returns an array of threads associated to the exploration.

        Does not include the deleted entries.
        """
        return cls.get_all().filter(
            cls.exploration_id == exploration_id).fetch(
                feconf.DEFAULT_QUERY_LIMIT)


class FeedbackMessageModel(base_models.BaseModel):
    """Feedback messages. One or more of these messages make a thread.

    The id/key of instances of this class has the form
        [EXPLORATION_ID].[THREAD_ID].[MESSAGE_ID]
    """
    # ID corresponding to an entry of FeedbackThreadModel in the form of
    #   [EXPLORATION_ID].[THREAD_ID]
    thread_id = ndb.StringProperty(required=True, indexed=True)
    # 0-based sequential numerical ID. Sorting by this field will create the
    # thread in chronological order.
    message_id = ndb.IntegerProperty(required=True, indexed=True)
    # ID of the user who posted this message. This may be None if the feedback
    # was given anonymously by a learner.
    author_id = ndb.StringProperty(indexed=True)
    # New thread status. Must exist in the first message of a thread. For the
    # rest of the thread, should exist only when the status changes.
    updated_status = ndb.StringProperty(choices=STATUS_CHOICES, indexed=True)
    # New thread subject. Must exist in the first message of a thread. For the
    # rest of the thread, should exist only when the subject changes.
    updated_subject = ndb.StringProperty(indexed=False)
    # Message text. Allowed not to exist (e.g. post only to update the status).
    text = ndb.StringProperty(indexed=False)

    @classmethod
    def _generate_id(cls, thread_id, message_id):
        return '.'.join([thread_id, str(message_id)])

    @property
    def exploration_id(self):
        return self.id.split('.')[0]

    def get_thread_subject(self):
        return FeedbackThreadModel.get_by_id(self.thread_id).subject

    @classmethod
    def create(cls, thread_id, message_id):
        """Creates a new FeedbackMessageModel entry.

        Throws an exception if a message with the given thread ID and message
        ID combination exists already.
        """
        instance_id = cls._generate_id(thread_id, message_id)
        if cls.get_by_id(instance_id):
            raise Exception('Feedback message ID conflict on create.')
        return cls(id=instance_id)

    @classmethod
    def get(cls, thread_id, message_id, strict=True):
        """Gets the FeedbackMessageModel entry for the given ID.

        If the message id is valid and it is not marked as deleted, returns the
        message instance. Otherwise:
        - if strict is True, raises EntityNotFoundError
        - if strict is False, returns None.
        """
        instance_id = cls._generate_id(thread_id, message_id)
        return super(FeedbackMessageModel, cls).get(instance_id, strict=strict)

    @classmethod
    def get_messages(cls, thread_id):
        """Returns an array of messages in the thread.

        Does not include the deleted entries.
        """
        return cls.get_all().filter(
            cls.thread_id == thread_id).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_most_recent_message(cls, thread_id):
        return cls.get_all().filter(
            cls.thread_id == thread_id).order(-cls.last_updated).get()

    @classmethod
    def get_message_count(cls, thread_id):
        """Returns the number of messages in the thread.

        Includes the deleted entries.
        """
        return cls.get_all(include_deleted_entities=True).filter(
            cls.thread_id == thread_id).count()

    @classmethod
    def get_all_messages(cls, page_size, urlsafe_start_cursor):
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)


class FeedbackAnalyticsModel(base_models.BaseMapReduceBatchResultsModel):
    """Model for storing feedback thread analytics for an exploration.

    The key of each instance is the exploration id.
    """
    # The number of open feedback threads filed against this exploration.
    num_open_threads = ndb.IntegerProperty(default=None, indexed=True)
    # Total number of feedback threads filed against this exploration.
    num_total_threads = ndb.IntegerProperty(default=None, indexed=True)

    @classmethod
    def create(cls, id, num_open_threads, num_total_threads):
        """Creates a new FeedbackAnalyticsModel entry."""
        cls(
            id=id,
            num_open_threads=num_open_threads,
            num_total_threads=num_total_threads
        ).put()


class NewFeedbackThreadEventLogEntryModel(base_models.BaseModel):
    """An event triggered by adding a new message to an existing or new 
       feedback thread. This is keyed by exploration id.

    Event schema documentation
    --------------------------
    V1: 
        thread_id: id of the thread that this feedback message belongs to
        latest_status: the last updated status of the thread
        event_schema_version: 1
    """ 
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1 

    # Which specific type of event is this
    event_type = ndb.StringProperty(indexed=True,
                                    default=feconf.EVENT_TYPE_THREAD_OPENED)
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def create(cls, exp_id, version=1):
        """Creates a new add feedback message event."""
        start_event_entity = cls(id=exp_id,
            event_schema_version=version)
        start_event_entity.put()


class FeedbackThreadReopenedEventLogEntryModel(base_models.BaseModel):
    """An event triggered by reopeneing a closed feedback thread. This is keyed
       by exploration_id.

    Event schema documentation
    --------------------------
    V1: 
        thread_id: id of the thread that this feedback message belongs to
        latest_status: the last updated status of the thread
        event_schema_version: 1
    """ 
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1 

    # Which specific type of event is this
    event_type = ndb.StringProperty(indexed=True,
                                    default=feconf.EVENT_TYPE_THREAD_REOPENED)
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def create(cls, exp_id, version=1):
        """Creates a new add feedback message event."""
        start_event_entity = cls(id=exp_id,
            event_schema_version=version)
        start_event_entity.put()


class FeedbackThreadClosedEventLogEntryModel(base_models.BaseModel):
    """An event triggered by reopeneing a closed feedback thread. This is keyed
       by exploration_id.

    Event schema documentation
    --------------------------
    V1: 
        thread_id: id of the thread that this feedback message belongs to
        latest_status: the last updated status of the thread
        event_schema_version: 1
    """ 
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1 

    # Which specific type of event is this
    event_type = ndb.StringProperty(indexed=True,
                                    default=feconf.EVENT_TYPE_THREAD_CLOSED)
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def create(cls, exp_id, version=1):
        """Creates a new add feedback message event."""
        start_event_entity = cls(id=exp_id,
            event_schema_version=version)
        start_event_entity.put()
