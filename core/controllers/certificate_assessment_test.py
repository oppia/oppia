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
from core.tests import test_utils


class CertificateAssessmentOfferingHandlerTest(test_utils.GenericTestBase):
    """Tests class for CertificateAssessmentOfferingHandler."""

    def test_get_returns_empty_certificate_offerings(self) -> None:
        response = self.get_json(feconf.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER)

        self.assertEqual(response, {'certificate_offerings': []})

    def test_post_returns_dummy_certificate_id(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_HANDLER,
            {},
            csrf_token=csrf_token,
        )

        self.assertEqual(response, {'certificate_id': 'dummy_id'})


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
