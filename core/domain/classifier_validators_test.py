# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.classifier_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import json

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_services
from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf
from proto_files import text_classifier_pb2
import python_utils

datastore_services = models.Registry.import_datastore_services()
classifier_models, exp_models = models.Registry.import_models([
    models.NAMES.classifier, models.NAMES.exploration])


class ClassifierTrainingJobModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ClassifierTrainingJobModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            exp.add_states(['StateTest%s' % exp.id])
            exp_services.save_new_exploration(self.owner_id, exp)

        next_scheduled_check_time = datetime.datetime.utcnow()
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.model_json = json.dumps(
            {'classifier_data': 'data'})

        id0 = classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', '0', 1,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'StateTest0', feconf.TRAINING_JOB_STATUS_NEW, 1)
        fs_services.save_classifier_data(
            'TextClassifier', id0, classifier_data_proto)
        self.model_instance_0 = (
            classifier_models.ClassifierTrainingJobModel.get_by_id(id0))
        id1 = classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', '1', 1,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'StateTest1', feconf.TRAINING_JOB_STATUS_NEW, 1)
        fs_services.save_classifier_data(
            'TextClassifier', id1, classifier_data_proto)
        self.model_instance_1 = (
            classifier_models.ClassifierTrainingJobModel.get_by_id(id1))

        self.job_class = (
            prod_validation_jobs_one_off
            .ClassifierTrainingJobModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ClassifierTrainingJobModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ClassifierTrainingJobModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ClassifierTrainingJobModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of ClassifierTrainingJobModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_exp_version(self):
        self.model_instance_0.exp_version = 5
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for exp version check '
                'of ClassifierTrainingJobModel\', [u\'Entity id %s: '
                'Exploration version 5 in entity is greater than the '
                'version 1 of exploration corresponding to exp_id 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_state_name(self):
        self.model_instance_0.state_name = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for state name check '
                'of ClassifierTrainingJobModel\', [u\'Entity id %s: '
                'State name invalid in entity is not present in '
                'states of exploration corresponding to exp_id 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_schema(self):
        self.model_instance_0.interaction_id = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check '
                'of ClassifierTrainingJobModel\', [u\'Entity id %s: Entity '
                'fails domain validation with the error Invalid '
                'interaction id: invalid\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class StateTrainingJobsMappingModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StateTrainingJobsMappingModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            exp.add_states(['StateTest%s' % exp.id])
            exp_services.save_new_exploration(self.owner_id, exp)

        id0 = classifier_models.StateTrainingJobsMappingModel.create(
            '0', 1, 'StateTest0', {'TextClassifier': 'job0'})
        self.model_instance_0 = (
            classifier_models.StateTrainingJobsMappingModel.get_by_id(id0))
        id1 = classifier_models.StateTrainingJobsMappingModel.create(
            '1', 1, 'StateTest1', {'TextClassifier': 'job1'})
        self.model_instance_1 = (
            classifier_models.StateTrainingJobsMappingModel.get_by_id(id1))

        self.job_class = (
            prod_validation_jobs_one_off
            .StateTrainingJobsMappingModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated StateTrainingJobsMappingModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StateTrainingJobsMappingModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated StateTrainingJobsMappingModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StateTrainingJobsMappingModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of StateTrainingJobsMappingModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance_0.id,
            u'[u\'fully-validated StateTrainingJobsMappingModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_exp_version(self):
        model_instance_with_invalid_exp_version = (
            classifier_models.StateTrainingJobsMappingModel(
                id='0.5.StateTest0', exp_id='0', exp_version=5,
                state_name='StateTest0',
                algorithm_ids_to_job_ids={'TextClassifier': 'job_id'}))
        model_instance_with_invalid_exp_version.update_timestamps()
        model_instance_with_invalid_exp_version.put()
        expected_output = [
            (
                u'[u\'failed validation check for exp version check '
                'of StateTrainingJobsMappingModel\', [u\'Entity id %s: '
                'Exploration version 5 in entity is greater than the '
                'version 1 of exploration corresponding to exp_id 0\']]'
            ) % model_instance_with_invalid_exp_version.id,
            u'[u\'fully-validated StateTrainingJobsMappingModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_state_name(self):
        model_instance_with_invalid_state_name = (
            classifier_models.StateTrainingJobsMappingModel(
                id='0.1.invalid', exp_id='0', exp_version=1,
                state_name='invalid',
                algorithm_ids_to_job_ids={'TextClassifier': 'job_id'}))
        model_instance_with_invalid_state_name.update_timestamps()
        model_instance_with_invalid_state_name.put()
        expected_output = [
            (
                u'[u\'failed validation check for state name check '
                'of StateTrainingJobsMappingModel\', [u\'Entity id %s: '
                'State name invalid in entity is not present in '
                'states of exploration corresponding to exp_id 0\']]'
            ) % model_instance_with_invalid_state_name.id,
            u'[u\'fully-validated StateTrainingJobsMappingModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
