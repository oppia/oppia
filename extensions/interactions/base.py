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

import copy
import json
import os

from core.domain import obj_services
from core.domain import visualization_registry
from extensions import domain
from extensions.objects.models import objects
import feconf
import jinja_utils
import utils

# Indicates that the learner view of the interaction should be displayed in the
# context of the conversation.
DISPLAY_MODE_INLINE = 'inline'
# Indicates that the learner view of the interaction should be displayed as a
# separate object from the conversation.
DISPLAY_MODE_SUPPLEMENTAL = 'supplemental'

ALLOWED_DISPLAY_MODES = [DISPLAY_MODE_SUPPLEMENTAL, DISPLAY_MODE_INLINE]


class BaseInteraction(object):
    """Base interaction definition class.

    This class is not meant to be user-editable. The only methods on it should
    be get()-type methods.

    Note that all interactions should also include a thumbnail image of size
    178 x 146 pixels. This image will be shown in the interaction selector.
    """

    # The human-readable name of the interaction. Overridden in subclasses.
    name = ''
    # A description of the interaction. Overridden in subclasses.
    description = ''
    # Describes how the interaction should be displayed -- either within the
    # conversation ('inline'), or as a separate object ('supplemental'). In the
    # latter case, the interaction instance is reused if two adjacent states
    # have the same interaction id.
    display_mode = ''
    # Whether this interaction should be considered terminal, i.e. it ends
    # the exploration. Defaults to False.
    is_terminal = False
    # Whether the interaction has only one possible answer.
    is_linear = False
    # Whether this interaction supports machine learning classification.
    # TODO(chiangs): remove once classifier_services is generalized.
    is_trainable = False
    # Additional JS library dependencies that should be loaded in pages
    # containing this interaction. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR. Overridden in subclasses.
    _dependency_ids = []
    # The type of answer (as a string) accepted by this interaction, e.g.
    # 'CodeEvaluation'. This should be None for linear and terminal
    # interactions.
    answer_type = None
    # Customization arg specifications for the component, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs = []
    # Specs for desired visualizations of recorded state answers. Overridden
    # in subclasses.
    _answer_visualization_specs = []
    # Instructions for using this interaction, to be shown to the learner. Only
    # relevant for supplemental interactions.
    instructions = None
    # Instructions for using this interaction, to be shown to the learner. Only
    # shows up when view port is narrow. Only relevent for supplemental
    # interactions.
    narrow_instructions = None
    # Whether the answer is long, and would benefit from being summarized.
    needs_summary = False
    # The heading for the 'default outcome' section in the editor. This should
    # be None unless the interaction is linear and non-terminal.
    default_outcome_heading = None
    # Whether the solution feature supports this interaction.
    can_have_solution = None
    # Whether to show a Submit button in the progress navigation area. This is
    # a generic submit button so do not use this if special interaction-specific
    # behavior is required. The interaction JS must also handle the
    # EVENT_PROGRESS_NAV_SUBMITTED event broadcast by this Submit button.
    show_generic_submit_button = False

    # Temporary cache for the rule definitions.
    _cached_rules_dict = None

    @property
    def id(self):
        return self.__class__.__name__

    @property
    def customization_arg_specs(self):
        return [
            domain.CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    @property
    def answer_visualization_specs(self):
        return self._answer_visualization_specs

    @property
    def answer_visualizations(self):
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
    def answer_calculation_ids(self):
        visualizations = self.answer_visualizations
        return set(
            [visualization.calculation_id for visualization in visualizations])

    @property
    def dependency_ids(self):
        return copy.deepcopy(self._dependency_ids)

    def normalize_answer(self, answer):
        """Normalizes a learner's input to this interaction."""
        if self.answer_type is None:
            return None
        else:
            return obj_services.Registry.get_object_class_by_type(
                self.answer_type).normalize(answer)

    @property
    def rules_dict(self):
        """A dict of rule names to rule properties."""
        if self._cached_rules_dict is not None:
            return self._cached_rules_dict

        rules_index_dict = json.loads(
            utils.get_file_contents(feconf.RULES_DESCRIPTIONS_FILE_PATH))
        self._cached_rules_dict = rules_index_dict[self.id]

        return self._cached_rules_dict

    @property
    def _rule_description_strings(self):
        return {
            rule_name: self.rules_dict[rule_name]['description']
            for rule_name in self.rules_dict
        }

    @property
    def html_body(self):
        """The HTML code containing directives and templates for the
        interaction. This contains everything needed to display the interaction
        once the necessary attributes are supplied.

        Each interaction has two directive/template pairs, one for the
        interaction itself and the other for displaying the learner's response
        in a read-only view after it has been submitted.
        """
        html_templates = utils.get_file_contents(os.path.join(
            feconf.INTERACTIONS_DIR, self.id, '%s.html' % self.id))
        return jinja_utils.interpolate_cache_slug('%s' % html_templates)

    @property
    def validator_html(self):
        """The HTML code containing validators for the interaction's
        customization_args and submission handler.
        """
        return (
            '<script>%s</script>\n' %
            utils.get_file_contents(os.path.join(
                feconf.INTERACTIONS_DIR,
                self.id,
                '%sValidationService.js' % self.id)))

    def to_dict(self):
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

    def get_rule_description(self, rule_name):
        """Gets a rule description, given its name."""
        if rule_name not in self.rules_dict:
            raise Exception('Could not find rule with name %s' % rule_name)
        else:
            return self.rules_dict[rule_name]['description']

    def get_rule_param_list(self, rule_name):
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

    def get_rule_param_type(self, rule_name, rule_param_name):
        """Gets the parameter type for a given rule parameter name."""
        rule_param_list = self.get_rule_param_list(rule_name)

        for param_name, param_type in rule_param_list:
            if param_name == rule_param_name:
                return param_type
        raise Exception(
            'Rule %s has no param called %s' % (rule_name, rule_param_name))
