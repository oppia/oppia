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

from __future__ import annotations

from core import feconf
from core import utils
# TODO(#13594): After the domain layer is refactored to be independent of
# the storage layer, the disable=invalid-import will
# be removed.
# The following import is dangerous and should not be generally
# used. We had to use this ignore as we need to import the domain layer
# for type-annotation.
# Here feedback_domain is imported outside the 'if MYPY:' block. If it is
# imported inside the 'if MYPY:' block, during runtime feedback_domain
# won't be accessible.
from core.domain import feedback_domain  # pylint: disable=invalid-import
from core.platform import models

from typing import (
    Dict, Final, List, Literal, Optional, Sequence, Tuple, Union, overload)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()

# Allowed feedback thread statuses.
STATUS_CHOICES_OPEN: Final = 'open'
STATUS_CHOICES_FIXED: Final = 'fixed'
STATUS_CHOICES_IGNORED: Final = 'ignored'
STATUS_CHOICES_COMPLIMENT: Final = 'compliment'
STATUS_CHOICES_NOT_ACTIONABLE: Final = 'not_actionable'
STATUS_CHOICES: Final = [
    STATUS_CHOICES_OPEN,
    STATUS_CHOICES_FIXED,
    STATUS_CHOICES_IGNORED,
    STATUS_CHOICES_COMPLIMENT,
    STATUS_CHOICES_NOT_ACTIONABLE,
]

# Constants used for generating new ids.
_MAX_RETRIES: Final = 10
_RAND_RANGE: Final = 127 * 127


class GeneralFeedbackThreadModel(base_models.BaseModel):
    """Threads for each entity.

    The id of instances of this class has the form
        [entity_type].[entity_id].[generated_string]
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The type of entity the thread is linked to.
    entity_type = datastore_services.StringProperty(required=True, indexed=True)
    # The ID of the entity the thread is linked to.
    entity_id = datastore_services.StringProperty(required=True, indexed=True)
    # ID of the user who started the thread. This may be None if the feedback
    # was given anonymously by a learner.
    original_author_id = datastore_services.StringProperty(indexed=True)
    # Latest status of the thread.
    status = datastore_services.StringProperty(
        default=STATUS_CHOICES_OPEN,
        choices=STATUS_CHOICES,
        required=True,
        indexed=True,
    )
    # Latest subject of the thread.
    subject = datastore_services.StringProperty(indexed=True, required=True)
    # Summary text of the thread.
    summary = datastore_services.TextProperty(indexed=False)
    # Specifies whether this thread has a related suggestion.
    has_suggestion = datastore_services.BooleanProperty(
        indexed=True, default=False, required=True)

    # Cached value of the number of messages in the thread.
    message_count = datastore_services.IntegerProperty(indexed=True, default=0)
    # Cached text of the last message in the thread with non-empty content, or
    # None if there is no such message.
    last_nonempty_message_text = datastore_services.TextProperty(indexed=False)
    # Cached ID for the user of the last message in the thread with non-empty
    # content, or None if the message was made anonymously or if there is no
    # such message.
    last_nonempty_message_author_id = (
        datastore_services.StringProperty(indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize corresponding to a user:
        original_author_id and last_nonempty_message_author_id fields.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there
        are multiple feedback threads relevant to a particular user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'entity_type': base_models.EXPORT_POLICY.EXPORTED,
            'entity_id': base_models.EXPORT_POLICY.EXPORTED,
            # We do not export the original_author_id because we should not
            # export internal user ids.
            'original_author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status': base_models.EXPORT_POLICY.EXPORTED,
            'subject': base_models.EXPORT_POLICY.EXPORTED,
            'summary': base_models.EXPORT_POLICY.EXPORTED,
            'has_suggestion': base_models.EXPORT_POLICY.EXPORTED,
            'message_count': base_models.EXPORT_POLICY.EXPORTED,
            'last_nonempty_message_text':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_nonempty_message_author_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def get_field_names_for_takeout(cls) -> Dict[str, str]:
        """Indicates that the last_updated variable is exported under the
        name "last_updated_msec" in Takeout.
        """
        return dict(super(cls, cls).get_field_names_for_takeout(), ** {
            'last_updated': 'last_updated_msec'
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether GeneralFeedbackThreadModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.original_author_id == user_id,
            cls.last_nonempty_message_author_id == user_id
        )).get(keys_only=True) is not None

    @classmethod
    def export_data(
            cls,
            user_id: str
    ) -> Dict[str, Dict[str, Union[str, bool, None]]]:
        """Exports the data from GeneralFeedbackThreadModel
        into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from GeneralFeedbackThreadModel.
        """

        user_data = {}
        feedback_models: Sequence[GeneralFeedbackThreadModel] = (
            cls.get_all().filter(cls.original_author_id == user_id).fetch())

        for feedback_model in feedback_models:
            user_data[feedback_model.id] = {
                'entity_type': feedback_model.entity_type,
                'entity_id': feedback_model.entity_id,
                'status': feedback_model.status,
                'subject': feedback_model.subject,
                'has_suggestion': feedback_model.has_suggestion,
                'summary': feedback_model.summary,
                'message_count': feedback_model.message_count,
                'last_updated_msec': utils.get_time_in_millisecs(
                    feedback_model.last_updated)
            }

        return user_data

    @classmethod
    def generate_new_thread_id(cls, entity_type: str, entity_id: str) -> str:
        """Generates a new thread ID which is unique.

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.

        Returns:
            str. A thread ID that is different from the IDs of all
            the existing threads within the given entity.

        Raises:
            Exception. There were too many collisions with existing thread IDs
                when attempting to generate a new thread ID.
        """
        for _ in range(_MAX_RETRIES):
            thread_id = (
                '%s.%s.%s%s' % (
                    entity_type,
                    entity_id,
                    utils.base64_from_int(
                        int(utils.get_current_time_in_millisecs())),
                    utils.base64_from_int(utils.get_random_int(_RAND_RANGE))
                )
            )
            if not cls.get_by_id(thread_id):
                return thread_id
        raise Exception(
            'New thread id generator is producing too many collisions.')

    @classmethod
    def create(cls, thread_id: str) -> GeneralFeedbackThreadModel:
        """Creates a new FeedbackThreadModel entry.

        Args:
            thread_id: str. Thread ID of the newly-created thread.

        Returns:
            GeneralFeedbackThreadModel. The newly created FeedbackThreadModel
            instance.

        Raises:
            Exception. A thread with the given thread ID exists already.
        """
        if cls.get_by_id(thread_id):
            raise Exception('Feedback thread ID conflict on create.')
        return cls(id=thread_id)

    @classmethod
    def get_threads(
        cls,
        entity_type: str,
        entity_id: str,
        limit: int = feconf.DEFAULT_QUERY_LIMIT
    ) -> Sequence[GeneralFeedbackThreadModel]:
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
            cls.entity_id == entity_id
        ).order(-cls.last_updated).fetch(limit)


class GeneralFeedbackMessageModel(base_models.BaseModel):
    """Feedback messages. One or more of these messages make a thread.

    The id of instances of this class has the form [thread_id].[message_id]
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # ID corresponding to an entry of FeedbackThreadModel.
    thread_id = datastore_services.StringProperty(required=True, indexed=True)
    # 0-based sequential numerical ID. Sorting by this field will create the
    # thread in chronological order.
    message_id = datastore_services.IntegerProperty(required=True, indexed=True)
    # ID of the user who posted this message. This may be None if the feedback
    # was given anonymously by a learner.
    author_id = datastore_services.StringProperty(indexed=True)
    # New thread status. Must exist in the first message of a thread. For the
    # rest of the thread, should exist only when the status changes.
    updated_status = (
        datastore_services.StringProperty(choices=STATUS_CHOICES, indexed=True))
    # New thread subject. Must exist in the first message of a thread. For the
    # rest of the thread, should exist only when the subject changes.
    updated_subject = datastore_services.StringProperty(indexed=True)
    # Message text. Allowed not to exist (e.g. post only to update the status).
    text = datastore_services.TextProperty(indexed=False)
    # Whether the incoming message is received by email (as opposed to via
    # the web).
    received_via_email = datastore_services.BooleanProperty(
        default=False, indexed=True, required=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize corresponding to a user:
        author_id field.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple feedback messages relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'thread_id': base_models.EXPORT_POLICY.EXPORTED,
            'message_id': base_models.EXPORT_POLICY.EXPORTED,
            # We do not export the author_id because we should not export
            # internal user ids.
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'updated_status': base_models.EXPORT_POLICY.EXPORTED,
            'updated_subject': base_models.EXPORT_POLICY.EXPORTED,
            'text': base_models.EXPORT_POLICY.EXPORTED,
            'received_via_email': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether GeneralFeedbackMessageModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.author_id == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def export_data(
        cls,
        user_id: str
    ) -> Dict[str, Dict[str, Union[str, int, bool, None]]]:
        """Exports the data from GeneralFeedbackMessageModel
        into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from GeneralFeedbackMessageModel.
        """

        user_data = {}
        feedback_models: Sequence[GeneralFeedbackMessageModel] = (
            cls.get_all().filter(cls.author_id == user_id).fetch())

        for feedback_model in feedback_models:
            user_data[feedback_model.id] = {
                'thread_id': feedback_model.thread_id,
                'message_id': feedback_model.message_id,
                'updated_status': feedback_model.updated_status,
                'updated_subject': feedback_model.updated_subject,
                'text': feedback_model.text,
                'received_via_email': feedback_model.received_via_email
            }

        return user_data

    @classmethod
    def _generate_id(cls, thread_id: str, message_id: int) -> str:
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
    def entity_id(self) -> str:
        """Returns the entity_id corresponding to this thread instance.

        Returns:
            str. The entity_id.
        """
        return self.id.split('.')[1]

    @property
    def entity_type(self) -> str:
        """Returns the entity_type corresponding to this thread instance.

        Returns:
            str. The entity_type.
        """
        return self.id.split('.')[0]

    @classmethod
    def create(
        cls, message_identifier: feedback_domain.FullyQualifiedMessageIdentifier
    ) -> GeneralFeedbackMessageModel:
        """Creates a new GeneralFeedbackMessageModel entry.

        Args:
            message_identifier: FullyQualifiedMessageIdentifier. The message
                identifier consists of the thread_id and its corresponding
                message_id.

        Returns:
            GeneralFeedbackMessageModel. Instance of the new
            GeneralFeedbackMessageModel entry.

        Raises:
            Exception. A message with the same ID already exists
                in the given thread.
        """

        return cls.create_multi([message_identifier])[0]

    @classmethod
    def create_multi(
        cls,
        message_identifiers: List[
            feedback_domain.FullyQualifiedMessageIdentifier
        ]
    ) -> List[GeneralFeedbackMessageModel]:
        """Creates a new GeneralFeedbackMessageModel entry for each
        (thread_id, message_id) pair.

        Args:
            message_identifiers: list(FullyQualifiedMessageIdentifier). Each
                message identifier consists of the thread_id and its
                corresponding message_id.

        Returns:
            list(GeneralFeedbackMessageModel). Instances of the new
            GeneralFeedbackMessageModel entries.

        Raises:
            Exception. The number of thread_ids must be equal to the number of
                message_ids.
            Exception. A message with the same ID already exists
                in the given thread.
        """
        thread_ids = [
            message_identifier.thread_id for message_identifier
            in message_identifiers]
        message_ids = [
            message_identifier.message_id for message_identifier
            in message_identifiers]

        # Generate the new ids.
        instance_ids = [
            cls._generate_id(thread_id, message_id) for thread_id, message_id
            in zip(thread_ids, message_ids)
        ]

        # Check if the new ids are valid.
        current_instances = cls.get_multi(instance_ids)
        conflict_ids = [
            current_instance.id for current_instance in current_instances if
            current_instance is not None
        ]
        if len(conflict_ids) > 0:
            raise Exception(
                'The following feedback message ID(s) conflicted on '
                'create: %s' % (' '.join(conflict_ids))
            )

        return [cls(id=instance_id) for instance_id in instance_ids]

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @overload # type: ignore[override]
    @classmethod
    def get(
        cls, thread_id: str, message_id: int
    ) -> GeneralFeedbackMessageModel: ...

    @overload
    @classmethod
    def get(
        cls, thread_id: str, message_id: int, *, strict: Literal[True]
    ) -> GeneralFeedbackMessageModel: ...

    @overload
    @classmethod
    def get(
        cls, thread_id: str, message_id: int, *, strict: Literal[False]
    ) -> Optional[GeneralFeedbackMessageModel]: ...

    @overload
    @classmethod
    def get(
        cls, thread_id: str, message_id: int, *, strict: bool = ...
    ) -> Optional[GeneralFeedbackMessageModel]: ...

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @classmethod
    def get( # type: ignore[override]
        cls, thread_id: str, message_id: int, strict: bool = True
    ) -> Optional[GeneralFeedbackMessageModel]:
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
            EntityNotFoundError. The value of strict is True and either
                (i) message ID is not valid
                (ii) message is marked as deleted.
                No error will be raised if strict == False.
        """
        instance_id = cls._generate_id(thread_id, message_id)
        return super(GeneralFeedbackMessageModel, cls).get(
            instance_id, strict=strict)

    @classmethod
    def get_messages(
        cls, thread_id: str
    ) -> Sequence[GeneralFeedbackMessageModel]:
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
            cls.thread_id == thread_id
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_most_recent_message(
        cls, thread_id: str
    ) -> GeneralFeedbackMessageModel:
        """Returns the last message in the thread.

        Args:
            thread_id: str. ID of the thread.

        Returns:
            GeneralFeedbackMessageModel. Last message in the thread.
        """
        thread = GeneralFeedbackThreadModel.get_by_id(thread_id)
        message = cls.get(thread_id, thread.message_count - 1)
        return message

    @classmethod
    def get_message_count(cls, thread_id: str) -> int:
        """Returns the number of messages in the thread. Includes the
        deleted entries.

        Args:
            thread_id: str. ID of the thread.

        Returns:
            int. Number of messages in the thread.
        """
        return cls.get_message_counts([thread_id])[0]

    @classmethod
    def get_message_counts(
        cls, thread_ids: List[str]
    ) -> List[int]:
        """Returns a list containing the number of messages in the threads.
        Includes the deleted entries.

        Args:
            thread_ids: list(str). ID of the threads.

        Returns:
            list(int). List of the message counts for the threads.
        """
        thread_models = GeneralFeedbackThreadModel.get_multi(thread_ids)
        assert None not in thread_models
        return [
            thread_model.message_count if thread_model else None
            for thread_model in thread_models
        ]

    # TODO(#13523): Change the return value of the function below from
    # tuple(list, str|None, bool) to a domain object.
    @classmethod
    def get_all_messages(
        cls, page_size: int, urlsafe_start_cursor: Optional[str]
    ) -> Tuple[Sequence[GeneralFeedbackMessageModel], Optional[str], bool]:
        """Fetches a list of all the messages sorted by their last updated
        attribute.

        Args:
            page_size: int. The maximum number of messages to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned messages starts from this datastore cursor.
                Otherwise, the returned messages start from the beginning
                of the full list of messages.

        Returns:
            3-tuple of (results, cursor, more). Where:
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

    user_id = datastore_services.StringProperty(required=True, indexed=True)
    thread_id = datastore_services.StringProperty(required=True, indexed=True)
    message_ids_read_by_user = (
        datastore_services.IntegerProperty(repeated=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_id field.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple feedback threads relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thread_id':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'message_ids_read_by_user':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of GeneralFeedbackThreadUserModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether GeneralFeedbackThreadUserModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def generate_full_id(cls, user_id: str, thread_id: str) -> str:
        """Generates the full message id of the format:
            <user_id.thread_id>.

        Args:
            user_id: str. The user id.
            thread_id: str. The thread id.

        Returns:
            str. The full message id.
        """
        return '%s.%s' % (user_id, thread_id)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @classmethod
    def get( # type: ignore[override]
        cls, user_id: str, thread_id: str
    ) -> Optional[GeneralFeedbackThreadUserModel]:
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
    def create(
        cls, user_id: str, thread_id: str
    ) -> GeneralFeedbackThreadUserModel:
        """Creates a new FeedbackThreadUserModel instance and returns it.

        Args:
            user_id: str. The id of the user.
            thread_id: str. The id of the thread.

        Returns:
            FeedbackThreadUserModel. The newly created FeedbackThreadUserModel
            instance.
        """

        return cls.create_multi(user_id, [thread_id])[0]

    @classmethod
    def create_multi(
        cls, user_id: str, thread_ids: List[str]
    ) -> List[GeneralFeedbackThreadUserModel]:
        """Creates new FeedbackThreadUserModel instances for user_id for each
        of the thread_ids.

        Args:
            user_id: str. The id of the user.
            thread_ids: list(str). The ids of the threads.

        Returns:
            list(FeedbackThreadUserModel). The newly created
            FeedbackThreadUserModel instances.
        """
        new_instances = []
        for thread_id in thread_ids:
            instance_id = cls.generate_full_id(user_id, thread_id)
            new_instance = cls(
                id=instance_id, user_id=user_id, thread_id=thread_id)
            new_instances.append(new_instance)

        GeneralFeedbackThreadUserModel.update_timestamps_multi(new_instances)
        GeneralFeedbackThreadUserModel.put_multi(new_instances)
        return new_instances

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get_multi().
    @classmethod
    def get_multi( # type: ignore[override]
        cls, user_id: str, thread_ids: List[str]
    ) -> List[Optional[GeneralFeedbackThreadUserModel]]:
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

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, Dict[str, List[str]]]:
        """Takeout: Export GeneralFeedbackThreadUserModel user-based properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict containing the user-relevant properties of
            GeneralFeedbackThreadUserModel, i.e., which messages have been
            read by the user (as a list of ids) in each thread.
        """
        found_models = cls.get_all().filter(cls.user_id == user_id)
        user_data = {}
        for user_model in found_models:
            user_data[user_model.thread_id] = {
                'message_ids_read_by_user': user_model.message_ids_read_by_user
            }
        return user_data


class FeedbackAnalyticsModel(base_models.BaseMapReduceBatchResultsModel):
    """Model for storing feedback thread analytics for an exploration.

    The key of each instance is the exploration ID.
    """

    # NOTE TO DEVELOPERS: The method create() was removed in #13237 as part of
    # the migration to Apache Beam. Please refer to that PR if you need to
    # reinstate it.

    # The number of open feedback threads for this exploration.
    num_open_threads = (
        datastore_services.IntegerProperty(default=None, indexed=True))
    # Total number of feedback threads for this exploration.
    num_total_threads = (
        datastore_services.IntegerProperty(default=None, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'num_open_threads': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_total_threads': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    # Each element in this list is a dict with keys 'entity_type', 'entity_id',
    # 'thread_id' and 'message_id'; this information is used to retrieve
    # corresponding FeedbackMessageModel instance.
    feedback_message_references = datastore_services.JsonProperty(repeated=True)
    # The number of failed attempts that have been made (so far) to
    # send an email to this user.
    retries = datastore_services.IntegerProperty(
        default=0, required=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'feedback_message_references':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'retries': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UnsentFeedbackEmailModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UnsentFeedbackEmailModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None
