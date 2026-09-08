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
from core.domain import (
    certificate_assessment_domain,
    certificate_assessment_services,
    classroom_config_domain,
    classroom_config_services,
    topic_fetchers,
)
from core.platform import models
from core.storage.certificate_assessment import gae_models
from core.tests import test_utils

from typing import Dict, List, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import certificate_assessment_offering_models

(certificate_assessment_offering_models,) = models.Registry.import_models(
    [models.Names.CERTIFICATE_ASSESSMENT_OFFERING]
)


def _create_attempt_model(
    learner_id: str,
    certificate_id: str,
    total_score: float,
    attempt_index: int,
    started_at: Optional[datetime.datetime] = None,
    finished_at: Optional[datetime.datetime] = None,
    is_submitted: bool = True,
) -> certificate_assessment_offering_models.CertificateAssessmentAttemptModel:
    """Creates and returns a certificate assessment attempt model.

    Args:
        learner_id: str. The ID of the learner making the attempt.
        certificate_id: str. The ID of the certificate offering the attempt
            was generated for.
        total_score: float. The total score achieved in the attempt.
        attempt_index: int. The index of the attempt for the learner.
        started_at: datetime.datetime|None. When the attempt was started.
        finished_at: datetime.datetime|None. When the attempt was finished.
        is_submitted: bool. Whether the attempt has been submitted.

    Returns:
        CertificateAssessmentAttemptModel. The created attempt model.
    """
    return certificate_assessment_offering_models.CertificateAssessmentAttemptModel.create(
        learner_id=learner_id,
        certificate_id=certificate_id,
        total_score=total_score,
        attempt_index=attempt_index,
        attempt_data={
            'topic_place_values': {
                'total_related_questions': 5,
                'total_correct_questions': 4,
            }
        },
        version_data={
            'certificate_id': certificate_id,
            'certificate_version': 1,
            'topic_versions': {'topic_place_values': 1},
            'question_versions': {'dummy_question_id': 1},
            'question_topic_links': {
                'dummy_question_id': ['topic_place_values']
            },
        },
        started_at=(
            started_at
            if started_at is not None
            else datetime.datetime(2026, 7, 18)
        ),
        finished_at=finished_at,
        is_submitted=is_submitted,
    )


def _create_certificate_offering() -> (
    certificate_assessment_domain.CertificateAssessmentOffering
):
    """Creates and returns a certificate assessment offering for tests.

    Returns:
        CertificateAssessmentOffering. The created certificate offering.
    """
    return (
        certificate_assessment_services.create_certificate_assessment_offering(
            title='Everyday Arithmetic & Number Confidence',
            description='Covers place values, addition and subtraction.',
            classroom_id='math_classroom_01',
            topic_ids=['topic_place_values'],
            total_questions=12,
            time_limit_in_minutes=60,
            demonstrates=['Understanding of whole numbers'],
            async_status='Available',
        )
    )


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
        learner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        certificate_ids = certificate_assessment_services.get_certificate_offerings_for_classroom(
            self.classroom_url_fragment, learner_id
        )
        started_at = datetime.datetime(2026, 1, 2, 3, 4, 5)
        finished_at = started_at + datetime.timedelta(minutes=5)
        gae_models.CertificateAssessmentAttemptModel.create(
            certificate_id=certificate_ids[0]['certificate_id'],
            learner_id=learner_id,
            total_score=90.0,
            attempt_index=1,
            attempt_data={
                self.topic_id: {
                    'total_related_questions': 1,
                    'total_correct_questions': 1,
                }
            },
            version_data={
                'certificate_id': certificate_ids[0]['certificate_id'],
                'certificate_version': 1,
                'topic_versions': {self.topic_id: 1},
                'question_versions': {'question_id_1': 1},
                'question_topic_links': {'question_id_1': [self.topic_id]},
            },
            started_at=started_at,
            finished_at=finished_at,
            is_submitted=True,
        )

        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_OFFERINGS_FOR_CLASSROOM_HANDLER.replace(
                '<classroom_url_fragment>', self.classroom_url_fragment
            )
        )

        self.assertIn('available_certificate_offerings', response)
        self.assertEqual(len(response['available_certificate_offerings']), 1)
        self.assertTrue(
            response['available_certificate_offerings'][0]['certificate_id']
        )
        self.assertEqual(
            response['available_certificate_offerings'][0]['title'],
            'Sample Certificate',
        )
        self.assertEqual(
            response['available_certificate_offerings'][0]['attempt_status'],
            'Passed',
        )
        self.assertEqual(
            response['available_certificate_offerings'][0]['passed_on_date'],
            utils.get_time_in_millisecs(finished_at),
        )
        self.assertIsNone(
            response['available_certificate_offerings'][0]['failed_on_date']
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


class CertificateAssessmentResultHandlerTest(test_utils.GenericTestBase):
    """Tests class for CertificateAssessmentResultHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.learner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.certificate_offering = _create_certificate_offering()
        self.attempt = _create_attempt_model(
            self.learner_id, self.certificate_offering.certificate_id, 80.0, 1
        )

    def test_get_returns_real_result(self) -> None:
        self.login(self.OWNER_EMAIL)
        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', self.attempt.id
            )
        )
        self.assertEqual(
            response,
            {
                'certificate_id': self.certificate_offering.certificate_id,
                'title': 'Everyday Arithmetic & Number Confidence',
                'total_score': 80.0,
                'time_taken_in_minutes': None,
                'attempt_data': {
                    'topic_place_values': {
                        'topic_name': 'topic_place_values',
                        'total_related_questions': 5,
                        'total_correct_questions': 4,
                    },
                },
                'is_submitted': True,
            },
        )
        self.logout()

    def test_get_returns_time_taken_for_finished_attempt(self) -> None:
        self.login(self.OWNER_EMAIL)
        finished_attempt = _create_attempt_model(
            self.learner_id,
            self.certificate_offering.certificate_id,
            80.0,
            1,
            started_at=datetime.datetime(2026, 7, 18, 10, 0),
            finished_at=datetime.datetime(2026, 7, 18, 10, 35),
        )
        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', finished_attempt.id
            )
        )
        self.assertEqual(response['time_taken_in_minutes'], 35)
        self.logout()

    def test_get_returns_topic_name_from_fetched_topic(self) -> None:
        self.login(self.OWNER_EMAIL)
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id,
            self.OWNER_EMAIL,
            name='Place Values',
            abbreviated_name='place_values',
        )
        attempt_with_topic = _create_attempt_model(
            self.learner_id,
            self.certificate_offering.certificate_id,
            80.0,
            2,
        )
        attempt_with_topic.attempt_data = {
            topic_id: {
                'total_related_questions': 5,
                'total_correct_questions': 4,
            }
        }
        attempt_with_topic.update_timestamps()
        attempt_with_topic.put()
        response = self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', attempt_with_topic.id
            )
        )
        self.assertEqual(
            response['attempt_data'][topic_id]['topic_name'], 'Place Values'
        )
        self.logout()

    def test_get_returns_404_for_missing_attempt(self) -> None:
        self.login(self.OWNER_EMAIL)
        self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', 'missing_attempt_id'
            ),
            expected_status_int=404,
        )
        self.logout()

    def test_get_returns_404_for_missing_certificate_offering(self) -> None:
        self.login(self.OWNER_EMAIL)
        orphan_attempt = _create_attempt_model(
            self.learner_id, 'missing_certificate_id', 80.0, 1
        )
        self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', orphan_attempt.id
            ),
            expected_status_int=404,
        )
        self.logout()

    def test_get_returns_401_for_another_users_attempt(self) -> None:
        self.signup('otheruser@example.com', 'otheruser')
        other_user_id = self.get_user_id_from_email('otheruser@example.com')
        other_attempt = _create_attempt_model(
            other_user_id, self.certificate_offering.certificate_id, 70.0, 1
        )
        self.login(self.OWNER_EMAIL)
        self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', other_attempt.id
            ),
            expected_status_int=401,
        )
        self.logout()

    def test_get_returns_401_for_guest_user(self) -> None:
        self.get_json(
            feconf.CERTIFICATE_ASSESSMENT_RESULT_HANDLER.replace(
                '<attempt_id>', self.attempt.id
            ),
            expected_status_int=401,
        )


class CertificateAssessmentAttemptsHandlerUnitTests(test_utils.GenericTestBase):
    """Tests class for CertificateAssessmentAttemptsHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.learner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.certificate_offering = _create_certificate_offering()

    def test_get_returns_real_attempts_history(self) -> None:
        first_attempt = _create_attempt_model(
            self.learner_id, self.certificate_offering.certificate_id, 80.0, 1
        )
        second_attempt = _create_attempt_model(
            self.learner_id,
            self.certificate_offering.certificate_id,
            90.0,
            2,
        )
        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CERTIFICATE_ASSESSMENT_ATTEMPTS_HANDLER)
        self.assertEqual(
            response,
            {
                'attempts': [
                    {
                        'attempt_id': first_attempt.id,
                        'classroom_id': 'math_classroom_01',
                        'title': 'Everyday Arithmetic & Number Confidence',
                        'total_score': 80.0,
                        'attempt_index': 1,
                        'started_at': '2026-07-18T00:00:00Z',
                        'is_submitted': True,
                    },
                    {
                        'attempt_id': second_attempt.id,
                        'classroom_id': 'math_classroom_01',
                        'title': 'Everyday Arithmetic & Number Confidence',
                        'total_score': 90.0,
                        'attempt_index': 2,
                        'started_at': '2026-07-18T00:00:00Z',
                        'is_submitted': True,
                    },
                ]
            },
        )
        self.logout()

    def test_get_returns_empty_attempts_for_learner_without_attempts(
        self,
    ) -> None:
        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CERTIFICATE_ASSESSMENT_ATTEMPTS_HANDLER)
        self.assertEqual(response, {'attempts': []})
        self.logout()

    def test_get_skips_attempts_with_deleted_certificate_offering(
        self,
    ) -> None:
        existing_attempt = _create_attempt_model(
            self.learner_id, self.certificate_offering.certificate_id, 80.0, 1
        )
        deleted_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title='Geography Essentials',
            description='Covers maps and spatial reasoning.',
            classroom_id='geography_classroom_01',
            topic_ids=['topic_place_values'],
            total_questions=6,
            time_limit_in_minutes=30,
            demonstrates=['Map reading'],
            async_status='Available',
        )
        _create_attempt_model(
            self.learner_id, deleted_offering.certificate_id, 90.0, 2
        )
        certificate_assessment_services.delete_certificate_assessment_offering(
            deleted_offering.certificate_id
        )

        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CERTIFICATE_ASSESSMENT_ATTEMPTS_HANDLER)
        self.assertEqual(
            response,
            {
                'attempts': [
                    {
                        'attempt_id': existing_attempt.id,
                        'classroom_id': 'math_classroom_01',
                        'title': 'Everyday Arithmetic & Number Confidence',
                        'total_score': 80.0,
                        'attempt_index': 1,
                        'started_at': '2026-07-18T00:00:00Z',
                        'is_submitted': True,
                    }
                ]
            },
        )
        self.logout()


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

    def test_post_returns_cooldown_error_with_remaining_minutes(self) -> None:
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
                certificate_assessment_services.CertificateAssessmentAttemptCooldownException(
                    6
                )
            ),
        ), mock.patch.object(
            certificate_assessment.StartCertificateAssessmentHandler,
            'error',
        ) as error_mock, mock.patch.object(
            certificate_assessment.StartCertificateAssessmentHandler,
            'render_json',
        ) as render_json_mock:
            handler.post()

        error_mock.assert_called_once_with(429)
        render_json_mock.assert_called_once_with(
            {
                'error': 'I18N_CERTIFICATE_ASSESSMENT_COOLDOWN_ERROR',
                'error_type': 'cooldown',
                'remaining_minutes': 6,
                'status_code': 429,
            }
        )


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
            certificate_assessment_services,
            'get_certificate_assessment_attempt',
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
            certificate_assessment_services,
            'get_certificate_assessment_attempt',
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
        attempt_model = gae_models.CertificateAssessmentAttemptModel.create(
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
            handler.get(attempt_model.id, 'q1')

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
        attempt_model = gae_models.CertificateAssessmentAttemptModel.create(
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
                handler.get(attempt_model.id, 'q1')
