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

from core.domain import config_domain
from core.domain import learner_group_domain
from core.domain import learner_group_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.platform import models

from typing import List

(learner_group_models, user_models) = models.Registry.import_models(
    [models.NAMES.learner_group, models.NAMES.user])


def is_learner_group_feature_enabled() -> bool:
    """Checks if the learner group feature is enabled.

    Returns:
        bool. Whether the learner group feature is enabled.
    """
    return config_domain.LEARNER_GROUPS_ARE_ENABLED.value


def create_learner_group(
        group_id, title, description,
        facilitator_user_ids, student_ids, invited_student_ids,
        subtopic_page_ids, story_ids
    ) -> learner_group_domain.LearnerGroup:
    """Creates a new learner group.

    Args:
        group_id: str. The id of the learner group to be created.
        title: str. The title of the learner group.
        description: str. The description of the learner group.
        facilitator_user_ids: str. List of user ids of the facilitators of the
            learner group.
        student_ids: list(str). List of user ids of the students of the
            learner group.
        invited_student_ids: list(str). List of user ids of the students who
            have been invited to join the learner group.
        subtopic_page_ids: list(str). The ids of the subtopics pages that are
            part of the learner group syllabus. Each subtopic page id is
            represented as a topicId:subtopicId string.
        story_ids: list(str). The ids of the stories that are part of the
            learner group syllabus.

    Returns:
        LearnerGroup. The domain object of the newly created learner group.
    """

    learner_group_model = learner_group_models.LearnerGroupModel(
        group_id, title, description, facilitator_user_ids, student_ids,
        invited_student_ids, subtopic_page_ids, story_ids
    )

    learner_group_model.update_timestamps()
    learner_group_model.put()

    learner_group = learner_group_domain.LearnerGroup(
        learner_group_model.id,
        learner_group_model.title,
        learner_group_model.description,
        learner_group_model.facilitator_user_ids,
        learner_group_model.student_user_ids,
        learner_group_model.invited_user_ids,
        learner_group_model.subtopic_page_ids,
        learner_group_model.story_ids
    )

    if len(learner_group.invited_student_user_ids) > 0:
        invite_students_to_learner_group(
            group_id, learner_group.invited_student_user_ids)

    return learner_group


def update_learner_group(
        group_id, title, description,
        facilitator_user_ids, student_ids, invited_student_ids,
        subtopic_page_ids, story_ids
    ) -> learner_group_domain.LearnerGroup:
    """Updates a learner group if it is present.

    Args:
        group_id: str. The id of the learner group to be updated.
        title: str. The title of the learner group.
        description: str. The description of the learner group.
        facilitator_user_ids: str. List of user ids of the facilitators of the
            learner group.
        student_ids: list(str). List of user ids of the students of the
            learner group.
        invited_student_ids: list(str). List of user ids of the students who
            have been invited to join the learner group.
        subtopic_page_ids: list(str). The ids of the subtopics pages that are
            part of the learner group syllabus. Each subtopic page id is
            represented as a topicId:subtopicId string.
        story_ids: list(str). The ids of the stories that are part of the
            learner group syllabus.

    Returns:
        learner_group: learner_group_domain.LearnerGroup. The domain object
        of the updated learner group.

    Raises:
        Exception. The learner group with the given id does not exist.
    """

    learner_group_model = learner_group_models.LearnerGroupModel.get_by_id(
        group_id)

    if not learner_group_model:
        raise Exception(
            'The learner group with the given group id does not exist.')

    invited_student_ids = set(learner_group_model.invited_student_user_ids)
    new_invited_student_ids = set(invited_student_ids)
    if new_invited_student_ids != invited_student_ids:
        newly_added_invites = new_invited_student_ids - invited_student_ids
        newly_removed_invites = invited_student_ids - new_invited_student_ids
        invite_students_to_learner_group(
            group_id, newly_added_invites)
        remove_invited_students_from_learner_group(
            group_id, newly_removed_invites)

    learner_group_model.title = title
    learner_group_model.description = description
    learner_group_model.facilitator_user_ids = facilitator_user_ids
    learner_group_model.student_user_ids = student_ids
    learner_group_model.invited_student_user_ids = invited_student_ids
    learner_group_model.subtopic_page_ids = subtopic_page_ids
    learner_group_model.story_ids = story_ids

    learner_group_model.update_timestamps()
    learner_group_model.put()

    learner_group = learner_group_domain.LearnerGroup(
        learner_group_model.id,
        learner_group_model.title,
        learner_group_model.description,
        learner_group_model.facilitator_user_ids,
        learner_group_model.student_user_ids,
        learner_group_model.invited_user_ids,
        learner_group_model.subtopic_page_ids,
        learner_group_model.story_ids
    )

    return learner_group


def is_user_a_facilitator(user_id, group_id) -> bool:
    """Checks if the user is a facilitator of the leaner group.

    Args:
        user_id: str. The id of the user.
        group_id: str. The id of the learner group.

    Returns:
        bool. Whether the user is a facilitator of the learner group.
    """
    learner_group = learner_group_fetchers.get_learner_group_by_id(
        group_id)

    return user_id in learner_group.facilitator_user_ids


def remove_learner_group(group_id) -> None:
    """Removes the learner group with of given learner group ID.

    Args:
        group_id: str. The id of the learner group to be removed.
    """
    learner_group_model = learner_group_models.LearnerGroupModel.get_by_id(
        group_id)

    # Note: We are not deleting the references of the learner group from the
    # related learner group user models. These references are deleted when the
    # user tries to access a deleted learner group so that they get a
    # notification saying the group was deleted instead of the group just being
    # silently removed.
    learner_group_model.delete()


def get_topic_ids_from_subtopic_page_ids(subtopic_page_ids):
    """Returns the topic ids corresponding to the given subtopic page ids.

    Args:
        subtopic_page_ids: list(str). The ids of the subtopic pages.

    Returns:
        list(str). The topic ids corresponding to the given subtopic page ids.
    """
    topic_ids: List[str] = []

    for subtopic_page_id in subtopic_page_ids:
        topic_ids.append(subtopic_page_id.split(':')[0])

    return topic_ids


def get_filtered_learner_group_syllabus(
        learner_group_id, keyword,
        filter_type, category,
        language_code
    ):
    """Returns the syllabus of the learner group filtered by the given
    filter arguments.

    Args:
        learner_group_id: str. The id of the learner group.
        keyword: str. The keyword to filter the syllabus. It is compared with
            the title of the topics, stories and subtopics.
        filter_type: str. The type of the syllabus item to filter. It can be
            either 'Story' or 'Skill'.
        category: str. The category of the syllabus items. It is the
            classroom in which the stories and subtopics are to be searched.
        language_code: str. The language of the topics in which the stories
            and subtopics are to be searched.

    Returns:
        list(dict). The filtered syllabus of the learner group.
    """
    learner_group = learner_group_fetchers.get_learner_group_by_id(
        learner_group_id)

    group_subtopic_page_ids = learner_group.subtopic_page_ids
    group_story_ids = learner_group.story_ids

    all_topics: List[topic_domain.Topic] = topic_fetchers.get_all_topics()

    filtered_topics: List[topic_domain.Topic] = []

    filtered_topic_ids: List[str] = []
    all_classrooms_dict = config_domain.CLASSROOM_PAGES_DATA.value

    possible_story_ids: List[str] = []
    filtered_story_ids: List[str] = []
    filtered_subtopics: List[topic_domain.Subtopic] = []
    filtered_stories: List[story_domain.StorySummary] = []

    if category != 'All':
        for classroom in all_classrooms_dict:
            if category and classroom['name'] != category:
                continue
            filtered_topic_ids.extend(classroom['topic_ids'])

        filtered_topics = (
            [topic.id for topic in all_topics if (
                topic.id in filtered_topic_ids)]
        )
    else:
        filtered_topics = all_topics

    for topic in filtered_topics:
        if language_code and language_code != topic.language_code:
            continue

        # If the keyword matches a topic name.
        if topic.canonical_name.find(keyword) != -1:
            # If type filter is not set or type filter is set to 'Story',
            # add all story ids of this topic to the filtered story ids.
            if filter_type is None or filter_type == 'Story':
                story_ids = (
                    [
                        story.id for story in topic.canonical_story_references
                        and story.id not in group_story_ids
                        and story.story_is_published is True
                    ]
                )
                filtered_story_ids.extend(story_ids)

            # If type filter is not set or type filter is set to 'Skill',
            # add all subtopics of this topic to the filtered subtopics.
            if filter_type is None or filter_type == 'Skill':
                for subtopic in topic.subtopics:
                    # If the subtopic is not already in the group syllabus,
                    # add it to the filtered subtopics.
                    subtopic_page_id = topic.id + ':' + subtopic.id
                    if subtopic.id not in group_subtopic_page_ids:
                        filtered_subtopics.append(subtopic)

        # If the keyword does not matches a topic name.
        else:
            # If type filter is not set or type filter is set to 'Skill',
            # add the subtopics which have the keyword in their title to the
            # filtered subtopics.
            if filter_type is None or filter_type == 'Skill':
                for subtopic in topic.subtopics:
                    if subtopic.title.find(keyword) != -1:
                        # If the subtopic is not already in the group syllabus,
                        # add it to the filtered subtopics.
                        subtopic_page_id = topic.id + ':' + subtopic.id
                        if subtopic_page_id not in group_subtopic_page_ids:
                            filtered_subtopics.append(subtopic)

            # If type filter is not set or type filter is set to 'Story',
            # add all story ids of this topic to the possible story ids.
            if filter_type is None or filter_type == 'Story':
                possible_story_ids = (
                    [
                        story.id for story in topic.canonical_story_references
                        and story.id not in group_story_ids
                        and story.story_is_published is True
                    ]
                )

    if len(filtered_story_ids) > 0:
        filtered_stories = story_fetchers.get_story_summaries_by_ids(
            filtered_story_ids
        )

    if len(possible_story_ids) > 0:
        possible_stories = story_fetchers.get_story_summaries_by_ids(
            possible_story_ids
        )
        for story in possible_stories:
            if story.title.find(keyword) != -1:
                filtered_stories.append(story)

    return {
        'story_summaries': filtered_stories,
        'subtopic_summaries': filtered_subtopics
    }


def add_student_to_learner_group(
        user_id, group_id, progress_sharing_permission
    ) -> None:
    """Adds the given student to the given learner group.

    Args:
        user_id: str. The id of the student.
        group_id: str. The id of the learner group.
        progress_sharing_permission: bool. The progress sharing permission of
            the learner group. True if progress sharing is allowed, False
            otherwise.

    Raises:
        Exception. Student was not invited to join the learner group.
    """
    learner_group_model = learner_group_models.LearnerGroupModel.get_by_id(
        group_id)

    learner_grps_user_model = user_models.LearnerGroupsUserModel.get_by_id(
        user_id)

    if user_id not in learner_group_model.invited_student_user_ids:
        raise Exception('Student was not invited to join the learner group.')

    if (not learner_grps_user_model or group_id not in
        learner_grps_user_model.invited_to_learner_groups_ids
    ):
        raise Exception('Student was not invited to join the learner group.')

    learner_group_model.invited_student_user_ids.remove(user_id)
    learner_group_model.student_user_ids.append(user_id)

    details_of_learner_group = {
        'group_id': group_id,
        'progress_sharing_is_turned_on': progress_sharing_permission
    }

    learner_grps_user_model.invited_to_learner_groups_ids.remove(group_id)
    learner_grps_user_model.learner_groups_user_details.append(
        details_of_learner_group)

    learner_grps_user_model.update_timestamps()
    learner_grps_user_model.put()

    learner_group_model.update_timestamps()
    learner_group_model.put()


def invite_students_to_learner_group(group_id, invited_student_ids) -> None:
    """Invites the given students to the given learner group.

    Args:
        group_id: str. The id of the learner group.
        invited_student_ids: list(str). The ids of the students to invite.
    """
    learner_groups_user_models = (
        user_models.LearnerGroupsUserModel.get_multi(invited_student_ids))

    for index, student_id in invited_student_ids:
        if learner_groups_user_models[index]:
            (
                learner_groups_user_models[index].invited_to_learner_groups_ids
                .append(group_id)
            )
        else:
            learner_grps_user_model = user_models.LearnerGroupsUserModel(
                id=student_id,
                invited_to_learner_groups_ids=[group_id],
                learner_groups_user_details=[]
            )
            learner_groups_user_models[index] = learner_grps_user_model

    learner_groups_user_models.update_timestamps_multi()
    learner_groups_user_models.put_multi()


def remove_invited_students_from_learner_group(group_id, student_ids) -> None:
    """Removes the given invited students from the given learner group.

    Args:
        group_id: str. The id of the learner group.
        student_ids: list(str). The ids of the students to remove.
    """
    found_models = (
        user_models.LearnerGroupsUserModel.get_multi(student_ids))

    for index, model in found_models:
        if group_id in model.invited_to_learner_groups_ids:
            found_models[index].invited_to_learner_groups_ids.remove(group_id)

    found_models.update_timestamps_multi()
    found_models.put_multi()
