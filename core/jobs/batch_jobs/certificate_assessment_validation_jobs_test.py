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
"""Tests for certificate_assessment_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import certificate_assessment_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import List, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        certificate_assessment_models,
        question_models,
        topic_models,
    )

(
    certificate_assessment_models,
    question_models,
    topic_models,
) = models.Registry.import_models(
    [
        models.Names.CERTIFICATE_ASSESSMENT_OFFERING,
        models.Names.QUESTION,
        models.Names.TOPIC,
    ]
)


def _create_topic_model(
    self: job_test_utils.JobTestBase,
    topic_id: str,
    name: str,
    uncategorized_skill_ids: List[str],
    subtopic_skill_ids: List[str],
) -> topic_models.TopicModel:
    """Helper to build a minimal valid TopicModel for these tests, with all
    of its subtopic skill_ids placed into a single default subtopic."""
    subtopics = []
    if subtopic_skill_ids:
        subtopics = [
            {
                'id': 1,
                'title': 'Subtopic 1',
                'skill_ids': subtopic_skill_ids,
                'thumbnail_filename': None,
                'thumbnail_bg_color': None,
                'thumbnail_size_in_bytes': None,
                'url_fragment': 'subtopic-one',
            }
        ]
    return self.create_model(
        topic_models.TopicModel,
        id=topic_id,
        name=name,
        canonical_name=name.lower(),
        abbreviated_name=name,
        url_fragment='%s-url' % topic_id,
        description='Description for %s.' % name,
        canonical_story_references=[],
        additional_story_references=[],
        story_reference_schema_version=(
            feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION
        ),
        uncategorized_skill_ids=uncategorized_skill_ids,
        subtopics=subtopics,
        subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
        next_subtopic_id=2,
        language_code=constants.DEFAULT_LANGUAGE_CODE,
        practice_tab_is_displayed=False,
        meta_tag_content='',
        page_title_fragment_for_web='',
        skill_ids_for_diagnostic_test=[],
    )


def _create_question_skill_link_model(
    self: job_test_utils.JobTestBase,
    question_id: str,
    skill_id: str,
    skill_difficulty: float = 0.3,
) -> question_models.QuestionSkillLinkModel:
    """Helper to build a QuestionSkillLinkModel for these tests."""
    return self.create_model(
        question_models.QuestionSkillLinkModel,
        id=question_models.QuestionSkillLinkModel.get_model_id(
            question_id, skill_id
        ),
        question_id=question_id,
        skill_id=skill_id,
        skill_difficulty=skill_difficulty,
    )


def _create_offering_model(
    self: job_test_utils.JobTestBase,
    offering_id: str,
    topic_ids: List[str],
    total_questions: int,
    async_status: str = 'Available',
) -> certificate_assessment_models.CertificateAssessmentOfferingModel:
    """Helper to build a CertificateAssessmentOfferingModel for these
    tests."""
    return self.create_model(
        certificate_assessment_models.CertificateAssessmentOfferingModel,
        id=offering_id,
        title='Certificate for %s' % offering_id,
        description='Description for %s.' % offering_id,
        classroom_id='classroom_1',
        topic_ids=topic_ids,
        total_questions=total_questions,
        time_limit_in_minutes=30,
        demonstrates=[],
        async_status=async_status,
    )


class BlockInvalidCertificateAssessmentOfferingsJobTests(
    job_test_utils.JobTestBase
):
    """Tests for BlockInvalidCertificateAssessmentOfferingsJob."""

    JOB_CLASS: Type[
        certificate_assessment_validation_jobs.BlockInvalidCertificateAssessmentOfferingsJob
    ] = (
        certificate_assessment_validation_jobs.BlockInvalidCertificateAssessmentOfferingsJob
    )

    def test_empty_storage(self) -> None:
        """Test that the job runs successfully with empty storage."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

    def test_does_not_block_offering_with_sufficient_question_pool(
        self,
    ) -> None:
        """An offering whose topic has enough linked questions should stay
        Available."""
        topic_model = _create_topic_model(
            self,
            topic_id='topic_sufficient',
            name='Sufficient Topic',
            uncategorized_skill_ids=['skill_1'],
            subtopic_skill_ids=[],
        )
        question_skill_link_models = [
            _create_question_skill_link_model(self, 'question_1', 'skill_1'),
            _create_question_skill_link_model(self, 'question_2', 'skill_1'),
            _create_question_skill_link_model(self, 'question_3', 'skill_1'),
        ]
        offering_model = _create_offering_model(
            self,
            offering_id='offering_sufficient',
            topic_ids=['topic_sufficient'],
            total_questions=3,
        )
        self.put_multi(
            [topic_model, offering_model] + question_skill_link_models
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'offering_sufficient'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Available')

    def test_blocks_offering_with_insufficient_question_pool(self) -> None:
        """An offering whose topic does not have enough linked questions
        should be blocked."""
        topic_model = _create_topic_model(
            self,
            topic_id='topic_insufficient',
            name='Insufficient Topic',
            uncategorized_skill_ids=['skill_2'],
            subtopic_skill_ids=[],
        )
        question_skill_link_models = [
            _create_question_skill_link_model(self, 'question_4', 'skill_2'),
        ]
        offering_model = _create_offering_model(
            self,
            offering_id='offering_insufficient',
            topic_ids=['topic_insufficient'],
            total_questions=5,
        )
        self.put_multi(
            [topic_model, offering_model] + question_skill_link_models
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CertificateAssessmentOfferingModel '
                    'with ID: offering_insufficient.'
                ),
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'offering_insufficient'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Blocked')

    def test_blocks_offering_with_nonexistent_topic(self) -> None:
        """An offering referencing a topic that no longer exists (e.g. it
        was deleted) should be blocked."""
        offering_model = _create_offering_model(
            self,
            offering_id='offering_missing_topic',
            topic_ids=['nonexistent_topic_id'],
            total_questions=5,
        )
        self.put_multi([offering_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CertificateAssessmentOfferingModel '
                    'with ID: offering_missing_topic.'
                ),
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'offering_missing_topic'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Blocked')

    def test_includes_skills_from_subtopics_and_uncategorized(self) -> None:
        """Questions reachable through a subtopic skill should count toward
        the topic's available question pool, same as uncategorized skills."""
        topic_model = _create_topic_model(
            self,
            topic_id='topic_mixed',
            name='Mixed Topic',
            uncategorized_skill_ids=['skill_uncategorized'],
            subtopic_skill_ids=['skill_in_subtopic'],
        )
        question_skill_link_models = [
            _create_question_skill_link_model(
                self, 'question_5', 'skill_uncategorized'
            ),
            _create_question_skill_link_model(
                self, 'question_6', 'skill_in_subtopic'
            ),
        ]
        offering_model = _create_offering_model(
            self,
            offering_id='offering_mixed',
            topic_ids=['topic_mixed'],
            total_questions=2,
        )
        self.put_multi(
            [topic_model, offering_model] + question_skill_link_models
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

    def test_skips_offering_already_blocked(self) -> None:
        """An offering already in Blocked status should not be
        re-validated or re-logged."""
        already_blocked_offering = _create_offering_model(
            self,
            offering_id='already_blocked_offering',
            topic_ids=['nonexistent_topic_id'],
            total_questions=5,
            async_status='Blocked',
        )
        self.put_multi([already_blocked_offering])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'already_blocked_offering'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Blocked')

    def test_skips_not_ready_offering_even_with_insufficient_pool(
        self,
    ) -> None:
        """An offering in Not_Ready status should never be validated or
        touched, even if its question pool would otherwise fail."""
        not_ready_offering = _create_offering_model(
            self,
            offering_id='offering_not_ready',
            topic_ids=['nonexistent_topic_id'],
            total_questions=5,
            async_status='Not_Ready',
        )
        self.put_multi([not_ready_offering])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'offering_not_ready'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Not_Ready')

    def test_questions_shared_across_topics_count_independently(
        self,
    ) -> None:
        """A question linked to a skill that's shared across topics (via the
        skill belonging to both topics) should be counted toward each
        topic's pool independently."""
        topic_a = _create_topic_model(
            self,
            topic_id='topic_a',
            name='Topic A',
            uncategorized_skill_ids=['shared_skill'],
            subtopic_skill_ids=[],
        )
        topic_b = _create_topic_model(
            self,
            topic_id='topic_b',
            name='Topic B',
            uncategorized_skill_ids=['shared_skill'],
            subtopic_skill_ids=[],
        )
        question_skill_link_models = [
            _create_question_skill_link_model(
                self, 'shared_question', 'shared_skill'
            ),
        ]
        offering_model = _create_offering_model(
            self,
            offering_id='offering_shared',
            topic_ids=['topic_a', 'topic_b'],
            total_questions=2,
        )
        self.put_multi(
            [topic_a, topic_b, offering_model] + question_skill_link_models
        )

        # Each topic gets 1 required question (2 total / 2 topics), and
        # each topic has access to the same 1 shared question, so the
        # offering should remain valid.
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )


class BlockInvalidCertificateAssessmentOfferingsAuditJobTests(
    job_test_utils.JobTestBase
):
    """Tests for BlockInvalidCertificateAssessmentOfferingsAuditJob."""

    JOB_CLASS: Type[
        certificate_assessment_validation_jobs.BlockInvalidCertificateAssessmentOfferingsAuditJob
    ] = (
        certificate_assessment_validation_jobs.BlockInvalidCertificateAssessmentOfferingsAuditJob
    )

    def test_empty_storage(self) -> None:
        """Test that the audit job runs successfully with empty storage."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

    def test_audit_job_does_not_update_models(self) -> None:
        """Test that the audit job logs but does not write the blocked
        status to the datastore."""
        offering_model = _create_offering_model(
            self,
            offering_id='audit_offering_missing_topic',
            topic_ids=['nonexistent_topic_id'],
            total_questions=5,
        )
        self.put_multi([offering_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Updated state of CertificateAssessmentOfferingModel '
                    'with ID: audit_offering_missing_topic.'
                ),
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'audit_offering_missing_topic'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Available')

    def test_skips_not_ready_offering_even_with_insufficient_pool(
        self,
    ) -> None:
        """An offering in Not_Ready status should never be validated or
        touched, even if its question pool would otherwise fail."""
        not_ready_offering = _create_offering_model(
            self,
            offering_id='offering_not_ready',
            topic_ids=['nonexistent_topic_id'],
            total_questions=5,
            async_status='Not_Ready',
        )
        self.put_multi([not_ready_offering])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'offering_not_ready'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Not_Ready')

    def test_skips_offering_already_blocked(self) -> None:
        """An offering already in Blocked status should not be
        re-validated or re-logged."""
        already_blocked_offering = _create_offering_model(
            self,
            offering_id='already_blocked_offering',
            topic_ids=['nonexistent_topic_id'],
            total_questions=5,
            async_status='Blocked',
        )
        self.put_multi([already_blocked_offering])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: 0.'
                )
            ]
        )

        updated_model = certificate_assessment_models.CertificateAssessmentOfferingModel.get(
            'already_blocked_offering'
        )
        assert updated_model is not None
        self.assertEqual(updated_model.async_status, 'Blocked')
