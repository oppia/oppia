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

from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import (
    answerSubmittedEventLogEntryModel_validation_errors,
    job_run_result,
)
from core.platform import models
from core.domain import exp_fetchers, answer_submitted_event_log_entry_domain

from typing import Callable, Iterator, List

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

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        """Returns model-level validation functions."""

        return [
            self.validate_exploration_reference,
            self.validate_entity_id_format,
        ]

    def get_validate_domain_object_fn(
        self,
    ) -> Iterator[job_run_result.JobRunResult]:
        return self.validate_domain_object

    def validate_domain_object(
        self, model
    ) -> Iterator[job_run_result.JobRunResult]:
        """Validates domain object."""

        try:
            domain_object = answer_submitted_event_log_entry_domain.AnswerSubmittedEventLogEntry(
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
                answerSubmittedEventLogEntryModel_validation_errors.DomainValidationError(
                    model, str(e)
                )
            )

    def validate_exploration_reference(
        self, model: stats_models.AnswerSubmittedEventLogEntryModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Checks if exp_id corresponds to a valid exploration."""
        model_id = getattr(model, 'id', None)
        if not model_id or ':' not in model_id:
            yield (
                answerSubmittedEventLogEntryModel_validation_errors.InvalidEntityIdFormatError(
                    model
                )
            )
            return
        with datastore_services.get_ndb_context():
            exploration = exp_fetchers.get_exploration_by_id(model.exp_id)

        if exploration is None:
            yield (
                answerSubmittedEventLogEntryModel_validation_errors.InvalidExplorationIdError(
                    model
                )
            )

    def validate_entity_id_format(
        self, model: stats_models.AnswerSubmittedEventLogEntryModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Checks entity_id format '[timestamp]:[exp_id]:[session_id]'."""

        parts = model.id.split(':')

        if len(parts) != 3:
            yield (
                answerSubmittedEventLogEntryModel_validation_errors.InvalidEntityIdFormatError(
                    model
                )
            )
            return

        _, exp_id, session_id = parts

        if exp_id != model.exp_id or session_id != model.session_id:
            yield (
                answerSubmittedEventLogEntryModel_validation_errors.EntityIdModelMismatchError(
                    model
                )
            )
