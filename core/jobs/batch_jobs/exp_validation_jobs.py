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

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetNumberOfExpWithInvalidStateClassifierModelIdJob(base_jobs.JobBase):
    """Job that returns explorations where state classifier
    model id is not None."""

    def get_invalid_state_names(self, states):
        """Returns a list of state names that have not None
        classifier model id.

        Args:
            states: list[States]. The list of states.

        Returns:
            list[str]. Returns a list of state names that have not None
            classifier model id.
        """
        invalid_state_names = []
        for state_name in states:
            if states[state_name].classifier_model_id is not None:
                invalid_state_names.append(state_name)
        return invalid_state_names

    def filter_invalid_states(self, states):
        """Returns True if any state has classifier model id not None.

        Args:
            states: dict(str, State). A dict of states.

        Returns:
            bool. Returns True if any state has classifier model id not None.
        """
        for state_name in states:
            if states[state_name].classifier_model_id is not None:
                return True
        return False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations where
        state classifier model id is not None along with the state names.

        Returns:
            PCollection. Returns PCollection of invalid explorations
            where state classifier model id is not None along with the
            state names.
        """
        total_explorations = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        exps_having_state_classifier_model_id_not_none = (
            total_explorations
            | 'Filter explorations having state classifier model id' >>
                beam.Filter(lambda exp: (self.filter_invalid_states(
                    exp.states)))
        )

        report_number_of_exps_queried = (
            total_explorations
            | 'Report count of exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_invalid_exps = (
            exps_having_state_classifier_model_id_not_none
            | 'Report count of invalid exp models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_states_along_with_state_name = (
            exps_having_state_classifier_model_id_not_none
            | 'Save info on invalid exps' >> beam.Map(
                lambda exp: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the states having not None '
                    'classifier model id are %s'
                    % (exp.id, self.get_invalid_state_names(exp.states))
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_invalid_exps,
                report_invalid_states_along_with_state_name
            )
            | 'Combine results' >> beam.Flatten()
        )


class GetExpsHavingNonEmptyParamChangesJob(base_jobs.JobBase):
    """Job that returns explorations having non-empty param changes."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations where
        param changes is non-empty along with the length of param changes.

        Returns:
            PCollection. Returns PCollection of invalid explorations where
            param changes is non-empty along with the length of param changes.
        """
        total_exps = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        exps_having_non_empty_param_changes = (
            total_exps
            | 'Filter explorations having non-empty param changes' >>
                beam.Filter(lambda exp: len(exp.param_changes) > 0)
        )

        report_number_of_exps_queried = (
            total_exps
            | 'Count explorations' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_inavlid_exps = (
            exps_having_non_empty_param_changes
            | 'Count explorations having non-empty param changes' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_exps_along_with_their_param_changes = (
            exps_having_non_empty_param_changes
            | 'Save info on invalid exps' >> beam.Map(
                lambda exp: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param changes is %s'
                    % (exp.id, len(exp.param_changes))
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_inavlid_exps,
                report_invalid_exps_along_with_their_param_changes
            )
            | 'Combine results' >> beam.Flatten()
        )


class GetExpsHavingNonEmptyParamSpecsJob(base_jobs.JobBase):
    """Job that returns explorations having non-empty param specs."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns PCollection of invalid explorations where
        param specs is non-empty along with the length of param specs.

        Returns:
            PCollection. Returns PCollection of invalid explorations where
            param specs is non-empty along with the length of param specs.
        """
        total_exps = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
        )

        exps_having_non_empty_param_specs = (
            total_exps
            | 'Filter explorations having non-empty param specs' >>
                beam.Filter(lambda exp: len(exp.param_specs) > 0)
        )

        report_number_of_exps_queried = (
            total_exps
            | 'Count explorations' >> (
                job_result_transforms.CountObjectsToJobRunResult('EXPS'))
        )

        report_number_of_inavlid_exps = (
            exps_having_non_empty_param_specs
            | 'Count explorations having non-empty param specs' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_exps_along_with_their_param_changes = (
            exps_having_non_empty_param_specs
            | 'Save info on invalid exps' >> beam.Map(
                lambda exp: job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param specs is %s'
                    % (exp.id, len(exp.param_specs))
                ))
        )

        return (
            (
                report_number_of_exps_queried,
                report_number_of_inavlid_exps,
                report_invalid_exps_along_with_their_param_changes
            )
            | 'Combine results' >> beam.Flatten()
        )
