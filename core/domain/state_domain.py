# coding: utf-8
#
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

"""Domain object for states and their constituents."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import copy
import itertools
import logging
import re

import android_validation_constants
from constants import constants
from core.domain import customization_args_util
from core.domain import html_cleaner
from core.domain import interaction_registry
from core.domain import param_domain
from core.domain import rules_registry
from core.domain import translatable_object_registry
from extensions.objects.models import objects
import feconf
import python_utils
import schema_utils
import utils


class AnswerGroup(python_utils.OBJECT):
    """Value object for an answer group. Answer groups represent a set of rules
    dictating whether a shared feedback should be shared with the user. These
    rules are ORed together. Answer groups may also support a classifier
    that involve soft matching of answers to a set of training data and/or
    example answers dictated by the creator.
    """

    def __init__(
            self, outcome, rule_specs, training_data,
            tagged_skill_misconception_id):
        """Initializes a AnswerGroup domain object.

        Args:
            outcome: Outcome. The outcome corresponding to the answer group.
            rule_specs: list(RuleSpec). List of rule specifications.
            training_data: list(*). List of answers belonging to training
                data of this answer group.
            tagged_skill_misconception_id: str or None. The format is
                '<skill_id>-<misconception_id>', where skill_id is the skill ID
                of the tagged misconception and misconception_id is the id of
                the tagged misconception for the answer group. It is not None
                only when a state is part of a Question object that
                tests a particular skill.
        """
        self.rule_specs = [RuleSpec(
            rule_spec.rule_type, rule_spec.inputs
        ) for rule_spec in rule_specs]
        self.outcome = outcome
        self.training_data = training_data
        self.tagged_skill_misconception_id = tagged_skill_misconception_id

    def to_dict(self):
        """Returns a dict representing this AnswerGroup domain object.

        Returns:
            dict. A dict, mapping all fields of AnswerGroup instance.
        """
        return {
            'rule_specs': [rule_spec.to_dict()
                           for rule_spec in self.rule_specs],
            'outcome': self.outcome.to_dict(),
            'training_data': self.training_data,
            'tagged_skill_misconception_id': self.tagged_skill_misconception_id
        }

    @classmethod
    def from_dict(cls, answer_group_dict):
        """Return a AnswerGroup domain object from a dict.

        Args:
            answer_group_dict: dict. The dict representation of AnswerGroup
                object.

        Returns:
            AnswerGroup. The corresponding AnswerGroup domain object.
        """
        return cls(
            Outcome.from_dict(answer_group_dict['outcome']),
            [RuleSpec.from_dict(rs)
             for rs in answer_group_dict['rule_specs']],
            answer_group_dict['training_data'],
            answer_group_dict['tagged_skill_misconception_id']
        )

    def validate(self, interaction, exp_param_specs_dict):
        """Verifies that all rule classes are valid, and that the AnswerGroup
        only has one classifier rule.

        Args:
            interaction: BaseInteraction. The interaction object.
            exp_param_specs_dict: dict. A dict of all parameters used in the
                exploration. Keys are parameter names and values are ParamSpec
                value objects with an object type property (obj_type).

        Raises:
            ValidationError. One or more attributes of the AnswerGroup are
                invalid.
            ValidationError. The AnswerGroup contains more than one classifier
                rule.
        """
        if not isinstance(self.rule_specs, list):
            raise utils.ValidationError(
                'Expected answer group rules to be a list, received %s'
                % self.rule_specs)

        if self.tagged_skill_misconception_id is not None:
            if not isinstance(
                    self.tagged_skill_misconception_id,
                    python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected tagged skill misconception id to be a str, '
                    'received %s' % self.tagged_skill_misconception_id)
            if not re.match(
                    constants.VALID_SKILL_MISCONCEPTION_ID_REGEX,
                    self.tagged_skill_misconception_id):
                raise utils.ValidationError(
                    'Expected the format of tagged skill misconception id '
                    'to be <skill_id>-<misconception_id>, received %s'
                    % self.tagged_skill_misconception_id)

        if len(self.rule_specs) == 0 and len(self.training_data) == 0:
            raise utils.ValidationError(
                'There must be at least one rule or training data for each'
                ' answer group.')

        for rule_spec in self.rule_specs:
            if rule_spec.rule_type not in interaction.rules_dict:
                raise utils.ValidationError(
                    'Unrecognized rule type: %s' % rule_spec.rule_type)
            rule_spec.validate(
                interaction.get_rule_param_list(rule_spec.rule_type),
                exp_param_specs_dict)

        self.outcome.validate()

    def get_all_html_content_strings(self, interaction_id):
        """Get all html content strings in the AnswerGroup.

        Args:
            interaction_id: str. The interaction id that the answer group is
                associated with.

        Returns:
            list(str). The list of all html content strings in the interaction.
        """
        html_list = []

        # TODO(#9413): Find a way to include a reference to the interaction
        # type in the Draft change lists.
        # See issue: https://github.com/oppia/oppia/issues/9413. We cannot use
        # the interaction-id from the rules_index_dict until issue-9413 has
        # been fixed, because this method has no reference to the interaction
        # type and draft changes use this method. The rules_index_dict below
        # is used to figure out the assembly of the html in the rulespecs.

        outcome_html = self.outcome.feedback.html
        html_list += [outcome_html]

        html_field_types_to_rule_specs = (
            rules_registry.Registry.get_html_field_types_to_rule_specs())
        for rule_spec in self.rule_specs:
            for interaction_and_rule_details in (
                    html_field_types_to_rule_specs.values()):
                # Check that the value corresponds to the answer group's
                # associated interaction id.
                if (
                        interaction_and_rule_details['interactionId'] !=
                        interaction_id):
                    continue

                rule_type_has_html = (
                    rule_spec.rule_type in
                    interaction_and_rule_details['ruleTypes'].keys())
                if rule_type_has_html:
                    html_type_format = interaction_and_rule_details['format']
                    input_variables_from_html_mapping = (
                        interaction_and_rule_details['ruleTypes'][
                            rule_spec.rule_type][
                                'htmlInputVariables'])
                    input_variable_match_found = False
                    for input_variable in rule_spec.inputs.keys():
                        if input_variable in input_variables_from_html_mapping:
                            input_variable_match_found = True
                            rule_input_variable = (
                                rule_spec.inputs[input_variable])
                            if (html_type_format ==
                                    feconf.HTML_RULE_VARIABLE_FORMAT_STRING):
                                html_list += [rule_input_variable]
                            elif (html_type_format ==
                                  feconf.HTML_RULE_VARIABLE_FORMAT_SET):
                                for value in rule_input_variable:
                                    if isinstance(
                                            value, python_utils.BASESTRING):
                                        html_list += [value]
                            elif (html_type_format ==
                                  feconf.
                                  HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS):
                                for rule_spec_html in rule_input_variable:
                                    html_list += rule_spec_html
                            else:
                                raise Exception(
                                    'The rule spec does not belong to a valid'
                                    ' format.')
                    if not input_variable_match_found:
                        raise Exception(
                            'Rule spec should have at least one valid input '
                            'variable with Html in it.')

        return html_list

    @staticmethod
    def convert_html_in_answer_group(
            answer_group_dict, conversion_fn, html_field_types_to_rule_specs):
        """Checks for HTML fields in an answer group dict and converts it
        according to the conversion function.

        Args:
            answer_group_dict: dict. The answer group dict.
            conversion_fn: function. The function to be used for converting the
                HTML.
            html_field_types_to_rule_specs: dict. A dictionary that specifies
                the locations of html fields in rule specs. It is defined as a
                mapping of rule input types to a dictionary containing
                interaction id, format, and rule types. See
                html_field_types_to_rule_specs_state_v41.json for an example.

        Returns:
            dict. The converted answer group dict.
        """
        answer_group_dict['outcome']['feedback']['html'] = conversion_fn(
            answer_group_dict['outcome']['feedback']['html'])

        for rule_spec_index, rule_spec in enumerate(
                answer_group_dict['rule_specs']):
            answer_group_dict['rule_specs'][rule_spec_index] = (
                RuleSpec.convert_html_in_rule_spec(
                    rule_spec, conversion_fn, html_field_types_to_rule_specs))

        return answer_group_dict


class Hint(python_utils.OBJECT):
    """Value object representing a hint."""

    def __init__(self, hint_content):
        """Constructs a Hint domain object.

        Args:
            hint_content: SubtitledHtml. The hint text and ID referring to the
                other assets for this content.
        """
        self.hint_content = hint_content

    def to_dict(self):
        """Returns a dict representing this Hint domain object.

        Returns:
            dict. A dict mapping the field of Hint instance.
        """
        return {
            'hint_content': self.hint_content.to_dict(),
        }

    @classmethod
    def from_dict(cls, hint_dict):
        """Return a Hint domain object from a dict.

        Args:
            hint_dict: dict. The dict representation of Hint object.

        Returns:
            Hint. The corresponding Hint domain object.
        """
        hint_content = SubtitledHtml.from_dict(hint_dict['hint_content'])
        hint_content.validate()
        return cls(hint_content)

    def validate(self):
        """Validates all properties of Hint."""
        self.hint_content.validate()

    @staticmethod
    def convert_html_in_hint(hint_dict, conversion_fn):
        """Checks for HTML fields in the hints and converts it
        according to the conversion function.

        Args:
            hint_dict: dict. The hints dict.
            conversion_fn: function. The function to be used for converting the
                HTML.

        Returns:
            dict. The converted hints dict.
        """
        hint_dict['hint_content']['html'] = (
            conversion_fn(hint_dict['hint_content']['html']))
        return hint_dict


class Solution(python_utils.OBJECT):
    """Value object representing a solution.

    A solution consists of answer_is_exclusive, correct_answer and an
    explanation.When answer_is_exclusive is True, this indicates that it is
    the only correct answer; when it is False, this indicates that it is one
    possible answer. correct_answer records an answer that enables the learner
    to progress to the next card and explanation is an HTML string containing
    an explanation for the solution.
    """

    def __init__(
            self, interaction_id, answer_is_exclusive,
            correct_answer, explanation):
        """Constructs a Solution domain object.

        Args:
            interaction_id: str. The interaction id.
            answer_is_exclusive: bool. True if is the only correct answer;
                False if is one of possible answer.
            correct_answer: *. The correct answer; this answer
                enables the learner to progress to the next card. The type of
                correct_answer is determined by the value of
                BaseInteraction.answer_type. Some examples for the types are
                list(set(str)), list(str), str, dict(str, str), etc.
            explanation: SubtitledHtml. Contains text and text id to link audio
                translations for the solution's explanation.
        """
        self.answer_is_exclusive = answer_is_exclusive
        self.correct_answer = (
            interaction_registry.Registry.get_interaction_by_id(
                interaction_id).normalize_answer(correct_answer))
        self.explanation = explanation

    def to_dict(self):
        """Returns a dict representing this Solution domain object.

        Returns:
            dict. A dict mapping all fields of Solution instance.
        """
        return {
            'answer_is_exclusive': self.answer_is_exclusive,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation.to_dict(),
        }

    @classmethod
    def from_dict(cls, interaction_id, solution_dict):
        """Return a Solution domain object from a dict.

        Args:
            interaction_id: str. The interaction id.
            solution_dict: dict. The dict representation of Solution object.

        Returns:
            Solution. The corresponding Solution domain object.
        """
        explanation = SubtitledHtml.from_dict(solution_dict['explanation'])
        explanation.validate()
        return cls(
            interaction_id,
            solution_dict['answer_is_exclusive'],
            interaction_registry.Registry.get_interaction_by_id(
                interaction_id).normalize_answer(
                    solution_dict['correct_answer']),
            explanation)

    def validate(self, interaction_id):
        """Validates all properties of Solution.

        Args:
            interaction_id: str. The interaction id.

        Raises:
            ValidationError. One or more attributes of the Solution are not
                valid.
        """
        if not isinstance(self.answer_is_exclusive, bool):
            raise utils.ValidationError(
                'Expected answer_is_exclusive to be bool, received %s' %
                self.answer_is_exclusive)
        interaction_registry.Registry.get_interaction_by_id(
            interaction_id).normalize_answer(self.correct_answer)
        self.explanation.validate()

    @staticmethod
    def convert_html_in_solution(
            interaction_id, solution_dict, conversion_fn,
            html_field_types_to_rule_specs, interaction_spec):
        """Checks for HTML fields in a solution and convert it according
        to the conversion function.

        Args:
            interaction_id: str. The interaction id.
            solution_dict: dict. The Solution dict.
            conversion_fn: function. The function to be used for converting the
                HTML.
            html_field_types_to_rule_specs: dict. A dictionary that specifies
                the locations of html fields in rule specs. It is defined as a
                mapping of rule input types to a dictionary containing
                interaction id, format, and rule types. See
                html_field_types_to_rule_specs_state_v41.json for an example.
            interaction_spec: dict. The specification for the interaction.

        Returns:
            dict. The converted Solution dict.
        """
        if interaction_id is None:
            return solution_dict

        solution_dict['explanation']['html'] = (
            conversion_fn(solution_dict['explanation']['html']))

        if interaction_spec['can_have_solution']:
            if solution_dict['correct_answer']:
                for html_type in html_field_types_to_rule_specs.keys():
                    if html_type == interaction_spec['answer_type']:

                        if (
                                html_type ==
                                feconf.ANSWER_TYPE_LIST_OF_SETS_OF_HTML):

                            for list_index, html_list in enumerate(
                                    solution_dict['correct_answer']):
                                for answer_html_index, answer_html in enumerate(
                                        html_list):
                                    solution_dict['correct_answer'][list_index][
                                        answer_html_index] = (
                                            conversion_fn(answer_html))
                        elif html_type == feconf.ANSWER_TYPE_SET_OF_HTML:
                            for answer_html_index, answer_html in enumerate(
                                    solution_dict['correct_answer']):
                                solution_dict['correct_answer'][
                                    answer_html_index] = (
                                        conversion_fn(answer_html))
                        else:
                            raise Exception(
                                'The solution does not have a valid '
                                'correct_answer type.')

        return solution_dict


class InteractionInstance(python_utils.OBJECT):
    """Value object for an instance of an interaction."""

    # The default interaction used for a new state.
    _DEFAULT_INTERACTION_ID = None

    def to_dict(self):
        """Returns a dict representing this InteractionInstance domain object.

        Returns:
            dict. A dict mapping all fields of InteractionInstance instance.
        """

        # customization_args_dict here indicates a dict that maps customization
        # argument names to a customization argument dict, the dict
        # representation of InteractionCustomizationArg.
        customization_args_dict = {}
        if self.id:
            for ca_name in self.customization_args:
                customization_args_dict[ca_name] = (
                    self.customization_args[
                        ca_name].to_customization_arg_dict()
                )

        # Consistent with other usages of to_dict() across the codebase, all
        # values below are plain Python data structures and not domain objects,
        # despite the names of the keys. This applies to customization_args_dict
        # below.
        return {
            'id': self.id,
            'customization_args': customization_args_dict,
            'answer_groups': [group.to_dict() for group in self.answer_groups],
            'default_outcome': (
                self.default_outcome.to_dict()
                if self.default_outcome is not None
                else None),
            'confirmed_unclassified_answers': (
                self.confirmed_unclassified_answers),
            'hints': [hint.to_dict() for hint in self.hints],
            'solution': self.solution.to_dict() if self.solution else None,
        }

    @classmethod
    def from_dict(cls, interaction_dict):
        """Return a InteractionInstance domain object from a dict.

        Args:
            interaction_dict: dict. The dict representation of
                InteractionInstance object.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object.
        """
        default_outcome_dict = (
            Outcome.from_dict(interaction_dict['default_outcome'])
            if interaction_dict['default_outcome'] is not None else None)
        solution_dict = (
            Solution.from_dict(
                interaction_dict['id'], interaction_dict['solution'])
            if (interaction_dict['solution'] and interaction_dict['id'])
            else None)

        customization_args = (
            InteractionInstance
            .convert_customization_args_dict_to_customization_args(
                interaction_dict['id'],
                interaction_dict['customization_args']
            )
        )

        return cls(
            interaction_dict['id'],
            customization_args,
            [AnswerGroup.from_dict(h)
             for h in interaction_dict['answer_groups']],
            default_outcome_dict,
            interaction_dict['confirmed_unclassified_answers'],
            [Hint.from_dict(h) for h in interaction_dict['hints']],
            solution_dict)

    def __init__(
            self, interaction_id, customization_args, answer_groups,
            default_outcome, confirmed_unclassified_answers, hints, solution):
        """Initializes a InteractionInstance domain object.

        Args:
            interaction_id: str. The interaction id.
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.
            default_outcome: Outcome. The default outcome of the interaction
                instance.
            confirmed_unclassified_answers: list(*). List of answers which have
                been confirmed to be associated with the default outcome.
            hints: list(Hint). List of hints for this interaction.
            solution: Solution. A possible solution for the question asked in
                this interaction.
        """
        self.id = interaction_id
        # Customization args for the interaction's view. Parts of these
        # args may be Jinja templates that refer to state parameters.
        # This is a dict: the keys are names of customization_args and the
        # values are dicts with a single key, 'value', whose corresponding
        # value is the value of the customization arg.
        self.customization_args = customization_args
        self.answer_groups = answer_groups
        self.default_outcome = default_outcome
        self.confirmed_unclassified_answers = confirmed_unclassified_answers
        self.hints = hints
        self.solution = solution

    @property
    def is_terminal(self):
        """Determines if this interaction type is terminal. If no ID is set for
        this interaction, it is assumed to not be terminal.

        Returns:
            bool. Whether the interaction is terminal.
        """
        return self.id and interaction_registry.Registry.get_interaction_by_id(
            self.id).is_terminal

    def is_supported_on_android_app(self):
        """Determines whether the interaction is a valid interaction that is
        supported by the Android app.

        Returns:
            bool. Whether the interaction is supported by the Android app.
        """
        return (
            self.id is None or
            self.id in android_validation_constants.VALID_INTERACTION_IDS
        )

    def is_rte_content_supported_on_android(
            self, require_valid_component_names):
        """Determines whether the RTE content in interaction answer groups,
        hints and solution is supported by Android app.

        Args:
            require_valid_component_names: function. Function to check
                whether the RTE tags in the html string are whitelisted.

        Returns:
            bool. Whether the RTE content is valid.
        """
        for answer_group in self.answer_groups:
            if require_valid_component_names(
                    answer_group.outcome.feedback.html):
                return False

        if (
                self.default_outcome and self.default_outcome.feedback and
                require_valid_component_names(
                    self.default_outcome.feedback.html)):
            return False

        for hint in self.hints:
            if require_valid_component_names(hint.hint_content.html):
                return False

        if (
                self.solution and self.solution.explanation and
                require_valid_component_names(
                    self.solution.explanation.html)):
            return False

        return True

    def get_all_outcomes(self):
        """Returns a list of all outcomes of this interaction, taking into
        consideration every answer group and the default outcome.

        Returns:
            list(Outcome). List of all outcomes of this interaction.
        """
        outcomes = []
        for answer_group in self.answer_groups:
            outcomes.append(answer_group.outcome)
        if self.default_outcome is not None:
            outcomes.append(self.default_outcome)
        return outcomes

    def validate(self, exp_param_specs_dict):
        """Validates various properties of the InteractionInstance.

        Args:
            exp_param_specs_dict: dict. A dict of specified parameters used in
                the exploration. Keys are parameter names and values are
                ParamSpec value objects with an object type property(obj_type).
                Is used to validate AnswerGroup objects.

        Raises:
            ValidationError. One or more attributes of the InteractionInstance
                are invalid.
        """
        if not isinstance(self.id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected interaction id to be a string, received %s' %
                self.id)
        try:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                self.id)
        except KeyError:
            raise utils.ValidationError('Invalid interaction id: %s' % self.id)

        self._validate_customization_args()

        if not isinstance(self.answer_groups, list):
            raise utils.ValidationError(
                'Expected answer groups to be a list, received %s.'
                % self.answer_groups)
        if not self.is_terminal and self.default_outcome is None:
            raise utils.ValidationError(
                'Non-terminal interactions must have a default outcome.')
        if self.is_terminal and self.default_outcome is not None:
            raise utils.ValidationError(
                'Terminal interactions must not have a default outcome.')
        if self.is_terminal and self.answer_groups:
            raise utils.ValidationError(
                'Terminal interactions must not have any answer groups.')

        for answer_group in self.answer_groups:
            answer_group.validate(interaction, exp_param_specs_dict)
        if self.default_outcome is not None:
            self.default_outcome.validate()

        if not isinstance(self.hints, list):
            raise utils.ValidationError(
                'Expected hints to be a list, received %s'
                % self.hints)
        for hint in self.hints:
            hint.validate()

        if self.solution:
            self.solution.validate(self.id)

        if self.solution and not self.hints:
            raise utils.ValidationError(
                'Hint(s) must be specified if solution is specified')

    def _validate_customization_args(self):
        """Validates the customization arguments keys and values using
        customization_args_util.validate_customization_args_and_values().
        """
        # Because validate_customization_args_and_values() takes in
        # customization argument values that are dictionaries, we first convert
        # the InteractionCustomizationArg domain objects into dictionaries
        # before passing it to the method.

        # First, do some basic validation.
        if not isinstance(self.customization_args, dict):
            raise utils.ValidationError(
                'Expected customization args to be a dict, received %s'
                % self.customization_args)

        # customization_args_dict here indicates a dict that maps customization
        # argument names to a customization argument dict, the dict
        # representation of InteractionCustomizationArg.
        customization_args_dict = {}
        if self.id:
            for ca_name in self.customization_args:
                try:
                    customization_args_dict[ca_name] = (
                        self.customization_args[
                            ca_name].to_customization_arg_dict()
                    )
                except AttributeError:
                    raise utils.ValidationError(
                        'Expected customization arg value to be a '
                        'InteractionCustomizationArg domain object, '
                        'received %s' % self.customization_args[ca_name])

        interaction = interaction_registry.Registry.get_interaction_by_id(
            self.id)
        customization_args_util.validate_customization_args_and_values(
            'interaction', self.id, customization_args_dict,
            interaction.customization_arg_specs)

        self.customization_args = (
            InteractionInstance
            .convert_customization_args_dict_to_customization_args(
                self.id,
                customization_args_dict
            )
        )

    @classmethod
    def create_default_interaction(cls, default_dest_state_name):
        """Create a default InteractionInstance domain object:
            - customization_args: empty dictionary;
            - answer_groups: empty list;
            - default_outcome: dest is set to 'default_dest_state_name' and
                feedback and param_changes are initialized as empty lists;
            - confirmed_unclassified_answers: empty list;

        Args:
            default_dest_state_name: str. The default destination state.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object with default values.
        """
        default_outcome = Outcome(
            default_dest_state_name,
            SubtitledHtml.create_default_subtitled_html(
                feconf.DEFAULT_OUTCOME_CONTENT_ID), False, {}, None, None)

        return cls(
            cls._DEFAULT_INTERACTION_ID, {}, [], default_outcome, [], [], None)

    def get_all_html_content_strings(self):
        """Get all html content strings in the interaction.

        Returns:
            list(str). The list of all html content strings in the interaction.
        """
        html_list = []

        for answer_group in self.answer_groups:
            html_list += answer_group.get_all_html_content_strings(self.id)

        if self.default_outcome:
            default_outcome_html = self.default_outcome.feedback.html
            html_list += [default_outcome_html]

        for hint in self.hints:
            hint_html = hint.hint_content.html
            html_list += [hint_html]

        if self.id is None:
            return html_list

        interaction = (
            interaction_registry.Registry.get_interaction_by_id(
                self.id))

        if self.solution and interaction.can_have_solution:
            solution_html = self.solution.explanation.html
            html_list += [solution_html]
            html_field_types_to_rule_specs = (
                rules_registry.Registry.get_html_field_types_to_rule_specs())

            if self.solution.correct_answer:
                for html_type in html_field_types_to_rule_specs.keys():
                    if html_type == interaction.answer_type:
                        if (
                                html_type ==
                                feconf.ANSWER_TYPE_LIST_OF_SETS_OF_HTML):
                            for value in self.solution.correct_answer:
                                html_list += value
                        elif html_type == feconf.ANSWER_TYPE_SET_OF_HTML:
                            for value in self.solution.correct_answer:
                                html_list += [value]
                        else:
                            raise Exception(
                                'The solution does not have a valid '
                                'correct_answer type.')

        for ca_name in self.customization_args:
            html_list += self.customization_args[ca_name].get_html()

        return html_list

    @staticmethod
    def convert_html_in_interaction(interaction_dict, conversion_fn):
        """Checks for HTML fields in the interaction and converts it
        according to the conversion function.

        Args:
            interaction_dict: dict. The interaction dict.
            conversion_fn: function. The function to be used for converting the
                HTML.

        Returns:
            dict. The converted interaction dict.
        """
        def wrapped_conversion_fn(value, schema_obj_type):
            """Applies the conversion function to the SubtitledHtml values.

            Args:
                value: SubtitledHtml|SubtitledUnicode. The value in the
                    customization argument value to be converted.
                schema_obj_type: str. The schema obj_type for the customization
                    argument value, which is one of 'SubtitledUnicode' or
                    'SubtitledHtml'.

            Returns:
                SubtitledHtml|SubtitledUnicode. The converted SubtitledHtml
                object, if schema_type is 'SubititledHtml', otherwise the
                unmodified SubtitledUnicode object.
            """
            if schema_obj_type == schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML:
                value.html = conversion_fn(value.html)
            return value

        interaction_id = interaction_dict['id']

        # Convert the customization_args to a dictionary of customization arg
        # name to InteractionCustomizationArg, so that we can utilize
        # InteractionCustomizationArg helper functions.
        # Then, convert back to original dict format afterwards, at the end.
        customization_args = (
            InteractionInstance
            .convert_customization_args_dict_to_customization_args(
                interaction_id,
                interaction_dict['customization_args'])
        )
        ca_specs = interaction_registry.Registry.get_interaction_by_id(
            interaction_id).customization_arg_specs

        for ca_spec in ca_specs:
            ca_spec_name = ca_spec.name
            customization_args[ca_spec_name].value = (
                InteractionCustomizationArg.traverse_by_schema_and_convert(
                    ca_spec.schema,
                    customization_args[ca_spec_name].value,
                    wrapped_conversion_fn
                )
            )

        # customization_args_dict here indicates a dict that maps customization
        # argument names to a customization argument dict, the dict
        # representation of InteractionCustomizationArg.
        customization_args_dict = {}
        for ca_name in customization_args:
            customization_args_dict[ca_name] = (
                customization_args[ca_name].to_customization_arg_dict())

        interaction_dict['customization_args'] = customization_args_dict
        return interaction_dict

    @staticmethod
    def convert_customization_args_dict_to_customization_args(
            interaction_id, customization_args_dict):
        """Converts customization arguments dictionary to customization
        arguments. This is done by converting each customization argument to a
        InteractionCustomizationArg domain object.

        Args:
            interaction_id: str. The interaction id.
            customization_args_dict: dict. A dictionary of customization
                argument name to a customization argument dict, which is a dict
                of the single key 'value' to the value of the customization
                argument.

        Returns:
            dict. A dictionary of customization argument names to the
            InteractionCustomizationArg domain object's.
        """
        if interaction_id is None:
            return {}

        ca_specs = interaction_registry.Registry.get_interaction_by_id(
            interaction_id).customization_arg_specs
        customization_args = {
            spec.name: InteractionCustomizationArg.from_customization_arg_dict(
                customization_args_dict[spec.name],
                spec.schema
            ) for spec in ca_specs
        }

        return customization_args


class InteractionCustomizationArg(python_utils.OBJECT):
    """Object representing an interaction's customization argument.
    Any SubtitledHtml or SubtitledUnicode values in the customization argument
    value are represented as their respective domain objects here, rather than a
    SubtitledHtml dict or SubtitledUnicode dict.
    """

    def __init__(self, value, schema):
        """Initializes a InteractionCustomizationArg domain object.

        Args:
            value: *. The value of the interaction customization argument.
            schema: dict. The schema defining the specification of the value.
        """
        self.value = value
        self.schema = schema

    def to_customization_arg_dict(self):
        """Converts a InteractionCustomizationArgument domain object to a
        customization argument dictionary. This is done by
        traversing the customization argument schema, and converting
        SubtitledUnicode to unicode and SubtitledHtml to html where appropriate.
        """
        def convert_content_to_dict(ca_value, unused_schema_obj_type):
            """Conversion function used to convert SubtitledHtml to
            SubtitledHtml dicts and SubtitledUnicode to SubtitledUnicode dicts.

            Args:
                ca_value: SubtitledHtml|SubtitledUnicode. A SubtitledUnicode or
                    SubtitledHtml value found inside the customization
                    argument value.
                unused_schema_obj_type: str. The schema obj_type for the
                    customization argument value, which is one
                    of 'SubtitledUnicode' or 'SubtitledHtml'.

            Returns:
                dict. The customization argument value converted to a dict.
            """
            return ca_value.to_dict()

        return {
            'value': InteractionCustomizationArg.traverse_by_schema_and_convert(
                self.schema,
                copy.deepcopy(self.value),
                convert_content_to_dict
            )
        }

    @classmethod
    def from_customization_arg_dict(cls, ca_dict, ca_schema):
        """Converts a customization argument dictionary to an
        InteractionCustomizationArgument domain object. This is done by
        traversing the customization argument schema, and converting
        unicode to SubtitledUnicode and html to SubtitledHtml where appropriate.

        Args:
            ca_dict: dict. The customization argument dictionary. A dict of the
                single key 'value' to the value of the customization argument.
            ca_schema: dict. The schema that defines the customization argument
                value.

        Returns:
            InteractionCustomizationArg. The customization argument domain
            object.
        """
        def convert_content_to_domain_obj(ca_value, schema_obj_type):
            """Conversion function used to convert SubtitledHtml dicts to
            SubtitledHtml and SubtitledUnicode dicts to SubtitledUnicode.

            Args:
                ca_value: dict. Value of customization argument.
                schema_obj_type: str. The schema obj_type for the customization
                    argument value, which is one of 'SubtitledUnicode' or
                    'SubtitledHtml'.

            Returns:
                dict. The unmodified customization argument value.
            """
            if (
                    schema_obj_type ==
                    schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE
            ):
                return SubtitledUnicode(
                    ca_value['content_id'], ca_value['unicode_str'])

            if schema_obj_type == schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML:
                return SubtitledHtml(
                    ca_value['content_id'], ca_value['html'])

        ca_value = InteractionCustomizationArg.traverse_by_schema_and_convert(
            ca_schema,
            copy.deepcopy(ca_dict['value']),
            convert_content_to_domain_obj
        )

        return cls(ca_value, ca_schema)

    def get_subtitled_unicode(self):
        """Get all SubtitledUnicode(s) in the customization argument.

        Returns:
            list(str). A list of SubtitledUnicode.
        """
        return InteractionCustomizationArg.traverse_by_schema_and_get(
            self.schema,
            self.value,
            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE],
            lambda x: x
        )

    def get_subtitled_html(self):
        """Get all SubtitledHtml(s) in the customization argument.

        Returns:
            list(str). A list of SubtitledHtml.
        """
        return InteractionCustomizationArg.traverse_by_schema_and_get(
            self.schema,
            self.value,
            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML],
            lambda x: x
        )

    def get_content_ids(self):
        """Get all content_ids from SubtitledHtml and SubtitledUnicode in the
        customization argument.

        Returns:
            list(str). A list of content_ids.
        """
        return InteractionCustomizationArg.traverse_by_schema_and_get(
            self.schema,
            self.value,
            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE,
             schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML],
            lambda x: x.content_id
        )

    def get_html(self):
        """Get all html from SubtitledHtml in the customization argument.

        Returns:
            list(str). All html strings in the customization argument.
        """

        return InteractionCustomizationArg.traverse_by_schema_and_get(
            self.schema,
            self.value,
            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML],
            lambda x: x.html
        )

    def validate_subtitled_html(self):
        """Calls the validate method on all SubtitledHtml domain objects in
        the customization arguments.
        """
        def validate_html(subtitled_html):
            """A dummy value extractor that calls the validate method on
            the passed SubtitledHtml domain object.
            """
            subtitled_html.validate()

        InteractionCustomizationArg.traverse_by_schema_and_get(
            self.schema,
            self.value,
            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML],
            validate_html
        )

    @staticmethod
    def traverse_by_schema_and_convert(schema, value, conversion_fn):
        """Helper function that recursively traverses an interaction
        customization argument spec to locate any SubtitledHtml or
        SubtitledUnicode objects, and applies a conversion function to the
        customization argument value.

        Args:
            schema: dict. The customization dict to be modified: dict
                with a single key, 'value', whose corresponding value is the
                value of the customization arg.
            value: dict. The current nested customization argument value to be
                modified.
            conversion_fn: function. The function to be used for converting the
                content. It is passed the customization argument value and
                schema obj_type, which is one of 'SubtitledUnicode' or
                'SubtitledHtml'.

        Returns:
            dict. The converted customization dict.
        """
        is_subtitled_html_spec = (
            schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
            schema['obj_type'] ==
            schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML)
        is_subtitled_unicode_spec = (
            schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
            schema['obj_type'] ==
            schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE)

        if is_subtitled_html_spec or is_subtitled_unicode_spec:
            value = conversion_fn(value, schema['obj_type'])
        elif schema['type'] == schema_utils.SCHEMA_TYPE_LIST:
            value = [
                InteractionCustomizationArg.traverse_by_schema_and_convert(
                    schema['items'],
                    value_element,
                    conversion_fn
                ) for value_element in value
            ]
        elif schema['type'] == schema_utils.SCHEMA_TYPE_DICT:
            for property_spec in schema['properties']:
                name = property_spec['name']
                value[name] = (
                    InteractionCustomizationArg.traverse_by_schema_and_convert(
                        property_spec['schema'],
                        value[name],
                        conversion_fn)
                )

        return value

    @staticmethod
    def traverse_by_schema_and_get(
            schema, value, obj_types_to_search_for, value_extractor):
        """Recursively traverses an interaction customization argument spec to
        locate values with schema obj_type in obj_types_to_search_for, and
        extracting the value using a value_extractor function.

        Args:
            schema: dict. The customization dict to be modified: dict
                with a single key, 'value', whose corresponding value is the
                value of the customization arg.
            value: dict. The current nested customization argument value to be
                modified.
            obj_types_to_search_for: list(str). The obj types to search for. If
                this list contains the current obj type, the value is passed to
                value_extractor and the results are collected.
            value_extractor: function. The function that extracts the wanted
                computed value from each value that matches the obj_types. It
                accepts one parameter, the value that matches the search object
                type, and returns a desired computed value.

        Returns:
            list(*). A list of the extracted values returned from
            value_extractor, which is run on any values that have a schema type
            equal to 'custom' and have a obj_type in obj_types_to_search_for.
            Because value_extractor can return any type, the result is a list of
            any type.
        """
        result = []
        schema_type = schema['type']

        if (
                schema_type == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] in obj_types_to_search_for
        ):
            result.append(value_extractor(value))
        elif schema_type == schema_utils.SCHEMA_TYPE_LIST:
            result = list(itertools.chain.from_iterable([
                InteractionCustomizationArg.traverse_by_schema_and_get(
                    schema['items'],
                    value_element,
                    obj_types_to_search_for,
                    value_extractor
                ) for value_element in value]))
        elif schema_type == schema_utils.SCHEMA_TYPE_DICT:
            result = list(itertools.chain.from_iterable([
                InteractionCustomizationArg.traverse_by_schema_and_get(
                    property_spec['schema'],
                    value[property_spec['name']],
                    obj_types_to_search_for,
                    value_extractor
                ) for property_spec in schema['properties']]))

        return result


class Outcome(python_utils.OBJECT):
    """Value object representing an outcome of an interaction. An outcome
    consists of a destination state, feedback to show the user, and any
    parameter changes.
    """

    def to_dict(self):
        """Returns a dict representing this Outcome domain object.

        Returns:
            dict. A dict, mapping all fields of Outcome instance.
        """
        return {
            'dest': self.dest,
            'feedback': self.feedback.to_dict(),
            'labelled_as_correct': self.labelled_as_correct,
            'param_changes': [
                param_change.to_dict() for param_change in self.param_changes],
            'refresher_exploration_id': self.refresher_exploration_id,
            'missing_prerequisite_skill_id': self.missing_prerequisite_skill_id
        }

    @classmethod
    def from_dict(cls, outcome_dict):
        """Return a Outcome domain object from a dict.

        Args:
            outcome_dict: dict. The dict representation of Outcome object.

        Returns:
            Outcome. The corresponding Outcome domain object.
        """
        feedback = SubtitledHtml.from_dict(outcome_dict['feedback'])
        feedback.validate()
        return cls(
            outcome_dict['dest'],
            feedback,
            outcome_dict['labelled_as_correct'],
            [param_domain.ParamChange(
                param_change['name'], param_change['generator_id'],
                param_change['customization_args'])
             for param_change in outcome_dict['param_changes']],
            outcome_dict['refresher_exploration_id'],
            outcome_dict['missing_prerequisite_skill_id']
        )

    def __init__(
            self, dest, feedback, labelled_as_correct, param_changes,
            refresher_exploration_id, missing_prerequisite_skill_id):
        """Initializes a Outcome domain object.

        Args:
            dest: str. The name of the destination state.
            feedback: SubtitledHtml. Feedback to give to the user if this rule
                is triggered.
            labelled_as_correct: bool. Whether this outcome has been labelled
                by the creator as corresponding to a "correct" answer.
            param_changes: list(ParamChange). List of exploration-level
                parameter changes to make if this rule is triggered.
            refresher_exploration_id: str or None. An optional exploration ID
                to redirect the learner to if they seem to lack understanding
                of a prerequisite concept. This should only exist if the
                destination state for this outcome is a self-loop.
            missing_prerequisite_skill_id: str or None. The id of the skill that
                this answer group tests. If this is not None, the exploration
                player would redirect to this skill when a learner receives this
                outcome.
        """
        # Id of the destination state.
        # TODO(sll): Check that this state actually exists.
        self.dest = dest
        # Feedback to give the reader if this rule is triggered.
        self.feedback = feedback
        # Whether this outcome has been labelled by the creator as
        # corresponding to a "correct" answer.
        self.labelled_as_correct = labelled_as_correct
        # Exploration-level parameter changes to make if this rule is
        # triggered.
        self.param_changes = param_changes or []
        # An optional exploration ID to redirect the learner to if they lack
        # understanding of a prerequisite concept. This should only exist if
        # the destination state for this outcome is a self-loop.
        self.refresher_exploration_id = refresher_exploration_id
        # An optional skill id whose concept card would be shown to the learner
        # when the learner receives this outcome.
        self.missing_prerequisite_skill_id = missing_prerequisite_skill_id

    def validate(self):
        """Validates various properties of the Outcome.

        Raises:
            ValidationError. One or more attributes of the Outcome are invalid.
        """
        self.feedback.validate()

        if not isinstance(self.labelled_as_correct, bool):
            raise utils.ValidationError(
                'The "labelled_as_correct" field should be a boolean, received '
                '%s' % self.labelled_as_correct)

        if self.missing_prerequisite_skill_id is not None:
            if not isinstance(
                    self.missing_prerequisite_skill_id,
                    python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected outcome missing_prerequisite_skill_id to be a '
                    'string, received %s' % self.missing_prerequisite_skill_id)

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected outcome param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()

        if self.refresher_exploration_id is not None:
            if not isinstance(
                    self.refresher_exploration_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected outcome refresher_exploration_id to be a string, '
                    'received %s' % self.refresher_exploration_id)

    @staticmethod
    def convert_html_in_outcome(outcome_dict, conversion_fn):
        """Checks for HTML fields in the outcome and converts it
        according to the conversion function.

        Args:
            outcome_dict: dict. The outcome dict.
            conversion_fn: function. The function to be used for converting the
                HTML.

        Returns:
            dict. The converted outcome dict.
        """
        outcome_dict['feedback']['html'] = (
            conversion_fn(outcome_dict['feedback']['html']))
        return outcome_dict


class Voiceover(python_utils.OBJECT):
    """Value object representing an voiceover."""

    def to_dict(self):
        """Returns a dict representing this Voiceover domain object.

        Returns:
            dict. A dict, mapping all fields of Voiceover instance.
        """
        return {
            'filename': self.filename,
            'file_size_bytes': self.file_size_bytes,
            'needs_update': self.needs_update,
            'duration_secs': self.duration_secs
        }

    @classmethod
    def from_dict(cls, voiceover_dict):
        """Return a Voiceover domain object from a dict.

        Args:
            voiceover_dict: dict. The dict representation of
                Voiceover object.

        Returns:
            Voiceover. The corresponding Voiceover domain object.
        """
        return cls(
            voiceover_dict['filename'],
            voiceover_dict['file_size_bytes'],
            voiceover_dict['needs_update'],
            voiceover_dict['duration_secs'])

    def __init__(self, filename, file_size_bytes, needs_update, duration_secs):
        """Initializes a Voiceover domain object.

        Args:
            filename: str. The corresponding voiceover file path.
            file_size_bytes: int. The file size, in bytes. Used to display
                potential bandwidth usage to the learner before they download
                the file.
            needs_update: bool. Whether voiceover is marked for needing review.
            duration_secs: float. The duration in seconds for the voiceover
                recording.
        """
        # str. The corresponding audio file path, e.g.
        # "content-en-2-h7sjp8s.mp3".
        self.filename = filename
        # int. The file size, in bytes. Used to display potential bandwidth
        # usage to the learner before they download the file.
        self.file_size_bytes = file_size_bytes
        # bool. Whether audio is marked for needing review.
        self.needs_update = needs_update
        # float. The duration in seconds for the voiceover recording.
        self.duration_secs = duration_secs

    def validate(self):
        """Validates properties of the Voiceover.

        Raises:
            ValidationError. One or more attributes of the Voiceover are
                invalid.
        """
        if not isinstance(self.filename, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected audio filename to be a string, received %s' %
                self.filename)
        dot_index = self.filename.rfind('.')
        if dot_index == -1 or dot_index == 0:
            raise utils.ValidationError(
                'Invalid audio filename: %s' % self.filename)
        extension = self.filename[dot_index + 1:]
        if extension not in feconf.ACCEPTED_AUDIO_EXTENSIONS:
            raise utils.ValidationError(
                'Invalid audio filename: it should have one of '
                'the following extensions: %s. Received: %s' % (
                    list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()),
                    self.filename))

        if not isinstance(self.file_size_bytes, int):
            raise utils.ValidationError(
                'Expected file size to be an int, received %s' %
                self.file_size_bytes)
        if self.file_size_bytes <= 0:
            raise utils.ValidationError(
                'Invalid file size: %s' % self.file_size_bytes)

        if not isinstance(self.needs_update, bool):
            raise utils.ValidationError(
                'Expected needs_update to be a bool, received %s' %
                self.needs_update)
        if not isinstance(self.duration_secs, float):
            raise utils.ValidationError(
                'Expected duration_secs to be a float, received %s' %
                self.duration_secs)
        if self.duration_secs < 0:
            raise utils.ValidationError(
                'Expected duration_secs to be positive number, '
                'or zero if not yet specified %s' %
                self.duration_secs)


class WrittenTranslation(python_utils.OBJECT):
    """Value object representing a written translation for a content.

    Here, "content" could mean a string or a list of strings. The latter arises,
    for example, in the case where we are checking for equality of a learner's
    answer against a given set of strings. In such cases, the number of strings
    in the translation of the original object may not be the same as the number
    of strings in the original object.
    """

    DATA_FORMAT_HTML = 'html'
    DATA_FORMAT_UNICODE_STRING = 'unicode'
    DATA_FORMAT_SET_OF_NORMALIZED_STRING = 'set_of_normalized_string'
    DATA_FORMAT_SET_OF_UNICODE_STRING = 'set_of_unicode_string'

    DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE = {
        DATA_FORMAT_HTML: 'TranslatableHtml',
        DATA_FORMAT_UNICODE_STRING: 'TranslatableUnicodeString',
        DATA_FORMAT_SET_OF_NORMALIZED_STRING: (
            'TranslatableSetOfNormalizedString'),
        DATA_FORMAT_SET_OF_UNICODE_STRING: 'TranslatableSetOfUnicodeString',
    }

    def __init__(self, data_format, translation, needs_update):
        """Initializes a WrittenTranslation domain object.

        Args:
            data_format: str. One of the keys in
                DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE. Indicates the
                type of the field (html, unicode, etc.).
            translation: str|list(str). A user-submitted string or list of
                strings that matches the given data format.
            needs_update: bool. Whether the translation is marked as needing
                review.
        """
        self.data_format = data_format
        self.translation = translation
        self.needs_update = needs_update

    def to_dict(self):
        """Returns a dict representing this WrittenTranslation domain object.

        Returns:
            dict. A dict, mapping all fields of WrittenTranslation instance.
        """
        return {
            'data_format': self.data_format,
            'translation': self.translation,
            'needs_update': self.needs_update,
        }

    @classmethod
    def from_dict(cls, written_translation_dict):
        """Return a WrittenTranslation domain object from a dict.

        Args:
            written_translation_dict: dict. The dict representation of
                WrittenTranslation object.

        Returns:
            WrittenTranslation. The corresponding WrittenTranslation domain
            object.
        """
        return cls(
            written_translation_dict['data_format'],
            written_translation_dict['translation'],
            written_translation_dict['needs_update'])

    def validate(self):
        """Validates properties of the WrittenTranslation, normalizing the
        translation if needed.

        Raises:
            ValidationError. One or more attributes of the WrittenTranslation
                are invalid.
        """
        if self.data_format not in (
                self.DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE):
            raise utils.ValidationError(
                'Invalid data_format: %s' % self.data_format)

        translatable_class_name = (
            self.DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE[self.data_format])
        translatable_obj_class = (
            translatable_object_registry.Registry.get_object_class(
                translatable_class_name))
        self.translation = translatable_obj_class.normalize_value(
            self.translation)

        if not isinstance(self.needs_update, bool):
            raise utils.ValidationError(
                'Expected needs_update to be a bool, received %s' %
                self.needs_update)


class WrittenTranslations(python_utils.OBJECT):
    """Value object representing a content translations which stores
    translated contents of all state contents (like hints, feedback etc.) in
    different languages linked through their content_id.
    """

    def __init__(self, translations_mapping):
        """Initializes a WrittenTranslations domain object.

        Args:
            translations_mapping: dict. A dict mapping the content Ids
                to the dicts which is the map of abbreviated code of the
                languages to WrittenTranslation objects.
        """
        self.translations_mapping = translations_mapping

    def to_dict(self):
        """Returns a dict representing this WrittenTranslations domain object.

        Returns:
            dict. A dict, mapping all fields of WrittenTranslations instance.
        """
        translations_mapping = {}
        for (content_id, language_code_to_written_translation) in (
                self.translations_mapping.items()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                translations_mapping[content_id][language_code] = (
                    written_translation.to_dict())
        written_translations_dict = {
            'translations_mapping': translations_mapping
        }

        return written_translations_dict

    @classmethod
    def from_dict(cls, written_translations_dict):
        """Return a WrittenTranslations domain object from a dict.

        Args:
            written_translations_dict: dict. The dict representation of
                WrittenTranslations object.

        Returns:
            WrittenTranslations. The corresponding WrittenTranslations domain
            object.
        """
        translations_mapping = {}
        for (content_id, language_code_to_written_translation) in (
                written_translations_dict['translations_mapping'].items()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                translations_mapping[content_id][language_code] = (
                    WrittenTranslation.from_dict(written_translation))

        return cls(translations_mapping)

    def get_content_ids_that_are_correctly_translated(self, language_code):
        """Returns a list of content ids in which a correct translation is
        available in the given language.

        Args:
            language_code: str. The abbreviated code of the language.

        Returns:
            list(str). A list of content ids in which the translations are
            available in the given language.
        """
        correctly_translated_content_ids = []
        for content_id, translations in self.translations_mapping.items():
            if language_code in translations and not (
                    translations[language_code].needs_update):
                correctly_translated_content_ids.append(content_id)

        return correctly_translated_content_ids

    def add_translation(self, content_id, language_code, html):
        """Adds a translation for the given content id in a given language.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code of the translated html.
            html: str. The translated html.
        """
        written_translation = WrittenTranslation(
            WrittenTranslation.DATA_FORMAT_HTML, html, False)
        self.translations_mapping[content_id][language_code] = (
            written_translation)

    def mark_written_translations_as_needing_update(self, content_id):
        """Marks translation as needing update for the given content id in all
        languages.

        Args:
            content_id: str. The id of the content.
        """
        for (language_code, written_translation) in (
                self.translations_mapping[content_id].items()):
            written_translation.needs_update = True
            self.translations_mapping[content_id][language_code] = (
                written_translation)

    def validate(self, expected_content_id_list):
        """Validates properties of the WrittenTranslations.

        Args:
            expected_content_id_list: list(str). A list of content id which are
                expected to be inside they WrittenTranslations.

        Raises:
            ValidationError. One or more attributes of the WrittenTranslations
                are invalid.
        """
        if expected_content_id_list is not None:
            if not set(self.translations_mapping.keys()) == (
                    set(expected_content_id_list)):
                raise utils.ValidationError(
                    'Expected state written_translations to match the listed '
                    'content ids %s, found %s' % (
                        expected_content_id_list,
                        list(self.translations_mapping.keys()))
                    )

        for (content_id, language_code_to_written_translation) in (
                self.translations_mapping.items()):
            if not isinstance(content_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected content_id to be a string, received %s'
                    % content_id)
            if not isinstance(language_code_to_written_translation, dict):
                raise utils.ValidationError(
                    'Expected content_id value to be a dict, received %s'
                    % language_code_to_written_translation)
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                if not isinstance(language_code, python_utils.BASESTRING):
                    raise utils.ValidationError(
                        'Expected language_code to be a string, received %s'
                        % language_code)
                # Currently, we assume written translations are used by the
                # voice-artist to voiceover the translated text so written
                # translations can be in supported audio/voiceover languages.
                allowed_language_codes = [language['id'] for language in (
                    constants.SUPPORTED_AUDIO_LANGUAGES)]
                if language_code not in allowed_language_codes:
                    raise utils.ValidationError(
                        'Invalid language_code: %s' % language_code)

                written_translation.validate()

    def get_content_ids_for_text_translation(self):
        """Returns a list of content_id available for text translation.

        Returns:
            list(str). A list of content id available for text translation.
        """
        return list(self.translations_mapping.keys())

    def get_translated_content(self, content_id, language_code):
        """Returns the translated content for the given content_id in the given
        language.

        Args:
            content_id: str. The ID of the content.
            language_code: str. The language code for the translated content.

        Returns:
            str. The translated content for a given content id in a language.

        Raises:
            Exception. Translation doesn't exist in the given language.
            Exception. The given content id doesn't exist.
        """
        if content_id in self.translations_mapping:
            if language_code in self.translations_mapping[content_id]:
                return self.translations_mapping[
                    content_id][language_code].translation
            else:
                raise Exception(
                    'Translation for the given content_id %s does not exist in '
                    '%s language code' % (content_id, language_code))
        else:
            raise Exception('Invalid content_id: %s' % content_id)

    def add_content_id_for_translation(self, content_id):
        """Adds a content id as a key for the translation into the
        content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
        """
        if not isinstance(content_id, python_utils.BASESTRING):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id in self.translations_mapping:
            raise Exception(
                'The content_id %s already exist.' % content_id)
        else:
            self.translations_mapping[content_id] = {}

    def delete_content_id_for_translation(self, content_id):
        """Deletes a content id from the content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
        """
        if not isinstance(content_id, python_utils.BASESTRING):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id not in self.translations_mapping:
            raise Exception(
                'The content_id %s does not exist.' % content_id)
        else:
            self.translations_mapping.pop(content_id, None)

    def get_all_html_content_strings(self):
        """Gets all html content strings used in the WrittenTranslations.

        Returns:
            list(str). The list of html content strings.
        """
        html_string_list = []
        for translations in self.translations_mapping.values():
            for written_translation in translations.values():
                if (written_translation.data_format ==
                        WrittenTranslation.DATA_FORMAT_HTML):
                    html_string_list.append(written_translation.translation)
        return html_string_list

    @staticmethod
    def convert_html_in_written_translations(
            written_translations_dict, conversion_fn):
        """Checks for HTML fields in the written translations and converts it
        according to the conversion function.

        Args:
            written_translations_dict: dict. The written translations dict.
            conversion_fn: function. The function to be used for converting the
                HTML.

        Returns:
            dict. The converted written translations dict.
        """
        for content_id, language_code_to_written_translation in (
                written_translations_dict['translations_mapping'].items()):
            for language_code in (
                    language_code_to_written_translation.keys()):
                translation_dict = written_translations_dict[
                    'translations_mapping'][content_id][language_code]
                if 'data_format' in translation_dict:
                    if (translation_dict['data_format'] ==
                            WrittenTranslation.DATA_FORMAT_HTML):
                        written_translations_dict['translations_mapping'][
                            content_id][language_code]['translation'] = (
                                conversion_fn(written_translations_dict[
                                    'translations_mapping'][content_id][
                                        language_code]['translation'])
                            )
                elif 'html' in translation_dict:
                    # TODO(#11950): Delete this once old schema migration
                    # functions are deleted.
                    # This "elif" branch is needed because, in states schema
                    # v33, this function is called but the dict is still in the
                    # old format (that doesn't have a "data_format" key).
                    written_translations_dict['translations_mapping'][
                        content_id][language_code]['html'] = (
                            conversion_fn(translation_dict['html']))

        return written_translations_dict


class RecordedVoiceovers(python_utils.OBJECT):
    """Value object representing a recorded voiceovers which stores voiceover of
    all state contents (like hints, feedback etc.) in different languages linked
    through their content_id.
    """

    def __init__(self, voiceovers_mapping):
        """Initializes a RecordedVoiceovers domain object.

        Args:
            voiceovers_mapping: dict. A dict mapping the content Ids
                to the dicts which is the map of abbreviated code of the
                languages to the Voiceover objects.
        """
        self.voiceovers_mapping = voiceovers_mapping

    def to_dict(self):
        """Returns a dict representing this RecordedVoiceovers domain object.

        Returns:
            dict. A dict, mapping all fields of RecordedVoiceovers instance.
        """
        voiceovers_mapping = {}
        for (content_id, language_code_to_voiceover) in (
                self.voiceovers_mapping.items()):
            voiceovers_mapping[content_id] = {}
            for (language_code, voiceover) in (
                    language_code_to_voiceover.items()):
                voiceovers_mapping[content_id][language_code] = (
                    voiceover.to_dict())
        recorded_voiceovers_dict = {
            'voiceovers_mapping': voiceovers_mapping
        }

        return recorded_voiceovers_dict

    @classmethod
    def from_dict(cls, recorded_voiceovers_dict):
        """Return a RecordedVoiceovers domain object from a dict.

        Args:
            recorded_voiceovers_dict: dict. The dict representation of
                RecordedVoiceovers object.

        Returns:
            RecordedVoiceovers. The corresponding RecordedVoiceovers domain
            object.
        """
        voiceovers_mapping = {}
        for (content_id, language_code_to_voiceover) in (
                recorded_voiceovers_dict['voiceovers_mapping'].items()):
            voiceovers_mapping[content_id] = {}
            for (language_code, voiceover) in (
                    language_code_to_voiceover.items()):
                voiceovers_mapping[content_id][language_code] = (
                    Voiceover.from_dict(voiceover))

        return cls(voiceovers_mapping)

    def validate(self, expected_content_id_list):
        """Validates properties of the RecordedVoiceovers.

        Args:
            expected_content_id_list: list(str). A list of content id which are
                expected to be inside the RecordedVoiceovers.

        Raises:
            ValidationError. One or more attributes of the RecordedVoiceovers
                are invalid.
        """
        if expected_content_id_list is not None:
            if not set(self.voiceovers_mapping.keys()) == (
                    set(expected_content_id_list)):
                raise utils.ValidationError(
                    'Expected state recorded_voiceovers to match the listed '
                    'content ids %s, found %s' % (
                        expected_content_id_list,
                        list(self.voiceovers_mapping.keys()))
                    )

        for (content_id, language_code_to_voiceover) in (
                self.voiceovers_mapping.items()):
            if not isinstance(content_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected content_id to be a string, received %s'
                    % content_id)
            if not isinstance(language_code_to_voiceover, dict):
                raise utils.ValidationError(
                    'Expected content_id value to be a dict, received %s'
                    % language_code_to_voiceover)
            for (language_code, voiceover) in (
                    language_code_to_voiceover.items()):
                if not isinstance(language_code, python_utils.BASESTRING):
                    raise utils.ValidationError(
                        'Expected language_code to be a string, received %s'
                        % language_code)
                allowed_language_codes = [language['id'] for language in (
                    constants.SUPPORTED_AUDIO_LANGUAGES)]
                if language_code not in allowed_language_codes:
                    raise utils.ValidationError(
                        'Invalid language_code: %s' % language_code)

                voiceover.validate()

    def get_content_ids_for_voiceovers(self):
        """Returns a list of content_id available for voiceover.

        Returns:
            list(str). A list of content id available for voiceover.
        """
        return list(self.voiceovers_mapping.keys())

    def strip_all_existing_voiceovers(self):
        """Strips all existing voiceovers from the voiceovers_mapping."""
        for content_id in self.voiceovers_mapping.keys():
            self.voiceovers_mapping[content_id] = {}

    def add_content_id_for_voiceover(self, content_id):
        """Adds a content id as a key for the voiceover into the
        voiceovers_mapping dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
            Exception. The content id already exist in the voiceovers_mapping
                dict.
        """
        if not isinstance(content_id, python_utils.BASESTRING):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id in self.voiceovers_mapping:
            raise Exception(
                'The content_id %s already exist.' % content_id)

        self.voiceovers_mapping[content_id] = {}

    def delete_content_id_for_voiceover(self, content_id):
        """Deletes a content id from the voiceovers_mapping dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
            Exception. The content id does not exist in the voiceovers_mapping
                dict.
        """
        if not isinstance(content_id, python_utils.BASESTRING):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id not in self.voiceovers_mapping:
            raise Exception(
                'The content_id %s does not exist.' % content_id)
        else:
            self.voiceovers_mapping.pop(content_id, None)


class RuleSpec(python_utils.OBJECT):
    """Value object representing a rule specification."""

    def __init__(self, rule_type, inputs):
        """Initializes a RuleSpec domain object.

        Args:
            rule_type: str. The rule type, e.g. "CodeContains" or "Equals". A
                full list of rule types can be found in
                extensions/interactions/rule_templates.json.
            inputs: dict. The values of the parameters needed in order to fully
                specify the rule. The keys for this dict can be deduced from
                the relevant description field in
                extensions/interactions/rule_templates.json -- they are
                enclosed in {{...}} braces.
        """
        self.rule_type = rule_type
        self.inputs = inputs

    def to_dict(self):
        """Returns a dict representing this RuleSpec domain object.

        Returns:
            dict. A dict, mapping all fields of RuleSpec instance.
        """
        return {
            'rule_type': self.rule_type,
            'inputs': self.inputs,
        }

    @classmethod
    def from_dict(cls, rulespec_dict):
        """Return a RuleSpec domain object from a dict.

        Args:
            rulespec_dict: dict. The dict representation of RuleSpec object.

        Returns:
            RuleSpec. The corresponding RuleSpec domain object.
        """
        return cls(
            rulespec_dict['rule_type'],
            rulespec_dict['inputs']
        )

    def validate(self, rule_params_list, exp_param_specs_dict):
        """Validates a RuleSpec value object. It ensures the inputs dict does
        not refer to any non-existent parameters and that it contains values
        for all the parameters the rule expects.

        Args:
            rule_params_list: list(str, object(*)). A list of parameters used by
                the rule represented by this RuleSpec instance, to be used to
                validate the inputs of this RuleSpec. Each element of the list
                represents a single parameter and is a tuple with two elements:
                    0: The name (string) of the parameter.
                    1: The typed object instance for that
                        parameter (e.g. Real).
            exp_param_specs_dict: dict. A dict of specified parameters used in
                this exploration. Keys are parameter names and values are
                ParamSpec value objects with an object type property (obj_type).
                RuleSpec inputs may have a parameter value which refers to one
                of these exploration parameters.

        Raises:
            ValidationError. One or more attributes of the RuleSpec are
                invalid.
        """
        if not isinstance(self.inputs, dict):
            raise utils.ValidationError(
                'Expected inputs to be a dict, received %s' % self.inputs)
        input_key_set = set(self.inputs.keys())
        param_names_set = set([rp[0] for rp in rule_params_list])
        leftover_input_keys = input_key_set - param_names_set
        leftover_param_names = param_names_set - input_key_set

        # Check if there are input keys which are not rule parameters.
        if leftover_input_keys:
            logging.warning(
                'RuleSpec \'%s\' has inputs which are not recognized '
                'parameter names: %s' % (self.rule_type, leftover_input_keys))

        # Check if there are missing parameters.
        if leftover_param_names:
            raise utils.ValidationError(
                'RuleSpec \'%s\' is missing inputs: %s'
                % (self.rule_type, leftover_param_names))

        rule_params_dict = {rp[0]: rp[1] for rp in rule_params_list}
        for (param_name, param_value) in self.inputs.items():
            param_obj = rule_params_dict[param_name]
            # Validate the parameter type given the value.
            if isinstance(
                    param_value,
                    python_utils.BASESTRING) and '{{' in param_value:
                # Value refers to a parameter spec. Cross-validate the type of
                # the parameter spec with the rule parameter.
                start_brace_index = param_value.index('{{') + 2
                end_brace_index = param_value.index('}}')
                param_spec_name = param_value[
                    start_brace_index:end_brace_index]
                if param_spec_name not in exp_param_specs_dict:
                    raise utils.ValidationError(
                        'RuleSpec \'%s\' has an input with name \'%s\' which '
                        'refers to an unknown parameter within the '
                        'exploration: %s' % (
                            self.rule_type, param_name, param_spec_name))
                # TODO(bhenning): The obj_type of the param_spec
                # (exp_param_specs_dict[param_spec_name]) should be validated
                # to be the same as param_obj.__name__ to ensure the rule spec
                # can accept the type of the parameter.
            else:
                # Otherwise, a simple parameter value needs to be normalizable
                # by the parameter object in order to be valid.
                param_obj.normalize(param_value)

    @staticmethod
    def convert_html_in_rule_spec(
            rule_spec_dict, conversion_fn, html_field_types_to_rule_specs):
        """Checks for HTML fields in a Rule Spec and converts it according
        to the conversion function.

        Args:
            rule_spec_dict: dict. The Rule Spec dict.
            conversion_fn: function. The function to be used for converting the
                HTML.
            html_field_types_to_rule_specs: dict. A dictionary that specifies
                the locations of html fields in rule specs. It is defined as a
                mapping of rule input types to a dictionary containing
                interaction id, format, and rule types. See
                html_field_types_to_rule_specs_state_v41.json for an example.

        Returns:
            dict. The converted Rule Spec dict.
        """
        # TODO(#9413): Find a way to include a reference to the interaction
        # type in the Draft change lists.
        # See issue: https://github.com/oppia/oppia/issues/9413. We cannot use
        # the interaction-id from the rules_index_dict until issue-9413 has
        # been fixed, because this method has no reference to the interaction
        # type and draft changes use this method. The rules_index_dict below
        # is used to figure out the assembly of the html in the rulespecs.
        for interaction_and_rule_details in (
                html_field_types_to_rule_specs.values()):
            rule_type_has_html = (
                rule_spec_dict['rule_type'] in
                interaction_and_rule_details['ruleTypes'].keys())
            if rule_type_has_html:
                html_type_format = interaction_and_rule_details['format']
                input_variables_from_html_mapping = (
                    interaction_and_rule_details['ruleTypes'][
                        rule_spec_dict['rule_type']][
                            'htmlInputVariables'])
                input_variable_match_found = False
                for input_variable in rule_spec_dict['inputs'].keys():
                    if input_variable in input_variables_from_html_mapping:
                        input_variable_match_found = True
                        rule_input_variable = (
                            rule_spec_dict['inputs'][input_variable])
                        if (html_type_format ==
                                feconf.HTML_RULE_VARIABLE_FORMAT_STRING):
                            rule_spec_dict['inputs'][input_variable] = (
                                conversion_fn(
                                    rule_spec_dict['inputs'][input_variable]))
                        elif (html_type_format ==
                              feconf.HTML_RULE_VARIABLE_FORMAT_SET):
                            # Here we are checking the type of the
                            # rule_specs.inputs because the rule type
                            # 'Equals' is used by other interactions as
                            # well which don't have HTML and we don't have
                            # a reference to the interaction ID.
                            if isinstance(rule_input_variable, list):
                                for value_index, value in enumerate(
                                        rule_input_variable):
                                    if isinstance(
                                            value, python_utils.BASESTRING):
                                        rule_spec_dict['inputs'][
                                            input_variable][value_index] = (
                                                conversion_fn(value))
                        elif (html_type_format ==
                              feconf.HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS):
                            for list_index, html_list in enumerate(
                                    rule_spec_dict['inputs'][input_variable]):
                                for rule_html_index, rule_html in enumerate(
                                        html_list):
                                    rule_spec_dict['inputs'][input_variable][
                                        list_index][rule_html_index] = (
                                            conversion_fn(rule_html))
                        else:
                            raise Exception(
                                'The rule spec does not belong to a valid'
                                ' format.')
                if not input_variable_match_found:
                    raise Exception(
                        'Rule spec should have at least one valid input '
                        'variable with Html in it.')

        return rule_spec_dict


class SubtitledHtml(python_utils.OBJECT):
    """Value object representing subtitled HTML."""

    def __init__(self, content_id, html):
        """Initializes a SubtitledHtml domain object. Note that initializing
        the SubtitledHtml object does not clean the html. This is because we
        sometimes need to initialize SubtitledHtml and migrate the contained
        html from an old schema, but the cleaner would remove invalid tags
        and attributes before having a chance to migrate it. An example where
        this functionality is required is
        InteractionInstance.convert_html_in_interaction. Before saving the
        SubtitledHtml object, validate() should be called for validation and
        cleaning of the html.

        Args:
            content_id: str. A unique id referring to the other assets for this
                content.
            html: str. A piece of user-submitted HTML. Note that this is NOT
                cleaned in such a way as to contain a restricted set of HTML
                tags. To clean it, the validate() method must be called.
        """
        self.content_id = content_id
        self.html = html

    def to_dict(self):
        """Returns a dict representing this SubtitledHtml domain object.

        Returns:
            dict. A dict, mapping all fields of SubtitledHtml instance.
        """
        return {
            'content_id': self.content_id,
            'html': self.html
        }

    @classmethod
    def from_dict(cls, subtitled_html_dict):
        """Return a SubtitledHtml domain object from a dict.

        Args:
            subtitled_html_dict: dict. The dict representation of SubtitledHtml
                object.

        Returns:
            SubtitledHtml. The corresponding SubtitledHtml domain object.
        """
        return cls(
            subtitled_html_dict['content_id'], subtitled_html_dict['html'])

    def validate(self):
        """Validates properties of the SubtitledHtml, and cleans the html.

        Raises:
            ValidationError. One or more attributes of the SubtitledHtml are
                invalid.
        """
        if not isinstance(self.content_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected content id to be a string, received %s' %
                self.content_id)

        if not isinstance(self.html, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Invalid content HTML: %s' % self.html)

        self.html = html_cleaner.clean(self.html)

    @classmethod
    def create_default_subtitled_html(cls, content_id):
        """Create a default SubtitledHtml domain object.

        Args:
            content_id: str. The id of the content.

        Returns:
            SubtitledHtml. A default SubtitledHtml domain object, some
            attribute of that object will be ''.
        """
        return cls(content_id, '')


class SubtitledUnicode(python_utils.OBJECT):
    """Value object representing subtitled unicode."""

    def __init__(self, content_id, unicode_str):
        """Initializes a SubtitledUnicode domain object.

        Args:
            content_id: str. A unique id referring to the other assets for this
                content.
            unicode_str: str. A piece of user-submitted unicode.
        """
        self.content_id = content_id
        self.unicode_str = unicode_str
        self.validate()

    def to_dict(self):
        """Returns a dict representing this SubtitledUnicode domain object.

        Returns:
            dict. A dict, mapping all fields of SubtitledUnicode instance.
        """
        return {
            'content_id': self.content_id,
            'unicode_str': self.unicode_str
        }

    @classmethod
    def from_dict(cls, subtitled_unicode_dict):
        """Return a SubtitledUnicode domain object from a dict.

        Args:
            subtitled_unicode_dict: dict. The dict representation of
                SubtitledUnicode object.

        Returns:
            SubtitledUnicode. The corresponding SubtitledUnicode domain object.
        """
        return cls(
            subtitled_unicode_dict['content_id'],
            subtitled_unicode_dict['unicode_str']
        )

    def validate(self):
        """Validates properties of the SubtitledUnicode.

        Raises:
            ValidationError. One or more attributes of the SubtitledUnicode are
                invalid.
        """
        if not isinstance(self.content_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected content id to be a string, received %s' %
                self.content_id)

        if not isinstance(self.unicode_str, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Invalid content unicode: %s' % self.unicode_str)

    @classmethod
    def create_default_subtitled_unicode(cls, content_id):
        """Create a default SubtitledUnicode domain object.

        Args:
            content_id: str. The id of the content.

        Returns:
            SubtitledUnicode. A default SubtitledUnicode domain object.
        """
        return cls(content_id, '')


class State(python_utils.OBJECT):
    """Domain object for a state."""

    def __init__(
            self, content, param_changes, interaction, recorded_voiceovers,
            written_translations, solicit_answer_details, card_is_checkpoint,
            next_content_id_index, linked_skill_id=None,
            classifier_model_id=None):
        """Initializes a State domain object.

        Args:
            content: SubtitledHtml. The contents displayed to the reader in this
                state.
            param_changes: list(ParamChange). Parameter changes associated with
                this state.
            interaction: InteractionInstance. The interaction instance
                associated with this state.
            recorded_voiceovers: RecordedVoiceovers. The recorded voiceovers for
                the state contents and translations.
            written_translations: WrittenTranslations. The written translations
                for the state contents.
            solicit_answer_details: bool. Whether the creator wants to ask
                for answer details from the learner about why they picked a
                particular answer while playing the exploration.
            card_is_checkpoint: bool. If the card is marked as a checkpoint by
                the creator or not.
            next_content_id_index: int. The next content_id index to use for
                generation of new content_ids.
            linked_skill_id: str or None. The linked skill ID associated with
                this state.
            classifier_model_id: str or None. The classifier model ID
                associated with this state, if applicable.
        """
        # The content displayed to the reader in this state.
        self.content = content
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args
        ) for param_change in param_changes]
        # The interaction instance associated with this state.
        self.interaction = InteractionInstance(
            interaction.id, interaction.customization_args,
            interaction.answer_groups, interaction.default_outcome,
            interaction.confirmed_unclassified_answers,
            interaction.hints, interaction.solution)
        self.classifier_model_id = classifier_model_id
        self.recorded_voiceovers = recorded_voiceovers
        self.linked_skill_id = linked_skill_id
        self.written_translations = written_translations
        self.solicit_answer_details = solicit_answer_details
        self.card_is_checkpoint = card_is_checkpoint
        self.next_content_id_index = next_content_id_index

    def validate(self, exp_param_specs_dict, allow_null_interaction):
        """Validates various properties of the State.

        Args:
            exp_param_specs_dict: dict or None. A dict of specified parameters
                used in this exploration. Keys are parameter names and values
                are ParamSpec value objects with an object type
                property(obj_type). It is None if the state belongs to a
                question.
            allow_null_interaction: bool. Whether this state's interaction is
                allowed to be unspecified.

        Raises:
            ValidationError. One or more attributes of the State are invalid.
        """
        self.content.validate()

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected state param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()

        if not allow_null_interaction and self.interaction.id is None:
            raise utils.ValidationError(
                'This state does not have any interaction specified.')
        elif self.interaction.id is not None:
            self.interaction.validate(exp_param_specs_dict)

        content_id_list = []
        content_id_list.append(self.content.content_id)
        for answer_group in self.interaction.answer_groups:
            feedback_content_id = answer_group.outcome.feedback.content_id
            if feedback_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s' % feedback_content_id)
            content_id_list.append(feedback_content_id)

            for rule_spec in answer_group.rule_specs:
                for param_name, value in rule_spec.inputs.items():
                    param_type = (
                        interaction_registry.Registry.get_interaction_by_id(
                            self.interaction.id
                        ).get_rule_param_type(rule_spec.rule_type, param_name))

                    if issubclass(param_type, objects.BaseTranslatableObject):
                        if value['contentId'] in content_id_list:
                            raise utils.ValidationError(
                                'Found a duplicate content '
                                'id %s' % value['contentId'])
                        content_id_list.append(value['contentId'])

        if self.interaction.default_outcome:
            default_outcome_content_id = (
                self.interaction.default_outcome.feedback.content_id)
            if default_outcome_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s'
                    % default_outcome_content_id)
            content_id_list.append(default_outcome_content_id)
        for hint in self.interaction.hints:
            hint_content_id = hint.hint_content.content_id
            if hint_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s' % hint_content_id)
            content_id_list.append(hint_content_id)
        if self.interaction.solution:
            solution_content_id = (
                self.interaction.solution.explanation.content_id)
            if solution_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s' % solution_content_id)
            content_id_list.append(solution_content_id)

        if self.interaction.id is not None:
            for ca_name in self.interaction.customization_args:
                content_id_list.extend(
                    self.interaction.customization_args[ca_name]
                    .get_content_ids()
                )

        if len(set(content_id_list)) != len(content_id_list):
            raise utils.ValidationError(
                'Expected all content_ids to be unique, '
                'received %s' % content_id_list)

        for content_id in content_id_list:
            content_id_suffix = content_id.split('_')[-1]

            # Possible values of content_id_suffix are a digit, or from
            # a 'outcome' (from 'default_outcome'). If the content_id_suffix
            # is not a digit, we disregard it here.
            if (
                    content_id_suffix.isdigit() and
                    int(content_id_suffix) > self.next_content_id_index
            ):
                raise utils.ValidationError(
                    'Expected all content id indexes to be less than the "next '
                    'content id index", but received content id %s' % content_id
                )

        if not isinstance(self.solicit_answer_details, bool):
            raise utils.ValidationError(
                'Expected solicit_answer_details to be a boolean, '
                'received %s' % self.solicit_answer_details)
        if self.solicit_answer_details:
            if self.interaction.id in (
                    constants.INTERACTION_IDS_WITHOUT_ANSWER_DETAILS):
                raise utils.ValidationError(
                    'The %s interaction does not support soliciting '
                    'answer details from learners.' % (self.interaction.id))

        if not isinstance(self.card_is_checkpoint, bool):
            raise utils.ValidationError(
                'Expected card_is_checkpoint to be a boolean, '
                'received %s' % self.card_is_checkpoint)

        self.written_translations.validate(content_id_list)
        self.recorded_voiceovers.validate(content_id_list)

        if self.linked_skill_id is not None:
            if not isinstance(
                    self.linked_skill_id,
                    python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected linked_skill_id to be a str, '
                    'received %s.' % self.linked_skill_id)

    def get_content_html(self, content_id):
        """Returns the content belongs to a given content id of the object.

        Args:
            content_id: str. The id of the content.

        Returns:
            str. The html content corresponding to the given content id.

        Raises:
            ValueError. The given content_id does not exist.
        """
        content_id_to_html = self._get_all_translatable_content()
        if content_id not in content_id_to_html:
            raise ValueError('Content ID %s does not exist' % content_id)

        return content_id_to_html[content_id]

    def is_rte_content_supported_on_android(self):
        """Checks whether the RTE components used in the state are supported by
        Android.

        Returns:
            bool. Whether the RTE components in the state is valid.
        """
        def require_valid_component_names(html):
            """Checks if the provided html string contains only whitelisted
            RTE tags.

            Args:
                html: str. The html string.

            Returns:
                bool. Whether all RTE tags in the html are whitelisted.
            """
            component_name_prefix = 'oppia-noninteractive-'
            component_names = set([
                component['id'].replace(component_name_prefix, '')
                for component in html_cleaner.get_rte_components(html)])
            return any(component_names.difference(
                android_validation_constants.VALID_RTE_COMPONENTS))

        if self.content and require_valid_component_names(
                self.content.html):
            return False

        return self.interaction.is_rte_content_supported_on_android(
            require_valid_component_names)

    def get_training_data(self):
        """Retrieves training data from the State domain object.

        Returns:
            list(dict). A list of dicts, each of which has two key-value pairs.
            One pair maps 'answer_group_index' to the index of the answer
            group and the other maps 'answers' to the answer group's
            training data.
        """
        state_training_data_by_answer_group = []
        for (answer_group_index, answer_group) in enumerate(
                self.interaction.answer_groups):
            if answer_group.training_data:
                answers = copy.deepcopy(answer_group.training_data)
                state_training_data_by_answer_group.append({
                    'answer_group_index': answer_group_index,
                    'answers': answers
                })
        return state_training_data_by_answer_group

    def can_undergo_classification(self):
        """Checks whether the answers for this state satisfy the preconditions
        for a ML model to be trained.

        Returns:
            bool. True, if the conditions are satisfied.
        """
        training_examples_count = 0
        labels_count = 0
        training_examples_count += len(
            self.interaction.confirmed_unclassified_answers)
        for answer_group in self.interaction.answer_groups:
            training_examples_count += len(answer_group.training_data)
            labels_count += 1
        if (training_examples_count >= feconf.MIN_TOTAL_TRAINING_EXAMPLES
                and (labels_count >= feconf.MIN_ASSIGNED_LABELS)):
            return True
        return False

    @classmethod
    def convert_state_dict_to_yaml(cls, state_dict, width):
        """Converts the given state dict to yaml format.

        Args:
            state_dict: dict. A dict representing a state in an exploration.
            width: int. The maximum number of characters in a line for the
                returned YAML string.

        Returns:
            str. The YAML version of the state_dict.

        Raises:
            Exception. The state_dict does not represent a valid state.
        """
        try:
            # Check if the state_dict can be converted to a State.
            state = cls.from_dict(state_dict)
        except Exception:
            logging.exception(
                'Bad state dict: %s' % python_utils.UNICODE(state_dict))
            python_utils.reraise_exception()

        return python_utils.yaml_from_dict(state.to_dict(), width=width)

    def get_translation_counts(self):
        """Return a dict representing the number of translations available in a
        languages in which there exists at least one translation in the state
        object.

        Note: This method only counts the translations which are translatable as
        per _get_all_translatable_content method.

        Returns:
            dict(str, int). A dict with language code as a key and number of
            translations available in that language as the value.
        """
        translation_counts = collections.defaultdict(int)
        translations_mapping = self.written_translations.translations_mapping

        for content_id in self._get_all_translatable_content():
            for language_code, translation in (
                    translations_mapping[content_id].items()):
                if not translation.needs_update:
                    translation_counts[language_code] += 1
        return translation_counts

    def get_translatable_content_count(self):
        """Returns the number of content fields available for translation in
        the object.

        Returns:
            int. The number of content fields available for translation in
            the state.
        """
        return len(self._get_all_translatable_content())

    def _update_content_ids_in_assets(self, old_ids_list, new_ids_list):
        """Adds or deletes content ids in assets i.e, other parts of state
        object such as recorded_voiceovers and written_translations.

        Args:
            old_ids_list: list(str). A list of content ids present earlier
                within the substructure (like answer groups, hints etc.) of
                state.
            new_ids_list: list(str). A list of content ids currently present
                within the substructure (like answer groups, hints etc.) of
                state.
        """
        content_ids_to_delete = set(old_ids_list) - set(new_ids_list)
        content_ids_to_add = set(new_ids_list) - set(old_ids_list)
        content_ids_for_text_translations = (
            self.written_translations.get_content_ids_for_text_translation())
        content_ids_for_voiceovers = (
            self.recorded_voiceovers.get_content_ids_for_voiceovers())
        for content_id in content_ids_to_delete:
            if not content_id in content_ids_for_voiceovers:
                raise Exception(
                    'The content_id %s does not exist in recorded_voiceovers.'
                    % content_id)
            elif not content_id in content_ids_for_text_translations:
                raise Exception(
                    'The content_id %s does not exist in written_translations.'
                    % content_id)
            else:
                self.recorded_voiceovers.delete_content_id_for_voiceover(
                    content_id)
                self.written_translations.delete_content_id_for_translation(
                    content_id)

        for content_id in content_ids_to_add:
            if content_id in content_ids_for_voiceovers:
                raise Exception(
                    'The content_id %s already exists in recorded_voiceovers'
                    % content_id)
            elif content_id in content_ids_for_text_translations:
                raise Exception(
                    'The content_id %s already exists in written_translations.'
                    % content_id)
            else:
                self.recorded_voiceovers.add_content_id_for_voiceover(
                    content_id)
                self.written_translations.add_content_id_for_translation(
                    content_id)

    def add_translation(self, content_id, language_code, translation_html):
        """Adds translation to a given content id in a specific language.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code.
            translation_html: str. The translated html content.
        """
        translation_html = html_cleaner.clean(translation_html)
        self.written_translations.add_translation(
            content_id, language_code, translation_html)

    def add_written_translation(
            self, content_id, language_code, translation, data_format):
        """Adds a translation for the given content id in a given language.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code of the translated html.
            translation: str. The translated content.
            data_format: str. The data format of the translated content.
        """
        written_translation = WrittenTranslation(
            data_format, translation, False)
        self.written_translations.translations_mapping[content_id][
            language_code] = written_translation

    def mark_written_translations_as_needing_update(self, content_id):
        """Marks translation as needing update for the given content id in all
        languages.

        Args:
            content_id: str. The id of the content.
        """
        self.written_translations.mark_written_translations_as_needing_update(
            content_id)

    def update_content(self, content):
        """Update the content of this state.

        Args:
            content: SubtitledHtml. Representation of updated content.
        """
        # TODO(sll): Must sanitize all content in RTE component attrs.
        self.content = content

    def update_param_changes(self, param_changes):
        """Update the param_changes dict attribute.

        Args:
            param_changes: list(ParamChange). List of param_change domain
                objects that represents ParamChange domain object.
        """
        self.param_changes = param_changes

    def update_interaction_id(self, interaction_id):
        """Update the interaction id attribute.

        Args:
            interaction_id: str. The new interaction id to set.
        """
        if self.interaction.id:
            old_content_id_list = [
                answer_group.outcome.feedback.content_id for answer_group in (
                    self.interaction.answer_groups)]

            for answer_group in self.interaction.answer_groups:
                for rule_spec in answer_group.rule_specs:
                    for param_name, value in rule_spec.inputs.items():
                        param_type = (
                            interaction_registry.Registry.get_interaction_by_id(
                                self.interaction.id
                            ).get_rule_param_type(
                                rule_spec.rule_type, param_name))

                        if issubclass(
                                param_type, objects.BaseTranslatableObject
                        ):
                            old_content_id_list.append(value['contentId'])

            self._update_content_ids_in_assets(
                old_content_id_list, [])

        self.interaction.id = interaction_id
        self.interaction.answer_groups = []

    def update_next_content_id_index(self, next_content_id_index):
        """Update the interaction next content id index attribute.

        Args:
            next_content_id_index: int. The new next content id index to set.
        """
        self.next_content_id_index = next_content_id_index

    def update_linked_skill_id(self, linked_skill_id):
        """Update the state linked skill id attribute.

        Args:
            linked_skill_id: str. The linked skill id to state.
        """
        self.linked_skill_id = linked_skill_id

    def update_interaction_customization_args(self, customization_args_dict):
        """Update the customization_args of InteractionInstance domain object.

        Args:
            customization_args_dict: dict. The new customization_args to set.
        """
        customization_args = (
            InteractionInstance.
            convert_customization_args_dict_to_customization_args(
                self.interaction.id,
                customization_args_dict)
        )
        for ca_name in customization_args:
            customization_args[ca_name].validate_subtitled_html()

        old_content_id_list = list(itertools.chain.from_iterable([
            self.interaction.customization_args[ca_name].get_content_ids()
            for ca_name in self.interaction.customization_args]))

        self.interaction.customization_args = customization_args
        new_content_id_list = list(itertools.chain.from_iterable([
            self.interaction.customization_args[ca_name].get_content_ids()
            for ca_name in self.interaction.customization_args]))

        if len(new_content_id_list) != len(set(new_content_id_list)):
            raise Exception(
                'All customization argument content_ids should be unique. '
                'Content ids received: %s' % new_content_id_list)

        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_interaction_answer_groups(self, answer_groups_list):
        """Update the list of AnswerGroup in InteractionInstance domain object.

        Args:
            answer_groups_list: list(AnswerGroup). List of AnswerGroup domain
                objects.
        """
        if not isinstance(answer_groups_list, list):
            raise Exception(
                'Expected interaction_answer_groups to be a list, received %s'
                % answer_groups_list)

        interaction_answer_groups = []
        new_content_id_list = []
        old_content_id_list = [
            answer_group.outcome.feedback.content_id for answer_group in (
                self.interaction.answer_groups)]

        for answer_group in self.interaction.answer_groups:
            for rule_spec in answer_group.rule_specs:
                for param_name, value in rule_spec.inputs.items():
                    param_type = (
                        interaction_registry.Registry.get_interaction_by_id(
                            self.interaction.id
                        ).get_rule_param_type(rule_spec.rule_type, param_name))

                    if issubclass(param_type, objects.BaseTranslatableObject):
                        old_content_id_list.append(value['contentId'])

        # TODO(yanamal): Do additional calculations here to get the
        # parameter changes, if necessary.
        for answer_group in answer_groups_list:
            rule_specs_list = answer_group.rule_specs
            if not isinstance(rule_specs_list, list):
                raise Exception(
                    'Expected answer group rule specs to be a list, '
                    'received %s' % rule_specs_list)

            answer_group.rule_specs = []
            interaction_answer_groups.append(answer_group)

            for rule_spec in rule_specs_list:

                # Normalize and store the rule params.
                rule_inputs = rule_spec.inputs
                if not isinstance(rule_inputs, dict):
                    raise Exception(
                        'Expected rule_inputs to be a dict, received %s'
                        % rule_inputs)
                for param_name, value in rule_inputs.items():
                    param_type = (
                        interaction_registry.Registry.get_interaction_by_id(
                            self.interaction.id
                        ).get_rule_param_type(rule_spec.rule_type, param_name))

                    if (isinstance(value, python_utils.BASESTRING) and
                            '{{' in value and '}}' in value):
                        # TODO(jacobdavis11): Create checks that all parameters
                        # referred to exist and have the correct types.
                        normalized_param = value
                    else:
                        if issubclass(
                                param_type,
                                objects.BaseTranslatableObject
                        ):
                            new_content_id_list.append(value['contentId'])

                        try:
                            normalized_param = param_type.normalize(value)
                        except Exception:
                            raise Exception(
                                '%s has the wrong type. It should be a %s.' %
                                (value, param_type.__name__))

                    rule_inputs[param_name] = normalized_param

                answer_group.rule_specs.append(rule_spec)
        self.interaction.answer_groups = interaction_answer_groups

        new_content_id_list += [
            answer_group.outcome.feedback.content_id for answer_group in (
                self.interaction.answer_groups)]
        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_interaction_default_outcome(self, default_outcome):
        """Update the default_outcome of InteractionInstance domain object.

        Args:
            default_outcome: Outcome. Object representing the new Outcome.
        """
        old_content_id_list = []
        new_content_id_list = []
        if self.interaction.default_outcome:
            old_content_id_list.append(
                self.interaction.default_outcome.feedback.content_id)

        if default_outcome:
            self.interaction.default_outcome = default_outcome
            new_content_id_list.append(
                self.interaction.default_outcome.feedback.content_id)
        else:
            self.interaction.default_outcome = None

        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_interaction_confirmed_unclassified_answers(
            self, confirmed_unclassified_answers):
        """Update the confirmed_unclassified_answers of IteractionInstance
        domain object.

        Args:
            confirmed_unclassified_answers: list(AnswerGroup). The new list of
                answers which have been confirmed to be associated with the
                default outcome.

        Raises:
            Exception. The 'confirmed_unclassified_answers' is not a list.
        """
        if not isinstance(confirmed_unclassified_answers, list):
            raise Exception(
                'Expected confirmed_unclassified_answers to be a list,'
                ' received %s' % confirmed_unclassified_answers)
        self.interaction.confirmed_unclassified_answers = (
            confirmed_unclassified_answers)

    def update_interaction_hints(self, hints_list):
        """Update the list of hints.

        Args:
            hints_list: list(Hint). A list of Hint objects.

        Raises:
            Exception. The 'hints_list' is not a list.
        """
        if not isinstance(hints_list, list):
            raise Exception(
                'Expected hints_list to be a list, received %s'
                % hints_list)
        old_content_id_list = [
            hint.hint_content.content_id for hint in self.interaction.hints]
        self.interaction.hints = copy.deepcopy(hints_list)

        new_content_id_list = [
            hint.hint_content.content_id for hint in self.interaction.hints]
        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_interaction_solution(self, solution):
        """Update the solution of interaction.

        Args:
            solution: Solution. Object of class Solution.

        Raises:
            Exception. The 'solution' is not a domain object.
        """
        old_content_id_list = []
        new_content_id_list = []
        if self.interaction.solution:
            old_content_id_list.append(
                self.interaction.solution.explanation.content_id)

        if solution is not None:
            if not isinstance(solution, Solution):
                raise Exception(
                    'Expected solution to be a Solution object,received %s'
                    % solution)
            self.interaction.solution = solution
            new_content_id_list.append(
                self.interaction.solution.explanation.content_id)
        else:
            self.interaction.solution = None

        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_recorded_voiceovers(self, recorded_voiceovers):
        """Update the recorded_voiceovers of a state.

        Args:
            recorded_voiceovers: RecordedVoiceovers. The new RecordedVoiceovers
                object for the state.
        """
        self.recorded_voiceovers = recorded_voiceovers

    def update_written_translations(self, written_translations):
        """Update the written_translations of a state.

        Args:
            written_translations: WrittenTranslations. The new
                WrittenTranslations object for the state.
        """
        self.written_translations = written_translations

    def update_solicit_answer_details(self, solicit_answer_details):
        """Update the solicit_answer_details of a state.

        Args:
            solicit_answer_details: bool. The new value of
                solicit_answer_details for the state.
        """
        if not isinstance(solicit_answer_details, bool):
            raise Exception(
                'Expected solicit_answer_details to be a boolean, received %s'
                % solicit_answer_details)
        self.solicit_answer_details = solicit_answer_details

    def update_card_is_checkpoint(self, card_is_checkpoint):
        """Update the card_is_checkpoint field of a state.

        Args:
            card_is_checkpoint: bool. The new value of
                card_is_checkpoint for the state.
        """
        if not isinstance(card_is_checkpoint, bool):
            raise Exception(
                'Expected card_is_checkpoint to be a boolean, received %s'
                % card_is_checkpoint)
        self.card_is_checkpoint = card_is_checkpoint

    def _get_all_translatable_content(self):
        """Returns all content which can be translated into different languages.

        Note: Currently, we don't support interaction translation through
        contributor dashboard, this method only returns content which are
        translatable through the contributor dashboard.

        Returns:
            dict(str, str). Returns a dict with key as content id and content
            html/unicode as the value.
        """
        content_id_to_string = {}

        content_id_to_string[self.content.content_id] = self.content.html

        # TODO(#6178): Remove empty html checks once we add a validation
        # check that ensures each content in state should be non-empty html.
        default_outcome = self.interaction.default_outcome
        if default_outcome is not None and default_outcome.feedback.html != '':
            content_id_to_string[default_outcome.feedback.content_id] = (
                default_outcome.feedback.html)

        for answer_group in self.interaction.answer_groups:
            if answer_group.outcome.feedback.html != '':
                content_id_to_string[
                    answer_group.outcome.feedback.content_id
                ] = (answer_group.outcome.feedback.html)

        for hint in self.interaction.hints:
            if hint.hint_content.html != '':
                content_id_to_string[hint.hint_content.content_id] = (
                    hint.hint_content.html)

        solution = self.interaction.solution
        if solution is not None and solution.explanation.html != '':
            content_id_to_string[solution.explanation.content_id] = (
                solution.explanation.html)

        for ca_dict in self.interaction.customization_args.values():
            subtitled_htmls = ca_dict.get_subtitled_html()
            for subtitled_html in subtitled_htmls:
                html_string = subtitled_html.html
                # Make sure we don't include content that only consists of
                # numbers. See issue #13055.
                if html_string != '' and not html_string.isnumeric():
                    content_id_to_string[subtitled_html.content_id] = (
                        html_string)

            subtitled_unicodes = ca_dict.get_subtitled_unicode()
            for subtitled_unicode in subtitled_unicodes:
                if subtitled_unicode.unicode_str != '':
                    content_id_to_string[subtitled_unicode.content_id] = (
                        subtitled_unicode.unicode_str)

        return content_id_to_string

    def get_content_id_mapping_needing_translations(self, language_code):
        """Returns all text html which can be translated in the given language.

        Args:
            language_code: str. The abbreviated code of the language.

        Returns:
            dict(str, str). A dict with key as content id and value as the
            content html.
        """
        content_id_to_html = self._get_all_translatable_content()
        available_translation_content_ids = (
            self.written_translations
            .get_content_ids_that_are_correctly_translated(language_code))
        for content_id in available_translation_content_ids:
            content_id_to_html.pop(content_id, None)

        # TODO(#7571): Add functionality to return the list of
        # translations which needs update.

        return content_id_to_html

    def to_dict(self):
        """Returns a dict representing this State domain object.

        Returns:
            dict. A dict mapping all fields of State instance.
        """
        return {
            'content': self.content.to_dict(),
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'interaction': self.interaction.to_dict(),
            'classifier_model_id': self.classifier_model_id,
            'linked_skill_id': self.linked_skill_id,
            'recorded_voiceovers': self.recorded_voiceovers.to_dict(),
            'written_translations': self.written_translations.to_dict(),
            'solicit_answer_details': self.solicit_answer_details,
            'card_is_checkpoint': self.card_is_checkpoint,
            'next_content_id_index': self.next_content_id_index
        }

    @classmethod
    def from_dict(cls, state_dict):
        """Return a State domain object from a dict.

        Args:
            state_dict: dict. The dict representation of State object.

        Returns:
            State. The corresponding State domain object.
        """
        content = SubtitledHtml.from_dict(state_dict['content'])
        content.validate()
        return cls(
            content,
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            InteractionInstance.from_dict(state_dict['interaction']),
            RecordedVoiceovers.from_dict(state_dict['recorded_voiceovers']),
            WrittenTranslations.from_dict(state_dict['written_translations']),
            state_dict['solicit_answer_details'],
            state_dict['card_is_checkpoint'],
            state_dict['next_content_id_index'],
            state_dict['linked_skill_id'],
            state_dict['classifier_model_id'])

    @classmethod
    def create_default_state(
            cls, default_dest_state_name, is_initial_state=False):
        """Return a State domain object with default value.

        Args:
            default_dest_state_name: str. The default destination state.
            is_initial_state: bool. Whether this state represents the initial
                state of an exploration.

        Returns:
            State. The corresponding State domain object.
        """
        content_html = (
            feconf.DEFAULT_INIT_STATE_CONTENT_STR if is_initial_state else '')
        content_id = feconf.DEFAULT_NEW_STATE_CONTENT_ID
        return cls(
            SubtitledHtml(content_id, content_html),
            [],
            InteractionInstance.create_default_interaction(
                default_dest_state_name),
            RecordedVoiceovers.from_dict(copy.deepcopy(
                feconf.DEFAULT_RECORDED_VOICEOVERS)),
            WrittenTranslations.from_dict(
                copy.deepcopy(feconf.DEFAULT_WRITTEN_TRANSLATIONS)),
            False, is_initial_state, 0)

    @classmethod
    def convert_html_fields_in_state(
            cls, state_dict, conversion_fn,
            state_uses_old_interaction_cust_args_schema=False,
            state_uses_old_rule_template_schema=False):
        """Applies a conversion function on all the html strings in a state
        to migrate them to a desired state.

        Args:
            state_dict: dict. The dict representation of State object.
            conversion_fn: function. The conversion function to be applied on
                the states_dict.
            state_uses_old_interaction_cust_args_schema: bool. Whether the
                interaction customization arguments contain SubtitledHtml
                and SubtitledUnicode dicts (should be True if prior to state
                schema v36).
            state_uses_old_rule_template_schema: bool. Wheter the rule inputs
                contain html in the form of DragAndDropHtmlString,
                SetOfHtmlString, or ListOfSetsOfHtmlString (shoud be True if
                prior to state schema v42).

        Returns:
            dict. The converted state_dict.
        """
        state_dict['content']['html'] = (
            conversion_fn(state_dict['content']['html']))
        if state_dict['interaction']['default_outcome']:
            state_dict['interaction']['default_outcome'] = (
                Outcome.convert_html_in_outcome(
                    state_dict['interaction']['default_outcome'],
                    conversion_fn))

        if state_uses_old_rule_template_schema:
            # We need to retrieve an older version of
            # html_field_types_to_rule_specs to properly convert html, since
            # after state schema v41, some html fields were removed.
            html_field_types_to_rule_specs = (
                rules_registry.Registry.get_html_field_types_to_rule_specs(
                    state_schema_version=41))
        else:
            html_field_types_to_rule_specs = (
                rules_registry.Registry.get_html_field_types_to_rule_specs())

        for answer_group_index, answer_group in enumerate(
                state_dict['interaction']['answer_groups']):
            state_dict['interaction']['answer_groups'][answer_group_index] = (
                AnswerGroup.convert_html_in_answer_group(
                    answer_group, conversion_fn, html_field_types_to_rule_specs)
            )

        if 'written_translations' in state_dict.keys():
            state_dict['written_translations'] = (
                WrittenTranslations.
                convert_html_in_written_translations(
                    state_dict['written_translations'], conversion_fn))

        for hint_index, hint in enumerate(state_dict['interaction']['hints']):
            state_dict['interaction']['hints'][hint_index] = (
                Hint.convert_html_in_hint(hint, conversion_fn))

        interaction_id = state_dict['interaction']['id']
        if interaction_id is None:
            return state_dict

        # TODO(#11950): Drop the following 'if' clause once all snapshots have
        # been migrated. This is currently causing issues in migrating old
        # snapshots to schema v34 because MathExpressionInput was still around
        # at the time. It is conceptually OK to ignore customization args here
        # because the MathExpressionInput has no customization arg fields.
        if interaction_id == 'MathExpressionInput':
            if state_dict['interaction']['solution']:
                state_dict['interaction']['solution']['explanation']['html'] = (
                    conversion_fn(state_dict['interaction']['solution'][
                        'explanation']['html']))
            return state_dict

        if state_dict['interaction']['solution']:
            if state_uses_old_rule_template_schema:
                interaction_spec = (
                    interaction_registry.Registry
                    .get_all_specs_for_state_schema_version(41)[
                        interaction_id]
                )
            else:
                interaction_spec = (
                    interaction_registry.Registry
                    .get_all_specs()[interaction_id]
                )
            state_dict['interaction']['solution'] = (
                Solution.convert_html_in_solution(
                    state_dict['interaction']['id'],
                    state_dict['interaction']['solution'],
                    conversion_fn,
                    html_field_types_to_rule_specs,
                    interaction_spec))

        if state_uses_old_interaction_cust_args_schema:
            # We need to retrieve an older version of interaction_specs to
            # properly convert html, since past state schema v35,
            # some html and unicode customization arguments were replaced with
            # SubtitledHtml and SubtitledUnicode.
            ca_specs = (
                interaction_registry.Registry
                .get_all_specs_for_state_schema_version(35)[
                    interaction_id]['customization_arg_specs']
            )

            interaction_customization_arg_has_html = False
            for customization_arg_spec in ca_specs:
                schema = customization_arg_spec['schema']
                if (schema['type'] == schema_utils.SCHEMA_TYPE_LIST and
                        schema['items']['type'] ==
                        schema_utils.SCHEMA_TYPE_HTML):
                    interaction_customization_arg_has_html = True

            if interaction_customization_arg_has_html:
                if 'choices' in (
                        state_dict['interaction']['customization_args'].keys()):
                    state_dict['interaction']['customization_args'][
                        'choices']['value'] = ([
                            conversion_fn(html)
                            for html in state_dict[
                                'interaction']['customization_args'][
                                    'choices']['value']
                        ])
        else:
            state_dict['interaction'] = (
                InteractionInstance.convert_html_in_interaction(
                    state_dict['interaction'],
                    conversion_fn
                ))

        return state_dict

    def get_all_html_content_strings(self):
        """Get all html content strings in the state.

        Returns:
            list(str). The list of all html content strings in the interaction.
        """
        html_list = (
            self.written_translations.get_all_html_content_strings() +
            self.interaction.get_all_html_content_strings() + [
                self.content.html])
        return html_list
