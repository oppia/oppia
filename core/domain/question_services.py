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
from core.platform import models
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])

CMD_CREATE_NEW = 'create_new'


def _create_new_question(committer_id, question, commit_message):
    """Creates a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. question domain object.
        commit_message: str. A description of changes made to the question.

    Returns:
        str. The ID of the model.
    """
    model = question_models.QuestionModel.create(
        question_data=question.question_data,
        question_data_schema_version=question.question_data_schema_version,
        language_code=question.language_code,
    )

    model.commit(committer_id, commit_message, [{'cmd': CMD_CREATE_NEW}])
    return model.id


def add_question(committer_id, question):
    """Saves a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. Question to be saved.

    Returns:
        str. The ID of the question.
    """
    question.validate()
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
        question_model.language_code)


def get_question_by_id(question_id):
    """Returns a domain object representing a question.

    Args:
        question_id: str. ID of the question.

    Returns:
        Question or None. The domain object representing a question with the
        given id, or None if it does not exist.
    """
    question_model = question_models.QuestionModel.get(question_id)
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
