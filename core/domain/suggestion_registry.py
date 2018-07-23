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

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class BaseSuggestion(object):
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
        change_cmd: Change. The details of the suggestion. This should be an
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
            'change_cmd': self.change_cmd.to_dict(),
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

        The subclasses must validate the change_cmd and score_category fields.

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

        if not isinstance(self.target_id, basestring):
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

        if not isinstance(self.author_id, basestring):
            raise utils.ValidationError(
                'Expected author_id to be a string, received %s' % type(
                    self.author_id))

        if not isinstance(self.final_reviewer_id, basestring):
            if self.final_reviewer_id:
                raise utils.ValidationError(
                    'Expected final_reviewer_id to be a string, received %s' %
                    type(self.final_reviewer_id))

        if not isinstance(self.score_category, basestring):
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
        """Accepts the suggestion. Each subclass must implement this function.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement accept.')

    def get_change_list_for_accepting_suggestion(self):
        """Before accepting the suggestion, a change_list needs to be generated
        from the change_cmd. Each subclass must implement this function.
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
            change_cmd, score_category, last_updated):
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
        self.change_cmd = exp_domain.ExplorationChange(change_cmd)
        self.score_category = score_category
        self.last_updated = last_updated

    def validate(self):
        """Validates a suggestion object of type SuggestionEditStateContent.

        Raises:
            ValidationError: One or more attributes of the
                SuggestionEditStateContent object are invalid.
        """
        super(SuggestionEditStateContent, self).validate()

        if not isinstance(self.change_cmd, exp_domain.ExplorationChange):
            raise utils.ValidationError(
                'Expected change_cmd to be an ExplorationChange, received %s'
                % type(self.change_cmd))

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

        if self.change_cmd.cmd != exp_domain.CMD_EDIT_STATE_PROPERTY:
            raise utils.ValidationError(
                'Expected cmd to be %s, received %s' % (
                    exp_domain.CMD_EDIT_STATE_PROPERTY, self.change_cmd.cmd))

        if (self.change_cmd.property_name !=
                exp_domain.STATE_PROPERTY_CONTENT):
            raise utils.ValidationError(
                'Expected property_name to be %s, received %s' % (
                    exp_domain.STATE_PROPERTY_CONTENT,
                    self.change_cmd.property_name))

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        self.validate()
        states = exp_services.get_exploration_by_id(self.target_id).states
        if self.change_cmd.state_name not in states:
            raise utils.ValidationError(
                'Expected %s to be a valid state name' %
                self.change_cmd.state_name)

    def get_change_list_for_accepting_suggestion(self):
        """Gets a complete change_cmd for the suggestion.

        Returns:
            list(ExplorationChange). The change_list corresponding to the
                suggestion.
        """
        change_cmd = self.change_cmd
        exploration = exp_services.get_exploration_by_id(self.target_id)
        old_content = (
            exploration.states[self.change_cmd.state_name].content.to_dict())

        change_cmd.old_value = old_content
        change_cmd.new_value['content_id'] = old_content['content_id']

        return [change_cmd]

    def accept(self, commit_message):
        """Accepts the suggestion.

        Args:
            commit_message: str. The commit message.
        """
        change_list = self.get_change_list_for_accepting_suggestion()
        exp_services.update_exploration(
            self.final_reviewer_id, self.target_id, change_list,
            commit_message, is_suggestion=True)


class SuggestionAddQuestion(BaseSuggestion):
    """Domain object for a suggestion of type SUGGESTION_TYPE_ADD_QUESTION."""

    def __init__( # pylint: disable=super-init-not-called
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, final_reviewer_id,
            change_cmd, score_category, last_updated):
        """Initializes an object of type SuggestionAddQuestion
        corresponding to the SUGGESTION_TYPE_ADD_QUESTION choice.
        """
        self.suggestion_id = suggestion_id
        self.suggestion_type = suggestion_models.SUGGESTION_TYPE_ADD_QUESTION
        self.target_type = suggestion_models.TARGET_TYPE_TOPIC
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.status = status
        self.author_id = author_id
        self.final_reviewer_id = final_reviewer_id
        self.change_cmd = change_cmd
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
                'Expected the first part of score_category to be %s '
                ', received %s' % (
                    suggestion_models.SCORE_TYPE_QUESTION,
                    self.get_score_type()))

        if 'question_dict' not in self.change_cmd:
            raise utils.ValidationError(
                'Expected change_cmd to contain question dict')

        if 'question_state_data' not in self.change_cmd['question_dict']:
            raise utils.ValidationError(
                'Expected question dict to contain question_state_data')

        if 'language_code' not in self.change_cmd['question_dict']:
            raise utils.ValidationError(
                'Expected question dict to contain language_code')

        if (
                'question_state_schema_version' not in
                self.change_cmd['question_dict']):
            raise utils.ValidationError(
                'Expected question dict to contain'
                ' question_state_schema_version')

        if 'skill_id' not in self.change_cmd:
            raise utils.ValidationError(
                'Expected change_cmd to contain skill id')

    def pre_accept_validate(self):
        """Performs referential validation. This function needs to be called
        before accepting the suggestion.
        """
        question_dict = self.change_cmd['question_dict']
        self.validate()
        if (
                question_dict['question_state_schema_version'] !=
                feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Question state schema version is not up to date.')

        skill_domain.Skill.require_valid_skill_id(self.change_cmd['skill_id'])
        skill = skill_services.get_skill_by_id(
            self.change_cmd['skill_id'], strict=False)
        if skill is None:
            raise utils.ValidationError(
                'The skill with the given id doesn\'t exist.')


    def get_change_list_for_accepting_suggestion(self):
        pass

    def accept(self, unused_commit_message):
        """Accepts the suggestion."""
        question_dict = self.change_cmd['question_dict']
        question_dict['version'] = 1
        question_dict['id'] = (
            question_services.get_new_question_id())
        question = question_domain.Question.from_dict(question_dict)
        question_services.add_question(self.author_id, question)
        question_services.create_new_question_skill_link(
            question_dict['id'], self.change_cmd['skill_id'])

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
            'change_cmd': self.change_cmd,
            'score_category': self.score_category,
            'last_updated': utils.get_time_in_millisecs(self.last_updated)
        }


SUGGESTION_TYPES_TO_DOMAIN_CLASSES = {
    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT: (
        SuggestionEditStateContent),
    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION: SuggestionAddQuestion
}
