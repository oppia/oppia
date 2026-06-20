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

    def test_validate_raises_not_implemented_error(self) -> None:
        offering = self._get_sample_offering()
        with self.assertRaisesRegex(
            NotImplementedError,
            'validate\\(\\) is not yet implemented for '
            'CertificateAssessmentOffering',
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
