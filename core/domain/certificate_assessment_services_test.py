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
from core.tests import test_utils

from typing import TypedDict


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
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_topic(self.topic_id, owner_id)
        classroom = classroom_config_domain.Classroom(
            self.classroom_id,
            name='Math',
            url_fragment='math',
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


class ValidateCertificateAssessmentOfferingTest(test_utils.GenericTestBase):
    """Tests for validate_certificate_assessment_offering."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def setUp(self) -> None:
        super().setUp()
        self.classroom_id = 'math_classroom_01'
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_topic(self.topic_id, owner_id)
        classroom = classroom_config_domain.Classroom(
            self.classroom_id,
            name='Math',
            url_fragment='math',
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

        def _get_topic(topic_id: str, strict: bool = True) -> mock.Mock:
            del strict
            return topic_objects[topic_id]

        def _get_skill(skill_id: str, strict: bool = False) -> mock.Mock | None:
            del strict
            return skill_objects.get(skill_id)

        def _get_links(
            skill_id: str, skill_description: str
        ) -> list[mock.Mock]:
            self.assertEqual(
                skill_description, skill_objects[skill_id].description
            )
            return question_link_map[skill_id]

        with mock.patch.object(
            topic_fetchers,
            'get_topic_by_id',
            side_effect=_get_topic,
        ), mock.patch.object(
            skill_fetchers,
            'get_skill_by_id',
            side_effect=_get_skill,
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

    def test_format_list_formats_short_lists(self) -> None:
        self.assertEqual(
            certificate_assessment_services._format_list(['one']),
            'one',
        )
        self.assertEqual(
            certificate_assessment_services._format_list(['one', 'two']),
            'one and two',
        )
        self.assertEqual(
            certificate_assessment_services._format_list(
                ['one', 'two', 'three']
            ),
            'one, two, and three',
        )

    def test_has_valid_distinct_assignment(self) -> None:
        topic_id_to_question_ids_by_difficulty = {
            'topic_1': {'easy': {'q1'}, 'medium': {'q2'}, 'hard': {'q3'}},
            'topic_2': {'easy': {'q4'}, 'medium': {'q5'}, 'hard': {'q6'}},
        }
        required_questions_by_topic = {
            'topic_1': {'easy': 1, 'medium': 1, 'hard': 1},
            'topic_2': {'easy': 1, 'medium': 1, 'hard': 1},
        }

        self.assertTrue(
            certificate_assessment_services._has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                'easy',
            )
        )
        self.assertTrue(
            certificate_assessment_services._has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                'medium',
            )
        )
        self.assertTrue(
            certificate_assessment_services._has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                'hard',
            )
        )

    def test_has_valid_distinct_assignment_rejects_insufficient_overlap(
        self,
    ) -> None:
        topic_id_to_question_ids_by_difficulty = {
            'topic_1': {'easy': {'q1'}, 'medium': {'q2'}, 'hard': {'q3'}},
            'topic_2': {'easy': {'q1'}, 'medium': {'q2'}, 'hard': {'q3'}},
        }
        required_questions_by_topic = {
            'topic_1': {'easy': 1, 'medium': 1, 'hard': 1},
            'topic_2': {'easy': 1, 'medium': 1, 'hard': 1},
        }

        self.assertFalse(
            certificate_assessment_services._has_valid_distinct_assignment(
                topic_id_to_question_ids_by_difficulty,
                ['topic_1', 'topic_2'],
                required_questions_by_topic,
                'easy',
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
                    'topic_1': {'easy': 1, 'medium': 1, 'hard': 1},
                    'topic_2': {'easy': 1, 'medium': 1, 'hard': 1},
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
                    'topic_1': {'easy': 1, 'medium': 1, 'hard': 1},
                    'topic_2': {'easy': 1, 'medium': 1, 'hard': 1},
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
                    'topic_1': {'easy': 1, 'medium': 2, 'hard': 1},
                    'topic_2': {'easy': 1, 'medium': 2, 'hard': 1},
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
                    'topic_1': {'easy': 1, 'medium': 2, 'hard': 1},
                    'topic_2': {'easy': 1, 'medium': 1, 'hard': 1},
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
                    'topic_1': {'easy': 1, 'medium': 1, 'hard': 1},
                    'topic_2': {'easy': 1, 'medium': 1, 'hard': 0},
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
                    'topic_1': {'easy': 0, 'medium': 1, 'hard': 0},
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
            'get_topic_by_id',
            return_value=topic,
        ) as get_topic_by_id, mock.patch.object(
            skill_fetchers,
            'get_skill_by_id',
            side_effect=lambda skill_id, strict=False: (
                skill if skill_id == 'skill_1' else None
            ),
        ), mock.patch.object(
            question_services,
            'get_question_skill_links_of_skill',
            return_value=[mock.Mock(question_id='question_1')],
        ) as get_links:
            result = certificate_assessment_services.validate_certificate_assessment_offering(
                topic_ids=['topic_1'],
                total_questions=3,
            )

        get_topic_by_id.assert_any_call('topic_1', strict=True)
        self.assertEqual(get_links.call_count, 2)
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

    def test_validation_distributes_remainder_to_earlier_topics(self) -> None:
        topic_2 = topic_fetchers.get_new_topic_id()
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
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
        self.assertEqual(topic_errors['easy']['required'], 1)
        self.assertEqual(topic_errors['medium']['required'], 1)
        self.assertEqual(topic_errors['hard']['required'], 1)
        self.assertEqual(topic_errors['easy']['available'], 0)
        self.assertEqual(topic_errors['medium']['available'], 0)
        self.assertEqual(topic_errors['hard']['available'], 0)

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
            'get_topic_by_id',
            side_effect=[topic, topic],
        ), mock.patch.object(
            skill_fetchers,
            'get_skill_by_id',
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

        self.assertFalse(result['is_valid'])
        topic_errors = result['validation_errors'][self.topic_id]
        self.assertEqual(topic_errors['easy']['available'], 2)
        self.assertEqual(topic_errors['medium']['available'], 0)
        self.assertEqual(topic_errors['hard']['available'], 1)

    def test_validation_counts_easy_linked_question_as_available(self) -> None:
        skill_id = 'skill_1'
        topic_id = topic_fetchers.get_new_topic_id()
        question_id = question_services.get_new_question_id()
        content_id_generator = translation_domain.ContentIdGenerator()
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

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
        self.assertEqual(topic_errors['easy']['available'], 1)
        self.assertEqual(topic_errors['easy']['required'], 1)
