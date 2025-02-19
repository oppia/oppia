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
from core.domain import exp_services
from core.domain import skill_services
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Iterable, Optional, Tuple

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

        translation_submitter_total_stats_models_and_logs = (
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

        translation_submitter_total_stats_models = (
            translation_submitter_total_stats_models_and_logs
            | 'Unpack translation submitter contribution models' >> beam.Map(
                lambda element: element[0])
            | 'Filter out translation stats with None values' >> beam.Filter(
                lambda x: x is not None)
        )

        translation_submitter_debug_logs = (
            translation_submitter_total_stats_models_and_logs
            | 'Filter out translation logs with None values' >> beam.Filter(
                lambda element: element[1] is not None)
            | 'Unpack and get translation debug logs result' >> beam.Map(
                lambda element: (
                    job_run_result.JobRunResult.as_stdout(element[1])
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

        question_submitter_total_stats_models_and_logs = (
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

        question_submitter_total_stats_models = (
            question_submitter_total_stats_models_and_logs
            | 'Unpack question contribution models' >> beam.Map(
                lambda element: element[0])
            | 'Filter out question stats with None values' >> beam.Filter(
                lambda x: x is not None)
        )

        question_submitter_debug_logs = (
            question_submitter_total_stats_models_and_logs
            | 'Filter out question logs with None values' >> beam.Filter(
                lambda element: element[1] is not None)
            | 'Unpack and get question debug logs result' >> beam.Map(
                lambda element: (
                    job_run_result.JobRunResult.as_stdout(element[1])
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
                question_reviewer_models_job_run_results,
                translation_submitter_debug_logs,
                question_submitter_debug_logs
            )
            | 'Merge job run results' >> beam.Flatten()
        )

    @staticmethod
    def transform_translation_contribution_stats(
        keys: Tuple[str, str],
        translation_contribution_stats:
            Iterable[suggestion_models.TranslationContributionStatsModel],
        translation_general_suggestions_stats:
            Iterable[suggestion_models.GeneralSuggestionModel]) -> Tuple[
        Optional[
            suggestion_models.TranslationSubmitterTotalContributionStatsModel],
        Optional[str]]:
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
            A 2-tuple with the following elements:
            - suggestion_models.TranslationSubmitterTotalContributionStatsModel.
            New TranslationReviewerTotalContributionStatsModel model, if
            possible.
            - The debug logs, if error detected.
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

        exp_ids_with_translation_suggestions = sorted(
            {v.target_id for v in general_suggestion_stats})

        topic_ids_with_translation_submissions_list = []
        with datastore_services.get_ndb_context():
            for exp_id in exp_ids_with_translation_suggestions:
                story_id = exp_services.get_story_id_linked_to_exploration(
                    exp_id)
                if story_id is not None:
                    story = story_fetchers.get_story_by_id(story_id)
                    if story is not None:
                        topic_ids_with_translation_submissions_list.append(
                            story.corresponding_topic_id)

        topic_ids_with_translation_submissions = sorted(
            set(topic_ids_with_translation_submissions_list))

        topic_ids_with_contribution_stats = sorted(
            {v.topic_id for v in translation_contribution_stats})

        for stat in translation_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                translation_contribution_stats.remove(stat)

        valid_topic_ids_with_contribution_stats = sorted(
            {v.topic_id for v in translation_contribution_stats})

        # We only generate total contribution stats model if there exists a
        # valid contribution stats model for each pair of language code and
        # topic id, a contributor submitted a translation suggestion to.
        # Otherwise we return the debugging logs.
        if topic_ids_with_translation_submissions != (
            valid_topic_ids_with_contribution_stats):

            # Collects all the debug logs.
            debug_logs = (
                'Translation submitter ID: %s, Language code: %s\n' % (
                    contributor_user_id, language_code))

            debug_logs += (
                'Unique exp IDs with translation suggestion: \n')

            with datastore_services.get_ndb_context():
                for exp_id in exp_ids_with_translation_suggestions:
                    debug_logs += (
                        '- %s\n' % exp_id)
                    story_id = exp_services.get_story_id_linked_to_exploration(
                        exp_id)
                    if story_id is not None:
                        debug_logs += (
                            '-- Story ID: %s\n' % story_id)
                        story = story_fetchers.get_story_by_id(story_id)
                        if story is not None:
                            debug_logs += (
                                '---- Topic ID: %s\n' % (
                                    story.corresponding_topic_id))

            debug_logs += (
                'Unique topic IDs with contribution stats: \n')
            for topic_id in topic_ids_with_contribution_stats:
                debug_logs += (
                    '- %s\n' % topic_id)

            debug_logs += (
                'Unique valid topic IDs with contribution stats: \n')
            for topic_id in valid_topic_ids_with_contribution_stats:
                debug_logs += (
                    '- %s\n' % topic_id)
            return (None, debug_logs)

        else:
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
                v.contribution_dates[-1] for v in (
                    translation_contribution_stats))

            # Weights of overall_accuracy as documented in
            # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
            overall_accuracy = round(
                (accepted_translations_count / submitted_translations_count) * (
                    100), 2
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
                return (translation_submit_stats_models, None)

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
            Iterable[suggestion_models.GeneralSuggestionModel]) -> Tuple[
                Optional[suggestion_models.QuestionSubmitterTotalContributionStatsModel],  # pylint: disable=line-too-long
                Optional[str]]:
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
            A 2-tuple with the following elements:
            - suggestion_models.QuestionSubmitterTotalContributionStatsModel.
            New QuestionSubmitterTotalContributionStatsModel model, if
            possible.
            - The debug logs, if error detected.
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

        by_topic_id = lambda m: m.topic_id

        skill_ids_with_question_suggestions = sorted(
            {v.target_id for v in general_suggestion_stats})

        topic_ids_with_question_submissions_list = []
        with datastore_services.get_ndb_context():
            for skill_id in skill_ids_with_question_suggestions:
                topic_assignments = sorted(
                    skill_services.get_all_topic_assignments_for_skill(
                        skill_id), key=by_topic_id)
                for topic_assignment in topic_assignments:
                    topic_ids_with_question_submissions_list.append(
                        topic_assignment.topic_id)

        topic_ids_with_question_submissions = sorted(
            set(topic_ids_with_question_submissions_list))

        topic_ids_with_contribution_stats = sorted(
            {v.topic_id for v in question_contribution_stats})

        for stat in question_contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                question_contribution_stats.remove(stat)

        valid_topic_ids_with_contribution_stats = sorted(
            {v.topic_id for v in question_contribution_stats})

        # We only generate total contribution stats model if there exists a
        # valid contribution stats model for each topic id, a contributor
        # submitted a question suggestion to. Otherwise we return the debugging
        # logs.
        if topic_ids_with_question_submissions != (
            valid_topic_ids_with_contribution_stats):

            # Collects all the debug logs.
            debug_logs = (
                'Question submitter ID: %s.\n' % contributor_user_id)

            debug_logs += (
                'Unique skill IDs with question suggestion: \n')

            with datastore_services.get_ndb_context():
                for skill_id in skill_ids_with_question_suggestions:
                    debug_logs += (
                        '- %s\n' % skill_id)
                    topic_assignments = sorted(
                        skill_services.get_all_topic_assignments_for_skill(
                            skill_id), key=by_topic_id)
                    for topic_assignment in topic_assignments:
                        debug_logs += (
                            '-- Topic ID: %s\n' % topic_assignment.topic_id)

            debug_logs += (
                'Unique topic IDs with contribution stats: \n')
            for topic_id in topic_ids_with_contribution_stats:
                debug_logs += (
                    '- %s\n' % topic_id)

            debug_logs += (
                'Unique valid topic IDs with contribution stats: \n')
            for topic_id in valid_topic_ids_with_contribution_stats:
                debug_logs += (
                    '- %s\n' % topic_id)
            return (None, debug_logs)

        else:
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
                (v.first_contribution_date for v in (
                    question_contribution_stats)))

            last_contribution_date = max(
                (v.last_contribution_date for v in (
                    question_contribution_stats)))

            # Weights of overall_accuracy as documented in
            # https://docs.google.com/document/d/19lCEYQUgV7_DwIK_0rz3zslRHX2qKOHn-t9Twpi0qu0/edit.
            overall_accuracy = (
                round(
                accepted_questions_count / submitted_questions_count
                * 100, 2)
            )

            with datastore_services.get_ndb_context():
                question_submit_stats_models = (
                    suggestion_models.QuestionSubmitterTotalContributionStatsModel( # pylint: disable=line-too-long
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
                return (question_submit_stats_models, None)

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
            (v.first_contribution_date for v in question_reviewer_stats))
        last_contribution_date = max(
            (v.last_contribution_date for v in question_reviewer_stats))

        with datastore_services.get_ndb_context():
            question_review_stats_models = (
                suggestion_models.QuestionReviewerTotalContributionStatsModel( # pylint: disable=line-too-long
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


class LogSuggestionAndStatsJob(base_jobs.JobBase):
    """Job that returns suggestion models and their corresponding
    contribution and reviewer stats as job run results.
    """

    DATASTORE_UPDATES_ALLOWED = False  # We're not updating any datastore.

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns suggestion models and corresponding contribution and
        reviewer stats.

        Returns:
            PCollection. A PCollection of JobRunResult containing formatted
            output.
        """

        # Fetch all non-deleted GeneralSuggestionModels.
        general_suggestion_models = (
            self.pipeline
            | 'Get non-deleted GeneralSuggestionModels' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted TranslationContributionStatsModels.
        translation_contribution_stats_models = (
            self.pipeline
            | 'Get TranslationContributionStatsModels' >> ndb_io.GetModels(
                suggestion_models.TranslationContributionStatsModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted QuestionContributionStatsModels.
        question_contribution_stats_models = (
            self.pipeline
            | 'Get QuestionContributionStatsModels' >> ndb_io.GetModels(
                suggestion_models.QuestionContributionStatsModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted TranslationReviewStatsModels.
        translation_review_stats_models = (
            self.pipeline
            | 'Get TranslationReviewStatsModels' >> ndb_io.GetModels(
                suggestion_models.TranslationReviewStatsModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted QuestionReviewStatsModels.
        question_review_stats_models = (
            self.pipeline
            | 'Get QuestionReviewStatsModels' >> ndb_io.GetModels(
                suggestion_models.QuestionReviewStatsModel.get_all(
                    include_deleted=False))
        )

        # Pair translation suggestions with their stats.
        translation_suggestions = (
            general_suggestion_models
            | 'Filter Translation Suggestions' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT))
            | 'Key Translation Suggestions' >> beam.Map(
                lambda m: ((m.language_code, m.author_id), m))
        )

        translation_contribution_stats = (
            translation_contribution_stats_models
            | 'Key Translation Contribution Stats' >> beam.Map(
                lambda m: ((m.language_code, m.contributor_user_id), m))
        )

        translation_review_stats = (
            translation_review_stats_models
            | 'Key Translation Review Stats' >> beam.Map(
                lambda m: ((m.language_code, m.reviewer_user_id), m))
        )

        translation_contribution = (
            {
                'suggestion': translation_suggestions,
                'contribution_stats': translation_contribution_stats,
            }
            | 'Join Translation Suggestions and Stats' >> beam.CoGroupByKey()
            | 'Format Translation Contribution Output' >> beam.MapTuple(
                self.format_translation_contribution_output)
        )

        translation_review = (
            {
                'review_stats': translation_review_stats
            }
            | 'Join Translation review Stats' >> beam.CoGroupByKey()
            | 'Format Translation Review Output' >> beam.MapTuple(
                self.format_translation_review_output)
        )

        # Pair question suggestions with their stats.
        question_suggestions = (
            general_suggestion_models
            | 'Filter Question Suggestions' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION))
            | 'Key Question Suggestions' >> beam.Map(
                lambda m: (m.author_id, m))
        )

        question_contribution_stats = (
            question_contribution_stats_models
            | 'Key Question Contribution Stats' >> beam.Map(
                lambda m: (m.contributor_user_id, m))
        )

        question_review_stats = (
            question_review_stats_models
            | 'Key Question Review Stats' >> beam.Map(
                lambda m: (m.reviewer_user_id, m))
        )

        question_contribution = (
            {
                'suggestion': question_suggestions,
                'contribution_stats': question_contribution_stats,
            }
            | 'Join Question Suggestions and Stats' >> beam.CoGroupByKey()
            | 'Format Question Contribution Output' >> beam.MapTuple(
                self.format_question_contribution_output)
        )

        question_review = (
            {
                'review_stats': question_review_stats
            }
            | 'Join Question review Stats' >> beam.CoGroupByKey()
            | 'Format Question Review Output' >> beam.MapTuple(
                self.format_question_review_output)
        )

        # Merge both translation and question outputs.
        all_outputs = (
            [
                translation_contribution,
                question_contribution,
                translation_review,
                question_review
            ]
            | 'Flatten All Outputs' >> beam.Flatten()
        )

        # Convert outputs to JobRunResult.
        log_results = (
            all_outputs
            | 'Convert to JobRunResult' >> beam.Map(
            lambda output: job_run_result.JobRunResult(stdout=output))
        )

        # Count the number of elements in each PCollection.
        translation_contribution_stats_count = (
            translation_contribution_stats_models
            | 'Count Translation Contribution Stats Result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Contribution Stats Models'
                ))
        )

        question_contribution_stats_count = (
            question_contribution_stats_models
            | 'Count Question Contribution Stats Results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Contribution Stats Models'
                ))
        )

        translation_review_stats_count = (
            translation_review_stats_models
            | 'Count Translation Review Stats Models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Review Stats Models'
                ))
        )

        question_review_stats_count = (
            question_review_stats_models
            | 'Count Question Review Stats Models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Review Stats Models'
                ))
        )

        translation_suggestion_count = (
            general_suggestion_models
            | 'Filter Translations' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT))
            | 'Count Translation Suggestions' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Suggestions Models'
                ))
        )

        question_suggestion_count = (
            general_suggestion_models
            | 'Filter Questions' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION))
            | 'Count Question Suggestions' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Suggestions Models'
                ))
        )

        output_logs_count = (
            all_outputs
            | 'Count Output Logs' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Output Logs'
                ))
        )

        return (
            (
            log_results,
            translation_contribution_stats_count,
            question_contribution_stats_count,
            translation_review_stats_count,
            question_review_stats_count,
            translation_suggestion_count,
            question_suggestion_count,
            output_logs_count
            )
            | 'Merge all results' >> beam.Flatten()
        )

    def format_translation_contribution_output(self, key, group):
        """Formats the output for translation suggestions and contribution
        stats."""
        suggestions = group['suggestion']
        contribution_stats = group['contribution_stats']
        output_logs = []

        output_logs.append('<==Translation Suggestion and Contribution '
            f'Stats (Language: {key[0]}, Contributor ID: {key[1]}):==>')

        for suggestion in suggestions:
            output_logs.append(f'-Suggestion ID: {suggestion.id}')
            output_logs.append(f'--Target ID: {suggestion.target_id}')
            output_logs.append('--Target Version (at submission): '
                f'{suggestion.target_version_at_submission}')
            output_logs.append(f'--Status: {suggestion.status}')

        for stat in contribution_stats:
            output_logs.append(f'-Contribution Stats Model ID: {stat.id}')
            output_logs.append(f'--Topic ID: {stat.topic_id}')
            output_logs.append('--Submitted Translations: '
                f'{stat.submitted_translations_count}')
            output_logs.append('--Accepted Translations: '
                f'{stat.accepted_translations_count}')
            output_logs.append('--Accepted Translations (without edits): '
                f'{stat.accepted_translations_without_reviewer_edits_count}')
            output_logs.append('--Rejected Translations: '
                f'{stat.rejected_translations_count}')
            output_logs.append('--Contribution Dates: '
                f'{stat.contribution_dates}')

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)

    def format_translation_review_output(self, key, group):
        """Formats the output for translation review stats."""
        review_stats = group['review_stats']
        output_logs = []

        output_logs.append(f'<==Translation Review Stats (Language: {key[0]},'
        f' Reviewer ID: {key[1]}):==>')

        for stat in review_stats:
            output_logs.append(f'-Reviewer Stats Model ID: {stat.id}')
            output_logs.append(f'--Topic ID: {stat.topic_id}')
            output_logs.append('--Reviewed Translations: '
                f'{stat.reviewed_translations_count}')
            output_logs.append('--Accepted Translations: '
                f'{stat.accepted_translations_count}')
            output_logs.append('--Accepted Translations (reviewer edits): '
                f'{stat.accepted_translations_with_reviewer_edits_count}')
            output_logs.append('--First Date: '
                f'{stat.first_contribution_date}')
            output_logs.append(f'--Last Date: {stat.last_contribution_date}')

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)

    def format_question_contribution_output(self, key, group):
        """Formats the output for question suggestions and contribution
        stats."""
        suggestions = group['suggestion']
        contribution_stats = group['contribution_stats']
        output_logs = []

        output_logs.append('<==Question Suggestion and Contribution Stats '
            f'(Contributor ID: {key}):==>')

        for suggestion in suggestions:
            output_logs.append(f'-Suggestion ID: {suggestion.id}')
            output_logs.append(f'--Target ID: {suggestion.target_id}')
            output_logs.append('--Target Version (at submission): '
                f'{suggestion.target_version_at_submission}')
            output_logs.append(f'--Status: {suggestion.status}')

        for stat in contribution_stats:
            output_logs.append(f'-Contribution Stats Model ID: {stat.id}')
            output_logs.append(f'--Topic ID: {stat.topic_id}')
            output_logs.append('--Submitted Questions: '
                f'{stat.submitted_questions_count}')
            output_logs.append('--Accepted Questions: '
                f'{stat.accepted_questions_count}')
            output_logs.append('--Accepted Questions (without edits): '
                f'{stat.accepted_questions_without_reviewer_edits_count}')
            output_logs.append('--First Date: '
                f'{stat.first_contribution_date}')
            output_logs.append(f'--Last Date: {stat.last_contribution_date}')

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)

    def format_question_review_output(self, key, group):
        """Formats the output for question review stats."""
        review_stats = group['review_stats']
        output_logs = []

        output_logs.append(
            f'<==Question Review Stats (Reviewer ID: {key}):==>')

        for stat in review_stats:
            output_logs.append(f'-Review Stats Model ID: {stat.id}')
            output_logs.append(f'--Topic ID: {stat.topic_id}')
            output_logs.append('--Reviewed Questions: '
                f'{stat.reviewed_questions_count}')
            output_logs.append('--Accepted Questions: '
                f'{stat.accepted_questions_count}')
            output_logs.append('--Accepted Questions (reviewer edits): '
                f'{stat.accepted_questions_with_reviewer_edits_count}')
            output_logs.append('--First Date: '
                f'{stat.first_contribution_date}')
            output_logs.append(f'--Last Date: {stat.last_contribution_date}')

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)


class LogTopicIDsAssociatedToSuggestionAndStatsJob(base_jobs.JobBase):
    """Job that returns topic ids associated to suggestion models and
    their corresponding contribution and reviewer stats as job run results.
    """

    DATASTORE_UPDATES_ALLOWED = False  # We're not updating any datastore entities.

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns topic ids accociated to suggestion models and
        corresponding contribution and reviewer stats.

        Returns:
            PCollection. A PCollection of JobRunResult containing formatted output.
        """

        # Fetch all non-deleted GeneralSuggestionModels.
        general_suggestion_models = (
            self.pipeline
            | 'Get non-deleted GeneralSuggestionModels' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted TranslationContributionStatsModels.
        translation_contribution_stats_models = (
            self.pipeline
            | 'Get TranslationContributionStatsModels' >> ndb_io.GetModels(
                suggestion_models.TranslationContributionStatsModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted QuestionContributionStatsModels.
        question_contribution_stats_models = (
            self.pipeline
            | 'Get QuestionContributionStatsModels' >> ndb_io.GetModels(
                suggestion_models.QuestionContributionStatsModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted TranslationReviewStatsModels.
        translation_review_stats_models = (
            self.pipeline
            | 'Get TranslationReviewStatsModels' >> ndb_io.GetModels(
                suggestion_models.TranslationReviewStatsModel.get_all(
                    include_deleted=False))
        )

        # Fetch all non-deleted QuestionReviewStatsModels.
        question_review_stats_models = (
            self.pipeline
            | 'Get QuestionReviewStatsModels' >> ndb_io.GetModels(
                suggestion_models.QuestionReviewStatsModel.get_all(
                    include_deleted=False))
        )

        # Pair translation suggestions with their stats.
        translation_suggestions = (
            general_suggestion_models
            | 'Filter Translation Suggestions' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT))
            | 'Key Translation Suggestions' >> beam.Map(
                lambda m: ((m.language_code, m.author_id), m))
        )

        translation_contribution_stats = (
            translation_contribution_stats_models
            | 'Key Translation Contribution Stats' >> beam.Map(
                lambda m: ((m.language_code, m.contributor_user_id), m))
        )

        translation_review_stats = (
            translation_review_stats_models
            | 'Key Translation Review Stats' >> beam.Map(
                lambda m: ((m.language_code, m.reviewer_user_id), m))
        )

        translation_contribution = (
            {
                'suggestion': translation_suggestions,
                'contribution_stats': translation_contribution_stats,
            }
            | 'Join Translation Suggestions and Stats' >> beam.CoGroupByKey()
            | 'Format Translation Contribution Output' >> beam.MapTuple(
                self.format_translation_contribution_output)
        )

        translation_review = (
            {
                'review_stats': translation_review_stats
            }
            | 'Join Translation review Stats' >> beam.CoGroupByKey()
            | 'Format Translation Review Output' >> beam.MapTuple(
                self.format_translation_review_output)
        )

        # Pair question suggestions with their stats.
        question_suggestions = (
            general_suggestion_models
            | 'Filter Question Suggestions' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION))
            | 'Key Question Suggestions' >> beam.Map(
                lambda m: (m.author_id, m))
        )

        question_contribution_stats = (
            question_contribution_stats_models
            | 'Key Question Contribution Stats' >> beam.Map(
                lambda m: (m.contributor_user_id, m))
        )

        question_review_stats = (
            question_review_stats_models
            | 'Key Question Review Stats' >> beam.Map(
                lambda m: (m.reviewer_user_id, m))
        )

        question_contribution = (
            {
                'suggestion': question_suggestions,
                'contribution_stats': question_contribution_stats,
            }
            | 'Join Question Suggestions and Stats' >> beam.CoGroupByKey()
            | 'Format Question Contribution Output' >> beam.MapTuple(
                self.format_question_contribution_output)
        )

        question_review = (
            {
                'review_stats': question_review_stats
            }
            | 'Join Question review Stats' >> beam.CoGroupByKey()
            | 'Format Question Review Output' >> beam.MapTuple(
                self.format_question_review_output)
        )

        # Merge both translation and question outputs.
        all_outputs = (
            [
                translation_contribution,
                question_contribution,
                translation_review,
                question_review
            ]
            | 'Flatten All Outputs' >> beam.Flatten()
        )

        # Convert outputs to JobRunResult.
        log_results = (
            all_outputs
            | 'Convert to JobRunResult' >> beam.Map(
            lambda output: job_run_result.JobRunResult(stdout=output))
        )

        # Count the number of elements in each PCollection.
        translation_contribution_stats_count = (
            translation_contribution_stats_models
            | 'Count Translation Contribution Stats Result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Contribution Stats Models'
                ))
        )

        question_contribution_stats_count = (
            question_contribution_stats_models
            | 'Count Question Contribution Stats Results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Contribution Stats Models'
                ))
        )

        translation_review_stats_count = (
            translation_review_stats_models
            | 'Count Translation Review Stats Models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Review Stats Models'
                ))
        )

        question_review_stats_count = (
            question_review_stats_models
            | 'Count Question Review Stats Models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Review Stats Models'
                ))
        )

        translation_suggestion_count = (
            general_suggestion_models
            | 'Filter Translations' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT))
            | 'Count Translation Suggestions' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Translation Suggestions Models'
                ))
        )

        question_suggestion_count = (
            general_suggestion_models
            | 'Filter Questions' >> beam.Filter(
                lambda m: m.suggestion_type == (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION))
            | 'Count Question Suggestions' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Question Suggestions Models'
                ))
        )

        output_logs_count = (
            all_outputs
            | 'Count Output Logs' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'Output Logs'
                ))
        )

        return (
            (
            log_results,
            translation_contribution_stats_count,
            question_contribution_stats_count,
            translation_review_stats_count,
            question_review_stats_count,
            translation_suggestion_count,
            question_suggestion_count,
            output_logs_count
            )
            | 'Merge all results' >> beam.Flatten()
        )

    def format_translation_contribution_output(self, key, group):
        """Formats the output for translation suggestions and contribution
        stats."""
        suggestions = group['suggestion']
        contribution_stats = group['contribution_stats']
        output_logs = []

        exp_ids_with_translation_suggestions = sorted(
            {v.target_id for v in suggestions})
        
        topic_ids_with_translation_submissions_list = []
        with datastore_services.get_ndb_context():
            for exp_id in exp_ids_with_translation_suggestions:
                story_id = exp_services.get_story_id_linked_to_exploration(
                    exp_id)
                if story_id is not None:
                    story = story_fetchers.get_story_by_id(story_id)
                    if story is not None:
                        topic_ids_with_translation_submissions_list.append(
                            story.corresponding_topic_id)

        topic_ids_with_translation_submissions = sorted(
            set(topic_ids_with_translation_submissions_list))

        output_logs.append(
            'Translation submitter ID: %s, Language code: %s' % (
                key[1], key[0]))

        output_logs.append(
            'Unique exp IDs with translation suggestion: ')

        with datastore_services.get_ndb_context():
            for exp_id in exp_ids_with_translation_suggestions:
                output_logs.append(
                    '- Exp ID: %s' % exp_id)
                story_id = exp_services.get_story_id_linked_to_exploration(
                    exp_id)
                if story_id is not None:
                    output_logs.append(
                        '-- Story ID: %s' % story_id)
                    story = story_fetchers.get_story_by_id(story_id)
                    if story is not None:
                        output_logs.append(
                            '---- Topic ID: %s' % (
                                story.corresponding_topic_id))
        
        output_logs.append(
            'Unique topic IDs with translation suggestions COUNT: '
            f'{len(topic_ids_with_translation_submissions)}')

        output_logs.append(
            'Unique topic IDs with translation contribution stats: ')
        for v in contribution_stats:
            output_logs.append(
                '- Translation Contribution Stats ID %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s' % v.topic_id)

        output_logs.append(
            'Unique topic IDs with translation contribution stats COUNT: '
            f'{len(contribution_stats)}')
        
        for stat in contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                contribution_stats.remove(stat)

        output_logs.append(
            'Unique valid topic IDs with translation contribution stats COUNT:'
            f' {len(contribution_stats)}')

        output_logs.append(
            'Unique valid topic IDs with translation contribution stats: ')
        for v in contribution_stats:
            output_logs.append(
                '- Translation Contribution Stats ID %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s' % v.topic_id)

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)

    def format_translation_review_output(self, key, group):
        """Formats the output for translation review stats."""
        review_stats = group['review_stats']
        output_logs = []

        output_logs.append(
            'Translation Reviewer ID: %s, Language code: %s' % (
                key[1], key[0]))

        output_logs.append(
            'Unique topic IDs with translation review stats: ')
        for v in review_stats:
            output_logs.append(
                '- Translation Review Stats ID %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s' % v.topic_id)

        output_logs.append(
            'Unique topic IDs with translation review stats COUNT: '
            f'{len(review_stats)}')
        
        for stat in review_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                review_stats.remove(stat)

        output_logs.append(
            'Unique valid topic IDs with translation review stats: ')
        for v in review_stats:
            output_logs.append(
                '- Translation Review Stats ID %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s' % v.topic_id)

        output_logs.append(
            'Unique valid topic IDs with translation review stats COUNT: '
            f'{len(review_stats)}')

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)

    def format_question_contribution_output(self, key, group):
        """Formats the output for question suggestions and contribution
        stats."""
        suggestions = group['suggestion']
        contribution_stats = group['contribution_stats']
        output_logs = []
        by_topic_id = lambda m: m.topic_id

        skill_ids_with_question_suggestions = sorted(
            {v.target_id for v in suggestions})

        topic_ids_with_question_submissions_list = []
        with datastore_services.get_ndb_context():
            for skill_id in skill_ids_with_question_suggestions:
                topic_assignments = sorted(
                    skill_services.get_all_topic_assignments_for_skill(
                        skill_id), key=by_topic_id)
                for topic_assignment in topic_assignments:
                    topic_ids_with_question_submissions_list.append(
                        topic_assignment.topic_id)

        topic_ids_with_question_submissions = sorted(
            set(topic_ids_with_question_submissions_list))

        output_logs.append(
                'Question submitter ID: %s.' % key)

        output_logs.append(
            'Unique skill IDs with question suggestion: ')

        with datastore_services.get_ndb_context():
            for skill_id in skill_ids_with_question_suggestions:
                output_logs.append(
                    '- Skill ID: %s' % skill_id)
                topic_assignments = sorted(
                    skill_services.get_all_topic_assignments_for_skill(
                        skill_id), key=by_topic_id)
                for topic_assignment in topic_assignments:
                    output_logs.append(
                        '-- Topic ID: %s' % topic_assignment.topic_id)

        output_logs.append(
            'Unique topic IDs with question suggestions COUNT: '
            f'{len(topic_ids_with_question_submissions)}')

        output_logs.append(
            'Unique topic IDs with question contribution stats: ')
        for v in contribution_stats:
            output_logs.append(
                '- Question Contribution Stats ID: %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s' % v.topic_id)

        output_logs.append(
            'Unique topic IDs with question contribution stats COUNT: '
            f'{len(contribution_stats)}')

        for stat in contribution_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                contribution_stats.remove(stat)

        output_logs.append(
            'Unique valid topic IDs with question contribution stats COUNT: '
            f'{len(contribution_stats)}')

        output_logs.append(
            'Unique valid topic IDs with question contribution stats: ')
        for v in contribution_stats:
            output_logs.append(
                '- Question Contribution Stats ID: %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s\n' % v.topic_id)

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)

    def format_question_review_output(self, key, group):
        """Formats the output for question review stats."""
        review_stats = group['review_stats']
        output_logs = []

        output_logs.append(
            'Question Reviewer ID: %s' % key)

        output_logs.append(
            'Unique topic IDs with question review stats: ')
        for v in review_stats:
            output_logs.append(
                '- Question Review Stats ID %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s' % v.topic_id)

        output_logs.append(
            'Unique topic IDs with question review stats COUNT: '
            f'{len(review_stats)}')
        
        for stat in review_stats:
            if GenerateContributorAdminStatsJob.not_validate_topic(
                stat.topic_id):
                review_stats.remove(stat)

        output_logs.append(
            'Unique valid topic IDs with question review stats: ')
        for v in review_stats:
            output_logs.append(
                '- Question Review Stats ID %s' % v.id)
            output_logs.append(
                '-- Topic ID: %s' % v.topic_id)

        output_logs.append(
            'Unique valid topic IDs with question review stats COUNT: '
            f'{len(review_stats)}')

        output_logs.append("------------------------------------------------------------")

        return '\n'.join(output_logs)