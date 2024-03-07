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

"""Controllers for the contributor dashboard page."""

from __future__ import annotations
import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import contribution_stats_services
from core.domain import email_manager
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.domain import user_domain
from core.domain import user_services

from typing import Dict, List, Optional, TypedDict, Union


class TranslationContributionStatsDict(TypedDict):
    """Dictionary representation of TranslationContributionStatsHandler's
    response dictionary.
    """

    submitted_translations_count: int
    submitted_translation_word_count: int
    accepted_translations_count: int
    accepted_translations_without_reviewer_edits_count: int
    accepted_translation_word_count: int
    rejected_translations_count: int
    rejected_translation_word_count: int
    topic_name: str
    contribution_months: List[str]
    language: str


class ContributionRightsHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ContributionRightsHandler's normalized_payload
    dictionary.
    """

    username: str
    language_code: Optional[str]


class ContributionRightsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ContributionRightsHandler's normalized_request
    dictionary.
    """

    username: str
    language_code: Optional[str]


class ContributionRightsHandler(
    base.BaseHandler[
        ContributionRightsHandlerNormalizedPayloadDict,
        ContributionRightsHandlerNormalizedRequestDict
    ]
):
    """Handles contribution rights of a user on contributor dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'category': {
            'schema': {
                'type': 'basestring',
                'choices': constants.CD_USER_RIGHTS_CATEGORIES
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            }
        },
        'DELETE': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_manage_contributors_role
    def post(self, category: str) -> None:
        """Manages contributors' roles.

        Args:
            category: str. The role's category.

        Raises:
            Exception. The language_code cannot be None if the review category
                is translation.
            InvalidInputException. User already has rights to review
                translation.
            InvalidInputException. User already has rights to review question.
            InvalidInputException. User already has rights to submit question.
        """
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        user_id = user_services.get_user_id_from_username(username)

        if user_id is None:
            raise self.InvalidInputException('Invalid username: %s' % username)

        language_code = self.normalized_payload.get('language_code', None)

        if category == constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION:
            if language_code is None:
                raise Exception(
                    'The language_code cannot be None if the review category is'
                    ' \'translation\''
                )
            if user_services.can_review_translation_suggestions(
                    user_id, language_code=language_code):
                raise self.InvalidInputException(
                    'User %s already has rights to review translation in '
                    'language code %s' % (username, language_code))
            user_services.allow_user_to_review_translation_in_language(
                user_id, language_code)
        elif category == constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION:
            if user_services.can_review_question_suggestions(user_id):
                raise self.InvalidInputException(
                    'User %s already has rights to review question.' % (
                        username))
            user_services.allow_user_to_review_question(user_id)
        else:
            # The handler schema defines the possible values of 'category'.
            # If 'category' has a value other than those defined in the schema,
            # a Bad Request error will be thrown. Hence, 'category' must be
            # 'constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION' if this
            # branch is executed.
            assert category == (
                constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION)
            if user_services.can_submit_question_suggestions(user_id):
                raise self.InvalidInputException(
                    'User %s already has rights to submit question.' % (
                        username))
            user_services.allow_user_to_submit_question(user_id)

        assert category in (
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
        )
        email_manager.send_email_to_new_cd_user(
                user_id, category, language_code=language_code)
        self.render_json({})

    @acl_decorators.can_manage_contributors_role
    def delete(self, category: str) -> None:
        """Removes contributors' roles.

        Args:
            category: str. The role's category.

        Raises:
            InvalidInputException. Invalid username.
            Exception. The language_code cannot be None if the review category
                is translation.
            InvalidInputException. User does not have rights to review
                translation.
            InvalidInputException. User does not have rights to review
                question.
            InvalidInputException. User does not have rights to submit
                question.
        """
        assert self.normalized_request is not None
        username = self.normalized_request['username']
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)

        language_code = self.normalized_request.get('language_code')

        if (category ==
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION):
            if language_code is None:
                raise Exception(
                    'The language_code cannot be None if the review category is'
                    ' \'translation\''
                )
            if not user_services.can_review_translation_suggestions(
                    user_id, language_code=language_code):
                raise self.InvalidInputException(
                    '%s does not have rights to review translation in '
                    'language %s.' % (username, language_code))
            user_services.remove_translation_review_rights_in_language(
                user_id, language_code)
        elif category == (
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION):
            if not user_services.can_review_question_suggestions(user_id):
                raise self.InvalidInputException(
                    '%s does not have rights to review question.' % (
                        username))
            user_services.remove_question_review_rights(user_id)
        else:
            # The handler schema defines the possible values of 'category'.
            # If 'category' has a value other than those defined in the schema,
            # a Bad Request error will be thrown. Hence, 'category' must be
            # 'constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION' if this
            # branch is executed.
            assert category == (
                constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION)
            if not user_services.can_submit_question_suggestions(user_id):
                raise self.InvalidInputException(
                    '%s does not have rights to submit question.' % (
                        username))
            user_services.remove_question_submit_rights(user_id)

        assert category in (
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION
        )
        email_manager.send_email_to_removed_cd_user(
                user_id, category, language_code=language_code)
        self.render_json({})


class ContributorUsersListHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ContributorUsersListHandler's normalized_request
    dictionary.
    """

    language_code: Optional[str]


class ContributorUsersListHandler(
    base.BaseHandler[
        Dict[str, str],
        ContributorUsersListHandlerNormalizedRequestDict
    ]
):
    """Handler to show users with contribution rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'category': {
            'schema': {
                'type': 'basestring',
                'choices': constants.CD_USER_RIGHTS_CATEGORIES
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_manage_contributors_role
    def get(self, category: str) -> None:
        """Retrieves the usernames of contributors.

        Args:
            category: str. The role's category.
        """
        assert self.normalized_request is not None
        language_code = self.normalized_request.get('language_code')
        usernames = user_services.get_contributor_usernames(
            category, language_code=language_code)
        self.render_json({'usernames': usernames})


class ContributionRightsDataHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ContributionRightsDataHandler's normalized_request
    dictionary.
    """

    username: str


class ContributionRightsDataHandler(
    base.BaseHandler[
        Dict[str, str],
        ContributionRightsDataHandlerNormalizedRequestDict
    ]
):
    """Handler to show the contribution rights of a user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self) -> None:
        """Fetches contributor dashboard admin page data.

        Raises:
            InvalidInputException. Invalid username.
        """
        assert self.normalized_request is not None
        username = self.normalized_request['username']
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)
        user_rights = (
            user_services.get_user_contribution_rights(user_id))
        response: Dict[str, Union[List[str], bool]] = {}
        if (feconf.ROLE_ID_TRANSLATION_ADMIN in self.roles or
            feconf.ROLE_ID_TRANSLATION_COORDINATOR in self.roles):
            response = {
                'can_review_translation_for_language_codes': (
                    user_rights.can_review_translation_for_language_codes)
            }
        if (feconf.ROLE_ID_QUESTION_ADMIN in self.roles or
            feconf.ROLE_ID_QUESTION_COORDINATOR in self.roles):
            response.update({
                'can_review_questions': user_rights.can_review_questions,
                'can_submit_questions': user_rights.can_submit_questions
            })
        self.render_json(response)


class TranslationContributionStatsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TranslationContributionStatsHandler's
    normalized_request dictionary.
    """

    username: str


class TranslationContributionStatsHandler(
    base.BaseHandler[
        Dict[str, str],
        TranslationContributionStatsHandlerNormalizedRequestDict
    ]
):
    """Handler to show the translation contribution stats of a user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_translation_stats
    def get(self) -> None:
        """Fetches translation contribution statistics.

        Raises:
            InvalidInputException. Invalid username.
        """
        assert self.normalized_request is not None
        username = self.normalized_request['username']
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)
        translation_contribution_stats = (
            suggestion_services.get_all_translation_contribution_stats(user_id)
        )
        self.render_json({
            'translation_contribution_stats': (
                self._get_complete_translation_contribution_stats(
                    translation_contribution_stats)
            )
        })

    def _get_complete_translation_contribution_stats(
        self,
        translation_contribution_stats: List[
            suggestion_registry.TranslationContributionStats
        ]
    ) -> List[TranslationContributionStatsDict]:
        """Returns translation contribution stats dicts with all the necessary
        information for the frontend.

        Args:
            translation_contribution_stats: list(TranslationContributionStats).
                TranslationContributionStats domain objects.

        Returns:
            list(dict(TranslationContributionStats)). Dict representations of
            TranslationContributionStats domain objects with additional keys:
                language: str. Language description.
                topic_name: str. Topic name.
                contribution_months: str. Unique translation contribution
                    months of format: "%b %Y", e.g. "Jan 2021".
            Unnecessary keys language_code, topic_id, contribution_dates,
            contributor_user_id are consequently deleted.
        """
        translation_contribution_stats_dicts = [
            stats.to_dict() for stats in translation_contribution_stats
        ]
        topic_ids: List[str] = []
        for stats_dict in translation_contribution_stats_dicts:
            topic_ids.append(stats_dict['topic_id'])
        topic_summaries = topic_fetchers.get_multi_topic_summaries(topic_ids)
        topic_name_by_topic_id = {}
        for topic_summary in topic_summaries:
            if topic_summary is None:
                continue
            topic_name_by_topic_id[topic_summary.id] = topic_summary.name

        response_translation_contribution_stats_dicts: (
            List[TranslationContributionStatsDict]
        ) = []
        for stats_dict in translation_contribution_stats_dicts:
            # Here we are asserting that 'stats_dict['topic_id']' will never
            # be None because above we are already handling the case of None
            # 'topic_id' by raising an exception.
            assert stats_dict['topic_id'] is not None

            response_translation_contribution_stats_dicts.append({
                'submitted_translations_count': (
                    stats_dict['submitted_translations_count']
                ),
                'submitted_translation_word_count': (
                    stats_dict['submitted_translation_word_count']
                ),
                'accepted_translations_count': (
                    stats_dict['accepted_translations_count']
                ),
                'accepted_translations_without_reviewer_edits_count': (
                    stats_dict[
                        'accepted_translations_without_reviewer_edits_count'
                    ]
                ),
                'accepted_translation_word_count': (
                    stats_dict['accepted_translation_word_count']
                ),
                'rejected_translations_count': (
                    stats_dict['rejected_translations_count']
                ),
                'rejected_translation_word_count': (
                    stats_dict['rejected_translation_word_count']
                ),
                'topic_name': topic_name_by_topic_id.get(
                    stats_dict['topic_id'], 'UNKNOWN'),
                'contribution_months': list({
                    contribution_date.strftime('%b %Y')
                    for contribution_date in stats_dict['contribution_dates']
                }),
                'language': (
                    utils.get_supported_audio_language_description(
                        stats_dict['language_code']
                    )
                )
            })

        return response_translation_contribution_stats_dicts


class ContributorDashboardAdminStatsHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ContributorDashboardAdminStatsHandler's
    normalized_request dictionary.
    """

    page_size: int
    offset: int
    language_code: Optional[str]
    sort_by: Optional[str]
    topic_ids: Optional[List[str]]
    max_days_since_last_activity: Optional[int]


class ContributorDashboardAdminStatsHandler(
    base.BaseHandler[
        Dict[str, str],
        ContributorDashboardAdminStatsHandlerNormalizedPayloadDict
    ]
):
    """Return Contributor Admin Dashboard Stats for supplied parameters.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'contribution_type': {
            'schema': {
                'type': 'basestring'
            },
            'choices': [
                feconf.CONTRIBUTION_TYPE_TRANSLATION,
                feconf.CONTRIBUTION_TYPE_QUESTION
            ]
        },
        'contribution_subtype': {
            'schema': {
                'type': 'basestring'
            },
            'choices': [
                feconf.CONTRIBUTION_SUBTYPE_SUBMISSION,
                feconf.CONTRIBUTION_SUBTYPE_REVIEW,
                feconf.CONTRIBUTION_SUBTYPE_COORDINATE,
            ]
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'page_size': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }],
                },
                'default_value': 20
            },
            'offset': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                }
            },
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            },
            'sort_by': {
                'schema': {
                    'type': 'basestring',
                    'choices': constants.CD_ADMIN_STATS_SORT_OPTIONS
                },
                'default_value': None
            },
            'topic_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                },
                'default_value': None
            },
            'max_days_since_last_activity': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(
        self,
        contribution_type: str,
        contribution_subtype: str
    ) -> None:
        """Handles GET requests."""

        assert self.normalized_request is not None
        page_size = self.normalized_request.get('page_size')
        offset = self.normalized_request.get('offset')
        language_code = self.normalized_request.get('language_code')
        sort_by = self.normalized_request.get('sort_by')
        topic_ids = self.normalized_request.get('topic_ids')
        max_days_since_last_activity = self.normalized_request.get(
            'max_days_since_last_activity')

        if contribution_type == feconf.CONTRIBUTION_TYPE_TRANSLATION:
            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_SUBMISSION:
                # Asserting here because even though we are validating through
                # schema mypy is assuming is can be None.
                assert page_size is not None
                assert offset is not None
                assert language_code is not None
                translation_submitter_stats, next_offset, more = (
                    contribution_stats_services
                    .get_translation_submitter_total_stats(
                        page_size,
                        offset,
                        language_code,
                        sort_by,
                        topic_ids,
                        max_days_since_last_activity
                    ))
                translation_submitter_frontend_dicts = [stat.to_frontend_dict()
                    for stat in translation_submitter_stats]
                response = {
                    'stats': translation_submitter_frontend_dicts,
                    'next_offset': next_offset,
                    'more': more
                }

            elif contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_REVIEW:
                # Asserting here because even though we are validating through
                # schema mypy is assuming is can be None.
                assert page_size is not None
                assert offset is not None
                assert language_code is not None
                translation_reviewer_stats, next_offset, more = (
                    contribution_stats_services
                    .get_translation_reviewer_total_stats(
                        page_size,
                        offset,
                        language_code,
                        sort_by,
                        max_days_since_last_activity
                    ))
                translation_reviewer_frontend_dicts = [stat.to_frontend_dict()
                    for stat in translation_reviewer_stats]
                response = {
                    'stats': translation_reviewer_frontend_dicts,
                    'next_offset': next_offset,
                    'more': more
                }

            else:
                assert sort_by is not None
                translation_coordinator_dicts = (
                    contribution_stats_services
                    .get_all_translation_coordinator_stats(sort_by))
                translation_coordinator_frontend_dicts = (
                    get_translation_coordinator_frontend_dict(
                    translation_coordinator_dicts))
                response = {
                    'stats': translation_coordinator_frontend_dicts
                }

        else:
            if contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_SUBMISSION:
                # Asserting here because even though we are validating through
                # schema mypy is assuming is can be None.
                assert page_size is not None
                assert offset is not None
                question_submitter_stats, next_offset, more = (
                    contribution_stats_services
                    .get_question_submitter_total_stats(
                        page_size,
                        offset,
                        sort_by,
                        topic_ids,
                        max_days_since_last_activity
                    ))
                question_submitter_frontend_dicts = [stat.to_frontend_dict()
                    for stat in question_submitter_stats]
                response = {
                    'stats': question_submitter_frontend_dicts,
                    'next_offset': next_offset,
                    'more': more
                }

            elif contribution_subtype == feconf.CONTRIBUTION_SUBTYPE_REVIEW:
                # Asserting here because even though we are validating through
                # schema mypy is assuming is can be None.
                assert page_size is not None
                assert offset is not None
                question_reviewer_stats, next_offset, more = (
                    contribution_stats_services
                    .get_question_reviewer_total_stats(
                        page_size,
                        offset,
                        sort_by,
                        max_days_since_last_activity
                    ))
                question_reviewer_frontend_dicts = [stat.to_frontend_dict()
                    for stat in question_reviewer_stats]
                response = {
                    'stats': question_reviewer_frontend_dicts,
                    'next_offset': next_offset,
                    'more': more
                }

            else:
                question_coordinators = (
                    user_services
                    .get_user_ids_by_role(feconf.ROLE_ID_QUESTION_COORDINATOR))
                question_coordinators.sort()
                question_coordinator_frontend_dicts = (
                    get_question_coordinator_frontend_dict(
                    question_coordinators))
                response = {
                    'stats': question_coordinator_frontend_dicts
                }

        self.render_json(response)


class CommunityContributionStatsHandler(
    base.BaseHandler[
        Dict[str, str],
        Dict[str, str]
    ]
):
    """Handler to get Community Stats for contributor admin dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self) -> None:
        """Fetches community contribution stats data.

        Raises:
            InvalidInputException. Invalid username.
        """
        community_stats = suggestion_services.get_community_contribution_stats()

        response = {
            'translation_reviewers_count': (
                community_stats.translation_reviewer_counts_by_lang_code),
            'question_reviewers_count': community_stats.question_reviewer_count
        }
        self.render_json(response)


def get_translation_coordinator_frontend_dict(
    backend_stats: List[user_domain.TranslationCoordinatorStats]
) -> List[user_domain.TranslationCoordinatorStatsDict]:
    """Returns corresponding stats dicts with all the necessary
    information for the frontend.

    Args:
        backend_stats: list. TranslationCoordinatorStats domain object.

    Returns:
        list. Dict representations of TranslationCoordinatorStats
        domain objects with additional keys:
            translators_count: int.
            reviewers_count: int.
    """
    stats_dicts = [
        stats.to_dict() for stats in backend_stats
    ]

    for stats_dict in stats_dicts:
        coordinator_activity_list = []
        # Here we use MyPy ignore because MyPy doesn't allow key addition
        # to TypedDict.
        stats_dict['translators_count'] = ( # type: ignore[misc]
            contribution_stats_services.get_translator_counts(
                stats_dict['language_id']))

        community_stats = suggestion_services.get_community_contribution_stats()

        # Here we use MyPy ignore because MyPy doesn't allow key addition
        # to TypedDict.
        stats_dict['reviewers_count'] = ( # type: ignore[misc]
            community_stats.translation_reviewer_counts_by_lang_code[
                stats_dict['language_id']])

        for coordinator_id in stats_dict['coordinator_ids']:
            user_setting = user_services.get_user_settings(coordinator_id)
            assert user_setting.last_logged_in is not None
            last_activity = user_setting.last_logged_in
            last_activity_days = int(
                (datetime.datetime.today() - last_activity).days
            )

            coordinator_activity_list.append({
                'translation_coordinator': user_setting.username,
                'last_activity_days': last_activity_days
            })

        # Here we use MyPy ignore because MyPy doesn't allow key addition
        # to TypedDict.
        stats_dict['coordinator_activity_list'] = coordinator_activity_list # type: ignore[misc]

        # Here we use MyPy ignore because MyPy doesn't allow key deletion
        # from TypedDict.
        del stats_dict['coordinator_ids']  # type: ignore[misc]

    return stats_dicts


def get_question_coordinator_frontend_dict(
    question_coordinators: List[str]
) -> List[Dict[str, Union[str, int]]]:
    """Returns corresponding stats dicts with all the necessary
    information for the frontend.

    Args:
        question_coordinators: list[str]. List of question coordinators.

    Returns:
        list[Dict[str, str]]. List of dict representing question coordinator
        stats:
        question_coordinator: str.
        last_activity: int.
    """
    stats: List[Dict[str, Union[str, int]]] = []
    for coordinator in question_coordinators:
        user_setting = user_services.get_user_settings(coordinator)
        assert user_setting.last_logged_in is not None
        assert user_setting.username is not None

        last_activity = user_setting.last_logged_in
        last_activity_days = int(
            (datetime.datetime.today() - last_activity).days)

        stats.append({
            'question_coordinator': user_setting.username,
            'last_activity': last_activity_days
        })

    return stats
