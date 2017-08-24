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

from core.platform import models

import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])

# This takes additional 'title' parameters.
CMD_CREATE_NEW = 'create_new'

def _create_question(committer_id, question, commit_message, commit_cmds):
    """Creates a new question.

    Args:
        committer_id: str. ID of the committer.
        question: Question. question domain object.
        commit_message: str. A description of changes made to the question.
        commit_cmds: list(dict). A list of change commands made to the given
            question.
    """
    model_id = question_models.QuestionModel.create(title=question.title,
        question_data=question.question_data,
        data_schema_version=question.data_schema_version,
        collection_id=question.collection_id,
        language_code=question.language_code)

#    model.commit(committer_id, commit_message, commit_cmds)
    return model_id


def add_question(committer_id, question):
    """Saves a new question.
    Args:
        committer_id: str. ID of the committer.
        question: Question. QUuestion to be saved.
    """
    commit_message = (
        'New question created with title \'%s\'.' % question.title)
    question_id = _create_question(committer_id, question, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': question.title,
    }])

    return question_id

def delete_question(committer_id, question_id, force_deletion=False):
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
