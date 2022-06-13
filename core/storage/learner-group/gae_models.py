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

import datetime
import random
import string

from core import feconf
from core import utils
from core.constants import constants
from core.platform import models
import core.storage.base_model.gae_models as base_models

from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services  # pylint: disable=unused-import

datastore_services = models.Registry.import_datastore_services()

class LearnerGroupDataModel(base_models.BaseModel):
    """Class for storing learner group data.

    Instances of this class are keyed by the group_id.
    """

    # The title of the learner group.
    title = datastore_services.StringProperty(required=True, indexed=True)
    # The description of the learner group.
    description = datastore_services.StringProperty(required=True, indexed=True)
    # The list of user_ids of the users who are facilitators of
    # the learner group.
    facilitators = datastore_services.StringProperty(
        repeated=True, indexed=True, required=True)
    # The list of user_ids of the users who are part of the learner group.
    members = datastore_services.StringProperty(
        repeated=True, indexed=True, required=True)
    # The list of user_ids of the users who are invited to join the
    # learner group.
    invitations = datastore_services.StringProperty(
        repeated=True, indexed=True, required=True)
    # The list of subtopic ids that are part of the group syllabus.
    # Each subtopic id is stored ad topicid_subtopicid a string.
    subtopic_ids = datastore_services.StringProperty(
        repeated=True, indexed=True, required=True)
    # The list of story ids that are part of the group syllabus.
    story_ids = datastore_services.StringProperty(
        repeated=True, indexed=True, required=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding
        to a user: members, invitations and facilitators fields"""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance shared across users since
        multiple users are part of learner groups.
        """
        return (
            base_models.MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS
        )

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains user data to be exported."""
        return dict(super(cls, cls).get_export_policy(), **{
            'group_id': base_models.EXPORT_POLICY.EXPORTED,
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
            new_id = 'uid_%s' % ''.join(
                random.choice(string.ascii_lowercase + string.ascii_uppercase)
                for _ in range(feconf.USER_ID_RANDOM_PART_LENGTH))
            if (not cls.get_by_id(new_id)):
                return new_id

        raise Exception('New id generator is producing too many collisions.')
