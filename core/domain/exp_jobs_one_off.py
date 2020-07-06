# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for explorations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import itertools
import logging
import re

from constants import constants
from core import jobs
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import html_validation_service
from core.domain import rights_manager
from core.platform import models
import feconf
import python_utils
import schema_utils
import utils

from pylatexenc import latex2text

(exp_models,) = models.Registry.import_models([
    models.NAMES.exploration])
gae_image_services = models.Registry.import_gae_image_services()

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
    Multiple selection interaction and have rules that do not correspond to any
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


class MathExpressionValidationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that produces a list of explorations that use the MathExpressionInput
    along with the validity and type (expression/equation) of the inputs present
    in the exploration.

    This validation is done by the 'is_valid_math_expression' or the
    'is_valid_math_equation' function present in schema_utils.py.
    """

    # This threshold puts a cap on the number of valid inputs, i.e.,
    # expressions/equations that can be yielded by this one-off job.
    VALID_MATH_INPUTS_YIELD_LIMIT = 200
    UNICODE_TO_TEXT = {
        u'\u221a': 'sqrt',
        u'\xb7': '*',
        u'\u03b1': 'alpha',
        u'\u03b2': 'beta',
        u'\u03b3': 'gamma',
        u'\u03b4': 'delta',
        u'\u03b5': 'epsilon',
        u'\u03b6': 'zeta',
        u'\u03b7': 'eta',
        u'\u03b8': 'theta',
        u'\u03b9': 'iota',
        u'\u03ba': 'kappa',
        u'\u03bb': 'lambda',
        u'\u03bc': 'mu',
        u'\u03bd': 'nu',
        u'\u03be': 'xi',
        u'\u03c0': 'pi',
        u'\u03c1': 'rho',
        u'\u03c3': 'sigma',
        u'\u03c4': 'tau',
        u'\u03c5': 'upsilon',
        u'\u03c6': 'phi',
        u'\u03c7': 'chi',
        u'\u03c8': 'psi',
        u'\u03c9': 'omega',
    }
    INVERSE_TRIG_FNS_MAPPING = {
        'asin': 'arcsin',
        'acos': 'arccos',
        'atan': 'arctan'
    }
    TRIG_FNS = ['sin', 'cos', 'tan', 'csc', 'sec', 'cot']

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        is_valid_math_expression = schema_utils.get_validator(
            'is_valid_math_expression')
        is_valid_math_equation = schema_utils.get_validator(
            'is_valid_math_equation')
        ltt = latex2text.LatexNodes2Text()
        unicode_to_text_mapping = (
            MathExpressionValidationOneOffJob.UNICODE_TO_TEXT)
        inverse_trig_fns_mapping = (
            MathExpressionValidationOneOffJob.INVERSE_TRIG_FNS_MAPPING)
        trig_fns = MathExpressionValidationOneOffJob.TRIG_FNS

        if not item.deleted:
            exploration = exp_fetchers.get_exploration_from_model(item)
            for state_name, state in exploration.states.items():
                if state.interaction.id == 'MathExpressionInput':
                    for group in state.interaction.answer_groups:
                        for rule_spec in group.rule_specs:
                            rule_input = ltt.latex_to_text(
                                rule_spec.inputs['x'])

                            # Shifting powers in trig functions to the end.
                            # For eg. 'sin^2(x)' -> 'sin(x)^2'.
                            for trig_fn in trig_fns:
                                rule_input = re.sub(
                                    r'%s(\^\d)\((.)\)' % trig_fn,
                                    r'%s(\2)\1' % trig_fn, rule_input)

                            # Adding parens to trig functions that don't have
                            # any. For eg. 'cosA' -> 'cos(A)'.
                            for trig_fn in trig_fns:
                                rule_input = re.sub(
                                    r'%s(?!\()(.)' % trig_fn,
                                    r'%s(\1)' % trig_fn, rule_input)

                            # The pylatexenc lib outputs the unicode values of
                            # special characters like sqrt and pi, which is why
                            # they need to be replaced with their corresponding
                            # text values before performing validation.
                            for unicode_char, text in (
                                    unicode_to_text_mapping.items()):
                                rule_input = rule_input.replace(
                                    unicode_char, text)

                            # Replacing trig functions that have format which is
                            # incompatible with the validations.
                            for invalid_trig_fn, valid_trig_fn in (
                                    inverse_trig_fns_mapping.items()):
                                rule_input = rule_input.replace(
                                    invalid_trig_fn, valid_trig_fn)

                            validity = 'Invalid'
                            if is_valid_math_expression(rule_input):
                                validity = 'Valid Expression'
                            elif is_valid_math_equation(rule_input):
                                validity = 'Valid Equation'

                            output_values = '%s %s: %s' % (
                                item.id, state_name, rule_input)

                            yield (validity, output_values.encode('utf-8'))

    @staticmethod
    def reduce(key, values):
        valid_inputs_limit = (
            MathExpressionValidationOneOffJob.VALID_MATH_INPUTS_YIELD_LIMIT)
        if key.startswith('Valid'):
            yield (key, values[:valid_inputs_limit])
        else:
            yield (key, values)


class ExplorationFirstPublishedOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that finds first published time in milliseconds for all
    explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotContentModel]

    @staticmethod
    def map(item):
        if item.content['status'] == rights_manager.ACTIVITY_STATUS_PUBLIC:
            yield (
                item.get_unversioned_instance_id(),
                utils.get_time_in_millisecs(item.created_on))

    @staticmethod
    def reduce(exp_id, stringified_commit_times_msecs):
        exploration_rights = rights_manager.get_exploration_rights(
            exp_id, strict=False)
        if exploration_rights is None:
            return

        commit_times_msecs = [
            ast.literal_eval(commit_time_string) for
            commit_time_string in stringified_commit_times_msecs]
        first_published_msec = min(commit_times_msecs)
        rights_manager.update_activity_first_published_msec(
            constants.ACTIVITY_TYPE_EXPLORATION, exp_id,
            first_published_msec)


class ExplorationValidityJobManager(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks that all explorations have appropriate validation
    statuses.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        exp_rights = rights_manager.get_exploration_rights(item.id)

        try:
            if exp_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
                exploration.validate()
            else:
                exploration.validate(strict=True)
        except utils.ValidationError as e:
            yield (item.id, python_utils.convert_to_bytes(e))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExplorationMigrationJobManager(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate exploration schema
    versions. This job will load all existing explorations from the data store
    and immediately store them back into the data store. The loading process of
    an exploration in exp_services automatically performs schema updating. This
    job persists that conversion work, keeping explorations up-to-date and
    improving the load time of new explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(ExplorationMigrationJobManager, cls).enqueue(
            job_id, shard_count=64)

    @staticmethod
    def map(item):
        if item.deleted:
            return

        # Do not upgrade explorations that fail non-strict validation.
        old_exploration = exp_fetchers.get_exploration_by_id(item.id)
        try:
            old_exploration.validate()
        except Exception as e:
            logging.error(
                'Exploration %s failed non-strict validation: %s' %
                (item.id, e))
            return

        # If the exploration model being stored in the datastore is not the
        # most up-to-date states schema version, then update it.
        if (item.states_schema_version !=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            # Note: update_exploration does not need to apply a change list in
            # order to perform a migration. See the related comment in
            # exp_services.apply_change_list for more information.
            #
            # Note: from_version and to_version really should be int, but left
            # as str to conform with legacy data.
            commit_cmds = [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': python_utils.UNICODE(
                    item.states_schema_version),
                'to_version': python_utils.UNICODE(
                    feconf.CURRENT_STATE_SCHEMA_VERSION)
            })]
            exp_services.update_exploration(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update exploration states from schema version %d to %d.' % (
                    item.states_schema_version,
                    feconf.CURRENT_STATE_SCHEMA_VERSION))
            yield ('SUCCESS', item.id)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


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


class ExplorationMathTagValidationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of an exploration and validates all the
    Math tags in the HTML.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        exploration_status = (
            rights_manager.get_exploration_rights(
                item.id).status)
        for state_name, state in exploration.states.items():
            html_string = ''.join(state.get_all_html_content_strings())
            error_list = (
                html_validation_service.validate_math_tags_in_html(html_string))
            if len(error_list) > 0:
                key = (
                    'exp_id: %s, exp_status: %s failed validation.' % (
                        item.id, exploration_status))
                value_dict = {
                    'state_name': state_name,
                    'error_list': error_list,
                    'no_of_invalid_tags': len(error_list)
                }
                yield (key, value_dict)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExplorationMockMathMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that migrates all the math tags in the exploration to the new schema
    but does not save the migrated exploration. The new schema has the attribute
    math-content-with-value which includes a field for storing reference to
    SVGs. This job is used to verify that the actual migration will be possible
    for all the explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        exploration_status = (
            rights_manager.get_exploration_rights(
                item.id).status)
        for state_name, state in exploration.states.items():
            html_string = ''.join(
                state.get_all_html_content_strings())

            converted_html_string = (
                html_validation_service.add_math_content_to_math_rte_components(
                    html_string))

            error_list = (
                html_validation_service.
                validate_math_tags_in_html_with_attribute_math_content(
                    converted_html_string))
            if len(error_list) > 0:
                key = (
                    'exp_id: %s, exp_status: %s failed validation after '
                    'migration' % (
                        item.id, exploration_status))
                value_dict = {
                    'state_name': state_name,
                    'error_list': error_list,
                    'no_of_invalid_tags': len(error_list)
                }
                yield (key, value_dict)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ViewableExplorationsAuditJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that outputs a list of private explorations which are viewable."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration_rights = rights_manager.get_exploration_rights(
            item.id, strict=False)
        if exploration_rights is None:
            return

        if (exploration_rights.status == constants.ACTIVITY_STATUS_PRIVATE
                and exploration_rights.viewable_if_private):
            yield (item.id, item.title.encode('utf-8'))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class HintsAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that tabulates the number of hints used by each state of an
    exploration.
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
            hints_length = len(state.interaction.hints)
            if hints_length > 0:
                exp_and_state_key = '%s %s' % (
                    item.id, state_name.encode('utf-8'))
                yield (python_utils.UNICODE(hints_length), exp_and_state_key)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExplorationContentValidationJobForCKEditor(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of an exploration and validates it
    for CKEditor.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        try:
            exploration = exp_fetchers.get_exploration_from_model(item)
        except Exception as e:
            yield (
                'Error %s when loading exploration'
                % python_utils.convert_to_bytes(e), [item.id])
            return

        html_list = exploration.get_all_html_content_strings()

        err_dict = html_validation_service.validate_rte_format(
            html_list, feconf.RTE_FORMAT_CKEDITOR)

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


class InteractionCustomizationArgsValidationJob(
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
