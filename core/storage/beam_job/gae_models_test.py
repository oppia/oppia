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

    def test_put_generates_an_id(self):
        model = beam_job_models.BeamJobRunResultModel(job_id='123', batch_num=1)

        self.assertIsNone(model.key)

        model.put()

        self.assertIsNotNone(model.key)
        self.assertIsNotNone(model.key.id())

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
            export_policy['stdout'], base_models.EXPORT_POLICY.NOT_APPLICABLE)
        self.assertEqual(
            export_policy['stderr'], base_models.EXPORT_POLICY.NOT_APPLICABLE)
