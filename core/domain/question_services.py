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

import logging

from core.domain import exp_domain
from core.domain import question_domain
from core.platform import models
import feconf

(question_models, skill_models) = models.Registry.import_models(
    [models.NAMES.question, models.NAMES.skill])


def _create_new_question(committer_id, question, commit_message):
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
        question_state_schema_version=question.question_state_schema_version
    )
    model.commit(
        committer_id, commit_message, [{'cmd': question_domain.CMD_CREATE_NEW}])
    question.version += 1
    create_question_summary(question.id, committer_id)


def create_new_question_skill_link(question_id, skill_id):
    """Creates a new QuestionSkillLink model.

    Args:
        question_id: str. ID of the question linked to the skill.
        skill_id: str. ID of the skill to which the question is linked.
    """
    model = question_models.QuestionSkillLinkModel(
        id=question_id + ':' + skill_id,
        question_id=question_id,
        skill_id=skill_id
    )
    model.put()


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
    _create_new_question(committer_id, question, commit_message)


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


def get_question_from_model(question_model):
    """Returns domain object repersenting the given question model.

    Args:
        question_model: QuestionModel. The question model loaded from the
            datastore.

    Returns:
        Question. The domain object representing the question model.
    """
    return question_domain.Question(
        question_model.id,
        exp_domain.State.from_dict(question_model.question_state_data),
        question_model.question_state_schema_version,
        question_model.language_code, question_model.version,
        question_model.created_on, question_model.last_updated)


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
        question = get_question_from_model(question_model)
        return question
    else:
        return None


def get_question_summaries_linked_to_skills(skill_ids):
    """Returns the list of question summaries linked to all the skills given by
    skill_ids.

    Args:
        skill_ids: list(str). The ids of skills for which the linked questions
            are to be retrieved.

    Returns:
        list(QuestionSummary). The list of question summaries linked to the
            given skill_ids.
    """
    skill_ids_check_dict = {}
    for skill_id in skill_ids:
        skill_ids_check_dict[skill_id] = True

    question_ids = []
    all_models = question_models.QuestionSkillLinkModel.get_all()
    for model in all_models:
        if skill_ids_check_dict[model.skill_id]:
            question_ids.append(model.question_id)

    question_summaries = get_question_summaries_by_ids(question_ids)
    return question_summaries


def get_questions_by_ids(question_ids):
    """Returns a list of domain objects representing questions.

    Args:
        question_ids: list(str). List of question ids.

    Returns:
        list(Question|None). A list of domain objects representing questions
        with the given ids or None when the id is not valid.
    """
    question_model_list = question_models.QuestionModel.get_multi(question_ids)
    questions = []
    for question_model in question_model_list:
        if question_model is not None:
            questions.append(get_question_from_model(question_model))
        else:
            questions.append(None)
    return questions

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
                elif (change.cmd ==
                      question_domain.QUESTION_PROPERTY_QUESTION_STATE_DATA):
                    question.update_question_data(change.new_value)

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
    question_model.question_state_schema_version = (
        question.question_state_schema_version)
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
    questioin summary model.

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

    for question_summary_model in question_summary_models:
        question_summaries = [
            get_question_summary_from_model(question_summary_model)]

    return question_summaries


def get_question_summary_by_question_id(question_id, strict=False):
    """Gets question summary of question by ID of the question.

    Args:
        question_id: str. The ID of the question.
        strict: bool. Whether to fail noisily if no question summary for the
            given question id exists in the datastore.

    Returns:
        QuestionSummaryModel. The QuestionSummaryModel for the given question.
    """
    return get_question_summary_from_model(
        question_models.QuestionSummaryModel.get(question_id, strict=strict))


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
