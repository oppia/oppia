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

"""Domain objects relating to questions."""

from constants import constants
from core.domain import exp_domain
from core.domain import html_cleaner
from core.platform import models
import feconf
import utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
QUESTION_PROPERTY_LANGUAGE_CODE = 'language_code'
QUESTION_PROPERTY_QUESTION_DATA = 'question_data'
QUESTION_PROPERTY_CONTENT = 'content'

ROLE_MANAGER = 'manager'
ROLE_NONE = 'none'
# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_QUESTION_PROPERTY = 'update_question_property'
CMD_EDIT_STATE_PROPERTY = 'edit_state_property'

OPTIONAL_CMD_ATTRIBUTE_NAMES = [
    'property_name', 'new_value', 'old_value', 'content', 'cmd'
]

# The following commands are deprecated, as these functionalities will be
# handled by a QuestionSkillLink class in the future.
CMD_ADD_QUESTION_SKILL = 'add_question_skill'
CMD_REMOVE_QUESTION_SKILL = 'remove_question_skill'

CMD_CHANGE_ROLE = 'change_role'
CMD_CREATE_NEW = 'create_new'

CMD_SEND_QUESTION_FOR_REVIEW = 'send_question_for_review'
CMD_REJECT_QUESTION = 'reject_question'
CMD_PUBLISH_QUESTION = 'publish_question'
CMD_UNPUBLISH_QUESTION = 'unpublish_question'

STATE_PROPERTY_PARAM_CHANGES = 'param_changes'
STATE_PROPERTY_CONTENT = 'content'
STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS = (
    'content_ids_to_audio_translations')
STATE_PROPERTY_INTERACTION_ID = 'widget_id'
STATE_PROPERTY_INTERACTION_CUST_ARGS = 'widget_customization_args'
STATE_PROPERTY_INTERACTION_ANSWER_GROUPS = 'answer_groups'
STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME = 'default_outcome'
STATE_PROPERTY_UNCLASSIFIED_ANSWERS = (
    'confirmed_unclassified_answers')
STATE_PROPERTY_INTERACTION_HINTS = 'hints'
STATE_PROPERTY_INTERACTION_SOLUTION = 'solution'
# These four properties are kept for legacy purposes and are not used anymore.
STATE_PROPERTY_INTERACTION_HANDLERS = 'widget_handlers'
STATE_PROPERTY_INTERACTION_STICKY = 'widget_sticky'
GADGET_PROPERTY_VISIBILITY = 'gadget_visibility'
GADGET_PROPERTY_CUST_ARGS = 'gadget_customization_args'


class QuestionChange(object):
    """Domain object for changes made to question object."""

    QUESTION_PROPERTIES = (
        QUESTION_PROPERTY_QUESTION_DATA,
        QUESTION_PROPERTY_LANGUAGE_CODE,
        QUESTION_PROPERTY_CONTENT,
        STATE_PROPERTY_PARAM_CHANGES,
        STATE_PROPERTY_CONTENT,
        STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS,
        STATE_PROPERTY_INTERACTION_ID,
        STATE_PROPERTY_INTERACTION_CUST_ARGS,
        STATE_PROPERTY_INTERACTION_STICKY,
        STATE_PROPERTY_INTERACTION_HANDLERS,
        STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
        STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
        STATE_PROPERTY_INTERACTION_HINTS,
        STATE_PROPERTY_INTERACTION_SOLUTION,
        STATE_PROPERTY_UNCLASSIFIED_ANSWERS)

    def __init__(self, change_dict):
        """Initialize a QuestionChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update question property' (with property_name, new_value
                and old_value)

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_UPDATE_QUESTION_PROPERTY:
            if (change_dict['property_name'] in
                    self.QUESTION_PROPERTIES):
                self.property_name = change_dict['property_name']
                self.new_value = change_dict['new_value']
                self.old_value = change_dict.get('old_value')
            else:
                raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing QuestionChange domain object.

        Returns:
            dict. A dict representing QuestionChange instance.
        """
        question_rights_change_dict = {}
        question_rights_change_dict['cmd'] = self.cmd
        for attribute_name in OPTIONAL_CMD_ATTRIBUTE_NAMES:
            if hasattr(self, attribute_name):
                question_rights_change_dict[attribute_name] = getattr(
                    self, attribute_name)

        return question_rights_change_dict


class Question(object):
    """Domain object for a question.

    Attributes:
        question_id: str. The unique ID of the question.
        question_data: dict. A dict representing the question data.
        question_data_schema_version: int. The schema version for the data.
        language_code: str. The ISO 639-1 code for the language this
            question is written in.
    """

    def __init__(
            self, question_id, question_data,
            question_data_schema_version, language_code):
        """Constructs a Question domain object.

        Args:
            question_id: str. The unique ID of the question.
            question_data: dict. A dict representing the question data.
            question_data_schema_version: int. The schema version for the data.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.question_id = question_id
        self.question_data = question_data
        self.question_data_schema_version = question_data_schema_version
        self.language_code = language_code

    def to_dict(self):
        """Returns a dict representing this Question domain object.

        Returns:
            dict. A dict representation of the Question instance.
        """
        return {
            'question_id': self.question_id,
            'question_data': self.question_data,
            'question_data_schema_version': self.question_data_schema_version,
            'language_code': self.language_code
        }

    def validate(self):
        """Validates the Question domain object before it is saved."""

        if not isinstance(self.question_id, basestring):
            raise utils.ValidationError(
                'Expected ID to be a string, received %s' % self.question_id)

        if not isinstance(self.question_data, dict):
            raise utils.ValidationError(
                'Expected question_data to be a dict, received %s' %
                self.question_data)

        question_data = exp_domain.State.from_dict(self.question_data)
        question_data.validate({}, True)

        if not isinstance(self.question_data_schema_version, int):
            raise utils.ValidationError(
                'Expected question_data_schema_version to be a integer,' +
                'received %s' % self.question_data_schema_version)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)

        if not any([self.language_code == lc['code']
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

    def validate_for_publishing_or_send_for_review(self):
        """Validates the Question domain object before it is published or send
        for review to admins and topic managers.
        """

        if not isinstance(self.question_id, basestring):
            raise utils.ValidationError(
                'Expected ID to be a string, received %s' % self.question_id)

        if not isinstance(self.question_data, dict):
            raise utils.ValidationError(
                'Expected question_data to be a dict, received %s' %
                self.question_data)

        dest_is_specified = False
        interaction = self.question_data['interaction']
        for answer_group in interaction['answer_groups']:
            if answer_group['labelled_as_correct']:
                at_least_one_correct_answer = True
            if answer_group['dest'] is not None:
                dest_is_specified = True

        if interaction['default_outcome']['labelled_as_correct']:
            at_least_one_correct_answer = True

        if interaction['default_outcome']['dest'] is not None:
            dest_is_specified = True

        if not at_least_one_correct_answer:
            raise utils.ValidationError(
                'Expected at least one answer group to have a correct answer.'
            )

        if dest_is_specified:
            raise utils.ValidationError(
                'Expected all answer groups to have destination as None.'
            )

        if (len(interaction['hints']) == 0) or (
                interaction['solution'] is None):
            raise utils.ValidationError(
                'Expected the question to have at least one hint and a ' +
                'solution.'
            )
        question_data = exp_domain.State.from_dict(self.question_data)
        question_data.validate({}, True)

        if not isinstance(self.question_data_schema_version, int):
            raise utils.ValidationError(
                'Expected question_data_schema_version to be a integer,' +
                'received %s' % self.question_data_schema_version)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)

        if not any([self.language_code == lc['code']
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

    @classmethod
    def from_dict(cls, question_dict):
        """Returns a Question domain object from dict.

        Returns:
            Question. The corresponding Question domain object.
        """
        question = cls(
            question_dict['question_id'],
            question_dict['question_data'],
            question_dict['question_data_schema_version'],
            question_dict['language_code'])

        return question

    @classmethod
    def create_default_question(cls, question_id):
        """Returns a Question domain object with default values.

        Args:
            question_id: str. The unique ID of the question.

        Returns:
            Question. A Question domain object with default values.
        """
        return cls(
            question_id, exp_domain.State.create_default_state(
                feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True
                ),
            feconf.CURRENT_QUESTION_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE)

    def update_language_code(self, language_code):
        """Updates the language code of the question.

        Args:
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.language_code = language_code

    def update_question_data(self, question_data):
        """Updates the question data of the question.

        Args:
            question_data: dict. A dict representing the question data.
        """
        self.question_data = question_data


class QuestionSummary(object):
    """Domain object for Question Summary.
    """
    def __init__(
            self, question_id, creator_id, language_code, status,
            question_html_data, question_model_last_updated=None,
            question_model_created_on=None):
        """Constructs a Question Summary domain object.

        Args:
            question_id: str. The ID of the question.
            creator_id: str. The user ID of the creator of the question.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
            status: str. The status of the question.
            question_model_last_updated: datetime.datetime. Date and time
                when the question model was last updated.
            question_model_created_on: datetime.datetime. Date and time when
                the question model is created.
            question_html_data: str. The static HTML of the question shown to
                the learner.
        """
        self.id = question_id
        self.creator_id = creator_id
        self.language_code = language_code
        self.status = status
        self.last_updated = question_model_last_updated
        self.created_on = question_model_created_on
        self.question_html_data = html_cleaner.clean(question_html_data)

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSummary object.
        """
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'language_code': self.language_code,
            'status': self.status,
            'last_updated': self.last_updated,
            'created_on': self.created_on,
            'question_html_data': self.question_html_data
        }


class QuestionSkillLink(object):
    """Domain object for Question Skill Link.

    Attributes:
        question_id: str. The ID of the question.
        skill_id: str. The ID of the skill to which the
            question is linked.
    """

    def __init__(self, question_id, skill_id):
        """Constructs a Question Skill Link domain object.

        Args:
            question_id: str. The ID of the question.
            skill_id: str. The ID of the skill to which the question is linked.
        """
        self.question_id = question_id
        self.skill_id = skill_id

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSkillLink object.
        """
        return {
            'question_id': self.question_id,
            'skill_id': self.skill_id,
        }
