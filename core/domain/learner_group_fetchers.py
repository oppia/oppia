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

"""Getter commands for learner group models."""

from __future__ import annotations

from core.domain import learner_group_domain
from core.platform import models

from typing import List, Optional

(learner_group_models, user_models) = models.Registry.import_models(
    [models.NAMES.learner_group, models.NAMES.user])


def get_new_learner_group_id() -> str:
    """Returns a new learner group id.

    Returns:
        str. A new learner group id.
    """
    return learner_group_models.LearnerGroupModel.get_new_id()


def get_learner_group_by_id(
        group_id
    ) -> Optional(learner_group_domain.LearnerGroup):
    """Returns the learner group domain object given the learner group id.

    Args:
        group_id: str. The id of the learner group.

    Returns:
        LearnerGroup or None. The learner group domain object corresponding to
        the given id or None if no learner group exists for the given group id.
    """
    learner_group_model = learner_group_models.LearnerGroupModel.get_by_id(
        group_id)

    if not learner_group_model:
        return None

    return learner_group_domain.LearnerGroup(
        learner_group_model.id,
        learner_group_model.title,
        learner_group_model.description,
        learner_group_model.facilitator_user_ids,
        learner_group_model.student_user_ids,
        learner_group_model.invited_student_user_ids,
        learner_group_model.subtopic_page_ids,
        learner_group_model.story_ids)


def get_learner_groups_of_facilitator(
        user_id: str
    ) -> List[learner_group_domain.LearnerGroup]:
    """Returns a list of learner groups of the given facilitator.

    Args:
        user_id: str. The id of the facilitator.

    Returns:
        list(LearnerGroup). A list of learner groups of the given facilitator.
    """
    learner_grp_models = (
        learner_group_models.LearnerGroupModel.get_by_facilitator_id(user_id))

    if not learner_grp_models:
        return []

    learner_groups = []
    for learner_grp_model in learner_grp_models:
        learner_groups.append(
            learner_group_domain.LearnerGroup(
                learner_grp_model.id,
                learner_grp_model.title,
                learner_grp_model.description,
                learner_grp_model.facilitator_user_ids,
                learner_grp_model.student_user_ids,
                learner_grp_model.invited_student_user_ids,
                learner_grp_model.subtopic_page_ids,
                learner_grp_model.story_ids))

    return learner_groups


def get_progress_sharing_permission(user_id, group_id) -> bool:
    """Returns the progress sharing permission of the given user in the given
    group.

    Args:
        user_id: str. The id of the user.
        group_id: str. The id of the learner group.

    Returns:
        bool. True if the user has progress sharing permission of the given
        group as True, False otherwise.
    """
    learner_group_user_model = user_models.LearnerGroupsUserModel.get_by_id(
        user_id)

    for group_details in learner_group_user_model.learner_groups_user_details:
        if group_details['group_id'] == group_id:
            return group_details['progress_sharing_is_turned_on']

    return False
