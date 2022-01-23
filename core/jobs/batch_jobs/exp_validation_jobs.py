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

"""Validation Jobs for exploration models"""

from __future__ import annotations

from core.constants import constants
from core.jobs import base_jobs
from core.jobs import job_utils
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

import result

(exp_models, ) = models.Registry.import_models(
    [models.NAMES.exploration])


class GetNumberOfExpRightsWithDuplicateUsersJob(base_jobs.JobBase):
    """Validates that no user is assigned to multiple roles for 
    any exploration (owner, editor, voice artist, viewer)."""

    def run(
        self
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_rights_ids_to_exp_rights = (
            self.pipeline
            | 'Get every exploration rights model' >> (
                ndb_io.GetModels(exp_models.ExplorationRightsModel.query()))
            | 'Get exploration rights from model' >> beam.Map(
                exp_fetchers.get_activity_rights_from_model, constants.ACTIVITY_TYPE_EXPLORATION)
            | 'Combine exploration and ids' >> beam.Map(
                lambda exp_rights: (exp_rights.id, exp_rights))
        )

        return (
            self.pipeline
            | 'Get every Exploration Rights Model' >> (
                lambda: exp_rights_ids_to_exp_rights)
            | 'Get list of users with exploration rights' >> (
                beam.Map(lambda id, rights: (
                    id, rights.owner_ids + rights.editor_ids + 
                    rights.voice_artist_ids + rights.viewer_ids
                )))
            | 'Find Exploration Rights Models with duplicate users' >> (
                beam.Filter(lambda id, users: len(users) != len(set(users))))
            | 'Report total' >> beam.Map(job_result_transforms.ResultsToJobRunResults())
        )
