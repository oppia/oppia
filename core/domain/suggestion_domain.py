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

from core.domain import exp_services
from core.platform import models

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
        """Validates the suggestion object. Each subclass must implement
        this function
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement validate.')

    def accept(self):
        """Accepts the suggestion. Each subclass must implement this function.
        """
        raise NotImplementedError(
            'Subclasses of BaseSuggestion should implement accept.')


class SuggestionEditStateContent(BaseSuggestion):
    """Domain object for a suggestion of type
    SUGGESTION_TYPE_EDIT_STATE_CONTENT.
    """

    def __init__(
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
        states = exp_services.get_exploration_by_id(self.target_id).states
        if self.change_cmd['state_name'] not in states:
            return False
        return True

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
    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT: SuggestionEditStateContent
}
