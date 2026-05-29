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

import core.storage.base_model.gae_models as base_models
from core import feconf, utils
from core.constants import constants
from core.platform import models

from typing import Dict, List, Mapping, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


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
        return dict(
            super(cls, cls).get_export_policy(),
            **{'offering_id': base_models.EXPORT_POLICY.NOT_APPLICABLE},
        )

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
        return dict(
            super(cls, cls).get_export_policy(),
            **{
                'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'classroom_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'topic_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'total_questions': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'time_limit_in_minutes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'demonstrates': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'async_status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

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
