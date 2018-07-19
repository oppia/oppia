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

import hashlib
import hmac
import json

from core.controllers import base
from core.domain import acl_decorators
from core.domain import classifier_services
from core.domain import config_domain
import feconf


# NOTE TO DEVELOPERS: This function should be kept in sync with its counterpart
# in Oppia-ml.
def generate_signature(secret, message):
    """Generates digital signature for given data.

    Args:
        secret: str. The secret used to communicate with Oppia-ml.
        message: dict. The message payload data.

    Returns:
        str. The signature of the payload data.
    """
    message_json = json.dumps(message, sort_keys=True)
    return hmac.new(secret, message_json, digestmod=hashlib.sha256).hexdigest()


def validate_job_result_message_dict(message):
    """Validates the data-type of the message payload data.

    Args:
        message: dict. The message payload data.

    Returns:
        bool. Whether the payload dict is valid.
    """
    job_id = message.get('job_id')
    classifier_data_with_floats_stringified = message.get(
        'classifier_data_with_floats_stringified')

    if not isinstance(job_id, basestring):
        return False
    if not isinstance(classifier_data_with_floats_stringified, dict):
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
            secret = str(val['shared_secret_key'])
            break
    if secret is None:
        return False

    generated_signature = generate_signature(secret, message)
    if generated_signature != received_signature:
        return False
    return True


class TrainedClassifierHandler(base.BaseHandler):
    """This handler stores the result of the training job in datastore and
    updates the status of the job.
    """

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.open_access
    def post(self):
        """Handles POST requests."""
        signature = self.payload.get('signature')
        message = self.payload.get('message')
        vm_id = self.payload.get('vm_id')
        if vm_id == feconf.DEFAULT_VM_ID and not feconf.DEV_MODE:
            raise self.UnauthorizedUserException

        if not validate_job_result_message_dict(message):
            raise self.InvalidInputException
        if not verify_signature(message, vm_id, signature):
            raise self.UnauthorizedUserException

        job_id = message['job_id']
        # The classifier data received in the payload has all floating point
        # values stored as strings. This is because floating point numbers
        # are represented differently on GAE(Oppia) and GCE(Oppia-ml).
        # Therefore, converting all floating point numbers to string keeps
        # signature consistent on both Oppia and Oppia-ml.
        # For more info visit: https://stackoverflow.com/q/40173295
        classifier_data = (
            classifier_services.convert_strings_to_float_numbers_in_classifier_data( #pylint: disable=line-too-long
                message['classifier_data_with_floats_stringified']))
        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        if classifier_training_job.status == (
                feconf.TRAINING_JOB_STATUS_FAILED):
            raise self.InternalErrorException(
                'The current status of the job cannot transition to COMPLETE.')
        try:
            classifier_services.store_classifier_data(job_id, classifier_data)
        except Exception as e:
            raise self.InternalErrorException(e)

        # Update status of the training job to 'COMPLETE'.
        classifier_services.mark_training_job_complete(job_id)

        return self.render_json({})


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

        if vm_id == feconf.DEFAULT_VM_ID and not feconf.DEV_MODE:
            raise self.UnauthorizedUserException
        if not verify_signature(message, vm_id, signature):
            raise self.UnauthorizedUserException

        response = {}
        next_job = classifier_services.fetch_next_job()
        if next_job is not None:
            classifier_services.mark_training_job_pending(next_job.job_id)
            response['job_id'] = next_job.job_id
            response['algorithm_id'] = next_job.algorithm_id
            response['training_data'] = next_job.training_data

        return self.render_json(response)
