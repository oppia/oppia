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

"""Jobs that are run by CRON scheduler."""

from __future__ import absolute_import
from __future__ import annotations
from __future__ import unicode_literals

import datetime

from core.domain import html_cleaner
from core.domain import opportunity_domain
from core.domain import opportunity_services
from core.domain import search_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.platform import models
import feconf
from jobs import base_jobs
from jobs.io import ndb_io
from jobs.types import job_run_result

import apache_beam as beam

from typing import Dict, Iterable, List, Optional, Set, Tuple, Union, cast

MYPY = False
if MYPY:
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models


(
    exp_models, opportunity_models, suggestion_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.opportunity, models.NAMES.suggestion
])
platform_search_services = models.Registry.import_search_services()


class IndexExplorationsInSearch(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    MAX_BATCH_SIZE = 1000

    @staticmethod
    def _index_exploration_summaries(
            exp_summary_models: List[datastore_services.Model]
    ) -> job_run_result.JobRunResult:
        """Index exploration summaries and catch any errors.

        Args:
            exp_summary_models: list(Model). Models to index.

        Returns:
            list(str). List containing one element, which is either SUCCESS,
            or FAILURE.
        """
        try:
            search_services.index_exploration_summaries( # type: ignore[no-untyped-call]
                cast(List[exp_models.ExpSummaryModel], exp_summary_models))
            return job_run_result.JobRunResult(
                stdout='SUCCESS %s models indexed' % len(exp_summary_models)
            )
        except platform_search_services.SearchException: # type: ignore[attr-defined]
            return job_run_result.JobRunResult(
                stderr='FAILURE %s models not indexed' % len(exp_summary_models)
            )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the Elastic Search.
        """
        return (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    exp_models.ExpSummaryModel.get_all(include_deleted=False)))
            | 'Split models into batches' >> beam.transforms.util.BatchElements(
                max_batch_size=self.MAX_BATCH_SIZE)
            | 'Index batches of models' >> beam.Map(
                self._index_exploration_summaries)
        )


class GenerateTranslationContributionStats(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    MAX_BATCH_SIZE = 1000

    @staticmethod
    def _generate_stats(
        suggestions: List[suggestion_registry.SuggestionTranslateContent],
        opportunity: Optional[opportunity_domain.ExplorationOpportunitySummary]
    ) -> Iterable[Tuple[str, Dict[str, Union[bool, int, str]]]]:
        """"""
        # When opportunity is not availabe we leave the topic ID empty.
        topic_id = ''
        if opportunity is not None:
            topic_id = opportunity.topic_id

        for suggestion in suggestions:
            # Count the number of words in the original content, ignoring any HTML
            # tags and attributes.
            content_plain_text = html_cleaner.strip_html_tags(
                suggestion.change.content_html)
            content_word_count = len(content_plain_text.split())

            key = (
                suggestion_models.TranslationContributionStatsModel.generate_id(
                    suggestion.language_code, suggestion.author_id, topic_id))
            translation_contribution_stats_dict = {
                'suggestion_status': suggestion.status,
                'edited_by_reviewer': suggestion.edited_by_reviewer,
                'content_word_count': content_word_count,
                'last_updated_date': suggestion.last_updated.date().isoformat()
            }
            yield (key, translation_contribution_stats_dict)

    @staticmethod
    def _combine_stats(
        translations: List[Dict[str, Union[bool, int, str]]]
    ) -> Dict[str, Union[int, Set[str]]]:
        """"""
        is_accepted = lambda trans: (
            trans['suggestion_status'] == suggestion_models.STATUS_ACCEPTED
        )
        accepted_translations = filter(is_accepted, translations)
        accepted_without_reviewer_edits_translations = filter(
            lambda trans: trans['edited_by_reviewer'], accepted_translations)
        is_rejected = lambda trans: (
            trans['suggestion_status'] == suggestion_models.STATUS_REJECTED
        )
        rejected_translations = filter(is_rejected, translations)
        get_word_count = lambda trans: trans['content_word_count']
        get_suggestion_date = lambda trans: (
            datetime.datetime.strptime(
                trans['last_updated_date'], '%Y-%m-%d').date()
        )
        return {
            'submitted_translations_count': len(translations),
            'submitted_translation_word_count': sum(
                map(get_word_count, translations)),
            'accepted_translations_count': len(accepted_translations),
            'accepted_translations_without_reviewer_edits_count': len(
                accepted_without_reviewer_edits_translations),
            'accepted_translation_word_count': sum(
                map(get_word_count, accepted_translations)),
            'rejected_translations_count': len(rejected_translations),
            'rejected_translation_word_count': sum(
                map(get_word_count, rejected_translations)),
            'contribution_dates': set(map(get_suggestion_date, translations)
            )
        }

    @staticmethod
    def _generate_translation_contribution_model(
        key_and_translation_stats: Tuple[str, Dict[str, Union[int, Set[str]]]]
    ) -> suggestion_models.TranslationContributionStatsModel:
        key, translation_stats = key_and_translation_stats
        language_code, contributor_user_id, topic_id = key.split('.')
        suggestion_models.TranslationContributionStatsModel.create(
            language_code=language_code,
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            submitted_translations_count=(
                translation_stats['submitted_translations_count']),
            submitted_translation_word_count=submitted_translation_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_without_reviewer_edits_count=(
                accepted_translations_without_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translations_count,
            rejected_translation_word_count=rejected_translation_word_count,
            contribution_dates=contribution_dates
        )


    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """"""
        suggestions_grouped_by_target = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels( # type: ignore[no-untyped-call]
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
            | 'Filter translate suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                ))
            | 'Transform to suggestion domain object' >> beam.Map(
                suggestion_services.get_suggestion_from_model)
            | 'Group by target' >> beam.GroupBy(lambda m: m.target_id)
        )
        exp_opportunities = (
            self.pipeline
            | 'Get all non-deleted opportunity models' >> ndb_io.GetModels(  # type: ignore[no-untyped-call]
                opportunity_models.ExplorationOpportunitySummaryModel.get_all(
                    include_deleted=False))
            | 'Transform to opportunity domain object' >> beam.Map(
                opportunity_services.
                get_exploration_opportunity_summary_from_model)
            | beam.GroupBy(lambda m: m.id)
        )

        new_user_stats_models = (
            {
                'suggestions': suggestions_grouped_by_target,
                'opportunities': exp_opportunities
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Get rid of key' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Generate stats' >> beam.ParDo(
                lambda x: self._generate_stats(
                    x['suggestions'],
                    x['opportunities'][0] if len(x['opportunities']) else None
                ))
            | 'Group by key' >> beam.CoGroupByKey()
            | 'Combine the stats' >> beam.CombineValues(self._combine_stats)
            | ''
        )


