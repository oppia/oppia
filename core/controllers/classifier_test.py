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

from __future__ import annotations

import datetime
import json
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import classifier_services
from core.domain import config_domain
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.platform import models
from core.tests import test_utils
from proto_files import text_classifier_pb2
from proto_files import training_job_response_payload_pb2

from typing import Dict, List, Tuple, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import classifier_models

(classifier_models,) = models.Registry.import_models([models.Names.CLASSIFIER])


class TrainedClassifierHandlerTests(test_utils.ClassifierTestBase):
    """Test the handler for storing job result of training job."""

    def setUp(self) -> None:
        super().setUp()

        self.exp_id = 'exp_id1'
        self.title = 'Testing Classifier storing'
        self.category = 'Test'
        yaml_path = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        with utils.open_file(yaml_path, 'r') as yaml_file:
            self.yaml_content = yaml_file.read()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup('moderator@example.com', 'mod')

        assets_list: List[Tuple[str, bytes]] = []
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, self.yaml_content, self.exp_id,
                assets_list)
        self.exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        assert self.exploration.states['Home'].interaction.id is not None
        self.algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            self.exploration.states['Home'].interaction.id]['algorithm_id']
        self.algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            self.exploration.states['Home'].interaction.id]['algorithm_version']

        self.classifier_data = {
            '_alpha': 0.1,
            '_beta': 0.001,
            '_prediction_threshold': 0.5,
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
        classifier_training_job = (
            classifier_services.get_classifier_training_job(
                self.exp_id, self.exploration.version, 'Home',
                self.algorithm_id))
        self.assertIsNotNone(classifier_training_job)
        assert classifier_training_job is not None
        self.job_id = classifier_training_job.job_id

        # TODO(pranavsid98): Replace the three commands below with
        # mark_training_job_pending after Giritheja's PR gets merged.
        classifier_training_job_model = (
            classifier_models.ClassifierTrainingJobModel.get(
                self.job_id, strict=True))
        classifier_training_job_model.status = (
            feconf.TRAINING_JOB_STATUS_PENDING)
        classifier_training_job_model.update_timestamps()
        classifier_training_job_model.put()

        self.job_result = (
            training_job_response_payload_pb2.TrainingJobResponsePayload.
            JobResult())
        self.job_result.job_id = self.job_id

        classifier_frozen_model = (
            text_classifier_pb2.TextClassifierFrozenModel())
        classifier_frozen_model.model_json = json.dumps(self.classifier_data)

        self.job_result.text_classifier.CopyFrom(classifier_frozen_model)

        self.payload_proto = (
            training_job_response_payload_pb2.TrainingJobResponsePayload())
        self.payload_proto.job_result.CopyFrom(self.job_result)
        self.payload_proto.vm_id = feconf.DEFAULT_VM_ID
        self.secret = feconf.DEFAULT_VM_SHARED_SECRET
        self.payload_proto.signature = classifier_services.generate_signature(
            self.secret.encode('utf-8'),
            self.payload_proto.job_result.SerializeToString(),
            self.payload_proto.vm_id)

        self.payload_for_fetching_next_job_request = {
            'vm_id': feconf.DEFAULT_VM_ID,
            'message': json.dumps({})
        }

        self.payload_for_fetching_next_job_request['signature'] = (
            classifier_services.generate_signature(
                self.secret.encode('utf-8'),
                self.payload_for_fetching_next_job_request['message'].encode(
                    'utf-8'),
                self.payload_for_fetching_next_job_request['vm_id']))

    def test_trained_classifier_handler(self) -> None:
        # Normal end-to-end test.
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=200)
        classifier_training_job = (
            classifier_services.get_classifier_training_job(
                self.exp_id, self.exploration.version, 'Home',
                self.algorithm_id))
        self.assertIsNotNone(classifier_training_job)
        assert classifier_training_job is not None
        classifier_data = (
            self._get_classifier_data_from_classifier_training_job(
                classifier_training_job))
        self.assertEqual(
            json.loads(classifier_data.model_json), self.classifier_data)
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_COMPLETE)

    def test_email_sent_on_failed_job(self) -> None:

        class FakeTrainingJob:
            """Fake training class to invoke failed job functions."""

            def __init__(self) -> None:
                self.status = feconf.TRAINING_JOB_STATUS_FAILED

        def mock_get_classifier_training_job_by_id(_: str) -> FakeTrainingJob:
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
            'notification_user_ids_for_failed_tasks')
        assert config_property is not None
        config_property.set_value(
            'committer_id',
            [self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)])

        with can_send_emails_ctx, can_send_feedback_email_ctx:
            with fail_training_job:
                # Adding moderator email to admin config page
                # for sending emails for failed training jobs.
                self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
                response_dict = self.get_json('/adminhandler')
                response_config_properties = response_dict['config_properties']
                expected_email_list = {
                    'value': [self.get_user_id_from_email(
                        self.CURRICULUM_ADMIN_EMAIL)]}
                sys_config_list = response_config_properties[
                    email_manager.NOTIFICATION_USER_IDS_FOR_FAILED_TASKS.name]
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
                self.post_blob(
                    '/ml/trainedclassifierhandler',
                    self.payload_proto.SerializeToString(),
                    expected_status_int=500)
                # Check that there are now emails sent.
                messages = self._get_sent_email_messages(
                    feconf.ADMIN_EMAIL_ADDRESS)
                expected_subject = 'Failed ML Job'
                self.assertEqual(len(messages), 1)
                self.assertEqual(messages[0].subject, expected_subject)
                messages = (
                    self._get_sent_email_messages(self.CURRICULUM_ADMIN_EMAIL))
                self.assertEqual(len(messages), 1)
                self.assertEqual(messages[0].subject, expected_subject)

    def test_error_on_prod_mode_and_default_vm_id(self) -> None:
        # Turn off DEV_MODE.
        with self.swap(constants, 'DEV_MODE', False):
            self.post_blob(
                '/ml/trainedclassifierhandler',
                self.payload_proto.SerializeToString(), expected_status_int=401)

    def test_error_on_different_signatures(self) -> None:
        # Altering data to result in different signatures.
        self.payload_proto.job_result.job_id = 'different_job_id'
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=401)

    def test_error_on_invalid_classifier_data_in_message(self) -> None:
        # Altering message dict to result in invalid dict.
        self.payload_proto.job_result.ClearField('classifier_frozen_model')
        self.payload_proto.signature = classifier_services.generate_signature(
            self.secret.encode('utf-8'),
            self.payload_proto.job_result.SerializeToString(),
            self.payload_proto.vm_id)
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=400)

    def test_error_on_failed_training_job_status(self) -> None:
        classifier_training_job_model = (
            classifier_models.ClassifierTrainingJobModel.get(
                self.job_id, strict=True))
        classifier_training_job_model.status = (
            feconf.TRAINING_JOB_STATUS_FAILED)
        classifier_training_job_model.update_timestamps()
        classifier_training_job_model.put()

        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=500)

    def test_error_on_exception_in_store_classifier_data(self) -> None:
        classifier_training_job_model = (
            classifier_models.ClassifierTrainingJobModel.get(
                self.job_id, strict=True))
        classifier_training_job_model.state_name = 'invalid_state'
        classifier_training_job_model.update_timestamps()
        classifier_training_job_model.put()

        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=500)

    def test_get_trained_classifier_handler(self) -> None:
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=200)
        classifier_training_job = (
            classifier_services.get_classifier_training_job(
                self.exp_id, self.exploration.version, 'Home',
                self.algorithm_id))
        assert classifier_training_job is not None

        params = {
            'exploration_id': self.exp_id,
            'exploration_version': self.exploration.version,
            'state_name': 'Home',
        }
        response = self.get_json(
            '/ml/trainedclassifierhandler', params=params,
            expected_status_int=200)
        self.assertEqual(
            response['gcs_filename'],
            classifier_training_job.classifier_data_filename)

    def test_error_on_incorrect_exploration_id_for_retrieving_model(
        self
    ) -> None:
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=200)

        params = {
            'exploration_id': 'fake_exp',
            'exploration_version': self.exploration.version,
            'state_name': 'Home',
        }
        self.get_json(
            '/ml/trainedclassifierhandler', params=params,
            expected_status_int=400)

    def test_error_on_incorrect_state_name_for_retrieving_model(
        self
    ) -> None:
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=200)

        params = {
            'exploration_id': self.exp_id,
            'exploration_version': self.exploration.version,
            'state_name': 'fake_state',
        }
        self.get_json(
            '/ml/trainedclassifierhandler', params=params,
            expected_status_int=400)

    def test_error_on_incorrect_exp_version_for_retrieving_model(
        self
    ) -> None:
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=200)

        params = {
            'exploration_id': self.exp_id,
            'exploration_version': 3,
            'state_name': 'fake_state',
        }
        self.get_json(
            '/ml/trainedclassifierhandler', params=params,
            expected_status_int=400)

    def test_error_on_incomplete_training_job_for_retrieving_model(
        self
    ) -> None:
        params = {
            'exploration_id': self.exp_id,
            'exploration_version': self.exploration.version,
            'state_name': 'Home',
        }
        self.get_json(
            '/ml/trainedclassifierhandler', params=params,
            expected_status_int=404)

    def test_error_on_no_training_job_mapping_for_retrieving_model(
        self
    ) -> None:
        new_exp_id = 'new_exp'
        new_exp = self.save_new_default_exploration(
            new_exp_id, feconf.SYSTEM_COMMITTER_ID, title='New title')

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': new_exp.init_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'TextInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name':
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                'state_name': new_exp.init_state_name,
                'new_value': {
                    'placeholder': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': ''
                        }
                    },
                    'rows': {'value': 1}
                }
            })]

        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, new_exp_id, change_list, '')

        params = {
            'exploration_id': new_exp_id,
            'exploration_version': 2,
            'state_name': new_exp.init_state_name,
        }

        self.get_json(
            '/ml/trainedclassifierhandler', params=params,
            expected_status_int=400)

    def test_error_on_no_training_job_for_retrieving_model(self) -> None:
        new_exp_id = 'new_exp'
        new_exp = self.save_new_default_exploration(
            new_exp_id, feconf.SYSTEM_COMMITTER_ID, title='New title')

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': new_exp.init_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'NumericInput'
            }),
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name':
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                'state_name': new_exp.init_state_name,
                'new_value': {
                    'requireNonnegativeInput': {
                        'value': False
                    }
                }
            })]

        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, new_exp_id, change_list, '')

        params = {
            'exploration_id': new_exp_id,
            'exploration_version': new_exp.version,
            'state_name': new_exp.init_state_name,
        }

        self.get_json(
            '/ml/trainedclassifierhandler', params=params,
            expected_status_int=404)

    def test_training_job_migration_on_algorithm_id_change(self) -> None:
        params = {
            'exploration_id': self.exp_id,
            'exploration_version': self.exploration.version,
            'state_name': 'Home',
        }

        interaction_classifier_mapping = {
            'TextInput': {
                'algorithm_id': 'NewTextClassifier',
                'algorithm_version': 1
            },
        }

        with self.swap(
            feconf, 'INTERACTION_CLASSIFIER_MAPPING',
            interaction_classifier_mapping):
            self.get_json(
                '/ml/trainedclassifierhandler', params=params,
                expected_status_int=404)

        state_training_jobs_mapping = (
            classifier_services.get_state_training_jobs_mapping(
                self.exp_id, self.exploration.version, 'Home'))
        assert state_training_jobs_mapping is not None
        self.assertIn(
            'NewTextClassifier',
            state_training_jobs_mapping.algorithm_ids_to_job_ids)

        with self.swap(
            feconf, 'INTERACTION_CLASSIFIER_MAPPING',
            interaction_classifier_mapping):
            json_response = self.post_json(
                '/ml/nextjobhandler',
                self.payload_for_fetching_next_job_request,
                expected_status_int=200)

        self.assertEqual(
            state_training_jobs_mapping.algorithm_ids_to_job_ids[
                'NewTextClassifier'],
            json_response['job_id']
        )
        self.assertEqual(json_response['algorithm_id'], 'NewTextClassifier')
        self.assertEqual(json_response['algorithm_version'], 1)

    def test_training_job_migration_on_algorithm_version_change(self) -> None:
        self.post_blob(
            '/ml/trainedclassifierhandler',
            self.payload_proto.SerializeToString(), expected_status_int=200)

        params = {
            'exploration_id': self.exp_id,
            'exploration_version': self.exploration.version,
            'state_name': 'Home',
        }
        interaction_classifier_mapping = {
            'TextInput': {
                'algorithm_id': 'TextClassifier',
                'algorithm_version': 2
            },
        }

        with self.swap(
            feconf, 'INTERACTION_CLASSIFIER_MAPPING',
            interaction_classifier_mapping):
            self.get_json(
                '/ml/trainedclassifierhandler', params=params,
                expected_status_int=404)

        state_training_jobs_mapping = (
            classifier_services.get_state_training_jobs_mapping(
                self.exp_id, self.exploration.version, 'Home'))
        assert state_training_jobs_mapping is not None
        self.assertIn(
            'TextClassifier',
            state_training_jobs_mapping.algorithm_ids_to_job_ids)

        with self.swap(
            feconf, 'INTERACTION_CLASSIFIER_MAPPING',
            interaction_classifier_mapping):
            json_response = self.post_json(
                '/ml/nextjobhandler',
                self.payload_for_fetching_next_job_request,
                expected_status_int=200)

        self.assertEqual(
            state_training_jobs_mapping.algorithm_ids_to_job_ids[
                'TextClassifier'],
            json_response['job_id']
        )
        self.assertEqual(json_response['algorithm_id'], 'TextClassifier')
        self.assertEqual(json_response['algorithm_version'], 2)


class NextJobHandlerTest(test_utils.GenericTestBase):
    """Test the handler for fetching next training job."""

    def setUp(self) -> None:
        super().setUp()

        self.exp_id = 'exp_id1'
        self.title = 'Testing Classifier storing'
        self.category = 'Test'
        interaction_id = 'TextInput'
        self.algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_id']
        self.algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_version']
        self.training_data: List[Dict[str, Union[int, List[str]]]] = [
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
        self.classifier_data = text_classifier_pb2.TextClassifierFrozenModel()
        self.classifier_data.model_json = ''
        fs_services.save_classifier_data(
            self.exp_id, self.job_id, self.classifier_data)

        self.expected_response = {
            u'job_id': self.job_id,
            u'training_data': self.training_data,
            u'algorithm_id': self.algorithm_id,
            u'algorithm_version': self.algorithm_version
        }

        self.payload = {}
        self.payload['vm_id'] = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        self.payload['message'] = json.dumps({})
        self.payload['signature'] = classifier_services.generate_signature(
            secret.encode('utf-8'),
            self.payload['message'].encode('utf-8'),
            self.payload['vm_id'])

    def test_next_job_handler(self) -> None:
        json_response = self.post_json(
            '/ml/nextjobhandler', self.payload, expected_status_int=200)
        self.assertEqual(json_response, self.expected_response)
        classifier_services.mark_training_jobs_failed([self.job_id])
        json_response = self.post_json(
            '/ml/nextjobhandler', self.payload, expected_status_int=200)
        self.assertEqual(json_response, {})
