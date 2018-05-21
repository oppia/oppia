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

from core.platform import models
import feconf

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

# Constants defining types of entities to which suggestions can be created.
TARGET_TYPE_EXPLORATION = 'exploration'
TARGET_TYPE_QUESTION = 'question'
TARGET_TYPE_SKILL = 'skill'
TARGET_TYPE_TOPIC = 'topic'

TARGET_TYPE_CHOICES = [
    TARGET_TYPE_EXPLORATION,
    TARGET_TYPE_QUESTION,
    TARGET_TYPE_SKILL,
    TARGET_TYPE_TOPIC
]

# Constants defining the different possible statuses of a suggestion.
STATUS_ACCEPTED = 'accepted'
STATUS_IN_REVIEW = 'review'
STATUS_INVALID = 'invalid'
STATUS_REJECTED = 'rejected'

STATUS_CHOICES = [
    STATUS_ACCEPTED,
    STATUS_IN_REVIEW,
    STATUS_INVALID,
    STATUS_REJECTED
]

# Constants defining various suggestion types.
SUGGESTION_EDIT_STATE_CONTENT = 'edit_exploration_state_content'

SUGGESTION_TYPE_CHOICES = [
    SUGGESTION_EDIT_STATE_CONTENT
]

# Defines what is the minimum role required to review suggestions
# of a particular type.
SUGGESTION_MINIMUM_ROLE_FOR_REVIEW = {
    SUGGESTION_EDIT_STATE_CONTENT: feconf.ROLE_ID_EXPLORATION_EDITOR
}

# Constants defining various contribution types.
SCORE_TYPE_CONTENT = 'content'
SCORE_TYPE_TRANSLATION = 'translation'

SCORE_TYPE_CHOICES = [
    SCORE_TYPE_CONTENT,
    SCORE_TYPE_TRANSLATION
]

# The delimiter to be used in the suggestion ID.
SUGGESTION_ID_DELIMITER = '.'
# The delimiter to be used in score category field.
SCORE_CATEGORY_DELIMITER = '.'


class SuggestionModel(base_models.BaseModel):
    """Model to store suggestions made by Oppia users.

    The ID of the suggestions are created by joining target_type, target_id and
    thread_instance_ID using the SUGGESTION_ID_DELIMITER.
    """

    # The type of suggestion.
    suggestion_type = ndb.StringProperty(
        required=True, indexed=True, choices=SUGGESTION_TYPE_CHOICES)
    # The type of the target entity which the suggestion is linked to.
    target_type = ndb.StringProperty(
        required=True, indexed=True, choices=TARGET_TYPE_CHOICES)
    # The ID of the target entity being suggested to.
    target_id = ndb.StringProperty(required=True)
    # The version number of the target entity at the time of creation of the
    # suggestion.
    target_version_at_submission = ndb.IntegerProperty(required=True)
    # Status of the suggestion.
    status = ndb.StringProperty(
        required=True, indexed=True, choices=STATUS_CHOICES)
    # The ID of the author of the suggestion.
    author_id = ndb.StringProperty(required=True, indexed=True)
    # The ID of the reviewer assigned to review the suggestion.
    assigned_reviewer_id = ndb.StringProperty(required=True, indexed=True)
    # The ID of the reviewer who accepted the suggestion.
    reviewer_id = ndb.StringProperty(required=False, indexed=True)
    # The change command linked to the suggestion. Contains the details of the
    # change.
    change_cmd = ndb.JsonProperty(required=True, indexed=False)
    # The category to score the suggestor in. This field will contain 2 values
    # separated by a ., the first will be a value from SCORE_TYPE_CHOICES and
    # the second will be the subcategory of the suggestion.
    score_category = ndb.StringProperty(required=True, indexed=True)

    @classmethod
    def get_instance_id(
            cls, target_type, target_id, thread_instance_id):
        """Concatenates various parameters and gives the ID of the suggestion
        model.

        Args:
            target_type: str. The type of target being edited.
            target_id: str. The ID of the target being edited.
            thread_instance_id: str. The instance ID of the feedback thread
                linked to the suggestion.

        Returns:
            str. The full instance ID for the suggestion.
        """
        return SUGGESTION_ID_DELIMITER.join(
            [target_type, target_id, thread_instance_id])

    @classmethod
    def create(
            cls, suggestion_type, target_type, target_id,
            target_version_at_submission, status, author_id,
            assigned_reviewer_id, reviewer_id, change_cmd, score_category,
            thread_instance_id):
        """Creates a new SuggestionModel entry.

        Args:
            suggestion_type: str. The type of the suggestion.
            target_type: str. The type of target entity being edited.
            target_id: str, The ID of the target entity being edited.
            target_version_at_submission: int. The version number of the target
                entity at the time of creation of the suggestion.
            status: str. The status of the suggestion.
            author_id: str. The ID of the user who submitted the suggestion.
            assigned_reviewer_id: str. The ID of the user assigned to
                review the suggestion.
            reviewer_id: str. The ID of the reviewer who has accepted the
                suggestion.
            change_cmd: dict. The actual content of the suggestion.
            score_category: str. The scoring category for the suggestion.
            thread_instance_id: str. The instance ID of the feedback thread
                linked to the suggestion.

        Raises:
            Exception: There is already a suggestion with the given id.
        """
        instance_id = cls.get_instance_id(
            target_type, target_id, thread_instance_id)

        if cls.get_by_id(instance_id):
            raise Exception('There is already a suggestion with the given'
                            ' id: %s' % instance_id)

        cls(id=instance_id, suggestion_type=suggestion_type,
            target_type=target_type, target_id=target_id,
            target_version_at_submission=target_version_at_submission,
            status=status, author_id=author_id,
            assigned_reviewer_id=assigned_reviewer_id, reviewer_id=reviewer_id,
            change_cmd=change_cmd, score_category=score_category).put()

    @classmethod
    def get_suggestions_by_type(cls, suggestion_type):
        """Gets all suggestions of a particular type.

        Args:
            suggestion_type: str. The type of the suggestions.

        Returns:
            list(SuggestionModel). A list of suggestions of the given
                type, up to a maximum of feconf.DEFAULT_QUERY_LIMIT
                suggestions.
        """
        return cls.get_all().filter(
            cls.suggestion_type == suggestion_type).fetch(
                feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_by_author(cls, author_id):
        """Gets all suggestions created by the given author.

        Args:
            author_id: str. The ID of the author of the suggestion.

        Returns:
            list(SuggestionModel). A list of suggestions by the given author,
            up to a maximum of feconf.DEFAULT_QUERY_LIMIT suggestions.
        """
        return cls.get_all().filter(
            cls.author_id == author_id).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_assigned_to_reviewer(cls, assigned_reviewer_id):
        """Gets all suggestions assigned to the given user for review.

        Args:
            assigned_reviewer_id: str. The ID of the reviewer assigned to
                review the suggestion.

        Returns:
            list(SuggestionModel). A list of suggestions assigned to the given
                user for review, up to a maximum of feconf.DEFAULT_QUERY_LIMIT
                suggestions.
        """
        return cls.get_all().filter(
            cls.assigned_reviewer_id == assigned_reviewer_id).fetch(
                feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_reviewed_by(cls, reviewer_id):
        """Gets all suggestions that have been reviewed by the given user.

        Args:
            reviewer_id: str. The ID of the reviewer of the suggestion.

        Returns:
            list(SuggestionModel). A list of suggestions reviewed by the given
                user, up to a maximum of feconf.DEFAULT_QUERY_LIMIT
                suggestions.
        """
        return cls.get_all().filter(
            cls.reviewer_id == reviewer_id).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_by_status(cls, status):
        """Gets all suggestions with the given status.

        Args:
            status: str. The status of the suggestion.

        Returns:
            list(SuggestionModel) or None. A list of suggestions with the given
            status, up to a maximum of feconf.DEFAULT_QUERY_LIMIT suggestions.
        """
        return cls.get_all().filter(
            cls.status == status).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_by_target_id(cls, target_type, target_id):
        """Gets all suggestions to the target with the given ID.

        Args:
            target_type: str. The type of target.
            target_id: str. The ID of the target.

        Returns:
            list(SuggestionModel). A list of suggestions to the target with the
            given id, up to a maximum of feconf.DEFAULT_QUERY_LIMIT suggestions.
        """
        return cls.get_all().filter(cls.target_type == target_type).filter(
            cls.target_id == target_id).fetch(feconf.DEFAULT_QUERY_LIMIT)
