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

"""Controllers for the skill editor."""

from __future__ import annotations

from core import android_validation_constants
from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.domain import topic_fetchers
from core.domain import user_domain
from core.domain import user_services

from typing import Dict, List, Optional, TypedDict


def _require_valid_version(
    version_from_payload: int, skill_version: int
) -> None:
    """Check that the payload version matches the given skill
    version.

    Args:
        version_from_payload: int. The version that the frontend instance of the
            skill represents.
        skill_version: int. The latest version of the skill currently persisted
            in the backend.

    Raises:
        Exception. The skill versions do not match.
    """
    if version_from_payload != skill_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of skill from version %s, '
            'which is too old. Please reload the page and try again.'
            % (skill_version, version_from_payload))


def check_can_edit_skill_description(user: user_domain.UserActionsInfo) -> bool:
    """Checks whether the user can edit skill descriptions.

    Args:
        user: UserActionsInfo. Object having user id, role and actions for
            given user.

    Returns:
        bool. Whether the given user can edit skill descriptions.
    """
    if role_services.ACTION_EDIT_SKILL_DESCRIPTION not in user.actions:
        return False
    else:
        return True


class SkillRightsHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A handler for returning skill rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'skill_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_edit_skill
    def get(self, skill_id: str) -> None:
        """Checks whether the user can edit the description of a skill.

        Args:
            skill_id: str. The skill ID.
        """
        skill_domain.Skill.require_valid_skill_id(skill_id)

        user_actions_info = user_services.get_user_actions_info(self.user_id)
        can_edit_skill_description = check_can_edit_skill_description(
            user_actions_info)

        self.values.update({
            'can_edit_skill_description': can_edit_skill_description,
            'skill_id': skill_id
        })

        self.render_json(self.values)


class EditableSkillDataHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of EditableSkillDataHandler's
    normalized_payload dictionary.
    """

    version: int
    commit_message: Optional[str]
    change_dicts: List[skill_domain.SkillChange]


class EditableSkillDataHandler(
    base.BaseHandler[
        EditableSkillDataHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """A data handler for skills which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'skill_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                }
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'change_dicts': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': skill_domain.SkillChange
                    }
                }
            }
        },
        'DELETE': {}
    }

    @acl_decorators.open_access
    def get(self, skill_id: str) -> None:
        """Populates the data on the individual skill page.

        Args:
            skill_id: str. The skill ID.

        Raises:
            Exception. The skill with the given id doesn't exist.
        """
        skill = skill_fetchers.get_skill_by_id(skill_id, strict=False)

        if skill is None:
            raise self.NotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        topics = topic_fetchers.get_all_topics()
        grouped_skill_summary_dicts = {}
        # It might be the case that the requested skill is not assigned to any
        # topic, or it might be assigned to a topic and not a subtopic, or
        # it can be assigned to multiple topics, so this dict represents
        # a key value pair where key is topic's name and value is subtopic
        # name which might be None indicating that the skill is assigned
        # to that topic but not to a subtopic.
        assigned_skill_topic_data_dict = {}

        for topic in topics:
            skill_ids_in_topic = topic.get_all_skill_ids()
            if skill_id in skill_ids_in_topic:
                subtopic_name = None
                for subtopic in topic.subtopics:
                    if skill_id in subtopic.skill_ids:
                        subtopic_name = subtopic.title
                        break
                assigned_skill_topic_data_dict[topic.name] = subtopic_name

            skill_summaries = skill_services.get_multi_skill_summaries(
                skill_ids_in_topic)
            skill_summary_dicts = [
                summary.to_dict() for summary in skill_summaries]
            grouped_skill_summary_dicts[topic.name] = skill_summary_dicts

        self.values.update({
            'skill': skill.to_dict(),
            'assigned_skill_topic_data_dict': assigned_skill_topic_data_dict,
            'grouped_skill_summaries': grouped_skill_summary_dicts
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_skill
    def put(self, skill_id: str) -> None:
        """Updates properties of the given skill.

        Args:
            skill_id: str. The skill ID.

        Raises:
            NotFoundException. The skill with the given id doesn't exist.
            InvalidInputException. Commit messages must be at most 375
                characters long.
            InvalidInputException. The input provided is not valid.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        skill = skill_fetchers.get_skill_by_id(skill_id, strict=False)
        if skill is None:
            raise self.NotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        version = self.normalized_payload['version']
        _require_valid_version(version, skill.version)

        commit_message = self.normalized_payload.get('commit_message')
        if (commit_message is not None and
                len(commit_message) > constants.MAX_COMMIT_MESSAGE_LENGTH):
            raise self.InvalidInputException(
                'Commit messages must be at most %s characters long.'
                % constants.MAX_COMMIT_MESSAGE_LENGTH)

        change_list = self.normalized_payload['change_dicts']
        try:
            skill_services.update_skill(
                self.user_id, skill_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        skill_dict = skill_fetchers.get_skill_by_id(skill_id).to_dict()

        self.values.update({
            'skill': skill_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_skill
    def delete(self, skill_id: str) -> None:
        """Deletes a skill.

        Args:
            skill_id: str. The skill ID.

        Raises:
            InvalidInputException. The skill still has associated questions.
        """
        assert self.user_id is not None

        if skill_services.skill_has_associated_questions(skill_id):
            raise self.InvalidInputException(
                'Please delete all questions associated with this skill '
                'first.')

        skill_services.remove_skill_from_all_topics(self.user_id, skill_id)
        skill_services.delete_skill(self.user_id, skill_id)

        self.render_json(self.values)


class SkillDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A handler for accessing skills data."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    # TODO(#16538): Change the type of `comma_separated_skill_ids` url_path
    # argument to `JsonEncodedInString`.
    URL_PATH_ARGS_SCHEMAS = {
        'comma_separated_skill_ids': {
            'schema': {
                'type': 'object_dict',
                'validation_method': domain_objects_validator.validate_skill_ids
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, comma_separated_skill_ids: str) -> None:
        """Populates the data on skill pages of the skill ids.

        Args:
            comma_separated_skill_ids: str. Comma separated skill IDs.

        Raises:
            Exception. The skill with the given id doesn't exist.
        """
        skill_ids = comma_separated_skill_ids.split(',')

        try:
            skills = skill_fetchers.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.NotFoundException(e)

        skill_dicts = [skill.to_dict() for skill in skills]
        self.values.update({
            'skills': skill_dicts
        })

        self.render_json(self.values)


class FetchSkillsHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A handler for accessing all skills data."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Returns all skill IDs linked to some topic."""

        skill_ids = topic_fetchers.get_all_skill_ids_assigned_to_some_topic()

        skills = skill_fetchers.get_multi_skills(list(skill_ids), strict=False)

        skill_dicts = [skill.to_dict() for skill in skills]
        self.values.update({
            'skills': skill_dicts
        })

        self.render_json(self.values)


class SkillDescriptionHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A data handler for checking if a skill with given description exists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'skill_description': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': android_validation_constants.MAX_CHARS_IN_SKILL_DESCRIPTION  # pylint: disable=line-too-long
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_create_skill
    def get(self, skill_description: str) -> None:
        """Handler that receives a skill description and checks whether
        a skill with the same description exists.

        Args:
            skill_description: str. Skill description.
        """
        self.values.update({
            'skill_description_exists': (
                skill_services.does_skill_with_description_exist(
                    skill_description))
        })
        self.render_json(self.values)


class DiagnosticTestSkillAssignmentHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A handler that returns a list of topic names for which the given skill
    is assigned to that topic's diagnostic test.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'skill_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_edit_skill
    def get(self, skill_id: str) -> None:
        """Returns a list of topic names for which the given skill is assigned
        to that topic's diagnostic test.

        Args:
            skill_id: str. The skill ID.
        """
        self.values.update({
            'topic_names': (
                skill_services
                .get_topic_names_with_given_skill_in_diagnostic_test(skill_id))
        })
        self.render_json(self.values)
