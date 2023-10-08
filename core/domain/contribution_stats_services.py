# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Service methods for operating on contributor admin dashboard user stats.
"""

from __future__ import annotations

from core.domain import suggestion_registry
from core.domain import user_domain
from core.platform import models

from typing import List, Optional, Sequence, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models, ) = (
    models.Registry.import_models([
        models.Names.SUGGESTION
    ])
)


def get_translation_submitter_total_stats_from_model(
    translation_submitter_model:
        suggestion_models.TranslationSubmitterTotalContributionStatsModel
) -> suggestion_registry.TranslationSubmitterTotalContributionStats:
    """Returns a domain object for TranslationSubmitterTotalContributionStats
    model.

    Args:
        translation_submitter_model:
            TranslationSubmitterTotalContributionStatsModel. Model
            to get corresponding domain object.

    Returns:
        TranslationSubmitterTotalContributionStats. The domain object
        corresponding to given model.
    """
    return suggestion_registry.TranslationSubmitterTotalContributionStats(
        language_code=translation_submitter_model.language_code,
        contributor_id=translation_submitter_model.contributor_id,
        topic_ids_with_translation_submissions=(
            translation_submitter_model.topic_ids_with_translation_submissions
        ),
        recent_review_outcomes=(
            translation_submitter_model.recent_review_outcomes
        ),
        recent_performance=translation_submitter_model.recent_performance,
        overall_accuracy=translation_submitter_model.overall_accuracy,
        submitted_translations_count=(
            translation_submitter_model.submitted_translations_count
        ),
        submitted_translation_word_count=(
            translation_submitter_model.submitted_translation_word_count
        ),
        accepted_translations_count=(
            translation_submitter_model.accepted_translations_count
        ),
        accepted_translations_without_reviewer_edits_count=(
            translation_submitter_model
            .accepted_translations_without_reviewer_edits_count
        ),
        accepted_translation_word_count=(
            translation_submitter_model.accepted_translation_word_count
        ),
        rejected_translations_count=(
            translation_submitter_model.rejected_translations_count
        ),
        rejected_translation_word_count=(
            translation_submitter_model.rejected_translation_word_count
        ),
        first_contribution_date=(
            translation_submitter_model.first_contribution_date
        ),
        last_contribution_date=(
            translation_submitter_model.last_contribution_date
        ),
    )


def get_translation_reviewer_total_stats_from_model(
    translation_reviewer_model:
        suggestion_models.TranslationReviewerTotalContributionStatsModel
) -> suggestion_registry.TranslationReviewerTotalContributionStats:
    """Returns a domain object for TranslationReviewerTotalContributionStats
    model.

    Args:
        translation_reviewer_model:
            TranslationReviewerTotalContributionStatsModel. Model
            to get corresponding domain object.

    Returns:
        TranslationreviewerTotalContributionStats. The domain object
        corresponding to given model.
    """
    return suggestion_registry.TranslationReviewerTotalContributionStats(
        language_code=translation_reviewer_model.language_code,
        contributor_id=translation_reviewer_model.contributor_id,
        topic_ids_with_translation_reviews=(
            translation_reviewer_model.topic_ids_with_translation_reviews
        ),
        reviewed_translations_count=(
            translation_reviewer_model.reviewed_translations_count
        ),
        accepted_translations_count=(
            translation_reviewer_model.accepted_translations_count
        ),
        accepted_translations_with_reviewer_edits_count=(
            translation_reviewer_model
            .accepted_translations_with_reviewer_edits_count
        ),
        accepted_translation_word_count=(
            translation_reviewer_model.accepted_translation_word_count
        ),
        rejected_translations_count=(
            translation_reviewer_model.rejected_translations_count
        ),
        first_contribution_date=(
            translation_reviewer_model.first_contribution_date
        ),
        last_contribution_date=(
            translation_reviewer_model.last_contribution_date
        ),
    )


def get_question_submitter_total_stats_from_model(
    question_submitter_model:
        suggestion_models.QuestionSubmitterTotalContributionStatsModel
) -> suggestion_registry.QuestionSubmitterTotalContributionStats:
    """Returns a domain object for QuestionSubmitterTotalContributionStats
    model.

    Args:
        question_submitter_model:
            QuestionSubmitterTotalContributionStatsModel. Model
            to get corresponding domain object.

    Returns:
        QuestionSubmitterTotalContributionStats. The domain object
        corresponding to given model.
    """
    return suggestion_registry.QuestionSubmitterTotalContributionStats(
        contributor_id=question_submitter_model.contributor_id,
        topic_ids_with_question_submissions=(
            question_submitter_model.topic_ids_with_question_submissions
        ),
        recent_review_outcomes=(
            question_submitter_model.recent_review_outcomes
        ),
        recent_performance=question_submitter_model.recent_performance,
        overall_accuracy=question_submitter_model.overall_accuracy,
        submitted_questions_count=(
            question_submitter_model.submitted_questions_count
        ),
        accepted_questions_count=(
            question_submitter_model.accepted_questions_count
        ),
        accepted_questions_without_reviewer_edits_count=(
            question_submitter_model
            .accepted_questions_without_reviewer_edits_count
        ),
        rejected_questions_count=(
            question_submitter_model.rejected_questions_count
        ),
        first_contribution_date=(
            question_submitter_model.first_contribution_date
        ),
        last_contribution_date=(
            question_submitter_model.last_contribution_date
        ),
    )


def get_question_reviewer_total_stats_from_model(
    question_reviewer_model:
        suggestion_models.QuestionReviewerTotalContributionStatsModel
) -> suggestion_registry.QuestionReviewerTotalContributionStats:
    """Returns a domain object for QuestionReviewerTotalContributionStats
    model.

    Args:
        question_reviewer_model:
            QuestionReviewerTotalContributionStatsModel. Model
            to get corresponding domain object.

    Returns:
        QuestionreviewerTotalContributionStats. The domain object
        corresponding to given model.
    """
    return suggestion_registry.QuestionReviewerTotalContributionStats(
        contributor_id=question_reviewer_model.contributor_id,
        topic_ids_with_question_reviews=(
            question_reviewer_model.topic_ids_with_question_reviews
        ),
        reviewed_questions_count=(
            question_reviewer_model.reviewed_questions_count
        ),
        accepted_questions_count=(
            question_reviewer_model.accepted_questions_count
        ),
        accepted_questions_with_reviewer_edits_count=(
            question_reviewer_model
            .accepted_questions_with_reviewer_edits_count
        ),
        rejected_questions_count=(
            question_reviewer_model.rejected_questions_count
        ),
        first_contribution_date=(
            question_reviewer_model.first_contribution_date
        ),
        last_contribution_date=(
            question_reviewer_model.last_contribution_date
        ),
    )


def get_translation_submitter_total_stats(
    page_size: int,
    offset: int,
    language_code: str,
    sort_by: Optional[str],
    topic_ids: Optional[List[str]],
    max_days_since_last_activity: Optional[int]
) -> Tuple[
        List[suggestion_registry.TranslationSubmitterTotalContributionStats],
        int,
        bool]:
    """Returns the list of domain objects according to values specified.

    Args:
        page_size: int. Number of models to fetch.
        offset: int. Number of results to skip from the beginning of all
            results matching the query.
        language_code: str. The language code to get results for.
        sort_by: SortChoices|None. A string indicating how to sort the
            result.
        topic_ids: List[str]|None. List of topic ID(s) to fetch
            contributor stats for.
        max_days_since_last_activity: int. To get number of users
            who are active in max_days_since_last_activity.

    Returns:
        3-tuple(sorted_results, next_offset, more). where:
                sorted_results:
                    list(TranslationSubmitterTotalContributionStats).
                    The list of domain objects which match the supplied
                    language_code, topic_ids and max_days_since_last_activity
                    filters, returned in the order specified by sort_by.
                next_offset: int. Number of results to skip in next batch.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results
                    after this batch.
    """
    translation_submitter_models, next_offset, more = (
        suggestion_models.TranslationSubmitterTotalContributionStatsModel
        .fetch_page(
            page_size=page_size,
            offset=offset,
            language_code=language_code,
            sort_by=sort_by,
            topic_ids=topic_ids,
            max_days_since_last_activity=max_days_since_last_activity
        )
    )

    translation_submitter_stats = [
        get_translation_submitter_total_stats_from_model(model)
        for model in translation_submitter_models]

    return (
        translation_submitter_stats,
        next_offset,
        more
    )


def get_translation_reviewer_total_stats(
        page_size: int,
        offset: int,
        language_code: str,
        sort_by: Optional[str],
        max_days_since_last_activity: Optional[int]
) -> Tuple[
        List[suggestion_registry.TranslationReviewerTotalContributionStats],
        int,
        bool
    ]:
    """Returns the list of domain objects according to values specified.

    Args:
        page_size: int. Number of models to fetch.
        offset: int. Number of results to skip from the beginning of all
            results matching the query.
        language_code: str. The language code to get results for.
        sort_by: SortChoices|None. A string indicating how to sort the
            result.
        max_days_since_last_activity: int|None. To get number of users
            who are active in max_days_since_last_activity.

    Returns:
        3-tuple(sorted_results, next_offset, more). where:
            sorted_results:
                list(TranslationReviewerTotalContributionStats).
                The list of domain objects which match the supplied
                language_code, and max_days_since_last_activity filters,
                returned in the order specified by sort_by.
            next_offset: int. Number of results to skip in next batch.
            more: bool. If True, there are (probably) more results after
                this batch. If False, there are no further results
                after this batch.
    """
    translation_reviewer_models, next_offset, more = (
        suggestion_models.TranslationReviewerTotalContributionStatsModel
        .fetch_page(
            page_size=page_size,
            offset=offset,
            language_code=language_code,
            sort_by=sort_by,
            max_days_since_last_activity=max_days_since_last_activity
        )
    )

    translation_reviewer_stats = [
        get_translation_reviewer_total_stats_from_model(model)
        for model in translation_reviewer_models
    ]

    return (
        translation_reviewer_stats,
        next_offset,
        more
    )


def get_question_submitter_total_stats(
    page_size: int,
    offset: int,
    sort_by: Optional[str],
    topic_ids: Optional[List[str]],
    max_days_since_last_activity: Optional[int]
) -> Tuple[
        List[suggestion_registry.QuestionSubmitterTotalContributionStats],
        int,
        bool
    ]:
    """Returns the list of domain objects according to values specified.

    Args:
        page_size: int. Number of results to fetch.
        offset: int. Number of results to skip from the beginning of all
            results matching the query.
        sort_by: SortChoices|None. A string indicating how to sort the
            result.
        topic_ids: List[str]|None. List of topic ID(s) to fetch
            contributor stats for.
        max_days_since_last_activity: int. To get results of users
            who are active in max_days_since_last_activity.

    Returns:
        3-tuple(sorted_results, next_offset, more). where:
            sorted_results:
                list(QuestionSubmitterTotalContributionStats).
                The list of domain objects which match the supplied topic_ids
                and max_days_since_last_activity filters,
                returned in the order specified by sort_by.
            next_offset: int. Number of results to skip in next batch.
            more: bool. If True, there are (probably) more results after
                this batch. If False, there are no further results
                after this batch.
    """
    question_submitter_models, next_offset, more = (
        suggestion_models.QuestionSubmitterTotalContributionStatsModel
        .fetch_page(
            page_size=page_size,
            offset=offset,
            sort_by=sort_by,
            topic_ids=topic_ids,
            max_days_since_last_activity=max_days_since_last_activity
        )
    )

    question_submitter_stats = [
        get_question_submitter_total_stats_from_model(model)
        for model in question_submitter_models
    ]

    return (
        question_submitter_stats,
        next_offset,
        more
    )


def get_question_reviewer_total_stats(
        page_size: int,
        offset: int,
        sort_by: Optional[str],
        max_days_since_last_activity: Optional[int]
) -> Tuple[
        List[suggestion_registry.QuestionReviewerTotalContributionStats],
        int,
        bool
    ]:
    """Returns the list of domain objects according to values specified.

    Args:
        page_size: int. Number of results to fetch.
        offset: int. Number of results to skip from the beginning of all
            results matching the query.
        sort_by: SortChoices|None. A string indicating how to sort the
            result.
        max_days_since_last_activity: int|None. To get result of users
            who are active in max_days_since_last_activity.

    Returns:
        3-tuple(sorted_results, next_offset, more). where:
            sorted_results:
                list(QuestionReviewerTotalContributionStats).
                The list of domain objects which match the supplied
                max_days_since_last_activity filter,
                returned in the order specified by sort_by.
            next_offset: int. Number of results to skip in next batch.
            more: bool. If True, there are (probably) more results after
                this batch. If False, there are no further results
                after this batch.
    """
    question_reviewer_models, next_offset, more = (
        suggestion_models.QuestionReviewerTotalContributionStatsModel
        .fetch_page(
            page_size=page_size,
            offset=offset,
            sort_by=sort_by,
            max_days_since_last_activity=max_days_since_last_activity
        )
    )

    question_reviewer_stats = [
        get_question_reviewer_total_stats_from_model(model)
        for model in question_reviewer_models
    ]

    return (
        question_reviewer_stats,
        next_offset,
        more
    )


def get_all_translation_coordinator_stats(
    sort: str
) -> List[user_domain.TranslationCoordinatorStats]:
    """Gets all TranslationCoordinatorStats corresponding to the supplied
    user and converts them to their corresponding domain objects.

    Args:
        sort: str. The sort order for coordinator counts.

    Returns:
        list(TranslationCoordinatorStats). TranslationCoordinatorStats domain
        objects corresponding to the supplied user.
    """
    model_class = suggestion_models.TranslationCoordinatorsModel
    translation_coordinator_models: Sequence[
        suggestion_models.TranslationCoordinatorsModel] = []
    if sort == (
        suggestion_models.SortChoices.SORT_KEY_INCREASING_COORDINATOR_COUNTS
        .value):
        translation_coordinator_models = (
            model_class.query().order(
                model_class.coordinators_count).fetch()
        )
    else:
        translation_coordinator_models = (
            suggestion_models.TranslationCoordinatorsModel.query().order(
                -model_class.coordinators_count).fetch()
        )
    return [
        user_domain.TranslationCoordinatorStats(
            model.id,
            model.coordinator_ids,
            model.coordinators_count
        )
        for model in translation_coordinator_models
    ]


def get_translator_counts(language_code: str) -> int:
    """Gets the count of translators corresponding to the given language code.

    Args:
        language_code: str. The language code of which translators count in
            required.

    Returns:
        int. Number of translator counts.
    """
    model_class = (
        suggestion_models.TranslationSubmitterTotalContributionStatsModel)
    return len(
        suggestion_models.TranslationSubmitterTotalContributionStatsModel
        .query(model_class.language_code == language_code).fetch()
    )
