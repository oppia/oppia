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

"""Unit tests for jobs.exp_validation_jobs."""

from __future__ import annotations

from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, ) = models.Registry.import_models(
    [models.NAMES.exploration])


class GetExpRightsWithDuplicateUsersJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = exp_validation_jobs.GetExpRightsWithDuplicateUsersJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_3 = 'id_3'

    def test_run_with_duplicate_user_rights(self) -> None:
        exploration_rights_model_1 = self.createModel(
            exp_models.ExplorationRightsModel,
            id=self.EXPLORATION_ID_1,
            owner_ids=[self.USER_ID_1],
            # Duplicate user below.
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_2],
            viewer_ids=[self.USER_ID_3],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        exploration_rights_model_2 = self.createModel(
            exp_models.ExplorationRightsModel,
            id=self.EXPLORATION_ID_2,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_2],
            voice_artist_ids=[self.USER_ID_3],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        exploration_rights_model_3 = self.createModel(
            exp_models.ExplorationRightsModel,
            id=self.EXPLORATION_ID_3,
            owner_ids=[self.USER_ID_3],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_2],
            # Duplicate user below.
            viewer_ids=[self.USER_ID_3],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )

        self.put_multi(
            [
                exploration_rights_model_1,
                exploration_rights_model_2,
                exploration_rights_model_3,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: There are 2 invalid exp rights.'),
            ]
        )
