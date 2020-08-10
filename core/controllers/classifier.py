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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import base64
import hashlib
import hmac

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classifier_services
from core.domain import config_domain
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain.proto import training_job_response_payload_pb2
import feconf
import python_utils


# NOTE TO DEVELOPERS: This function should be kept in sync with its counterpart
# in Oppia-ml.
def generate_signature(secret, message, vm_id):
    """Generates digital signature for given data.

    Args:
        secret: str. The secret used to communicate with Oppia-ml.
        message: str. The message payload data.
        vm_id: str. The ID of the VM that generated message.

    Returns:
        str. The signature of the payload data.
    """
    message = '%s|%s' % (base64.b64encode(message), vm_id)
    return hmac.new(
        secret, msg=message, digestmod=hashlib.sha256).hexdigest()


def validate_job_result_message_proto(job_result_proto):
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


def verify_signature(message, vm_id, received_signature):
    """Function that checks if the signature received from the VM is valid.

    Args:
        message: dict. The message payload data.
        vm_id: str. The ID of the VM instance.
        received_signature: str. The signature received from the VM.

    Returns:
        bool. Whether the incoming request is valid.
    """
    secret = None
    for val in config_domain.VMID_SHARED_SECRET_KEY_MAPPING.value:
        if val['vm_id'] == vm_id:
            secret = python_utils.convert_to_bytes(val['shared_secret_key'])
            break
    if secret is None:
        return False

    generated_signature = generate_signature(secret, message, vm_id)
    if generated_signature != received_signature:
        return False
    return True


class TrainedClassifierHandler(base.BaseHandler):
    """This handler stores the result of the training job in datastore and
    updates the status of the job.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def post(self):
        """Handles POST requests."""
        payload_proto = (
            training_job_response_payload_pb2.TrainingJobResponsePayload())
        payload_proto.ParseFromString(self.request.body)
        signature = payload_proto.signature
        vm_id = payload_proto.vm_id
        if vm_id == feconf.DEFAULT_VM_ID and not constants.DEV_MODE:
            raise self.UnauthorizedUserException

        if not validate_job_result_message_proto(payload_proto.job_result):
            raise self.InvalidInputException
        if not verify_signature(
                payload_proto.job_result.SerializeToString(), vm_id, signature):
            raise self.UnauthorizedUserException

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
        try:
            classifier_data_proto = getattr(
                payload_proto.job_result,
                payload_proto.job_result.WhichOneof('classifier_frozen_model'))
            classifier_services.store_classifier_data(
                job_id, classifier_data_proto)
        except Exception as e:
            raise self.InternalErrorException(e)

        # Update status of the training job to 'COMPLETE'.
        classifier_services.mark_training_job_complete(job_id)

        return self.render_json({})

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests.

        Retrieves the name of the file on GCS storing the trained model
        parameters and transfers it to the frontend.
        """
        exploration_id = self.request.get('exploration_id')
        state_name = self.request.get('state_name')

        try:
            exp_version = int(self.request.get('exploration_version'))
            exploration = exp_fetchers.get_exploration_by_id(
                exploration_id, version=exp_version)
            interaction_id = exploration.states[state_name].interaction.id
        except:
            raise self.InvalidInputException(
                'Entity for exploration with id %s and version %s not found.'
                % (exploration_id, self.request.get('exploration_version')))

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
            raise self.InvalidInputException

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
            raise self.PageNotFoundException

        training_job = classifier_services.get_classifier_training_job_by_id(
            state_training_jobs_mapping.algorithm_ids_to_job_ids[algorithm_id])

        if training_job is None or (
                training_job.status != feconf.TRAINING_JOB_STATUS_COMPLETE):
            raise self.PageNotFoundException

        if training_job.algorithm_version != algorithm_version:
            classifier_services.migrate_state_training_jobs(
                state_training_jobs_mapping)
            # Since the required training job doesn't exist and old job has to
            # be migrated, a PageNotFound exception is raised.
            # Once jobs are migrated and trained they can be sent to the client
            # upon further requests. This exception should be gracefully
            # handled in the client code and shouldn't break UX.
            raise self.PageNotFoundException

        return self.render_json({
            'gcs_file_name': training_job.classifier_data_file_name
        })


class NextJobHandler(base.BaseHandler):
    """This handler fetches next job to be processed according to the time
    and sends back job_id, algorithm_id and training data to the VM.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.open_access
    def post(self):
        """Handles POST requests."""
        signature = self.payload.get('signature')
        vm_id = self.payload.get('vm_id')
        message = self.payload.get('message')

        if vm_id == feconf.DEFAULT_VM_ID and not constants.DEV_MODE:
            raise self.UnauthorizedUserException
        if not verify_signature(message, vm_id, signature):
            raise self.UnauthorizedUserException

        response = {}
        next_job = classifier_services.fetch_next_job()
        if next_job is not None:
            classifier_services.mark_training_job_pending(next_job.job_id)
            response['job_id'] = next_job.job_id
            response['algorithm_id'] = next_job.algorithm_id
            response['algorithm_version'] = next_job.algorithm_version
            response['training_data'] = next_job.training_data

        return self.render_json(response)
