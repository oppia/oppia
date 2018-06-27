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

import datetime

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
STATUS_RECEIVED = 'received'
STATUS_REJECTED = 'rejected'

STATUS_CHOICES = [
    STATUS_ACCEPTED,
    STATUS_IN_REVIEW,
    STATUS_RECEIVED,
    STATUS_REJECTED
]

# Constants defining various suggestion types.
SUGGESTION_TYPE_EDIT_STATE_CONTENT = 'edit_exploration_state_content'

SUGGESTION_TYPE_CHOICES = [
    SUGGESTION_TYPE_EDIT_STATE_CONTENT
]

# Defines what is the minimum role required to review suggestions
# of a particular type.
SUGGESTION_MINIMUM_ROLE_FOR_REVIEW = {
    SUGGESTION_TYPE_EDIT_STATE_CONTENT: feconf.ROLE_ID_EXPLORATION_EDITOR
}

# Constants defining various contribution types.
SCORE_TYPE_CONTENT = 'content'
SCORE_TYPE_TRANSLATION = 'translation'

SCORE_TYPE_CHOICES = [
    SCORE_TYPE_CONTENT,
    SCORE_TYPE_TRANSLATION
]

# The delimiter to be used in score category field.
SCORE_CATEGORY_DELIMITER = '.'

# Threshold time after which suggestion is considered stale and auto-accepted.
THRESHOLD_TIME_BEFORE_ACCEPT = 7 * 24 * 60 * 60 * 1000

# The default message to be shown when accepting stale suggestions.
DEFAULT_SUGGESTION_ACCEPT_MESSAGE = 'Accepting suggestion due to inactivity.'


class GeneralSuggestionModel(base_models.BaseModel):
    """Model to store suggestions made by Oppia users.

    The ID of the suggestions are created is the same as the ID of the thread
    linked to the suggestion.
    """

    # The type of suggestion.
    suggestion_type = ndb.StringProperty(
        required=True, indexed=True, choices=SUGGESTION_TYPE_CHOICES)
    # The type of the target entity which the suggestion is linked to.
    target_type = ndb.StringProperty(
        required=True, indexed=True, choices=TARGET_TYPE_CHOICES)
    # The ID of the target entity being suggested to.
    target_id = ndb.StringProperty(required=True, indexed=True)
    # The version number of the target entity at the time of creation of the
    # suggestion.
    target_version_at_submission = ndb.IntegerProperty(
        required=True, indexed=True)
    # Status of the suggestion.
    status = ndb.StringProperty(
        required=True, indexed=True, choices=STATUS_CHOICES)
    # The ID of the author of the suggestion.
    author_id = ndb.StringProperty(required=True, indexed=True)
    # The ID of the reviewer assigned to review the suggestion.
    assigned_reviewer_id = ndb.StringProperty(indexed=True)
    # The ID of the reviewer who accepted/rejected the suggestion.
    final_reviewer_id = ndb.StringProperty(indexed=True)
    # The change command linked to the suggestion. Contains the details of the
    # change.
    change_cmd = ndb.JsonProperty(required=True)
    # The category to score the suggestor in. This field will contain 2 values
    # separated by a ., the first will be a value from SCORE_TYPE_CHOICES and
    # the second will be the subcategory of the suggestion.
    score_category = ndb.StringProperty(required=True, indexed=True)

    @classmethod
    def create(
            cls, suggestion_type, target_type, target_id,
            target_version_at_submission, status, author_id,
            assigned_reviewer_id, final_reviewer_id, change_cmd, score_category,
            thread_id):
        """Creates a new SuggestionModel entry.

        Args:
            suggestion_type: str. The type of the suggestion.
            target_type: str. The type of target entity being edited.
            target_id: str. The ID of the target entity being edited.
            target_version_at_submission: int. The version number of the target
                entity at the time of creation of the suggestion.
            status: str. The status of the suggestion.
            author_id: str. The ID of the user who submitted the suggestion.
            assigned_reviewer_id: str. The ID of the user assigned to
                review the suggestion.
            final_reviewer_id: str. The ID of the reviewer who has
                accepted/rejected the suggestion.
            change_cmd: dict. The actual content of the suggestion.
            score_category: str. The scoring category for the suggestion.
            thread_id: str. The ID of the feedback thread linked to the
                suggestion.

        Raises:
            Exception: There is already a suggestion with the given id.
        """
        instance_id = thread_id

        if cls.get_by_id(instance_id):
            raise Exception('There is already a suggestion with the given'
                            ' id: %s' % instance_id)

        cls(id=instance_id, suggestion_type=suggestion_type,
            target_type=target_type, target_id=target_id,
            target_version_at_submission=target_version_at_submission,
            status=status, author_id=author_id,
            assigned_reviewer_id=assigned_reviewer_id,
            final_reviewer_id=final_reviewer_id, change_cmd=change_cmd,
            score_category=score_category).put()

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
    def get_suggestions_reviewed_by(cls, final_reviewer_id):
        """Gets all suggestions that have been reviewed by the given user.

        Args:
            final_reviewer_id: str. The ID of the reviewer of the suggestion.

        Returns:
            list(SuggestionModel). A list of suggestions reviewed by the given
                user, up to a maximum of feconf.DEFAULT_QUERY_LIMIT
                suggestions.
        """
        return cls.get_all().filter(
            cls.final_reviewer_id == final_reviewer_id).fetch(
                feconf.DEFAULT_QUERY_LIMIT)

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

    @classmethod
    def get_all_stale_suggestions(cls):
        """Gets all suggestions which were last updated before the threshold
        time.

        Returns:
            list(SuggestionModel). A list of suggestions that are stale.
        """
        threshold_time = (
            datetime.datetime.utcnow() - datetime.timedelta(
                0, 0, 0, THRESHOLD_TIME_BEFORE_ACCEPT))
        return cls.get_all().filter(
            cls.status.IN([STATUS_IN_REVIEW, STATUS_RECEIVED])).filter(
                cls.last_updated < threshold_time).fetch()
