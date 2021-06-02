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

"""Unit tests for core.storage.beam_job.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils

(base_models, beam_job_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.beam_job])


class BeamJobRunModelTest(test_utils.GenericTestBase):
    """Tests for BeamJobRunModel."""

    def test_in_terminal_state(self):
        cancelled_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.CANCELLED.value)
        drained_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.DRAINED.value)
        updated_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.UPDATED.value)
        done_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.DONE.value)
        failed_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.FAILED.value)
        cancelling_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.CANCELLING.value)
        draining_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.DRAINING.value)
        pending_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.PENDING.value)
        running_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.RUNNING.value)
        stopped_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.STOPPED.value)
        unknown_job_run = beam_job_models.BeamJobRunModel(
            job_name='FooJob',
            latest_job_state=beam_job_models.BeamJobState.UNKNOWN.value)

        self.assertTrue(cancelled_job_run.in_terminal_state)
        self.assertTrue(drained_job_run.in_terminal_state)
        self.assertTrue(updated_job_run.in_terminal_state)
        self.assertTrue(done_job_run.in_terminal_state)
        self.assertTrue(failed_job_run.in_terminal_state)
        self.assertFalse(cancelling_job_run.in_terminal_state)
        self.assertFalse(draining_job_run.in_terminal_state)
        self.assertFalse(pending_job_run.in_terminal_state)
        self.assertFalse(running_job_run.in_terminal_state)
        self.assertFalse(stopped_job_run.in_terminal_state)
        self.assertFalse(unknown_job_run.in_terminal_state)

    def test_get_deletion_policy(self):
        """Model doesn't contain any data directly corresponding to a user."""
        self.assertEqual(
            beam_job_models.BeamJobRunModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self):
        self.assertEqual(
            beam_job_models.BeamJobRunModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self):
        export_policy = beam_job_models.BeamJobRunModel.get_export_policy()
        self.assertEqual(
            export_policy['job_name'],
            base_models.EXPORT_POLICY.NOT_APPLICABLE)
        self.assertEqual(
            export_policy['job_arguments'],
            base_models.EXPORT_POLICY.NOT_APPLICABLE)
        self.assertEqual(
            export_policy['latest_job_state'],
            base_models.EXPORT_POLICY.NOT_APPLICABLE)


class BeamJobRunResultModelTest(test_utils.GenericTestBase):
    """Tests for BeamJobRunResultModel."""

    def test_get_deletion_policy(self):
        """Model doesn't contain any data directly corresponding to a user."""
        self.assertEqual(
            beam_job_models.BeamJobRunResultModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self):
        self.assertEqual(
            beam_job_models.BeamJobRunResultModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self):
        export_policy = (
            beam_job_models.BeamJobRunResultModel.get_export_policy())
        self.assertEqual(
            export_policy['stdout'], base_models.EXPORT_POLICY.NOT_APPLICABLE)
        self.assertEqual(
            export_policy['stderr'], base_models.EXPORT_POLICY.NOT_APPLICABLE)
