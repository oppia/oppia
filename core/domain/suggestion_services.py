# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Funtions to create, accept, reject, update and perform other operations on
suggestions.
"""

from __future__ import annotations

import datetime
import heapq
import logging
import re

from core import feconf
from core.constants import constants
from core.domain import contribution_stats_services
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import feedback_services
from core.domain import html_cleaner
from core.domain import html_validation_service
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import taskqueue_services
from core.domain import translation_domain
from core.domain import user_domain
from core.domain import user_services
from core.platform import models

from typing import (
    Callable, Dict, Final, List, Literal, Mapping, Match,
    Optional, Sequence, Set, Tuple, Union, cast, overload)

MYPY = False
if MYPY:  # pragma: no cover
    # Here, change domain is imported only for type checking.
    from core.domain import change_domain
    from mypy_imports import feedback_models
    from mypy_imports import suggestion_models
    from mypy_imports import transaction_services
    from mypy_imports import user_models

    AllowedSuggestionClasses = Union[
        suggestion_registry.SuggestionEditStateContent,
        suggestion_registry.SuggestionTranslateContent,
        suggestion_registry.SuggestionAddQuestion
    ]

(feedback_models, suggestion_models, user_models) = (
    models.Registry.import_models([
        models.Names.FEEDBACK, models.Names.SUGGESTION, models.Names.USER
    ])
)

transaction_services = models.Registry.import_transaction_services()

DEFAULT_SUGGESTION_THREAD_SUBJECT: Final = 'Suggestion from a user'
DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE: Final = ''

# The maximum number of suggestions to recommend to a reviewer to review in an
# email.
MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER: Final = 5

SUGGESTION_TRANSLATE_CONTENT_HTML: Callable[
    [suggestion_registry.SuggestionTranslateContent], str
] = lambda suggestion: suggestion.change_cmd.translation_html

SUGGESTION_ADD_QUESTION_HTML: Callable[
    [suggestion_registry.SuggestionAddQuestion], str
] = lambda suggestion: suggestion.change_cmd.question_dict[
    'question_state_data']['content']['html']

# A dictionary that maps the suggestion type to a lambda function, which is
# used to retrieve the html content that corresponds to the suggestion's
# emphasized text on the Contributor Dashboard. From a UI perspective, the
# emphasized content makes it easier for users to identify the different
# suggestion opportunities. For instance, for translation suggestions the
# emphasized text is the translation. Similarly, for question suggestions the
# emphasized text is the question being asked.
SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS: Dict[str, Callable[..., str]] = {
    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: SUGGESTION_TRANSLATE_CONTENT_HTML,
    feconf.SUGGESTION_TYPE_ADD_QUESTION: SUGGESTION_ADD_QUESTION_HTML
}

RECENT_REVIEW_OUTCOMES_LIMIT: Final = 100


@overload
def create_suggestion(
    suggestion_type: Literal['add_question'],
    target_type: str,
    target_id: str,
    target_version_at_submission: int,
    author_id: str,
    change_cmd: Mapping[str, change_domain.AcceptableChangeDictTypes],
    description: Optional[str]
) -> suggestion_registry.SuggestionAddQuestion: ...


@overload
def create_suggestion(
    suggestion_type: Literal['translate_content'],
    target_type: str,
    target_id: str,
    target_version_at_submission: int,
    author_id: str,
    change_cmd: Mapping[str, change_domain.AcceptableChangeDictTypes],
    description: Optional[str]
) -> suggestion_registry.SuggestionTranslateContent: ...


@overload
def create_suggestion(
    suggestion_type: Literal['edit_exploration_state_content'],
    target_type: str,
    target_id: str,
    target_version_at_submission: int,
    author_id: str,
    change_cmd: Mapping[str, change_domain.AcceptableChangeDictTypes],
    description: Optional[str]
) -> suggestion_registry.SuggestionEditStateContent: ...


@overload
def create_suggestion(
    suggestion_type: str,
    target_type: str,
    target_id: str,
    target_version_at_submission: int,
    author_id: str,
    change_cmd: Mapping[str, change_domain.AcceptableChangeDictTypes],
    description: Optional[str]
) -> suggestion_registry.BaseSuggestion: ...


def create_suggestion(
    suggestion_type: str,
    target_type: str,
    target_id: str,
    target_version_at_submission: int,
    author_id: str,
    change_cmd: Mapping[str, change_domain.AcceptableChangeDictTypes],
    description: Optional[str]
) -> suggestion_registry.BaseSuggestion:
    """Creates a new SuggestionModel and the corresponding FeedbackThread.

    Args:
        suggestion_type: str. The type of the suggestion. This parameter should
            be one of the constants defined in storage/suggestion/gae_models.py.
        target_type: str. The target entity being edited. This parameter should
            be one of the constants defined in storage/suggestion/gae_models.py.
        target_id: str. The ID of the target entity being suggested to.
        target_version_at_submission: int. The version number of the target
            entity at the time of creation of the suggestion.
        author_id: str. The ID of the user who submitted the suggestion.
        change_cmd: dict. The details of the suggestion.
        description: str|None. The description of the changes provided by the
            author or None, if no description is provided.

    Returns:
        Suggestion. The newly created suggestion domain object.

    Raises:
        Exception. Invalid suggestion type.
    """
    if description is None:
        description = DEFAULT_SUGGESTION_THREAD_SUBJECT
    thread_id = feedback_services.create_thread(
        target_type, target_id, author_id, description,
        DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE, has_suggestion=True)

    status = suggestion_models.STATUS_IN_REVIEW

    if target_type == feconf.ENTITY_TYPE_EXPLORATION:
        exploration = exp_fetchers.get_exploration_by_id(target_id)
    if suggestion_type == feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT:
        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER + exploration.category)
        # Suggestions of this type do not have an associated language code,
        # since they are not queryable by language.
        language_code = None
        suggestion: AllowedSuggestionClasses = (
            suggestion_registry.SuggestionEditStateContent(
                thread_id, target_id, target_version_at_submission, status,
                author_id, None, change_cmd, score_category, language_code,
                False
            )
        )
    elif suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT:
        score_category = (
            suggestion_models.SCORE_TYPE_TRANSLATION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + exploration.category)
        # The language code of the translation, used for querying purposes.
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(change_cmd['language_code'], str)
        language_code = change_cmd['language_code']
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(change_cmd['state_name'], str)
        assert isinstance(change_cmd['content_id'], str)
        content_html = exploration.get_content_html(
            change_cmd['state_name'], change_cmd['content_id'])
        if content_html != change_cmd['content_html']:
            raise Exception(
                'The Exploration content has changed since this translation '
                'was submitted.')
        suggestion = suggestion_registry.SuggestionTranslateContent(
            thread_id, target_id, target_version_at_submission, status,
            author_id, None, change_cmd, score_category, language_code, False
        )
    elif suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION:
        score_category = (
            suggestion_models.SCORE_TYPE_QUESTION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + target_id)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(change_cmd['question_dict'], dict)
        # Here we use cast because we are narrowing down the type from
        # various Dict types that are present in AcceptableChangeDictTypes
        # to QuestionDict type.
        question_dict = cast(
            question_domain.QuestionDict,
            change_cmd['question_dict']
        )
        question_dict['language_code'] = (
            constants.DEFAULT_LANGUAGE_CODE)
        question_dict['question_state_data_schema_version'] = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        # The language code of the question, used for querying purposes.
        add_question_language_code = constants.DEFAULT_LANGUAGE_CODE
        suggestion = suggestion_registry.SuggestionAddQuestion(
            thread_id, target_id, target_version_at_submission, status,
            author_id, None, change_cmd, score_category,
            add_question_language_code, False
        )
    else:
        raise Exception('Invalid suggestion type %s' % suggestion_type)
    suggestion.validate()

    suggestion_models.GeneralSuggestionModel.create(
        suggestion_type, target_type, target_id,
        target_version_at_submission, status, author_id,
        None, change_cmd, score_category, thread_id, suggestion.language_code)

    # Update the community contribution stats so that the number of suggestions
    # of this type that are in review increases by one.
    _update_suggestion_counts_in_community_contribution_stats([suggestion], 1)

    return get_suggestion_by_id(thread_id)


def get_suggestion_from_model(
    suggestion_model: suggestion_models.GeneralSuggestionModel
) -> suggestion_registry.BaseSuggestion:
    """Converts the given SuggestionModel to a Suggestion domain object

    Args:
        suggestion_model: SuggestionModel. SuggestionModel object to be
            converted to Suggestion domain object.

    Returns:
        Suggestion. The corresponding Suggestion domain object.
    """
    suggestion_domain_class = (
        suggestion_registry.SUGGESTION_TYPES_TO_DOMAIN_CLASSES[
            suggestion_model.suggestion_type])
    return suggestion_domain_class(
        suggestion_model.id, suggestion_model.target_id,
        suggestion_model.target_version_at_submission,
        suggestion_model.status, suggestion_model.author_id,
        suggestion_model.final_reviewer_id, suggestion_model.change_cmd,
        suggestion_model.score_category, suggestion_model.language_code,
        suggestion_model.edited_by_reviewer, suggestion_model.last_updated,
        suggestion_model.created_on)


@overload
def get_suggestion_by_id(
    suggestion_id: str
) -> suggestion_registry.BaseSuggestion: ...


@overload
def get_suggestion_by_id(
    suggestion_id: str, *, strict: Literal[True]
) -> suggestion_registry.BaseSuggestion: ...


@overload
def get_suggestion_by_id(
    suggestion_id: str, *, strict: Literal[False]
) -> Optional[suggestion_registry.BaseSuggestion]: ...


def get_suggestion_by_id(
    suggestion_id: str, strict: bool = True
) -> Optional[suggestion_registry.BaseSuggestion]:
    """Finds a suggestion by the suggestion ID.

    Args:
        suggestion_id: str. The ID of the suggestion.
        strict: bool. Whether to fail noisily if no suggestion with a given id
            exists.

    Returns:
        Suggestion|None. The corresponding suggestion, or None if no suggestion
        is found.

    Raises:
        Exception. The suggestion model does not exists for the given id.
    """
    model = suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id)

    if strict and model is None:
        raise Exception(
            'No suggestion model exists for the corresponding suggestion id: %s'
            % suggestion_id
        )

    return get_suggestion_from_model(model) if model else None


@overload
def get_translation_contribution_stats_models(
    stats_ids: List[str], *, strict: Literal[True]
) -> List[suggestion_models.TranslationContributionStatsModel]: ...


@overload
def get_translation_contribution_stats_models(
    stats_ids: List[str]
) -> List[suggestion_models.TranslationContributionStatsModel]: ...


@overload
def get_translation_contribution_stats_models(
    stats_ids: List[str], *, strict: Literal[False]
) -> List[Optional[suggestion_models.TranslationContributionStatsModel]]: ...


def get_translation_contribution_stats_models(
    stats_ids: List[str], strict: bool = True
) -> Sequence[Optional[suggestion_models.TranslationContributionStatsModel]]:
    """Finds translation contribution stats by the IDs.

    Args:
        stats_ids: list(str). The IDs of the stats.
        strict: bool. Whether to fail noisily if no stat with given ids exists.

    Returns:
        list(TranslationContributionStatsModel|None). The corresponding
        translation contribution stats for the given IDs.

    Raises:
        Exception. The stats models do not exist for the given IDs.
    """
    stats_models = (
        suggestion_models.TranslationContributionStatsModel.get_multi(
            list(stats_ids)))

    if not strict:
        return stats_models

    for index, model in enumerate(stats_models):
        if model is None:
            raise Exception(
                'The stats models do not exist for the stats_id %s.' % (
                    stats_ids[index])
            )

    return stats_models


@overload
def get_translation_review_stats_models(
    stats_ids: List[str], *, strict: Literal[True]
) -> List[suggestion_models.TranslationReviewStatsModel]: ...


@overload
def get_translation_review_stats_models(
    stats_ids: List[str]
) -> List[suggestion_models.TranslationReviewStatsModel]: ...


@overload
def get_translation_review_stats_models(
    stats_ids: List[str], *, strict: Literal[False]
) -> List[Optional[suggestion_models.TranslationReviewStatsModel]]: ...


def get_translation_review_stats_models(
    stats_ids: List[str], strict: bool = True
) -> Sequence[Optional[suggestion_models.TranslationReviewStatsModel]]:
    """Finds translation review stats by the IDs.

    Args:
        stats_ids: list(str). The IDs of the stats.
        strict: bool. Whether to fail noisily if no stat with given ids exists.

    Returns:
        list(TranslationReviewStatsModel|None). The corresponding translation
        review stats for the given IDs.

    Raises:
        Exception. The stats models do not exist for the given IDs.
    """
    stats_models = (
        suggestion_models.TranslationReviewStatsModel.get_multi(
            list(stats_ids)))

    if not strict:
        return stats_models

    for index, model in enumerate(stats_models):
        if model is None:
            raise Exception(
                'The stats models do not exist for the stats_id %s.' % (
                    stats_ids[index])
            )

    return stats_models


@overload
def get_question_contribution_stats_models(
    stats_ids: List[str], *, strict: Literal[True]
) -> List[suggestion_models.QuestionContributionStatsModel]: ...


@overload
def get_question_contribution_stats_models(
    stats_ids: List[str]
) -> List[suggestion_models.QuestionContributionStatsModel]: ...


@overload
def get_question_contribution_stats_models(
    stats_ids: List[str], *, strict: Literal[False]
) -> List[Optional[suggestion_models.QuestionContributionStatsModel]]: ...


def get_question_contribution_stats_models(
    stats_ids: List[str], strict: bool = True
) -> Sequence[Optional[suggestion_models.QuestionContributionStatsModel]]:
    """Finds question contribution stats by the IDs.

    Args:
        stats_ids: list(str). The IDs of the stats.
        strict: bool. Whether to fail noisily if no stat with given ids exists.

    Returns:
        list(QuestionContributionStatsModel|None). The corresponding question
        contribution stats for the given IDs.

    Raises:
        Exception. The stats models do not exist for the given IDs.
    """
    stats_models = (
        suggestion_models.QuestionContributionStatsModel.get_multi(
            list(stats_ids)))

    if not strict:
        return stats_models

    for index, model in enumerate(stats_models):
        if model is None:
            raise Exception(
                'The stats models do not exist for the stats_id %s.' % (
                    stats_ids[index])
            )

    return stats_models


@overload
def get_question_review_stats_models(
    stats_ids: List[str], *, strict: Literal[True]
) -> List[suggestion_models.QuestionReviewStatsModel]: ...


@overload
def get_question_review_stats_models(
    stats_ids: List[str]
) -> List[suggestion_models.QuestionReviewStatsModel]: ...


@overload
def get_question_review_stats_models(
    stats_ids: List[str], *, strict: Literal[False]
) -> List[Optional[suggestion_models.QuestionReviewStatsModel]]: ...


def get_question_review_stats_models(
    stats_ids: List[str], strict: bool = True
) -> Sequence[Optional[suggestion_models.QuestionReviewStatsModel]]:
    """Finds question review stats by the IDs.

    Args:
        stats_ids: list(str). The IDs of the stats.
        strict: bool. Whether to fail noisily if no stat with given ids exists.

    Returns:
        list(QuestionReviewStatsModel|None). The corresponding question review
        stats for the given IDs.

    Raises:
        Exception. The stats models do not exist for the given IDs.
    """
    stats_models = (
        suggestion_models.QuestionReviewStatsModel.get_multi(
            list(stats_ids)))

    if not strict:
        return stats_models

    for index, model in enumerate(stats_models):
        if model is None:
            raise Exception(
                'The stats models do not exist for the stats_id %s.' % (
                    stats_ids[index])
            )

    return stats_models


def get_suggestions_by_ids(
    suggestion_ids: List[str]
) -> List[Optional[suggestion_registry.BaseSuggestion]]:
    """Finds suggestions using the given suggestion IDs.

    Args:
        suggestion_ids: list(str). The IDs of the suggestions.

    Returns:
        list(Suggestion|None). A list of the corresponding suggestions. The
        list will contain None elements if no suggestion is found with the
        corresponding suggestion id.
    """
    general_suggestion_models = (
        suggestion_models.GeneralSuggestionModel.get_multi(suggestion_ids)
    )

    return [
        get_suggestion_from_model(suggestion_model) if suggestion_model
        else None for suggestion_model in general_suggestion_models
    ]


def query_suggestions(
    query_fields_and_values: List[Tuple[str, str]]
) -> List[suggestion_registry.BaseSuggestion]:
    """Queries for suggestions.

    Args:
        query_fields_and_values: list(tuple(str, str)). A list of queries. The
            first element in each tuple is the field to be queried, and the
            second element is its value.

    Returns:
        list(Suggestion). A list of suggestions that match the given query
        values, up to a maximum of feconf.DEFAULT_QUERY_LIMIT suggestions.
    """
    return [
        get_suggestion_from_model(s) for s in
        suggestion_models.GeneralSuggestionModel.query_suggestions(
            query_fields_and_values)
    ]


def get_translation_suggestion_ids_with_exp_ids(
    exp_ids: List[str]
) -> List[str]:
    """Gets the ids of the translation suggestions corresponding to
    explorations with the given exploration ids.

    Args:
        exp_ids: list(str). List of exploration ids to query for.

    Returns:
        list(str). A list of the ids of translation suggestions that
        correspond to the given exploration ids. Note: it is not
        guaranteed that the suggestion ids returned are ordered by the
        exploration ids in exp_ids.
    """
    if len(exp_ids) == 0:
        return []

    return (
        suggestion_models.GeneralSuggestionModel
        .get_translation_suggestion_ids_with_exp_ids(exp_ids)
    )


def get_all_stale_suggestion_ids() -> List[str]:
    """Gets a list of the suggestion ids corresponding to suggestions that have
    not had any activity on them for THRESHOLD_TIME_BEFORE_ACCEPT time.

    Returns:
        list(str). A list of suggestion ids that correspond to stale
        suggestions.
    """

    return (
        suggestion_models.GeneralSuggestionModel.get_all_stale_suggestion_ids()
    )


def _update_suggestion(
    suggestion: suggestion_registry.BaseSuggestion,
    validate_suggestion: bool = True
) -> None:
    """Updates the given suggestion.

    Args:
        suggestion: Suggestion. The suggestion to be updated.
        validate_suggestion: bool. Whether to validate the suggestion before
            saving it.
    """
    _update_suggestions([suggestion], validate_suggestion=validate_suggestion)


def _update_suggestions(
    suggestions: List[suggestion_registry.BaseSuggestion],
    update_last_updated_time: bool = True,
    validate_suggestion: bool = True
) -> None:
    """Updates the given suggestions.

    Args:
        suggestions: list(Suggestion). The suggestions to be updated.
        update_last_updated_time: bool. Whether to update the last_updated
            field of the suggestions.
        validate_suggestion: bool. Whether to validate the suggestions before
            saving them.
    """
    suggestion_ids = []

    if validate_suggestion:
        for suggestion in suggestions:
            suggestion.validate()
            suggestion_ids.append(suggestion.suggestion_id)
    else:
        suggestion_ids = [
            suggestion.suggestion_id for suggestion in suggestions
        ]

    suggestion_models_to_update_with_none = (
        suggestion_models.GeneralSuggestionModel.get_multi(suggestion_ids)
    )
    suggestion_models_to_update = []

    for index, suggestion_model in enumerate(
        suggestion_models_to_update_with_none
    ):
        # Ruling out the possibility of None for mypy type checking.
        assert suggestion_model is not None
        suggestion = suggestions[index]
        suggestion_models_to_update.append(suggestion_model)
        suggestion_model.status = suggestion.status
        suggestion_model.final_reviewer_id = suggestion.final_reviewer_id
        suggestion_model.change_cmd = suggestion.change_cmd.to_dict()
        suggestion_model.score_category = suggestion.score_category
        suggestion_model.language_code = suggestion.language_code
        suggestion_model.edited_by_reviewer = suggestion.edited_by_reviewer

    suggestion_models.GeneralSuggestionModel.update_timestamps_multi(
        suggestion_models_to_update,
        update_last_updated_time=update_last_updated_time)
    suggestion_models.GeneralSuggestionModel.put_multi(
        suggestion_models_to_update)


def get_commit_message_for_suggestion(
    author_username: str, commit_message: str
) -> str:
    """Returns a modified commit message for an accepted suggestion.

    Args:
        author_username: str. Username of the suggestion author.
        commit_message: str. The original commit message submitted by the
            suggestion author.

    Returns:
        str. The modified commit message to be used in the exploration commit
        logs.
    """
    return '%s %s: %s' % (
        feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX,
        author_username, commit_message)


def accept_suggestion(
    suggestion_id: str,
    reviewer_id: str,
    commit_message: str,
    review_message: str
) -> None:
    """Accepts the suggestion with the given suggestion_id after validating it.

    Args:
        suggestion_id: str. The id of the suggestion to be accepted.
        reviewer_id: str. The ID of the reviewer accepting the suggestion.
        commit_message: str. The commit message.
        review_message: str. The message provided by the reviewer while
            accepting the suggestion.

    Raises:
        Exception. The suggestion is already handled.
        Exception. The suggestion is not valid.
        Exception. The commit message is empty.
    """
    if not commit_message or not commit_message.strip():
        raise Exception('Commit message cannot be empty.')

    suggestion = get_suggestion_by_id(suggestion_id, strict=False)

    if suggestion is None:
        raise Exception(
            'You cannot accept the suggestion with id %s because it does '
            'not exist.' % (suggestion_id)
        )
    if suggestion.is_handled:
        raise Exception(
            'The suggestion with id %s has already been accepted/'
            'rejected.' % (suggestion_id)
        )
    suggestion.pre_accept_validate()
    html_string = ''.join(suggestion.get_all_html_content_strings())
    error_list = (
        html_validation_service.
        validate_math_tags_in_html_with_attribute_math_content(
            html_string))
    if len(error_list) > 0:
        raise Exception(
            'Invalid math tags found in the suggestion with id %s.' % (
                suggestion.suggestion_id)
        )

    if suggestion.edited_by_reviewer:
        commit_message = '%s (with edits)' % commit_message

    suggestion.set_suggestion_status_to_accepted()
    suggestion.set_final_reviewer_id(reviewer_id)

    author_name = user_services.get_username(suggestion.author_id)
    commit_message = get_commit_message_for_suggestion(
        author_name, commit_message)
    suggestion.accept(commit_message)

    _update_suggestion(suggestion)

    # Update the community contribution stats so that the number of suggestions
    # of this type that are in review decreases by one, since this
    # suggestion is no longer in review.
    _update_suggestion_counts_in_community_contribution_stats([suggestion], -1)

    feedback_services.create_message(
        suggestion_id, reviewer_id, feedback_models.STATUS_CHOICES_FIXED,
        None, review_message, should_send_email=False)

    # When recording of scores is enabled, the author of the suggestion gets an
    # increase in their score for the suggestion category.
    if feconf.ENABLE_RECORDING_OF_SCORES:
        user_id = suggestion.author_id
        score_category = suggestion.score_category

        # Get user proficiency domain object.
        user_proficiency = _get_user_proficiency(user_id, score_category)

        # Increment the score of the author due to their suggestion being
        # accepted.
        user_proficiency.increment_score(
            suggestion_models.INCREMENT_SCORE_OF_AUTHOR_BY
        )

        # Emails are sent to onboard new reviewers. These new reviewers are
        # created when the score of the user passes the minimum score required
        # to review.
        if feconf.SEND_SUGGESTION_REVIEW_RELATED_EMAILS:
            if user_proficiency.can_user_review_category() and (
                    not user_proficiency.onboarding_email_sent):
                email_manager.send_mail_to_onboard_new_reviewers(
                    user_id, score_category
                )
                user_proficiency.mark_onboarding_email_as_sent()

        # Need to update the corresponding user proficiency model after we
        # updated the domain object.
        _update_user_proficiency(user_proficiency)


def reject_suggestion(
    suggestion_id: str, reviewer_id: str, review_message: str
) -> None:
    """Rejects the suggestion with the given suggestion_id.

    Args:
        suggestion_id: str. The id of the suggestion to be rejected.
        reviewer_id: str. The ID of the reviewer rejecting the suggestion.
        review_message: str. The message provided by the reviewer while
            rejecting the suggestion.

    Raises:
        Exception. The suggestion is already handled.
    """

    reject_suggestions([suggestion_id], reviewer_id, review_message)


def reject_suggestions(
    suggestion_ids: List[str], reviewer_id: str, review_message: str
) -> None:
    """Rejects the suggestions with the given suggestion_ids.

    Args:
        suggestion_ids: list(str). The ids of the suggestions to be rejected.
        reviewer_id: str. The ID of the reviewer rejecting the suggestions.
        review_message: str. The message provided by the reviewer while
            rejecting the suggestions.

    Raises:
        Exception. One or more of the suggestions has already been handled.
    """
    suggestions_with_none = get_suggestions_by_ids(suggestion_ids)
    suggestions = []

    for index, suggestion in enumerate(suggestions_with_none):
        if suggestion is None:
            raise Exception(
                'You cannot reject the suggestion with id %s because it does '
                'not exist.' % (suggestion_ids[index])
            )
        suggestions.append(suggestion)
        if suggestion.is_handled:
            raise Exception(
                'The suggestion with id %s has already been accepted/'
                'rejected.' % (suggestion.suggestion_id)
            )
    if not review_message:
        raise Exception('Review message cannot be empty.')

    for suggestion in suggestions:
        suggestion.set_suggestion_status_to_rejected()
        suggestion.set_final_reviewer_id(reviewer_id)

    _update_suggestions(suggestions, validate_suggestion=False)

    # Update the community contribution stats so that the number of suggestions
    # that are in review decreases, since these suggestions are no longer in
    # review.
    _update_suggestion_counts_in_community_contribution_stats(suggestions, -1)

    feedback_services.create_messages(
        suggestion_ids, reviewer_id, feedback_models.STATUS_CHOICES_IGNORED,
        None, review_message, should_send_email=False
    )


def auto_reject_question_suggestions_for_skill_id(skill_id: str) -> None:
    """Rejects all SuggestionAddQuestions with target ID matching the supplied
    skill ID. Reviewer ID is set to SUGGESTION_BOT_USER_ID.

    Args:
        skill_id: str. The skill ID corresponding to the target ID of the
            SuggestionAddQuestion.
    """
    suggestions = query_suggestions(
        [
            (
                'suggestion_type',
                feconf.SUGGESTION_TYPE_ADD_QUESTION),
            ('target_id', skill_id)
        ]
    )

    suggestion_ids: List[str] = []
    for suggestion in suggestions:
        # Narrowing down the type from BaseSuggestion to SuggestionAddQuestion.
        assert isinstance(
            suggestion, suggestion_registry.SuggestionAddQuestion
        )
        suggestion_ids.append(suggestion.suggestion_id)
    reject_suggestions(
        suggestion_ids, feconf.SUGGESTION_BOT_USER_ID,
        suggestion_models.DELETED_SKILL_REJECT_MESSAGE)


def auto_reject_translation_suggestions_for_exp_ids(exp_ids: List[str]) -> None:
    """Rejects all translation suggestions with target IDs matching the
    supplied exploration IDs. These suggestions are being rejected because
    their corresponding exploration was removed from a story or the story was
    deleted. Reviewer ID is set to SUGGESTION_BOT_USER_ID.

    Args:
        exp_ids: list(str). The exploration IDs corresponding to the target IDs
            of the translation suggestions.
    """
    suggestion_ids = get_translation_suggestion_ids_with_exp_ids(exp_ids)

    reject_suggestions(
        suggestion_ids, feconf.SUGGESTION_BOT_USER_ID,
        suggestion_models.INVALID_STORY_REJECT_TRANSLATION_SUGGESTIONS_MSG)


def auto_reject_translation_suggestions_for_content_ids(
    exp_id: str,
    content_ids: Set[str]
) -> None:
    """Rejects all translation suggestions with target ID matching the supplied
    exploration ID and change_cmd content ID matching one of the supplied
    content IDs. These suggestions are being rejected because their
    corresponding exploration content was deleted. Reviewer ID is set to
    SUGGESTION_BOT_USER_ID.

    Args:
        exp_id: str. The exploration ID.
        content_ids: list(str). The list of exploration content IDs.
    """
    obsolete_suggestion_ids = [
        suggestion.suggestion_id
        for suggestion in get_translation_suggestions_in_review(exp_id)
        if suggestion.change_cmd.content_id in content_ids]
    reject_suggestions(
        obsolete_suggestion_ids, feconf.SUGGESTION_BOT_USER_ID,
        constants.OBSOLETE_TRANSLATION_SUGGESTION_REVIEW_MSG)


def resubmit_rejected_suggestion(
    suggestion_id: str,
    summary_message: str,
    author_id: str,
    change_cmd: change_domain.BaseChange
) -> None:
    """Resubmit a rejected suggestion with the given suggestion_id.

    Args:
        suggestion_id: str. The id of the rejected suggestion.
        summary_message: str. The message provided by the author to
            summarize new suggestion.
        author_id: str. The ID of the author creating the suggestion.
        change_cmd: BaseChange. The new change to apply to the suggestion.

    Raises:
        Exception. The summary message is empty.
        Exception. The suggestion has not been handled yet.
        Exception. The suggestion has already been accepted.
    """
    suggestion = get_suggestion_by_id(suggestion_id)
    if not summary_message:
        raise Exception('Summary message cannot be empty.')
    if not suggestion.is_handled:
        raise Exception(
            'The suggestion with id %s is not yet handled.' % (suggestion_id)
        )
    if suggestion.status == suggestion_models.STATUS_ACCEPTED:
        raise Exception(
            'The suggestion with id %s was accepted. '
            'Only rejected suggestions can be resubmitted.' % (suggestion_id)
        )

    suggestion.pre_update_validate(change_cmd)
    suggestion.change_cmd = change_cmd
    suggestion.set_suggestion_status_to_in_review()
    _update_suggestion(suggestion)

    # Update the community contribution stats so that the number of suggestions
    # of this type that are in review increases by one, since this suggestion is
    # now back in review.
    _update_suggestion_counts_in_community_contribution_stats([suggestion], 1)

    feedback_services.create_message(
        suggestion_id, author_id, feedback_models.STATUS_CHOICES_OPEN,
        None, summary_message)


def get_all_suggestions_that_can_be_reviewed_by_user(
    user_id: str
) -> List[suggestion_registry.BaseSuggestion]:
    """Returns a list of suggestions which need to be reviewed, in categories
    where the user has crossed the minimum score to review.

    Args:
        user_id: str. The ID of the user.

    Returns:
        list(Suggestion). A list of suggestions which the given user is allowed
        to review.
    """
    score_categories = (
        user_models.UserContributionProficiencyModel
        .get_all_categories_where_user_can_review(user_id))

    if len(score_categories) == 0:
        return []

    return ([
        get_suggestion_from_model(s)
        for s in suggestion_models.GeneralSuggestionModel
        .get_in_review_suggestions_in_score_categories(
            score_categories, user_id)
    ])


def get_reviewable_translation_suggestions_by_offset(
    user_id: str,
    opportunity_summary_exp_ids: Optional[List[str]],
    limit: Optional[int],
    offset: int,
    sort_key: Optional[str],
    language: Optional[str] = None
) -> Tuple[List[suggestion_registry.SuggestionTranslateContent], int]:
    """Returns a list of translation suggestions matching the
     passed opportunity IDs which the user can review.

    Args:
        user_id: str. The ID of the user.
        opportunity_summary_exp_ids: list(str) or None.
            The list of exploration IDs for which suggestions
            are fetched. If the list is empty, no suggestions are
            fetched. If the value is None, all reviewable
            suggestions are fetched. If the list consists of some
            valid number of ids, suggestions corresponding to the
            IDs are fetched.
        limit: int|None. The maximum number of results to return. If None,
            all available results are returned.
        sort_key: str|None. The key to sort the suggestions by.
        offset: int. The number of results to skip from the beginning of all
            results matching the query.
        language: str. ISO 639-1 language code for which to filter. If it is
            None, all available languages will be returned.

    Returns:
        Tuple of (results, next_offset). Where:
            results: list(Suggestion). A list of translation suggestions
            which the supplied user is permitted to review.
            next_offset: int. The input offset + the number of results returned
                by the current query.
    """
    contribution_rights = user_services.get_user_contribution_rights(
        user_id)
    language_codes = (
        contribution_rights.can_review_translation_for_language_codes)

    # No language means all languages.
    if language is not None:
        language_codes = [language] if language in language_codes else []

    # The user cannot review any translations, so return early.
    if len(language_codes) == 0:
        return [], offset

    in_review_translation_suggestions: Sequence[
        suggestion_models.GeneralSuggestionModel
    ] = []
    next_offset = offset
    if opportunity_summary_exp_ids is None:
        in_review_translation_suggestions, next_offset = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_translation_suggestions_by_offset(
                limit,
                offset,
                user_id,
                sort_key,
                language_codes))
    elif len(opportunity_summary_exp_ids) > 0:
        in_review_translation_suggestions, next_offset = (
            suggestion_models.GeneralSuggestionModel
            .get_in_review_translation_suggestions_with_exp_ids_by_offset(
                limit,
                offset,
                user_id,
                sort_key,
                language_codes,
                opportunity_summary_exp_ids))

    translation_suggestions = []
    for suggestion_model in in_review_translation_suggestions:
        suggestion = get_suggestion_from_model(suggestion_model)
        # Here, we are narrowing down the type from BaseSuggestion to
        # SuggestionTranslateContent.
        assert isinstance(
            suggestion, suggestion_registry.SuggestionTranslateContent
        )
        translation_suggestions.append(suggestion)

    return translation_suggestions, next_offset


def get_reviewable_translation_suggestions_for_single_exp(
    user_id: str,
    opportunity_summary_exp_id: str,
    language_code: str
) -> Tuple[List[suggestion_registry.SuggestionTranslateContent], int]:
    """Returns a list of translation suggestions matching the
     passed opportunity ID which the user can review.

    Args:
        user_id: str. The ID of the user.
        opportunity_summary_exp_id: str.
            The exploration ID for which suggestions
            are fetched. If exp id is empty, no suggestions are
            fetched.
        language_code: str. The language code to get results for.

    Returns:
        Tuple of (results, next_offset). where:
            results: list(Suggestion). A list of translation suggestions
            which the supplied user is permitted to review.
            next_offset: int. The input offset + the number of results returned
                by the current query.
    """
    contribution_rights = user_services.get_user_contribution_rights(
        user_id)
    language_codes = (
        contribution_rights.can_review_translation_for_language_codes)

    # The user doesn't have rights to review in any languages, or the user
    # doesn't have right to review in the chosen language so return early.
    if language_codes is None or (
        language_code not in language_codes):
        return [], 0

    in_review_translation_suggestions, next_offset = (
        suggestion_models.GeneralSuggestionModel
        .get_reviewable_translation_suggestions(
            user_id,
            language_code,
            opportunity_summary_exp_id))

    translation_suggestions = []
    for suggestion_model in in_review_translation_suggestions:
        suggestion = get_suggestion_from_model(suggestion_model)
        # Here, we are narrowing down the type from BaseSuggestion to
        # SuggestionTranslateContent.
        assert isinstance(
            suggestion, suggestion_registry.SuggestionTranslateContent
        )
        translation_suggestions.append(suggestion)

    return translation_suggestions, next_offset


def get_reviewable_question_suggestions_by_offset(
    user_id: str,
    limit: int,
    offset: int,
    sort_key: Optional[str],
    skill_ids: Optional[List[str]],
) -> Tuple[List[suggestion_registry.SuggestionAddQuestion], int]:
    """Returns a list of question suggestions which the user
       can review.

    Args:
        user_id: str. The ID of the user.
        limit: int. The maximum number of results to return.
        offset: int. The number of results to skip from the beginning of all
            results matching the query.
        sort_key: str|None. The key to sort the suggestions by.
        skill_ids: List[str]|None. The skills for which to return question
            suggestions. None for returning all suggestions.

    Returns:
        Tuple of (results, next_offset). Where:
            results: list(Suggestion). A list of question suggestions which
            the given user is allowed to review.
            next_offset: int. The input offset + the number of results returned
                by the current query.
    """
    suggestions, next_offset = (
        suggestion_models.GeneralSuggestionModel
        .get_in_review_question_suggestions_by_offset(
            limit, offset, user_id, sort_key, skill_ids))

    question_suggestions = []
    for suggestion_model in suggestions:
        suggestion = get_suggestion_from_model(suggestion_model)
        # Here, we are narrowing down the type from BaseSuggestion to
        # SuggestionAddQuestion.
        assert isinstance(suggestion, suggestion_registry.SuggestionAddQuestion)
        question_suggestions.append(suggestion)

    return question_suggestions, next_offset


def get_question_suggestions_waiting_longest_for_review() -> List[
    suggestion_registry.SuggestionAddQuestion
]:
    """Returns MAX_QUESTION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS number
    of question suggestions, sorted in descending order by review wait time.

    Returns:
        list(Suggestion). A list of question suggestions, sorted in descending
        order based on how long the suggestions have been waiting for review.
    """
    question_suggestion_models = (
        suggestion_models.GeneralSuggestionModel
            .get_question_suggestions_waiting_longest_for_review()
    )

    question_suggestion = []
    for suggestion_model in question_suggestion_models:
        suggestion = get_suggestion_from_model(suggestion_model)
        # Here, we are narrowing down the type from BaseSuggestion to
        # SuggestionAddQuestion.
        assert isinstance(suggestion, suggestion_registry.SuggestionAddQuestion)
        question_suggestion.append(suggestion)
    return question_suggestion


def get_translation_suggestions_waiting_longest_for_review(
    language_code: str
) -> List[suggestion_registry.SuggestionTranslateContent]:
    """Returns MAX_TRANSLATION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS
    number of translation suggestions in the specified language code,
    sorted in descending order by review wait time.

    Args:
        language_code: str. The ISO 639-1 language code of the translation
            suggestions.

    Returns:
        list(Suggestion). A list of translation suggestions, sorted in
        descending order based on how long the suggestions have been waiting
        for review.
    """
    translation_suggestion_models = (
        suggestion_models.GeneralSuggestionModel
            .get_translation_suggestions_waiting_longest_for_review(
                language_code)
    )

    translation_suggestions = []
    for suggestion_model in translation_suggestion_models:
        suggestion = get_suggestion_from_model(suggestion_model)
        # Here, we are narrowing down the type from BaseSuggestion
        # to SuggestionTranslateContent.
        assert isinstance(
            suggestion, suggestion_registry.SuggestionTranslateContent
        )
        translation_suggestions.append(suggestion)

    return translation_suggestions


def get_translation_suggestions_in_review(
    exp_id: str
) -> List[suggestion_registry.BaseSuggestion]:
    """Returns translation suggestions in-review by exploration ID.

    Args:
        exp_id: str. Exploration ID.

    Returns:
        list(Suggestion). A list of translation suggestions in-review with
        target_id == exp_id.
    """
    suggestion_models_in_review = (
        suggestion_models.GeneralSuggestionModel
        .get_in_review_translation_suggestions_by_exp_id(
            exp_id)
    )
    return [
        get_suggestion_from_model(model)
        for model in suggestion_models_in_review
    ]


def get_translation_suggestions_in_review_by_exploration(
    exp_id: str, language_code: str
) -> List[suggestion_registry.BaseSuggestion]:
    """Returns translation suggestions in review by exploration ID.

    Args:
        exp_id: str. Exploration ID.
        language_code: str. Language code.

    Returns:
        list(Suggestion). A list of translation suggestions in review with
        target_id == exp_id.
    """
    suggestion_models_in_review = (
        suggestion_models.GeneralSuggestionModel
        .get_translation_suggestions_in_review_with_exp_id(
            exp_id, language_code)
    )
    return [
        get_suggestion_from_model(model)
        for model in suggestion_models_in_review
    ]


def get_translation_suggestions_in_review_by_exp_ids(
    exp_ids: List[str], language_code: str
) -> List[Optional[suggestion_registry.BaseSuggestion]]:
    """Returns translation suggestions in review by exploration ID and language
    code.

    Args:
        exp_ids: list(str). Exploration IDs matching the target ID of the
            translation suggestions.
        language_code: str. The ISO 639-1 language code of the translation
            suggestions.

    Returns:
        list(Suggestion). A list of translation suggestions in review with
        target_id in exp_ids and language_code == language_code, or None if
        suggestion model does not exists.
    """
    suggestion_models_in_review = (
        suggestion_models.GeneralSuggestionModel
        .get_in_review_translation_suggestions_by_exp_ids(
            exp_ids, language_code)
    )
    return [
        get_suggestion_from_model(model) if model else None
        for model in suggestion_models_in_review
    ]


def get_suggestions_with_editable_explorations(
    suggestions: Sequence[suggestion_registry.SuggestionTranslateContent]
) -> Sequence[suggestion_registry.SuggestionTranslateContent]:
    """Filters the supplied suggestions for those suggestions that have
    explorations that allow edits.

    Args:
        suggestions: list(Suggestion). List of translation suggestions to
            filter.

    Returns:
        list(Suggestion). List of filtered translation suggestions.
    """
    suggestion_exp_ids = {
        suggestion.target_id for suggestion in suggestions}
    suggestion_exp_id_to_exp = exp_fetchers.get_multiple_explorations_by_id(
        list(suggestion_exp_ids))
    return list(filter(
        lambda suggestion: suggestion_exp_id_to_exp[
            suggestion.target_id].edits_allowed,
        suggestions))


def _get_plain_text_from_html_content_string(html_content_string: str) -> str:
    """Retrieves the plain text from the given html content string. RTE element
    occurrences in the html are replaced by their corresponding rte component
    name, capitalized in square brackets.
    eg: <p>Sample1 <oppia-noninteractive-math></oppia-noninteractive-math>
        Sample2 </p> will give as output: Sample1 [Math] Sample2.
    Note: similar logic exists in the frontend in format-rte-preview.filter.ts.

    Args:
        html_content_string: str. The content html string to convert to plain
            text.

    Returns:
        str. The plain text string from the given html content string.
    """

    def _replace_rte_tag(rte_tag: Match[str]) -> str:
        """Replaces all of the <oppia-noninteractive-**> tags with their
        corresponding rte component name in square brackets.

        Args:
            rte_tag: MatchObject. A matched object that contins the
                oppia-noninteractive rte tags.

        Returns:
            str. The string to replace the rte tags with.
        """
        # Retrieve the matched string from the MatchObject.
        rte_tag_string = rte_tag.group(0)
        # Get the name of the rte tag. The hyphen is there as an optional
        # matching character to cover the case where the name of the rte
        # component is more than one word.
        rte_tag_name = re.search(
            r'oppia-noninteractive-(\w|-)+', rte_tag_string)
        # Here, rte_tag_name is always going to exists because the string
        # that was passed in this function is always going to contain
        # `<oppia-noninteractive>` substring. So, to just rule out the
        # possibility of None for mypy type checking. we used assertion here.
        assert rte_tag_name is not None
        # Retrieve the matched string from the MatchObject.
        rte_tag_name_string = rte_tag_name.group(0)
        # Get the name of the rte component.
        rte_component_name_string_list = rte_tag_name_string.split('-')[2:]
        # If the component name is more than word, connect the words with spaces
        # to create a single string.
        rte_component_name_string = ' '.join(rte_component_name_string_list)
        # Captialize each word in the string.
        capitalized_rte_component_name_string = (
            rte_component_name_string.title())
        formatted_rte_component_name_string = ' [%s] ' % (
            capitalized_rte_component_name_string)
        return formatted_rte_component_name_string

    # Replace all the <oppia-noninteractive-**> tags with their rte component
    # names capitalized in square brackets.
    html_content_string_with_rte_tags_replaced = re.sub(
        r'<oppia-noninteractive-[^>]+>(.*?)</oppia-noninteractive-[^>]+>',
        _replace_rte_tag, html_content_string)
    # Get rid of all of the other html tags.
    plain_text = html_cleaner.strip_html_tags(
        html_content_string_with_rte_tags_replaced)
    # Remove trailing and leading whitespace and ensure that all words are
    # separated by a single space.
    plain_text_without_contiguous_whitespace = ' '.join(plain_text.split())
    return plain_text_without_contiguous_whitespace


def create_reviewable_suggestion_email_info_from_suggestion(
    suggestion: suggestion_registry.BaseSuggestion
) -> suggestion_registry.ReviewableSuggestionEmailInfo:
    """Creates an object with the key information needed to notify reviewers or
    admins that the given suggestion needs review.

    Args:
        suggestion: Suggestion. The suggestion used to create the
            ReviewableSuggestionEmailInfo object. Note that the suggestion's
            status must be in review.

    Returns:
        ReviewableSuggestionEmailInfo. The corresponding reviewable suggestion
        email info.

    Raises:
        Exception. The suggestion type must be offered on the Contributor
            Dashboard.
    """
    if suggestion.suggestion_type not in (
            SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS):
        raise Exception(
            'Expected suggestion type to be offered on the Contributor '
            'Dashboard, received: %s.' % suggestion.suggestion_type)

    # Retrieve the html content that is emphasized on the Contributor Dashboard
    # pages. This content is what stands out for each suggestion when a user
    # views a list of suggestions.
    get_html_representing_suggestion = (
        SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS[
            suggestion.suggestion_type]
    )
    plain_text = _get_plain_text_from_html_content_string(
        get_html_representing_suggestion(suggestion))
    # Here, suggestion can only be of `translate_content` or `add_question`
    # type and in both suggestions language_code cannot be None. So, to
    # just narrow down type from Optional[str] to str we used assertion here.
    assert suggestion.language_code is not None
    return suggestion_registry.ReviewableSuggestionEmailInfo(
        suggestion.suggestion_type, suggestion.language_code, plain_text,
        suggestion.last_updated
    )


def get_suggestions_waiting_for_review_info_to_notify_reviewers(
    reviewer_ids: List[str]
) -> List[List[suggestion_registry.ReviewableSuggestionEmailInfo]]:
    """For each user, returns information that will be used to notify reviewers
    about the suggestions waiting longest for review, that the reviewer has
    permissions to review.

    Args:
        reviewer_ids: list(str). A list of the reviewer user ids to notify.

    Returns:
        list(list(ReviewableSuggestionEmailInfo)). A list of suggestion
        email content info objects for each reviewer. Each suggestion email
        content info object contains the type of the suggestion, the language
        of the suggestion, the suggestion content (question/translation) and
        the date that the suggestion was submitted for review. For each user
        the suggestion email content info objects are sorted in descending order
        based on review wait time.
    """
    # Get each reviewer's review permissions.
    users_contribution_rights = user_services.get_users_contribution_rights(
        reviewer_ids
    )

    # Get the question suggestions that have been waiting longest for review.
    question_suggestions = (
        get_question_suggestions_waiting_longest_for_review()
    )

    # Create a dictionary to keep track of the translation suggestions that
    # have been waiting longest for review for each language code.
    translation_suggestions_by_lang_code_dict = {}

    reviewers_reviewable_suggestion_infos = []

    for user_contribution_rights in users_contribution_rights:
        # Use a min heap because then the suggestions that have been waiting the
        # longest for review (earliest review submission date) are automatically
        # efficiently sorted.
        suggestions_waiting_longest_heap: List[
            Tuple[datetime.datetime, suggestion_registry.BaseSuggestion]
        ] = []
        if user_contribution_rights.can_review_questions:
            for question_suggestion in question_suggestions:
                # Break early because we only want the top
                # MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER number of
                # suggestions.
                if len(suggestions_waiting_longest_heap) == (
                        MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER):
                    break
                # We can't include suggestions that were authored by the
                # reviewer because reviewers aren't allowed to review their own
                # suggestions.
                if question_suggestion.author_id != user_contribution_rights.id:
                    heapq.heappush(suggestions_waiting_longest_heap, (
                        question_suggestion.last_updated, question_suggestion))

        if user_contribution_rights.can_review_translation_for_language_codes:
            for language_code in (
                    user_contribution_rights
                    .can_review_translation_for_language_codes):
                # Get a list of the translation suggestions in the language code
                # from the datastore if we haven't already gotten them.
                if language_code not in (
                        translation_suggestions_by_lang_code_dict):
                    translation_suggestions_by_lang_code_dict[language_code] = (
                        get_translation_suggestions_waiting_longest_for_review(
                            language_code
                        )
                    )

                translation_suggestions = (
                    translation_suggestions_by_lang_code_dict[language_code]
                )
                for translation_suggestion in translation_suggestions:
                    if len(suggestions_waiting_longest_heap) == (
                            MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER):
                        # The shortest review wait time corresponds to the most
                        # recent review submission date, which is the max of
                        # the heap.
                        most_recent_review_submission = max(
                            suggestions_waiting_longest_heap)[0]
                        # If the review submission date for the translation
                        # suggestion is more recent than the most recent
                        # submission date so far, we can exit early.
                        if translation_suggestion.last_updated > (
                                most_recent_review_submission):
                            break
                    # Reviewers can never review their own suggestions.
                    if translation_suggestion.author_id != (
                            user_contribution_rights.id):
                        heapq.heappush(suggestions_waiting_longest_heap, (
                            translation_suggestion.last_updated,
                            translation_suggestion))

        # Get the key information from each suggestion that will be used to
        # email reviewers.
        reviewer_reviewable_suggestion_infos = []
        for _ in range(MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_REVIEWER):
            if len(suggestions_waiting_longest_heap) == 0:
                break
            _, suggestion = heapq.heappop(suggestions_waiting_longest_heap)
            reviewer_reviewable_suggestion_infos.append(
                create_reviewable_suggestion_email_info_from_suggestion(
                    suggestion)
            )
        reviewers_reviewable_suggestion_infos.append(
            reviewer_reviewable_suggestion_infos
        )

    return reviewers_reviewable_suggestion_infos


def get_submitted_suggestions(
    user_id: str, suggestion_type: str
) -> List[suggestion_registry.BaseSuggestion]:
    """Returns a list of suggestions of given suggestion_type which the user
    has submitted.

    Args:
        user_id: str. The ID of the user.
        suggestion_type: str. The type of the suggestion.

    Returns:
        list(Suggestion). A list of suggestions which the given user has
        submitted.
    """
    return ([
        get_suggestion_from_model(s) for s in (
            suggestion_models.GeneralSuggestionModel
            .get_user_created_suggestions_of_suggestion_type(
                suggestion_type, user_id))
    ])


@overload
def get_submitted_suggestions_by_offset(
    user_id: str,
    suggestion_type: Literal['add_question'],
    limit: int,
    offset: int,
    sort_key: Optional[str]
) -> Tuple[
    Sequence[suggestion_registry.SuggestionAddQuestion], int
]: ...


@overload
def get_submitted_suggestions_by_offset(
    user_id: str,
    suggestion_type: Literal['translate_content'],
    limit: int,
    offset: int,
    sort_key: Optional[str]
) -> Tuple[
    Sequence[suggestion_registry.SuggestionTranslateContent], int
]: ...


@overload
def get_submitted_suggestions_by_offset(
    user_id: str,
    suggestion_type: str,
    limit: int,
    offset: int,
    sort_key: Optional[str]
) -> Tuple[Sequence[suggestion_registry.BaseSuggestion], int]: ...


def get_submitted_suggestions_by_offset(
    user_id: str,
    suggestion_type: str,
    limit: int,
    offset: int,
    sort_key: Optional[str]
) -> Tuple[Sequence[suggestion_registry.BaseSuggestion], int]:
    """Returns a list of suggestions of given suggestion_type which the user
    has submitted.

    Args:
        user_id: str. The ID of the user.
        suggestion_type: str. The type of suggestion.
        limit: int. The maximum number of results to return.
        offset: int. The number of results to skip from the beginning
            of all results matching the query.
        sort_key: str|None. The key to sort the suggestions by.

    Returns:
        Tuple of (results, next_offset). Where:
            results: list(Suggestion). A list of suggestions of the supplied
                type which the supplied user has submitted.
            next_offset: int. The input offset + the number of results returned
                by the current query.
    """
    submitted_suggestion_models, next_offset = (
        suggestion_models.GeneralSuggestionModel
            .get_user_created_suggestions_by_offset(
                limit,
                offset,
                suggestion_type,
                user_id,
                sort_key))
    suggestions = ([
        get_suggestion_from_model(s) for s in submitted_suggestion_models
    ])
    return suggestions, next_offset


def get_info_about_suggestions_waiting_too_long_for_review() -> List[
    suggestion_registry.ReviewableSuggestionEmailInfo
]:
    """Gets the information about the suggestions that have been waiting longer
    than suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS days
    for a review on the Contributor Dashboard. There can be information about at
    most suggestion_models.MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_ADMIN suggestions.
    The information about the suggestions are returned in descending order by
    the suggestion's review wait time.

    Returns:
        list(ReviewableSuggestionEmailContentInfo). A list of reviewable
        suggestion email content info objects that represent suggestions that
        have been waiting too long for a review. Each object contains the type
        of the suggestion, the language of the suggestion, the suggestion
        content (question/translation), and the date that the suggestion was
        submitted for review. The objects are sorted in descending order based
        on review wait time.
    """
    suggestions_waiting_too_long_for_review = [
        get_suggestion_from_model(suggestion_model) for suggestion_model in (
            suggestion_models.GeneralSuggestionModel
            .get_suggestions_waiting_too_long_for_review())
    ]
    return [
        create_reviewable_suggestion_email_info_from_suggestion(
            suggestion) for suggestion in
        suggestions_waiting_too_long_for_review
    ]


def get_new_suggestions_for_reviewer_notifications() -> List[
    suggestion_registry.ReviewableSuggestionEmailInfo
]:
    """Retrieves and organizes new suggestions for reviewer email notifications.

    Returns:
        list[ReviewableSuggestionEmailInfo]. A list of email content info
        objects for new suggestions.
    """
    new_suggestions = [
        get_suggestion_from_model(suggestion_model) for suggestion_model in (
            suggestion_models.GeneralSuggestionModel
            .get_new_suggestions_waiting_for_review()
        )
    ]

    email_content_info = []

    for suggestion in new_suggestions:
        suggestion_info = (
            create_reviewable_suggestion_email_info_from_suggestion(
                suggestion
        ))
        email_content_info.append(suggestion_info)
    return email_content_info


def get_user_proficiency_from_model(
    user_proficiency_model: user_models.UserContributionProficiencyModel
) -> user_domain.UserContributionProficiency:
    """Converts the given UserContributionProficiencyModel to a
    UserContributionProficiency domain object.

    Args:
        user_proficiency_model: UserContributionProficiencyModel.
            UserContributionProficiencyModel to be converted to
            a UserContributionProficiency domain object.

    Returns:
        UserContributionProficiency. The corresponding
        UserContributionProficiency domain object.
    """
    return user_domain.UserContributionProficiency(
        user_proficiency_model.user_id, user_proficiency_model.score_category,
        user_proficiency_model.score,
        user_proficiency_model.onboarding_email_sent
    )


def _update_user_proficiency(
    user_proficiency: user_domain.UserContributionProficiency
) -> None:
    """Updates the user_proficiency.

    Args:
        user_proficiency: UserContributionProficiency. The user proficiency to
            be updated.
    """
    user_proficiency_model = user_models.UserContributionProficiencyModel.get(
        user_proficiency.user_id, user_proficiency.score_category
    )

    if user_proficiency_model is not None:
        user_proficiency_model.user_id = user_proficiency.user_id
        user_proficiency_model.score_category = user_proficiency.score_category
        user_proficiency_model.score = user_proficiency.score
        user_proficiency_model.onboarding_email_sent = (
            user_proficiency.onboarding_email_sent
        )

        user_proficiency_model.update_timestamps()
        user_proficiency_model.put()

    else:
        user_models.UserContributionProficiencyModel.create(
            user_proficiency.user_id, user_proficiency.score_category,
            user_proficiency.score, user_proficiency.onboarding_email_sent)


def get_all_scores_of_user(user_id: str) -> Dict[str, int]:
    """Gets all scores for a given user.

    Args:
        user_id: str. The id of the user.

    Returns:
        dict. A dict containing all the scores of the user. The keys of the dict
        are the score categories and the values are the scores.
    """
    scores = {}
    for model in (
            user_models.UserContributionProficiencyModel.get_all_scores_of_user(
                user_id)):
        scores[model.score_category] = model.score

    return scores


def can_user_review_category(
    user_id: str, score_category: str
) -> bool:
    """Checks if user can review suggestions in category score_category.
    If the user has score above the minimum required score, then the user is
    allowed to review.

    Args:
        user_id: str. The id of the user.
        score_category: str. The category to check the user's score.

    Returns:
        bool. Whether the user can review suggestions under category
        score_category.
    """
    user_proficiency = _get_user_proficiency(user_id, score_category)
    return user_proficiency.can_user_review_category()


def get_all_user_ids_who_are_allowed_to_review(
    score_category: str
) -> List[str]:
    """Gets all user_ids of users who are allowed to review (as per their
    scores) suggestions to a particular category.

    Args:
        score_category: str. The category of the suggestion.

    Returns:
        list(str). All user_ids of users who are allowed to review in the given
        category.
    """
    return [
        model.user_id for model in user_models.UserContributionProficiencyModel
        .get_all_users_with_score_above_minimum_for_category(score_category)
    ]


def _get_user_proficiency(
    user_id: str, score_category: str
) -> user_domain.UserContributionProficiency:
    """Gets the user proficiency model from storage and creates the
    corresponding user proficiency domain object if the model exists. If the
    model does not exist a user proficiency domain object with the given
    user_id and score category is created with the initial score and email
    values.

    Args:
        user_id: str. The id of the user.
        score_category: str. The category of the suggestion.

    Returns:
        UserContributionProficiency. The user proficiency object.
    """
    user_proficiency_model = user_models.UserContributionProficiencyModel.get(
        user_id, score_category)

    if user_proficiency_model is not None:
        return get_user_proficiency_from_model(user_proficiency_model)

    return user_domain.UserContributionProficiency(
        user_id, score_category, 0, False)


def check_can_resubmit_suggestion(suggestion_id: str, user_id: str) -> bool:
    """Checks whether the given user can resubmit the suggestion.

    Args:
        suggestion_id: str. The ID of the suggestion.
        user_id: str. The ID of the user.

    Returns:
        bool. Whether the user can resubmit the suggestion.
    """

    suggestion = get_suggestion_by_id(suggestion_id)

    return suggestion.author_id == user_id


def create_community_contribution_stats_from_model(
    community_contribution_stats_model: (
        suggestion_models.CommunityContributionStatsModel
    )
) -> suggestion_registry.CommunityContributionStats:
    """Creates a domain object that represents the community contribution
    stats from the model given. Note that each call to this function returns
    a new domain object, but the data copied into the domain object comes from
    a single, shared source.

    Args:
        community_contribution_stats_model: CommunityContributionStatsModel.
            The model to convert to a domain object.

    Returns:
        CommunityContributionStats. The corresponding
        CommunityContributionStats domain object.
    """
    return suggestion_registry.CommunityContributionStats(
        (
            community_contribution_stats_model
            .translation_reviewer_counts_by_lang_code
        ),
        (
            community_contribution_stats_model
            .translation_suggestion_counts_by_lang_code
        ),
        community_contribution_stats_model.question_reviewer_count,
        community_contribution_stats_model.question_suggestion_count
    )


def get_community_contribution_stats(
) -> suggestion_registry.CommunityContributionStats:
    """Gets the CommunityContributionStatsModel and converts it into the
    corresponding domain object that represents the community contribution
    stats. Note that there is only ever one instance of this model and if the
    model doesn't exist yet, it will be created.

    Returns:
        CommunityContributionStats. The corresponding
        CommunityContributionStats domain object.
    """
    community_contribution_stats_model = (
        suggestion_models.CommunityContributionStatsModel.get()
    )

    return create_community_contribution_stats_from_model(
        community_contribution_stats_model)


def create_translation_contribution_stats_from_model(
    translation_contribution_stats_model: (
        suggestion_models.TranslationContributionStatsModel
    )
) -> suggestion_registry.TranslationContributionStats:
    """Creates a domain object representing the supplied
    TranslationContributionStatsModel.

    Args:
        translation_contribution_stats_model: TranslationContributionStatsModel.
            The model to convert to a domain object.

    Returns:
        TranslationContributionStats. The corresponding
        TranslationContributionStats domain object.
    """
    return suggestion_registry.TranslationContributionStats(
        translation_contribution_stats_model.language_code,
        translation_contribution_stats_model.contributor_user_id,
        translation_contribution_stats_model.topic_id,
        translation_contribution_stats_model.submitted_translations_count,
        translation_contribution_stats_model.submitted_translation_word_count,
        translation_contribution_stats_model.accepted_translations_count,
        (
            translation_contribution_stats_model
            .accepted_translations_without_reviewer_edits_count
        ),
        translation_contribution_stats_model.accepted_translation_word_count,
        translation_contribution_stats_model.rejected_translations_count,
        translation_contribution_stats_model.rejected_translation_word_count,
        set(translation_contribution_stats_model.contribution_dates)
    )


def get_all_translation_contribution_stats(
    user_id: str
) -> List[suggestion_registry.TranslationContributionStats]:
    """Gets all TranslationContributionStatsModels corresponding to the supplied
    user and converts them to their corresponding domain objects.

    Args:
        user_id: str. User ID.

    Returns:
        list(TranslationContributionStats). TranslationContributionStats domain
        objects corresponding to the supplied user.
    """
    translation_contribution_stats_models = (
        suggestion_models.TranslationContributionStatsModel.get_all_by_user_id(
            user_id
        )
    )
    return [
        create_translation_contribution_stats_from_model(model)
        for model in translation_contribution_stats_models
    ]


def get_suggestion_types_that_need_reviewers() -> Dict[str, Set[str]]:
    """Uses the community contribution stats to determine which suggestion
    types need more reviewers. Suggestion types need more reviewers if the
    number of suggestions in that type divided by the number of reviewers is
    greater than ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER.

    Returns:
        dict. A dictionary that uses the presence of its keys to indicate which
        suggestion types need more reviewers. The possible key values are the
        suggestion types listed in
        feconf.CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES. The dictionary
        values for each suggestion type are the following:
        - for question suggestions the value is an empty set
        - for translation suggestions the value is a nonempty set containing the
            language codes of the translation suggestions that need more
            reviewers.
    """
    suggestion_types_needing_reviewers: Dict[str, Set[str]] = {}
    stats = get_community_contribution_stats()

    language_codes_that_need_reviewers = (
        stats.get_translation_language_codes_that_need_reviewers()
    )
    if len(language_codes_that_need_reviewers) != 0:
        suggestion_types_needing_reviewers[
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT] = (
                language_codes_that_need_reviewers
            )

    if stats.are_question_reviewers_needed():
        suggestion_types_needing_reviewers[
            feconf.SUGGESTION_TYPE_ADD_QUESTION] = set()

    return suggestion_types_needing_reviewers


@transaction_services.run_in_transaction_wrapper
def _update_suggestion_counts_in_community_contribution_stats_transactional(
    suggestions: List[suggestion_registry.BaseSuggestion], amount: int
) -> None:
    """Updates the community contribution stats counts associated with the given
    suggestions by the given amount. Note that this method should only ever be
    called in a transaction.

    Args:
        suggestions: list(Suggestion). Suggestions that may update the counts
            stored in the community contribution stats model. Only suggestion
            types that are tracked in the community contribution stats model
            trigger count updates.
        amount: int. The amount to adjust the counts by.
    """
    stats_model = suggestion_models.CommunityContributionStatsModel.get()
    for suggestion in suggestions:
        if suggestion.suggestion_type == (
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT):
            if suggestion.language_code not in (
                    stats_model.translation_suggestion_counts_by_lang_code):
                stats_model.translation_suggestion_counts_by_lang_code[
                    suggestion.language_code] = amount
            else:
                stats_model.translation_suggestion_counts_by_lang_code[
                    suggestion.language_code] += amount
                # Remove the language code from the dict if the count reaches
                # zero.
                if stats_model.translation_suggestion_counts_by_lang_code[
                        suggestion.language_code] == 0:
                    del stats_model.translation_suggestion_counts_by_lang_code[
                        suggestion.language_code]
        elif suggestion.suggestion_type == (
                feconf.SUGGESTION_TYPE_ADD_QUESTION):
            stats_model.question_suggestion_count += amount

    # Create a community contribution stats object to validate the updates.
    stats = create_community_contribution_stats_from_model(stats_model)
    stats.validate()

    stats_model.update_timestamps()
    stats_model.put()

    logging.info('Updated translation_suggestion_counts_by_lang_code: %s' % (
        stats_model.translation_suggestion_counts_by_lang_code))


def _update_suggestion_counts_in_community_contribution_stats(
    suggestions: Sequence[suggestion_registry.BaseSuggestion], amount: int
) -> None:
    """Updates the community contribution stats counts associated with the given
    suggestions by the given amount. The GET and PUT is done in a single
    transaction to avoid loss of updates that come in rapid succession.

    Args:
        suggestions: list(Suggestion). Suggestions that may update the counts
            stored in the community contribution stats model. Only suggestion
            types that are tracked in the community contribution stats model
            trigger count updates.
        amount: int. The amount to adjust the counts by.
    """
    _update_suggestion_counts_in_community_contribution_stats_transactional(
        suggestions, amount)


def update_translation_suggestion(
    suggestion_id: str, translation_html: str
) -> None:
    """Updates the translation_html of a suggestion with the given
    suggestion_id.

    Args:
        suggestion_id: str. The id of the suggestion to be updated.
        translation_html: str. The new translation_html string.

    Raises:
        Exception. Expected SuggestionTranslateContent suggestion but found
            different suggestion.
    """
    suggestion = get_suggestion_by_id(suggestion_id)
    if not isinstance(
        suggestion, suggestion_registry.SuggestionTranslateContent
    ):
        raise Exception(
            'Expected SuggestionTranslateContent suggestion but found: %s.'
            % type(suggestion).__name__
        )
    suggestion.change_cmd.translation_html = (
        html_cleaner.clean(translation_html)
        if isinstance(translation_html, str)
        else translation_html
    )
    suggestion.edited_by_reviewer = True
    suggestion.pre_update_validate(suggestion.change_cmd)
    _update_suggestion(suggestion)


def update_question_suggestion(
    suggestion_id: str,
    skill_difficulty: float,
    question_state_data: state_domain.StateDict,
    next_content_id_index: int
) -> Optional[suggestion_registry.BaseSuggestion]:
    """Updates skill_difficulty and question_state_data of a suggestion with
    the given suggestion_id.

    Args:
        suggestion_id: str. The id of the suggestion to be updated.
        skill_difficulty: double. The difficulty level of the question.
        question_state_data: obj. Details of the question.
        next_content_id_index: int. The next content Id index for the question's
            content.

    Returns:
        Suggestion|None. The corresponding suggestion, or None if no suggestion
        is found.

    Raises:
        Exception. Expected SuggestionAddQuestion suggestion but found
            different suggestion.
    """
    suggestion = get_suggestion_by_id(suggestion_id)
    if not isinstance(
        suggestion, suggestion_registry.SuggestionAddQuestion
    ):
        raise Exception(
            'Expected SuggestionAddQuestion suggestion but found: %s.'
            % type(suggestion).__name__
        )
    question_dict = suggestion.change_cmd.question_dict
    new_change_obj = (
        question_domain.CreateNewFullySpecifiedQuestionSuggestionCmd(
            {
                'cmd': suggestion.change_cmd.cmd,
                'question_dict': {
                    'question_state_data': question_state_data,
                    'language_code': question_dict['language_code'],
                    'question_state_data_schema_version': (
                        question_dict[
                            'question_state_data_schema_version']),
                    'linked_skill_ids': question_dict['linked_skill_ids'],
                    'inapplicable_skill_misconception_ids': (
                        suggestion.change_cmd.question_dict[
                            'inapplicable_skill_misconception_ids']),
                    'next_content_id_index': next_content_id_index
                },
                'skill_id': suggestion.change_cmd.skill_id,
                'skill_difficulty': skill_difficulty
            }
        )
    )
    suggestion.pre_update_validate(new_change_obj)
    suggestion.edited_by_reviewer = True
    suggestion.change_cmd = new_change_obj

    _update_suggestion(suggestion)

    return suggestion


def _create_translation_review_stats_from_model(
    translation_review_stats_model: (
        suggestion_models.TranslationReviewStatsModel
    )
) -> suggestion_registry.TranslationReviewStats:
    """Creates a domain object representing the supplied
    TranslationReviewStatsModel.

    Args:
        translation_review_stats_model: TranslationReviewStatsModel.
            The model to convert to a domain object.

    Returns:
        TranslationReviewStats. The corresponding TranslationReviewStats domain
        object.
    """
    return suggestion_registry.TranslationReviewStats(
        translation_review_stats_model.language_code,
        translation_review_stats_model.reviewer_user_id,
        translation_review_stats_model.topic_id,
        translation_review_stats_model.reviewed_translations_count,
        translation_review_stats_model.reviewed_translation_word_count,
        translation_review_stats_model.accepted_translations_count,
        translation_review_stats_model.accepted_translation_word_count,
        (
            translation_review_stats_model
            .accepted_translations_with_reviewer_edits_count),
        translation_review_stats_model.first_contribution_date,
        translation_review_stats_model.last_contribution_date
    )


def _create_question_contribution_stats_from_model(
    question_contribution_stats_model: (
        suggestion_models.QuestionContributionStatsModel
    )
) -> suggestion_registry.QuestionContributionStats:
    """Creates a domain object representing the supplied
    QuestionContributionStatsModel.

    Args:
        question_contribution_stats_model: QuestionContributionStatsModel.
            The model to convert to a domain object.

    Returns:
        QuestionContributionStats. The corresponding QuestionContributionStats
        domain object.
    """
    return suggestion_registry.QuestionContributionStats(
        question_contribution_stats_model.contributor_user_id,
        question_contribution_stats_model.topic_id,
        question_contribution_stats_model.submitted_questions_count,
        question_contribution_stats_model.accepted_questions_count,
        (
            question_contribution_stats_model
            .accepted_questions_without_reviewer_edits_count),
        question_contribution_stats_model.first_contribution_date,
        question_contribution_stats_model.last_contribution_date
    )


def _create_question_review_stats_from_model(
    question_review_stats_model: (
        suggestion_models.QuestionReviewStatsModel
    )
) -> suggestion_registry.QuestionReviewStats:
    """Creates a domain object representing the supplied
    QuestionReviewStatsModel.

    Args:
        question_review_stats_model: QuestionReviewStatsModel.
            The model to convert to a domain object.

    Returns:
        QuestionReviewStats. The corresponding QuestionReviewStats domain
        object.
    """
    return suggestion_registry.QuestionReviewStats(
        question_review_stats_model.reviewer_user_id,
        question_review_stats_model.topic_id,
        question_review_stats_model.reviewed_questions_count,
        question_review_stats_model.accepted_questions_count,
        (
            question_review_stats_model
            .accepted_questions_with_reviewer_edits_count),
        question_review_stats_model.first_contribution_date,
        question_review_stats_model.last_contribution_date
    )


def get_all_translation_review_stats(
    user_id: str
) -> List[suggestion_registry.TranslationReviewStats]:
    """Gets all TranslationReviewStatsModels corresponding to the supplied
    user and converts them to their corresponding domain objects.

    Args:
        user_id: str. User ID.

    Returns:
        list(TranslationReviewStats). TranslationReviewStats domain objects
        corresponding to the supplied user.
    """
    translation_review_stats_models = (
        suggestion_models.TranslationReviewStatsModel.get_all_by_user_id(
            user_id
        )
    )
    return [
        _create_translation_review_stats_from_model(model)
        for model in translation_review_stats_models
    ]


def get_all_question_contribution_stats(
    user_id: str
) -> List[suggestion_registry.QuestionContributionStats]:
    """Gets all QuestionContributionStatsModels corresponding to the supplied
    user and converts them to their corresponding domain objects.

    Args:
        user_id: str. User ID.

    Returns:
        list(QuestionContributionStats). QuestionContributionStats domain
        objects corresponding to the supplied user.
    """
    question_contribution_stats_models = (
        suggestion_models.QuestionContributionStatsModel.get_all_by_user_id(
            user_id
        )
    )
    return [
        _create_question_contribution_stats_from_model(model)
        for model in question_contribution_stats_models
    ]


def get_all_question_review_stats(
    user_id: str
) -> List[suggestion_registry.QuestionReviewStats]:
    """Gets all QuestionReviewStatsModels corresponding to the supplied
    user and converts them to their corresponding domain objects.

    Args:
        user_id: str. User ID.

    Returns:
        list(QuestionReviewStats). QuestionReviewStats domain objects
        corresponding to the supplied user.
    """
    question_review_stats_models = (
        suggestion_models.QuestionReviewStatsModel.get_all_by_user_id(
            user_id
        )
    )
    return [
        _create_question_review_stats_from_model(model)
        for model in question_review_stats_models
    ]


# TODO(#16019): Pre-fetching and caching of stats data should be done.
def get_all_contributor_stats(
    user_id: str
) -> suggestion_registry.ContributorStatsSummary:
    """Gets ContributorStatsSummary corresponding to the supplied user.

    Args:
        user_id: str. User ID.

    Returns:
        ContributorStatsSummary. ContributorStatsSummary domain objects
        corresponding to the supplied user.
    """
    translation_contribution_stats = get_all_translation_contribution_stats(
        user_id)
    translation_review_stats = get_all_translation_review_stats(user_id)
    question_contribution_stats = get_all_question_contribution_stats(user_id)
    question_review_stats = get_all_question_review_stats(user_id)

    return suggestion_registry.ContributorStatsSummary(
        user_id,
        translation_contribution_stats,
        question_contribution_stats,
        translation_review_stats,
        question_review_stats)


def _update_translation_contribution_stats_models(
    translation_contribution_stats: List[
        suggestion_registry.TranslationContributionStats
    ]
) -> None:
    """Updates TranslationContributionStatsModel models for given translation
    contribution stats.

    Args:
        translation_contribution_stats: list(TranslationContributionStats).
            A list of TranslationContributionStats domain objects.
    """
    stats_dict = {}
    for stat in translation_contribution_stats:
        stat_id = (
            suggestion_models.TranslationContributionStatsModel.construct_id(
                stat.language_code,
                stat.contributor_user_id,
                stat.topic_id)
        )
        stats_dict[stat_id] = stat

    stats_ids = stats_dict.keys()

    stats_models = get_translation_contribution_stats_models(list(stats_ids))
    stats_models_to_update: List[
        suggestion_models.TranslationContributionStatsModel] = []
    for stats_model in stats_models:
        stat = stats_dict[stats_model.id]
        stats_model.submitted_translations_count = (
            stat.submitted_translations_count)
        stats_model.submitted_translation_word_count = (
            stat.submitted_translation_word_count)
        stats_model.accepted_translations_count = (
            stat.accepted_translations_count)
        stats_model.accepted_translations_without_reviewer_edits_count = (
            stat.accepted_translations_without_reviewer_edits_count)
        stats_model.accepted_translation_word_count = (
            stat.accepted_translation_word_count)
        stats_model.rejected_translations_count = (
            stat.rejected_translations_count)
        stats_model.rejected_translation_word_count = (
            stat.rejected_translation_word_count)
        stats_model.contribution_dates = sorted(stat.contribution_dates)
        stats_models_to_update.append(stats_model)

    suggestion_models.TranslationContributionStatsModel.update_timestamps_multi(
        stats_models_to_update,
        update_last_updated_time=True)
    suggestion_models.TranslationContributionStatsModel.put_multi(
        stats_models_to_update)


def _update_translation_review_stats_models(
    translation_review_stats: List[
        suggestion_registry.TranslationReviewStats
    ]
) -> None:
    """Updates TranslationReviewStatsModel models for given translation
    review stats.

    Args:
        translation_review_stats: list(TranslationReviewStats). A list of
            TranslationReviewStats domain objects.
    """
    stats_dict = {}
    for stat in translation_review_stats:
        stat_id = suggestion_models.TranslationReviewStatsModel.construct_id(
            stat.language_code, stat.contributor_user_id, stat.topic_id)
        stats_dict[stat_id] = stat

    stats_ids = stats_dict.keys()

    stats_models = get_translation_review_stats_models(list(stats_ids))
    stats_models_to_update: List[
        suggestion_models.TranslationReviewStatsModel] = []
    for stats_model in stats_models:
        stat = stats_dict[stats_model.id]
        stats_model.reviewed_translations_count = (
            stat.reviewed_translations_count)
        stats_model.reviewed_translation_word_count = (
            stat.reviewed_translation_word_count)
        stats_model.accepted_translations_count = (
            stat.accepted_translations_count)
        stats_model.accepted_translation_word_count = (
            stat.accepted_translation_word_count)
        stats_model.accepted_translations_with_reviewer_edits_count = (
            stat.accepted_translations_with_reviewer_edits_count)
        stats_model.first_contribution_date = (
            stat.first_contribution_date)
        stats_model.last_contribution_date = (
            stat.last_contribution_date)
        stats_models_to_update.append(stats_model)

    suggestion_models.TranslationReviewStatsModel.update_timestamps_multi(
        stats_models_to_update,
        update_last_updated_time=True)
    suggestion_models.TranslationReviewStatsModel.put_multi(
        stats_models_to_update)


def _update_question_contribution_stats_models(
    question_contribution_stats: List[
        suggestion_registry.QuestionContributionStats
    ]
) -> None:
    """Updates QuestionContributionStatsModel models for given question
    contribution stats.

    Args:
        question_contribution_stats: list(QuestionContributionStats). A list of
            QuestionContribution domain objects.
    """
    stats_dict = {}
    for stat in question_contribution_stats:
        stat_id = suggestion_models.QuestionContributionStatsModel.construct_id(
            stat.contributor_user_id, stat.topic_id)
        stats_dict[stat_id] = stat

    stats_ids = stats_dict.keys()

    stats_models = get_question_contribution_stats_models(list(stats_ids))
    stats_models_to_update: List[
        suggestion_models.QuestionContributionStatsModel] = []
    for stats_model in stats_models:
        stat = stats_dict[stats_model.id]
        stats_model.submitted_questions_count = (
            stat.submitted_questions_count)
        stats_model.accepted_questions_count = (
            stat.accepted_questions_count)
        stats_model.accepted_questions_without_reviewer_edits_count = (
            stat.accepted_questions_without_reviewer_edits_count)
        stats_model.first_contribution_date = stat.first_contribution_date
        stats_model.last_contribution_date = stat.last_contribution_date
        stats_models_to_update.append(stats_model)

    suggestion_models.QuestionContributionStatsModel.update_timestamps_multi(
        stats_models_to_update,
        update_last_updated_time=True)
    suggestion_models.QuestionContributionStatsModel.put_multi(
        stats_models_to_update)


def _update_question_review_stats_models(
    question_review_stats: List[
        suggestion_registry.QuestionReviewStats
    ]
) -> None:
    """Updates QuestionReviewStatsModel models for given question
    review stats.

    Args:
        question_review_stats: list(QuestionReviewStats). A list of
            QuestionReviewStats domain objects.
    """
    stats_dict = {}
    for stat in question_review_stats:
        stat_id = suggestion_models.QuestionReviewStatsModel.construct_id(
            stat.contributor_user_id, stat.topic_id)
        stats_dict[stat_id] = stat

    stats_ids = stats_dict.keys()

    stats_models = get_question_review_stats_models(list(stats_ids))
    stats_models_to_update: List[
        suggestion_models.QuestionReviewStatsModel] = []
    for stats_model in stats_models:
        stat = stats_dict[stats_model.id]
        stats_model.reviewed_questions_count = (
            stat.reviewed_questions_count)
        stats_model.accepted_questions_count = (
            stat.accepted_questions_count)
        stats_model.accepted_questions_with_reviewer_edits_count = (
            stat.accepted_questions_with_reviewer_edits_count)
        stats_model.first_contribution_date = stat.first_contribution_date
        stats_model.last_contribution_date = stat.last_contribution_date
        stats_models_to_update.append(stats_model)

    suggestion_models.QuestionReviewStatsModel.update_timestamps_multi(
        stats_models_to_update,
        update_last_updated_time=True)
    suggestion_models.QuestionReviewStatsModel.put_multi(
        stats_models_to_update)


def _update_translation_submitter_total_stats_model(
    translation_submitter_total_stats:
        suggestion_registry.TranslationSubmitterTotalContributionStats
) -> None:
    """Updates TranslationSubmitterTotalContributionStats
    model for given translation submitter stats.

    Args:
        translation_submitter_total_stats:
            TranslationSubmitterTotalContributionStats.
            TranslationSubmitterTotalContributionStats domain object.

    Raises:
        Exception. Language is None.
        Exception. Contributor user ID is None.
    """

    stats_model = suggestion_models.TranslationSubmitterTotalContributionStatsModel.get( # pylint: disable=line-too-long
            translation_submitter_total_stats.language_code,
            translation_submitter_total_stats.contributor_id)

    # We assert here because we are calling this method only when the model
    # exists. If model doesn't exist we create a new model in
    # update_translation_contribution_stats_at_submission or
    # update_translation_contribution_stats_at_review.
    assert stats_model is not None
    stats_model.topic_ids_with_translation_submissions = (
        translation_submitter_total_stats
        .topic_ids_with_translation_submissions)
    stats_model.recent_review_outcomes = (
        translation_submitter_total_stats.recent_review_outcomes)
    stats_model.recent_performance = (
        translation_submitter_total_stats.recent_performance)
    stats_model.overall_accuracy = (
        translation_submitter_total_stats.overall_accuracy)
    stats_model.submitted_translations_count = (
        translation_submitter_total_stats.submitted_translations_count)
    stats_model.submitted_translation_word_count = (
        translation_submitter_total_stats.submitted_translation_word_count)
    stats_model.accepted_translations_count = (
        translation_submitter_total_stats.accepted_translations_count)
    stats_model.accepted_translations_without_reviewer_edits_count = (
        translation_submitter_total_stats
        .accepted_translations_without_reviewer_edits_count)
    stats_model.accepted_translation_word_count = (
        translation_submitter_total_stats.accepted_translation_word_count)
    stats_model.rejected_translations_count = (
        translation_submitter_total_stats.rejected_translations_count)
    stats_model.rejected_translation_word_count = (
        translation_submitter_total_stats.rejected_translation_word_count)
    stats_model.first_contribution_date = (
        translation_submitter_total_stats.first_contribution_date)
    stats_model.last_contribution_date = (
        translation_submitter_total_stats.last_contribution_date)

    suggestion_models.TranslationSubmitterTotalContributionStatsModel.update_timestamps( # pylint: disable=line-too-long
        stats_model,
        update_last_updated_time=True)
    suggestion_models.TranslationSubmitterTotalContributionStatsModel.put(
        stats_model)


def _update_translation_reviewer_total_stats_models(
    translation_reviewer_total_stat:
        suggestion_registry.TranslationReviewerTotalContributionStats
) -> None:
    """Updates TranslationReviewerTotalContributionStats
    models for given translation review stats.

    Args:
        translation_reviewer_total_stat:
            TranslationReviewerTotalContributionStats.
            TranslationReviewerTotalContributionStats domain object.
    """

    stats_model = suggestion_models.TranslationReviewerTotalContributionStatsModel.get( # pylint: disable=line-too-long
        translation_reviewer_total_stat.language_code,
        translation_reviewer_total_stat.contributor_id)

    # We assert here because we are calling this method only when the model
    # exists. If model doesn't exist we create a new model in
    # update_translation_review_stats.
    assert stats_model is not None
    stats_model.topic_ids_with_translation_reviews = (
        translation_reviewer_total_stat.topic_ids_with_translation_reviews)
    stats_model.reviewed_translations_count = (
        translation_reviewer_total_stat.reviewed_translations_count)
    stats_model.accepted_translations_count = (
        translation_reviewer_total_stat.accepted_translations_count)
    stats_model.accepted_translations_with_reviewer_edits_count = (
        translation_reviewer_total_stat
        .accepted_translations_with_reviewer_edits_count)
    stats_model.accepted_translation_word_count = (
        translation_reviewer_total_stat.accepted_translation_word_count)
    stats_model.rejected_translations_count = (
        translation_reviewer_total_stat.rejected_translations_count)
    stats_model.first_contribution_date = (
        translation_reviewer_total_stat.first_contribution_date)
    stats_model.last_contribution_date = (
        translation_reviewer_total_stat.last_contribution_date)

    suggestion_models.TranslationReviewerTotalContributionStatsModel.update_timestamps( # pylint: disable=line-too-long
        stats_model,
        update_last_updated_time=True)
    suggestion_models.TranslationReviewerTotalContributionStatsModel.put(
        stats_model)


def _update_question_submitter_total_stats_models(
    question_submitter_total_stats:
        suggestion_registry.QuestionSubmitterTotalContributionStats
) -> None:
    """Updates QuestionSubmitterTotalContributionStatsModel for given question
    contribution stats.

    Args:
        question_submitter_total_stats: QuestionSubmitterTotalContributionStats.
            A QuestionSubmitterTotalContributionStats domain object.
    """
    stats_model = suggestion_models.QuestionSubmitterTotalContributionStatsModel.get( # pylint: disable=line-too-long
            question_submitter_total_stats.contributor_id)
    stats_model.topic_ids_with_question_submissions = (
        question_submitter_total_stats.topic_ids_with_question_submissions)
    stats_model.recent_review_outcomes = (
        question_submitter_total_stats.recent_review_outcomes)
    stats_model.recent_performance = (
        question_submitter_total_stats.recent_performance)
    stats_model.overall_accuracy = (
        question_submitter_total_stats.overall_accuracy)
    stats_model.submitted_questions_count = (
        question_submitter_total_stats.submitted_questions_count)
    stats_model.accepted_questions_count = (
        question_submitter_total_stats.accepted_questions_count)
    stats_model.accepted_questions_without_reviewer_edits_count = (
        question_submitter_total_stats
        .accepted_questions_without_reviewer_edits_count)
    stats_model.rejected_questions_count = (
        question_submitter_total_stats.rejected_questions_count)
    stats_model.first_contribution_date = (
        question_submitter_total_stats.first_contribution_date)
    stats_model.last_contribution_date = (
        question_submitter_total_stats.last_contribution_date)

    suggestion_models.QuestionSubmitterTotalContributionStatsModel.update_timestamps( # pylint: disable=line-too-long
        stats_model,
        update_last_updated_time=True)
    suggestion_models.QuestionSubmitterTotalContributionStatsModel.put(
        stats_model)


def _update_question_reviewer_total_stats_models(
    question_reviewer_total_stats:
        suggestion_registry.QuestionReviewerTotalContributionStats
) -> None:
    """Updates QuestionReviewerTotalContributionStatsModel for given question
    contribution stats.

    Args:
        question_reviewer_total_stats: QuestionReviewerTotalContributionStats.
            A QuestionreviewerTotalContributionStats domain object.
    """
    stats_model = suggestion_models.QuestionReviewerTotalContributionStatsModel.get( # pylint: disable=line-too-long
            question_reviewer_total_stats.contributor_id)
    stats_model.topic_ids_with_question_reviews = (
        question_reviewer_total_stats.topic_ids_with_question_reviews)
    stats_model.reviewed_questions_count = (
        question_reviewer_total_stats.reviewed_questions_count)
    stats_model.accepted_questions_count = (
        question_reviewer_total_stats.accepted_questions_count)
    stats_model.accepted_questions_with_reviewer_edits_count = (
        question_reviewer_total_stats
        .accepted_questions_with_reviewer_edits_count)
    stats_model.rejected_questions_count = (
        question_reviewer_total_stats.rejected_questions_count)
    stats_model.first_contribution_date = (
        question_reviewer_total_stats.first_contribution_date)
    stats_model.last_contribution_date = (
        question_reviewer_total_stats.last_contribution_date)

    suggestion_models.QuestionReviewerTotalContributionStatsModel.update_timestamps( # pylint: disable=line-too-long
        stats_model,
        update_last_updated_time=True)
    suggestion_models.QuestionReviewerTotalContributionStatsModel.put(
        stats_model)


def update_translation_contribution_stats_at_submission(
    suggestion: suggestion_registry.BaseSuggestion
) -> None:
    """Creates/updates TranslationContributionStatsModel and
    TranslationSubmitterTotalContributionStatsModel model for
    given translation submitter when a translation is submitted.

    Args:
        suggestion: Suggestion. The suggestion domain object that is being
            submitted.
    """
    content_word_count = 0
    exp_opportunity = (
        opportunity_services.get_exploration_opportunity_summary_by_id(
            suggestion.target_id))
    # We can confirm that exp_opportunity will not be None since there should
    # be an assigned opportunity for a given translation. Hence we can rule out
    # the possibility of None for mypy type checking.
    assert exp_opportunity is not None
    topic_id = exp_opportunity.topic_id

    if isinstance(suggestion.change_cmd.translation_html, list):
        for content in suggestion.change_cmd.translation_html:
            content_plain_text = html_cleaner.strip_html_tags(content)
            content_word_count += len(content_plain_text.split())
    else:
        content_plain_text = html_cleaner.strip_html_tags(
            suggestion.change_cmd.translation_html)
        content_word_count = len(content_plain_text.split())

    translation_contribution_stat_model = (
        suggestion_models.TranslationContributionStatsModel.get(
            suggestion.change_cmd.language_code, suggestion.author_id, topic_id
        ))

    translation_submitter_total_stat_model = (
        suggestion_models.TranslationSubmitterTotalContributionStatsModel.get(
            suggestion.change_cmd.language_code, suggestion.author_id
        )
    )

    if translation_submitter_total_stat_model is None:
        suggestion_models.TranslationSubmitterTotalContributionStatsModel.create( # pylint: disable=line-too-long
            language_code=suggestion.change_cmd.language_code,
            contributor_id=suggestion.author_id,
            topic_ids_with_translation_submissions=[topic_id],
            recent_review_outcomes=[],
            recent_performance=0,
            overall_accuracy=0.0,
            submitted_translations_count=1,
            submitted_translation_word_count=content_word_count,
            accepted_translations_count=0,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=0,
            rejected_translations_count=0,
            rejected_translation_word_count=0,
            first_contribution_date=suggestion.last_updated.date(),
            last_contribution_date=suggestion.last_updated.date()
        )
    else:
        translation_submitter_total_stat = (
            contribution_stats_services
            .get_translation_submitter_total_stats_from_model(
                translation_submitter_total_stat_model
             )
         )

        if topic_id not in (
            translation_submitter_total_stat
            .topic_ids_with_translation_submissions):
            (
                translation_submitter_total_stat
                .topic_ids_with_translation_submissions).append(topic_id)
        translation_submitter_total_stat.submitted_translations_count += 1
        translation_submitter_total_stat.submitted_translation_word_count += (
            content_word_count)
        translation_submitter_total_stat.last_contribution_date = (
            suggestion.last_updated.date())

        _update_translation_submitter_total_stats_model(
            translation_submitter_total_stat)

    if translation_contribution_stat_model is None:
        suggestion_models.TranslationContributionStatsModel.create(
            language_code=suggestion.change_cmd.language_code,
            contributor_user_id=suggestion.author_id,
            topic_id=topic_id,
            submitted_translations_count=1,
            submitted_translation_word_count=content_word_count,
            accepted_translations_count=0,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=0,
            rejected_translations_count=0,
            rejected_translation_word_count=0,
            contribution_dates=[suggestion.last_updated.date()]
        )
    else:
        translation_contribution_stat = (
            create_translation_contribution_stats_from_model(
                translation_contribution_stat_model))

        translation_contribution_stat.submitted_translations_count += 1
        translation_contribution_stat.submitted_translation_word_count += (
            content_word_count)
        translation_contribution_stat.contribution_dates.add(
            suggestion.last_updated.date())

        _update_translation_contribution_stats_models(
            [translation_contribution_stat])


def create_stats_for_new_translation_models(
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool,
    content_word_count: int
) -> Tuple[int, int, int, int, int, List[str], int, float]:
    """Creates stats data to be used to create a new
    TranslationContributionStatsModel and
    TranslationSubmitterTotalContributionStatsModel.

    Args:
        suggestion_is_accepted: bool. Whether the suggestion is
            accepted or rejected.
        edited_by_reviewer: bool. If the suggestion is accepted with
            reviewers edits.
        content_word_count: int. Word count of the suggestion.

    Returns:
        tuple[int, int, int, int, int, list[str], int, float]. A tuple
        consisting of the stats data required to create a new model.
    """
    accepted_translations_count = 0
    accepted_translation_word_count = 0
    rejected_translations_count = 0
    rejected_translation_word_count = 0
    accepted_translations_without_reviewer_edits_count = 0

    if suggestion_is_accepted:
        accepted_translations_count += 1
        accepted_translation_word_count += content_word_count
        recent_review_outcomes = [
            suggestion_models.REVIEW_OUTCOME_ACCEPTED_WITH_EDITS]
        recent_performance = 1
        overall_accuracy = 100.0
    else:
        rejected_translations_count += 1
        rejected_translation_word_count += content_word_count
        recent_review_outcomes = [
            suggestion_models.REVIEW_OUTCOME_REJECTED]
        recent_performance = -2
        overall_accuracy = 0.0
    if suggestion_is_accepted and not edited_by_reviewer:
        accepted_translations_without_reviewer_edits_count += 1
        recent_review_outcomes = [
            suggestion_models.REVIEW_OUTCOME_ACCEPTED]

    return (
        accepted_translations_count,
        accepted_translation_word_count,
        rejected_translations_count,
        rejected_translation_word_count,
        accepted_translations_without_reviewer_edits_count,
        recent_review_outcomes,
        recent_performance,
        overall_accuracy
    )


def update_translation_contribution_stats_at_review(
    suggestion: suggestion_registry.BaseSuggestion
) -> None:
    """Creates/updates TranslationContributionStatsModel and
    TranslationSubmitterTotalContributionStatsModel model for
    given translation submitter when a translation is reviewed.

    Args:
        suggestion: Suggestion. The suggestion domain object that is being
            reviewed.
    """
    content_word_count = 0
    exp_opportunity = (
        opportunity_services.get_exploration_opportunity_summary_by_id(
            suggestion.target_id))
    # We can confirm that exp_opportunity will not be None since there should
    # be an assigned opportunity for a given translation. Hence we can rule out
    # the possibility of None for mypy type checking.
    assert exp_opportunity is not None
    topic_id = exp_opportunity.topic_id

    if isinstance(suggestion.change_cmd.translation_html, list):
        for content in suggestion.change_cmd.translation_html:
            content_plain_text = html_cleaner.strip_html_tags(content)
            content_word_count += len(content_plain_text.split())
    else:
        content_plain_text = html_cleaner.strip_html_tags(
            suggestion.change_cmd.translation_html)
        content_word_count = len(content_plain_text.split())

    suggestion_is_accepted = (
        suggestion.status == suggestion_models.STATUS_ACCEPTED
    )

    translation_contribution_stat_model = (
        suggestion_models.TranslationContributionStatsModel.get(
            suggestion.change_cmd.language_code, suggestion.author_id, topic_id
        ))

    translation_submitter_total_stat_model = (
        suggestion_models.TranslationSubmitterTotalContributionStatsModel.get(
            suggestion.change_cmd.language_code, suggestion.author_id
        ))

    if translation_submitter_total_stat_model is None:
        (
            accepted_translations_count,
            accepted_translation_word_count,
            rejected_translations_count,
            rejected_translation_word_count,
            accepted_translations_without_reviewer_edits_count,
            recent_review_outcomes,
            recent_performance,
            overall_accuracy
        ) = create_stats_for_new_translation_models(
            suggestion_is_accepted,
            suggestion.edited_by_reviewer,
            content_word_count)
        suggestion_models.TranslationSubmitterTotalContributionStatsModel.create( # pylint: disable=line-too-long
            language_code=suggestion.change_cmd.language_code,
            contributor_id=suggestion.author_id,
            topic_ids_with_translation_submissions=[topic_id],
            recent_review_outcomes=recent_review_outcomes,
            recent_performance=recent_performance,
            overall_accuracy=overall_accuracy,
            submitted_translations_count=1,
            submitted_translation_word_count=content_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_without_reviewer_edits_count=(
                accepted_translations_without_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translations_count,
            rejected_translation_word_count=rejected_translation_word_count,
            first_contribution_date=suggestion.last_updated.date(),
            last_contribution_date=suggestion.last_updated.date()
        )
    else:
        translation_submitter_total_stat = (
            contribution_stats_services
            .get_translation_submitter_total_stats_from_model(
                translation_submitter_total_stat_model)
        )

        if topic_id not in (
            translation_submitter_total_stat
            .topic_ids_with_translation_submissions):
            (
                translation_submitter_total_stat
                .topic_ids_with_translation_submissions).append(topic_id)

        increment_translation_submitter_total_stats_at_review(
            translation_submitter_total_stat, content_word_count,
            suggestion_is_accepted, suggestion.edited_by_reviewer)
        _update_translation_submitter_total_stats_model(
            translation_submitter_total_stat)

    if translation_contribution_stat_model is None:
        (
            accepted_translations_count,
            accepted_translation_word_count,
            rejected_translations_count,
            rejected_translation_word_count,
            accepted_translations_without_reviewer_edits_count,
            recent_review_outcomes,
            recent_performance,
            overall_accuracy
        ) = create_stats_for_new_translation_models(
            suggestion_is_accepted,
            suggestion.edited_by_reviewer,
            content_word_count)
        suggestion_models.TranslationContributionStatsModel.create(
            language_code=suggestion.change_cmd.language_code,
            contributor_user_id=suggestion.author_id,
            topic_id=topic_id,
            submitted_translations_count=1,
            submitted_translation_word_count=content_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_without_reviewer_edits_count=(
                accepted_translations_without_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translations_count,
            rejected_translation_word_count=rejected_translation_word_count,
            contribution_dates=[suggestion.last_updated.date()]
        )
    else:
        translation_contribution_stat = (
            create_translation_contribution_stats_from_model(
                translation_contribution_stat_model))

        increment_translation_contribution_stats_at_review(
            translation_contribution_stat, content_word_count,
            suggestion_is_accepted, suggestion.edited_by_reviewer)
        _update_translation_contribution_stats_models(
            [translation_contribution_stat])


def update_translation_review_stats(
    suggestion: suggestion_registry.BaseSuggestion
) -> None:
    """Creates/updates TranslationReviewStatsModel
    TranslationReviewerTotalContributionStatsModel model for given translation
    reviewer when a translation is reviewed.

    Args:
        suggestion: Suggestion. The suggestion domain object that is being
            reviewed.

    Raises:
        Exception. The final_reviewer_id of the suggestion should not be None.
    """
    content_word_count = 0
    if suggestion.final_reviewer_id is None:
        raise Exception(
            'The final_reviewer_id in the suggestion should not be None.'
        )
    exp_opportunity = (
        opportunity_services.get_exploration_opportunity_summary_by_id(
            suggestion.target_id))
    # We can confirm that exp_opportunity will not be None since there should
    # be an assigned opportunity for a given translation. Hence we can rule out
    # the possibility of None for mypy type checking.
    assert exp_opportunity is not None
    topic_id = exp_opportunity.topic_id
    suggestion_is_accepted = (
        suggestion.status == suggestion_models.STATUS_ACCEPTED
    )

    if isinstance(suggestion.change_cmd.translation_html, list):
        for content in suggestion.change_cmd.translation_html:
            content_plain_text = html_cleaner.strip_html_tags(content)
            content_word_count += len(content_plain_text.split())
    else:
        content_plain_text = html_cleaner.strip_html_tags(
            suggestion.change_cmd.translation_html)
        content_word_count = len(content_plain_text.split())

    translation_review_stat_model = (
        # This function is called when reviewing a translation and hence
        # final_reviewer_id should not be None when the suggestion is
        # up-to-date.
        suggestion_models.TranslationReviewStatsModel.get(
            suggestion.change_cmd.language_code, suggestion.final_reviewer_id,
            topic_id
        ))

    translation_reviewer_total_stat_model = (
        suggestion_models.TranslationReviewerTotalContributionStatsModel.get(
            suggestion.change_cmd.language_code, suggestion.final_reviewer_id
        ))

    if translation_reviewer_total_stat_model is None:
        # This function is called when reviewing a translation and hence
        # final_reviewer_id should not be None when the suggestion is
        # up-to-date.
        accepted_translations_count = 0
        accepted_translations_with_reviewer_edits_count = 0
        rejected_translation_count = 0
        accepted_translation_word_count = 0
        if suggestion_is_accepted:
            accepted_translations_count += 1
            accepted_translation_word_count = content_word_count
        else:
            rejected_translation_count += 1
        if suggestion_is_accepted and suggestion.edited_by_reviewer:
            accepted_translations_with_reviewer_edits_count += 1
        suggestion_models.TranslationReviewerTotalContributionStatsModel.create(
            language_code=suggestion.change_cmd.language_code,
            contributor_id=suggestion.final_reviewer_id,
            topic_ids_with_translation_reviews=[topic_id],
            reviewed_translations_count=1,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_with_reviewer_edits_count=(
                accepted_translations_with_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translation_count,
            first_contribution_date=suggestion.last_updated.date(),
            last_contribution_date=suggestion.last_updated.date()
        )
    else:
        translation_reviewer_total_stat = (
            contribution_stats_services
            .get_translation_reviewer_total_stats_from_model(
                translation_reviewer_total_stat_model))

        if topic_id not in (
            translation_reviewer_total_stat
            .topic_ids_with_translation_reviews):
            (
                translation_reviewer_total_stat
                .topic_ids_with_translation_reviews
            ).append(topic_id)

        increment_translation_reviewer_total_stats(
            translation_reviewer_total_stat, content_word_count,
            suggestion.last_updated, suggestion_is_accepted,
            suggestion.edited_by_reviewer
        )
        _update_translation_reviewer_total_stats_models(
            translation_reviewer_total_stat)

    if translation_review_stat_model is None:
        # This function is called when reviewing a translation and hence
        # final_reviewer_id should not be None when the suggestion is
        # up-to-date.
        accepted_translations_count = 0
        accepted_translations_with_reviewer_edits_count = 0
        accepted_translation_word_count = 0
        if suggestion_is_accepted:
            accepted_translations_count += 1
            accepted_translation_word_count = content_word_count
        if suggestion_is_accepted and suggestion.edited_by_reviewer:
            accepted_translations_with_reviewer_edits_count += 1
        suggestion_models.TranslationReviewStatsModel.create(
            language_code=suggestion.change_cmd.language_code,
            reviewer_user_id=suggestion.final_reviewer_id,
            topic_id=topic_id,
            reviewed_translations_count=1,
            reviewed_translation_word_count=content_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_with_reviewer_edits_count=(
                accepted_translations_with_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            first_contribution_date=suggestion.last_updated.date(),
            last_contribution_date=suggestion.last_updated.date()
        )
    else:
        translation_review_stat = (
            _create_translation_review_stats_from_model(
                translation_review_stat_model))

        increment_translation_review_stats(
            translation_review_stat, content_word_count,
            suggestion.last_updated, suggestion_is_accepted,
            suggestion.edited_by_reviewer
        )
        _update_translation_review_stats_models([translation_review_stat])

    update_translation_contribution_stats_at_review(suggestion)


def update_question_contribution_stats_at_submission(
    suggestion: suggestion_registry.BaseSuggestion
) -> None:
    """Creates/updates QuestionContributionStatsModel and
    QuestionSubmitterTotalContributionStatsModel models for given question
    submitter when a question is submitted.

    Args:
        suggestion: Suggestion. The suggestion domain object that is being
            submitted.
    """
    for topic in skill_services.get_all_topic_assignments_for_skill(
        suggestion.target_id):
        question_contribution_stat_model = (
            suggestion_models.QuestionContributionStatsModel.get(
                suggestion.author_id, topic.topic_id
            ))

        if question_contribution_stat_model is None:
            suggestion_models.QuestionContributionStatsModel.create(
                contributor_user_id=suggestion.author_id,
                topic_id=topic.topic_id,
                submitted_questions_count=1,
                accepted_questions_count=0,
                accepted_questions_without_reviewer_edits_count=0,
                first_contribution_date=suggestion.last_updated.date(),
                last_contribution_date=suggestion.last_updated.date()
            )
            continue

        question_contribution_stat = (
            _create_question_contribution_stats_from_model(
                question_contribution_stat_model))

        question_contribution_stat.submitted_questions_count += 1
        question_contribution_stat.last_contribution_date = (
            suggestion.last_updated.date())
        _update_question_contribution_stats_models(
            [question_contribution_stat])

    for topic in skill_services.get_all_topic_assignments_for_skill(
        suggestion.target_id):
        question_submitter_total_stat_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                suggestion.author_id
            ))

        if question_submitter_total_stat_model is None:
            suggestion_models.QuestionSubmitterTotalContributionStatsModel.create( # pylint: disable=line-too-long
                contributor_id=suggestion.author_id,
                topic_ids_with_question_submissions=[topic.topic_id],
                recent_review_outcomes=[],
                recent_performance=0,
                overall_accuracy=0.0,
                submitted_questions_count=1,
                accepted_questions_count=0,
                accepted_questions_without_reviewer_edits_count=0,
                rejected_questions_count=0,
                first_contribution_date=suggestion.last_updated.date(),
                last_contribution_date=suggestion.last_updated.date()
            )
            continue

        question_submitter_total_stat = (
            contribution_stats_services
            .get_question_submitter_total_stats_from_model(
                question_submitter_total_stat_model))

        if topic.topic_id not in (
            question_submitter_total_stat
            .topic_ids_with_question_submissions):
            (
                question_submitter_total_stat
                .topic_ids_with_question_submissions
            ).append(topic.topic_id)
        question_submitter_total_stat.submitted_questions_count += 1
        question_submitter_total_stat.last_contribution_date = (
            suggestion.last_updated.date())

        _update_question_submitter_total_stats_models(
            question_submitter_total_stat)


def update_question_contribution_stats_at_review(
    suggestion: suggestion_registry.BaseSuggestion
) -> None:
    """Creates/updates QuestionContributionStatsModel
    QuestionSubmitterTotalContributionStatsModel models for given question
    submitter when a question is reviewed.

    Args:
        suggestion: Suggestion. The suggestion domain object that is being
            reviewed.
    """
    suggestion_is_accepted = (
        suggestion.status == suggestion_models.STATUS_ACCEPTED
    )

    accepted_questions_count = 0
    accepted_questions_without_reviewer_edits_count = 0
    rejected_questions_count = 0
    if suggestion_is_accepted:
        accepted_questions_count += 1
        recent_review_outcomes = [
            suggestion_models.REVIEW_OUTCOME_ACCEPTED_WITH_EDITS]
        recent_performance = 1
        overall_accuracy = 100.0
    else:
        rejected_questions_count += 1
        recent_review_outcomes = [
            suggestion_models.REVIEW_OUTCOME_REJECTED]
        recent_performance = -2
        overall_accuracy = 0.0
    if suggestion_is_accepted and not suggestion.edited_by_reviewer:
        accepted_questions_without_reviewer_edits_count += 1
        recent_review_outcomes = [
            suggestion_models.REVIEW_OUTCOME_ACCEPTED]

    for topic in skill_services.get_all_topic_assignments_for_skill(
        suggestion.target_id):
        question_contribution_stat_model = (
            suggestion_models.QuestionContributionStatsModel.get(
                suggestion.author_id, topic.topic_id
            ))

        if question_contribution_stat_model is None:
            suggestion_models.QuestionContributionStatsModel.create(
                contributor_user_id=suggestion.author_id,
                topic_id=topic.topic_id,
                submitted_questions_count=1,
                accepted_questions_count=accepted_questions_count,
                accepted_questions_without_reviewer_edits_count=(
                    accepted_questions_without_reviewer_edits_count),
                first_contribution_date=suggestion.last_updated.date(),
                last_contribution_date=suggestion.last_updated.date()
            )
            continue

        question_contribution_stat = (
            _create_question_contribution_stats_from_model(
                question_contribution_stat_model))

        if suggestion_is_accepted:
            question_contribution_stat.accepted_questions_count += 1
        if suggestion_is_accepted and not suggestion.edited_by_reviewer:
            (
                question_contribution_stat
                .accepted_questions_without_reviewer_edits_count
            ) += 1
        _update_question_contribution_stats_models(
            [question_contribution_stat])

    for topic in skill_services.get_all_topic_assignments_for_skill(
        suggestion.target_id):
        question_submitter_total_stat_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                suggestion.author_id
            ))

        if question_submitter_total_stat_model is None:
            suggestion_models.QuestionSubmitterTotalContributionStatsModel.create( # pylint: disable=line-too-long
                contributor_id=suggestion.author_id,
                topic_ids_with_question_submissions=[topic.topic_id],
                recent_review_outcomes=recent_review_outcomes,
                recent_performance=recent_performance,
                overall_accuracy=overall_accuracy,
                submitted_questions_count=1,
                accepted_questions_count=accepted_questions_count,
                accepted_questions_without_reviewer_edits_count=(
                    accepted_questions_without_reviewer_edits_count),
                rejected_questions_count=rejected_questions_count,
                first_contribution_date=suggestion.last_updated.date(),
                last_contribution_date=suggestion.last_updated.date()
            )
            continue

        question_submitter_total_stat = (
            contribution_stats_services
            .get_question_submitter_total_stats_from_model(
                question_submitter_total_stat_model))

        increment_question_submitter_total_stats_at_review(
            question_submitter_total_stat,
            suggestion_is_accepted, suggestion.edited_by_reviewer)

        _update_question_submitter_total_stats_models(
            question_submitter_total_stat)


def update_question_review_stats(
    suggestion: suggestion_registry.BaseSuggestion
) -> None:
    """Creates/updates QuestionReviewStatsModel and
    QuestionReviewerTotalContributionStatsModel model for given question
    reviewer when a question is reviewed.

    Args:
        suggestion: Suggestion. The suggestion domain object that is being
            reviewed.

    Raises:
        Exception. The final_reviewer_id of the suggestion should not be None.
    """
    if suggestion.final_reviewer_id is None:
        raise Exception(
            'The final_reviewer_id in the suggestion should not be None.'
        )
    suggestion_is_accepted = (
        suggestion.status == suggestion_models.STATUS_ACCEPTED
    )

    for topic in skill_services.get_all_topic_assignments_for_skill(
        suggestion.target_id):
        question_review_stat_model = (
            # This function is called when reviewing a question suggestion and
            # hence final_reviewer_id should not be None when the suggestion is
            # up-to-date.
            suggestion_models.QuestionReviewStatsModel.get(
                suggestion.final_reviewer_id, topic.topic_id
            ))

        if question_review_stat_model is None:
            # This function is called when reviewing a question suggestion and
            # hence final_reviewer_id should not be None when the suggestion is
            # up-to-date.
            accepted_questions_count = 0
            accepted_questions_with_reviewer_edits_count = 0
            if suggestion_is_accepted:
                accepted_questions_count += 1
            if suggestion_is_accepted and suggestion.edited_by_reviewer:
                accepted_questions_with_reviewer_edits_count += 1
            suggestion_models.QuestionReviewStatsModel.create(
                reviewer_user_id=suggestion.final_reviewer_id,
                topic_id=topic.topic_id,
                reviewed_questions_count=1,
                accepted_questions_count=accepted_questions_count,
                accepted_questions_with_reviewer_edits_count=(
                    accepted_questions_with_reviewer_edits_count),
                first_contribution_date=suggestion.last_updated.date(),
                last_contribution_date=suggestion.last_updated.date()
            )
            continue

        question_review_stat = (
            _create_question_review_stats_from_model(
                question_review_stat_model))

        increment_question_review_stats(
            question_review_stat, suggestion.last_updated,
            suggestion_is_accepted,
            suggestion.edited_by_reviewer)
        _update_question_review_stats_models([question_review_stat])

    for topic in skill_services.get_all_topic_assignments_for_skill(
        suggestion.target_id):
        question_reviewer_total_stat_model = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel
            .get_by_id(
                suggestion.final_reviewer_id
            ))

        if question_reviewer_total_stat_model is None:
            accepted_questions_count = 0
            accepted_questions_with_reviewer_edits_count = 0
            rejected_questions_count = 0
            if suggestion_is_accepted:
                accepted_questions_count += 1
            else:
                rejected_questions_count += 1
            if suggestion_is_accepted and suggestion.edited_by_reviewer:
                accepted_questions_with_reviewer_edits_count += 1
            suggestion_models.QuestionReviewerTotalContributionStatsModel.create( # pylint: disable=line-too-long
                contributor_id=suggestion.final_reviewer_id,
                topic_ids_with_question_reviews=[topic.topic_id],
                reviewed_questions_count=1,
                accepted_questions_count=accepted_questions_count,
                accepted_questions_with_reviewer_edits_count=(
                    accepted_questions_with_reviewer_edits_count),
                rejected_questions_count=rejected_questions_count,
                first_contribution_date=suggestion.last_updated.date(),
                last_contribution_date=suggestion.last_updated.date()
            )
            continue

        question_reviewer_total_stat = (
            contribution_stats_services
            .get_question_reviewer_total_stats_from_model(
                question_reviewer_total_stat_model))

        if topic.topic_id not in (
            question_reviewer_total_stat
            .topic_ids_with_question_reviews):
            (
                question_reviewer_total_stat
                .topic_ids_with_question_reviews
            ).append(topic.topic_id)

        increment_question_reviewer_total_stats(
            question_reviewer_total_stat, suggestion.last_updated,
            suggestion_is_accepted,
            suggestion.edited_by_reviewer)
        _update_question_reviewer_total_stats_models(
            question_reviewer_total_stat)

    update_question_contribution_stats_at_review(suggestion)


def increment_translation_contribution_stats_at_review(
    translation_contribution_stat: (
        suggestion_registry.TranslationContributionStats),
    content_word_count: int,
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool
) -> None:
    """Updates TranslationContributionStats object.

    Args:
        translation_contribution_stat: TranslationContributionStats. The stats
            object to update.
        content_word_count: int. The number of words in the translation.
        suggestion_is_accepted: bool. A flag that indicates whether the
            suggestion is accepted.
        edited_by_reviewer: bool. A flag that indicates whether the suggestion
            is edited by the reviewer.
    """
    if suggestion_is_accepted:
        translation_contribution_stat.accepted_translations_count += 1
        translation_contribution_stat.accepted_translation_word_count += (
            content_word_count)
    else:
        translation_contribution_stat.rejected_translations_count += 1
        translation_contribution_stat.rejected_translation_word_count += (
            content_word_count)
    if suggestion_is_accepted and not edited_by_reviewer:
        translation_contribution_stat.accepted_translations_without_reviewer_edits_count += 1 # pylint: disable=line-too-long


def increment_translation_review_stats(
    translation_review_stat: suggestion_registry.TranslationReviewStats,
    content_word_count: int,
    last_contribution_date: datetime.datetime,
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool
) -> None:
    """Updates TranslationReviewStats object.

    Args:
        translation_review_stat: TranslationReviewStats. The stats
            object to update.
        content_word_count: int. The number of words in the translation.
        last_contribution_date: datetime.datetime. The last updated date.
        suggestion_is_accepted: bool. A flag that indicates whether the
            suggestion is accepted.
        edited_by_reviewer: bool. A flag that indicates whether the suggestion
            is edited by the reviewer.
    """
    translation_review_stat.reviewed_translations_count += 1
    translation_review_stat.reviewed_translation_word_count += (
        content_word_count)
    if suggestion_is_accepted:
        translation_review_stat.accepted_translations_count += 1
        translation_review_stat.accepted_translation_word_count += (
            content_word_count)
    if suggestion_is_accepted and edited_by_reviewer:
        (
            translation_review_stat
            .accepted_translations_with_reviewer_edits_count
        ) += 1
    translation_review_stat.last_contribution_date = (
        last_contribution_date.date())


def increment_question_review_stats(
    question_review_stat: suggestion_registry.QuestionReviewStats,
    last_contribution_date: datetime.datetime,
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool
) -> None:
    """Updates QuestionReviewStats object.

    Args:
        question_review_stat: QuestionReviewStats. The stats object to update.
        last_contribution_date: datetime.datetime. The last updated date.
        suggestion_is_accepted: bool. A flag that indicates whether the
            suggestion is accepted.
        edited_by_reviewer: bool. A flag that indicates whether the suggestion
            is edited by the reviewer.
    """
    question_review_stat.reviewed_questions_count += 1
    if suggestion_is_accepted:
        question_review_stat.accepted_questions_count += 1
    if suggestion_is_accepted and edited_by_reviewer:
        question_review_stat.accepted_questions_with_reviewer_edits_count += 1
    question_review_stat.last_contribution_date = (
        last_contribution_date.date())


def increment_translation_submitter_total_stats_at_review(
    translation_submitter_total_stat: (
        suggestion_registry.TranslationSubmitterTotalContributionStats),
    content_word_count: int,
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool
) -> None:
    """Updates TranslationSubmitterTotalContributionStats object.

    Args:
        translation_submitter_total_stat:
            TranslationSubmitterTotalContributionStats. The stats object to
            update.
        content_word_count: int. The number of words in the translation.
        suggestion_is_accepted: bool. A flag that indicates whether the
            suggestion is accepted.
        edited_by_reviewer: bool. A flag that indicates whether the suggestion
            is edited by the reviewer.
    """
    # Weights for calculating performance.
    # recent_performance = accepted cards - 2 (rejected cards) in last
    # 100 contributions.
    if suggestion_is_accepted:
        translation_submitter_total_stat.accepted_translations_count += 1
        translation_submitter_total_stat.accepted_translation_word_count += (
            content_word_count)
        translation_submitter_total_stat.overall_accuracy = round((
            translation_submitter_total_stat.accepted_translations_count
            / translation_submitter_total_stat.submitted_translations_count
        ), 3) * 100

        if (
                len(translation_submitter_total_stat
                    .recent_review_outcomes)
                >= RECENT_REVIEW_OUTCOMES_LIMIT
            ):
            oldest_outcome = (
                translation_submitter_total_stat
                .recent_review_outcomes).pop(0)
            if oldest_outcome == suggestion_models.REVIEW_OUTCOME_REJECTED:
                translation_submitter_total_stat.recent_performance += 3
        else:
            translation_submitter_total_stat.recent_performance += 1

        translation_submitter_total_stat.recent_review_outcomes.append(
            suggestion_models.REVIEW_OUTCOME_ACCEPTED_WITH_EDITS)

    else:
        translation_submitter_total_stat.rejected_translations_count += 1
        translation_submitter_total_stat.rejected_translation_word_count += (
            content_word_count)

        if (
                len(translation_submitter_total_stat
                    .recent_review_outcomes)
                >= RECENT_REVIEW_OUTCOMES_LIMIT
            ):
            oldest_outcome = (
                translation_submitter_total_stat
                .recent_review_outcomes).pop(0)
            if oldest_outcome != suggestion_models.REVIEW_OUTCOME_REJECTED:
                translation_submitter_total_stat.recent_performance -= 3
        else:
            translation_submitter_total_stat.recent_performance -= 2

        translation_submitter_total_stat.recent_review_outcomes.append(
            suggestion_models.REVIEW_OUTCOME_REJECTED)

    if suggestion_is_accepted and not edited_by_reviewer:
        translation_submitter_total_stat.accepted_translations_without_reviewer_edits_count += 1 # pylint: disable=line-too-long
        (
            translation_submitter_total_stat
            .recent_review_outcomes
        ).pop()
        translation_submitter_total_stat.recent_review_outcomes.append(
            suggestion_models.REVIEW_OUTCOME_ACCEPTED)


def increment_translation_reviewer_total_stats(
    translation_reviewer_total_stat:
        suggestion_registry.TranslationReviewerTotalContributionStats,
    content_word_count: int,
    last_contribution_date: datetime.datetime,
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool
) -> None:
    """Updates TranslationReviewerTotalContributionStats object.

    Args:
        translation_reviewer_total_stat:
            TranslationReviewerTotalContributionStats. The stats object to
            update.
        content_word_count: int. The number of words in the translation.
        last_contribution_date: datetime.datetime. The last updated date.
        suggestion_is_accepted: bool. A flag that indicates whether the
            suggestion is accepted.
        edited_by_reviewer: bool. A flag that indicates whether the suggestion
            is edited by the reviewer.
    """
    translation_reviewer_total_stat.reviewed_translations_count += 1
    if suggestion_is_accepted:
        translation_reviewer_total_stat.accepted_translations_count += 1
        translation_reviewer_total_stat.accepted_translation_word_count += (
            content_word_count)
    else:
        translation_reviewer_total_stat.rejected_translations_count += 1
    if suggestion_is_accepted and edited_by_reviewer:
        (
            translation_reviewer_total_stat
            .accepted_translations_with_reviewer_edits_count
        ) += 1
    translation_reviewer_total_stat.last_contribution_date = (
        last_contribution_date.date())


def increment_question_submitter_total_stats_at_review(
    question_submitter_total_stat: (
        suggestion_registry.QuestionSubmitterTotalContributionStats),
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool
) -> None:
    """Updates QuestionSubmitterTotalContributionStats object.

    Args:
        question_submitter_total_stat:
            QuestionSubmitterTotalContributionStats. The stats object to
            update.
        suggestion_is_accepted: bool. A flag that indicates whether the
            suggestion is accepted.
        edited_by_reviewer: bool. A flag that indicates whether the suggestion
            is edited by the reviewer.
    """
    # Weights for calculating performance.
    # recent_performance = accepted cards - 2 (rejected cards) in last
    # 100 contributions.
    if suggestion_is_accepted:
        question_submitter_total_stat.accepted_questions_count += 1
        question_submitter_total_stat.overall_accuracy = round((
            question_submitter_total_stat.accepted_questions_count
            / question_submitter_total_stat.submitted_questions_count
        ), 3) * 100

        if (
                len(question_submitter_total_stat
                    .recent_review_outcomes)
                >= RECENT_REVIEW_OUTCOMES_LIMIT
            ):
            oldest_outcome = (
                question_submitter_total_stat
                .recent_review_outcomes).pop(0)
            if oldest_outcome == suggestion_models.REVIEW_OUTCOME_REJECTED:
                question_submitter_total_stat.recent_performance += 3
        else:
            question_submitter_total_stat.recent_performance += 1

        question_submitter_total_stat.recent_review_outcomes.append(
            suggestion_models.REVIEW_OUTCOME_ACCEPTED_WITH_EDITS)

    else:
        question_submitter_total_stat.rejected_questions_count += 1

        if (
                len(question_submitter_total_stat
                    .recent_review_outcomes)
                >= RECENT_REVIEW_OUTCOMES_LIMIT
            ):
            oldest_outcome = (
                question_submitter_total_stat
                .recent_review_outcomes).pop(0)
            if oldest_outcome != suggestion_models.REVIEW_OUTCOME_REJECTED:
                question_submitter_total_stat.recent_performance -= 3
        else:
            question_submitter_total_stat.recent_performance -= 2

        question_submitter_total_stat.recent_review_outcomes.append(
            suggestion_models.REVIEW_OUTCOME_REJECTED)

    if suggestion_is_accepted and not edited_by_reviewer:
        question_submitter_total_stat.accepted_questions_without_reviewer_edits_count += 1 # pylint: disable=line-too-long
        (question_submitter_total_stat.recent_review_outcomes).pop()
        (question_submitter_total_stat.recent_review_outcomes).append(
            suggestion_models.REVIEW_OUTCOME_ACCEPTED)


def increment_question_reviewer_total_stats(
    question_reviewer_total_stat:
        suggestion_registry.QuestionReviewerTotalContributionStats,
    last_contribution_date: datetime.datetime,
    suggestion_is_accepted: bool,
    edited_by_reviewer: bool
) -> None:
    """Updates QuestionReviewerTotalContributionStats object.

    Args:
        question_reviewer_total_stat: QuestionReviewerTotalContributionStats.
            The stats object to update.
        last_contribution_date: datetime.datetime. The last updated date.
        suggestion_is_accepted: bool. A flag that indicates whether the
            suggestion is accepted.
        edited_by_reviewer: bool. A flag that indicates whether the suggestion
            is edited by the reviewer.
    """
    question_reviewer_total_stat.reviewed_questions_count += 1
    if suggestion_is_accepted:
        question_reviewer_total_stat.accepted_questions_count += 1
    else:
        question_reviewer_total_stat.rejected_questions_count += 1
    if suggestion_is_accepted and edited_by_reviewer:
        (
            question_reviewer_total_stat
            .accepted_questions_with_reviewer_edits_count) += 1
    question_reviewer_total_stat.last_contribution_date = (
        last_contribution_date.date())


def enqueue_contributor_ranking_notification_email_task(
    contributor_user_id: str, contribution_type: str,
    contribution_sub_type: str, language_code: str, rank_name: str,
) -> None:
    """Adds a 'send feedback email' (instant) task into the task queue.

    Args:
        contributor_user_id: str. The ID of the contributor.
        contribution_type: str. The type of the contribution i.e.
            translation or question.
        contribution_sub_type: str. The sub type of the contribution
            i.e. submissions/acceptances/reviews/edits.
        language_code: str. The language code of the suggestion.
        rank_name: str. The name of the rank that the contributor achieved.

    Raises:
        Exception. The contribution type must be offered on the Contributor
            Dashboard.
        Exception. The contribution subtype must be offered on the Contributor
            Dashboard.
    """
    # contributor_user_id is alrerady validated in the controller layer.
    # TODO(#16062): Rank name should be valid to send notification emails.
    if language_code not in [language['id'] for language in (
            constants.SUPPORTED_AUDIO_LANGUAGES)]:
        raise Exception(
            'Not supported language code: %s' % language_code)
    if contribution_type not in [
        feconf.CONTRIBUTION_TYPE_TRANSLATION,
        feconf.CONTRIBUTION_TYPE_QUESTION
    ]:
        raise Exception(
            'Invalid contribution type: %s' % contribution_type)
    if contribution_sub_type not in [
        feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE,
        feconf.CONTRIBUTION_SUBTYPE_REVIEW,
        feconf.CONTRIBUTION_SUBTYPE_EDIT,
    ]:
        raise Exception(
            'Invalid contribution subtype: %s' % contribution_sub_type)

    payload = {
        'contributor_user_id': contributor_user_id,
        'contribution_type': contribution_type,
        'contribution_sub_type': contribution_sub_type,
        'language_code': language_code,
        'rank_name': rank_name,
    }

    taskqueue_services.enqueue_task(
        feconf.TASK_URL_CONTRIBUTOR_DASHBOARD_ACHIEVEMENT_NOTIFICATION_EMAILS,
        payload, 0)


def generate_contributor_certificate_data(
    username: str,
    suggestion_type: str,
    language_code: Optional[str],
    from_date: datetime.datetime,
    to_date: datetime.datetime
) -> suggestion_registry.ContributorCertificateInfoDict:
    """Returns data to generate the certificate.

    Args:
        username: str. The username of the contributor.
        language_code: str|None. The language for which the contributions should
            be considered.
        suggestion_type: str. The type of suggestion that the certificate
            needs to generate.
        from_date: datetime.datetime. The start of the date range for which the
            contributions were created.
        to_date: datetime.datetime. The end of the date range for which the
            contributions were created.

    Returns:
        ContributorCertificateInfoDict. Data to generate the certificate.

    Raises:
        Exception. The suggestion type is invalid.
        Exception. There is no user for the given username.
    """
    user_id = user_services.get_user_id_from_username(username)
    if user_id is None:
        raise Exception('There is no user for the given username.')

    if suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT:
        # For the suggestion_type translate_content, there should be a
        # corresponding language_code.
        assert isinstance(language_code, str)
        data = _generate_translation_contributor_certificate_data(
            language_code, from_date, to_date, user_id)

    elif suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION:
        data = _generate_question_contributor_certificate_data(
            from_date, to_date, user_id)

    else:
        raise Exception('The suggestion type is invalid.')

    return data.to_dict()


def _generate_translation_contributor_certificate_data(
    language_code: str,
    from_date: datetime.datetime,
    to_date: datetime.datetime,
    user_id: str
) -> suggestion_registry.ContributorCertificateInfo:
    """Returns data to generate translation submitter certificate.

    Args:
        language_code: str. The language for which the contributions should
            be considered.
        from_date: datetime.datetime. The start of the date range for which
            the contributions were created.
        to_date: datetime.datetime. The end of the date range for which
            the contributions were created.
        user_id: str. The user ID of the contributor.

    Returns:
        ContributorCertificateInfo. Data to generate translation submitter
        certificate.

    Raises:
        Exception. The language is invalid.
    """
    signature = feconf.TRANSLATION_TEAM_LEAD

    # Adds one date to the to_date to make sure the contributions within
    # the to_date are also counted for the certificate.
    to_date_to_fetch_contributions = to_date + datetime.timedelta(days=1)

    language = next(filter(
        lambda lang: lang['id'] == language_code,
        constants.SUPPORTED_AUDIO_LANGUAGES), None)
    if language is None:
        raise Exception('The provided language is invalid.')
    language_description = language['description']
    if ' (' in language_description:
        language_description = language_description[
            language_description.find('(') + 1:language_description.find(')')]

    suggestions = (
        suggestion_models.GeneralSuggestionModel
        .get_translation_suggestions_submitted_within_given_dates(
            from_date,
            to_date_to_fetch_contributions,
            user_id,
            language_code
        )
    )

    words_count = 0
    for model in suggestions:
        suggestion = get_suggestion_from_model(model)
        suggestion_change = suggestion.change_cmd
        data_is_list = (
            translation_domain.TranslatableContentFormat
            .is_data_format_list(suggestion_change.data_format)
        )
        if (
                suggestion_change.cmd == 'add_written_translation' and
                data_is_list
        ):
            words_count += sum(
                len(item.split()) for item in suggestion_change.translation_html
            )
        else:
            # Retrieve the html content that is emphasized on the
            # Contributor Dashboard pages. This content is what stands
            # out for each suggestion when a user views a list of
            # suggestions.
            get_html_representing_suggestion = (
                SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS[
                    suggestion.suggestion_type]
            )
            plain_text = _get_plain_text_from_html_content_string(
                get_html_representing_suggestion(suggestion))

            words = plain_text.split(' ')
            words_without_empty_strings = [
                word for word in words if word != '']
            words_count += len(words_without_empty_strings)
    # Go to the below link for more information about how we count hours
    # contributed.# Goto the below link for more information.
    # https://docs.google.com/spreadsheets/d/1ykSNwPLZ5qTCkuO21VLdtm_2SjJ5QJ0z0PlVjjSB4ZQ/edit?usp=sharing
    hours_contributed = round(words_count / 300, 2)

    if words_count == 0:
        raise Exception(
            'There are no contributions for the given time range.')

    return suggestion_registry.ContributorCertificateInfo(
        from_date.strftime('%d %b %Y'), to_date.strftime('%d %b %Y'),
        signature, str(hours_contributed), language_description
    )


def _generate_question_contributor_certificate_data(
    from_date: datetime.datetime,
    to_date: datetime.datetime,
    user_id: str
) -> suggestion_registry.ContributorCertificateInfo:
    """Returns data to generate question submitter certificate.

    Args:
        from_date: datetime.datetime. The start of the date range for which
            the contributions were created.
        to_date: datetime.datetime. The end of the date range for which
            the contributions were created.
        user_id: str. The user ID of the contributor.

    Returns:
        ContributorCertificateInfo. Data to generate question submitter
        certificate.

    Raises:
        Exception. The suggestion type given to generate the certificate is
            invalid.
    """
    signature = feconf.QUESTION_TEAM_LEAD

    # Adds one date to the to_date to make sure the contributions within
    # the to_date are also counted for the certificate.
    to_date_to_fetch_contributions = to_date + datetime.timedelta(days=1)

    suggestions = (
        suggestion_models.GeneralSuggestionModel
            .get_question_suggestions_submitted_within_given_dates(
                from_date, to_date_to_fetch_contributions, user_id))

    minutes_contributed = 0
    for model in suggestions:
        suggestion = get_suggestion_from_model(model)
        # Retrieve the html content that is emphasized on the
        # Contributor Dashboard pages. This content is what stands
        # out for each suggestion when a user views a list of
        # suggestions.
        get_html_representing_suggestion = (
            SUGGESTION_EMPHASIZED_TEXT_GETTER_FUNCTIONS[
                suggestion.suggestion_type]
        )
        html_content = get_html_representing_suggestion(suggestion)

        if 'oppia-noninteractive-image' in html_content:
            minutes_contributed += 20
        else:
            minutes_contributed += 12
    # Go to the below link for more information about how we count hours
    # contributed.
    # https://docs.google.com/spreadsheets/d/1ykSNwPLZ5qTCkuO21VLdtm_2SjJ5QJ0z0PlVjjSB4ZQ/edit?usp=sharing
    hours_contributed = round(minutes_contributed / 60, 2)

    if minutes_contributed == 0:
        raise Exception(
            'There are no contributions for the given time range.')

    return suggestion_registry.ContributorCertificateInfo(
        from_date.strftime('%d %b %Y'), to_date.strftime('%d %b %Y'),
        signature, str(hours_contributed), None
    )
