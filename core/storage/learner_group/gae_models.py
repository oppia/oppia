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

"""Models for learner groups."""

from __future__ import annotations

import random
import string

from core.platform import models

from typing import Dict, List, Literal, Sequence, TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class LearnerGroupDataDict(TypedDict):
    """Dictionary for learner group data to export."""

    title: str
    description: str
    role_in_group: str
    subtopic_page_ids: List[str]
    story_ids: List[str]


class LearnerGroupModel(base_models.BaseModel):
    """Class for storing learner group data.

    Instances of this class are keyed by the group ID.
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The title of the learner group.
    title = datastore_services.StringProperty(required=True, indexed=True)
    # The description of the learner group.
    description = datastore_services.StringProperty(required=True, indexed=True)
    # The list of user_ids of facilitators of the learner group.
    facilitator_user_ids = datastore_services.StringProperty(
        repeated=True, indexed=True)
    # The list of user_ids of learners of the learner group.
    learner_user_ids = datastore_services.StringProperty(repeated=True)
    # The list of user_ids of the learners who are invited to join the
    # learner group.
    invited_learner_user_ids = datastore_services.StringProperty(repeated=True)
    # The list of subtopic page ids that are part of the group syllabus.
    # Each subtopic page id is stored as topicid:subtopicid a string.
    subtopic_page_ids = datastore_services.StringProperty(repeated=True)
    # The list of story ids that are part of the group syllabus.
    story_ids = datastore_services.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding
        to a user: learner_user_ids, invited_learner_user_ids and
        facilitator_user_ids fields.
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
            'facilitator_user_ids': base_models.EXPORT_POLICY.EXPORTED,
            'learner_user_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'invited_learner_user_ids':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subtopic_page_ids': base_models.EXPORT_POLICY.EXPORTED,
            'story_ids': base_models.EXPORT_POLICY.EXPORTED
        })

    # Here we use MyPy ignore because the signature of this method doesn't
    # match with signature of super class's get_new_id() method.
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
                random.choice('%s%s' % (
                    string.ascii_lowercase, string.ascii_uppercase)
                )
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
        """We want to takeout the role of the current user in the group. So we
        change the field name from 'facilitator_user_ids' to 'role_in_group'
        before takeout.
        """
        return {
            'facilitator_user_ids': 'role_in_group',
        }

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, LearnerGroupDataDict]:
        """Takeout: Export LearnerGroupModel user-based properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict containing the user-relevant properties of
            LearnerGroupModel.
        """
        found_models = cls.get_all().filter(
            datastore_services.any_of(
                cls.learner_user_ids == user_id,
                cls.invited_learner_user_ids == user_id,
                cls.facilitator_user_ids == user_id
        ))
        user_data = {}
        for learner_group_model in found_models:
            learner_group_data: LearnerGroupDataDict
            if user_id in learner_group_model.learner_user_ids:
                learner_group_data = {
                    'title': learner_group_model.title,
                    'description': learner_group_model.description,
                    'role_in_group': 'learner',
                    'subtopic_page_ids':
                        learner_group_model.subtopic_page_ids,
                    'story_ids': learner_group_model.story_ids
                }
            elif user_id in learner_group_model.invited_learner_user_ids:
                learner_group_data = {
                    'title': learner_group_model.title,
                    'description': learner_group_model.description,
                    'role_in_group': 'invited_learner',
                    'subtopic_page_ids': [],
                    'story_ids': []
                }
            else:
                # To get to this branch, the user_id would need to be in
                # facilitator_user_ids.
                assert user_id in learner_group_model.facilitator_user_ids
                learner_group_data = {
                    'title': learner_group_model.title,
                    'description': learner_group_model.description,
                    'role_in_group': 'facilitator',
                    'subtopic_page_ids':
                        learner_group_model.subtopic_page_ids,
                    'story_ids': learner_group_model.story_ids
                }
            user_data[learner_group_model.id] = learner_group_data

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
                cls.learner_user_ids == user_id,
                cls.invited_learner_user_ids == user_id,
                cls.facilitator_user_ids == user_id
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
                cls.learner_user_ids == user_id,
                cls.invited_learner_user_ids == user_id,
                cls.facilitator_user_ids == user_id
        ))

        learner_group_models_to_put = []

        for learner_group_model in found_models:
            # If the user is the facilitator of the group and there is
            # only one facilitator_user_id, delete the group.
            if (
                user_id in learner_group_model.facilitator_user_ids and
                len(learner_group_model.facilitator_user_ids) == 1
            ):
                learner_group_model.delete()
                continue

            # If the user is the facilitator of the group and there are
            # more then one facilitator_user_ids, delete the user from the
            # facilitator_user_ids list.
            if (
                user_id in learner_group_model.facilitator_user_ids and
                len(learner_group_model.facilitator_user_ids) > 1
            ):
                learner_group_model.facilitator_user_ids.remove(user_id)

            # If the user is a learner, delete the user from the
            # learner_user_ids list.
            elif user_id in learner_group_model.learner_user_ids:
                learner_group_model.learner_user_ids.remove(user_id)

            # If the user has been invited to join the group, delete the
            # user from the invited_learner_user_ids list.
            else:
                # To get to this branch, the user_id would need to be in
                # invited_learner_user_ids.
                assert user_id in learner_group_model.invited_learner_user_ids
                learner_group_model.invited_learner_user_ids.remove(user_id)

            learner_group_models_to_put.append(learner_group_model)

        cls.update_timestamps_multi(learner_group_models_to_put)
        cls.put_multi(learner_group_models_to_put)

    @classmethod
    def get_by_facilitator_id(
        cls, facilitator_id: str
    ) -> Sequence[LearnerGroupModel]:
        """Returns a list of all LearnerGroupModels that have the given
        facilitator id.

        Args:
            facilitator_id: str. The id of the facilitator.

        Returns:
            list(LearnerGroupModel)|None. A list of all LearnerGroupModels that
            have the given facilitator id or None if no such learner group
            models exist.
        """
        found_models: Sequence[LearnerGroupModel] = cls.get_all().filter(
            datastore_services.any_of(
                cls.facilitator_user_ids == facilitator_id
        )).fetch()

        return found_models

    @classmethod
    def get_by_learner_user_id(
        cls, learner_user_id: str
    ) -> Sequence[LearnerGroupModel]:
        """Returns a list of all LearnerGroupModels that have the given
        user id as a learner.

        Args:
            learner_user_id: str. The id of the learner.

        Returns:
            list(LearnerGroupModel)|None. A list of all LearnerGroupModels that
            the given learner is part of or None if no such learner group
            models exist.
        """
        found_models: Sequence[LearnerGroupModel] = cls.get_all().filter(
            datastore_services.any_of(
                cls.learner_user_ids == learner_user_id
        )).fetch()

        return found_models

    @classmethod
    def get_by_invited_learner_user_id(
        cls, invited_learner_user_id: str
    ) -> Sequence[LearnerGroupModel]:
        """Returns a list of all LearnerGroupModels which the given user has
        been invited to join.

        Args:
            invited_learner_user_id: str. The id of the learner invited to
                join the groups.

        Returns:
            list(LearnerGroupModel)|None. A list of all LearnerGroupModels that
            the given learner is being invited to join or None if no such
            learner group models exist.
        """
        found_models: Sequence[LearnerGroupModel] = cls.get_all().filter(
            datastore_services.any_of(
                cls.invited_learner_user_ids == invited_learner_user_id
        )).fetch()

        return found_models
