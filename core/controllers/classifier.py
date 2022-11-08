# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Controllers for communicating with the VM for training classifiers."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import state_domain
from proto_files import training_job_response_payload_pb2

from typing import Dict, List, TypedDict


def validate_job_result_message_proto(
    job_result_proto: (
        training_job_response_payload_pb2.TrainingJobResponsePayload.JobResult
    )
) -> bool:
    """Validates the data-type of the message payload data.

    Args:
        job_result_proto: JobResult. A protobuf object containing job result
            data such as algorithm id and FrozenModel of trained classifier
            model.

    Returns:
        bool. Whether the payload dict is valid.
    """
    if job_result_proto.WhichOneof('classifier_frozen_model') is None:
        return False
    return True


class TrainedClassifierHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TrainedClassifierHandler's normalized_request
    dictionary.
    """

    exploration_id: str
    exploration_version: str
    state_name: str


class TrainedClassifierHandler(
    base.OppiaMLVMHandler[
        Dict[str, str],
        TrainedClassifierHandlerNormalizedRequestDict
    ]
):
    """This handler stores the result of the training job in datastore and
    updates the status of the job.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'exploration_version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                }
            },
            'state_name': {
                'schema': {
                    'type': 'basestring'
                }
            }
        },
        'POST': {}
    }

    def extract_request_message_vm_id_and_signature(
        self
    ) -> classifier_domain.OppiaMLAuthInfo:
        """Returns message, vm_id and signature retrieved from incoming request.

        Returns:
            OppiaMLAuthInfo. Message at index 0, vm_id at index 1 and signature
            at index 2.
        """
        payload_proto = (
            training_job_response_payload_pb2.TrainingJobResponsePayload())
        payload_proto.ParseFromString(self.request.body)
        signature = payload_proto.signature
        vm_id = payload_proto.vm_id
        return classifier_domain.OppiaMLAuthInfo(
            payload_proto.job_result.SerializeToString(), vm_id, signature)

    @acl_decorators.is_from_oppia_ml
    def post(self) -> None:
        """Handles POST requests."""
        payload_proto = (
            training_job_response_payload_pb2.TrainingJobResponsePayload())
        payload_proto.ParseFromString(self.request.body)

        if not validate_job_result_message_proto(payload_proto.job_result):
            raise self.InvalidInputException

        job_id = payload_proto.job_result.job_id

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        if classifier_training_job.status == (
                feconf.TRAINING_JOB_STATUS_FAILED):
            # Send email to admin and admin-specified email recipients.
            # Other email recipients are specified on admin config page.
            email_manager.send_job_failure_email(job_id)
            raise self.InternalErrorException(
                'The current status of the job cannot transition to COMPLETE.')

        classifier_data_proto = getattr(
            payload_proto.job_result,
            payload_proto.job_result.WhichOneof('classifier_frozen_model'))
        classifier_services.store_classifier_data(
            job_id, classifier_data_proto)

        # Update status of the training job to 'COMPLETE'.
        classifier_services.mark_training_job_complete(job_id)

        return self.render_json({})

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests.

        Retrieves the name of the file on GCS storing the trained model
        parameters and transfers it to the frontend.
        """
        assert self.normalized_request is not None
        exploration_id = self.normalized_request['exploration_id']
        state_name = self.normalized_request['state_name']

        try:
            exp_version = int(self.normalized_request['exploration_version'])
            exploration = exp_fetchers.get_exploration_by_id(
                exploration_id, version=exp_version)
            interaction_id = exploration.states[state_name].interaction.id
        except Exception as e:
            raise self.InvalidInputException(
                'Entity for exploration with id %s, version %s and state %s '
                'not found.' %
                (
                    exploration_id,
                    self.normalized_request['exploration_version'],
                    state_name
                )
            ) from e

        if interaction_id not in feconf.INTERACTION_CLASSIFIER_MAPPING:
            raise self.PageNotFoundException(
                'No classifier algorithm found for %s interaction' % (
                    interaction_id))

        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_id']
        algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_version']

        state_training_jobs_mapping = (
            classifier_services.get_state_training_jobs_mapping(
                exploration_id, exp_version, state_name))
        if state_training_jobs_mapping is None:
            raise self.InvalidInputException(
                'No training jobs exist for given exploration state')

        if not (
                algorithm_id in state_training_jobs_mapping.
                algorithm_ids_to_job_ids):
            classifier_services.migrate_state_training_jobs(
                state_training_jobs_mapping)
            # Since the required training job doesn't exist and old job has to
            # be migrated, a PageNotFound exception is raised.
            # Once jobs are migrated and trained they can be sent to the client
            # upon further requests. This exception should be gracefully
            # handled in the client code and shouldn't break UX.
            raise self.PageNotFoundException(
                'No valid classifier exists for the given exploration state')

        training_job = classifier_services.get_classifier_training_job_by_id(
            state_training_jobs_mapping.algorithm_ids_to_job_ids[algorithm_id])

        if training_job is None or (
                training_job.status != feconf.TRAINING_JOB_STATUS_COMPLETE):
            raise self.PageNotFoundException(
                'No valid classifier exists for the given exploration state')

        if training_job.algorithm_version != algorithm_version:
            classifier_services.migrate_state_training_jobs(
                state_training_jobs_mapping)
            # Since the required training job doesn't exist and old job has to
            # be migrated, a PageNotFound exception is raised.
            # Once jobs are migrated and trained they can be sent to the client
            # upon further requests. This exception should be gracefully
            # handled in the client code and shouldn't break UX.
            raise self.PageNotFoundException(
                'No valid classifier exists for the given exploration state')

        return self.render_json({
            'algorithm_id': algorithm_id,
            'algorithm_version': algorithm_version,
            'gcs_filename': training_job.classifier_data_filename
        })


class NextJobHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of NextJobHandler's normalized_payload
    dictionary.
    """

    message: bytes
    vm_id: str
    signature: str


class NextJobHandlerResponseDict(TypedDict):
    """Dict representation of NextJobHandler's response dictionary."""

    job_id: str
    algorithm_id: str
    algorithm_version: int
    training_data: List[state_domain.TrainingDataDict]


class NextJobHandler(
    base.OppiaMLVMHandler[
        NextJobHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """This handler fetches next job to be processed according to the time
    and sends back job_id, algorithm_id and training data to the VM.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'vm_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'message': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'signature': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    def extract_request_message_vm_id_and_signature(
        self
    ) -> classifier_domain.OppiaMLAuthInfo:
        """Returns message, vm_id and signature retrieved from incoming request.

        Returns:
            tuple(str). Message at index 0, vm_id at index 1 and signature at
            index 2.
        """
        assert self.normalized_payload is not None
        signature = self.normalized_payload['signature']
        vm_id = self.normalized_payload['vm_id']
        message = self.normalized_payload['message']
        return classifier_domain.OppiaMLAuthInfo(message, vm_id, signature)

    @acl_decorators.is_from_oppia_ml
    def post(self) -> None:
        """Handles POST requests."""
        next_job = classifier_services.fetch_next_job()
        if next_job is None:
            return self.render_json({})

        classifier_services.mark_training_job_pending(next_job.job_id)
        response: NextJobHandlerResponseDict = {
            'job_id': next_job.job_id,
            'algorithm_id': next_job.algorithm_id,
            'algorithm_version': next_job.algorithm_version,
            'training_data': next_job.training_data
        }

        return self.render_json(response)
