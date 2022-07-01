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

from core.constants import constants
from core.domain import config_domain
from core.domain import learner_group_domain
from core.domain import learner_group_fetchers
from core.domain import skill_services
from core.domain import story_fetchers
from core.domain import subtopic_page_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.platform import models

from typing import List, Optional

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
        facilitator_user_ids, invited_student_ids,
        subtopic_page_ids, story_ids
    ) -> learner_group_domain.LearnerGroup:
    """Creates a new learner group.

    Args:
        group_id: str. The id of the learner group to be created.
        title: str. The title of the learner group.
        description: str. The description of the learner group.
        facilitator_user_ids: str. List of user ids of the facilitators of the
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

    learner_group = learner_group_domain.LearnerGroup(
        group_id=group_id,
        title=title,
        description=description,
        facilitator_user_ids=facilitator_user_ids,
        student_user_ids=[],
        invited_student_user_ids=invited_student_ids,
        subtopic_page_ids=subtopic_page_ids,
        story_ids=story_ids
    )

    learner_group.validate()

    learner_group_model = learner_group_models.LearnerGroupModel(
        id=group_id,
        title=title,
        description=description,
        facilitator_user_ids=facilitator_user_ids,
        student_user_ids=[],
        invited_student_user_ids=invited_student_ids,
        subtopic_page_ids=subtopic_page_ids,
        story_ids=story_ids
    )

    learner_group_model.update_timestamps()
    learner_group_model.put()

    if len(learner_group_model.invited_student_user_ids) > 0:
        invite_students_to_learner_group(
            group_id, learner_group_model.invited_student_user_ids)

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

    learner_group = learner_group_domain.LearnerGroup(
        group_id=group_id,
        title=title,
        description=description,
        facilitator_user_ids=facilitator_user_ids,
        student_user_ids=student_ids,
        invited_student_user_ids=invited_student_ids,
        subtopic_page_ids=subtopic_page_ids,
        story_ids=story_ids
    )

    learner_group.validate()

    old_invited_student_ids = set(learner_group_model.invited_student_user_ids)
    new_invited_student_ids = set(invited_student_ids)
    if new_invited_student_ids != old_invited_student_ids:
        newly_added_invites = list(
            new_invited_student_ids - old_invited_student_ids
        )
        newly_removed_invites = list(
            old_invited_student_ids - new_invited_student_ids
        )
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
        topic_id = subtopic_page_id.split(':')[0]
        if topic_id not in topic_ids:
            topic_ids.append(topic_id)

    return topic_ids


def get_matching_learner_group_syllabus_to_add(
        learner_group_id, keyword,
        search_type, category,
        language_code
    ):
    """Returns the syllabus of items matching the given filter arguments
    that can be added to the learner group.

    Args:
        learner_group_id: str. The id of the learner group.
        keyword: str. The keyword to search the syllabus. It is compared with
            the title of the topics, stories and subtopics.
        search_type: str. The type of the syllabus item to search. It can be
            either 'Story' or 'Skill'.
        category: str. The category of the syllabus items. It is the
            classroom in which the stories and subtopics are to be searched.
        language_code: str. The language of the topics in which the stories
            and subtopics are to be searched.

    Returns:
        list(dict). The matching syllabus items to add to the learner group.
    """
    keyword = keyword.lower()
    learner_group = learner_group_fetchers.get_learner_group_by_id(
        learner_group_id)

    group_subtopic_page_ids = learner_group.subtopic_page_ids
    group_story_ids = learner_group.story_ids

    matching_topics: List[topic_domain.Topic] = []

    matching_topic_ids: List[str] = []
    all_classrooms_dict = config_domain.CLASSROOM_PAGES_DATA.value

    matching_subtopics_dicts = []
    matching_story_syllabus_item_dicts = []

    if category != constants.DEFAULT_ADD_SYLLABUS_FILTER:
        for classroom in all_classrooms_dict:
            if category and classroom['name'] == category:
                matching_topic_ids.extend(classroom['topic_ids'])

        matching_topics = topic_fetchers.get_topics_by_ids(matching_topic_ids)
    else:
        matching_topics = topic_fetchers.get_all_topics()

    for topic in matching_topics:
        if language_code and language_code != topic.language_code:
            continue

        # If the keyword matches a topic name.
        if topic.canonical_name.find(keyword) != -1:
            # If search type is set to default or search type is set to
            # 'Story', add all story ids of this topic to the filtered
            # story ids.
            if (
                search_type in (constants.LEARNER_GROUP_ADD_STORY_FILTER,
                constants.DEFAULT_ADD_SYLLABUS_FILTER)
            ):
                matching_story_syllabus_item_dicts.extend(
                    get_matching_story_syllabus_item_dicts(
                        topic, group_story_ids))

            # If search type is set to default or search type is set to
            # 'Skill', add all subtopics of this topic to the filtered
            # subtopics.
            if (
                search_type in (constants.LEARNER_GROUP_ADD_SKILL_FILTER,
                constants.DEFAULT_ADD_SYLLABUS_FILTER)
            ):
                matching_subtopics_dicts.extend(
                    get_matching_subtopic_syllabus_item_dicts(
                        topic, group_subtopic_page_ids))

        # If the keyword does not matches a topic name.
        else:
            # If search type is set to default or search type is set to
            # 'Skill', add the subtopics which have the keyword in their
            # title to the filtered subtopics.
            if (
                search_type in (constants.LEARNER_GROUP_ADD_SKILL_FILTER,
                constants.DEFAULT_ADD_SYLLABUS_FILTER)
            ):
                matching_subtopics_dicts.extend(
                    get_matching_subtopic_syllabus_item_dicts(
                        topic, group_subtopic_page_ids, keyword))

            # If search type is set to default or search type is set to
            # 'Story', add all story ids of this topic to the possible
            # story ids.
            if (
                search_type in (constants.LEARNER_GROUP_ADD_STORY_FILTER,
                constants.DEFAULT_ADD_SYLLABUS_FILTER)
            ):
                matching_story_syllabus_item_dicts.extend(
                    get_matching_story_syllabus_item_dicts(
                        topic, group_story_ids, keyword))

    return {
        'story_summaries': matching_story_syllabus_item_dicts,
        'subtopic_summaries': matching_subtopics_dicts
    }


def get_matching_subtopic_syllabus_item_dicts(
        topic: topic_domain.Topic,
        group_subtopic_page_ids: List[str],
        keyword: Optional[str] = None
    ):
    """Returns the matching subtopics syllabus item dicts of the given topic
    that can be added to the learner group syllabus.

    Args:
        topic: Topic. The topic whose subtopic subtopic items are to be
            searched.
        group_subtopic_page_ids: list(str). The ids of the subtopic pages of
            the learner group.
        keyword: Optional[str]. The keyword to search the subtopic syllabus
            items. It is compared with the title of the subtopics if passed
            in arguments.

    Returns:
        list(dict). The matching subtopic syllabus items of the given topic.
    """
    matching_subtopic_syllabus_item_dicts = []

    for subtopic in topic.subtopics:
        subtopic_page_id = topic.id + ':' + str(subtopic.id)
        if subtopic_page_id not in group_subtopic_page_ids:
            if keyword is None or subtopic.title.lower().find(keyword) != -1:
                syllabus_subtopic_dict = {
                    'subtopic_id': subtopic.id,
                    'subtopic_title': subtopic.title,
                    'parent_topic_id': topic.id,
                    'parent_topic_name': topic.name,
                    'thumbnail_filename': subtopic.thumbnail_filename,
                    'thumbnail_bg_color': subtopic.thumbnail_bg_color
                }
                matching_subtopic_syllabus_item_dicts.append(
                    syllabus_subtopic_dict)

    return matching_subtopic_syllabus_item_dicts


def get_matching_story_syllabus_item_dicts(
        topic: topic_domain.Topic,
        group_story_ids: List(str),
        keyword: Optional[str] = None
    ):
    """Returns the matching story syllabus item dicts of the given topic
    that can be added to the learner group syllabus.

    Args:
        topic: Topic. The topic whose stories are to be searched.
        group_story_ids: list(str). The story ids of the learner group.
        keyword: Optional[str]. The keyword to search the stories. It is
            compared with the title of the story if passed in arguments.

    Returns:
        list(dict). The matching story syllabus item dicts of the given topic.
    """
    story_ids = (
        [
            story.story_id for story in
            topic.canonical_story_references
            if (story.story_id not in group_story_ids
                and story.story_is_published is True)
        ]
    )

    matching_stories = story_fetchers.get_story_summaries_by_ids(story_ids)
    stories = story_fetchers.get_stories_by_ids(story_ids)

    matching_story_syllabus_item_dicts = []

    for ind, story in enumerate(matching_stories):
        if keyword is None or story.title.lower().find(keyword) != -1:
            syllabus_story_dict = story.to_dict()
            syllabus_story_dict['story_is_published'] = True
            syllabus_story_dict['completed_node_titles'] = []
            syllabus_story_dict['all_node_dicts'] = [
                node.to_dict() for node in stories[ind].story_contents.nodes
            ]
            syllabus_story_dict['topic_name'] = topic.name
            syllabus_story_dict['topic_url_fragment'] = topic.url_fragment
            matching_story_syllabus_item_dicts.append(syllabus_story_dict)

    return matching_story_syllabus_item_dicts


def add_student_to_learner_group(
        group_id, user_id, progress_sharing_permission
    ) -> None:
    """Adds the given student to the given learner group.

    Args:
        group_id: str. The id of the learner group.
        user_id: str. The id of the student.
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

    for index, student_id in enumerate(invited_student_ids):
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

    user_models.LearnerGroupsUserModel.update_timestamps_multi(
        learner_groups_user_models)
    user_models.LearnerGroupsUserModel.put_multi(learner_groups_user_models)


def remove_invited_students_from_learner_group(group_id, student_ids) -> None:
    """Removes the given invited students from the given learner group.

    Args:
        group_id: str. The id of the learner group.
        student_ids: list(str). The ids of the students to remove.
    """
    found_models = (
        user_models.LearnerGroupsUserModel.get_multi(student_ids))

    for index, model in enumerate(found_models):
        if group_id in model.invited_to_learner_groups_ids:
            found_models[index].invited_to_learner_groups_ids.remove(group_id)

    user_models.LearnerGroupsUserModel.update_timestamps_multi(found_models)
    user_models.LearnerGroupsUserModel.put_multi(found_models)


def get_subtopic_page_progress(
        user_id: str,
        subtopic_page_ids: List[str],
        topics: List[topic_domain.Topic],
        all_skill_ids: List[str]
    ):
    """Returns the progress of the given user on the given subtopic pages.

    Args:
        user_id: str. The id of the user.
        subtopic_page_ids: list(str). The ids of the subtopic pages.
        topics: list(Topic). The topics corresponding to the subtopic pages.
        all_skill_ids: list(str). The ids of all the skills in the topics.

    Returns:
        SubtopicPageSummary. Subtopic Page Summary domain object containing
        details of the subtopic page and users mastery in it.
    """

    # Fetch the progress of the student in all the subtopics assigned
    # in the group syllabus.
    skills_mastery_dict = (
        skill_services.get_multi_user_skill_mastery(
            user_id, all_skill_ids
        )
    )

    subtopic_prog_summary: subtopic_page_domain.SubtopicPageSummary

    for topic in topics:
        for subtopic in topic.subtopics:
            subtopic_page_id = topic.id + ':' + str(subtopic.id)
            if not subtopic_page_id in subtopic_page_ids:
                continue
            skill_mastery_dict = {
                skill_id: mastery
                for skill_id, mastery in skills_mastery_dict.items()
                if mastery is not None and (
                    skill_id in subtopic.skill_ids
                )
            }
            if skill_mastery_dict:
                # Subtopic mastery is average of skill masteries.
                subtopic_prog_summary = (
                    subtopic_page_domain.SubtopicPageSummary(
                        subtopic_id=subtopic.id,
                        subtopic_title=subtopic.title,
                        parent_topic_id=topic.id,
                        parent_topic_name=topic.name,
                        thumbnail_filename=subtopic.thumbnail_filename,
                        thumbnail_bg_color=subtopic.thumbnail_bg_color,
                        subtopic_mastery=(
                            sum(skill_mastery_dict.values()) /
                            len(skill_mastery_dict)
                        )
                    )
                )

    return subtopic_prog_summary
