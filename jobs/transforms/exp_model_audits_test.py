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

"""Unit tests for jobs.transforms.exp_model_audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import exp_model_audits

import apache_beam as beam

(base_models, exp_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration])


class ValidateExplorationSnapshotMetadataModelCommitCmdsSchemaTests(
        job_test_utils.PipelinedTestBase):

    def test_validate_change_domain_implemented(self):
        invalid_commit_cmd_model = exp_models.ExplorationSnapshotMetadataModel(
            id='model_id-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'],
            commit_cmds=[{'cmd': base_models.VersionedModel.CMD_DELETE_COMMIT}])

        output = (
            self.pipeline
            | beam.Create([invalid_commit_cmd_model])
            | beam.ParDo(
                exp_model_audits
                .ValidateExplorationSnapshotMetadataModelCommitCmdsSchema())
        )

        self.assert_pcoll_equal(output, [])
