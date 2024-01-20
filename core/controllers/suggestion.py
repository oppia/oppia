# coding: utf-8
#
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

"""Controllers for suggestions."""

from __future__ import annotations

import base64

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator
from core.domain import change_domain
from core.domain import exp_fetchers
from core.domain import fs_services
from core.domain import html_cleaner
from core.domain import image_validation_services
from core.domain import opportunity_domain
from core.domain import opportunity_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.domain import translation_domain
from core.domain import user_services

from typing import (
    Dict, List, Mapping, Optional, Sequence, TypedDict, TypeVar, Union, cast
)

# Note: These private type variables are only defined to implement
# the Generic typing structure of SuggestionsProviderHandler, because
# SuggestionsProviderHandler is a super-class of some other handlers.
# So, to transfer the generic typing pattern of self.normalized_* to those
# sub-handlers as well, we used generics here. So, do not make these
# private type variables public in the future.
_SuggestionsProviderHandlerNormalizedRequestDictType = TypeVar(
    '_SuggestionsProviderHandlerNormalizedRequestDictType')
_SuggestionsProviderHandlerNormalizedPayloadDictType = TypeVar(
    '_SuggestionsProviderHandlerNormalizedPayloadDictType'
)


class FrontendSkillOpportunityDict(opportunity_domain.SkillOpportunityDict):
    """A dictionary representing SkillOpportunity domain object for frontend."""

    skill_rubrics: List[skill_domain.RubricDict]


class FrontendBaseSuggestionDict(TypedDict):
    """Dictionary representing the frontend BaseSuggestion object
    with additional 'exploration_content_html' key.
    """

    suggestion_id: str
    suggestion_type: str
    target_type: str
    target_id: str
    target_version_at_submission: int
    status: str
    author_name: str
    final_reviewer_id: Optional[str]
    change_cmd: Dict[str, change_domain.AcceptableChangeDictTypes]
    score_category: str
    language_code: str
    last_updated: float
    edited_by_reviewer: bool
    exploration_content_html: Optional[Union[str, List[str]]]


SuggestionsProviderHandlerUrlPathArgsSchemaDictType = Dict[
    str, Dict[str, Union[Dict[str, str], List[str]]]
]

SuggestionsProviderHandlerArgsSchemaDictType = Dict[
    str,
    Dict[
        str,
        Dict[
            str,
            Union[
                Optional[
                    Dict[str, Union[str, List[Dict[str, Union[str, int]]]]]],
                List[str]
            ]
        ]
    ]
]


SCHEMA_FOR_SUBTITLED_HTML_DICT = {
    'type': 'dict',
    'properties': [{
        'name': 'content_id',
        'schema': {
            'type': 'basestring'
        }
    }, {
        'name': 'html',
        'schema': {
            'type': 'basestring'
        }
    }]
}

SCHEMA_FOR_TARGET_ID = {
    'type': 'basestring',
    'validators': [{
        'id': 'is_regex_matched',
        'regex_pattern': constants.ENTITY_ID_REGEX
    }]
}


class SuggestionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SuggestionHandler's
    normalized_payload dictionary.
    """

    suggestion_type: str
    target_type: str
    target_id: str
    target_version_at_submission: int
    change_cmd: Mapping[str, change_domain.AcceptableChangeDictTypes]
    description: str
    files: Optional[Dict[str, str]]


class SuggestionHandler(
    base.BaseHandler[
        SuggestionHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """"Handles operations relating to suggestions."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'suggestion_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.SUGGESTION_TYPE_CHOICES
                }
            },
            'target_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.SUGGESTION_TARGET_TYPE_CHOICES
                }
            },
            'target_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'target_version_at_submission': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                }
            },
            'change_cmd': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_suggestion_change
                    )
                }
            },
            'description': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'files': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.
                        validate_suggestion_images
                    )
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_suggest_changes
    def post(self) -> None:
        """Handles POST requests.

        Raises:
            InvalidInputException. The suggestion type is 'edit_state_content',
                as content suggestion submissions are no longer supported.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        suggestion_type = self.normalized_payload['suggestion_type']
        if (
            suggestion_type == feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT
        ):
            raise self.InvalidInputException(
                'Content suggestion submissions are no longer supported.')

        suggestion = suggestion_services.create_suggestion(
            suggestion_type,
            self.normalized_payload['target_type'],
            self.normalized_payload['target_id'],
            self.normalized_payload['target_version_at_submission'],
            self.user_id,
            self.normalized_payload['change_cmd'],
            self.normalized_payload['description']
        )

        if suggestion.suggestion_type == (
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
        ):
            (
                suggestion_services
            ).update_translation_contribution_stats_at_submission(suggestion)

        if suggestion.suggestion_type == (
            feconf.SUGGESTION_TYPE_ADD_QUESTION
        ):
            (
                suggestion_services
            ).update_question_contribution_stats_at_submission(suggestion)

        suggestion_change = suggestion.change_cmd
        if (
                suggestion_change.cmd == 'add_written_translation' and (
                    translation_domain.TranslatableContentFormat
                    .is_data_format_list(suggestion_change.data_format)
                )
        ):
            self.render_json(self.values)
            return

        # Images for question suggestions are already stored in the server
        # before actually the question is submitted. Therefore no need of
        # uploading images when the suggestion type is 'add_question'. But this
        # is not good, since when the user cancels a question suggestion after
        # adding an image, there is no method to remove the uploaded image.
        # See more - https://github.com/oppia/oppia/issues/14298
        if suggestion_type != feconf.SUGGESTION_TYPE_ADD_QUESTION:
            files = self.normalized_payload.get('files')
            new_image_filenames = (
                suggestion.get_new_image_filenames_added_in_suggestion()
            )
            if new_image_filenames and files is not None:
                _upload_suggestion_images(
                    files, suggestion, new_image_filenames
                )

        self.render_json(self.values)


class SuggestionToExplorationActionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SuggestionToExplorationActionHandler's
    normalized_payload dictionary.
    """

    action: str
    commit_message: Optional[str]
    review_message: str


class SuggestionToExplorationActionHandler(
    base.BaseHandler[
        SuggestionToExplorationActionHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handles actions performed on suggestions to explorations."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'target_id': {
            'schema': SCHEMA_FOR_TARGET_ID
        },
        'suggestion_id': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        constants.ACTION_ACCEPT_SUGGESTION,
                        constants.ACTION_REJECT_SUGGESTION
                    ]
                }
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_COMMIT_MESSAGE_LENGTH
                    }]
                },
                'default_value': None
            },
            'review_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_REVIEW_MESSAGE_LENGTH
                    }]
                }
            }
        }
    }

    @acl_decorators.get_decorator_for_accepting_suggestion(
        acl_decorators.can_edit_exploration)
    def put(self, target_id: str, suggestion_id: str) -> None:
        """Handles PUT requests.

        Args:
            target_id: str. The ID of the suggestion target.
            suggestion_id: str. The ID of the suggestion.

        Raises:
            Exception. The 'commit_message' must be provided when the
                action is 'accept suggestion'.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        if (
                suggestion_id.split('.')[0] !=
                feconf.ENTITY_TYPE_EXPLORATION):
            raise self.InvalidInputException(
                'This handler allows actions only'
                ' on suggestions to explorations.')

        if suggestion_id.split('.')[1] != target_id:
            raise self.InvalidInputException(
                'The exploration id provided does not match the exploration id '
                'present as part of the suggestion_id')

        action = self.normalized_payload['action']
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        if suggestion.author_id == self.user_id:
            raise self.UnauthorizedUserException(
                'You cannot accept/reject your own suggestion.')

        if action == constants.ACTION_ACCEPT_SUGGESTION:
            commit_message = self.normalized_payload.get('commit_message')
            if commit_message is None:
                raise Exception(
                    'The \'commit_message\' must be provided when the '
                    'action is \'accept suggestion\'.'
                )
            suggestion_services.accept_suggestion(
                suggestion_id, self.user_id, commit_message,
                self.normalized_payload['review_message']
            )
        else:
            assert action == constants.ACTION_REJECT_SUGGESTION
            suggestion_services.reject_suggestion(
                suggestion_id, self.user_id,
                self.normalized_payload['review_message']
            )

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if suggestion.suggestion_type == (
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT):
            suggestion_services.update_translation_review_stats(suggestion)

        self.render_json(self.values)


class ResubmitSuggestionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ResubmitSuggestionHandler's
    normalized_payload dictionary.
    """

    action: str
    change_cmd: Dict[str, Union[str, state_domain.SubtitledHtmlDict]]
    summary_message: str


class ResubmitSuggestionHandler(
    base.BaseHandler[
        ResubmitSuggestionHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handler to reopen a rejected suggestion."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'suggestion_id': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': ['resubmit']
                }
            },
            'change_cmd': {
                'schema': {
                    'type': 'dict',
                    'properties': [{
                        'name': 'cmd',
                        'schema': {
                            'type': 'basestring'
                        }
                    }, {
                        'name': 'property_name',
                        'schema': {
                            'type': 'basestring'
                        }
                    }, {
                        'name': 'state_name',
                        'schema': {
                            'type': 'basestring',
                            'validators': [{
                                'id': 'has_length_at_most',
                                'max_value': constants.MAX_STATE_NAME_LENGTH
                            }]
                        }
                    }, {
                        'name': 'new_value',
                        'schema': SCHEMA_FOR_SUBTITLED_HTML_DICT
                    }, {
                        'name': 'old_value',
                        'schema': SCHEMA_FOR_SUBTITLED_HTML_DICT
                    }]
                }
            },
            'summary_message': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_resubmit_suggestion
    def put(self, suggestion_id: str) -> None:
        """Handles PUT requests.

        Args:
            suggestion_id: str. The ID of the suggestion.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        new_change = self.normalized_payload['change_cmd']
        change_cls = type(suggestion.change_cmd)
        change_object = change_cls(new_change)
        summary_message = self.normalized_payload['summary_message']
        suggestion_services.resubmit_rejected_suggestion(
            suggestion_id, summary_message, self.user_id, change_object)
        self.render_json(self.values)


class SuggestionToSkillActionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SuggestionToSkillActionHandler's
    normalized_payload dictionary.
    """

    action: str
    review_message: str
    skill_difficulty: Optional[str]


class SuggestionToSkillActionHandler(
    base.BaseHandler[
        SuggestionToSkillActionHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handles actions performed on suggestions to skills."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'target_id': {
            'schema': SCHEMA_FOR_TARGET_ID
        },
        'suggestion_id': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        constants.ACTION_ACCEPT_SUGGESTION,
                        constants.ACTION_REJECT_SUGGESTION
                    ]
                }
            },
            'review_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_REVIEW_MESSAGE_LENGTH
                    }]
                }
            },
            'skill_difficulty': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }, {
                        'id': 'is_at_most',
                        'max_value': 1
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.get_decorator_for_accepting_suggestion(
        acl_decorators.can_edit_skill)
    def put(self, target_id: str, suggestion_id: str) -> None:
        """Handles PUT requests.

        Args:
            target_id: str. The ID of the suggestion target.
            suggestion_id: str. The ID of the suggestion.

        Raises:
            InvalidInputException. The suggestion is not for skills
                or the provided skill ID is invalid.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        if suggestion_id.split('.')[0] != feconf.ENTITY_TYPE_SKILL:
            raise self.InvalidInputException(
                'This handler allows actions only on suggestions to skills.')

        if suggestion_id.split('.')[1] != target_id:
            raise self.InvalidInputException(
                'The skill id provided does not match the skill id present as '
                'part of the suggestion_id')

        action = self.normalized_payload['action']

        if action == constants.ACTION_ACCEPT_SUGGESTION:
            # Question suggestions do not use commit messages.
            suggestion_services.accept_suggestion(
                suggestion_id, self.user_id, 'UNUSED_COMMIT_MESSAGE',
                self.normalized_payload['review_message'])

            suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
            target_entity_html_list = (
                suggestion.get_target_entity_html_strings())
            target_image_filenames = (
                html_cleaner.get_image_filenames_from_html_strings(
                    target_entity_html_list))

            fs_services.copy_images(
                suggestion.target_type, suggestion.target_id,
                feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS, suggestion.target_id,
                target_image_filenames)
        else:
            assert action == constants.ACTION_REJECT_SUGGESTION
            suggestion_services.reject_suggestion(
                suggestion_id, self.user_id,
                self.normalized_payload['review_message']
            )

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if suggestion.suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION:
            suggestion_services.update_question_review_stats(suggestion)

        self.render_json(self.values)


class SuggestionsProviderHandler(
    base.BaseHandler[
        _SuggestionsProviderHandlerNormalizedPayloadDictType,
        _SuggestionsProviderHandlerNormalizedRequestDictType
    ]
):
    """Provides suggestions for a user and given suggestion type."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: (
        SuggestionsProviderHandlerUrlPathArgsSchemaDictType
    ) = {}
    HANDLER_ARGS_SCHEMAS: SuggestionsProviderHandlerArgsSchemaDictType = {}

    def _require_valid_suggestion_and_target_types(
        self, target_type: str, suggestion_type: str
    ) -> None:
        """Checks whether the given target_type and suggestion_type are valid.

        Args:
            target_type: str. The type of the suggestion target.
            suggestion_type: str. The type of the suggestion.

        Raises:
            InvalidInputException. If the given target_type of suggestion_type
                are invalid.
        """
        if target_type not in feconf.SUGGESTION_TARGET_TYPE_CHOICES:
            raise self.InvalidInputException(
                'Invalid target_type: %s' % target_type)

        if suggestion_type not in feconf.SUGGESTION_TYPE_CHOICES:
            raise self.InvalidInputException(
                'Invalid suggestion_type: %s' % suggestion_type)

    def _render_suggestions(
        self, target_type: str,
        suggestions: Sequence[suggestion_registry.BaseSuggestion],
        next_offset: int
    ) -> None:
        """Renders retrieved suggestions.

        Args:
            target_type: str. The suggestion type.
            suggestions: list(BaseSuggestion). A list of suggestions to render.
            next_offset: int. The number of results to skip from the beginning
                of all results matching the original query.
        """
        if target_type == feconf.ENTITY_TYPE_EXPLORATION:
            target_id_to_exp_opportunity_dict = (
                _get_target_id_to_exploration_opportunity_dict(suggestions))
            self.render_json({
                'suggestions': _construct_exploration_suggestions(suggestions),
                'target_id_to_opportunity_dict':
                    target_id_to_exp_opportunity_dict,
                'next_offset': next_offset
            })
        elif target_type == feconf.ENTITY_TYPE_SKILL:
            target_id_to_skill_opportunity_dict = (
                _get_target_id_to_skill_opportunity_dict(suggestions))
            self.render_json({
                'suggestions': [s.to_dict() for s in suggestions],
                'target_id_to_opportunity_dict':
                    target_id_to_skill_opportunity_dict,
                'next_offset': next_offset
            })
        else:
            self.render_json({})


class ReviewableSuggestionsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ReviewableSuggestionsHandler's
    normalized_request dictionary.
    """

    limit: Optional[int]
    offset: int
    sort_key: str
    exploration_id: Optional[str]
    topic_name: Optional[str]


class ReviewableSuggestionsHandler(
    SuggestionsProviderHandler[
        Dict[str, str], ReviewableSuggestionsHandlerNormalizedRequestDict
    ]
):
    """Provides all suggestions which can be reviewed by the user for a given
    suggestion type.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'target_type': {
            'schema': {
                'type': 'basestring',
            },
            'choices': feconf.SUGGESTION_TARGET_TYPE_CHOICES
        },
        'suggestion_type': {
            'schema': {
                'type': 'basestring',
            },
            'choices': feconf.SUGGESTION_TYPE_CHOICES
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'limit': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                },
                'default_value': None
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
            'sort_key': {
                'schema': {
                    'type': 'basestring'
                },
                'choices': feconf.SUGGESTIONS_SORT_KEYS,
            },
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'topic_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
        }
    }

    def _get_skill_ids_for_topic(
            self, topic_name: Optional[str]
    ) -> Optional[List[str]]:
        """Gets all skill ids for the provided topic.

        Returns None to indicate that no filtering is needed.
        """
        if (
            topic_name is None or
            topic_name == constants.TOPIC_SENTINEL_NAME_ALL
        ):
            return None
        topic = topic_fetchers.get_topic_by_name(topic_name)
        if topic is None:
            raise self.InvalidInputException(
                f'The topic \'{topic_name}\' is not valid')
        return topic.get_all_skill_ids()

    @acl_decorators.can_view_reviewable_suggestions
    def get(self, target_type: str, suggestion_type: str) -> None:
        """Handles GET requests.

        Args:
            target_type: str. The type of the suggestion target.
            suggestion_type: str. The type of the suggestion.

        Raises:
            ValueError. If limit is None for question suggestions.
        """
        assert self.user_id is not None
        assert self.normalized_request is not None
        self._require_valid_suggestion_and_target_types(
            target_type, suggestion_type)
        limit = self.normalized_request.get('limit')
        offset = self.normalized_request['offset']
        sort_key = self.normalized_request['sort_key']
        exploration_id = self.normalized_request.get('exploration_id')
        exp_ids = [exploration_id] if exploration_id else []
        user_settings = user_services.get_user_settings(self.user_id)
        # User_settings.preferred_translation_language_code is the language
        # selected by user in language filter of contributor dashboard.
        language_code_to_filter_by = (
            user_settings.preferred_translation_language_code)
        suggestions: Sequence[suggestion_registry.BaseSuggestion] = []
        next_offset = 0
        if suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT:
            reviewable_suggestions: List[
                suggestion_registry.SuggestionTranslateContent] = []
            if (exp_ids and len(exp_ids) == 1 and language_code_to_filter_by):
                reviewable_suggestions, next_offset = (
                    suggestion_services
                    .get_reviewable_translation_suggestions_for_single_exp(
                        self.user_id, exp_ids[0],
                        language_code_to_filter_by))
            else:
                # TODO(#18745): Deprecate the
                # get_reviewable_translation_suggestions_by_offset method
                # as its limit is unbounded and it can be given an
                # unlimited number of exp_ids.
                reviewable_suggestions, next_offset = (
                    suggestion_services
                    .get_reviewable_translation_suggestions_by_offset(
                        self.user_id, exp_ids, limit, offset, sort_key))
            suggestions = (
                suggestion_services
                .get_suggestions_with_editable_explorations(
                    reviewable_suggestions))
        elif suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION:
            if limit is None:
                raise ValueError(
                    'Limit must be provided for question suggestions.')
            topic_name = self.normalized_request.get('topic_name')
            skill_ids = self._get_skill_ids_for_topic(topic_name)

            suggestions, next_offset = (
                suggestion_services
                .get_reviewable_question_suggestions_by_offset(
                    self.user_id, limit, offset, sort_key, skill_ids))
        self._render_suggestions(target_type, suggestions, next_offset)


class UserSubmittedSuggestionsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of UserSubmittedSuggestionsHandler's
    normalized_request dictionary.
    """

    limit: int
    offset: int
    sort_key: str


class UserSubmittedSuggestionsHandler(
    SuggestionsProviderHandler[
        Dict[str, str],
        UserSubmittedSuggestionsHandlerNormalizedRequestDict
    ]
):
    """Provides all suggestions which are submitted by the user for a given
    suggestion type.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'target_type': {
            'schema': {
                'type': 'basestring',
            },
            'choices': feconf.SUGGESTION_TARGET_TYPE_CHOICES
        },
        'suggestion_type': {
            'schema': {
                'type': 'basestring',
            },
            'choices': feconf.SUGGESTION_TYPE_CHOICES
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'limit': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                }
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
            'sort_key': {
                'schema': {
                    'type': 'basestring'
                },
                'choices': feconf.SUGGESTIONS_SORT_KEYS,
            }
        }
    }

    @acl_decorators.can_suggest_changes
    def get(self, target_type: str, suggestion_type: str) -> None:
        """Handles GET requests.

        Args:
            target_type: str. The type of the suggestion target.
            suggestion_type: str. The type of the suggestion.
        """
        assert self.user_id is not None
        assert self.normalized_request is not None
        self._require_valid_suggestion_and_target_types(
            target_type, suggestion_type)
        limit = self.normalized_request['limit']
        offset = self.normalized_request['offset']
        sort_key = self.normalized_request['sort_key']
        suggestions, next_offset = (
            suggestion_services.get_submitted_suggestions_by_offset(
                self.user_id, suggestion_type, limit, offset, sort_key
            )
        )
        if suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT:
            # Here we use cast because the above 'if' condition can only be
            # true if suggestion_type is 'translate_content', and if the above
            # condition is true then it guaranteed that the fetched suggestions
            # will be of type 'SuggestionTranslateContent'. So, to narrow
            # down the type from Sequence[BaseSuggestion] to Sequence[
            # SuggestionTranslateContent], we have used cast here.
            translatable_suggestions = cast(
                Sequence[suggestion_registry.SuggestionTranslateContent],
                suggestions
            )
            suggestions_with_translatable_exps = (
                suggestion_services
                .get_suggestions_with_editable_explorations(
                    translatable_suggestions))
            while (
                len(translatable_suggestions) > 0 and
                len(suggestions_with_translatable_exps) == 0
            ):
                # If all of the fetched suggestions are filtered out, then keep
                # fetching until we have some suggestions to return or there
                # are no more results.
                translatable_suggestions, next_offset = (
                    suggestion_services.get_submitted_suggestions_by_offset(
                        self.user_id,
                        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                        limit,
                        next_offset,
                        sort_key
                    )
                )
                suggestions_with_translatable_exps = (
                    suggestion_services
                    .get_suggestions_with_editable_explorations(
                        translatable_suggestions
                    )
                )
            suggestions = suggestions_with_translatable_exps

        self._render_suggestions(target_type, suggestions, next_offset)


class SuggestionListHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handles list operations on suggestions."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'suggestion_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.SUGGESTION_TYPE_CHOICES
                },
                'default_value': None
            },
            'target_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.SUGGESTION_TARGET_TYPE_CHOICES
                },
                'default_value': None
            },
            'target_id': {
                'schema': SCHEMA_FOR_TARGET_ID,
                'default_value': None
            },
            'author_id': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_valid_user_id'
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        # The query_fields_and_values variable is a list of tuples. The first
        # element in each tuple is the field being queried and the second
        # element is the value of the field being queried.
        # request.GET.items() parses the params from the url into the above
        # format. So in the url, the query should be passed as:
        # ?field1=value1&field2=value2...fieldN=valueN.
        query_fields_and_values = list(self.request.GET.items())
        suggestions = suggestion_services.query_suggestions(
            query_fields_and_values)

        self.values.update({'suggestions': [s.to_dict() for s in suggestions]})
        self.render_json(self.values)


class UpdateTranslationSuggestionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of UpdateTranslationSuggestionHandler's
    normalized_payload dictionary.
    """

    translation_html: str


class UpdateTranslationSuggestionHandler(
    base.BaseHandler[
        UpdateTranslationSuggestionHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handles update operations relating to translation suggestions."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'suggestion_id': {
            'schema': {
                'type': 'basestring',
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'translation_html': {
                'schema': {
                    'type': 'basestring',
                }
            }
        }
    }

    @acl_decorators.can_update_suggestion
    def put(self, suggestion_id: str) -> None:
        """Handles PUT requests.

        Raises:
            InvalidInputException. The suggestion is already handled.
        """
        assert self.normalized_payload is not None
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if suggestion.is_handled:
            raise self.InvalidInputException(
                'The suggestion with id %s has been accepted or rejected'
                % (suggestion_id)
            )

        suggestion_services.update_translation_suggestion(
            suggestion_id, self.normalized_payload['translation_html']
        )

        self.render_json(self.values)


class UpdateQuestionSuggestionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of UpdateQuestionSuggestionHandler's
    normalized_payload dictionary.
    """

    skill_difficulty: float
    question_state_data: state_domain.StateDict
    next_content_id_index: int


class UpdateQuestionSuggestionHandler(
    base.BaseHandler[
        UpdateQuestionSuggestionHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handles update operations relating to question suggestions."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'suggestion_id': {
            'schema': {
                'type': 'basestring',
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'skill_difficulty': {
                'schema': {
                    'type': 'float',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }, {
                        'id': 'is_at_most',
                        'max_value': 1
                    }]
                }
            },
            'question_state_data': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.validate_question_state_dict
                    )
                }
            },
            'next_content_id_index': {
                'schema': {
                    'type': 'int'
                }
            }
        }
    }

    @acl_decorators.can_update_suggestion
    def post(self, suggestion_id: str) -> None:
        """Handles PUT requests.

        Raises:
            InvalidInputException. The suggestion is already handled.
        """
        assert self.normalized_payload is not None
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if suggestion.is_handled:
            raise self.InvalidInputException(
                'The suggestion with id %s has been accepted or rejected'
                % suggestion_id
            )

        suggestion_services.update_question_suggestion(
            suggestion_id,
            self.normalized_payload['skill_difficulty'],
            self.normalized_payload['question_state_data'],
            self.normalized_payload['next_content_id_index']
        )

        self.render_json(self.values)


def _get_target_id_to_exploration_opportunity_dict(
    suggestions: Sequence[suggestion_registry.BaseSuggestion]
) -> Dict[
    str, Optional[opportunity_domain.PartialExplorationOpportunitySummaryDict]
]:
    """Returns a dict of target_id to exploration opportunity summary dict.

    Args:
        suggestions: list(BaseSuggestion). A list of suggestions to retrieve
            opportunity dicts.

    Returns:
        dict. Dict mapping target_id to corresponding exploration opportunity
        summary dict.
    """
    target_ids = set(s.target_id for s in suggestions)
    opportunity_id_to_opportunity_dict = {
        opp_id: (opp.to_dict() if opp is not None else None)
        for opp_id, opp in (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                list(target_ids)).items())
    }
    return opportunity_id_to_opportunity_dict


def _get_target_id_to_skill_opportunity_dict(
    suggestions: Sequence[suggestion_registry.BaseSuggestion]
) -> Dict[str, Optional[FrontendSkillOpportunityDict]]:
    """Returns a dict of target_id to skill opportunity summary dict.

    Args:
        suggestions: list(BaseSuggestion). A list of suggestions to retrieve
            opportunity dicts.

    Returns:
        dict. Dict mapping target_id to corresponding skill opportunity dict.
    """
    target_ids = set(s.target_id for s in suggestions)
    # Here we use MyPy ignore because we are explicitly changing
    # the type from the Dict of 'SkillOpportunityDict' to the Dict of
    # 'FrontendSkillOpportunityDict', and this is done because below we
    # are adding new keys that are not defined on the 'SkillOpportunityDict'.
    opportunity_id_to_opportunity_dict: Dict[
        str, Optional[FrontendSkillOpportunityDict]
    ] = {
        opp_id: opp.to_dict() if opp is not None else None  # type: ignore[misc]
        for opp_id, opp in opportunity_services.get_skill_opportunities_by_ids(
            list(target_ids)).items()
    }
    opportunity_id_to_skill = {
        skill.id: skill
        for skill in skill_fetchers.get_multi_skills([
            opp['id']
            for opp in opportunity_id_to_opportunity_dict.values()
            if opp is not None])
    }

    for opp_id, skill in opportunity_id_to_skill.items():
        opportunity_dict = opportunity_id_to_opportunity_dict[opp_id]
        if skill is not None and opportunity_dict is not None:
            opportunity_dict['skill_rubrics'] = [
                rubric.to_dict() for rubric in skill.rubrics
            ]

    return opportunity_id_to_opportunity_dict


def _construct_exploration_suggestions(
    suggestions: Sequence[suggestion_registry.BaseSuggestion]
) -> List[FrontendBaseSuggestionDict]:
    """Returns exploration suggestions with current exploration content. If the
    exploration content is no longer available, e.g. the exploration state or
    content was deleted, the suggestion's change content is used for the
    exploration content instead.

    Args:
        suggestions: list(BaseSuggestion). A list of suggestions.

    Returns:
        list(dict). List of suggestion dicts with an additional
        exploration_content_html field representing the target
        exploration's current content.

    Raises:
        ValueError. Exploration content is unavailable.
    """
    suggestion_dicts: List[FrontendBaseSuggestionDict] = []
    exp_ids = {suggestion.target_id for suggestion in suggestions}
    exp_id_to_exp = exp_fetchers.get_multiple_explorations_by_id(list(exp_ids))
    for suggestion in suggestions:
        exploration = exp_id_to_exp[suggestion.target_id]
        content_html: Optional[Union[str, List[str]]] = None
        try:
            content_html = exploration.get_content_html(
                suggestion.change_cmd.state_name,
                suggestion.change_cmd.content_id)
        except ValueError:
            # Exploration content is no longer available.
            pass
        suggestion_dict = suggestion.to_dict()
        updated_suggestion_dict: FrontendBaseSuggestionDict = {
            'suggestion_id': suggestion_dict['suggestion_id'],
            'suggestion_type': suggestion_dict['suggestion_type'],
            'target_type': suggestion_dict['target_type'],
            'target_id': suggestion_dict['target_id'],
            'target_version_at_submission': (
                suggestion_dict['target_version_at_submission']
            ),
            'status': suggestion_dict['status'],
            'author_name': suggestion_dict['author_name'],
            'final_reviewer_id': suggestion_dict['final_reviewer_id'],
            'change_cmd': suggestion_dict['change_cmd'],
            'score_category': suggestion_dict['score_category'],
            'language_code': suggestion_dict['language_code'],
            'last_updated': suggestion_dict['last_updated'],
            'edited_by_reviewer': suggestion_dict['edited_by_reviewer'],
            'exploration_content_html': content_html
        }
        suggestion_dicts.append(updated_suggestion_dict)
    return suggestion_dicts


def _upload_suggestion_images(
    files: Dict[str, str],
    suggestion: suggestion_registry.BaseSuggestion,
    filenames: List[str]
) -> None:
    """Saves a suggestion's images to storage.

    Args:
        files: dict. Files containing a mapping of image
            filename to image blob.
        suggestion: BaseSuggestion. The suggestion for which images are being
            uploaded.
        filenames: list(str). The image filenames.
    """
    suggestion_image_context = suggestion.image_context
    # TODO(#10513): Find a way to save the images before the suggestion is
    # created.
    for filename in filenames:
        image = files[filename]
        decoded_image = base64.decodebytes(image.encode('utf-8'))
        file_format = (
            image_validation_services.validate_image_and_filename(
                decoded_image, filename))
        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            filename, suggestion_image_context, suggestion.target_id,
            decoded_image, 'image', image_is_compressible)

    target_entity_html_list = suggestion.get_target_entity_html_strings()
    target_image_filenames = (
        html_cleaner.get_image_filenames_from_html_strings(
            target_entity_html_list))

    fs_services.copy_images(
        suggestion.target_type, suggestion.target_id,
        suggestion_image_context, suggestion.target_id,
        target_image_filenames)
