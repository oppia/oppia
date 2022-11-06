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

from __future__ import annotations

import collections
import copy
import itertools
import logging
import math
import re

from core import android_validation_constants
from core import feconf
from core import schema_utils
from core import utils
from core.constants import constants
from core.domain import customization_args_util
from core.domain import param_domain
from core.domain import translation_domain
from extensions.objects.models import objects

from typing import (
    Any, Callable, Dict, Final, List, Literal, Mapping, Optional, Tuple,
    Type, TypedDict, Union, cast, overload)

from core.domain import html_cleaner  # pylint: disable=invalid-import-from # isort:skip
from core.domain import interaction_registry  # pylint: disable=invalid-import-from # isort:skip
from core.domain import rules_registry  # pylint: disable=invalid-import-from # isort:skip
from core.domain import translatable_object_registry  # pylint: disable=invalid-import-from # isort:skip

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain
    from extensions.interactions import base

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.


# The `AllowedRuleSpecInputTypes` is union of allowed types that a
# RuleSpec's inputs dictionary can accept for it's values.
AllowedRuleSpecInputTypes = Union[
    str,
    int,
    float,
    List[str],
    List[List[str]],
    # Here we use type Any because some rule specs have deeply nested types,
    # such as for the `NumberWithUnits` interaction.
    Mapping[
        str, Union[str, List[str], int, bool, float, Dict[str, int], List[Any]]
    ],
]

# TODO(#15982): Here we use type Any because `CustomizationArgsDictType` is a
# type for customization_args dictionary, and we used Any type here because
# it accepts the values of customization args and that values can be of type
# str, int, bool, List and other types too.
CustomizationArgsDictType = Dict[str, Dict[str, Any]]


class TrainingDataDict(TypedDict):
    """Type for the training data dictionary."""

    answer_group_index: int
    answers: List[str]


class AnswerGroupDict(TypedDict):
    """Dictionary representing the AnswerGroup object."""

    outcome: OutcomeDict
    rule_specs: List[RuleSpecDict]
    training_data: List[str]
    tagged_skill_misconception_id: Optional[str]


class StateVersionHistoryDict(TypedDict):
    """Dictionary representing the StateVersionHistory object."""

    previously_edited_in_version: Optional[int]
    state_name_in_previous_version: Optional[str]
    committer_id: str


AcceptableCorrectAnswerTypes = Union[
    List[List[str]], List[str], str, Dict[str, str], int, None
]


class AnswerGroup(translation_domain.BaseTranslatableObject):
    """Value object for an answer group. Answer groups represent a set of rules
    dictating whether a shared feedback should be shared with the user. These
    rules are ORed together. Answer groups may also support a classifier
    that involve soft matching of answers to a set of training data and/or
    example answers dictated by the creator.
    """

    def __init__(
        self,
        outcome: Outcome,
        rule_specs: List[RuleSpec],
        training_data: List[str],
        tagged_skill_misconception_id: Optional[str]
    ) -> None:
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

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields in the answer group.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        if self.outcome is not None:
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(self.outcome)
            )
        for rule_spec in self.rule_specs:
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(rule_spec)
            )
        return translatable_contents_collection

    def to_dict(self) -> AnswerGroupDict:
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

    # TODO(#16467): Remove `validate` argument after validating all Question
    # states by writing a migration and audit job. As the validation for
    # answer group is common between Exploration and Question and the Question
    # data is not yet migrated, we do not want to call the validations
    # while we load the Question.
    @classmethod
    def from_dict(
        cls, answer_group_dict: AnswerGroupDict, validate: bool = True
    ) -> AnswerGroup:
        """Return a AnswerGroup domain object from a dict.

        Args:
            answer_group_dict: dict. The dict representation of AnswerGroup
                object.
            validate: bool. False, when the validations should not be called.

        Returns:
            AnswerGroup. The corresponding AnswerGroup domain object.
        """
        return cls(
            Outcome.from_dict(answer_group_dict['outcome'], validate=validate),
            [RuleSpec.from_dict(rs)
             for rs in answer_group_dict['rule_specs']],
            answer_group_dict['training_data'],
            answer_group_dict['tagged_skill_misconception_id']
        )

    def validate(
        self,
        interaction: base.BaseInteraction,
        exp_param_specs_dict: Dict[str, param_domain.ParamSpec],
        *,
        tagged_skill_misconception_id_required: bool = False,
    ) -> None:
        """Verifies that all rule classes are valid, and that the AnswerGroup
        only has one classifier rule.

        Args:
            interaction: BaseInteraction. The interaction object.
            exp_param_specs_dict: dict. A dict of all parameters used in the
                exploration. Keys are parameter names and values are ParamSpec
                value objects with an object type property (obj_type).
            tagged_skill_misconception_id_required: bool. The 'tagged_skill_
                misconception_id' is required or not.

        Raises:
            ValidationError. One or more attributes of the AnswerGroup are
                invalid.
            ValidationError. The AnswerGroup contains more than one classifier
                rule.
            ValidationError. The tagged_skill_misconception_id is not valid.
        """
        if not isinstance(self.rule_specs, list):
            raise utils.ValidationError(
                'Expected answer group rules to be a list, received %s'
                % self.rule_specs)

        if (
            self.tagged_skill_misconception_id is not None and
            not tagged_skill_misconception_id_required
        ):
            raise utils.ValidationError(
                'Expected tagged skill misconception id to be None, '
                'received %s' % self.tagged_skill_misconception_id)

        if (
            self.tagged_skill_misconception_id is not None and
            tagged_skill_misconception_id_required
        ):
            if not isinstance(self.tagged_skill_misconception_id, str):
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

        if len(self.rule_specs) == 0:
            raise utils.ValidationError(
                'There must be at least one rule for each answer group.')

        for rule_spec in self.rule_specs:
            if rule_spec.rule_type not in interaction.rules_dict:
                raise utils.ValidationError(
                    'Unrecognized rule type: %s' % rule_spec.rule_type)
            rule_spec.validate(
                interaction.get_rule_param_list(rule_spec.rule_type),
                exp_param_specs_dict)

        self.outcome.validate()

    def get_all_html_content_strings(self, interaction_id: str) -> List[str]:
        """Get all html content strings in the AnswerGroup.

        Args:
            interaction_id: str. The interaction id that the answer group is
                associated with.

        Returns:
            list(str). The list of all html content strings in the interaction.

        Raises:
            Exception. The Rule spec has an invalid format.
            Exception. The Rule spec has no valid input variable
                with HTML in it.
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
                                    if isinstance(value, str):
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
        answer_group_dict: AnswerGroupDict,
        conversion_fn: Callable[[str], str],
        html_field_types_to_rule_specs: Dict[
            str, rules_registry.RuleSpecsExtensionDict
        ]
    ) -> AnswerGroupDict:
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


class HintDict(TypedDict):
    """Dictionary representing the Hint object."""

    hint_content: SubtitledHtmlDict


class Hint(translation_domain.BaseTranslatableObject):
    """Value object representing a hint."""

    def __init__(
        self,
        hint_content: SubtitledHtml
    ) -> None:
        """Constructs a Hint domain object.

        Args:
            hint_content: SubtitledHtml. The hint text and ID referring to the
                other assets for this content.
        """
        self.hint_content = hint_content

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the hint.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.HTML,
            self.hint_content.content_id,
            self.hint_content.html)
        return translatable_contents_collection

    def to_dict(self) -> HintDict:
        """Returns a dict representing this Hint domain object.

        Returns:
            dict. A dict mapping the field of Hint instance.
        """
        return {
            'hint_content': self.hint_content.to_dict(),
        }

    # TODO(#16467): Remove `validate` argument after validating all Question
    # states by writing a migration and audit job. As the validation for
    # hint is common between Exploration and Question and the Question
    # data is not yet migrated, we do not want to call the validations
    # while we load the Question.
    @classmethod
    def from_dict(cls, hint_dict: HintDict, validate: bool = True) -> Hint:
        """Return a Hint domain object from a dict.

        Args:
            hint_dict: dict. The dict representation of Hint object.
            validate: bool. False, when the validations should not be called.

        Returns:
            Hint. The corresponding Hint domain object.
        """
        hint_content = SubtitledHtml.from_dict(hint_dict['hint_content'])
        if validate:
            hint_content.validate()
        return cls(hint_content)

    def validate(self) -> None:
        """Validates all properties of Hint."""
        self.hint_content.validate()

    @staticmethod
    def convert_html_in_hint(
        hint_dict: HintDict, conversion_fn: Callable[[str], str]
    ) -> HintDict:
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


class SolutionDict(TypedDict):
    """Dictionary representing the Solution object."""

    answer_is_exclusive: bool
    correct_answer: AcceptableCorrectAnswerTypes
    explanation: SubtitledHtmlDict


class Solution(translation_domain.BaseTranslatableObject):
    """Value object representing a solution.

    A solution consists of answer_is_exclusive, correct_answer and an
    explanation.When answer_is_exclusive is True, this indicates that it is
    the only correct answer; when it is False, this indicates that it is one
    possible answer. correct_answer records an answer that enables the learner
    to progress to the next card and explanation is an HTML string containing
    an explanation for the solution.
    """

    def __init__(
        self,
        interaction_id: str,
        answer_is_exclusive: bool,
        correct_answer: AcceptableCorrectAnswerTypes,
        explanation: SubtitledHtml
    ) -> None:
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

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the solution.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.HTML,
            self.explanation.content_id,
            self.explanation.html)
        return translatable_contents_collection

    def to_dict(self) -> SolutionDict:
        """Returns a dict representing this Solution domain object.

        Returns:
            dict. A dict mapping all fields of Solution instance.
        """
        return {
            'answer_is_exclusive': self.answer_is_exclusive,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation.to_dict(),
        }

    # TODO(#16467): Remove `validate` argument after validating all Question
    # states by writing a migration and audit job. As the validation for
    # solution is common between Exploration and Question and the Question
    # data is not yet migrated, we do not want to call the validations
    # while we load the Question.
    @classmethod
    def from_dict(
        cls,
        interaction_id: str,
        solution_dict: SolutionDict,
        validate: bool = True
    ) -> Solution:
        """Return a Solution domain object from a dict.

        Args:
            interaction_id: str. The interaction id.
            solution_dict: dict. The dict representation of Solution object.
            validate: bool. False, when the validations should not be called.

        Returns:
            Solution. The corresponding Solution domain object.
        """
        explanation = SubtitledHtml.from_dict(solution_dict['explanation'])
        if validate:
            explanation.validate()
        return cls(
            interaction_id,
            solution_dict['answer_is_exclusive'],
            interaction_registry.Registry.get_interaction_by_id(
                interaction_id).normalize_answer(
                    solution_dict['correct_answer']),
            explanation)

    def validate(self, interaction_id: str) -> None:
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
        interaction_id: Optional[str],
        solution_dict: SolutionDict,
        conversion_fn: Callable[[str], str],
        html_field_types_to_rule_specs: Dict[
            str, rules_registry.RuleSpecsExtensionDict
        ],
        interaction_spec: base.BaseInteractionDict
    ) -> SolutionDict:
        """Checks for HTML fields in a solution and convert it according
        to the conversion function.

        Args:
            interaction_id: Optional[str]. The interaction id.
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

        Raises:
            Exception. The Solution dict has an invalid answer type.
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

                            # Here correct_answer can only be of type
                            # List[List[str]] because here html_type is
                            # 'ListOfSetsOfHtmlStrings'.
                            assert isinstance(
                                solution_dict['correct_answer'], list
                            )
                            for list_index, html_list in enumerate(
                                    solution_dict['correct_answer']):
                                assert isinstance(html_list, list)
                                for answer_html_index, answer_html in enumerate(
                                        html_list):
                                    # Here we use cast because above assert
                                    # conditions forces correct_answer to be of
                                    # type List[List[str]].
                                    correct_answer = cast(
                                        List[List[str]],
                                        solution_dict['correct_answer']
                                    )
                                    correct_answer[list_index][
                                        answer_html_index] = (
                                            conversion_fn(answer_html))
                        elif html_type == feconf.ANSWER_TYPE_SET_OF_HTML:
                            # Here correct_answer can only be of type
                            # List[str] because here html_type is
                            # 'SetOfHtmlString'.
                            assert isinstance(
                                solution_dict['correct_answer'], list
                            )
                            for answer_html_index, answer_html in enumerate(
                                    solution_dict['correct_answer']):
                                assert isinstance(answer_html, str)
                                # Here we use cast because above assert
                                # conditions forces correct_answer to be of
                                # type List[str].
                                set_of_html_correct_answer = cast(
                                    List[str],
                                    solution_dict['correct_answer']
                                )
                                set_of_html_correct_answer[
                                    answer_html_index] = (
                                        conversion_fn(answer_html))
                        else:
                            raise Exception(
                                'The solution does not have a valid '
                                'correct_answer type.')

        return solution_dict


class InteractionInstanceDict(TypedDict):
    """Dictionary representing the InteractionInstance object."""

    id: Optional[str]
    customization_args: CustomizationArgsDictType
    answer_groups: List[AnswerGroupDict]
    default_outcome: Optional[OutcomeDict]
    confirmed_unclassified_answers: List[AnswerGroup]
    hints: List[HintDict]
    solution: Optional[SolutionDict]


class InteractionInstance(translation_domain.BaseTranslatableObject):
    """Value object for an instance of an interaction."""

    class RangeVariableDict(TypedDict):
        """Dictionary representing the range variable for the NumericInput
        interaction.
        """

        ans_group_index: int
        rule_spec_index: int
        lower_bound: Optional[float]
        upper_bound: Optional[float]
        lb_inclusive: bool
        ub_inclusive: bool

    class MatchedDenominatorDict(TypedDict):
        """Dictionary representing the matched denominator variable for the
        FractionInput interaction.
        """

        ans_group_index: int
        rule_spec_index: int
        denominator: int

    # The default interaction used for a new state.
    _DEFAULT_INTERACTION_ID = None

    def __init__(
        self,
        interaction_id: Optional[str],
        customization_args: Dict[str, InteractionCustomizationArg],
        answer_groups: List[AnswerGroup],
        default_outcome: Optional[Outcome],
        confirmed_unclassified_answers: List[AnswerGroup],
        hints: List[Hint],
        solution: Optional[Solution]
    ) -> None:
        """Initializes a InteractionInstance domain object.

        Args:
            interaction_id: Optional[str]. The interaction id.
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.
            default_outcome: Optional[Outcome]. The default outcome of the
                interaction instance, or None if no default outcome exists
                for the interaction.
            confirmed_unclassified_answers: list(*). List of answers which have
                been confirmed to be associated with the default outcome.
            hints: list(Hint). List of hints for this interaction.
            solution: Solution|None. A possible solution for the question asked
                in this interaction, or None if no solution exists for the
                interaction.
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

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the interaction instance.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        if self.default_outcome is not None:
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(self.default_outcome)
            )
        for answer_group in self.answer_groups:
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(answer_group)
            )
        for customization_arg in self.customization_args.values():
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(customization_arg)
            )
        for hint in self.hints:
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(hint)
            )
        if self.solution is not None:
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(self.solution)
            )
        return translatable_contents_collection

    def to_dict(self) -> InteractionInstanceDict:
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

    # TODO(#16467): Remove `validate` argument after validating all Question
    # states by writing a migration and audit job. As the validation for
    # interaction is common between Exploration and Question and the Question
    # data is not yet migrated, we do not want to call the validations
    # while we load the Question.
    @classmethod
    def from_dict(
        cls, interaction_dict: InteractionInstanceDict, validate: bool = True
    ) -> InteractionInstance:
        """Return a InteractionInstance domain object from a dict.

        Args:
            interaction_dict: dict. The dict representation of
                InteractionInstance object.
            validate: bool. False, when the validations should not be called.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object.
        """
        default_outcome_dict = (
            Outcome.from_dict(
                interaction_dict['default_outcome'], validate=validate)
            if interaction_dict['default_outcome'] is not None else None)
        solution_dict = (
            Solution.from_dict(
                interaction_dict['id'], interaction_dict['solution'],
                validate=validate)
            if (
                interaction_dict['solution'] is not None and
                interaction_dict['id'] is not None
            )
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
            (
                [AnswerGroup.from_dict(h, validate=validate)
                for h in interaction_dict['answer_groups']]
            ),
            default_outcome_dict,
            interaction_dict['confirmed_unclassified_answers'],
            (
                [Hint.from_dict(h, validate=validate)
                for h in interaction_dict['hints']]
            ),
            solution_dict)

    @property
    def is_terminal(self) -> bool:
        """Determines if this interaction type is terminal. If no ID is set for
        this interaction, it is assumed to not be terminal.

        Returns:
            bool. Whether the interaction is terminal.
        """
        return bool(
            self.id and interaction_registry.Registry.get_interaction_by_id(
                self.id
            ).is_terminal
        )

    @property
    def is_linear(self) -> bool:
        """Determines if this interaction type is linear.

        Returns:
            bool. Whether the interaction is linear.
        """
        return interaction_registry.Registry.get_interaction_by_id(
            self.id).is_linear

    def is_supported_on_android_app(self) -> bool:
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
        self, require_valid_component_names: Callable[[str], bool]
    ) -> bool:
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

    def get_all_outcomes(self) -> List[Outcome]:
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

    def _validate_continue_interaction(self) -> None:
        """Validates Continue interaction."""
        text_value = (
            self.customization_args['buttonText'].value.unicode_str)
        if len(text_value) > 20:
            raise utils.ValidationError(
                'The `continue` interaction text length should be atmost '
                '20 characters.'
            )

    def _validate_end_interaction(self) -> None:
        """Validates End interaction."""
        recc_exp_ids = (
            self.customization_args['recommendedExplorationIds'].value)
        if len(recc_exp_ids) > 3:
            raise utils.ValidationError(
                'The total number of recommended explorations inside End '
                'interaction should be atmost 3.'
            )

    def _validates_choices_should_be_unique_and_nonempty(
        self, choices: List[SubtitledHtml]
    ) -> None:
        """Validates that the choices should be unique and non empty.

        Args:
            choices: List[state_domain.SubtitledHtml]. Choices that needs to
                be validated.

        Raises:
            utils.ValidationError. Choice is empty.
            utils.ValidationError. Choice is duplicate.
        """
        seen_choices = []
        for choice in choices:
            if html_cleaner.is_html_empty(choice.html):
                raise utils.ValidationError(
                    'Choices should be non empty.'
                )

            if choice.html not in seen_choices:
                seen_choices.append(choice.html)
            else:
                raise utils.ValidationError(
                    'Choices should be unique.'
                )

    def _set_lower_and_upper_bounds(
        self,
        range_var: RangeVariableDict,
        lower_bound: float,
        upper_bound: float,
        *,
        lb_inclusive: bool,
        ub_inclusive: bool
    ) -> None:
        """Sets the lower and upper bounds for the range_var.

        Args:
            range_var: RangeVariableDict. Variable used to keep track of each
                range.
            lower_bound: float. The lower bound.
            upper_bound: float. The upper bound.
            lb_inclusive: bool. If lower bound is inclusive.
            ub_inclusive: bool. If upper bound is inclusive.
        """
        range_var['lower_bound'] = lower_bound
        range_var['upper_bound'] = upper_bound
        range_var['lb_inclusive'] = lb_inclusive
        range_var['ub_inclusive'] = ub_inclusive

    def _is_enclosed_by(
        self, test_range: RangeVariableDict, base_range: RangeVariableDict
    ) -> bool:
        """Returns `True` when `test_range` variable lies within
        `base_range` variable.

        Args:
            test_range: RangeVariableDictDict. It represents the variable for
                which we have to check the range.
            base_range: RangeVariableDictDict. It is the variable to which
                the range is compared.

        Returns:
            bool. Returns True if test_range lies
            within base_range.
        """
        if (
            base_range['lower_bound'] is None or
            test_range['lower_bound'] is None or
            base_range['upper_bound'] is None or
            test_range['upper_bound'] is None
        ):
            return False

        lb_satisfied = (
            base_range['lower_bound'] < test_range['lower_bound'] or
            (
                base_range['lower_bound'] == test_range['lower_bound'] and
                (not test_range['lb_inclusive'] or base_range['lb_inclusive'])
            )
        )
        ub_satisfied = (
            base_range['upper_bound'] > test_range['upper_bound'] or
            (
                base_range['upper_bound'] == test_range['upper_bound'] and
                (not test_range['ub_inclusive'] or base_range['ub_inclusive'])
            )
        )
        return lb_satisfied and ub_satisfied

    def _should_check_range_criteria(
        self, earlier_rule: RuleSpec, later_rule: RuleSpec
    ) -> bool:
        """Compares the rule types of two rule specs to determine whether
        to check for range enclosure.

        Args:
            earlier_rule: RuleSpec. Previous rule.
            later_rule: RuleSpec. Current rule.

        Returns:
            bool. Returns True if the rules passes the range criteria check.
        """
        if earlier_rule.rule_type in (
            'HasDenominatorEqualTo', 'IsEquivalentTo', 'IsLessThan',
            'IsEquivalentToAndInSimplestForm', 'IsGreaterThan'
        ):
            return True

        return later_rule.rule_type in (
            'HasDenominatorEqualTo', 'IsLessThan', 'IsGreaterThan'
        )

    def _get_rule_value_of_fraction_interaction(
        self, rule_spec: RuleSpec
    ) -> float:
        """Returns rule value of the rule_spec of FractionInput interaction so
        that we can keep track of rule's range.

        Args:
            rule_spec: RuleSpec. Rule spec of an answer group.

        Returns:
            rule_value_f: float. The value of the rule spec.
        """
        rule_value_f = rule_spec.inputs['f']
        value: float = (
            rule_value_f['wholeNumber'] +
            float(rule_value_f['numerator']) / rule_value_f['denominator']
        )
        return value

    def _validate_numeric_input(self, strict: bool = False) -> None:
        """Validates the NumericInput interaction.

        Args:
            strict: bool. If True, the exploration is assumed to be published.

        Raises:
            ValidationError. Duplicate rules are present.
            ValidationError. Rule having a solution that is subset of previous
                rules' solution.
            ValidationError. The 'tol' value in 'IsWithinTolerance' is negetive.
            ValidationError. The 'a' is greater than or equal to 'b' in
                'IsInclusivelyBetween' rule.
        """
        lower_infinity = float('-inf')
        upper_infinity = float('inf')
        ranges: List[InteractionInstance.RangeVariableDict] = []
        rule_spec_till_now: List[RuleSpecDict] = []

        for ans_group_index, answer_group in enumerate(self.answer_groups):
            for rule_spec_index, rule_spec in enumerate(
                answer_group.rule_specs
            ):
                # Rule should not be duplicate.
                if rule_spec.to_dict() in rule_spec_till_now and strict:
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' of answer group '
                        f'\'{ans_group_index}\' of NumericInput '
                        f'interaction is already present.'
                    )
                rule_spec_till_now.append(rule_spec.to_dict())
                # All rules should have solutions that is not subset of
                # previous rules' solutions.
                range_var: InteractionInstance.RangeVariableDict = {
                    'ans_group_index': int(ans_group_index),
                    'rule_spec_index': int(rule_spec_index),
                    'lower_bound': None,
                    'upper_bound': None,
                    'lb_inclusive': False,
                    'ub_inclusive': False
                }

                if rule_spec.rule_type == 'IsLessThanOrEqualTo':
                    rule_value = float(rule_spec.inputs['x'])
                    self._set_lower_and_upper_bounds(
                        range_var,
                        lower_infinity,
                        rule_value,
                        lb_inclusive=False,
                        ub_inclusive=True
                    )

                elif rule_spec.rule_type == 'IsGreaterThanOrEqualTo':
                    rule_value = float(rule_spec.inputs['x'])
                    self._set_lower_and_upper_bounds(
                        range_var,
                        rule_value,
                        upper_infinity,
                        lb_inclusive=True,
                        ub_inclusive=False
                    )

                elif rule_spec.rule_type == 'Equals':
                    rule_value = float(rule_spec.inputs['x'])
                    self._set_lower_and_upper_bounds(
                        range_var,
                        rule_value,
                        rule_value,
                        lb_inclusive=True,
                        ub_inclusive=True
                    )

                elif rule_spec.rule_type == 'IsLessThan':
                    rule_value = float(rule_spec.inputs['x'])
                    self._set_lower_and_upper_bounds(
                        range_var,
                        lower_infinity,
                        rule_value,
                        lb_inclusive=False,
                        ub_inclusive=False
                    )

                elif rule_spec.rule_type == 'IsGreaterThan':
                    rule_value = float(rule_spec.inputs['x'])
                    self._set_lower_and_upper_bounds(
                        range_var,
                        rule_value,
                        upper_infinity,
                        lb_inclusive=False,
                        ub_inclusive=False
                    )

                elif rule_spec.rule_type == 'IsWithinTolerance':
                    rule_value_x = float(rule_spec.inputs['x'])
                    rule_value_tol = float(rule_spec.inputs['tol'])
                    if rule_value_tol <= 0.0:
                        raise utils.ValidationError(
                            f'The rule \'{rule_spec_index}\' of answer '
                            f'group \'{ans_group_index}\' having '
                            f'rule type \'IsWithinTolerance\' '
                            f'have \'tol\' value less than or equal to '
                            f'zero in NumericInput interaction.'
                        )
                    self._set_lower_and_upper_bounds(
                        range_var,
                        rule_value_x - rule_value_tol,
                        rule_value_x + rule_value_tol,
                        lb_inclusive=True,
                        ub_inclusive=True
                    )

                elif rule_spec.rule_type == 'IsInclusivelyBetween':
                    rule_value_a = float(rule_spec.inputs['a'])
                    rule_value_b = float(rule_spec.inputs['b'])
                    if rule_value_a >= rule_value_b and strict:
                        raise utils.ValidationError(
                            f'The rule \'{rule_spec_index}\' of answer '
                            f'group \'{ans_group_index}\' having '
                            f'rule type \'IsInclusivelyBetween\' '
                            f'have `a` value greater than `b` value '
                            f'in NumericInput interaction.'
                        )
                    self._set_lower_and_upper_bounds(
                        range_var,
                        rule_value_a,
                        rule_value_b,
                        lb_inclusive=True,
                        ub_inclusive=True
                    )

                for range_ele in ranges:
                    if self._is_enclosed_by(range_var, range_ele) and strict:
                        raise utils.ValidationError(
                            f'Rule \'{rule_spec_index}\' from answer '
                            f'group \'{ans_group_index}\' will never be '
                            f'matched because it is made redundant '
                            f'by the above rules'
                        )

                ranges.append(range_var)

    def _validate_fraction_input(self, strict: bool = False) -> None:
        """Validates the FractionInput interaction.

        Args:
            strict: bool. If True, the exploration is assumed to be published.

        Raises:
            ValidationError. Duplicate rules are present.
            ValidationError. Solution is not in simplest form when the
                'simplest form' setting is turned on.
            ValidationError. Solution is not in proper form, having values
                like 1 2/3 when the 'proper form' setting is turned on.
            ValidationError. Solution is not in proper form, when the 'proper
                form' setting is turned on.
            ValidationError. The 'IsExactlyEqualTo' rule have integral value
                when 'allow non zero integers' setting is off.
            ValidationError. Rule have solution that is subset of previous
                rules' solutions.
            ValidationError. The 'HasFractionalPartExactlyEqualTo' rule comes
                after 'HasDenominatorEqualTo' rule where the fractional
                denominator is equal to 'HasDenominatorEqualTo' rule value.
        """
        ranges: List[InteractionInstance.RangeVariableDict] = []
        matched_denominator_list: List[
            InteractionInstance.MatchedDenominatorDict] = []
        rule_spec_till_now: List[RuleSpecDict] = []
        inputs_without_fractions = [
            'HasDenominatorEqualTo',
            'HasNumeratorEqualTo',
            'HasIntegerPartEqualTo',
            'HasNoFractionalPart'
        ]
        rules_that_can_have_improper_fractions = [
            'IsExactlyEqualTo',
            'HasFractionalPartExactlyEqualTo'
        ]
        lower_infinity = float('-inf')
        upper_infinity = float('inf')
        allow_non_zero_integ_part = (
            self.customization_args['allowNonzeroIntegerPart'].value)
        allow_imp_frac = self.customization_args['allowImproperFraction'].value
        require_simple_form = (
            self.customization_args['requireSimplestForm'].value)

        for ans_group_index, answer_group in enumerate(self.answer_groups):
            for rule_spec_index, rule_spec in enumerate(
                answer_group.rule_specs
            ):
                # Rule should not be duplicate.
                if rule_spec.to_dict() in rule_spec_till_now and strict:
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' of answer group '
                        f'\'{ans_group_index}\' of FractionInput '
                        f'interaction is already present.'
                    )
                rule_spec_till_now.append(rule_spec.to_dict())

                if rule_spec.rule_type not in inputs_without_fractions:
                    num = rule_spec.inputs['f']['numerator']
                    den = rule_spec.inputs['f']['denominator']
                    whole = rule_spec.inputs['f']['wholeNumber']

                    # Solution should be in simplest form if the `simplest form`
                    # setting is turned on.
                    if require_simple_form and strict:
                        d = math.gcd(num, den)
                        val_num = num // d
                        val_den = den // d
                        if val_num != num and val_den != den:
                            raise utils.ValidationError(
                                f'The rule \'{rule_spec_index}\' of '
                                f'answer group \'{ans_group_index}\' do '
                                f'not have value in simple form '
                                f'in FractionInput interaction.'
                            )

                    if (
                        strict and
                        not allow_imp_frac and
                        den <= num and
                        (
                            rule_spec.rule_type in
                            rules_that_can_have_improper_fractions
                        )
                    ):
                        raise utils.ValidationError(
                            f'The rule \'{rule_spec_index}\' of '
                            f'answer group \'{ans_group_index}\' do '
                            f'not have value in proper fraction '
                            f'in FractionInput interaction.'
                        )

                # All rules should have solutions that is not subset of
                # previous rules' solutions.
                range_var: InteractionInstance.RangeVariableDict = {
                    'ans_group_index': int(ans_group_index),
                    'rule_spec_index': int(rule_spec_index),
                    'lower_bound': None,
                    'upper_bound': None,
                    'lb_inclusive': False,
                    'ub_inclusive': False
                }
                matched_denominator: (
                    InteractionInstance.MatchedDenominatorDict
                ) = {
                    'ans_group_index': int(ans_group_index),
                    'rule_spec_index': int(rule_spec_index),
                    'denominator': 0
                }

                if rule_spec.rule_type in (
                    'IsEquivalentTo', 'IsExactlyEqualTo',
                    'IsEquivalentToAndInSimplestForm'
                ):
                    if (
                        rule_spec.rule_type == 'IsExactlyEqualTo' and
                        not allow_non_zero_integ_part and
                        whole != 0 and
                        strict
                    ):
                        raise utils.ValidationError(
                            f'The rule \'{rule_spec_index}\' of '
                            f'answer group \'{ans_group_index}\' has '
                            f'non zero integer part '
                            f'in FractionInput interaction.'
                        )
                    rule_value_f = (
                        self._get_rule_value_of_fraction_interaction(rule_spec))
                    self._set_lower_and_upper_bounds(
                        range_var,
                        rule_value_f,
                        rule_value_f,
                        lb_inclusive=True,
                        ub_inclusive=True
                    )

                if rule_spec.rule_type == 'IsGreaterThan':
                    rule_value_f = (
                        self._get_rule_value_of_fraction_interaction(rule_spec))
                    self._set_lower_and_upper_bounds(
                        range_var,
                        rule_value_f,
                        upper_infinity,
                        lb_inclusive=False,
                        ub_inclusive=False
                    )

                if rule_spec.rule_type == 'IsLessThan':
                    rule_value_f = (
                        self._get_rule_value_of_fraction_interaction(rule_spec))
                    self._set_lower_and_upper_bounds(
                        range_var,
                        lower_infinity,
                        rule_value_f,
                        lb_inclusive=False,
                        ub_inclusive=False
                    )

                if rule_spec.rule_type == 'HasDenominatorEqualTo':
                    rule_value_x = int(rule_spec.inputs['x'])
                    matched_denominator['denominator'] = rule_value_x

                for range_ele in ranges:
                    earlier_rule = (
                        self.answer_groups[range_ele['ans_group_index']]
                        .rule_specs[range_ele['rule_spec_index']]
                    )
                    if (
                        self._should_check_range_criteria(
                            earlier_rule, rule_spec) and
                        self._is_enclosed_by(range_var, range_ele) and
                        strict
                    ):
                        raise utils.ValidationError(
                            f'Rule \'{rule_spec_index}\' from answer '
                            f'group \'{ans_group_index}\' of '
                            f'FractionInput interaction will '
                            f'never be matched because it is '
                            f'made redundant by the above rules'
                        )

                # `HasFractionalPartExactlyEqualTo` rule should always come
                # before `HasDenominatorEqualTo` rule where the fractional
                # denominator is equal to `HasDenominatorEqualTo` rule value.
                for den in matched_denominator_list:
                    if (
                        den is not None and rule_spec.rule_type ==
                        'HasFractionalPartExactlyEqualTo' and
                        den['denominator'] ==
                        rule_spec.inputs['f']['denominator']
                    ):
                        raise utils.ValidationError(
                            f'Rule \'{rule_spec_index}\' from answer '
                            f'group \'{ans_group_index}\' of '
                            f'FractionInput interaction having '
                            f'rule type HasFractionalPart'
                            f'ExactlyEqualTo will '
                            f'never be matched because it is '
                            f'made redundant by the above rules'
                        )

                ranges.append(range_var)
                matched_denominator_list.append(matched_denominator)

    def _validate_number_with_units_input(self, strict: bool = False) -> None:
        """Validates the NumberWithUnitsInput interaction.

        Args:
            strict: bool. If True, the exploration is assumed to be published.

        Raises:
            ValidationError. Duplicate rules are present.
            ValidationError. The 'IsEqualTo' rule comes after 'IsEquivalentTo'
                rule having same values.
        """
        number_with_units_rules = []
        rule_spec_till_now: List[RuleSpecDict] = []

        for ans_group_index, answer_group in enumerate(self.answer_groups):
            for rule_spec_index, rule_spec in enumerate(
                answer_group.rule_specs
            ):
                # Rule should not be duplicate.
                if rule_spec.to_dict() in rule_spec_till_now and strict:
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' of answer group '
                        f'\'{ans_group_index}\' of NumberWithUnitsInput '
                        f'interaction is already present.'
                    )
                rule_spec_till_now.append(rule_spec.to_dict())

                # `IsEqualTo` rule should not come after `IsEquivalentTo` rule.
                if rule_spec.rule_type == 'IsEquivalentTo':
                    number_with_units_rules.append(rule_spec.inputs['f'])
                if (
                    rule_spec.rule_type == 'IsEqualTo' and
                    rule_spec.inputs['f'] in number_with_units_rules and
                    strict
                ):
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' of answer '
                        f'group \'{ans_group_index}\' has '
                        f'rule type equal is coming after '
                        f'rule type equivalent having same value '
                        f'in FractionInput interaction.'
                    )

    def _validate_multi_choice_input(self, strict: bool = False) -> None:
        """Validates the MultipleChoiceInput interaction.

        Args:
            strict: bool. If True, the exploration is assumed to be published.

        Raises:
            ValidationError. Duplicate rules are present.
            ValidationError. Answer choices are empty or duplicate.
        """
        rule_spec_till_now: List[RuleSpecDict] = []

        choices = self.customization_args['choices'].value
        self._validates_choices_should_be_unique_and_nonempty(choices)

        for ans_group_index, answer_group in enumerate(self.answer_groups):
            for rule_spec_index, rule_spec in enumerate(
                answer_group.rule_specs
            ):
                # Rule should not be duplicate.
                if rule_spec.to_dict() in rule_spec_till_now and strict:
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' of answer group '
                        f'\'{ans_group_index}\' of MultipleChoiceInput '
                        f'interaction is already present.'
                    )
                rule_spec_till_now.append(rule_spec.to_dict())

    def _validate_item_selec_input(self, strict: bool = False) -> None:
        """Validates the ItemSelectionInput interaction.

        Args:
            strict: bool. If True, the exploration is assumed to be published.

        Raises:
            ValidationError. Duplicate rules are present.
            ValidationError. The 'Equals' rule does not have value between min
                and max number of selections.
            ValidationError. Minimum number of selections value is greater
                than maximum number of selections value.
            ValidationError. Not enough choices to have minimum number of
                selections.
            ValidationError. Answer choices are empty or duplicate.
        """
        min_value = (
            self.customization_args['minAllowableSelectionCount'].value)
        max_value = (
            self.customization_args['maxAllowableSelectionCount'].value)
        rule_spec_till_now: List[RuleSpecDict] = []

        choices = self.customization_args['choices'].value
        self._validates_choices_should_be_unique_and_nonempty(choices)

        # Minimum number of selections should be no greater than maximum
        # number of selections.
        if min_value > max_value:
            raise utils.ValidationError(
                f'Min value which is {str(min_value)} '
                f'is greater than max value '
                f'which is {str(max_value)} '
                f'in ItemSelectionInput interaction.'
            )

        # There should be enough choices to have minimum number
        # of selections.
        if len(choices) < min_value:
            raise utils.ValidationError(
                f'Number of choices which is {str(len(choices))} '
                f'is lesser than the '
                f'min value selection which is {str(min_value)} '
                f'in ItemSelectionInput interaction.'
            )

        for ans_group_index, answer_group in enumerate(self.answer_groups):
            for rule_spec_index, rule_spec in enumerate(
                answer_group.rule_specs
            ):
                # Rule should not be duplicate.
                if rule_spec.to_dict() in rule_spec_till_now and strict:
                    raise utils.ValidationError(
                        f'The rule {rule_spec_index} of answer group '
                        f'{ans_group_index} of ItemSelectionInput interaction '
                        f'is already present.'
                    )
                rule_spec_till_now.append(rule_spec.to_dict())

                # `Equals` should have between min and max number of selections.
                if rule_spec.rule_type == 'Equals':
                    if (
                        strict and
                        (
                            len(rule_spec.inputs['x']) < min_value or
                            len(rule_spec.inputs['x']) > max_value
                        )
                    ):
                        raise utils.ValidationError(
                            f'Selected choices of rule \'{rule_spec_index}\' '
                            f'of answer group \'{ans_group_index}\' '
                            f'either less than min_selection_value '
                            f'or greater than max_selection_value '
                            f'in ItemSelectionInput interaction.'
                        )

    def _validate_drag_and_drop_input(self, strict: bool = False) -> None:
        """Validates the DragAndDropInput interaction.

        Args:
            strict: bool. If True, the exploration is assumed to be published.

        Raises:
            ValidationError. Duplicate rules are present.
            ValidationError. Multiple items at the same place when the setting
                is turned off.
            ValidationError. The 'IsEqualToOrderingWithOneItemAtIncorrect
                Position' rule present when 'multiple items at same place'
                setting turned off.
            ValidationError. In 'HasElementXBeforeElementY' rule, 'X' value
                is equal to 'Y' value.
            ValidationError. The 'IsEqualToOrdering' rule have empty values.
            ValidationError. The 'IsEqualToOrdering' rule comes after
                'HasElementXAtPositionY' where element 'X' is present at
                position 'Y' in 'IsEqualToOrdering' rule.
            ValidationError. Less than 2 items are present.
            ValidationError. Answer choices are empty or duplicate.
        """
        multi_item_value = (
            self.customization_args
            ['allowMultipleItemsInSamePosition'].value)
        ele_x_at_y_rules = []
        rule_spec_till_now: List[RuleSpecDict] = []
        equal_ordering_one_at_incorec_posn = []

        choices = self.customization_args['choices'].value
        if len(choices) < 2:
            raise utils.ValidationError(
                'There should be atleast 2 values inside DragAndDrop '
                'interaction.'
            )

        self._validates_choices_should_be_unique_and_nonempty(choices)

        for ans_group_index, answer_group in enumerate(self.answer_groups):
            for rule_spec_index, rule_spec in enumerate(
                answer_group.rule_specs
            ):
                # Rule should not be duplicate.
                if rule_spec.to_dict() in rule_spec_till_now and strict:
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' of answer group '
                        f'\'{ans_group_index}\' of DragAndDropInput '
                        f'interaction is already present.'
                    )
                rule_spec_till_now.append(rule_spec.to_dict())

                if (
                    strict and
                    not multi_item_value and (
                    rule_spec.rule_type ==
                    'IsEqualToOrderingWithOneItemAtIncorrectPosition')
                ):
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' '
                        f'of answer group \'{ans_group_index}\' '
                        f'having rule type - IsEqualToOrderingWith'
                        f'OneItemAtIncorrectPosition should not '
                        f'be there when the '
                        f'multiple items in same position '
                        f'setting is turned off '
                        f'in DragAndDropSortInput interaction.'
                    )

                # Multiple items cannot be in the same place iff the
                # `allow multiple items at same place` setting is turned off.
                if not multi_item_value and strict:
                    for ele in rule_spec.inputs['x']:
                        if len(ele) > 1:
                            raise utils.ValidationError(
                                f'The rule \'{rule_spec_index}\' of '
                                f'answer group \'{ans_group_index}\' '
                                f'have multiple items at same place '
                                f'when multiple items in same '
                                f'position settings is turned off '
                                f'in DragAndDropSortInput interaction.'
                            )

                if (
                    rule_spec.rule_type == 'HasElementXBeforeElementY' and
                    rule_spec.inputs['x'] == rule_spec.inputs['y'] and
                    strict
                ):
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_index}\' of '
                        f'answer group \'{ans_group_index}\', '
                        f'the value 1 and value 2 cannot be '
                        f'same when rule type is '
                        f'HasElementXBeforeElementY '
                        f'of DragAndDropSortInput interaction.'
                    )

                if rule_spec.rule_type == 'HasElementXAtPositionY':
                    element = rule_spec.inputs['x']
                    position = rule_spec.inputs['y']
                    ele_x_at_y_rules.append(
                        {'element': element, 'position': position}
                    )

                if (
                    rule_spec.rule_type ==
                    'IsEqualToOrderingWithOneItemAtIncorrectPosition'
                ):
                    equal_ordering_one_at_incorec_posn.append(
                        rule_spec.inputs['x']
                    )

                if rule_spec.rule_type == 'IsEqualToOrdering':
                    # `IsEqualToOrdering` rule should not have empty values.
                    if len(rule_spec.inputs['x']) <= 0:
                        raise utils.ValidationError(
                            f'The rule \'{rule_spec_index}\'of '
                            f'answer group \'{ans_group_index}\', '
                            f'having rule type IsEqualToOrdering '
                            f'should not have empty values.'
                        )
                    if strict:
                        # `IsEqualToOrdering` rule should always come before
                        # `HasElementXAtPositionY` where element `X` is present
                        # at position `Y` in `IsEqualToOrdering` rule.
                        for ele in ele_x_at_y_rules:
                            ele_position = ele['position']
                            ele_element = ele['element']

                            if ele_position > len(rule_spec.inputs['x']):
                                raise utils.ValidationError(
                                    f'Rule - {rule_spec_index} of '
                                    f'answer group {ans_group_index} '
                                    f'does not have the enough position '
                                    f'to match for the '
                                    f'HasElementXAtPositionY rule above.'
                                )

                            rule_choice = rule_spec.inputs['x'][
                                ele_position - 1]
                            for choice in rule_choice:
                                if choice == ele_element:
                                    raise utils.ValidationError(
                                        f'Rule - {rule_spec_index} of '
                                        f'answer group {ans_group_index} '
                                        f'will never be match '
                                        f'because it is made redundant by the '
                                        f'HasElementXAtPositionY rule above.'
                                    )
                        # `IsEqualToOrdering` should always come before
                        # `IsEqualToOrderingWithOneItemAtIncorrectPosition` when
                        # they are off by one value.
                        item_to_layer_idx = {}
                        for layer_idx, layer in enumerate(
                            rule_spec.inputs['x']
                        ):
                            for item in layer:
                                item_to_layer_idx[item] = layer_idx

                        for ele in equal_ordering_one_at_incorec_posn:
                            wrong_positions = 0
                            for layer_idx, layer in enumerate(ele):
                                for item in layer:
                                    if layer_idx != item_to_layer_idx[item]:
                                        wrong_positions += 1
                            if wrong_positions <= 1:
                                raise utils.ValidationError(
                                    f'Rule - {rule_spec_index} of answer '
                                    f'group {ans_group_index} will never '
                                    f'be match because it is made '
                                    f'redundant by the IsEqualToOrdering'
                                    f'WithOneItemAtIncorrectPosition '
                                    f'rule above.'
                                )

    def _validate_text_input(self, strict: bool = False) -> None:
        """Validates the TextInput interaction.

        Args:
            strict: bool. If True, the exploration is assumed to be published.

        Raises:
            ValidationError. Text input height is not >= 1 and <= 10.
            ValidationError. Duplicate rules are present.
            ValidationError. The 'Contains' rule comes before another 'Contains'
                rule, where 'Contains' rule string is a substring of other
                rules string.
            ValidationError. The 'Contains' rule comes before 'StartsWith'
                rule, where 'Contains' rule string is a substring of other
                rules string.
            ValidationError. The 'Contains' rule comes before 'Equals'
                rule, where 'Contains' rule string is a substring of other
                rules string.
            ValidationError. The 'StartsWith' rule comes before the 'Equals'
                rule where the 'StartsWith' rule string is a prefix of other
                rules string.
            ValidationError. The 'StartsWith' rule comes before the another
                'StartsWith' rule where the 'StartsWith' rule string is
                a prefix of other rules string.
        """
        rule_spec_till_now: List[RuleSpecDict] = []
        seen_strings_contains: List[List[str]] = []
        seen_strings_startswith: List[List[str]] = []

        rows_value = int(self.customization_args['rows'].value)
        if rows_value < 1 or rows_value > 10:
            raise utils.ValidationError(
                'Rows value in Text interaction should be between 1 and 10.'
            )

        for ans_group_idx, answer_group in enumerate(self.answer_groups):
            for rule_spec_idx, rule_spec in enumerate(answer_group.rule_specs):
                # Rule should not be duplicate.
                if rule_spec.to_dict() in rule_spec_till_now and strict:
                    raise utils.ValidationError(
                        f'The rule \'{rule_spec_idx}\' of answer group '
                        f'\'{ans_group_idx}\' of TextInput interaction '
                        f'is already present.'
                    )
                rule_spec_till_now.append(rule_spec.to_dict())

                if rule_spec.rule_type == 'Contains':
                    if not strict:
                        continue
                    rule_values = rule_spec.inputs['x']['normalizedStrSet']
                    # `Contains` should always come after another
                    # `Contains` rule where the first contains rule
                    # strings is a substring of the other contains
                    # rule strings.
                    for contain_rule_ele in seen_strings_contains:
                        for contain_rule_string in contain_rule_ele:
                            for rule_value in rule_values:
                                if contain_rule_string in rule_value:
                                    raise utils.ValidationError(
                                        f'Rule - \'{rule_spec_idx}\' of answer '
                                        f'group - \'{ans_group_idx}\' having '
                                        f'rule type \'{rule_spec.rule_type}\' '
                                        f'will never be matched because it '
                                        f'is made redundant by the above '
                                        f'\'contains\' rule.'
                                    )

                    seen_strings_contains.append(
                        rule_spec.inputs['x']['normalizedStrSet'])

                if rule_spec.rule_type == 'StartsWith':
                    if not strict:
                        continue
                    rule_values = rule_spec.inputs['x']['normalizedStrSet']
                    # `StartsWith` rule should always come after another
                    # `StartsWith` rule where the first starts-with string
                    # is the prefix of the other starts-with string.
                    for start_with_rule_ele in seen_strings_startswith:
                        for start_with_rule_string in start_with_rule_ele:
                            for rule_value in rule_values:
                                if rule_value.startswith(
                                    start_with_rule_string
                                ):
                                    raise utils.ValidationError(
                                        f'Rule - \'{rule_spec_idx}\' of answer '
                                        f'group - \'{ans_group_idx}\' having '
                                        f'rule type \'{rule_spec.rule_type}\' '
                                        f'will never be matched because it '
                                        f'is made redundant by the above '
                                        f'\'StartsWith\' rule.'
                                    )

                    # `Contains` should always come after `StartsWith` rule
                    # where the contains rule strings is a substring
                    # of the `StartsWith` rule string.
                    for contain_rule_ele in seen_strings_contains:
                        for contain_rule_string in contain_rule_ele:
                            for rule_value in rule_values:
                                if contain_rule_string in rule_value:
                                    raise utils.ValidationError(
                                        f'Rule - \'{rule_spec_idx}\' of answer '
                                        f'group - \'{ans_group_idx}\' having '
                                        f'rule type \'{rule_spec.rule_type}\' '
                                        f'will never be matched because it '
                                        f'is made redundant by the above '
                                        f'\'contains\' rule.'
                                    )

                    seen_strings_startswith.append(rule_values)

                if rule_spec.rule_type == 'Equals':
                    if not strict:
                        continue
                    rule_values = rule_spec.inputs['x']['normalizedStrSet']
                    # `Contains` should always come after `Equals` rule
                    # where the contains rule strings is a substring
                    # of the `Equals` rule string.
                    for contain_rule_ele in seen_strings_contains:
                        for contain_rule_string in contain_rule_ele:
                            for rule_value in rule_values:
                                if contain_rule_string in rule_value:
                                    raise utils.ValidationError(
                                        f'Rule - \'{rule_spec_idx}\' of answer '
                                        f'group - \'{ans_group_idx}\' having '
                                        f'rule type \'{rule_spec.rule_type}\' '
                                        f'will never be matched because it '
                                        f'is made redundant by the above '
                                        f'\'contains\' rule.'
                                    )

                    # `Startswith` should always come after the `Equals`
                    # rule where a `starts-with` string is a prefix of the
                    # `Equals` rule's string.
                    for start_with_rule_ele in seen_strings_startswith:
                        for start_with_rule_string in start_with_rule_ele:
                            for rule_value in rule_values:
                                if rule_value.startswith(
                                    start_with_rule_string
                                ):
                                    raise utils.ValidationError(
                                        f'Rule - \'{rule_spec_idx}\' of answer '
                                        f'group - \'{ans_group_idx}\' having '
                                        f'rule type \'{rule_spec.rule_type}\' '
                                        f'will never be matched because it '
                                        f'is made redundant by the above '
                                        f'\'StartsWith\' rule.'
                                    )

    def validate(
        self,
        exp_param_specs_dict: Dict[str, param_domain.ParamSpec],
        *,
        tagged_skill_misconception_id_required: bool = False,
        strict: bool = False
    ) -> None:
        """Validates various properties of the InteractionInstance.

        Args:
            exp_param_specs_dict: dict. A dict of specified parameters used in
                the exploration. Keys are parameter names and values are
                ParamSpec value objects with an object type property(obj_type).
                Is used to validate AnswerGroup objects.
            tagged_skill_misconception_id_required: bool. The 'tagged_skill_
                misconception_id' is required or not.
            strict: bool. Tells if the validation is strict or not.

        Raises:
            ValidationError. One or more attributes of the InteractionInstance
                are invalid.
        """
        if not isinstance(self.id, str):
            raise utils.ValidationError(
                'Expected interaction id to be a string, received %s' %
                self.id)
        try:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                self.id)
        except KeyError as e:
            raise utils.ValidationError(
                'Invalid interaction id: %s' % self.id) from e

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
        if self.is_linear and self.answer_groups:
            raise utils.ValidationError(
                'Linear interactions must not have any answer groups.')

        for answer_group in self.answer_groups:
            answer_group.validate(
                interaction, exp_param_specs_dict,
                tagged_skill_misconception_id_required=(
                    tagged_skill_misconception_id_required))
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

        # TODO(#16236): Find a way to encode these checks more declaratively.
        # Conceptually the validation code should go in each interaction
        # and as inside the interaction the code is very declarative we need
        # to figure out a way to put these validations following the
        # same format.
        # TODO(#16490): Move the validations with strict mode together in every
        # interaction.
        interaction_id_to_strict_validation_func = {
            'NumericInput': self._validate_numeric_input,
            'FractionInput': self._validate_fraction_input,
            'NumberWithUnits': self._validate_number_with_units_input,
            'MultipleChoiceInput': self._validate_multi_choice_input,
            'ItemSelectionInput': self._validate_item_selec_input,
            'DragAndDropSortInput': self._validate_drag_and_drop_input,
            'TextInput': self._validate_text_input
        }
        interaction_id_to_non_strict_validation_func = {
            'Continue': self._validate_continue_interaction,
            'EndExploration': self._validate_end_interaction
        }

        if self.id in interaction_id_to_strict_validation_func:
            interaction_id_to_strict_validation_func[self.id](strict)

        elif self.id in interaction_id_to_non_strict_validation_func:
            interaction_id_to_non_strict_validation_func[self.id]()

    def _validate_customization_args(self) -> None:
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
                except AttributeError as e:
                    raise utils.ValidationError(
                        'Expected customization arg value to be a '
                        'InteractionCustomizationArg domain object, '
                        'received %s' % self.customization_args[ca_name]
                    ) from e

        # Here, we are asserting that interaction_id is never going to be None,
        # Because this is a private method and before calling this method we are
        # already checking if interaction_id exists or not.
        assert self.id is not None
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
    def create_default_interaction(
        cls, default_dest_state_name: Optional[str]
    ) -> InteractionInstance:
        """Create a default InteractionInstance domain object:
            - customization_args: empty dictionary;
            - answer_groups: empty list;
            - default_outcome: dest is set to 'default_dest_state_name' and
                feedback and param_changes are initialized as empty lists;
            - confirmed_unclassified_answers: empty list;

        Args:
            default_dest_state_name: str|None. The default destination state, or
                None if no default destination is provided.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object with default values.
        """
        default_outcome = Outcome(
            default_dest_state_name,
            None,
            SubtitledHtml.create_default_subtitled_html(
                feconf.DEFAULT_OUTCOME_CONTENT_ID), False, [], None, None)

        return cls(
            cls._DEFAULT_INTERACTION_ID, {}, [], default_outcome, [], [], None)

    def get_all_html_content_strings(self) -> List[str]:
        """Get all html content strings in the interaction.

        Returns:
            list(str). The list of all html content strings in the interaction.

        Raises:
            Exception. The solution has invalid type.
        """
        html_list = []

        for answer_group in self.answer_groups:
            # Here, we are asserting that self.id is never going to be None,
            # because interaction_id can only be None when there are no answer
            # groups.
            assert self.id is not None
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
                            # Here we use cast because above 'if' clause forces
                            # 'correct_answer' to be of type List[List[str]].
                            list_of_set_of_html_answer = cast(
                                List[List[str]], self.solution.correct_answer
                            )
                            for set_of_html_value in list_of_set_of_html_answer:
                                html_list += set_of_html_value
                        elif html_type == feconf.ANSWER_TYPE_SET_OF_HTML:
                            # Here we use cast because above 'elif' clause
                            # forces 'correct_answer' to be of type List[str].
                            set_of_html_answer = cast(
                                List[str], self.solution.correct_answer
                            )
                            for html_value in set_of_html_answer:
                                html_list += [html_value]
                        else:
                            raise Exception(
                                'The solution does not have a valid '
                                'correct_answer type.')

        for ca_name in self.customization_args:
            html_list += self.customization_args[ca_name].get_html()

        return html_list

    @staticmethod
    def convert_html_in_interaction(
        interaction_dict: InteractionInstanceDict,
        ca_specs_dict: List[domain.CustomizationArgSpecsDict],
        conversion_fn: Callable[[str], str]
    ) -> InteractionInstanceDict:
        """Checks for HTML fields in the interaction and converts it
        according to the conversion function.

        Args:
            interaction_dict: dict. The interaction dict.
            ca_specs_dict: dict. The customization args dict.
            conversion_fn: function. The function to be used for converting the
                HTML.

        Returns:
            dict. The converted interaction dict.
        """
        def wrapped_conversion_fn(
            value: SubtitledHtml, schema_obj_type: str
        ) -> SubtitledHtml:
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

        # Convert the customization_args to a dictionary of customization arg
        # name to InteractionCustomizationArg, so that we can utilize
        # InteractionCustomizationArg helper functions.
        # Then, convert back to original dict format afterwards, at the end.
        customization_args = (
            InteractionCustomizationArg
            .convert_cust_args_dict_to_cust_args_based_on_specs(
                interaction_dict['customization_args'],
                ca_specs_dict)
        )

        for ca_spec in ca_specs_dict:
            ca_spec_name = ca_spec['name']
            customization_args[ca_spec_name].value = (
                InteractionCustomizationArg.traverse_by_schema_and_convert(
                    ca_spec['schema'],
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
        interaction_id: Optional[str],
        customization_args_dict: CustomizationArgsDictType,
        state_schema_version: int = feconf.CURRENT_STATE_SCHEMA_VERSION
    ) -> Dict[str, InteractionCustomizationArg]:
        """Converts customization arguments dictionary to customization
        arguments. This is done by converting each customization argument to a
        InteractionCustomizationArg domain object.

        Args:
            interaction_id: str. The interaction id.
            customization_args_dict: dict. A dictionary of customization
                argument name to a customization argument dict, which is a dict
                of the single key 'value' to the value of the customization
                argument.
            state_schema_version: int. The state schema version.

        Returns:
            dict. A dictionary of customization argument names to the
            InteractionCustomizationArg domain object's.
        """
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids()
        )
        interaction_id_is_valid = interaction_id not in all_interaction_ids
        if interaction_id_is_valid or interaction_id is None:
            return {}

        ca_specs_dict = (
            interaction_registry.Registry
            .get_all_specs_for_state_schema_version(
                state_schema_version,
                can_fetch_latest_specs=True
            )[interaction_id]['customization_arg_specs']
        )

        return (
            InteractionCustomizationArg
            .convert_cust_args_dict_to_cust_args_based_on_specs(
                customization_args_dict, ca_specs_dict))


class InteractionCustomizationArg(translation_domain.BaseTranslatableObject):
    """Object representing an interaction's customization argument.
    Any SubtitledHtml or SubtitledUnicode values in the customization argument
    value are represented as their respective domain objects here, rather than a
    SubtitledHtml dict or SubtitledUnicode dict.
    """

    # Here we use type Any because values in schema dictionary can be of type
    # str, List, Dict and other types too. We also use type Any for `value`
    # because it can be of type SubtitledHtmlDict, SubtitledUnicodeDict
    # and so on.
    def __init__(
        self,
        value: Any,
        schema: Dict[
            str, Union[SubtitledHtmlDict, SubtitledUnicodeDict, str]
        ]
    ) -> None:
        """Initializes a InteractionCustomizationArg domain object.

        Args:
            value: *. The value of the interaction customization argument.
            schema: dict. The schema defining the specification of the value.
        """
        self.value = value
        self.schema = schema

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the interaction customization
        args.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        subtitled_htmls = self.get_subtitled_html()
        for subtitled_html in subtitled_htmls:
            html_string = subtitled_html.html
            # Make sure we don't include content that only consists of
            # numbers. See issue #13055.
            if not html_string.isnumeric():
                translatable_contents_collection.add_translatable_field(
                    translation_domain.TranslatableContentFormat.HTML,
                    subtitled_html.content_id,
                    html_string)

        subtitled_unicodes = self.get_subtitled_unicode()
        for subtitled_unicode in subtitled_unicodes:
            translatable_contents_collection.add_translatable_field(
                translation_domain.TranslatableContentFormat.UNICODE_STRING,
                subtitled_unicode.content_id,
                subtitled_unicode.unicode_str)
        return translatable_contents_collection

    # Here we use type Any because this method returns the values of
    # customization args and that values can be of type str, int, bool,
    # List and other types too. So to make the return type generalize
    # for every type of values, we used Any here.
    def to_customization_arg_dict(self) -> Dict[str, Any]:
        """Converts a InteractionCustomizationArgument domain object to a
        customization argument dictionary. This is done by
        traversing the customization argument schema, and converting
        SubtitledUnicode to unicode and SubtitledHtml to html where appropriate.
        """
        @overload
        def convert_content_to_dict(
            ca_value: SubtitledHtml, unused_schema_obj_type: str
        ) -> SubtitledHtmlDict: ...

        @overload
        def convert_content_to_dict(
            ca_value: SubtitledUnicode, unused_schema_obj_type: str
        ) -> SubtitledUnicodeDict: ...

        def convert_content_to_dict(
            ca_value: Union[SubtitledHtml, SubtitledUnicode],
            unused_schema_obj_type: str
        ) -> Union[SubtitledHtmlDict, SubtitledUnicodeDict]:
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

    # Here we use type Any because argument 'ca_schema' can accept schema
    # dictionaries that can contain values of types str, List, Dict and other
    # types too.
    @classmethod
    def from_customization_arg_dict(
        cls, ca_dict: CustomizationArgsDictType, ca_schema: Dict[str, Any]
    ) -> InteractionCustomizationArg:
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
        @overload
        def convert_content_to_domain_obj(
            ca_value: Dict[str, str],
            schema_obj_type: Literal['SubtitledUnicode']
        ) -> SubtitledUnicode: ...

        @overload
        def convert_content_to_domain_obj(
            ca_value: Dict[str, str],
            schema_obj_type: Literal['SubtitledHtml']
        ) -> SubtitledHtml: ...

        def convert_content_to_domain_obj(
            ca_value: Dict[str, str], schema_obj_type: str
        ) -> Union[SubtitledHtml, SubtitledUnicode]:
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
                class_obj: Union[
                    SubtitledUnicode, SubtitledHtml
                ] = SubtitledUnicode(
                    ca_value['content_id'], ca_value['unicode_str'])

            if schema_obj_type == schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML:
                class_obj = SubtitledHtml(
                    ca_value['content_id'], ca_value['html'])
            return class_obj

        ca_value = InteractionCustomizationArg.traverse_by_schema_and_convert(
            ca_schema,
            copy.deepcopy(ca_dict['value']),
            convert_content_to_domain_obj
        )

        return cls(ca_value, ca_schema)

    def get_subtitled_unicode(self) -> List[SubtitledUnicode]:
        """Get all SubtitledUnicode(s) in the customization argument.

        Returns:
            list(SubtitledUnicode). A list of SubtitledUnicode.
        """
        return InteractionCustomizationArg.traverse_by_schema_and_get(
            self.schema,
            self.value,
            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE],
            lambda x: x
        )

    def get_subtitled_html(self) -> List[SubtitledHtml]:
        """Get all SubtitledHtml(s) in the customization argument.

        Returns:
            list(SubtitledHtml). A list of SubtitledHtml.
        """
        return InteractionCustomizationArg.traverse_by_schema_and_get(
            self.schema,
            self.value,
            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML],
            lambda x: x
        )

    def get_content_ids(self) -> List[str]:
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

    def get_html(self) -> List[str]:
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

    def validate_subtitled_html(self) -> None:
        """Calls the validate method on all SubtitledHtml domain objects in
        the customization arguments.
        """
        def validate_html(subtitled_html: SubtitledHtml) -> None:
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

    # TODO(#15982): Here we use type Any because `value` argument can accept
    # values of customization arg and that values can be of type Dict[Dict[..]],
    # str, int, bool and other types too, and for argument `schema` we used Any
    # type because values in schema dictionary can be of type str, List, Dict
    # and other types too.
    @staticmethod
    def traverse_by_schema_and_convert(
        schema: Dict[str, Any],
        value: Any,
        conversion_fn: AcceptableConversionFnType
    ) -> Any:
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

    # TODO(#15982): Here we use type Any because `value` argument can accept
    # values of customization arg and that values can be of type Dict[Dict[..]],
    # str, int, bool and other types too, and for argument `schema` we used Any
    # type because values in schema dictionary can be of type str, List, Dict
    # and other types too.
    @staticmethod
    def traverse_by_schema_and_get(
        schema: Dict[str, Any],
        value: Any,
        obj_types_to_search_for: List[str],
        value_extractor: Union[Callable[..., str], Callable[..., None]]
    ) -> List[Any]:
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

    @staticmethod
    def convert_cust_args_dict_to_cust_args_based_on_specs(
        ca_dict: CustomizationArgsDictType,
        ca_specs_dict: List[domain.CustomizationArgSpecsDict]
    ) -> Dict[str, InteractionCustomizationArg]:
        """Converts customization arguments dictionary to customization
        arguments. This is done by converting each customization argument to a
        InteractionCustomizationArg domain object.

        Args:
            ca_dict: dict. A dictionary of customization
                argument name to a customization argument dict, which is a dict
                of the single key 'value' to the value of the customization
                argument.
            ca_specs_dict: dict. A dictionary of customization argument specs.

        Returns:
            dict. A dictionary of customization argument names to the
            InteractionCustomizationArg domain object's.
        """
        return {
            spec['name']: (
                InteractionCustomizationArg.from_customization_arg_dict(
                    ca_dict[spec['name']],
                    spec['schema']
                )
            ) for spec in ca_specs_dict
        }


class OutcomeDict(TypedDict):
    """Dictionary representing the Outcome object."""

    dest: Optional[str]
    dest_if_really_stuck: Optional[str]
    feedback: SubtitledHtmlDict
    labelled_as_correct: bool
    param_changes: List[param_domain.ParamChangeDict]
    refresher_exploration_id: Optional[str]
    missing_prerequisite_skill_id: Optional[str]


class Outcome(translation_domain.BaseTranslatableObject):
    """Value object representing an outcome of an interaction. An outcome
    consists of a destination state, feedback to show the user, and any
    parameter changes.
    """

    def __init__(
        self,
        dest: Optional[str],
        dest_if_really_stuck: Optional[str],
        feedback: SubtitledHtml,
        labelled_as_correct: bool,
        param_changes: List[param_domain.ParamChange],
        refresher_exploration_id: Optional[str],
        missing_prerequisite_skill_id: Optional[str]
    ) -> None:
        """Initializes a Outcome domain object.

        Args:
            dest: str. The name of the destination state.
            dest_if_really_stuck: str or None. The name of the optional state
                to redirect the learner to strengthen their concepts.
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
        # An optional destination state to redirect the learner to
        # strengthen their concepts corresponding to a particular card.
        self.dest_if_really_stuck = dest_if_really_stuck
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

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the outcome.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.HTML,
            self.feedback.content_id,
            self.feedback.html)
        return translatable_contents_collection

    def to_dict(self) -> OutcomeDict:
        """Returns a dict representing this Outcome domain object.

        Returns:
            dict. A dict, mapping all fields of Outcome instance.
        """
        return {
            'dest': self.dest,
            'dest_if_really_stuck': self.dest_if_really_stuck,
            'feedback': self.feedback.to_dict(),
            'labelled_as_correct': self.labelled_as_correct,
            'param_changes': [
                param_change.to_dict() for param_change in self.param_changes],
            'refresher_exploration_id': self.refresher_exploration_id,
            'missing_prerequisite_skill_id': self.missing_prerequisite_skill_id
        }

    # TODO(#16467): Remove `validate` argument after validating all Question
    # states by writing a migration and audit job. As the validation for
    # outcome is common between Exploration and Question and the Question
    # data is not yet migrated, we do not want to call the validations
    # while we load the Question.
    @classmethod
    def from_dict(
        cls, outcome_dict: OutcomeDict, validate: bool = True
    ) -> Outcome:
        """Return a Outcome domain object from a dict.

        Args:
            outcome_dict: dict. The dict representation of Outcome object.
            validate: bool. False, when the validations should not be called.

        Returns:
            Outcome. The corresponding Outcome domain object.
        """
        feedback = SubtitledHtml.from_dict(outcome_dict['feedback'])
        if validate:
            feedback.validate()
        return cls(
            outcome_dict['dest'],
            outcome_dict['dest_if_really_stuck'],
            feedback,
            outcome_dict['labelled_as_correct'],
            [param_domain.ParamChange(
                param_change['name'], param_change['generator_id'],
                param_change['customization_args'])
             for param_change in outcome_dict['param_changes']],
            outcome_dict['refresher_exploration_id'],
            outcome_dict['missing_prerequisite_skill_id']
        )

    def validate(self) -> None:
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
            if not isinstance(self.missing_prerequisite_skill_id, str):
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
            if not isinstance(self.refresher_exploration_id, str):
                raise utils.ValidationError(
                    'Expected outcome refresher_exploration_id to be a string, '
                    'received %s' % self.refresher_exploration_id)

    @staticmethod
    def convert_html_in_outcome(
        outcome_dict: OutcomeDict, conversion_fn: Callable[[str], str]
    ) -> OutcomeDict:
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


class VoiceoverDict(TypedDict):
    """Dictionary representing the Voiceover object."""

    filename: str
    file_size_bytes: int
    needs_update: bool
    duration_secs: float


class Voiceover:
    """Value object representing an voiceover."""

    def to_dict(self) -> VoiceoverDict:
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
    def from_dict(cls, voiceover_dict: VoiceoverDict) -> Voiceover:
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

    def __init__(
        self,
        filename: str,
        file_size_bytes: int,
        needs_update: bool,
        duration_secs: float
    ) -> None:
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

    def validate(self) -> None:
        """Validates properties of the Voiceover.

        Raises:
            ValidationError. One or more attributes of the Voiceover are
                invalid.
        """
        if not isinstance(self.filename, str):
            raise utils.ValidationError(
                'Expected audio filename to be a string, received %s' %
                self.filename)
        dot_index = self.filename.rfind('.')
        if dot_index in (-1, 0):
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
        if not isinstance(self.duration_secs, (float, int)):
            raise utils.ValidationError(
                'Expected duration_secs to be a float, received %s' %
                self.duration_secs)
        if self.duration_secs < 0:
            raise utils.ValidationError(
                'Expected duration_secs to be positive number, '
                'or zero if not yet specified %s' %
                self.duration_secs)


class WrittenTranslationDict(TypedDict):
    """Dictionary representing the WrittenTranslation object."""

    data_format: str
    translation: Union[str, List[str]]
    needs_update: bool


class WrittenTranslation:
    """Value object representing a written translation for a content.

    Here, "content" could mean a string or a list of strings. The latter arises,
    for example, in the case where we are checking for equality of a learner's
    answer against a given set of strings. In such cases, the number of strings
    in the translation of the original object may not be the same as the number
    of strings in the original object.
    """

    DATA_FORMAT_HTML: Final = 'html'
    DATA_FORMAT_UNICODE_STRING: Final = 'unicode'
    DATA_FORMAT_SET_OF_NORMALIZED_STRING: Final = 'set_of_normalized_string'
    DATA_FORMAT_SET_OF_UNICODE_STRING: Final = 'set_of_unicode_string'

    DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE: Dict[
        str, translatable_object_registry.TranslatableObjectNames
    ] = {
        DATA_FORMAT_HTML: 'TranslatableHtml',
        DATA_FORMAT_UNICODE_STRING: 'TranslatableUnicodeString',
        DATA_FORMAT_SET_OF_NORMALIZED_STRING: (
            'TranslatableSetOfNormalizedString'),
        DATA_FORMAT_SET_OF_UNICODE_STRING: 'TranslatableSetOfUnicodeString',
    }

    @classmethod
    def is_data_format_list(cls, data_format: str) -> bool:
        """Checks whether the content of translation with given format is of
        a list type.

        Args:
            data_format: str. The format of the translation.

        Returns:
            bool. Whether the content of translation is a list.
        """
        return data_format in (
            cls.DATA_FORMAT_SET_OF_NORMALIZED_STRING,
            cls.DATA_FORMAT_SET_OF_UNICODE_STRING
        )

    def __init__(
        self,
        data_format: str,
        translation: Union[str, List[str]],
        needs_update: bool
    ) -> None:
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

    def to_dict(self) -> WrittenTranslationDict:
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
    def from_dict(
        cls, written_translation_dict: WrittenTranslationDict
    ) -> WrittenTranslation:
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

    def validate(self) -> None:
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

        # Validate translations.
        if self.data_format == 'html':
            # Ruling out the possibility of different types for mypy
            # type checking.
            assert isinstance(self.translation, str)
            html_cleaner.validate_rte_tags(self.translation)
            html_cleaner.validate_tabs_and_collapsible_rte_tags(
                self.translation)


class WrittenTranslationsDict(TypedDict):
    """Dictionary representing the WrittenTranslations object."""

    translations_mapping: Dict[str, Dict[str, WrittenTranslationDict]]


class WrittenTranslations:
    """Value object representing a content translations which stores
    translated contents of all state contents (like hints, feedback etc.) in
    different languages linked through their content_id.
    """

    def __init__(
        self,
        translations_mapping: Dict[str, Dict[str, WrittenTranslation]]
    ) -> None:
        """Initializes a WrittenTranslations domain object.

        Args:
            translations_mapping: dict. A dict mapping the content Ids
                to the dicts which is the map of abbreviated code of the
                languages to WrittenTranslation objects.
        """
        self.translations_mapping = translations_mapping

    def to_dict(self) -> WrittenTranslationsDict:
        """Returns a dict representing this WrittenTranslations domain object.

        Returns:
            dict. A dict, mapping all fields of WrittenTranslations instance.
        """
        translations_mapping: Dict[str, Dict[str, WrittenTranslationDict]] = {}
        for (content_id, language_code_to_written_translation) in (
                self.translations_mapping.items()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                translations_mapping[content_id][language_code] = (
                    written_translation.to_dict())
        written_translations_dict: WrittenTranslationsDict = {
            'translations_mapping': translations_mapping
        }

        return written_translations_dict

    @classmethod
    def from_dict(
        cls, written_translations_dict: WrittenTranslationsDict
    ) -> WrittenTranslations:
        """Return a WrittenTranslations domain object from a dict.

        Args:
            written_translations_dict: dict. The dict representation of
                WrittenTranslations object.

        Returns:
            WrittenTranslations. The corresponding WrittenTranslations domain
            object.
        """
        translations_mapping: Dict[str, Dict[str, WrittenTranslation]] = {}
        for (content_id, language_code_to_written_translation) in (
                written_translations_dict['translations_mapping'].items()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                translations_mapping[content_id][language_code] = (
                    WrittenTranslation.from_dict(written_translation))

        return cls(translations_mapping)

    def get_content_ids_that_are_correctly_translated(
        self, language_code: str
    ) -> List[str]:
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
            if (
                language_code in translations and
                not translations[language_code].needs_update
            ):
                correctly_translated_content_ids.append(content_id)

        return correctly_translated_content_ids

    def add_translation(
        self,
        content_id: str,
        language_code: str,
        html: str
    ) -> None:
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

    def mark_written_translation_as_needing_update(
        self, content_id: str, language_code: str
    ) -> None:
        """Marks translation as needing update for the given content id and
        language code.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code.
        """
        self.translations_mapping[content_id][language_code].needs_update = (
            True
        )

    def mark_written_translations_as_needing_update(
        self, content_id: str
    ) -> None:
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

    def validate(self, expected_content_id_list: Optional[List[str]]) -> None:
        """Validates properties of the WrittenTranslations.

        Args:
            expected_content_id_list: list(str)|None. A list of content id which
                are expected to be inside they WrittenTranslations.

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
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'Expected content_id to be a string, received %s'
                    % content_id)
            if not isinstance(language_code_to_written_translation, dict):
                raise utils.ValidationError(
                    'Expected content_id value to be a dict, received %s'
                    % language_code_to_written_translation)
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                if not isinstance(language_code, str):
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

    def get_content_ids_for_text_translation(self) -> List[str]:
        """Returns a list of content_id available for text translation.

        Returns:
            list(str). A list of content id available for text translation.
        """
        return list(sorted(self.translations_mapping.keys()))

    def get_translated_content(
        self, content_id: str, language_code: str
    ) -> str:
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
                translation = self.translations_mapping[
                    content_id][language_code].translation
                # Ruling out the possibility of any other type for mypy
                # type checking.
                assert isinstance(translation, str)
                return translation
            else:
                raise Exception(
                    'Translation for the given content_id %s does not exist in '
                    '%s language code' % (content_id, language_code))
        else:
            raise Exception('Invalid content_id: %s' % content_id)

    def add_content_id_for_translation(self, content_id: str) -> None:
        """Adds a content id as a key for the translation into the
        content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
        """
        if not isinstance(content_id, str):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id in self.translations_mapping:
            raise Exception(
                'The content_id %s already exist.' % content_id)

        self.translations_mapping[content_id] = {}

    def delete_content_id_for_translation(self, content_id: str) -> None:
        """Deletes a content id from the content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
        """
        if not isinstance(content_id, str):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id not in self.translations_mapping:
            raise Exception(
                'The content_id %s does not exist.' % content_id)

        self.translations_mapping.pop(content_id, None)

    def get_all_html_content_strings(self) -> List[str]:
        """Gets all html content strings used in the WrittenTranslations.

        Returns:
            list(str). The list of html content strings.
        """
        html_string_list = []
        for translations in self.translations_mapping.values():
            for written_translation in translations.values():
                if (written_translation.data_format ==
                        WrittenTranslation.DATA_FORMAT_HTML):
                    # Ruling out the possibility of any other type for mypy
                    # type checking.
                    assert isinstance(written_translation.translation, str)
                    html_string_list.append(written_translation.translation)
        return html_string_list

    @staticmethod
    def convert_html_in_written_translations(
        written_translations_dict: WrittenTranslationsDict,
        conversion_fn: Callable[[str], str]
    ) -> WrittenTranslationsDict:
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
                        translation = written_translations_dict[
                                'translations_mapping'
                            ][content_id][language_code]['translation']
                        # Ruling out the possibility of any other type for mypy
                        # type checking.
                        assert isinstance(translation, str)
                        written_translations_dict['translations_mapping'][
                            content_id][language_code]['translation'] = (
                                conversion_fn(translation)
                            )
                elif 'html' in translation_dict:
                    # TODO(#11950): Delete this once old schema migration
                    # functions are deleted.
                    # This "elif" branch is needed because, in states schema
                    # v33, this function is called but the dict is still in the
                    # old format (that doesn't have a "data_format" key).
                    # Here we use MyPy ignore because in convert functions,
                    # we allow less strict typing because here we are working
                    # with previous versions of the domain object and in
                    # previous versions of the domain object there are some
                    # fields that are discontinued in the latest domain object
                    # (eg. html). So, while accessing these discontinued fields
                    # MyPy throws an error. Thus to avoid the error, we used
                    # ignore here.
                    written_translations_dict['translations_mapping'][
                        content_id][language_code]['html'] = (  # type: ignore[misc]
                            # Here we use MyPy ignore because we want to avoid
                            # the error that was generated by accessing a 'html'
                            # key, because this 'html' key was deprecated from
                            # the latest domain object.
                            conversion_fn(translation_dict['html']))  # type: ignore[misc]

        return written_translations_dict


class RecordedVoiceoversDict(TypedDict):
    """Dictionary representing the RecordedVoiceovers object."""

    voiceovers_mapping: Dict[str, Dict[str, VoiceoverDict]]


class RecordedVoiceovers:
    """Value object representing a recorded voiceovers which stores voiceover of
    all state contents (like hints, feedback etc.) in different languages linked
    through their content_id.
    """

    def __init__(
        self, voiceovers_mapping: Dict[str, Dict[str, Voiceover]]
    ) -> None:
        """Initializes a RecordedVoiceovers domain object.

        Args:
            voiceovers_mapping: dict. A dict mapping the content Ids
                to the dicts which is the map of abbreviated code of the
                languages to the Voiceover objects.
        """
        self.voiceovers_mapping = voiceovers_mapping

    def to_dict(self) -> RecordedVoiceoversDict:
        """Returns a dict representing this RecordedVoiceovers domain object.

        Returns:
            dict. A dict, mapping all fields of RecordedVoiceovers instance.
        """
        voiceovers_mapping: Dict[str, Dict[str, VoiceoverDict]] = {}
        for (content_id, language_code_to_voiceover) in (
                self.voiceovers_mapping.items()):
            voiceovers_mapping[content_id] = {}
            for (language_code, voiceover) in (
                    language_code_to_voiceover.items()):
                voiceovers_mapping[content_id][language_code] = (
                    voiceover.to_dict())
        recorded_voiceovers_dict: RecordedVoiceoversDict = {
            'voiceovers_mapping': voiceovers_mapping
        }

        return recorded_voiceovers_dict

    @classmethod
    def from_dict(
        cls, recorded_voiceovers_dict: RecordedVoiceoversDict
    ) -> RecordedVoiceovers:
        """Return a RecordedVoiceovers domain object from a dict.

        Args:
            recorded_voiceovers_dict: dict. The dict representation of
                RecordedVoiceovers object.

        Returns:
            RecordedVoiceovers. The corresponding RecordedVoiceovers domain
            object.
        """
        voiceovers_mapping: Dict[str, Dict[str, Voiceover]] = {}
        for (content_id, language_code_to_voiceover) in (
                recorded_voiceovers_dict['voiceovers_mapping'].items()):
            voiceovers_mapping[content_id] = {}
            for (language_code, voiceover) in (
                    language_code_to_voiceover.items()):
                voiceovers_mapping[content_id][language_code] = (
                    Voiceover.from_dict(voiceover))

        return cls(voiceovers_mapping)

    def validate(self, expected_content_id_list: Optional[List[str]]) -> None:
        """Validates properties of the RecordedVoiceovers.

        Args:
            expected_content_id_list: list(str)|None. A list of content id which
                are expected to be inside the RecordedVoiceovers.

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
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'Expected content_id to be a string, received %s'
                    % content_id)
            if not isinstance(language_code_to_voiceover, dict):
                raise utils.ValidationError(
                    'Expected content_id value to be a dict, received %s'
                    % language_code_to_voiceover)
            for (language_code, voiceover) in (
                    language_code_to_voiceover.items()):
                if not isinstance(language_code, str):
                    raise utils.ValidationError(
                        'Expected language_code to be a string, received %s'
                        % language_code)
                allowed_language_codes = [language['id'] for language in (
                    constants.SUPPORTED_AUDIO_LANGUAGES)]
                if language_code not in allowed_language_codes:
                    raise utils.ValidationError(
                        'Invalid language_code: %s' % language_code)

                voiceover.validate()

    def get_content_ids_for_voiceovers(self) -> List[str]:
        """Returns a list of content_id available for voiceover.

        Returns:
            list(str). A list of content id available for voiceover.
        """
        return list(self.voiceovers_mapping.keys())

    def strip_all_existing_voiceovers(self) -> None:
        """Strips all existing voiceovers from the voiceovers_mapping."""
        for content_id in self.voiceovers_mapping.keys():
            self.voiceovers_mapping[content_id] = {}

    def add_content_id_for_voiceover(self, content_id: str) -> None:
        """Adds a content id as a key for the voiceover into the
        voiceovers_mapping dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
            Exception. The content id already exist in the voiceovers_mapping
                dict.
        """
        if not isinstance(content_id, str):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id in self.voiceovers_mapping:
            raise Exception(
                'The content_id %s already exist.' % content_id)

        self.voiceovers_mapping[content_id] = {}

    def delete_content_id_for_voiceover(self, content_id: str) -> None:
        """Deletes a content id from the voiceovers_mapping dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
            Exception. The content id does not exist in the voiceovers_mapping
                dict.
        """
        if not isinstance(content_id, str):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id not in self.voiceovers_mapping:
            raise Exception(
                'The content_id %s does not exist.' % content_id)

        self.voiceovers_mapping.pop(content_id, None)


class RuleSpecDict(TypedDict):
    """Dictionary representing the RuleSpec object."""

    rule_type: str
    inputs: Dict[str, AllowedRuleSpecInputTypes]


class RuleSpec(translation_domain.BaseTranslatableObject):
    """Value object representing a rule specification."""

    def __init__(
        self,
        rule_type: str,
        inputs: Mapping[str, AllowedRuleSpecInputTypes]
    ) -> None:
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
        # Here, we are narrowing down the type from Mapping to Dict. Because
        # Mapping is used just to accept the different types of allowed Dicts.
        assert isinstance(inputs, dict)
        self.inputs = inputs

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the rule spec.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        for input_value in self.inputs.values():
            if 'normalizedStrSet' in input_value:
                translatable_contents_collection.add_translatable_field(
                    translation_domain.TranslatableContentFormat
                    .SET_OF_NORMALIZED_STRING,
                    input_value['contentId'],
                    input_value['normalizedStrSet'])
            if 'unicodeStrSet' in input_value:
                translatable_contents_collection.add_translatable_field(
                    translation_domain.TranslatableContentFormat
                    .SET_OF_UNICODE_STRING,
                    input_value['contentId'],
                    input_value['unicodeStrSet'])
        return translatable_contents_collection

    def to_dict(self) -> RuleSpecDict:
        """Returns a dict representing this RuleSpec domain object.

        Returns:
            dict. A dict, mapping all fields of RuleSpec instance.
        """
        return {
            'rule_type': self.rule_type,
            'inputs': self.inputs,
        }

    @classmethod
    def from_dict(cls, rulespec_dict: RuleSpecDict) -> RuleSpec:
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

    def validate(
        self,
        rule_params_list: List[Tuple[str, Type[objects.BaseObject]]],
        exp_param_specs_dict: Dict[str, param_domain.ParamSpec]
    ) -> None:
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
        param_names_set = set(rp[0] for rp in rule_params_list)
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
            if isinstance(param_value, str) and '{{' in param_value:
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
        rule_spec_dict: RuleSpecDict,
        conversion_fn: Callable[[str], str],
        html_field_types_to_rule_specs: Dict[
            str, rules_registry.RuleSpecsExtensionDict
        ]
    ) -> RuleSpecDict:
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

        Raises:
            Exception. The Rule spec has an invalid format.
            Exception. The Rule spec has no valid input variable
                with HTML in it.
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
                            input_value = (
                                rule_spec_dict['inputs'][input_variable]
                            )
                            # Ruling out the possibility of any other type for
                            # mypy type checking.
                            assert isinstance(input_value, str)
                            rule_spec_dict['inputs'][input_variable] = (
                                conversion_fn(input_value))
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
                                    if isinstance(value, str):
                                        # Here we use cast because above assert
                                        # conditions forces 'inputs' to be of
                                        # type Dict[str, List[str]].
                                        variable_format_set_input = cast(
                                            Dict[str, List[str]],
                                            rule_spec_dict['inputs']
                                        )
                                        variable_format_set_input[
                                            input_variable][value_index] = (
                                                conversion_fn(value))
                        elif (html_type_format ==
                              feconf.HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS):
                            input_variable_list = (
                                rule_spec_dict['inputs'][input_variable]
                            )
                            # Ruling out the possibility of any other type for
                            # mypy type checking.
                            assert isinstance(input_variable_list, list)
                            for list_index, html_list in enumerate(
                                    input_variable_list):
                                for rule_html_index, rule_html in enumerate(
                                        html_list):
                                    # Here we use cast because above assert
                                    # conditions forces 'inputs' to be of
                                    # type Dict[str, List[List[str]]].
                                    list_of_sets_inputs = cast(
                                        Dict[str, List[List[str]]],
                                        rule_spec_dict['inputs']
                                    )
                                    list_of_sets_inputs[input_variable][
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


class SubtitledHtmlDict(TypedDict):
    """Dictionary representing the SubtitledHtml object."""

    content_id: str
    html: str


class SubtitledHtml:
    """Value object representing subtitled HTML."""

    def __init__(
        self,
        content_id: str,
        html: str
    ) -> None:
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

    def to_dict(self) -> SubtitledHtmlDict:
        """Returns a dict representing this SubtitledHtml domain object.

        Returns:
            dict. A dict, mapping all fields of SubtitledHtml instance.
        """
        return {
            'content_id': self.content_id,
            'html': self.html
        }

    @classmethod
    def from_dict(cls, subtitled_html_dict: SubtitledHtmlDict) -> SubtitledHtml:
        """Return a SubtitledHtml domain object from a dict.

        Args:
            subtitled_html_dict: dict. The dict representation of SubtitledHtml
                object.

        Returns:
            SubtitledHtml. The corresponding SubtitledHtml domain object.
        """
        return cls(
            subtitled_html_dict['content_id'], subtitled_html_dict['html'])

    def validate(self) -> None:
        """Validates properties of the SubtitledHtml, and cleans the html.

        Raises:
            ValidationError. One or more attributes of the SubtitledHtml are
                invalid.
        """
        if not isinstance(self.content_id, str):
            raise utils.ValidationError(
                'Expected content id to be a string, received %s' %
                self.content_id)

        if not isinstance(self.html, str):
            raise utils.ValidationError(
                'Invalid content HTML: %s' % self.html)

        self.html = html_cleaner.clean(self.html)

        html_cleaner.validate_rte_tags(self.html)
        html_cleaner.validate_tabs_and_collapsible_rte_tags(self.html)

    @classmethod
    def create_default_subtitled_html(cls, content_id: str) -> SubtitledHtml:
        """Create a default SubtitledHtml domain object.

        Args:
            content_id: str. The id of the content.

        Returns:
            SubtitledHtml. A default SubtitledHtml domain object, some
            attribute of that object will be ''.
        """
        return cls(content_id, '')


class SubtitledUnicodeDict(TypedDict):
    """Dictionary representing the SubtitledUnicode object."""

    content_id: str
    unicode_str: str


class SubtitledUnicode:
    """Value object representing subtitled unicode."""

    def __init__(self, content_id: str, unicode_str: str) -> None:
        """Initializes a SubtitledUnicode domain object.

        Args:
            content_id: str. A unique id referring to the other assets for this
                content.
            unicode_str: str. A piece of user-submitted unicode.
        """
        self.content_id = content_id
        self.unicode_str = unicode_str
        self.validate()

    def to_dict(self) -> SubtitledUnicodeDict:
        """Returns a dict representing this SubtitledUnicode domain object.

        Returns:
            dict. A dict, mapping all fields of SubtitledUnicode instance.
        """
        return {
            'content_id': self.content_id,
            'unicode_str': self.unicode_str
        }

    @classmethod
    def from_dict(
        cls, subtitled_unicode_dict: SubtitledUnicodeDict
    ) -> SubtitledUnicode:
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

    def validate(self) -> None:
        """Validates properties of the SubtitledUnicode.

        Raises:
            ValidationError. One or more attributes of the SubtitledUnicode are
                invalid.
        """
        if not isinstance(self.content_id, str):
            raise utils.ValidationError(
                'Expected content id to be a string, received %s' %
                self.content_id)

        if not isinstance(self.unicode_str, str):
            raise utils.ValidationError(
                'Invalid content unicode: %s' % self.unicode_str)

    @classmethod
    def create_default_subtitled_unicode(
        cls, content_id: str
    ) -> SubtitledUnicode:
        """Create a default SubtitledUnicode domain object.

        Args:
            content_id: str. The id of the content.

        Returns:
            SubtitledUnicode. A default SubtitledUnicode domain object.
        """
        return cls(content_id, '')


class TranslatableItemDict(TypedDict):
    """Dictionary representing the TranslatableItem object."""

    content: str
    data_format: str
    content_type: str
    interaction_id: Optional[str]
    rule_type: Optional[str]


class TranslatableItem:
    """Value object representing item that can be translated."""

    DATA_FORMAT_HTML: Final = 'html'
    DATA_FORMAT_UNICODE_STRING: Final = 'unicode'
    DATA_FORMAT_SET_OF_NORMALIZED_STRING: Final = 'set_of_normalized_string'
    DATA_FORMAT_SET_OF_UNICODE_STRING: Final = 'set_of_unicode_string'
    CONTENT_TYPE_CONTENT: Final = 'content'
    CONTENT_TYPE_INTERACTION: Final = 'interaction'
    CONTENT_TYPE_RULE: Final = 'rule'
    CONTENT_TYPE_FEEDBACK: Final = 'feedback'
    CONTENT_TYPE_HINT: Final = 'hint'
    CONTENT_TYPE_SOLUTION: Final = 'solution'

    def __init__(
        self,
        content: str,
        data_format: str,
        content_type: str,
        interaction_id: Optional[str] = None,
        rule_type: Optional[str] = None
    ) -> None:
        """Initializes a TranslatableItem domain object.

        Args:
            content: str|list(str). The translatable content text.
            data_format: str. The data format of the translatable content.
            content_type: str. One of `Content`, `Interaction`, ‘Rule`,
                `Feedback`, `Hint`, `Solution`.
            interaction_id: str|None. Interaction ID, e.g. `TextInput`, if the
                content corresponds to an InteractionInstance, else None.
            rule_type: str|None. Rule type if content_type == `Rule`, e.g.
                “Equals”, “IsSubsetOf”, “Contains” else None.
        """
        self.content = content
        self.data_format = data_format
        self.content_type = content_type
        self.interaction_id = interaction_id
        self.rule_type = rule_type

    def to_dict(self) -> TranslatableItemDict:
        """Returns a dict representing this TranslatableItem domain object.

        Returns:
            dict. A dict, mapping all fields of TranslatableItem instance.
        """
        return {
            'content': self.content,
            'data_format': self.data_format,
            'content_type': self.content_type,
            'interaction_id': self.interaction_id,
            'rule_type': self.rule_type
        }

    def is_set_data_format(self) -> bool:
        """Check whether the data format of the translatable content is set of
        strings.

        Returns:
            bool. Whether the data format of the translatable content is set of
            strings.
        """
        return self.data_format in [
            TranslatableItem.DATA_FORMAT_SET_OF_NORMALIZED_STRING,
            TranslatableItem.DATA_FORMAT_SET_OF_UNICODE_STRING]


DomainObjectCustomizationArgsConversionFnTypes = Union[
    Callable[[SubtitledHtml, str], SubtitledHtml],
    Callable[[SubtitledHtml, str], SubtitledHtmlDict],
    Callable[[SubtitledUnicode, str], SubtitledUnicodeDict],
    Callable[[SubtitledHtml, str], List[str]]
]

DictCustomizationArgsConversionFnTypes = Union[
    Callable[[Dict[str, str], Literal['SubtitledUnicode']], SubtitledUnicode],
    Callable[[Dict[str, str], Literal['SubtitledHtml']], SubtitledHtml]
]

AcceptableConversionFnType = Union[
    DomainObjectCustomizationArgsConversionFnTypes,
    DictCustomizationArgsConversionFnTypes
]


class StateDict(TypedDict):
    """Dictionary representing the State object."""

    content: SubtitledHtmlDict
    param_changes: List[param_domain.ParamChangeDict]
    interaction: InteractionInstanceDict
    recorded_voiceovers: RecordedVoiceoversDict
    written_translations: WrittenTranslationsDict
    solicit_answer_details: bool
    card_is_checkpoint: bool
    next_content_id_index: int
    linked_skill_id: Optional[str]
    classifier_model_id: Optional[str]


class State(translation_domain.BaseTranslatableObject):
    """Domain object for a state."""

    def __init__(
        self,
        content: SubtitledHtml,
        param_changes: List[param_domain.ParamChange],
        interaction: InteractionInstance,
        recorded_voiceovers: RecordedVoiceovers,
        written_translations: WrittenTranslations,
        solicit_answer_details: bool,
        card_is_checkpoint: bool,
        next_content_id_index: int,
        linked_skill_id: Optional[str] = None,
        classifier_model_id: Optional[str] = None
    ) -> None:
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

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the state.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.HTML,
            self.content.content_id,
            self.content.html)
        translatable_contents_collection.add_fields_from_translatable_object(
            self.interaction)
        return translatable_contents_collection

    def validate(
        self,
        exp_param_specs_dict: Dict[str, param_domain.ParamSpec],
        allow_null_interaction: bool,
        *,
        tagged_skill_misconception_id_required: bool = False,
        strict: bool = False
    ) -> None:
        """Validates various properties of the State.

        Args:
            exp_param_specs_dict: dict or None. A dict of specified parameters
                used in this exploration. Keys are parameter names and values
                are ParamSpec value objects with an object type
                property(obj_type). It is None if the state belongs to a
                question.
            allow_null_interaction: bool. Whether this state's interaction is
                allowed to be unspecified.
            tagged_skill_misconception_id_required: bool. The 'tagged_skill_
                misconception_id' is required or not.
            strict: bool. Tells if the exploration is strict or not.

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
        if self.interaction.id is not None:
            self.interaction.validate(
                exp_param_specs_dict,
                tagged_skill_misconception_id_required=(
                    tagged_skill_misconception_id_required),
                strict=strict)

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
            if not isinstance(self.linked_skill_id, str):
                raise utils.ValidationError(
                    'Expected linked_skill_id to be a str, '
                    'received %s.' % self.linked_skill_id)

    def get_content_html(self, content_id: str) -> str:
        """Returns the content belongs to a given content id of the object.

        Args:
            content_id: str. The id of the content.

        Returns:
            str. The html content corresponding to the given content id.

        Raises:
            ValueError. The given content_id does not exist.
        """
        content_id_to_translatable_item = self._get_all_translatable_content()
        if content_id not in content_id_to_translatable_item:
            raise ValueError('Content ID %s does not exist' % content_id)

        return content_id_to_translatable_item[content_id].content

    def is_rte_content_supported_on_android(self) -> bool:
        """Checks whether the RTE components used in the state are supported by
        Android.

        Returns:
            bool. Whether the RTE components in the state is valid.
        """
        def require_valid_component_names(html: str) -> bool:
            """Checks if the provided html string contains only whitelisted
            RTE tags.

            Args:
                html: str. The html string.

            Returns:
                bool. Whether all RTE tags in the html are whitelisted.
            """
            component_name_prefix = 'oppia-noninteractive-'
            component_names = set(
                component['id'].replace(component_name_prefix, '')
                for component in html_cleaner.get_rte_components(html))
            return any(component_names.difference(
                android_validation_constants.VALID_RTE_COMPONENTS))

        if self.content and require_valid_component_names(
                self.content.html):
            return False

        return self.interaction.is_rte_content_supported_on_android(
            require_valid_component_names)

    def get_training_data(self) -> List[TrainingDataDict]:
        """Retrieves training data from the State domain object.

        Returns:
            list(dict). A list of dicts, each of which has two key-value pairs.
            One pair maps 'answer_group_index' to the index of the answer
            group and the other maps 'answers' to the answer group's
            training data.
        """
        state_training_data_by_answer_group: List[TrainingDataDict] = []
        for (answer_group_index, answer_group) in enumerate(
                self.interaction.answer_groups):
            if answer_group.training_data:
                answers = copy.deepcopy(answer_group.training_data)
                state_training_data_by_answer_group.append({
                    'answer_group_index': answer_group_index,
                    'answers': answers
                })
        return state_training_data_by_answer_group

    def can_undergo_classification(self) -> bool:
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
    def convert_state_dict_to_yaml(
        cls, state_dict: StateDict, width: int
    ) -> str:
        """Converts the given state dict to yaml format.

        Args:
            state_dict: dict. A dict representing a state in an exploration.
            width: int. The maximum number of characters in a line for the
                returned YAML string.

        Returns:
            str. The YAML version of the state_dict.

        Raises:
            Exception. The state dict does not represent a valid state.
        """
        try:
            # Check if the state_dict can be converted to a State.
            state = cls.from_dict(state_dict)
        except Exception as e:
            logging.exception('Bad state dict: %s' % str(state_dict))
            raise e

        return utils.yaml_from_dict(state.to_dict(), width=width)

    def get_translation_counts(self) -> Dict[str, int]:
        """Return a dict representing the number of translations available in a
        languages in which there exists at least one translation in the state
        object.

        Note: This method only counts the translations which are translatable as
        per _get_all_translatable_content method.

        Returns:
            dict(str, int). A dict with language code as a key and number of
            translations available in that language as the value.
        """
        translation_counts: Dict[str, int] = collections.defaultdict(int)
        translations_mapping = self.written_translations.translations_mapping

        for content_id in self._get_all_translatable_content():
            for language_code, translation in (
                    translations_mapping[content_id].items()):
                if not translation.needs_update:
                    translation_counts[language_code] += 1
        return translation_counts

    def get_translatable_content_count(self) -> int:
        """Returns the number of content fields available for translation in
        the object.

        Returns:
            int. The number of content fields available for translation in
            the state.
        """
        return len(self._get_all_translatable_content())

    def _update_content_ids_in_assets(
        self, old_ids_list: List[str], new_ids_list: List[str]
    ) -> None:
        """Adds or deletes content ids in assets i.e, other parts of state
        object such as recorded_voiceovers and written_translations.

        Args:
            old_ids_list: list(str). A list of content ids present earlier
                within the substructure (like answer groups, hints etc.) of
                state.
            new_ids_list: list(str). A list of content ids currently present
                within the substructure (like answer groups, hints etc.) of
                state.

        Raises:
            Exception. The content to be deleted doesn't exist.
            Exception. The content to be added already exists.
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
            if not content_id in content_ids_for_text_translations:
                raise Exception(
                    'The content_id %s does not exist in written_translations.'
                    % content_id)

            self.recorded_voiceovers.delete_content_id_for_voiceover(content_id)
            self.written_translations.delete_content_id_for_translation(
                content_id)

        for content_id in content_ids_to_add:
            if content_id in content_ids_for_voiceovers:
                raise Exception(
                    'The content_id %s already exists in recorded_voiceovers'
                    % content_id)
            if content_id in content_ids_for_text_translations:
                raise Exception(
                    'The content_id %s already exists in written_translations.'
                    % content_id)

            self.recorded_voiceovers.add_content_id_for_voiceover(content_id)
            self.written_translations.add_content_id_for_translation(content_id)

    def add_translation(
        self, content_id: str, language_code: str, translation_html: str
    ) -> None:
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
        self,
        content_id: str,
        language_code: str,
        translation: Union[str, List[str]],
        data_format: str
    ) -> None:
        """Adds a translation for the given content id in a given language.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code of the translated html.
            translation: str|list(str). The translated content.
            data_format: str. The data format of the translated content.
        """
        written_translation = WrittenTranslation(
            data_format, translation, False)
        self.written_translations.translations_mapping[content_id][
            language_code] = written_translation

    def mark_written_translation_as_needing_update(
        self, content_id: str, language_code: str
    ) -> None:
        """Marks translation as needing update for the given content id and
        language code.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code.
        """
        self.written_translations.mark_written_translation_as_needing_update(
            content_id, language_code)

    def mark_written_translations_as_needing_update(
        self, content_id: str
    ) -> None:
        """Marks translation as needing update for the given content id in all
        languages.

        Args:
            content_id: str. The id of the content.
        """
        self.written_translations.mark_written_translations_as_needing_update(
            content_id)

    def update_content(self, content: SubtitledHtml) -> None:
        """Update the content of this state.

        Args:
            content: SubtitledHtml. Representation of updated content.
        """
        # TODO(sll): Must sanitize all content in RTE component attrs.
        self.content = content

    def update_param_changes(
        self, param_changes: List[param_domain.ParamChange]
    ) -> None:
        """Update the param_changes dict attribute.

        Args:
            param_changes: list(ParamChange). List of param_change domain
                objects that represents ParamChange domain object.
        """
        self.param_changes = param_changes

    def update_interaction_id(self, interaction_id: Optional[str]) -> None:
        """Update the interaction id attribute.

        Args:
            interaction_id: str|None. The new interaction id to set.
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

    def update_next_content_id_index(self, next_content_id_index: int) -> None:
        """Update the interaction next content id index attribute.

        Args:
            next_content_id_index: int. The new next content id index to set.
        """
        self.next_content_id_index = next_content_id_index

    def update_linked_skill_id(self, linked_skill_id: Optional[str]) -> None:
        """Update the state linked skill id attribute.

        Args:
            linked_skill_id: str|None. The linked skill id to state.
        """
        self.linked_skill_id = linked_skill_id

    def update_interaction_customization_args(
        self, customization_args_dict: CustomizationArgsDictType
    ) -> None:
        """Update the customization_args of InteractionInstance domain object.

        Args:
            customization_args_dict: dict. The new customization_args to set.

        Raises:
            Exception. The customization arguments are not unique.
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

    def update_interaction_answer_groups(
        self, answer_groups_list: List[AnswerGroup]
    ) -> None:
        """Update the list of AnswerGroup in InteractionInstance domain object.

        Args:
            answer_groups_list: list(AnswerGroup). List of AnswerGroup domain
                objects.

        Raises:
            Exception. Type of AnswerGroup domain objects is not as expected.
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

                    if (isinstance(value, str) and
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
                        except Exception as e:
                            raise Exception(
                                'Value has the wrong type. It should be a %s. '
                                'The value is %s' %
                                (param_type.__name__, value)) from e

                    rule_inputs[param_name] = normalized_param

                answer_group.rule_specs.append(rule_spec)
        self.interaction.answer_groups = interaction_answer_groups

        new_content_id_list += [
            answer_group.outcome.feedback.content_id for answer_group in (
                self.interaction.answer_groups)]
        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_interaction_default_outcome(
        self, default_outcome: Optional[Outcome]
    ) -> None:
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
        self, confirmed_unclassified_answers: List[AnswerGroup]
    ) -> None:
        """Update the confirmed_unclassified_answers of IteractionInstance
        domain object.

        Args:
            confirmed_unclassified_answers: list(AnswerGroup). The new list of
                answers which have been confirmed to be associated with the
                default outcome.

        Raises:
            Exception. Given answers is not of type list.
        """
        if not isinstance(confirmed_unclassified_answers, list):
            raise Exception(
                'Expected confirmed_unclassified_answers to be a list,'
                ' received %s' % confirmed_unclassified_answers)
        self.interaction.confirmed_unclassified_answers = (
            confirmed_unclassified_answers)

    def update_interaction_hints(self, hints_list: List[Hint]) -> None:
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

    def update_interaction_solution(
        self, solution: Optional[Solution]
    ) -> None:
        """Update the solution of interaction.

        Args:
            solution: Solution|None. Object of class Solution.

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

    def update_recorded_voiceovers(
        self, recorded_voiceovers: RecordedVoiceovers
    ) -> None:
        """Update the recorded_voiceovers of a state.

        Args:
            recorded_voiceovers: RecordedVoiceovers. The new RecordedVoiceovers
                object for the state.
        """
        self.recorded_voiceovers = recorded_voiceovers

    def update_written_translations(
        self, written_translations: WrittenTranslations
    ) -> None:
        """Update the written_translations of a state.

        Args:
            written_translations: WrittenTranslations. The new
                WrittenTranslations object for the state.
        """
        self.written_translations = written_translations

    def update_solicit_answer_details(
        self, solicit_answer_details: bool
    ) -> None:
        """Update the solicit_answer_details of a state.

        Args:
            solicit_answer_details: bool. The new value of
                solicit_answer_details for the state.

        Raises:
            Exception. The argument is not of type bool.
        """
        if not isinstance(solicit_answer_details, bool):
            raise Exception(
                'Expected solicit_answer_details to be a boolean, received %s'
                % solicit_answer_details)
        self.solicit_answer_details = solicit_answer_details

    def update_card_is_checkpoint(self, card_is_checkpoint: bool) -> None:
        """Update the card_is_checkpoint field of a state.

        Args:
            card_is_checkpoint: bool. The new value of
                card_is_checkpoint for the state.

        Raises:
            Exception. The argument is not of type bool.
        """
        if not isinstance(card_is_checkpoint, bool):
            raise Exception(
                'Expected card_is_checkpoint to be a boolean, received %s'
                % card_is_checkpoint)
        self.card_is_checkpoint = card_is_checkpoint

    def _get_all_translatable_content(self) -> Dict[str, TranslatableItem]:
        """Returns all content which can be translated into different languages.

        Returns:
            dict(str, TranslatableItem). Returns a dict with key as content
            id and TranslatableItem as value with the appropriate data
            format.
        """
        content_id_to_translatable_item = {}

        content_id_to_translatable_item[self.content.content_id] = (
            TranslatableItem(
                self.content.html,
                TranslatableItem.DATA_FORMAT_HTML,
                TranslatableItem.CONTENT_TYPE_CONTENT))

        # TODO(#6178): Remove empty html checks once we add a validation
        # check that ensures each content in state should be non-empty html.
        default_outcome = self.interaction.default_outcome
        if default_outcome is not None and default_outcome.feedback.html != '':
            content_id_to_translatable_item[
                default_outcome.feedback.content_id
            ] = TranslatableItem(
                default_outcome.feedback.html,
                TranslatableItem.DATA_FORMAT_HTML,
                TranslatableItem.CONTENT_TYPE_FEEDBACK)

        for answer_group in self.interaction.answer_groups:
            if answer_group.outcome.feedback.html != '':
                content_id_to_translatable_item[
                    answer_group.outcome.feedback.content_id
                ] = TranslatableItem(
                    answer_group.outcome.feedback.html,
                    TranslatableItem.DATA_FORMAT_HTML,
                    TranslatableItem.CONTENT_TYPE_FEEDBACK)
            # As of Aug 2021, only TextInput and SetInput have translatable rule
            # inputs.
            if self.interaction.id not in ['TextInput', 'SetInput']:
                continue
            for rule_spec in answer_group.rule_specs:
                for input_value in rule_spec.inputs.values():
                    if 'normalizedStrSet' in input_value:
                        content_id_to_translatable_item[
                            input_value['contentId']
                        ] = TranslatableItem(
                            input_value['normalizedStrSet'],
                            TranslatableItem
                            .DATA_FORMAT_SET_OF_NORMALIZED_STRING,
                            TranslatableItem.CONTENT_TYPE_RULE,
                            self.interaction.id,
                            rule_spec.rule_type)
                    if 'unicodeStrSet' in input_value:
                        content_id_to_translatable_item[
                            input_value['contentId']
                        ] = TranslatableItem(
                            input_value['unicodeStrSet'],
                            TranslatableItem
                            .DATA_FORMAT_SET_OF_UNICODE_STRING,
                            TranslatableItem.CONTENT_TYPE_RULE,
                            self.interaction.id,
                            rule_spec.rule_type)

        for hint in self.interaction.hints:
            if hint.hint_content.html != '':
                content_id_to_translatable_item[
                    hint.hint_content.content_id
                ] = TranslatableItem(
                    hint.hint_content.html,
                    TranslatableItem.DATA_FORMAT_HTML,
                    TranslatableItem.CONTENT_TYPE_HINT)

        solution = self.interaction.solution
        if solution is not None and solution.explanation.html != '':
            content_id_to_translatable_item[
                solution.explanation.content_id
            ] = TranslatableItem(
                solution.explanation.html,
                TranslatableItem.DATA_FORMAT_HTML,
                TranslatableItem.CONTENT_TYPE_SOLUTION)

        for ca_dict in self.interaction.customization_args.values():
            subtitled_htmls = ca_dict.get_subtitled_html()
            for subtitled_html in subtitled_htmls:
                html_string = subtitled_html.html
                stripped_html_string = html_cleaner.strip_html_tags(html_string)
                if (
                    stripped_html_string != '' and
                    not stripped_html_string.isnumeric()
                ):
                    content_id_to_translatable_item[
                        subtitled_html.content_id
                    ] = TranslatableItem(
                        html_string,
                        TranslatableItem.DATA_FORMAT_HTML,
                        TranslatableItem.CONTENT_TYPE_INTERACTION,
                        self.interaction.id)

            subtitled_unicodes = ca_dict.get_subtitled_unicode()
            for subtitled_unicode in subtitled_unicodes:
                if subtitled_unicode.unicode_str != '':
                    content_id_to_translatable_item[
                        subtitled_unicode.content_id
                    ] = TranslatableItem(
                        subtitled_unicode.unicode_str,
                        TranslatableItem.DATA_FORMAT_UNICODE_STRING,
                        TranslatableItem.CONTENT_TYPE_INTERACTION,
                        self.interaction.id)

        return content_id_to_translatable_item

    def has_content_id(self, content_id: str) -> bool:
        """Returns whether a given content ID is available in the translatable
        content.

        Args:
            content_id: str. The content ID that needs to be checked for the
                availability.

        Returns:
            bool. A boolean that indicates the availability of the content ID
            in the translatable content.
        """
        available_translate_content = self._get_all_translatable_content()
        return bool(content_id in available_translate_content)

    def get_content_id_mapping_needing_translations(
        self, language_code: str
    ) -> Dict[str, TranslatableItem]:
        """Returns all text html which can be translated in the given language.

        Args:
            language_code: str. The abbreviated code of the language.

        Returns:
            dict(str, TranslatableItem). A dict with key as content id and
            value as TranslatableItem containing the content and the data
            format.
        """
        content_id_to_translatable_item = self._get_all_translatable_content()
        available_translation_content_ids = (
            self.written_translations
            .get_content_ids_that_are_correctly_translated(language_code))
        for content_id in available_translation_content_ids:
            content_id_to_translatable_item.pop(content_id, None)

        # TODO(#7571): Add functionality to return the list of
        # translations which needs update.

        return content_id_to_translatable_item

    def to_dict(self) -> StateDict:
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

    # TODO(#16467): Remove `validate` argument after validating all Question
    # states by writing a migration and audit job. As the validation for
    # states is common between Exploration and Question and the Question
    # data is not yet migrated, we do not want to call the validations
    # while we load the Question.
    @classmethod
    def from_dict(cls, state_dict: StateDict, validate: bool = True) -> State:
        """Return a State domain object from a dict.

        Args:
            state_dict: dict. The dict representation of State object.
            validate: bool. False, when the validations should not be called.

        Returns:
            State. The corresponding State domain object.
        """
        content = SubtitledHtml.from_dict(state_dict['content'])
        if validate:
            content.validate()
        return cls(
            content,
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            InteractionInstance.from_dict(
                state_dict['interaction'], validate=validate),
            RecordedVoiceovers.from_dict(state_dict['recorded_voiceovers']),
            WrittenTranslations.from_dict(state_dict['written_translations']),
            state_dict['solicit_answer_details'],
            state_dict['card_is_checkpoint'],
            state_dict['next_content_id_index'],
            state_dict['linked_skill_id'],
            state_dict['classifier_model_id'])

    @classmethod
    def create_default_state(
        cls,
        default_dest_state_name: Optional[str],
        is_initial_state: bool = False
    ) -> State:
        """Return a State domain object with default value.

        Args:
            default_dest_state_name: str|None. The default destination state, or
                None if no default destination state is defined.
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
        cls,
        state_dict: StateDict,
        conversion_fn: Callable[[str], str],
        state_schema_version: int = feconf.CURRENT_STATE_SCHEMA_VERSION,
        state_uses_old_interaction_cust_args_schema: bool = False,
        state_uses_old_rule_template_schema: bool = False
    ) -> StateDict:
        """Applies a conversion function on all the html strings in a state
        to migrate them to a desired state.

        Args:
            state_dict: dict. The dict representation of State object.
            conversion_fn: function. The conversion function to be applied on
                the states_dict.
            state_schema_version: int. The state schema version.
            state_uses_old_interaction_cust_args_schema: bool. Whether the
                interaction customization arguments contain SubtitledHtml
                and SubtitledUnicode dicts (should be True if prior to state
                schema v36).
            state_uses_old_rule_template_schema: bool. Whether the rule inputs
                contain html in the form of DragAndDropHtmlString,
                SetOfHtmlString, or ListOfSetsOfHtmlString (shoud be True if
                prior to state schema v42).

        Returns:
            dict. The converted state_dict.
        """
        state_dict['content']['html'] = (
            conversion_fn(state_dict['content']['html']))
        if state_dict['interaction']['default_outcome'] is not None:
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
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids()
        )
        interaction_id_is_valid = interaction_id not in all_interaction_ids
        if interaction_id_is_valid or interaction_id is None:
            return state_dict

        if state_dict['interaction']['solution'] is not None:
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
            ca_specs_dict = (
                interaction_registry.Registry
                .get_all_specs_for_state_schema_version(
                    state_schema_version,
                    can_fetch_latest_specs=True
                )[interaction_id]['customization_arg_specs']
            )
            state_dict['interaction'] = (
                InteractionInstance.convert_html_in_interaction(
                    state_dict['interaction'],
                    ca_specs_dict,
                    conversion_fn
                ))

        return state_dict

    def get_all_html_content_strings(self) -> List[str]:
        """Get all html content strings in the state.

        Returns:
            list(str). The list of all html content strings in the interaction.
        """
        html_list = (
            self.written_translations.get_all_html_content_strings() +
            self.interaction.get_all_html_content_strings() + [
                self.content.html])
        return html_list


class StateVersionHistory:
    """Class to represent an element of the version history list of a state.
    The version history list of a state is the list of exploration versions
    in which the state has been edited.

    Attributes:
        previously_edited_in_version: int. The version number of the
            exploration in which the state was previously edited.
        state_name_in_previous_version: str. The name of the state in the
            previously edited version. It is useful in case of state renames.
        committer_id: str. The id of the user who committed the changes in the
            previously edited version.
    """

    def __init__(
        self,
        previously_edited_in_version: Optional[int],
        state_name_in_previous_version: Optional[str],
        committer_id: str
    ) -> None:
        """Initializes the StateVersionHistory domain object.

        Args:
            previously_edited_in_version: int. The version number of the
                exploration on which the state was previously edited.
            state_name_in_previous_version: str. The name of the state in the
                previously edited version. It is useful in case of state
                renames.
            committer_id: str. The id of the user who committed the changes in
                the previously edited version.
        """
        self.previously_edited_in_version = previously_edited_in_version
        self.state_name_in_previous_version = state_name_in_previous_version
        self.committer_id = committer_id

    def to_dict(self) -> StateVersionHistoryDict:
        """Returns a dict representation of the StateVersionHistory domain
        object.

        Returns:
            dict. The dict representation of the StateVersionHistory domain
            object.
        """
        return {
            'previously_edited_in_version': self.previously_edited_in_version,
            'state_name_in_previous_version': (
                self.state_name_in_previous_version),
            'committer_id': self.committer_id
        }

    @classmethod
    def from_dict(
        cls,
        state_version_history_dict: StateVersionHistoryDict
    ) -> StateVersionHistory:
        """Return a StateVersionHistory domain object from a dict.

        Args:
            state_version_history_dict: dict. The dict representation of
                StateVersionHistory object.

        Returns:
            StateVersionHistory. The corresponding StateVersionHistory domain
            object.
        """
        return cls(
            state_version_history_dict['previously_edited_in_version'],
            state_version_history_dict['state_name_in_previous_version'],
            state_version_history_dict['committer_id']
        )
