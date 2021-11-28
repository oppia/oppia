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

from core.jobs import base_jobs
from core.jobs import job_utils
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(exp_models, ) = models.Registry.import_models(
    [models.NAMES.exploration])


class FindExplorationRightsWithDuplicateUsersJob(base_jobs.JobBase):
    """Validates that no user is assigned to multiple roles for 
    any exploration (owner, editor, voice artist, viewer)."""

    def run(
        self
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        return (
            self.pipeline
            | 'Get every Exploration Rights Model' >> (
                ndb_io.GetModels(exp_models.ExplorationRightsModel.query()))
            | 'Get list of users with exploration rights' >> (
                beam.Map(lambda model: (
                    self.get_property_value(model, 'owner_ids') + 
                    self.get_property_value(model, 'editor_ids') + 
                    self.get_property_value(model, 'voice_artist_ids') + 
                    self.get_property_value(model, 'viewer_ids')
                )))
            | 'Find Exploration Rights Models with duplicate users' >> (
                beam.Filter(lambda users: len(users) != len(set(users))))
            | 'Map to 1s' >> beam.Map(lambda lst: 1)
            | 'Get total number of models' >> beam.CombineGlobally(sum)
            | 'Report total' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

    def get_property_value(self, model, property_name):
        """Returns value of the given property of model

        Args:
            model: datastore_services.Model. Entity to validate.

        Returns:
            value. The value of the property of model.
        """
        return job_utils.get_model_property(model, property_name)
