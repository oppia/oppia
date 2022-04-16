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

"""Jobs that extract Collection models information."""

from __future__ import annotations

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Iterable, List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models


(exp_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class FilterRefresherExplorationIdJob(base_jobs.JobBase):
    """Job that match entity_type as collection."""

    @staticmethod
    def _flatten_user_id_to_exp_id(
        exp_id: str, owner_ids: List[str]) -> Iterable[Tuple[str, str]]:
        """Flatten owner ids to user_id in exp id to owner ids collection."""
        for user_id in owner_ids:
            yield (user_id, exp_id)

    @staticmethod
    def _flatten_exp_id_to_email(
        exp_ids_list: List[str], email: List[str]) -> Iterable[Tuple[str, str]]:
        """Flatten exploration ids to exploration id in exploration ids to email
        collection.
        """
        for exp_id in exp_ids_list:
            yield (exp_id, email[0])

    @staticmethod
    def _process_exploration_states(
        exp: exp_models.ExplorationModel) -> Iterable[Tuple[str, str]]:
        """Filter explorations with a refresher_exploration_id .

        Args:
            exp: datastore_services.Model.
                Exploration model to check for refresher_exploration_id.

        Yields:
            (str, List[str]). Tuple containing exploration id and state name.
        """

        for state_name, state in exp.states.items():
            interaction = state.interaction
            default_outcome = interaction.default_outcome
            if default_outcome is not None:
                if default_outcome.refresher_exploration_id is not None:
                    yield (exp.id, state_name)
                    continue

            for group in interaction.answer_groups:
                if group.outcome.refresher_exploration_id is not None:
                    yield (exp.id, state_name)
                    break

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of exploration id to state name and user email
        results from matching refresher_exp_id as not None in exploration.

        Returns:
            PCollection. A PCollection of 'exp_id: %s, data: %s' results from
            matching refresher_exp_id as not None in exploration.
        """
        exp_to_state_name = (
            self.pipeline
            | 'Get all Exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
            | 'Extract ' >> beam.FlatMap(
                self._process_exploration_states)
        )

        exp_rights_collection = (
            self.pipeline
            | 'Get all exp rights model' >> ndb_io.GetModels(
                exp_models.ExplorationRightsModel.get_all())
            | 'Extract exp id and exp owner id ' >> beam.Map(
                lambda exp_rights: (exp_rights.id, exp_rights.owner_ids)
            )
        )

        relevant_exp_ids = (
            exp_to_state_name
            | 'extract just the ids' >> beam.Keys() # pylint: disable=no-value-for-parameter
        )

        relevant_exp_ids_iter = beam.pvalue.AsIter(
            relevant_exp_ids)

        exp_rights_filtered = (
            exp_rights_collection
            | 'filter ' >> beam.Filter(
                lambda exp_rights, ids: (
                    exp_rights[0] in ids), ids=relevant_exp_ids_iter
            )
        )

        user_id_to_exp_id = (
            exp_rights_filtered
            | beam.FlatMapTuple(self._flatten_user_id_to_exp_id)
        )

        user_id_to_user_emails = (
            self.pipeline
            | 'Get all user settings models' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all())
            | 'Extract id and email' >> beam.Map(
                    lambda user_setting: (
                        user_setting.id, user_setting.email))
        )

        grouped_exp_id_to_email = (
            (user_id_to_exp_id, user_id_to_user_emails)
            | 'Group by user id ' >> beam.CoGroupByKey()
            | 'Drop user id ' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Filter out empty results' >> beam.Filter(
                lambda groups: len(groups[0]) > 0 and len(groups[1]) > 0)
            | 'Form tuples' >> beam.FlatMapTuple(
                lambda a, b: ((a, b),))
            | 'Flatten exp id list' >> beam.FlatMapTuple(
                self._flatten_exp_id_to_email)
            )

        grouped_email_state_name_by_exp_id = (
            {
                'user emails': grouped_exp_id_to_email,
                'state names': exp_to_state_name
            }
            | 'Group by exp id' >> beam.CoGroupByKey()
        )

        return (
            grouped_email_state_name_by_exp_id
            | 'The output' >> beam.MapTuple(
                lambda exp_id, data: job_run_result.JobRunResult.as_stdout(
                    'exp_id: %s, data: %s' % (exp_id, data)
                ))
        )
