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

"""Services for questions data model."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import logging

from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import skill_services
from core.domain import state_domain
from core.platform import models
import feconf

(question_models, skill_models) = models.Registry.import_models(
    [models.NAMES.question, models.NAMES.skill])


def create_new_question(committer_id, question, commit_message):
    """Creates a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. question domain object.
        commit_message: str. A description of changes made to the question.
    """
    question.validate()
    create_new_question_rights(question.id, committer_id)
    model = question_models.QuestionModel(
        id=question.id,
        question_state_data=question.question_state_data.to_dict(),
        language_code=question.language_code,
        version=question.version,
        linked_skill_ids=question.linked_skill_ids,
        question_state_data_schema_version=(
            question.question_state_data_schema_version)
    )
    model.commit(
        committer_id, commit_message, [{'cmd': question_domain.CMD_CREATE_NEW}])
    question.version += 1
    create_question_summary(question.id, committer_id)
    opportunity_services.increment_question_counts(question.linked_skill_ids, 1)


def link_multiple_skills_for_question(
        user_id, question_id, skill_ids, skill_difficulties):
    """Links multiple skill IDs to a question. To do that, it creates multiple
    new QuestionSkillLink models. It also adds the skill ids to the
    linked_skill_ids of the Question.

    Args:
        user_id: str. ID of the creator.
        question_id: str. ID of the question linked to the skills.
        skill_ids: list(str). ID of the skills to which the question is linked.
        skill_difficulties: list(float). The difficulty of the question with
            respect to a skill, represented by a float between
            0 and 1 (inclusive).

    Raises:
        Exception. The lengths of the skill_ids and skill_difficulties
        lists are different.
    """
    if len(skill_ids) != len(skill_difficulties):
        raise Exception(
            'Skill difficulties and skill ids should match. The lengths of the '
            'two lists are different.')
    question = get_question_by_id(question_id)

    new_question_skill_link_models = []
    for index, skill_id in enumerate(skill_ids):
        new_question_skill_link_models.append(
            question_models.QuestionSkillLinkModel.create(
                question_id, skill_id, skill_difficulties[index]))

    new_linked_skill_ids = copy.deepcopy(question.linked_skill_ids)
    new_linked_skill_ids.extend(skill_ids)

    _update_linked_skill_ids_of_question(
        user_id, question_id, list(set(new_linked_skill_ids)),
        question.linked_skill_ids)
    question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
        new_question_skill_link_models)


def create_new_question_skill_link(
        user_id, question_id, skill_id, skill_difficulty):
    """Creates a new QuestionSkillLink model and adds the skill id
    to the linked skill ids for the Question model.

    Args:
        user_id: str. ID of the creator.
        question_id: str. ID of the question linked to the skill.
        skill_id: str. ID of the skill to which the question is linked.
        skill_difficulty: float. The difficulty between [0, 1] of the skill.
    """
    question = get_question_by_id(question_id)

    question_skill_link_model = question_models.QuestionSkillLinkModel.create(
        question_id, skill_id, skill_difficulty)
    question_skill_link_model.put()

    if skill_id not in question.linked_skill_ids:
        new_linked_skill_ids = copy.deepcopy(question.linked_skill_ids)
        new_linked_skill_ids.append(skill_id)
        _update_linked_skill_ids_of_question(
            user_id, question_id, new_linked_skill_ids,
            question.linked_skill_ids)


def update_question_skill_link_difficulty(
        question_id, skill_id, new_difficulty):
    """Updates the difficulty value of question skill link.

    Args:
        question_id: str. ID of the question.
        skill_id: str. ID of the skill.
        new_difficulty: float. New difficulty value.

    Raises:
        Exception. Given question and skill are not linked.
    """
    question_skill_link_id = (
        question_models.QuestionSkillLinkModel.get_model_id(
            question_id, skill_id))
    question_skill_link_model = question_models.QuestionSkillLinkModel.get(
        question_skill_link_id, strict=False)

    if question_skill_link_model is None:
        raise Exception('The given question and skill are not linked.')
    question_skill_link_model.skill_difficulty = new_difficulty
    question_skill_link_model.put()


def _update_linked_skill_ids_of_question(
        user_id, question_id, new_linked_skill_ids, old_linked_skill_ids):
    """Updates the question linked_skill ids in the Question model.

    Args:
        user_id: str. ID of the creator.
        question_id: str. ID of the question linked to the skill.
        new_linked_skill_ids: list(str). New linked skill IDs of the question.
        old_linked_skill_ids: list(str). Current linked skill IDs of the
        question.
    """
    change_dict = {
        'cmd': 'update_question_property',
        'property_name': 'linked_skill_ids',
        'new_value': new_linked_skill_ids,
        'old_value': old_linked_skill_ids
    }
    change_list = [question_domain.QuestionChange(change_dict)]
    update_question(
        user_id, question_id, change_list, 'updated linked skill ids')
    (opportunity_services
     .update_skill_opportunities_on_question_linked_skills_change(
         old_linked_skill_ids, new_linked_skill_ids))


def delete_question_skill_link(user_id, question_id, skill_id):
    """Deleted a QuestionSkillLink model and removes the linked skill id
    from the Question model of question_id.

    Args:
        user_id: str. ID of the creator.
        question_id: str. ID of the question linked to the skill.
        skill_id: str. ID of the skill to which the question is linked.
    """
    question = get_question_by_id(question_id)

    new_linked_skill_ids = copy.deepcopy(question.linked_skill_ids)
    new_linked_skill_ids.remove(skill_id)
    question_skill_link_id = (
        question_models.QuestionSkillLinkModel.get_model_id(
            question_id, skill_id))
    question_skill_link_model = question_models.QuestionSkillLinkModel.get(
        question_skill_link_id)

    if new_linked_skill_ids:
        _update_linked_skill_ids_of_question(
            user_id, question_id,
            new_linked_skill_ids, question.linked_skill_ids)
    else:
        delete_question(user_id, question_id)

    question_skill_link_model.delete()


def get_questions_by_skill_ids(
        total_question_count, skill_ids, fetch_by_difficulty):
    """Returns constant number of questions linked to each given skill id.

    Args:
        total_question_count: int. The total number of questions to return.
        skill_ids: list(str). The IDs of the skills to which the questions
            should be linked.
        fetch_by_difficulty: bool. Indicates whether the returned questions
            should be fetched by skill difficulty.

    Returns:
        list(Question). The list containing an expected number of
            total_question_count questions linked to each given skill id.
            question count per skill will be total_question_count divided by
            length of skill_ids, and it will be rounded up if not evenly
            divisible. If not enough questions for one skill, simply return
            all questions linked to it. The order of questions will follow the
            order of given skill ids, and the order of questions for the same
            skill is random when fetch_by_difficulty is false, otherwise the
            order is sorted by absolute value of the difference between skill
            difficulty and the medium difficulty.
    """

    if total_question_count > feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME:
        raise Exception(
            'Question count is too high, please limit the question count to '
            '%d.' % feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME)

    if fetch_by_difficulty:
        question_skill_link_models = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_based_on_difficulty_equidistributed_by_skill( #pylint: disable=line-too-long
                total_question_count, skill_ids,
                feconf.MEDIUM_SKILL_DIFFICULTY))
    else:
        question_skill_link_models = (
            question_models.QuestionSkillLinkModel.get_question_skill_links_equidistributed_by_skill( #pylint: disable=line-too-long
                total_question_count, skill_ids))

    question_ids = [model.question_id for model in question_skill_link_models]
    questions = question_fetchers.get_questions_by_ids(question_ids)
    return questions


def get_new_question_id():
    """Returns a new question id.

    Returns:
        str. A new question id.
    """
    return question_models.QuestionModel.get_new_id('')


def add_question(committer_id, question):
    """Saves a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. Question to be saved.
    """
    commit_message = 'New question created'
    create_new_question(committer_id, question, commit_message)


def delete_question(
        committer_id, question_id, force_deletion=False):
    """Deletes the question with the given question_id.

    Args:
        committer_id: str. ID of the committer.
        question_id: str. ID of the question.
        force_deletion: bool. If true, the question and its history are fully
            deleted and are unrecoverable. Otherwise, the question and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.
    """
    question_model = question_models.QuestionModel.get(question_id)
    question_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_QUESTION_DELETED,
        force_deletion=force_deletion)
    question_rights_model = question_models.QuestionRightsModel.get(
        question_id)
    question_rights_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_QUESTION_DELETED,
        force_deletion=force_deletion)

    question_models.QuestionSummaryModel.get(question_id).delete()
    opportunity_services.increment_question_counts(
        question_model.linked_skill_ids, -1)


def get_question_skill_link_from_model(
        question_skill_link_model, skill_description):
    """Returns domain object representing the given question skill link model.

    Args:
        question_skill_link_model: QuestionSkillLinkModel. The question skill
            link model loaded from the datastore.
        skill_description: str. The description of skill linked to question.

    Returns:
        QuestionSkillLink. The domain object representing the question skill
            link model.
    """

    return question_domain.QuestionSkillLink(
        question_skill_link_model.question_id,
        question_skill_link_model.skill_id, skill_description,
        question_skill_link_model.skill_difficulty)


def get_question_by_id(question_id, strict=True):
    """Returns a domain object representing a question.

    Args:
        question_id: str. ID of the question.
        strict: bool. Whether to fail noisily if no question with the given
            id exists in the datastore.

    Returns:
        Question or None. The domain object representing a question with the
        given id, or None if it does not exist.
    """
    question_model = question_models.QuestionModel.get(
        question_id, strict=strict)
    if question_model:
        question = question_fetchers.get_question_from_model(question_model)
        return question
    else:
        return None


def get_question_skill_links_of_skill(skill_id, skill_description):
    """Returns a list of QuestionSkillLinks of
    a particular skill ID.

    Args:
        skill_id: str. ID of the skill.
        skill_description: str. Description of the skill.

    Returns:
        list(QuestionSkillLink). The list of question skill link
        domain objects that are linked to the skill ID or an empty list
        if the skill does not exist.
    """

    question_skill_links = [
        get_question_skill_link_from_model(
            model, skill_description) for model in
        question_models.QuestionSkillLinkModel.get_models_by_skill_id(
            skill_id)]
    return question_skill_links


def get_skills_linked_to_question(question_id):
    """Returns a list of skills linked to a particular question.

    Args:
        question_id: str. ID of the question.

    Returns:
        list(Skill). The list of skills that are linked to the question.
    """
    question = get_question_by_id(question_id)
    skills = skill_services.get_multi_skills(question.linked_skill_ids)
    return skills


def replace_skill_id_for_all_questions(
        curr_skill_id, curr_skill_description, new_skill_id):
    """Updates the skill ID of QuestionSkillLinkModels to the superseding
    skill ID.

    Args:
        curr_skill_id: str. ID of the current skill.
        curr_skill_description: str. Description of the current skill.
        new_skill_id: str. ID of the superseding skill.
    """
    old_question_skill_link_models = (
        question_models.QuestionSkillLinkModel.get_models_by_skill_id(
            curr_skill_id))
    old_question_skill_links = get_question_skill_links_of_skill(
        curr_skill_id, curr_skill_description)
    new_question_skill_link_models = []
    question_ids = set()
    for question_skill_link in old_question_skill_links:
        question_ids.add(question_skill_link.question_id)
        new_question_skill_link_models.append(
            question_models.QuestionSkillLinkModel.create(
                question_skill_link.question_id, new_skill_id,
                question_skill_link.skill_difficulty)
            )
    question_models.QuestionSkillLinkModel.delete_multi_question_skill_links(
        old_question_skill_link_models)
    question_models.QuestionSkillLinkModel.put_multi_question_skill_links(
        new_question_skill_link_models)

    old_questions = question_models.QuestionModel.get_multi(list(question_ids))
    new_questions = []
    for question in old_questions:
        new_question = copy.deepcopy(question)
        new_question.linked_skill_ids.remove(curr_skill_id)
        new_question.linked_skill_ids.append(new_skill_id)
        new_questions.append(new_question)
    question_models.QuestionModel.put_multi_questions(new_questions)


def get_displayable_question_skill_link_details(
        question_count, skill_ids, start_cursor):
    """Returns the list of question summaries and corresponding skill
    descriptions linked to all the skills given by skill_ids.

    Args:
        question_count: int. The number of questions to fetch.
        skill_ids: list(str). The ids of skills for which the linked questions
            are to be retrieved.
        start_cursor: str. The starting point from which the batch of
            questions are to be returned. This value should be urlsafe.

    Raises:
        Exception. Querying linked question summaries for more than 3 skills at
        a time is not supported currently.

    Returns:
        list(QuestionSummary), list(MergedQuestionSkillLink), str|None.
            The list of questions linked to the given skill ids, the list of
            MergedQuestionSkillLink objects, keyed by question ID and the next
            cursor value to be used for the next batch of questions (or None if
            no more pages are left). The returned next cursor value is urlsafe.
    """
    if len(skill_ids) == 0:
        return [], [], None

    if len(skill_ids) > 3:
        raise Exception(
            'Querying linked question summaries for more than 3 skills at a '
            'time is not supported currently.')
    question_skill_link_models, next_cursor = (
        question_models.QuestionSkillLinkModel.get_question_skill_links_by_skill_ids( #pylint: disable=line-too-long
            question_count, skill_ids, start_cursor))

    # Deduplicate question_ids and group skill_descriptions that are linked to
    # the same question.
    question_ids = []
    grouped_skill_ids = []
    grouped_difficulties = []
    for question_skill_link in question_skill_link_models:
        if question_skill_link.question_id not in question_ids:
            question_ids.append(question_skill_link.question_id)
            grouped_skill_ids.append([question_skill_link.skill_id])
            grouped_difficulties.append([question_skill_link.skill_difficulty])
        else:
            grouped_skill_ids[-1].append(question_skill_link.skill_id)
            grouped_difficulties[-1].append(
                question_skill_link.skill_difficulty)

    merged_question_skill_links = []
    for ind, skill_ids_list in enumerate(grouped_skill_ids):
        skills = skill_models.SkillModel.get_multi(skill_ids_list)
        merged_question_skill_links.append(
            question_domain.MergedQuestionSkillLink(
                question_ids[ind], skill_ids_list,
                [skill.description if skill else None for skill in skills],
                grouped_difficulties[ind]))

    question_summaries = get_question_summaries_by_ids(question_ids)
    return (
        question_summaries, merged_question_skill_links, next_cursor)


def get_question_summaries_by_ids(question_ids):
    """Returns a list of domain objects representing question summaries.

    Args:
        question_ids: list(str). List of question ids.

    Returns:
        list(QuestionSummary|None). A list of domain objects representing
        question summaries with the given ids or None when the id is not valid.
    """
    question_summary_model_list = (
        question_models.QuestionSummaryModel.get_multi(question_ids))
    question_summaries = []
    for question_summary_model in question_summary_model_list:
        if question_summary_model is not None:
            question_summaries.append(
                get_question_summary_from_model(question_summary_model))
        else:
            question_summaries.append(None)
    return question_summaries


def apply_change_list(question_id, change_list):
    """Applies a changelist to a pristine question and returns the result.

    Args:
        question_id: str. ID of the given question.
        change_list: list(QuestionChange). A change list to be applied to the
            given question. Each entry in change_list is a QuestionChange
            object.

    Returns:
      Question. The resulting question domain object.
    """
    question = get_question_by_id(question_id)
    try:
        for change in change_list:
            if change.cmd == question_domain.CMD_UPDATE_QUESTION_PROPERTY:
                if (change.property_name ==
                        question_domain.QUESTION_PROPERTY_LANGUAGE_CODE):
                    question.update_language_code(change.new_value)
                elif (change.property_name ==
                      question_domain.QUESTION_PROPERTY_QUESTION_STATE_DATA):
                    state_domain_object = state_domain.State.from_dict(
                        change.new_value)
                    question.update_question_state_data(state_domain_object)
                elif (change.property_name ==
                      question_domain.QUESTION_PROPERTY_LINKED_SKILL_IDS):
                    question.update_linked_skill_ids(change.new_value)

        return question

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, question_id, change_list)
        )
        raise


def _save_question(committer_id, question, change_list, commit_message):
    """Validates a question and commits it to persistent storage.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        question: Question. The domain object representing a question.
        change_list: list(QuestionChange). A list of QuestionChange objects.
            These changes are applied in sequence to produce the resulting
            question.
        commit_message: str or None. A description of changes made to the
            question.

    Raises:
        Exception: Received an invalid change list.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save question %s: %s' % (question.id, change_list))

    question.validate()
    question_model = question_models.QuestionModel.get(question.id)
    question_model.question_state_data = question.question_state_data.to_dict()
    question_model.language_code = question.language_code
    question_model.question_state_data_schema_version = (
        question.question_state_data_schema_version)
    question_model.linked_skill_ids = question.linked_skill_ids
    change_dicts = [change.to_dict() for change in change_list]
    question_model.commit(committer_id, commit_message, change_dicts)
    question.version += 1


def update_question(
        committer_id, question_id, change_list, commit_message):
    """Updates a question. Commits changes.

    Args:
        committer_id: str. The ID of the user who is performing the update
            action.
        question_id: str. The question ID.
        change_list: list(QuestionChange). A list of QuestionChange objects.
            These changes are applied in sequence to produce the resulting
            question.
        commit_message: str or None. A description of changes made to the
            question.

    Raises:
        ValueError: No commit message was provided.
    """
    if not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')
    updated_question = apply_change_list(question_id, change_list)
    _save_question(
        committer_id, updated_question, change_list, commit_message)
    create_question_summary(question_id, committer_id)


def create_question_summary(question_id, creator_id):
    """Creates and stores a summary of the given question.

    Args:
        question_id: str. ID of the question.
        creator_id: str. The user ID of the creator of the question.
    """
    question = get_question_by_id(question_id)
    question_summary = compute_summary_of_question(question, creator_id)
    save_question_summary(question_summary)


def compute_summary_of_question(question, creator_id):
    """Create a QuestionSummary domain object for a given Question domain
    object and return it.

    Args:
        question: Question. The question object for which the summary
            is to be computed.
        creator_id: str. The user ID of the creator of the question.

    Returns:
        QuestionSummary. The computed summary for the given question.
    """
    question_content = question.question_state_data.content.html
    question_summary = question_domain.QuestionSummary(
        creator_id, question.id, question_content,
        question.created_on, question.last_updated)
    return question_summary


def save_question_summary(question_summary):
    """Save a question summary domain object as a QuestionSummaryModel
    entity in the datastore.

    Args:
        question_summary: The question summary object to be saved in the
            datastore.
    """
    question_summary_model = question_models.QuestionSummaryModel(
        id=question_summary.id,
        creator_id=question_summary.creator_id,
        question_model_last_updated=question_summary.last_updated,
        question_model_created_on=question_summary.created_on,
        question_content=question_summary.question_content
    )

    question_summary_model.put()


def get_question_summary_from_model(question_summary_model):
    """Returns a domain object for an Oppia question summary given a
    question summary model.

    Args:
        question_summary_model: QuestionSummaryModel.

    Returns:
        QuestionSummary.
    """
    return question_domain.QuestionSummary(
        question_summary_model.creator_id,
        question_summary_model.id,
        question_summary_model.question_content,
        question_summary_model.question_model_created_on,
        question_summary_model.question_model_last_updated
    )


def get_question_summaries_by_creator_id(creator_id):
    """Gets question summaries of questions created by the user.

    Args:
        creator_id: str. The user ID of the creator.

    Returns:
        QuestionSummaryModel. The QuestionSummaryModel for the given question.
    """
    question_summary_models = (
        question_models.QuestionSummaryModel.get_by_creator_id(creator_id))

    question_summaries = [
        get_question_summary_from_model(question_summary_model)
        for question_summary_model in question_summary_models
    ]

    return question_summaries


def get_question_rights_from_model(question_rights_model):
    """Constructs a QuestionRights object from the given question rights model.

    Args:
        question_rights_model: QuestionRightsModel. Question rights from the
            datastore.

    Returns:
        QuestionRights. The rights object created from the model.
    """

    return question_domain.QuestionRights(
        question_rights_model.id,
        question_rights_model.creator_id
    )


def create_new_question_rights(question_id, committer_id):
    """Creates a new question rights object and saves it to the datastore.

    Args:
        question_id: str. ID of the question.
        committer_id: str. ID of the committer.
    """
    question_rights = question_domain.QuestionRights(
        question_id, committer_id)
    commit_cmds = [{'cmd': question_domain.CMD_CREATE_NEW}]

    question_models.QuestionRightsModel(
        id=question_rights.id,
        creator_id=question_rights.creator_id
    ).commit(committer_id, 'Created new question rights', commit_cmds)


def get_question_rights(question_id, strict=True):
    """Retrieves the rights object for the given question.

    Args:
        question_id: str. ID of the question.
        strict: bool. Whether to fail noisily if no question rights with a
            given id exists in the datastore.

    Returns:
        QuestionRights. The rights object associated with the given question.

    Raises:
        EntityNotFoundError.The question rights for question with ID
            question_id was not found in the datastore.
    """

    model = question_models.QuestionRightsModel.get(
        question_id, strict=strict)

    if model is None:
        return None

    return get_question_rights_from_model(model)


def get_interaction_id_for_question(question_id):
    """Returns the interaction id for the given question.

    Args:
        question_id: str. ID of the question.

    Returns:
        str. The ID of the interaction of the question.

    Raises:
        Exception. The question does not exists of the ID question_id.
    """
    question = get_question_by_id(question_id, strict=False)
    if question is None:
        raise Exception('No questions exists with the given question id.')
    return question.question_state_data.interaction.id
