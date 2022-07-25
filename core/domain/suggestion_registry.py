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

"""Registry for Oppia suggestions. Contains a BaseSuggestion class and
subclasses for each type of suggestion.
"""

from __future__ import annotations

import copy
import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.domain import html_cleaner
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import state_domain
from core.domain import user_services
from core.platform import models

from typing import Dict, Type, Union

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class BaseSuggestion:
    """Base class for a suggestion.

    Attributes:
        suggestion_id: str. The ID of the suggestion.
        suggestion_type: str. The type of the suggestion.
        target_type: str. The type of target entity being edited.
        target_id: str. The ID of the target entity being edited.
        target_version_at_submission: int. The version number of the target
            entity at the time of creation of the suggestion.
        status: str. The status of the suggestion.
        author_id: str. The ID of the user who submitted the suggestion.
        final_reviewer_id: str. The ID of the reviewer who has accepted/rejected
            the suggestion.
        change: Change. The details of the suggestion. This should be an
            object of type ExplorationChange, TopicChange, etc.
        score_category: str. The scoring category for the suggestion.
        last_updated: datetime.datetime. Date and time when the suggestion
            was last updated.
        language_code: str|None. The ISO 639-1 code used to query suggestions
            by language, or None if the suggestion type is not queryable by
            language.
        edited_by_reviewer: bool. Whether the suggestion is edited by the
            reviewer.
    """

    suggestion_id: str
    suggestion_type: str
    target_type: str
    target_version_at_submission: int
    target_id: str
    final_reviewer_id: str
    change: change_domain.BaseChange
    score_category: str
    last_updated: datetime.datetime
    edited_by_reviewer: bool
    language_code: str
    author_id: str

    def __init__(self, status, final_reviewer_id):
        """Initializes a Suggestion object."""
        self.status = status
        self.final_reviewer_id = final_reviewer_id

    def to_dict(self):
        """Returns a dict representation of a suggestion object.

        Returns:
            dict. A dict representation of a suggestion object.
        """
        return {
            'suggestion_id': self.suggestion_id,
            'suggestion_type': self.suggestion_type,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'target_version_at_submission': self.target_version_at_submission,
            'status': self.status,
            'author_name': self.get_author_name(),
            'final_reviewer_id': self.final_reviewer_id,
            'change': self.change.to_dict(),
            'score_category': self.score_category,
            'language_code': self.language_code,
            'last_updated': utils.get_time_in_millisecs(self.last_updated),
            'edited_by_reviewer': self.edited_by_reviewer
        }

    def get_score_type(self):
        """Returns the first part of the score category. The first part refers
        to the the type of scoring. The value of this part will be among
        suggestion_models.SCORE_TYPE_CHOICES.

        Returns:
            str. The first part of the score category.
        """
        return self.score_category.split(
            suggestion_models.SCORE_CATEGORY_DELIMITER)[0]

    def get_author_name(self):
        """Returns the author's username.

        Returns:
            str. The username of the author of the suggestion.
        """
        return user_services.get_username(self.author_id)

    def get_score_sub_type(self):
        """Returns the second part of the score category. The second part refers
        to the specific area where the author needs to be scored. This can be
        the category of the exploration, the language of the suggestion, or the
        skill linked to the question.

        Returns:
            str. The second part of the score category.
        """
        return self.score_category.split(
            suggestion_models.SCORE_CATEGORY_DELIMITER)[1]

    def set_suggestion_status_to_accepted(self):
        """Sets the status of the suggestion to accepted."""
        self.status = suggestion_models.STATUS_ACCEPTED

    def set_suggestion_status_to_in_review(self):
        """Sets the status of the suggestion to in review."""
        self.status = suggestion_models.STATUS_IN_REVIEW

    def set_suggestion_status_to_rejected(self):
        """Sets the status of the suggestion to rejected."""
        self.status = suggestion_models.STATUS_REJECTED

    def set_final_reviewer_id(self, reviewer_id):
        """Sets the final reviewer id of the suggestion to be reviewer_id.

        Args:
            reviewer_id: str. The ID of the user who completed the review.
        """
        self.final_reviewer_id = reviewer_id

    def validate(self):
        """Validates the BaseSuggestion object. Each subclass must implement
        this function.

        The subclasses must validate the change and score_category fields.

        Raises:
            ValidationError. One or more attributes of the BaseSuggestion object
                are invalid.
        """
        if (
                self.suggestion_type not in
                feconf.SUGGESTION_TYPE_CHOICES):
            raise utils.ValidationError(
                'Expected suggestion_type to be among allowed choices, '
                'received %s' % self.suggestion_type)

        if self.target_type not in feconf.SUGGESTION_TARGET_TYPE_CHOICES:
            raise utils.ValidationError(
                'Expected target_type to be among allowed choices, '
                'received %s' % self.target_type)

        if not isinstance(self.target_id, str):
            raise utils.ValidationError(
                'Expected target_id to be a string, received %s' % type(
                    self.target_id))

        if not isinstance(self.target_version_at_submission, int):
            raise utils.ValidationError(
                'Expected target_version_at_submission to be an int, '
                'received %s' % type(self.target_version_at_submission))

        if self.status not in suggestion_models.STATUS_CHOICES:
            raise utils.ValidationError(
                'Expected status to be among allowed choices, '
                'received %s' % self.status)

        if not isinstance(self.author_id, str):
            raise utils.ValidationError(
                'Expected author_id to be a string, received %s' % type(
                    self.author_id))

        if not utils.is_user_id_valid(
                self.author_id, allow_pseudonymous_id=True):
            raise utils.ValidationError(
                'Expected author_id to be in a valid user ID format, '
                'received %s' % self.author_id)

        if self.final_reviewer_id is not None:
            if not isinstance(self.final_reviewer_id, str):
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be a string, received %s' %
                    type(self.final_reviewer_id))
            if not utils.is_user_id_valid(
                    self.final_reviewer_id,
                    allow_system_user_id=True,
                    allow_pseudonymous_id=True
            ):
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be in a valid user ID '
                    'format, received %s' % self.final_reviewer_id)

        if not isinstance(self.score_category, str):
            raise utils.ValidationError(
                'Expected score_category to be a string, received %s' % type(
                    self.score_category))

        if (
                suggestion_models.SCORE_CATEGORY_DELIMITER not in
                self.score_category):
            raise utils.ValidationError(
                'Expected score_category to be of the form'
                ' score_type%sscore_sub_type, received %s' % (
                    suggestion_models.SCORE_CATEGORY_DELIMITER,
                    self.score_category))

        if (
                len(self.score_category.split(
                    suggestion_models.SCORE_CATEGORY_DELIMITER))) != 2:
            raise utils.ValidationError(
                'Expected score_category to be of the form'
                ' score_type%sscore_sub_type, received %s' % (
                    suggestion_models.SCORE_CATEGORY_DELIMITER,
                    self.score_category))

        if self.get_score_type() not in suggestion_models.SCORE_TYPE_CHOICES:
            raise utils.ValidationError(
                'Expected the first part of score_category to be among allowed'
                ' choices, received %s' % self.get_score_type())

    def accept(self, *args):
        """Accepts the suggestion. Each subclass must implement this
        function.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement accept.')

    def get_change_list_for_accepting_suggestion(self):
        """Before accepting the suggestion, a change_list needs to be generated
        from the change. Each subclass must implement this function.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement '
            'get_change_list_for_accepting_suggestion.')

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement '
            'pre_accept_validate.')

    def populate_old_value_of_change(self):
        """Populates the old_value field of the change."""
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement '
            'populate_old_value_of_change.')

    def pre_update_validate(self, change):
        """Performs the pre update validation. This function needs to be called
        before updating the suggestion.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement '
            'pre_update_validate.')

    def get_all_html_content_strings(self):
        """Gets all html content strings used in this suggestion."""
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement '
            'get_all_html_content_strings.')

    def get_target_entity_html_strings(self):
        """Gets all html content strings from target entity used in the
        suggestion.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement '
            'get_target_entity_html_strings.')

    def get_new_image_filenames_added_in_suggestion(self):
        """Returns the list of newly added image filenames in the suggestion.

        Returns:
            list(str). A list of newly added image filenames in the suggestion.
        """
        html_list = self.get_all_html_content_strings()
        all_image_filenames = (
            html_cleaner.get_image_filenames_from_html_strings(html_list))

        target_entity_html_list = self.get_target_entity_html_strings()
        target_image_filenames = (
            html_cleaner.get_image_filenames_from_html_strings(
                target_entity_html_list))

        new_image_filenames = utils.compute_list_difference(
            all_image_filenames, target_image_filenames)

        return new_image_filenames

    def _copy_new_images_to_target_entity_storage(self):
        """Copy newly added images in suggestion to the target entity
        storage.
        """
        new_image_filenames = self.get_new_image_filenames_added_in_suggestion()
        fs_services.copy_images(
            self.image_context, self.target_id, self.target_type,
            self.target_id, new_image_filenames)

    def convert_html_in_suggestion_change(self, conversion_fn):
        """Checks for HTML fields in a suggestion change and converts it
        according to the conversion function.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement '
            'convert_html_in_suggestion_change.')

    @property
    def is_handled(self):
        """Returns if the suggestion has either been accepted or rejected.

        Returns:
            bool. Whether the suggestion has been handled or not.
        """
        return self.status != suggestion_models.STATUS_IN_REVIEW


class SuggestionEditStateContent(BaseSuggestion):
    """Domain object for a suggestion of type
    SUGGESTION_TYPE_EDIT_STATE_CONTENT.
    """

    def __init__(
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, final_reviewer_id,
            change, score_category, language_code, edited_by_reviewer,
            last_updated=None):
        """Initializes an object of type SuggestionEditStateContent
        corresponding to the SUGGESTION_TYPE_EDIT_STATE_CONTENT choice.
        """
        super(SuggestionEditStateContent, self).__init__(
            status, final_reviewer_id)
        self.suggestion_id = suggestion_id
        self.suggestion_type = (
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        self.target_type = feconf.ENTITY_TYPE_EXPLORATION
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.author_id = author_id
        self.change: exp_domain.ExplorationChange = (
            exp_domain.ExplorationChange(change)
        )
        self.score_category = score_category
        self.language_code = language_code
        self.last_updated = last_updated
        self.edited_by_reviewer = edited_by_reviewer
        # Currently, we don't allow adding images in the "edit state content"
        # suggestion, so the image_context is None.
        self.image_context = None

    def validate(self):
        """Validates a suggestion object of type SuggestionEditStateContent.

        Raises:
            ValidationError. One or more attributes of the
                SuggestionEditStateContent object are invalid.
        """
        super(SuggestionEditStateContent, self).validate()

        if not isinstance(self.change, exp_domain.ExplorationChange):
            raise utils.ValidationError(
                'Expected change to be an ExplorationChange, received %s'
                % type(self.change))

        if self.get_score_type() != suggestion_models.SCORE_TYPE_CONTENT:
            raise utils.ValidationError(
                'Expected the first part of score_category to be %s '
                ', received %s' % (
                    suggestion_models.SCORE_TYPE_CONTENT,
                    self.get_score_type()))

        if self.change.cmd != exp_domain.CMD_EDIT_STATE_PROPERTY:
            raise utils.ValidationError(
                'Expected cmd to be %s, received %s' % (
                    exp_domain.CMD_EDIT_STATE_PROPERTY, self.change.cmd))

        if (self.change.property_name !=
                exp_domain.STATE_PROPERTY_CONTENT):
            raise utils.ValidationError(
                'Expected property_name to be %s, received %s' % (
                    exp_domain.STATE_PROPERTY_CONTENT,
                    self.change.property_name))

        # Suggestions of this type do not have an associated language code,
        # since they are not translation-related.
        if self.language_code is not None:
            raise utils.ValidationError(
                'Expected language_code to be None, received %s' % (
                    self.language_code))

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        self.validate()
        states = exp_fetchers.get_exploration_by_id(self.target_id).states
        if self.change.state_name not in states:
            raise utils.ValidationError(
                'Expected %s to be a valid state name' %
                self.change.state_name)

    def get_change_list_for_accepting_suggestion(self):
        """Gets a complete change for the suggestion.

        Returns:
            list(ExplorationChange). The change_list corresponding to the
            suggestion.
        """
        change = self.change
        exploration = exp_fetchers.get_exploration_by_id(self.target_id)
        old_content = (
            exploration.states[self.change.state_name].content.to_dict())

        change.old_value = old_content
        change.new_value['content_id'] = old_content['content_id']

        return [change]

    def populate_old_value_of_change(self):
        """Populates old value of the change."""
        exploration = exp_fetchers.get_exploration_by_id(self.target_id)
        if self.change.state_name not in exploration.states:
            # As the state doesn't exist now, we cannot find the content of the
            # state to populate the old_value field. So we set it as None.
            old_content = None
        else:
            old_content = (
                exploration.states[self.change.state_name].content.to_dict())

        self.change.old_value = old_content

    def accept(self, commit_message):
        """Accepts the suggestion.

        Args:
            commit_message: str. The commit message.
        """
        change_list = self.get_change_list_for_accepting_suggestion()
        exp_services.update_exploration(
            self.final_reviewer_id, self.target_id, change_list,
            commit_message, is_suggestion=True)

    def pre_update_validate(self, change):
        """Performs the pre update validation. This function needs to be called
        before updating the suggestion.

        Args:
            change: ExplorationChange. The new change.

        Raises:
            ValidationError. Invalid new change.
        """
        if self.change.cmd != change.cmd:
            raise utils.ValidationError(
                'The new change cmd must be equal to %s' %
                self.change.cmd)
        if self.change.property_name != change.property_name:
            raise utils.ValidationError(
                'The new change property_name must be equal to %s' %
                self.change.property_name)
        if self.change.state_name != change.state_name:
            raise utils.ValidationError(
                'The new change state_name must be equal to %s' %
                self.change.state_name)
        if self.change.new_value['html'] == change.new_value['html']:
            raise utils.ValidationError(
                'The new html must not match the old html')

    def get_all_html_content_strings(self):
        """Gets all html content strings used in this suggestion.

        Returns:
            list(str). The list of html content strings.
        """
        html_string_list = [self.change.new_value['html']]
        if self.change.old_value is not None:
            html_string_list.append(self.change.old_value['html'])
        return html_string_list

    def get_target_entity_html_strings(self):
        """Gets all html content strings from target entity used in the
        suggestion.

        Returns:
            list(str). The list of html content strings from target entity used
            in the suggestion.
        """
        if self.change.old_value is not None:
            return [self.change.old_value['html']]

        return []

    def convert_html_in_suggestion_change(self, conversion_fn):
        """Checks for HTML fields in a suggestion change and converts it
        according to the conversion function.

        Args:
            conversion_fn: function. The function to be used for converting the
                HTML.
        """
        if self.change.old_value is not None:
            self.change.old_value['html'] = (
                conversion_fn(self.change.old_value['html']))
        self.change.new_value['html'] = (
            conversion_fn(self.change.new_value['html']))


class SuggestionTranslateContent(BaseSuggestion):
    """Domain object for a suggestion of type
    SUGGESTION_TYPE_TRANSLATE_CONTENT.
    """

    def __init__(
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, final_reviewer_id,
            change, score_category, language_code, edited_by_reviewer,
            last_updated=None):
        """Initializes an object of type SuggestionTranslateContent
        corresponding to the SUGGESTION_TYPE_TRANSLATE_CONTENT choice.
        """
        super(SuggestionTranslateContent, self).__init__(
            status, final_reviewer_id)
        self.suggestion_id = suggestion_id
        self.suggestion_type = (
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.target_type = feconf.ENTITY_TYPE_EXPLORATION
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.author_id = author_id
        self.change: exp_domain.ExplorationChange = (
            exp_domain.ExplorationChange(change)
        )
        self.score_category = score_category
        self.language_code = language_code
        self.last_updated = last_updated
        self.edited_by_reviewer = edited_by_reviewer
        self.image_context = feconf.IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS

    def validate(self):
        """Validates a suggestion object of type SuggestionTranslateContent.

        Raises:
            ValidationError. One or more attributes of the
                SuggestionTranslateContent object are invalid.
        """
        super(SuggestionTranslateContent, self).validate()

        if not isinstance(self.change, exp_domain.ExplorationChange):
            raise utils.ValidationError(
                'Expected change to be an ExplorationChange, received %s'
                % type(self.change))
        # The score sub_type needs to match the validation for exploration
        # category, i.e the second part of the score_category should match
        # the target exploration's category and we have a prod validation
        # for the same.
        if self.get_score_type() != suggestion_models.SCORE_TYPE_TRANSLATION:
            raise utils.ValidationError(
                'Expected the first part of score_category to be %s '
                ', received %s' % (
                    suggestion_models.SCORE_TYPE_TRANSLATION,
                    self.get_score_type()))

        # TODO(#12981): Write a one-off job to modify all existing translation
        # suggestions that use DEPRECATED_CMD_ADD_TRANSLATION to use
        # CMD_ADD_WRITTEN_TRANSLATION instead. Suggestions in the future will
        # only use CMD_ADD_WRITTEN_TRANSLATION. DEPRECATED_CMD_ADD_TRANSLATION
        # is added in the following check to support older suggestions.
        accepted_cmds = [
            exp_domain.DEPRECATED_CMD_ADD_TRANSLATION,
            exp_domain.CMD_ADD_WRITTEN_TRANSLATION
        ]
        if self.change.cmd not in accepted_cmds:
            raise utils.ValidationError(
                'Expected cmd to be %s, received %s' % (
                    exp_domain.CMD_ADD_WRITTEN_TRANSLATION, self.change.cmd))

        if not utils.is_supported_audio_language_code(
                self.change.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.change.language_code)

        if self.language_code is None:
            raise utils.ValidationError('language_code cannot be None')

        if self.language_code != self.change.language_code:
            raise utils.ValidationError(
                'Expected language_code to be %s, received %s' % (
                    self.change.language_code, self.language_code))

    def pre_update_validate(self, change):
        """Performs the pre update validation. This function needs to be called
        before updating the suggestion.

        Args:
            change: ExplorationChange. The new change.

        Raises:
            ValidationError. Invalid new change.
        """
        if self.change.cmd != change.cmd:
            raise utils.ValidationError(
                'The new change cmd must be equal to %s' %
                self.change.cmd)
        if self.change.state_name != change.state_name:
            raise utils.ValidationError(
                'The new change state_name must be equal to %s' %
                self.change.state_name)
        if self.change.content_html != change.content_html:
            raise utils.ValidationError(
                'The new change content_html must be equal to %s' %
                self.change.content_html)
        if self.change.language_code != change.language_code:
            raise utils.ValidationError(
                'The language code must be equal to %s' %
                self.change.language_code)

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        self.validate()
        exploration = exp_fetchers.get_exploration_by_id(self.target_id)
        if self.change.state_name not in exploration.states:
            raise utils.ValidationError(
                'Expected %s to be a valid state name' % self.change.state_name)

    def accept(self, commit_message):
        """Accepts the suggestion.

        Args:
            commit_message: str. The commit message.
        """
        # If the translation is for a set of strings, we don't want to process
        # the HTML strings for images.
        if (
                hasattr(self.change, 'data_format') and
                state_domain.WrittenTranslation.is_data_format_list(
                    self.change.data_format)
        ):
            exp_services.update_exploration(
                self.final_reviewer_id, self.target_id, [self.change],
                commit_message, is_suggestion=True)
            return

        self._copy_new_images_to_target_entity_storage()
        exp_services.update_exploration(
            self.final_reviewer_id, self.target_id, [self.change],
            commit_message, is_suggestion=True)

    def get_all_html_content_strings(self):
        """Gets all html content strings used in this suggestion.

        Returns:
            list(str). The list of html content strings.
        """
        content_strings = []
        if isinstance(self.change.translation_html, list):
            content_strings.extend(self.change.translation_html)
        else:
            content_strings.append(self.change.translation_html)
        if isinstance(self.change.content_html, list):
            content_strings.extend(self.change.content_html)
        else:
            content_strings.append(self.change.content_html)
        return content_strings

    def get_target_entity_html_strings(self):
        """Gets all html content strings from target entity used in the
        suggestion.

        Returns:
            list(str). The list of html content strings from target entity used
            in the suggestion.
        """
        return [self.change.content_html]

    def convert_html_in_suggestion_change(self, conversion_fn):
        """Checks for HTML fields in a suggestion change and converts it
        according to the conversion function.

        Args:
            conversion_fn: function. The function to be used for converting the
                HTML.
        """
        self.change.content_html = (
            conversion_fn(self.change.content_html))
        self.change.translation_html = (
            conversion_fn(self.change.translation_html))


class SuggestionAddQuestion(BaseSuggestion):
    """Domain object for a suggestion of type SUGGESTION_TYPE_ADD_QUESTION.

    Attributes:
        suggestion_id: str. The ID of the suggestion.
        suggestion_type: str. The type of the suggestion.
        target_type: str. The type of target entity being edited, for this
            subclass, target type is 'skill'.
        target_id: str. The ID of the skill the question was submitted to.
        target_version_at_submission: int. The version number of the target
            topic at the time of creation of the suggestion.
        status: str. The status of the suggestion.
        author_id: str. The ID of the user who submitted the suggestion.
        final_reviewer_id: str. The ID of the reviewer who has accepted/rejected
            the suggestion.
        change_cmd: QuestionChange. The change associated with the suggestion.
        score_category: str. The scoring category for the suggestion.
        last_updated: datetime.datetime. Date and time when the suggestion
            was last updated.
        language_code: str. The ISO 639-1 code used to query suggestions
            by language. In this case it is the language code of the question.
        edited_by_reviewer: bool. Whether the suggestion is edited by the
            reviewer.
    """

    def __init__(
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, final_reviewer_id,
            change, score_category, language_code, edited_by_reviewer,
            last_updated=None):
        """Initializes an object of type SuggestionAddQuestion
        corresponding to the SUGGESTION_TYPE_ADD_QUESTION choice.
        """
        super(SuggestionAddQuestion, self).__init__(status, final_reviewer_id)
        self.suggestion_id = suggestion_id
        self.suggestion_type = feconf.SUGGESTION_TYPE_ADD_QUESTION
        self.target_type = feconf.ENTITY_TYPE_SKILL
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.author_id = author_id
        self.change: question_domain.QuestionSuggestionChange = (
            question_domain.QuestionSuggestionChange(change)
        )
        self.score_category = score_category
        self.language_code = language_code
        self.last_updated = last_updated
        self.image_context = feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS
        self._update_change_to_latest_state_schema_version()
        self.edited_by_reviewer = edited_by_reviewer

    def _update_change_to_latest_state_schema_version(self):
        """Holds the responsibility of performing a step-by-step, sequential
        update of the state structure inside the change_cmd based on the schema
        version of the current state dictionary.

        Raises:
            Exception. The state_schema_version of suggestion cannot be
                processed.
        """
        state_schema_version = self.change.question_dict[
            'question_state_data_schema_version']

        versioned_question_state = {
            'state': copy.deepcopy(
                self.change.question_dict['question_state_data'])
        }

        if not (25 <= state_schema_version
                <= feconf.CURRENT_STATE_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected state schema version to be in between 25 and %d, '
                'received %s.' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION, state_schema_version))

        while state_schema_version < feconf.CURRENT_STATE_SCHEMA_VERSION:
            question_domain.Question.update_state_from_model(
                versioned_question_state, state_schema_version)
            state_schema_version += 1

        self.change.question_dict['question_state_data'] = (
            versioned_question_state['state'])
        self.change.question_dict['question_state_data_schema_version'] = (
            state_schema_version)

    def validate(self):
        """Validates a suggestion object of type SuggestionAddQuestion.

        Raises:
            ValidationError. One or more attributes of the SuggestionAddQuestion
                object are invalid.
        """
        super(SuggestionAddQuestion, self).validate()

        if self.get_score_type() != suggestion_models.SCORE_TYPE_QUESTION:
            raise utils.ValidationError(
                'Expected the first part of score_category to be "%s" '
                ', received "%s"' % (
                    suggestion_models.SCORE_TYPE_QUESTION,
                    self.get_score_type()))
        if not isinstance(
                self.change, question_domain.QuestionSuggestionChange):
            raise utils.ValidationError(
                'Expected change to be an instance of QuestionSuggestionChange')

        if not self.change.cmd:
            raise utils.ValidationError('Expected change to contain cmd')

        if (
                self.change.cmd !=
                question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION):
            raise utils.ValidationError('Expected cmd to be %s, obtained %s' % (
                question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                self.change.cmd))

        if not self.change.question_dict:
            raise utils.ValidationError(
                'Expected change to contain question_dict')

        if self.language_code != constants.DEFAULT_LANGUAGE_CODE:
            raise utils.ValidationError(
                'Expected language_code to be %s, received %s' % (
                    constants.DEFAULT_LANGUAGE_CODE, self.language_code))

        if self.language_code != self.change.question_dict['language_code']:
            raise utils.ValidationError(
                'Expected question language_code(%s) to be same as suggestion '
                'language_code(%s)' % (
                    self.change.question_dict['language_code'],
                    self.language_code))

        if not self.change.skill_difficulty:
            raise utils.ValidationError(
                'Expected change to contain skill_difficulty')

        skill_difficulties = list(
            constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT.values())
        if self._get_skill_difficulty() not in skill_difficulties:
            raise utils.ValidationError(
                'Expected change skill_difficulty to be one of %s, found %s '
                % (skill_difficulties, self._get_skill_difficulty()))

        question = question_domain.Question(
            None, state_domain.State.from_dict(
                self.change.question_dict['question_state_data']),
            self.change.question_dict['question_state_data_schema_version'],
            self.change.question_dict['language_code'], None,
            self.change.question_dict['linked_skill_ids'],
            self.change.question_dict['inapplicable_skill_misconception_ids'])
        question_state_data_schema_version = (
            self.change.question_dict['question_state_data_schema_version'])
        if question_state_data_schema_version != (
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected question state schema version to be %s, received '
                '%s' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION,
                    question_state_data_schema_version))
        question.partial_validate()

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        if self.change.skill_id is None:
            raise utils.ValidationError('Expected change to contain skill_id')
        self.validate()

        skill_domain.Skill.require_valid_skill_id(self.change.skill_id)
        skill = skill_fetchers.get_skill_by_id(
            self.change.skill_id, strict=False)
        if skill is None:
            raise utils.ValidationError(
                'The skill with the given id doesn\'t exist.')

    def get_change_list_for_accepting_suggestion(self):
        pass

    def accept(self, unused_commit_message):
        """Accepts the suggestion.

        Args:
            unused_commit_message: str. This parameter is passed in for
                consistency with the existing suggestions. As a default commit
                message is used in the add_question function, the arg is unused.
        """
        question_dict = self.change.question_dict
        question_dict['version'] = 1
        question_dict['id'] = (
            question_services.get_new_question_id())
        question_dict['linked_skill_ids'] = [self.change.skill_id]
        question = question_domain.Question.from_dict(question_dict)
        question.validate()

        # Images need to be stored in the storage path corresponding to the
        # question.
        new_image_filenames = self.get_new_image_filenames_added_in_suggestion()

        # Image for interaction with Image Region is not included as an html
        # string. This image is included in the imagePath in customization args.
        # Other interactions such as Item Selection, Multiple Choice, Drag and
        # Drop Sort have ck editor that includes the images of the interactions
        # so that references for those images are included as html strings.
        if question.question_state_data.interaction.id == 'ImageClickInput':
            new_image_filenames.append(
                question.question_state_data.interaction.customization_args[
                    'imageAndRegions'].value['imagePath'])
        fs_services.copy_images(
            self.image_context, self.target_id, feconf.ENTITY_TYPE_QUESTION,
            question_dict['id'], new_image_filenames)

        question_services.add_question(self.author_id, question)

        skill = skill_fetchers.get_skill_by_id(
            self.change.skill_id, strict=False)
        if skill is None:
            raise utils.ValidationError(
                'The skill with the given id doesn\'t exist.')
        question_services.create_new_question_skill_link(
            self.author_id, question_dict['id'], self.change.skill_id,
            self._get_skill_difficulty())

    def populate_old_value_of_change(self):
        """Populates old value of the change."""
        pass

    def pre_update_validate(self, change):
        """Performs the pre update validation. This functions need to be called
        before updating the suggestion.

        Args:
            change: QuestionChange. The new change.

        Raises:
            ValidationError. Invalid new change.
        """
        if self.change.cmd != change.cmd:
            raise utils.ValidationError(
                'The new change cmd must be equal to %s' %
                self.change.cmd)
        if self.change.skill_id != change.skill_id:
            raise utils.ValidationError(
                'The new change skill_id must be equal to %s' %
                self.change.skill_id)

        if (self.change.skill_difficulty == change.skill_difficulty) and (
                self.change.question_dict == change.question_dict):
            raise utils.ValidationError(
                'At least one of the new skill_difficulty or question_dict '
                'should be changed.')

    def _get_skill_difficulty(self):
        """Returns the suggestion's skill difficulty."""
        return self.change.skill_difficulty

    def get_all_html_content_strings(self):
        """Gets all html content strings used in this suggestion.

        Returns:
            list(str). The list of html content strings.
        """
        state_object = (
            state_domain.State.from_dict(
                self.change.question_dict['question_state_data']))
        html_string_list = state_object.get_all_html_content_strings()
        return html_string_list

    def get_target_entity_html_strings(self):
        """Gets all html content strings from target entity used in the
        suggestion.
        """
        return []

    def convert_html_in_suggestion_change(self, conversion_fn):
        """Checks for HTML fields in the suggestion change and converts it
        according to the conversion function.

        Args:
            conversion_fn: function. The function to be used for converting the
                HTML.
        """
        self.change.question_dict['question_state_data'] = (
            state_domain.State.convert_html_fields_in_state(
                self.change.question_dict['question_state_data'],
                conversion_fn,
                state_uses_old_interaction_cust_args_schema=(
                    self.change.question_dict[
                        'question_state_data_schema_version'] < 38),
                state_uses_old_rule_template_schema=(
                    self.change.question_dict[
                        'question_state_data_schema_version'] < 45)
            )
        )


class BaseVoiceoverApplication:
    """Base class for a voiceover application."""

    def __init__(self):
        """Initializes a GeneralVoiceoverApplication object."""
        raise NotImplementedError(
            'Subclasses of BaseVoiceoverApplication should implement __init__.')

    def to_dict(self):
        """Returns a dict representation of a voiceover application object.

        Returns:
            dict. A dict representation of a voiceover application object.
        """
        return {
            'voiceover_application_id': self.voiceover_application_id,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'status': self.status,
            'author_name': self.get_author_name(),
            'final_reviewer_name': (
                None if self.final_reviewer_id is None else (
                    self.get_final_reviewer_name())),
            'language_code': self.language_code,
            'content': self.content,
            'filename': self.filename,
            'rejection_message': self.rejection_message
        }

    def get_author_name(self):
        """Returns the author's username.

        Returns:
            str. The username of the author of the voiceover application.
        """
        return user_services.get_username(self.author_id)

    def get_final_reviewer_name(self):
        """Returns the reviewer's username.

        Returns:
            str. The username of the reviewer of the voiceover application.
        """
        return user_services.get_username(self.final_reviewer_id)

    def validate(self):
        """Validates the BaseVoiceoverApplication object.

        Raises:
            ValidationError. One or more attributes of the
                BaseVoiceoverApplication object are invalid.
        """

        if self.target_type not in feconf.SUGGESTION_TARGET_TYPE_CHOICES:
            raise utils.ValidationError(
                'Expected target_type to be among allowed choices, '
                'received %s' % self.target_type)

        if not isinstance(self.target_id, str):
            raise utils.ValidationError(
                'Expected target_id to be a string, received %s' % type(
                    self.target_id))

        if self.status not in suggestion_models.STATUS_CHOICES:
            raise utils.ValidationError(
                'Expected status to be among allowed choices, '
                'received %s' % self.status)

        if not isinstance(self.author_id, str):
            raise utils.ValidationError(
                'Expected author_id to be a string, received %s' % type(
                    self.author_id))
        if self.status == suggestion_models.STATUS_IN_REVIEW:
            if self.final_reviewer_id is not None:
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be None as the '
                    'voiceover application is not yet handled.')
        else:
            if not isinstance(self.final_reviewer_id, str):
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be a string, received %s' % (
                        type(self.final_reviewer_id)))
            if self.status == suggestion_models.STATUS_REJECTED:
                if not isinstance(self.rejection_message, str):
                    raise utils.ValidationError(
                        'Expected rejection_message to be a string for a '
                        'rejected application, received %s' % type(
                            self.final_reviewer_id))
            if self.status == suggestion_models.STATUS_ACCEPTED:
                if self.rejection_message is not None:
                    raise utils.ValidationError(
                        'Expected rejection_message to be None for the '
                        'accepted voiceover application, received %s' % (
                            self.rejection_message))

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)
        if not utils.is_supported_audio_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)

        if not isinstance(self.filename, str):
            raise utils.ValidationError(
                'Expected filename to be a string, received %s' % type(
                    self.filename))

        if not isinstance(self.content, str):
            raise utils.ValidationError(
                'Expected content to be a string, received %s' % type(
                    self.content))

    def accept(self):
        """Accepts the voiceover application. Each subclass must implement this
        function.
        """
        raise NotImplementedError(
            'Subclasses of BaseVoiceoverApplication should implement accept.')

    def reject(self):
        """Rejects the voiceover application. Each subclass must implement this
        function.
        """
        raise NotImplementedError(
            'Subclasses of BaseVoiceoverApplication should implement reject.')

    @property
    def is_handled(self):
        """Returns true if the voiceover application has either been accepted or
        rejected.

        Returns:
            bool. Whether the voiceover application has been handled or not.
        """
        return self.status != suggestion_models.STATUS_IN_REVIEW


class ExplorationVoiceoverApplication(BaseVoiceoverApplication):
    """Domain object for a voiceover application for exploration."""

    def __init__( # pylint: disable=super-init-not-called
            self, voiceover_application_id, target_id, status, author_id,
            final_reviewer_id, language_code, filename, content,
            rejection_message):
        """Initializes a ExplorationVoiceoverApplication domain object.

        Args:
            voiceover_application_id: str. The ID of the voiceover application.
            target_id: str. The ID of the target entity.
            status: str. The status of the voiceover application.
            author_id: str. The ID of the user who submitted the voiceover
                application.
            final_reviewer_id: str|None. The ID of the reviewer who has
                accepted/rejected the voiceover application.
            language_code: str. The language code for the voiceover application.
            filename: str. The filename of the voiceover audio.
            content: str. The html content which is voiceover in the
                application.
            rejection_message: str. The plain text message submitted by the
                reviewer while rejecting the application.
        """
        self.voiceover_application_id = voiceover_application_id
        self.target_type = feconf.ENTITY_TYPE_EXPLORATION
        self.target_id = target_id
        self.status = status
        self.author_id = author_id
        self.final_reviewer_id = final_reviewer_id
        self.language_code = language_code
        self.filename = filename
        self.content = content
        self.rejection_message = rejection_message

    def accept(self, reviewer_id):
        """Accepts the voiceover application and updates the final_reviewer_id.

        Args:
            reviewer_id: str. The user ID of the reviewer.
        """
        self.final_reviewer_id = reviewer_id
        self.status = suggestion_models.STATUS_ACCEPTED
        self.validate()

    def reject(self, reviewer_id, rejection_message):
        """Rejects the voiceover application, updates the final_reviewer_id and
        adds rejection message.

        Args:
            reviewer_id: str. The user ID of the reviewer.
            rejection_message: str. The rejection message submitted by the
                reviewer.
        """
        self.status = suggestion_models.STATUS_REJECTED
        self.final_reviewer_id = reviewer_id
        self.rejection_message = rejection_message
        self.validate()


VOICEOVER_APPLICATION_TARGET_TYPE_TO_DOMAIN_CLASSES = {
    feconf.ENTITY_TYPE_EXPLORATION: (
        ExplorationVoiceoverApplication)
}

SUGGESTION_TYPES_TO_DOMAIN_CLASSES: Dict[
    str,
    Union[
        Type[SuggestionEditStateContent],
        Type[SuggestionTranslateContent],
        Type[SuggestionAddQuestion]
    ]
] = {
    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT: (
        SuggestionEditStateContent),
    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: (
        SuggestionTranslateContent),
    feconf.SUGGESTION_TYPE_ADD_QUESTION: SuggestionAddQuestion
}


class CommunityContributionStats:
    """Domain object for the CommunityContributionStatsModel.

    Attributes:
        translation_reviewer_counts_by_lang_code: dict. A dictionary where the
            keys represent the language codes that translation suggestions are
            offered in and the values correspond to the total number of
            reviewers who have permission to review translation suggestions in
            that language.
        translation_suggestion_counts_by_lang_code: dict. A dictionary where
            the keys represent the language codes that translation suggestions
            are offered in and the values correspond to the total number of
            translation suggestions that are currently in review in that
            language.
        question_reviewer_count: int. The total number of reviewers who have
            permission to review question suggestions.
        question_suggestion_count: int. The total number of question
            suggestions that are currently in review.
    """

    def __init__(
            self, translation_reviewer_counts_by_lang_code,
            translation_suggestion_counts_by_lang_code,
            question_reviewer_count, question_suggestion_count):
        self.translation_reviewer_counts_by_lang_code = (
            translation_reviewer_counts_by_lang_code
        )
        self.translation_suggestion_counts_by_lang_code = (
            translation_suggestion_counts_by_lang_code
        )
        self.question_reviewer_count = question_reviewer_count
        self.question_suggestion_count = question_suggestion_count

    def validate(self):
        """Validates the CommunityContributionStats object.

        Raises:
            ValidationError. One or more attributes of the
                CommunityContributionStats object is invalid.
        """
        for language_code, reviewer_count in (
                self.translation_reviewer_counts_by_lang_code.items()):
            # Translation languages are a part of audio languages.
            if not utils.is_supported_audio_language_code(language_code):
                raise utils.ValidationError(
                    'Invalid language code for the translation reviewer '
                    'counts: %s.' % language_code
                )
            if not isinstance(reviewer_count, int):
                raise utils.ValidationError(
                    'Expected the translation reviewer count to be '
                    'an integer for %s language code, received: %s.' % (
                        language_code, reviewer_count)
                )
            if reviewer_count < 0:
                raise utils.ValidationError(
                    'Expected the translation reviewer count to be '
                    'non-negative for %s language code, received: %s.' % (
                        language_code, reviewer_count)
                )

        for language_code, suggestion_count in (
                self.translation_suggestion_counts_by_lang_code.items()):
            # Translation languages are a part of audio languages.
            if not utils.is_supported_audio_language_code(language_code):
                raise utils.ValidationError(
                    'Invalid language code for the translation suggestion '
                    'counts: %s.' % language_code
                )
            if not isinstance(suggestion_count, int):
                raise utils.ValidationError(
                    'Expected the translation suggestion count to be '
                    'an integer for %s language code, received: %s.' % (
                        language_code, suggestion_count)
                )
            if suggestion_count < 0:
                raise utils.ValidationError(
                    'Expected the translation suggestion count to be '
                    'non-negative for %s language code, received: %s.' % (
                        language_code, suggestion_count)
                )

        if not isinstance(self.question_reviewer_count, int):
            raise utils.ValidationError(
                'Expected the question reviewer count to be an integer, '
                'received: %s.' % self.question_reviewer_count
            )
        if self.question_reviewer_count < 0:
            raise utils.ValidationError(
                'Expected the question reviewer count to be non-negative, '
                'received: %s.' % (self.question_reviewer_count)
            )

        if not isinstance(self.question_suggestion_count, int):
            raise utils.ValidationError(
                'Expected the question suggestion count to be an integer, '
                'received: %s.' % self.question_suggestion_count
            )
        if self.question_suggestion_count < 0:
            raise utils.ValidationError(
                'Expected the question suggestion count to be non-negative, '
                'received: %s.' % (self.question_suggestion_count)
            )

    def set_translation_reviewer_count_for_language_code(
            self, language_code, count):
        """Sets the translation reviewer count to be count, for the given
        language code.

        Args:
            language_code: str. The translation suggestion language code that
                reviewers have the rights to review.
            count: int. The number of reviewers that have the rights to review
                translation suggestions in language_code.
        """
        self.translation_reviewer_counts_by_lang_code[language_code] = count

    def set_translation_suggestion_count_for_language_code(
            self, language_code, count):
        """Sets the translation suggestion count to be count, for the language
        code given.

        Args:
            language_code: str. The translation suggestion language code.
            count: int. The number of translation suggestions in language_code
                that are currently in review.
        """
        self.translation_suggestion_counts_by_lang_code[language_code] = count

    def are_translation_reviewers_needed_for_lang_code(self, lang_code):
        """Returns whether or not more reviewers are needed to review
        translation suggestions in the given language code. Translation
        suggestions in a given language need more reviewers if the number of
        translation suggestions in that language divided by the number of
        translation reviewers in that language is greater than
        config_domain.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER.

        Args:
            lang_code: str. The language code of the translation
                suggestions.

        Returns:
            bool. Whether or not more reviewers are needed to review
            translation suggestions in the given language code.
       """
        if lang_code not in self.translation_suggestion_counts_by_lang_code:
            return False

        if lang_code not in self.translation_reviewer_counts_by_lang_code:
            return True

        number_of_reviewers = (
            self.translation_reviewer_counts_by_lang_code[lang_code])
        number_of_suggestions = (
            self.translation_suggestion_counts_by_lang_code[lang_code])
        return (
            number_of_suggestions > (
                config_domain.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER.value * (
                    number_of_reviewers)))

    def get_translation_language_codes_that_need_reviewers(self):
        """Returns the language codes where more reviewers are needed to review
        translations in those language codes. Translation suggestions in a
        given language need more reviewers if the number of translation
        suggestions in that language divided by the number of translation
        reviewers in that language is greater than
        config_domain.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER.

        Returns:
            set. A set of of the language codes where more translation reviewers
            are needed.
        """
        language_codes_that_need_reviewers = set()
        for language_code in self.translation_suggestion_counts_by_lang_code:
            if self.are_translation_reviewers_needed_for_lang_code(
                    language_code):
                language_codes_that_need_reviewers.add(language_code)
        return language_codes_that_need_reviewers

    def are_question_reviewers_needed(self):
        """Returns whether or not more reviewers are needed to review question
        suggestions. Question suggestions need more reviewers if the number of
        question suggestions divided by the number of question reviewers is
        greater than config_domain.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER.

        Returns:
            bool. Whether or not more reviewers are needed to review
            question suggestions.
       """
        if self.question_suggestion_count == 0:
            return False

        if self.question_reviewer_count == 0:
            return True

        return (
            self.question_suggestion_count > (
                config_domain.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER.value * (
                    self.question_reviewer_count)))


class TranslationContributionStats:
    """Domain object for the TranslationContributionStatsModel."""

    def __init__(
            self, language_code, contributor_user_id, topic_id,
            submitted_translations_count, submitted_translation_word_count,
            accepted_translations_count,
            accepted_translations_without_reviewer_edits_count,
            accepted_translation_word_count, rejected_translations_count,
            rejected_translation_word_count, contribution_dates):
        self.language_code = language_code
        self.contributor_user_id = contributor_user_id
        self.topic_id = topic_id
        self.submitted_translations_count = submitted_translations_count
        self.submitted_translation_word_count = submitted_translation_word_count
        self.accepted_translations_count = accepted_translations_count
        self.accepted_translations_without_reviewer_edits_count = (
            accepted_translations_without_reviewer_edits_count
        )
        self.accepted_translation_word_count = accepted_translation_word_count
        self.rejected_translations_count = rejected_translations_count
        self.rejected_translation_word_count = rejected_translation_word_count
        self.contribution_dates = contribution_dates

    @classmethod
    def create_default(
        cls, language_code=None, contributor_user_id=None, topic_id=None
    ) -> TranslationContributionStats:
        """Create default translation contribution stats.

        Args:
            language_code: str. The language code for which are these stats
                generated.
            contributor_user_id: str. User ID of the contributor to which
                these stats belong.
            topic_id: str. ID of the topic for which were
                the translations created.

        Returns:
            TranslationContributionStats. Default translation contribution
            stats.
        """
        return cls(
            language_code, contributor_user_id, topic_id,
            0, 0, 0, 0, 0, 0, 0, set()
        )

    def to_dict(self):
        """Returns a dict representation of a TranslationContributionStats
        domain object.

        Returns:
            dict. A dict representation of a TranslationContributionStats
            domain object.
        """
        return {
            'language_code': self.language_code,
            'contributor_user_id': self.contributor_user_id,
            'topic_id': self.topic_id,
            'submitted_translations_count': self.submitted_translations_count,
            'submitted_translation_word_count': (
                self.submitted_translation_word_count),
            'accepted_translations_count': self.accepted_translations_count,
            'accepted_translations_without_reviewer_edits_count': (
                self.accepted_translations_without_reviewer_edits_count),
            'accepted_translation_word_count': (
                self.accepted_translation_word_count),
            'rejected_translations_count': self.rejected_translations_count,
            'rejected_translation_word_count': (
                self.rejected_translation_word_count),
            'contribution_dates': self.contribution_dates
        }


class ReviewableSuggestionEmailInfo:
    """Stores key information that is used to create the email content for
    notifying admins and reviewers that there are suggestions that need to be
    reviewed.

    Attributes:
        suggestion_type: str. The type of the suggestion.
        language_code: str. The language code of the suggestion.
        suggestion_content: str. The suggestion content that is emphasized for
            a user when they are viewing a list of suggestions on the
            Contributor Dashboard.
        submission_datetime: datetime.datetime. Date and time when the
            suggestion was submitted for review.
    """

    def __init__(
        self,
        suggestion_type: str,
        language_code: str,
        suggestion_content: str,
        submission_datetime: datetime.datetime
    ) -> None:
        self.suggestion_type = suggestion_type
        self.language_code = language_code
        self.suggestion_content = suggestion_content
        self.submission_datetime = submission_datetime
