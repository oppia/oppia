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
from unittest import mock

from core import utils
from core.domain import (
    certificate_assessment_services,
    classroom_config_domain,
    classroom_config_services,
    question_services,
    skill_fetchers,
    topic_domain,
    topic_fetchers,
    translation_domain,
)
from core.platform import models
from core.storage.certificate_assessment import gae_models
from core.tests import test_utils

from typing import TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.Names.SKILL])

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

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ) as get_topics_by_ids, mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            return_value=[mock.Mock(), mock.Mock()],
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

    def test_validation_returns_valid_when_questions_satisfy_all_buckets(
        self,
    ) -> None:
        topic = mock.Mock()
        topic.name = 'Mock Topic'
        topic.get_all_skill_ids.return_value = [
            'skill_easy',
            'skill_medium',
            'skill_hard',
        ]
        skill = mock.Mock()
        skill.description = 'Skill description'

        question_links = [
            mock.Mock(question_id='easy_1', skill_difficulty=0.3),
            mock.Mock(question_id='medium_1', skill_difficulty=0.6),
            mock.Mock(question_id='hard_1', skill_difficulty=0.9),
        ]

        with mock.patch.object(
            topic_fetchers,
            'get_topics_by_ids',
            return_value=[topic],
        ), mock.patch.object(
            skill_models.SkillModel,
            'get_multi',
            return_value=[mock.Mock(), mock.Mock(), mock.Mock()],
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

        self.assertTrue(result['is_valid'])
        self.assertEqual(
            result['validation_message'], 'Certificate assessment is valid.'
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
            'topic_1 does not have enough questions in every difficulty '
            'bucket.',
            result['validation_message'],
        )
