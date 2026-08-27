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

"""Beam jobs for cleaning up duplicate translation suggestions."""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam  # pylint: disable=import-error
from typing import Any, Callable, Iterable, List, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])


class CleanupDuplicateTranslationSuggestionsJob(base_jobs.JobBase):
    """Job that cleans up duplicate translation suggestions."""

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _reject_extra_suggestions(
        grouped_suggestions: Tuple[
            Tuple[str, str, str],
            Iterable[suggestion_models.GeneralSuggestionModel],
        ],
    ) -> List[suggestion_models.GeneralSuggestionModel]:
        """Keep the oldest suggestion and reject the others.

        Args:
            grouped_suggestions: tuple. A tuple containing the key and
                an iterable of suggestion models.

        Returns:
            list(GeneralSuggestionModel). A list of suggestions to be updated.
        """
        _, models_list = grouped_suggestions
        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort() method
        # instead. Reference: https://github.com/python/mypy/issues/9590.
        # Here we use type Any because the type of the created_on attribute
        # is not known to mypy at this point.
        by_created_on: Callable[
            [suggestion_models.GeneralSuggestionModel], Any
        ] = lambda m: m.created_on
        sorted_suggestions = sorted(models_list, key=by_created_on)
        # Keep the oldest one, reject the others.
        suggestions_to_reject = sorted_suggestions[1:]
        for suggestion in suggestions_to_reject:
            suggestion.status = suggestion_models.STATUS_REJECTED
            suggestion.final_reviewer_id = feconf.SUGGESTION_BOT_USER_ID
        return suggestions_to_reject

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of cleanup results.

        Returns:
            PCollection. A PCollection of the cleanup results.
        """
        suggestions_grouped_by_content = (
            self.pipeline
            | 'Get all translation suggestions in review'
            >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False
                )
                .filter(
                    suggestion_models.GeneralSuggestionModel.suggestion_type
                    == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                )
                .filter(
                    suggestion_models.GeneralSuggestionModel.status
                    == suggestion_models.STATUS_IN_REVIEW
                )
            )
            | 'Key by target_id, language_code, and content_id'
            >> beam.Map(
                lambda model: (
                    (
                        model.target_id,
                        model.language_code,
                        model.change_cmd['content_id'],
                    ),
                    model,
                )
            )
            | 'Group by content' >> beam.GroupByKey()
            | 'Convert values to list'
            >> beam.Map(lambda item: (item[0], list(item[1])))
        )

        duplicate_suggestions = (
            suggestions_grouped_by_content
            | 'Filter only duplicate groups'
            >> beam.Filter(lambda item: len(item[1]) > 1)
        )

        duplicate_suggestions_report = (
            duplicate_suggestions
            | 'Report duplicates'
            >> beam.Map(
                lambda item: job_run_result.JobRunResult.as_stdout(
                    f'Duplicates found for exploration {item[0][0]}, '
                    f'language {item[0][1]}, content_id {item[0][2]}. '
                    f'Suggestion IDs: {[m.id for m in item[1]]}'
                )
            )
        )

        duplicate_groups_count = (
            duplicate_suggestions
            | 'Count duplicate groups'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'DUPLICATE GROUPS COUNT'
                )
            )
            | 'Filter non-zero counts'
            >> beam.Filter(lambda result: 'SUCCESS: 0' not in result.stdout)
        )

        suggestions_to_update = (
            duplicate_suggestions
            | 'Reject extra suggestions'
            >> beam.FlatMap(self._reject_extra_suggestions)
        )

        total_suggestions_count = (
            suggestions_grouped_by_content
            | 'Extract suggestions' >> beam.FlatMap(lambda item: item[1])
            | 'Count total suggestions'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL SUGGESTIONS COUNT'
                )
            )
        )

        rejected_suggestions_count = (
            suggestions_to_update
            | 'Count rejected suggestions'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'REJECTED DUPLICATE SUGGESTIONS COUNT'
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                suggestions_to_update
                | 'Put models into the datastore' >> ndb_io.PutModels()
            )

        return (
            duplicate_suggestions_report,
            duplicate_groups_count,
            total_suggestions_count,
            rejected_suggestions_count,
        ) | 'Combine results' >> beam.Flatten()


class AuditDuplicateTranslationSuggestionsJob(
    CleanupDuplicateTranslationSuggestionsJob
):
    """Job that audits duplicate translation suggestions."""

    DATASTORE_UPDATES_ALLOWED = False
