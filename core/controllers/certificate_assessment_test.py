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

"""Tests for CertificateAssessmentOfferingHandler."""

from __future__ import annotations

from core import feconf
from core.domain import certificate_assessment_services
from core.tests import test_utils


class CertificateAssessmentOfferingHandlerTest(test_utils.GenericTestBase):
    """Tests class for CertificateAssessmentOfferingHandler."""

    def test_get_returns_empty_certificate_offerings(self) -> None:
        response = self.get_json(feconf.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER)

        self.assertEqual(response, {'certificate_offerings': []})

    def test_post_creates_real_certificate_offering(self) -> None:
        csrf_token = self.get_new_csrf_token()
        payload = {
            'title': 'Everyday Arithmetic & Number Confidence',
            'description': 'Covers place values, addition and subtraction.',
            'classroom_id': 'math_classroom_01',
            'topics': [
                {
                    'topic_id': 'topic_place_values',
                }
            ],
            'total_questions': 12,
            'time_limit_in_minutes': 60,
            'demonstrates': ['Understanding of whole numbers'],
            'async_status': 'Available',
        }

        response = self.post_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER,
            payload,
            csrf_token=csrf_token,
        )

        self.assertIn('certificate_id', response)
        self.assertTrue(response['certificate_id'])

        stored_offerings = (
            certificate_assessment_services.get_certificate_assessment_offerings()
        )
        self.assertEqual(len(stored_offerings), 1)
        self.assertEqual(
            stored_offerings[0].certificate_id, response['certificate_id']
        )
        self.assertEqual(stored_offerings[0].version, 1)
        self.assertEqual(stored_offerings[0].title, payload['title'])

    def test_post_rejects_empty_demonstrates(self) -> None:
        csrf_token = self.get_new_csrf_token()
        payload = {
            'title': 'Everyday Arithmetic & Number Confidence',
            'description': 'Covers place values, addition and subtraction.',
            'classroom_id': 'math_classroom_01',
            'topics': [
                {
                    'topic_id': 'topic_place_values',
                }
            ],
            'total_questions': 12,
            'time_limit_in_minutes': 60,
            'demonstrates': [],
            'async_status': 'Available',
        }

        response = self.post_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER,
            payload,
            csrf_token=csrf_token,
            expected_status_int=400,
        )

        self.assertEqual(
            response['error'],
            'At \'http://localhost/certificate_assessment_offering_handler\' '
            'these errors are happening:\nSchema validation for '
            '\'demonstrates\' failed: Validation failed: '
            'has_length_at_least ({\'min_value\': 1}) for object []',
        )

    def test_get_returns_real_certificate_offerings(self) -> None:
        certificate_assessment_services.create_certificate_assessment_offering(
            title='Physics Basics',
            description='Covers motion and force.',
            classroom_id='physics_classroom_01',
            topic_ids=['topic_motion'],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Basic physics reasoning'],
            async_status='Available',
        )

        response = self.get_json(feconf.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER)

        self.assertEqual(len(response['certificate_offerings']), 1)

        offering = response['certificate_offerings'][0]

        self.assertEqual(offering['title'], 'Physics Basics')
        self.assertEqual(offering['description'], 'Covers motion and force.')
        self.assertEqual(offering['classroom_id'], 'physics_classroom_01')
        self.assertEqual(offering['topic_ids'], ['topic_motion'])
        self.assertEqual(offering['total_questions'], 5)
        self.assertEqual(offering['time_limit_in_minutes'], 30)
        self.assertEqual(offering['demonstrates'], ['Basic physics reasoning'])
        self.assertEqual(offering['async_status'], 'Available')


class CertificateAssessmentOfferingByIdHandlerTest(test_utils.GenericTestBase):
    """Tests class for CertificateAssessmentOfferingByIdHandler."""

    def test_get_returns_stubbed_certificate_offering(self) -> None:
        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', 'dummy_id'
            )
        )

        self.assertEqual(
            response,
            {
                'certificate_offering': {
                    'certificate_id': 'dummy_id',
                    'title': 'Certificate Title',
                    'description': '',
                    'classroom_id': '',
                    'topic_data': {},
                    'total_questions': 0,
                    'time_limit_in_minutes': 0,
                    'async_status': 'Draft',
                    'version': 1,
                }
            },
        )

    def test_put_returns_certificate_id(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', 'dummy_id'
            ),
            {},
            csrf_token=csrf_token,
        )

        self.assertEqual(response, {'certificate_id': 'dummy_id'})

    def test_delete_returns_empty_response(self) -> None:
        response = self.delete_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', 'dummy_id'
            )
        )

        self.assertEqual(response, {})
