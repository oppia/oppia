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

"""Tests for certificate assessment offering, attempt and response models."""

from __future__ import annotations

import datetime

from core import feconf, utils
from core.domain import certificate_assessment_domain
from core.platform import models
from core.storage.certificate_assessment import gae_models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models

(base_models, certificate_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.CERTIFICATE_ASSESSMENT_OFFERING]
)

datastore_services = models.Registry.import_datastore_services()


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


class CertificateAssessmentAttemptModelUnitTests(test_utils.GenericTestBase):
    """Test the CertificateAssessmentAttemptModel class."""

    def _get_sample_attempt_data(
        self,
    ) -> dict[
        str,
        certificate_assessment_domain.CertificateAssessmentAttemptTopicStatsDict,
    ]:
        """Returns sample attempt_data for use in tests."""
        return {
            'topic_id_101': {
                'total_related_questions': 5,
                'total_correct_questions': 3,
            }
        }

    def _get_sample_version_data(
        self,
    ) -> (
        certificate_assessment_domain.CertificateAssessmentAttemptVersionDataDict
    ):
        """Returns sample version_data for use in tests."""
        return {
            'certificate_id': 'cert_abc123',
            'certificate_version': 1,
            'topic_versions': {'topic_id_101': 2},
            'question_versions': {'question_id_1': 1},
            'question_topic_links': {'question_id_1': ['topic_id_101']},
        }

    def test_get_deletion_policy_is_delete_at_end(self) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentAttemptModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END,
        )

    def test_get_model_association_to_user_is_multiple_instances(
        self,
    ) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentAttemptModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER,
        )

    def test_export_data(self) -> None:
        started_at = datetime.datetime(2026, 1, 2, 3, 4, 5)
        finished_at = started_at + datetime.timedelta(minutes=7)
        attempt = certificate_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_id_1',
            certificate_id='cert_abc123',
            total_score=84.5,
            attempt_index=2,
            attempt_data=self._get_sample_attempt_data(),
            version_data=self._get_sample_version_data(),
            started_at=started_at,
            finished_at=finished_at,
            is_submitted=True,
        )

        exported_data = (
            certificate_models.CertificateAssessmentAttemptModel.export_data(
                'learner_id_1'
            )
        )

        self.assertEqual(
            exported_data,
            {
                attempt.id: {
                    'total_score': 84.5,
                    'attempt_index': 2,
                    'attempt_data': self._get_sample_attempt_data(),
                    'started_at': utils.get_time_in_millisecs(started_at),
                    'finished_at': utils.get_time_in_millisecs(finished_at),
                    'is_submitted': True,
                }
            },
        )

    def test_export_data_returns_empty_dict_for_missing_user(self) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentAttemptModel.export_data(
                'missing_learner'
            ),
            {},
        )

    def test_create_and_retrieve_lifecycle(self) -> None:
        started_at = datetime.datetime.utcnow()
        attempt = certificate_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_id_1',
            certificate_id='cert_abc123',
            total_score=60.0,
            attempt_index=1,
            attempt_data=self._get_sample_attempt_data(),
            version_data=self._get_sample_version_data(),
            started_at=started_at,
            finished_at=None,
            is_submitted=False,
        )
        attempt_id = attempt.id

        self.assertEqual(len(attempt_id), 12)

        fetched_model = (
            certificate_models.CertificateAssessmentAttemptModel.get_by_id(
                attempt_id
            )
        )
        self.assertIsNotNone(fetched_model)
        self.assertEqual(fetched_model.learner_id, 'learner_id_1')
        self.assertEqual(fetched_model.certificate_id, 'cert_abc123')
        self.assertEqual(fetched_model.total_score, 60.0)
        self.assertEqual(fetched_model.attempt_index, 1)
        self.assertEqual(
            fetched_model.attempt_data, self._get_sample_attempt_data()
        )
        self.assertEqual(
            fetched_model.version_data, self._get_sample_version_data()
        )
        self.assertIsNone(fetched_model.finished_at)
        self.assertFalse(fetched_model.is_submitted)

        finished_at = started_at + datetime.timedelta(minutes=10)
        fetched_model.finished_at = finished_at
        fetched_model.is_submitted = True
        fetched_model.update_timestamps()
        fetched_model.put()

        updated_model = (
            certificate_models.CertificateAssessmentAttemptModel.get_by_id(
                attempt_id
            )
        )
        self.assertEqual(updated_model.finished_at, finished_at)
        self.assertTrue(updated_model.is_submitted)

    def test_apply_deletion_policy_deletes_attempts_for_user(self) -> None:
        attempt = certificate_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_id_1',
            certificate_id='cert_abc123',
            total_score=60.0,
            attempt_index=1,
            attempt_data=self._get_sample_attempt_data(),
            version_data=self._get_sample_version_data(),
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )

        certificate_models.CertificateAssessmentAttemptModel.apply_deletion_policy(
            'learner_id_1'
        )

        self.assertIsNone(
            certificate_models.CertificateAssessmentAttemptModel.get_by_id(
                attempt.id
            )
        )

    def test_create_raises_error_when_many_id_collisions_occur(self) -> None:
        """Ensures the ID generator raises after exhausting retries."""
        get_by_id_swap = self.swap(
            certificate_models.CertificateAssessmentAttemptModel,
            'get_by_id',
            lambda *args, **kwargs: True,
        )
        convert_to_hash_swap = self.swap(
            utils, 'convert_to_hash', lambda *args, **kwargs: 'duplicate-id'
        )

        with self.assertRaisesRegex(
            Exception,
            (
                'The id generator for CertificateAssessmentAttemptModel '
                'is producing too many collisions.'
            ),
        ), get_by_id_swap, convert_to_hash_swap:
            certificate_models.CertificateAssessmentAttemptModel.create(
                learner_id='learner_id_1',
                certificate_id='cert_abc123',
                total_score=0.0,
                attempt_index=1,
                attempt_data=self._get_sample_attempt_data(),
                version_data=self._get_sample_version_data(),
                started_at=datetime.datetime.utcnow(),
                finished_at=None,
                is_submitted=False,
            )


class CertificateAssessmentResponseModelUnitTests(test_utils.GenericTestBase):
    """Test the CertificateAssessmentResponseModel class."""

    def test_get_deletion_policy_is_delete(self) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentResponseModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE,
        )

    def test_get_model_association_to_user_is_not_corresponding_to_user(
        self,
    ) -> None:
        self.assertEqual(
            certificate_models.CertificateAssessmentResponseModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_has_reference_to_user_id(self) -> None:
        attempt: gae_models.CertificateAssessmentAttemptModel = (
            gae_models.CertificateAssessmentAttemptModel.create(
                learner_id='learner_id_1',
                certificate_id='cert_abc123',
                total_score=75.0,
                attempt_index=1,
                attempt_data={
                    'topic_id_101': {
                        'total_related_questions': 1,
                        'total_correct_questions': 1,
                    }
                },
                version_data={
                    'certificate_id': 'cert_abc123',
                    'certificate_version': 1,
                    'topic_versions': {'topic_id_101': 2},
                    'question_versions': {'question_id_1': 1},
                    'question_topic_links': {'question_id_1': ['topic_id_101']},
                },
                started_at=datetime.datetime.utcnow(),
                finished_at=None,
                is_submitted=False,
            )
        )
        gae_models.CertificateAssessmentResponseModel.create(
            attempt_key=attempt.key,
            attempt_id=attempt.id,
            question_id='question_id_1',
            question_version=1,
            selected_answer='Option A',
            is_correct=True,
        )

        self.assertTrue(
            gae_models.CertificateAssessmentResponseModel.has_reference_to_user_id(
                'learner_id_1'
            )
        )
        self.assertFalse(
            gae_models.CertificateAssessmentResponseModel.has_reference_to_user_id(
                'learner_id_2'
            )
        )

    def test_apply_deletion_policy_deletes_responses_for_user(self) -> None:
        attempt: gae_models.CertificateAssessmentAttemptModel = (
            gae_models.CertificateAssessmentAttemptModel.create(
                learner_id='learner_id_1',
                certificate_id='cert_abc123',
                total_score=75.0,
                attempt_index=1,
                attempt_data={
                    'topic_id_101': {
                        'total_related_questions': 1,
                        'total_correct_questions': 1,
                    }
                },
                version_data={
                    'certificate_id': 'cert_abc123',
                    'certificate_version': 1,
                    'topic_versions': {'topic_id_101': 2},
                    'question_versions': {'question_id_1': 1},
                    'question_topic_links': {'question_id_1': ['topic_id_101']},
                },
                started_at=datetime.datetime.utcnow(),
                finished_at=None,
                is_submitted=False,
            )
        )
        response = gae_models.CertificateAssessmentResponseModel.create(
            attempt_key=attempt.key,
            attempt_id=attempt.id,
            question_id='question_id_1',
            question_version=1,
            selected_answer='Option A',
            is_correct=True,
        )

        gae_models.CertificateAssessmentResponseModel.apply_deletion_policy(
            'learner_id_1'
        )

        self.assertIsNone(response.key.get())

    def test_apply_deletion_policy_noops_when_user_has_no_attempts(
        self,
    ) -> None:
        gae_models.CertificateAssessmentResponseModel.apply_deletion_policy(
            'missing_learner'
        )

    def test_has_reference_and_apply_deletion_policy_handle_large_attempt_sets(
        self,
    ) -> None:
        responses = []
        for index in range(31):
            attempt = gae_models.CertificateAssessmentAttemptModel.create(
                learner_id='learner_id_1',
                certificate_id='cert_abc123',
                total_score=75.0,
                attempt_index=index + 1,
                attempt_data={
                    'topic_id_101': {
                        'total_related_questions': 1,
                        'total_correct_questions': 1,
                    }
                },
                version_data={
                    'certificate_id': 'cert_abc123',
                    'certificate_version': 1,
                    'topic_versions': {'topic_id_101': 2},
                    'question_versions': {'question_id_1': 1},
                    'question_topic_links': {'question_id_1': ['topic_id_101']},
                },
                started_at=datetime.datetime.utcnow(),
                finished_at=None,
                is_submitted=False,
            )
            responses.append(
                gae_models.CertificateAssessmentResponseModel.create(
                    attempt_key=attempt.key,
                    attempt_id=attempt.id,
                    question_id='question_id_1',
                    question_version=1,
                    selected_answer='Option A',
                    is_correct=True,
                )
            )

        self.assertTrue(
            gae_models.CertificateAssessmentResponseModel.has_reference_to_user_id(
                'learner_id_1'
            )
        )

        gae_models.CertificateAssessmentResponseModel.apply_deletion_policy(
            'learner_id_1'
        )

        for response in responses:
            self.assertIsNone(response.key.get())

    def test_create_and_retrieve_lifecycle(self) -> None:
        attempt_key = datastore_services.Key(
            gae_models.CertificateAssessmentAttemptModel, 'attempt_id_1'
        )
        response = certificate_models.CertificateAssessmentResponseModel.create(
            attempt_key=attempt_key,
            attempt_id='attempt_id_1',
            question_id='question_id_1',
            question_version=1,
            selected_answer='Option A',
            is_correct=True,
        )

        self.assertEqual(response.id, 'question_id_1')
        self.assertEqual(response.key.parent(), attempt_key)

        fetched_model = response.key.get()
        self.assertIsNotNone(fetched_model)
        self.assertEqual(fetched_model.attempt_id, 'attempt_id_1')
        self.assertEqual(fetched_model.question_id, 'question_id_1')
        self.assertEqual(fetched_model.question_version, 1)
        self.assertEqual(fetched_model.selected_answer, 'Option A')
        self.assertTrue(fetched_model.is_correct)

    def test_create_multi_and_retrieve_lifecycle(self) -> None:
        attempt_key = datastore_services.Key(
            gae_models.CertificateAssessmentAttemptModel, 'attempt_id_1'
        )
        responses = (
            certificate_models.CertificateAssessmentResponseModel.create_multi(
                attempt_key=attempt_key,
                response_dicts=[
                    {
                        'attempt_id': 'attempt_id_1',
                        'question_id': 'question_id_1',
                        'question_version': 1,
                        'selected_answer': 'Option A',
                        'is_correct': True,
                    },
                    {
                        'attempt_id': 'attempt_id_1',
                        'question_id': 'question_id_2',
                        'question_version': 1,
                        'selected_answer': 'Option B',
                        'is_correct': False,
                    },
                ],
            )
        )

        self.assertEqual(
            [response.id for response in responses],
            ['question_id_1', 'question_id_2'],
        )
        for response in responses:
            self.assertEqual(response.key.parent(), attempt_key)

        fetched_models = [response.key.get() for response in responses]
        self.assertEqual(
            [fetched_model.attempt_id for fetched_model in fetched_models],
            ['attempt_id_1', 'attempt_id_1'],
        )
        self.assertEqual(
            [fetched_model.question_id for fetched_model in fetched_models],
            ['question_id_1', 'question_id_2'],
        )
        self.assertEqual(
            [fetched_model.selected_answer for fetched_model in fetched_models],
            ['Option A', 'Option B'],
        )
        self.assertEqual(
            [fetched_model.is_correct for fetched_model in fetched_models],
            [True, False],
        )

    def test_create_overwrites_existing_response_on_retry(self) -> None:
        """Ensures a retried submission overwrites the same entity."""
        attempt_key = datastore_services.Key(
            gae_models.CertificateAssessmentAttemptModel, 'attempt_id_1'
        )
        certificate_models.CertificateAssessmentResponseModel.create(
            attempt_key=attempt_key,
            attempt_id='attempt_id_1',
            question_id='question_id_1',
            question_version=1,
            selected_answer='Option A',
            is_correct=True,
        )
        certificate_models.CertificateAssessmentResponseModel.create(
            attempt_key=attempt_key,
            attempt_id='attempt_id_1',
            question_id='question_id_1',
            question_version=1,
            selected_answer='Option B',
            is_correct=False,
        )

        fetched_models = (
            certificate_models.CertificateAssessmentResponseModel.query(
                certificate_models.CertificateAssessmentResponseModel.attempt_id
                == 'attempt_id_1'
            ).fetch()
        )
        self.assertEqual(len(fetched_models), 1)
        self.assertEqual(fetched_models[0].selected_answer, 'Option B')
        self.assertFalse(fetched_models[0].is_correct)
