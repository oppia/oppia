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

"""Unit tests for core.domain.auth_validators_test."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import prod_validation_jobs_one_off
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import python_utils

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])
datastore_services = models.Registry.import_datastore_services()


class BeamJobValidatorTestBase(test_utils.AppEngineTestBase):
    """Base class with helper methods for testing beam_job_validator jobs."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def run_job_and_get_output(self, entity_id_order=None):
        """Runs the validation jobs and returns its output.

        Args:
            entity_id_order: list(str)|None. The ordering of IDs to be returned
                from the validation outputs. If None, then the output is not
                changed.

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
        output = [
            ast.literal_eval(o) for o in self.JOB_CLASS.get_output(job_id)
        ]

        if entity_id_order is not None:
            by_entity_id_order = lambda output_str: python_utils.NEXT(
                (
                    i for i, entity_id in enumerate(entity_id_order)
                    if output_str.startswith('Entity id %s' % entity_id)),
                len(entity_id_order))

            for _, sub_output in output:
                if isinstance(sub_output, list):
                    sub_output.sort(key=by_entity_id_order)

        return output


class BeamJobRunModelValidatorTests(BeamJobValidatorTestBase):

    JOB_CLASS = prod_validation_jobs_one_off.BeamJobRunModelAuditOneOffJob
    RUN_MODEL_CLASS = beam_job_models.BeamJobRunModel

    def test_model_with_registered_job_name(self):
        self.RUN_MODEL_CLASS(
            id='123', job_name='AuditAllStorageModelsJob',
            latest_job_state='RUNNING').put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['fully-validated BeamJobRunModel', 1],
        ])

    def test_model_with_unregistered_job_name(self):
        self.RUN_MODEL_CLASS(
            id='123', job_name='FooJob',
            latest_job_state='RUNNING').put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['failed validation check for beam_job_name_error of '
             'BeamJobRunModel',
             ['Entity id 123: The job_name field has a value FooJob which is '
              'not among the job names in jobs.registry.get_all_jobs()'],
            ],
        ])


class BeamJobRunResultModelValidatorTests(BeamJobValidatorTestBase):

    JOB_CLASS = prod_validation_jobs_one_off.BeamJobRunResultModelAuditOneOffJob
    RUN_MODEL_CLASS = beam_job_models.BeamJobRunModel
    RESULT_MODEL_CLASS = beam_job_models.BeamJobRunResultModel

    def test_model_with_corresponding_job_run_model(self):
        self.RUN_MODEL_CLASS(
            id='123', job_name='AuditAllStorageModelsJob',
            latest_job_state='RUNNING').put()
        self.RESULT_MODEL_CLASS(id='123', stdout=[], stderr=[]).put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['fully-validated BeamJobRunResultModel', 1],
        ])

    def test_model_without_corresponding_job_run_model(self):
        self.RUN_MODEL_CLASS(
            id='123', job_name='AuditAllStorageModelsJob',
            latest_job_state='RUNNING').put()
        self.RESULT_MODEL_CLASS(id='456', stdout=[], stderr=[]).put()

        self.assertEqual(self.run_job_and_get_output(), [
            ['failed validation check for beam_job_ids field check of '
             'BeamJobRunResultModel',
             ['Entity id 456: based on field beam_job_ids having value 456, '
              'expected model BeamJobRunModel with id 456 but it doesn\'t '
              'exist']
            ],
        ])
