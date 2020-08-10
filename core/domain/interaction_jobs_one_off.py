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
from core.domain import rights_manager
from core.platform import models

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
        if exp_status == rights_manager.ACTIVITY_STATUS_PRIVATE:
            return
        exploration = exp_fetchers.get_exploration_from_model(item)
        validation_errors = []
        for state_name, state in exploration.states.items():
            if state.interaction.id == 'DragAndDropSortInput':
                for answer_group_index, answer_group in enumerate(
                        state.interaction.answer_groups):
                    for rule_type in answer_group.rule_inputs:
                        for rule_input_index, rule_input in enumerate(
                                answer_group.rule_inputs[rule_type]):
                            for rule_input_name in rule_input:
                                value = rule_input[rule_input_name]
                                if value == '' or value == []:
                                    validation_errors.append(
                                        'State name: %s, AnswerGroup: %s,' % (
                                            state_name,
                                            answer_group_index) +
                                        ' Rule input %s in rule with rule type'
                                        ' %s and rule input index %s'
                                        ' is empty. ' % (
                                            rule_input_name,
                                            rule_type,
                                            rule_input_index
                                        )
                                    )
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
                    for rule_type in answer_group.rule_inputs:
                        for rule_input_index, rule_input in enumerate(
                                answer_group.rule_inputs[rule_type]):
                            if rule_input['x'] >= choices_length:
                                yield (
                                    item.id,
                                    'State name: %s, AnswerGroup: %s,' % (
                                        state_name.encode('utf-8'),
                                        answer_group_index) +
                                    ' Rule with (rule type: %s, rule input'
                                    ' index: %s) is invalid.' % (
                                        rule_type, rule_input_index
                                    )
                                )

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
                    for rule_type in group.rule_inputs:
                        for rule_input in group.rule_inputs[rule_type]:
                            for rule_item in rule_input['x']:
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
                error_messages.append('%s: %s' % (state.interaction.id, e))

        if error_messages:
            yield (
                'Failed customization args validation for exp '
                'id %s' % item.id, ', '.join(error_messages))

    @staticmethod
    def reduce(key, values):
        yield (key, values)
