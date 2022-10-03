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

"""Base class for defining interactions.

A note on terminology: state_customization_args refers to the values of
customization args that are provided by an exploration editor. They are
formatted as

    {ca_name: {value: ca_value}}

On the other hand, interaction.customization_args refers to a combination of
the interaction customization arg spec and the value used. It is a list of
dicts, each representing a customization arg -- viz.:

    [{
        'name': ca_name,
        'value': ca_value,
        'default_value': ...,
        ...
    }]
"""

from __future__ import annotations

import copy
import json

from core import constants
from core import feconf
from core.domain import object_registry
from core.domain import visualization_registry
from extensions import domain
from extensions.objects.models import objects
from extensions.visualizations import models

from typing import Dict, Final, List, Optional, Tuple, Type, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from core.domain import state_domain

# Indicates that the learner view of the interaction should be displayed in the
# context of the conversation.
DISPLAY_MODE_INLINE: Final = 'inline'
# Indicates that the learner view of the interaction should be displayed as a
# separate object from the conversation.
DISPLAY_MODE_SUPPLEMENTAL: Final = 'supplemental'

ALLOWED_DISPLAY_MODES: Final = [
    DISPLAY_MODE_SUPPLEMENTAL,
    DISPLAY_MODE_INLINE
]


class AnswerVisualizationSpecsDict(TypedDict):
    """Type for the _answer_visualization_specs variable."""

    id: str
    options: models.OptionsDictType
    calculation_id: str
    addressed_info_is_supported: bool


class BaseInteractionDict(TypedDict):
    """Dictionary representing the BaseInteraction object."""

    id: str
    name: str
    description: str
    answer_type: Optional[str]
    display_mode: str
    is_terminal: bool
    is_trainable: bool
    is_linear: bool
    needs_summary: bool
    customization_arg_specs: List[domain.CustomizationArgSpecsDict]
    instructions: Optional[str]
    narrow_instructions: Optional[str]
    default_outcome_heading: Optional[str]
    rule_descriptions: Dict[str, str]
    can_have_solution: bool
    show_generic_submit_button: bool


class BaseInteraction:
    """Base interaction definition class.

    This class is not meant to be user-editable. The only methods on it should
    be get()-type methods.

    Note that all interactions should also include a thumbnail image of size
    178 x 146 pixels. This image will be shown in the interaction selector.
    """

    # NOTE TO DEVELOPERS: The property answer_calculation_ids() was removed in
    # #13021 as part of the migration to Apache Beam. Please refer to that PR if
    # you need to reinstate it.

    # The human-readable name of the interaction. Overridden in subclasses.
    name: str = ''
    # A description of the interaction. Overridden in subclasses.
    description: str = ''
    # Describes how the interaction should be displayed -- either within the
    # conversation ('inline'), or as a separate object ('supplemental'). In the
    # latter case, the interaction instance is reused if two adjacent states
    # have the same interaction id.
    display_mode: str = ''
    # Whether this interaction should be considered terminal, i.e. it ends
    # the exploration. Defaults to False.
    is_terminal: bool = False
    # Whether the interaction has only one possible answer.
    is_linear: bool = False
    # Whether this interaction supports machine learning classification.
    # TODO(chiangs): Remove once classifier_services is generalized.
    is_trainable: bool = False
    # Additional JS library dependencies that should be loaded in pages
    # containing this interaction. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR. Overridden in subclasses.
    _dependency_ids: List[str] = []
    # The type of answer (as a string) accepted by this interaction, e.g.
    # 'CodeEvaluation'. This should be None for linear and terminal
    # interactions.
    answer_type: Optional[str] = None
    # Customization arg specifications for the component, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = []
    # Specs for desired visualizations of recorded state answers. Overridden
    # in subclasses.
    _answer_visualization_specs: List[AnswerVisualizationSpecsDict] = []
    # Instructions for using this interaction, to be shown to the learner. Only
    # relevant for supplemental interactions.
    instructions: Optional[str] = None
    # Instructions for using this interaction, to be shown to the learner. Only
    # shows up when view port is narrow. Only relevent for supplemental
    # interactions.
    narrow_instructions: Optional[str] = None
    # Whether the answer is long, and would benefit from being summarized.
    needs_summary: bool = False
    # The heading for the 'default outcome' section in the editor. This should
    # be None unless the interaction is linear and non-terminal.
    default_outcome_heading: Optional[str] = None
    # Whether the solution feature supports this interaction.
    can_have_solution: bool = False
    # Whether to show a Submit button in the progress navigation area. This is
    # a generic submit button so do not use this if special interaction-specific
    # behavior is required. The interaction directive must also register
    # callbacks with CurrentInteractionService which handle answer submission
    # when the button is clicked and control the enabling/disabling of the
    # submit button.
    show_generic_submit_button: bool = False

    # Temporary cache for the rule definitions.
    _cached_rules_dict: Optional[Dict[str, Dict[str, str]]] = None

    @property
    def id(self) -> str:
        """The name of the class."""
        return self.__class__.__name__

    @property
    def customization_arg_specs(self) -> List[domain.CustomizationArgSpec]:
        """The customization arg specs for the interaction."""
        return [
            domain.CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    @property
    def answer_visualization_specs(self) -> List[AnswerVisualizationSpecsDict]:
        """The answer visualization specs for the interaction."""
        return self._answer_visualization_specs

    @property
    def answer_visualizations(self) -> List[models.BaseVisualization]:
        """A list of answer visualization specs of the interaction."""
        result = []
        for spec in self._answer_visualization_specs:
            factory_cls = (
                visualization_registry.Registry.get_visualization_class(
                    spec['id']))
            result.append(
                factory_cls(
                    spec['calculation_id'], spec['options'],
                    spec['addressed_info_is_supported']))
        return result

    @property
    def dependency_ids(self) -> List[str]:
        """A copy of dependency ids of the interaction."""
        return copy.deepcopy(self._dependency_ids)

    def normalize_answer(
        self, answer: state_domain.AcceptableCorrectAnswerTypes
    ) -> state_domain.AcceptableCorrectAnswerTypes:
        """Normalizes a learner's input to this interaction."""
        if self.answer_type is None:
            return None
        else:
            answers: state_domain.AcceptableCorrectAnswerTypes = (
                    object_registry.Registry.get_object_class_by_type(
                        self.answer_type).normalize(answer)
                )
            return answers

    @property
    def rules_dict(self) -> Dict[str, Dict[str, str]]:
        """A dict of rule names to rule properties."""
        if self._cached_rules_dict is not None:
            return self._cached_rules_dict

        rules_index_dict = json.loads(
            constants.get_package_file_contents(
                'extensions', feconf.RULES_DESCRIPTIONS_EXTENSIONS_MODULE_PATH))
        self._cached_rules_dict = rules_index_dict[self.id]

        return self._cached_rules_dict

    @property
    def _rule_description_strings(self) -> Dict[str, str]:
        """Returns a dict, where the keys are rule names, and the values are the
        corresponding rule descriptions.

        Returns:
            dict(str, str). A dict of rule names to rule descriptions.
        """
        return {
            rule_name: self.rules_dict[rule_name]['description']
            for rule_name in self.rules_dict
        }

    def to_dict(self) -> BaseInteractionDict:
        """Gets a dict representing this interaction. Only default values are
        provided.
        """
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'answer_type': self.answer_type,
            'display_mode': self.display_mode,
            'is_terminal': self.is_terminal,
            'is_trainable': self.is_trainable,
            'is_linear': self.is_linear,
            'needs_summary': self.needs_summary,
            'customization_arg_specs': [{
                'name': ca_spec.name,
                'description': ca_spec.description,
                'default_value': ca_spec.default_value,
                'schema': ca_spec.schema,
            } for ca_spec in self.customization_arg_specs],
            'instructions': self.instructions,
            'narrow_instructions': self.narrow_instructions,
            'default_outcome_heading': self.default_outcome_heading,
            'rule_descriptions': self._rule_description_strings,
            'can_have_solution': self.can_have_solution,
            'show_generic_submit_button': self.show_generic_submit_button,
        }

    def get_rule_description(self, rule_name: str) -> str:
        """Gets a rule description, given its name."""
        if rule_name not in self.rules_dict:
            raise Exception('Could not find rule with name %s' % rule_name)

        return self.rules_dict[rule_name]['description']

    def get_rule_param_list(
        self, rule_name: str
    ) -> List[Tuple[str, Type[objects.BaseObject]]]:
        """Gets the parameter list for a given rule."""
        description = self.get_rule_description(rule_name)

        param_list = []
        while description.find('{{') != -1:
            opening_index = description.find('{{')
            description = description[opening_index + 2:]

            bar_index = description.find('|')
            param_name = description[:bar_index]
            description = description[bar_index + 1:]

            closing_index = description.find('}}')
            normalizer_string = description[:closing_index]
            description = description[closing_index + 2:]

            param_list.append(
                (param_name, getattr(objects, normalizer_string))
            )

        return param_list

    def get_rule_param_type(
        self, rule_name: str, rule_param_name: str
    ) -> Type[objects.BaseObject]:
        """Gets the parameter type for a given rule parameter name."""
        rule_param_list = self.get_rule_param_list(rule_name)

        for param_name, param_type in rule_param_list:
            if param_name == rule_param_name:
                return param_type
        raise Exception(
            'Rule %s has no param called %s' % (rule_name, rule_param_name))
