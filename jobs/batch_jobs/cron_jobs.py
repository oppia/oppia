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
from core.domain import recommendations_services
from core.domain import search_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
import feconf
from jobs import base_jobs
from jobs import job_utils
from jobs.io import ndb_io
from jobs.types import job_run_result
import python_utils

import apache_beam as beam

from typing import Dict, Iterable, List, Optional, Tuple, Union, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import recommendations_models
    from mypy_imports import suggestion_models
    from mypy_imports import user_models


(
    exp_models, opportunity_models,
    recommendations_models, suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.opportunity,
    models.NAMES.recommendations, models.NAMES.suggestion, models.NAMES.user
])
datastore_services = models.Registry.import_datastore_services()
platform_search_services = models.Registry.import_search_services()

MAX_RECOMMENDATIONS = 10
# Note: There is a threshold so that bad recommendations will be
# discarded even if an exploration has few similar explorations.
SIMILARITY_SCORE_THRESHOLD = 3.0


class IndexExplorationsInSearch(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    MAX_BATCH_SIZE = 1000

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
            | 'Index batches of models' >> beam.ParDo(
                IndexExplorationSummaries())
        )


class IndexExplorationSummaries(beam.DoFn): # type: ignore[misc]
    """DoFn to index exploration summaries."""

    def process(
        self, exp_summary_models: List[datastore_services.Model]
    ) -> Iterable[job_run_result.JobRunResult]:
        """Index exploration summaries and catch any errors.

        Args:
            exp_summary_models: list(Model). Models to index.

        Yields:
            JobRunResult. List containing one element, which is either SUCCESS,
            or FAILURE.
        """
        try:
            search_services.index_exploration_summaries( # type: ignore[no-untyped-call]
                cast(List[exp_models.ExpSummaryModel], exp_summary_models))
            yield job_run_result.JobRunResult(
                stdout='SUCCESS %s models indexed' % len(exp_summary_models)
            )
        except platform_search_services.SearchException: # type: ignore[attr-defined]
            yield job_run_result.JobRunResult(
                stderr='FAILURE %s models not indexed' % len(exp_summary_models)
            )


class CollectWeeklyDashboardStats(base_jobs.JobBase):
    """One-off job for populating weekly dashboard stats for all registered
    users who have a non-None value of UserStatsModel.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        user_settings_models = (
            self.pipeline
            | 'Get all UserSettingsModels' >> (
                ndb_io.GetModels(user_models.UserSettingsModel.get_all())) # type: ignore[no-untyped-call]
        )

        old_user_stats_models = (
            self.pipeline
            | 'Get all UserStatsModels' >> (
                ndb_io.GetModels(user_models.UserStatsModel.get_all())) # type: ignore[no-untyped-call]
        )

        # Creates UserStatsModels if it does not exists.
        new_user_stats_models = (
            (user_settings_models, old_user_stats_models)
            | 'Merge models' >> beam.Flatten()
            # Returns a PCollection of
            # (model.id, (user_settings_models, user_stats_models)) or
            # (model.id, (user_settings_models,)).
            | 'Group models with same ID' >> beam.GroupBy(lambda m: m.id)
            # Discards model.id from the PCollection.
            | 'Get rid of key' >> beam.Values() # pylint: disable=no-value-for-parameter
            # Only keep groupings that indicate that
            # the UserStatsModel is missing.
            | 'Filter pairs of models' >> beam.Filter(
                lambda models: (
                    len(list(models)) == 1 and
                    isinstance(list(models)[0], user_models.UserSettingsModel)
                ))
            # Choosing the first element.
            | 'Transform tuples into models' >> beam.Map(
                lambda models: list(models)[0])
            # Creates the missing UserStatsModels.
            | 'Create new user stat models' >> beam.ParDo(
                CreateUserStatsModel())
        )

        unused_put_result = (
            (new_user_stats_models, old_user_stats_models)
            | 'Merge new and old models together' >> beam.Flatten()
            | 'Update the dashboard stats' >> beam.ParDo(
                UpdateWeeklyCreatorStats())
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        new_user_stats_job_result = (
            new_user_stats_models
            | 'Count all new models' >> beam.combiners.Count.Globally()
            | 'Only create result for new models when > 0' >> (
                beam.Filter(lambda x: x > 0))
            | 'Create result for new models' >> beam.Map(
                lambda x: job_run_result.JobRunResult(
                    stdout='SUCCESS NEW %s' % x)
            )
        )
        old_user_stats_job_result = (
            old_user_stats_models
            | 'Count all old models' >> beam.combiners.Count.Globally()
            | 'Only create result for old models when > 0' >> (
                beam.Filter(lambda x: x > 0))
            | 'Create result for old models' >> beam.Map(
                lambda x: job_run_result.JobRunResult(
                    stdout='SUCCESS OLD %s' % x)
            )
        )

        return (
            (new_user_stats_job_result, old_user_stats_job_result)
            | 'Merge new and old results together' >> beam.Flatten()
        )


class CreateUserStatsModel(beam.DoFn): # type: ignore[misc]
    """DoFn to create empty user stats model."""

    def process(
        self, user_settings_model: user_models.UserSettingsModel
    ) -> Iterable[user_models.UserStatsModel]:
        """Creates empty user stats model with id.

        Args:
            user_settings_model: UserSettingsModel. Model from which to
                create the user stats model.

        Yields:
            UserStatsModel. The created user stats model.
        """
        with datastore_services.get_ndb_context():
            user_stats_model = (
                user_models.UserStatsModel(id=user_settings_model.id))
        user_stats_model.update_timestamps()
        yield user_stats_model


class UpdateWeeklyCreatorStats(beam.DoFn): # type: ignore[misc]
    """DoFn to update weekly dashboard stats in the user stats model."""

    def process(
        self, user_stats_model: user_models.UserStatsModel
    ) -> Iterable[user_models.UserStatsModel]:
        """Updates weekly dashboard stats with the current values.

        Args:
            user_stats_model: UserStatsModel. Model for which to update
                the weekly dashboard stats.

        Yields:
            UserStatsModel. The updated user stats model.
        """
        model = cast(
            user_models.UserStatsModel,
            job_utils.clone_model(user_stats_model) # type: ignore[no-untyped-call]
        )
        schema_version = model.schema_version

        if schema_version != feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION:
            user_services.migrate_dashboard_stats_to_latest_schema(model) # type: ignore[no-untyped-call]

        weekly_creator_stats = {
            user_services.get_current_date_as_string(): { # type: ignore[no-untyped-call]
                'num_ratings': model.num_ratings or 0,
                'average_ratings': model.average_ratings,
                'total_plays': model.total_plays or 0
            }
        }
        model.weekly_creator_stats_list.append(weekly_creator_stats)
        model.update_timestamps()
        yield model


class GenerateTranslationContributionStats(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Generates the translation contributins stats.

        Returns:
            PCollection. A PCollection of 'SUCCESS x' results, where x is
            the number of generated stats..
        """
        suggestions_grouped_by_target = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels( # type: ignore[no-untyped-call]
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
            # We need to window the models so that CoGroupByKey below
            # works properly.
            | 'Window the suggestions' >> beam.WindowInto(
                beam.window.Sessions(10 * 60))
            | 'Filter translate suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
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
            # We need to window the models so that CoGroupByKey below
            # works properly.
            | 'Window the opportunities' >> beam.WindowInto(
                beam.window.Sessions(10 * 60))
            | 'Transform to opportunity domain object' >> beam.Map(
                opportunity_services.
                get_exploration_opportunity_summary_from_model)
            | 'Group by ID' >> beam.GroupBy(lambda m: m.id)
        )

        new_user_stats_models = (
            {
                'suggestion': suggestions_grouped_by_target,
                'opportunity': exp_opportunities
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Get rid of key' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Generate stats' >> beam.ParDo(
                lambda x: self._generate_stats(
                    x['suggestion'][0] if len(x['suggestion']) else [],
                    x['opportunity'][0][0] if len(x['opportunity']) else None
                ))
            | 'Group by key' >> beam.GroupByKey()
            | 'Combine the stats' >> beam.CombineValues(CombineStats())
            | 'Generate models from stats' >> beam.MapTuple(
                self._generate_translation_contribution_model)
        )

        unused_put_result = (
            new_user_stats_models
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            new_user_stats_models
            | 'Count all new models' >> (
                beam.combiners.Count.Globally().without_defaults())
            | 'Only create result for new models when > 0' >> (
                beam.Filter(lambda x: x > 0))
            | 'Create result for new models' >> beam.Map(
                lambda x: job_run_result.JobRunResult(
                    stdout='SUCCESS %s' % x)
                )
        )

    @staticmethod
    def _generate_stats(
        suggestions: Iterable[suggestion_registry.SuggestionTranslateContent],
        opportunity: Optional[opportunity_domain.ExplorationOpportunitySummary]
    ) -> Iterable[Tuple[str, Dict[str, Union[bool, int, str]]]]:
        """Generates translation contribution stats for each suggestion.

        Args:
            suggestions: iter(SuggestionTranslateContent). Suggestions for which
                the stats should be generated.
            opportunity: ExplorationOpportunitySummary. Opportunity for which
                were the suggestions generated. Used to extract topic ID.

        Yields:
            tuple(str, Dict(str, *)). Tuple of key and suggestion stats dict.
            The stats dictionary has four fields:
                suggestion_status: str. What is the status of the suggestion.
                edited_by_reviewer: bool. Whether the suggestion was edited by
                    the reviewer.
                content_word_count: int. The word count of the content of
                    the suggestion.
                last_updated_date: str. When was the suggestion last updated.
        """
        # When opportunity is not available we leave the topic ID empty.
        topic_id = ''
        if opportunity is not None:
            topic_id = opportunity.topic_id

        for suggestion in suggestions:
            # Count the number of words in the original content, ignoring any
            # HTML tags and attributes.
            content_plain_text = html_cleaner.strip_html_tags( # type: ignore[no-untyped-call]
                suggestion.change.content_html) # type: ignore[attr-defined]
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
    def _generate_translation_contribution_model(
        entity_id: str,
        translation: suggestion_registry.TranslationContributionStats
    ) -> suggestion_models.TranslationContributionStatsModel:
        """Generate translation contribution stats model from the domain object.

        Args:
            entity_id: str. The ID of the model.
            translation: TranslationContributionStats. Domain object.

        Returns:
            TranslationContributionStatsModel. The created model.
        """
        language_code, contributor_user_id, topic_id = entity_id.split('.')
        with datastore_services.get_ndb_context():
            translation_contributions_stats_model = (
                suggestion_models.TranslationContributionStatsModel(
                    id=entity_id,
                    language_code=language_code,
                    contributor_user_id=contributor_user_id,
                    topic_id=topic_id,
                    submitted_translations_count=(
                        translation.submitted_translations_count),
                    submitted_translation_word_count=(
                        translation.submitted_translation_word_count),
                    accepted_translations_count=(
                        translation.accepted_translations_count),
                    accepted_translations_without_reviewer_edits_count=(
                        translation
                        .accepted_translations_without_reviewer_edits_count
                    ),
                    accepted_translation_word_count=(
                        translation.accepted_translation_word_count),
                    rejected_translations_count=(
                        translation.rejected_translations_count),
                    rejected_translation_word_count=(
                        translation.rejected_translation_word_count),
                    contribution_dates=translation.contribution_dates
                )
            )
            translation_contributions_stats_model.update_timestamps()
            return translation_contributions_stats_model


class CombineStats(beam.CombineFn):  # type: ignore[misc]
    """CombineFn for combining the stats."""

    def create_accumulator(
        self
    ) -> suggestion_registry.TranslationContributionStats:
        return suggestion_registry.TranslationContributionStats.create_default()

    def add_input(
        self,
        accumulator: suggestion_registry.TranslationContributionStats,
        translation: Dict[str, Union[bool, int, str]]
    ) -> suggestion_registry.TranslationContributionStats:
        is_accepted = (
            translation['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_not_edited = (
            is_accepted and not translation['edited_by_reviewer'])
        is_rejected = (
            translation['suggestion_status'] ==
            suggestion_models.STATUS_REJECTED
        )
        word_count = translation['content_word_count']
        suggestion_date = datetime.datetime.strptime(
            python_utils.UNICODE(translation['last_updated_date']), '%Y-%m-%d'
        ).date()
        return suggestion_registry.TranslationContributionStats( # type: ignore[no-untyped-call]
            accumulator.language_code,
            accumulator.contributor_user_id,
            accumulator.topic_id,
            accumulator.submitted_translations_count + 1,
            accumulator.submitted_translation_word_count + word_count,
            accumulator.accepted_translations_count + int(is_accepted),
            (
                accumulator.accepted_translations_without_reviewer_edits_count +
                int(is_accepted_and_not_edited)
            ),
            (
                accumulator.accepted_translation_word_count +
                word_count * int(is_accepted)
            ),
            accumulator.rejected_translations_count + int(is_rejected),
            (
                accumulator.rejected_translation_word_count +
                word_count * int(is_rejected)
            ),
            accumulator.contribution_dates | {suggestion_date}
        )

    def merge_accumulators(
        self,
        accumulators: Iterable[suggestion_registry.TranslationContributionStats]
    ) -> suggestion_registry.TranslationContributionStats:
        return suggestion_registry.TranslationContributionStats( # type: ignore[no-untyped-call]
            list(accumulators)[0].language_code,
            list(accumulators)[0].contributor_user_id,
            list(accumulators)[0].topic_id,
            sum(acc.submitted_translations_count for acc in accumulators),
            sum(acc.submitted_translation_word_count for acc in accumulators),
            sum(acc.accepted_translations_count for acc in accumulators),
            sum(
                acc.accepted_translations_without_reviewer_edits_count
                for acc in accumulators
            ),
            sum(acc.accepted_translation_word_count for acc in accumulators),
            sum(acc.rejected_translations_count for acc in accumulators),
            sum(acc.rejected_translation_word_count for acc in accumulators),
            set().union(*[acc.contribution_dates for acc in accumulators])
        )

    def extract_output(
        self, accumulator: suggestion_registry.TranslationContributionStats
    ) -> suggestion_registry.TranslationContributionStats:
        return accumulator


class ComputeExplorationRecommendations(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the Elastic Search.
        """

        exp_summary_models = (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(exp_models.ExpSummaryModel.get_all()))  # type: ignore[no-untyped-call]
        )

        exp_summary_iter = beam.pvalue.AsIter(exp_summary_models)

        exp_recommendations_models = (
            exp_summary_models
            | 'Compute similarity' >> beam.ParDo(
                ComputeSimilarity(), exp_summary_iter)
            | 'Group similarities per exploration ID' >> beam.GroupByKey()
            | 'Sort and slice similarities' >> beam.MapTuple(
                lambda exp_id, similarities: (
                    exp_id, self._sort_and_slice_similarities(similarities)))
            | 'Create recommendation models' >> beam.MapTuple(
                self._create_recommendation)
        )

        unused_put_result = (
            exp_recommendations_models
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            exp_recommendations_models
            | 'Count all new models' >> beam.combiners.Count.Globally()
            | 'Only create result for new models when > 0' >> (
                beam.Filter(lambda x: x > 0))
            | 'Create result for new models' >> beam.Map(
                lambda x: job_run_result.JobRunResult(
                    stdout='SUCCESS %s' % x))
        )

    @staticmethod
    def _sort_and_slice_similarities(
            similarities: Iterable[Dict[str, Union[str, float]]]
    ) -> List[str]:
        """Sorts similarities of explorations and slices them to
        a maximum length.

        Args:
            similarities:iterable(). Iterable of dictionaries. The structure of
                the dictionaries is:
                    exp_id: str. The ID of the similar exploration.
                    similarity_score: float. The similarity score for
                        the exploration.

        Returns:
            list(str). List of exploration IDs, sorted by the similarity.
        """
        sorted_similarities = sorted(
            similarities, reverse=True, key=lambda x: x['similarity_score'])
        return [
            python_utils.UNICODE(item['exp_id']) for item in sorted_similarities
        ][:MAX_RECOMMENDATIONS]

    @staticmethod
    def _create_recommendation(
            exp_id: str, recommended_exp_ids: Iterable[str]
    ) -> recommendations_models.ExplorationRecommendationsModel:
        """Creates exploration recommendation model.

        Args:
            exp_id: str. The exploration ID for which the recommendation is
                created.
            recommended_exp_ids: list(str). The list of recommended
                exploration IDs.

        Returns:
            ExplorationRecommendationsModel. The created model.
        """
        with datastore_services.get_ndb_context():
            exp_recommendation_model = (
                recommendations_models.ExplorationRecommendationsModel(
                    id=exp_id, recommended_exploration_ids=recommended_exp_ids))
        exp_recommendation_model.update_timestamps()
        return exp_recommendation_model


class ComputeSimilarity(beam.DoFn):  # type: ignore[misc]
    """DoFn to compute similarities between exploration."""

    def process(
        self,
        ref_exp_summary_model: datastore_services.Model,
        compared_exp_summary_models: Iterable[datastore_services.Model]
    ) -> Iterable[Tuple[str, Dict[str, Union[str, float]]]]:
        """Compute similarities between exploraitons.

        Args:
            ref_exp_summary_model: ExpSummaryModel. Reference exploration
                summary. We are trying to find explorations similar to this
                reference summary.
            compared_exp_summary_models: list(ExpSummaryModel). List of other
                explorations summaries against which we compare the reference
                summary.

        Yields:
            (str, dict(str, str|float)). Tuple, the first element is
            the exploration ID of the reference exploration summary.
            The second is a dictionary. The structure of the dictionary is:
                exp_id: str. The ID of the similar exploration.
                similarity_score: float. The similarity score for
                    the exploration.
        """
        ref_exp_summary_model = cast(
            exp_models.ExpSummaryModel, ref_exp_summary_model)
        with datastore_services.get_ndb_context():
            for compared_exp_summary_model in compared_exp_summary_models:
                compared_exp_summary_model = cast(
                    exp_models.ExpSummaryModel,
                    compared_exp_summary_model
                )
                if compared_exp_summary_model.id == ref_exp_summary_model.id:
                    continue
                similarity_score = recommendations_services.get_item_similarity( # type: ignore[no-untyped-call]
                    ref_exp_summary_model, compared_exp_summary_model
                )
                if similarity_score >= SIMILARITY_SCORE_THRESHOLD:
                    yield (
                        ref_exp_summary_model.id, {
                            'similarity_score': similarity_score,
                            'exp_id': compared_exp_summary_model.id
                        }
                    )
