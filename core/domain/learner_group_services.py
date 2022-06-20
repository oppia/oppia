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

"""Services for the learner groups."""

from __future__ import annotations
from typing import List

from core import feconf
from core.domain import learner_group_domain
from core.domain import user_domain
from core.platform import datastore, models

(user_models, learner_group_models) = models.Registry.import_models(
    [models.NAMES.user], [models.NAMES.learner_group])


def create_learner_group(
    facilitator_id, title, description, members,
    invitations, subtopic_ids, story_ids):
    """Creates a new learner group.

    Args:
        facilitator_id: str. The id of the user who is creating the learner
            group.
        title: str. The title of the learner group.
        description: str. The description of the learner group.
        members: list(str). List of user_ids of the members of the
            learner group.
        invitations: list(str). List of user_ids of the users who have
            been invited to the learner group.
        subtopic_ids: list(str). The ids of the subtopics that are part of the
            learner group syllabus.
        story_ids: list(str). The ids of the stories that are part of the
            learner group syllabus.

    Returns:
        learner_group_id: str. The id of the learner group created.
    """

    learner_group_id = learner_group_models.LearnerGroupModel.get_new_id()

    learner_group_model = learner_group_models.LearnerGroupModel(
        id=learner_group_id,
        facilitator_id=facilitator_id,
        title=title,
        description=description,
        members=members,
        invitations=invitations,
        subtopic_ids=subtopic_ids,
        story_ids=story_ids)

    learner_group_model.update_timestamps()
    learner_group_model.put()

    return learner_group_id


def update_learner_group(
        group_id, title, description, facilitators, members,
        invitations, subtopic_ids, story_ids):
    """Updates a learner group.

    Args:
        group_id: str. The id of the learner group to be updated.
        title: str. The title of the learner group.
        description: str. The description of the learner group.
        facilitators: str. List of user_ids of the facilitators of the
            learner group.
        members: list(str). List of user_ids of the members of the
            learner group.
        invitations: list(str). List of user_ids of the users who have
            been invited to the learner group.
        subtopic_ids: list(str). The ids of the subtopics that are part of the
            learner group syllabus.
        story_ids: list(str). The ids of the stories that are part of the
            learner group syllabus.

    Returns:
        learner_group: LearnerGroup. The domain object of the updated
            learner group.

    Raises:
        Exception. The learner group does not exist.
    """
    
    learner_group_model = learner_group_models.LearnerGroupModel.get_by_id(
        group_id)

    if not learner_group_model:
        raise Exception('The learner group does not exist.')

    learner_group_model.title = title
    learner_group_model.description = description
    learner_group_model.facilitators = facilitators
    learner_group_model.members = members
    learner_group_model.invitations = invitations
    learner_group_model.subtopic_ids = subtopic_ids
    learner_group_model.story_ids = story_ids

    learner_group_model.update_timestamps()
    learner_group_model.put()

    return learner_group_model


def is_user_a_facilitator(user_id, group_id):
    """Checks if the user is a facilitator of the leaner group.

    Args:
        user_id: str. The id of the user.
        group_id: str. The id of the learner group.

    Returns:
        bool. Whether the user is a facilitator of the learner group.

    Raises:
        Exception. The learner group does not exist.
    """
    learner_group_model = learner_group_models.LearnerGroupModel.get_by_id(
        group_id)
    
    if not learner_group_model:
        raise Exception('The learner group does not exist.')

    return user_id in learner_group_model.facilitator_user_ids


def get_learner_goals_from_model(learner_goals_model):
    """Returns the learner goals domain object given the learner goals
    model loaded from the datastore.

    Args:
        learner_goals_model: LearnerGoalsModel. The
            learner goals model from the datastore.

    Returns:
        LearnerGoals. The learner goals domain object corresponding to the
        given model.
    """
    return user_domain.LearnerGoals(
        learner_goals_model.id,
        learner_goals_model.topic_ids_to_learn,
        learner_goals_model.topic_ids_to_master)


def get_learner_group_by_id(group_id):
    """Returns the learner group domain object given the learner group id.

    Args:
        group_id: str. The id of the learner group.

    Returns:
        LearnerGroup. The learner group domain object corresponding to the
        given id.

    Raises:
        Exception. The learner group does not exist.
    """
    learner_group_model = learner_group_models.LearnerGroupModel.get_by_id(
        group_id)

    if not learner_group_model:
        raise Exception('The learner group does not exist.')

    return learner_group_domain.LearnerGroup(
        learner_group_model.id,
        learner_group_model.title,
        learner_group_model.description,
        learner_group_model.facilitator_user_ids,
        learner_group_model.student_user_ids,
        learner_group_model.invited_user_ids,
        learner_group_model.subtopic_page_ids,
        learner_group_model.story_ids)
