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

    def __init__(
            self, suggestion_id, suggestion_type, target_type, target_id,
            target_version_at_submission, status, author_id,
            assigned_reviewer_id, final_reviewer_id, change_cmd,
            score_category):
        """Initializes a Suggestion object."""
        self.suggestion_id = suggestion_id
        self.suggestion_type = suggestion_type
        self.target_type = target_type
        self.target_id = target_id
        self.target_version_at_submission = target_version_at_submission
        self.status = status
        self.author_id = author_id
        self.assigned_reviewer_id = assigned_reviewer_id
        self.final_reviewer_id = final_reviewer_id
        self.change_cmd = change_cmd
        self.score_category = score_category

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

    def validate(self):
        """Validates the suggestion object. Each subclass must implement
        this function
        """
        pass


class SuggestionEditStateContent(BaseSuggestion):
    """Domain object for a suggestion of type SUGGESTION_EDIT_STATE_CONTENT.

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

    def __init__(
            self, suggestion_id, target_id, target_version_at_submission,
            status, author_id, assigned_reviewer_id, final_reviewer_id,
            change_cmd, score_category):
        """Initializes a Suggestion object of type
        SUGGESTION_EDIT_STATE_CONTENT.
        """
        super(SuggestionEditStateContent, self).__init__(
            suggestion_id, suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, target_id,
            target_version_at_submission, status, author_id,
            assigned_reviewer_id, final_reviewer_id, change_cmd,
            score_category)

    def validate(self):
        """Validates a suggestion object of type SUGGESTION_EDIT_STATE_CONTENT.

        Returns:
            bool. The validity of the suggestion object.
        """
        super(SuggestionEditStateContent, self).validate()
        states = exp_services.get_exploration_by_id(self.target_id).states
        if self.change_cmd['state_name'] not in states:
            return False
        return True


suggestion_type_domain_class_mapping = {
    suggestion_models.SUGGESTION_EDIT_STATE_CONTENT: SuggestionEditStateContent
}


def get_model_corresponding_to_suggestion(suggestion):
    return suggestion_type_domain_class_mapping[suggestion.suggestion_type]
