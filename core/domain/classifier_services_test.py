# coding: utf-8
#
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

"""Tests for classifier services"""

import os

from core.domain import classifier_domain
from core.domain import classifier_registry
from core.domain import classifier_services
from core.domain import exp_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(classifier_models,) = models.Registry.import_models(
    [models.NAMES.classifier])

class ClassifierServicesTests(test_utils.GenericTestBase):
    """Test "classify" using the sample explorations.

    Since the end to end tests cover correct classification, and frontend tests
    test hard rules, ReaderClassifyTests is only checking that the string
    classifier is actually called.
    """
    def setUp(self):
        super(ClassifierServicesTests, self).setUp()
        self._init_classify_inputs('16')

    def _init_classify_inputs(self, exploration_id):
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
            assets_list)

        self.exp_id = exploration_id
        self.exp_state = (
            exp_services.get_exploration_by_id(exploration_id).states['Home'])

    def _is_string_classifier_called(self, answer):
        sc = classifier_registry.Registry.get_classifier_by_algorithm_id(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'])
        string_classifier_predict = (
            sc.__class__.predict)
        predict_counter = test_utils.CallCounter(
            string_classifier_predict)

        with self.swap(sc.__class__, 'predict', predict_counter):
            response = classifier_services.classify(self.exp_state, answer)

        answer_group_index = response['answer_group_index']
        rule_spec_index = response['rule_spec_index']
        answer_groups = self.exp_state.interaction.answer_groups
        if answer_group_index == len(answer_groups):
            return 'default'

        answer_group = answer_groups[answer_group_index]
        return (answer_group.get_classifier_rule_index() == rule_spec_index and
                predict_counter.times_called == 1)

    def test_string_classifier_classification(self):
        """All these responses trigger the string classifier."""

        with self.swap(feconf, 'ENABLE_STRING_CLASSIFIER', True):
            self.assertTrue(
                self._is_string_classifier_called(
                    'it\'s a permutation of 3 elements'))
            self.assertTrue(
                self._is_string_classifier_called(
                    'There are 3 options for the first ball, and 2 for the '
                    'remaining two. So 3*2=6.'))
            self.assertTrue(
                self._is_string_classifier_called('abc acb bac bca cbb cba'))
            self.assertTrue(
                self._is_string_classifier_called('dunno, just guessed'))

    def test_create_jobs_and_update_mappings(self):
        """Test the create_classifier_training_jobs method and
        update_classifier_exploration_mappings method by triggering
        update_exploration() method.
        """
        exploration = exp_services.get_exploration_by_id(self.exp_id)
        state = exploration.states['Home']

        # Now, there should be no jobs in the data store.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 0)

        # Modify such that job creation is triggered.
        state.interaction.answer_groups.insert(
            3, state.interaction.answer_groups[1])
        answer_groups = []
        for answer_group in state.interaction.answer_groups:
            answer_groups.append(answer_group.to_dict())
        change_list = [{
            'cmd': 'edit_state_property',
            'state_name': 'Home',
            'property_name': 'answer_groups',
            'new_value': answer_groups
        }]
        with self.swap(feconf, 'ENABLE_STRING_CLASSIFIER', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should be one job in the data store now.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 1)
        for job in all_jobs:
            job_id = job.id

        # Create classifier as an effect of the job.
        classifier_data = {
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
            '_c_l': []
        }
        classifier_services.create_classifier(job_id, classifier_data)

        # Make a change to the exploration without changing the answer groups
        # to trigger mapping update.
        change_list = [{
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'New title'
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should be one mapping in the data store now.
        all_mappings = (
            classifier_models.ClassifierExplorationMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 1)

        # Check that renaming a state does not create an extra job.
        change_list = [{
            'cmd': 'rename_state',
            'old_state_name': 'Home',
            'new_state_name': 'Home2'
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should still be only one job in the data store now.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 1)

    def test_retrieval_of_classifiers(self):
        """Test the get_classifier_by_id method."""

        with self.assertRaisesRegexp(Exception, (
            "Entity for class ClassifierDataModel with id fake_id not found")):
            classifier_services.get_classifier_by_id('fake_id')

        exp_id = u'1'
        classifier_id = u'1'
        state = 'Home'
        classifier_id = classifier_models.ClassifierDataModel.create(
            classifier_id, exp_id, 1, state,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'], [], 1)
        classifier = classifier_services.get_classifier_by_id(
            classifier_id)
        self.assertEqual(classifier.exp_id, exp_id)
        self.assertEqual(classifier.state_name, state)
        self.assertEqual(classifier.id, classifier_id)

    def test_deletion_of_classifiers(self):
        """Test the delete_classifier method."""

        with self.assertRaisesRegexp(Exception, (
            "Entity for class ClassifierDataModel with id fake_id not found")):
            classifier_services.delete_classifier('fake_id')

        exp_id = u'1'
        classifier_id = u'1'
        state = 'Home'
        classifier_id = classifier_models.ClassifierDataModel.create(
            classifier_id, exp_id, 1, state,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'], [], 1)
        classifier_services.delete_classifier(classifier_id)
        with self.assertRaisesRegexp(Exception, (
            "Entity for class ClassifierDataModel with id %s not found" %(
                classifier_id))):
            classifier_services.get_classifier_by_id(classifier_id)

    def test_creation_of_classifiers(self):
        """Test the create_classifier method."""

        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'
        classifier_data = {
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
            '_c_l': []
        }
        job_id = classifier_services.create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING[interaction_id][
                'algorithm_id'], interaction_id, exp_id, 1, state_name,
            [], feconf.TRAINING_JOB_STATUS_NEW)
        classifier_id = (
            classifier_services.create_classifier(job_id, classifier_data))
        classifier = classifier_services.get_classifier_by_id(
            classifier_id)
        self.assertEqual(classifier.exp_id, exp_id)
        self.assertEqual(classifier.state_name, state_name)
        self.assertEqual(classifier.id, classifier_id)

    def test_retrieval_of_classifier_training_jobs(self):
        """Test the get_classifier_training_job_by_id method."""

        with self.assertRaisesRegexp(Exception, (
            'Entity for class ClassifierTrainingJobModel with id fake_id '
            'not found')):
            classifier_services.get_classifier_training_job_by_id('fake_id')

        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'
        job_id = classifier_models.ClassifierTrainingJobModel.create(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput']['algorithm_id'],
            interaction_id, exp_id, 1, [], state_name,
            feconf.TRAINING_JOB_STATUS_NEW)
        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(classifier_training_job.algorithm_id,
                         feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                             'algorithm_id'])
        self.assertEqual(classifier_training_job.interaction_id, interaction_id)
        self.assertEqual(classifier_training_job.exp_id, exp_id)
        self.assertEqual(classifier_training_job.exp_version, 1)
        self.assertEqual(classifier_training_job.training_data, [])
        self.assertEqual(classifier_training_job.state_name, state_name)
        self.assertEqual(classifier_training_job.status,
                         feconf.TRAINING_JOB_STATUS_NEW)

    def test_deletion_of_classifier_training_jobs(self):
        """Test the delete_classifier_training_job method."""

        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'
        job_id = classifier_models.ClassifierTrainingJobModel.create(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput']['algorithm_id'],
            interaction_id, exp_id, 1, [], state_name,
            feconf.TRAINING_JOB_STATUS_NEW)
        self.assertTrue(job_id)
        classifier_services.delete_classifier_training_job(job_id)
        with self.assertRaisesRegexp(Exception, (
            'Entity for class ClassifierTrainingJobModel '
            'with id %s not found' %(
                job_id))):
            classifier_services.get_classifier_training_job_by_id(job_id)

    def test_create_multi_jobs(self):
        """Test the create_multi_classifier_training_jobs method."""

        job_dicts_list = []
        job_dicts_list.append({
            'exp_id': u'1',
            'exp_version': 1,
            'state_name': 'Home',
            'interaction_id': 'TextInput',
            'algorithm_id': feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'],
            'training_data': [],
            'status': feconf.TRAINING_JOB_STATUS_NEW
        })
        job_dicts_list.append({
            'exp_id': u'1',
            'exp_version': 2,
            'state_name': 'Home',
            'interaction_id': 'TextInput',
            'algorithm_id': feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'],
            'training_data': [],
            'status': feconf.TRAINING_JOB_STATUS_NEW
        })

        job_ids = classifier_services.create_multi_classifier_training_jobs(
            job_dicts_list)
        self.assertEqual(len(job_ids), 2)

        classifier_training_job1 = (
            classifier_services.get_classifier_training_job_by_id(job_ids[0]))
        self.assertEqual(classifier_training_job1.algorithm_id,
                         feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                             'algorithm_id'])
        self.assertEqual(classifier_training_job1.interaction_id,
                         'TextInput')
        self.assertEqual(classifier_training_job1.exp_id, '1')
        self.assertEqual(classifier_training_job1.exp_version, 1)
        self.assertEqual(classifier_training_job1.training_data, [])
        self.assertEqual(classifier_training_job1.state_name, 'Home')
        self.assertEqual(classifier_training_job1.status,
                         feconf.TRAINING_JOB_STATUS_NEW)

        classifier_training_job2 = (
            classifier_services.get_classifier_training_job_by_id(job_ids[1]))
        self.assertEqual(classifier_training_job2.algorithm_id,
                         feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                             'algorithm_id'])
        self.assertEqual(classifier_training_job2.interaction_id,
                         'TextInput')
        self.assertEqual(classifier_training_job2.exp_id, '1')
        self.assertEqual(classifier_training_job2.exp_version, 2)
        self.assertEqual(classifier_training_job2.training_data, [])
        self.assertEqual(classifier_training_job2.state_name, 'Home')
        self.assertEqual(classifier_training_job2.status,
                         feconf.TRAINING_JOB_STATUS_NEW)


    def test_mark_training_job_complete(self):
        """Test the mark_training_job_complete method."""
        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'

        job_id = classifier_services.create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING[interaction_id][
                'algorithm_id'], interaction_id, exp_id, 1, state_name,
            [], feconf.TRAINING_JOB_STATUS_PENDING)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(classifier_training_job.status,
                         feconf.TRAINING_JOB_STATUS_PENDING)

        classifier_services.mark_training_job_complete(job_id)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(classifier_training_job.status,
                         feconf.TRAINING_JOB_STATUS_COMPLETE)

        # Test that invalid status changes cannot be made.
        with self.assertRaisesRegexp(Exception, (
            'The status change %s to %s is not valid.' % (
                feconf.TRAINING_JOB_STATUS_COMPLETE,
                feconf.TRAINING_JOB_STATUS_COMPLETE))):
            classifier_services.mark_training_job_complete(job_id)

    def test_retrieval_of_classifier_from_exploration_attributes(self):
        """Test the get_classifier method."""

        exp_id = u'1'
        state_name = u'टेक्स्ट'
        classifier_id = 'classifier_id1'
        classifier_id = classifier_models.ClassifierDataModel.create(
            classifier_id, exp_id, 1, state_name,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'], [], 1)
        classifier_models.ClassifierExplorationMappingModel.create(
            exp_id, 1, state_name, classifier_id)
        classifier = (
            classifier_services.get_classifier(
                exp_id, 1, state_name))
        self.assertEqual(classifier.exp_id, exp_id)
        self.assertEqual(classifier.exp_version_when_created, 1)
        self.assertEqual(classifier.state_name, state_name)
        self.assertEqual(classifier.id, classifier_id)

    def test_creation_of_classifier_exploration_mapping(self):
        """Test the create_classifier_exploration_mapping method."""

        exp_id = '1'
        state_name = u'टेक्स्ट'
        classifier_id = 'classifier_id1'

        # Check that mapping can't be created since the classifier doesn't
        # exist.
        with self.assertRaisesRegexp(Exception, (
            'Entity for class ClassifierDataModel with id %s not found' %(
                classifier_id))):
            classifier_services.create_classifier_exploration_mapping(
                exp_id, 1, state_name, classifier_id)

        # Create classifier
        classifier_id = classifier_models.ClassifierDataModel.create(
            classifier_id, exp_id, 1, state_name,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'], [], 1)

        classifier_services.create_classifier_exploration_mapping(
            exp_id, 1, state_name, classifier_id)
        classifier_exploration_mapping = (
            classifier_domain.ClassifierExplorationMapping(
                exp_id, 1, state_name, classifier_id))
        self.assertEqual(classifier_exploration_mapping.exp_id, exp_id)
        self.assertEqual(classifier_exploration_mapping.exp_version, 1)
        self.assertEqual(classifier_exploration_mapping.state_name, state_name)
        self.assertEqual(classifier_exploration_mapping.classifier_id,
                         classifier_id)

        # Check that exception is raised if the mapping already exists.
        with self.assertRaisesRegexp(Exception, (
            'The Classifier-Exploration mapping with id %s.%s.%s '
            'already exists.' % (exp_id, 1, state_name.encode('utf-8')))):
            classifier_services.create_classifier_exploration_mapping(
                exp_id, 1, state_name, classifier_id)
