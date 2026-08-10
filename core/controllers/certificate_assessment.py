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

from core import feconf, utils
from core.controllers import acl_decorators, base
from core.domain import certificate_assessment_services

from typing import Dict, List, TypedDict


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


class SubmitCertificateAssessmentAnswerDict(TypedDict):
    """Dict representation of a single submitted answer."""

    question_id: str
    selected_answer: str


class SubmitCertificateAssessmentHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SubmitCertificateAssessmentHandler payload."""

    answers: List[SubmitCertificateAssessmentAnswerDict]


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
        certificate_offerings = certificate_assessment_services.get_certificate_offerings_for_classroom(
            classroom_url_fragment, self.user_id
        )
        self.render_json({'certificate_offerings': certificate_offerings})


class StartCertificateAssessmentHandler(
    base.BaseHandler[
        StartCertificateAssessmentHandlerNormalizedPayloadDict,
        Dict[str, str],
    ]
):
    """Stub handler for starting a certificate assessment attempt."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'certificate_id': {'schema': {'type': 'basestring'}},
        },
    }

    # TODO(#24717-2.13): Replace open_access with
    # require_user_id_else_redirect_to_homepage once the real
    # start_certificate_assessment_attempt() service is wired in.
    @acl_decorators.open_access
    def post(self) -> None:
        """Returns a hardcoded attempt_id and question list."""
        self.render_json(
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
            }
        )


class SubmitCertificateAssessmentHandler(
    base.BaseHandler[
        SubmitCertificateAssessmentHandlerNormalizedPayloadDict,
        SubmitCertificateAssessmentHandlerNormalizedRequestDict,
    ]
):
    """Stub handler for submitting a certificate assessment attempt."""

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
                        'type': 'dict',
                        'properties': [
                            {
                                'name': 'question_id',
                                'schema': {'type': 'basestring'},
                            },
                            {
                                'name': 'selected_answer',
                                'schema': {'type': 'basestring'},
                            },
                        ],
                        'required': ['question_id', 'selected_answer'],
                    },
                }
            },
        },
    }

    # TODO(#24717-2.13): Replace open_access with
    # can_submit_assessment_response once real submission logic exists.
    @acl_decorators.open_access
    def post(self, attempt_id: str) -> None:
        """Returns a hardcoded submission confirmation."""
        self.render_json(
            {
                'attempt_id': attempt_id,
                'is_submitted': True,
            }
        )


class CertificateAssessmentResultHandler(
    base.BaseHandler[
        Dict[str, str],
        CertificateAssessmentResultHandlerNormalizedRequestDict,
    ]
):
    """Stub handler for fetching a certificate assessment result."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'attempt_id': {'schema': {'type': 'basestring'}},
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    # TODO(#24717-2.14): Replace open_access with
    # can_access_certificate_assessment_attempt once real result
    # fetching logic exists.
    @acl_decorators.open_access
    def get(self, attempt_id: str) -> None:  # pylint: disable=unused-argument
        """Returns a hardcoded result payload."""
        self.render_json(
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
            }
        )


class CertificateAssessmentAttemptsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Stub handler for listing a learner's certificate attempts."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    # TODO(#24717-2.14): Replace open_access with
    # require_user_id_else_redirect_to_homepage once learner_id is
    # pulled from the session for the real implementation.
    @acl_decorators.open_access
    def get(self) -> None:
        """Returns a hardcoded list of attempts."""
        self.render_json(
            {
                'attempts': [
                    {
                        'attempt_id': 'dummy_attempt_id',
                        'classroom_id': 'dummy_classroom_id',
                        'title': 'Everyday Arithmetic & Number Confidence',
                        'total_score': 80,
                        'attempt_index': 1,
                        'started_at': '2026-07-18T00:00:00Z',
                        'is_submitted': True,
                    }
                ]
            }
        )
