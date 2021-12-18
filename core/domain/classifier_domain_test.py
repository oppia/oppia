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

from __future__ import annotations

import datetime
import re

from core import feconf
from core import utils
from core.domain import classifier_domain
from core.tests import test_utils


class ClassifierTrainingJobDomainTests(test_utils.GenericTestBase):
    """Test the ClassifierTrainingJob domain."""

    def setUp(self) -> None:
        super(ClassifierTrainingJobDomainTests, self).setUp()

        self.training_data: classifier_domain.TrainingDataType = [
            {
                'answer_group_index': 1,
                'answers': ['a1', 'a2']
            },
            {
                'answer_group_index': 2,
                'answers': ['a2', 'a3']
            }
        ]

        self.training_job_dict: classifier_domain.ClassifierTrainingJobDict = {
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
            'algorithm_version': 1
        }

    def _get_training_job_from_dict(
        self,
        training_job_dict: classifier_domain.ClassifierTrainingJobDict
    ) -> classifier_domain.ClassifierTrainingJob:
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
            training_job_dict['algorithm_version'])

        return training_job

    def test_to_dict(self) -> None:
        expected_training_job_dict: (
            classifier_domain.ClassifierTrainingJobDict
        ) = {
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
            'algorithm_version': 1
        }
        observed_training_job = self._get_training_job_from_dict(
            expected_training_job_dict)
        # The 'assertDictEqual' expects 'Dict[Any, Any]' but we
        # provide 'TypedDict' and thus we add an ignore.
        self.assertDictEqual(
            expected_training_job_dict, # type: ignore[arg-type]
            observed_training_job.to_dict()) # type: ignore[arg-type]

    def test_validation_status(self) -> None:
        self.training_job_dict['status'] = 'invalid_status'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError,
            re.escape(
                'Expected status to be in %s'
                % (feconf.ALLOWED_TRAINING_JOB_STATUSES))):
            training_job.validate()

    def test_validation_interaction_id(self) -> None:
        self.training_job_dict['interaction_id'] = 'invalid_interaction_id'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Invalid interaction id'):
            training_job.validate()

    def test_validation_training_data_without_answer_group_index(self) -> None:
        self.training_job_dict['training_data'] = [
            {
                'answers': ['a1', 'a2']
            }
        ]
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError,
            'Expected answer_group_index to be a key in training_data'
            'list item'):
            training_job.validate()

    def test_validation_training_data_without_answers(self) -> None:
        self.training_job_dict['training_data'] = [
            {
                'answer_group_index': 1
            }
        ]
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError,
            'Expected answers to be a key in training_data list item'):
            training_job.validate()

    def test_validation_for_training_job_with_correct_data(self) -> None:
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        training_job.validate()

    def test_validation_with_invalid_state_name(self) -> None:
        self.training_job_dict['state_name'] = 'A string #'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Invalid character # in the state name'):
            training_job.validate()

    def test_validation_with_invalid_algorithm_id(self) -> None:
        self.training_job_dict['algorithm_id'] = 'abc'
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Invalid algorithm id'):
            training_job.validate()

    def test_validation_with_invalid_training_data(self) -> None:
        self.training_job_dict['training_data'] = {}
        training_job = self._get_training_job_from_dict(self.training_job_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Expected training_data to be a list'):
            training_job.validate()


class StateTrainingJobsMappingDomainTests(test_utils.GenericTestBase):
    """Tests for the StateTrainingJobsMapping domain."""

    def setUp(self) -> None:
        super(StateTrainingJobsMappingDomainTests, self).setUp()

        self.mapping_dict: classifier_domain.StateTrainingJobsMappingDict = {
            'exp_id': 'exp_id1',
            'exp_version': 2,
            'state_name': u'網站有中',
            'algorithm_ids_to_job_ids': {'TextClassifier': 'job_id1'}
        }

    def _get_mapping_from_dict(
        self,
        mapping_dict: classifier_domain.StateTrainingJobsMappingDict
    ) -> classifier_domain.StateTrainingJobsMapping:
        """Returns the StateTrainingJobsMapping object after receiving the
        content from the mapping_dict.
        """
        mapping = classifier_domain.StateTrainingJobsMapping(
            mapping_dict['exp_id'],
            mapping_dict['exp_version'],
            mapping_dict['state_name'],
            mapping_dict['algorithm_ids_to_job_ids'])

        return mapping

    def test_to_dict(self) -> None:
        expected_mapping_dict: (
            classifier_domain.StateTrainingJobsMappingDict
        ) = {
            'exp_id': 'exp_id1',
            'exp_version': 2,
            'state_name': u'網站有中',
            'algorithm_ids_to_job_ids': {'TextClassifier': 'job_id1'}
        }
        observed_mapping = self._get_mapping_from_dict(
            expected_mapping_dict)
        # The 'assertDictEqual' expects 'Dict[Any, Any]' but we
        # provide 'TypedDict' and thus we add an ignore.
        self.assertDictEqual(
            expected_mapping_dict, # type: ignore[arg-type]
            observed_mapping.to_dict()) # type: ignore[arg-type]

    def test_validation_for_mapping_with_correct_data(self) -> None:
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        mapping.validate()

    def test_exp_version_with_invalid_data(self) -> None:
        self.mapping_dict['exp_version'] = -2
        mapping = self._get_mapping_from_dict(self.mapping_dict)
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Expected version to be greater than 0'):
            mapping.validate()
