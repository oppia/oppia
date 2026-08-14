# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Model for storing the certificate assessment offering data models."""

from __future__ import annotations

import datetime

import core.storage.base_model.gae_models as base_models
from core import feconf, utils
from core.constants import constants
from core.platform import models

from typing import (
    Dict,
    List,
    Literal,
    Mapping,
    Optional,
    Sequence,
    TypedDict,
    Union,
)

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()

# Fetch query results in batches of this size when filtering by attempt_id. This is
# necessary because the datastore has a limit of 30 items in an 'IN' filter.
# Reference: https://docs.cloud.google.com/datastore/docs/concepts/queries#in
_ATTEMPT_ID_IN_FILTER_BATCH_SIZE = 29


class CertificateAssessmentResponseCreateDict(TypedDict):
    """Input needed to create a certificate assessment response."""

    attempt_id: str
    question_id: str
    question_version: int
    selected_answer: str
    is_correct: bool


class CertificateAssessmentAttemptExportDict(TypedDict):
    """Dictionary for a single exported certificate assessment attempt."""

    total_score: float
    attempt_index: int
    attempt_data: Dict[str, Dict[str, int]]
    started_at: float
    finished_at: Optional[float]
    is_submitted: bool


CertificateAssessmentAttemptVersionDataValue = Union[
    str,
    int,
    Dict[str, int],
    Dict[str, List[str]],
]


class CertificateAssessmentOfferingSnapshotMetadataModel(
    base_models.BaseSnapshotMetadataModel
):
    """Storage model for the metadata for a certificate offering snapshot."""

    pass


class CertificateAssessmentOfferingSnapshotContentModel(
    base_models.BaseSnapshotContentModel
):
    """Storage model for the content of a certificate offering snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class CertificateAssessmentOfferingCommitLogEntryModel(
    base_models.BaseCommitLogEntryModel
):
    """Log of commits to certificate assessment offerings.

    The id for this model is of the form
    'certificate_offering-[offering_id]-[version]'.
    """

    # The id of the certificate assessment offering being edited.
    offering_id = datastore_services.StringProperty(indexed=True, required=True)

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """The history of commits is not relevant for the purposes of Takeout."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported."""
        return {
            **super(cls, cls).get_export_policy(),
            'offering_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }

    @classmethod
    def get_instance_id(cls, offering_id: str, offering_version: int) -> str:
        """Returns ID of the certificate offering commit log entry model.

        Args:
            offering_id: str. The certificate offering id.
            offering_version: int. The version of the offering.

        Returns:
            str. The structured commit log entry model ID string.
        """
        return 'certificate_offering-%s-%s' % (offering_id, offering_version)


class CertificateAssessmentOfferingModel(base_models.VersionedModel):
    """Versioned storage model for certificate assessment offerings.

    The ID of instances of this class are in form of random hash of 12 chars.
    """

    SNAPSHOT_METADATA_CLASS = CertificateAssessmentOfferingSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = CertificateAssessmentOfferingSnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = CertificateAssessmentOfferingCommitLogEntryModel
    ALLOW_REVERT = False

    # Title of the certificate assessment offering.
    title = datastore_services.StringProperty(required=True, indexed=True)
    # Short description explaining the assessment.
    description = datastore_services.StringProperty(required=True, indexed=True)
    # Classroom associated with this certificate.
    classroom_id = datastore_services.StringProperty(
        required=True, indexed=True
    )
    # Topics covered in this assessment.
    topic_ids = datastore_services.StringProperty(repeated=True, indexed=True)
    # Total number of questions.
    total_questions = datastore_services.IntegerProperty(
        required=True, indexed=False
    )
    # Time limit for assessment completion.
    time_limit_in_minutes = datastore_services.IntegerProperty(
        required=True, indexed=False
    )
    # Skills demonstrated by this certificate.
    demonstrates = datastore_services.StringProperty(
        repeated=True, indexed=True
    )
    # Async processing state.
    async_status = datastore_services.StringProperty(
        required=True, indexed=True
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return {
            **super(cls, cls).get_export_policy(),
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'classroom_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'total_questions': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_limit_in_minutes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'demonstrates': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'async_status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }

    @classmethod
    def _get_new_id(cls) -> str:
        """Generates a unique ID in the form of a random hash of 12 chars.

        Returns:
            str. ID of the new CertificateAssessmentOfferingModel instance.

        Raises:
            Exception. The ID generator is producing too many collisions.
        """
        for _ in range(base_models.MAX_RETRIES):
            new_id = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH,
            )
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for CertificateAssessmentOfferingModel '
            'is producing too many collisions.'
        )

    def compute_models_to_commit(
        self,
        committer_id: str,
        commit_type: str,
        commit_message: Optional[str],
        commit_cmds: base_models.AllowedCommitCmdsListType,
        additional_models: Mapping[str, base_models.BaseModel],
    ) -> base_models.ModelsToPutDict:
        """Record the event to the commit log after the model commit.

        Args:
            committer_id: str. The user_id of the user executing the change.
            commit_type: str. The type of commit (e.g. 'create', 'edit').
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands describing updates.
            additional_models: dict(str, BaseModel). Additional models needed.

        Returns:
            ModelsToPutDict. A dict of models to save to the datastore.
        """
        models_to_put = super().compute_models_to_commit(
            committer_id,
            commit_type,
            commit_message,
            commit_cmds,
            additional_models,
        )

        offering_commit_log = (
            CertificateAssessmentOfferingCommitLogEntryModel.create(
                self.id,
                self.version,
                committer_id,
                commit_type,
                commit_message,
                commit_cmds,
                constants.ACTIVITY_STATUS_PUBLIC,
                False,
            )
        )
        offering_commit_log.offering_id = self.id
        models_to_put['commit_log_model'] = offering_commit_log

        return models_to_put

    @classmethod
    def create(
        cls,
        title: str,
        description: str,
        classroom_id: str,
        topic_ids: List[str],
        total_questions: int,
        time_limit_in_minutes: int,
        demonstrates: List[str],
        async_status: str,
    ) -> CertificateAssessmentOfferingModel:
        """Creates a new certificate assessment offering entry instance.

        Args:
            title: str. Title of the certificate assessment offering.
            description: str. Description of the assessment.
            classroom_id: str. Classroom associated with the certificate.
            topic_ids: list(str). Topic IDs covered in the assessment.
            total_questions: int. Number of questions in assessment.
            time_limit_in_minutes: int. Assessment duration limit.
            demonstrates: list(str). What certificate demonstrates.
            async_status: str. Status of the certificate offering.

        Returns:
            CertificateAssessmentOfferingModel. Instance of the new entry.
        """
        instance_id = cls._get_new_id()
        offering_instance = cls(
            id=instance_id,
            title=title,
            description=description,
            classroom_id=classroom_id,
            topic_ids=topic_ids,
            total_questions=total_questions,
            time_limit_in_minutes=time_limit_in_minutes,
            demonstrates=demonstrates,
            async_status=async_status,
        )

        offering_instance.commit(  # pylint: disable=protected-access
            feconf.SYSTEM_COMMITTER_ID,
            'New certificate assessment offering created.',
            [{'cmd': feconf.CMD_CREATE_NEW}],
        )

        return offering_instance


class CertificateAssessmentAttemptModel(base_models.BaseModel):
    """Storage model for a certificate assessment attempt.

    The ID of instances of this class are in form of random hash of 12 chars.
    """

    # The ids of certificate assessment attempts are used as Takeout keys.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The ID of the learner who made this attempt.
    learner_id = datastore_services.StringProperty(required=True, indexed=True)
    # The ID of the certificate this attempt belongs to.
    certificate_id = datastore_services.StringProperty(
        required=True, indexed=True
    )
    # The total score achieved by the learner in this attempt.
    total_score = datastore_services.FloatProperty(required=True, indexed=True)
    # The index of this attempt for the given learner (1-based, increasing
    # with every new attempt made by the same learner).
    attempt_index = datastore_services.IntegerProperty(
        required=True, indexed=True
    )
    # Dict mapping topic_id to a dict containing
    # 'total_related_questions' and 'total_correct_questions' for that
    # topic, e.g.
    # {
    #     'topic_id_1': {
    #         'total_related_questions': 5,
    #         'total_correct_questions': 3
    #     }
    # }
    attempt_data = datastore_services.JsonProperty(required=True)
    # Dict capturing the exact versions of the certificate offering,
    # topics, questions, and question-topic-links that were used while
    # generating this attempt, e.g.
    # {
    #     'certificate_id': 'cert_abc123',
    #     'certificate_version': 1,
    #     'topic_versions': {'topic_id_1': 2},
    #     'question_versions': {'question_id_1': 1},
    #     'question_topic_links': {'question_id_1': ['topic_id_1']}
    # }
    version_data = datastore_services.JsonProperty(required=True)
    # The time at which the learner started this attempt.
    started_at = datastore_services.DateTimeProperty(
        required=True, indexed=False
    )
    # The time at which the learner finished this attempt. Is None until
    # the attempt has been finished.
    finished_at = datastore_services.DateTimeProperty(
        required=False, indexed=False
    )
    # Whether the learner has submitted this attempt.
    is_submitted = datastore_services.BooleanProperty(
        required=True, default=False, indexed=True
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user that must be deleted."""
        return base_models.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Multiple attempt instances may be stored per learner."""
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether any certificate assessment attempts exist for user."""
        return (
            cls.query(cls.learner_id == user_id).get(keys_only=True) is not None
        )

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete all certificate assessment attempts for the user."""
        keys = cls.query(cls.learner_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user."""
        return {
            **super(cls, cls).get_export_policy(),
            'learner_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'certificate_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'total_score': base_models.EXPORT_POLICY.EXPORTED,
            'attempt_index': base_models.EXPORT_POLICY.EXPORTED,
            'attempt_data': base_models.EXPORT_POLICY.EXPORTED,
            'version_data': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'started_at': base_models.EXPORT_POLICY.EXPORTED,
            'finished_at': base_models.EXPORT_POLICY.EXPORTED,
            'is_submitted': base_models.EXPORT_POLICY.EXPORTED,
        }

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, CertificateAssessmentAttemptExportDict]:
        """Exports all certificate assessment attempts for a learner.

        Args:
            user_id: str. The learner ID whose attempts should be exported.

        Returns:
            dict. A dictionary keyed by attempt ID, with JSON-serializable
            attempt data.
        """
        attempt_models: Sequence[CertificateAssessmentAttemptModel] = cls.query(
            cls.learner_id == user_id
        ).fetch()

        user_data: Dict[str, CertificateAssessmentAttemptExportDict] = {}
        for attempt_model in attempt_models:
            user_data[attempt_model.id] = {
                'total_score': attempt_model.total_score,
                'attempt_index': attempt_model.attempt_index,
                'attempt_data': attempt_model.attempt_data,
                'started_at': utils.get_time_in_millisecs(
                    attempt_model.started_at
                ),
                'finished_at': (
                    None
                    if attempt_model.finished_at is None
                    else utils.get_time_in_millisecs(attempt_model.finished_at)
                ),
                'is_submitted': attempt_model.is_submitted,
            }
        return user_data

    @classmethod
    def _get_new_id(cls) -> str:
        """Generates a unique ID in the form of a random hash of 12 chars.

        Returns:
            str. ID of the new CertificateAssessmentAttemptModel instance.

        Raises:
            Exception. The ID generator is producing too many collisions.
        """
        for _ in range(base_models.MAX_RETRIES):
            new_id = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH,
            )
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for CertificateAssessmentAttemptModel '
            'is producing too many collisions.'
        )

    @classmethod
    def create(
        cls,
        learner_id: str,
        total_score: float,
        attempt_index: int,
        attempt_data: Dict[str, Dict[str, int]],
        version_data: Dict[str, CertificateAssessmentAttemptVersionDataValue],
        started_at: datetime.datetime,
        finished_at: Optional[datetime.datetime],
        is_submitted: bool,
    ) -> CertificateAssessmentAttemptModel:
        """Creates a new certificate assessment attempt instance.

        Args:
            learner_id: str. The ID of the learner making the attempt.
            total_score: float. The total score achieved in this attempt.
            attempt_index: int. The index of this attempt for the learner.
            attempt_data: dict. Per-topic stats about questions answered.
            version_data: dict. Versions of the certificate, topics,
                questions, and question-topic-links used for this attempt.
            started_at: datetime.datetime. When the attempt was started.
            finished_at: datetime.datetime|None. When the attempt was
                finished, or None if not yet finished.
            is_submitted: bool. Whether the attempt has been submitted.

        Returns:
            CertificateAssessmentAttemptModel. Instance of the new entry.
        """
        instance_id = cls._get_new_id()
        attempt_instance = cls(
            id=instance_id,
            learner_id=learner_id,
            certificate_id=version_data['certificate_id'],
            total_score=total_score,
            attempt_index=attempt_index,
            attempt_data=attempt_data,
            version_data=version_data,
            started_at=started_at,
            finished_at=finished_at,
            is_submitted=is_submitted,
        )
        attempt_instance.update_timestamps()
        attempt_instance.put()

        return attempt_instance


class CertificateAssessmentResponseModel(base_models.BaseModel):
    """Storage model for a single response submitted by a learner during
    a certificate assessment attempt.

    The ID of instances of this class are in form of random hash of 12 chars.
    """

    # The ID of the CertificateAssessmentAttemptModel this response
    # belongs to.
    attempt_id = datastore_services.StringProperty(required=True, indexed=True)
    # The ID of the question that was answered.
    question_id = datastore_services.StringProperty(required=True, indexed=True)
    # The version of the question that was answered.
    question_version = datastore_services.IntegerProperty(
        required=True, indexed=False
    )
    # The answer selected by the learner.
    selected_answer = datastore_services.TextProperty(required=True)
    # Whether the selected answer was correct.
    is_correct = datastore_services.BooleanProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a learner via its attempt."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model is not exported directly because it is linked indirectly."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def _get_attempt_ids_for_user(cls, user_id: str) -> List[str]:
        """Returns the IDs of all attempts associated with a user."""
        attempt_keys = CertificateAssessmentAttemptModel.query(
            CertificateAssessmentAttemptModel.learner_id == user_id
        ).fetch(keys_only=True)
        return [key.id() for key in attempt_keys]

    @classmethod
    def _get_keys_for_attempt_ids(
        cls, attempt_ids: Sequence[str]
    ) -> List[datastore_services.Key]:
        """Returns response keys for a set of attempt IDs in datastore-sized batches."""
        keys: List[datastore_services.Key] = []
        for index in range(
            0, len(attempt_ids), _ATTEMPT_ID_IN_FILTER_BATCH_SIZE
        ):
            batch_attempt_ids = attempt_ids[
                index : index + _ATTEMPT_ID_IN_FILTER_BATCH_SIZE
            ]
            keys.extend(
                cls.query(cls.attempt_id.IN(batch_attempt_ids)).fetch(
                    keys_only=True
                )
            )
        return keys

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether any responses exist for attempts owned by a learner."""
        attempt_ids = cls._get_attempt_ids_for_user(user_id)
        if not attempt_ids:
            return False
        return bool(cls._get_keys_for_attempt_ids(attempt_ids))

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete all responses attached to the learner's attempts."""
        attempt_ids = cls._get_attempt_ids_for_user(user_id)
        if not attempt_ids:
            return
        keys = cls._get_keys_for_attempt_ids(attempt_ids)
        datastore_services.delete_multi(keys)

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't
        exported directly since the model is not directly tied to a user.
        """
        return {
            **super(cls, cls).get_export_policy(),
            'attempt_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'selected_answer': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'is_correct': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }

    @classmethod
    def _get_new_id(cls) -> str:
        """Generates a unique ID in the form of a random hash of 12 chars.

        Returns:
            str. ID of the new CertificateAssessmentResponseModel instance.

        Raises:
            Exception. The ID generator is producing too many collisions.
        """
        for _ in range(base_models.MAX_RETRIES):
            new_id = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH,
            )
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for CertificateAssessmentResponseModel '
            'is producing too many collisions.'
        )

    @classmethod
    def create(
        cls,
        attempt_id: str,
        question_id: str,
        question_version: int,
        selected_answer: str,
        is_correct: bool,
    ) -> CertificateAssessmentResponseModel:
        """Creates a new certificate assessment response instance.

        Args:
            attempt_id: str. The ID of the attempt this response belongs to.
            question_id: str. The ID of the question being answered.
            question_version: int. The version of the question answered.
            selected_answer: str. The answer selected by the learner.
            is_correct: bool. Whether the selected answer was correct.

        Returns:
            CertificateAssessmentResponseModel. Instance of the new entry.
        """
        instance_id = cls._get_new_id()
        response_instance = cls(
            id=instance_id,
            attempt_id=attempt_id,
            question_id=question_id,
            question_version=question_version,
            selected_answer=selected_answer,
            is_correct=is_correct,
        )
        response_instance.update_timestamps()
        response_instance.put()

        return response_instance

    @classmethod
    def create_multi(
        cls,
        response_dicts: List[CertificateAssessmentResponseCreateDict],
    ) -> List[CertificateAssessmentResponseModel]:
        """Creates and persists multiple certificate assessment responses.

        Args:
            response_dicts: list(CertificateAssessmentResponseCreateDict).
                The response payloads to persist.

        Returns:
            list(CertificateAssessmentResponseModel). The newly created
            response instances.
        """
        response_instances = [
            cls(
                id=cls._get_new_id(),
                attempt_id=response_dict['attempt_id'],
                question_id=response_dict['question_id'],
                question_version=response_dict['question_version'],
                selected_answer=response_dict['selected_answer'],
                is_correct=response_dict['is_correct'],
            )
            for response_dict in response_dicts
        ]
        cls.update_timestamps_multi(response_instances)
        cls.put_multi(response_instances)
        return response_instances
