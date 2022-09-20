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

"""Jobs that are run by CRON scheduler."""

from __future__ import annotations

from core import feconf
from core.domain import user_services
from core.jobs import base_jobs
from core.jobs import job_utils
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Iterable

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])

datastore_services = models.Registry.import_datastore_services()


class CollectWeeklyDashboardStatsJob(base_jobs.JobBase):
    """One-off job for populating weekly dashboard stats for all registered
    users who have a non-None value of UserStatsModel.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        user_settings_models = (
            self.pipeline
            | 'Get all UserSettingsModels' >> (
                ndb_io.GetModels(user_models.UserSettingsModel.get_all()))
        )

        old_user_stats_models = (
            self.pipeline
            | 'Get all UserStatsModels' >> (
                ndb_io.GetModels(user_models.UserStatsModel.get_all()))
        )

        # Creates UserStatsModels if it does not exists.
        new_user_stats_models = (
            (user_settings_models, old_user_stats_models)
            | 'Merge models' >> beam.Flatten()
            # Returns a PCollection of
            # (model.id, (user_settings_models, user_stats_models)) or
            # (model.id, (user_settings_models,)).
            | 'Group models with same ID' >> beam.GroupBy(lambda m: m.id)
            # Discards model.id from the PCollection.
            | 'Get rid of key' >> beam.Values() # pylint: disable=no-value-for-parameter
            # Only keep groupings that indicate that
            # the UserStatsModel is missing.
            | 'Filter pairs of models' >> beam.Filter(
                lambda models: (
                    len(list(models)) == 1 and
                    isinstance(list(models)[0], user_models.UserSettingsModel)
                ))
            # Choosing the first element.
            | 'Transform tuples into models' >> beam.Map(
                lambda models: list(models)[0])
            # Creates the missing UserStatsModels.
            | 'Create new user stat models' >> beam.ParDo(
                CreateUserStatsModel())
        )

        unused_put_result = (
            (new_user_stats_models, old_user_stats_models)
            | 'Merge new and old models together' >> beam.Flatten()
            | 'Update the dashboard stats' >> beam.ParDo(
                UpdateWeeklyCreatorStats())
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        new_user_stats_job_result = (
            new_user_stats_models
            | 'Create new job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult('NEW MODELS'))
        )
        old_user_stats_job_result = (
            old_user_stats_models
            | 'Create old job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult('OLD MODELS'))
        )

        return (
            (new_user_stats_job_result, old_user_stats_job_result)
            | 'Merge new and old results together' >> beam.Flatten()
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class CreateUserStatsModel(beam.DoFn): # type: ignore[misc]
    """DoFn to create empty user stats model."""

    def process(
        self, user_settings_model: user_models.UserSettingsModel
    ) -> Iterable[user_models.UserStatsModel]:
        """Creates empty user stats model with id.

        Args:
            user_settings_model: UserSettingsModel. Model from which to
                create the user stats model.

        Yields:
            UserStatsModel. The created user stats model.
        """
        with datastore_services.get_ndb_context():
            user_stats_model = (
                user_models.UserStatsModel(id=user_settings_model.id))
        user_stats_model.update_timestamps()
        yield user_stats_model


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class UpdateWeeklyCreatorStats(beam.DoFn): # type: ignore[misc]
    """DoFn to update weekly dashboard stats in the user stats model."""

    def process(
        self, user_stats_model: user_models.UserStatsModel
    ) -> Iterable[user_models.UserStatsModel]:
        """Updates weekly dashboard stats with the current values.

        Args:
            user_stats_model: UserStatsModel. Model for which to update
                the weekly dashboard stats.

        Yields:
            UserStatsModel. The updated user stats model.
        """
        model = job_utils.clone_model(user_stats_model)

        schema_version = model.schema_version

        if schema_version != feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION:
            user_services.migrate_dashboard_stats_to_latest_schema(model)

        weekly_creator_stats = {
            user_services.get_current_date_as_string(): {
                'num_ratings': model.num_ratings or 0,
                'average_ratings': model.average_ratings,
                'total_plays': model.total_plays or 0
            }
        }
        model.weekly_creator_stats_list.append(weekly_creator_stats)
        model.update_timestamps()
        yield model
