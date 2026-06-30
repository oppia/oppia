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

from core import utils
from core.domain import (
    certificate_assessment_services,
    classroom_config_domain,
    classroom_config_services,
    topic_fetchers,
)
from core.tests import test_utils


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

    def test_is_invalid_when_total_questions_below_required_minimum(
        self,
    ) -> None:
        result = certificate_assessment_services.validate_certificate_assessment_offering(
            topic_ids=[self.topic_id],
            total_questions=1,
        )
        self.assertFalse(result['is_valid'])
        self.assertIn(
            'total_questions must be greater than or equal to 3 '
            '(3 per topic: easy, medium, hard) for 1 topic(s).',
            result['validation_message'],
        )

    def test_is_invalid_when_topic_has_insufficient_questions(self) -> None:
        result = certificate_assessment_services.validate_certificate_assessment_offering(
            topic_ids=[self.topic_id],
            total_questions=3,
        )
        self.assertFalse(result['is_valid'])
        self.assertIn(self.topic_id, result['validation_errors'])
        self.assertIn(
            'needs 3 unique questions but only 0 are available.',
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
