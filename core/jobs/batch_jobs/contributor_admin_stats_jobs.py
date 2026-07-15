# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Stats generation jobs for contributor admin dashboard."""

from __future__ import annotations

from core import feconf
from core.domain import (
    exp_services,
    opportunity_services,
    skill_services,
    story_fetchers,
    topic_fetchers,
)
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Callable, Dict, Iterable, List, Optional, Tuple, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        datastore_services,
        opportunity_models,
        suggestion_models,
        topic_models,
    )

(opportunity_models, suggestion_models, topic_models) = (
    models.Registry.import_models(
        [models.Names.OPPORTUNITY, models.Names.SUGGESTION, models.Names.TOPIC]
    )
)

datastore_services = models.Registry.import_datastore_services()


class GenerateContributorAdminStatsJob(base_jobs.JobBase):
    """Job that populates model with stats used in contributor admin
    dashboard
    """

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Generates the stats for contributor admin dashboard.

        Returns:
            PCollection. A PCollection of 'SUCCESS x' results, where x is
            the number of generated stats.
        """

        general_suggestions_models = (
            self.pipeline
            | 'Get non-deleted GeneralSuggestionModel'
            >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False
                )
            )
        )

        translation_suggestions = (
            general_suggestions_models
            | 'Filter translation suggestions'
            >> beam.Filter(
                lambda m: (
                    m.suggestion_type
                    == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                )
            )
            | 'Group submitted translation suggestions by target'
            >> (beam.GroupBy(lambda m: m.target_id))
        )

        exp_opportunities = (
            self.pipeline
            | 'Get all non-deleted exp opportunity models'
            >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all(
                    include_deleted=False
                )
            )
            | 'Transform to exp opportunity domain object'
            >> beam.Map(
                opportunity_services.get_exploration_opportunity_summary_from_model
            )
            | 'Group exp opportunity by ID' >> beam.GroupBy(lambda m: m.id)
        )

        exp_opportunity_to_submitted_suggestions = (
            {
                'suggestion': translation_suggestions,
                'opportunity': exp_opportunities,
            }
            | 'Merge translation suggestion objects' >> beam.CoGroupByKey()
            | 'Get rid of key of submitted translation objects'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        shortlisted_translation_suggestions = (
            exp_opportunity_to_submitted_suggestions
            | 'Filter valid translation suggestions'
            >> beam.Filter(
                lambda grouped_data: (
                    len(grouped_data['opportunity']) > 0
                    and len(grouped_data['suggestion']) > 0
                )
            )
            | 'Extract translation suggestions only'
            >> beam.Map(lambda grouped_data: grouped_data['suggestion'])
            | 'Extract and fully flatten t suggestions'
            >> beam.FlatMap(lambda grouped_data: list(grouped_data[0]))
        )

        translation_general_suggestions_stats = (
            shortlisted_translation_suggestions
            | 'Group by language and user'
            >> beam.Map(
                lambda stats: ((stats.language_code, stats.author_id), stats)
            )
        )

        question_suggestions = (
            general_suggestions_models
            | 'Filter question suggestions'
            >> beam.Filter(
                lambda m: (
                    m.suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION
                )
            )
            | 'Group submitted question suggestions by target'
            >> (beam.GroupBy(lambda m: m.target_id))
        )

        skill_opportunities = (
            self.pipeline
            | 'Get all non-deleted skill opportunity models'
            >> (
                ndb_io.GetModels(
                    opportunity_models.SkillOpportunityModel.get_all(
                        include_deleted=False
                    )
                )
            )
            | 'Transform to skill opportunity domain object'
            >> beam.Map(opportunity_services.get_skill_opportunity_from_model)
            | 'Group skill opportunity by ID' >> beam.GroupBy(lambda m: m.id)
        )

        skill_opportunity_to_submitted_suggestions = (
            {
                'suggestion': question_suggestions,
                'opportunity': skill_opportunities,
            }
            | 'Merge submitted question objects' >> beam.CoGroupByKey()
            | 'Get rid of key of submitted question objects'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        shortlisted_question_suggestions = (
            skill_opportunity_to_submitted_suggestions
            | 'Filter valid question suggestions'
            >> beam.Filter(
                lambda grouped_data: (
                    len(grouped_data['opportunity']) > 0
                    and len(grouped_data['suggestion']) > 0
                )
            )
            | 'Extract question suggestions only'
            >> beam.Map(lambda grouped_data: grouped_data['suggestion'])
            | 'Extract and fully flatten suggestions'
            >> beam.FlatMap(lambda grouped_data: list(grouped_data[0]))
        )

        question_general_suggestions_stats = (
            shortlisted_question_suggestions
            | 'Group by user'
            >> beam.Map(lambda stats: (stats.author_id, stats))
        )

        translation_contribution_stats = (
            self.pipeline
            | 'Get all non-deleted TranslationContributionStatsModel models'
            >> ndb_io.GetModels(
                suggestion_models.TranslationContributionStatsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter translation contribution with no topic'
            >> beam.Filter(lambda m: m.topic_id != '')
            | 'Group TranslationContributionStatsModel by language and contributor'  # pylint: disable=line-too-long
            >> beam.Map(
                lambda stats: (
                    (stats.language_code, stats.contributor_user_id),
                    stats,
                )
            )
        )

        translation_reviewer_stats = (
            self.pipeline
            | 'Get all non-deleted TranslationReviewStatsModel models'
            >> ndb_io.GetModels(
                suggestion_models.TranslationReviewStatsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Group TranslationReviewStatsModel by language and reviewer'
            >> beam.Map(
                lambda stats: (
                    (stats.language_code, stats.reviewer_user_id),
                    stats,
                )
            )
        )

        question_contribution_stats = (
            self.pipeline
            | 'Get all non-deleted QuestionContributionStatsModel models'
            >> ndb_io.GetModels(
                suggestion_models.QuestionContributionStatsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Group QuestionContributionStatsModel by contributor'
            >> beam.Map(lambda stats: (stats.contributor_user_id, stats))
        )

        question_reviewer_stats = (
            self.pipeline
            | 'Get all non-deleted QuestionReviewStatsModel models'
            >> ndb_io.GetModels(
                suggestion_models.QuestionReviewStatsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Group QuestionReviewStatsModel by contributor'
            >> beam.Map(lambda stats: (stats.reviewer_user_id, stats))
        )

        translation_submitter_total_stats_model_results = (
            {
                'translation_contribution_stats': translation_contribution_stats,
                'translation_general_suggestions_stats': translation_general_suggestions_stats,
            }
            | 'Merge Translation models' >> beam.CoGroupByKey()
            | 'Transform translation contribution stats'
            >> beam.MapTuple(
                lambda key, value: self.transform_translation_contribution_stats(
                    key,
                    value['translation_contribution_stats'],
                    value['translation_general_suggestions_stats'],
                )
            )
            | 'Filter total translation contribution stats'
            >> beam.Filter(lambda res: res is not None)
        )

        translation_submitter_total_stats_models = (
            translation_submitter_total_stats_model_results
            | 'Filter translation contribution ok results'
            >> beam.Filter(lambda res: res.is_ok())
            | 'Unpack translation contribution result'
            >> beam.Map(lambda res: res.unwrap())
        )

        translation_submitter_error_job_run_results = (
            translation_submitter_total_stats_model_results
            | 'Filter translation contribution err results'
            >> beam.Filter(lambda res: res.is_err())
            | 'Transform translation contribution error to job run result'
            >> (job_result_transforms.ResultsToJobRunResults())
        )

        translation_reviewer_total_stats_models = (
            translation_reviewer_stats
            | 'Group TranslationReviewerTotalContributionStatsModel by key'
            >> beam.GroupByKey()
            | 'Transform translation reviewer stats'
            >> beam.MapTuple(self.transform_translation_review_stats)
        )

        question_submitter_total_stats_model_results = (
            {
                'question_contribution_stats': question_contribution_stats,
                'question_general_suggestions_stats': question_general_suggestions_stats,
            }
            | 'Merge Question models' >> beam.CoGroupByKey()
            | 'Transform question contribution stats'
            >> beam.MapTuple(
                lambda key, value: self.transform_question_contribution_stats(
                    key,
                    value['question_contribution_stats'],
                    value['question_general_suggestions_stats'],
                )
            )
            | 'Filter total question contribution stats'
            >> beam.Filter(lambda res: res is not None)
        )

        question_submitter_total_stats_models = (
            question_submitter_total_stats_model_results
            | 'Filter question contribution ok result'
            >> beam.Filter(lambda res: res.is_ok())
            | 'Unpack question contribution result'
            >> beam.Map(lambda res: res.unwrap())
        )

        question_submitter_error_job_run_results = (
            question_submitter_total_stats_model_results
            | 'Filter question contribution err results'
            >> beam.Filter(lambda res: res.is_err())
            | 'Transform question contribution error to job run result'
            >> (job_result_transforms.ResultsToJobRunResults())
        )

        question_reviewer_total_stats_models = (
            question_reviewer_stats
            | 'Group QuestionReviewerTotalContributionStatsModel by key'
            >> beam.GroupByKey()
            | 'Transform question reviewer stats'
            >> beam.MapTuple(self.transform_question_review_stats)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_translation_submitter_put_results = (
                translation_submitter_total_stats_models
                | 'Put TranslationSubmitterTotalContributionStatsModel models'
                >> ndb_io.PutModels()
            )

            unused_translation_reviewer_put_results = (
                translation_reviewer_total_stats_models
                | 'Put TranslationReviewerTotalContributionStatsModel models'
                >> ndb_io.PutModels()
            )

            unused_question_submitter_put_results = (
                question_submitter_total_stats_models
                | 'Put QuestionSubmitterTotalContributionStatsModel models'
                >> ndb_io.PutModels()
            )

            unused_question_reviewer_put_results = (
                question_reviewer_total_stats_models
                | 'Put QuestionReviewerTotalContributionStatsModel models'
                >> ndb_io.PutModels()
            )

        translation_submitter_models_job_run_results = (
            translation_submitter_total_stats_models
            | 'Create translation submitter job run result'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Submitter Models'
                )
            )
        )

        translation_reviewer_models_job_run_results = (
            translation_reviewer_total_stats_models
            | 'Create translation reviewer job run result'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Reviewer Models'
                )
            )
        )

        question_submitter_models_job_run_results = (
            question_submitter_total_stats_models
            | 'Create question submitter job run result'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Submitter Models'
                )
            )
        )

        question_reviewer_models_job_run_results = (
            question_reviewer_total_stats_models
            | 'Create question reviewer job run result'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Reviewer Models'
                )
            )
        )

        return (
            translation_submitter_models_job_run_results,
            translation_reviewer_models_job_run_results,
            question_submitter_models_job_run_results,
            question_reviewer_models_job_run_results,
            translation_submitter_error_job_run_results,
            question_submitter_error_job_run_results,
        ) | 'Merge job run results' >> beam.Flatten()

    @staticmethod
    def transform_translation_contribution_stats(
        keys: Tuple[str, str],
        translation_contribution_stats: Iterable[
            suggestion_models.TranslationContributionStatsModel
        ],
        translation_general_suggestions_stats: Iterable[
            suggestion_models.GeneralSuggestionModel
        ],
    ) -> Optional[
        result.Result[
            suggestion_models.TranslationSubmitterTotalContributionStatsModel,
            str,
        ]
    ]:
        """Transforms TranslationContributionStatsModel and
        GeneralSuggestionModel to
        TranslationSubmitterTotalContributionStatsModel.

        Args:
            keys: Tuple[str, str].
                Tuple of (language_code, contributor_user_id).
            translation_contribution_stats:
                Iterable[suggestion_models.TranslationContributionStatsModel].
                TranslationReviewStatsModel grouped by
                (language_code, contributor_user_id).
            translation_general_suggestions_stats:
                Iterable[suggestion_models.GeneralSuggestionModel].
                TranslationReviewStatsModel grouped by
                (language_code, author_id).

        Returns:
            TranslationSubmitterTotalContributionStatsModel. It generates and
            returns a TranslationSubmitterTotalContributionStatsModel.
        """
        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort() method
        # instead. Reference: https://github.com/python/mypy/issues/9590.
        language_code, contributor_user_id = keys
        if contributor_user_id[:4] == 'pid_':
            # No need to generate total contribution stats if user is deleted.
            return None

        by_created_on = lambda m: m.created_on
        translation_general_suggestions_sorted_stats = sorted(
            translation_general_suggestions_stats, key=by_created_on
        )

        translation_contribution_stats = list(translation_contribution_stats)
        general_suggestion_stats = list(
            translation_general_suggestions_sorted_stats
        )
        recent_review_outcomes = []

        counts = {'accepted': 0, 'accepted_with_edits': 0, 'rejected': 0}

        for v in general_suggestion_stats:
            if v.status == 'accepted' and v.edited_by_reviewer is False:
                recent_review_outcomes.append('accepted')
            elif v.status == 'accepted' and v.edited_by_reviewer is True:
                recent_review_outcomes.append('accepted_with_edits')
            elif v.status == 'rejected':
                recent_review_outcomes.append('rejected')

        if len(recent_review_outcomes) > 100:
            recent_review_outcomes = recent_review_outcomes[-100:]

        # Iterate over the list and count occurrences.
        for outcome in recent_review_outcomes:
            counts[outcome] += 1

        # Weights of recent_performance as documented in
        # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
        recent_performance = (
            counts['accepted'] + counts['accepted_with_edits']
        ) - (2 * (counts['rejected']))

        entity_id = '%s.%s' % (language_code, contributor_user_id)

        for stat in translation_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id
            ):
                translation_contribution_stats.remove(stat)

        try:
            topic_ids = [v.topic_id for v in translation_contribution_stats]
            submitted_translations_count = sum(
                v.submitted_translations_count
                for v in translation_contribution_stats
            )
            submitted_translation_word_count = sum(
                v.submitted_translation_word_count
                for v in translation_contribution_stats
            )
            accepted_translations_count = sum(
                v.accepted_translations_count
                for v in translation_contribution_stats
            )
            accepted_translations_without_reviewer_edits_count = sum(
                v.accepted_translations_without_reviewer_edits_count
                for v in translation_contribution_stats
            )
            accepted_translation_word_count = sum(
                v.accepted_translation_word_count
                for v in translation_contribution_stats
            )
            rejected_translations_count = sum(
                v.rejected_translations_count
                for v in translation_contribution_stats
            )
            rejected_translation_word_count = sum(
                v.rejected_translation_word_count
                for v in translation_contribution_stats
            )
            first_contribution_date = min(
                v.contribution_dates[0] for v in translation_contribution_stats
            )
            last_contribution_date = max(
                v.contribution_dates[-1]
                for v in (translation_contribution_stats)
            )

            # Weights of overall_accuracy as documented in
            # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
            overall_accuracy = round(
                (accepted_translations_count / submitted_translations_count)
                * (100),
                2,
            )

            with datastore_services.get_ndb_context():
                translation_submit_stats_models = suggestion_models.TranslationSubmitterTotalContributionStatsModel(  # pylint: disable=line-too-long
                    id=entity_id,
                    language_code=language_code,
                    contributor_id=contributor_user_id,
                    topic_ids_with_translation_submissions=topic_ids,
                    recent_review_outcomes=recent_review_outcomes,
                    recent_performance=recent_performance,
                    overall_accuracy=overall_accuracy,
                    submitted_translations_count=submitted_translations_count,
                    submitted_translation_word_count=(
                        submitted_translation_word_count
                    ),
                    accepted_translations_count=accepted_translations_count,
                    accepted_translations_without_reviewer_edits_count=(
                        accepted_translations_without_reviewer_edits_count
                    ),
                    accepted_translation_word_count=(
                        accepted_translation_word_count
                    ),
                    rejected_translations_count=rejected_translations_count,
                    rejected_translation_word_count=(
                        rejected_translation_word_count
                    ),
                    first_contribution_date=first_contribution_date,
                    last_contribution_date=last_contribution_date,
                )
                translation_submit_stats_models.update_timestamps()
                return result.Ok(translation_submit_stats_models)
        except Exception as e:
            return result.Err(
                'Unable to create total translation contribution stats for '
                'contributor id(%s) and language code(%s): %s'
                % (contributor_user_id, language_code, e)
            )

    @staticmethod
    def transform_translation_review_stats(
        keys: Tuple[str, str],
        translation_reviewer_stats: Iterable[
            suggestion_models.TranslationReviewStatsModel
        ],
    ) -> suggestion_models.TranslationReviewerTotalContributionStatsModel:
        """Transforms TranslationReviewStatsModel to
        TranslationReviewerTotalContributionStatsModel.

        Args:
            keys: Tuple[str, str]. Tuple of
                (language_code, reviewer_user_id).
            translation_reviewer_stats:
                Iterable[suggestion_models.TranslationReviewStatsModel].
                TranslationReviewStatsModel grouped by
                (language_code, reviewer_user_id).

        Returns:
            suggestion_models
            .TranslationReviewerTotalContributionStatsModel.
            New TranslationReviewerTotalContributionStatsModel model.
        """

        translation_reviewer_stats = list(translation_reviewer_stats)

        language_code, reviewer_user_id = keys
        entity_id = '%s.%s' % (language_code, reviewer_user_id)

        for stat in translation_reviewer_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id
            ):
                translation_reviewer_stats.remove(stat)

        topic_ids = [v.topic_id for v in translation_reviewer_stats]
        reviewed_translations_count = sum(
            v.reviewed_translations_count for v in translation_reviewer_stats
        )
        accepted_translations_count = sum(
            v.accepted_translations_count for v in translation_reviewer_stats
        )
        accepted_translations_with_reviewer_edits_count = sum(
            v.accepted_translations_with_reviewer_edits_count
            for v in translation_reviewer_stats
        )
        accepted_translation_word_count = sum(
            v.accepted_translation_word_count
            for v in translation_reviewer_stats
        )
        rejected_translations_count = (
            reviewed_translations_count - accepted_translations_count
        )
        first_contribution_date = min(
            v.first_contribution_date for v in translation_reviewer_stats
        )
        last_contribution_date = max(
            v.last_contribution_date for v in translation_reviewer_stats
        )

        with datastore_services.get_ndb_context():
            translation_review_stats_models = suggestion_models.TranslationReviewerTotalContributionStatsModel(  # pylint: disable=line-too-long
                id=entity_id,
                language_code=language_code,
                contributor_id=reviewer_user_id,
                topic_ids_with_translation_reviews=topic_ids,
                reviewed_translations_count=reviewed_translations_count,
                accepted_translations_count=accepted_translations_count,
                accepted_translations_with_reviewer_edits_count=(
                    accepted_translations_with_reviewer_edits_count
                ),
                accepted_translation_word_count=(
                    accepted_translation_word_count
                ),
                rejected_translations_count=rejected_translations_count,
                first_contribution_date=first_contribution_date,
                last_contribution_date=last_contribution_date,
            )
            translation_review_stats_models.update_timestamps()
            return translation_review_stats_models

    @staticmethod
    def transform_question_contribution_stats(
        contributor_user_id: str,
        question_contribution_stats: Iterable[
            suggestion_models.QuestionContributionStatsModel
        ],
        question_general_suggestions_stats: Iterable[
            suggestion_models.GeneralSuggestionModel
        ],
    ) -> Optional[
        result.Result[
            suggestion_models.QuestionSubmitterTotalContributionStatsModel, str
        ]
    ]:
        """Transforms QuestionContributionStatsModel and GeneralSuggestionModel
        to QuestionSubmitterTotalContributionStatsModel.

        Args:
            contributor_user_id: str. User ID acting as a key to new model.
            question_contribution_stats:
                Iterable[suggestion_models.QuestionContributionStatsModel].
                QuestionContributionStatsModel grouped by
                contributor_user_id.
            question_general_suggestions_stats:
                Iterable[suggestion_models.GeneralSuggestionModel].
                GeneralSuggestionModel grouped by author_id.

        Returns:
            QuestionSubmitterTotalContributionStatsModel. It generates and
            returns a QuestionSubmitterTotalContributionStatsModel.
        """
        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort() method
        # instead. Reference: https://github.com/python/mypy/issues/9590.
        if contributor_user_id[:4] == 'pid_':
            # No need to generate total contribution stats if user is deleted.
            return None

        by_created_on = lambda m: m.created_on
        question_general_suggestions_sorted_stats = sorted(
            question_general_suggestions_stats, key=by_created_on
        )

        question_contribution_stats = list(question_contribution_stats)
        general_suggestion_stats = list(
            question_general_suggestions_sorted_stats
        )
        recent_review_outcomes = []
        rejected_questions_count = 0

        counts = {'accepted': 0, 'accepted_with_edits': 0, 'rejected': 0}

        for v in general_suggestion_stats:
            if v.status == 'accepted' and v.edited_by_reviewer is False:
                recent_review_outcomes.append('accepted')
            elif v.status == 'accepted' and v.edited_by_reviewer is True:
                recent_review_outcomes.append('accepted_with_edits')
            elif v.status == 'rejected':
                recent_review_outcomes.append('rejected')
                rejected_questions_count += 1

        if len(recent_review_outcomes) > 100:
            recent_review_outcomes = recent_review_outcomes[-100:]

        # Iterate over the list and count occurrences.
        for outcome in recent_review_outcomes:
            counts[outcome] += 1

        # Weights of recent_performance as documented in
        # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
        recent_performance = (
            counts['accepted'] + counts['accepted_with_edits']
        ) - (2 * (counts['rejected']))

        entity_id = contributor_user_id

        for stat in question_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id
            ):
                question_contribution_stats.remove(stat)

        try:
            topic_ids = [v.topic_id for v in question_contribution_stats]
            submitted_questions_count = sum(
                v.submitted_questions_count for v in question_contribution_stats
            )
            accepted_questions_count = sum(
                v.accepted_questions_count for v in question_contribution_stats
            )
            accepted_questions_without_reviewer_edits_count = sum(
                v.accepted_questions_without_reviewer_edits_count
                for v in question_contribution_stats
            )
            first_contribution_date = min(
                (
                    v.first_contribution_date
                    for v in (question_contribution_stats)
                )
            )

            last_contribution_date = max(
                (
                    v.last_contribution_date
                    for v in (question_contribution_stats)
                )
            )

            # Weights of overall_accuracy as documented in
            # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
            overall_accuracy = round(
                accepted_questions_count / submitted_questions_count * 100, 2
            )

            with datastore_services.get_ndb_context():
                question_submit_stats_models = suggestion_models.QuestionSubmitterTotalContributionStatsModel(  # pylint: disable=line-too-long
                    id=entity_id,
                    contributor_id=contributor_user_id,
                    topic_ids_with_question_submissions=topic_ids,
                    recent_review_outcomes=recent_review_outcomes,
                    recent_performance=recent_performance,
                    overall_accuracy=overall_accuracy,
                    submitted_questions_count=submitted_questions_count,
                    accepted_questions_count=accepted_questions_count,
                    accepted_questions_without_reviewer_edits_count=(
                        accepted_questions_without_reviewer_edits_count
                    ),
                    rejected_questions_count=rejected_questions_count,
                    first_contribution_date=first_contribution_date,
                    last_contribution_date=last_contribution_date,
                )
                question_submit_stats_models.update_timestamps()
                return result.Ok(question_submit_stats_models)
        except Exception as e:
            return result.Err(
                'Unable to create total question contribution stats for '
                'contributor id(%s): %s' % (contributor_user_id, e)
            )

    @staticmethod
    def transform_question_review_stats(
        reviewer_user_id: str,
        question_reviewer_stats: Iterable[
            suggestion_models.QuestionReviewStatsModel
        ],
    ) -> suggestion_models.QuestionReviewerTotalContributionStatsModel:
        """Transforms QuestionReviewStatsModel to
        QuestionReviewerTotalContributionStatsModel.

        Args:
            reviewer_user_id: str. User ID acting as a key to new model.
            question_reviewer_stats:
                Iterable[suggestion_models.QuestionReviewStatsModel].
                QuestionReviewStatsModel grouped by
                reviewer_user_id.

        Returns:
            suggestion_models.QuestionReviewerTotalContributionStatsModel.
            New QuestionReviewerTotalContributionStatsModel model.
        """

        question_reviewer_stats = list(question_reviewer_stats)
        entity_id = reviewer_user_id

        topic_ids = [v.topic_id for v in question_reviewer_stats]
        reviewed_questions_count = sum(
            v.reviewed_questions_count for v in question_reviewer_stats
        )
        accepted_questions_count = sum(
            v.accepted_questions_count for v in question_reviewer_stats
        )
        accepted_questions_with_reviewer_edits_count = sum(
            v.accepted_questions_with_reviewer_edits_count
            for v in question_reviewer_stats
        )
        rejected_questions_count = (
            reviewed_questions_count - accepted_questions_count
        )
        first_contribution_date = min(
            (v.first_contribution_date for v in question_reviewer_stats)
        )
        last_contribution_date = max(
            (v.last_contribution_date for v in question_reviewer_stats)
        )

        with datastore_services.get_ndb_context():
            question_review_stats_models = suggestion_models.QuestionReviewerTotalContributionStatsModel(  # pylint: disable=line-too-long
                id=entity_id,
                contributor_id=reviewer_user_id,
                topic_ids_with_question_reviews=topic_ids,
                reviewed_questions_count=reviewed_questions_count,
                accepted_questions_count=accepted_questions_count,
                accepted_questions_with_reviewer_edits_count=(
                    accepted_questions_with_reviewer_edits_count
                ),
                rejected_questions_count=rejected_questions_count,
                first_contribution_date=first_contribution_date,
                last_contribution_date=last_contribution_date,
            )
            question_review_stats_models.update_timestamps()
            return question_review_stats_models

    @staticmethod
    def not_validate_topic(topic_id: str) -> bool:
        """Validates if there exist a topic with a given topic ID.

        Args:
            topic_id: str. The id of the topic that needs to be validated.

        Returns:
            bool. True if topic doesn't exist and False if topic exists.
        """
        with datastore_services.get_ndb_context():
            topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            return True

        return False


class AuditGenerateContributorAdminStatsJob(GenerateContributorAdminStatsJob):
    """Audit Job for GenerateContributorAdminStatsJob"""

    DATASTORE_UPDATES_ALLOWED = False


class AuditAndLogIncorretDataInContributorAdminStatsJob(base_jobs.JobBase):
    """Job that finds the suggestion models for which stats models are missing
    and log them as job run results. Also then verify whether there are
    opportunity models for these suggestions and log them along with the
    suggestion model.
    """

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Return the suggestion models for which stats models are missing
        contribution stats models along with a boolean field, showing the
        existence of corresponding opportunity model

        Returns:
            PCollection. A PCollection of 'SUCCESS x' results, where x is
            the number of suggestion models for which stats models are missing
            and such suggestion models with a boolean field showing the
            existence of corresponding opportunity model.
        """

        general_suggestions_models = (
            self.pipeline
            | 'Get non-deleted GeneralSuggestionModel'
            >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False
                )
            )
        )

        translation_general_suggestions_stats = (
            general_suggestions_models
            | 'Filter reviewed translate suggestions'
            >> beam.Filter(
                lambda m: (
                    m.suggestion_type
                    == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                )
            )
            | 'Group by language and user'
            >> beam.Map(
                lambda stats: ((stats.language_code, stats.author_id), stats)
            )
        )

        question_general_suggestions_stats = (
            general_suggestions_models
            | 'Filter reviewed questions suggestions'
            >> beam.Filter(
                lambda m: (
                    m.suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION
                )
            )
            | 'Group by user'
            >> beam.Map(lambda stats: (stats.author_id, stats))
        )

        translation_contribution_stats = (
            self.pipeline
            | 'Get all non-deleted TranslationContributionStatsModel models'
            >> ndb_io.GetModels(
                suggestion_models.TranslationContributionStatsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter translation contribution with no topic'
            >> beam.Filter(lambda m: m.topic_id != '')
            | 'Group TranslationContributionStatsModel by language and contributor'  # pylint: disable=line-too-long
            >> beam.Map(
                lambda stats: (
                    (stats.language_code, stats.contributor_user_id),
                    stats,
                )
            )
        )

        question_contribution_stats = (
            self.pipeline
            | 'Get all non-deleted QuestionContributionStatsModel models'
            >> ndb_io.GetModels(
                suggestion_models.QuestionContributionStatsModel.get_all(
                    include_deleted=False
                )
            )
            | 'Group QuestionContributionStatsModel by contributor'
            >> beam.Map(lambda stats: (stats.contributor_user_id, stats))
        )

        translation_suggestion_counts_and_logs = (
            {
                'translation_contribution_stats': translation_contribution_stats,
                'translation_general_suggestions_stats': translation_general_suggestions_stats,
            }
            | 'Merge Translation models' >> beam.CoGroupByKey()
            | 'Get translation suggestion count and logs'
            >> beam.MapTuple(
                lambda key, value: self.log_translation_contribution(
                    value['translation_contribution_stats'],
                    value['translation_general_suggestions_stats'],
                )
            )
            | 'Filter out None values from translation suggestion'
            >> beam.Filter(lambda x: x is not None)
        )

        translation_suggestion_count_result = (
            translation_suggestion_counts_and_logs
            | 'Unpack translation suggestion counts'
            >> beam.Map(lambda element: element[0])
            | 'Total translation suggestion count' >> beam.CombineGlobally(sum)
            | 'Report translation suggestion count'
            >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        'LOGGED TRANSLATION SUGGESTION COUNT SUCCESS: '
                        f'{result}'
                    )
                )
            )
        )

        translation_suggestion_logs = (
            translation_suggestion_counts_and_logs
            | 'Unpack translation suggestion logs'
            >> beam.Map(
                lambda element: (
                    job_run_result.JobRunResult.as_stdout(element[1])
                )
            )
        )

        question_suggestion_counts_and_logs = (
            {
                'question_contribution_stats': question_contribution_stats,
                'question_general_suggestions_stats': question_general_suggestions_stats,
            }
            | 'Merge Question models' >> beam.CoGroupByKey()
            | 'Get question suggestion count and logs'
            >> beam.MapTuple(
                lambda key, value: self.log_question_contribution(
                    value['question_contribution_stats'],
                    value['question_general_suggestions_stats'],
                )
            )
            | 'Filter out None values from question suggestion'
            >> beam.Filter(lambda x: x is not None)
        )

        question_suggestion_count_result = (
            question_suggestion_counts_and_logs
            | 'Unpack question suggestion counts'
            >> beam.Map(lambda element: element[0])
            | 'Total question suggestion count' >> beam.CombineGlobally(sum)
            | 'Report question suggestion count'
            >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'LOGGED QUESTION SUGGESTION COUNT SUCCESS: {result}'
                    )
                )
            )
        )

        question_suggestion_logs = (
            question_suggestion_counts_and_logs
            | 'Unpack question suggestion logs'
            >> beam.Map(
                lambda element: (
                    job_run_result.JobRunResult.as_stdout(element[1])
                )
            )
        )

        return (
            translation_suggestion_count_result,
            question_suggestion_count_result,
            translation_suggestion_logs,
            question_suggestion_logs,
        ) | 'Merge job run results' >> beam.Flatten()

    @staticmethod
    def log_translation_contribution(
        translation_contribution_stats: Iterable[
            suggestion_models.TranslationContributionStatsModel
        ],
        translation_general_suggestions_stats: Iterable[
            suggestion_models.GeneralSuggestionModel
        ],
    ) -> Optional[Tuple[int, str]]:
        """Returns number and logs of translation suggestion models for which
        translation contribution stats models are missing or invalid, for a
        particular language code and contributor user id

        Args:
            translation_contribution_stats:
                Iterable[suggestion_models.TranslationContributionStatsModel].
                TranslationReviewStatsModel grouped by
                (language_code, contributor_user_id).
            translation_general_suggestions_stats:
                Iterable[suggestion_models.GeneralSuggestionModel].
                TranslationReviewStatsModel grouped by
                (language_code, author_id).

        Returns:
            A 2-tuple (if any) with the following elements:
            - int. The number of suggestion models for which stats models are
            missing or invalid.
            - str. The debug logs, containing information about suggestion
            models for which stats models are missing or invalid.
        """
        translation_contribution_stats = list(translation_contribution_stats)
        valid_topic_ids_with_contribution_stats: List[str] = []
        for stat in translation_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id
            ):
                translation_contribution_stats.remove(stat)
            else:
                valid_topic_ids_with_contribution_stats.append(stat.topic_id)

        general_suggestion_models = list(translation_general_suggestions_stats)

        debug_logs = '<====TRANSLATION_CONTRIBUTION====>\n'

        logged_suggestions_count = 0

        with datastore_services.get_ndb_context():
            for s in general_suggestion_models:

                story_id = exp_services.get_story_id_linked_to_exploration(
                    s.target_id
                )
                if story_id is None:
                    logged_suggestions_count += 1
                    debug_logs += (
                        # No exp context model exists.
                        '{\n'
                        f'suggestion_id: {s.id},\n'
                        f'suggestion_type: {s.suggestion_type},\n'
                        f'target_type: {s.target_type},\n'
                        f'traget_id: {s.target_id},\n'
                        'target_verion_at_submission: '
                        f'{s.target_version_at_submission},\n'
                        f'status: {s.status},\n'
                        f'language_code: {s.language_code},\n'
                        'corresponding_topic_id: [\n{'
                        f'topic_id: None, '
                        'problem: no_exp_context_model},\n],\n'
                    )

                    # Check if xploration opportunity model exists.
                    opportunity_model_exists = opportunity_models.ExplorationOpportunitySummaryModel.get_by_id(
                        s.target_id
                    ) is not (
                        None
                    )
                    debug_logs += (
                        'exp_opportunity_model_exists: '
                        f'{opportunity_model_exists},\n'
                        '},\n'
                    )
                else:
                    story = story_fetchers.get_story_by_id(
                        story_id, strict=False
                    )
                    if story is None:
                        logged_suggestions_count += 1
                        debug_logs += (
                            # No story context model exists.
                            '{\n'
                            f'suggestion_id: {s.id},\n'
                            f'suggestion_type: {s.suggestion_type},\n'
                            f'target_type: {s.target_type},\n'
                            f'traget_id: {s.target_id},\n'
                            'target_verion_at_submission: '
                            f'{s.target_version_at_submission},\n'
                            f'status: {s.status},\n'
                            f'language_code: {s.language_code},\n'
                            'corresponding_topic_id: [\n{'
                            f'topic_id: None, '
                            'problem: no_story_model},\n],\n'
                        )

                        # Check if xploration opportunity model exists.
                        opportunity_model_exists = opportunity_models.ExplorationOpportunitySummaryModel.get_by_id(
                            s.target_id
                        ) is not (
                            None
                        )
                        debug_logs += (
                            'exp_opportunity_model_exists: '
                            f'{opportunity_model_exists},\n'
                            '},\n'
                        )
                    else:
                        topic_id = story.corresponding_topic_id
                        if topic_id not in (
                            valid_topic_ids_with_contribution_stats
                        ):
                            # Valid stats model does not exists.
                            logged_suggestions_count += 1
                            debug_logs += (
                                '{\n'
                                f'suggestion_id: {s.id},\n'
                                f'suggestion_type: {s.suggestion_type},\n'
                                f'target_type: {s.target_type},\n'
                                f'traget_id: {s.target_id},\n'
                                'target_verion_at_submission: '
                                f'{s.target_version_at_submission},\n'
                                f'status: {s.status},\n'
                                f'language_code: {s.language_code},\n'
                                'corresponding_topic_id: [\n{'
                                f'topic_id: {topic_id}, '
                                'problem: no_stats_model},\n],\n'
                            )

                            # Check if xploration opportunity model exists.
                            opportunity_model_exists = opportunity_models.ExplorationOpportunitySummaryModel.get_by_id(
                                s.target_id
                            ) is not (
                                None
                            )
                            debug_logs += (
                                'exp_opportunity_model_exists: '
                                f'{opportunity_model_exists},\n'
                                '},\n'
                            )

        if logged_suggestions_count == 0:
            return None
        else:
            return (logged_suggestions_count, debug_logs)

    @staticmethod
    def log_question_contribution(
        question_contribution_stats: Iterable[
            suggestion_models.QuestionContributionStatsModel
        ],
        question_general_suggestions_stats: Iterable[
            suggestion_models.GeneralSuggestionModel
        ],
    ) -> Optional[Tuple[int, str]]:
        """Returns number and logs of questions suggestion models for which
        quesion contribution stats models are missing or invalid, for a
        particular contributor user id

        Args:
            question_contribution_stats:
                Iterable[suggestion_models.QuestionContributionStatsModel].
                QuestionContributionStatsModel grouped by
                contributor_user_id.
            question_general_suggestions_stats:
                Iterable[suggestion_models.GeneralSuggestionModel].
                GeneralSuggestionModel grouped by author_id.

        Returns:
            A 2-tuple (if any) with the following elements:
            - int. The number of suggestion models for which stats models are
            missing or invalid.
            - str. The debug logs, containing information about suggestion
            models for which stats models are missing or invalid.
        """
        question_contribution_stats = list(question_contribution_stats)
        valid_topic_ids_with_contribution_stats: List[str] = []
        for stat in question_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id
            ):
                question_contribution_stats.remove(stat)
            else:
                valid_topic_ids_with_contribution_stats.append(stat.topic_id)

        general_suggestion_stats = list(question_general_suggestions_stats)

        debug_logs = '<====QUESTION_CONTRIBUTION====>\n'

        logged_suggestions_count = 0

        with datastore_services.get_ndb_context():
            for s in general_suggestion_stats:
                topic_assignments = list(
                    skill_services.get_all_topic_assignments_for_skill(
                        s.target_id
                    )
                )
                for t in topic_assignments:
                    if t.topic_id not in (
                        valid_topic_ids_with_contribution_stats
                    ):
                        # Valid stats model does not exists.
                        logged_suggestions_count += 1
                        debug_logs += (
                            '{\n'
                            f'suggestion_id: {s.id},\n'
                            f'suggestion_type: {s.suggestion_type},\n'
                            f'target_type: {s.target_type},\n'
                            f'traget_id: {s.target_id},\n'
                            'target_verion_at_submission: '
                            f'{s.target_version_at_submission},\n'
                            f'status: {s.status},\n'
                            'corresponding_topic_id: [\n{'
                            f'topic_id: {t.topic_id}, '
                            'problem: no_stats_model},\n],\n'
                        )

                        # Check if xploration opportunity model exists.
                        opportunity_model_exists = (
                            opportunity_models.SkillOpportunityModel.get_by_id(
                                s.target_id
                            )
                            is not None
                        )

                        debug_logs += (
                            'skill_opportunity_model_exists: '
                            f'{opportunity_model_exists},\n'
                            '},\n'
                        )

        if logged_suggestions_count == 0:
            return None
        else:
            return (logged_suggestions_count, debug_logs)


class ValidateTotalContributionStatsJob(base_jobs.JobBase):
    """Validation job for verifying total contribution stats without
    per-element datastore calls."""

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Validates the total translation and question contribution stats.

        Returns:
            PCollection. A PCollection of job results.
        """

        # Fetch all the data.
        general_suggestions_models = (
            self.pipeline
            | 'Get General Suggestions'
            >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False
                )
            )
        )

        translation_totals = self.pipeline | 'Get Translation Totals' >> ndb_io.GetModels(
            suggestion_models.TranslationSubmitterTotalContributionStatsModel.get_all(
                include_deleted=False
            )
        )

        translation_contribs = (
            self.pipeline
            | 'Get Translation Contributions'
            >> ndb_io.GetModels(
                suggestion_models.TranslationContributionStatsModel.get_all(
                    include_deleted=False
                )
            )
        )

        all_translation_suggestions_grouped_by_topic_id = (
            general_suggestions_models
            | 'Filter translation suggestions'
            >> beam.Filter(
                lambda m: (
                    m.suggestion_type
                    == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                )
            )
            | 'Group submitted translation suggestions by target'
            >> (beam.GroupBy(lambda m: m.target_id))
        )

        exp_opportunities = (
            self.pipeline
            | 'Get all non-deleted exp opportunity models'
            >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all(
                    include_deleted=False
                )
            )
            | 'Transform to exp opportunity domain object'
            >> beam.Map(
                opportunity_services.get_exploration_opportunity_summary_from_model
            )
            | 'Group exp opportunity by ID' >> beam.GroupBy(lambda m: m.id)
        )

        exp_opportunity_to_translation_suggestions = (
            {
                'suggestion': all_translation_suggestions_grouped_by_topic_id,
                'opportunity': exp_opportunities,
            }
            | 'Merge translation suggestion objects' >> beam.CoGroupByKey()
            | 'Get rid of key of submitted translation objects'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        translation_suggestions = (
            exp_opportunity_to_translation_suggestions
            | 'Filter valid translation suggestions'
            >> beam.Filter(
                lambda grouped_data: (
                    len(grouped_data['opportunity']) > 0
                    and len(grouped_data['suggestion']) > 0
                )
            )
            | 'Extract translation suggestions only'
            >> beam.Map(lambda grouped_data: grouped_data['suggestion'])
            | 'Extract and fully flatten t suggestions'
            >> beam.FlatMap(lambda grouped_data: list(grouped_data[0]))
        )

        question_totals = self.pipeline | 'Get Question Totals' >> ndb_io.GetModels(
            suggestion_models.QuestionSubmitterTotalContributionStatsModel.get_all(
                include_deleted=False
            )
        )

        question_contribs = (
            self.pipeline
            | 'Get Question Contributions'
            >> ndb_io.GetModels(
                suggestion_models.QuestionContributionStatsModel.get_all(
                    include_deleted=False
                )
            )
        )

        all_question_suggestions_grouped_by_skill_id = (
            general_suggestions_models
            | 'Filter question suggestions'
            >> beam.Filter(
                lambda m: (
                    m.suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION
                )
            )
            | 'Group submitted question suggestions by target'
            >> (beam.GroupBy(lambda m: m.target_id))
        )

        skill_opportunities = (
            self.pipeline
            | 'Get all non-deleted skill opportunity models'
            >> (
                ndb_io.GetModels(
                    opportunity_models.SkillOpportunityModel.get_all(
                        include_deleted=False
                    )
                )
            )
            | 'Transform to skill opportunity domain object'
            >> beam.Map(opportunity_services.get_skill_opportunity_from_model)
            | 'Group skill opportunity by ID' >> beam.GroupBy(lambda m: m.id)
        )

        skill_opportunity_to_question_suggestions = (
            {
                'suggestion': all_question_suggestions_grouped_by_skill_id,
                'opportunity': skill_opportunities,
            }
            | 'Merge submitted question objects' >> beam.CoGroupByKey()
            | 'Get rid of key of submitted question objects'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        question_suggestions = (
            skill_opportunity_to_question_suggestions
            | 'Filter valid question suggestions'
            >> beam.Filter(
                lambda grouped_data: (
                    len(grouped_data['opportunity']) > 0
                    and len(grouped_data['suggestion']) > 0
                )
            )
            | 'Extract question suggestions only'
            >> beam.Map(lambda grouped_data: grouped_data['suggestion'])
            | 'Extract and fully flatten suggestions'
            >> beam.FlatMap(lambda grouped_data: list(grouped_data[0]))
        )

        topics_set = (
            self.pipeline
            | 'Get Topics'
            >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False)
            )
            | 'Topic IDs to Set' >> beam.Map(lambda t: t.id)
            | 'Combine Topic IDs' >> beam.combiners.ToSet()
        )

        # Key datasets for joins.
        trans_totals_kv = translation_totals | beam.Map(
            lambda t: ((t.contributor_id, t.language_code), t)
        )
        trans_contribs_kv = translation_contribs | beam.Map(
            lambda c: ((c.contributor_user_id, c.language_code), c)
        )
        trans_suggestions_kv = translation_suggestions | beam.Map(
            lambda s: ((s.author_id, s.language_code), s)
        )

        quest_totals_kv = question_totals | beam.Map(
            lambda t: (t.contributor_id, t)
        )
        quest_contribs_kv = question_contribs | beam.Map(
            lambda c: (c.contributor_user_id, c)
        )
        quest_suggestions_kv = question_suggestions | beam.Map(
            lambda s: (s.author_id, s)
        )

        # Group for translation validation.
        translation_groups = {
            'total': trans_totals_kv,
            'contribs': trans_contribs_kv,
            'suggestions': trans_suggestions_kv,
        } | 'Group Translation Data' >> beam.CoGroupByKey()

        filtered_translation_groups = (
            translation_groups
            | 'Mark translation groups Ok/Err'
            >> beam.Map(
                self._make_check_missing_total_fn(
                    total_model_name=(
                        'TranslationSubmitterTotalContributionStatsModel'
                    ),
                    contrib_model_name='TranslationContributionStatsModel',
                    suggestion_model_name='Translation GeneralSuggestionModel',
                )
            )
            | 'Filter non-none translation groups'
            >> beam.Filter(lambda r: r is not None)
        )

        valid_translation_groups = (
            filtered_translation_groups
            | 'Filter translation Ok' >> beam.Filter(lambda r: r.is_ok())
            | 'Unwrap translation Ok (kv)' >> beam.Map(lambda r: r.unwrap())
        )

        translation_validaion_results = (
            valid_translation_groups
            | 'Validate Translation Stats'
            >> beam.Map(
                lambda kv, topics: self._validate_translation(
                    kv[1]['total'][0],
                    kv[1]['contribs'],
                    kv[1]['suggestions'],
                    topics,
                ),
                beam.pvalue.AsSingleton(topics_set),
            )
        )

        # Group for question validation.
        question_groups = {
            'total': quest_totals_kv,
            'contribs': quest_contribs_kv,
            'suggestions': quest_suggestions_kv,
        } | 'Group Question Data' >> beam.CoGroupByKey()

        filtered_question_groups = (
            question_groups
            | 'Mark questions groups Ok/Err'
            >> beam.Map(
                self._make_check_missing_total_fn(
                    total_model_name=(
                        'QuestionSubmitterTotalContributionStatsModel'
                    ),
                    contrib_model_name='QuestionContributionStatsModel',
                    suggestion_model_name='Question GeneralSuggestionModel',
                )
            )
            | 'Filter non-none question groups'
            >> beam.Filter(lambda r: r is not None)
        )

        valid_question_groups = (
            filtered_question_groups
            | 'Filter questions Ok' >> beam.Filter(lambda r: r.is_ok())
            | 'Unwrap questions Ok (kv)' >> beam.Map(lambda r: r.unwrap())
        )

        question_validaion_results = (
            valid_question_groups
            | 'Validate Question Stats'
            >> beam.Map(
                lambda kv, topics: self._validate_question(
                    kv[1]['total'][0],
                    kv[1]['contribs'],
                    kv[1]['suggestions'],
                    topics,
                ),
                beam.pvalue.AsSingleton(topics_set),
            )
        )

        # Result aggregation as before.
        success_translation_validaition_count_results = (
            translation_validaion_results
            | 'Filter OK translations' >> beam.Filter(lambda res: res.is_ok())
            | 'Unwrap OK translations' >> beam.Map(lambda res: res.unwrap())
            | 'Count OK translations'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Valid Translation Submitter Models'
                )
            )
        )

        translation_groups_with_no_total = (
            filtered_translation_groups
            | 'Filter translation Err' >> beam.Filter(lambda r: r.is_err())
        )

        translation_groups_with_no_total_count_results = (
            translation_groups_with_no_total
            | 'Count missing total translations'
            >> (beam.combiners.Count.Globally())
            | 'Filter missing total translations count > 0'
            >> beam.Filter(lambda x: x > 0)
            | 'Map missing total translations count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'Missing Total Translation Submitter Models FAILED: '
                    f'{count}'
                )
            )
        )

        translation_groups_with_no_total_logs = (
            translation_groups_with_no_total
            | 'Map missing total translations to logs'
            >> (job_result_transforms.ResultsToJobRunResults())
        )

        error_translation_validaition = (
            translation_validaion_results
            | 'Filter ERR translations' >> beam.Filter(lambda res: res.is_err())
        )

        error_translation_validaition_count_results = (
            error_translation_validaition
            | 'Count ERR translations' >> beam.combiners.Count.Globally()
            | 'Filter ERR translations count > 0'
            >> beam.Filter(lambda x: x > 0)
            | 'Map ERR translations count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'Invalid Total Translation Submitter Models FAILED: '
                    f'{count}'
                )
            )
        )

        error_translation_validaition_logs = (
            error_translation_validaition
            | 'Map ERR translations to logs'
            >> (job_result_transforms.ResultsToJobRunResults())
        )

        success_question_validaition_count_results = (
            question_validaion_results
            | 'Filter OK questions' >> beam.Filter(lambda res: res.is_ok())
            | 'Unwrap OK questions' >> beam.Map(lambda res: res.unwrap())
            | 'Count OK questions'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Valid Question Submitter Models'
                )
            )
        )

        question_groups_with_no_total = (
            filtered_question_groups
            | 'Filter question Err' >> beam.Filter(lambda r: r.is_err())
        )

        question_groups_with_no_total_count_results = (
            question_groups_with_no_total
            | 'Count missing total questions'
            >> (beam.combiners.Count.Globally())
            | 'Filter missing total questions count > 0'
            >> beam.Filter(lambda x: x > 0)
            | 'Map missing total questions count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'Missing Total Question Submitter Models FAILED: {count}'
                )
            )
        )

        question_groups_with_no_total_logs = (
            question_groups_with_no_total
            | 'Map missing total questions to logs'
            >> (job_result_transforms.ResultsToJobRunResults())
        )

        error_question_validaition = (
            question_validaion_results
            | 'Filter ERR questions' >> beam.Filter(lambda res: res.is_err())
        )

        error_question_validaition_count_results = (
            error_question_validaition
            | 'Count ERR questions' >> beam.combiners.Count.Globally()
            | 'Filter ERR questions count > 0' >> beam.Filter(lambda x: x > 0)
            | 'Map ERR questions count'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    f'Invalid Total Question Submitter Models FAILED: {count}'
                )
            )
        )

        error_question_validaition_logs = (
            error_question_validaition
            | 'Map ERR questions to logs'
            >> (job_result_transforms.ResultsToJobRunResults())
        )

        return (
            success_translation_validaition_count_results,
            translation_groups_with_no_total_count_results,
            translation_groups_with_no_total_logs,
            error_translation_validaition_count_results,
            error_translation_validaition_logs,
            success_question_validaition_count_results,
            question_groups_with_no_total_count_results,
            question_groups_with_no_total_logs,
            error_question_validaition_count_results,
            error_question_validaition_logs,
        ) | 'Flatten all results' >> beam.Flatten()

    @staticmethod
    def _make_check_missing_total_fn(
        total_model_name: str,
        contrib_model_name: str,
        suggestion_model_name: str,
    ) -> Callable[
        [
            Tuple[
                Union[Tuple[str, str], str],
                Dict[
                    str,
                    Union[
                        List[
                            suggestion_models.TranslationSubmitterTotalContributionStatsModel
                        ],
                        List[
                            suggestion_models.TranslationContributionStatsModel
                        ],
                        List[suggestion_models.GeneralSuggestionModel],
                    ],
                ],
            ]
        ],
        result.Result[Union[tuple, str]],
    ]:
        """Generic function that returns a check function for finding missing
        total contribution stats models.

        Args:
            total_model_name: str.
                A label for total contribution stats models.
            contrib_model_name: str.
                A label for contribution stats models.
            suggestion_model_name: str.
                A label for suggestion models.

        Returns:
            callable. A function that takes a 2-tuple (key, group) and returns
            a result.Ok with the same 2-tuple if the group contains at least
            one total model, or a result.Err with a string containing error
            logs if the group contains no total model.
        """

        def _check_missing_total_fn(
            kv: Tuple[
                Union[Tuple[str, str], str],
                Dict[
                    str,
                    Union[
                        List[
                            suggestion_models.TranslationSubmitterTotalContributionStatsModel
                        ],
                        List[
                            suggestion_models.TranslationContributionStatsModel
                        ],
                        List[suggestion_models.GeneralSuggestionModel],
                    ],
                ],
            ],
        ) -> Optional[result.Result[Union[tuple, str]]]:
            """Check for missing total contribution stats models.

            Args:
                kv: 2-tuple.
                    A 2-tuple (key, group) where key is the group key and
                    group is a dictionary containing a list of total
                    contribution stats models, list of contribution stats model
                    and list of suggestions.

            Returns:
                result.Result[tuple | str].
                A result.Ok with the same 2-tuple if the group contains at least
                one total model, or a result.Err with a string containing error
                logs if the group contains no total model.
            """
            key, group = kv
            if key[0][:4] == 'pid_' or key[:4] == 'pid_':
                # Skip the check for deleted users.
                return None

            # Here we use cast because we are narrowing down the type of
            # totals to interpret fallback alike.
            totals = cast(
                List[
                    suggestion_models.TranslationSubmitterTotalContributionStatsModel
                ],
                group.get('total') or [],
            )

            # Here we use cast because we are narrowing down the type of
            # totals to interpret fallback alike.
            contribs = cast(
                List[suggestion_models.TranslationContributionStatsModel],
                group.get('contribs') or [],
            )

            # Here we use cast because we are narrowing down the type of
            # totals to interpret fallback alike.
            suggestions = cast(
                List[suggestion_models.GeneralSuggestionModel],
                group.get('suggestions') or [],
            )

            if len(totals) > 0:
                return result.Ok(kv)

            # Generate Logs.
            contrib_ids = [str(getattr(c, 'id', None)) for c in contribs]
            suggestion_ids = [str(getattr(s, 'id', None)) for s in suggestions]

            err_logs = ''
            err_logs += f'Missing {total_model_name} for key {key}:\n'
            err_logs += '-> ' + f'{contrib_model_name}:\n'
            if contrib_ids:
                for cid in contrib_ids:
                    err_logs += f'--{cid}\n'
            else:
                err_logs += '--None\n'
            err_logs += f'-> {suggestion_model_name}:\n'
            if suggestion_ids:
                for sid in suggestion_ids:
                    err_logs += f'--{sid}\n'
            else:
                err_logs += '--None\n'

            return result.Err(err_logs)

        return _check_missing_total_fn

    @staticmethod
    def _validate_translation(
        total: (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
        ),
        contributions: List[
            suggestion_models.TranslationContributionStatsModel
        ],
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        valid_topic_ids_set: List[str] | set[str],
    ) -> result.Result[str]:
        """Validates TranslationSubmitterTotalContributionStatsModel
        using prefetched data.

        Args:
            total: TranslationSubmitterTotalContributionStatsModel.
                TranslationSubmitterTotalContributionStatsModel to validate.
            contributions: List[TranslationContributionStatsModel].
                TranslationContributionStatsModel records grouped by
                (contributor_user_id, language_code) that are related to
                `total`.
            suggestions: List[GeneralSuggestionModel].
                GeneralSuggestionModel records (suggestions of type
                'translate_content') authored by the contributor and grouped by
                (author_id, language_code) that are related to `total`.
            valid_topic_ids_set: List[str] or set[str].
                Set (or iterable) of valid topic IDs (TopicModel ids). Used to
                shortlist contributions whose topic_id exists in the topics
                collection.

        Returns:
            result.Result[str]. An Ok result with the model ID if validation
            passes, or an Err result with a string containing error logs
            if validation fails.
        """
        error_logs = ''

        # Filter valid contributions.
        valid_contributions = [
            c for c in contributions if (c.topic_id in valid_topic_ids_set)
        ]

        # Sort suggestions.
        by_created_on = lambda m: m.created_on
        suggestions.sort(key=by_created_on)

        # Validate topic_ids list.
        contribution_topic_ids = {c.topic_id for c in valid_contributions}
        if not contribution_topic_ids.issubset(
            set(total.topic_ids_with_translation_submissions)
        ):
            missing = contribution_topic_ids - set(
                total.topic_ids_with_translation_submissions
            )
            error_logs += f'-> missing topic_ids {missing} in total stats\n'

        # Validate aggregated counts.
        fields = [
            'submitted_translations_count',
            'submitted_translation_word_count',
            'accepted_translations_count',
            'accepted_translations_without_reviewer_edits_count',
            'accepted_translation_word_count',
            'rejected_translations_count',
            'rejected_translation_word_count',
        ]
        for field in fields:
            total_value = getattr(total, field)
            aggregated = sum(getattr(c, field) for c in valid_contributions)
            if aggregated != total_value:
                error_logs += (
                    f'-> field {field} aggregated {aggregated} != total '
                    f'{total_value}\n'
                )

        # Validate first and last contribution dates.
        dates = [c.contribution_dates for c in valid_contributions]
        if dates:
            first_date = min(d[0] for d in dates if d[0])
            last_date = max(d[-1] for d in dates if d[-1])
            if first_date != total.first_contribution_date:
                error_logs += (
                    f'-> first contribution {first_date} != '
                    f'{total.first_contribution_date}\n'
                )
            if last_date != total.last_contribution_date:
                error_logs += (
                    f'-> last contribution {last_date} != '
                    f'{total.last_contribution_date}\n'
                )

        # Validate recent outcomes and performance.
        recent_review_outcomes = []
        counts = {'accepted': 0, 'accepted_with_edits': 0, 'rejected': 0}
        for v in suggestions:
            if v.status == 'accepted' and v.edited_by_reviewer is False:
                recent_review_outcomes.append('accepted')
            elif v.status == 'accepted' and v.edited_by_reviewer is True:
                recent_review_outcomes.append('accepted_with_edits')
            elif v.status == 'rejected':
                recent_review_outcomes.append('rejected')

        if len(recent_review_outcomes) > 100:
            recent_review_outcomes = recent_review_outcomes[-100:]

        for outcome in recent_review_outcomes:
            counts[outcome] += 1

        if recent_review_outcomes != total.recent_review_outcomes:
            error_logs += (
                f'-> recent outcomes {recent_review_outcomes} != '
                f'{total.recent_review_outcomes}\n'
            )

        recent_performance = (
            counts['accepted'] + counts['accepted_with_edits']
        ) - (2 * counts['rejected'])
        if recent_performance != total.recent_performance:
            error_logs += (
                f'-> recent performance {recent_performance} != '
                f'{total.recent_performance}\n'
            )

        # Validate overall accuracy.
        if total.submitted_translations_count:
            accuracy = (
                total.accepted_translations_count
                / (total.submitted_translations_count)
            ) * 100
            if round(accuracy, 2) != total.overall_accuracy:
                error_logs += (
                    f'-> accuracy {round(accuracy, 2)} != '
                    f'{total.overall_accuracy}\n'
                )

        if not error_logs:
            return result.Ok(total.id)
        return result.Err(
            '\nValidation failed for '
            'TranslationSubmitterTotalContributionStatsModel '
            f'{total.id}:\n{error_logs}'
        )

    @staticmethod
    def _validate_question(
        total: suggestion_models.QuestionSubmitterTotalContributionStatsModel,
        contributions: List[suggestion_models.QuestionContributionStatsModel],
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        valid_topic_ids_set: List[str] | set[str],
    ) -> result.Result[str]:
        """Validates QuestionSubmitterTotalContributionStatsModel using
        prefetched data.

        Args:
            total: QuestionSubmitterTotalContributionStatsModel.
                QuestionSubmitterTotalContributionStatsModel to validate.
            contributions: List[QuestionContributionStatsModel].
                QuestionContributionStatsModel records grouped by
                contributor_user_id that are related to `total`.
            suggestions: List[GeneralSuggestionModel].
                GeneralSuggestionModel records (suggestions of type
                SUGGESTION_TYPE_ADD_QUESTION) authored by the contributor
                and grouped by author_id that are related to `total`.
            valid_topic_ids_set: List[str] or set[str].
                Set (or iterable) of valid topic IDs (TopicModel ids). Used to
                shortlist contributions whose topic_id exists in the topics
                collection.

        Returns:
            result.Result[str]. An Ok result with the model ID if validation
            passes, or an Err result with a string containing error logs
            if validation fails.
        """
        error_logs = ''

        # Filter valid contributions.
        valid_contributions = [
            c for c in contributions if c.topic_id in valid_topic_ids_set
        ]

        # Sort suggestions.
        by_created_on = lambda m: m.created_on
        suggestions.sort(key=by_created_on)

        # Validate topic_ids list.
        contribution_topic_ids = {c.topic_id for c in valid_contributions}
        if not contribution_topic_ids.issubset(
            set(total.topic_ids_with_question_submissions)
        ):
            missing = contribution_topic_ids - set(
                total.topic_ids_with_question_submissions
            )
            error_logs += f'-> missing topic_ids {missing} in total stats\n'

        # Validate aggregated counts.
        fields = [
            'submitted_questions_count',
            'accepted_questions_count',
            'accepted_questions_without_reviewer_edits_count',
        ]
        for field in fields:
            total_value = getattr(total, field)
            aggregated = sum(getattr(c, field) for c in valid_contributions)
            if aggregated != total_value:
                error_logs += (
                    f'-> field {field} aggregated {aggregated} != total '
                    f'{total_value}\n'
                )

        rejected_questions_count = [
            s.status for s in suggestions if s.status == 'rejected'
        ]
        if len(rejected_questions_count) != total.rejected_questions_count:
            error_logs += (
                '-> field rejected_questions_count '
                f'{len(rejected_questions_count)} != total '
                f'{total.rejected_questions_count}\n'
            )

        # Validate first and last contribution dates.
        if valid_contributions:
            first_date = min(
                c.first_contribution_date for c in valid_contributions
            )
            last_date = max(
                c.last_contribution_date for c in valid_contributions
            )
            if first_date != total.first_contribution_date:
                error_logs += (
                    f'-> first contribution {first_date} != '
                    f'{total.first_contribution_date}\n'
                )
            if last_date != total.last_contribution_date:
                error_logs += (
                    f'-> last contribution {last_date} != '
                    f'{total.last_contribution_date}\n'
                )

        # Validate recent outcomes and performance.
        recent_review_outcomes = []
        counts = {'accepted': 0, 'accepted_with_edits': 0, 'rejected': 0}
        for v in suggestions:
            if v.status == 'accepted' and v.edited_by_reviewer is False:
                recent_review_outcomes.append('accepted')
            elif v.status == 'accepted' and v.edited_by_reviewer is True:
                recent_review_outcomes.append('accepted_with_edits')
            elif v.status == 'rejected':
                recent_review_outcomes.append('rejected')

        if len(recent_review_outcomes) > 100:
            recent_review_outcomes = recent_review_outcomes[-100:]

        for outcome in recent_review_outcomes:
            counts[outcome] += 1

        if recent_review_outcomes != total.recent_review_outcomes:
            error_logs += (
                f'-> recent outcomes {recent_review_outcomes} != '
                f'{total.recent_review_outcomes}\n'
            )

        recent_performance = (
            counts['accepted'] + counts['accepted_with_edits']
        ) - (2 * counts['rejected'])
        if recent_performance != total.recent_performance:
            error_logs += (
                f'-> recent performance {recent_performance} != '
                f'{total.recent_performance}\n'
            )

        # Validate overall accuracy.
        if total.submitted_questions_count:
            accuracy = (
                total.accepted_questions_count
                / (total.submitted_questions_count)
            ) * 100
            if round(accuracy, 2) != total.overall_accuracy:
                error_logs += (
                    f'-> accuracy {round(accuracy, 2)} != '
                    f'{total.overall_accuracy}\n'
                )

        if not error_logs:
            return result.Ok(total.id)
        return result.Err(
            '\nValidation failed for '
            'QuestionSubmitterTotalContributionStatsModel '
            f'{total.id}:\n{error_logs}'
        )
