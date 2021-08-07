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

"""Unit tests for jobs.io.job_run_results_io."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core.domain import beam_job_services
from core.platform import models
from jobs import job_test_utils
from jobs.io import job_io
from jobs.types import job_run_result

import apache_beam as beam

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])

datastore_services = models.Registry.import_datastore_services()


class PutResultsTests(job_test_utils.PipelinedTestBase):

    # TODO(#11464): Find a newer version of Apache Beam that fixes
    # GroupIntoBatches() to provide correct type info, so we don't have to
    # provide this hook for tests to override.
    RUNTIME_TYPE_CHECK = False

    JOB_ID = '123'

    def tearDown(self):
        datastore_services.delete_multi(
            datastore_services.query_everything().iter(keys_only=True))
        super(PutResultsTests, self).tearDown()

    def test_single_output(self):
        messages = [
            job_run_result.JobRunResult(
                stdout='Hello, World!', stderr='Uh-oh, World!'),
        ]

        self.assert_pcoll_empty(
            self.pipeline
            | beam.Create(messages)
            | job_io.PutResults(self.JOB_ID)
        )

        result = beam_job_services.get_beam_job_run_result(self.JOB_ID)
        self.assertEqual(result.stdout, 'Hello, World!')
        self.assertEqual(result.stderr, 'Uh-oh, World!')

    def test_sharded_output(self):
        messages = [
            job_run_result.JobRunResult(stdout='abc', stderr='123'),
            job_run_result.JobRunResult(stdout='def', stderr='456'),
            job_run_result.JobRunResult(stdout='ghi', stderr='789'),
        ]

        with self.swap(job_run_result, 'MAX_OUTPUT_BYTES', 11):
            self.assert_pcoll_empty(
                self.pipeline
                | beam.Create(messages)
                | job_io.PutResults(self.JOB_ID)
            )

        result = beam_job_services.get_beam_job_run_result(self.JOB_ID)
        self.assertItemsEqual(result.stdout.split('\n'), ['abc', 'def', 'ghi'])
        self.assertItemsEqual(result.stderr.split('\n'), ['123', '456', '789'])
