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
import utils

(base_models, beam_job_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.beam_job])


class BeamJobRunModelTest(test_utils.GenericTestBase):
    """Tests for BeamJobRunModel."""

    def test_get_new_id_raises_error_after_too_many_failed_attempts(self):
        model = beam_job_models.BeamJobRunModel(
            id=beam_job_models.BeamJobRunModel.get_new_id(),
            job_name='FooJob', job_arguments=[],
            latest_job_state=beam_job_models.BeamJobState.RUNNING.value)
        model.update_timestamps()
        model.put()

        collision_context = self.swap_to_always_return(
            utils, 'convert_to_hash', value=model.id)

        with collision_context:
            self.assertRaisesRegexp(
                RuntimeError,
                r'Failed to generate a unique ID after \d+ attempts',
                beam_job_models.BeamJobRunModel.get_new_id)

    def test_get_deletion_policy(self):
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
            export_policy['dataflow_job_id'],
            base_models.EXPORT_POLICY.NOT_APPLICABLE)
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

    def test_get_new_id_raises_error_after_too_many_failed_attempts(self):
        model = beam_job_models.BeamJobRunResultModel(
            id=beam_job_models.BeamJobRunResultModel.get_new_id(), job_id='123')
        model.update_timestamps()
        model.put()

        collision_context = self.swap_to_always_return(
            utils, 'convert_to_hash', value=model.id)

        with collision_context:
            self.assertRaisesRegexp(
                RuntimeError,
                r'Failed to generate a unique ID after \d+ attempts',
                beam_job_models.BeamJobRunResultModel.get_new_id)

    def test_get_deletion_policy(self):
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
            export_policy['job_id'], base_models.EXPORT_POLICY.NOT_APPLICABLE)
        self.assertEqual(
            export_policy['stdout'], base_models.EXPORT_POLICY.NOT_APPLICABLE)
        self.assertEqual(
            export_policy['stderr'], base_models.EXPORT_POLICY.NOT_APPLICABLE)
