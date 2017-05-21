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

from core.platform import models
import feconf
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

# Allowed feedback thread statuses.
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

# Constants used for generating new ids.
_MAX_RETRIES = 10
_RAND_RANGE = 127 * 127


class FeedbackThreadModel(base_models.BaseModel):
    """Threads for each exploration.

    The id of instances of this class has the form
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
    # Specifies whether this thread has a related learner suggestion.
    has_suggestion = ndb.BooleanProperty(indexed=True, default=False)

    @classmethod
    def generate_new_thread_id(cls, exploration_id):
        """Generates a new thread ID which is unique within the exploration.

        Args:
            exploration_id: str. The ID of the exploration.

        Returns:
            str. A thread ID that is different from the IDs of all
                the existing threads within the given exploration.

        Raises:
           Exception: There were too many collisions with existing thread IDs
               when attempting to generate a new thread ID.
        """
        for _ in range(_MAX_RETRIES):
            thread_id = (
                utils.base64_from_int(utils.get_current_time_in_millisecs()) +
                utils.base64_from_int(utils.get_random_int(_RAND_RANGE)))
            if not cls.get_by_exp_and_thread_id(exploration_id, thread_id):
                return thread_id
        raise Exception(
            'New thread id generator is producing too many collisions.')

    @classmethod
    def generate_full_thread_id(cls, exploration_id, thread_id):
        """Generates a full thread ID, given the exploration ID and
        the thread ID.

        Args:
            exploration_id: str. The exploration ID the thread belongs to.
            thread_id: str. The thread ID.

        Returns:
            str. Full thread ID.
        """
        return '.'.join([exploration_id, thread_id])

    @property
    def thread_id(self):
        """Returns the thread_id (not including the exploration_id) for this
        model instance.

        Returns:
            str. thread_id for this FeedbackThreadModel instance.
        """
        return self.id.split('.')[1]

    @classmethod
    def create(cls, exploration_id, thread_id):
        """Creates a new FeedbackThreadModel entry.

        Args:
            exploration_id: str. The ID of the exploration the thread
                belongs to.
            thread_id: str. Thread ID of the newly-created thread.

        Returns:
            str. The full thread ID for the newly-created FeedbackThreadModel
                instance. (This ID includes the exploration ID as a
                prefix.)

        Raises:
            Exception: A thread with the given exploration ID
                and thread ID combination exists already.
        """
        instance_id = cls.generate_full_thread_id(exploration_id, thread_id)
        if cls.get_by_id(instance_id):
            raise Exception('Feedback thread ID conflict on create.')
        return cls(id=instance_id)

    @classmethod
    def get_by_exp_and_thread_id(cls, exploration_id, thread_id):
        """Gets the FeedbackThreadModel entry for the given ID.

        Args:
            exploration_id: str. ID of the exploration.
            thread_id: str. ID of the thread.

        Returns:
            FeedbackThreadModel, or None if the thread is not found or is
                already deleted.
        """
        return cls.get_by_id(cls.generate_full_thread_id(
            exploration_id, thread_id))

    @classmethod
    def get_threads(cls, exploration_id, limit=feconf.DEFAULT_QUERY_LIMIT):
        """Returns a list of threads associated with the exploration, ordered
        by their "last updated" field. The number of entities fetched is
        limited by the `limit` argument to this method, whose default
        value is equal to the default query limit.

        Args:
            exploration_id: str.
            limit: int. The maximum possible number of items
                in the returned list.

        Returns:
            list(FeedbackThreadModel). List of threads associated with the
                exploration. Doesn't include deleted entries.
        """
        return cls.get_all().filter(
            cls.exploration_id == exploration_id).order(
                cls.last_updated).fetch(limit)


class FeedbackMessageModel(base_models.BaseModel):
    """Feedback messages. One or more of these messages make a thread.

    The id of instances of this class has the form
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
    # Whether the incoming message is received by email (as opposed to via
    # the web).
    received_via_email = ndb.BooleanProperty(default=False, indexed=True)

    @classmethod
    def _generate_id(cls, exploration_id, thread_id, message_id):
        """Generates full message ID given the exploration ID, thread
        ID and message ID.

        Args:
            exploration_id: str. ID of the exploration to which the message
                belongs.
            thread_id: str. Thread ID of the thread to which the message
                belongs.
            message_id: int. Message ID of the message.

        Returns:
            str. Full message ID.
        """
        return '.'.join([exploration_id, thread_id, str(message_id)])

    @property
    def exploration_id(self):
        return self.id.split('.')[0]

    def get_thread_subject(self):
        return FeedbackThreadModel.get_by_id(self.thread_id).subject

    @classmethod
    def create(cls, exploration_id, thread_id, message_id):
        """Creates a new FeedbackMessageModel entry.

        Args:
            exploration_id: str. ID of the exploration to which
                the message belongs.
            thread_id: str. ID of the thread.
            message_id: int. ID of the message.

        Returns:
            FeedbackMessageModel. Instance of the new FeedbackMessageModel
                entry.

        Raises:
            Exception: A message with the same ID already exists
                in the given thread.
        """
        instance_id = cls._generate_id(
            exploration_id, thread_id, message_id)
        if cls.get_by_id(instance_id):
            raise Exception('Feedback message ID conflict on create.')
        return cls(id=instance_id)

    @classmethod
    def get(cls, exploration_id, thread_id, message_id, strict=True):
        """Gets the FeedbackMessageModel entry for the given ID. Raises an
        error if no undeleted message with the given ID is found and
        strict == True.

        Args:
            exploration_id: str. ID of the exploration.
            thread_id: str. ID of the thread.
            message_id: int. ID of the message.
            strict: bool. Whether to raise an error if no FeedbackMessageModel
                entry is found for the given IDs.

        Returns:
            FeedbackMessageModel or None. If strict == False and no undeleted
                message with the given message_id exists in the datastore, then
                returns None. Otherwise, returns the FeedbackMessageModel
                instance that corresponds to the given ID.

        Raises:
            EntityNotFoundError: If strict == True and message ID is not valid
                or message is marked as deleted. No error will be raised if
                strict == False.
        """
        instance_id = cls._generate_id(exploration_id, thread_id, message_id)
        return super(FeedbackMessageModel, cls).get(instance_id, strict=strict)

    @classmethod
    def get_messages(cls, exploration_id, thread_id):
        """Returns a list of messages in the given thread. The number of
        messages returned is capped by feconf.DEFAULT_QUERY_LIMIT.

        Args:
            exploration_id: str. ID of the exploration the thread
                belongs to.
            thread_id: str. ID of the thread.

        Returns:
            list(FeedbackMessageModel). A list of messages in the
            given thread, up to a maximum of feconf.DEFAULT_QUERY_LIMIT
            messages.

        """
        full_thread_id = (
            FeedbackThreadModel.generate_full_thread_id(
                exploration_id, thread_id))

        return cls.get_all().filter(
            cls.thread_id == full_thread_id).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_most_recent_message(cls, exploration_id, thread_id):
        """Returns the last message in the thread.

        Args:
            exploration_id: str. ID of the exploration that the thread
                belongs to.
            thread_id: str. ID of the thread.

        Returns:
            FeedbackMessageModel. Last message in the thread.
        """
        full_thread_id = FeedbackThreadModel.generate_full_thread_id(
            exploration_id, thread_id)
        return cls.get_all().filter(
            cls.thread_id == full_thread_id).order(-cls.last_updated).get()

    @classmethod
    def get_message_count(cls, exploration_id, thread_id):
        """Returns the number of messages in the thread. Includes the
        deleted entries.

        Args:
            exploration_id: str. ID of the exploration that the thread
                belongs to.
            thread_id: str. ID of the thread.

        Returns:
            int. Number of messages in the thread.
        """
        full_thread_id = FeedbackThreadModel.generate_full_thread_id(
            exploration_id, thread_id)
        return cls.get_all(include_deleted=True).filter(
            cls.thread_id == full_thread_id).count()

    @classmethod
    def get_all_messages(cls, page_size, urlsafe_start_cursor):
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)


class FeedbackAnalyticsModel(base_models.BaseMapReduceBatchResultsModel):
    """Model for storing feedback thread analytics for an exploration.

    The key of each instance is the exploration ID.
    """
    # The number of open feedback threads for this exploration.
    num_open_threads = ndb.IntegerProperty(default=None, indexed=True)
    # Total number of feedback threads for this exploration.
    num_total_threads = ndb.IntegerProperty(default=None, indexed=True)

    @classmethod
    def create(cls, model_id, num_open_threads, num_total_threads):
        """Creates a new FeedbackAnalyticsModel entry.

        Args:
            model_id: str. ID of the model instance to be created. This
                is the same as the exploration ID.
            num_open_threads: int. Number of open feedback threads for
                this exploration.
            num_total_threads: int. Total number of feedback threads for
                this exploration.
        """
        cls(
            id=model_id,
            num_open_threads=num_open_threads,
            num_total_threads=num_total_threads
        ).put()


class SuggestionModel(base_models.BaseModel):
    """Suggestions made by learners.

    The id of each instance is the id of the corresponding thread.
    """

    # ID of the user who submitted the suggestion.
    author_id = ndb.StringProperty(required=True, indexed=True)
    # ID of the corresponding exploration.
    exploration_id = ndb.StringProperty(required=True, indexed=True)
    # The exploration version for which the suggestion was made.
    exploration_version = ndb.IntegerProperty(required=True, indexed=True)
    # Name of the corresponding state.
    state_name = ndb.StringProperty(required=True, indexed=True)
    # Learner-provided description of suggestion.
    description = ndb.TextProperty(required=True, indexed=False)
    # The state's content after the suggested edits.
    # Contains keys 'type' (always 'text') and 'value' (the actual content).
    state_content = ndb.JsonProperty(required=True, indexed=False)

    @classmethod
    def create(cls, exploration_id, thread_id, author_id, exploration_version,
               state_name, description, state_content):
        """Creates a new SuggestionModel entry.

        Args:
            exploration_id: str. ID of the corresponding exploration.
            thread_id: str. ID of the corresponding thread.
            author_id: str. ID of the user who submitted the suggestion.
            state_name: str. ID of the state the suggestion is for.
            description: str. Learner-provided description of suggestion.
            state_content: dict. Contains two keys, "type" and "value". For
                historical reasons, the value of "type" is always "text"
                while the value of "value" is the actual suggestion made
                by learner in the form of html content.
            exploration_version: int. exploration version for which the
                suggestion was made.

        Raises:
            Exception: There is already a feedback thread with the same
                exploration_id and thread_id.
        """
        instance_id = cls._get_instance_id(exploration_id, thread_id)
        if cls.get_by_id(instance_id):
            raise Exception('There is already a feedback thread with the given '
                            'thread id: %s' % instance_id)
        cls(id=instance_id, author_id=author_id,
            exploration_id=exploration_id,
            exploration_version=exploration_version,
            state_name=state_name,
            description=description,
            state_content=state_content).put()

    @classmethod
    def _get_instance_id(cls, exploration_id, thread_id):
        """Returns the full thread ID corresponding to the
        given exploration ID and thread ID.

         Args:
             exploration_id: str. ID of the exploration the thread
                belongs to.
             thread_id: str. ID of the thread.

         Returns:
             str. Returns the full thread ID corresponding to
                the given exploration ID and thread ID.
        """
        return '.'.join([exploration_id, thread_id])

    @classmethod
    def get_by_exploration_and_thread_id(cls, exploration_id, thread_id):
        """Gets a suggestion by the corresponding exploration and thread IDs.

        Args:
            exploration_id: str. ID of the exploration to which the
                suggestion belongs.
            thread_id: str. Thread ID of the suggestion thread.

        Returns:
            SuggestionModel or None. Suggestion related to the given
                exploration and thread IDs, or None if no such SuggestionModel
                exists.
        """

        return cls.get_by_id(cls._get_instance_id(exploration_id, thread_id))


class UnsentFeedbackEmailModel(base_models.BaseModel):
    """Model for storing feedback messages that need to be sent to creators.

    Instances of this model contain information about feedback messages that
    have been received by the site, but have not yet been sent to creators.
    The model instances will be deleted once the corresponding email has been
    sent.

    The id of each model instance is the user_id of the user who should receive
    the messages."""

    # The list of feedback messages that need to be sent to this user.
    # Each element in this list is a dict with keys 'exploration_id',
    # 'thread_id' and 'message_id'; this information is used to retrieve
    # corresponding FeedbackMessageModel instance.
    feedback_message_references = ndb.JsonProperty(repeated=True)
    # The number of failed attempts that have been made (so far) to
    # send an email to this user.
    retries = ndb.IntegerProperty(default=0, required=True, indexed=True)
