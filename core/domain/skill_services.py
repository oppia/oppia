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

"""Commands that can be used to operate on skills."""

from __future__ import annotations

import collections
import itertools
import logging

from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import config_domain
from core.domain import html_cleaner
from core.domain import opportunity_services
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import state_domain
from core.domain import suggestion_services
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models

from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(skill_models, user_models, question_models, topic_models) = (
    models.Registry.import_models([
        models.NAMES.skill, models.NAMES.user, models.NAMES.question,
        models.NAMES.topic]))
datastore_services = models.Registry.import_datastore_services()


# Repository GET methods.
def get_merged_skill_ids():
    """Returns the skill IDs of skills that have been merged.

    Returns:
        list(str). List of skill IDs of merged skills.
    """
    return [skill.id for skill in skill_models.SkillModel.get_merged_skills()]


def get_all_skill_summaries():
    """Returns the summaries of all skills present in the datastore.

    Returns:
        list(SkillSummary). The list of summaries of all skills present in the
        datastore.
    """
    skill_summaries_models = skill_models.SkillSummaryModel.get_all()
    skill_summaries = [
        get_skill_summary_from_model(summary)
        for summary in skill_summaries_models]
    return skill_summaries


def _get_skill_summaries_in_batches(
        num_skills_to_fetch, urlsafe_start_cursor, sort_by):
    """Returns the summaries of skills present in the datastore.

    Args:
        num_skills_to_fetch: int. Number of skills to fetch.
        urlsafe_start_cursor: str or None. The cursor to the next page.
        sort_by: str. A string indicating how to sort the result.

    Returns:
        3-tuple(skill_summaries, new_urlsafe_start_cursor, more). where:
            skill_summaries: list(SkillSummary). The list of skill summaries.
                The number of returned skill summaries might include more than
                the requested number. Hence, the cursor returned will represent
                the point to which those results were fetched (and not the
                "num_skills_to_fetch" point).
            urlsafe_start_cursor: str or None. A query cursor pointing to the
                next batch of results. If there are no more results, this might
                be None.
            more: bool. If True, there are (probably) more results after this
                batch. If False, there are no further results after this batch.
    """
    # The fetched skills will be filtered afterwards and filtering may result
    # in having less number of skills than requested. Hence, fetching twice
    # the number of requested skills will help reduce the number of datastore
    # calls.
    skill_summaries_models, new_urlsafe_start_cursor, more = (
        skill_models.SkillSummaryModel.fetch_page(
            2 * num_skills_to_fetch, urlsafe_start_cursor, sort_by))

    skill_summaries = [
        get_skill_summary_from_model(summary)
        for summary in skill_summaries_models]
    return skill_summaries, new_urlsafe_start_cursor, more


def get_filtered_skill_summaries(
        num_skills_to_fetch, status, classroom_name, keywords,
        sort_by, urlsafe_start_cursor):
    """Returns all the skill summary dicts after filtering.

    Args:
        num_skills_to_fetch: int. Number of skills to fetch.
        status: str. The status of the skill.
        classroom_name: str. The classroom_name of the topic to which the skill
            is assigned to.
        keywords: list(str). The keywords to look for
            in the skill description.
        sort_by: str. A string indicating how to sort the result.
        urlsafe_start_cursor: str or None. The cursor to the next page.

    Returns:
        3-tuple(augmented_skill_summaries, new_urlsafe_start_cursor, more).
        Where:
            augmented_skill_summaries: list(AugmentedSkillSummary). The list of
                augmented skill summaries. The number of returned skills might
                include more than the requested number. Hence, the cursor
                returned will represent the point to which those results were
                fetched (and not the "num_skills_to_fetch" point).
            new_urlsafe_start_cursor: str or None. A query cursor pointing to
                the next batch of results. If there are no more results, this
                might be None.
            more: bool. If True, there are (probably) more results after this
                batch. If False, there are no further results after this batch.
    """
    augmented_skill_summaries = []
    new_urlsafe_start_cursor = urlsafe_start_cursor
    more = True

    while len(augmented_skill_summaries) < num_skills_to_fetch and more:
        augmented_skill_summaries_batch, new_urlsafe_start_cursor, more = (
            _get_augmented_skill_summaries_in_batches(
                num_skills_to_fetch, new_urlsafe_start_cursor, sort_by))

        filtered_augmented_skill_summaries = _filter_skills_by_status(
            augmented_skill_summaries_batch, status)
        filtered_augmented_skill_summaries = _filter_skills_by_classroom(
            filtered_augmented_skill_summaries, classroom_name)
        filtered_augmented_skill_summaries = _filter_skills_by_keywords(
            filtered_augmented_skill_summaries, keywords)
        augmented_skill_summaries.extend(filtered_augmented_skill_summaries)

    return augmented_skill_summaries, new_urlsafe_start_cursor, more


def _get_augmented_skill_summaries_in_batches(
        num_skills_to_fetch, urlsafe_start_cursor, sort_by):
    """Returns all the Augmented skill summaries after attaching
    topic and classroom.

    Returns:
        3-tuple(augmented_skill_summaries, urlsafe_start_cursor, more). Where:
            augmented_skill_summaries: list(AugmentedSkillSummary). The list of
                skill summaries.
            urlsafe_start_cursor: str or None. A query cursor pointing to the
                next batch of results. If there are no more results, this might
                be None.
            more: bool. If True, there are (probably) more results after this
                batch. If False, there are no further results after this batch.
    """
    skill_summaries, new_urlsafe_start_cursor, more = (
        _get_skill_summaries_in_batches(
            num_skills_to_fetch, urlsafe_start_cursor, sort_by))

    assigned_skill_ids = collections.defaultdict(lambda: {
        'topic_names': [],
        'classroom_names': []
    })

    all_topic_models = topic_models.TopicModel.get_all()
    all_topics = [topic_fetchers.get_topic_from_model(topic_model)
                  if topic_model is not None else None
                  for topic_model in all_topic_models]

    topic_classroom_dict = {}
    all_classrooms_dict = config_domain.CLASSROOM_PAGES_DATA.value

    for classroom in all_classrooms_dict:
        for topic_id in classroom['topic_ids']:
            topic_classroom_dict[topic_id] = classroom['name']

    for topic in all_topics:
        for skill_id in topic.get_all_skill_ids():
            assigned_skill_ids[skill_id]['topic_names'].append(topic.name)
            assigned_skill_ids[skill_id]['classroom_names'].append(
                topic_classroom_dict.get(topic.id, None))

    augmented_skill_summaries = []
    for skill_summary in skill_summaries:
        topic_names = []
        classroom_names = []
        if skill_summary.id in assigned_skill_ids:
            topic_names = assigned_skill_ids[skill_summary.id]['topic_names']
            classroom_names = (
                assigned_skill_ids[skill_summary.id]['classroom_names'])

        augmented_skill_summary = skill_domain.AugmentedSkillSummary(
            skill_summary.id,
            skill_summary.description,
            skill_summary.language_code,
            skill_summary.version,
            skill_summary.misconception_count,
            skill_summary.worked_examples_count,
            topic_names,
            classroom_names,
            skill_summary.skill_model_created_on,
            skill_summary.skill_model_last_updated)
        augmented_skill_summaries.append(augmented_skill_summary)

    return augmented_skill_summaries, new_urlsafe_start_cursor, more


def _filter_skills_by_status(augmented_skill_summaries, status):
    """Returns the skill summary dicts after filtering by status.

    Args:
        augmented_skill_summaries: list(AugmentedSkillSummary). The list
            of augmented skill summaries.
        status: str. The status of the skill.

    Returns:
        list(AugmentedSkillSummary). The list of AugmentedSkillSummaries
        matching the given status.
    """

    if status is None or status == constants.SKILL_STATUS_OPTIONS['ALL']:
        return augmented_skill_summaries

    elif status == constants.SKILL_STATUS_OPTIONS['UNASSIGNED']:
        unassigned_augmented_skill_summaries = []
        for augmented_skill_summary in augmented_skill_summaries:
            if not augmented_skill_summary.topic_names:
                unassigned_augmented_skill_summaries.append(
                    augmented_skill_summary)

        return unassigned_augmented_skill_summaries

    elif status == constants.SKILL_STATUS_OPTIONS['ASSIGNED']:
        assigned_augmented_skill_summaries = []
        for augmented_skill_summary in augmented_skill_summaries:
            if augmented_skill_summary.topic_names:
                assigned_augmented_skill_summaries.append(
                    augmented_skill_summary)
        return assigned_augmented_skill_summaries


def _filter_skills_by_classroom(augmented_skill_summaries, classroom_name):
    """Returns the skill summary dicts after filtering by classroom_name.

    Args:
        augmented_skill_summaries: list(AugmentedSkillSummary).
            The list of augmented skill summaries.
        classroom_name: str. The classroom_name of the topic to which the skill
            is assigned to.

    Returns:
        list(AugmentedSkillSummary). The list of augmented skill summaries with
        the given classroom name.
    """

    if classroom_name is None or classroom_name == 'All':
        return augmented_skill_summaries

    augmented_skill_summaries_with_classroom_name = []
    for augmented_skill_summary in augmented_skill_summaries:
        if classroom_name in augmented_skill_summary.classroom_names:
            augmented_skill_summaries_with_classroom_name.append(
                augmented_skill_summary)

    return augmented_skill_summaries_with_classroom_name


def _filter_skills_by_keywords(augmented_skill_summaries, keywords):
    """Returns whether the keywords match the skill description.

    Args:
        augmented_skill_summaries: list(AugmentedSkillSummary). The augmented
            skill summaries.
        keywords: list(str). The keywords to match.

    Returns:
        list(AugmentedSkillSummary). The list of augmented skill summaries
        matching the given keywords.
    """
    if not keywords:
        return augmented_skill_summaries

    filtered_augmented_skill_summaries = []

    for augmented_skill_summary in augmented_skill_summaries:
        if any((augmented_skill_summary.description.lower().find(
                keyword.lower()) != -1) for keyword in keywords):
            filtered_augmented_skill_summaries.append(augmented_skill_summary)

    return filtered_augmented_skill_summaries


def get_multi_skill_summaries(skill_ids):
    """Returns a list of skill summaries matching the skill IDs provided.

    Args:
        skill_ids: list(str). List of skill IDs to get skill summaries for.

    Returns:
        list(SkillSummary). The list of summaries of skills matching the
        provided IDs.
    """
    skill_summaries_models = skill_models.SkillSummaryModel.get_multi(skill_ids)
    skill_summaries = [
        get_skill_summary_from_model(skill_summary_model)
        for skill_summary_model in skill_summaries_models
        if skill_summary_model is not None]
    return skill_summaries


def get_rubrics_of_skills(skill_ids):
    """Returns a list of rubrics corresponding to given skills.

    Args:
        skill_ids: list(str). The list of skill IDs.

    Returns:
        dict, list(str). The skill rubrics of skills keyed by their
        corresponding ids and the list of deleted skill ids, if any.
    """
    skills = skill_fetchers.get_multi_skills(skill_ids, strict=False)
    skill_id_to_rubrics_dict = {}

    for skill in skills:
        if skill is not None:
            rubric_dicts = [rubric.to_dict() for rubric in skill.rubrics]
            skill_id_to_rubrics_dict[skill.id] = rubric_dicts

    deleted_skill_ids = []
    for skill_id in skill_ids:
        if skill_id not in skill_id_to_rubrics_dict:
            skill_id_to_rubrics_dict[skill_id] = None
            deleted_skill_ids.append(skill_id)

    return skill_id_to_rubrics_dict, deleted_skill_ids


def get_descriptions_of_skills(skill_ids):
    """Returns a list of skill descriptions corresponding to the given skills.

    Args:
        skill_ids: list(str). The list of skill ids.

    Returns:
        dict, list(str). The skill descriptions of skills keyed by their
        corresponding ids and the list of deleted skill ids, if any.
    """
    skill_summaries = get_multi_skill_summaries(skill_ids)
    skill_id_to_description_dict = {}

    for skill_summary in skill_summaries:
        if skill_summary is not None:
            skill_id_to_description_dict[skill_summary.id] = (
                skill_summary.description)

    deleted_skill_ids = []
    for skill_id in skill_ids:
        if skill_id not in skill_id_to_description_dict:
            skill_id_to_description_dict[skill_id] = None
            deleted_skill_ids.append(skill_id)

    return skill_id_to_description_dict, deleted_skill_ids


def get_skill_summary_from_model(skill_summary_model):
    """Returns a domain object for an Oppia skill summary given a
    skill summary model.

    Args:
        skill_summary_model: SkillSummaryModel. The skill summary model object
            to get corresponding domain object.

    Returns:
        SkillSummary. The domain object corresponding to given skill summmary
        model.
    """
    return skill_domain.SkillSummary(
        skill_summary_model.id, skill_summary_model.description,
        skill_summary_model.language_code,
        skill_summary_model.version,
        skill_summary_model.misconception_count,
        skill_summary_model.worked_examples_count,
        skill_summary_model.skill_model_created_on,
        skill_summary_model.skill_model_last_updated
    )


def get_image_filenames_from_skill(skill):
    """Get the image filenames from the skill.

    Args:
        skill: Skill. The skill itself.

    Returns:
        list(str). List containing the name of the image files in skill.
    """
    html_list = skill.get_all_html_content_strings()
    return html_cleaner.get_image_filenames_from_html_strings(html_list)


def get_all_topic_assignments_for_skill(skill_id):
    """Returns a list containing all the topics to which the given skill is
    assigned along with topic details.

    Args:
        skill_id: str. ID of the skill.

    Returns:
        list(TopicAssignment). A list of TopicAssignment domain objects.
    """
    topic_assignments = []
    topics = topic_fetchers.get_all_topics()
    for topic in topics:
        if skill_id in topic.get_all_skill_ids():
            subtopic_id = None
            for subtopic in topic.subtopics:
                if skill_id in subtopic.skill_ids:
                    subtopic_id = subtopic.id
                    break

            topic_assignments.append(skill_domain.TopicAssignment(
                topic.id, topic.name, topic.version, subtopic_id))

    return topic_assignments


def get_topic_names_with_given_skill_in_diagnostic_test(skill_id):
    """Returns a list of topic names for which the given skill is assigned
    to that topic's diagnostic test.

    Args:
        skill_id: str. ID of the skill.

    Returns:
        list(str). A list of topic names for which the given skill is assigned
        to that topic's diagnostic test.
    """
    topics = topic_fetchers.get_all_topics()
    topic_names = []
    for topic in topics:
        if skill_id in topic.skill_ids_for_diagnostic_test:
            topic_names.append(topic.name)
    return topic_names


def replace_skill_id_in_all_topics(user_id, old_skill_id, new_skill_id):
    """Replaces the old skill id with the new one in all the associated topics.

    Args:
        user_id: str. The unique user ID of the user.
        old_skill_id: str. The old skill id.
        new_skill_id: str. The new skill id.

    Raises:
        Exception. The new skill already present.
    """
    all_topics = topic_fetchers.get_all_topics()
    for topic in all_topics:
        change_list = []
        if old_skill_id in topic.get_all_skill_ids():
            if new_skill_id in topic.get_all_skill_ids():
                raise Exception(
                    'Found topic \'%s\' contains the two skills to be merged. '
                    'Please unassign one of these skills from topic '
                    'and retry this operation.' % topic.name)
            if old_skill_id in topic.uncategorized_skill_ids:
                change_list.extend([topic_domain.TopicChange({
                    'cmd': 'remove_uncategorized_skill_id',
                    'uncategorized_skill_id': old_skill_id
                }), topic_domain.TopicChange({
                    'cmd': 'add_uncategorized_skill_id',
                    'new_uncategorized_skill_id': new_skill_id
                })])
            for subtopic in topic.subtopics:
                if old_skill_id in subtopic.skill_ids:
                    change_list.extend([topic_domain.TopicChange({
                        'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                        'subtopic_id': subtopic.id,
                        'skill_id': old_skill_id
                    }), topic_domain.TopicChange({
                        'cmd': 'remove_uncategorized_skill_id',
                        'uncategorized_skill_id': old_skill_id
                    }), topic_domain.TopicChange({
                        'cmd': 'add_uncategorized_skill_id',
                        'new_uncategorized_skill_id': new_skill_id
                    }), topic_domain.TopicChange({
                        'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                        'old_subtopic_id': None,
                        'new_subtopic_id': subtopic.id,
                        'skill_id': new_skill_id
                    })])
                    break
            topic_services.update_topic_and_subtopic_pages(
                user_id, topic.id, change_list,
                'Replace skill id %s with skill id %s in the topic' % (
                    old_skill_id, new_skill_id))


def remove_skill_from_all_topics(user_id, skill_id):
    """Deletes the skill with the given id from all the associated topics.

    Args:
        user_id: str. The unique user ID of the user.
        skill_id: str. ID of the skill.
    """
    all_topics = topic_fetchers.get_all_topics()
    for topic in all_topics:
        change_list = []
        if skill_id in topic.get_all_skill_ids():
            for subtopic in topic.subtopics:
                if skill_id in subtopic.skill_ids:
                    change_list.append(topic_domain.TopicChange({
                        'cmd': 'remove_skill_id_from_subtopic',
                        'subtopic_id': subtopic.id,
                        'skill_id': skill_id
                    }))
                    break

            change_list.append(topic_domain.TopicChange({
                'cmd': 'remove_uncategorized_skill_id',
                'uncategorized_skill_id': skill_id
            }))
            skill_name = get_skill_summary_by_id(skill_id).description
            topic_services.update_topic_and_subtopic_pages(
                user_id, topic.id, change_list,
                'Removed skill with id %s and name %s from the topic' % (
                    skill_id, skill_name))


def get_skill_summary_by_id(skill_id, strict=True):
    """Returns a domain object representing a skill summary.

    Args:
        skill_id: str. ID of the skill summary.
        strict: bool. Whether to fail noisily if no skill summary with the given
            id exists in the datastore.

    Returns:
        SkillSummary. The skill summary domain object corresponding to a skill
        with the given skill_id.
    """
    skill_summary_model = skill_models.SkillSummaryModel.get(
        skill_id, strict=strict)
    if skill_summary_model:
        skill_summary = get_skill_summary_from_model(
            skill_summary_model)
        return skill_summary
    else:
        return None


def get_new_skill_id() -> str:
    """Returns a new skill id.

    Returns:
        str. A new skill id.
    """
    return skill_models.SkillModel.get_new_id('')


def _create_skill(committer_id, skill, commit_message, commit_cmds):
    """Creates a new skill.

    Args:
        committer_id: str. ID of the committer.
        skill: Skill. The skill domain object.
        commit_message: str. A description of changes made to the skill.
        commit_cmds: list(SkillChange). A list of change commands made to the
            given skill.
    """
    skill.validate()
    model = skill_models.SkillModel(
        id=skill.id,
        description=skill.description,
        language_code=skill.language_code,
        misconceptions=[
            misconception.to_dict()
            for misconception in skill.misconceptions
        ],
        rubrics=[
            rubric.to_dict()
            for rubric in skill.rubrics
        ],
        skill_contents=skill.skill_contents.to_dict(),
        next_misconception_id=skill.next_misconception_id,
        misconceptions_schema_version=skill.misconceptions_schema_version,
        rubric_schema_version=skill.rubric_schema_version,
        skill_contents_schema_version=skill.skill_contents_schema_version,
        superseding_skill_id=skill.superseding_skill_id,
        all_questions_merged=skill.all_questions_merged,
        prerequisite_skill_ids=skill.prerequisite_skill_ids
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    skill.version += 1
    create_skill_summary(skill.id)
    opportunity_services.create_skill_opportunity(
        skill.id,
        skill.description)


def does_skill_with_description_exist(description):
    """Checks if skill with provided description exists.

    Args:
        description: str. The description for the skill.

    Returns:
        bool. Whether the the description for the skill exists.
    """
    existing_skill = (
        skill_fetchers.get_skill_by_description(description))
    return existing_skill is not None


def save_new_skill(committer_id, skill):
    """Saves a new skill.

    Args:
        committer_id: str. ID of the committer.
        skill: Skill. Skill to be saved.
    """
    commit_message = 'New skill created.'
    _create_skill(
        committer_id, skill, commit_message, [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })])


def apply_change_list(skill_id, change_list, committer_id):
    """Applies a changelist to a skill and returns the result.

    Args:
        skill_id: str. ID of the given skill.
        change_list: list(SkillChange). A change list to be applied to the given
            skill.
        committer_id: str. The ID of the committer of this change list.

    Returns:
        Skill. The resulting skill domain object.

    Raises:
        Exception. The user does not have enough rights to edit the
            skill description.
        Exception. Invalid change dict.
    """
    skill = skill_fetchers.get_skill_by_id(skill_id)
    user = user_services.get_user_actions_info(committer_id)
    try:
        for change in change_list:
            if change.cmd == skill_domain.CMD_UPDATE_SKILL_PROPERTY:
                if (change.property_name ==
                        skill_domain.SKILL_PROPERTY_DESCRIPTION):
                    if role_services.ACTION_EDIT_SKILL_DESCRIPTION not in (
                            user.actions):
                        raise Exception(
                            'The user does not have enough rights to edit the '
                            'skill description.')
                    skill.update_description(change.new_value)
                    (
                        opportunity_services
                        .update_skill_opportunity_skill_description(
                            skill.id, change.new_value))
                elif (change.property_name ==
                      skill_domain.SKILL_PROPERTY_LANGUAGE_CODE):
                    skill.update_language_code(change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID):
                    skill.update_superseding_skill_id(change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_PROPERTY_ALL_QUESTIONS_MERGED):
                    skill.record_that_all_questions_are_merged(change.new_value)
            elif change.cmd == skill_domain.CMD_UPDATE_SKILL_CONTENTS_PROPERTY:
                if (change.property_name ==
                        skill_domain.SKILL_CONTENTS_PROPERTY_EXPLANATION):
                    explanation = (
                        state_domain.SubtitledHtml.from_dict(change.new_value))
                    explanation.validate()
                    skill.update_explanation(explanation)
                elif (change.property_name ==
                      skill_domain.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES):
                    worked_examples_list = [
                        skill_domain.WorkedExample.from_dict(worked_example)
                        for worked_example in change.new_value]
                    skill.update_worked_examples(worked_examples_list)
            elif change.cmd == skill_domain.CMD_ADD_SKILL_MISCONCEPTION:
                misconception = skill_domain.Misconception.from_dict(
                    change.new_misconception_dict)
                skill.add_misconception(misconception)
            elif change.cmd == skill_domain.CMD_DELETE_SKILL_MISCONCEPTION:
                skill.delete_misconception(change.misconception_id)
            elif change.cmd == skill_domain.CMD_ADD_PREREQUISITE_SKILL:
                skill.add_prerequisite_skill(change.skill_id)
            elif change.cmd == skill_domain.CMD_DELETE_PREREQUISITE_SKILL:
                skill.delete_prerequisite_skill(change.skill_id)
            elif change.cmd == skill_domain.CMD_UPDATE_RUBRICS:
                skill.update_rubric(
                    change.difficulty, change.explanations)
            elif (change.cmd ==
                  skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY):
                if (change.property_name ==
                        skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NAME):
                    skill.update_misconception_name(
                        change.misconception_id, change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NOTES):
                    skill.update_misconception_notes(
                        change.misconception_id, change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK):
                    skill.update_misconception_feedback(
                        change.misconception_id, change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED): # pylint: disable=line-too-long
                    skill.update_misconception_must_be_addressed(
                        change.misconception_id, change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif (change.cmd in (
                    skill_domain.CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION,
                    skill_domain.CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                    skill_domain.CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION
            )):
                # Loading the skill model from the datastore into a
                # skill domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # skill is sufficient to apply the schema migration.
                continue

        return skill

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, skill_id, change_list)
        )
        raise e


def populate_skill_model_fields(
    skill_model: skill_models.SkillModel, skill: skill_domain.Skill
) -> skill_models.SkillModel:
    """Populate skill model with the data from skill object.

    Args:
        skill_model: SkillModel. The model to populate.
        skill: Skill. The skill domain object which should be used to
            populate the model.

    Returns:
        SkillModel. Populated model.
    """
    skill_model.description = skill.description
    skill_model.language_code = skill.language_code
    skill_model.superseding_skill_id = skill.superseding_skill_id
    skill_model.all_questions_merged = skill.all_questions_merged
    skill_model.prerequisite_skill_ids = skill.prerequisite_skill_ids
    skill_model.misconceptions_schema_version = (
        skill.misconceptions_schema_version)
    skill_model.rubric_schema_version = (
        skill.rubric_schema_version)
    skill_model.skill_contents_schema_version = (
        skill.skill_contents_schema_version)
    skill_model.skill_contents = skill.skill_contents.to_dict()
    skill_model.misconceptions = [
        misconception.to_dict() for misconception in skill.misconceptions
    ]
    skill_model.rubrics = [
        rubric.to_dict() for rubric in skill.rubrics
    ]
    skill_model.next_misconception_id = skill.next_misconception_id
    return skill_model


def _save_skill(committer_id, skill, commit_message, change_list):
    """Validates a skill and commits it to persistent storage. If
    successful, increments the version number of the incoming skill domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        skill: Skill. The skill domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(SkillChange). List of changes applied to a skill.

    Raises:
        Exception. The skill model and the incoming skill domain object have
            different version numbers.
        Exception. Received invalid change list.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save skill %s: %s' % (skill.id, change_list))
    skill.validate()

    # Skill model cannot be None as skill is passed as parameter here and that
    # is only possible if a skill model with that skill id exists.
    skill_model = skill_models.SkillModel.get(
        skill.id, strict=False)

    if skill.version > skill_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of skill '
            'from version %s. Please reload the page and try again.'
            % (skill_model.version, skill.version))

    if skill.version < skill_model.version:
        raise Exception(
            'Trying to update version %s of skill from version %s, '
            'which is too old. Please reload the page and try again.'
            % (skill_model.version, skill.version))

    skill_model = populate_skill_model_fields(skill_model, skill)
    change_dicts = [change.to_dict() for change in change_list]
    skill_model.commit(committer_id, commit_message, change_dicts)
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_SKILL, None, [skill.id])
    skill.version += 1


def update_skill(committer_id, skill_id, change_list, commit_message):
    """Updates a skill. Commits changes.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        skill_id: str. The skill id.
        change_list: list(SkillChange). These changes are applied in sequence to
            produce the resulting skill.
        commit_message: str or None. A description of changes made to the
            skill. For published skills, this must be present; for
            unpublished skills, it may be equal to None.

    Raises:
        ValueError. No commit message was provided.
    """
    if not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')

    skill = apply_change_list(skill_id, change_list, committer_id)
    _save_skill(committer_id, skill, commit_message, change_list)
    create_skill_summary(skill.id)
    misconception_is_deleted = any(
        change.cmd == skill_domain.CMD_DELETE_SKILL_MISCONCEPTION
        for change in change_list
    )
    if misconception_is_deleted:
        deleted_skill_misconception_ids = [
            skill.generate_skill_misconception_id(change.misconception_id)
            for change in change_list
            if change.cmd == skill_domain.CMD_DELETE_SKILL_MISCONCEPTION
        ]
        taskqueue_services.defer(
            taskqueue_services.FUNCTION_ID_UNTAG_DELETED_MISCONCEPTIONS,
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS,
            committer_id, skill_id, skill.description,
            deleted_skill_misconception_ids)


def delete_skill(committer_id, skill_id, force_deletion=False):
    """Deletes the skill with the given skill_id.

    Args:
        committer_id: str. ID of the committer.
        skill_id: str. ID of the skill to be deleted.
        force_deletion: bool. If true, the skill and its history are fully
            deleted and are unrecoverable. Otherwise, the skill and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.
    """
    skill_models.SkillModel.delete_multi(
        [skill_id], committer_id, '', force_deletion=force_deletion)

    # This must come after the skill is retrieved. Otherwise the memcache
    # key will be reinstated.
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_SKILL, None, [skill_id])

    # Delete the summary of the skill (regardless of whether
    # force_deletion is True or not).
    delete_skill_summary(skill_id)
    opportunity_services.delete_skill_opportunity(skill_id)
    suggestion_services.auto_reject_question_suggestions_for_skill_id(
        skill_id)


def delete_skill_summary(skill_id):
    """Delete a skill summary model.

    Args:
        skill_id: str. ID of the skill whose skill summary is to
            be deleted.
    """

    skill_summary_model = (
        skill_models.SkillSummaryModel.get(skill_id, False))
    if skill_summary_model is not None:
        skill_summary_model.delete()


def compute_summary_of_skill(
    skill: skill_domain.Skill
) -> skill_domain.SkillSummary:
    """Create a SkillSummary domain object for a given Skill domain
    object and return it.

    Args:
        skill: Skill. The skill object, for which the summary is to be computed.

    Returns:
        SkillSummary. The computed summary for the given skill.
    """
    skill_model_misconception_count = len(skill.misconceptions)
    skill_model_worked_examples_count = len(
        skill.skill_contents.worked_examples)

    skill_summary = skill_domain.SkillSummary(
        skill.id, skill.description, skill.language_code,
        skill.version, skill_model_misconception_count,
        skill_model_worked_examples_count,
        skill.created_on, skill.last_updated
    )

    return skill_summary


def create_skill_summary(skill_id):
    """Creates and stores a summary of the given skill.

    Args:
        skill_id: str. ID of the skill.
    """
    skill = skill_fetchers.get_skill_by_id(skill_id)
    skill_summary = compute_summary_of_skill(skill)
    save_skill_summary(skill_summary)


def populate_skill_summary_model_fields(
    skill_summary_model: skill_models.SkillSummaryModel,
    skill_summary: skill_domain.SkillSummary
) -> skill_models.SkillSummaryModel:
    """Populate skill summary model with the data from skill summary object.

    Args:
        skill_summary_model: SkillSummaryModel. The model to populate.
        skill_summary: SkillSummary. The skill summary domain object which
            should be used to populate the model.

    Returns:
        SkillSummaryModel. Populated model.
    """
    skill_summary_dict = {
        'description': skill_summary.description,
        'language_code': skill_summary.language_code,
        'version': skill_summary.version,
        'misconception_count': skill_summary.misconception_count,
        'worked_examples_count': skill_summary.worked_examples_count,
        'skill_model_last_updated': skill_summary.skill_model_last_updated,
        'skill_model_created_on': skill_summary.skill_model_created_on
    }
    if skill_summary_model is not None:
        skill_summary_model.populate(**skill_summary_dict)
    else:
        skill_summary_dict['id'] = skill_summary.id
        skill_summary_model = skill_models.SkillSummaryModel(
            **skill_summary_dict)

    return skill_summary_model


def save_skill_summary(skill_summary):
    """Save a skill summary domain object as a SkillSummaryModel
    entity in the datastore.

    Args:
        skill_summary: SkillSummaryModel. The skill summary object to be saved
            in the datastore.
    """
    existing_skill_summary_model = (
        skill_models.SkillSummaryModel.get_by_id(skill_summary.id))
    skill_summary_model = populate_skill_summary_model_fields(
        existing_skill_summary_model, skill_summary
    )
    skill_summary_model.update_timestamps()
    skill_summary_model.put()


def create_user_skill_mastery(user_id, skill_id, degree_of_mastery):
    """Creates skill mastery of a user.

    Args:
        user_id: str. The user ID of the user for whom to create the model.
        skill_id: str. The unique id of the skill.
        degree_of_mastery: float. The degree of mastery of user in the skill.
    """

    user_skill_mastery = skill_domain.UserSkillMastery(
        user_id, skill_id, degree_of_mastery)
    save_user_skill_mastery(user_skill_mastery)


def save_user_skill_mastery(user_skill_mastery):
    """Stores skill mastery of a user.

    Args:
        user_skill_mastery: dict. The user skill mastery model of a user.
    """
    user_skill_mastery_model = user_models.UserSkillMasteryModel(
        id=user_models.UserSkillMasteryModel.construct_model_id(
            user_skill_mastery.user_id, user_skill_mastery.skill_id),
        user_id=user_skill_mastery.user_id,
        skill_id=user_skill_mastery.skill_id,
        degree_of_mastery=user_skill_mastery.degree_of_mastery)

    user_skill_mastery_model.update_timestamps()
    user_skill_mastery_model.put()


def create_multi_user_skill_mastery(user_id, degrees_of_mastery):
    """Creates the mastery of a user in multiple skills.

    Args:
        user_id: str. The user ID of the user.
        degrees_of_mastery: dict(str, float). The keys are the requested
            skill IDs. The values are the corresponding mastery degree of
            the user.
    """
    user_skill_mastery_models = []

    for skill_id, degree_of_mastery in degrees_of_mastery.items():
        user_skill_mastery_models.append(user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                user_id, skill_id),
            user_id=user_id, skill_id=skill_id,
            degree_of_mastery=degree_of_mastery))
    user_models.UserSkillMasteryModel.update_timestamps_multi(
        user_skill_mastery_models)
    user_models.UserSkillMasteryModel.put_multi(user_skill_mastery_models)


def get_user_skill_mastery(user_id, skill_id):
    """Fetches the mastery of user in a particular skill.

    Args:
        user_id: str. The user ID of the user.
        skill_id: str. Unique id of the skill for which mastery degree is
            requested.

    Returns:
        float or None. Mastery degree of the user for the requested skill, or
        None if UserSkillMasteryModel does not exist for the skill.
    """
    model_id = user_models.UserSkillMasteryModel.construct_model_id(
        user_id, skill_id)
    user_skill_mastery_model = user_models.UserSkillMasteryModel.get(
        model_id, strict=False)

    if not user_skill_mastery_model:
        return None
    return user_skill_mastery_model.degree_of_mastery


def get_multi_user_skill_mastery(user_id, skill_ids):
    """Fetches the mastery of user in multiple skills.

    Args:
        user_id: str. The user ID of the user.
        skill_ids: list(str). Skill IDs of the skill for which mastery degree is
            requested.

    Returns:
        dict(str, float|None). The keys are the requested skill IDs. The values
        are the corresponding mastery degree of the user or None if
        UserSkillMasteryModel does not exist for the skill.
    """
    degrees_of_mastery = {}
    model_ids = []

    for skill_id in skill_ids:
        model_ids.append(user_models.UserSkillMasteryModel.construct_model_id(
            user_id, skill_id))

    skill_mastery_models = user_models.UserSkillMasteryModel.get_multi(
        model_ids)

    for skill_id, skill_mastery_model in zip(skill_ids, skill_mastery_models):
        if skill_mastery_model is None:
            degrees_of_mastery[skill_id] = None
        else:
            degrees_of_mastery[skill_id] = skill_mastery_model.degree_of_mastery

    return degrees_of_mastery


def get_multi_users_skills_mastery(
    user_ids: List[str], skill_ids: List[str]
) -> Dict[str, Dict[str, Optional[float]]]:
    """Fetches the mastery of user in multiple skills.

    Args:
        user_ids: list(str). The user IDs of the users.
        skill_ids: list(str). Skill IDs of the skill for which mastery degree is
            requested.

    Returns:
        dict(str, dict(str, float|None)). The keys are the user IDs and values
        are dictionaries with keys as requested skill IDs and values
        as the corresponding mastery degree of the user or None if
        UserSkillMasteryModel does not exist for the skill.
    """
    # We need to convert the resultant object of itertools product to a list
    # to be able to use it multiple times as it otherwise gets exhausted after
    # being iterated over once.
    all_combinations = list(itertools.product(user_ids, skill_ids))
    model_ids = []
    for (user_id, skill_id) in all_combinations:
        model_ids.append(user_models.UserSkillMasteryModel.construct_model_id(
            user_id, skill_id))

    skill_mastery_models = user_models.UserSkillMasteryModel.get_multi(
        model_ids)
    degrees_of_masteries = {user_id: {} for user_id in user_ids}
    for i, (user_id, skill_id) in enumerate(all_combinations):
        skill_mastery_model = skill_mastery_models[i]
        if skill_mastery_model is None:
            degrees_of_masteries[user_id][skill_id] = None
        else:
            degrees_of_masteries[user_id][skill_id] = (
                skill_mastery_model.degree_of_mastery
            )

    return degrees_of_masteries


def skill_has_associated_questions(skill_id):
    """Returns whether or not any question has this skill attached.

    Args:
        skill_id: str. The skill ID of the user.

    Returns:
        bool. Whether any question has this skill attached.
    """
    question_ids = (
        question_models.QuestionSkillLinkModel.get_all_question_ids_linked_to_skill_id( # pylint: disable=line-too-long
            skill_id))
    return len(question_ids) > 0


def get_sorted_skill_ids(degrees_of_mastery):
    """Sort the dict based on the mastery value.

    Args:
        degrees_of_mastery: dict(str, float|None). Dict mapping
            skill ids to mastery level. The mastery level can be
            float or None.

    Returns:
        list. List of the initial skill id's based on the mastery level.
    """
    skill_dict_with_float_value = {
        skill_id: degree for skill_id, degree in degrees_of_mastery.items()
        if degree is not None}

    sorted_skill_ids_with_float_value = sorted(
        skill_dict_with_float_value, key=skill_dict_with_float_value.get)
    skill_ids_with_none_value = [
        skill_id for skill_id, degree in degrees_of_mastery.items()
        if degree is None]

    sorted_skill_ids = (
        skill_ids_with_none_value + sorted_skill_ids_with_float_value)
    return sorted_skill_ids[:feconf.MAX_NUMBER_OF_SKILL_IDS]


def filter_skills_by_mastery(user_id, skill_ids):
    """Given a list of skill_ids, it returns a list of
    feconf.MAX_NUMBER_OF_SKILL_IDS skill_ids in which the user has
    the least mastery.(Please note that python 2.7 considers the None
    type smaller than any value, so None types will be returned first)

    Args:
        user_id: str. The unique user ID of the user.
        skill_ids: list(str). The skill_ids that are to be filtered.

    Returns:
        list(str). A list of the filtered skill_ids.
    """
    degrees_of_mastery = get_multi_user_skill_mastery(user_id, skill_ids)
    filtered_skill_ids = get_sorted_skill_ids(degrees_of_mastery)

    # Arranges the skill_ids in the order as it was received.
    arranged_filtered_skill_ids = []
    for skill_id in skill_ids:
        if skill_id in filtered_skill_ids:
            arranged_filtered_skill_ids.append(skill_id)
    return arranged_filtered_skill_ids


def get_untriaged_skill_summaries(
    skill_summaries, skill_ids_assigned_to_some_topic, merged_skill_ids):
    """Returns a list of skill summaries for all skills that are untriaged.

    Args:
        skill_summaries: list(SkillSummary). The list of all skill summary
            domain objects.
        skill_ids_assigned_to_some_topic: set(str). The set of skill ids which
            are assigned to some topic.
        merged_skill_ids: list(str). List of skill IDs of merged skills.

    Returns:
        list(SkillSummary). A list of skill summaries for all skills that
        are untriaged.
    """
    untriaged_skill_summaries = []

    for skill_summary in skill_summaries:
        skill_id = skill_summary.id
        if (skill_id not in skill_ids_assigned_to_some_topic) and (
                skill_id not in merged_skill_ids):
            untriaged_skill_summaries.append(skill_summary)

    return untriaged_skill_summaries


def get_categorized_skill_ids_and_descriptions():
    """Returns a CategorizedSkills domain object for all the skills that are
    categorized.

    Returns:
        CategorizedSkills. An instance of the CategorizedSkills domain object
        for all the skills that are categorized.
    """
    topics = topic_fetchers.get_all_topics()

    categorized_skills = skill_domain.CategorizedSkills()

    skill_ids = []

    for topic in topics:
        subtopics = topic.subtopics
        subtopic_titles = [subtopic.title for subtopic in subtopics]
        categorized_skills.add_topic(topic.name, subtopic_titles)
        for skill_id in topic.uncategorized_skill_ids:
            skill_ids.append(skill_id)
        for subtopic in subtopics:
            for skill_id in subtopic.skill_ids:
                skill_ids.append(skill_id)

    skill_descriptions = get_descriptions_of_skills(skill_ids)[0]

    for topic in topics:
        subtopics = topic.subtopics
        for skill_id in topic.uncategorized_skill_ids:
            categorized_skills.add_uncategorized_skill(
                topic.name, skill_id,
                skill_descriptions[skill_id])
        for subtopic in subtopics:
            for skill_id in subtopic.skill_ids:
                categorized_skills.add_subtopic_skill(
                    topic.name, subtopic.title,
                    skill_id, skill_descriptions[skill_id])

    return categorized_skills
