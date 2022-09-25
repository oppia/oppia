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
from core.domain import exp_fetchers
from core.domain import fs_services
from core.domain import html_cleaner
from core.domain import image_validation_services
from core.domain import opportunity_services
from core.domain import skill_fetchers
from core.domain import state_domain
from core.domain import suggestion_services


class SuggestionHandler(base.BaseHandler):
    """"Handles operations relating to suggestions."""

    URL_PATH_ARGS_SCHEMAS = {}
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
            'change': {
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
    def post(self):
        """Handles POST requests."""
        if (self.normalized_payload.get('suggestion_type') ==
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT):
            raise self.InvalidInputException(
                'Content suggestion submissions are no longer supported.')

        suggestion = suggestion_services.create_suggestion(
            self.normalized_payload.get('suggestion_type'),
            self.normalized_payload.get('target_type'),
            self.normalized_payload.get('target_id'),
            self.normalized_payload.get('target_version_at_submission'),
            self.user_id,
            self.normalized_payload.get('change'),
            self.normalized_payload.get('description'))

        suggestion_change = suggestion.change
        if (
                suggestion_change.cmd == 'add_written_translation' and
                suggestion_change.data_format in
                (
                    state_domain.WrittenTranslation
                    .DATA_FORMAT_SET_OF_NORMALIZED_STRING,
                    state_domain.WrittenTranslation
                    .DATA_FORMAT_SET_OF_UNICODE_STRING
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
        if self.normalized_payload.get(
            'suggestion_type') != (feconf.SUGGESTION_TYPE_ADD_QUESTION):
            _upload_suggestion_images(
                self.normalized_payload.get('files'),
                suggestion,
                suggestion.get_new_image_filenames_added_in_suggestion())

        self.render_json(self.values)


class SuggestionToExplorationActionHandler(base.BaseHandler):
    """Handles actions performed on suggestions to explorations."""

    @acl_decorators.get_decorator_for_accepting_suggestion(
        acl_decorators.can_edit_exploration)
    def put(self, target_id, suggestion_id):
        """Handles PUT requests.

        Args:
            target_id: str. The ID of the suggestion target.
            suggestion_id: str. The ID of the suggestion.
        """
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

        action = self.payload.get('action')
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        if suggestion.author_id == self.user_id:
            raise self.UnauthorizedUserException(
                'You cannot accept/reject your own suggestion.')

        if action == constants.ACTION_ACCEPT_SUGGESTION:
            commit_message = self.payload.get('commit_message')
            if (commit_message is not None and
                    len(commit_message) > constants.MAX_COMMIT_MESSAGE_LENGTH):
                raise self.InvalidInputException(
                    'Commit messages must be at most %s characters long.'
                    % constants.MAX_COMMIT_MESSAGE_LENGTH)
            suggestion_services.accept_suggestion(
                suggestion_id, self.user_id, self.payload.get('commit_message'),
                self.payload.get('review_message'))
        elif action == constants.ACTION_REJECT_SUGGESTION:
            suggestion_services.reject_suggestion(
                suggestion_id, self.user_id, self.payload.get('review_message'))
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json(self.values)


class ResubmitSuggestionHandler(base.BaseHandler):
    """Handler to reopen a rejected suggestion."""

    @acl_decorators.can_resubmit_suggestion
    def put(self, suggestion_id):
        """Handles PUT requests.

        Args:
            suggestion_id: str. The ID of the suggestion.
        """
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        new_change = self.payload.get('change')
        change_cls = type(suggestion.change)
        change_object = change_cls(new_change)
        summary_message = self.payload.get('summary_message')
        suggestion_services.resubmit_rejected_suggestion(
            suggestion_id, summary_message, self.user_id, change_object)
        self.render_json(self.values)


class SuggestionToSkillActionHandler(base.BaseHandler):
    """Handles actions performed on suggestions to skills."""

    @acl_decorators.get_decorator_for_accepting_suggestion(
        acl_decorators.can_edit_skill)
    def put(self, target_id, suggestion_id):
        """Handles PUT requests.

        Args:
            target_id: str. The ID of the suggestion target.
            suggestion_id: str. The ID of the suggestion.
        """
        if suggestion_id.split('.')[0] != feconf.ENTITY_TYPE_SKILL:
            raise self.InvalidInputException(
                'This handler allows actions only on suggestions to skills.')

        if suggestion_id.split('.')[1] != target_id:
            raise self.InvalidInputException(
                'The skill id provided does not match the skill id present as '
                'part of the suggestion_id')

        action = self.payload.get('action')

        if action == constants.ACTION_ACCEPT_SUGGESTION:
            # Question suggestions do not use commit messages.
            suggestion_services.accept_suggestion(
                suggestion_id, self.user_id, 'UNUSED_COMMIT_MESSAGE',
                self.payload.get('review_message'))

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
        elif action == constants.ACTION_REJECT_SUGGESTION:
            suggestion_services.reject_suggestion(
                suggestion_id, self.user_id, self.payload.get('review_message'))
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json(self.values)


class SuggestionsProviderHandler(base.BaseHandler):
    """Provides suggestions for a user and given suggestion type."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def _require_valid_suggestion_and_target_types(
            self, target_type, suggestion_type):
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

    def _render_suggestions(self, target_type, suggestions, next_offset):
        """Renders retrieved suggestions.

        Args:
            target_type: str. The suggestion type.
            suggestions: list(BaseSuggestion). A list of suggestions to render.
            next_offset: int. The number of results to skip from the beginning
                of all results matching the original query.
        """
        if target_type == feconf.ENTITY_TYPE_EXPLORATION:
            target_id_to_opportunity_dict = (
                _get_target_id_to_exploration_opportunity_dict(suggestions))
            self.render_json({
                'suggestions': _construct_exploration_suggestions(suggestions),
                'target_id_to_opportunity_dict':
                    target_id_to_opportunity_dict,
                'next_offset': next_offset
            })
        elif target_type == feconf.ENTITY_TYPE_SKILL:
            target_id_to_opportunity_dict = (
                _get_target_id_to_skill_opportunity_dict(suggestions))
            self.render_json({
                'suggestions': [s.to_dict() for s in suggestions],
                'target_id_to_opportunity_dict':
                    target_id_to_opportunity_dict,
                'next_offset': next_offset
            })
        else:
            self.render_json({})


class ReviewableSuggestionsHandler(SuggestionsProviderHandler):
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
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_view_reviewable_suggestions
    def get(self, target_type, suggestion_type):
        """Handles GET requests.

        Args:
            target_type: str. The type of the suggestion target.
            suggestion_type: str. The type of the suggestion.
        """
        self._require_valid_suggestion_and_target_types(
            target_type, suggestion_type)
        limit = self.normalized_request.get('limit')
        offset = self.normalized_request.get('offset')
        exploration_id = self.normalized_request.get('exploration_id')

        suggestions = []
        next_offset = 0
        if suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT:
            suggestions, next_offset = (
                suggestion_services.
                get_reviewable_translation_suggestions_by_offset(
                    self.user_id,
                    [exploration_id],
                    limit, offset))
        elif suggestion_type == feconf.SUGGESTION_TYPE_ADD_QUESTION:
            suggestions, next_offset = (
                suggestion_services.
                get_reviewable_question_suggestions_by_offset(
                    self.user_id, limit, offset))
        self._render_suggestions(target_type, suggestions, next_offset)


class UserSubmittedSuggestionsHandler(SuggestionsProviderHandler):
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
            }
        }
    }

    @acl_decorators.can_suggest_changes
    def get(self, target_type, suggestion_type):
        """Handles GET requests.

        Args:
            target_type: str. The type of the suggestion target.
            suggestion_type: str. The type of the suggestion.
        """
        self._require_valid_suggestion_and_target_types(
            target_type, suggestion_type)
        limit = self.normalized_request.get('limit')
        offset = self.normalized_request.get('offset')
        suggestions, next_offset = (
            suggestion_services.get_submitted_suggestions_by_offset(
            self.user_id, suggestion_type, limit, offset))
        if suggestion_type == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT:
            translatable_suggestions = (
                suggestion_services
                .get_suggestions_with_translatable_explorations(
                    suggestions))
            while (
                len(suggestions) > 0 and
                len(translatable_suggestions) == 0
            ):
                # If all of the fetched suggestions are filtered out, then keep
                # fetching until we have some suggestions to return or there
                # are no more results.
                suggestions, next_offset = (
                    suggestion_services.get_submitted_suggestions_by_offset(
                    self.user_id, suggestion_type, limit, next_offset))
                translatable_suggestions = (
                    suggestion_services
                    .get_suggestions_with_translatable_explorations(
                        suggestions))
            suggestions = translatable_suggestions

        self._render_suggestions(target_type, suggestions, next_offset)


class SuggestionListHandler(base.BaseHandler):
    """Handles list operations on suggestions."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {}

    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        # The query_fields_and_values variable is a list of tuples. The first
        # element in each tuple is the field being queried and the second
        # element is the value of the field being queried.
        # request.GET.items() parses the params from the url into the above
        # format. So in the url, the query should be passed as:
        # ?field1=value1&field2=value2...fieldN=valueN.
        query_fields_and_values = list(self.request.GET.items())

        for query in query_fields_and_values:
            if query[0] not in feconf.ALLOWED_SUGGESTION_QUERY_FIELDS:
                raise self.InvalidInputException(
                    'Not allowed to query on field %s' % query[0])

        suggestions = suggestion_services.query_suggestions(
            query_fields_and_values)

        self.values.update({'suggestions': [s.to_dict() for s in suggestions]})
        self.render_json(self.values)


class UpdateTranslationSuggestionHandler(base.BaseHandler):
    """Handles update operations relating to translation suggestions."""

    @acl_decorators.can_update_suggestion
    def put(self, suggestion_id):
        """Handles PUT requests.

        Raises:
            InvalidInputException. The suggestion is already handled.
            InvalidInputException. The 'translation_html' parameter is missing.
            InvalidInputException. The 'translation_html' parameter is not a
                string.
        """
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if suggestion.is_handled:
            raise self.InvalidInputException(
                'The suggestion with id %s has been accepted or rejected'
                % (suggestion_id)
            )

        if self.payload.get('translation_html') is None:
            raise self.InvalidInputException(
                'The parameter \'translation_html\' is missing.'
            )

        if (
                not isinstance(self.payload.get('translation_html'), str)
                and not isinstance(self.payload.get('translation_html'), list)
        ):
            raise self.InvalidInputException(
                'The parameter \'translation_html\' should be a string or a' +
                ' list.'
            )

        suggestion_services.update_translation_suggestion(
            suggestion_id, self.payload.get('translation_html'))

        self.render_json(self.values)


class UpdateQuestionSuggestionHandler(base.BaseHandler):
    """Handles update operations relating to question suggestions."""

    @acl_decorators.can_update_suggestion
    def post(self, suggestion_id):
        """Handles PUT requests.

        Raises:
            InvalidInputException. The suggestion is already handled.
            InvalidInputException. The 'skill_difficulty' parameter is missing.
            InvalidInputException. The 'skill_difficulty' is not a decimal.
            InvalidInputException. The 'question_state_data' parameter is
                missing.
            InvalidInputException. The 'question_state_data' parameter is
                invalid.
        """
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if suggestion.is_handled:
            raise self.InvalidInputException(
                'The suggestion with id %s has been accepted or rejected'
                % suggestion_id
            )

        if self.payload.get('skill_difficulty') is None:
            raise self.InvalidInputException(
                'The parameter \'skill_difficulty\' is missing.'
            )

        if not isinstance(self.payload.get('skill_difficulty'), (float, int)):
            raise self.InvalidInputException(
                'The parameter \'skill_difficulty\' should be a decimal.'
            )

        if self.payload.get('question_state_data') is None:
            raise self.InvalidInputException(
                'The parameter \'question_state_data\' is missing.'
            )

        question_state_data_obj = state_domain.State.from_dict(
            self.payload.get('question_state_data'))
        question_state_data_obj.validate(None, False)

        suggestion_services.update_question_suggestion(
            suggestion_id,
            self.payload.get('skill_difficulty'),
            self.payload.get('question_state_data'))

        self.render_json(self.values)


def _get_target_id_to_exploration_opportunity_dict(suggestions):
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


def _get_target_id_to_skill_opportunity_dict(suggestions):
    """Returns a dict of target_id to skill opportunity summary dict.

    Args:
        suggestions: list(BaseSuggestion). A list of suggestions to retrieve
            opportunity dicts.

    Returns:
        dict. Dict mapping target_id to corresponding skill opportunity dict.
    """
    target_ids = set(s.target_id for s in suggestions)
    opportunity_id_to_opportunity_dict = {
        opp_id: (opp.to_dict() if opp is not None else None)
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
        if skill is not None:
            opportunity_id_to_opportunity_dict[opp_id]['skill_rubrics'] = [
                rubric.to_dict() for rubric in skill.rubrics]

    return opportunity_id_to_opportunity_dict


def _construct_exploration_suggestions(suggestions):
    """Returns exploration suggestions with current exploration content. This
    method assumes that the supplied suggestions represent changes that are
    still valid, e.g. the suggestions refer to content that still exist in the
    linked exploration.

    Args:
        suggestions: list(BaseSuggestion). A list of suggestions.

    Returns:
        list(dict). List of suggestion dicts with an additional
        exploration_content_html field representing the target
        exploration's current content.
    """
    suggestion_dicts = []
    exp_ids = {suggestion.target_id for suggestion in suggestions}
    exp_id_to_exp = exp_fetchers.get_multiple_explorations_by_id(list(exp_ids))
    for suggestion in suggestions:
        exploration = exp_id_to_exp[suggestion.target_id]
        content_html = exploration.get_content_html(
            suggestion.change.state_name, suggestion.change.content_id)
        suggestion_dict = suggestion.to_dict()
        suggestion_dict['exploration_content_html'] = content_html
        suggestion_dicts.append(suggestion_dict)
    return suggestion_dicts


def _upload_suggestion_images(files, suggestion, filenames):
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
        image = files.get(filename)
        image = base64.decodebytes(image.encode('utf-8'))
        file_format = (
            image_validation_services.validate_image_and_filename(
                image, filename))
        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            filename, suggestion_image_context, suggestion.target_id,
            image, 'image', image_is_compressible)

    target_entity_html_list = suggestion.get_target_entity_html_strings()
    target_image_filenames = (
        html_cleaner.get_image_filenames_from_html_strings(
            target_entity_html_list))

    fs_services.copy_images(
        suggestion.target_type, suggestion.target_id,
        suggestion_image_context, suggestion.target_id,
        target_image_filenames)
