# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Controllers responsible for managing Apache Beam jobs."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import beam_job_services

from typing import Dict, TypedDict


class BeamJobHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Handler for getting the definitions of Apache Beam jobs."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_run_any_job
    def get(self) -> None:
        """Retrieves a list of Beam jobs."""
        sorted_beam_jobs = sorted(
            beam_job_services.get_beam_jobs(),
            key=lambda j: j.name)
        self.render_json({'jobs': [j.to_dict() for j in sorted_beam_jobs]})


class BeamJobRunHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of BeamJobRunHandler's normalized_payload
    dictionary.
    """

    job_name: str
    job_id: str


class BeamJobRunHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of BeamJobRunHandler's normalized_request
    dictionary.
    """

    job_id: str


class BeamJobRunHandler(
    base.BaseHandler[
        BeamJobRunHandlerNormalizedPayloadDict,
        BeamJobRunHandlerNormalizedRequestDict
    ]
):
    """Handler for managing the execution of Apache Beam jobs."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'job_name': {
                'schema': {
                    'type': 'unicode'
                }
            },
        },
        'DELETE': {
            'job_id': {
                'schema': {
                    'type': 'unicode',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': r'[A-Za-z0-9]{22}'
                    }]
                }
            }
        },
    }

    @acl_decorators.can_run_any_job
    def get(self) -> None:
        """Retrieves information about beam job runs."""
        sorted_beam_job_runs = sorted(
            beam_job_services.get_beam_job_runs(),
            key=lambda j: j.job_updated_on,
            reverse=True)
        self.render_json({'runs': [r.to_dict() for r in sorted_beam_job_runs]})

    @acl_decorators.can_run_any_job
    def put(self) -> None:
        """Runs a specified beam job."""
        assert self.normalized_payload is not None
        job_name = self.normalized_payload['job_name']
        beam_job_run = beam_job_services.run_beam_job(job_name=job_name)
        self.render_json(beam_job_run.to_dict())

    @acl_decorators.can_run_any_job
    def delete(self) -> None:
        """Cancels a specified beam job."""
        assert self.normalized_request is not None
        job_id = self.normalized_request['job_id']
        beam_job_run = beam_job_services.cancel_beam_job(job_id)
        self.render_json(beam_job_run.to_dict())


class BeamJobRunResultHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of BeamJobRunResultHandler's
    normalized_request dictionary.
    """

    job_id: str


class BeamJobRunResultHandler(
    base.BaseHandler[
        Dict[str, str], BeamJobRunResultHandlerNormalizedRequestDict
    ]
):
    """Handler for getting the result of Apache Beam jobs."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'job_id': {
                'schema': {
                    'type': 'unicode',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': r'[A-Za-z0-9]{22}'
                    }]
                }
            }
        }
    }

    @acl_decorators.can_run_any_job
    def get(self) -> None:
        """Retrieves the result of a specified beam job run."""
        assert self.normalized_request is not None
        job_id = self.normalized_request['job_id']
        beam_job_run_result = beam_job_services.get_beam_job_run_result(job_id)
        self.render_json(beam_job_run_result.to_dict())
