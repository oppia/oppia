# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for classifier domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import json
import re

from core.domain import algorithm_proto_registry
from core.domain import classifier_domain
from core.domain.proto import classifier_data_message_pb2
from core.domain.proto import text_classifier_pb2
from core.tests import test_utils
import feconf
import utils


class ClassifierTrainingJobDomainTests(test_utils.GenericTestBase):
    """Test the ClassifierTrainingJob domain."""

    def setUp(self):
        super(ClassifierTrainingJobDomainTests, self).setUp()

        self.training_data = [
            {
                'answer_group_index': 1,
                'answers': ['a1', 'a2']
            },
            {
                'answer_group_index': 2,
                'answers': ['a2', 'a3']
            }
        ]

        self.training_job_dict = {
            'job_id': 'exp_id1.SOME_RANDOM_STRING',
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'next_scheduled_check_time':
                datetime.datetime.strptime(
                    '2017-08-11 12:42:31', '%Y-%m-%d %H:%M:%S'),
            'state_name': 'some state',
            'algorithm_id': 'TextClassifier',
            'interaction_id': 'TextInput',
            'training_data': self.training_data,
            'status': 'NEW',
            'classifier_data': None,
            'algorithm_version': 1
        }

    def _get_training_job_from_dict(self, training_job_dict):
        """Returns the ClassifierTrainingJob object after receiving the content
        from the training_job_dict.
        """
        training_job = classifier_domain.ClassifierTrainingJob(
            training_job_dict['job_id'],
            training_job_dict['algorithm_id'],
            training_job_dict['interaction_id'],
            training_job_dict['exp_id'],
            training_job_dict['exp_version'],
            training_job_dict['next_scheduled_check_time'],
            training_job_dict['state_name'],
            training_job_dict['status'],
            training_job_dict['training_data'],
            training_job_dict['classifier_data'],
            training_job_dict['algorithm_version'])

        return training_job

    def test_to_dict(self):
        expected_training_job_dict = {
            'job_id': 'exp_id1.SOME_RANDOM_STRING',
            'algorithm_id': 'TextClassifier',
            'interaction_id': 'TextInput',
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'next_scheduled_check_time':
                datetime.datetime.strptime(
                    '2017-08-11 12:42:31', '%Y-%m-%d %H:%M:%S'),
            'state_name': 'a state name',
            'status': 'NEW',
            'training_data': [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ],
            'classifier_data': {},
            'algorithm_version': 1
        }
        observed_training_job = self._get_training_job_from_dict(
            expected_training_job_dict)
        self.assertDictEqual(
            expected_training_job_dict,
            observed_training_job.to_dict())

    def test_to_player_proto(self):
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.model_json = json.dumps({})

        expected_training_job_dict = {
            'job_id': 'exp_id1.SOME_RANDOM_STRING',
            'algorithm_id': 'TextClassifier',
            'interaction_id': 'TextInput',
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'next_scheduled_check_time':
                datetime.datetime.strptime(
                    '2017-08-11 12:42:31', '%Y-%m-%d %H:%M:%S'),
            'state_name': 'a state name',
            'status': 'NEW',
            'training_data': [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ],
            'classifier_data': classifier_data_proto,
            'algorithm_version': 1
        }

        expected_training_job_player_proto = (
            classifier_data_message_pb2.ClassifierDataMessage())
        expected_training_job_player_proto.algorithm_id = 'TextClassifier'
        expected_training_job_player_proto.text_classifier.CopyFrom(
            classifier_data_proto)
        expected_training_job_player_proto.algorithm_version = 1

        observed_training_job = self._get_training_job_from_dict(
            expected_training_job_dict)

        player_proto = observed_training_job.to_player_proto()
        self.assertEqual(
            player_proto.algorithm_id,
            expected_training_job_player_proto.algorithm_id)
        self.assertEqual(
            player_proto.algorithm_version,
            expected_training_job_player_proto.algorithm_version)
        self.assertEqual(
            player_proto.text_classifier.model_json,
            expected_training_job_player_proto.text_classifier.model_json)

    def test_exception_is_for_to_player_proto_with_invalid_algorith_id(self):
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.model_json = json.dumps({})

        expected_training_job_dict = {
            'job_id': 'exp_id1.SOME_RANDOM_STRING',
            'algorithm_id': 'FakeClassifier',
            'interaction_id': 'TextInput',
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'next_scheduled_check_time':
                datetime.datetime.strptime(
                    '2017-08-11 12:42:31', '%Y-%m-%d %H:%M:%S'),
            'state_name': 'a state name',
            'status': 'NEW',
            'training_data': [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ],
            'classifier_data': classifier_data_proto,
            'algorithm_version': 1
        }

        observed_training_job = self._get_training_job_from_dict(
            expected_training_job_dict)
        with self.assertRaisesRegexp(
            Exception, 'No protobuf class found for classifier with '
            'FakeClassifier algorithm id and 1 algorithm version'):
            observed_training_job.to_player_proto()

    def test_exception_is_for_to_player_proto_with_invalid_algorith_version(
            self):
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.model_json = json.dumps({})

        expected_training_job_dict = {
            'job_id': 'exp_id1.SOME_RANDOM_STRING',
            'algorithm_id': 'TextClassifier',
            'interaction_id': 'TextInput',
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'next_scheduled_check_time':
                datetime.datetime.strptime(
                    '2017-08-11 12:42:31', '%Y-%m-%d %H:%M:%S'),
            'state_name': 'a state name',
            'status': 'NEW',
            'training_data': [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ],
            'classifier_data': classifier_data_proto,
            'algorithm_version': 1000
        }

        observed_training_job = self._get_training_job_from_dict(
            expected_training_job_dict)
        with self.assertRaisesRegexp(
            Exception, 'No protobuf class found for classifier with '
            'TextClassifier algorithm id and 1000 algorithm version'):
            observed_training_job.to_player_proto()

    def test_exception_is_raised_for_to_player_proto_with_no_classifier_data(
            self):
        expected_training_job_dict = {
            'job_id': 'exp_id1.SOME_RANDOM_STRING',
            'algorithm_id': 'TextClassifier',
            'interaction_id': 'TextInput',
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'next_scheduled_check_time':
                datetime.datetime.strptime(
                    '2017-08-11 12:42:31', '%Y-%m-%d %H:%M:%S'),
            'state_name': 'a state name',
            'status': 'NEW',
            'training_data': [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ],
            'classifier_data': None,
            'algorithm_version': 1
        }

        observed_training_job = self._get_training_job_from_dict(
            expected_training_job_dict)
        with self.assertRaisesRegexp(
            Exception, 'No classifier data found'):
            observed_training_job.to_player_proto()

    def test_validation_exp_id(self):
        self.training_job_dict['exp_id'] = 1
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected exp_id to be a string'):
            training_job.validate()

    def test_validation_state_name(self):
        self.training_job_dict['state_name'] = 0
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected state to be a string'):
            training_job.validate()

    def test_validation_status(self):
        self.training_job_dict['status'] = 'invalid_status'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            re.escape(
                'Expected status to be in %s'
                % (feconf.ALLOWED_TRAINING_JOB_STATUSES))):
            training_job.validate()

    def test_validation_interaction_id_type(self):
        self.training_job_dict['interaction_id'] = 0
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected interaction_id to be a string'):
            training_job.validate()

    def test_validation_interaction_id(self):
        self.training_job_dict['interaction_id'] = 'invalid_interaction_id'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid interaction id'):
            training_job.validate()

    def test_validation_algorithm_id(self):
        self.training_job_dict['algorithm_id'] = 0
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected algorithm_id to be a string'):
            training_job.validate()

    def test_validation_data_schema_version(self):
        self.training_job_dict['algorithm_version'] = (
            'invalid_algorithm_version')
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected algorithm_version to be an int'):
            training_job.validate()

    def test_validation_classifier_data(self):
        expected_classifier_data_type = (
            algorithm_proto_registry.Registry.
            get_proto_attribute_type_for_algorithm(
                self.training_job_dict['algorithm_id'],
                self.training_job_dict['algorithm_version']))
        self.training_job_dict['classifier_data'] = 'invalid_classifier_data'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected classifier_data to be a %s|None' % (
                expected_classifier_data_type.__class__.__name__)):
            training_job.validate()

    def test_validation_training_data_without_answer_group_index(self):
        self.training_job_dict['training_data'] = [
            {
                'answers': ['a1', 'a2']
            }
        ]
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected answer_group_index to be a key in training_data'
            'list item'):
            training_job.validate()

    def test_validation_training_data_without_answers(self):
        self.training_job_dict['training_data'] = [
            {
                'answer_group_index': 1
            }
        ]
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected answers to be a key in training_data list item'):
            training_job.validate()

    def test_validation_training_data_with_invalid_answer_group_index_type(
            self):
        self.training_job_dict['training_data'] = [
            {
                'answer_group_index': 'invalid_answer_group_index',
                'answers': ['a1', 'a2']
            }
        ]
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected answer_group_index to be an int'):
            training_job.validate()

    def test_validation_training_data_with_invalid_answers_type(self):
        self.training_job_dict['training_data'] = [
            {
                'answer_group_index': 1,
                'answers': 'invalid_answers'
            }
        ]
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected answers to be a list'):
            training_job.validate()

    def test_validation_for_training_job_with_correct_data(self):
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        training_job.validate()

    def test_validation_with_invalid_job_id(self):
        self.training_job_dict['job_id'] = 1
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected id to be a string'):
            training_job.validate()

    def test_validation_with_invalid_exp_version(self):
        self.training_job_dict['exp_version'] = 'abc'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected exp_version to be an int'):
            training_job.validate()

    def test_validation_with_invalid_next_scheduled_check_time(self):
        self.training_job_dict['next_scheduled_check_time'] = 'abc'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected next_scheduled_check_time to be datetime'):
            training_job.validate()

    def test_validation_with_invalid_state_name(self):
        self.training_job_dict['state_name'] = 'A string #'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid character # in the state name'):
            training_job.validate()

    def test_validation_with_invalid_algorithm_id(self):
        self.training_job_dict['algorithm_id'] = 'abc'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid algorithm id'):
            training_job.validate()

    def test_validation_with_invalid_training_data(self):
        self.training_job_dict['training_data'] = {}
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected training_data to be a list'):
            training_job.validate()


class TrainingJobExplorationMappingDomainTests(test_utils.GenericTestBase):
    """Tests for the TrainingJobExplorationMapping domain."""

    def setUp(self):
        super(TrainingJobExplorationMappingDomainTests, self).setUp()

        self.mapping_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 2,
            'state_name': u'網站有中',
            'algorithm_id_to_job_id_map': {'TextClassifier': 'job_id1'}
        }

    def _get_mapping_from_dict(self, mapping_dict):
        """Returns the TrainingJobExplorationMapping object after receiving the
        content from the mapping_dict.
        """
        mapping = classifier_domain.TrainingJobExplorationMapping(
            mapping_dict['exp_id'],
            mapping_dict['exp_version'],
            mapping_dict['state_name'],
            mapping_dict['algorithm_id_to_job_id_map'])

        return mapping

    def test_to_dict(self):
        expected_mapping_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 2,
            'state_name': u'網站有中',
            'algorithm_id_to_job_id_map': {'TextClassifier': 'job_id1'}
        }
        observed_mapping = self._get_mapping_from_dict(
            expected_mapping_dict)
        self.assertDictEqual(
            expected_mapping_dict,
            observed_mapping.to_dict())

    def test_validation_for_mapping_with_correct_data(self):
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        mapping.validate()

    def test_validation_with_invalid_exp_id(self):
        self.mapping_dict['exp_id'] = 1
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected exp_id to be a string'):
            mapping.validate()

    def test_validation_with_invalid_exp_version(self):
        self.mapping_dict['exp_version'] = '1'
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected exp_version to be an int'):
            mapping.validate()

    def test_validation_with_invalid_algorithm_id_to_job_id_map(self):
        self.mapping_dict['algorithm_id_to_job_id_map'] = 0
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected algorithm_id_to_job_id_map to be a dict'):
            mapping.validate()

    def test_validation_with_invalid_algorithm_id_in_algorithm_to_job_map(self):
        self.mapping_dict['algorithm_id_to_job_id_map'] = {123: 'job_id'}
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected algorithm_id to be str'):
            mapping.validate()

    def test_validation_with_invalid_job_id_in_algorithm_to_job_map(self):
        self.mapping_dict['algorithm_id_to_job_id_map'] = {'algorithm_id': 12}
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected job_id to be str'):
            mapping.validate()

    def test_validation_with_invalid_state_name(self):
        self.mapping_dict['state_name'] = 0
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected state_name to be a string'):
            mapping.validate()
