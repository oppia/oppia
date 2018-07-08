# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

from core.domain import question_domain
from core.domain import user_services
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

    Returns:
        str. The ID of the model.
    """
    question.validate()
    model = question_models.QuestionModel(
        id=question.question_id,
        question_data=question.question_data,
        question_data_schema_version=question.question_data_schema_version,
        language_code=question.language_code,
        status=question.status
    )

    model.commit(
        committer_id, commit_message, [{'cmd': question_domain.CMD_CREATE_NEW}])

    create_question_summary(model.id, committer_id)
    return model.id


def add_question(committer_id, question):
    """Saves a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. Question to be saved.

    Returns:
        str. The ID of the question.
    """
    commit_message = 'New question created'
    question_id = _create_new_question(committer_id, question, commit_message)

    return question_id


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
        question_model.id, question_model.question_data,
        question_model.question_data_schema_version,
        question_model.language_code, question_model.status)


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
        questions.append(get_question_from_model(question_model))
    return questions


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
                      question_domain.QUESTION_PROPERTY_QUESTION_DATA):
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
            'save question %s: %s' % (question.question_id, change_list))

    question.validate()

    question_model = question_models.QuestionModel.get(question.question_id)
    question_model.question_data = question.question_data
    question_model.question_data_schema_version = (
        question.question_data_schema_version)
    question_model.language_code = question.language_code
    question_model.status = question.status
    change_list_dict = [change.to_dict() for change in change_list]
    question_model.commit(committer_id, commit_message, change_list_dict)


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
    """
    updated_question = apply_change_list(question_id, change_list)
    _save_question(
        committer_id, updated_question, change_list, commit_message)


def get_new_question_id():
    """Returns a new question id.

    Returns:
        str. A new question id.
    """
    return question_models.QuestionModel.get_new_id('')


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
    question_html_data = question.question_data['content']['html']
    question_summary = question_domain.QuestionSummary(
        question.question_id, creator_id, question_html_data)

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
        question_html_data=question_summary.question_html_data
    )

    question_summary_model.put()


def get_question_summaries_by_creator_id(creator_id):
    """Gets question summaries of questions created by the user.

    Args:
        creator_id: str. The user ID of the creator.

    Returns:
        QuestionSummaryModel. The QuestionSummaryModel for the given question.
    """
    return question_models.QuestionSummaryModel.get_by_creator_id(creator_id)


def get_question_summary_by_question_id(question_id, strict=False):
    """Gets question summaries of questions created by the user.

    Args:
        question_id: str. The user ID of the question.
        strict: bool. Whether to fail noisily if no question summary for the
            given question id exists in the datastore.

    Returns:
        QuestionSummaryModel. The QuestionSummaryModel for the given question.
    """
    return question_models.QuestionSummaryModel.get(question_id, strict=strict)


def get_summaries_of_linked_skills(question_id):
    """Gets linked skill IDs for given question.

    Args:
        question_id: str. The question ID for the given question.

    Returns:
        QuestionSkillLinkModel|None. The QuestionSkillModel for the given
            question or None if there exists no skill linked for question.
    """
    linked_skill_summaries = []
    question_skill_links = question_models.QuestionSkillLinkModel.get(
        question_id, strict=False)

    if question_skill_links is None:
        return None
    for question_skill_link in question_skill_links:
        linked_skill_summaries = (
            skill_models.SkillSummaryModel.get(
                question_skill_link.skill_id, strict=False))

    return linked_skill_summaries


def check_can_edit_question(user_id, question_id):
    """Checks if the user can edit the given question or not

    Args:
        user_id: str. The user ID of the user.
        question_id: str. The question ID of the question.

    Returns:
        bool. Represents if the user can edit the question or not.
    """
    question_summary = get_question_summary_by_question_id(
        question_id, strict=False)
    question = get_question_by_id(question_id, strict=False)

    if question_summary.creator_id == user_id:
        if (question.status == feconf.ACTIVITY_STATUS_PRIVATE or
                question.status == feconf.QUESTION_STATUS_REJECTED):
            return True
        return False

    if (user_services.is_admin(user_id) or
            user_services.is_topic_manager(user_id)):
        if (question.status == feconf.QUESTION_STATUS_APPROVED or
                question.status == feconf.QUESTION_STATUS_PENDING):
            return True

    return False
