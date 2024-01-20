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
    Dict, Iterable, Iterator, List, Optional, Set, Tuple, Type, TypedDict, Union
)

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
    word_count: int
    last_updated_date: datetime.date
    created_on_date: datetime.date


class GenerateContributionStatsJob(base_jobs.JobBase):
    """Job that generates contributor stats."""

    DATASTORE_UPDATES_ALLOWED = True

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
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT and
                    m.status in [
                        suggestion_models.STATUS_ACCEPTED,
                        suggestion_models.STATUS_REJECTED
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
        reviewed_question_suggestions_grouped_by_target = (
            non_deleted_suggestion_models
            | 'Filter question reviews' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_ADD_QUESTION and
                    m.status in [
                        suggestion_models.STATUS_ACCEPTED,
                        suggestion_models.STATUS_REJECTED
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
        skill_opportunities_by_id = (
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
        exp_opportunity_to_reviewed_suggestions = (
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
                'opportunity': skill_opportunities_by_id
            }
            | 'Merge submitted question models' >> beam.CoGroupByKey()
            | 'Get rid of key of submitted question objects' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )
        skill_opportunity_to_reviewed_suggestions = (
            {
                'suggestion': reviewed_question_suggestions_grouped_by_target,
                'opportunity': skill_opportunities_by_id
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
            exp_opportunity_to_reviewed_suggestions
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
                    list(x['opportunity'][0])[0].id
                    if len(x['opportunity']) else '',
                    suggestion_models.QuestionContributionStatsModel
                ))
        )
        question_review_stats_keys_and_results = (
            skill_opportunity_to_reviewed_suggestions
            | 'Generate question review stats' >> beam.ParDo(
                lambda x: self._generate_question_stats(
                    x['suggestion'][0] if len(x['suggestion']) else [],
                    list(x['opportunity'][0])[0].id
                    if len(x['opportunity']) else '',
                    suggestion_models.QuestionReviewStatsModel
                ))
        )

        user_contribution_stats_models = (
            translation_contribution_stats_keys_and_results
            | 'Filter contribution ok results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack contribution result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Generate translation contribution stats objects' >> (
                beam.MapTuple(
                    self._generate_translation_contribution_stats_objects
                )
            )
            | 'Combine the contribution stats' >> (
                beam.CombinePerKey(
                    self._combine_translation_contribution_stats_objects))
            | 'Generate contribution models from stats' >> beam.MapTuple(
                self._generate_translation_contribution_model)
        )
        user_review_stats_models = (
            translation_review_stats_keys_and_results
            | 'Filter ok review results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack review result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Generate translation review stats objects' >> beam.MapTuple(
                self._generate_translation_review_stats_objects)
            | 'Combine the review stats' >> (
                beam.CombinePerKey(
                    self._combine_translation_review_stats_objects))
            | 'Generate review models from stats' >> beam.MapTuple(
                self._generate_translation_review_model)
        )
        user_question_contribution_stats_models = (
            question_contribution_stats_keys_and_results
            | 'Filter ok question contribution results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack question contribution result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Generate question contribution stats objects' >> beam.MapTuple(
                self._generate_question_contribution_stats_objects)
            | 'Combine the question contribution stats' >> (
                beam.CombinePerKey(
                    self._combine_question_contribution_stats_objects))
            | 'Generate question contribution models from stats' >> (
                beam.MapTuple(self._generate_question_contribution_model))
        )
        user_question_review_stats_models = (
            question_review_stats_keys_and_results
            | 'Filter ok question review results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack question review result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Generate question review stats objects' >> beam.MapTuple(
                self._generate_question_review_stats_objects)
            | 'Combine the question review stats' >> (
                beam.CombinePerKey(self._combine_question_review_stats_objects))
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

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_contribution_put_result = (
                user_contribution_stats_models
                | 'Put contribution models into the datastore' >> (
                    ndb_io.PutModels())
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
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS COUNT'
                ))
        )
        user_review_stats_models_job_run_results = (
            user_review_stats_models
            | 'Create review job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PROCESSED TRANSLATION REVIEW STATS COUNT'
                ))
        )
        user_question_contribution_stats_models_job_run_results = (
            user_question_contribution_stats_models
            | 'Create question contribution job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PROCESSED QUESTION CONTRIBUTION STATS COUNT'
                ))
        )
        user_question_review_stats_models_job_run_results = (
            user_question_review_stats_models
            | 'Create question review job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PROCESSED QUESTION REVIEW STATS COUNT'
                ))
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
            Type[suggestion_models.TranslationContributionStatsModel],
            Type[suggestion_models.TranslationReviewStatsModel]
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
                word_count: int. The word count of the content of
                    the suggestion.
                last_updated_date: str. When was the suggestion last updated.
                created_date: str. When was the suggestion created.
        """
        # When opportunity is not available we leave the topic ID empty.
        topic_id = ''
        if opportunity is not None:
            topic_id = opportunity.topic_id

            for suggestion in suggestions:
                user_id = (
                    suggestion.author_id if model ==
                    suggestion_models.TranslationContributionStatsModel
                    else suggestion.final_reviewer_id
                )

                if user_id is None:
                    user_id = feconf.SUGGESTION_BOT_USER_ID

                key = model.construct_id(
                    suggestion.language_code,
                    user_id,
                    topic_id
                )
                try:
                    change = suggestion.change_cmd
                    # In the new translation command the content in set format
                    # is a list, content in unicode and html format is a string.
                    # This code normalizes the content to the list type so that
                    # we can easily count words.
                    if (
                            change.cmd == exp_domain.CMD_ADD_WRITTEN_TRANSLATION
                            and translation_domain.TranslatableContentFormat
                            .is_data_format_list(change.data_format)
                    ):
                        content_items: Union[
                            str, List[str]
                        ] = change.translation_html
                    else:
                        content_items = [change.translation_html]

                    word_count = 0
                    for item in content_items:
                        # Count the number of words in the original content,
                        # ignoring any HTML tags and attributes.
                        content_plain_text = html_cleaner.strip_html_tags(item)
                        word_count += len(content_plain_text.split())

                    translation_contribution_stats_dict = {
                        'suggestion_status': suggestion.status,
                        'edited_by_reviewer': suggestion.edited_by_reviewer,
                        'word_count': word_count,
                        'last_updated_date': (
                            suggestion.last_updated.date()),
                        'created_on_date': (
                            suggestion.created_on.date())
                    }
                    yield (key, result.Ok(translation_contribution_stats_dict))
                except Exception as e:
                    yield (
                        key, result.Err(
                            '%s: %s' % (suggestion.suggestion_id, e))
                    )

    @staticmethod
    def _generate_question_stats(
        suggestions: Iterable[suggestion_registry.SuggestionAddQuestion],
        skill_id: str,
        model: Union[
            Type[suggestion_models.QuestionContributionStatsModel],
            Type[suggestion_models.QuestionReviewStatsModel]
        ]
    ) -> Iterator[
        Tuple[str, result.Result[Dict[str, Union[bool, int, str]], str]]
    ]:
        """Generates question stats for each suggestion.

        Args:
            suggestions: iter(SuggestionTranslateContent). Suggestions for which
                the stats should be generated.
            skill_id: str. The skill ID which the suggestion is created for.
            model: QuestionStatsModel. A reference to the model which the
                stats are generated.

        Yields:
            tuple(str, Dict(str, *)). Tuple of key and suggestion stats dict.
            The stats dictionary has four fields:
                suggestion_status: str. What is the status of the suggestion.
                edited_by_reviewer: bool. Whether the suggestion was edited by
                    the reviewer.
                word_count: int. The word count of the content of
                    the suggestion.
                last_updated_date: str. When was the suggestion last updated.
                created_date: str. When was the suggestion created.
        """
        with datastore_services.get_ndb_context():
            for topic in skill_services.get_all_topic_assignments_for_skill(
                skill_id):
                topic_id = topic.topic_id
                for suggestion in suggestions:
                    user_id = (
                        suggestion.author_id if model ==
                        suggestion_models.QuestionContributionStatsModel
                        else suggestion.final_reviewer_id
                    )

                    if user_id is None:
                        user_id = feconf.SUGGESTION_BOT_USER_ID

                    key = model.construct_id(
                        user_id,
                        topic_id
                    )
                    question_stats_dict = {
                        'suggestion_status': suggestion.status,
                        'edited_by_reviewer': suggestion.edited_by_reviewer,
                        'word_count': 0,
                        'last_updated_date': (
                            suggestion.last_updated.date()),
                        'created_on_date': (
                            suggestion.created_on.date())
                    }
                    yield (key, result.Ok(question_stats_dict))

    @staticmethod
    def _generate_translation_contribution_stats_objects(
        entity_id: str,
        stat: ContributionStatsDict
    ) -> Tuple[str, suggestion_registry.TranslationContributionStats]:
        """Generates translation contribution stats for each suggestion.

        Args:
            entity_id: str. The ID of the conrresponding stats model.
            stat: ContributionStatsDict. The skill ID which the suggestion is
                created for.

        Returns:
            tuple(str, TranslationContributionStats). Tuple of key and
            suggestion stats object.
        """
        language_code, contributor_user_id, topic_id = entity_id.split('.')
        is_accepted = (
            stat['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_not_edited = (
            is_accepted and not stat['edited_by_reviewer'])
        is_rejected = (
            stat['suggestion_status'] ==
            suggestion_models.STATUS_REJECTED
        )
        word_count = stat['word_count']
        suggestion_date = datetime.datetime.strptime(
            str(stat['created_on_date']), '%Y-%m-%d').date()
        transformed_data = suggestion_registry.TranslationContributionStats(
            language_code=language_code,
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            submitted_translations_count=1,
            submitted_translation_word_count=stat['word_count'],
            accepted_translations_count=int(is_accepted),
            accepted_translations_without_reviewer_edits_count=int(
                is_accepted_and_not_edited),
            accepted_translation_word_count=word_count * int(is_accepted),
            rejected_translations_count=int(is_rejected),
            rejected_translation_word_count=word_count * int(is_rejected),
            contribution_dates={suggestion_date}
        )

        return (entity_id, transformed_data)

    @staticmethod
    def _combine_translation_contribution_stats_objects(
        stats: Iterable[suggestion_registry.TranslationContributionStats]
    ) -> suggestion_registry.TranslationContributionStats:
        """Combines translation contribution stats.

        Args:
            stats: iterable(TranslationContributionStats). A collection of
                individual stats domain objects.

        Returns:
            TranslationContributionStats. The combined domain object.
        """
        contribution_dates: Set[datetime.date] = set()
        all_contribution_dates = [
            stat.contribution_dates for stat in stats
        ]
        contribution_dates = contribution_dates.union(*all_contribution_dates)

        return suggestion_registry.TranslationContributionStats(
            language_code=list(stats)[0].language_code,
            contributor_user_id=list(stats)[0].contributor_user_id,
            topic_id=list(stats)[0].topic_id,
            submitted_translations_count=sum(
                stat.submitted_translations_count for stat in stats),
            submitted_translation_word_count=sum(
                stat.submitted_translation_word_count for stat in stats),
            accepted_translations_count=sum(
                stat.accepted_translations_count for stat in stats),
            accepted_translations_without_reviewer_edits_count=sum(
                stat.accepted_translations_without_reviewer_edits_count
                for stat in stats
            ),
            accepted_translation_word_count=sum(
                stat.accepted_translation_word_count for stat in stats),
            rejected_translations_count=sum(
                stat.rejected_translations_count for stat in stats),
            rejected_translation_word_count=sum(
                stat.rejected_translation_word_count for stat in stats),
            contribution_dates=contribution_dates
        )

    @staticmethod
    def _generate_translation_review_stats_objects(
        entity_id: str,
        stat: ContributionStatsDict
    ) -> Tuple[str, suggestion_registry.TranslationReviewStats]:
        """Generates translation review stats for each suggestion.

        Args:
            entity_id: str. The ID of the conrresponding stats model.
            stat: ContributionStatsDict. The skill ID which the suggestion is
                created for.

        Returns:
            tuple(str, TranslationReviewStats). Tuple of key and suggestion
            stats object.
        """
        language_code, contributor_user_id, topic_id = entity_id.split('.')
        is_accepted = (
            stat['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_edited = (
            is_accepted and stat['edited_by_reviewer'])

        transformed_data = suggestion_registry.TranslationReviewStats(
            language_code=language_code,
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            reviewed_translations_count=1,
            reviewed_translation_word_count=stat['word_count'],
            accepted_translations_count=(
                1 * is_accepted),
            accepted_translation_word_count=(
                stat['word_count'] * is_accepted),
            accepted_translations_with_reviewer_edits_count=(
                1 * is_accepted_and_edited),
            first_contribution_date=stat['last_updated_date'],
            last_contribution_date=stat['last_updated_date']
        )

        return (entity_id, transformed_data)

    @staticmethod
    def _combine_translation_review_stats_objects(
        stats: Iterable[suggestion_registry.TranslationReviewStats]
    ) -> suggestion_registry.TranslationReviewStats:
        """Combines translation review stats.

        Args:
            stats: iterable(TranslationReviewStats). A collection of
                individual stats domain objects.

        Returns:
            TranslationReviewStats. The combined domain object.
        """
        all_first_contributed_dates = [
            stat.first_contribution_date for stat in stats
        ]
        all_last_contributed_dates = [
            stat.last_contribution_date for stat in stats
        ]
        all_first_contributed_dates.sort()
        all_last_contributed_dates.sort()

        return suggestion_registry.TranslationReviewStats(
            language_code=list(stats)[0].language_code,
            contributor_user_id=list(stats)[0].contributor_user_id,
            topic_id=list(stats)[0].topic_id,
            reviewed_translations_count=sum(
                stat.reviewed_translations_count for stat in stats),
            reviewed_translation_word_count=sum(
                stat.reviewed_translation_word_count for stat in stats),
            accepted_translations_count=sum(
                stat.accepted_translations_count for stat in stats),
            accepted_translation_word_count=sum(
                stat.accepted_translation_word_count for stat in stats),
            accepted_translations_with_reviewer_edits_count=sum(
                stat.accepted_translations_with_reviewer_edits_count
                for stat in stats
            ),
            first_contribution_date=all_first_contributed_dates[0],
            last_contribution_date=all_last_contributed_dates[-1]
        )

    @staticmethod
    def _generate_question_contribution_stats_objects(
        entity_id: str,
        stat: ContributionStatsDict
    ) -> Tuple[str, suggestion_registry.QuestionContributionStats]:
        """Generates question contribution stats for each suggestion.

        Args:
            entity_id: str. The ID of the conrresponding stats model.
            stat: ContributionStatsDict. The skill ID which the suggestion is
                created for.

        Returns:
            tuple(str, QuestionContributionStats). Tuple of key and suggestion
            stats object.
        """
        contributor_user_id, topic_id = entity_id.split('.')
        is_accepted = (
            stat['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_not_edited = (
            is_accepted and not stat['edited_by_reviewer'])

        transformed_data = suggestion_registry.QuestionContributionStats(
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            submitted_questions_count=1,
            accepted_questions_count=int(is_accepted),
            accepted_questions_without_reviewer_edits_count=int(
                is_accepted_and_not_edited),
            first_contribution_date=stat['created_on_date'],
            last_contribution_date=stat['created_on_date']
        )

        return (entity_id, transformed_data)

    @staticmethod
    def _combine_question_contribution_stats_objects(
        stats: Iterable[suggestion_registry.QuestionContributionStats]
    ) -> suggestion_registry.QuestionContributionStats:
        """Combines question contribution stats.

        Args:
            stats: iterable(QuestionContributionStats). A collection of
                individual stats domain objects.

        Returns:
            QuestionContributionStats. The combined domain object.
        """
        all_first_contributed_dates = [
            stat.first_contribution_date for stat in stats
        ]
        all_last_contributed_dates = [
            stat.last_contribution_date for stat in stats
        ]
        all_first_contributed_dates.sort()
        all_last_contributed_dates.sort()

        return suggestion_registry.QuestionContributionStats(
            contributor_user_id=list(stats)[0].contributor_user_id,
            topic_id=list(stats)[0].topic_id,
            submitted_questions_count=sum(
                stat.submitted_questions_count for stat in stats),
            accepted_questions_count=sum(
                stat.accepted_questions_count for stat in stats),
            accepted_questions_without_reviewer_edits_count=sum(
                stat.accepted_questions_without_reviewer_edits_count
                for stat in stats
            ),
            first_contribution_date=all_first_contributed_dates[0],
            last_contribution_date=all_last_contributed_dates[-1]
        )

    @staticmethod
    def _generate_question_review_stats_objects(
        entity_id: str,
        stat: ContributionStatsDict
    ) -> Tuple[str, suggestion_registry.QuestionReviewStats]:
        """Generates question review stats for each suggestion.

        Args:
            entity_id: str. The ID of the conrresponding stats model.
            stat: ContributionStatsDict. The skill ID which the suggestion is
                created for.

        Returns:
            tuple(str, QuestionReviewStats). Tuple of key and suggestion
            stats object.
        """
        contributor_user_id, topic_id = entity_id.split('.')
        is_accepted = (
            stat['suggestion_status'] ==
            suggestion_models.STATUS_ACCEPTED
        )
        is_accepted_and_edited = (
            is_accepted and stat['edited_by_reviewer'])

        transformed_data = suggestion_registry.QuestionReviewStats(
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            reviewed_questions_count=1,
            accepted_questions_count=int(is_accepted),
            accepted_questions_with_reviewer_edits_count=int(
                is_accepted_and_edited),
            first_contribution_date=stat['last_updated_date'],
            last_contribution_date=stat['last_updated_date']
        )

        return (entity_id, transformed_data)

    @staticmethod
    def _combine_question_review_stats_objects(
        stats: Iterable[suggestion_registry.QuestionReviewStats]
    ) -> suggestion_registry.QuestionReviewStats:
        """Combines question review stats.

        Args:
            stats: iterable(QuestionReviewStats). A collection of individual
                stats domain objects.

        Returns:
            QuestionReviewStats. The combined domain object.
        """
        all_first_contributed_dates = [
            stat.first_contribution_date for stat in stats
        ]
        all_last_contributed_dates = [
            stat.last_contribution_date for stat in stats
        ]
        all_first_contributed_dates.sort()
        all_last_contributed_dates.sort()

        return suggestion_registry.QuestionReviewStats(
            contributor_user_id=list(stats)[0].contributor_user_id,
            topic_id=list(stats)[0].topic_id,
            reviewed_questions_count=sum(
                stat.reviewed_questions_count for stat in stats),
            accepted_questions_count=sum(
                stat.accepted_questions_count for stat in stats),
            accepted_questions_with_reviewer_edits_count=sum(
                stat.accepted_questions_with_reviewer_edits_count
                for stat in stats
            ),
            first_contribution_date=all_first_contributed_dates[0],
            last_contribution_date=all_last_contributed_dates[-1]
        )

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
                    contribution_dates=sorted(translation.contribution_dates)
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


class AuditGenerateContributionStatsJob(
    GenerateContributionStatsJob
):
    """Audit GenerateContributionStatsJob."""

    DATASTORE_UPDATES_ALLOWED = False
