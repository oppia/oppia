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

from __future__ import absolute_import
from __future__ import annotations
from __future__ import unicode_literals

from core.domain import search_services
from core.domain import user_services
from core.platform import models
import feconf
from jobs import base_jobs
from jobs import job_utils
from jobs.io import ndb_io
from jobs.types import job_run_result

import apache_beam as beam

from typing import Iterable, List, cast # isort:skip

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import user_models


(exp_models, user_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()
platform_search_services = models.Registry.import_search_services()


class IndexExplorationsInSearch(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    MAX_BATCH_SIZE = 1000

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the Elastic Search.
        """
        return (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    exp_models.ExpSummaryModel.get_all(include_deleted=False)))
            | 'Split models into batches' >> beam.transforms.util.BatchElements(
                max_batch_size=self.MAX_BATCH_SIZE)
            | 'Index batches of models' >> beam.ParDo(
                IndexExplorationSummaries())
        )


class IndexExplorationSummaries(beam.DoFn): # type: ignore[misc]
    """DoFn to index exploration summaries."""

    def process(
        self, exp_summary_models: List[datastore_services.Model]
    ) -> Iterable[job_run_result.JobRunResult]:
        """Index exploration summaries and catch any errors.

        Args:
            exp_summary_models: list(Model). Models to index.

        Yields:
            JobRunResult. List containing one element, which is either SUCCESS,
            or FAILURE.
        """
        try:
            search_services.index_exploration_summaries( # type: ignore[no-untyped-call]
                cast(List[exp_models.ExpSummaryModel], exp_summary_models))
            yield job_run_result.JobRunResult(
                stdout='SUCCESS %s models indexed' % len(exp_summary_models)
            )
        except platform_search_services.SearchException: # type: ignore[attr-defined]
            yield job_run_result.JobRunResult(
                stderr='FAILURE %s models not indexed' % len(exp_summary_models)
            )


class CollectWeeklyDashboardStats(base_jobs.JobBase):
    """One-off job for populating weekly dashboard stats for all registered
    users who have a non-None value of UserStatsModel.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        user_settings_models = (
            self.pipeline
            | 'Get all UserSettingsModels' >> (
                ndb_io.GetModels(user_models.UserSettingsModel.get_all())) # type: ignore[no-untyped-call]
        )

        old_user_stats_models = (
            self.pipeline
            | 'Get all UserStatsModels' >> (
                ndb_io.GetModels(user_models.UserStatsModel.get_all())) # type: ignore[no-untyped-call]
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
            | 'Count all new models' >> beam.combiners.Count.Globally()
            | 'Only create result for new models when > 0' >> (
                beam.Filter(lambda x: x > 0))
            | 'Create result for new models' >> beam.Map(
                lambda x: job_run_result.JobRunResult(
                    stdout='SUCCESS NEW %s' % x)
            )
        )
        old_user_stats_job_result = (
            old_user_stats_models
            | 'Count all old models' >> beam.combiners.Count.Globally()
            | 'Only create result for old models when > 0' >> (
                beam.Filter(lambda x: x > 0))
            | 'Create result for old models' >> beam.Map(
                lambda x: job_run_result.JobRunResult(
                    stdout='SUCCESS OLD %s' % x)
            )
        )

        return (
            (new_user_stats_job_result, old_user_stats_job_result)
            | 'Merge new and old results together' >> beam.Flatten()
        )


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
        model = cast(
            user_models.UserStatsModel,
            job_utils.clone_model(user_stats_model) # type: ignore[no-untyped-call]
        )
        schema_version = model.schema_version

        if schema_version != feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION:
            user_services.migrate_dashboard_stats_to_latest_schema(model) # type: ignore[no-untyped-call]

        weekly_creator_stats = {
            user_services.get_current_date_as_string(): { # type: ignore[no-untyped-call]
                'num_ratings': model.num_ratings or 0,
                'average_ratings': model.average_ratings,
                'total_plays': model.total_plays or 0
            }
        }
        model.weekly_creator_stats_list.append(weekly_creator_stats)
        model.update_timestamps()
        yield model
