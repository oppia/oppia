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
from core.domain import topic_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Iterable, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import suggestion_models

(suggestion_models, ) = models.Registry.import_models([
    models.Names.SUGGESTION
])

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
            | 'Get non-deleted GeneralSuggestionModel' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
        )

        translation_general_suggestions_stats = (
            general_suggestions_models
             | 'Filter reviewed translate suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                ))
            | 'Group by language and user' >> beam.Map(
                lambda stats: ((stats.language_code, stats.author_id), stats)
            )
        )

        question_general_suggestions_stats = (
            general_suggestions_models
             | 'Filter reviewed questions suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_ADD_QUESTION
                ))
            | 'Group by user' >> beam.Map(
                lambda stats: (stats.author_id, stats)
            )
        )

        translation_contribution_stats = (
            self.pipeline
            | 'Get all non-deleted TranslationContributionStatsModel models' >>
                ndb_io.GetModels(
                suggestion_models.TranslationContributionStatsModel.get_all(
                    include_deleted=False))
            | 'Filter translation contribution with no topic' >> beam.Filter(
                lambda m: m.topic_id != '')
            | 'Group TranslationContributionStatsModel by language and contributor' # pylint: disable=line-too-long
                >> beam.Map(
                lambda stats: (
                    (stats.language_code, stats.contributor_user_id), stats
                )
            )
        )

        translation_reviewer_stats = (
            self.pipeline
            | 'Get all non-deleted TranslationReviewStatsModel models' >>
                ndb_io.GetModels(
                suggestion_models.TranslationReviewStatsModel.get_all(
                    include_deleted=False))
            | 'Group TranslationReviewStatsModel by language and reviewer'
                >> beam.Map(
                lambda stats: (
                    (stats.language_code, stats.reviewer_user_id), stats
                )
            )
        )

        question_contribution_stats = (
            self.pipeline
            | 'Get all non-deleted QuestionContributionStatsModel models' >>
                ndb_io.GetModels(
                suggestion_models.QuestionContributionStatsModel.get_all(
                    include_deleted=False))
            | 'Group QuestionContributionStatsModel by contributor'
                >> beam.Map(
                lambda stats: (
                    stats.contributor_user_id, stats
                )
            )
        )

        question_reviewer_stats = (
            self.pipeline
            | 'Get all non-deleted QuestionReviewStatsModel models' >>
                ndb_io.GetModels(
                suggestion_models.QuestionReviewStatsModel.get_all(
                    include_deleted=False))
            | 'Group QuestionReviewStatsModel by contributor'
                >> beam.Map(
                lambda stats: (
                    stats.reviewer_user_id, stats
                )
            )
        )

        translation_submitter_total_stats_models = (
            {
                'translation_contribution_stats':
                    translation_contribution_stats,
                'translation_general_suggestions_stats':
                    translation_general_suggestions_stats
            }
            | 'Merge Translation models' >> beam.CoGroupByKey()
            | 'Transform translation contribution stats' >>
                beam.MapTuple(
                    lambda key, value:
                        self.transform_translation_contribution_stats(
                            key,
                            value['translation_contribution_stats'],
                            value['translation_general_suggestions_stats']
                        )
                )
        )

        translation_reviewer_total_stats_models = (
            translation_reviewer_stats
            | 'Group TranslationReviewerTotalContributionStatsModel by key' >>
                beam.GroupByKey()
            | 'Transform translation reviewer stats' >>
                beam.MapTuple(self.transform_translation_review_stats)
        )

        question_submitter_total_stats_models = (
            {
                'question_contribution_stats':
                    question_contribution_stats,
                'question_general_suggestions_stats':
                    question_general_suggestions_stats
            }
            | 'Merge Question models' >> beam.CoGroupByKey()
            | 'Transform question contribution stats' >>
                beam.MapTuple(
                    lambda key, value:
                        self.transform_question_contribution_stats(
                            key,
                            value['question_contribution_stats'],
                            value['question_general_suggestions_stats']
                        )
                )
        )

        question_reviewer_total_stats_models = (
            question_reviewer_stats
            | 'Group QuestionReviewerTotalContributionStatsModel by key' >>
                beam.GroupByKey()
            | 'Transform question reviewer stats' >>
                beam.MapTuple(self.transform_question_review_stats)
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
            | 'Create translation submitter job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Submitter Models'
                ))
        )

        translation_reviewer_models_job_run_results = (
            translation_reviewer_total_stats_models
            | 'Create translation reviewer job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Reviewer Models'
                ))
        )

        question_submitter_models_job_run_results = (
            question_submitter_total_stats_models
            | 'Create question submitter job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Submitter Models'
                ))
        )

        question_reviewer_models_job_run_results = (
            question_reviewer_total_stats_models
            | 'Create question reviewer job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Reviewer Models'
                ))
        )

        return (
            (
                translation_submitter_models_job_run_results,
                translation_reviewer_models_job_run_results,
                question_submitter_models_job_run_results,
                question_reviewer_models_job_run_results
            )
            | 'Merge job run results' >> beam.Flatten()
        )

    @staticmethod
    def transform_translation_contribution_stats(
        keys: Tuple[str, str],
        translation_contribution_stats:
            Iterable[suggestion_models.TranslationContributionStatsModel],
        translation_general_suggestions_stats:
            Iterable[suggestion_models.GeneralSuggestionModel]) -> (
        suggestion_models.TranslationSubmitterTotalContributionStatsModel):
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
            suggestion_models.TranslationSubmitterTotalContributionStatsModel.
            New TranslationReviewerTotalContributionStatsModel model.
        """
        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort() method
        # instead. Reference: https://github.com/python/mypy/issues/9590.
        by_created_on = lambda m: m.created_on
        translation_general_suggestions_sorted_stats = sorted(
            translation_general_suggestions_stats,
            key=by_created_on
        )

        translation_contribution_stats = list(translation_contribution_stats)
        general_suggestion_stats = list(
            translation_general_suggestions_sorted_stats)
        recent_review_outcomes = []

        counts = {
            'accepted': 0,
            'accepted_with_edits': 0,
            'rejected': 0
        }

        for v in general_suggestion_stats:
            if (v.status == 'accepted' and v.edited_by_reviewer is False):
                recent_review_outcomes.append('accepted')
            elif (v.status == 'accepted' and v.edited_by_reviewer is True):
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
            (counts['accepted'] + counts['accepted_with_edits'])
            - (2 * (counts['rejected']))
            )

        language_code, contributor_user_id = keys
        entity_id = (
            '%s.%s' % (language_code, contributor_user_id)
        )

        for stat in translation_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                translation_contribution_stats.remove(stat)

        topic_ids = (
            [v.topic_id for v in translation_contribution_stats])
        submitted_translations_count = sum(
            v.submitted_translations_count
                for v in translation_contribution_stats)
        submitted_translation_word_count = sum(
            v.submitted_translation_word_count
                for v in translation_contribution_stats)
        accepted_translations_count = sum(
            v.accepted_translations_count
                for v in translation_contribution_stats)
        accepted_translations_without_reviewer_edits_count = sum(
            v.accepted_translations_without_reviewer_edits_count
                for v in translation_contribution_stats)
        accepted_translation_word_count = sum(
            v.accepted_translation_word_count
                for v in translation_contribution_stats)
        rejected_translations_count = sum(
            v.rejected_translations_count
                for v in translation_contribution_stats)
        rejected_translation_word_count = sum(
            v.rejected_translation_word_count
                for v in translation_contribution_stats)
        first_contribution_date = min(
            v.contribution_dates[0] for v in translation_contribution_stats)
        last_contribution_date = max(
            v.contribution_dates[-1] for v in translation_contribution_stats)

        # Weights of overall_accuracy as documented in
        # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
        overall_accuracy = round(
            accepted_translations_count / submitted_translations_count * 100, 2
        )

        with datastore_services.get_ndb_context():
            translation_submit_stats_models = (
                suggestion_models.TranslationSubmitterTotalContributionStatsModel( # pylint: disable=line-too-long
                id=entity_id,
                language_code=language_code,
                contributor_id=contributor_user_id,
                topic_ids_with_translation_submissions=topic_ids,
                recent_review_outcomes=recent_review_outcomes,
                recent_performance=recent_performance,
                overall_accuracy=overall_accuracy,
                submitted_translations_count=submitted_translations_count,
                submitted_translation_word_count=(
                    submitted_translation_word_count),
                accepted_translations_count=accepted_translations_count,
                accepted_translations_without_reviewer_edits_count=(
                    accepted_translations_without_reviewer_edits_count),
                accepted_translation_word_count=(
                    accepted_translation_word_count),
                rejected_translations_count=rejected_translations_count,
                rejected_translation_word_count=(
                    rejected_translation_word_count),
                first_contribution_date=first_contribution_date,
                last_contribution_date=last_contribution_date
                )
            )
            translation_submit_stats_models.update_timestamps()
            return translation_submit_stats_models

    @staticmethod
    def transform_translation_review_stats(
        keys: Tuple[str, str],
        translation_reviewer_stats:
            Iterable[suggestion_models.TranslationReviewStatsModel]) -> (
        suggestion_models.TranslationReviewerTotalContributionStatsModel):
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
        entity_id = (
            '%s.%s' % (language_code, reviewer_user_id)
        )

        for stat in translation_reviewer_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                translation_reviewer_stats.remove(stat)

        topic_ids = (
            [v.topic_id for v in translation_reviewer_stats])
        reviewed_translations_count = sum(
            v.reviewed_translations_count
                for v in translation_reviewer_stats)
        accepted_translations_count = sum(
            v.accepted_translations_count
                for v in translation_reviewer_stats)
        accepted_translations_with_reviewer_edits_count = sum(
            v.accepted_translations_with_reviewer_edits_count
                for v in translation_reviewer_stats)
        accepted_translation_word_count = sum(
            v.accepted_translation_word_count
                for v in translation_reviewer_stats)
        rejected_translations_count = (
            reviewed_translations_count - accepted_translations_count
        )
        first_contribution_date = min(
            v.first_contribution_date for v in translation_reviewer_stats)
        last_contribution_date = max(
            v.last_contribution_date for v in translation_reviewer_stats)

        with datastore_services.get_ndb_context():
            translation_review_stats_models = (
                suggestion_models.TranslationReviewerTotalContributionStatsModel( # pylint: disable=line-too-long
                id=entity_id,
                language_code=language_code,
                contributor_id=reviewer_user_id,
                topic_ids_with_translation_reviews=topic_ids,
                reviewed_translations_count=reviewed_translations_count,
                accepted_translations_count=accepted_translations_count,
                accepted_translations_with_reviewer_edits_count=(
                    accepted_translations_with_reviewer_edits_count),
                accepted_translation_word_count=(
                    accepted_translation_word_count),
                rejected_translations_count=rejected_translations_count,
                first_contribution_date=first_contribution_date,
                last_contribution_date=last_contribution_date
                )
            )
            translation_review_stats_models.update_timestamps()
            return translation_review_stats_models

    @staticmethod
    def transform_question_contribution_stats(
        contributor_user_id: str,
        question_contribution_stats:
            Iterable[suggestion_models.QuestionContributionStatsModel],
        question_general_suggestions_stats:
            Iterable[suggestion_models.GeneralSuggestionModel]) -> (
        suggestion_models.QuestionSubmitterTotalContributionStatsModel):
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
            suggestion_models.QuestionSubmitterTotalContributionStatsModel.
            New QuestionSubmitterTotalContributionStatsModel model.
        """
        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort() method
        # instead. Reference: https://github.com/python/mypy/issues/9590.
        by_created_on = lambda m: m.created_on
        question_general_suggestions_sorted_stats = sorted(
            question_general_suggestions_stats,
            key=by_created_on
        )

        question_contribution_stats = list(question_contribution_stats)
        general_suggestion_stats = list(
            question_general_suggestions_sorted_stats)
        recent_review_outcomes = []
        rejected_questions_count = 0

        counts = {
            'accepted': 0,
            'accepted_with_edits': 0,
            'rejected': 0
        }

        for v in general_suggestion_stats:
            if (v.status == 'accepted' and v.edited_by_reviewer is False):
                recent_review_outcomes.append('accepted')
            elif (v.status == 'accepted' and v.edited_by_reviewer is True):
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
            (counts['accepted'] + counts['accepted_with_edits'])
            - (2 * (counts['rejected']))
            )

        entity_id = contributor_user_id

        for stat in question_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                question_contribution_stats.remove(stat)

        topic_ids = (
            [v.topic_id for v in question_contribution_stats])
        submitted_questions_count = sum(
            v.submitted_questions_count
                for v in question_contribution_stats)
        accepted_questions_count = sum(
            v.accepted_questions_count
                for v in question_contribution_stats)
        accepted_questions_without_reviewer_edits_count = sum(
            v.accepted_questions_without_reviewer_edits_count
                for v in question_contribution_stats)
        first_contribution_date = min(
            v.first_contribution_date for v in question_contribution_stats)
        last_contribution_date = max(
            v.last_contribution_date for v in question_contribution_stats)

        # Weights of overall_accuracy as documented in
        # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
        overall_accuracy = (
            round(
            accepted_questions_count / submitted_questions_count
            * 100, 2)
        )

        with datastore_services.get_ndb_context():
            question_submit_stats_models = (
                suggestion_models.QuestionSubmitterTotalContributionStatsModel(
                id=entity_id,
                contributor_id=contributor_user_id,
                topic_ids_with_question_submissions=topic_ids,
                recent_review_outcomes=recent_review_outcomes,
                recent_performance=recent_performance,
                overall_accuracy=overall_accuracy,
                submitted_questions_count=submitted_questions_count,
                accepted_questions_count=accepted_questions_count,
                accepted_questions_without_reviewer_edits_count=(
                    accepted_questions_without_reviewer_edits_count),
                rejected_questions_count=rejected_questions_count,
                first_contribution_date=first_contribution_date,
                last_contribution_date=last_contribution_date
                )
            )
            question_submit_stats_models.update_timestamps()
            return question_submit_stats_models

    @staticmethod
    def transform_question_review_stats(
        reviewer_user_id: str,
        question_reviewer_stats:
            Iterable[suggestion_models.QuestionReviewStatsModel]) -> (
        suggestion_models.QuestionReviewerTotalContributionStatsModel):
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

        for stat in question_reviewer_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                question_reviewer_stats.remove(stat)

        topic_ids = (
            [v.topic_id for v in question_reviewer_stats])
        reviewed_questions_count = sum(
            v.reviewed_questions_count
                for v in question_reviewer_stats)
        accepted_questions_count = sum(
            v.accepted_questions_count
                for v in question_reviewer_stats)
        accepted_questions_with_reviewer_edits_count = sum(
            v.accepted_questions_with_reviewer_edits_count
                for v in question_reviewer_stats)
        rejected_questions_count = (
            reviewed_questions_count - accepted_questions_count
        )
        first_contribution_date = min(
            v.first_contribution_date for v in question_reviewer_stats)
        last_contribution_date = max(
            v.last_contribution_date for v in question_reviewer_stats)

        with datastore_services.get_ndb_context():
            question_review_stats_models = (
                suggestion_models.QuestionReviewerTotalContributionStatsModel(
                id=entity_id,
                contributor_id=reviewer_user_id,
                topic_ids_with_question_reviews=topic_ids,
                reviewed_questions_count=reviewed_questions_count,
                accepted_questions_count=accepted_questions_count,
                accepted_questions_with_reviewer_edits_count=(
                    accepted_questions_with_reviewer_edits_count),
                rejected_questions_count=rejected_questions_count,
                first_contribution_date=first_contribution_date,
                last_contribution_date=last_contribution_date
                )
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


class AuditGenerateContributorAdminStatsJob(
    GenerateContributorAdminStatsJob
):
    """Audit Job for GenerateContributorAdminStatsJob
    """

    DATASTORE_UPDATES_ALLOWED = False
