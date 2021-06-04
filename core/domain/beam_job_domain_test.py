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

"""Unit tests for core.domain.beam_job_domain."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import beam_job_domain
from core.platform import models
from core.tests import test_utils
from jobs import base_validation_jobs
import utils

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])


class BeamJobTests(test_utils.TestBase):

    NOW = datetime.datetime.utcnow()

    def test_usage(self):
        job = beam_job_domain.BeamJob(
            base_validation_jobs.AuditAllStorageModelsJob)
        self.assertEqual(job.name, 'AuditAllStorageModelsJob')
        self.assertEqual(job.argument_names, [])

    def test_in_terminal_state(self):
        cancelled_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.CANCELLED.value,
            [], self.NOW, self.NOW, True)
        drained_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.DRAINED.value,
            [], self.NOW, self.NOW, True)
        updated_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.UPDATED.value,
            [], self.NOW, self.NOW, True)
        done_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.DONE.value,
            [], self.NOW, self.NOW, True)
        failed_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.FAILED.value,
            [], self.NOW, self.NOW, True)
        cancelling_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.CANCELLING.value,
            [], self.NOW, self.NOW, True)
        draining_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.DRAINING.value,
            [], self.NOW, self.NOW, True)
        pending_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.PENDING.value,
            [], self.NOW, self.NOW, True)
        running_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.RUNNING.value,
            [], self.NOW, self.NOW, True)
        stopped_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.STOPPED.value,
            [], self.NOW, self.NOW, True)
        unknown_beam_job_run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', beam_job_models.BeamJobState.UNKNOWN.value,
            [], self.NOW, self.NOW, True)

        self.assertTrue(cancelled_beam_job_run.in_terminal_state)
        self.assertTrue(drained_beam_job_run.in_terminal_state)
        self.assertTrue(updated_beam_job_run.in_terminal_state)
        self.assertTrue(done_beam_job_run.in_terminal_state)
        self.assertTrue(failed_beam_job_run.in_terminal_state)
        self.assertFalse(cancelling_beam_job_run.in_terminal_state)
        self.assertFalse(draining_beam_job_run.in_terminal_state)
        self.assertFalse(pending_beam_job_run.in_terminal_state)
        self.assertFalse(running_beam_job_run.in_terminal_state)
        self.assertFalse(stopped_beam_job_run.in_terminal_state)
        self.assertFalse(unknown_beam_job_run.in_terminal_state)

    def test_to_dict(self):
        job = beam_job_domain.BeamJob(
            base_validation_jobs.AuditAllStorageModelsJob)
        self.assertEqual(job.to_dict(), {
            'name': 'AuditAllStorageModelsJob',
            'argument_names': [],
        })


class BeamJobRunTests(test_utils.TestBase):

    NOW = datetime.datetime.utcnow()

    def test_usage(self):
        run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', 'RUNNING', ['abc', 'def'], self.NOW, self.NOW,
            True)

        self.assertEqual(run.job_id, '123')
        self.assertEqual(run.job_name, 'FooJob')
        self.assertEqual(run.job_state, 'RUNNING')
        self.assertEqual(run.job_arguments, ['abc', 'def'])
        self.assertEqual(run.job_started_on, self.NOW)
        self.assertEqual(run.job_updated_on, self.NOW)
        self.assertTrue(run.job_is_synchronous)

    def test_to_dict(self):
        run = beam_job_domain.BeamJobRun(
            '123', 'FooJob', 'RUNNING', ['abc', 'def'], self.NOW, self.NOW,
            True)

        self.assertEqual(run.to_dict(), {
            'job_id': '123',
            'job_name': 'FooJob',
            'job_state': 'RUNNING',
            'job_arguments': ['abc', 'def'],
            'job_started_on_msecs': utils.get_time_in_millisecs(self.NOW),
            'job_updated_on_msecs': utils.get_time_in_millisecs(self.NOW),
            'job_is_synchronous': True,
        })


class AggregateBeamJobRunResultTests(test_utils.TestBase):

    def test_usage(self):
        result = beam_job_domain.AggregateBeamJobRunResult('abc', '123')

        self.assertEqual(result.stdout, 'abc')
        self.assertEqual(result.stderr, '123')

    def test_to_dict(self):
        result = beam_job_domain.AggregateBeamJobRunResult('abc', '123')

        self.assertEqual(result.to_dict(), {
            'stdout': 'abc',
            'stderr': '123',
        })
