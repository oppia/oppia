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
from core.domain import learner_group_services
from core.platform import models

from typing import List, Literal, Optional, Sequence, overload

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import learner_group_models
    from mypy_imports import user_models

(learner_group_models, user_models) = models.Registry.import_models(
    [models.Names.LEARNER_GROUP, models.Names.USER])


def get_new_learner_group_id() -> str:
    """Returns a new learner group id.

    Returns:
        str. A new learner group id.
    """
    return learner_group_models.LearnerGroupModel.get_new_id()


def get_learner_group_by_id(
    group_id: str
) -> Optional[learner_group_domain.LearnerGroup]:
    """Returns the learner group domain object given the learner group id.

    Args:
        group_id: str. The id of the learner group.

    Returns:
        LearnerGroup or None. The learner group domain object corresponding to
        the given id or None if no learner group exists for the given group id.
    """
    learner_group_model = learner_group_models.LearnerGroupModel.get(
        group_id, strict=False)

    if not learner_group_model:
        return None

    return learner_group_services.get_learner_group_from_model(
        learner_group_model)


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

    return [
        learner_group_services.get_learner_group_from_model(model)
        for model in learner_grp_models
    ]


@overload
def get_learner_group_models_by_ids(
    user_ids: List[str], *, strict: Literal[True]
) -> List[user_models.LearnerGroupsUserModel]: ...


@overload
def get_learner_group_models_by_ids(
    user_ids: List[str]
) -> List[Optional[user_models.LearnerGroupsUserModel]]: ...


@overload
def get_learner_group_models_by_ids(
    user_ids: List[str], *, strict: Literal[False]
) -> List[Optional[user_models.LearnerGroupsUserModel]]: ...


def get_learner_group_models_by_ids(
    user_ids: List[str], strict: bool = False
) -> Sequence[Optional[user_models.LearnerGroupsUserModel]]:
    """Returns a list of learner_groups_user models matching the IDs provided.

    Args:
        user_ids: list(str). The user ids of the learners of the group.
        strict: bool. Whether to fail noisily if no LearnerGroupsUserModel
            exists with a given ID exists in the datastore.

    Returns:
        list(LearnerGroupsUserModel|None). The list of learner_groups_user
        models corresponding to given ids.  If a LearnerGroupsUserModel does
        not exist, the corresponding returned list element is None.

    Raises:
        Exception. No LearnerGroupsUserModel exists for the given user_id.
    """

    learner_group_user_models = user_models.LearnerGroupsUserModel.get_multi(
        user_ids
    )

    if strict:
        for index, learner_group_user_model in enumerate(
            learner_group_user_models
        ):
            if learner_group_user_model is None:
                raise Exception(
                    'No LearnerGroupsUserModel exists for the user_id: %s'
                    % user_ids[index]
                )

    return learner_group_user_models


def can_multi_learners_share_progress(
    user_ids: List[str], group_id: str
) -> List[bool]:
    """Returns the progress sharing permissions of the given users in the given
    group.

    Args:
        user_ids: list(str). The user ids of the learners of the group.
        group_id: str. The id of the learner group.

    Returns:
        list(bool). True if a user has progress sharing permission of the
        given group as True, False otherwise.
    """
    learner_group_user_models = get_learner_group_models_by_ids(
        user_ids, strict=True
    )

    progress_sharing_permissions: List[bool] = []
    for model in learner_group_user_models:
        for group_details in model.learner_groups_user_details:
            if group_details['group_id'] == group_id:
                progress_sharing_permissions.append(
                    bool(group_details['progress_sharing_is_turned_on'])
                )
                break

    return progress_sharing_permissions


def get_invited_learner_groups_of_learner(
    user_id: str
) -> List[learner_group_domain.LearnerGroup]:
    """Returns a list of learner groups that the given learner has been
    invited to join.

    Args:
        user_id: str. The id of the learner.

    Returns:
        list(LearnerGroup). A list of learner groups that the given learner
        has been invited to join.
    """
    learner_grp_models = (
        learner_group_models.LearnerGroupModel.get_by_invited_learner_user_id(
            user_id))

    if not learner_grp_models:
        return []

    return [
        learner_group_services.get_learner_group_from_model(model)
        for model in learner_grp_models
    ]


def get_learner_groups_joined_by_learner(
    user_id: str
) -> List[learner_group_domain.LearnerGroup]:
    """Returns a list of learner groups that the given learner has joined.

    Args:
        user_id: str. The id of the learner.

    Returns:
        list(LearnerGroup). A list of learner groups that the given learner
        is part of.
    """
    learner_grp_models = (
        learner_group_models.LearnerGroupModel.get_by_learner_user_id(user_id))

    if not learner_grp_models:
        return []

    return [
        learner_group_services.get_learner_group_from_model(model)
        for model in learner_grp_models
    ]
