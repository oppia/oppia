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
    from mypy_imports import feedback_models, suggestion_models

(feedback_models, suggestion_models) = models.Registry.import_models(
    [
        models.Names.FEEDBACK,
        models.Names.SUGGESTION,
    ]
)


class FixThreadsWithMissingSuggestionsJob(base_jobs.JobBase):
    """Fixes feedback threads where has_suggestion=True but no suggestion exists.

    When DATASTORE_UPDATES_ALLOWED is False, this job behaves as an audit job
    and only reports invalid models without mutating the datastore.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the job.

        Returns:
            PCollection[JobRunResult]. Audit results when datastore updates
            are disabled, otherwise fix results.
        """

        suggestion_thread_ids = (
            self.pipeline
            | 'Get GeneralSuggestionModels'
            >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False
                )
            )
            | 'Extract suggestion thread ids'
            >> beam.Map(lambda model: model.id)
        )

        feedback_threads = (
            self.pipeline
            | 'Get GeneralFeedbackThreadModels'
            >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadModel.get_all(
                    include_deleted=False
                )
            )
            | 'Keep threads with has_suggestion=True'
            >> beam.Filter(lambda thread: thread.has_suggestion)
        )

        feedback_id_to_model = (
            feedback_threads
            | 'Map feedback threads to (id, model)'
            >> beam.Map(lambda thread: (thread.id, thread))
        )

        suggestion_id_to_none = (
            suggestion_thread_ids
            | 'Map suggestion ids to None'
            >> beam.Map(lambda thread_id: (thread_id, None))
        )

        invalid_threads = (
            {
                'feedback': feedback_id_to_model,
                'suggestions': suggestion_id_to_none,
            }
            | 'CoGroup feedback threads with suggestion ids'
            >> beam.CoGroupByKey()
            | 'Select threads with missing suggestions'
            >> beam.FlatMap(
                lambda group: (
                    group[1]['feedback'] if not group[1]['suggestions'] else []
                )
            )
        )

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

        outputs = []

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_fixed_threads_put_results = (
                invalid_threads
                | 'Unset has_suggestion flag'
                >> beam.Map(self._unset_has_suggestion)
                | 'Put updated threads' >> ndb_io.PutModels()
            )

            updated_thread_logs = (
                invalid_threads
                | 'Log fixed threads'
                >> beam.Map(
                    lambda model: job_run_result.JobRunResult.as_stdout(
                        (
                            'Fixed GeneralFeedbackThreadModel by setting '
                            f'has_suggestion=False: id={model.id}'
                        )
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

            outputs.extend(
                [
                    updated_thread_logs,
                    updated_thread_count,
                ]
            )

        else:
            outputs.extend(
                [
                    invalid_thread_logs,
                    invalid_thread_count,
                ]
            )

        return outputs | 'Flatten outputs' >> beam.Flatten()

    @staticmethod
    def _unset_has_suggestion(
        thread: feedback_models.GeneralFeedbackThreadModel,
    ) -> feedback_models.GeneralFeedbackThreadModel:
        """Unsets has_suggestion flag."""
        thread.has_suggestion = False
        return thread


class AuditThreadsWithMissingSuggestionsJob(
    FixThreadsWithMissingSuggestionsJob
):
    """Audit job reporting feedback threads with missing suggestions."""

    DATASTORE_UPDATES_ALLOWED = False
