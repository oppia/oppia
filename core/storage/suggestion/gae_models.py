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

# Constants defining the types of suggestions.
SUGGESTION_TYPE_ADD = 'add'
SUGGESTION_TYPE_EDIT = 'edit'

SUGGESTION_TYPE_CHOICES = [
    SUGGESTION_TYPE_ADD,
    SUGGESTION_TYPE_EDIT
]

# Constants defining types of entities to which suggestions can be created.
ENTITY_TYPE_EXPLORATION = 'exploration'
ENTITY_TYPE_QUESTION = 'question'
ENTITY_TYPE_SKILL = 'skill'
ENTITY_TYPE_TOPIC = 'topic'

ENTITY_TYPE_CHOICES = [
    ENTITY_TYPE_EXPLORATION,
    ENTITY_TYPE_QUESTION,
    ENTITY_TYPE_SKILL,
    ENTITY_TYPE_TOPIC
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

# Constants defining suggestion sub-types for each of the above types.
SUGGESTION_EDIT_STATE_CONTENT = 'edit_exploration_state_content'

SUGGESTION_SUB_TYPES = {
    SUGGESTION_TYPE_ADD: [],
    SUGGESTION_TYPE_EDIT: [
        SUGGESTION_EDIT_STATE_CONTENT
    ]
}

SUGGESTION_SUB_TYPE_CHOICES = [
    SUGGESTION_EDIT_STATE_CONTENT
]

# Defines what is the minimum role required to review suggestions
# of a particular sub-type.
SUGGESTION_MINIMUM_ROLE_FOR_REVIEW = {
    SUGGESTION_EDIT_STATE_CONTENT: feconf.ROLE_ID_EXPLORATION_EDITOR
}


class SuggestionModel(base_models.BaseModel):
    """Model to store suggestions made by Oppia users."""

    # The type of suggestion.
    suggestion_type = ndb.StringProperty(
        required=True, indexed=True, choices=SUGGESTION_TYPE_CHOICES)
    # The type of entity which the suggestion is linked to.
    entity_type = ndb.StringProperty(
        required=True, indexed=True, choices=ENTITY_TYPE_CHOICES)
    # The sub-type of the suggestion.
    suggestion_sub_type = ndb.StringProperty(
        required=True, indexed=True, choices=SUGGESTION_SUB_TYPE_CHOICES)
    # Status of the suggestion.
    status = ndb.StringProperty(
        required=True, indexed=True, choices=STATUS_CHOICES)
    # Additional parameters to be stored. The parameters include:
    #   contribution_type: Either translation related or content related.
    #
    #   contribution_category: The content subject category
    #                          (like algebra, algorithms, etc)
    #   OR
    #
    #   contribution_language: The language of the translation submitted.
    suggestion_customization_args = ndb.JsonProperty(
        required=True, indexed=True)
    # The author of the suggestion.
    author_id = ndb.StringProperty(required=True, indexed=True)
    # The reviewer who accepted the suggestion.
    reviewer_id = ndb.StringProperty(required=False, indexed=True)
    # The thread linked to this suggestion.
    thread_id = ndb.StringProperty(required=True, indexed=True)
    # The reviewer assigned to review the suggestion.
    assigned_reviewer_id = ndb.StringProperty(required=True, indexed=True)
    # The suggestion payload. Stores the details specific to the suggestion.
    # The structure depends on the type of suggestion. For "edit" suggestions,
    # the required parameters are:
    #   entity_id: The ID of the entity being edited.
    #   entity_version_number: The version of the entity being edited.
    #   change_list: An appropriate changelist which needs to be applied to the
    #                entity.
    # For "add" suggestions, the required parameters are:
    #   entity_type: The type of entity being added.
    #   entity_data: The data that is needed to create the entity.
    payload = ndb.JsonProperty(required=True, indexed=False)

    @classmethod
    def get_instance_id(
            cls, suggestion_type, entity_type, thread_id, entity_id=''):
        """Concatenates various parameters and gives the ID of the suggestion
        model.

        Args:
            suggestion_type: str. The type of the suggestion.
            entity_type: str. The type of entity being edited/added.
            thread_id: str. The ID of the feedback thread linked to the
                suggestion.
            entity_id: str(optional). The ID of the entity being edited. If a
                new entity is being added, "" is passed.

        Returns:
            str. The full instance ID for the suggestion.
        """
        if entity_id == '':
            return '.'.join([suggestion_type, entity_type, thread_id])
        return '.'.join([suggestion_type, entity_type, thread_id, entity_id])

    @classmethod
    def create(
            cls, suggestion_type, entity_type, suggestion_sub_type, status,
            suggestion_customization_args, author_id, reviewer_id, thread_id,
            assigned_reviewer_id, payload):
        """Creates a new SuggestionModel entry.

        Args:
             Args:
            suggestion_type: str. The type of the suggestion.
            entity_type: str. The type of entity being edited/added.
            suggestion_sub_type: str. The sub type of the suggestion.
            status: str. The status of the suggestion.
            suggestion_customization_args: dict. Additional parameters to know
                the category of the contributions.
            author_id: str. The ID of the user who submitted the suggestion.
            reviewer_id: str. The ID of the reviewer who has accepted the
                suggestion.
            thread_id: str. The ID of the feedback thread linked to the
                suggestion.
            assigned_reviewer_id: str. The ID of the user assigned to
                review the suggestion.
            payload: dict. The actual content of the suggestion. The contents
                depend on the type of suggestion.

        Raises:
            Exception: There is already a suggestion with the given id.
        """
        instance_id = cls.get_instance_id(
            suggestion_type, entity_type, thread_id, payload['entity_id'])

        if cls.get_by_id(instance_id):
            raise Exception('There is already a suggestion with the given'
                            ' id: %s' % instance_id)

        cls(id=instance_id, suggestion_type=suggestion_type,
            entity_type=entity_type, suggestion_sub_type=suggestion_sub_type,
            status=status,
            suggestion_customization_args=suggestion_customization_args,
            author_id=author_id, reviewer_id=reviewer_id, thread_id=thread_id,
            assigned_reviewer_id=assigned_reviewer_id, payload=payload).put()

    @classmethod
    def get_suggestions_by_sub_type(cls, suggestion_sub_type):
        """Gets all suggestions of a particular type

        Args:
            suggestion_sub_type: str. The sub type of the suggestions.

        Returns:
            list(SuggestionModel). A list of suggestions of the given
                sub type, upto a maximum of feconf.DEFAULT_QUERY_LIMIT
                suggestions.
        """
        return cls.get_all().filter(
            cls.suggestion_sub_type == suggestion_sub_type).fetch(
                feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_by_author(cls, author_id):
        """Gets all suggestions created by the given author.

        Args:
            author_id: str. The author of the suggestion.

        Returns:
            list(SuggestionModel). A list of suggestions by the given author,
            upto a maximum of feconf.DEFAULT_QUERY_LIMIT suggestions.
        """
        return cls.get_all().filter(
            cls.author_id == author_id).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_assigned_to_reviewer(cls, assigned_reviewer_id):
        """Gets all suggestions assigned to the given user for review.

        Args:
            assigned_reviewer_id: str. The reviewer assigned to review the
                suggestion.

        Returns:
            list(SuggestionModel). A list of suggestions assigned to the given
                user for review, upto a maximum of feconf.DEFAULT_QUERY_LIMIT
                suggestions.
        """
        return cls.get_all().filter(
            cls.assigned_reviewer_id == assigned_reviewer_id).fetch(
                feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_suggestions_reviewed_by(cls, reviewer_id):
        """Gets all suggestions that have been reviewed by the given user.

        Args:
            reviewer_id: str. The reviewer of the suggestion.

        Returns:
            list(SuggestionModel). A list of suggestions reviewed by the given
                user, upto a maximum of feconf.DEFAULT_QUERY_LIMIT
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
            list(SuggestionModel). A list of suggestions witj the given status,
            upto a maximum of feconf.DEFAULT_QUERY_LIMIT suggestions.
        """
        return cls.get_all().filter(
            cls.status == status).fetch(feconf.DEFAULT_QUERY_LIMIT)
