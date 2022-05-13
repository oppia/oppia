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

"""Validation jobs for explorations."""

from __future__ import annotations

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

(exp_models, opportunity_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.opportunity])


class GetNumberOfInvalidExplorationsJob(base_jobs.JobBase):
    """Job that retrieves the number of explorations that are invalid.
    Here, invalid means that the explorations have the following properties:
      a) The exploration is curated and has one or more states with
          defined state classifier model id.
      b) The exploration is curated and has non-empty param changes.
      c) The exploration is curated and has non-empty param specs.
      d) The exploration is curated and has one or more states which have
          interaction having answer group(s) with non-empty training data.
    """

    def get_states_having_invalid_state_classifier_id(
        self, states: dict[str, state_domain.State]) -> list[str]:
        """Returns a list of state names that have not None
        classifier model id.

        Args:
            states: dict[str, State]. The mapping of state name to State.

        Returns:
            list[str]. Returns a list of state names that have not None
            classifier model id.
        """
        invalid_state_names: list[str] = []
        for state_name in states:
            if states[state_name].classifier_model_id is not None:
                invalid_state_names.append(state_name)
        return invalid_state_names

    def filter_exps_having_invalid_state_classifier_model_id(
        self, states: dict[str, state_domain.State]) -> bool:
        """Returns True if any state has classifier model id not None.

        Args:
            states: dict(str, State). A dict of states.

        Returns:
            bool. Returns True if any state has classifier model id not None.
        """
        return any(
            state.classifier_model_id is not None for state in states.values()
        )

    def get_states_having_invalid_training_data(
        self, exploration: exp_domain.Exploration) -> list[str]:
        """Returns state names having non-empty training data.

        Args:
            exploration: Exploration. Exploration to be checked.

        Returns:
            list[str]. Returns state names having non-empty training data.
        """
        state_names: list[str] = []
        states: dict[str, state_domain.State] = exploration.states
        for state_name in states:
            answer_groups: list[state_domain.AnswerGroup] = (
                states[state_name].interaction.answer_groups)
            for answer_group in answer_groups:
                if len(answer_group.training_data) > 0:
                    state_names.append(state_name)
                    # The below break is necessary to avoid duplicated
                    # state names in the list.
                    break
        return state_names

    def filter_curated_explorations(
        self, exp_and_opp_models: tuple[str, dict[str, list[object]]]):
        """Returns whether the exp model is curated or not.

        Args:
            exp_and_opp_models: tuple. The pair of exp id and models.

        Returns:
            bool. Returns whether the exp model is curated or not.
        """
        exp_models = list(exp_and_opp_models[1]['exp_model'])
        opp_models = list(exp_and_opp_models[1]['exp_opportinity_model'])
        return len(exp_models) == 1 and len(opp_models) == 1

    def get_exploration_from_models(
        self, exp_and_opp_models: tuple[str, dict[str, list[object]]]):
        """Returns the exploration domain object from the curated
        exploration model.

        Args:
            exp_and_opp_models: tuple. The pair of exp and opportunity models.

        Returns:
            Exploration. Returns the exploration domain object from the curated
                exploration model.
        """
        exp_model = list(exp_and_opp_models[1]['exp_model'])[0]
        return exp_fetchers.get_exploration_from_model(exp_model)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of details of explorations which are invalid.

        Returns:
            PCollection[JobRunResult]. A PCollection of details of explorations
            which are invalid.
        """
        all_explorations: beam.PCollection = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Create key-value pairs for exp models' >> beam.Map(
                lambda exp_model: (exp_model.id, exp_model))
        )

        all_exp_opportunities: beam.PCollection = (
            all_explorations
            | 'Get all ExplorationOpportunitySummaryModels' >>
                ndb_io.GetModels(
                    opportunity_models.ExplorationOpportunitySummaryModel
                        .get_all(include_deleted=False))
            | 'Create key-value pairs for opportunity models' >> beam.Map(
                lambda exp_opportunity_model: (
                    exp_opportunity_model.id, exp_opportunity_model))
        )

        curated_explorations: beam.PCollection = (
            ({
                'exp_model': all_explorations,
                'exp_opportinity_model': all_exp_opportunities
            })
            | 'Combine the PCollections' >> beam.CoGroupByKey()
            | 'Filter curated explorations' >> beam.Filter(
                self.filter_curated_explorations)
            | 'Get exploration from model' >> beam.Map(
                self.get_exploration_from_models)
        )

        report_number_of_exps_queried: beam.PCollection = (
            all_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_curated_exps_queried: beam.PCollection = (
            curated_explorations
            | 'Report count of curated exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'CURATED EXPS'))
        )

        curated_exps_having_invalid_state_classifier_id: beam.PCollection = (
            curated_explorations
            | 'Filter curated exps having invalid state classifier model id' >>
                beam.Filter(lambda exp: (
                    self.filter_exps_having_invalid_state_classifier_model_id(
                        exp.states
                    )
                ))
        )

        report_number_of_exps_having_invalid_state_classifer_id: (
            beam.PCollection) = (
            curated_exps_having_invalid_state_classifier_id
            | 'Count explorations having invalid state classifier model id' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'INVALID STATE CLASSIFIER')
        )

        report_details_of_exps_having_invalid_state_classifer_id: (
            beam.PCollection) = (
            curated_exps_having_invalid_state_classifier_id
            | 'Save info on exps having invalid state classifier model id' >>
                beam.Map(
                    lambda exp: job_run_result.JobRunResult.as_stderr(
                        'The id of exp is %s and the states having not None '
                        'classifier model id are %s'
                        % (
                            exp.id,
                            self.get_states_having_invalid_state_classifier_id(
                                exp.states
                            ))
                    ))
        )

        curated_exps_having_non_empty_param_changes: beam.PCollection = (
            curated_explorations
            | 'Filter explorations having non-empty param changes' >>
                beam.Filter(lambda exp: len(exp.param_changes) > 0)
        )

        report_number_of_exps_having_invalid_param_changes: beam.PCollection = (
            curated_exps_having_non_empty_param_changes
            | 'Count explorations having non-empty param changes' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'INVALID PARAM CHANGES'))
        )

        report_details_of_exps_having_invalid_param_changes: (
            beam.PCollection) = (
            curated_exps_having_non_empty_param_changes
            | 'Save info on exps having invalid param changes' >>
                beam.Map(
                    lambda exp: job_run_result.JobRunResult.as_stderr(
                        'The id of exp is %s and the length of '
                        'its param changes is %s'
                        % (exp.id, len(exp.param_changes))
                    ))
        )

        curated_exps_having_non_empty_param_specs: beam.PCollection = (
            curated_explorations
            | 'Filter explorations having non-empty param specs' >>
                beam.Filter(lambda exp: len(exp.param_specs) > 0)
        )

        report_number_of_exps_having_invalid_param_specs: beam.PCollection = (
            curated_exps_having_non_empty_param_specs
            | 'Count explorations having non-empty param specs' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'INVALID PARAM SPECS'))
        )

        report_details_of_exps_having_invalid_param_specs: beam.PCollection = (
            curated_exps_having_non_empty_param_specs
            | 'Save info on exps having invalid param specs' >>
                beam.Map(
                    lambda exp: job_run_result.JobRunResult.as_stderr(
                        'The id of exp is %s and the length of '
                        'its param specs is %s'
                        % (exp.id, len(exp.param_specs))
                    ))
        )

        curated_exps_having_invalid_training_data: beam.PCollection = (
            curated_explorations
            | 'Filter explorations having non-empty training data' >>
                beam.Filter(lambda exp: (
                    len(self.get_states_having_invalid_training_data(exp)) > 0)
                )
        )

        report_number_of_exps_having_invalid_training_data: beam.PCollection = (
            curated_exps_having_invalid_training_data
            | 'Count explorations having non-empty training data' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'INVALID TRAINING DATA'))
        )

        report_details_of_exps_having_invalid_training_data: (
            beam.PCollection) = (
            curated_exps_having_invalid_training_data
            | 'Save info on exps having invalid training data' >> beam.Map(
                lambda exp: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the states having interaction '
                    'with non-empty training data are %s' % (
                        exp.id,
                        self.get_states_having_invalid_training_data(exp)
                    )
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_curated_exps_queried,
                report_number_of_exps_having_invalid_state_classifer_id,
                report_details_of_exps_having_invalid_state_classifer_id,
                report_number_of_exps_having_invalid_param_changes,
                report_details_of_exps_having_invalid_param_changes,
                report_number_of_exps_having_invalid_param_specs,
                report_details_of_exps_having_invalid_param_specs,
                report_number_of_exps_having_invalid_training_data,
                report_details_of_exps_having_invalid_training_data
            )
            | 'Combine results' >> beam.Flatten()
        )
