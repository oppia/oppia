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

"""Controllers for the questions editor, from where questions are edited
and are created.
"""

from __future__ import annotations
import json
import logging

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import fs_services
from core.domain import image_validation_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_fetchers

from typing import Dict, List, TypedDict

SCHEMA_FOR_QUESTION_ID = {
    'type': 'basestring',
    'validators': [{
        'id': 'is_regex_matched',
        'regex_pattern': constants.ENTITY_ID_REGEX
    }]
}


class QuestionCreationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A handler that creates the question model given a question dict."""

    @acl_decorators.can_manage_question_skill_status
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        skill_ids = self.payload.get('skill_ids')

        if not skill_ids:
            raise self.InvalidInputException(
                'skill_ids parameter isn\'t present in the payload')

        if len(skill_ids) > constants.MAX_SKILLS_PER_QUESTION:
            raise self.InvalidInputException(
                'More than %d QuestionSkillLinks for one question '
                'is not supported.' % constants.MAX_SKILLS_PER_QUESTION)
        try:
            for skill_id in skill_ids:
                skill_domain.Skill.require_valid_skill_id(skill_id)
        except Exception as e:
            raise self.InvalidInputException('Skill ID(s) aren\'t valid: ', e)

        try:
            skill_fetchers.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.NotFoundException(e)

        question_dict = self.payload.get('question_dict')
        if (
                (question_dict['id'] is not None) or
                ('question_state_data' not in question_dict) or
                ('language_code' not in question_dict) or
                (question_dict['version'] != 0)):
            raise self.InvalidInputException(
                'Question Data should contain id, state data, language code, '
                'and its version should be set as 0')

        question_dict['question_state_data_schema_version'] = (
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        question_dict['id'] = question_services.get_new_question_id()
        question_dict['linked_skill_ids'] = skill_ids

        try:
            question = question_domain.Question.from_dict(question_dict)
        except Exception as e:
            raise self.InvalidInputException(
                'Question structure is invalid:', e)

        skill_difficulties = self.payload.get('skill_difficulties')

        if not skill_difficulties:
            raise self.InvalidInputException(
                'skill_difficulties not present in the payload')
        if len(skill_ids) != len(skill_difficulties):
            raise self.InvalidInputException(
                'Skill difficulties don\'t match up with skill IDs')

        try:
            skill_difficulties = [
                float(difficulty) for difficulty in skill_difficulties]
        except (ValueError, TypeError) as e:
            raise self.InvalidInputException(
                'Skill difficulties must be a float value') from e
        if any((
                difficulty < 0 or difficulty > 1)
               for difficulty in skill_difficulties):
            raise self.InvalidInputException(
                'Skill difficulties must be between 0 and 1')

        question_services.add_question(self.user_id, question)
        question_services.link_multiple_skills_for_question(
            self.user_id,
            question.id,
            skill_ids,
            skill_difficulties)
        image_validation_error_message_suffix = (
            'Please go to the question editor for question with id %s and edit '
            'the image.' % question.id)

        filenames = self.payload.get('filenames')

        if filenames:
            filenames_list = json.loads(filenames)
            for filename in filenames_list:
                index = filenames_list.index(filename)
                image = self.request.get(f'image{index}')
                if not image:
                    logging.exception(
                        'Image not provided for file with'
                        ' name %s when the question'
                        ' with id %s was created.' % (filename, question.id))
                    raise self.InvalidInputException(
                        'No image data provided for file with name %s. %s'
                        % (filename, image_validation_error_message_suffix))
                try:
                    file_format = (
                        image_validation_services.validate_image_and_filename(
                            image, filename))
                except utils.ValidationError as e:
                    raise self.InvalidInputException(
                        '%s %s' % (e, image_validation_error_message_suffix)
                    )
                image_is_compressible = (
                    file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
                fs_services.save_original_and_compressed_versions_of_image(
                    filename, feconf.ENTITY_TYPE_QUESTION, question.id, image,
                    'image', image_is_compressible)

        self.values.update({
            'question_id': question.id
        })
        self.render_json(self.values)


class SkillIdTaskDict(TypedDict):
    """Type for the dict representation of tasks which is associated
    with a particular skill id.
    """

    id: str
    task: str
    difficulty: float


class QuestionSkillLinkHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of QuestionSkillLinkHandler's
    normalized_payload dictionary.
    """

    skill_ids_task_list: List[SkillIdTaskDict]


class QuestionSkillLinkHandler(
    base.BaseHandler[
        QuestionSkillLinkHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """A handler for linking and unlinking questions to or from a skill."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'question_id': {
            'schema': SCHEMA_FOR_QUESTION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'skill_ids_task_list': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'dict',
                        'properties': [{
                            'name': 'id',
                            'schema': {
                                'type': 'basestring',
                                'validators': [{
                                    'id': 'is_regex_matched',
                                    'regex_pattern': constants.ENTITY_ID_REGEX
                                }]
                            }
                        }, {
                            'name': 'task',
                            'schema': {
                                'type': 'unicode',
                                'choices': [
                                    'remove', 'add', 'update_difficulty'
                                ]
                            }
                        }, {
                            'name': 'difficulty',
                            'schema': {
                                'type': 'float',
                                'validators': [{
                                    'id': 'is_at_least',
                                    'min_value': 0
                                }, {
                                    'id': 'is_at_most',
                                    'max_value': 1
                                }]
                            }
                        }]
                    }
                }
            }
        }
    }

    @acl_decorators.can_manage_question_skill_status
    def put(self, question_id: str) -> None:
        """Updates the QuestionSkillLink models with respect to the given
        question.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        skill_ids_task_list = self.normalized_payload['skill_ids_task_list']

        for task_dict in skill_ids_task_list:
            if task_dict['task'] == 'remove':
                question_services.delete_question_skill_link(
                    self.user_id, question_id, task_dict['id'])
            elif task_dict['task'] == 'add':
                question_services.create_new_question_skill_link(
                    self.user_id, question_id, task_dict['id'],
                    task_dict['difficulty'])
            else:
                assert task_dict['task'] == 'update_difficulty'
                question_services.update_question_skill_link_difficulty(
                    question_id, task_dict['id'],
                    task_dict['difficulty']
                )

        self.render_json(self.values)


class EditableQuestionDataHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of EditableQuestionDataHandler's
    normalized_payload dictionary.
    """

    version: int
    commit_message: str
    change_list: List[question_domain.QuestionChange]


class EditableQuestionDataHandler(
    base.BaseHandler[
        EditableQuestionDataHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """A data handler for questions which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'question_id': {
            'schema': SCHEMA_FOR_QUESTION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'version': {
                'schema': {
                    'type': 'int'
                }
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_COMMIT_MESSAGE_LENGTH
                    }]
                }
            },
            'change_list': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': question_domain.QuestionChange
                    }
                }
            }
        },
        'DELETE': {}
    }

    @acl_decorators.can_view_question_editor
    def get(self, question_id: str) -> None:
        """Gets the data for the question overview page."""
        assert self.user_id is not None
        question = question_services.get_question_by_id(
            question_id, strict=True)

        associated_skill_dicts = [
            skill.to_dict() for skill in skill_fetchers.get_multi_skills(
                question.linked_skill_ids)]

        self.values.update({
            'question_dict': question.to_dict(),
            'associated_skill_dicts': associated_skill_dicts
        })
        self.render_json(self.values)

    @acl_decorators.can_edit_question
    def put(self, question_id: str) -> None:
        """Updates properties of the given question."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        commit_message = self.normalized_payload['commit_message']
        change_list = self.normalized_payload['change_list']
        version = self.normalized_payload['version']
        for change in change_list:
            if (
                    change.cmd ==
                    question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION):
                raise self.InvalidInputException(
                    'Cannot create a new fully specified question'
                )

        question_services.update_question(
            self.user_id, question_id, change_list,
            commit_message, version)

        question_dict = question_services.get_question_by_id(
            question_id).to_dict()
        self.render_json({
            'question_dict': question_dict
        })

    @acl_decorators.can_delete_question
    def delete(self, question_id: str) -> None:
        """Handles Delete requests."""
        assert self.user_id is not None
        question = question_services.get_question_by_id(
            question_id, strict=False)
        if question is None:
            raise self.NotFoundException(
                'The question with the given id doesn\'t exist.')
        question_services.delete_question(self.user_id, question_id)
        self.render_json(self.values)
