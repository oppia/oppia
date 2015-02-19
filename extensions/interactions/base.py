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

__author__ = 'Sean Lip'

import copy
import os

from core.domain import obj_services
from core.domain import rule_domain
import feconf
import jinja_utils
import schema_utils
import utils

# Indicates that the learner view of the interaction should be displayed in the
# context of the conversation.
DISPLAY_MODE_INLINE = 'inline'
# Indicates that the learner view of the interaction should be displayed as a
# separate object from the conversation.
DISPLAY_MODE_SUPPLEMENTAL = 'supplemental'

ALLOWED_DISPLAY_MODES = [DISPLAY_MODE_SUPPLEMENTAL, DISPLAY_MODE_INLINE]


class AnswerHandler(object):
    """Value object for an answer event stream (e.g. submit, click, drag)."""

    def __init__(self, name, obj_type):
        self.name = name
        self.obj_type = obj_type
        self.obj_class = obj_services.Registry.get_object_class_by_type(
            obj_type)

    @property
    def rules(self):
        return rule_domain.get_rules_for_obj_type(self.obj_type)

    def to_dict(self):
        return {
            'name': self.name,
            'obj_type': self.obj_type,
        }


class CustomizationArgSpec(object):
    """Value object for a customization arg specification."""

    def __init__(self, name, description, schema, default_value):
        self.name = name
        self.description = description
        self.schema = schema
        self.default_value = default_value


class BaseInteraction(object):
    """Base interaction definition class.

    This class is not meant to be user-editable. The only methods on it should
    be get()-type methods.
    """

    # The human-readable name of the interaction. Overridden in subclasses.
    name = ''
    # The category the interaction falls under in the repository. Overridden in
    # subclasses; a value of '' means that this should be displayed as a
    # top-level interaction.
    category = ''
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
    # Additional JS library dependencies that should be loaded in pages
    # containing this interaction. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR. Overridden in subclasses.
    _dependency_ids = []
    # Actions that the learner can perform on this interaction which trigger a
    # feedback response, and the associated input types. Each interaction must
    # have at least one of these. Overridden in subclasses.
    _handlers = []
    # Customization arg specifications for the component, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs = []

    @property
    def id(self):
        return self.__class__.__name__

    @property
    def customization_arg_specs(self):
        return [
            CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    @property
    def handlers(self):
        return [AnswerHandler(**ah) for ah in self._handlers]

    @property
    def dependency_ids(self):
        return copy.deepcopy(self._dependency_ids)

    def normalize_answer(self, answer, handler_name):
        """Normalizes a learner's input to this interaction."""
        for handler in self.handlers:
            if handler.name == handler_name:
                return handler.obj_class.normalize(answer)

        raise Exception(
            'Could not find handler in interaction %s with name %s' %
            (self.name, handler_name))

    def validate_customization_arg_values(self, customization_args):
        """Validates customization arg values. The input is a dict whose
        keys are the names of the customization args.
        """
        for ca_spec in self.customization_arg_specs:
            schema_utils.normalize_against_schema(
                customization_args[ca_spec.name]['value'],
                ca_spec.schema)

    @property
    def _stats_log_template(self):
        """The template for reader responses in the stats log."""
        try:
            return utils.get_file_contents(os.path.join(
                feconf.INTERACTIONS_DIR, self.id, 'stats_response.html'))
        except IOError:
            return '{{answer}}'

    @property
    def html_body(self):
        """The HTML code containing directives and templates for the
        interaction. This contains everything needed to display the interaction
        once the necessary attributes are supplied.

        Each interaction has two directive/template pairs, one for the
        interaction itself and the other for displaying the learner's response
        in a read-only view after it has been submitted.
        """
        js_directives = utils.get_file_contents(os.path.join(
            feconf.INTERACTIONS_DIR, self.id, '%s.js' % self.id))
        html_templates = utils.get_file_contents(os.path.join(
            feconf.INTERACTIONS_DIR, self.id, '%s.html' % self.id))
        return '<script>%s</script>\n%s' % (js_directives, html_templates)

    def to_dict(self):
        """Gets a dict representing this interaction. Only default values are
        provided.
        """
        result = {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'display_mode': self.display_mode,
            'is_terminal': self.is_terminal,
            'customization_arg_specs': [{
                'name': ca_spec.name,
                'description': ca_spec.description,
                'default_value': ca_spec.default_value,
                'schema': ca_spec.schema,
            } for ca_spec in self.customization_arg_specs],
        }

        # Add information about the handlers.
        result['handler_specs'] = [h.to_dict() for h in self.handlers]
        for idx, handler in enumerate(self.handlers):
            result['handler_specs'][idx]['rules'] = dict((
                rule_cls.description,
                {'classifier': rule_cls.__name__}
            ) for rule_cls in handler.rules)

        return result

    def get_handler_by_name(self, handler_name):
        """Get the handler for an interaction, given the handler's name."""
        try:
            return next(h for h in self.handlers if h.name == handler_name)
        except StopIteration:
            raise Exception(
                'Could not find handler with name %s' % handler_name)

    def get_rule_by_name(self, handler_name, rule_name):
        """Gets a rule, given its name and ancestors."""
        handler = self.get_handler_by_name(handler_name)
        try:
            return next(
                r for r in handler.rules if r.__name__ == rule_name)
        except StopIteration:
            raise Exception(
                'Could not find rule with name %s for handler %s'
                % (rule_name, handler_name))

    def get_stats_log_html(self, state_customization_args, answer):
        """Gets the HTML for recording a learner's response in the stats log.

        Returns an HTML string.
        """
        customization_args = {
            ca_spec.name: (
                state_customization_args[ca_spec.name]['value']
                if ca_spec.name in state_customization_args
                else ca_spec.default_value
            ) for ca_spec in self.customization_arg_specs
        }
        customization_args['answer'] = answer

        return jinja_utils.parse_string(
            self._stats_log_template, customization_args, autoescape=False)
