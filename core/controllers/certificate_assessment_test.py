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

import datetime
from unittest import mock

from core import feconf, utils
from core.controllers import certificate_assessment
from core.domain import certificate_assessment_services, topic_fetchers
from core.storage.certificate_assessment import gae_models
from core.tests import test_utils

from typing import Dict, List, Union


class CertificateAssessmentOfferingHandlerUnitTests(test_utils.GenericTestBase):
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


class CertificateAssessmentOfferingByIdHandlerUnitTests(
    test_utils.GenericTestBase
):
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


class ValidateCertificateAssessmentOfferingHandlerUnitTests(
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


class CertificateAssessmentResultHandlerUnitTests(test_utils.GenericTestBase):
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


class CertificateAssessmentOfferingsForClassroomHandlerUnitTests(
    test_utils.GenericTestBase
):
    """Tests class for CertificateAssessmentOfferingsForClassroomHandler."""

    def test_get_returns_hardcoded_certificate_offerings(self) -> None:
        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERINGS_FOR_CLASSROOM_HANDLER.replace(
                '<classroom_id>', 'math_classroom_01'
            )
        )

        self.assertEqual(
            response,
            {
                'available_certificate_offerings': [
                    {
                        'certificate_id': 'sample_certificate_id',
                        'title': 'Sample Certificate',
                        'attempt_status': 'Not Attempted',
                    }
                ]
            },
        )


class CertificateAssessmentAttemptsHandlerUnitTests(test_utils.GenericTestBase):
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


class StartCertificateAssessmentHandlerUnitTests(test_utils.GenericTestBase):
    """Tests for the start certificate assessment handler."""

    def test_post_returns_real_attempt_payload(self) -> None:
        handler = (
            certificate_assessment.StartCertificateAssessmentHandler.__new__(
                certificate_assessment.StartCertificateAssessmentHandler
            )
        )
        handler.user_id = 'user_id_1'
        handler.normalized_payload = {'certificate_id': 'cert_1'}
        with mock.patch.object(
            certificate_assessment_services,
            'start_certificate_assessment_attempt',
            return_value=(
                mock.Mock(attempt_id='attempt_1'),
                [{'question_id': 'q1', 'question_version': 1}],
            ),
        ), mock.patch.object(
            certificate_assessment.StartCertificateAssessmentHandler,
            'render_json',
        ) as render_json_mock:
            handler.post()

        render_json_mock.assert_called_once_with(
            {
                'attempt_id': 'attempt_1',
                'questions': [{'question_id': 'q1', 'question_version': 1}],
            }
        )

    def test_post_raises_invalid_input_on_not_ready_exception(self) -> None:
        handler = (
            certificate_assessment.StartCertificateAssessmentHandler.__new__(
                certificate_assessment.StartCertificateAssessmentHandler
            )
        )
        handler.user_id = 'user_id_1'
        handler.normalized_payload = {'certificate_id': 'cert_1'}
        with mock.patch.object(
            certificate_assessment_services,
            'start_certificate_assessment_attempt',
            side_effect=(
                certificate_assessment_services.CertificateAssessmentAttemptNotReadyException(
                    'not ready'
                )
            ),
        ):
            with self.assertRaisesRegex(
                handler.InvalidInputException, 'not ready'
            ):
                handler.post()

    def test_post_raises_invalid_input_on_validation_error(self) -> None:
        handler = (
            certificate_assessment.StartCertificateAssessmentHandler.__new__(
                certificate_assessment.StartCertificateAssessmentHandler
            )
        )
        handler.user_id = 'user_id_1'
        handler.normalized_payload = {'certificate_id': 'cert_1'}
        with mock.patch.object(
            certificate_assessment_services,
            'start_certificate_assessment_attempt',
            side_effect=utils.ValidationError('invalid certificate id'),
        ):
            with self.assertRaisesRegex(
                handler.InvalidInputException, 'invalid certificate id'
            ):
                handler.post()

    def test_post_raises_invalid_input_on_invalidated_offering(self) -> None:
        handler = (
            certificate_assessment.StartCertificateAssessmentHandler.__new__(
                certificate_assessment.StartCertificateAssessmentHandler
            )
        )
        handler.user_id = 'user_id_1'
        handler.normalized_payload = {'certificate_id': 'cert_1'}
        with mock.patch.object(
            certificate_assessment_services,
            'start_certificate_assessment_attempt',
            side_effect=(
                certificate_assessment_services.CertificateAssessmentAttemptNotReadyException(
                    'assessment is not ready'
                )
            ),
        ):
            with self.assertRaisesRegex(
                handler.InvalidInputException, 'assessment is not ready'
            ):
                handler.post()


class SubmitCertificateAssessmentHandlerUnitTests(test_utils.GenericTestBase):
    """Tests for the submit certificate assessment handler."""

    def test_post_returns_submission_confirmation(self) -> None:
        handler = (
            certificate_assessment.SubmitCertificateAssessmentHandler.__new__(
                certificate_assessment.SubmitCertificateAssessmentHandler
            )
        )
        handler.user_id = 'user_id_1'
        handler.normalized_payload = {
            'answers': [
                {
                    'question_id': 'q1',
                    'selected_answer': 'A',
                    'is_correct': True,
                }
            ]
        }
        with mock.patch.object(
            gae_models.CertificateAssessmentAttemptModel,
            'get_by_id',
            return_value=mock.Mock(
                learner_id='user_id_1',
                is_submitted=False,
            ),
        ), mock.patch.object(
            certificate_assessment_services,
            'submit_certificate_assessment_attempt',
            return_value=mock.Mock(attempt_id='attempt_1'),
        ), mock.patch.object(
            certificate_assessment.SubmitCertificateAssessmentHandler,
            'render_json',
        ) as render_json_mock:
            handler.post('attempt_1')

        render_json_mock.assert_called_once_with(
            {'attempt_id': 'attempt_1', 'is_submitted': True}
        )

    def test_post_raises_invalid_input_on_validation_error(self) -> None:
        handler = (
            certificate_assessment.SubmitCertificateAssessmentHandler.__new__(
                certificate_assessment.SubmitCertificateAssessmentHandler
            )
        )
        handler.user_id = 'user_id_1'
        handler.normalized_payload = {
            'answers': [
                {
                    'question_id': 'q1',
                    'selected_answer': 'A',
                    'is_correct': True,
                }
            ]
        }
        attempt = mock.Mock(learner_id='user_id_1', is_submitted=False)
        with mock.patch.object(
            gae_models.CertificateAssessmentAttemptModel,
            'get_by_id',
            return_value=attempt,
        ), mock.patch.object(
            certificate_assessment_services,
            'submit_certificate_assessment_attempt',
            side_effect=utils.ValidationError('invalid attempt'),
        ):
            with self.assertRaisesRegex(
                handler.InvalidInputException, 'invalid attempt'
            ):
                handler.post('attempt_1')

    def test_post_accepts_non_string_selected_answer(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        version_data: Dict[
            str, Union[str, int, Dict[str, int], Dict[str, List[str]]]
        ] = {
            'certificate_id': 'cert_1',
            'certificate_version': 1,
            'topic_versions': {'topic_1': 1},
            'question_versions': {'q1': 1},
            'question_topic_links': {'q1': ['topic_1']},
        }
        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id=owner_id,
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data=version_data,
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.SUBMIT_CERTIFICATE_ASSESSMENT_HANDLER.replace(
                '<attempt_id>', attempt.id
            ),
            {
                'answers': [
                    {
                        'question_id': 'q1',
                        'selected_answer': 42,
                        'is_correct': True,
                    }
                ]
            },
            csrf_token=csrf_token,
        )
        self.logout()

        self.assertEqual(
            response, {'attempt_id': attempt.id, 'is_submitted': True}
        )

    def test_post_defaults_selected_answer_to_none_when_omitted(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        version_data: Dict[
            str, Union[str, int, Dict[str, int], Dict[str, List[str]]]
        ] = {
            'certificate_id': 'cert_1',
            'certificate_version': 1,
            'topic_versions': {'topic_1': 1},
            'question_versions': {'q1': 1},
            'question_topic_links': {'q1': ['topic_1']},
        }
        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id=owner_id,
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data=version_data,
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with mock.patch.object(
            certificate_assessment_services,
            'submit_certificate_assessment_attempt',
            return_value=mock.Mock(attempt_id=attempt.id),
        ) as submit_mock:
            response = self.post_json(
                feconf.SUBMIT_CERTIFICATE_ASSESSMENT_HANDLER.replace(
                    '<attempt_id>', attempt.id
                ),
                {
                    'answers': [
                        {
                            'question_id': 'q1',
                            'is_correct': True,
                        }
                    ]
                },
                csrf_token=csrf_token,
            )
        self.logout()

        self.assertEqual(
            response, {'attempt_id': attempt.id, 'is_submitted': True}
        )
        submit_mock.assert_called_once_with(
            attempt.id,
            [
                {
                    'question_id': 'q1',
                    'selected_answer': None,
                    'is_correct': True,
                }
            ],
        )

    def test_post_raises_invalid_input_when_is_correct_is_missing(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        empty_topic_versions: Dict[str, int] = {}
        empty_question_versions: Dict[str, int] = {}
        empty_question_topic_links: Dict[str, List[str]] = {}
        version_data: Dict[
            str, Union[str, int, Dict[str, int], Dict[str, List[str]]]
        ] = {
            'certificate_id': 'cert_1',
            'certificate_version': 1,
            'topic_versions': empty_topic_versions,
            'question_versions': empty_question_versions,
            'question_topic_links': empty_question_topic_links,
        }
        attempt = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id=owner_id,
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data=version_data,
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        url = feconf.SUBMIT_CERTIFICATE_ASSESSMENT_HANDLER.replace(
            '<attempt_id>', attempt.id
        )
        response = self.post_json(
            url,
            {
                'answers': [
                    {
                        'question_id': 'q1',
                        'selected_answer': 42,
                    }
                ]
            },
            csrf_token=csrf_token,
            expected_status_int=400,
        )
        self.logout()

        self.assertIn(
            'Schema validation for \'answers\' failed', response['error']
        )


class CertificateQuestionHandlerUnitTests(test_utils.GenericTestBase):
    """Tests for the certificate question handler."""

    def test_get_returns_question_state_data(self) -> None:
        handler = certificate_assessment.CertificateQuestionHandler.__new__(
            certificate_assessment.CertificateQuestionHandler
        )
        handler.user_id = 'user_id_1'
        gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='user_id_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'question_versions': {'q1': 1},
                'question_topic_links': {'q1': ['topic_1']},
                'topic_versions': {'topic_1': 1},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        with mock.patch.object(
            certificate_assessment_services,
            'get_question_state_data_for_assessment_attempt',
            return_value={'content': 'state'},
        ), mock.patch.object(
            certificate_assessment.CertificateQuestionHandler, 'render_json'
        ) as render_json_mock:
            # Here attempt_id is omitted because the decorator injects it from
            # the learner's active attempt, and pylint inspects the wrapped
            # signature which lists attempt_id as a required parameter.
            handler.get('q1')  # pylint: disable=no-value-for-parameter

        render_json_mock.assert_called_once_with(
            {
                'question_id': 'q1',
                'question_state_data': {'content': 'state'},
            }
        )

    def test_get_raises_invalid_input_on_validation_error(self) -> None:
        handler = certificate_assessment.CertificateQuestionHandler.__new__(
            certificate_assessment.CertificateQuestionHandler
        )
        handler.user_id = 'user_id_1'
        gae_models.CertificateAssessmentAttemptModel.create(
            learner_id='user_id_1',
            certificate_id='cert_1',
            total_score=0.0,
            attempt_index=1,
            attempt_data={},
            version_data={
                'certificate_id': 'cert_1',
                'certificate_version': 1,
                'question_versions': {'q1': 1},
                'question_topic_links': {'q1': ['topic_1']},
                'topic_versions': {'topic_1': 1},
            },
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        with mock.patch.object(
            certificate_assessment_services,
            'get_question_state_data_for_assessment_attempt',
            side_effect=utils.ValidationError('bad question'),
        ):
            with self.assertRaisesRegex(
                handler.InvalidInputException, 'bad question'
            ):
                handler.get('q1')  # pylint: disable=no-value-for-parameter
