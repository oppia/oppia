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

import datetime

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


class GeneralFeedbackThreadModel(base_models.BaseModel):
    """Threads for each entity.

    The id of instances of this class has the form
        [ENTITY_TYPE].[ENTITY_ID].[GENERATED_STRING]
    """
    # The type of entity the thread is linked to.
    entity_type = ndb.StringProperty(required=True, indexed=True)
    # The ID of the entity the thread is linked to.
    entity_id = ndb.StringProperty(required=True, indexed=True)
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
    subject = ndb.StringProperty(indexed=True, required=True)
    # Summary text of the thread.
    summary = ndb.TextProperty(indexed=False)
    # Specifies whether this thread has a related suggestion.
    has_suggestion = ndb.BooleanProperty(
        indexed=True, default=False, required=True)
    # The number of messages in the thread.
    message_count = ndb.IntegerProperty(indexed=True, default=0)
    # When this thread was last updated. This overrides the field in
    # BaseModel. We are overriding it because we do not want the last_updated
    # field to be updated everytime the feedback thread is changed. For example,
    # on running the job for calculating the number of messages in a thread
    # and updating the message_count field we do not wish the last_updated field
    # to be updated.
    last_updated = ndb.DateTimeProperty(indexed=True, required=True)

    def put(self, update_last_updated_time=True):
        """Writes the given thread instance to the datastore.

        Args:
            update_last_updated_time: bool. Whether to update the
                last_updated_field of the thread.

        Returns:
            GeneralFeedbackThreadModel. The thread entity.
        """
        if update_last_updated_time:
            self.last_updated = datetime.datetime.utcnow()

        return super(GeneralFeedbackThreadModel, self).put()


    @classmethod
    def generate_new_thread_id(cls, entity_type, entity_id):
        """Generates a new thread ID which is unique.

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.

        Returns:
            str. A thread ID that is different from the IDs of all
                the existing threads within the given entity.

        Raises:
           Exception: There were too many collisions with existing thread IDs
               when attempting to generate a new thread ID.
        """
        for _ in range(_MAX_RETRIES):
            thread_id = (
                entity_type + '.' + entity_id + '.' +
                utils.base64_from_int(utils.get_current_time_in_millisecs()) +
                utils.base64_from_int(utils.get_random_int(_RAND_RANGE)))
            if not cls.get_by_id(thread_id):
                return thread_id
        raise Exception(
            'New thread id generator is producing too many collisions.')

    @classmethod
    def create(cls, thread_id):
        """Creates a new FeedbackThreadModel entry.

        Args:
            thread_id: str. Thread ID of the newly-created thread.

        Returns:
            GeneralFeedbackThreadModel. The newly created FeedbackThreadModel
                instance.

        Raises:
            Exception: A thread with the given thread ID exists already.
        """
        if cls.get_by_id(thread_id):
            raise Exception('Feedback thread ID conflict on create.')
        return cls(id=thread_id)

    @classmethod
    def get_threads(
            cls, entity_type, entity_id, limit=feconf.DEFAULT_QUERY_LIMIT):
        """Returns a list of threads associated with the entity, ordered
        by their "last updated" field. The number of entities fetched is
        limited by the `limit` argument to this method, whose default
        value is equal to the default query limit.

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.
            limit: int. The maximum possible number of items in the returned
                list.

        Returns:
            list(GeneralFeedbackThreadModel). List of threads associated with
                the entity. Doesn't include deleted entries.
        """
        return cls.get_all().filter(cls.entity_type == entity_type).filter(
            cls.entity_id == entity_id).order(-cls.last_updated).fetch(limit)


class GeneralFeedbackMessageModel(base_models.BaseModel):
    """Feedback messages. One or more of these messages make a thread.

    The id of instances of this class has the form [THREAD_ID].[MESSAGE_ID]
    """
    # ID corresponding to an entry of FeedbackThreadModel.
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
    received_via_email = ndb.BooleanProperty(
        default=False, indexed=True, required=True)

    @classmethod
    def _generate_id(cls, thread_id, message_id):
        """Generates full message ID given the thread ID and message ID.

        Args:
            thread_id: str. Thread ID of the thread to which the message
                belongs.
            message_id: int. Message ID of the message.

        Returns:
            str. Full message ID.
        """
        return '.'.join([thread_id, str(message_id)])

    @property
    def entity_id(self):
        """Returns the entity_id corresponding to this thread instance.

        Returns:
            str. The entity_id.
        """
        return self.id.split('.')[1]

    @property
    def entity_type(self):
        """Returns the entity_type corresponding to this thread instance.

        Returns:
            str. The entity_type.
        """
        return self.id.split('.')[0]

    @classmethod
    def create(cls, thread_id, message_id):
        """Creates a new GeneralFeedbackMessageModel entry.

        Args:
            thread_id: str. ID of the thread.
            message_id: int. ID of the message.

        Returns:
            GeneralFeedbackMessageModel. Instance of the new
                GeneralFeedbackMessageModel entry.

        Raises:
            Exception: A message with the same ID already exists
                in the given thread.
        """
        instance_id = cls._generate_id(thread_id, message_id)
        if cls.get_by_id(instance_id):
            raise Exception('Feedback message ID conflict on create.')
        return cls(id=instance_id)

    @classmethod
    def get(cls, thread_id, message_id, strict=True):
        """Gets the GeneralFeedbackMessageModel entry for the given ID. Raises
        an error if no undeleted message with the given ID is found and
        strict == True.

        Args:
            thread_id: str. ID of the thread.
            message_id: int. ID of the message.
            strict: bool. Whether to raise an error if no FeedbackMessageModel
                entry is found for the given IDs.

        Returns:
            GeneralFeedbackMessageModel or None. If strict == False and no
                undeleted message with the given message_id exists in the
                datastore, then returns None. Otherwise, returns the
                GeneralFeedbackMessageModel instance that corresponds to the
                given ID.

        Raises:
            EntityNotFoundError: strict == True and either
                    (i) message ID is not valid
                    (ii) message is marked as deleted.
                No error will be raised if strict == False.
        """
        instance_id = cls._generate_id(thread_id, message_id)
        return super(GeneralFeedbackMessageModel, cls).get(
            instance_id, strict=strict)

    @classmethod
    def get_messages(cls, thread_id):
        """Returns a list of messages in the given thread. The number of
        messages returned is capped by feconf.DEFAULT_QUERY_LIMIT.

        Args:
            thread_id: str. ID of the thread.

        Returns:
            list(GeneralFeedbackMessageModel). A list of messages in the
            given thread, up to a maximum of feconf.DEFAULT_QUERY_LIMIT
            messages.
        """
        return cls.get_all().filter(
            cls.thread_id == thread_id).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_most_recent_message(cls, thread_id):
        """Returns the last message in the thread.

        Args:
            thread_id: str. ID of the thread.

        Returns:
            GeneralFeedbackMessageModel. Last message in the thread.
        """
        thread = GeneralFeedbackThreadModel.get_by_id(thread_id)
        if thread.message_count:
            most_recent_message = cls.get(thread_id, thread.message_count - 1)
            return most_recent_message
        else:
            return cls.get_all().filter(
                cls.thread_id == thread_id).order(-cls.last_updated).get()

    @classmethod
    def get_message_count(cls, thread_id):
        """Returns the number of messages in the thread. Includes the
        deleted entries.

        Args:
            thread_id: str. ID of the thread.

        Returns:
            int. Number of messages in the thread.
        """
        thread = GeneralFeedbackThreadModel.get_by_id(thread_id)
        if thread.message_count:
            return thread.message_count
        else:
            return cls.get_all(include_deleted=True).filter(
                cls.thread_id == thread_id).count()

    @classmethod
    def get_all_messages(cls, page_size, urlsafe_start_cursor):
        """Fetches a list of all the messages sorted by their last updated
        attribute.

        Args:
            page_size: int. The maximum number of messages to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned messages starts from this datastore cursor.
                Otherwise, the returned messages start from the beginning
                of the full list of messages.

        Returns:
            3-tuple of (results, cursor, more) where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)


class GeneralFeedbackThreadUserModel(base_models.BaseModel):
    """Model for storing the ids of the messages in the thread that are read by
    the user.

    Instances of this class have keys of the form [user_id].[thread_id]
    """
    message_ids_read_by_user = ndb.IntegerProperty(repeated=True, indexed=True)

    @classmethod
    def generate_full_id(cls, user_id, thread_id):
        """Generates the full message id of the format:
            <user_id.thread_id>.

         Args:
            user_id: str. The user id.
            thread_id: str. The thread id.

        Returns:
            str. The full message id.
        """
        return '%s.%s' % (user_id, thread_id)

    @classmethod
    def get(cls, user_id, thread_id):
        """Gets the FeedbackThreadUserModel corresponding to the given user and
        the thread.

        Args:
            user_id: str. The id of the user.
            thread_id: str. The id of the thread.

        Returns:
            FeedbackThreadUserModel. The FeedbackThreadUserModel instance which
                matches with the given user_id, and thread id.
        """
        instance_id = cls.generate_full_id(user_id, thread_id)
        return super(GeneralFeedbackThreadUserModel, cls).get(
            instance_id, strict=False)

    @classmethod
    def create(cls, user_id, thread_id):
        """Creates a new FeedbackThreadUserModel instance and returns it.

        Args:
            user_id: str. The id of the user.
            thread_id: str. The id of the thread.

        Returns:
            FeedbackThreadUserModel. The newly created FeedbackThreadUserModel
                instance.
        """
        instance_id = cls.generate_full_id(user_id, thread_id)
        new_instance = cls(id=instance_id)
        new_instance.put()
        return new_instance

    @classmethod
    def get_multi(cls, user_id, thread_ids):
        """Gets the ExplorationUserDataModel corresponding to the given user and
        the thread ids.

        Args:
            user_id: str. The id of the user.
            thread_ids: list(str). The ids of the threads.

        Returns:
            list(FeedbackThreadUserModel). The FeedbackThreadUserModels
                corresponding to the given user ans thread ids.
        """
        instance_ids = [
            cls.generate_full_id(user_id, thread_id)
            for thread_id in thread_ids]

        return super(GeneralFeedbackThreadUserModel, cls).get_multi(
            instance_ids)


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


class UnsentFeedbackEmailModel(base_models.BaseModel):
    """Model for storing feedback messages that need to be sent to creators.

    Instances of this model contain information about feedback messages that
    have been received by the site, but have not yet been sent to creators.
    The model instances will be deleted once the corresponding email has been
    sent.

    The id of each model instance is the user_id of the user who should receive
    the messages.
    """

    # The list of feedback messages that need to be sent to this user.
    # Each element in this list is a dict with keys 'exploration_id',
    # 'thread_id' and 'message_id'; this information is used to retrieve
    # corresponding FeedbackMessageModel instance.
    feedback_message_references = ndb.JsonProperty(repeated=True)
    # The number of failed attempts that have been made (so far) to
    # send an email to this user.
    retries = ndb.IntegerProperty(default=0, required=True, indexed=True)
