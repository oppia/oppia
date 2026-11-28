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

"""Beam jobs for fixing in-review translation suggestions whose state name
does not match the state that currently contains their content (e.g. because
the state was renamed after the suggestion was submitted). See issue #27469
for context.
"""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import exp_domain, exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam  # pylint: disable=import-error
from typing import Iterable, List, Optional, Tuple, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.SUGGESTION]
)


class StaleSuggestionReportDict(TypedDict):
    """Dictionary describing an in-review translation suggestion whose state
    name does not match the state that currently contains its content.
    """

    suggestion_id: str
    exp_id: str
    content_id: str
    old_state_name: str
    # None if the content ID no longer exists in the exploration.
    new_state_name: Optional[str]


class FixStaleStateNamesInTranslationSuggestionsJob(base_jobs.JobBase):
    """Job that updates the state name of in-review translation suggestions
    whose state name does not match the state that currently contains their
    content, using the content ID of the suggestion to find the current state
    name.

    Suggestions whose content ID no longer exists in the exploration are only
    reported, since they are handled by
    RejectTranslationSuggestionsWithMissingContentIdJob.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _get_stale_suggestions(
        suggestions: Iterable[suggestion_models.GeneralSuggestionModel],
        exploration: exp_domain.Exploration,
    ) -> List[
        Tuple[
            suggestion_models.GeneralSuggestionModel, StaleSuggestionReportDict
        ]
    ]:
        """Returns the suggestions whose state name does not match the state
        that currently contains their content in the given exploration, along
        with a report for each of them.

        Args:
            suggestions: Iterable(GeneralSuggestionModel). The in-review
                translation suggestion models for the exploration.
            exploration: Exploration. The exploration domain object.

        Returns:
            list(tuple(GeneralSuggestionModel, StaleSuggestionReportDict)).
            The stale suggestion models and their reports.
        """
        stale_suggestions = []
        for suggestion in suggestions:
            state_name = suggestion.change_cmd['state_name']
            content_id = suggestion.change_cmd['content_id']
            # Ruling out the possibility of any other type for mypy type
            # checking.
            assert isinstance(state_name, str)
            assert isinstance(content_id, str)
            if state_name == constants.DEFAULT_SUGGESTION_STATE_NAME:
                continue
            current_state_name = exploration.get_state_name_for_content_id(
                content_id
            )
            if current_state_name == state_name:
                continue
            report: StaleSuggestionReportDict = {
                'suggestion_id': suggestion.id,
                'exp_id': exploration.id,
                'content_id': content_id,
                'old_state_name': state_name,
                'new_state_name': current_state_name,
            }
            stale_suggestions.append((suggestion, report))
        return stale_suggestions

    @staticmethod
    def _update_state_name(
        stale_suggestion: Tuple[
            suggestion_models.GeneralSuggestionModel, StaleSuggestionReportDict
        ],
    ) -> suggestion_models.GeneralSuggestionModel:
        """Updates the state name in the change_cmd of the given suggestion to
        the current state name from its report.

        Args:
            stale_suggestion: tuple(GeneralSuggestionModel,
                StaleSuggestionReportDict). The stale suggestion model and its
                report.

        Returns:
            GeneralSuggestionModel. The updated suggestion model.
        """
        suggestion, report = stale_suggestion
        new_state_name = report['new_state_name']
        # Ruling out the possibility of None for mypy type checking. Only
        # suggestions with a resolvable state name are passed here.
        assert new_state_name is not None
        change_cmd = dict(suggestion.change_cmd)
        change_cmd['state_name'] = new_state_name
        suggestion.change_cmd = change_cmd
        # Only the state name is changed, so the last_updated time is kept as
        # it is to preserve the order of suggestions in the review queue.
        suggestion.update_timestamps(update_last_updated_time=False)
        return suggestion

    @staticmethod
    def _format_report(report: StaleSuggestionReportDict) -> str:
        """Returns a human-readable line for the given report.

        Args:
            report: StaleSuggestionReportDict. The report to format.

        Returns:
            str. The formatted report.
        """
        if report['new_state_name'] is None:
            return (
                'Suggestion %s (exploration %s, content_id %s) has stale '
                'state name "%s" and its content no longer exists.'
                % (
                    report['suggestion_id'],
                    report['exp_id'],
                    report['content_id'],
                    report['old_state_name'],
                )
            )
        return (
            'Suggestion %s (exploration %s, content_id %s) has stale state '
            'name "%s", current state name is "%s".'
            % (
                report['suggestion_id'],
                report['exp_id'],
                report['content_id'],
                report['old_state_name'],
                report['new_state_name'],
            )
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of the job run results.

        Returns:
            PCollection. A PCollection of the job run results.
        """
        exp_id_to_suggestions = (
            self.pipeline
            | 'Get translation suggestions in review'
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
            | 'Filter exploration suggestions'
            >> beam.Filter(
                lambda model: (
                    model.target_type == feconf.ENTITY_TYPE_EXPLORATION
                )
            )
            | 'Key suggestions by exploration ID'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.target_id
            )
        )

        exp_id_to_exploration = (
            self.pipeline
            | 'Get all exploration models'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
            | 'Map exploration model to domain object'
            >> beam.Map(exp_fetchers.get_exploration_from_model)
            | 'Key explorations by ID'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda exploration: exploration.id
            )
        )

        stale_suggestions = (
            {
                'suggestions': exp_id_to_suggestions,
                'explorations': exp_id_to_exploration,
            }
            | 'Group by exploration ID' >> beam.CoGroupByKey()
            | 'Remove keys'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Filter out groups with no suggestions or no exploration'
            >> beam.Filter(
                lambda group: (
                    len(list(group['suggestions'])) > 0
                    and len(list(group['explorations'])) > 0
                )
            )
            | 'Get stale suggestions'
            >> beam.FlatMap(
                lambda group: self._get_stale_suggestions(
                    group['suggestions'], list(group['explorations'])[0]
                )
            )
        )

        resolvable_suggestions = (
            stale_suggestions
            | 'Filter resolvable suggestions'
            >> beam.Filter(lambda item: item[1]['new_state_name'] is not None)
        )

        report_results = (
            stale_suggestions
            | 'Report stale suggestions'
            >> beam.Map(
                lambda item: job_run_result.JobRunResult.as_stdout(
                    self._format_report(item[1])
                )
            )
        )

        stale_count_results = (
            stale_suggestions
            | 'Count stale suggestions'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'STALE STATE NAME SUGGESTIONS COUNT'
            )
        )

        unresolvable_count_results = (
            stale_suggestions
            | 'Filter unresolvable suggestions'
            >> beam.Filter(lambda item: item[1]['new_state_name'] is None)
            | 'Count unresolvable suggestions'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'UNRESOLVABLE SUGGESTIONS COUNT'
            )
        )

        results: List[beam.PCollection[job_run_result.JobRunResult]] = [
            report_results,
            stale_count_results,
            unresolvable_count_results,
        ]

        if self.DATASTORE_UPDATES_ALLOWED:
            updated_suggestions = (
                resolvable_suggestions
                | 'Update state names' >> beam.Map(self._update_state_name)
            )
            unused_put_results = (
                updated_suggestions
                | 'Put models into the datastore' >> ndb_io.PutModels()
            )
            results.append(
                updated_suggestions
                | 'Count updated suggestions'
                >> job_result_transforms.CountObjectsToJobRunResult(
                    'UPDATED SUGGESTIONS COUNT'
                )
            )

        return tuple(results) | 'Combine results' >> beam.Flatten()


class AuditStaleStateNamesInTranslationSuggestionsJob(
    FixStaleStateNamesInTranslationSuggestionsJob
):
    """Job that audits in-review translation suggestions whose state name
    does not match the state that currently contains their content, without
    updating them.
    """

    DATASTORE_UPDATES_ALLOWED = False
