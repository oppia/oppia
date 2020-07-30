# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for interaction validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import itertools
import re

from core import jobs
from core.domain import customization_args_util
from core.domain import exp_fetchers
from core.domain import html_validation_service
from core.domain import interaction_registry
from core.domain import rights_manager
from core.platform import models
import feconf
import python_utils

(exp_models,) = models.Registry.import_models([
    models.NAMES.exploration])

ADDED_THREE_VERSIONS_TO_GCS = 'Added the three versions'
_COMMIT_TYPE_REVERT = 'revert'
ALL_IMAGES_VERIFIED = 'Images verified'
ERROR_IN_FILENAME = 'There is an error in the filename'
FILE_COPIED = 'File Copied'
FILE_ALREADY_EXISTS = 'File already exists in GCS'
FILE_FOUND_IN_GCS = 'File found in GCS'
FILE_IS_NOT_IN_GCS = 'File does not exist in GCS'
FILE_REFERENCES_NON_EXISTENT_EXP_KEY = 'File references nonexistent exp'
FILE_REFERENCES_DELETED_EXP_KEY = 'File references deleted exp'
FILE_DELETED = 'File has been deleted'
FILE_FOUND_IN_GCS = 'File is there in GCS'
EXP_REFERENCES_UNICODE_FILES = 'Exploration references unicode files'
INVALID_GCS_URL = 'The url for the entity on GCS is invalid'
NUMBER_OF_FILES_DELETED = 'Number of files that got deleted'
WRONG_INSTANCE_ID = 'Error: The instance_id is not correct'
ADDED_COMPRESSED_VERSIONS_OF_IMAGES = (
    'Added compressed versions of images in exploration')
ALLOWED_AUDIO_EXTENSIONS = list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())
ALLOWED_IMAGE_EXTENSIONS = list(itertools.chain.from_iterable(
    iter(feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.values())))
GCS_AUDIO_ID_REGEX = re.compile(
    r'^/([^/]+)/([^/]+)/assets/audio/(([^/]+)\.(' + '|'.join(
        ALLOWED_AUDIO_EXTENSIONS) + '))$')
GCS_IMAGE_ID_REGEX = re.compile(
    r'^/([^/]+)/([^/]+)/assets/image/(([^/]+)\.(' + '|'.join(
        ALLOWED_IMAGE_EXTENSIONS) + '))$')
GCS_EXTERNAL_IMAGE_ID_REGEX = re.compile(
    r'^/([^/]+)/exploration/([^/]+)/assets/image/(([^/]+)\.(' + '|'.join(
        ALLOWED_IMAGE_EXTENSIONS) + '))$')
SUCCESSFUL_EXPLORATION_MIGRATION = 'Successfully migrated exploration'
AUDIO_FILE_PREFIX = 'audio'
AUDIO_ENTITY_TYPE = 'exploration'
AUDIO_DURATION_SECS_MIN_STATE_SCHEMA_VERSION = 31


class DragAndDropSortInputInteractionOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that produces a list of all (exploration, state) pairs that use the
    DragAndDropSortInput interaction and have invalid choices.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        exp_status = rights_manager.get_exploration_rights(item.id).status
        if exp_status == rights_manager.ACTIVITY_STATUS_PRIVATE:
            return
        exploration = exp_fetchers.get_exploration_from_model(item)
        validation_errors = []
        for state_name, state in exploration.states.items():
            if state.interaction.id == 'DragAndDropSortInput':
                for answer_group_index, answer_group in enumerate(
                        state.interaction.answer_groups):
                    for rule_index, rule_spec in enumerate(
                            answer_group.rule_specs):
                        for rule_input in rule_spec.inputs:
                            value = rule_spec.inputs[rule_input]
                            if value == '' or value == []:
                                validation_errors.append(
                                    'State name: %s, AnswerGroup: %s,' % (
                                        state_name,
                                        answer_group_index) +
                                    ' Rule input %s in rule with index %s'
                                    ' is empty. ' % (rule_input, rule_index))
        if validation_errors:
            yield (item.id, validation_errors)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class MultipleChoiceInteractionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that produces a list of all (exploration, state) pairs that use the
    Multiple choice interaction and have rules that do not correspond to any
    answer choices.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        for state_name, state in exploration.states.items():
            if state.interaction.id == 'MultipleChoiceInput':
                choices_length = len(
                    state.interaction.customization_args['choices']['value'])
                for answer_group_index, answer_group in enumerate(
                        state.interaction.answer_groups):
                    for rule_index, rule_spec in enumerate(
                            answer_group.rule_specs):
                        if rule_spec.inputs['x'] >= choices_length:
                            yield (
                                item.id,
                                'State name: %s, AnswerGroup: %s,' % (
                                    state_name.encode('utf-8'),
                                    answer_group_index) +
                                ' Rule: %s is invalid.' % (rule_index) +
                                '(Indices here are 0-indexed.)')

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ItemSelectionInteractionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that produces a list of (exploration, state) pairs that use the item
    selection interaction and that have rules that do not match the answer
    choices. These probably need to be fixed manually.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        for state_name, state in exploration.states.items():
            if state.interaction.id == 'ItemSelectionInput':
                choices = (
                    state.interaction.customization_args['choices']['value'])
                for group in state.interaction.answer_groups:
                    for rule_spec in group.rule_specs:
                        for rule_item in rule_spec.inputs['x']:
                            if rule_item not in choices:
                                yield (
                                    item.id,
                                    '%s: %s' % (
                                        state_name.encode('utf-8'),
                                        rule_item.encode('utf-8')))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class InteractionRTECustomizationArgsValidationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job for validating all the customizations arguments of
    Rich Text Components.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        err_dict = {}

        try:
            exploration = exp_fetchers.get_exploration_from_model(item)
        except Exception as e:
            yield (
                'Error %s when loading exploration'
                % python_utils.UNICODE(e), [item.id])
            return

        html_list = exploration.get_all_html_content_strings()
        err_dict = html_validation_service.validate_customization_args(
            html_list)

        for key in err_dict:
            if err_dict[key]:
                yield ('%s Exp Id: %s' % (key, item.id), err_dict[key])

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        # Combine all values from multiple lists into a single list
        # for that error type.
        output_values = list(set().union(*final_values))
        exp_id_index = key.find('Exp Id:')
        if exp_id_index == -1:
            yield (key, output_values)
        else:
            output_values.append(key[exp_id_index:])
            yield (key[:exp_id_index - 1], output_values)


class InteractionCustomizationArgsValidationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that produces a list of (exploration, state) pairs and validates
    customization args for all interactions.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        error_messages = []
        for _, state in exploration.states.items():
            if state.interaction.id is None:
                continue
            try:
                ca_specs = (
                    interaction_registry.Registry.get_interaction_by_id(
                        state.interaction.id).customization_arg_specs
                )
                customization_args_util.validate_customization_args_and_values(
                    'interaction',
                    state.interaction.id,
                    state.interaction.customization_args,
                    ca_specs,
                    fail_on_validation_errors=True
                )
            except Exception as e:
                error_messages.append('%s: %s' % (state.interaction.id, e))

        if error_messages:
            yield (
                'Failed customization args validation for exp '
                'id %s' % item.id, ', '.join(error_messages))

    @staticmethod
    def reduce(key, values):
        yield (key, values)
