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

import collections
import logging
import random

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import question_domain
from core.platform import models
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])

# This takes additional 'title' parameters.
CMD_CREATE_NEW = 'create_new'


def _create_new_question(committer_id, question, commit_message):
    """Creates a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. question domain object.
        commit_message: str. A description of changes made to the question.
    """
    model = question_models.QuestionModel.create(
        title=question.title,
        question_data=question.question_data,
        question_data_schema_version=question.question_data_schema_version,
        collection_id=question.collection_id,
        language_code=question.language_code,
    )

    model.commit(committer_id, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': question.title
    }])
    return model.id


def add_question(committer_id, question):
    """Saves a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. Question to be saved.
    """
    question.validate()
    commit_message = (
        'New question created with title \'%s\'.' % question.title)
    question_id = _create_new_question(committer_id, question, commit_message)

    return question_id


def delete_question(
        committer_id, collection_id, question_id, force_deletion=False):
    """Deletes the question with the given question_id.

    Args:
        committer_id: str. ID of the committer.
        collection_id: str. ID of the collection.
        question_id: str. ID of the question.
        force_deletion: bool. If true, the question and its history are fully
            deleted and are unrecoverable. Otherwise, the question and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.

    Raises:
        Exception. The question with ID is not present in the given collection.
    """
    question = get_question_by_id(question_id)
    if collection_id != question.collection_id:
        raise Exception(
            'The question with ID %s is not present'
            ' in the given collection' % question_id)
    collection = collection_services.get_collection_by_id(collection_id)
    for skill in collection.skills.values():
        if question_id in skill.question_ids:
            remove_question_id_from_skill(
                question_id, collection_id, skill.id, committer_id)
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
        question_model.id, question_model.title, question_model.question_data,
        question_model.question_data_schema_version,
        question_model.collection_id, question_model.language_code)


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
                        question_domain.QUESTION_PROPERTY_TITLE):
                    question.update_title(change.new_value)
                elif (change.property_name ==
                      question_domain.QUESTION_PROPERTY_LANGUAGE_CODE):
                    question.update_language_code(change.new_value)
                elif (change.cmd ==
                      question_domain.QUESTION_PROPERTY_QUESTION_DATA):
                    question.update_question_data(change.new_value)
                elif (change.cmd ==
                      question_domain.QUESTION_PROPERTY_ADD_SKILL):
                    add_question_id_to_skill(
                        question.id, question.collection_id, change.skill_id,
                        change.user_id)
                elif (change.cmd ==
                      question_domain.QUESTION_PROPERTY_DELETE_SKILL):
                    remove_question_id_from_skill(
                        question.id, question.collection_id, change.skill_id,
                        change.user_id)

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
    question_model.title = question.title
    question_model.question_data = question.question_data
    question_model.question_data_schema_version = (
        question.question_data_schema_version)
    question_model.collection_id = question.collection_id
    question_model.language_code = question.language_code
    change_list_dict = [change.to_dict() for change in change_list]
    question_model.commit(committer_id, commit_message, change_list_dict)


def update_question(
        committer_id, collection_id, question_id, change_list, commit_message):
    """Updates a question. Commits changes.

    Args:
        committer_id: str. The ID of the user who is performing the update
            action.
        collection_id: str. The ID of the collection.
        question_id: str. The question ID.
        change_list: list(QuestionChange). A list of QuestionChange objects.
            These changes are applied in sequence to produce the resulting
            question.
        commit_message: str or None. A description of changes made to the
            question.

    Raises:
        Exception. The question with ID is not present in the given collection.
    """
    question = get_question_by_id(question_id)
    if collection_id != question.collection_id:
        raise Exception(
            'The question with ID %s is not present'
            ' in the given collection' % question_id)
    updated_question = apply_change_list(question_id, change_list)
    _save_question(
        committer_id, updated_question, change_list, commit_message)


def add_question_id_to_skill(question_id, collection_id, skill_id, user_id):
    """Adds the question id to the question list of the appropriate skill.

    Args:
        question_id: str. The id of the question.
        collection_id: str. The id of the collection.
        skill_id: str. The id of the skill.
        user_id: str. The id of the user.
    """
    collection_services.update_collection(
        user_id, collection_id, [{
            'cmd': collection_domain.CMD_ADD_QUESTION_ID_TO_SKILL,
            'skill_id': skill_id,
            'question_id': question_id
        }], 'Add a new question with ID %s to skill with ID %s'%(
            question_id, skill_id))


def remove_question_id_from_skill(
        question_id, collection_id, skill_id, user_id):
    """Removes the question id from the question list of the appropriate
    skill.

    Args:
        skill_id: str. The id of the skill.
        user_id: str. The id of the user.
    """
    collection_services.update_collection(
        user_id, collection_id, [{
            'cmd': collection_domain.CMD_REMOVE_QUESTION_ID_FROM_SKILL,
            'skill_id': skill_id,
            'question_id': question_id
        }], 'Remove a question with ID %s from skill with ID: %s'%(
            question_id, skill_id))


def get_questions_batch(
        collection_id, skill_ids, user_id, batch_size):
    """Fetches a batch of questions for a user based on the provided
    skill_ids, after filtering to only include skills that the user
    has already acquired.

    Args:
        collection_id: str. ID of the collection.
        skill_ids: list(str). A list of skill IDs for the questions to
            be retrieved.
        user_id: str. ID of the user.
        batch_size: int. The intended number of questions to be returned.

    Returns:
        list(Question). A list of Question objects.
    """
    user_skill_ids = (
        collection_services.get_acquired_skill_ids_of_user(
            user_id, collection_id))

    question_skill_ids = list(set(user_skill_ids) & set(skill_ids))
    collection = collection_services.get_collection_by_id(collection_id)
    question_ids = []

    for skill_id in question_skill_ids:
        if skill_id in collection.skills:
            question_ids.extend(collection.skills[skill_id].question_ids)
    unique_question_ids = list(set(question_ids))
    random_question_ids = random.sample(
        unique_question_ids, min(batch_size, len(unique_question_ids)))

    questions_batch = get_questions_by_ids(random_question_ids)
    return questions_batch


def get_question_summaries_for_collection(collection_id):
    """Gets a list of question summaries for a collection.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        list(QuestionSummary). A list of Question Summary objects.
    """
    collection = collection_services.get_collection_by_id(collection_id)
    questions_to_skill_names = collections.defaultdict(list)
    for skill in collection.skills.values():
        for question_id in skill.question_ids:
            questions_to_skill_names[question_id].append(skill.name)
    questions = get_questions_by_ids(questions_to_skill_names.keys())

    question_summaries = []
    for question in questions:
        question_summaries.append(
            question_domain.QuestionSummary(
                question.question_id, question.title, (
                    questions_to_skill_names[question.question_id])))
    return question_summaries
