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

"""Tests for certificate assessment offering models."""

from __future__ import annotations

from core import feconf, utils
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models

(base_models, certificate_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.CERTIFICATE_ASSESSMENT_OFFERING]
)


class CertificateAssessmentOfferingSnapshotContentModelTests(
    test_utils.GenericTestBase
):
    """Test the CertificateAssessmentOfferingSnapshotContentModel class."""

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentOfferingSnapshotContentModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )


class CertificateAssessmentOfferingModelUnitTests(test_utils.GenericTestBase):
    """Test the CertificateAssessmentOfferingModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentOfferingModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )

    def test_create_edit_soft_delete_and_version_retrieval_lifecycle(
        self,
    ) -> None:
        offering = certificate_models.CertificateAssessmentOfferingModel.create(
            title='Intro to Cryptography',
            description='Foundational data security check.',
            classroom_id='cs_classroom_101',
            topic_ids=['topic_id_101'],
            total_questions=10,
            time_limit_in_minutes=25,
            demonstrates=['Data Hashing'],
            async_status='Available',
        )
        offering_id = offering.id

        self.assertEqual(len(offering_id), 12)

        fetched_model = (
            certificate_models.CertificateAssessmentOfferingModel.get_by_id(
                offering_id
            )
        )
        self.assertIsNotNone(fetched_model)
        self.assertEqual(fetched_model.title, 'Intro to Cryptography')
        self.assertEqual(fetched_model.version, 1)

        fetched_model.title = 'Updated Cryptography Course'
        fetched_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Modified offering course title.',
            [
                {
                    'cmd': 'update_title',
                    'new_title': 'Updated Cryptography Course',
                }
            ],
        )

        updated_model = (
            certificate_models.CertificateAssessmentOfferingModel.get_by_id(
                offering_id
            )
        )
        self.assertEqual(updated_model.title, 'Updated Cryptography Course')
        self.assertEqual(updated_model.version, 2)

        updated_model.delete(
            feconf.SYSTEM_COMMITTER_ID,
            'Soft deleting the certificate offering entry.',
            force_deletion=False,
        )

        deleted_retrieval = (
            certificate_models.CertificateAssessmentOfferingModel.get_by_id(
                offering_id
            )
        )
        self.assertIsNotNone(deleted_retrieval)
        self.assertTrue(deleted_retrieval.deleted)
        self.assertEqual(deleted_retrieval.version, 3)

        snapshot_id = certificate_models.CertificateAssessmentOfferingModel.get_snapshot_id(
            offering_id, 2
        )
        snapshot_model = certificate_models.CertificateAssessmentOfferingSnapshotContentModel.get_by_id(
            snapshot_id
        )
        self.assertIsNotNone(snapshot_model)
        self.assertEqual(
            snapshot_model.content['title'], 'Updated Cryptography Course'
        )

    def test_create_raises_error_when_many_id_collisions_occur(self) -> None:
        """Ensures the ID generator raises after exhausting retries."""
        get_by_id_swap = self.swap(
            certificate_models.CertificateAssessmentOfferingModel,
            'get_by_id',
            lambda *args, **kwargs: True,
        )
        convert_to_hash_swap = self.swap(
            utils, 'convert_to_hash', lambda *args, **kwargs: 'duplicate-id'
        )

        with self.assertRaisesRegex(
            Exception,
            (
                'The id generator for CertificateAssessmentOfferingModel '
                'is producing too many collisions.'
            ),
        ):
            with get_by_id_swap, convert_to_hash_swap:
                certificate_models.CertificateAssessmentOfferingModel.create(
                    title='Collision Test',
                    description='Exercises the retry exhaustion path.',
                    classroom_id='classroom_id',
                    topic_ids=['topic_id'],
                    total_questions=1,
                    time_limit_in_minutes=5,
                    demonstrates=['Skill'],
                    async_status='Not_Ready',
                )


class CertificateAssessmentOfferingCommitLogEntryModelUnitTest(
    test_utils.GenericTestBase
):
    """Test the CertificateAssessmentOfferingCommitLogEntryModel class."""

    def test_get_deletion_policy_is_locally_pseudonymize(self) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentOfferingCommitLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE,
        )

    def test_commit_log_entry_creation_lifecycle(self) -> None:
        offering = certificate_models.CertificateAssessmentOfferingModel.create(
            title='Log Test offering',
            description='Testing log generation workflow hooks.',
            classroom_id='classroom_xyz',
            topic_ids=['topic_xyz'],
            total_questions=10,
            time_limit_in_minutes=15,
            demonstrates=['Testing Link'],
            async_status='Blocked',
        )

        log_id = certificate_models.CertificateAssessmentOfferingCommitLogEntryModel.get_instance_id(
            offering.id, 1
        )
        log_entry = certificate_models.CertificateAssessmentOfferingCommitLogEntryModel.get_by_id(
            log_id
        )

        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.offering_id, offering.id)
        self.assertEqual(log_entry.commit_type, 'create')
