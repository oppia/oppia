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

"""Tests for classifier services."""

from __future__ import annotations

import copy
import datetime
import json
import os

from core import feconf
from core import utils
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.domain import state_domain
from core.platform import models
from core.tests import test_utils
from proto_files import text_classifier_pb2

from typing import Dict, List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import classifier_models
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()
(classifier_models,) = models.Registry.import_models([
    models.Names.CLASSIFIER
])


class ClassifierServicesTests(test_utils.ClassifierTestBase):
    """Test "classify" using the sample explorations.

    Since the end to end tests cover correct classification, and frontend tests
    test hard rules, ReaderClassifyTests is only checking that the string
    classifier is actually called.
    """

    def setUp(self) -> None:
        super().setUp()
        self._init_classify_inputs('16')

    def _init_classify_inputs(self, exploration_id: str) -> None:
        """Initializes all the classification inputs of the exploration
        corresponding to the given exploration id.
        """
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
                assets_list)

        self.exp_id = exploration_id
        self.exp_state = (
            exp_fetchers.get_exploration_by_id(exploration_id).states['Home'])

    def _create_classifier_training_job(
        self,
        algorithm_id: str,
        interaction_id: str,
        exp_id: str,
        exp_version: int,
        next_scheduled_check_time: datetime.datetime,
        training_data: classifier_models.TrainingDataUnionType,
        state_name: str,
        status: str,
        classifier_data: Dict[str, str],
        algorithm_version: int
    ) -> str:
        """Creates a new classifier training job model and stores
        classfier data in a file.
        """
        job_id = classifier_models.ClassifierTrainingJobModel.create(
            algorithm_id, interaction_id, exp_id, exp_version,
            next_scheduled_check_time, training_data, state_name, status,
            algorithm_version)
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.model_json = json.dumps(classifier_data)
        fs_services.save_classifier_data(exp_id, job_id, classifier_data_proto)
        return job_id

    def test_creation_of_jobs_and_mappings(self) -> None:
        """Test the handle_trainable_states method and
        get_job_models_that_handle_non_trainable_states method by triggering
        update_exploration() method.
        """
        exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        state = exploration.states['Home']

        # There is one job and one mapping in the data store now as a result of
        # creating the exploration.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 1)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 1)

        # Modify such that job creation is triggered.
        new_answer_group = copy.deepcopy(state.interaction.answer_groups[1])
        new_answer_group.outcome.feedback.content_id = 'new_feedback'
        new_answer_group.rule_specs[0].inputs[
            'x']['contentId'] = 'rule_input_4'
        new_answer_group.rule_specs[0].inputs[
            'x']['normalizedStrSet'] = ['Divide']
        state.recorded_voiceovers.voiceovers_mapping['new_feedback'] = {}
        state.recorded_voiceovers.voiceovers_mapping[
            'rule_input_4'] = {}
        state.interaction.answer_groups.insert(3, new_answer_group)
        answer_groups: List[state_domain.AnswerGroupDict] = []
        for answer_group in state.interaction.answer_groups:
            answer_groups.append(answer_group.to_dict())
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Home',
            'property_name': 'answer_groups',
            'new_value': answer_groups
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Home',
            'property_name': 'recorded_voiceovers',
            'new_value': state.recorded_voiceovers.to_dict()
        })]
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should be two jobs and two mappings in the data store now.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 2)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 2)

        # Make a change to the exploration without changing the answer groups
        # to trigger mapping update.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'New title'
        })]
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should be two jobs and three mappings in the data store now.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 2)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 3)

        # Check that renaming a state does not create an extra job.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'Home',
            'new_state_name': 'Home2'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'Home2',
            'new_state_name': 'Home3'
        })]
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should still be only two jobs and four mappings in the data
        # store now.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 2)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 4)

    def test_that_models_are_recreated_if_not_available(self) -> None:
        """Test ensures that classifier models for state are retrained if
        they are not available.
        """
        exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        state = exploration.states['Home']

        # There is one job and one mapping in the data store now as a result of
        # creating the exploration.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 1)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 1)

        # Modify such that job creation is triggered.
        new_answer_group = copy.deepcopy(state.interaction.answer_groups[1])
        new_answer_group.outcome.feedback.content_id = 'new_feedback'
        new_answer_group.rule_specs[0].inputs[
            'x']['contentId'] = 'rule_input_4'
        new_answer_group.rule_specs[0].inputs[
            'x']['normalizedStrSet'] = ['Multiplication']
        state.recorded_voiceovers.voiceovers_mapping['new_feedback'] = {}
        state.recorded_voiceovers.voiceovers_mapping[
            'rule_input_4'] = {}
        state.interaction.answer_groups.insert(3, new_answer_group)
        answer_groups = []
        for answer_group in state.interaction.answer_groups:
            answer_groups.append(answer_group.to_dict())
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Home',
            'property_name': 'answer_groups',
            'new_value': answer_groups
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Home',
            'property_name': 'recorded_voiceovers',
            'new_value': state.recorded_voiceovers.to_dict()
        })]
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should be two jobs and two mappings in the data store now.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 2)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 2)

        # Make a change to the exploration without changing the answer groups
        # to trigger update while ML is disabled.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'New title'
        })]
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', False):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should be two jobs and two mappings in the data store now.
        # Since ML functionality was turned off, no new mapping should be
        # created.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 2)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 2)

        # Again make a change to the exploration without changing the answer
        # groups to trigger mapping update while ML is enabled.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'title',
            'new_value': 'New title'
        })]
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        # There should be three jobs and three mappings in the data store now.
        # Since ML functionality was turned on, new job and mapping should be
        # created.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 3)
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 3)

    def test_get_new_job_models_for_trainable_states(self) -> None:
        """Test the handle_trainable_states method."""
        exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        state_names = ['Home']
        job_models = (
            classifier_services.get_new_job_models_for_trainable_states(
                exploration, state_names
            )
        )
        datastore_services.put_multi(job_models)

        # There should be two jobs (the first job because of the creation of the
        # exploration) in the data store now.
        all_jobs = classifier_models.ClassifierTrainingJobModel.get_all()
        self.assertEqual(all_jobs.count(), 2)
        for index, job in enumerate(all_jobs):
            if index == 1:
                job_id = job.id

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(classifier_training_job.exp_id, self.exp_id)
        self.assertEqual(classifier_training_job.state_name, 'Home')

    def test_handle_trainable_states_raises_error_for_invalid_interaction_id(
        self
    ) -> None:
        """Test the handle_trainable_states method."""
        exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        state_names = ['Home']
        exploration.states['Home'].interaction.id = 'Invalid_id'
        with self.assertRaisesRegex(
            Exception,
            'No classifier algorithm found for Invalid_id interaction'
        ):
            classifier_services.get_new_job_models_for_trainable_states(
                exploration, state_names)

    def test_get_new_job_models_for_non_trainable_states(self) -> None:
        """Test the get_job_models_that_handle_non_trainable_states method."""
        exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        next_scheduled_check_time = datetime.datetime.utcnow()
        state_names = ['Home']
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'Old home',
            'new_state_name': 'Home'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        # Test that Exception is raised if this method is called with version
        # number 1.
        exploration.version = 1
        with self.assertRaisesRegex(
            Exception, 'This method should not be called by exploration with '
                       'version number 1'):
            (
                _,
                job_models
            ) = (
                classifier_services
                .get_new_job_models_for_non_trainable_states(
                    exploration, state_names, exp_versions_diff
                )
            )
            datastore_services.put_multi(job_models)

        exploration.version += 1
        # Test that mapping cant be created if job doesn't exist.
        (_, job_models) = (
            classifier_services.get_new_job_models_for_non_trainable_states(
                exploration, state_names, exp_versions_diff
            )
        )
        datastore_services.put_multi(job_models)
        # There will be only one mapping (because of the creation of the
        # exploration).
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 1)

        # Create job and mapping for previous version.
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            'TextInput']['algorithm_id']
        job_id = self._create_classifier_training_job(
            algorithm_id, 'TextInput', self.exp_id, exploration.version - 1,
            next_scheduled_check_time, [], 'Old home',
            feconf.TRAINING_JOB_STATUS_COMPLETE, {}, 1)
        classifier_models.StateTrainingJobsMappingModel.create(
            self.exp_id, exploration.version - 1, 'Old home',
            {algorithm_id: job_id})

        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 2)

        (_, job_models) = (
            classifier_services.get_new_job_models_for_non_trainable_states(
                exploration, state_names, exp_versions_diff
            )
        )
        datastore_services.put_multi(job_models)

        # There should be three mappings (the first mapping because of the
        # creation of the exploration) in the data store now.
        all_mappings = (
            classifier_models.StateTrainingJobsMappingModel.get_all())
        self.assertEqual(all_mappings.count(), 3)
        for index, mapping in enumerate(all_mappings):
            if index == 2:
                mapping_id = mapping.id

        state_training_jobs_mapping = (
            classifier_models.StateTrainingJobsMappingModel.get(
                mapping_id))
        self.assertEqual(state_training_jobs_mapping.exp_id, self.exp_id)
        self.assertEqual(state_training_jobs_mapping.state_name, 'Home')

    def test_retrieval_of_classifier_training_jobs(self) -> None:
        """Test the get_classifier_training_job_by_id method."""

        with self.assertRaisesRegex(Exception, (
            'Entity for class ClassifierTrainingJobModel with id fake_id '
            'not found')):
            classifier_services.get_classifier_training_job_by_id('fake_id')

        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'
        next_scheduled_check_time = datetime.datetime.utcnow()
        job_id = self._create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput']['algorithm_id'],
            interaction_id, exp_id, 1, next_scheduled_check_time, [],
            state_name, feconf.TRAINING_JOB_STATUS_NEW, {}, 1)
        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(
            classifier_training_job.algorithm_id,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'][
                'algorithm_id'])
        self.assertEqual(classifier_training_job.interaction_id, interaction_id)
        self.assertEqual(classifier_training_job.exp_id, exp_id)
        self.assertEqual(classifier_training_job.exp_version, 1)
        self.assertEqual(
            classifier_training_job.next_scheduled_check_time,
            next_scheduled_check_time)
        self.assertEqual(classifier_training_job.training_data, [])

        classifier_data = (
            self._get_classifier_data_from_classifier_training_job(
                classifier_training_job))
        self.assertEqual(
            json.loads(classifier_data.model_json), {})
        self.assertEqual(classifier_training_job.state_name, state_name)
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_NEW)
        self.assertEqual(classifier_training_job.algorithm_version, 1)

    def test_deletion_of_classifier_training_jobs(self) -> None:
        """Test the delete_classifier_training_job method."""

        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'
        next_scheduled_check_time = datetime.datetime.utcnow()

        job_id = self._create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput']['algorithm_id'],
            interaction_id, exp_id, 1, next_scheduled_check_time, [],
            state_name, feconf.TRAINING_JOB_STATUS_NEW, {}, 1)
        self.assertTrue(job_id)
        classifier_services.delete_classifier_training_job(job_id)
        with self.assertRaisesRegex(Exception, (
            'Entity for class ClassifierTrainingJobModel '
            'with id %s not found' % (
                job_id))):
            classifier_services.get_classifier_training_job_by_id(job_id)

    def test_mark_training_job_complete(self) -> None:
        """Test the mark_training_job_complete method."""
        exp_id = u'1'
        next_scheduled_check_time = datetime.datetime.utcnow()
        state_name = 'Home'
        interaction_id = 'TextInput'

        job_id = self._create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput']['algorithm_id'],
            interaction_id, exp_id, 1, next_scheduled_check_time, [],
            state_name, feconf.TRAINING_JOB_STATUS_PENDING, {}, 1)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_PENDING)

        classifier_services.mark_training_job_complete(job_id)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_COMPLETE)

        # Test that invalid status changes cannot be made.
        with self.assertRaisesRegex(Exception, (
            'The status change %s to %s is not valid.' % (
                feconf.TRAINING_JOB_STATUS_COMPLETE,
                feconf.TRAINING_JOB_STATUS_COMPLETE))):
            classifier_services.mark_training_job_complete(job_id)

    def test_mark_training_job_pending(self) -> None:
        """Test the mark_training_job_pending method."""
        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'

        job_id = self._create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING[interaction_id][
                'algorithm_id'], interaction_id, exp_id, 1,
            datetime.datetime.utcnow(), [], state_name,
            feconf.TRAINING_JOB_STATUS_NEW, {}, 1)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_NEW)

        classifier_services.mark_training_job_pending(job_id)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_PENDING)

        # Test that invalid status changes cannot be made.
        with self.assertRaisesRegex(Exception, (
            'The status change %s to %s is not valid.' % (
                feconf.TRAINING_JOB_STATUS_PENDING,
                feconf.TRAINING_JOB_STATUS_PENDING))):
            classifier_services.mark_training_job_pending(job_id)

    def test_mark_training_jobs_failed(self) -> None:
        """Test the mark_training_job_failed method."""
        exp_id = u'1'
        state_name = 'Home'
        interaction_id = 'TextInput'
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_id']
        algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_version']
        job_id = self._create_classifier_training_job(
            algorithm_id, interaction_id, exp_id, 1,
            datetime.datetime.utcnow(), [], state_name,
            feconf.TRAINING_JOB_STATUS_PENDING, {}, algorithm_version)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_PENDING)

        classifier_services.mark_training_jobs_failed([job_id])

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        self.assertEqual(
            classifier_training_job.status,
            feconf.TRAINING_JOB_STATUS_FAILED)

        # Test that invalid status changes cannot be made.
        with self.assertRaisesRegex(Exception, (
            'The status change %s to %s is not valid.' % (
                feconf.TRAINING_JOB_STATUS_FAILED,
                feconf.TRAINING_JOB_STATUS_FAILED))):
            classifier_services.mark_training_jobs_failed([job_id])

    def test_fetch_next_job(self) -> None:
        """Test the fetch_next_jobs method."""
        exp1_id = '1'
        state_name = 'Home'
        interaction_id = 'TextInput'
        exp2_id = '0'

        job1_id = self._create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING[interaction_id][
                'algorithm_id'], interaction_id, exp1_id, 1,
            datetime.datetime.utcnow(), [], state_name,
            feconf.TRAINING_JOB_STATUS_NEW, {}, 1)
        self._create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING[interaction_id][
                'algorithm_id'], interaction_id, exp2_id, 1,
            datetime.datetime.utcnow(), [], state_name,
            feconf.TRAINING_JOB_STATUS_PENDING, {}, 1)
        # This will get the job_id of the exploration created in setup.
        classifier_services.fetch_next_job()
        next_job = classifier_services.fetch_next_job()
        # Ruling out the possibility of None for mypy type checking.
        assert next_job is not None
        self.assertEqual(job1_id, next_job.job_id)

        # This will check if 'fetch_next_job' returns None
        # when there are no job models to be fetched from
        # the job queue.
        next_job = classifier_services.fetch_next_job()
        self.assertIsNone(next_job)

    def test_store_classifier_data(self) -> None:
        """Test the store_classifier_data method."""
        exp_id = u'1'
        next_scheduled_check_time = datetime.datetime.utcnow()
        state_name = 'Home'
        interaction_id = 'TextInput'

        job_id = self._create_classifier_training_job(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput']['algorithm_id'],
            interaction_id, exp_id, 1, next_scheduled_check_time, [],
            state_name, feconf.TRAINING_JOB_STATUS_PENDING, {}, 1)

        # Retrieve classifier data from GCS and ensure that content is same.
        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        classifier_data = (
            self._get_classifier_data_from_classifier_training_job(
                classifier_training_job))
        self.assertEqual(json.loads(classifier_data.model_json), {})

        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.model_json = json.dumps(
            {'classifier_data': 'data'})
        classifier_services.store_classifier_data(
            job_id, classifier_data_proto)

        classifier_training_job = (
            classifier_services.get_classifier_training_job_by_id(job_id))
        classifier_data = (
            self._get_classifier_data_from_classifier_training_job(
                classifier_training_job))
        self.assertDictEqual(
            json.loads(classifier_data.model_json),
            {'classifier_data': 'data'})

    def test_retrieval_of_classifier_training_jobs_from_exploration_attributes(
        self
    ) -> None:
        """Test the get_classifier_training_job method."""

        exp_id = u'1'
        next_scheduled_check_time = datetime.datetime.utcnow()
        state_name = u'टेक्स्ट'
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            'TextInput']['algorithm_id']
        algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            'TextInput']['algorithm_version']
        job_id = self._create_classifier_training_job(
            algorithm_id, 'TextInput', exp_id, 1, next_scheduled_check_time,
            [], state_name, feconf.TRAINING_JOB_STATUS_NEW, {},
            algorithm_version)
        classifier_models.StateTrainingJobsMappingModel.create(
            exp_id, 1, state_name, {algorithm_id: job_id})

        classifier_training_job = (
            classifier_services.get_classifier_training_job(
                exp_id, 1, state_name, algorithm_id))
        # Ruling out the possibility of None for mypy type checking.
        assert classifier_training_job is not None
        self.assertEqual(classifier_training_job.exp_id, exp_id)
        self.assertEqual(classifier_training_job.exp_version, 1)
        self.assertEqual(classifier_training_job.state_name, state_name)
        self.assertEqual(classifier_training_job.job_id, job_id)

        # Test that method returns a list with None as elements when job does
        # not exist.
        false_state_name = 'false_name'
        classifier_training_job = (
            classifier_services.get_classifier_training_job(
                exp_id, 1, false_state_name, algorithm_id))
        self.assertIsNone(classifier_training_job)

    def test_can_not_mark_training_jobs_complete_due_to_invalid_job_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'The ClassifierTrainingJobModel corresponding to the '
            'job_id of the ClassifierTrainingJob does not exist.'):
            classifier_services.mark_training_job_complete('invalid_job_id')

    def test_can_not_mark_training_jobs_failed_due_to_invalid_job_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'The ClassifierTrainingJobModel corresponding to the '
            'job_id of the ClassifierTrainingJob does not exist.'):
            classifier_services.mark_training_jobs_failed(['invalid_job_id'])

    def test_can_not_mark_training_jobs_pending_due_to_invalid_job_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'The ClassifierTrainingJobModel corresponding to the '
            'job_id of the ClassifierTrainingJob does not exist.'):
            classifier_services.mark_training_job_pending('invalid_job_id')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_can_not_store_classifier_data_due_to_invalid_job_id(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'The ClassifierTrainingJobModel corresponding to the '
            'job_id of the ClassifierTrainingJob does not exist.'):
            classifier_services.store_classifier_data('invalid_job_id', {})  # type: ignore[arg-type]

    def test_generate_signature(self) -> None:
        """Test the generate_signature method."""

        vm_id = feconf.DEFAULT_VM_ID
        secret = feconf.DEFAULT_VM_SHARED_SECRET
        message = b'test message'
        signature = classifier_services.generate_signature(
            secret.encode('utf-8'),
            message,
            vm_id)
        expected_signature = (
            '9c2f9f607c0eefc2b8ba153bad9331843a6efc71c82e690f5f0341bbc38b7fa7')
        self.assertEqual(signature, expected_signature)

    def test_verify_signature(self) -> None:
        """Test the verify_signature method."""

        vm_id = feconf.DEFAULT_VM_ID
        message = 'test message'
        expected_signature = (
            '9c2f9f607c0eefc2b8ba153bad9331843a6efc71c82e690f5f0341bbc38b7fa7')
        invalid_signature = 'invalid signature'
        invalid_vm_id = 'invalid vm_id'
        oppia_ml_auth_info = classifier_domain.OppiaMLAuthInfo(
            message.encode('utf-8'),
            vm_id,
            expected_signature
        )
        self.assertTrue(classifier_services.verify_signature(
           oppia_ml_auth_info))

        # Check if an invalid signature causes verify_signature to fail.
        oppia_ml_auth_info = classifier_domain.OppiaMLAuthInfo(
            message.encode('utf-8'),
            vm_id,
            invalid_signature
        )
        self.assertFalse(classifier_services.verify_signature(
           oppia_ml_auth_info))

        # Check if an invalid vm_id causes verify_signature to fail.
        oppia_ml_auth_info = classifier_domain.OppiaMLAuthInfo(
            message.encode('utf-8'),
            invalid_vm_id,
            expected_signature
        )
        self.assertFalse(classifier_services.verify_signature(
           oppia_ml_auth_info))

    def test_get_state_training_jobs_mapping(self) -> None:
        """Test the get_state_training_jobs_mapping method."""

        exp_id = u'1'
        next_scheduled_check_time = datetime.datetime.utcnow()
        state_name = u'Home'
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            'TextInput']['algorithm_id']
        algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            'TextInput']['algorithm_version']
        job_id = self._create_classifier_training_job(
            algorithm_id, 'TextInput', exp_id, 1, next_scheduled_check_time,
            [], state_name, feconf.TRAINING_JOB_STATUS_NEW, {},
            algorithm_version)
        classifier_models.StateTrainingJobsMappingModel.create(
            exp_id, 1, state_name, {algorithm_id: job_id})
        state_training_jobs_mapping = (
            classifier_services.get_state_training_jobs_mapping(
                exp_id, 1, state_name))
        # Ruling out the possibility of None for mypy type checking.
        assert state_training_jobs_mapping is not None
        self.assertEqual(state_training_jobs_mapping.exp_id, exp_id)
        self.assertEqual(state_training_jobs_mapping.state_name, 'Home')

        # Test that the method returns a None type for an
        # invalid state name.
        invalid_state_name = 'invalid name'
        state_training_jobs_mapping = (
            classifier_services.get_state_training_jobs_mapping(
                exp_id, 1, invalid_state_name))
        self.assertIsNone(state_training_jobs_mapping)

    def test_migrate_state_training_jobs(self) -> None:
        """Test the migrate_state_training_jobs method."""

        state_name = 'Home'
        mock_interaction_classifier_mapping = {
            'TextInput': {
                'algorithm_id': 'NewTextClassifier',
                'algorithm_version': 1
                },
            }
        expected_state_training_jobs = (
            classifier_services.get_state_training_jobs_mapping(
                self.exp_id, 1,
                state_name
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert expected_state_training_jobs is not None
        with self.swap(
            feconf,
            'INTERACTION_CLASSIFIER_MAPPING',
            mock_interaction_classifier_mapping):
            classifier_services.migrate_state_training_jobs(
                expected_state_training_jobs
            )
        state_training_jobs_mapping = (
            classifier_services.get_state_training_jobs_mapping(
                self.exp_id, 1, 'Home')
            )
        # Ruling out the possibility of None for mypy type checking.
        assert state_training_jobs_mapping is not None
        self.assertIn(
            'NewTextClassifier',
            state_training_jobs_mapping.algorithm_ids_to_job_ids)

        # Check migration of an existing algorithm to a newer version.
        mock_interaction_classifier_mapping = {
            'TextInput': {
                'algorithm_id': 'NewTextClassifier',
                'algorithm_version': 2
                },
            }
        with self.swap(
            feconf,
            'INTERACTION_CLASSIFIER_MAPPING',
            mock_interaction_classifier_mapping):
            classifier_services.migrate_state_training_jobs(
                expected_state_training_jobs
            )
        next_job = classifier_services.fetch_next_job()
        # Ruling out the possibility of None for mypy type checking.
        assert next_job is not None
        self.assertEqual(
            mock_interaction_classifier_mapping[
                'TextInput']['algorithm_version'],
            next_job.algorithm_version
        )

    def test_reverted_exploration_maintains_classifier_model_mapping(
        self
    ) -> None:
        """Test if the classifier model mapping is maintained when an
        exploration is reverted.
        """

        state_name = 'Home'
        exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        interaction_id = exploration.states[
            state_name].interaction.id
        # Ruling out the possibility of None for mypy type checking.
        assert interaction_id is not None
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_id']

        # Make changes to the exploration.
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'A new title'
        })]
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        current_exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        # Store the job before reverting the exploration.
        old_job = classifier_services.get_classifier_training_job(
            self.exp_id, current_exploration.version, state_name,
            algorithm_id)
        # Ruling out the possibility of None for mypy type checking.
        assert old_job is not None
        old_job_id = old_job.job_id
        # Revert the exploration.
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.revert_exploration(
                feconf.SYSTEM_COMMITTER_ID,
                self.exp_id,
                current_exploration.version,
                current_exploration.version - 1
            )
        # Verify if classifier model mapping is maintained using the job ID.
        reverted_exploration = exp_fetchers.get_exploration_by_id(self.exp_id)
        self.assertEqual(
            reverted_exploration.version, current_exploration.version + 1)
        new_job = classifier_services.get_classifier_training_job(
            self.exp_id, reverted_exploration.version, state_name,
            algorithm_id)
        # Ruling out the possibility of None for mypy type checking.
        assert new_job is not None
        new_job_id = new_job.job_id
        self.assertEqual(old_job_id, new_job_id)

    def test_migrate_state_training_jobs_with_invalid_interaction_id(
        self
    ) -> None:
        """Test the migrate_state_training_jobs method."""

        exploration = self.save_new_valid_exploration(
            '44', feconf.SYSTEM_COMMITTER_ID, objective='The objective',
            category='Algebra')
        self.assertEqual(exploration.version, 1)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': 'New state',
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': None
        })]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration.id, change_list, '')
        state_training_jobs_mapping = (
            classifier_domain.StateTrainingJobsMapping('44', 2, 'New state', {})
        )
        with self.assertRaisesRegex(
            Exception, 'Interaction id does not exist.'):
            classifier_services.migrate_state_training_jobs(
                state_training_jobs_mapping
            )
