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

from core.domain import certificate_assessment_domain
from core.tests import test_utils


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
        offering.total_questions = 0

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
        offering.time_limit_in_minutes = 0

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
