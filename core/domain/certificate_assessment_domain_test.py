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

"""Tests for certificate assessment domain objects."""

from __future__ import annotations

import datetime

from core.domain import certificate_assessment_domain
from core.tests import test_utils

from typing import Dict


class CertificateAssessmentOfferingTest(test_utils.GenericTestBase):
    """Tests for the CertificateAssessmentOffering domain object."""

    def _get_sample_offering(
        self,
    ) -> certificate_assessment_domain.CertificateAssessmentOffering:
        """Returns a fully populated CertificateAssessmentOffering
        for use in tests.
        """
        return certificate_assessment_domain.CertificateAssessmentOffering(
            certificate_id='cert_abc123',
            title='Everyday Arithmetic & Number Confidence',
            description='Covers place values, addition and subtraction.',
            classroom_id='math_classroom_01',
            topic_ids=['topic_place_values', 'topic_addition'],
            total_questions=12,
            time_limit_in_minutes=60,
            demonstrates=['Understanding of whole numbers'],
            async_status='Available',
            version=1,
        )

    def _get_sample_offering_dict(
        self,
    ) -> certificate_assessment_domain.CertificateAssessmentOfferingDict:
        """Returns a dict matching the sample offering above."""
        return {
            'certificate_id': 'cert_abc123',
            'title': 'Everyday Arithmetic & Number Confidence',
            'description': 'Covers place values, addition and subtraction.',
            'classroom_id': 'math_classroom_01',
            'topic_ids': ['topic_place_values', 'topic_addition'],
            'total_questions': 12,
            'time_limit_in_minutes': 60,
            'demonstrates': ['Understanding of whole numbers'],
            'async_status': 'Available',
            'version': 1,
        }

    def test_init_sets_all_attributes_correctly(self) -> None:
        offering = self._get_sample_offering()

        self.assertEqual(offering.certificate_id, 'cert_abc123')
        self.assertEqual(
            offering.title, 'Everyday Arithmetic & Number Confidence'
        )
        self.assertEqual(offering.classroom_id, 'math_classroom_01')
        self.assertEqual(
            offering.topic_ids,
            ['topic_place_values', 'topic_addition'],
        )
        self.assertEqual(offering.total_questions, 12)
        self.assertEqual(offering.time_limit_in_minutes, 60)
        self.assertEqual(
            offering.demonstrates, ['Understanding of whole numbers']
        )
        self.assertEqual(offering.async_status, 'Available')
        self.assertEqual(offering.version, 1)

    def test_validate_succeeds_for_valid_offering(self) -> None:
        offering = self._get_sample_offering()
        offering.validate()

    def test_validate_rejects_empty_title(self) -> None:
        offering = self._get_sample_offering()
        offering.title = '   '

        with self.assertRaisesRegex(Exception, 'title must be a non-empty'):
            offering.validate()

    def test_validate_rejects_empty_certificate_id(self) -> None:
        offering = self._get_sample_offering()
        offering.certificate_id = ''

        with self.assertRaisesRegex(
            Exception, 'certificate_id must be a non-empty string'
        ):
            offering.validate()

    def test_validate_rejects_long_title(self) -> None:
        offering = self._get_sample_offering()
        offering.title = 'a' * 81

        with self.assertRaisesRegex(Exception, 'title must be at most 80'):
            offering.validate()

    def test_validate_rejects_empty_description(self) -> None:
        offering = self._get_sample_offering()
        offering.description = '   '

        with self.assertRaisesRegex(
            Exception, 'description must be a non-empty string'
        ):
            offering.validate()

    def test_validate_rejects_long_description(self) -> None:
        offering = self._get_sample_offering()
        offering.description = 'a' * 501

        with self.assertRaisesRegex(
            Exception, 'description must be at most 500'
        ):
            offering.validate()

    def test_validate_rejects_empty_classroom_id(self) -> None:
        offering = self._get_sample_offering()
        offering.classroom_id = ''

        with self.assertRaisesRegex(
            Exception, 'classroom_id must be a non-empty string'
        ):
            offering.validate()

    def test_validate_rejects_empty_topic_ids(self) -> None:
        offering = self._get_sample_offering()
        offering.topic_ids = []

        with self.assertRaisesRegex(
            Exception, 'topic_ids must contain at least one topic'
        ):
            offering.validate()

    def test_validate_rejects_non_string_topic_ids(self) -> None:
        offering = self._get_sample_offering()
        offering.topic_ids = ['topic_place_values', '']

        with self.assertRaisesRegex(
            Exception, 'topic_ids must contain only non-empty strings'
        ):
            offering.validate()

    def test_validate_rejects_invalid_total_questions(self) -> None:
        offering = self._get_sample_offering()
        offering.total_questions = 2

        with self.assertRaisesRegex(
            Exception, 'total_questions must be greater than or equal to 3'
        ):
            offering.validate()

    def test_validate_rejects_non_integer_total_questions(self) -> None:
        offering = self._get_sample_offering()
        setattr(offering, 'total_questions', '12')

        with self.assertRaisesRegex(
            Exception, 'total_questions must be a positive integer'
        ):
            offering.validate()

    def test_validate_rejects_too_many_questions(self) -> None:
        offering = self._get_sample_offering()
        offering.total_questions = 51

        with self.assertRaisesRegex(
            Exception, 'total_questions must be at most 50'
        ):
            offering.validate()

    def test_validate_rejects_invalid_time_limit(self) -> None:
        offering = self._get_sample_offering()
        offering.time_limit_in_minutes = 4

        with self.assertRaisesRegex(
            Exception,
            'time_limit_in_minutes must be greater than or equal to 5',
        ):
            offering.validate()

    def test_validate_rejects_non_integer_time_limit(self) -> None:
        offering = self._get_sample_offering()
        setattr(offering, 'time_limit_in_minutes', '60')

        with self.assertRaisesRegex(
            Exception, 'time_limit_in_minutes must be a positive integer'
        ):
            offering.validate()

    def test_validate_rejects_too_long_time_limit(self) -> None:
        offering = self._get_sample_offering()
        offering.time_limit_in_minutes = 61

        with self.assertRaisesRegex(
            Exception, 'time_limit_in_minutes must be at most 60'
        ):
            offering.validate()

    def test_validate_rejects_non_list_demonstrates(self) -> None:
        offering = self._get_sample_offering()
        setattr(
            offering,
            'demonstrates',
            'Understanding of whole numbers',
        )

        with self.assertRaisesRegex(
            Exception, 'demonstrates must be a list of strings'
        ):
            offering.validate()

    def test_validate_rejects_empty_demonstrates(self) -> None:
        offering = self._get_sample_offering()
        offering.demonstrates = []

        with self.assertRaisesRegex(
            Exception, 'demonstrates must contain at least one item'
        ):
            offering.validate()

    def test_validate_rejects_invalid_demonstrates_item(self) -> None:
        offering = self._get_sample_offering()
        offering.demonstrates = ['Understanding of whole numbers', '']

        with self.assertRaisesRegex(
            Exception, 'demonstrates must contain only non-empty strings'
        ):
            offering.validate()

    def test_validate_rejects_invalid_async_status(self) -> None:
        offering = self._get_sample_offering()
        offering.async_status = 'Draft'

        with self.assertRaisesRegex(Exception, 'async_status must be one of'):
            offering.validate()

    def test_validate_rejects_invalid_version(self) -> None:
        offering = self._get_sample_offering()
        offering.version = 0

        with self.assertRaisesRegex(
            Exception, 'version must be a positive integer'
        ):
            offering.validate()

    def test_to_dict_matches_expected_dict(self) -> None:
        self.assertEqual(
            self._get_sample_offering().to_dict(),
            self._get_sample_offering_dict(),
        )

    def test_from_dict_then_to_dict_matches_original_dict(self) -> None:
        original_dict = self._get_sample_offering_dict()
        self.assertEqual(
            certificate_assessment_domain.CertificateAssessmentOffering.from_dict(
                original_dict
            ).to_dict(),
            original_dict,
        )


class CertificateAssessmentAttemptTest(test_utils.GenericTestBase):
    """Tests for the CertificateAssessmentAttempt domain object."""

    SAMPLE_STARTED_AT = datetime.datetime(2026, 1, 1, 10, 0, 0)
    SAMPLE_FINISHED_AT = datetime.datetime(2026, 1, 1, 10, 20, 0)

    def _get_sample_attempt_data(
        self,
    ) -> Dict[
        str,
        certificate_assessment_domain.CertificateAssessmentAttemptTopicStatsDict,
    ]:
        """Returns sample attempt_data for use in tests."""
        return {
            'topic_place_values': {
                'total_related_questions': 6,
                'total_correct_questions': 5,
            },
            'topic_addition': {
                'total_related_questions': 6,
                'total_correct_questions': 4,
            },
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
            'topic_versions': {
                'topic_place_values': 2,
                'topic_addition': 3,
            },
            'question_versions': {
                'question_id_1': 1,
                'question_id_2': 1,
            },
            'question_topic_links': {
                'question_id_1': ['topic_place_values'],
                'question_id_2': ['topic_addition'],
            },
        }

    def _get_sample_attempt(
        self,
    ) -> certificate_assessment_domain.CertificateAssessmentAttempt:
        """Returns a fully populated CertificateAssessmentAttempt for
        use in tests.
        """
        return certificate_assessment_domain.CertificateAssessmentAttempt(
            attempt_id='attempt_abc123',
            learner_id='learner_id_1',
            total_score=75.0,
            attempt_index=1,
            attempt_data=self._get_sample_attempt_data(),
            version_data=self._get_sample_version_data(),
            started_at=self.SAMPLE_STARTED_AT,
            finished_at=self.SAMPLE_FINISHED_AT,
            is_submitted=True,
        )

    def _get_sample_attempt_dict(
        self,
    ) -> certificate_assessment_domain.CertificateAssessmentAttemptDict:
        """Returns a dict matching the sample attempt above."""
        return {
            'attempt_id': 'attempt_abc123',
            'learner_id': 'learner_id_1',
            'total_score': 75.0,
            'attempt_index': 1,
            'attempt_data': self._get_sample_attempt_data(),
            'version_data': self._get_sample_version_data(),
            'started_at': self.SAMPLE_STARTED_AT,
            'finished_at': self.SAMPLE_FINISHED_AT,
            'is_submitted': True,
        }

    def test_init_sets_all_attributes_correctly(self) -> None:
        attempt = self._get_sample_attempt()
        self.assertEqual(attempt.attempt_id, 'attempt_abc123')
        self.assertEqual(attempt.learner_id, 'learner_id_1')
        self.assertEqual(attempt.total_score, 75.0)
        self.assertEqual(attempt.attempt_index, 1)
        self.assertEqual(attempt.attempt_data, self._get_sample_attempt_data())
        self.assertEqual(attempt.version_data, self._get_sample_version_data())
        self.assertEqual(attempt.started_at, self.SAMPLE_STARTED_AT)
        self.assertEqual(attempt.finished_at, self.SAMPLE_FINISHED_AT)
        self.assertTrue(attempt.is_submitted)

    def test_validate_succeeds_for_valid_attempt(self) -> None:
        self._get_sample_attempt().validate()

    def test_get_time_taken_in_minutes_returns_elapsed_time(self) -> None:
        attempt = self._get_sample_attempt()

        self.assertEqual(attempt.get_time_taken_in_minutes(), 20)

    def test_get_time_taken_in_minutes_returns_none_for_unfinished_attempt(
        self,
    ) -> None:
        attempt = self._get_sample_attempt()
        attempt.finished_at = None

        self.assertIsNone(attempt.get_time_taken_in_minutes())

    def test_validate_succeeds_when_finished_at_is_none(self) -> None:
        attempt = self._get_sample_attempt()
        attempt.finished_at = None
        attempt.is_submitted = False
        attempt.validate()

    def test_validate_accepts_placeholder_values_for_unsubmitted_attempt(
        self,
    ) -> None:
        attempt = certificate_assessment_domain.CertificateAssessmentAttempt(
            attempt_id='attempt_abc123',
            learner_id='learner_id_1',
            total_score=0.0,
            attempt_index=0,
            attempt_data={},
            version_data=self._get_sample_version_data(),
            started_at=self.SAMPLE_STARTED_AT,
            finished_at=None,
            is_submitted=False,
        )
        attempt.validate()

    def test_validate_rejects_non_dict_attempt_data(self) -> None:
        attempt = self._get_sample_attempt()
        # Here we use MyPy ignore because this test intentionally assigns an
        # invalid value to exercise the validation branch.
        attempt.attempt_data = None  # type: ignore[assignment]

        with self.assertRaisesRegex(Exception, 'attempt_data must be a dict.'):
            attempt.validate()

    def test_validate_rejects_empty_attempt_id(self) -> None:
        attempt = self._get_sample_attempt()
        attempt.attempt_id = ''
        with self.assertRaisesRegex(
            Exception, 'attempt_id must be a non-empty string'
        ):
            attempt.validate()

    def test_validate_rejects_empty_learner_id(self) -> None:
        attempt = self._get_sample_attempt()
        attempt.learner_id = ''
        with self.assertRaisesRegex(
            Exception, 'learner_id must be a non-empty string'
        ):
            attempt.validate()

    def test_validate_rejects_negative_total_score(self) -> None:
        attempt = self._get_sample_attempt()
        attempt.total_score = -1
        with self.assertRaisesRegex(
            Exception, 'total_score must be a non-negative number'
        ):
            attempt.validate()

    def test_validate_rejects_non_numeric_total_score(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(attempt, 'total_score', '75')
        with self.assertRaisesRegex(
            Exception, 'total_score must be a non-negative number'
        ):
            attempt.validate()

    def test_validate_rejects_invalid_attempt_index(self) -> None:
        attempt = self._get_sample_attempt()
        attempt.attempt_index = 0
        with self.assertRaisesRegex(
            Exception, 'attempt_index must be a positive integer'
        ):
            attempt.validate()

    def test_validate_rejects_empty_attempt_data(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(attempt, 'attempt_data', {})
        with self.assertRaisesRegex(
            Exception,
            'attempt_data must contain stats for at least one topic',
        ):
            attempt.validate()

    def test_validate_rejects_attempt_data_with_missing_keys(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(
            attempt,
            'attempt_data',
            {'topic_place_values': {'total_related_questions': 6}},
        )
        with self.assertRaisesRegex(
            Exception,
            (
                'attempt_data values must contain exactly '
                '\'total_related_questions\' and '
                '\'total_correct_questions\''
            ),
        ):
            attempt.validate()

    def test_validate_rejects_attempt_data_with_extra_keys(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(
            attempt,
            'attempt_data',
            {
                'topic_place_values': {
                    'total_related_questions': 6,
                    'total_correct_questions': 5,
                    'extra_key': 1,
                }
            },
        )
        with self.assertRaisesRegex(
            Exception,
            (
                'attempt_data values must contain exactly '
                '\'total_related_questions\' and '
                '\'total_correct_questions\''
            ),
        ):
            attempt.validate()

    def test_validate_rejects_empty_topic_id_in_attempt_data(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(
            attempt,
            'attempt_data',
            {
                '': {
                    'total_related_questions': 6,
                    'total_correct_questions': 5,
                }
            },
        )
        with self.assertRaisesRegex(
            Exception, 'attempt_data must use non-empty strings as topic ids'
        ):
            attempt.validate()

    def test_validate_rejects_non_string_topic_id_in_attempt_data(
        self,
    ) -> None:
        attempt = self._get_sample_attempt()
        setattr(
            attempt,
            'attempt_data',
            {
                1: {
                    'total_related_questions': 6,
                    'total_correct_questions': 5,
                }
            },
        )
        with self.assertRaisesRegex(
            Exception, 'attempt_data must use non-empty strings as topic ids'
        ):
            attempt.validate()

    def test_validate_rejects_negative_total_related_questions(self) -> None:
        attempt = self._get_sample_attempt()
        attempt.attempt_data = {
            'topic_place_values': {
                'total_related_questions': -1,
                'total_correct_questions': 0,
            }
        }
        with self.assertRaisesRegex(
            Exception,
            'total_related_questions must be a non-negative integer',
        ):
            attempt.validate()

    def test_validate_rejects_negative_total_correct_questions(self) -> None:
        attempt = self._get_sample_attempt()
        attempt.attempt_data = {
            'topic_place_values': {
                'total_related_questions': 6,
                'total_correct_questions': -1,
            }
        }
        with self.assertRaisesRegex(
            Exception,
            'total_correct_questions must be a non-negative integer',
        ):
            attempt.validate()

    def test_validate_rejects_correct_questions_exceeding_related(
        self,
    ) -> None:
        attempt = self._get_sample_attempt()
        attempt.attempt_data = {
            'topic_place_values': {
                'total_related_questions': 4,
                'total_correct_questions': 5,
            }
        }
        with self.assertRaisesRegex(
            Exception,
            (
                'total_correct_questions cannot exceed '
                'total_related_questions'
            ),
        ):
            attempt.validate()

    def test_validate_rejects_version_data_missing_keys(self) -> None:
        attempt = self._get_sample_attempt()
        version_data = self._get_sample_version_data()
        setattr(
            attempt,
            'version_data',
            {
                'certificate_id': version_data['certificate_id'],
                'certificate_version': version_data['certificate_version'],
                'topic_versions': version_data['topic_versions'],
                'question_topic_links': version_data['question_topic_links'],
            },
        )
        with self.assertRaisesRegex(
            Exception, 'version_data is missing required keys'
        ):
            attempt.validate()

    def test_validate_rejects_non_dict_version_data(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(attempt, 'version_data', [])
        with self.assertRaisesRegex(Exception, 'version_data must be a dict'):
            attempt.validate()

    def test_validate_rejects_empty_certificate_id_in_version_data(
        self,
    ) -> None:
        attempt = self._get_sample_attempt()
        version_data = self._get_sample_version_data()
        version_data['certificate_id'] = ''
        setattr(attempt, 'version_data', version_data)
        with self.assertRaisesRegex(
            Exception,
            'version_data.certificate_id must be a non-empty string',
        ):
            attempt.validate()

    def test_validate_rejects_invalid_certificate_version(self) -> None:
        attempt = self._get_sample_attempt()
        version_data = self._get_sample_version_data()
        version_data['certificate_version'] = 0
        setattr(attempt, 'version_data', version_data)
        with self.assertRaisesRegex(
            Exception,
            'version_data.certificate_version must be a positive integer',
        ):
            attempt.validate()

    def test_validate_rejects_non_dict_topic_versions(self) -> None:
        attempt = self._get_sample_attempt()
        version_data = self._get_sample_version_data()
        # Here we use MyPy ignore because this negative test intentionally
        # assigns an invalid value to exercise the validator branch.
        version_data['topic_versions'] = ['not', 'a', 'dict']  # type: ignore[typeddict-item]
        setattr(attempt, 'version_data', version_data)
        with self.assertRaisesRegex(
            Exception, 'version_data.topic_versions must be a dict'
        ):
            attempt.validate()

    def test_validate_rejects_non_dict_question_versions(self) -> None:
        attempt = self._get_sample_attempt()
        version_data = self._get_sample_version_data()
        # Here we use MyPy ignore because this negative test intentionally
        # assigns an invalid value to exercise the validator branch.
        version_data['question_versions'] = ['not', 'a', 'dict']  # type: ignore[typeddict-item]
        setattr(attempt, 'version_data', version_data)
        with self.assertRaisesRegex(
            Exception, 'version_data.question_versions must be a dict'
        ):
            attempt.validate()

    def test_validate_rejects_non_dict_question_topic_links(self) -> None:
        attempt = self._get_sample_attempt()
        version_data = self._get_sample_version_data()
        # Here we use MyPy ignore because this negative test intentionally
        # assigns an invalid value to exercise the validator branch.
        version_data['question_topic_links'] = ['not', 'a', 'dict']  # type: ignore[typeddict-item]
        setattr(attempt, 'version_data', version_data)
        with self.assertRaisesRegex(
            Exception, 'version_data.question_topic_links must be a dict'
        ):
            attempt.validate()

    def test_validate_rejects_invalid_started_at(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(attempt, 'started_at', '2026-01-01')
        with self.assertRaisesRegex(
            Exception, 'started_at must be a datetime.datetime instance'
        ):
            attempt.validate()

    def test_validate_rejects_invalid_finished_at(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(attempt, 'finished_at', '2026-01-01')
        with self.assertRaisesRegex(
            Exception,
            'finished_at must be a datetime.datetime instance or None',
        ):
            attempt.validate()

    def test_validate_rejects_finished_at_before_started_at(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(
            attempt,
            'finished_at',
            self.SAMPLE_STARTED_AT - datetime.timedelta(minutes=5),
        )
        with self.assertRaisesRegex(
            Exception, 'finished_at cannot be earlier than started_at'
        ):
            attempt.validate()

    def test_validate_rejects_non_boolean_is_submitted(self) -> None:
        attempt = self._get_sample_attempt()
        setattr(attempt, 'is_submitted', 'yes')
        with self.assertRaisesRegex(
            Exception, 'is_submitted must be a boolean'
        ):
            attempt.validate()

    def test_to_dict_matches_expected_dict(self) -> None:
        self.assertEqual(
            self._get_sample_attempt().to_dict(),
            self._get_sample_attempt_dict(),
        )

    def test_from_dict_then_to_dict_matches_original_dict(self) -> None:
        original_dict = self._get_sample_attempt_dict()
        self.assertEqual(
            certificate_assessment_domain.CertificateAssessmentAttempt.from_dict(
                original_dict
            ).to_dict(),
            original_dict,
        )


class CertificateAssessmentResponseTest(test_utils.GenericTestBase):
    """Tests for the CertificateAssessmentResponse domain object."""

    def _get_sample_response(
        self,
    ) -> certificate_assessment_domain.CertificateAssessmentResponse:
        """Returns a fully populated CertificateAssessmentResponse for
        use in tests.
        """
        return certificate_assessment_domain.CertificateAssessmentResponse(
            attempt_id='attempt_abc123',
            question_id='question_id_1',
            question_version=1,
            selected_answer='Option A',
            is_correct=True,
        )

    def _get_sample_response_dict(
        self,
    ) -> certificate_assessment_domain.CertificateAssessmentResponseDict:
        """Returns a dict matching the sample response above."""
        return {
            'attempt_id': 'attempt_abc123',
            'question_id': 'question_id_1',
            'question_version': 1,
            'selected_answer': 'Option A',
            'is_correct': True,
        }

    def test_init_sets_all_attributes_correctly(self) -> None:
        response = self._get_sample_response()
        self.assertEqual(response.attempt_id, 'attempt_abc123')
        self.assertEqual(response.question_id, 'question_id_1')
        self.assertEqual(response.question_version, 1)
        self.assertEqual(response.selected_answer, 'Option A')
        self.assertTrue(response.is_correct)

    def test_validate_succeeds_for_valid_response(self) -> None:
        self._get_sample_response().validate()

    def test_validate_rejects_empty_attempt_id(self) -> None:
        response = self._get_sample_response()
        response.attempt_id = ''
        with self.assertRaisesRegex(
            Exception, 'attempt_id must be a non-empty string'
        ):
            response.validate()

    def test_validate_rejects_empty_question_id(self) -> None:
        response = self._get_sample_response()
        response.question_id = ''
        with self.assertRaisesRegex(
            Exception, 'question_id must be a non-empty string'
        ):
            response.validate()

    def test_validate_rejects_invalid_question_version(self) -> None:
        response = self._get_sample_response()
        response.question_version = 0
        with self.assertRaisesRegex(
            Exception, 'question_version must be a positive integer'
        ):
            response.validate()

        response = self._get_sample_response()
        response.question_version = True
        with self.assertRaisesRegex(
            Exception, 'question_version must be a positive integer'
        ):
            response.validate()

    def test_validate_allows_empty_selected_answer_for_unanswered(self) -> None:
        response = self._get_sample_response()
        response.selected_answer = ''
        response.validate()

    def test_validate_rejects_non_string_selected_answer(self) -> None:
        response = self._get_sample_response()
        setattr(response, 'selected_answer', None)
        with self.assertRaisesRegex(
            Exception, 'selected_answer must be a string'
        ):
            response.validate()

        response = self._get_sample_response()
        setattr(response, 'selected_answer', 42)
        with self.assertRaisesRegex(
            Exception, 'selected_answer must be a string'
        ):
            response.validate()

    def test_validate_rejects_oversized_selected_answer(self) -> None:
        response = self._get_sample_response()
        response.selected_answer = 'a' * (
            certificate_assessment_domain.MAX_CERTIFICATE_ASSESSMENT_ANSWER_BYTES
            + 1
        )
        with self.assertRaisesRegex(
            Exception, 'selected_answer must be at most'
        ):
            response.validate()

    def test_validate_accepts_answer_at_size_limit(self) -> None:
        response = self._get_sample_response()
        response.selected_answer = 'a' * (
            certificate_assessment_domain.MAX_CERTIFICATE_ASSESSMENT_ANSWER_BYTES
        )
        response.validate()

    def test_validate_oversized_limit_is_byte_based(self) -> None:
        # Non-ASCII characters encode to two bytes each in UTF-8, so a string
        # below the character limit can still exceed the byte limit.
        oversized_character_count = (
            certificate_assessment_domain.MAX_CERTIFICATE_ASSESSMENT_ANSWER_BYTES
            // 2
        ) + 1
        response = self._get_sample_response()
        response.selected_answer = '\u00e9' * oversized_character_count
        with self.assertRaisesRegex(
            Exception, 'selected_answer must be at most'
        ):
            response.validate()

    def test_validate_rejects_non_boolean_is_correct(self) -> None:
        response = self._get_sample_response()
        setattr(response, 'is_correct', 'yes')
        with self.assertRaisesRegex(Exception, 'is_correct must be a boolean'):
            response.validate()

    def test_to_dict_matches_expected_dict(self) -> None:
        self.assertEqual(
            self._get_sample_response().to_dict(),
            self._get_sample_response_dict(),
        )

    def test_from_dict_then_to_dict_matches_original_dict(self) -> None:
        original_dict = self._get_sample_response_dict()
        self.assertEqual(
            certificate_assessment_domain.CertificateAssessmentResponse.from_dict(
                original_dict
            ).to_dict(),
            original_dict,
        )
