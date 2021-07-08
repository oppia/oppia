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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for core.storage.classifier.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from core.domain import classifier_domain
from core.platform import models
from core.tests import test_utils
import feconf

(base_models, classifier_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.classifier])


class ClassifierTrainingJobModelUnitTests(test_utils.GenericTestBase):
    """Test the ClassifierTrainingJobModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            classifier_models.ClassifierTrainingJobModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_new_training_job_runs_successfully(self):
        next_scheduled_check_time = datetime.datetime.utcnow()
        job_id = classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', 'exp_id1', 1,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name2', feconf.TRAINING_JOB_STATUS_NEW, 1)

        training_job = (
            classifier_models.ClassifierTrainingJobModel.get(job_id))

        self.assertEqual(training_job.algorithm_id, 'TextClassifier')
        self.assertEqual(training_job.interaction_id, 'TextInput')
        self.assertEqual(training_job.exp_id, 'exp_id1')
        self.assertEqual(training_job.exp_version, 1)
        self.assertEqual(training_job.state_name, 'state_name2')
        self.assertEqual(
            training_job.status,
            feconf.TRAINING_JOB_STATUS_NEW)
        self.assertEqual(
            training_job.training_data,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}])
        self.assertEqual(training_job.algorithm_version, 1)

    def test_query_new_and_pending_training_jobs(self):
        next_scheduled_check_time = datetime.datetime.utcnow()
        classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', 'exp_id1', 1,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name2', feconf.TRAINING_JOB_STATUS_NEW, 1)
        classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', 'exp_id2', 2,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name2', feconf.TRAINING_JOB_STATUS_PENDING, 1)
        classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', 'exp_id3', 3,
            next_scheduled_check_time + datetime.timedelta(
                minutes=feconf.CLASSIFIER_JOB_TTL_MINS),
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name2', feconf.TRAINING_JOB_STATUS_PENDING, 1)
        classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', 'exp_id4', 4,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'state_name2', feconf.TRAINING_JOB_STATUS_FAILED, 1)

        training_jobs, offset = (
            classifier_models.ClassifierTrainingJobModel.
            query_new_and_pending_training_jobs(0))

        self.assertEqual(len(training_jobs), 2)
        self.assertEqual(training_jobs[0].algorithm_id, 'TextClassifier')
        self.assertEqual(training_jobs[0].interaction_id, 'TextInput')
        self.assertEqual(training_jobs[0].exp_id, 'exp_id1')
        self.assertEqual(training_jobs[0].exp_version, 1)
        self.assertEqual(
            training_jobs[0].next_scheduled_check_time,
            next_scheduled_check_time)
        self.assertEqual(training_jobs[0].state_name, 'state_name2')
        self.assertEqual(
            training_jobs[0].status,
            feconf.TRAINING_JOB_STATUS_NEW)
        self.assertEqual(
            training_jobs[0].training_data,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}])
        self.assertEqual(
            training_jobs[1].status,
            feconf.TRAINING_JOB_STATUS_PENDING)
        self.assertEqual(offset, 2)

    def test_query_new_and_pending_training_jobs_with_non_zero_offset(self):
        with self.swap(
            classifier_models, 'NEW_AND_PENDING_TRAINING_JOBS_FETCH_LIMIT', 2):
            next_scheduled_check_time = datetime.datetime.utcnow()
            # Creating 6 jobs out of which 4 will be fetched in steps.
            classifier_models.ClassifierTrainingJobModel.create(
                'TextClassifier', 'TextInput', 'exp_id01', 1,
                next_scheduled_check_time,
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
                'state_name2', feconf.TRAINING_JOB_STATUS_NEW, 1)
            classifier_models.ClassifierTrainingJobModel.create(
                'TextClassifier', 'TextInput', 'exp_id02', 2,
                next_scheduled_check_time,
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
                'state_name2', feconf.TRAINING_JOB_STATUS_PENDING, 1)
            classifier_models.ClassifierTrainingJobModel.create(
                'TextClassifier', 'TextInput', 'exp_id03', 3,
                next_scheduled_check_time + datetime.timedelta(
                    minutes=feconf.CLASSIFIER_JOB_TTL_MINS),
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
                'state_name2', feconf.TRAINING_JOB_STATUS_PENDING, 1)
            classifier_models.ClassifierTrainingJobModel.create(
                'TextClassifier', 'TextInput', 'exp_id04', 4,
                next_scheduled_check_time,
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
                'state_name2', feconf.TRAINING_JOB_STATUS_FAILED, 1)
            classifier_models.ClassifierTrainingJobModel.create(
                'TextClassifier', 'TextInput', 'exp_id05', 1,
                next_scheduled_check_time,
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
                'state_name2', feconf.TRAINING_JOB_STATUS_NEW, 1)
            classifier_models.ClassifierTrainingJobModel.create(
                'TextClassifier', 'TextInput', 'exp_id06', 1,
                next_scheduled_check_time,
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
                'state_name2', feconf.TRAINING_JOB_STATUS_PENDING, 1)

            training_jobs, offset = (
                classifier_models.ClassifierTrainingJobModel.
                query_new_and_pending_training_jobs(0))

            self.assertEqual(len(training_jobs), 2)
            self.assertEqual(training_jobs[0].algorithm_id, 'TextClassifier')
            self.assertEqual(training_jobs[0].interaction_id, 'TextInput')
            self.assertEqual(training_jobs[0].exp_id, 'exp_id01')
            self.assertEqual(training_jobs[0].exp_version, 1)
            self.assertEqual(
                training_jobs[0].next_scheduled_check_time,
                next_scheduled_check_time)
            self.assertEqual(training_jobs[0].state_name, 'state_name2')
            self.assertEqual(
                training_jobs[0].status,
                feconf.TRAINING_JOB_STATUS_NEW)
            self.assertEqual(
                training_jobs[0].training_data,
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}])
            self.assertEqual(
                training_jobs[1].status,
                feconf.TRAINING_JOB_STATUS_PENDING)
            self.assertEqual(offset, 2)

            training_jobs, offset = (
                classifier_models.ClassifierTrainingJobModel.
                query_new_and_pending_training_jobs(offset))

            self.assertEqual(len(training_jobs), 2)
            self.assertEqual(training_jobs[0].algorithm_id, 'TextClassifier')
            self.assertEqual(training_jobs[0].interaction_id, 'TextInput')
            self.assertEqual(training_jobs[0].exp_id, 'exp_id05')
            self.assertEqual(training_jobs[0].exp_version, 1)
            self.assertEqual(
                training_jobs[0].next_scheduled_check_time,
                next_scheduled_check_time)
            self.assertEqual(training_jobs[0].state_name, 'state_name2')
            self.assertEqual(
                training_jobs[0].status,
                feconf.TRAINING_JOB_STATUS_NEW)
            self.assertEqual(
                training_jobs[0].training_data,
                [{'answer_group_index': 1, 'answers': ['a1', 'a2']}])
            self.assertEqual(
                training_jobs[1].status,
                feconf.TRAINING_JOB_STATUS_PENDING)
            self.assertEqual(offset, 4)

    def test_create_multi_jobs(self):
        next_scheduled_check_time = datetime.datetime.utcnow()
        job_dicts_list = []
        job_dicts_list.append({
            'exp_id': u'1',
            'exp_version': 1,
            'next_scheduled_check_time': next_scheduled_check_time,
            'state_name': 'Home',
            'interaction_id': 'TextInput',
            'algorithm_id': feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'],
            'training_data': [],
            'status': feconf.TRAINING_JOB_STATUS_NEW,
            'algorithm_version': 1
        })
        job_dicts_list.append({
            'exp_id': u'1',
            'exp_version': 2,
            'next_scheduled_check_time': next_scheduled_check_time,
            'state_name': 'Home',
            'interaction_id': 'TextInput',
            'algorithm_id': feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'],
            'training_data': [],
            'status': feconf.TRAINING_JOB_STATUS_NEW,
            'algorithm_version': 1
        })

        job_ids = classifier_models.ClassifierTrainingJobModel.create_multi(
            job_dicts_list)
        self.assertEqual(len(job_ids), 2)

        training_job1 = (
            classifier_models.ClassifierTrainingJobModel.get(job_ids[0]))
        self.assertEqual(
            training_job1.algorithm_id,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'])
        self.assertEqual(
            training_job1.interaction_id,
            'TextInput')
        self.assertEqual(training_job1.exp_id, '1')
        self.assertEqual(training_job1.exp_version, 1)
        self.assertEqual(training_job1.training_data, [])
        self.assertEqual(training_job1.state_name, 'Home')
        self.assertEqual(
            training_job1.status,
            feconf.TRAINING_JOB_STATUS_NEW)
        self.assertEqual(training_job1.algorithm_version, 1)

        training_job2 = (
            classifier_models.ClassifierTrainingJobModel.get(job_ids[1]))
        self.assertEqual(
            training_job2.algorithm_id,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'])
        self.assertEqual(
            training_job2.interaction_id,
            'TextInput')
        self.assertEqual(training_job2.exp_id, '1')
        self.assertEqual(training_job2.exp_version, 2)
        self.assertEqual(training_job2.training_data, [])
        self.assertEqual(training_job2.state_name, 'Home')
        self.assertEqual(
            training_job2.status,
            feconf.TRAINING_JOB_STATUS_NEW)
        self.assertEqual(training_job2.algorithm_version, 1)

    def test_raise_exception_by_mocking_collision(self):
        next_scheduled_check_time = datetime.datetime.utcnow()

        with self.assertRaisesRegexp(
            Exception, 'The id generator for ClassifierTrainingJobModel is '
            'producing too many collisions.'
            ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                classifier_models.ClassifierTrainingJobModel, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    classifier_models.ClassifierTrainingJobModel)):
                classifier_models.ClassifierTrainingJobModel.create(
                    'TextClassifier', 'TextInput', 'exp_id1', 1,
                    next_scheduled_check_time,
                    [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
                    'state_name2', feconf.TRAINING_JOB_STATUS_NEW, 1)


class StateTrainingJobsMappingModelUnitTests(test_utils.GenericTestBase):
    """Tests for the StateTrainingJobsMappingModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            classifier_models.StateTrainingJobsMappingModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_new_mapping_runs_successfully(self):
        mapping_id = (
            classifier_models.StateTrainingJobsMappingModel.create(
                'exp_id1', 2, 'state_name4', {'algorithm_id': 'job_id4'}))

        mapping = classifier_models.StateTrainingJobsMappingModel.get(
            mapping_id)

        self.assertEqual(mapping.exp_id, 'exp_id1')
        self.assertEqual(mapping.exp_version, 2)
        self.assertEqual(mapping.state_name, 'state_name4')
        self.assertEqual(
            mapping.algorithm_ids_to_job_ids, {'algorithm_id': 'job_id4'})

        # Test that exception is raised when creating mapping with same id.
        with self.assertRaisesRegexp(Exception, (
            'A model with the same ID already exists.')):
            mapping_id = (
                classifier_models.StateTrainingJobsMappingModel.create(
                    'exp_id1', 2, 'state_name4', {'algorithm_id': 'job_id4'}))

        # Test that state names with unicode characters get saved correctly.
        state_name1 = u'Klüft'
        mapping_id = (
            classifier_models.StateTrainingJobsMappingModel.create(
                'exp_id1', 2, state_name1, {'algorithm_id': 'job_id4'}))

        mapping = classifier_models.StateTrainingJobsMappingModel.get(
            mapping_id)

        self.assertEqual(mapping_id, b'exp_id1.2.%s' % (state_name1.encode(
            encoding='utf-8')))

        state_name2 = u'टेक्स्ट'
        mapping_id = (
            classifier_models.StateTrainingJobsMappingModel.create(
                'exp_id1', 2, state_name2, {'algorithm_id': 'job_id4'}))

        mapping = classifier_models.StateTrainingJobsMappingModel.get(
            mapping_id)

        self.assertEqual(mapping_id, b'exp_id1.2.%s' % (state_name2.encode(
            encoding='utf-8')))

    def test_get_model_from_exploration_attributes(self):
        exp_id = 'exp_id1'
        exp_version = 1
        state_name = 'state_name1'
        job_id = 'job_id1'
        classifier_models.StateTrainingJobsMappingModel.create(
            exp_id, exp_version, state_name, {'algorithm_id': job_id})

        mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_models(
                exp_id, exp_version, [state_name]))

        self.assertEqual(len(mappings), 1)
        self.assertEqual(mappings[0].exp_id, exp_id)
        self.assertEqual(mappings[0].exp_version, 1)
        self.assertEqual(mappings[0].state_name, state_name)
        self.assertDictEqual(
            mappings[0].algorithm_ids_to_job_ids, {'algorithm_id': job_id})

    def test_create_multi_mappings(self):
        state_training_jobs_mappings = []
        state_training_jobs_mappings.append(
            classifier_domain.StateTrainingJobsMapping(
                u'1', 1, 'Home', {'algorithm_id': 'job_id1'}))
        state_training_jobs_mappings.append(
            classifier_domain.StateTrainingJobsMapping(
                u'1', 2, 'Home', {'algorithm_id': 'job_id2'}))

        mapping_ids = (
            classifier_models.StateTrainingJobsMappingModel.create_multi(
                state_training_jobs_mappings))
        self.assertEqual(len(mapping_ids), 2)

        mapping1 = (
            classifier_models.StateTrainingJobsMappingModel.get(
                mapping_ids[0]))
        self.assertEqual(mapping1.exp_id, '1')
        self.assertEqual(mapping1.exp_version, 1)
        self.assertDictEqual(
            mapping1.algorithm_ids_to_job_ids, {'algorithm_id': 'job_id1'})
        self.assertEqual(mapping1.state_name, 'Home')

        mapping2 = (
            classifier_models.StateTrainingJobsMappingModel.get(
                mapping_ids[1]))
        self.assertEqual(mapping2.exp_id, '1')
        self.assertEqual(mapping2.exp_version, 2)
        self.assertEqual(
            mapping2.algorithm_ids_to_job_ids, {'algorithm_id': 'job_id2'})
        self.assertEqual(mapping2.state_name, 'Home')
