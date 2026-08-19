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

"""Controllers for handling certificate assessment related operations."""

from __future__ import annotations

import datetime

from core import feconf, utils
from core.controllers import acl_decorators, base
from core.controllers import domain_objects_validator as validation_method
from core.domain import certificate_assessment_services, topic_fetchers

from typing import Any, Dict, List, TypedDict


def _format_utc_datetime(value: datetime.datetime) -> str:
    """Formats a naive UTC datetime as an ISO-8601 string with a 'Z' suffix.

    Args:
        value: datetime.datetime. The naive UTC datetime to format.

    Returns:
        str. The ISO-8601 string representation of the datetime.
    """
    return value.isoformat() + 'Z'


class CertificateAssessmentOfferingTopicDict(TypedDict):
    """Dict representation of a certificate assessment topic."""

    topic_id: str


class CertificateAssessmentOfferingHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of CertificateAssessmentOfferingHandler payload.

    Attributes:
        title: Title of the certificate assessment offering.
        description: Description of the certificate assessment offering.
        classroom_id: ID of the classroom the assessment offering belongs to.
        topics: List of topics covered in the assessment offering.
        total_questions: Total number of questions in the assessment.
        time_limit_in_minutes: Time limit for completing the assessment, in
            minutes.
        demonstrates: List of plain-text strings describing what the
            certificate demonstrates (e.g. skills or competencies earned
            upon completion).
        async_status: Availability status of the assessment offering,
            indicating whether it is available, blocked, or not yet ready.
    """

    title: str
    description: str
    classroom_id: str
    topics: List[CertificateAssessmentOfferingTopicDict]
    total_questions: int
    time_limit_in_minutes: int
    demonstrates: List[str]
    async_status: str


class CertificateQuestionRefDict(TypedDict):
    """Dict representation of a question reference returned on start."""

    question_id: str
    question_version: int


class StartCertificateAssessmentHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of StartCertificateAssessmentHandler payload."""

    certificate_id: str


class SubmitCertificateAssessmentHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SubmitCertificateAssessmentHandler payload."""

    # Here we use type Any because each submitted answer can hold a selected
    # answer of any accepted interaction answer type (None, str, int, dict,
    # list, or list of lists).
    answers: List[Dict[str, Any]]


class SubmitCertificateAssessmentHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of attempt_id path args."""

    attempt_id: str


class CertificateAssessmentResultHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of attempt_id path args."""

    attempt_id: str


class ValidateCertificateAssessmentOfferingHandlerNormalizedPayloadDict(
    TypedDict
):
    """Dict representation of the validation handler payload."""

    topic_ids: List[str]
    total_questions: int


def create_empty_validate_certificate_assessment_offering_handler_normalized_payload() -> (
    ValidateCertificateAssessmentOfferingHandlerNormalizedPayloadDict
):
    """Returns an empty validation payload for fallback use."""
    return {'topic_ids': [], 'total_questions': 0}


class CertificateAssessmentOfferingByIdHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of certificate_id path args."""

    certificate_id: str


class CertificateAssessmentOfferingsForClassroomHandlerNormalizedRequestDict(
    TypedDict
):
    """Dict representation of classroom_id path args."""

    classroom_id: str


class ValidateCertificateAssessmentOfferingHandler(
    base.BaseHandler[
        ValidateCertificateAssessmentOfferingHandlerNormalizedPayloadDict,
        Dict[str, str],
    ]
):
    """Validates whether a certificate offering can be created or updated."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'topic_ids': {
                'schema': {'type': 'list', 'items': {'type': 'basestring'}}
            },
            'total_questions': {'schema': {'type': 'int'}},
        },
    }

    @acl_decorators.can_access_certificate_dashboard
    def post(self) -> None:
        """Validates the selected topics and total question count."""
        payload = (
            self.normalized_payload
            if self.normalized_payload is not None
            else (
                create_empty_validate_certificate_assessment_offering_handler_normalized_payload()
            )
        )
        topic_ids = payload['topic_ids']
        total_questions = payload['total_questions']

        validation_result = certificate_assessment_services.validate_certificate_assessment_offering(
            topic_ids=topic_ids,
            total_questions=total_questions,
        )
        self.render_json(validation_result)


class CertificateAssessmentOfferingHandler(
    base.BaseHandler[
        CertificateAssessmentOfferingHandlerNormalizedPayloadDict,
        Dict[str, str],
    ]
):
    """Handler for creating and listing certificate assessment offerings."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'title': {'schema': {'type': 'basestring'}},
            'description': {'schema': {'type': 'basestring'}},
            'classroom_id': {'schema': {'type': 'basestring'}},
            'topics': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'dict',
                        'properties': [
                            {
                                'name': 'topic_id',
                                'schema': {'type': 'basestring'},
                            },
                        ],
                        'required': ['topic_id'],
                    },
                }
            },
            'total_questions': {'schema': {'type': 'int'}},
            'time_limit_in_minutes': {'schema': {'type': 'int'}},
            'demonstrates': {
                'schema': {
                    'type': 'list',
                    'items': {'type': 'basestring'},
                    'validators': [
                        {
                            'id': 'has_length_at_least',
                            'min_value': 1,
                        }
                    ],
                }
            },
            'async_status': {'schema': {'type': 'basestring'}},
        },
    }

    @acl_decorators.can_access_certificate_dashboard
    def get(self) -> None:
        """Returns all certificate assessment offerings."""
        certificate_offerings = (
            certificate_assessment_services.get_certificate_assessment_offerings()
        )
        self.render_json(
            {
                'certificate_offerings': [
                    certificate_offering.to_dict()
                    for certificate_offering in certificate_offerings
                ]
            }
        )

    @acl_decorators.can_access_certificate_dashboard
    def post(self) -> None:
        """Creates a certificate assessment offering."""
        assert self.normalized_payload is not None
        topic_ids = [
            topic['topic_id'] for topic in self.normalized_payload['topics']
        ]
        total_questions = int(self.normalized_payload['total_questions'])

        time_limit_in_minutes = int(
            self.normalized_payload['time_limit_in_minutes']
        )
        demonstrates = list(self.normalized_payload['demonstrates'])
        certificate_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title=self.normalized_payload['title'],
            description=self.normalized_payload['description'],
            classroom_id=self.normalized_payload['classroom_id'],
            topic_ids=topic_ids,
            total_questions=total_questions,
            time_limit_in_minutes=time_limit_in_minutes,
            demonstrates=demonstrates,
            async_status=self.normalized_payload['async_status'],
        )
        self.render_json(
            {'certificate_id': certificate_offering.certificate_id}
        )


class CertificateAssessmentOfferingByIdHandler(
    base.BaseHandler[
        CertificateAssessmentOfferingHandlerNormalizedPayloadDict,
        CertificateAssessmentOfferingByIdHandlerNormalizedRequestDict,
    ]
):
    """Handler for retrieving, updating and deleting an offering by ID."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'certificate_id': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'title': {'schema': {'type': 'basestring'}},
            'description': {'schema': {'type': 'basestring'}},
            'classroom_id': {'schema': {'type': 'basestring'}},
            'topics': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'dict',
                        'properties': [
                            {
                                'name': 'topic_id',
                                'schema': {'type': 'basestring'},
                            },
                        ],
                        'required': ['topic_id'],
                    },
                }
            },
            'total_questions': {'schema': {'type': 'int'}},
            'time_limit_in_minutes': {'schema': {'type': 'int'}},
            'demonstrates': {
                'schema': {
                    'type': 'list',
                    'items': {'type': 'basestring'},
                    'validators': [
                        {
                            'id': 'has_length_at_least',
                            'min_value': 1,
                        }
                    ],
                }
            },
            'async_status': {'schema': {'type': 'basestring'}},
        },
        'DELETE': {},
    }

    @acl_decorators.can_access_certificate_dashboard
    def get(self, certificate_id: str) -> None:
        """Returns a certificate offering by ID.

        Args:
            certificate_id: str. The ID of the certificate offering.
        """
        try:
            certificate_offering = certificate_assessment_services.get_certificate_assessment_offering(
                certificate_id
            )
        except (
            certificate_assessment_services.CertificateAssessmentOfferingNotFoundException
        ) as e:
            raise self.NotFoundException(str(e)) from e
        self.render_json(
            {
                'certificate_offering': {
                    **certificate_offering.to_dict(),
                    'topic_data': {
                        topic_id: 1
                        for topic_id in certificate_offering.topic_ids
                    },
                }
            }
        )

    @acl_decorators.can_access_certificate_dashboard
    def put(self, certificate_id: str) -> None:
        """Updates a certificate offering.

        Args:
            certificate_id: str. The ID of the certificate offering.
        """
        assert self.normalized_payload is not None
        topic_ids = [
            topic['topic_id'] for topic in self.normalized_payload['topics']
        ]
        total_questions = int(self.normalized_payload['total_questions'])

        time_limit_in_minutes = int(
            self.normalized_payload['time_limit_in_minutes']
        )
        demonstrates = list(self.normalized_payload['demonstrates'])
        try:
            certificate_offering = certificate_assessment_services.update_certificate_assessment_offering(
                certificate_id=certificate_id,
                title=self.normalized_payload['title'],
                description=self.normalized_payload['description'],
                classroom_id=self.normalized_payload['classroom_id'],
                topic_ids=topic_ids,
                total_questions=total_questions,
                time_limit_in_minutes=time_limit_in_minutes,
                demonstrates=demonstrates,
                async_status=self.normalized_payload['async_status'],
            )
        except (
            certificate_assessment_services.CertificateAssessmentOfferingNotFoundException
        ) as e:
            raise self.NotFoundException(str(e)) from e
        except utils.ValidationError as e:
            raise self.InvalidInputException(e) from e
        self.render_json(
            {'certificate_id': certificate_offering.certificate_id}
        )

    @acl_decorators.can_access_certificate_dashboard
    def delete(self, certificate_id: str) -> None:
        """Deletes the certificate offering.

        Args:
            certificate_id: str. The ID of the certificate offering.
        """
        try:
            certificate_assessment_services.delete_certificate_assessment_offering(
                certificate_id
            )
        except (
            certificate_assessment_services.CertificateAssessmentOfferingNotFoundException
        ) as e:
            raise self.NotFoundException(str(e)) from e
        self.render_json({})


class CertificateAssessmentOfferingsForClassroomHandler(
    base.BaseHandler[
        CertificateAssessmentOfferingHandlerNormalizedPayloadDict,
        CertificateAssessmentOfferingsForClassroomHandlerNormalizedRequestDict,
    ]
):
    """Handler for learner-facing certificate offerings in a classroom."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.require_user_id_else_redirect_to_homepage
    def get(self, classroom_url_fragment: str) -> None:
        """Returns certificate offerings for the classroom."""
        if self.user_id is None:
            raise self.NotLoggedInException
        available_certificate_offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            classroom_url_fragment, self.user_id
        )
        self.render_json(
            {'available_certificate_offerings': available_certificate_offerings}
        )


class StartCertificateAssessmentHandler(
    base.BaseHandler[
        StartCertificateAssessmentHandlerNormalizedPayloadDict,
        Dict[str, str],
    ]
):
    """Starts a certificate assessment attempt."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'certificate_id': {'schema': {'type': 'basestring'}},
        },
    }

    @acl_decorators.require_user_id_else_redirect_to_homepage
    def post(self) -> None:
        assert self.normalized_payload is not None
        assert self.user_id is not None
        try:
            attempt, questions = (
                certificate_assessment_services.start_certificate_assessment_attempt(
                    self.normalized_payload['certificate_id'], self.user_id
                )
            )
        except utils.ValidationError as e:
            raise self.InvalidInputException(e) from e
        except (
            certificate_assessment_services.CertificateAssessmentAttemptNotReadyException
        ) as e:
            raise self.InvalidInputException(str(e)) from e
        self.render_json(
            {
                'attempt_id': attempt.attempt_id,
                'questions': questions,
            }
        )


class SubmitCertificateAssessmentHandler(
    base.BaseHandler[
        SubmitCertificateAssessmentHandlerNormalizedPayloadDict,
        SubmitCertificateAssessmentHandlerNormalizedRequestDict,
    ]
):
    """Submits a certificate assessment attempt."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'attempt_id': {'schema': {'type': 'basestring'}},
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'answers': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'validation_method': (
                            validation_method.validate_certificate_assessment_answer
                        ),
                    },
                }
            },
        },
    }

    @acl_decorators.can_submit_assessment_response
    def post(self, attempt_id: str) -> None:
        assert self.normalized_payload is not None
        # Here we use type Any because each submitted answer can hold a
        # selected answer of any accepted interaction answer type.
        answers: List[Dict[str, Any]] = self.normalized_payload['answers']
        try:
            attempt = certificate_assessment_services.submit_certificate_assessment_attempt(
                attempt_id, answers
            )
        except utils.ValidationError as e:
            raise self.InvalidInputException(e) from e
        self.render_json(
            {'attempt_id': attempt.attempt_id, 'is_submitted': True}
        )


class CertificateQuestionHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Fetches question state data for an in-progress certificate attempt."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'attempt_id': {'schema': {'type': 'basestring'}},
        'question_id': {'schema': {'type': 'basestring'}},
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_access_certificate_assessment_attempt
    def get(self, attempt_id: str, question_id: str) -> None:
        assert self.user_id is not None
        try:
            question_state_data = certificate_assessment_services.get_question_state_data_for_assessment_attempt(
                self.user_id, attempt_id, question_id
            )
        except utils.ValidationError as e:
            raise self.InvalidInputException(e) from e
        self.render_json(
            {
                'question_id': question_id,
                'question_state_data': question_state_data,
            }
        )


class CertificateAssessmentResultHandler(
    base.BaseHandler[
        Dict[str, str],
        CertificateAssessmentResultHandlerNormalizedRequestDict,
    ]
):
    """Handler for fetching a certificate assessment result."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'attempt_id': {'schema': {'type': 'basestring'}},
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_access_certificate_assessment_attempt_result
    def get(self, attempt_id: str) -> None:
        """Returns the result for the given attempt.

        Args:
            attempt_id: str. The ID of the certificate assessment attempt.
        """
        attempt = certificate_assessment_services.get_certificate_attempt(
            attempt_id
        )
        try:
            certificate_offering = certificate_assessment_services.get_certificate_assessment_offering(
                attempt.version_data['certificate_id']
            )
        except (
            certificate_assessment_services.CertificateAssessmentOfferingNotFoundException
        ) as e:
            raise self.NotFoundException(str(e)) from e
        topics = topic_fetchers.get_topics_by_ids(
            list(attempt.attempt_data.keys())
        )
        topic_names_by_id = {
            topic.id: topic.name for topic in topics if topic is not None
        }
        # Here we use object because attempt_data values are heterogeneous
        # payloads mixing strings and integers.
        attempt_data: Dict[str, Dict[str, object]] = {}
        for topic_id, topic_stats in attempt.attempt_data.items():
            attempt_data[topic_id] = {
                'topic_name': topic_names_by_id.get(topic_id, topic_id),
                'total_related_questions': topic_stats[
                    'total_related_questions'
                ],
                'total_correct_questions': topic_stats[
                    'total_correct_questions'
                ],
            }
        self.render_json(
            {
                'certificate_id': certificate_offering.certificate_id,
                'title': certificate_offering.title,
                'total_score': attempt.total_score,
                'time_taken_in_minutes': attempt.get_time_taken_in_minutes(),
                'attempt_data': attempt_data,
                'is_submitted': attempt.is_submitted,
            }
        )


class CertificateAssessmentAttemptsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for listing a learner's certificate attempts."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.require_user_id_else_redirect_to_homepage
    def get(self) -> None:
        """Returns the learner's certificate assessment attempts."""
        assert self.user_id is not None
        attempts = certificate_assessment_services.get_certificate_attempts(
            self.user_id
        )
        certificate_ids = list(
            {attempt.version_data['certificate_id'] for attempt in attempts}
        )
        offerings_by_id = certificate_assessment_services.get_certificate_assessment_offerings_by_ids(
            certificate_ids
        )
        # Here we use object because the attempt summary values are
        # heterogeneous JSON payloads (strings, floats, integers and booleans).
        attempt_summaries: List[Dict[str, object]] = []
        for attempt in attempts:
            certificate_id = attempt.version_data['certificate_id']
            if certificate_id not in offerings_by_id:
                continue
            certificate_offering = offerings_by_id[certificate_id]
            attempt_summaries.append(
                {
                    'attempt_id': attempt.attempt_id,
                    'classroom_id': certificate_offering.classroom_id,
                    'title': certificate_offering.title,
                    'total_score': attempt.total_score,
                    'attempt_index': attempt.attempt_index,
                    'started_at': _format_utc_datetime(attempt.started_at),
                    'is_submitted': attempt.is_submitted,
                }
            )
        self.render_json({'attempts': attempt_summaries})
