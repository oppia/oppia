# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Validation Jobs for AnswerSubmittedEventLogEntryModel models"""

from __future__ import annotations

from core.domain import exp_domain, exp_fetchers, stats_domain
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import job_run_result, statistics_validation_errors
from core.platform import models

from typing import Callable, Iterator, List, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, stats_models

(
    base_models,
    stats_models,
) = models.Registry.import_models(
    [
        models.Names.BASE_MODEL,
        models.Names.STATISTICS,
    ]
)

datastore_services = models.Registry.import_datastore_services()


class AnswerSubmittedEventLogEntryModelValidationJob(
    base_validation_jobs.BaseValidationJob
):
    """Audit job for AnswerSubmittedEventLogEntryModel."""

    def get_model_class(
        self,
    ) -> Type[stats_models.AnswerSubmittedEventLogEntryModel]:
        """Returns the model class to validate."""
        return stats_models.AnswerSubmittedEventLogEntryModel

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        """Returns model-level validation functions."""

        return [
            self.validate_exploration_relation,
            self.validate_range_of_exp_version,
        ]

    def get_validate_domain_object_fn(
        self,
    ) -> Callable[
        [base_models.BaseModel], Iterator[job_run_result.JobRunResult]
    ]:
        return self.validate_domain_object

    def validate_domain_object(
        self, model: base_models.BaseModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Validates domain object."""
        assert isinstance(model, stats_models.AnswerSubmittedEventLogEntryModel)
        try:
            domain_object = stats_domain.AnswerSubmittedEventLogEntry(
                exp_id=model.exp_id,
                exp_version=model.exp_version,
                state_name=model.state_name,
                session_id=model.session_id,
                time_spent_in_state_secs=model.time_spent_in_state_secs,
                is_feedback_useful=model.is_feedback_useful,
                event_schema_version=model.event_schema_version,
            )
            domain_object.validate()

        except Exception as e:
            yield (
                statistics_validation_errors.DomainValidationError(
                    str(e), model
                )
            )

    def validate_exploration_relation(
        self, model: base_models.BaseModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Checks exploration reference."""
        assert isinstance(model, stats_models.AnswerSubmittedEventLogEntryModel)
        exploration = None
        try:
            with datastore_services.get_ndb_context():
                exploration = exp_fetchers.get_exploration_by_id(
                    exploration_id=model.exp_id, version=model.exp_version
                )

            yield from self._validate_exploration_reference(model, exploration)
            if exploration is None:
                return

            yield from self._validate_state_name_according_exploration(
                model, exploration
            )

        except Exception as e:
            yield (
                statistics_validation_errors.ExplorationDoesNotExistError(
                    str(e), model
                )
            )

    def _validate_exploration_reference(
        self, model: base_models.BaseModel, exploration: exp_domain.Exploration
    ) -> Iterator[job_run_result.JobRunResult]:
        """Checks if exp_id corresponds to a valid exploration."""
        assert isinstance(model, stats_models.AnswerSubmittedEventLogEntryModel)
        assert isinstance(exploration, exp_domain.Exploration)
        if exploration is None:
            yield (
                statistics_validation_errors.InvalidExplorationIdError(model)
            )

    def _validate_state_name_according_exploration(
        self, model: base_models.BaseModel, exploration: exp_domain.Exploration
    ) -> Iterator[job_run_result.JobRunResult]:
        """Checks state_name should be valid key in states of exploration."""
        assert isinstance(model, stats_models.AnswerSubmittedEventLogEntryModel)
        assert isinstance(exploration, exp_domain.Exploration)
        assert exploration is not None

        if model.state_name not in exploration.states:
            yield (statistics_validation_errors.InvalidStateNameError(model))

    def validate_range_of_exp_version(
        self, model: base_models.BaseModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Checks exp_version should be in valid range i.e.
        1 <= exp_version <= current exploration version.
        """
        assert isinstance(model, stats_models.AnswerSubmittedEventLogEntryModel)
        try:
            # Latest version of exploration retrieval is needed to check
            # the exp_version field.
            with datastore_services.get_ndb_context():
                exploration = exp_fetchers.get_exploration_by_id(
                    exploration_id=model.exp_id
                )
            assert exploration is not None

            if model.exp_version < 1 or model.exp_version > exploration.version:
                yield (
                    statistics_validation_errors.ExpVersionOutOfRangeError(
                        exploration.version, model
                    )
                )
        except Exception as e:
            yield (
                statistics_validation_errors.ExplorationDoesNotExistError(
                    str(e), model
                )
            )
