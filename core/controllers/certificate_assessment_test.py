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

from unittest import mock

from core import feconf, utils
from core.controllers import certificate_assessment
from core.domain import (
    certificate_assessment_services,
    classroom_config_domain,
    classroom_config_services,
    topic_fetchers,
)
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

    def test_get_returns_real_certificate_offering(self) -> None:
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Chemistry Basics',
            description='Covers atoms and bonding.',
            classroom_id='science_classroom_01',
            topic_ids=['topic_atoms'],
            total_questions=7,
            time_limit_in_minutes=35,
            demonstrates=['Scientific reasoning'],
            async_status='Available',
        )
        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', created_offering.certificate_id
            )
        )

        self.assertEqual(
            response,
            {
                'certificate_offering': {
                    'certificate_id': created_offering.certificate_id,
                    'title': 'Chemistry Basics',
                    'description': 'Covers atoms and bonding.',
                    'classroom_id': 'science_classroom_01',
                    'topic_ids': ['topic_atoms'],
                    'total_questions': 7,
                    'time_limit_in_minutes': 35,
                    'demonstrates': ['Scientific reasoning'],
                    'async_status': 'Available',
                    'version': 1,
                    'topic_data': {'topic_atoms': 1},
                }
            },
        )

    def test_get_returns_404_for_missing_certificate_offering(self) -> None:
        self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', 'missing_certificate_id'
            ),
            expected_status_int=404,
        )

    def test_put_updates_certificate_offering(self) -> None:
        csrf_token = self.get_new_csrf_token()
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Chemistry Basics',
            description='Covers atoms and bonding.',
            classroom_id='science_classroom_01',
            topic_ids=['topic_atoms'],
            total_questions=7,
            time_limit_in_minutes=35,
            demonstrates=['Scientific reasoning'],
            async_status='Available',
        )

        response = self.put_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', created_offering.certificate_id
            ),
            {
                'title': 'Chemistry Mastery',
                'description': 'Updated chemistry coverage.',
                'classroom_id': 'science_classroom_02',
                'topics': [
                    {
                        'topic_id': 'topic_atoms',
                    },
                    {
                        'topic_id': 'topic_bonds',
                    },
                ],
                'total_questions': 9,
                'time_limit_in_minutes': 40,
                'demonstrates': ['Scientific reasoning'],
                'async_status': 'Blocked',
            },
            csrf_token=csrf_token,
        )

        self.assertEqual(
            response, {'certificate_id': created_offering.certificate_id}
        )

        updated_offering = (
            certificate_assessment_services.get_certificate_assessment_offering(
                created_offering.certificate_id
            )
        )
        self.assertEqual(updated_offering.title, 'Chemistry Mastery')
        self.assertEqual(
            updated_offering.description, 'Updated chemistry coverage.'
        )
        self.assertEqual(updated_offering.classroom_id, 'science_classroom_02')
        self.assertEqual(
            updated_offering.topic_ids, ['topic_atoms', 'topic_bonds']
        )
        self.assertEqual(updated_offering.total_questions, 9)
        self.assertEqual(updated_offering.time_limit_in_minutes, 40)
        self.assertEqual(updated_offering.async_status, 'Blocked')
        self.assertEqual(updated_offering.version, 2)

    def test_put_returns_404_for_missing_certificate_offering(self) -> None:
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', 'missing_certificate_id'
            ),
            {
                'title': 'Chemistry Mastery',
                'description': 'Updated chemistry coverage.',
                'classroom_id': 'science_classroom_02',
                'topics': [
                    {
                        'topic_id': 'topic_atoms',
                    },
                ],
                'total_questions': 9,
                'time_limit_in_minutes': 40,
                'demonstrates': ['Scientific reasoning'],
                'async_status': 'Blocked',
            },
            csrf_token=csrf_token,
            expected_status_int=404,
        )

    def test_put_returns_400_for_invalid_certificate_offering(self) -> None:
        csrf_token = self.get_new_csrf_token()
        with mock.patch.object(
            certificate_assessment_services,
            'update_certificate_assessment_offering',
            side_effect=utils.ValidationError('Invalid classroom id.'),
        ):
            self.put_json(
                feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                    '<certificate_id>', 'certificate_offering_id'
                ),
                {
                    'title': 'Chemistry Mastery',
                    'description': 'Updated chemistry coverage.',
                    'classroom_id': 'science_classroom_02',
                    'topics': [
                        {
                            'topic_id': 'topic_atoms',
                        },
                    ],
                    'total_questions': 9,
                    'time_limit_in_minutes': 40,
                    'demonstrates': ['Scientific reasoning'],
                    'async_status': 'Blocked',
                },
                csrf_token=csrf_token,
                expected_status_int=400,
            )

    def test_delete_removes_certificate_offering(self) -> None:
        created_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Chemistry Basics',
            description='Covers atoms and bonding.',
            classroom_id='science_classroom_01',
            topic_ids=['topic_atoms'],
            total_questions=7,
            time_limit_in_minutes=35,
            demonstrates=['Scientific reasoning'],
            async_status='Available',
        )
        response = self.delete_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', created_offering.certificate_id
            )
        )
        self.assertEqual(response, {})
        with self.assertRaisesRegex(
            certificate_assessment_services.CertificateAssessmentOfferingNotFoundException,
            'Certificate assessment offering .* does not exist.',
        ):
            certificate_assessment_services.get_certificate_assessment_offering(
                created_offering.certificate_id
            )

    def test_delete_returns_404_for_missing_certificate_offering(self) -> None:
        self.delete_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER.replace(
                '<certificate_id>', 'missing_certificate_id'
            ),
            expected_status_int=404,
        )


class ValidateCertificateAssessmentOfferingHandlerTest(
    test_utils.GenericTestBase
):
    """Tests class for ValidateCertificateAssessmentOfferingHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, 'Place Values', abbreviated_name='place_values'
        )

    def test_post_returns_validation_result_for_valid_offering(self) -> None:
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER,
            {
                'topic_ids': [self.topic_id],
                'total_questions': 3,
            },
            csrf_token=csrf_token,
        )
        self.assertIn('is_valid', response)
        self.assertIn('validation_errors', response)
        self.assertIn('validation_message', response)

    def test_create_empty_validation_payload(self) -> None:
        empty_payload = (
            certificate_assessment.create_empty_validate_certificate_assessment_offering_handler_normalized_payload()
        )
        self.assertEqual(
            empty_payload,
            {
                'topic_ids': [],
                'total_questions': 0,
            },
        )

    def test_post_uses_empty_validation_payload_when_missing(self) -> None:
        handler = certificate_assessment.ValidateCertificateAssessmentOfferingHandler.__new__(
            certificate_assessment.ValidateCertificateAssessmentOfferingHandler
        )
        handler.normalized_payload = None

        validation_result = {
            'is_valid': True,
            'validation_errors': [],
            'validation_message': 'Valid.',
        }
        with mock.patch.object(
            certificate_assessment_services,
            'validate_certificate_assessment_offering',
            return_value=validation_result,
        ) as validate_mock, mock.patch.object(
            certificate_assessment.ValidateCertificateAssessmentOfferingHandler,
            'render_json',
        ) as render_json_mock:
            handler.post()

        validate_mock.assert_called_once_with(topic_ids=[], total_questions=0)
        render_json_mock.assert_called_once_with(validation_result)

    def test_post_returns_invalid_result_for_insufficient_questions(
        self,
    ) -> None:
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.VALIDATE_CERTIFICATE_ASSESSMENT_OFFERING_HANDLER,
            {
                'topic_ids': [self.topic_id],
                'total_questions': 1,
            },
            csrf_token=csrf_token,
        )
        self.assertFalse(response['is_valid'])


class CertificateAssessmentOfferingsForClassroomHandlerTest(
    test_utils.GenericTestBase
):
    """Tests class for CertificateAssessmentOfferingsForClassroomHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.classroom_id = 'physics_classroom_01'
        self.classroom_url_fragment = 'physics'
        self.topic_id = topic_fetchers.get_new_topic_id()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.login(self.OWNER_EMAIL)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_topic(self.topic_id, owner_id)
        classroom = classroom_config_domain.Classroom(
            self.classroom_id,
            name='Physics',
            url_fragment=self.classroom_url_fragment,
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

    def test_get_returns_certificate_offerings_for_classroom(self) -> None:
        """Tests that the handler returns certificate offerings for a classroom."""

        certificate_assessment_services.create_certificate_assessment_offering(
            title='Sample Certificate',
            description='Sample description.',
            classroom_id=self.classroom_id,
            topic_ids=[self.topic_id],
            total_questions=5,
            time_limit_in_minutes=30,
            demonstrates=['Sample skill'],
            async_status='Available',
        )

        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERINGS_FOR_CLASSROOM_HANDLER.replace(
                '<classroom_url_fragment>', self.classroom_url_fragment
            )
        )

        self.assertIn('certificate_offerings', response)
        self.assertEqual(len(response['certificate_offerings']), 1)
        self.assertTrue(response['certificate_offerings'][0]['certificate_id'])
        self.assertEqual(
            response['certificate_offerings'][0]['title'],
            'Sample Certificate',
        )
        self.assertEqual(
            response['certificate_offerings'][0]['attempt_status'],
            'Not Attempted',
        )

    def test_get_raises_not_logged_in_when_user_id_is_missing(self) -> None:
        handler = certificate_assessment.CertificateAssessmentOfferingsForClassroomHandler.__new__(
            certificate_assessment.CertificateAssessmentOfferingsForClassroomHandler
        )
        handler.user_id = None

        with self.assertRaisesRegex(
            certificate_assessment.CertificateAssessmentOfferingsForClassroomHandler.NotLoggedInException,
            '^$',
        ):
            getattr(
                certificate_assessment.CertificateAssessmentOfferingsForClassroomHandler.get,
                '__wrapped__',
            )(handler, self.classroom_url_fragment)


class StartCertificateAssessmentHandlerTest(test_utils.GenericTestBase):
    """Tests class for StartCertificateAssessmentHandler."""

    def test_post_returns_hardcoded_attempt_and_questions(self) -> None:
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.START_CERTIFICATE_ASSESSMENT_HANDLER,
            {'certificate_id': 'dummy_certificate_id'},
            csrf_token=csrf_token,
        )
        self.assertEqual(
            response,
            {
                'attempt_id': 'dummy_attempt_id',
                'questions': [
                    {
                        'question_id': 'dummy_question_id_1',
                        'question_version': 1,
                    },
                    {
                        'question_id': 'dummy_question_id_2',
                        'question_version': 1,
                    },
                ],
            },
        )


class SubmitCertificateAssessmentHandlerTest(test_utils.GenericTestBase):
    """Tests class for SubmitCertificateAssessmentHandler."""

    def test_post_returns_hardcoded_submission_confirmation(self) -> None:
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.SUBMIT_CERTIFICATE_ASSESSMENT_HANDLER.replace(
                '<attempt_id>', 'dummy_attempt_id'
            ),
            {
                'answers': [
                    {
                        'question_id': 'dummy_question_id_1',
                        'selected_answer': 'A',
                    },
                    {
                        'question_id': 'dummy_question_id_2',
                        'selected_answer': 'B',
                    },
                ]
            },
            csrf_token=csrf_token,
        )
        self.assertEqual(
            response,
            {
                'attempt_id': 'dummy_attempt_id',
                'is_submitted': True,
            },
        )


class CertificateAssessmentResultHandlerTest(test_utils.GenericTestBase):
    """Tests class for CertificateAssessmentResultHandler."""

    def test_get_returns_hardcoded_result_payload(self) -> None:
        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', 'dummy_attempt_id'
            )
        )
        self.assertEqual(
            response,
            {
                'title': 'Everyday Arithmetic & Number Confidence',
                'total_score': 80,
                'attempt_data': {
                    'dummy_topic_id': {
                        'total_related_questions': 5,
                        'total_correct_questions': 4,
                    },
                },
                'is_submitted': True,
            },
        )


class CertificateAssessmentAttemptsHandlerTest(test_utils.GenericTestBase):
    """Tests class for CertificateAssessmentAttemptsHandler."""

    def test_get_returns_hardcoded_attempts_list(self) -> None:
        response = self.get_json(feconf.CERTIFICATE_ASSESSMENT_ATTEMPTS_HANDLER)
        self.assertEqual(
            response,
            {
                'attempts': [
                    {
                        'attempt_id': 'dummy_attempt_id',
                        'classroom_id': 'dummy_classroom_id',
                        'title': ('Everyday Arithmetic & Number Confidence'),
                        'total_score': 80,
                        'attempt_index': 1,
                        'started_at': '2026-07-18T00:00:00Z',
                        'is_submitted': True,
                    }
                ]
            },
        )
