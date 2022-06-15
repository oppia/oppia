# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Model for an Oppia learner groups."""

from __future__ import annotations

import random
import string

from core.platform import models

from typing import Dict, List
from typing_extensions import Literal

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()


class LearnerGroupModel(base_models.BaseModel):
    """Class for storing learner group data.

    Instances of this class are keyed by the group_id.
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The title of the learner group.
    title = datastore_services.StringProperty(required=True, indexed=True)
    # The description of the learner group.
    description = datastore_services.StringProperty(required=True, indexed=True)
    # The list of user_ids of the users who are facilitators of
    # the learner group.
    facilitators = datastore_services.StringProperty(
        repeated=True, indexed=True)
    # The list of user_ids of the users who are part of the learner group.
    members = datastore_services.StringProperty(repeated=True)
    # The list of user_ids of the users who are invited to join the
    # learner group.
    invitations = datastore_services.StringProperty(repeated=True)
    # The list of subtopic ids that are part of the group syllabus.
    # Each subtopic id is stored ad topicid_subtopicid a string.
    subtopic_ids = datastore_services.StringProperty(repeated=True)
    # The list of story ids that are part of the group syllabus.
    story_ids = datastore_services.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding
        to a user: members, invitations and facilitators fields.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user as a
        user can be part of multiple learner groups.
        """
        return (
            base_models.MODEL_ASSOCIATION_TO_USER
            .MULTIPLE_INSTANCES_PER_USER
        )

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains user data to be exported."""
        return dict(super(cls, cls).get_export_policy(), **{
            'title': base_models.EXPORT_POLICY.EXPORTED,
            'description': base_models.EXPORT_POLICY.EXPORTED,
            'facilitators': base_models.EXPORT_POLICY.EXPORTED,
            'members': base_models.EXPORT_POLICY.EXPORTED,
            'invitations': base_models.EXPORT_POLICY.EXPORTED,
            'subtopic_ids': base_models.EXPORT_POLICY.EXPORTED,
            'story_ids': base_models.EXPORT_POLICY.EXPORTED
        })

    # We have ignored [override] here because the signature of this method
    # doesn't match with signature of super class's get_new_id() method.
    @classmethod
    def get_new_id(cls) -> str:  # type: ignore[override]
        """Generates an ID for a new LearnerGroupModel.

        Returns:
            str. The new ID.

        Raises:
            Exception. An ID cannot be generated within a reasonable number
                of attempts.
        """
        for _ in range(base_models.MAX_RETRIES):
            group_id = ''.join(
                random.choice(string.ascii_lowercase + string.ascii_uppercase)
                for _ in range(base_models.ID_LENGTH))
            if not cls.get_by_id(group_id):
                return group_id

        raise Exception('New id generator is producing too many collisions.')

    @classmethod
    def create(
        cls,
        group_id: str,
        title: str,
        description: str
    ) -> LearnerGroupModel:
        """Creates a new LearnerGroupModel instance and returns it.

        Note that the client is responsible for actually saving this entity to
        the datastore.

        Args:
            group_id: str. The ID of the learner group.
            title: str. The title of the learner group.
            description: str. The description of the learner group.

        Returns:
            LearnerGroupModel. The newly created LearnerGroupModel instance.

        Raises:
            Exception. A learner group with the given group ID exists already.
        """
        if cls.get_by_id(group_id):
            raise Exception(
                'A learner group with the given group ID exists already.')

        entity = cls(id=group_id, title=title, description=description)

        entity.update_timestamps()
        entity.put()
        return entity

    @staticmethod
    def get_field_names_for_takeout() -> Dict[str, str]:
        """We do not want to export all user ids in the facilitators, members
        and invitations fields, so we export them as fields only containing
        the current user's id.
        """
        return {
            'facilitators': 'facilitator',
            'members': 'member',
            'invitations': 'invitation'
        }

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, Dict[str, List[str]]]:
        """Takeout: Export LearnerGroupModel user-based properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict containing the user-relevant properties of
            LearnerGroupModel.
        """
        found_models = cls.get_all().filter(
            datastore_services.any_of(
                cls.members == user_id,
                cls.invitations == user_id,
                cls.facilitators == user_id
        ))
        user_data = {}
        for learner_group_model in found_models:
            # If the user is a member, we export all fields except
            # facilitators, invitations and the member field is
            # exported only containing the current user's id.
            if user_id in learner_group_model.members:
                user_data[learner_group_model.id] = {
                    'title': learner_group_model.title,
                    'description': learner_group_model.description,
                    'facilitator': '',
                    'member': user_id,
                    'invitation': '',
                    'subtopic_ids': learner_group_model.subtopic_ids,
                    'story_ids': learner_group_model.story_ids
                }

            # If the user has been invited to join the group,
            # we export all fields except facilitators, members and
            # the invitation field is exported only containing the
            # current user's id.
            elif user_id in learner_group_model.invitations:
                user_data[learner_group_model.id] = {
                    'title': learner_group_model.title,
                    'description': learner_group_model.description,
                    'facilitator': '',
                    'member': '',
                    'invitation': user_id,
                    'subtopic_ids': learner_group_model.subtopic_ids,
                    'story_ids': learner_group_model.story_ids
                }

            # If the user is the facilitator of the group, we export all
            # fields except members, invitations and the facilitator field is
            # exported only containing the current user's id.
            elif user_id in learner_group_model.facilitators:
                user_data[learner_group_model.id] = {
                    'title': learner_group_model.title,
                    'description': learner_group_model.description,
                    'facilitator': user_id,
                    'member': '',
                    'invitation': '',
                    'subtopic_ids': learner_group_model.subtopic_ids,
                    'story_ids': learner_group_model.story_ids
                }
        return user_data

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether LearnerGroupModel contains data of a given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return (
            cls.query(datastore_services.any_of(
                cls.members == user_id,
                cls.invitations == user_id,
                cls.facilitators == user_id
            )).get(keys_only=True) is not None
        )

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete all LearnerGroupModel instances associated with the
        user.

        Args:
            user_id: str. The user_id denotes which user's data to delete.
        """
        found_models = cls.get_all().filter(
            datastore_services.any_of(
                cls.members == user_id,
                cls.invitations == user_id,
                cls.facilitators == user_id
        ))

        for learner_group_model in found_models:
            # If the user is a member, delete the user from the members list.
            if user_id in learner_group_model.members:
                learner_group_model.members.remove(user_id)
                learner_group_model.update_timestamps()
                learner_group_model.put()

            # If the user has been invited to join the group, delete the
            # user from the invitations list.
            elif user_id in learner_group_model.invitations:
                learner_group_model.invitations.remove(user_id)
                learner_group_model.update_timestamps()
                learner_group_model.put()

            # If the user is the facilitator of the group and there are
            # more then one facilitators, delete the user from the
            # facilitators list.
            elif user_id in learner_group_model.facilitators and (
                    len(learner_group_model.facilitators) > 1):
                learner_group_model.facilitators.remove(user_id)
                learner_group_model.update_timestamps()
                learner_group_model.put()

            # If the user is the facilitator of the group and there is
            # only one facilitator, delete the group.
            elif user_id in learner_group_model.facilitators and (
                    len(learner_group_model.facilitators) == 1):
                learner_group_model.delete()
