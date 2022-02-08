# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Validation Jobs for exploration models"""

from __future__ import annotations

from core.constants import constants
from core.domain import rights_manager
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetExpRightsWithDuplicateUsersJob(base_jobs.JobBase):
    """Validates that no user is assigned to multiple roles for
    any exploration (owner, editor, voice artist, viewer)."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_rights = (
            self.pipeline
            | 'Get every exploration rights model' >> (
                ndb_io.GetModels(exp_models.ExplorationRightsModel.get_all()))
            | 'Get exploration rights from model' >> beam.Map(
                rights_manager.get_activity_rights_from_model,
                constants.ACTIVITY_TYPE_EXPLORATION)
        )

        exp_ids_with_duplicate_users = (
            exp_rights
            | 'Combine exp id and list of users with rights' >> beam.Map(
                lambda rights: (
                    rights.id, rights.owner_ids + rights.editor_ids +
                    rights.voice_artist_ids + rights.viewer_ids
                ))
            | 'Filter exp ids with duplicate users' >> beam.Filter(
                lambda _, user_ids: len(user_ids) != len(set(user_ids)))
        )

        report_number_of_exps_queried = (
            exp_rights
            | 'Report count of rights models' >> (
                job_result_transforms.CountObjectsToJobRunResult('#EXPS'))
        )

        report_number_of_invalid_exps = (
            exp_ids_with_duplicate_users
            | 'Report count of invalid rights models' >> (
                job_result_transforms.CountObjectsToJobRunResult('#INVALID'))
        )

        report_invalid_ids_and_users = (
            exp_ids_with_duplicate_users
            | 'Report info on each invalid exp' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    '%s: %s' % (objects[0], objects[1])
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_ids_and_users,
            )
            | 'Combine reported results' >> beam.Flatten()
        )
