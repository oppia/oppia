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

"""Models for Oppia suggestions."""

from __future__ import annotations

import datetime

from core import feconf
from core.platform import models

from typing import (
    Dict, Final, List, Literal, Mapping, Optional, Sequence, Tuple, TypedDict,
    Union)

MYPY = False
if MYPY: # pragma: no cover
    # Here, 'change_domain' is imported only for type checking.
    from core.domain import change_domain  # pylint: disable=invalid-import # isort:skip
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()

# Constants defining the different possible statuses of a suggestion.
STATUS_ACCEPTED: Final = 'accepted'
STATUS_IN_REVIEW: Final = 'review'
STATUS_REJECTED: Final = 'rejected'

STATUS_CHOICES: Final = [
    STATUS_ACCEPTED,
    STATUS_IN_REVIEW,
    STATUS_REJECTED
]

# Daily emails are sent to reviewers to notify them of suggestions on the
# Contributor Dashboard to review. The constants below define the number of
# question and translation suggestions to fetch to come up with these daily
# suggestion recommendations.
MAX_QUESTION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS: Final = 30
MAX_TRANSLATION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS: Final = 30

# Defines what is the minimum role required to review suggestions
# of a particular type.
SUGGESTION_MINIMUM_ROLE_FOR_REVIEW: Final = {
    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT: feconf.ROLE_ID_FULL_USER
}

# Constants defining various contribution types.
SCORE_TYPE_CONTENT: Final = 'content'
SCORE_TYPE_TRANSLATION: Final = 'translation'
SCORE_TYPE_QUESTION: Final = 'question'

SCORE_TYPE_CHOICES: Final = [
    SCORE_TYPE_CONTENT,
    SCORE_TYPE_TRANSLATION,
    SCORE_TYPE_QUESTION
]

# The delimiter to be used in score category field.
SCORE_CATEGORY_DELIMITER: Final = '.'

# Threshold number of days after which suggestion will be accepted.
THRESHOLD_DAYS_BEFORE_ACCEPT: Final = 7

# Threshold time after which suggestion is considered stale and auto-accepted.
THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS: Final = (
    THRESHOLD_DAYS_BEFORE_ACCEPT * 24 * 60 * 60 * 1000
)

# Threshold number of days after which to notify the admin that the
# suggestion has waited too long for a review. The admin will be notified of the
# top MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_ADMIN number of suggestions that have
# waited for a review longer than the threshold number of days.
SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS: Final = 7

# The maximum number of suggestions, that have been waiting too long for review,
# to email admins about.
MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_ADMIN: Final = 10

# The default message to be shown when accepting stale suggestions.
DEFAULT_SUGGESTION_ACCEPT_MESSAGE: Final = (
    'Automatically accepting suggestion after'
    ' %d days' % THRESHOLD_DAYS_BEFORE_ACCEPT
)

# The message to be shown when rejecting a suggestion with a target ID of a
# deleted skill.
DELETED_SKILL_REJECT_MESSAGE: Final = 'The associated skill no longer exists.'

# The message to be shown when rejecting a translation suggestion that is
# associated with an exploration that no longer corresponds to the story.
# The story could have been deleted or the exploration could have been removed
# from the story.
INVALID_STORY_REJECT_TRANSLATION_SUGGESTIONS_MSG: Final = (
    'This text snippet has been removed from the story, and no longer needs '
    'translation. Sorry about that!'
)

# The amount to increase the score of the author by after successfuly getting an
# accepted suggestion.
INCREMENT_SCORE_OF_AUTHOR_BY: Final = 1

# The unique ID for the CommunityContributionStatsModel.
COMMUNITY_CONTRIBUTION_STATS_MODEL_ID: Final = 'community_contribution_stats'


class GeneralSuggestionExportDataDict(TypedDict):
    """Type for the Dictionary of the data from GeneralSuggestionModel."""

    suggestion_type: str
    target_type: str
    target_id: str
    target_version_at_submission: int
    status: str
    change_cmd: Dict[str, change_domain.AcceptableChangeDictTypes]
    language_code: str
    edited_by_reviewer: bool


class GeneralSuggestionModel(base_models.BaseModel):
    """Model to store suggestions made by Oppia users.

    The ID of the suggestions created is the same as the ID of the thread
    linked to the suggestion.
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The type of suggestion.
    suggestion_type = datastore_services.StringProperty(
        required=True, indexed=True, choices=feconf.SUGGESTION_TYPE_CHOICES)
    # The type of the target entity which the suggestion is linked to.
    target_type = datastore_services.StringProperty(
        required=True,
        indexed=True,
        choices=feconf.SUGGESTION_TARGET_TYPE_CHOICES
    )
    # The ID of the target entity being suggested to.
    target_id = datastore_services.StringProperty(required=True, indexed=True)
    # The version number of the target entity at the time of creation of the
    # suggestion.
    target_version_at_submission = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # Status of the suggestion.
    status = datastore_services.StringProperty(
        required=True, indexed=True, choices=STATUS_CHOICES)
    # The ID of the author of the suggestion.
    author_id = datastore_services.StringProperty(required=True, indexed=True)
    # The ID of the reviewer who accepted/rejected the suggestion.
    final_reviewer_id = datastore_services.StringProperty(indexed=True)
    # The change command linked to the suggestion. Contains the details of the
    # change.
    change_cmd = datastore_services.JsonProperty(required=True)
    # The category to score the suggestor in. This field will contain 2 values
    # separated by a ., the first will be a value from SCORE_TYPE_CHOICES and
    # the second will be the subcategory of the suggestion.
    score_category = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The ISO 639-1 code used to query suggestions by language, or None if the
    # suggestion type is not queryable by language.
    language_code = datastore_services.StringProperty(indexed=True)
    # A flag that indicates whether the suggestion is edited by the reviewer.
    edited_by_reviewer = datastore_services.BooleanProperty(
        default=False, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize corresponding to a user:
        author_id, and final_reviewer_id fields.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple unshared instance since there
        are multiple suggestions per user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'suggestion_type': base_models.EXPORT_POLICY.EXPORTED,
            'target_type': base_models.EXPORT_POLICY.EXPORTED,
            'target_id': base_models.EXPORT_POLICY.EXPORTED,
            'target_version_at_submission':
                base_models.EXPORT_POLICY.EXPORTED,
            'status': base_models.EXPORT_POLICY.EXPORTED,
            # The author_id and final_reviewer_id are not exported since
            # we do not want to reveal internal user ids.
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'final_reviewer_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'change_cmd': base_models.EXPORT_POLICY.EXPORTED,
            'score_category': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.EXPORTED,
            'edited_by_reviewer': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether GeneralSuggestionModel exists for the user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.author_id == user_id, cls.final_reviewer_id == user_id
        )).get(keys_only=True) is not None

    @classmethod
    def create(
            cls,
            suggestion_type: str,
            target_type: str,
            target_id: str,
            target_version_at_submission: int,
            status: str,
            author_id: str,
            final_reviewer_id: Optional[str],
            change_cmd: Mapping[
                str, change_domain.AcceptableChangeDictTypes
            ],
            score_category: str,
            thread_id: str,
            language_code: Optional[str]
    ) -> None:
        """Creates a new SuggestionModel entry.

        Args:
            suggestion_type: str. The type of the suggestion.
            target_type: str. The type of target entity being edited.
            target_id: str. The ID of the target entity being edited.
            target_version_at_submission: int. The version number of the target
                entity at the time of creation of the suggestion.
            status: str. The status of the suggestion.
            author_id: str. The ID of the user who submitted the suggestion.
            final_reviewer_id: str|None. The ID of the reviewer who has
                accepted/rejected the suggestion, or None if no reviewer is
                assigned.
            change_cmd: dict. The actual content of the suggestion.
            score_category: str. The scoring category for the suggestion.
            thread_id: str. The ID of the feedback thread linked to the
                suggestion.
            language_code: str|None. The ISO 639-1 code used to query
                suggestions by language, or None if the suggestion type is not
                queryable by language.

        Raises:
            Exception. There is already a suggestion with the given id.
        """
        instance_id = thread_id

        if cls.get_by_id(instance_id):
            raise Exception(
                'There is already a suggestion with the given'
                ' id: %s' % instance_id)

        cls(
            id=instance_id, suggestion_type=suggestion_type,
            target_type=target_type, target_id=target_id,
            target_version_at_submission=target_version_at_submission,
            status=status, author_id=author_id,
            final_reviewer_id=final_reviewer_id, change_cmd=change_cmd,
            score_category=score_category, language_code=language_code).put()

    @classmethod
    def query_suggestions(
        cls, query_fields_and_values: List[Tuple[str, str]]
    ) -> Sequence[GeneralSuggestionModel]:
        """Queries for suggestions.

        Args:
            query_fields_and_values: list(tuple(str, str)). A list of queries.
                The first element in each tuple is the field to be queried, and
                the second element is the corresponding value to query for.

        Returns:
            list(SuggestionModel). A list of suggestions that match the given
            query values, up to a maximum of
            feconf.DEFAULT_SUGGESTION_QUERY_LIMIT suggestions.

        Raises:
            Exception. The field cannot be queried.
        """
        query = cls.query()
        for (field, value) in query_fields_and_values:
            if field not in feconf.ALLOWED_SUGGESTION_QUERY_FIELDS:
                raise Exception('Not allowed to query on field %s' % field)
            query = query.filter(getattr(cls, field) == value)
        return query.fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def get_translation_suggestions_in_review_with_exp_id(
        cls, exp_id: str, language_code: str
    ) -> Sequence[GeneralSuggestionModel]:
        """Returns translation suggestions which are in review with target_id
        == exp_id.

        Args:
            exp_id: str. Exploration ID matching the target ID of the
                translation suggestions.
            language_code: str. Language code.

        Returns:
            list(SuggestionModel). A list of translation suggestions in review
            with target_id of exp_id. The number of returned results is capped
            by feconf.DEFAULT_SUGGESTION_QUERY_LIMIT.
        """
        return cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.language_code == language_code,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            cls.target_id == exp_id
        )).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def get_translation_suggestion_ids_with_exp_ids(
        cls, exp_ids: List[str]
    ) -> List[str]:
        """Gets the ids of translation suggestions corresponding to
        explorations with the given exploration ids.

        Args:
            exp_ids: list(str). List of exploration ids to query for.

        Returns:
            list(str). A list of translation suggestion ids that
            correspond to the given exploration ids. Note: it is not
            guaranteed that the suggestion ids returned are ordered by the
            exploration ids in exp_ids.
        """
        query = cls.get_all().filter(datastore_services.all_of(
            cls.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            cls.target_id.IN(exp_ids)
        ))
        suggestion_models: List[GeneralSuggestionModel] = []
        offset, more = (0, True)
        while more:
            results: Sequence[GeneralSuggestionModel] = (
                query.fetch(
                    feconf.DEFAULT_SUGGESTION_QUERY_LIMIT, offset=offset))
            if len(results):
                offset = offset + len(results)
                suggestion_models.extend(results)
            else:
                more = False
        return [suggestion_model.id for suggestion_model in suggestion_models]

    @classmethod
    def get_all_stale_suggestion_ids(cls) -> List[str]:
        """Gets the ids of the suggestions which were last updated before the
        threshold time.

        Returns:
            list(str). A list of the ids of the suggestions that are stale.
        """
        threshold_time = (
            datetime.datetime.utcnow() - datetime.timedelta(
                0, 0, 0, THRESHOLD_TIME_BEFORE_ACCEPT_IN_MSECS))
        suggestion_models: Sequence[GeneralSuggestionModel] = (
            cls.get_all().filter(
                cls.status == STATUS_IN_REVIEW
            ).filter(cls.last_updated < threshold_time).fetch()
        )
        return [suggestion_model.id for suggestion_model in suggestion_models]

    @classmethod
    def get_suggestions_waiting_too_long_for_review(
        cls
    ) -> Sequence[GeneralSuggestionModel]:
        """Returns a list of suggestions that have been waiting for a review
        longer than SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS days on the
        Contributor Dashboard. MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_ADMIN
        suggestions are returned, sorted in descending order by their review
        wait time.

        Returns:
            list(GeneralSuggestionModel). A list of suggestions, sorted in
            descending order by their review wait time.

        Raises:
            Exception. If there are no suggestion types offered on the
                Contributor Dashboard.
        """
        if not feconf.CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES:
            raise Exception(
                'Expected the suggestion types offered on the Contributor '
                'Dashboard to be nonempty.')
        threshold_time = (
            datetime.datetime.utcnow() - datetime.timedelta(
                days=SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS))
        return cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.last_updated < threshold_time,
            cls.suggestion_type.IN(
                feconf.CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES)
        )).order(
            cls.last_updated
        ).fetch(MAX_NUMBER_OF_SUGGESTIONS_TO_EMAIL_ADMIN)

    @classmethod
    def get_in_review_suggestions_in_score_categories(
        cls, score_categories: List[str], user_id: str
    ) -> Sequence[GeneralSuggestionModel]:
        """Gets all suggestions which are in review in the given
        score_categories.

        Args:
            score_categories: list(str). List of score categories to query for.
            user_id: str. The id of the user trying to make this query.
                As a user cannot review their own suggestions, suggestions
                authored by the user will be excluded.

        Returns:
            list(SuggestionModel). A list of suggestions that are in the given
            score categories, which are in review, but not created by the
            given user.

        Raises:
            Exception. Given list of score categories is empty.
        """
        if len(score_categories) == 0:
            raise Exception('Received empty list of score categories')

        return cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.score_category.IN(score_categories),
            cls.author_id != user_id
        )).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def get_in_review_translation_suggestions(
        cls,
        user_id: str,
        language_codes: List[str]
    ) -> Sequence[GeneralSuggestionModel]:
        """Fetches all translation suggestions that are in-review where the
        author_id != user_id and language_code matches one of the supplied
        language_codes.

        Args:
            user_id: str. The id of the user trying to make this query. As a
                user cannot review their own suggestions, suggestions authored
                by the user will be excluded.
            language_codes: list(str). List of language codes that the
                suggestions should match.

        Returns:
            list(SuggestionModel). A list of the matching suggestions.
        """
        return cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            cls.author_id != user_id,
            cls.language_code.IN(language_codes)
        )).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def get_in_review_translation_suggestions_by_offset(
        cls,
        limit: Optional[int],
        offset: int,
        user_id: str,
        language_codes: List[str]
    ) -> Tuple[Sequence[GeneralSuggestionModel], int]:
        """Fetches translation suggestions that are in-review where the
        author_id != user_id and language_code matches one of the supplied
        language_codes.

        Args:
            limit: int|None. Maximum number of entities to be returned. If None,
                returns all matching entities.
            offset: int. Number of results to skip from the beginning of all
                results matching the query.
            user_id: str. The id of the user trying to make this query. As a
                user cannot review their own suggestions, suggestions authored
                by the user will be excluded.
            language_codes: list(str). List of language codes that the
                suggestions should match.

        Returns:
            Tuple of (results, next_offset). Where:
                results: list(SuggestionModel). A list of suggestions that are
                    in-review, not authored by the supplied user, and that match
                    one of the supplied language codes.
                next_offset: int. The input offset + the number of results
                    returned by the current query.
        """
        suggestion_query = cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            cls.author_id != user_id,
            cls.language_code.IN(language_codes)
        ))

        results: Sequence[GeneralSuggestionModel] = (
            suggestion_query.fetch(limit, offset=offset)
            if limit is not None
            else suggestion_query.fetch(offset=offset)
        )
        next_offset = offset + len(results)

        return (
            results,
            next_offset
        )

    @classmethod
    def get_in_review_translation_suggestions_with_exp_ids_by_offset(
        cls,
        limit: Optional[int],
        offset: int,
        user_id: str,
        language_codes: List[str],
        exp_ids: List[str]
    ) -> Tuple[Sequence[GeneralSuggestionModel], int]:
        """Gets all translation suggestions for the given language
        codes which are in review and correspond to the
        given exploration IDs.

        Args:
            limit: int|None. Maximum number of entities to be returned. If None,
                returns all matching entities.
            offset: int. Number of results to skip from the beginning of all
                results matching the query.
            user_id: str. The id of the user trying to make this query.
                As a user cannot review their own suggestions, suggestions
                authored by the user will be excluded.
            language_codes: list(str). The list of language codes.
            exp_ids: list(str). Exploration IDs matching the target ID of the
                translation suggestions.

        Returns:
            Tuple of (results, next_offset). Where:
                results: list(SuggestionModel). A list of suggestions that are
                    in-review, not authored by the supplied user, match
                    one of the supplied language codes and correspond to the
                    given exploration IDs.
                next_offset: int. The input offset + the number of results
                    returned by the current query.
        """
        suggestion_query = cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            cls.author_id != user_id,
            cls.language_code.IN(language_codes),
            cls.target_id.IN(exp_ids)
        ))

        results: Sequence[GeneralSuggestionModel] = (
            suggestion_query.fetch(limit, offset=offset)
            if limit is not None
            else suggestion_query.fetch(offset=offset)
        )
        next_offset = offset + len(results)

        return (
            results,
            next_offset
        )

    @classmethod
    def get_in_review_translation_suggestions_by_exp_ids(
        cls, exp_ids: List[str], language_code: str
    ) -> Sequence[GeneralSuggestionModel]:
        """Gets all in-review translation suggestions matching the supplied
        exp_ids and language_code.

        Args:
            exp_ids: list(str). Exploration IDs matching the target ID of the
                translation suggestions.
            language_code: str. The ISO 639-1 language code of the translation
                suggestions.

        Returns:
            list(SuggestionModel). A list of suggestions matching the supplied
            exp_ids and language_code.
        """
        return cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            cls.target_id.IN(exp_ids),
            cls.language_code == language_code
        )).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def get_in_review_question_suggestions_by_offset(
        cls, limit: int, offset: int, user_id: str
    ) -> Tuple[Sequence[GeneralSuggestionModel], int]:
        """Fetches question suggestions that are in-review and not authored by
        the supplied user.

        Args:
            limit: int. Maximum number of entities to be returned.
            offset: int. Number of of results to skip from the beginning of all
                results matching the query.
            user_id: str. The id of the user trying to make this query. As a
                user cannot review their own suggestions, suggestions authored
                by the user will be excluded.

        Returns:
            Tuple of (results, next_offset). Where:
                results: list(SuggestionModel). A list of suggestions that are
                    in-review, not authored by the supplied user, and that match
                    one of the supplied language codes.
                next_offset: int. The input offset + the number of results
                    returned by the current query.
        """
        suggestion_query = cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION,
            cls.author_id != user_id
        ))

        results: Sequence[GeneralSuggestionModel] = (
            suggestion_query.fetch(limit, offset=offset)
        )
        next_offset = offset + len(results)

        return (
            results,
            next_offset
        )

    @classmethod
    def get_question_suggestions_waiting_longest_for_review(
        cls
    ) -> Sequence[GeneralSuggestionModel]:
        """Returns MAX_QUESTION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS number
        of question suggestions, sorted in descending order by review wait
        time.

        Returns:
            list(GeneralSuggestionModel). A list of question suggestions,
            sorted in descending order based on how long the suggestions have
            been waiting for review.
        """
        return cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION
        )).order(
            cls.last_updated
        ).fetch(MAX_QUESTION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS)

    @classmethod
    def get_translation_suggestions_waiting_longest_for_review(
        cls, language_code: str
    ) -> Sequence[GeneralSuggestionModel]:
        """Returns MAX_TRANSLATION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS
        number of translation suggestions in the specified language code,
        sorted in descending order by review wait time.

        Args:
            language_code: str. The ISO 639-1 language code of the translation
                suggestions.

        Returns:
            list(GeneralSuggestionModel). A list of translation suggestions,
            sorted in descending order based on how long the suggestions have
            been waiting for review.
        """
        return cls.get_all().filter(datastore_services.all_of(
            cls.status == STATUS_IN_REVIEW,
            cls.suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            cls.language_code == language_code
        )).order(
            cls.last_updated
        ).fetch(MAX_TRANSLATION_SUGGESTIONS_TO_FETCH_FOR_REVIEWER_EMAILS)

    @classmethod
    def get_user_created_suggestions_of_suggestion_type(
        cls, suggestion_type: str, user_id: str
    ) -> Sequence[GeneralSuggestionModel]:
        """Gets all suggestions of suggestion_type which the user has created.

        Args:
            suggestion_type: str. The type of suggestion to query for.
            user_id: str. The id of the user trying to make this query.

        Returns:
            list(SuggestionModel). A list of suggestions that are of the given
            type, which the given user has created.
        """
        return cls.get_all().filter(datastore_services.all_of(
            cls.suggestion_type == suggestion_type,
            cls.author_id == user_id
        )).order(-cls.created_on).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def get_user_created_suggestions_by_offset(
        cls, limit: int, offset: int, suggestion_type: str, user_id: str
    ) -> Tuple[Sequence[GeneralSuggestionModel], int]:
        """Fetches suggestions of suggestion_type which the supplied user has
        created.

        Args:
            limit: int. Maximum number of entities to be returned.
            offset: int. The number of results to skip from the beginning of all
                results matching the query.
            suggestion_type: str. The type of suggestion to query for.
            user_id: str. The id of the user trying to make this query.

        Returns:
            Tuple of (results, next_offset). Where:
                results: list(SuggestionModel). A list of suggestions that are
                    of the supplied type which the supplied user has created.
                next_offset: int. The input offset + the number of results
                    returned by the current query.
        """
        suggestion_query = cls.get_all().filter(datastore_services.all_of(
            cls.suggestion_type == suggestion_type,
            cls.author_id == user_id
        )).order(-cls.created_on)

        results: Sequence[GeneralSuggestionModel] = (
            suggestion_query.fetch(limit, offset=offset)
        )
        next_offset = offset + len(results)

        return (
            results,
            next_offset
        )

    @classmethod
    def get_all_score_categories(cls) -> List[str]:
        """Gets all the score categories for which suggestions have been
        created.

        Returns:
            list(str). A list of all the score categories.
        """
        query_set = cls.query(projection=['score_category'], distinct=True)
        return [data.score_category for data in query_set]

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, GeneralSuggestionExportDataDict]:
        """Exports the data from GeneralSuggestionModel
        into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from GeneralSuggestionModel.
        """

        user_data: Dict[str, GeneralSuggestionExportDataDict] = {}
        suggestion_models: Sequence[GeneralSuggestionModel] = (
            cls.get_all().filter(cls.author_id == user_id).fetch())

        for suggestion_model in suggestion_models:
            user_data[suggestion_model.id] = {
                'suggestion_type': suggestion_model.suggestion_type,
                'target_type': suggestion_model.target_type,
                'target_id': suggestion_model.target_id,
                'target_version_at_submission': (
                    suggestion_model
                    .target_version_at_submission),
                'status': suggestion_model.status,
                'change_cmd': suggestion_model.change_cmd,
                'language_code': suggestion_model.language_code,
                'edited_by_reviewer': suggestion_model.edited_by_reviewer
            }

        return user_data


class CommunityContributionStatsModel(base_models.BaseModel):
    """Records the contributor dashboard contribution stats. This includes the
    total number of reviewers for each suggestion type and the total number of
    suggestions in review for each suggestion type. There is only ever one
    instance of this model, and its ID is COMMUNITY_CONTRIBUTION_STATS_MODEL_ID.

    Note: since this is a singleton model, the model GET and PUT must be done in
    a transaction to avoid the loss of updates that come in rapid succession.
    """

    # A dictionary where the keys represent the language codes that translation
    # suggestions are offered in and the values correspond to the total number
    # of reviewers who have permission to review translation suggestions in
    # that language.
    translation_reviewer_counts_by_lang_code = (
        datastore_services.JsonProperty(required=True))
    # A dictionary where the keys represent the language codes that translation
    # suggestions are offered in and the values correspond to the total number
    # of translation suggestions that are currently in review in that language.
    translation_suggestion_counts_by_lang_code = (
        datastore_services.JsonProperty(required=True))
    # The total number of reviewers who have permission to review question
    # suggestions.
    question_reviewer_count = datastore_services.IntegerProperty(required=True)
    # The total number of question suggestions that are currently in review.
    question_suggestion_count = (
        datastore_services.IntegerProperty(required=True))

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    @classmethod
    def get(cls) -> CommunityContributionStatsModel: # type: ignore[override]
        """Gets the CommunityContributionStatsModel instance. If the
        CommunityContributionStatsModel does not exist yet, it is created.
        This method helps enforce that there should only ever be one instance
        of this model.

        Returns:
            CommunityContributionStatsModel. The single model instance.
        """
        community_contribution_stats_model = cls.get_by_id(
            COMMUNITY_CONTRIBUTION_STATS_MODEL_ID
        )

        if community_contribution_stats_model is None:
            community_contribution_stats_model = cls(
                id=COMMUNITY_CONTRIBUTION_STATS_MODEL_ID,
                translation_reviewer_counts_by_lang_code={},
                translation_suggestion_counts_by_lang_code={},
                question_reviewer_count=0,
                question_suggestion_count=0
            )
            community_contribution_stats_model.update_timestamps()
            community_contribution_stats_model.put()
            return community_contribution_stats_model

        else:
            return super(
                CommunityContributionStatsModel, cls).get(
                    COMMUNITY_CONTRIBUTION_STATS_MODEL_ID)

    @classmethod
    def get_deletion_policy(cls) -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """This model only contains general statistical information about the
        contributor dashboard and does not include any individual user
        information.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user
        because the data is aggregated.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'translation_reviewer_counts_by_lang_code':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'translation_suggestion_counts_by_lang_code':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_reviewer_count':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_suggestion_count':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class TranslationContributionStatsModel(base_models.BaseModel):
    """Records the contributor dashboard translation contribution stats. There
    is one instance of this model per (language_code, contributor_user_id,
    topic_id) tuple. See related design doc for more details:
    https://docs.google.com/document/d/1JEDiy-f1vnBLwibu8hsfuo3JObBWiaFvDTTU9L18zpY/edit#
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The ISO 639-1 language code for which the translation contributions were
    # made.
    language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The user ID of the translation contributor.
    contributor_user_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The topic ID of the translation contribution.
    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    # The number of submitted translations.
    submitted_translations_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The total word count of submitted translations. Excludes HTML tags and
    # attributes.
    submitted_translation_word_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted translations.
    accepted_translations_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted translations without reviewer edits.
    accepted_translations_without_reviewer_edits_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The total word count of accepted translations. Excludes HTML tags and
    # attributes.
    accepted_translation_word_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of rejected translations.
    rejected_translations_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The total word count of rejected translations. Excludes HTML tags and
    # attributes.
    rejected_translation_word_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The unique last_updated dates of the translation suggestions.
    contribution_dates = datastore_services.DateProperty(
        repeated=True, indexed=True)

    @classmethod
    def create(
        cls,
        language_code: str,
        contributor_user_id: str,
        topic_id: str,
        submitted_translations_count: int,
        submitted_translation_word_count: int,
        accepted_translations_count: int,
        accepted_translations_without_reviewer_edits_count: int,
        accepted_translation_word_count: int,
        rejected_translations_count: int,
        rejected_translation_word_count: int,
        contribution_dates: List[datetime.date]
    ) -> str:
        """Creates a new TranslationContributionStatsModel instance and returns
        its ID.
        """
        entity_id = cls.construct_id(
            language_code, contributor_user_id, topic_id)
        entity = cls(
            id=entity_id,
            language_code=language_code,
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            submitted_translations_count=submitted_translations_count,
            submitted_translation_word_count=submitted_translation_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_without_reviewer_edits_count=(
                accepted_translations_without_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translations_count,
            rejected_translation_word_count=rejected_translation_word_count,
            contribution_dates=contribution_dates)
        entity.update_timestamps()
        entity.put()
        return entity_id

    @staticmethod
    def construct_id(
        language_code: str, contributor_user_id: str, topic_id: str
    ) -> str:
        """Constructs a unique ID for a TranslationContributionStatsModel
        instance.

        Args:
            language_code: str. ISO 639-1 language code.
            contributor_user_id: str. User ID.
            topic_id: str. Topic ID.

        Returns:
            str. An ID of the form:

            [language_code].[contributor_user_id].[topic_id]
        """
        return (
            '%s.%s.%s' % (language_code, contributor_user_id, topic_id)
        )

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    @classmethod
    def get( # type: ignore[override]
        cls, language_code: str, contributor_user_id: str, topic_id: str
    ) -> Optional[TranslationContributionStatsModel]:
        """Gets the TranslationContributionStatsModel matching the supplied
        language_code, contributor_user_id, topic_id.

        Returns:
            TranslationContributionStatsModel|None. The matching
            TranslationContributionStatsModel, or None if no such model
            instance exists.
        """
        entity_id = cls.construct_id(
            language_code, contributor_user_id, topic_id)
        return cls.get_by_id(entity_id)

    @classmethod
    def get_all_by_user_id(
        cls, user_id: str
    ) -> Sequence[TranslationContributionStatsModel]:
        """Gets all TranslationContributionStatsModels matching the supplied
        user_id.

        Returns:
            list(TranslationContributionStatsModel). The matching
            TranslationContributionStatsModels.
        """
        return cls.get_all().filter(
            cls.contributor_user_id == user_id
        ).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether TranslationContributionStatsModel references the
        supplied user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.contributor_user_id == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_deletion_policy(cls) -> base_models.DELETION_POLICY:
        """Model contains corresponding to a user: contributor_user_id."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple languages and topics relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'language_code':
                base_models.EXPORT_POLICY.EXPORTED,
            # User ID is not exported in order to keep internal ids private.
            'contributor_user_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id':
                base_models.EXPORT_POLICY.EXPORTED,
            'submitted_translations_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'submitted_translation_word_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_translations_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_translations_without_reviewer_edits_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_translation_word_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'rejected_translations_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'rejected_translation_word_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'contribution_dates':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of TranslationContributionStatsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.contributor_user_id == user_id).fetch(keys_only=True))

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[str, int, List[str]]]]:
        """Exports the data from TranslationContributionStatsModel into dict
        format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from TranslationContributionStatsModel.
        """
        user_data = {}
        stats_models: Sequence[TranslationContributionStatsModel] = (
            cls.get_all().filter(cls.contributor_user_id == user_id).fetch())
        for model in stats_models:
            splitted_id = model.id.split('.')
            id_without_user_id = '%s.%s' % (splitted_id[0], splitted_id[2])
            user_data[id_without_user_id] = {
                'language_code': model.language_code,
                'topic_id': model.topic_id,
                'submitted_translations_count': (
                    model.submitted_translations_count),
                'submitted_translation_word_count': (
                    model.submitted_translation_word_count),
                'accepted_translations_count': (
                    model.accepted_translations_count),
                'accepted_translations_without_reviewer_edits_count': (
                    model.accepted_translations_without_reviewer_edits_count),
                'accepted_translation_word_count': (
                    model.accepted_translation_word_count),
                'rejected_translations_count': (
                    model.rejected_translations_count),
                'rejected_translation_word_count': (
                    model.rejected_translation_word_count),
                'contribution_dates': [
                    date.isoformat() for date in model.contribution_dates]
            }
        return user_data


class TranslationReviewStatsModel(base_models.BaseModel):
    """Records the translation review stats. There is one instance of this model
    per (language_code, reviewer_user_id, topic_id) tuple. Its IDs are in the
    following structure: [language_code].[reviewer_user_id].[topic_id]
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY = True

    # The ISO 639-1 language code for which the translation reviews were
    # made.
    language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The user ID of the translation reviewer.
    reviewer_user_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The topic ID of the translation reviews.
    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    # The number of reviewed translations.
    reviewed_translations_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The total word count of reviewed translations. Excludes HTML tags and
    # attributes.
    reviewed_translation_word_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted translations.
    accepted_translations_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted translations with reviewer edits.
    accepted_translations_with_reviewer_edits_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The total word count of accepted translations. Excludes HTML tags and
    # attributes.
    accepted_translation_word_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The first date that the reviewer made a translation review.
    first_contribution_date = datastore_services.DateProperty(indexed=True)
    # The last date that the reviewer made a translation review.
    last_contribution_date = datastore_services.DateProperty(indexed=True)

    @classmethod
    def create(
        cls,
        language_code: str,
        reviewer_user_id: str,
        topic_id: str,
        reviewed_translations_count: int,
        reviewed_translation_word_count: int,
        accepted_translations_count: int,
        accepted_translations_with_reviewer_edits_count: int,
        accepted_translation_word_count: int,
        first_contribution_date: datetime.date,
        last_contribution_date: datetime.date
    ) -> str:
        """Creates a new TranslationReviewStatsModel instance and returns
        its ID.
        """
        entity_id = cls.construct_id(
            language_code, reviewer_user_id, topic_id)
        entity = cls(
            id=entity_id,
            language_code=language_code,
            reviewer_user_id=reviewer_user_id,
            topic_id=topic_id,
            reviewed_translations_count=reviewed_translations_count,
            reviewed_translation_word_count=reviewed_translation_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_with_reviewer_edits_count=(
                accepted_translations_with_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            first_contribution_date=first_contribution_date,
            last_contribution_date=last_contribution_date)
        entity.update_timestamps()
        entity.put()
        return entity_id

    @staticmethod
    def construct_id(
        language_code: str, reviewer_user_id: str, topic_id: str
    ) -> str:
        """Constructs a unique ID for a TranslationReviewStatsModel
        instance.

        Args:
            language_code: str. ISO 639-1 language code.
            reviewer_user_id: str. User ID.
            topic_id: str. Topic ID.

        Returns:
            str. An ID of the form:

            [language_code].[reviewer_user_id].[topic_id]
        """
        return (
            '%s.%s.%s' % (language_code, reviewer_user_id, topic_id)
        )

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    @classmethod
    def get( # type: ignore[override]
        cls, language_code: str, reviewer_user_id: str, topic_id: str
    ) -> Optional[TranslationReviewStatsModel]:
        """Gets the TranslationReviewStatsModel matching the supplied
        language_code, reviewer_user_id, topic_id.

        Returns:
            TranslationReviewStatsModel|None. The matching
            TranslationReviewStatsModel, or None if no such model
            instance exists.
        """
        entity_id = cls.construct_id(
            language_code, reviewer_user_id, topic_id)
        return cls.get_by_id(entity_id)

    @classmethod
    def get_all_by_user_id(
        cls, user_id: str
    ) -> Sequence[TranslationReviewStatsModel]:
        """Gets all TranslationReviewStatsModel matching the supplied
        user_id.

        Returns:
            list(TranslationReviewStatsModel). The matching
            TranslationReviewStatsModel.
        """
        return cls.get_all().filter(
            cls.reviewer_user_id == user_id
        ).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether TranslationReviewStatsModel references the
        supplied user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.reviewer_user_id == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_deletion_policy(cls) -> base_models.DELETION_POLICY:
        """Model contains corresponding to a user: reviewer_user_id."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple languages and topics relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'language_code':
                base_models.EXPORT_POLICY.EXPORTED,
            # User ID is not exported in order to keep internal ids private.
            'reviewer_user_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id':
                base_models.EXPORT_POLICY.EXPORTED,
            'reviewed_translations_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'reviewed_translation_word_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_translations_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_translations_with_reviewer_edits_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_translation_word_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'first_contribution_date':
                base_models.EXPORT_POLICY.EXPORTED,
            'last_contribution_date':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of TranslationReviewStatsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.reviewer_user_id == user_id).fetch(keys_only=True))

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[str, int, List[str]]]]:
        """Exports the data from TranslationReviewStatsModel into dict
        format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from TranslationReviewStatsModel.
        """
        user_data = {}
        stats_models: Sequence[TranslationReviewStatsModel] = (
            cls.get_all().filter(cls.reviewer_user_id == user_id).fetch())
        for model in stats_models:
            splitted_id = model.id.split('.')
            id_without_user_id = '%s.%s' % (splitted_id[0], splitted_id[2])
            user_data[id_without_user_id] = {
                'language_code': model.language_code,
                'topic_id': model.topic_id,
                'reviewed_translations_count': (
                    model.reviewed_translations_count),
                'reviewed_translation_word_count': (
                    model.reviewed_translation_word_count),
                'accepted_translations_count': (
                    model.accepted_translations_count),
                'accepted_translations_with_reviewer_edits_count': (
                    model.accepted_translations_with_reviewer_edits_count),
                'accepted_translation_word_count': (
                    model.accepted_translation_word_count),
                'first_contribution_date': (
                    model.first_contribution_date.isoformat()),
                'last_contribution_date': (
                    model.last_contribution_date.isoformat())
            }
        return user_data


class QuestionContributionStatsModel(base_models.BaseModel):
    """Records the question contribution stats. There is one instance of this
    model per (contributor_user_id, topic_id) tuple. Its IDs are in the
    following structure: [contributor_user_id].[topic_id]
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY = True

    # The user ID of the question contributor.
    contributor_user_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The topic ID of the question contribution.
    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    # The number of submitted questions.
    submitted_questions_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted questions.
    accepted_questions_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted questions without reviewer edits.
    accepted_questions_without_reviewer_edits_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The first date that the submitter made a question submission.
    first_contribution_date = datastore_services.DateProperty(indexed=True)
    # The last date that the submitter made a question submission.
    last_contribution_date = datastore_services.DateProperty(indexed=True)

    @classmethod
    def create(
        cls,
        contributor_user_id: str,
        topic_id: str,
        submitted_questions_count: int,
        accepted_questions_count: int,
        accepted_questions_without_reviewer_edits_count: int,
        first_contribution_date: datetime.date,
        last_contribution_date: datetime.date
    ) -> str:
        """Creates a new QuestionContributionStatsModel instance and returns
        its ID.
        """
        entity_id = cls.construct_id(
            contributor_user_id, topic_id)
        entity = cls(
            id=entity_id,
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            submitted_questions_count=submitted_questions_count,
            accepted_questions_count=accepted_questions_count,
            accepted_questions_without_reviewer_edits_count=(
                accepted_questions_without_reviewer_edits_count),
            first_contribution_date=first_contribution_date,
            last_contribution_date=last_contribution_date)
        entity.update_timestamps()
        entity.put()
        return entity_id

    @staticmethod
    def construct_id(
        contributor_user_id: str, topic_id: str
    ) -> str:
        """Constructs a unique ID for a QuestionContributionStatsModel
        instance.

        Args:
            contributor_user_id: str. User ID.
            topic_id: str. Topic ID.

        Returns:
            str. An ID of the form:

            [contributor_user_id].[topic_id]
        """
        return (
            '%s.%s' % (contributor_user_id, topic_id)
        )

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    @classmethod
    def get( # type: ignore[override]
        cls, contributor_user_id: str, topic_id: str
    ) -> Optional[QuestionContributionStatsModel]:
        """Gets the QuestionContributionStatsModel matching the supplied
        contributor_user_id, topic_id.

        Returns:
            QuestionContributionStatsModel|None. The matching
            QuestionContributionStatsModel, or None if no such model
            instance exists.
        """
        entity_id = cls.construct_id(
            contributor_user_id, topic_id)
        return cls.get_by_id(entity_id)

    @classmethod
    def get_all_by_user_id(
        cls, user_id: str
    ) -> Sequence[QuestionContributionStatsModel]:
        """Gets all QuestionContributionStatsModel matching the supplied
        user_id.

        Returns:
            list(QuestionContributionStatsModel). The matching
            QuestionContributionStatsModel.
        """
        return cls.get_all().filter(
            cls.contributor_user_id == user_id
        ).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether QuestionContributionStatsModel references the
        supplied user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.contributor_user_id == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_deletion_policy(cls) -> base_models.DELETION_POLICY:
        """Model contains corresponding to a user: contributor_user_id."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple languages and topics relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            # User ID is not exported in order to keep internal ids private.
            'contributor_user_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id':
                base_models.EXPORT_POLICY.EXPORTED,
            'submitted_questions_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_questions_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_questions_without_reviewer_edits_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'first_contribution_date':
                base_models.EXPORT_POLICY.EXPORTED,
            'last_contribution_date':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of QuestionContributionStatsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.contributor_user_id == user_id).fetch(keys_only=True))

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[str, int, List[str]]]]:
        """Exports the data from QuestionContributionStatsModel into dict
        format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from QuestionContributionStatsModel.
        """
        user_data = {}
        stats_models: Sequence[QuestionContributionStatsModel] = (
            cls.get_all().filter(cls.contributor_user_id == user_id).fetch())
        for model in stats_models:
            splitted_id = model.id.split('.')
            id_without_user_id = '%s' % (splitted_id[1])
            user_data[id_without_user_id] = {
                'topic_id': model.topic_id,
                'submitted_questions_count': (
                    model.submitted_questions_count),
                'accepted_questions_count': (
                    model.accepted_questions_count),
                'accepted_questions_without_reviewer_edits_count': (
                    model.accepted_questions_without_reviewer_edits_count),
                'first_contribution_date': (
                    model.first_contribution_date.isoformat()),
                'last_contribution_date': (
                    model.last_contribution_date.isoformat())
            }
        return user_data


class QuestionReviewStatsModel(base_models.BaseModel):
    """Records the question review stats. There is one instance of this model
    per (reviewer_user_id, topic_id) tuple. Its IDs are in the following
    structure: [reviewer_user_id].[topic_id]
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY = True

    # The user ID of the question reviewer.
    reviewer_user_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The topic ID of the question.
    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    # The number of reviewed questions.
    reviewed_questions_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted questions.
    accepted_questions_count = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The number of accepted questions with reviewer edits.
    accepted_questions_with_reviewer_edits_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The first date that the reviewer made a question review.
    first_contribution_date = datastore_services.DateProperty(indexed=True)
    # The last date that the reviewer made a question review.
    last_contribution_date = datastore_services.DateProperty(indexed=True)

    @classmethod
    def create(
        cls,
        reviewer_user_id: str,
        topic_id: str,
        reviewed_questions_count: int,
        accepted_questions_count: int,
        accepted_questions_with_reviewer_edits_count: int,
        first_contribution_date: datetime.date,
        last_contribution_date: datetime.date
    ) -> str:
        """Creates a new QuestionReviewStatsModel instance and returns
        its ID.
        """
        entity_id = cls.construct_id(
            reviewer_user_id, topic_id)
        entity = cls(
            id=entity_id,
            reviewer_user_id=reviewer_user_id,
            topic_id=topic_id,
            reviewed_questions_count=reviewed_questions_count,
            accepted_questions_count=accepted_questions_count,
            accepted_questions_with_reviewer_edits_count=(
                accepted_questions_with_reviewer_edits_count),
            first_contribution_date=first_contribution_date,
            last_contribution_date=last_contribution_date)
        entity.update_timestamps()
        entity.put()
        return entity_id

    @staticmethod
    def construct_id(
        reviewer_user_id: str, topic_id: str
    ) -> str:
        """Constructs a unique ID for a QuestionReviewStatsModel
        instance.

        Args:
            reviewer_user_id: str. User ID.
            topic_id: str. Topic ID.

        Returns:
            str. An ID of the form:

            [reviewer_user_id].[topic_id]
        """
        return (
            '%s.%s' % (reviewer_user_id, topic_id)
        )

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    @classmethod
    def get( # type: ignore[override]
        cls, reviewer_user_id: str, topic_id: str
    ) -> Optional[QuestionReviewStatsModel]:
        """Gets the QuestionReviewStatsModel matching the supplied
        reviewer_user_id, topic_id.

        Returns:
            QuestionReviewStatsModel|None. The matching
            QuestionReviewStatsModel, or None if no such model
            instance exists.
        """
        entity_id = cls.construct_id(
            reviewer_user_id, topic_id)
        return cls.get_by_id(entity_id)

    @classmethod
    def get_all_by_user_id(
        cls, user_id: str
    ) -> Sequence[QuestionReviewStatsModel]:
        """Gets all QuestionReviewStatsModel matching the supplied
        user_id.

        Returns:
            list(QuestionReviewStatsModel). The matching
            QuestionReviewStatsModel.
        """
        return cls.get_all().filter(
            cls.reviewer_user_id == user_id
        ).fetch(feconf.DEFAULT_SUGGESTION_QUERY_LIMIT)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether QuestionReviewStatsModel references the
        supplied user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.reviewer_user_id == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_deletion_policy(cls) -> base_models.DELETION_POLICY:
        """Model contains corresponding to a user: reviewer_user_id."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple languages and topics relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            # User ID is not exported in order to keep internal ids private.
            'reviewer_user_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id':
                base_models.EXPORT_POLICY.EXPORTED,
            'reviewed_questions_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_questions_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'accepted_questions_with_reviewer_edits_count':
                base_models.EXPORT_POLICY.EXPORTED,
            'first_contribution_date':
                base_models.EXPORT_POLICY.EXPORTED,
            'last_contribution_date':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of QuestionReviewStatsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.reviewer_user_id == user_id).fetch(keys_only=True))

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[str, int, List[str]]]]:
        """Exports the data from QuestionReviewStatsModel into dict
        format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from QuestionReviewStatsModel.
        """
        user_data = {}
        stats_models: Sequence[QuestionReviewStatsModel] = (
            cls.get_all().filter(cls.reviewer_user_id == user_id).fetch())
        for model in stats_models:
            splitted_id = model.id.split('.')
            id_without_user_id = '%s' % (splitted_id[1])
            user_data[id_without_user_id] = {
                'topic_id': model.topic_id,
                'reviewed_questions_count': (
                    model.reviewed_questions_count),
                'accepted_questions_count': (
                    model.accepted_questions_count),
                'accepted_questions_with_reviewer_edits_count': (
                    model.accepted_questions_with_reviewer_edits_count),
                'first_contribution_date': (
                    model.first_contribution_date.isoformat()),
                'last_contribution_date': (
                    model.last_contribution_date.isoformat())
            }
        return user_data
