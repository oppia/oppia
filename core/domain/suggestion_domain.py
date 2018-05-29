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

"""Domain object for Oppia suggestions."""

from core.domain import exp_domain
from core.domain import exp_services
from core.platform import models
import utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class BaseSuggestion(object):
    """Domain object for a suggestion.

    Attributes:
        suggestion_id: str. The ID of the suggestion.
        suggestion_type: str. The type of the suggestion.
        target_type: str. The type of target entity being edited.
        target_id: str. The ID of the target entity being edited.
        target_version_at_submission: int. The version number of the target
            entity at the time of creation of the suggestion.
        status: str. The status of the suggestion.
        author_id: str. The ID of the user who submitted the suggestion.
        assigned_reviewer_id: str. The ID of the user assigned to
            review the suggestion.
        final_reviewer_id: str. The ID of the reviewer who has accepted/rejected
            the suggestion.
        change_cmd: dict. The actual content of the suggestion.
        score_category: str. The scoring category for the suggestion.
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
            'author_id': self.author_id,
            'final_reviewer_id': self.final_reviewer_id,
            'assigned_reviewer_id': self.assigned_reviewer_id,
            'change_cmd': self.change_cmd,
            'score_category': self.score_category
        }

    @classmethod
    def from_dict(cls):
        """Return a Suggestion object of type from a dict."""
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement from_dict.')

    def validate(self):
        """Validates the BaseSuggestion object. Each subclass must implement
        this function

        Raises:
            ValidationError: One or more attributes of the BaseSuggestion object
                are invalid.
        """
        if (
                self.suggestion_type not in
                suggestion_models.SUGGESTION_TYPE_CHOICES):
            raise utils.ValidationError(
                'Expected suggestion_type to be among allowed choices, '
                'recieved %s' % self.suggestion_type)

        if self.target_type not in suggestion_models.TARGET_TYPE_CHOICES:
            raise utils.ValidationError(
                'Expected target_type to be among allowed choices, '
                'recieved %s' % self.target_type)

        if not isinstance(self.target_id, basestring):
            raise utils.ValidationError(
                'Expected target_id to be a string, recieved %s' % type(
                    self.target_id))

        if not isinstance(self.target_version_at_submission, int):
            raise utils.ValidationError(
                'Expected target_version_at_submission to be an int, '
                'recieved %s' % type(self.target_version_at_submission))

        if self.status not in suggestion_models.STATUS_CHOICES:
            raise utils.ValidationError(
                'Expected status to be among allowed choices, '
                'recieved %s' % self.status)

        if not isinstance(self.author_id, basestring):
            raise utils.ValidationError(
                'Expected author_id to be a string, recieved %s' % type(
                    self.author_id))

        if not isinstance(self.assigned_reviewer_id, basestring):
            raise utils.ValidationError(
                'Expected assigned_reviewer_id to be a string,'
                ' recieved %s' % type(self.assigned_reviewer_id))

        if not isinstance(self.final_reviewer_id, basestring):
            raise utils.ValidationError(
                'Expected final_reviewer_id to be a string, recieved %s' % type(
                    self.final_reviewer_id))

        if not isinstance(self.change_cmd, dict):
            raise utils.ValidationError(
                'Expected change_cmd to be a dict, recieved %s' % type(
                    self.change_cmd))

        if not isinstance(self.score_category, basestring):
            raise utils.ValidationError(
                'Expected score_category to be a string, recieved %s' % type(
                    self.score_category))

        if (
                not suggestion_models.SCORE_CATEGORY_DELIMITER in
                self.score_category):
            raise utils.ValidationError(
                'Expected score_category to be of the form'
                ' score_type%sscore_sub_type, recieved %s' %
                suggestion_models.SCORE_CATEGORY_DELIMITER, type(
                    self.score_category))

        if (
                self.score_category.split(
                    suggestion_models.SCORE_CATEGORY_DELIMITER)[0] not in
                suggestion_models.SCORE_TYPE_CHOICES):
            raise utils.ValidationError(
                'Expected the first part of score_category to be among allowed'
                ' choices, recieved %s' % self.score_category.split(
                    suggestion_models.SCORE_CATEGORY_DELIMITER)[0])

    def accept(self):
        """Accepts the suggestion. Each subclass must implement this function.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement accept.')


class SuggestionEditStateContent(BaseSuggestion):
    """Domain object for a suggestion of type
    SUGGESTION_TYPE_EDIT_STATE_CONTENT.
    """

    def __init__( # pylint: disable=super-init-not-called
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, assigned_reviewer_id, final_reviewer_id,
            change_cmd, score_category):
        """Initializes a Suggestion object of type
        SUGGESTION_TYPE_EDIT_STATE_CONTENT.
        """
        self.suggestion_id = suggestion_id
        self.suggestion_type = (
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        self.target_type = suggestion_models.TARGET_TYPE_EXPLORATION
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.status = status
        self.author_id = author_id
        self.assigned_reviewer_id = assigned_reviewer_id
        self.final_reviewer_id = final_reviewer_id
        self.change_cmd = change_cmd
        self.score_category = score_category

    def validate(self):
        """Validates a suggestion object of type
        SUGGESTION_TYPE_EDIT_STATE_CONTENT.

        Returns:
            bool. The validity of the suggestion object.
        """
        super(SuggestionEditStateContent, self).validate()

        if 'cmd' not in self.change_cmd:
            raise utils.ValidationError(
                'Expected change_cmd to contain a cmd key')

        if self.change_cmd['cmd'] != exp_domain.CMD_EDIT_STATE_PROPERTY:
            raise utils.ValidationError(
                'Expected cmd to be %s, recieved %s' % (
                    exp_domain.CMD_EDIT_STATE_PROPERTY, self.change_cmd['cmd']))

        if 'property_name' not in self.change_cmd:
            raise utils.ValidationError(
                'Expected change_cmd to contain a property_name key')

        if (
                self.change_cmd['property_name'] !=
                exp_domain.STATE_PROPERTY_CONTENT):
            raise utils.ValidationError(
                'Expected property_name to be %s, recieved %s' % (
                    exp_domain.STATE_PROPERTY_CONTENT,
                    self.change_cmd['property_name']))

        if 'state_name' not in self.change_cmd:
            raise utils.ValidationError(
                'Expected change_cmd to contain a state_name key')

        states = exp_services.get_exploration_by_id(self.target_id).states
        if self.change_cmd['state_name'] not in states:
            raise utils.ValidationError(
                'Expected %s to be a valid state name' %
                self.change_cmd['state_name'])

    def accept(self, commit_message):
        """Accepts the suggestion.

        Args:
            commit_message: str. The commit message.
        """
        change_list = [self.change_cmd]
        exp_services.update_exploration(
            self.final_reviewer_id, self.target_type, change_list,
            commit_message, is_suggestion=True)

    @classmethod
    def from_dict(cls, suggestion_dict):
        """Return a Suggestion object of type from a dict.

        Args:
            suggestion_dict: dict. The dict representation of the suggestion.

        Returns:
            BaseSuggestion. The corresponding Suggestion domain object.
        """
        suggestion = cls(
            suggestion_dict['suggestion_id'],
            suggestion_dict['target_id'],
            suggestion_dict['target_version_at_submission'],
            suggestion_dict['status'], suggestion_dict['author_id'],
            suggestion_dict['assigned_reviewer_id'],
            suggestion_dict['final_reviewer_id'], suggestion_dict['change_cmd'],
            suggestion_dict['score_category'])

        return suggestion


SUGGESTION_TYPE_TO_DOMAIN_CLASS = {
    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT: SuggestionEditStateContent # pylint: disable=line-too-long
}
