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

from __future__ import annotations

import datetime

from core import feconf
from core.domain import exp_domain
from core.domain import html_cleaner
from core.domain import opportunity_domain
from core.domain import opportunity_services
from core.domain import skill_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import translation_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

import result

from typing import (
    Dict, Iterable, Iterator, List, Optional, Set, Tuple, TypedDict, Union)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models

(opportunity_models, suggestion_models) = models.Registry.import_models([
    models.Names.OPPORTUNITY, models.Names.SUGGESTION
])

datastore_services = models.Registry.import_datastore_services()


class ContributionStatsDict(TypedDict):
    """Type for the contribution stats dictionary."""

    suggestion_status: str
    edited_by_reviewer: bool
    content_word_count: int
    last_updated_date: datetime.date


class GenerateTranslationContributionStatsJob(base_jobs.JobBase):
    """Job that generates contributor stats."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Generates the translation review stats.

        Returns:
            PCollection. A PCollection of 'SUCCESS x' results, where x is
            the number of generated stats..
        """
        non_deleted_suggestion_models = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
        )

        translation_suggestions_grouped_by_target = (
            non_deleted_suggestion_models
            | 'Filter translate suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                ))
            | 'Transform to submitted suggestion domain object' >> (
                beam.Map(suggestion_services.get_suggestion_from_model))
            | 'Group submitted suggestions by target' >> (
                beam.GroupBy(lambda m: m.target_id))
        )
        reviewed_translation_suggestions_grouped_by_target = (
            non_deleted_suggestion_models
            | 'Filter reviewed translate suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                    in [
                        m.status == suggestion_models.STATUS_ACCEPTED,
                        m.status == suggestion_models.STATUS_REJECTED
                    ]
                ))
            | 'Transform to reviewed suggestion domain object' >> beam.Map(
                suggestion_services.get_suggestion_from_model)
            | 'Group reviewed suggestions by target' >> (
                beam.GroupBy(lambda m: m.target_id))
        )
        question_suggestions_grouped_by_target = (
            non_deleted_suggestion_models
            | 'Filter question suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_ADD_QUESTION
                ))
            | 'Transform to submitted question suggestion domain object' >> (
                beam.Map(suggestion_services.get_suggestion_from_model))
            | 'Group submitted question suggestions by target' >> (
                beam.GroupBy(lambda m: m.target_id))
        )
        question_reviews_grouped_by_target = (
            non_deleted_suggestion_models
            | 'Filter question reviews' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_ADD_QUESTION
                    in [
                        m.status == suggestion_models.STATUS_ACCEPTED,
                        m.status == suggestion_models.STATUS_REJECTED
                    ]
                ))
            | 'Transform to reviewed question suggestion domain object' >> (
                beam.Map(suggestion_services.get_suggestion_from_model)
            )
            | 'Group reviewed question suggestions by target' >> (
                beam.GroupBy(lambda m: m.target_id))
        )

        exp_opportunities = (
            self.pipeline
            | 'Get all non-deleted opportunity models' >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all(
                    include_deleted=False))
            | 'Transform to opportunity domain object' >> beam.Map(
                opportunity_services.
                get_exploration_opportunity_summary_from_model)
            | 'Group by ID' >> beam.GroupBy(lambda m: m.id)
        )
        skill_opportunities = (
            self.pipeline
            | 'Get all non-deleted skill opportunity models' >> (
                ndb_io.GetModels(
                    opportunity_models.SkillOpportunityModel.get_all(
                        include_deleted=False)
                )
            )
            | 'Transform to skill opportunity domain object' >> beam.Map(
                opportunity_services.
                get_skill_opportunity_from_model)
            | 'Group skill opportunity by ID' >> beam.GroupBy(lambda m: m.id)
        )

        exp_opportunity_to_submitted_suggestions = (
            {
                'suggestion': translation_suggestions_grouped_by_target,
                'opportunity': exp_opportunities
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Get rid of key submitted objects' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )
        exp_opportunity_to_reviewed_submitted_suggestions = (
            {
                'suggestion': (
                    reviewed_translation_suggestions_grouped_by_target),
                'opportunity': exp_opportunities
            }
            | 'Merge reviewed models' >> beam.CoGroupByKey()
            | 'Get rid of key of reviewed objects' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )
        skill_opportunity_to_submitted_suggestions = (
            {
                'suggestion': question_suggestions_grouped_by_target,
                'opportunity': skill_opportunities
            }
            | 'Merge submitted question models' >> beam.CoGroupByKey()
            | 'Get rid of key of submitted question objects' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )
        skill_opportunity_to_reviewed_suggestions = (
            {
                'suggestion': question_reviews_grouped_by_target,
                'opportunity': skill_opportunities
            }
            | 'Merge reviewed question models' >> beam.CoGroupByKey()
            | 'Get rid of key of reviewed question objects' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        translation_contribution_stats_keys_and_results = (
            exp_opportunity_to_submitted_suggestions
            | 'Generate translation contribution stats' >> beam.ParDo(
                lambda x: self._generate_translation_stats(
                    x['suggestion'][0] if len(x['suggestion']) else [],
                    list(x['opportunity'][0])[0]
                    if len(x['opportunity']) else None,
                    suggestion_models.TranslationContributionStatsModel
                ))
        )
        translation_review_stats_keys_and_results = (
            exp_opportunity_to_reviewed_submitted_suggestions
            | 'Generate translation review stats' >> beam.ParDo(
                lambda x: self._generate_translation_stats(
                    x['suggestion'][0] if len(x['suggestion']) else [],
                    list(x['opportunity'][0])[0]
                    if len(x['opportunity']) else None,
                    suggestion_models.TranslationReviewStatsModel
                ))
        )
        question_contribution_stats_keys_and_results = (
            skill_opportunity_to_submitted_suggestions
            | 'Generate question contribution stats' >> beam.ParDo(
                lambda x: self._generate_question_stats(
                    x['suggestion'][0] if len(x['suggestion']) else [],
                    list(x['opportunity'][0])[0]
                    if len(x['opportunity']) else None,
                    suggestion_models.QuestionContributionStatsModel
                ))
        )
        question_review_stats_keys_and_results = (
            skill_opportunity_to_reviewed_suggestions
            | 'Generate question review stats' >> beam.ParDo(
                lambda x: self._generate_question_stats(
                    x['suggestion'][0] if len(x['suggestion']) else [],
                    list(x['opportunity'][0])[0]
                    if len(x['opportunity']) else None,
                    suggestion_models.QuestionReviewStatsModel
                ))
        )

        user_contribution_stats_models = (
            translation_contribution_stats_keys_and_results
            | 'Filter contribution ok results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack contribution result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Combine the contribution stats' >> (
                beam.CombinePerKey(CombineTranslationContributionStats()))
            | 'Generate contribution models from stats' >> beam.MapTuple(
                self._generate_translation_contribution_model)
        )
        user_review_stats_models = (
            translation_review_stats_keys_and_results
            | 'Filter ok review results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack review result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Combine the review stats' >> (
                beam.CombinePerKey(CombineTranslationReviewStats()))
            | 'Generate review models from stats' >> beam.MapTuple(
                self._generate_translation_review_model)
        )
        user_question_contribution_stats_models = (
            question_contribution_stats_keys_and_results
            | 'Filter ok question contribution results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack question contribution result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Combine the question contribution stats' >> (
                beam.CombinePerKey(CombineQuestionContributionStats()))
            | 'Generate question contribution models from stats' >> (
                beam.MapTuple(self._generate_question_contribution_model))
        )
        user_question_review_stats_models = (
            question_review_stats_keys_and_results
            | 'Filter ok question review results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack question review result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Combine the question review stats' >> (
                beam.CombinePerKey(CombineQuestionReviewStats()))
            | 'Generate question review models from stats' >> beam.MapTuple(
                self._generate_question_review_model)
        )

        user_stats_error_job_run_results = (
            translation_contribution_stats_keys_and_results
            | 'Filter contribution err results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_err())
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Remove contribution keys' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Transform contribution result to job run result' >> (
                job_result_transforms.ResultsToJobRunResults())
        )
        user_review_stats_error_job_run_results = (
            translation_review_stats_keys_and_results
            | 'Filter review err results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_err())
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Remove review keys' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Transform review result to job run result' >> (
                job_result_transforms.ResultsToJobRunResults())
        )
        user_question_contribution_stats_error_job_run_results = (
            question_contribution_stats_keys_and_results
            | 'Filter question contribution err results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_err())
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Remove question contribution keys' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Transform question contribution result to job run result' >> (
                job_result_transforms.ResultsToJobRunResults())
        )
        user_question_review_stats_error_job_run_results = (
            question_review_stats_keys_and_results
            | 'Filter question review err results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_err())
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Remove question review keys' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Transform question review result to job run result' >> (
                job_result_transforms.ResultsToJobRunResults())
        )

        unused_contribution_put_result = (
            user_contribution_stats_models
            | 'Put contribution models into the datastore' >> ndb_io.PutModels()
        )
        unused_review_put_result = (
            user_review_stats_models
            | 'Put review models into the datastore' >> ndb_io.PutModels()
        )
        unused_question_contribution_put_result = (
            user_question_contribution_stats_models
            | 'Put question contribution models into the datastore' >> (
                ndb_io.PutModels())
        )
        unused_question_review_put_result = (
            user_question_review_stats_models
            | 'Put question review models into the datastore' >> (
                ndb_io.PutModels())
        )

        user_stats_models_job_run_results = (
            user_contribution_stats_models
            | 'Create contribution job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )
        user_review_stats_models_job_run_results = (
            user_review_stats_models
            | 'Create review job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )
        user_question_contribution_stats_models_job_run_results = (
            user_question_contribution_stats_models
            | 'Create question contribution job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )
        user_question_review_stats_models_job_run_results = (
            user_question_review_stats_models
            | 'Create question review job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )

        return (
            (
                user_stats_error_job_run_results,
                user_stats_models_job_run_results,
                user_review_stats_error_job_run_results,
                user_review_stats_models_job_run_results,
                user_question_contribution_stats_error_job_run_results,
                user_question_contribution_stats_models_job_run_results,
                user_question_review_stats_error_job_run_results,
                user_question_review_stats_models_job_run_results
            )
            | 'Merge job run results' >> beam.Flatten()
        )

    @staticmethod
    def _generate_translation_stats(
        suggestions: Iterable[suggestion_registry.SuggestionTranslateContent],
        opportunity: Optional[opportunity_domain.ExplorationOpportunitySummary],
        model: Union[
            suggestion_models.TranslationContributionStatsModel,
            suggestion_models.TranslationReviewStatsModel
        ]
    ) -> Iterator[
        Tuple[str, result.Result[Dict[str, Union[bool, int, str]], str]]
    ]:
        """Generates translation stats for each suggestion.

        Args:
            suggestions: iter(SuggestionTranslateContent). Suggestions for which
                the stats should be generated.
            opportunity: ExplorationOpportunitySummary. Opportunity for which
                were the suggestions generated. Used to extract topic ID.
            model: TranslationStatsModel. A reference to the model which the
                stats are generated.

        Yields:
            tuple(str, Dict(str, *)). Tuple of key and suggestion stats dict.
            The stats dictionary has four fields:
                suggestion_status: str. What is the status of the suggestion.
                edited_by_reviewer: bool. Whether the suggestion was edited by
                    the reviewer.
                content_word_count: int. The word count of the content of
                    the suggestion.
                last_updated_date: str. When was the suggestion last updated.
                created_date: str. When was the suggestion created.
        """
        # When opportunity is not available we leave the topic ID empty.
        topic_id = ''
        if opportunity is not None:
            topic_id = opportunity.topic_id

        for suggestion in suggestions:
            if model == suggestion_models.TranslationContributionStatsModel:
                key = model.construct_id(
                    suggestion.language_code,
                    suggestion.author_id,
                    topic_id
                )
            else:
                if suggestion.final_reviewer_id is None:
                    yield (
                        'FAILED', result.Err('Reviewer ID should not be None.'))
                key = model.construct_id(
                    suggestion.language_code,
                    suggestion.final_reviewer_id,
                    topic_id
                )
            try:
                change = suggestion.change
                # In the new translation command the content in set format is
                # a list, content in unicode and html format is a string.
                # This code normalizes the content to the list type so that
                # we can easily count words.
                if (
                        change.cmd == exp_domain.CMD_ADD_WRITTEN_TRANSLATION and
                        translation_domain.TranslatableContentFormat
                        .is_data_format_list(change.data_format)
                ):
                    content_items: Union[
                        str, List[str]
                    ] = change.translation_html
                else:
                    content_items = [change.translation_html]

                content_word_count = 0
                for item in content_items:
                    # Count the number of words in the original content,
                    # ignoring any HTML tags and attributes.
                    content_plain_text = html_cleaner.strip_html_tags(item)
                    content_word_count += len(content_plain_text.split())

                translation_contribution_stats_dict = {
                    'suggestion_status': suggestion.status,
                    'edited_by_reviewer': suggestion.edited_by_reviewer,
                    'content_word_count': content_word_count,
                    'last_updated_date': (
                        suggestion.last_updated.date().isoformat())
                }
                yield (key, result.Ok(translation_contribution_stats_dict))
            except Exception as e:
                yield (
                    key, result.Err('%s: %s' % (suggestion.suggestion_id, e))
                )

    @staticmethod
    def _generate_question_stats(
        suggestions: Iterable[suggestion_registry.SuggestionAddQuestion],
        opportunity: Optional[opportunity_domain.SkillOpportunity],
        model: Union[
            suggestion_models.QuestionContributionStatsModel,
            suggestion_models.QuestionReviewStatsModel
        ]
    ) -> Iterator[
        Tuple[str, result.Result[Dict[str, Union[bool, int, str]], str]]
    ]:
        """Generates question stats for each suggestion.

        Args:
            suggestions: iter(SuggestionTranslateContent). Suggestions for which
                the stats should be generated.
            opportunity: SkillOpportunity. Opportunity for which
                were the suggestions generated. Used to extract topic ID.
            model: QuestionStatsModel. A reference to the model which the
                stats are generated.

        Yields:
            tuple(str, Dict(str, *)). Tuple of key and suggestion stats dict.
            The stats dictionary has four fields:
                suggestion_status: str. What is the status of the suggestion.
                edited_by_reviewer: bool. Whether the suggestion was edited by
                    the reviewer.
                content_word_count: int. The word count of the content of
                    the suggestion.
                last_updated_date: str. When was the suggestion last updated.
                created_date: str. When was the suggestion created.
        """
        with datastore_services.get_ndb_context():
            for topic in skill_services.get_all_topic_assignments_for_skill(
                opportunity.id):
                topic_id = topic.topic_id
                for suggestion in suggestions:
                    if model == (
                        suggestion_models.QuestionContributionStatsModel
                    ):
                        key = model.construct_id(
                            suggestion.author_id,
                            topic_id
                        )
                    else:
                        if suggestion.final_reviewer_id is None:
                            yield (
                                'FAILED',
                                result.Err('Reviewer ID should not be None.')
                            )
                        key = model.construct_id(
                            suggestion.final_reviewer_id,
                            topic_id
                        )
                    question_stats_dict = {
                        'suggestion_status': suggestion.status,
                        'edited_by_reviewer': suggestion.edited_by_reviewer,
                        'content_word_count': 0,
                        'last_updated_date': (
                            suggestion.last_updated.date().isoformat())
                    }
                    yield (key, result.Ok(question_stats_dict))

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

    @staticmethod
    def _generate_translation_review_model(
        entity_id: str,
        translation: suggestion_registry.TranslationReviewStats
    ) -> suggestion_models.TranslationReviewStatsModel:
        """Generate translation review stats model from the domain object.

        Args:
            entity_id: str. The ID of the model.
            translation: TranslationReviewStats. Domain object.

        Returns:
            TranslationReviewStatsModel. The created model.
        """
        language_code, contributor_user_id, topic_id = entity_id.split('.')
        with datastore_services.get_ndb_context():
            translation_review_stats_model = (
                suggestion_models.TranslationReviewStatsModel(
                    id=entity_id,
                    language_code=language_code,
                    reviewer_user_id=contributor_user_id,
                    topic_id=topic_id,
                    reviewed_translations_count=(
                        translation.reviewed_translations_count),
                    reviewed_translation_word_count=(
                        translation.reviewed_translation_word_count),
                    accepted_translations_count=(
                        translation.accepted_translations_count),
                    accepted_translations_with_reviewer_edits_count=(
                        translation
                        .accepted_translations_with_reviewer_edits_count),
                    accepted_translation_word_count=(
                        translation.accepted_translation_word_count),
                    first_contribution_date=translation.first_contribution_date,
                    last_contribution_date=translation.last_contribution_date
                )
            )
            translation_review_stats_model.update_timestamps()
            return translation_review_stats_model

    @staticmethod
    def _generate_question_contribution_model(
        entity_id: str,
        question: suggestion_registry.QuestionContributionStats
    ) -> suggestion_models.QuestionContributionStatsModel:
        """Generate translation review stats model from the domain object.

        Args:
            entity_id: str. The ID of the model.
            question: QuestionContributionStats. Domain object.

        Returns:
            QuestionContributionStatsModel. The created model.
        """
        contributor_user_id, topic_id = entity_id.split('.')
        with datastore_services.get_ndb_context():
            question_contribution_stats_model = (
                suggestion_models.QuestionContributionStatsModel(
                    id=entity_id,
                    contributor_user_id=contributor_user_id,
                    topic_id=topic_id,
                    submitted_questions_count=(
                        question.submitted_questions_count),
                    accepted_questions_count=(
                        question.accepted_questions_count),
                    accepted_questions_without_reviewer_edits_count=(
                        question
                        .accepted_questions_without_reviewer_edits_count),
                    first_contribution_date=question.first_contribution_date,
                    last_contribution_date=question.last_contribution_date
                )
            )
            question_contribution_stats_model.update_timestamps()
            return question_contribution_stats_model

    @staticmethod
    def _generate_question_review_model(
        entity_id: str,
        question: suggestion_registry.QuestionReviewStats
    ) -> suggestion_models.QuestionReviewStatsModel:
        """Generate question review stats model from the domain object.

        Args:
            entity_id: str. The ID of the model.
            question: QuestionReviewStats. Domain object.

        Returns:
            QuestionReviewStatsModel. The created model.
        """
        contributor_user_id, topic_id = entity_id.split('.')
        with datastore_services.get_ndb_context():
            question_review_stats_model = (
                suggestion_models.QuestionReviewStatsModel(
                    id=entity_id,
                    reviewer_user_id=contributor_user_id,
                    topic_id=topic_id,
                    reviewed_questions_count=(
                        question.reviewed_questions_count),
                    accepted_questions_count=(
                        question.accepted_questions_count),
                    accepted_questions_with_reviewer_edits_count=(
                        question
                        .accepted_questions_with_reviewer_edits_count),
                    first_contribution_date=question.first_contribution_date,
                    last_contribution_date=question.last_contribution_date
                )
            )
            question_review_stats_model.update_timestamps()
            return question_review_stats_model


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to assume
# that CombineFn class is of type Any. Thus to avoid MyPy's error (Class cannot
# subclass 'CombineFn' (has type 'Any')), we added an ignore here.
class CombineTranslationContributionStats(beam.CombineFn):  # type: ignore[misc]
    """CombineFn for combining the translation contribution stats."""

    def create_accumulator(
        self
    ) -> suggestion_registry.TranslationContributionStats:
        return suggestion_registry.TranslationContributionStats.create_default()

    def add_input(
        self,
        accumulator: suggestion_registry.TranslationContributionStats,
        translation: ContributionStatsDict
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
            str(translation['last_updated_date']), '%Y-%m-%d').date()
        return suggestion_registry.TranslationContributionStats(
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
        contribution_dates: Set[datetime.date] = set()
        all_contribution_dates = [
            acc.contribution_dates for acc in accumulators
        ]
        contribution_dates = contribution_dates.union(*all_contribution_dates)

        return suggestion_registry.TranslationContributionStats(
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
            contribution_dates
        )

    def extract_output(
        self, accumulator: suggestion_registry.TranslationContributionStats
    ) -> suggestion_registry.TranslationContributionStats:
        return accumulator


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to assume
# that CombineFn class is of type Any. Thus to avoid MyPy's error (Class cannot
# subclass 'CombineFn' (has type 'Any')), we added an ignore here.
class CombineTranslationReviewStats(beam.CombineFn):  # type: ignore[misc]
    """CombineFn for combining the translation review stats."""

    def create_accumulator(
        self
    ) -> suggestion_registry.TranslationReviewStats:
        return suggestion_registry.TranslationReviewStats.create_default()

    def add_input(
        self,
        accumulator: suggestion_registry.TranslationReviewStats,
        translation: ContributionStatsDict
    ) -> suggestion_registry.TranslationReviewStats:
        is_accepted = (
            translation['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_edited = (
            is_accepted and translation['edited_by_reviewer'])
        word_count = translation['content_word_count']
        return suggestion_registry.TranslationReviewStats(
            accumulator.language_code,
            accumulator.contributor_user_id,
            accumulator.topic_id,
            accumulator.reviewed_translations_count + 1,
            accumulator.reviewed_translation_word_count + word_count,
            accumulator.accepted_translations_count + int(is_accepted),
            accumulator.accepted_translation_word_count + word_count * int(
                is_accepted),
            (
                accumulator.accepted_translations_with_reviewer_edits_count +
                int(is_accepted_and_edited)
            ),
            translation['last_updated_date'],
            translation['last_updated_date']
        )

    def merge_accumulators(
        self,
        accumulators: Iterable[suggestion_registry.TranslationReviewStats]
    ) -> suggestion_registry.TranslationReviewStats:
        all_first_contributed_dates = [
            acc.first_contribution_date for acc in accumulators
        ]
        all_last_contributed_dates = [
            acc.last_contribution_date for acc in accumulators
        ]
        all_first_contributed_dates.sort()
        all_last_contributed_dates.sort()

        return suggestion_registry.TranslationReviewStats(
            list(accumulators)[0].language_code,
            list(accumulators)[0].contributor_user_id,
            list(accumulators)[0].topic_id,
            sum(acc.reviewed_translations_count for acc in accumulators),
            sum(acc.reviewed_translation_word_count for acc in accumulators),
            sum(acc.accepted_translations_count for acc in accumulators),
            sum(acc.accepted_translation_word_count for acc in accumulators),
            sum(
                acc.accepted_translations_with_reviewer_edits_count
                for acc in accumulators
            ),
            all_first_contributed_dates[0],
            all_last_contributed_dates[-1]
        )

    def extract_output(
        self, accumulator: suggestion_registry.TranslationContributionStats
    ) -> suggestion_registry.TranslationContributionStats:
        return accumulator


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to assume
# that CombineFn class is of type Any. Thus to avoid MyPy's error (Class cannot
# subclass 'CombineFn' (has type 'Any')), we added an ignore here.
class CombineQuestionContributionStats(beam.CombineFn):  # type: ignore[misc]
    """CombineFn for combining the question contribution stats."""

    def create_accumulator(
        self
    ) -> suggestion_registry.QuestionContributionStats:
        return suggestion_registry.QuestionContributionStats.create_default()

    def add_input(
        self,
        accumulator: suggestion_registry.QuestionContributionStats,
        question: ContributionStatsDict
    ) -> suggestion_registry.QuestionContributionStats:
        is_accepted = (
            question['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_not_edited = (
            is_accepted and not question['edited_by_reviewer'])
        return suggestion_registry.QuestionContributionStats(
            accumulator.contributor_user_id,
            accumulator.topic_id,
            accumulator.submitted_questions_count + 1,
            accumulator.accepted_questions_count + int(is_accepted),
            (
                accumulator.accepted_questions_without_reviewer_edits_count +
                int(is_accepted_and_not_edited)
            ),
            question['last_updated_date'],
            question['last_updated_date']
        )

    def merge_accumulators(
        self,
        accumulators: Iterable[suggestion_registry.QuestionContributionStats]
    ) -> suggestion_registry.QuestionContributionStats:
        all_first_contributed_dates = [
            acc.first_contribution_date for acc in accumulators
        ]
        all_last_contributed_dates = [
            acc.last_contribution_date for acc in accumulators
        ]
        all_first_contributed_dates.sort()
        all_last_contributed_dates.sort()

        return suggestion_registry.QuestionContributionStats(
            list(accumulators)[0].contributor_user_id,
            list(accumulators)[0].topic_id,
            sum(acc.submitted_questions_count for acc in accumulators),
            sum(acc.accepted_questions_count for acc in accumulators),
            sum(
                acc.accepted_questions_without_reviewer_edits_count
                for acc in accumulators
            ),
            all_first_contributed_dates[0],
            all_last_contributed_dates[-1]
        )

    def extract_output(
        self, accumulator: suggestion_registry.QuestionContributionStats
    ) -> suggestion_registry.QuestionContributionStats:
        return accumulator


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to assume
# that CombineFn class is of type Any. Thus to avoid MyPy's error (Class cannot
# subclass 'CombineFn' (has type 'Any')), we added an ignore here.
class CombineQuestionReviewStats(beam.CombineFn):  # type: ignore[misc]
    """CombineFn for combining the question review stats."""

    def create_accumulator(
        self
    ) -> suggestion_registry.QuestionReviewStats:
        return suggestion_registry.QuestionReviewStats.create_default()

    def add_input(
        self,
        accumulator: suggestion_registry.QuestionReviewStats,
        question: ContributionStatsDict
    ) -> suggestion_registry.QuestionReviewStats:
        is_accepted = (
            question['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_edited = (
            is_accepted and question['edited_by_reviewer'])
        return suggestion_registry.QuestionReviewStats(
            accumulator.contributor_user_id,
            accumulator.topic_id,
            accumulator.reviewed_questions_count + 1,
            accumulator.accepted_questions_count + int(is_accepted),
            (
                accumulator.accepted_questions_with_reviewer_edits_count +
                int(is_accepted_and_edited)
            ),
            question['last_updated_date'],
            question['last_updated_date']
        )

    def merge_accumulators(
        self,
        accumulators: Iterable[suggestion_registry.QuestionReviewStats]
    ) -> suggestion_registry.QuestionReviewStats:
        all_first_contributed_dates = [
            acc.first_contribution_date for acc in accumulators
        ]
        all_last_contributed_dates = [
            acc.last_contribution_date for acc in accumulators
        ]
        all_first_contributed_dates.sort()
        all_last_contributed_dates.sort()

        return suggestion_registry.QuestionReviewStats(
            list(accumulators)[0].contributor_user_id,
            list(accumulators)[0].topic_id,
            sum(acc.reviewed_questions_count for acc in accumulators),
            sum(acc.accepted_questions_count for acc in accumulators),
            sum(
                acc.accepted_questions_with_reviewer_edits_count
                for acc in accumulators
            ),
            all_first_contributed_dates[0],
            all_last_contributed_dates[-1]
        )

    def extract_output(
        self, accumulator: suggestion_registry.QuestionReviewStats
    ) -> suggestion_registry.QuestionReviewStats:
        return accumulator
