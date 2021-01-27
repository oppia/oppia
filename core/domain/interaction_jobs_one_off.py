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

from core import jobs
from core.domain import customization_args_util
from core.domain import exp_fetchers
from core.domain import interaction_registry
from core.domain import rights_domain
from core.domain import rights_manager
from core.platform import models

import python_utils

(exp_models,) = models.Registry.import_models([
    models.NAMES.exploration])


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
        if exp_status == rights_domain.ACTIVITY_STATUS_PRIVATE:
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
                    state.interaction.customization_args['choices'].value)
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
                choices = [
                    choice.html
                    for choice in state.interaction.customization_args[
                        'choices'].value
                ]

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

                customization_args_dict = {}
                for ca_name in state.interaction.customization_args:
                    customization_args_dict[ca_name] = (
                        state.interaction.customization_args[
                            ca_name].to_customization_arg_dict()
                    )

                customization_args_util.validate_customization_args_and_values(
                    'interaction',
                    state.interaction.id,
                    customization_args_dict,
                    ca_specs,
                    fail_on_validation_errors=True
                )
            except Exception as e:
                error_messages.append(
                    '%s: %s'.encode(encoding='utf-8') % (
                        state.interaction.id, e))

        if error_messages:
            error_msg = (', '.join(error_messages)).encode(encoding='utf-8')
            yield (
                'Failed customization args validation for exp '
                'id %s' % item.id, python_utils.convert_to_bytes(error_msg))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class RuleInputToCustomizationArgsMappingOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that produces a list of (exploration, state) pairs that use the item
    selection or drag and drop sort interaction and that have rules that do not
    match the answer choices.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        exp_status = rights_manager.get_exploration_rights(item.id).status
        if exp_status == rights_domain.ACTIVITY_STATUS_PRIVATE:
            return

        def get_invalid_values(value_type, value, choices):
            """Checks that the html in SetOfHtmlString, ListOfSetsOfHtmlStrings,
            and DragAndDropHtmlString rule inputs have associated content ids
            in choices.

            Args:
                value_type: str. The type of the value.
                value: *. The value to migrate.
                choices: list(dict). The list of subtitled html dicts to find
                    content ids from.

            Returns:
                *. The migrated rule input.
            """
            invalid_values = []

            if value_type == 'DragAndDropHtmlString':
                if value not in choices:
                    invalid_values.append(value)

            if value_type == 'SetOfHtmlString':
                for html in value:
                    invalid_values.extend(
                        get_invalid_values(
                            'DragAndDropHtmlString', html, choices))

            if value_type == 'ListOfSetsOfHtmlStrings':
                for html_set in value:
                    invalid_values.extend(
                        get_invalid_values(
                            'SetOfHtmlString', html_set, choices))

            return invalid_values

        exploration = exp_fetchers.get_exploration_from_model(item)
        for state_name, state in exploration.states.items():
            if state.interaction.id not in [
                    'DragAndDropSortInput', 'ItemSelectionInput']:
                continue

            choices = [
                choice.html
                for choice in state.interaction.customization_args[
                    'choices'].value
            ]
            solution = state.interaction.solution

            if solution is not None:
                if state.interaction.id == 'ItemSelectionInput':
                    invalid_values = get_invalid_values(
                        'SetOfHtmlString',
                        solution.correct_answer,
                        choices)
                    if invalid_values:
                        yield (
                            exploration.id,
                            (
                                '<ItemSelectionInput Answer> '
                                'State: %s, Invalid Values: %s' % (
                                    state_name, invalid_values)
                            ).encode('utf-8')
                        )

                if state.interaction.id == 'DragAndDropSortInput':
                    invalid_values = get_invalid_values(
                        'ListOfSetsOfHtmlStrings',
                        solution.correct_answer,
                        choices)
                    if invalid_values:
                        yield (
                            exploration.id,
                            (
                                '<DragAndDropSortInput Answer> '
                                'State: %s, Invalid Values: %s' % (
                                    state_name, invalid_values)
                            ).encode('utf-8')
                        )

            for group_i, group in enumerate(state.interaction.answer_groups):
                for rule_spec in group.rule_specs:
                    rule_inputs = rule_spec.inputs
                    rule_type = rule_spec.rule_type
                    if state.interaction.id == 'ItemSelectionInput':
                        # For all rule inputs for ItemSelectionInput, the x
                        # input is of type SetOfHtmlString.
                        invalid_values = get_invalid_values(
                            'SetOfHtmlString', rule_inputs['x'], choices)
                        if invalid_values:
                            yield (
                                exploration.id,
                                (
                                    '<ItemSelectionInput Rule> State: %s, '
                                    'Answer Group Index: %i, '
                                    'Invalid Values: %s' % (
                                        state_name, group_i, invalid_values)
                                ).encode('utf-8')
                            )
                    if state.interaction.id == 'DragAndDropSortInput':
                        if rule_type in [
                                'IsEqualToOrdering',
                                'IsEqualToOrderingWithOneItemAtIncorrectPosition' # pylint: disable=line-too-long
                        ]:
                            # For rule type IsEqualToOrdering and
                            # IsEqualToOrderingWithOneItemAtIncorrectPosition,
                            # the x is of type ListOfSetsOfHtmlStrings.
                            invalid_values = get_invalid_values(
                                'ListOfSetsOfHtmlStrings',
                                rule_inputs['x'],
                                choices)
                            if invalid_values:
                                yield (
                                    exploration.id,
                                    (
                                        '<DragAndDropSortInput Rule> '
                                        'State: %s, '
                                        'Answer Group Index: %i, '
                                        'Invalid Values: %s' % (
                                            state_name, group_i, invalid_values)
                                    ).encode('utf-8')
                                )
                        elif rule_type == 'HasElementXAtPositionY':
                            # For rule type HasElementXAtPositionY,
                            # the x input is of type DragAndDropHtmlString. The
                            # y input is of type DragAndDropPositiveInt (no
                            # validation required).
                            invalid_values = get_invalid_values(
                                'DragAndDropHtmlString',
                                rule_inputs['x'],
                                choices)
                            if invalid_values:
                                yield (
                                    exploration.id,
                                    (
                                        '<DragAndDropSortInput Rule> '
                                        'State: %s, '
                                        'Answer Group Index: %i, '
                                        'Invalid Values: %s' % (
                                            state_name, group_i, invalid_values)
                                    ).encode('utf-8')
                                )
                        elif rule_type == 'HasElementXBeforeElementY':
                            # For rule type HasElementXBeforeElementY,
                            # the x and y inputs are of type
                            # DragAndDropHtmlString.
                            for rule_input_name in ['x', 'y']:
                                invalid_values = get_invalid_values(
                                    'DragAndDropHtmlString',
                                    rule_inputs[rule_input_name],
                                    choices)
                                if invalid_values:
                                    yield (
                                        exploration.id,
                                        (
                                            '<DragAndDropSortInput Rule> '
                                            'State: %s, '
                                            'Answer Group Index: %i, '
                                            'Invalid Values: %s' % (
                                                state_name, group_i,
                                                invalid_values)
                                        ).encode('utf-8')
                                    )

    @staticmethod
    def reduce(key, values):
        yield (key, values)
