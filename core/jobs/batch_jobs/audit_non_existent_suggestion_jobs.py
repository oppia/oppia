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

"""Audit job that finds feedback threads marked as having suggestions
but without a corresponding GeneralSuggestionModel.
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models
    from mypy_imports import suggestion_models

(feedback_models, suggestion_models) = models.Registry.import_models(
    [
        models.Names.FEEDBACK,
        models.Names.SUGGESTION,
    ]
)


class BaseThreadsWithMissingSuggestionsJob(base_jobs.JobBase):
    """Base class for threads with has_suggestion=True but no suggestion."""

    DATASTORE_UPDATES_ALLOWED = False

    def _get_suggestion_thread_ids(self) -> beam.PCollection[str]:
        """Returns thread_ids that have a GeneralSuggestionModel."""
        return (
            self.pipeline
            | 'Get GeneralSuggestionModels'
            >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False
                )
            )
            | 'Extract suggestion thread ids'
            >> beam.Map(lambda model: model.thread_id)
        )

    def _get_invalid_threads(
        self,
        valid_suggestion_thread_ids: beam.PCollection[str],
    ) -> beam.PCollection[feedback_models.GeneralFeedbackThreadModel]:
        """Returns threads marked as having suggestions but without one."""
        return (
            self.pipeline
            | 'Get GeneralFeedbackThreadModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter threads with missing suggestions'
            >> beam.Filter(
                lambda thread, suggestion_thread_ids: (
                    thread.has_suggestion
                    and thread.id not in suggestion_thread_ids
                ),
                beam.pvalue.AsList(valid_suggestion_thread_ids),
            )
        )


class AuditThreadsWithMissingSuggestionsJob(
    BaseThreadsWithMissingSuggestionsJob
):
    """Audit job reporting invalid feedback threads."""

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        suggestion_thread_ids = self._get_suggestion_thread_ids()
        invalid_threads = self._get_invalid_threads(suggestion_thread_ids)

        invalid_thread_logs = invalid_threads | 'Log invalid threads' >> beam.Map(
            lambda model: job_run_result.JobRunResult.as_stdout(
                (
                    'GeneralFeedbackThreadModel marked as has_suggestion=True '
                    'but no GeneralSuggestionModel exists: '
                    f'id={model.id}'
                )
            )
        )

        invalid_thread_count = (
            invalid_threads
            | 'Count invalid threads'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Report invalid thread count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'invalid_feedback_thread_models_count: {count}'
                )
            )
        )

        return (
            invalid_thread_logs,
            invalid_thread_count,
        ) | 'Flatten audit outputs' >> beam.Flatten()


class FixThreadsWithMissingSuggestionsJob(BaseThreadsWithMissingSuggestionsJob):
    """Beam job that fixes threads by setting has_suggestion=False."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        suggestion_thread_ids = self._get_suggestion_thread_ids()
        invalid_threads = self._get_invalid_threads(suggestion_thread_ids)

        updated_threads = (
            invalid_threads
            | 'Unset has_suggestion flag'
            >> beam.Map(self._unset_has_suggestion)
            | 'Put updated threads' >> ndb_io.PutModels()
        )

        updated_thread_logs = invalid_threads | 'Log fixed threads' >> beam.Map(
            lambda model: job_run_result.JobRunResult.as_stdout(
                (
                    'Fixed GeneralFeedbackThreadModel by setting '
                    f'has_suggestion=False: id={model.id}'
                )
            )
        )

        updated_thread_count = (
            invalid_threads
            | 'Count fixed threads'
            >> beam.combiners.Count.Globally().with_defaults(0)
            | 'Report fixed thread count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'fixed_feedback_thread_models_count: {count}'
                )
            )
        )

        return (
            updated_threads,
            updated_thread_logs,
            updated_thread_count,
        ) | 'Flatten fix outputs' >> beam.Flatten()

    @staticmethod
    def _unset_has_suggestion(
        thread: feedback_models.GeneralFeedbackThreadModel,
    ) -> feedback_models.GeneralFeedbackThreadModel:
        thread.has_suggestion = False
        return thread
