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
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for certificate assessment services."""

from __future__ import annotations

import datetime
import json
import secrets
from unittest import mock

from core import utils
from core.domain import (
    certificate_assessment_services,
    classroom_config_domain,
    classroom_config_services,
    question_fetchers,
    question_services,
    skill_fetchers,
    topic_domain,
    topic_fetchers,
    translation_domain,
)
from core.platform import models
from core.storage.certificate_assessment import gae_models
from core.tests import test_utils

from typing import Sequence, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        certificate_assessment_offering_models,
        skill_models,
    )

(
    certificate_assessment_offering_models,
    skill_models,
) = models.Registry.import_models(
    [
        models.Names.CERTIFICATE_ASSESSMENT_OFFERING,
        models.Names.SKILL,
    ]
)

CERTIFICATE_DIFFICULTY_EASY = (
    certificate_assessment_services.CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY
)
CERTIFICATE_DIFFICULTY_MEDIUM = (
    certificate_assessment_services.CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM
)
CERTIFICATE_DIFFICULTY_HARD = (
    certificate_assessment_services.CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD
)


class ValidationSamplingTestCase(TypedDict):
    """Typed definition of a validation sampling test case."""

    name: str
    topic_skill_to_question_ids: dict[str, dict[str, list[str]]]
    topic_ids: list[str]
    total_questions: int
    expected_is_valid: bool
    expected_message_substrings: list[str]
    expected_validation_errors: dict[str, dict[str, int]]


class InvalidInputTestCase(TypedDict):
    """Typed definition of an invalid input test case."""

    name: str
    topic_ids: list[str]
    total_questions: int
    message: str


class CertificateAssessmentServicesTest(test_utils.GenericTestBase):
    """Tests for certificate assessment services."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def setUp(self) -> None:
        super().setUp()
        self.classroom_id = 'math_classroom_01'
        self.classroom_url_fragment = 'math'
        self.other_classroom_id = 'science_classroom_01'
        self.other_classroom_url_fragment = 'science'
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.other_topic_id = topic_fetchers.get_new_topic_id()
        self.owner_email = f'certificate.assessment.{self.topic_id}@example.com'
        self.owner_username = 'certificateassessment1'
        self.signup(self.owner_email, self.owner_username)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.owner_email)
        self.save_new_topic(
            self.topic_id,
            owner_id,
            name='math topic',
            abbreviated_name='math',
            url_fragment='math-topic',
        )
        self.save_new_topic(
            self.other_topic_id,
            owner_id,
            name='science topic',
            abbreviated_name='science',
            url_fragment='science-topic',
        )
        classroom = classroom_config_domain.Classroom(
            self.classroom_id,
            name='Math',
            url_fragment='math',
            feedback_recipient_email='user@email.com',
            course_details='Course details',
            teaser_text='Teaser text',
            topic_list_intro='Topic intro',
            topic_id_to_prerequisite_topic_ids={self.topic_id: []},
            is_published=True,
            diagnostic_test_is_enabled=False,
            thumbnail_data=classroom_config_domain.ImageData(
                'thumbnail.svg',
                'red',
                1,
            ),
            banner_data=classroom_config_domain.ImageData(
                'banner.svg',
                'blue',
                1,
            ),
            index=0,
        )
        classroom_config_services.create_new_classroom(classroom)
        other_classroom = classroom_config_domain.Classroom(
            self.other_classroom_id,
            name='Science',
            url_fragment=self.other_classroom_url_fragment,
            feedback_recipient_email='user@email.com',
            course_details='Course details',
            teaser_text='Teaser text',
            topic_list_intro='Topic intro',
            topic_id_to_prerequisite_topic_ids={self.other_topic_id: []},
            is_published=True,
            diagnostic_test_is_enabled=False,
            thumbnail_data=classroom_config_domain.ImageData(
                'thumbnail.svg',
                'red',
                1,
            ),
            banner_data=classroom_config_domain.ImageData(
                'banner.svg',
                'blue',
                1,
            ),
            index=1,
        )
        classroom_config_services.create_new_classroom(other_classroom)

    def test_create_certificate_assessment_offering_writes_model(self) -> None:
        certificate_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='History Foundations',
            description='Covers timelines and source interpretation.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=8,
            time_limit_in_minutes=45,
            demonstrates=['Historical reasoning'],
            async_status='Available',
        )

        self.assertTrue(certificate_offering.certificate_id)
        self.assertEqual(certificate_offering.version, 1)

    def test_get_certificate_assessment_offerings_returns_all(self) -> None:
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Geography Essentials',
            description='Covers maps and spatial reasoning.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=6,
            time_limit_in_minutes=30,
            demonstrates=['Map reading'],
            async_status='Available',
        )

        offerings = (
            certificate_assessment_services.get_certificate_assessment_offerings()
        )

        self.assertEqual(len(offerings), 1)
        self.assertEqual(
            offerings[0].certificate_id, created_offering.certificate_id
        )
        self.assertEqual(offerings[0].title, 'Geography Essentials')

    def test_get_update_and_delete_certificate_assessment_offering(
        self,
    ) -> None:
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Biology Basics',
            description='Covers cells and ecosystems.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=6,
            time_limit_in_minutes=30,
            demonstrates=['Living systems'],
            async_status='Available',
        )

        fetched_offering = (
            certificate_assessment_services.get_certificate_assessment_offering(
                created_offering.certificate_id
            )
        )
        self.assertEqual(fetched_offering.title, 'Biology Basics')

        updated_offering = certificate_assessment_services.update_certificate_assessment_offering(
            certificate_id=created_offering.certificate_id,
            title='Biology Advanced',
            description='Covers cells, ecosystems and genetics.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=8,
            time_limit_in_minutes=40,
            demonstrates=['Living systems'],
            async_status='Blocked',
        )
        self.assertEqual(updated_offering.title, 'Biology Advanced')
        self.assertEqual(updated_offering.version, 2)

        certificate_assessment_services.delete_certificate_assessment_offering(
            created_offering.certificate_id
        )

        with self.assertRaisesRegex(
            certificate_assessment_services.CertificateAssessmentOfferingNotFoundException,
            'Certificate assessment offering .* does not exist.',
        ):
            certificate_assessment_services.get_certificate_assessment_offering(
                created_offering.certificate_id
            )

    def _create_assessment_question(
        self,
        question_id: str,
        skill_id: str,
        answer_text: str,
        skill_difficulty: float = 0.3,
    ) -> None:
        """Creates a question linked to the given skill for use in assessments."""
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_skill(skill_id, owner_id, description='Skill 1')
        self.save_new_question(
            question_id,
            owner_id,
            self._create_valid_question_data(answer_text, content_id_generator),
            [skill_id],
            content_id_generator.next_content_id_index,
        )
        question_services.create_new_question_skill_link(
            owner_id, question_id, skill_id, skill_difficulty
        )

    def _create_assessment_topic_with_skills(self, skill_ids: list[str]) -> str:
        """Creates a topic containing the given skills and returns its id."""
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        topic_id = topic_fetchers.get_new_topic_id()
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic', 'subtopic'
        )
        subtopic.skill_ids = skill_ids
        self.save_new_topic(
            topic_id,
            owner_id,
            name='Assessment Topic',
            url_fragment='assessment-topic',
            subtopics=[subtopic],
            next_subtopic_id=2,
        )
        return topic_id

    def test_start_certificate_assessment_attempt_creates_attempt_and_selects_questions(
        self,
    ) -> None:
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        question_id_1 = question_services.get_new_question_id()
        question_id_2 = question_services.get_new_question_id()
        question_id_3 = question_services.get_new_question_id()
        self._create_assessment_question(
            question_id_1, 'skill_1', 'Answer 1', 0.6
        )
        self._create_assessment_question(
            question_id_2, 'skill_2', 'Answer 2', 0.3
        )
        self._create_assessment_question(
            question_id_3, 'skill_3', 'Answer 3', 0.9
        )
        topic_id = self._create_assessment_topic_with_skills(
            ['skill_1', 'skill_2', 'skill_3']
        )

        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Arithmetic Check',
            description='Checks arithmetic basics.',
            classroom_id=self.classroom_id,
            topic_ids=[topic_id],
            total_questions=3,
            time_limit_in_minutes=30,
            demonstrates=['Arithmetic reasoning'],
            async_status='Available',
        )

        with mock.patch.object(
            secrets.SystemRandom,
            'sample',
            side_effect=lambda items, count: items[:count],
        ):
            attempt, questions = (
                certificate_assessment_services.start_certificate_assessment_attempt(
                    created_offering.certificate_id,
                    owner_id,
                )
            )

        self.assertEqual(attempt.attempt_index, 0)
        self.assertFalse(attempt.is_submitted)
        self.assertIsNotNone(attempt.started_at)
        self.assertEqual(
            attempt.version_data['certificate_id'],
            created_offering.certificate_id,
        )
        self.assertEqual(attempt.version_data['certificate_version'], 1)
        self.assertEqual(attempt.version_data['topic_versions'], {topic_id: 1})
        self.assertEqual(
            attempt.version_data['question_topic_links'],
            {
                question_id_1: [topic_id],
                question_id_2: [topic_id],
                question_id_3: [topic_id],
            },
        )
        self.assertEqual(
            questions,
            [
                {'question_id': question_id_1, 'question_version': 1},
                {'question_id': question_id_2, 'question_version': 1},
                {'question_id': question_id_3, 'question_version': 1},
            ],
        )

    def test_get_topic_question_ids_by_difficulty_groups_by_difficulty(
        self,
    ) -> None:
        topic_id = topic_fetchers.get_new_topic_id()
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_skill('skill_easy', owner_id, description='Easy skill')
        self.save_new_skill(
            'skill_medium', owner_id, description='Medium skill'
        )
        self.save_new_skill('skill_hard', owner_id, description='Hard skill')
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic', 'subtopic'
        )
        subtopic.skill_ids = ['skill_easy', 'skill_medium', 'skill_hard']
        self.save_new_topic(
            topic_id,
            owner_id,
            name='Difficulty Assessment Topic',
            url_fragment='difficulty-topic',
            subtopics=[subtopic],
            next_subtopic_id=2,
        )
        question_ids_by_difficulty = {}
        for question_id, skill_id, difficulty in (
            (question_services.get_new_question_id(), 'skill_easy', 0.3),
            (question_services.get_new_question_id(), 'skill_medium', 0.6),
            (question_services.get_new_question_id(), 'skill_hard', 0.9),
        ):
            question_ids_by_difficulty[difficulty] = question_id
            content_id_generator = translation_domain.ContentIdGenerator()
            self.save_new_question(
                question_id,
                owner_id,
                self._create_valid_question_data(
                    'Answer', content_id_generator
                ),
                [skill_id],
                content_id_generator.next_content_id_index,
            )
            question_services.create_new_question_skill_link(
                owner_id, question_id, skill_id, difficulty
            )

        result = getattr(
            certificate_assessment_services,
            '_get_topic_question_ids_by_difficulty',
        )([topic_id])

        self.assertEqual(
            result[topic_id],
            {
                CERTIFICATE_DIFFICULTY_EASY: [question_ids_by_difficulty[0.3]],
                CERTIFICATE_DIFFICULTY_MEDIUM: [
                    question_ids_by_difficulty[0.6]
                ],
                CERTIFICATE_DIFFICULTY_HARD: [question_ids_by_difficulty[0.9]],
            },
        )

    def test_get_topic_question_ids_by_difficulty_skips_missing_skills_and_duplicates(
        self,
    ) -> None:
        topic = mock.Mock()
        topic.get_all_skill_ids.return_value = [
            'skill_missing',
            'skill_1',
            'skill_2',
            'skill_3',
            'skill_unclassified',
        ]
        skill_1 = mock.Mock()
        skill_1.id = 'skill_1'
        skill_1.description = 'Skill 1 description'
        skill_2 = mock.Mock()
        skill_2.id = 'skill_2'
        skill_2.description = 'Skill 2 description'
        skill_3 = mock.Mock()
        skill_3.id = 'skill_3'
        skill_3.description = 'Skill 3 description'
        skill_unclassified = mock.Mock()
        skill_unclassified.id = 'skill_unclassified'
        skill_unclassified.description = 'Skill unclassified description'
        skill_1_links = [mock.Mock(question_id='q_1', skill_difficulty=0.6)]
        skill_2_links = [mock.Mock(question_id='q_1', skill_difficulty=0.3)]
        skill_3_links = [mock.Mock(question_id='q_1', skill_difficulty=0.6)]
        skill_unclassified_links = [
            mock.Mock(question_id='q_unclassified', skill_difficulty=0.5)
        ]
        links_by_skill_id = {
            'skill_1': skill_1_links,
            'skill_2': skill_2_links,
            'skill_3': skill_3_links,
            'skill_unclassified': skill_unclassified_links,
        }

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ), mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            return_value=[
                None,
                skill_1,
                skill_2,
                skill_3,
                skill_unclassified,
            ],
        ), mock.patch.object(
            skill_fetchers,
            'get_skill_from_model',
            side_effect=lambda skill_model: skill_model,
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            side_effect=lambda skill_id, description: links_by_skill_id[
                skill_id
            ],
        ):
            result = getattr(
                certificate_assessment_services,
                '_get_topic_question_ids_by_difficulty',
            )(['topic_1'])

        self.assertEqual(
            result['topic_1'][CERTIFICATE_DIFFICULTY_MEDIUM], ['q_1']
        )
        self.assertEqual(
            result['topic_1'][CERTIFICATE_DIFFICULTY_EASY], ['q_1']
        )
        self.assertEqual(
            result['topic_1'].get(CERTIFICATE_DIFFICULTY_HARD, []), []
        )

    def test_build_version_data_includes_certificate_and_topic_versions(
        self,
    ) -> None:
        topic = mock.Mock(version=3)
        question = mock.Mock(version=7)
        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ), mock.patch.object(
            question_fetchers,
            'get_questions_by_ids',
            return_value=[question],
        ):
            result = getattr(
                certificate_assessment_services, '_build_version_data'
            )('cert_1', 2, ['topic_1'], [('question_1', 'topic_1')])

        self.assertEqual(
            result,
            {
                'certificate_id': 'cert_1',
                'certificate_version': 2,
                'topic_versions': {'topic_1': 3},
                'question_versions': {'question_1': 7},
                'question_topic_links': {'question_1': ['topic_1']},
            },
        )

    def test_get_active_attempt_for_learner_returns_or_raises(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No active certificate assessment attempt was found.',
        ):
            getattr(
                certificate_assessment_services,
                '_get_active_attempt_for_learner',
            )('learner_1')

        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {'question_1': 1},
                'question_topic_links': {'question_1': ['topic_1']},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        self.assertEqual(
            getattr(
                certificate_assessment_services,
                '_get_active_attempt_for_learner',
            )('learner_1').id,
            attempt.id,
        )

    def test_get_next_attempt_index_uses_highest_submitted_index(
        self,
    ) -> None:
        for attempt_index in (1, 3):
            gae_models.CertificateAssessmentAttemptModel.create(
                learner_id='learner_1',
                certificate_id='cert_1',
                total_score=0.0,
                attempt_index=attempt_index,
                attempt_data={},
                version_data={
                    'certificate_id': 'cert_1',
                    'certificate_version': 1,
                    'topic_versions': {'topic_1': 1},
                    'question_versions': {'question_1': 1},
                    'question_topic_links': {'question_1': ['topic_1']},
                },
                started_at=datetime.datetime.utcnow(),
                finished_at=datetime.datetime.utcnow(),
                is_submitted=True,
            )
        # A submitted attempt for a different certificate is not counted.
        gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_1',
            certificate_id='cert_2',
            total_score=0.0,
            attempt_index=2,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_2',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {'question_1': 1},
                'question_topic_links': {'question_1': ['topic_1']},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=datetime.datetime.utcnow(),
            is_submitted=True,
        )
        # An in-progress attempt is ignored even if it carries a higher index.
        gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=5,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {'question_1': 1},
                'question_topic_links': {'question_1': ['topic_1']},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )

        self.assertEqual(
            getattr(
                certificate_assessment_services,
                '_get_next_attempt_index_for_certificate',
            )('learner_1', 'cert_1'),
            4,
        )
        self.assertEqual(
            getattr(
                certificate_assessment_services,
                '_get_next_attempt_index_for_certificate',
            )('learner_1', 'cert_missing'),
            1,
        )

    def test_get_question_state_data_for_assessment_attempt_raises_for_invalid_cases(
        self,
    ) -> None:
        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {'question_1': 1},
                'question_topic_links': {'question_1': ['topic_1']},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        with self.assertRaisesRegex(
            utils.ValidationError, 'Attempt does not exist.'
        ):
            certificate_assessment_services.get_question_state_data_for_assessment_attempt(
                'learner_1', 'missing_attempt', 'question_1'
            )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'This attempt does not belong to the current learner.',
        ):
            certificate_assessment_services.get_question_state_data_for_assessment_attempt(
                'other_learner', attempt.id, 'question_1'
            )
        attempt.is_submitted = True
        attempt.update_timestamps()
        attempt.put()
        with self.assertRaisesRegex(
            utils.ValidationError, 'This assessment has already been submitted.'
        ):
            certificate_assessment_services.get_question_state_data_for_assessment_attempt(
                'learner_1', attempt.id, 'question_1'
            )

    def test_get_question_state_data_for_assessment_attempt_strips_solution_and_hints(
        self,
    ) -> None:
        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {'question_1': 1},
                'question_topic_links': {'question_1': ['topic_1']},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        question = mock.Mock()
        question.question_state_data.to_dict.return_value = {
            'content': {'html': '<p>Question</p>'},
            'interaction': {'solution': 'solution', 'hints': ['hint']},
        }
        with mock.patch.object(
            question_services,
            'get_question_by_id_and_version',
            return_value=question,
        ) as get_question_mock:
            result = certificate_assessment_services.get_question_state_data_for_assessment_attempt(
                'learner_1', attempt.id, 'question_1'
            )

        get_question_mock.assert_called_once_with('question_1', 1)
        self.assertIsNone(result['interaction']['solution'])
        self.assertEqual(result['interaction']['hints'], [])
        self.assertEqual(result['content'], {'html': '<p>Question</p>'})

    def test_get_question_state_data_for_assessment_attempt_raises_for_question_not_in_attempt(
        self,
    ) -> None:
        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {'question_1': 1},
                'question_topic_links': {'question_1': ['topic_1']},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        with self.assertRaisesRegex(
            utils.ValidationError, 'Question is not part of this attempt.'
        ):
            certificate_assessment_services.get_question_state_data_for_assessment_attempt(
                'learner_1', attempt.id, 'unrelated_question'
            )

    def test_get_certificate_assessment_attempt_raises_for_missing_attempt(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Attempt does not exist.'
        ):
            certificate_assessment_services.get_certificate_assessment_attempt(
                'missing_attempt_id'
            )

    def test_start_certificate_assessment_attempt_rejects_in_progress_attempt(
        self,
    ) -> None:
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        question_id_1 = question_services.get_new_question_id()
        question_id_2 = question_services.get_new_question_id()
        question_id_3 = question_services.get_new_question_id()
        self._create_assessment_question(
            question_id_1, 'skill_1', 'Answer', 0.6
        )
        self._create_assessment_question(
            question_id_2, 'skill_2', 'Answer 2', 0.3
        )
        self._create_assessment_question(
            question_id_3, 'skill_3', 'Answer 3', 0.9
        )
        topic_id = self._create_assessment_topic_with_skills(
            ['skill_1', 'skill_2', 'skill_3']
        )
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Arithmetic Check',
            description='Checks arithmetic basics.',
            classroom_id=self.classroom_id,
            topic_ids=[topic_id],
            total_questions=3,
            time_limit_in_minutes=30,
            demonstrates=['Arithmetic reasoning'],
            async_status='Available',
        )

        in_progress_attempt = (
            gae_models.CertificateAssessmentAttemptModel.create(
                learner_id=owner_id,
                certificate_id=created_offering.certificate_id,
                total_score=0.0,
                attempt_index=1,
                attempt_data={},
                version_data={
                    'certificate_id': created_offering.certificate_id,
                    'certificate_version': 1,
                    'topic_versions': {topic_id: 1},
                    'question_versions': {'dummy_question_id': 1},
                    'question_topic_links': {'dummy_question_id': [topic_id]},
                },
                started_at=datetime.datetime.utcnow(),
                finished_at=None,
                is_submitted=False,
            )
        )

        with mock.patch.object(
            certificate_assessment_services,
            'validate_certificate_assessment_offering',
            return_value={'is_valid': True},
        ), self.assertRaisesRegex(
            utils.ValidationError,
            'You already have an in-progress certificate assessment attempt.',
        ):
            certificate_assessment_services.start_certificate_assessment_attempt(
                created_offering.certificate_id,
                owner_id,
            )

        self.assertIsNotNone(
            gae_models.CertificateAssessmentAttemptModel.get_by_id(
                in_progress_attempt.id
            )
        )

    def test_start_certificate_assessment_attempt_blocks_invalid_offering(
        self,
    ) -> None:
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Arithmetic Check',
            description='Checks arithmetic basics.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=3,
            time_limit_in_minutes=30,
            demonstrates=['Arithmetic reasoning'],
            async_status='Available',
        )

        with mock.patch.object(
            certificate_assessment_services,
            'validate_certificate_assessment_offering',
            return_value={'is_valid': False},
        ), self.assertRaisesRegex(
            certificate_assessment_services.CertificateAssessmentAttemptNotReadyException,
            'Sorry, this assessment isn\'t ready anymore!',
        ):
            certificate_assessment_services.start_certificate_assessment_attempt(
                created_offering.certificate_id,
                owner_id,
            )

        blocked_offering = (
            certificate_assessment_services.get_certificate_assessment_offering(
                created_offering.certificate_id
            )
        )
        self.assertEqual(blocked_offering.async_status, 'Blocked')

    def test_submit_certificate_assessment_attempt_raises_for_missing_attempt(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Attempt does not exist.'
        ):
            certificate_assessment_services.submit_certificate_assessment_attempt(
                'missing_attempt', []
            )

    def test_submit_certificate_assessment_attempt_raises_for_submitted_attempt(
        self,
    ) -> None:
        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='learner_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {'question_1': 1},
                'question_topic_links': {'question_1': ['topic_1']},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=datetime.datetime.utcnow(),
            is_submitted=True,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'This assessment has already been submitted.',
        ):
            certificate_assessment_services.submit_certificate_assessment_attempt(
                attempt.id, []
            )

    def test_submit_certificate_assessment_attempt_scores_and_persists_responses(
        self,
    ) -> None:
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        question_id_1 = question_services.get_new_question_id()
        question_id_2 = question_services.get_new_question_id()
        question_id_3 = question_services.get_new_question_id()
        self._create_assessment_question(
            question_id_1, 'skill_1', 'Correct answer'
        )
        self._create_assessment_question(
            question_id_2, 'skill_2', 'Second answer'
        )
        self._create_assessment_question(
            question_id_3, 'skill_3', 'Third answer'
        )

        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Arithmetic Check',
            description='Checks arithmetic basics.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=3,
            time_limit_in_minutes=30,
            demonstrates=['Arithmetic reasoning'],
            async_status='Available',
        )
        attempt_model = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id=owner_id,
            certificate_id=created_offering.certificate_id,
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': created_offering.certificate_id,
                'certificate_version': 1,
                'topic_versions': {self.topic_id: 1},
                'question_versions': {
                    question_id_1: 1,
                    question_id_2: 1,
                    question_id_3: 1,
                },
                'question_topic_links': {
                    question_id_1: [self.topic_id],
                    question_id_2: [self.topic_id],
                    question_id_3: [self.topic_id],
                },
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )

        submitted_attempt = certificate_assessment_services.submit_certificate_assessment_attempt(
            attempt_model.id,
            [
                {
                    'question_id': question_id_1,
                    'selected_answer': '  Solution  ',
                    'is_correct': True,
                },
                {
                    'question_id': question_id_2,
                    'selected_answer': 'Wrong answer',
                    'is_correct': False,
                },
                {
                    'question_id': question_id_3,
                    'selected_answer': 'Wrong answer',
                    'is_correct': False,
                },
            ],
        )

        self.assertTrue(submitted_attempt.is_submitted)
        self.assertAlmostEqual(submitted_attempt.total_score, 33.33, places=2)
        self.assertEqual(
            submitted_attempt.attempt_data,
            {
                self.topic_id: {
                    'total_related_questions': 3,
                    'total_correct_questions': 1,
                }
            },
        )

        response_models: Sequence[
            gae_models.CertificateAssessmentResponseModel
        ] = gae_models.CertificateAssessmentResponseModel.query(
            gae_models.CertificateAssessmentResponseModel.attempt_id
            == attempt_model.id
        ).fetch()
        self.assertEqual(len(response_models), 3)
        response_by_question_id = {
            response_model.question_id: response_model
            for response_model in response_models
        }
        self.assertEqual(
            response_by_question_id[question_id_1].selected_answer,
            '  Solution  ',
        )
        self.assertTrue(response_by_question_id[question_id_1].is_correct)
        self.assertEqual(
            response_by_question_id[question_id_2].selected_answer,
            'Wrong answer',
        )
        self.assertFalse(response_by_question_id[question_id_2].is_correct)
        self.assertEqual(
            response_by_question_id[question_id_3].selected_answer,
            'Wrong answer',
        )
        self.assertFalse(response_by_question_id[question_id_3].is_correct)

        with self.assertRaisesRegex(
            utils.ValidationError,
            'This assessment has already been submitted.',
        ):
            certificate_assessment_services.submit_certificate_assessment_attempt(
                attempt_model.id,
                [
                    {
                        'question_id': question_id_1,
                        'selected_answer': 'Correct answer',
                    }
                ],
            )

    def test_submit_certificate_assessment_attempt_stores_answers_and_honors_is_correct(
        self,
    ) -> None:
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        question_ids = [
            'q_string',
            'q_int',
            'q_float',
            'q_dict',
            'q_list',
            'q_nested_list',
            'q_no_answer',
            'q_missing_flag',
        ]
        attempt_model = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id=owner_id,
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'topic_versions': {'topic_1': 1},
                'question_versions': {
                    question_id: 1 for question_id in question_ids
                },
                'question_topic_links': {
                    question_id: ['topic_1'] for question_id in question_ids
                },
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )

        submitted_attempt = certificate_assessment_services.submit_certificate_assessment_attempt(
            attempt_model.id,
            [
                {
                    'question_id': 'q_string',
                    'selected_answer': '  my answer  ',
                    'is_correct': True,
                },
                {
                    'question_id': 'q_int',
                    'selected_answer': 7,
                    'is_correct': True,
                },
                {
                    'question_id': 'q_float',
                    'selected_answer': '3.5',
                    'is_correct': False,
                },
                {
                    'question_id': 'q_dict',
                    'selected_answer': {
                        'isNegative': 'False',
                        'wholeNumber': '0',
                        'numerator': '1',
                        'denominator': '2',
                    },
                    'is_correct': True,
                },
                {
                    'question_id': 'q_list',
                    'selected_answer': ['a', 'b'],
                    'is_correct': False,
                },
                {
                    'question_id': 'q_nested_list',
                    'selected_answer': [['a'], ['b', 'c']],
                    'is_correct': True,
                },
                {
                    'question_id': 'q_no_answer',
                    'is_correct': False,
                },
                {
                    'question_id': 'q_missing_flag',
                    'selected_answer': 'answer without flag',
                },
            ],
        )

        # 4 of the 8 questions are marked correct by the client.
        self.assertAlmostEqual(submitted_attempt.total_score, 50.0, places=2)
        self.assertEqual(
            submitted_attempt.attempt_data,
            {
                'topic_1': {
                    'total_related_questions': 8,
                    'total_correct_questions': 4,
                }
            },
        )
        response_models: Sequence[
            gae_models.CertificateAssessmentResponseModel
        ] = gae_models.CertificateAssessmentResponseModel.query(
            gae_models.CertificateAssessmentResponseModel.attempt_id
            == attempt_model.id
        ).fetch()
        self.assertEqual(len(response_models), 8)
        response_by_question_id = {
            response_model.question_id: response_model
            for response_model in response_models
        }
        self.assertTrue(response_by_question_id['q_string'].is_correct)
        self.assertTrue(response_by_question_id['q_int'].is_correct)
        self.assertFalse(response_by_question_id['q_float'].is_correct)
        self.assertTrue(response_by_question_id['q_dict'].is_correct)
        self.assertFalse(response_by_question_id['q_list'].is_correct)
        self.assertTrue(response_by_question_id['q_nested_list'].is_correct)
        self.assertFalse(response_by_question_id['q_no_answer'].is_correct)
        # A missing is_correct flag defaults to an incorrect answer.
        self.assertFalse(response_by_question_id['q_missing_flag'].is_correct)
        self.assertEqual(
            response_by_question_id['q_string'].selected_answer,
            '  my answer  ',
        )
        self.assertEqual(response_by_question_id['q_int'].selected_answer, '7')
        self.assertEqual(
            response_by_question_id['q_float'].selected_answer, '3.5'
        )
        self.assertEqual(
            json.loads(response_by_question_id['q_dict'].selected_answer),
            {
                'isNegative': 'False',
                'wholeNumber': '0',
                'numerator': '1',
                'denominator': '2',
            },
        )
        self.assertEqual(
            json.loads(response_by_question_id['q_list'].selected_answer),
            ['a', 'b'],
        )
        self.assertEqual(
            json.loads(
                response_by_question_id['q_nested_list'].selected_answer
            ),
            [['a'], ['b', 'c']],
        )
        self.assertEqual(
            response_by_question_id['q_no_answer'].selected_answer, ''
        )
        self.assertEqual(
            response_by_question_id['q_missing_flag'].selected_answer,
            'answer without flag',
        )

    def test_submit_certificate_assessment_attempt_rejects_missing_attempt(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Attempt does not exist.',
        ):
            certificate_assessment_services.submit_certificate_assessment_attempt(
                'missing_attempt_id',
                [],
            )

    def test_submit_certificate_assessment_attempt_raises_inside_transaction(
        self,
    ) -> None:
        valid_model = mock.Mock()
        valid_model.version_data = {
            'certificate_id': 'cert_1',
            'certificate_version': 1,
            'topic_versions': {'topic_1': 1},
            'question_versions': {},
            'question_topic_links': {},
        }
        valid_model.is_submitted = False
        submitted_model = mock.Mock()
        submitted_model.is_submitted = True

        missing_attempt_calls = {'count': 0}

        def _get_returns_missing(
            attempt_id: str, **unused_kwargs: bool
        ) -> mock.Mock:
            missing_attempt_calls['count'] += 1
            if missing_attempt_calls['count'] == 1:
                return valid_model
            raise gae_models.CertificateAssessmentAttemptModel.EntityNotFoundError(
                'Entity for class CertificateAssessmentAttemptModel with id '
                '%s not found' % attempt_id
            )

        with mock.patch.object(
            gae_models.CertificateAssessmentAttemptModel,
            'get',
            side_effect=_get_returns_missing,
        ), self.assertRaisesRegex(
            utils.ValidationError,
            'Attempt does not exist.',
        ):
            certificate_assessment_services.submit_certificate_assessment_attempt(
                'attempt_1',
                [],
            )

        already_submitted_calls = {'count': 0}

        def _get_returns_submitted(
            unused_attempt_id: str, **unused_kwargs: bool
        ) -> mock.Mock:
            already_submitted_calls['count'] += 1
            if already_submitted_calls['count'] == 1:
                return valid_model
            return submitted_model

        with mock.patch.object(
            gae_models.CertificateAssessmentAttemptModel,
            'get',
            side_effect=_get_returns_submitted,
        ), self.assertRaisesRegex(
            utils.ValidationError,
            'This assessment has already been submitted.',
        ):
            certificate_assessment_services.submit_certificate_assessment_attempt(
                'attempt_1',
                [],
            )

    def test_get_certificate_assessment_offerings_by_ids_returns_mapping(
        self,
    ) -> None:
        first_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Geography Essentials',
            description='Covers maps and spatial reasoning.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=6,
            time_limit_in_minutes=30,
            demonstrates=['Map reading'],
            async_status='Available',
        )
        second_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Biology Basics',
            description='Covers cells and ecosystems.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=6,
            time_limit_in_minutes=30,
            demonstrates=['Living systems'],
            async_status='Available',
        )

        offerings_by_id = certificate_assessment_services.get_certificate_assessment_offerings_by_ids(
            [
                first_offering.certificate_id,
                second_offering.certificate_id,
            ]
        )

        self.assertEqual(
            set(offerings_by_id.keys()),
            {first_offering.certificate_id, second_offering.certificate_id},
        )
        self.assertEqual(
            offerings_by_id[first_offering.certificate_id].title,
            'Geography Essentials',
        )
        self.assertEqual(
            offerings_by_id[second_offering.certificate_id].title,
            'Biology Basics',
        )

    def test_get_certificate_assessment_offerings_by_ids_omits_missing(
        self,
    ) -> None:
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Biology Basics',
            description='Covers cells and ecosystems.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=6,
            time_limit_in_minutes=30,
            demonstrates=['Living systems'],
            async_status='Available',
        )

        offerings_by_id = certificate_assessment_services.get_certificate_assessment_offerings_by_ids(
            [created_offering.certificate_id, 'non_existent_certificate']
        )

        self.assertEqual(
            offerings_by_id,
            {
                created_offering.certificate_id: offerings_by_id[
                    created_offering.certificate_id
                ]
            },
        )

    def _create_attempt(
        self,
        learner_id: str,
        certificate_id: str,
        total_score: float,
        attempt_index: int,
        started_at: datetime.datetime,
        finished_at: datetime.datetime | None,
        is_submitted: bool,
    ) -> None:
        """Creates a certificate assessment attempt model for testing."""
        gae_models.CertificateAssessmentAttemptModel.create(
            learner_id=learner_id,
            certificate_id=certificate_id,
            total_score=total_score,
            attempt_index=attempt_index,
            attempt_data={
                self.topic_id: {
                    'total_related_questions': 1,
                    'total_correct_questions': 1,
                }
            },
            version_data={
                'certificate_id': certificate_id,
                'certificate_version': 1,
                'topic_versions': {self.topic_id: 1},
                'question_versions': {'question_id_1': 1},
                'question_topic_links': {'question_id_1': [self.topic_id]},
            },
            started_at=started_at,
            finished_at=finished_at,
            is_submitted=is_submitted,
        )

    def test_get_certificate_offerings_for_classroom_filters_and_sorts(
        self,
    ) -> None:
        alpha_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='alpha',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )
        beta_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Beta',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )
        certificate_assessment_services.create_certificate_assessment_offering(
            title='Gamma',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Blocked',
        )
        certificate_assessment_services.create_certificate_assessment_offering(
            title='Delta',
            description='desc',
            classroom_id=self.other_classroom_id,
            topic_ids=[self.other_topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )

        offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            self.classroom_url_fragment, 'learner_id_1'
        )

        self.assertEqual(
            [offering['certificate_id'] for offering in offerings],
            [alpha_offering.certificate_id, beta_offering.certificate_id],
        )

    def test_get_certificate_offerings_for_classroom_attempt_statuses(
        self,
    ) -> None:
        passed_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Passed',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )
        not_passed_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Not Passed',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )
        _ = certificate_assessment_services.create_certificate_assessment_offering(
            title='Not Attempted',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )

        started_at = datetime.datetime(2026, 1, 2, 3, 4, 5)
        self._create_attempt(
            'learner_id_1',
            passed_offering.certificate_id,
            90.0,
            1,
            started_at,
            started_at + datetime.timedelta(minutes=5),
            True,
        )
        self._create_attempt(
            'learner_id_1',
            not_passed_offering.certificate_id,
            79.0,
            1,
            started_at,
            started_at + datetime.timedelta(minutes=5),
            True,
        )

        offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            self.classroom_url_fragment, 'learner_id_1'
        )
        status_by_title = {
            offering['title']: offering['attempt_status']
            for offering in offerings
        }
        self.assertEqual(status_by_title['Passed'], 'Passed')
        self.assertEqual(status_by_title['Not Passed'], 'Not Passed')
        self.assertEqual(status_by_title['Not Attempted'], 'Not Attempted')
        offering_by_title = {
            offering['title']: offering for offering in offerings
        }
        self.assertEqual(
            offering_by_title['Passed']['passed_on_date'],
            utils.get_time_in_millisecs(
                started_at + datetime.timedelta(minutes=5)
            ),
        )
        self.assertIsNone(offering_by_title['Passed']['failed_on_date'])
        self.assertEqual(
            offering_by_title['Not Passed']['failed_on_date'],
            utils.get_time_in_millisecs(
                started_at + datetime.timedelta(minutes=5)
            ),
        )
        self.assertIsNone(offering_by_title['Not Passed']['passed_on_date'])
        self.assertIsNone(offering_by_title['Not Attempted']['passed_on_date'])
        self.assertIsNone(offering_by_title['Not Attempted']['failed_on_date'])

    def test_get_certificate_offerings_for_classroom_uses_most_recent_attempt(
        self,
    ) -> None:
        offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='History',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )
        started_at = datetime.datetime(2026, 1, 2, 3, 4, 5)
        self._create_attempt(
            'learner_id_1',
            offering.certificate_id,
            70.0,
            1,
            started_at,
            started_at + datetime.timedelta(minutes=5),
            True,
        )
        self._create_attempt(
            'learner_id_1',
            offering.certificate_id,
            85.0,
            2,
            started_at + datetime.timedelta(minutes=10),
            started_at + datetime.timedelta(minutes=15),
            True,
        )

        offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            self.classroom_url_fragment, 'learner_id_1'
        )
        self.assertEqual(offerings[0]['attempt_status'], 'Passed')
        self.assertEqual(
            offerings[0]['passed_on_date'],
            utils.get_time_in_millisecs(
                started_at + datetime.timedelta(minutes=15)
            ),
        )

    def test_get_certificate_offerings_for_classroom_uses_later_finished_attempt(
        self,
    ) -> None:
        offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Geography',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )
        started_at = datetime.datetime(2026, 1, 2, 3, 4, 5)
        self._create_attempt(
            'learner_id_1',
            offering.certificate_id,
            70.0,
            1,
            started_at,
            started_at + datetime.timedelta(minutes=5),
            True,
        )
        self._create_attempt(
            'learner_id_1',
            offering.certificate_id,
            85.0,
            1,
            started_at + datetime.timedelta(minutes=10),
            started_at + datetime.timedelta(minutes=20),
            True,
        )

        offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            self.classroom_url_fragment, 'learner_id_1'
        )
        self.assertEqual(offerings[0]['attempt_status'], 'Passed')

    def test_get_certificate_offerings_for_classroom_empty_classroom(
        self,
    ) -> None:
        offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            'missing_classroom', 'learner_id_1'
        )
        self.assertEqual(offerings, [])

    def test_get_certificate_offerings_for_classroom_empty_offerings(
        self,
    ) -> None:
        offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            self.classroom_url_fragment, 'learner_id_1'
        )
        self.assertEqual(offerings, [])

    def test_get_certificate_offerings_for_classroom_uses_version_data_and_ignores_unrelated_attempts(
        self,
    ) -> None:
        offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Fallback',
            description='desc',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Skill'],
            async_status='Available',
        )
        started_at = datetime.datetime(2026, 1, 2, 3, 4, 5)

        def _new_attempt_model(
            certificate_id: str,
            total_score: float,
            attempt_index: int,
            finished_minutes: int,
        ) -> mock.Mock:
            attempt_model = mock.Mock()
            attempt_model.certificate_id = None
            attempt_model.version_data = {
                'certificate_id': certificate_id,
                'certificate_version': 1,
                'topic_versions': {self.topic_id: 1},
                'question_versions': {'question_id_1': 1},
                'question_topic_links': {'question_id_1': [self.topic_id]},
            }
            attempt_model.attempt_index = attempt_index
            attempt_model.finished_at = started_at + datetime.timedelta(
                minutes=finished_minutes
            )
            attempt_model.total_score = total_score
            return attempt_model

        latest_attempt = _new_attempt_model(
            offering.certificate_id, 90.0, 1, 20
        )
        unrelated_attempt = _new_attempt_model(
            'unrelated_certificate_id', 95.0, 1, 25
        )
        older_attempt = _new_attempt_model(offering.certificate_id, 70.0, 1, 5)
        higher_index_attempt = _new_attempt_model(
            offering.certificate_id, 80.0, 2, 30
        )
        later_finished_attempt = _new_attempt_model(
            offering.certificate_id, 85.0, 2, 40
        )

        with mock.patch.object(
            gae_models.CertificateAssessmentAttemptModel,
            'query',
            return_value=mock.Mock(
                fetch=mock.Mock(
                    return_value=[
                        latest_attempt,
                        unrelated_attempt,
                        older_attempt,
                        higher_index_attempt,
                        later_finished_attempt,
                    ]
                )
            ),
        ):
            offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
                self.classroom_url_fragment, 'learner_id_1'
            )

        self.assertEqual(len(offerings), 1)
        self.assertEqual(
            offerings[0]['certificate_id'], offering.certificate_id
        )
        self.assertEqual(offerings[0]['attempt_status'], 'Passed')
        self.assertEqual(
            offerings[0]['passed_on_date'],
            utils.get_time_in_millisecs(
                started_at + datetime.timedelta(minutes=40)
            ),
        )


class ValidateCertificateAssessmentOfferingTest(test_utils.GenericTestBase):
    """Tests for validate_certificate_assessment_offering."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def setUp(self) -> None:
        super().setUp()
        self.classroom_id = 'math_classroom_01'
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.owner_email = f'certificate.assessment.{self.topic_id}@example.com'
        self.owner_username = 'certificateassessment2'
        self.signup(self.owner_email, self.owner_username)
        owner_id = self.get_user_id_from_email(self.owner_email)
        self.save_new_topic(self.topic_id, owner_id)
        classroom = classroom_config_domain.Classroom(
            self.classroom_id,
            name='Math',
            url_fragment='math',
            feedback_recipient_email='user@email.com',
            course_details='Course details',
            teaser_text='Teaser text',
            topic_list_intro='Topic intro',
            topic_id_to_prerequisite_topic_ids={self.topic_id: []},
            is_published=True,
            diagnostic_test_is_enabled=False,
            thumbnail_data=classroom_config_domain.ImageData(
                'thumbnail.svg',
                'red',
                1,
            ),
            banner_data=classroom_config_domain.ImageData(
                'banner.svg',
                'blue',
                1,
            ),
            index=0,
        )
        classroom_config_services.create_new_classroom(classroom)

    def _run_validation_with_mocked_topics(
        self,
        topic_skill_to_question_ids: dict[str, dict[str, list[str]]],
        topic_ids: list[str],
        total_questions: int,
    ) -> (
        certificate_assessment_services.CertificateAssessmentOfferingValidationResultDict
    ):
        """Builds a mocked validation scenario from topic and skill mappings."""
        topic_objects: dict[str, mock.Mock] = {}
        skill_objects: dict[str, mock.Mock] = {}
        question_link_map: dict[str, list[mock.Mock]] = {}

        for (
            topic_id,
            skill_to_question_ids,
        ) in topic_skill_to_question_ids.items():
            topic = mock.Mock()
            topic.name = topic_id.replace('_', ' ').title()
            topic.get_all_skill_ids.return_value = list(skill_to_question_ids)
            topic_objects[topic_id] = topic
            for skill_id, question_ids in skill_to_question_ids.items():
                skill = mock.Mock()
                skill.id = skill_id
                skill.description = '%s description' % skill_id
                skill_objects[skill_id] = skill
                question_link_map[skill_id] = [
                    mock.Mock(question_id=question_id)
                    for question_id in question_ids
                ]

        def _get_topics(
            requested_topic_ids: list[str], strict: bool = False
        ) -> list[mock.Mock]:
            self.assertTrue(strict)
            return [topic_objects[topic_id] for topic_id in requested_topic_ids]

        def _get_skill_models(skill_ids: list[str]) -> list[mock.Mock | None]:
            return [
                skill_objects[skill_id] if skill_id in skill_objects else None
                for skill_id in skill_ids
            ]

        def _get_links(
            skill_id: str, skill_description: str
        ) -> list[mock.Mock]:
            self.assertEqual(
                skill_description, skill_objects[skill_id].description
            )
            return question_link_map[skill_id]

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            side_effect=_get_topics,
        ), mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            side_effect=_get_skill_models,
        ), mock.patch.object(
            skill_fetchers,
            'get_skill_from_model',
            side_effect=lambda skill_model: skill_model,
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            side_effect=_get_links,
        ):
            return certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=topic_ids,
                total_questions=total_questions,
            )

    def test_raises_for_empty_topic_ids(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError,
            'topic_ids must contain at least one topic.',
        ):
            certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=[],
                total_questions=3,
            )

    def test_raises_for_non_positive_total_questions(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError,
            'total_questions must be a positive integer.',
        ):
            certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=[self.topic_id],
                total_questions=0,
            )

    def test_raises_for_nonexistent_topic(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Topic missing_topic_id does not exist.',
        ):
            certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=['missing_topic_id'],
                total_questions=3,
            )

    def test_validation_handles_missing_topic_object(self) -> None:
        with mock.patch.object(
            certificate_assessment_services,
            '_get_topic_name_to_question_ids_map',
            return_value=({'topic_1': []}, [None]),
        ):
            result = certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=['topic_1'],
                total_questions=3,
            )

        self.assertFalse(result['is_valid'])
        self.assertIn(
            'Only 0 unique question(s) are available across the selected '
            'topics, but 3 are required without reusing questions.',
            result['validation_message'],
        )
        self.assertIn(
            'topic_1 does not have enough questions in every difficulty '
            'bucket.',
            result['validation_message'],
        )

    def test_get_topic_name_to_question_ids_map_raises_for_missing_topics(
        self,
    ) -> None:
        topic = mock.Mock()
        topic.name = 'Mock Topic'
        topic.get_all_skill_ids.return_value = ['skill_1']
        skill = mock.Mock()
        skill.description = 'Skill description'
        question_link = mock.Mock(question_id='question_1')

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            side_effect=Exception('topic lookup failed'),
        ), mock.patch.object(
            topic_fetchers,
            'get_topic_by_id',
            return_value=topic,
        ), mock.patch.object(
            skill_fetchers,
            'get_skill_by_id',
            return_value=skill,
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            return_value=[question_link],
        ):
            with self.assertRaisesRegex(
                utils.ValidationError,
                'One or more selected topics do not exist.',
            ):
                getattr(
                    certificate_assessment_services,
                    '_get_topic_name_to_question_ids_map',
                )(['topic_1'])

    def test_get_topic_name_to_question_ids_map_skips_missing_skill_models(
        self,
    ) -> None:
        topic = mock.Mock()
        topic.name = 'Mock Topic'
        topic.get_all_skill_ids.return_value = ['skill_1', 'skill_2']
        skill = mock.Mock()
        skill.description = 'Skill description'
        question_link = mock.Mock(question_id='question_1')

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ), mock.patch.object(
            topic_fetchers,
            'get_topic_by_id',
            side_effect=AssertionError('unused'),
        ), mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            return_value=[mock.Mock(), None],
        ), mock.patch.object(
            skill_fetchers,
            'get_skill_from_model',
            return_value=skill,
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            return_value=[question_link],
        ):
            result = getattr(
                certificate_assessment_services,
                '_get_topic_name_to_question_ids_map',
            )(['topic_1'])

        self.assertEqual(result[0], {'topic_1': ['question_1']})

    def test_format_list_formats_short_lists(self) -> None:
        format_list = getattr(certificate_assessment_services, '_format_list')
        self.assertEqual(format_list(['one']), 'one')
        self.assertEqual(format_list(['one', 'two']), 'one and two')
        self.assertEqual(
            format_list(['one', 'two', 'three']), 'one, two, and three'
        )

    def test_get_difficulty_label_maps_medium_difficulty(self) -> None:
        get_difficulty_label = getattr(
            certificate_assessment_services, '_get_difficulty_label'
        )

        self.assertEqual(get_difficulty_label(0.6), 'medium')
        self.assertIsNone(get_difficulty_label(0.5))

    def test_has_valid_distinct_assignment(self) -> None:
        has_valid_distinct_assignment = getattr(
            certificate_assessment_services, '_has_valid_distinct_assignment'
        )
        topic_id_to_question_ids_by_difficulty = {
            'topic_1': {'easy': {'q1'}, 'medium': {'q2'}, 'hard': {'q3'}},
            'topic_2': {'easy': {'q4'}, 'medium': {'q5'}, 'hard': {'q6'}},
        }
        required_questions_by_topic = {
            'topic_1': {'easy': 1, 'medium': 1, 'hard': 1},
            'topic_2': {'easy': 1, 'medium': 1, 'hard': 1},
        }
        self.assertTrue(
            has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                CERTIFICATE_DIFFICULTY_EASY,
            )
        )
        self.assertTrue(
            has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                CERTIFICATE_DIFFICULTY_MEDIUM,
            )
        )
        self.assertTrue(
            has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                CERTIFICATE_DIFFICULTY_HARD,
            )
        )

    def test_has_valid_distinct_assignment_rejects_insufficient_overlap(
        self,
    ) -> None:
        topic_id_to_question_ids_by_difficulty = {
            'topic_1': {
                CERTIFICATE_DIFFICULTY_EASY: {'q1'},
                CERTIFICATE_DIFFICULTY_MEDIUM: {'q2'},
                CERTIFICATE_DIFFICULTY_HARD: {'q3'},
            },
            'topic_2': {
                CERTIFICATE_DIFFICULTY_EASY: {'q1'},
                CERTIFICATE_DIFFICULTY_MEDIUM: {'q2'},
                CERTIFICATE_DIFFICULTY_HARD: {'q3'},
            },
        }
        required_questions_by_topic = {
            'topic_1': {
                CERTIFICATE_DIFFICULTY_EASY: 1,
                CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                CERTIFICATE_DIFFICULTY_HARD: 1,
            },
            'topic_2': {
                CERTIFICATE_DIFFICULTY_EASY: 1,
                CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                CERTIFICATE_DIFFICULTY_HARD: 1,
            },
        }

        has_valid_distinct_assignment = getattr(
            certificate_assessment_services, '_has_valid_distinct_assignment'
        )
        self.assertFalse(
            has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                CERTIFICATE_DIFFICULTY_EASY,
            )
        )

    def test_pick_questions_uses_validator_distribution(self) -> None:
        pick_questions = getattr(
            certificate_assessment_services, '_pick_questions'
        )

        topic_id_to_question_ids_by_difficulty = {
            'topic_1': {
                CERTIFICATE_DIFFICULTY_MEDIUM: ['q1', 'q2'],
                CERTIFICATE_DIFFICULTY_EASY: ['q3'],
                CERTIFICATE_DIFFICULTY_HARD: ['q4'],
            },
            'topic_2': {
                CERTIFICATE_DIFFICULTY_MEDIUM: ['q5'],
                CERTIFICATE_DIFFICULTY_EASY: ['q6', 'q7'],
                CERTIFICATE_DIFFICULTY_HARD: ['q8'],
            },
        }

        with mock.patch.object(
            certificate_assessment_services,
            '_get_topic_question_ids_by_difficulty',
            return_value=topic_id_to_question_ids_by_difficulty,
        ), mock.patch.object(
            secrets,
            'SystemRandom',
            return_value=mock.Mock(
                sample=mock.Mock(side_effect=lambda items, count: items[:count])
            ),
        ):
            selected_question_ids = pick_questions(['topic_1', 'topic_2'], 5)

        self.assertEqual(len(selected_question_ids), 5)

        # The topic share and the medium/easy/hard split follow the validator,
        # while the specific question chosen within a difficulty bucket is
        # sampled at random, so only the per-bucket counts are asserted.
        selected_by_topic_and_difficulty: dict[tuple[str, str], int] = {}
        for question_id, topic_id in selected_question_ids:
            difficulty = next(
                difficulty
                for difficulty, question_ids in (
                    topic_id_to_question_ids_by_difficulty[topic_id].items()
                )
                if question_id in question_ids
            )
            bucket = (topic_id, difficulty)
            selected_by_topic_and_difficulty[bucket] = (
                selected_by_topic_and_difficulty.get(bucket, 0) + 1
            )

        self.assertEqual(
            selected_by_topic_and_difficulty,
            {
                ('topic_1', CERTIFICATE_DIFFICULTY_MEDIUM): 1,
                ('topic_1', CERTIFICATE_DIFFICULTY_EASY): 1,
                ('topic_1', CERTIFICATE_DIFFICULTY_HARD): 1,
                ('topic_2', CERTIFICATE_DIFFICULTY_MEDIUM): 1,
                ('topic_2', CERTIFICATE_DIFFICULTY_EASY): 1,
            },
        )

    def test_pick_questions_raises_when_questions_are_insufficient(
        self,
    ) -> None:
        pick_questions = getattr(
            certificate_assessment_services, '_pick_questions'
        )
        topic_id_to_question_ids_by_difficulty = {
            'topic_1': {
                CERTIFICATE_DIFFICULTY_MEDIUM: [],
                CERTIFICATE_DIFFICULTY_EASY: ['q1'],
                CERTIFICATE_DIFFICULTY_HARD: ['q2'],
            },
        }

        with mock.patch.object(
            certificate_assessment_services,
            '_get_topic_question_ids_by_difficulty',
            return_value=topic_id_to_question_ids_by_difficulty,
        ):
            with self.assertRaisesRegex(Exception, '^$') as raises_context:
                pick_questions(['topic_1'], 3)
        self.assertIsInstance(
            raises_context.exception,
            certificate_assessment_services.CertificateAssessmentAttemptNotReadyException,
        )

    def test_get_required_questions_for_topic_share_matches_cycle(self) -> None:
        self.assertEqual(
            certificate_assessment_services.get_required_questions_for_topic_share(
                3
            ),
            {
                CERTIFICATE_DIFFICULTY_EASY: 1,
                CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                CERTIFICATE_DIFFICULTY_HARD: 1,
            },
        )
        self.assertEqual(
            certificate_assessment_services.get_required_questions_for_topic_share(
                4
            ),
            {
                CERTIFICATE_DIFFICULTY_EASY: 1,
                CERTIFICATE_DIFFICULTY_MEDIUM: 2,
                CERTIFICATE_DIFFICULTY_HARD: 1,
            },
        )

    def test_validation_distribution_sampling_cases(self) -> None:
        test_cases: list[ValidationSamplingTestCase] = [
            {
                'name': 'disjoint skills between two topics',
                'topic_skill_to_question_ids': {
                    'topic_1': {
                        's1': ['q1'],
                        's2': ['q2'],
                    },
                    'topic_2': {
                        's3': ['q3'],
                        's4': ['q4'],
                    },
                },
                'topic_ids': ['topic_1', 'topic_2'],
                'total_questions': 6,
                'expected_is_valid': False,
                'expected_message_substrings': [
                    'Topic 1 does not have enough questions in every '
                    'difficulty bucket.',
                    'Topic 2 does not have enough questions in every '
                    'difficulty bucket.',
                ],
                'expected_validation_errors': {
                    'topic_1': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                    'topic_2': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                },
            },
            {
                'name': 'some skills shared between topics',
                'topic_skill_to_question_ids': {
                    'topic_1': {
                        's1': ['q1', 'q2'],
                        's2': ['q3'],
                    },
                    'topic_2': {
                        's1': ['q1', 'q2'],
                        's3': ['q4'],
                    },
                },
                'topic_ids': ['topic_1', 'topic_2'],
                'total_questions': 6,
                'expected_is_valid': False,
                'expected_message_substrings': [
                    'Selected topics Topic 1 and Topic 2 do not have enough '
                    'distinct easy, medium, and hard questions to satisfy '
                    'the requested certificate without reusing questions '
                    'across topics.',
                    'Topic 1 does not have enough questions in every '
                    'difficulty bucket.',
                    'Topic 2 does not have enough questions in every '
                    'difficulty bucket.',
                ],
                'expected_validation_errors': {
                    'topic_1': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                    'topic_2': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                },
            },
            {
                'name': 'shared questions are rejected when total unique pool is too small',
                'topic_skill_to_question_ids': {
                    'topic_1': {
                        's1': ['q1', 'q2'],
                        's2': ['q3', 'q4'],
                    },
                    'topic_2': {
                        's1': ['q1', 'q2'],
                        's2': ['q3', 'q4'],
                    },
                },
                'topic_ids': ['topic_1', 'topic_2'],
                'total_questions': 8,
                'expected_is_valid': False,
                'expected_message_substrings': [
                    'Selected topics Topic 1 and Topic 2 do not have enough '
                    'distinct easy, medium, and hard questions to satisfy '
                    'the requested certificate without reusing questions '
                    'across topics.',
                    'Topic 1 does not have enough questions in every '
                    'difficulty bucket.',
                    'Topic 2 does not have enough questions in every '
                    'difficulty bucket.',
                ],
                'expected_validation_errors': {
                    'topic_1': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 2,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                    'topic_2': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 2,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                },
            },
            {
                'name': 'superset skills in first topic',
                'topic_skill_to_question_ids': {
                    'topic_1': {
                        's1': ['q1'],
                        's2': ['q2'],
                        's3': ['q3'],
                        's4': ['q4'],
                    },
                    'topic_2': {
                        's2': ['q2'],
                        's3': ['q3'],
                    },
                },
                'topic_ids': ['topic_1', 'topic_2'],
                'total_questions': 7,
                'expected_is_valid': False,
                'expected_message_substrings': [
                    'Topic 1 does not have enough questions in every '
                    'difficulty bucket.',
                    'Topic 2 does not have enough questions in every '
                    'difficulty bucket.',
                ],
                'expected_validation_errors': {
                    'topic_1': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 2,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                    'topic_2': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                },
            },
            {
                'name': 'too many questions for distinct pool',
                'topic_skill_to_question_ids': {
                    'topic_1': {
                        's1': ['q1', 'q2'],
                    },
                    'topic_2': {
                        's2': ['q3', 'q4'],
                    },
                },
                'topic_ids': ['topic_1', 'topic_2'],
                'total_questions': 5,
                'expected_is_valid': False,
                'expected_message_substrings': [
                    'Selected topics Topic 1 and Topic 2 do not have enough '
                    'distinct easy, medium, and hard questions to satisfy '
                    'the requested certificate without reusing questions '
                    'across topics.',
                ],
                'expected_validation_errors': {
                    'topic_1': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 1,
                    },
                    'topic_2': {
                        CERTIFICATE_DIFFICULTY_EASY: 1,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 0,
                    },
                },
            },
            {
                'name': 'too few questions',
                'topic_skill_to_question_ids': {
                    'topic_1': {
                        's1': ['q1'],
                        's2': ['q2'],
                    },
                },
                'topic_ids': ['topic_1'],
                'total_questions': 1,
                'expected_is_valid': False,
                'expected_message_substrings': [
                    'total_questions must be greater than or equal to 3 '
                    '(3 per topic: easy, medium, hard) for 1 topic(s).',
                ],
                'expected_validation_errors': {
                    'topic_1': {
                        CERTIFICATE_DIFFICULTY_EASY: 0,
                        CERTIFICATE_DIFFICULTY_MEDIUM: 1,
                        CERTIFICATE_DIFFICULTY_HARD: 0,
                    },
                },
            },
        ]

        for test_case in test_cases:
            with self.subTest(test_case=test_case['name']):
                result = self._run_validation_with_mocked_topics(
                    test_case['topic_skill_to_question_ids'],
                    test_case['topic_ids'],
                    test_case['total_questions'],
                )

                self.assertEqual(
                    result['is_valid'], test_case['expected_is_valid']
                )
                for substring in test_case['expected_message_substrings']:
                    self.assertIn(substring, result['validation_message'])
                for topic_id, expected_counts in test_case[
                    'expected_validation_errors'
                ].items():
                    for (
                        difficulty,
                        expected_required,
                    ) in expected_counts.items():
                        self.assertEqual(
                            result['validation_errors'][topic_id][difficulty][
                                'required'
                            ],
                            expected_required,
                        )

    def test_invalid_inputs_raise_validation_error(self) -> None:
        test_cases: list[InvalidInputTestCase] = [
            {
                'name': 'empty topic ids',
                'topic_ids': [],
                'total_questions': 3,
                'message': 'topic_ids must contain at least one topic.',
            },
            {
                'name': 'non-positive total questions',
                'topic_ids': [self.topic_id],
                'total_questions': 0,
                'message': 'total_questions must be a positive integer.',
            },
        ]

        for test_case in test_cases:
            with self.subTest(test_case=test_case['name']):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    test_case['message'],
                ):
                    certificate_assessment_services.validate_certificate_assessment_offering(
                        topic_ids=test_case['topic_ids'],
                        total_questions=test_case['total_questions'],
                    )

    def test_validation_uses_skill_questions_for_available_counts(self) -> None:
        topic = mock.Mock()
        topic.name = 'Mock Topic'
        topic.get_all_skill_ids.return_value = ['skill_1', 'skill_2']
        skill = mock.Mock()
        skill.description = 'Skill description'
        skill_model_1 = mock.Mock()
        skill_model_1.id = 'skill_1'
        skill_model_2 = mock.Mock()
        skill_model_2.id = 'skill_2'

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ) as get_topics_by_ids, mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            return_value=[skill_model_1, skill_model_2],
        ) as get_multi_mock, mock.patch.object(
            skill_fetchers,
            'get_skill_from_model',
            return_value=skill,
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            return_value=[mock.Mock(question_id='question_1')],
        ) as get_links:
            result = certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=['topic_1'],
                total_questions=3,
            )

        get_topics_by_ids.assert_called_once_with(['topic_1'], strict=True)
        self.assertEqual(get_multi_mock.call_count, 2)
        get_multi_mock.assert_any_call(['skill_1', 'skill_2'])
        self.assertEqual(get_links.call_count, 4)
        get_links.assert_any_call('skill_1', 'Skill description')
        self.assertFalse(result['is_valid'])
        self.assertIn(
            'Selected topics Mock Topic do not have enough distinct easy, '
            'medium, and hard questions to satisfy the requested '
            'certificate without reusing questions across topics.',
            result['validation_message'],
        )
        self.assertIn(
            'Mock Topic does not have enough questions in every difficulty '
            'bucket.',
            result['validation_message'],
        )

    def test_validation_skips_missing_skill_models(self) -> None:
        topic = mock.Mock()
        topic.name = 'Mock Topic'
        topic.get_all_skill_ids.return_value = ['skill_1', 'skill_2']
        skill = mock.Mock()
        skill.description = 'Skill description'

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ) as get_topics_by_ids, mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            return_value=[None, mock.Mock()],
        ) as get_multi_mock, mock.patch.object(
            skill_fetchers,
            'get_skill_from_model',
            return_value=skill,
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            return_value=[
                mock.Mock(question_id='question_1', skill_difficulty=0.6)
            ],
        ) as get_links:
            result = certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=['topic_1'],
                total_questions=3,
            )

        get_topics_by_ids.assert_called_once_with(['topic_1'], strict=True)
        self.assertEqual(get_multi_mock.call_count, 2)
        self.assertEqual(get_links.call_count, 2)
        self.assertFalse(result['is_valid'])
        self.assertEqual(
            result['validation_errors']['topic_1']['medium']['available'],
            1,
        )

    def test_validation_distributes_remainder_to_earlier_topics(self) -> None:
        topic_2 = topic_fetchers.get_new_topic_id()
        owner_id = self.get_user_id_from_email(self.owner_email)
        self.save_new_topic(
            topic_2,
            owner_id,
            name='topic-2',
            url_fragment='topic-two',
        )
        result = certificate_assessment_services.validate_certificate_assessment_offering(
            topic_ids=[self.topic_id, topic_2],
            total_questions=5,
        )

        self.assertFalse(result['is_valid'])
        self.assertEqual(
            result['validation_errors'][self.topic_id]['medium']['required'],
            1,
        )
        self.assertEqual(
            result['validation_errors'][self.topic_id]['easy']['required'],
            1,
        )
        self.assertEqual(
            result['validation_errors'][self.topic_id]['hard']['required'],
            1,
        )
        self.assertEqual(
            result['validation_errors'][topic_2]['medium']['required'],
            1,
        )
        self.assertEqual(
            result['validation_errors'][topic_2]['easy']['required'],
            1,
        )
        self.assertEqual(
            result['validation_errors'][topic_2]['hard']['required'],
            0,
        )

    def test_validation_rejects_overlapping_pools_without_enough_unique_questions(
        self,
    ) -> None:
        result = self._run_validation_with_mocked_topics(
            {
                'topic_1': {
                    's1': ['q1', 'q2'],
                    's2': ['q3', 'q4'],
                },
                'topic_2': {
                    's1': ['q1', 'q2'],
                    's2': ['q3', 'q4'],
                },
            },
            ['topic_1', 'topic_2'],
            8,
        )

        self.assertFalse(result['is_valid'])
        self.assertIn(
            'Selected topics Topic 1 and Topic 2 do not have enough '
            'distinct easy, medium, and hard questions to satisfy the '
            'requested certificate without reusing questions across topics.',
            result['validation_message'],
        )

    def test_validation_errors_contain_per_topic_difficulty_breakdown(
        self,
    ) -> None:
        result = certificate_assessment_services.validate_certificate_assessment_offering(
            topic_ids=[self.topic_id],
            total_questions=3,
        )
        topic_errors = result['validation_errors'][self.topic_id]
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_EASY]['required'], 1
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_MEDIUM]['required'], 1
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_HARD]['required'], 1
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_EASY]['available'], 0
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_MEDIUM]['available'], 0
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_HARD]['available'], 0
        )

    def test_validation_requires_each_difficulty_bucket(self) -> None:
        topic = mock.Mock()
        topic.name = 'Mock Topic'
        topic.get_all_skill_ids.return_value = ['skill_1']
        skill = mock.Mock()
        skill.description = 'Skill description'

        question_links = [
            mock.Mock(question_id='easy_1', skill_difficulty=0.3),
            mock.Mock(question_id='easy_2', skill_difficulty=0.3),
            mock.Mock(question_id='hard_1', skill_difficulty=0.9),
        ]

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ) as get_topics_by_ids, mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            return_value=[mock.Mock()],
        ), mock.patch.object(
            skill_fetchers,
            'get_skill_from_model',
            return_value=skill,
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            return_value=question_links,
        ):
            result = certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=[self.topic_id],
                total_questions=3,
            )

        get_topics_by_ids.assert_called_once_with([self.topic_id], strict=True)
        self.assertFalse(result['is_valid'])
        topic_errors = result['validation_errors'][self.topic_id]
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_EASY]['available'], 2
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_MEDIUM]['available'], 0
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_HARD]['available'], 1
        )

    def test_validation_counts_easy_linked_question_as_available(self) -> None:
        skill_id = 'skill_1'
        topic_id = topic_fetchers.get_new_topic_id()
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        owner_id = self.get_user_id_from_email(self.owner_email)

        self.save_new_skill(skill_id, owner_id, description='Skill 1')
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic 1', 'subtopic-one'
        )
        subtopic.skill_ids = [skill_id]
        self.save_new_topic(
            topic_id,
            owner_id,
            name='Place Values',
            abbreviated_name='place values',
            url_fragment='place-values',
            subtopics=[subtopic],
            next_subtopic_id=2,
        )

        self.save_new_question(
            question_id,
            owner_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [skill_id],
            content_id_generator.next_content_id_index,
        )
        question_services.create_new_question_skill_link(
            owner_id, question_id, skill_id, 0.3
        )

        result = certificate_assessment_services.validate_certificate_assessment_offering(
            topic_ids=[topic_id],
            total_questions=3,
        )

        topic_errors = result['validation_errors'][topic_id]
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_EASY]['available'], 1
        )
        self.assertEqual(
            topic_errors[CERTIFICATE_DIFFICULTY_EASY]['required'], 1
        )


class CertificateAssessmentAttemptServicesTest(test_utils.GenericTestBase):
    """Tests for certificate assessment attempt services."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.learner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def _create_attempt(
        self,
        learner_id: str,
        total_score: float,
        attempt_index: int,
    ) -> (
        certificate_assessment_offering_models.CertificateAssessmentAttemptModel
    ):
        """Creates and returns a certificate assessment attempt model.

        Args:
            learner_id: str. The ID of the learner making the attempt.
            total_score: float. The total score achieved in the attempt.
            attempt_index: int. The index of the attempt for the learner.

        Returns:
            CertificateAssessmentAttemptModel. The created attempt model.
        """
        return certificate_assessment_offering_models.CertificateAssessmentAttemptModel.create(
            learner_id=learner_id,
            certificate_id='cert_abc123',
            total_score=total_score,
            attempt_index=attempt_index,
            attempt_data={
                'topic_id_101': {
                    'total_related_questions': 5,
                    'total_correct_questions': 3,
                }
            },
            version_data={
                'certificate_id': 'cert_abc123',
                'certificate_version': 1,
                'topic_versions': {'topic_id_101': 2},
                'question_versions': {'question_id_1': 1},
                'question_topic_links': {'question_id_1': ['topic_id_101']},
            },
            started_at=datetime.datetime(2026, 7, 18),
            finished_at=None,
            is_submitted=True,
        )

    def test_get_certificate_attempt_returns_full_result_data(self) -> None:
        created_attempt = self._create_attempt(self.learner_id, 84.5, 1)

        attempt = certificate_assessment_services.get_certificate_attempt(
            created_attempt.id
        )

        self.assertEqual(attempt.attempt_id, created_attempt.id)
        self.assertEqual(attempt.learner_id, self.learner_id)
        self.assertEqual(attempt.total_score, 84.5)
        self.assertEqual(attempt.attempt_index, 1)
        self.assertEqual(
            attempt.attempt_data,
            {
                'topic_id_101': {
                    'total_related_questions': 5,
                    'total_correct_questions': 3,
                }
            },
        )
        self.assertEqual(attempt.version_data['certificate_id'], 'cert_abc123')
        self.assertEqual(attempt.started_at, datetime.datetime(2026, 7, 18))
        self.assertTrue(attempt.is_submitted)

    def test_get_certificate_attempt_raises_for_missing_attempt(self) -> None:
        with self.assertRaisesRegex(
            certificate_assessment_services.CertificateAssessmentAttemptNotFoundException,
            'Certificate assessment attempt missing_attempt_id does not exist.',
        ):
            certificate_assessment_services.get_certificate_attempt(
                'missing_attempt_id'
            )

    def test_get_certificate_attempts_returns_all_attempts_in_index_order(
        self,
    ) -> None:
        first_attempt = self._create_attempt(self.learner_id, 60.0, 1)
        second_attempt = self._create_attempt(self.learner_id, 84.5, 2)

        attempts = certificate_assessment_services.get_certificate_attempts(
            self.learner_id
        )

        self.assertEqual(len(attempts), 2)
        self.assertEqual(
            [attempt.attempt_id for attempt in attempts],
            [first_attempt.id, second_attempt.id],
        )
        self.assertEqual(
            [attempt.attempt_index for attempt in attempts], [1, 2]
        )

    def test_get_certificate_attempts_returns_empty_for_learner_without_attempts(
        self,
    ) -> None:
        attempts = certificate_assessment_services.get_certificate_attempts(
            self.learner_id
        )

        self.assertEqual(attempts, [])

    def test_get_certificate_attempts_only_returns_matching_learner(
        self,
    ) -> None:
        self._create_attempt(self.learner_id, 60.0, 1)
        self.signup('otheruser@example.com', 'otheruser')
        other_learner_id = self.get_user_id_from_email('otheruser@example.com')
        other_attempt = self._create_attempt(other_learner_id, 90.0, 1)

        attempts = certificate_assessment_services.get_certificate_attempts(
            other_learner_id
        )

        self.assertEqual(len(attempts), 1)
        self.assertEqual(attempts[0].attempt_id, other_attempt.id)
