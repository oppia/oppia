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

from core import feconf
from core.controllers import acl_decorators, base
from core.domain import certificate_assessment_services

from typing import Any, Dict


class CertificateAssessmentOfferingHandler(
    base.BaseHandler[Dict[str, Any], Dict[str, Any]]
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
        certificate_offering = certificate_assessment_services.create_certificate_assessment_offering(
            title=self.normalized_payload['title'],
            description=self.normalized_payload['description'],
            classroom_id=self.normalized_payload['classroom_id'],
            topic_ids=[
                topic['topic_id'] for topic in self.normalized_payload['topics']
            ],
            total_questions=self.normalized_payload['total_questions'],
            time_limit_in_minutes=self.normalized_payload[
                'time_limit_in_minutes'
            ],
            demonstrates=self.normalized_payload['demonstrates'],
            async_status=self.normalized_payload['async_status'],
        )
        self.render_json(
            {'certificate_id': certificate_offering.certificate_id}
        )


class CertificateAssessmentOfferingByIdHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for retrieving, updating and deleting an offering by ID."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'certificate_id': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {},
        'DELETE': {},
    }

    @acl_decorators.can_access_certificate_dashboard
    def get(self, certificate_id: str) -> None:
        """Returns a stubbed certificate offering.

        Args:
            certificate_id: str. The ID of the certificate offering.
        """
        self.render_json(
            {
                'certificate_offering': {
                    'certificate_id': certificate_id,
                    'title': 'Certificate Title',
                    'description': '',
                    'classroom_id': '',
                    'topic_data': {},
                    'total_questions': 0,
                    'time_limit_in_minutes': 0,
                    'async_status': 'Draft',
                    'version': 1,
                }
            }
        )

    @acl_decorators.can_access_certificate_dashboard
    def put(self, certificate_id: str) -> None:
        """Returns the updated certificate ID (stub).

        Args:
            certificate_id: str. The ID of the certificate offering.
        """
        self.render_json({'certificate_id': certificate_id})

    @acl_decorators.can_access_certificate_dashboard
    def delete(self, certificate_id: str) -> None:
        """Deletes the certificate offering (stub).

        Args:
            certificate_id: str. The ID of the certificate offering.
        """
        del certificate_id
        self.render_json({})
