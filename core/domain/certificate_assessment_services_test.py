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

from core.domain import certificate_assessment_services, topic_fetchers
from core.tests import test_utils


class CertificateAssessmentServicesTest(test_utils.GenericTestBase):
    """Tests for certificate assessment services."""

    def setUp(self) -> None:
        super().setUp()
        self.classroom_id = 'math_classroom_01'
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(self.topic_id, self.admin_id)
        self.classroom = self.save_new_classroom(
            classroom_id=self.classroom_id,
            name='Math',
            url_fragment='math',
            topic_ids=[self.topic_id],
        )

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

    def test_create_rejects_missing_classroom(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'classroom_id must correspond to an existing classroom'
        ):
            certificate_assessment_services.create_certificate_assessment_offering(
                title='Test',
                description='Desc',
                classroom_id='missing_classroom',
                topic_ids=[self.topic_id],
                total_questions=1,
                time_limit_in_minutes=1,
                demonstrates=['Skill'],
                async_status='Available',
            )

    def test_create_rejects_topic_not_in_classroom(self) -> None:
        other_topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(other_topic_id, self.admin_id)
        with self.assertRaisesRegex(
            Exception, 'topic_ids must belong to the specified classroom'
        ):
            certificate_assessment_services.create_certificate_assessment_offering(
                title='Test',
                description='Desc',
                classroom_id=self.classroom_id,
                topic_ids=[other_topic_id],
                total_questions=1,
                time_limit_in_minutes=1,
                demonstrates=['Skill'],
                async_status='Available',
            )
