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

"""Tests for the controllers that communicate with VM for training
classifiers.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import json
import os

from constants import constants
from core.controllers import classifier
from core.domain import classifier_services
from core.domain import config_domain
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(classifier_models,) = models.Registry.import_models([models.NAMES.classifier])


class TrainedClassifierHandlerTests(test_utils.EmailTestBase):
    """Test the handler for storing job result of training job."""

    def setUp(self):
        super(TrainedClassifierHandlerTests, self).setUp()

        self.exp_id = 'exp_id1'
        self.title = 'Testing Classifier storing'
        self.category = 'Test'
        yaml_path = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        with python_utils.open_file(yaml_path, 'r') as yaml_file:
            self.yaml_content = yaml_file.read()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup('moderator@example.com', 'mod')

        assets_list = []
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, self.yaml_content, self.exp_id,
                assets_list)
        self.exploration = exp_fetchers.get_exploration_by_id(self.exp_id)

        self.classifier_data_with_floats_stringified = {
            '_alpha': '0.1',
            '_beta': '0.001',
            '_prediction_threshold': '0.5',
            '_training_iterations': 25,
            '_prediction_iterations': 5,
            '_num_labels': 10,
            '_num_docs': 12,
            '_num_words': 20,
            '_label_to_id': {'text': 1},
            '_word_to_id': {'hello': 2},
            '_w_dp': [],
            '_b_dl': [],
            '_l_dp': [],
            '_c_dl': [],
            '_c_lw': [],
            '_c_l': [],
        }
        classifier_training_jobs = (
            classifier_services.get_classifier_training_jobs(
                self.exp_id, self.exploration.version, ['Home']))
        self.assertEqual(len(classifier_training_jobs), 1)
        classifier_training_job = classifier_training_jobs[0]
        self.job_id = classifier_training_job.job_id

        # TODO(pranavsid98): Replace the three commands below with
        # mark_training_job_pending after Giritheja's PR gets merged.
        classifier_training_job_model = (
            classifier_models.ClassifierTrainingJobModel.get(
                self.job_id, strict=False))
        classifier_training_job_model.status = (
            feconf.TRAINING_JOB_STATUS_PENDING)
        classifier_training_job_model.update_timestamps()
        classifier_training_job_model.put()

        self.job_result_dict = {
            'job_id': self.job_id,
            'classifier_data_with_floats_stringified': (
                self.classifier_data_with_floats_stringified)
        }

        self.payload = {}
        self.payload['vm_id'] = feconf.DEFAULT_VM_ID
        self.payload['message'] = self.job_result_dict
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        self.payload['signature'] = classifier.generate_signature(
            python_utils.convert_to_bytes(secret), self.payload['message'])

    def test_trained_classifier_handler(self):
        # Normal end-to-end test.
        self.post_json(
            '/ml/trainedclassifierhandler', self.payload,
            expected_status_int=200)
        classifier_training_jobs = (
            classifier_services.get_classifier_training_jobs(
                self.exp_id, self.exploration.version, ['Home']))
        self.assertEqual(len(classifier_training_jobs), 1)
        decoded_classifier_data = (
            classifier_services.convert_strings_to_float_numbers_in_classifier_data( # pylint: disable=line-too-long
                self.classifier_data_with_floats_stringified))
        self.assertEqual(
            classifier_training_jobs[0].classifier_data,
            decoded_classifier_data)
        self.assertEqual(
            classifier_training_jobs[0].status,
            feconf.TRAINING_JOB_STATUS_COMPLETE)

    def test_email_sent_on_failed_job(self):

        class FakeTrainingJob(python_utils.OBJECT):
            """Fake training class to invoke failed job functions."""

            def __init__(self):
                self.status = feconf.TRAINING_JOB_STATUS_FAILED

        def mock_get_classifier_training_job_by_id(_):
            return FakeTrainingJob()

        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        fail_training_job = self.swap(
            classifier_services,
            'get_classifier_training_job_by_id',
            mock_get_classifier_training_job_by_id)
        config_property = config_domain.Registry.get_config_property(
            'notification_emails_for_failed_tasks')
        config_property.set_value(
            'committer_id', ['moderator@example.com'])

        with can_send_emails_ctx, can_send_feedback_email_ctx:
            with fail_training_job:
                # Adding moderator email to admin config page
                # for sending emails for failed training jobs.
                self.login(self.ADMIN_EMAIL, is_super_admin=True)
                response_dict = self.get_json('/adminhandler')
                response_config_properties = response_dict['config_properties']
                expected_email_list = {
                    'value': ['moderator@example.com']}
                sys_config_list = response_config_properties[
                    email_manager.NOTIFICATION_EMAILS_FOR_FAILED_TASKS.name]
                self.assertDictContainsSubset(
                    expected_email_list, sys_config_list)

                # Check that there are no sent emails to either
                # email address before posting json.
                messages = self._get_sent_email_messages(
                    feconf.ADMIN_EMAIL_ADDRESS)
                self.assertEqual(len(messages), 0)
                messages = self._get_sent_email_messages(
                    'moderator@example.com')
                self.assertEqual(len(messages), 0)

                # Post ML Job.
                self.post_json(
                    '/ml/trainedclassifierhandler', self.payload,
                    expected_status_int=500)

                # Check that there are now emails sent.
                messages = self._get_sent_email_messages(
                    feconf.ADMIN_EMAIL_ADDRESS)
                expected_subject = 'Failed ML Job'
                self.assertEqual(len(messages), 1)
                self.assertEqual(messages[0].subject.decode(), expected_subject)
                messages = self._get_sent_email_messages(
                    'moderator@example.com')
                self.assertEqual(len(messages), 1)
                self.assertEqual(messages[0].subject.decode(), expected_subject)

    def test_error_on_prod_mode_and_default_vm_id(self):
        # Turn off DEV_MODE.
        with self.swap(constants, 'DEV_MODE', False):
            self.post_json(
                '/ml/trainedclassifierhandler', self.payload,
                expected_status_int=401)

    def test_error_on_different_signatures(self):
        # Altering data to result in different signatures.
        self.payload['message']['job_id'] = 'different_job_id'
        self.post_json(
            '/ml/trainedclassifierhandler', self.payload,
            expected_status_int=401)

    def test_error_on_invalid_job_id_in_message(self):
        # Altering message dict to result in invalid dict.
        self.payload['message']['job_id'] = 1
        self.post_json(
            '/ml/trainedclassifierhandler', self.payload,
            expected_status_int=400)

    def test_error_on_invalid_classifier_data_in_message(self):
        # Altering message dict to result in invalid dict.
        self.payload['message']['classifier_data_with_floats_stringified'] = 1
        self.post_json(
            '/ml/trainedclassifierhandler', self.payload,
            expected_status_int=400)

    def test_error_on_failed_training_job_status(self):
        classifier_training_job_model = (
            classifier_models.ClassifierTrainingJobModel.get(
                self.job_id, strict=False))
        classifier_training_job_model.status = (
            feconf.TRAINING_JOB_STATUS_FAILED)
        classifier_training_job_model.update_timestamps()
        classifier_training_job_model.put()

        self.post_json(
            '/ml/trainedclassifierhandler', self.payload,
            expected_status_int=500)

    def test_error_on_exception_in_store_classifier_data(self):
        classifier_training_job_model = (
            classifier_models.ClassifierTrainingJobModel.get(
                self.job_id, strict=False))
        classifier_training_job_model.state_name = 'invalid_state'
        classifier_training_job_model.update_timestamps()
        classifier_training_job_model.put()

        self.post_json(
            '/ml/trainedclassifierhandler', self.payload,
            expected_status_int=500)


class NextJobHandlerTest(test_utils.GenericTestBase):
    """Test the handler for fetching next training job."""

    def setUp(self):
        super(NextJobHandlerTest, self).setUp()

        self.exp_id = 'exp_id1'
        self.title = 'Testing Classifier storing'
        self.category = 'Test'
        interaction_id = 'TextInput'
        self.algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_id']
        self.training_data = [
            {
                u'answer_group_index': 1,
                u'answers': [u'a1', u'a2']
            },
            {
                u'answer_group_index': 2,
                u'answers': [u'a2', u'a3']
            }
        ]
        self.job_id = classifier_models.ClassifierTrainingJobModel.create(
            self.algorithm_id, interaction_id, self.exp_id, 1,
            datetime.datetime.utcnow(), self.training_data, 'Home',
            feconf.TRAINING_JOB_STATUS_NEW, 1)
        fs_services.save_classifier_data(self.exp_id, self.job_id, {})

        self.expected_response = {
            u'job_id': self.job_id,
            u'training_data': self.training_data,
            u'algorithm_id': self.algorithm_id
        }

        self.payload = {}
        self.payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        self.payload['message'] = json.dumps({})
        self.payload['signature'] = classifier.generate_signature(
            python_utils.convert_to_bytes(secret), self.payload['message'])

    def test_next_job_handler(self):
        json_response = self.post_json(
            '/ml/nextjobhandler',
            self.payload,
            expected_status_int=200)
        self.assertEqual(json_response, self.expected_response)
        classifier_services.mark_training_jobs_failed([self.job_id])
        json_response = self.post_json(
            '/ml/nextjobhandler',
            self.payload,
            expected_status_int=200)
        self.assertEqual(json_response, {})

    def test_error_on_prod_mode_and_default_vm_id(self):
        # Turn off DEV_MODE.
        with self.swap(constants, 'DEV_MODE', False):
            self.post_json(
                '/ml/nextjobhandler', self.payload,
                expected_status_int=401)

    def test_error_on_modified_message(self):
        # Altering data to result in different signatures.
        self.payload['message'] = 'different'
        self.post_json(
            '/ml/nextjobhandler', self.payload,
            expected_status_int=401)

    def test_error_on_invalid_vm_id(self):
        # Altering vm_id to result in invalid signature.
        self.payload['vm_id'] = 1
        self.post_json(
            '/ml/nextjobhandler', self.payload,
            expected_status_int=401)
