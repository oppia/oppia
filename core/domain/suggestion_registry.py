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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
import feconf
import python_utils
import utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class BaseSuggestion(python_utils.OBJECT):
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
    """

    def __init__(self):
        """Initializes a Suggestion object."""
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement __init__.')

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
            'last_updated': utils.get_time_in_millisecs(self.last_updated)
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

    def validate(self):
        """Validates the BaseSuggestion object. Each subclass must implement
        this function.

        The subclasses must validate the change and score_category fields.

        Raises:
            ValidationError: One or more attributes of the BaseSuggestion object
                are invalid.
        """
        if (
                self.suggestion_type not in
                suggestion_models.SUGGESTION_TYPE_CHOICES):
            raise utils.ValidationError(
                'Expected suggestion_type to be among allowed choices, '
                'received %s' % self.suggestion_type)

        if self.target_type not in suggestion_models.TARGET_TYPE_CHOICES:
            raise utils.ValidationError(
                'Expected target_type to be among allowed choices, '
                'received %s' % self.target_type)

        if not isinstance(self.target_id, python_utils.BASESTRING):
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

        if not isinstance(self.author_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected author_id to be a string, received %s' % type(
                    self.author_id))

        if not isinstance(self.final_reviewer_id, python_utils.BASESTRING):
            if self.final_reviewer_id:
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be a string, received %s' %
                    type(self.final_reviewer_id))

        if not isinstance(self.score_category, python_utils.BASESTRING):
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

    def accept(self):
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

    def __init__( # pylint: disable=super-init-not-called
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, final_reviewer_id,
            change, score_category, last_updated):
        """Initializes an object of type SuggestionEditStateContent
        corresponding to the SUGGESTION_TYPE_EDIT_STATE_CONTENT choice.
        """
        self.suggestion_id = suggestion_id
        self.suggestion_type = (
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        self.target_type = suggestion_models.TARGET_TYPE_EXPLORATION
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.status = status
        self.author_id = author_id
        self.final_reviewer_id = final_reviewer_id
        self.change = exp_domain.ExplorationChange(change)
        self.score_category = score_category
        self.last_updated = last_updated

    def validate(self):
        """Validates a suggestion object of type SuggestionEditStateContent.

        Raises:
            ValidationError: One or more attributes of the
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

        if self.get_score_sub_type() not in constants.ALL_CATEGORIES:
            raise utils.ValidationError(
                'Expected the second part of score_category to be a valid'
                ' category, received %s' % self.get_score_sub_type())

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
            ValidationError: Invalid new change.
        """
        if self.change.cmd != change.cmd:
            raise utils.ValidationError(
                'The new change cmd must be equal to %s' %
                self.change.cmd)
        elif self.change.property_name != change.property_name:
            raise utils.ValidationError(
                'The new change property_name must be equal to %s' %
                self.change.property_name)
        elif self.change.state_name != change.state_name:
            raise utils.ValidationError(
                'The new change state_name must be equal to %s' %
                self.change.state_name)
        elif self.change.new_value['html'] == change.new_value['html']:
            raise utils.ValidationError(
                'The new html must not match the old html')


class SuggestionTranslateContent(BaseSuggestion):
    """Domain object for a suggestion of type
    SUGGESTION_TYPE_TRANSLATE_CONTENT.
    """

    def __init__( # pylint: disable=super-init-not-called
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, final_reviewer_id,
            change, score_category, last_updated):
        """Initializes an object of type SuggestionTranslateContent
        corresponding to the SUGGESTION_TYPE_TRANSLATE_CONTENT choice.
        """
        self.suggestion_id = suggestion_id
        self.suggestion_type = (
            suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT)
        self.target_type = suggestion_models.TARGET_TYPE_EXPLORATION
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.status = status
        self.author_id = author_id
        self.final_reviewer_id = final_reviewer_id
        self.change = exp_domain.ExplorationChange(change)
        self.score_category = score_category
        self.last_updated = last_updated

    def validate(self):
        """Validates a suggestion object of type SuggestionTranslateContent.

        Raises:
            ValidationError: One or more attributes of the
                SuggestionTranslateContent object are invalid.
        """
        super(SuggestionTranslateContent, self).validate()

        if not isinstance(self.change, exp_domain.ExplorationChange):
            raise utils.ValidationError(
                'Expected change to be an ExplorationChange, received %s'
                % type(self.change))

        if self.get_score_type() != suggestion_models.SCORE_TYPE_TRANSLATION:
            raise utils.ValidationError(
                'Expected the first part of score_category to be %s '
                ', received %s' % (
                    suggestion_models.SCORE_TYPE_TRANSLATION,
                    self.get_score_type()))

        if self.get_score_sub_type() not in constants.ALL_CATEGORIES:
            raise utils.ValidationError(
                'Expected the second part of score_category to be a valid'
                ' category, received %s' % self.get_score_sub_type())

        if self.change.cmd != exp_domain.CMD_ADD_TRANSLATION:
            raise utils.ValidationError(
                'Expected cmd to be %s, received %s' % (
                    exp_domain.CMD_ADD_TRANSLATION, self.change.cmd))

        if not utils.is_supported_audio_language_code(
                self.change.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.change.language_code)

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        self.validate()
        exploration = exp_fetchers.get_exploration_by_id(self.target_id)
        if self.change.state_name not in exploration.states:
            raise utils.ValidationError(
                'Expected %s to be a valid state name' % self.change.state_name)
        content_html = exploration.get_content_html(
            self.change.state_name, self.change.content_id)
        if content_html != self.change.content_html:
            raise Exception(
                'The given content_html does not match the content of the '
                'exploration.')

    def accept(self, commit_message):
        """Accepts the suggestion.

        Args:
            commit_message: str. The commit message.
        """
        exp_services.update_exploration(
            self.final_reviewer_id, self.target_id, [self.change],
            commit_message, is_suggestion=True)


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
    """

    def __init__( # pylint: disable=super-init-not-called
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, final_reviewer_id,
            change, score_category, last_updated):
        """Initializes an object of type SuggestionAddQuestion
        corresponding to the SUGGESTION_TYPE_ADD_QUESTION choice.
        """
        self.suggestion_id = suggestion_id
        self.suggestion_type = suggestion_models.SUGGESTION_TYPE_ADD_QUESTION
        self.target_type = suggestion_models.TARGET_TYPE_SKILL
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.status = status
        self.author_id = author_id
        self.final_reviewer_id = final_reviewer_id
        self.change = question_domain.QuestionChange(change)
        # Update question_state_data_schema_version here instead of surfacing
        # the version in the frontend.
        self.change.question_dict['question_state_data_schema_version'] = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.score_category = score_category
        self.last_updated = last_updated

    def validate(self):
        """Validates a suggestion object of type SuggestionAddQuestion.

        Raises:
            ValidationError: One or more attributes of the SuggestionAddQuestion
                object are invalid.
        """
        super(SuggestionAddQuestion, self).validate()

        if self.get_score_type() != suggestion_models.SCORE_TYPE_QUESTION:
            raise utils.ValidationError(
                'Expected the first part of score_category to be "%s" '
                ', received "%s"' % (
                    suggestion_models.SCORE_TYPE_QUESTION,
                    self.get_score_type()))
        if not isinstance(self.change, question_domain.QuestionChange):
            raise utils.ValidationError(
                'Expected change to be an instance of QuestionChange')

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

        question = question_domain.Question(
            None, state_domain.State.from_dict(
                self.change.question_dict['question_state_data']),
            self.change.question_dict['question_state_data_schema_version'],
            self.change.question_dict['language_code'], None,
            self.change.question_dict['linked_skill_ids'])
        question.partial_validate()
        question_state_data_schema_version = (
            self.change.question_dict['question_state_data_schema_version'])
        if not (
                question_state_data_schema_version >= 1 and
                question_state_data_schema_version <=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected question state schema version to be between 1 and '
                '%s' % feconf.CURRENT_STATE_SCHEMA_VERSION)

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        if self.change.skill_id is None:
            raise utils.ValidationError('Expected change to contain skill_id')
        question_dict = self.change.question_dict
        self.validate()
        if (
                question_dict['question_state_data_schema_version'] !=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Question state schema version is not up to date.')

        skill_domain.Skill.require_valid_skill_id(self.change.skill_id)
        skill = skill_services.get_skill_by_id(
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
        question_services.add_question(self.author_id, question)
        skill = skill_services.get_skill_by_id(
            self.change.skill_id, strict=False)
        if skill is None:
            raise utils.ValidationError(
                'The skill with the given id doesn\'t exist.')
        question_services.create_new_question_skill_link(
            self.author_id, question_dict['id'], self.change.skill_id,
            constants.DEFAULT_SKILL_DIFFICULTY)

    def populate_old_value_of_change(self):
        """Populates old value of the change."""
        pass


    def pre_update_validate(self, change):
        """Performs the pre update validation. This functions need to be called
        before updating the suggestion.

        Args:
            change: QuestionChange. The new change.

        Raises:
            ValidationError: Invalid new change.
        """
        if self.change.cmd != change.cmd:
            raise utils.ValidationError(
                'The new change cmd must be equal to %s' %
                self.change.cmd)
        if self.change.skill_id != change.skill_id:
            raise utils.ValidationError(
                'The new change skill_id must be equal to %s' %
                self.change.skill_id)
        if self.change.question_dict == change.question_dict:
            raise utils.ValidationError(
                'The new change question_dict must not be equal to the old '
                'question_dict')


class BaseVoiceoverApplication(python_utils.OBJECT):
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
            ValidationError: One or more attributes of the
                BaseVoiceoverApplication object are invalid.
        """

        if self.target_type not in suggestion_models.TARGET_TYPE_CHOICES:
            raise utils.ValidationError(
                'Expected target_type to be among allowed choices, '
                'received %s' % self.target_type)

        if not isinstance(self.target_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected target_id to be a string, received %s' % type(
                    self.target_id))

        if self.status not in suggestion_models.STATUS_CHOICES:
            raise utils.ValidationError(
                'Expected status to be among allowed choices, '
                'received %s' % self.status)

        if not isinstance(self.author_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected author_id to be a string, received %s' % type(
                    self.author_id))
        if self.status == suggestion_models.STATUS_IN_REVIEW:
            if self.final_reviewer_id is not None:
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be None as the '
                    'voiceover application is not yet handled.')
        else:
            if not isinstance(self.final_reviewer_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be a string, received %s' % (
                        type(self.final_reviewer_id)))
            if self.status == suggestion_models.STATUS_REJECTED:
                if not isinstance(
                        self.rejection_message, python_utils.BASESTRING):
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

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)
        if not utils.is_supported_audio_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)

        if not isinstance(self.filename, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected filename to be a string, received %s' % type(
                    self.filename))

        if not isinstance(self.content, python_utils.BASESTRING):
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
        self.target_type = suggestion_models.TARGET_TYPE_EXPLORATION
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
    suggestion_models.TARGET_TYPE_EXPLORATION: (
        ExplorationVoiceoverApplication)
}

SUGGESTION_TYPES_TO_DOMAIN_CLASSES = {
    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT: (
        SuggestionEditStateContent),
    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT: (
        SuggestionTranslateContent),
    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION: SuggestionAddQuestion
}
