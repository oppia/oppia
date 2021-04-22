# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.job_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import random

from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils
import python_utils
import utils

datastore_services = models.Registry.import_datastore_services()

(job_models,) = models.Registry.import_models([models.NAMES.job])


class JobModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(JobModelValidatorTests, self).setUp()

        current_time_str = python_utils.UNICODE(
            int(utils.get_current_time_in_millisecs()))
        random_int = random.randint(0, 1000)
        self.model_instance = job_models.JobModel(
            id='test-%s-%s' % (current_time_str, random_int),
            status_code=job_models.STATUS_CODE_NEW, job_type='test',
            time_queued_msec=1, time_started_msec=10, time_finished_msec=20)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.JobModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated JobModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of JobModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [
            (
                u'[u\'failed validation check for current time check of '
                'JobModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater than the time when the job '
                'was run\']]'
            ) % (self.model_instance.id, self.model_instance.last_updated),
            u'[u\'fully-validated JobModel\', 1]']

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_invalid_empty_error(self):
        self.model_instance.status_code = job_models.STATUS_CODE_FAILED
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for error check '
                'of JobModel\', [u\'Entity id %s: '
                'error for job is empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_non_empty_error(self):
        self.model_instance.error = 'invalid'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for error check '
                'of JobModel\', [u\'Entity id %s: '
                'error: invalid for job is not empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_empty_output(self):
        self.model_instance.status_code = job_models.STATUS_CODE_COMPLETED
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for output check '
                'of JobModel\', [u\'Entity id %s: '
                'output for job is empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_non_empty_output(self):
        self.model_instance.output = 'invalid'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for output check '
                'of JobModel\', [u\'Entity id %s: '
                'output: invalid for job is not empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_queued_msec(self):
        self.model_instance.time_queued_msec = 15
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time queued check '
                'of JobModel\', [u\'Entity id %s: '
                'time queued 15.0 is greater than time started 10.0\']]'
            ) % self.model_instance.id,
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_started_msec(self):
        self.model_instance.time_started_msec = 25
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time started check '
                'of JobModel\', [u\'Entity id %s: '
                'time started 25.0 is greater than time finished 20.0\']]'
            ) % self.model_instance.id,
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_finished_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.time_finished_msec = current_time_msec * 10.0
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time finished '
                'check of JobModel\', [u\'Entity id %s: time '
                'finished %s is greater than the current time\']]'
            ) % (
                self.model_instance.id,
                self.model_instance.time_finished_msec),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ContinuousComputationModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ContinuousComputationModelValidatorTests, self).setUp()

        self.model_instance = job_models.ContinuousComputationModel(
            id='FeedbackAnalyticsAggregator',
            status_code=job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING,
            last_started_msec=1, last_stopped_msec=10, last_finished_msec=20)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .ContinuousComputationModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ContinuousComputationModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ContinuousComputationModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ContinuousComputationModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_last_started_msec(self):
        self.model_instance.last_started_msec = 25
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last started check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last started 25.0 is greater than both last finished 20.0 '
                'and last stopped 10.0\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_last_stopped_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.last_stopped_msec = current_time_msec * 10.0
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last stopped check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last stopped %s is greater than the current time\']]'
            ) % (self.model_instance.id, self.model_instance.last_stopped_msec)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_last_finished_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.last_finished_msec = current_time_msec * 10.0
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last finished check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last finished %s is greater than the current time\']]'
            ) % (
                self.model_instance.id,
                self.model_instance.last_finished_msec)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = job_models.ContinuousComputationModel(
            id='invalid',
            status_code=job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING,
            last_started_msec=1, last_stopped_msec=10, last_finished_msec=20)
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'ContinuousComputationModel\', '
                '[u\'Entity id invalid: Entity id does not match '
                'regex pattern\']]'
            ), u'[u\'fully-validated ContinuousComputationModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
