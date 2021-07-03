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

"""One-off job for populating weekly dashboard stats."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import user_services
from core.platform import models
from jobs import base_jobs
from jobs import job_utils
from jobs.io import ndb_io
from jobs.types import job_run_result
import feconf

import apache_beam as beam

datastore_services = models.Registry.import_datastore_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])


class DashboardStatsOneOffJob(base_jobs.JobBase):
    """One-off job for populating weekly dashboard stats for all registered
    users who have a non-None value of UserStatsModel.
    """

    def run(self):
        user_settings_models = (
            self.pipeline
            | 'Get all UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.query(), self.datastoreio_stub)
        )

        user_stats_models = (
            self.pipeline
            | 'Get all UserStatsModel' >> ndb_io.GetModels(
                user_models.UserStatsModel.query(), self.datastoreio_stub)
        )

        # Creates UserStatsModels if it does not exists.
        created_models = (
            (user_settings_models, user_stats_models)
            # Combines the two pcolls
            | 'Merge PCollections' >> beam.Flatten()
            # Returns a PCollection of
            # Tuple[model.id, Tuple[user_settings_models, user_stats_models]].
            | beam.GroupBy(lambda m: m.id)
            # Discards model.id from the PCollection.
            | beam.Values()
            # Only keep groupings that indicate that the UserStatsModel is missing.
            | beam.Filter(
                lambda models: len(models) == 1 and
                job_utils.get_model_kind(models[0]) == 'UserSettingsModel')
            # Creates the missing UserStatsModels.
            | beam.ParDo(CreateUserStatsModel())
        )
        
        (
            (user_stats_models, created_models)
            | beam.Flatten()
            | beam.ParDo(UpdateDashboardStatsLog())
            | ndb_io.PutModels(self.datastoreio_stub)
        )

        job_result = (
            self.pipeline
            | beam.Create([job_run_result.JobRunResult(stdout='SUCCESS')])
        )

        return job_result


class CreateUserStatsModel(beam.DoFn):

    def process(self, user_settings_model):
        model = job_utils.clone_model(user_settings_model[0])
        user_stats_model = user_models.UserStatsModel(id=model.id)
        user_stats_model.update_timestamps()
        yield user_stats_model


class UpdateDashboardStatsLog(beam.DoFn):

    def process(self, input_model):
        model = job_utils.clone_model(input_model)

        if model.schema_version != feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION:
            user_services.migrate_dashboard_stats_to_latest_schema(model)

        weekly_dashboard_stats = {
            user_services.get_current_date_as_string(): {
                'num_ratings': model.num_ratings or 0,
                'average_ratings': model.average_ratings,
                'total_plays': model.total_plays or 0
            }
        }
        model.weekly_creator_stats_list.append(weekly_dashboard_stats)
        model.update_timestamps()
        yield model