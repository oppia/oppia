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


class BaseThreadsWithMissingSuggestionsJob(base_jobs.JobBase):
    """Base class for threads with has_suggestion=True but no suggestion."""

    DATASTORE_UPDATES_ALLOWED = False

    # TODO(#15613): Here we use MyPy ignore because the incomplete typing of
    # apache_beam library and absences of stubs in Typeshed, forces MyPy to
    # assume that PTransform class is of type Any. Thus to avoid MyPy's error
    # (Class cannot subclass 'PTransform' (has type 'Any')), we added an
    # ignore here.
    class _GetSuggestionThreadIds(beam.PTransform):  # type: ignore[misc]
        """Returns thread_ids that have a GeneralSuggestionModel."""

        def expand(self, pbegin: beam.pvalue.PBegin) -> beam.PCollection[str]:
            return (
                pbegin
                | 'Get GeneralSuggestionModels'
                >> ndb_io.GetModels(
                    suggestion_models.GeneralSuggestionModel.get_all(
                        include_deleted=False
                    )
                )
                | 'Extract suggestion thread ids'
                >> beam.Map(lambda model: model.id)
            )

    # TODO(#15613): Here we use MyPy ignore because the incomplete typing of
    # apache_beam library and absences of stubs in Typeshed, forces MyPy to
    # assume that PTransform class is of type Any. Thus to avoid MyPy's error
    # (Class cannot subclass 'PTransform' (has type 'Any')), we added an
    # ignore here.
    class _GetInvalidFeedbackThreads(beam.PTransform):  # type: ignore[misc]
        """Returns feedback threads marked as having suggestions but without one."""

        def expand(
            self,
            valid_suggestion_thread_ids: beam.PCollection[str],
        ) -> beam.PCollection[feedback_models.GeneralFeedbackThreadModel]:
            feedback_threads = (
                valid_suggestion_thread_ids.pipeline
                | 'Get GeneralFeedbackThreadModels'
                >> ndb_io.GetModels(
                    feedback_models.GeneralFeedbackThreadModel.get_all(
                        include_deleted=False
                    )
                )
                | 'Keep threads which has_suggestion=True'
                >> beam.Filter(lambda thread: thread.has_suggestion)
            )

            feedback_id_to_model = (
                feedback_threads
                | 'Map feedback threads to (id,model)'
                >> beam.Map(lambda thread: (thread.id, thread))
            )

            suggestion_id_to_none = (
                valid_suggestion_thread_ids
                | 'Map suggestion ids to None'
                >> beam.Map(lambda id: (id, None))
            )

            return (
                {
                    'feedback': feedback_id_to_model,
                    'suggestions': suggestion_id_to_none,
                }
                | 'CoGroup feedback threads with suggestion ids'
                >> beam.CoGroupByKey()
                | 'Select threads with missing suggestions'
                >> beam.FlatMap(
                    lambda group: (
                        group[1]['feedback']
                        if not group[1]['suggestions']
                        else []
                    )
                )
            )


class AuditThreadsWithMissingSuggestionsJob(
    BaseThreadsWithMissingSuggestionsJob
):
    """Audit job reporting invalid feedback threads."""

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        invalid_threads = (
            self.pipeline
            | BaseThreadsWithMissingSuggestionsJob._GetSuggestionThreadIds()
            | BaseThreadsWithMissingSuggestionsJob._GetInvalidFeedbackThreads()
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

        return (
            invalid_thread_logs,
            invalid_thread_count,
        ) | 'Flatten audit outputs' >> beam.Flatten()


class FixThreadsWithMissingSuggestionsJob(BaseThreadsWithMissingSuggestionsJob):
    """Beam job that fixes threads by setting has_suggestion=False."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        invalid_threads = (
            self.pipeline
            | BaseThreadsWithMissingSuggestionsJob._GetSuggestionThreadIds()
            | BaseThreadsWithMissingSuggestionsJob._GetInvalidFeedbackThreads()
        )

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
        """Unsets has_suggestion flag."""
        thread.has_suggestion = False
        return thread
