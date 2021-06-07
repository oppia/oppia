# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.beam_job_validators_test."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import prod_validation_jobs_one_off
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])
datastore_services = models.Registry.import_datastore_services()


class BeamJobValidatorTestBase(test_utils.AppEngineTestBase):
    """Base class with helper methods for testing beam_job_validator jobs."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def run_job_and_get_output(self):
        """Runs the validation jobs and returns its output.

        Returns:
            list(*). The validation job output.
        """
        job_id = self.JOB_CLASS.create_new()
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        self.JOB_CLASS.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        return [ast.literal_eval(o) for o in self.JOB_CLASS.get_output(job_id)]


class BeamJobRunModelValidatorTests(BeamJobValidatorTestBase):

    JOB_CLASS = prod_validation_jobs_one_off.BeamJobRunModelAuditOneOffJob
    RUN_MODEL_CLASS = beam_job_models.BeamJobRunModel

    def test_model_with_registered_job_name(self):
        run_model_id = self.RUN_MODEL_CLASS.get_new_id()
        self.RUN_MODEL_CLASS(
            id=run_model_id, job_name='AuditAllStorageModelsJob',
            latest_job_state='RUNNING').put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['fully-validated BeamJobRunModel', 1],
        ])

    def test_model_with_unregistered_job_name(self):
        run_model_id = self.RUN_MODEL_CLASS.get_new_id()
        self.RUN_MODEL_CLASS(
            id=run_model_id, job_name='FooJob',
            latest_job_state='RUNNING').put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['failed validation check for beam_job_name_error of '
             'BeamJobRunModel',
             ['Entity id %s: The job_name field has a value FooJob which is '
              'not among the job names in jobs.registry.get_all_jobs()' % (
                  run_model_id)],
            ],
        ])


class BeamJobRunResultModelValidatorTests(BeamJobValidatorTestBase):

    JOB_CLASS = prod_validation_jobs_one_off.BeamJobRunResultModelAuditOneOffJob
    RUN_MODEL_CLASS = beam_job_models.BeamJobRunModel
    RESULT_MODEL_CLASS = beam_job_models.BeamJobRunResultModel

    def test_model_with_corresponding_job_run_model(self):
        run_model_id = self.RUN_MODEL_CLASS.get_new_id()
        result_model_id = self.RESULT_MODEL_CLASS.get_new_id()
        self.RESULT_MODEL_CLASS(id=result_model_id, job_id=run_model_id).put()
        self.RUN_MODEL_CLASS(
            id=run_model_id, job_name='AuditAllStorageModelsJob',
            latest_job_state='RUNNING').put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['fully-validated BeamJobRunResultModel', 1],
        ])

    def test_model_without_corresponding_job_run_model(self):
        run_model_id = self.RUN_MODEL_CLASS.get_new_id()
        result_model_id = self.RESULT_MODEL_CLASS.get_new_id()
        self.RESULT_MODEL_CLASS(
            id=result_model_id, job_id='456', stdout='', stderr='').put()
        self.RUN_MODEL_CLASS(
            id=run_model_id, job_name='AuditAllStorageModelsJob',
            latest_job_state='RUNNING').put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['failed validation check for beam_job_ids field check of '
             'BeamJobRunResultModel',
             ['Entity id %s: based on field beam_job_ids having value 456, '
              'expected model BeamJobRunModel with id 456 but it doesn\'t '
              'exist' % result_model_id]
            ],
        ])
