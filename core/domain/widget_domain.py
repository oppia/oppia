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

"""Classes relating to widgets."""

__author__ = 'Sean Lip'

import copy
import logging
import os

from core.domain import obj_services
from core.domain import rule_domain
import feconf
import jinja_utils
import utils

import json


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
    """Value object for a widget customization arg specification."""

    def __init__(self, name, description, default_value,
                 custom_editor=None, schema=None):
        self.name = name
        self.description = description
        self.custom_editor = custom_editor
        self.schema = schema
        self.default_value = default_value


class BaseWidget(object):
    """Base widget definition class.

    This class is not meant to be user-editable. The only methods on it should
    be get()-type methods.
    """
    @property
    def type(self):
        return (
            feconf.INTERACTIVE_PREFIX if self.is_interactive
            else feconf.NONINTERACTIVE_PREFIX
        )

    @property
    def id(self):
        return self.__class__.__name__

    # The human-readable name of the widget. Overridden in subclasses.
    name = ''
    # The category in the widget repository to which this widget belongs.
    # Overridden in subclasses.
    category = ''
    # The description of the widget. Overridden in subclasses.
    description = ''
    # Customization arg specifications for this widget. The default values
    # can be overridden when the widget is used within a State. Overridden in
    # subclasses.
    _customization_arg_specs = []

    # Answer handlers. Overridden in subclasses.
    _handlers = []

    # JS library dependency ids. Overridden in subclasses.
    _dependency_ids = []

    @property
    def customization_arg_specs(self):
        return [
            CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]

    @property
    def handlers(self):
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        return [AnswerHandler(**ah) for ah in self._handlers]

    @property
    def dependency_ids(self):
        return copy.deepcopy(self._dependency_ids)

    @property
    def is_interactive(self):
        """A widget is interactive iff its handlers array is non-empty."""
        return bool(self._handlers)

    def normalize_answer(self, answer, handler_name):
        """Normalizes a reader's input to this widget."""
        for handler in self.handlers:
            if handler.name == handler_name:
                return handler.obj_class.normalize(answer)

        logging.error(
            'Could not find handler in widget %s with name %s' %
            (self.name, handler_name))
        return answer

    @property
    def _stats_log_template(self):
        """The template for reader responses in the stats log."""
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        try:
            return utils.get_file_contents(os.path.join(
                feconf.WIDGETS_DIR, feconf.INTERACTIVE_PREFIX, self.id,
                'stats_response.html'))
        except IOError:
            return '{{answer}}'

    @property
    def js_code(self):
        """The JS code containing directives and templates for the widget.

        For noninteractive widgets, there is one directive/template pair.
        For interactive widgets, there are two (the additional one is for
        displaying the learner's response).
        """
        js_directives = utils.get_file_contents(os.path.join(
            feconf.WIDGETS_DIR, self.type, self.id, '%s.js' % self.id))

        html_templates = utils.get_file_contents(os.path.join(
            feconf.WIDGETS_DIR, self.type, self.id, '%s.html' % self.id))

        return '<script>%s</script>\n%s' % (js_directives, html_templates)

    def _get_customization_args(self, state_customization_args):
        """Returns a dict of parameter names and values for the widget.

        This dict is used to evaluate widget templates. The parameter values
        are generated based on the widget customizations that are defined by
        the exploration creator. These customizations may also make use of the
        state parameters.

        Args:
          - state_customization_args: dict that maps parameter names to
              customization args that are defined in the exploration.
              These values may be raw types or expression strings.

        Returns:
          A dict of key-value pairs; the keys are parameter names and the
          values are the generated values for the parameter instance.
        """
        if state_customization_args is None:
            state_customization_args = {}

        return {
            ca_spec.name: (
                state_customization_args[ca_spec.name]
                if ca_spec.name in state_customization_args
                else ca_spec.default_value
            ) for ca_spec in self.customization_arg_specs
        }

    def get_interactive_widget_tag(self, state_customization_args):
        """Gets the HTML tag used to display an interactive widget."""
        if state_customization_args is None:
            state_customization_args = {}

        tag_name = ('oppia-interactive-%s' %
                    utils.camelcase_to_hyphenated(self.id))

        attr_strings = []
        for ca_spec in self.customization_arg_specs:

            ca_value = (
                state_customization_args[ca_spec.name]
                if ca_spec.name in state_customization_args
                else ca_spec.default_value)

            arg_name = '%s-with-value' % utils.camelcase_to_hyphenated(
                ca_spec.name)
            # Note that the use of jinja here applies autoescaping,
            # resulting in a string that is safe to pass to the frontend.
            attr_strings.append(
                jinja_utils.parse_string(
                    '{{arg_name}}="{{arg_value}}"', {
                        'arg_name': arg_name,
                        'arg_value': json.dumps(ca_value),
                    }
                )
            )

        return '<%s %s></%s>' % (tag_name, ' '.join(attr_strings), tag_name)

    def get_reader_response_html(self, state_customization_args, answer,
                                 sticky):
        """Gets the parameterized HTML tag for a reader response."""
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        parameters = {}
        # Special case for multiple-choice input. In the future we should
        # make the answer into the actual multiple-choice string, and remove
        # this special case.
        customization_args = self._get_customization_args(
            state_customization_args)
        if 'choices' in customization_args:
            parameters['choices'] = customization_args['choices']

        parameters['answer'] = answer
        # The widget stays through the state transition because it is marked
        # sticky in the exploration and the new state uses the same widget.
        parameters['stateSticky'] = sticky

        attr_strings = []
        for param_name, param_value in parameters.iteritems():
            attr_strings.append(
                jinja_utils.parse_string(
                    '{{arg_name}}="{{arg_value}}"', {
                        'arg_name': param_name,
                        'arg_value': json.dumps(param_value),
                    }
                )
            )

        tag_name = ('oppia-response-%s' %
                    utils.camelcase_to_hyphenated(self.id))
        return '<%s %s></%s>' % (tag_name, ' '.join(attr_strings), tag_name)

    def get_stats_log_html(self, state_customization_args, answer):
        """Gets the HTML for recording a reader response for the stats log.

        Returns an HTML string.
        """
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        parameters = self._get_customization_args(state_customization_args)
        parameters['answer'] = answer

        return jinja_utils.parse_string(
            self._stats_log_template, parameters, autoescape=False)

    def get_widget_instance_dict(self, customization_args):
        """Gets a dict representing a parameterized widget.

        The value for params in the result is a dict, formatted as:

            {PARAM_NAME: PARAM_DESCRIPTION_DICT}

        where PARAM_DESCRIPTION_DICT has the keys ['value', 'generator_id',
        'schema', 'custom_editor', 'default_value', 'tag'].
        """

        result = {
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'widget_id': self.id,
        }

        param_instances = self._get_customization_args(customization_args)

        param_dict = {}
        ca_values_dict = {}
        for ca_spec in self.customization_arg_specs:
            value = (
                customization_args[ca_spec.name]
                if ca_spec.name in customization_args
                else ca_spec.default_value)

            param_dict[ca_spec.name] = {
                'value': param_instances[ca_spec.name],
                'description': ca_spec.description,
                'default_value': ca_spec.default_value,
                'schema': ca_spec.schema,
                'custom_editor': ca_spec.custom_editor,
            }

            ca_values_dict[ca_spec.name] = value

        result['params'] = param_dict
        result['customization_args'] = ca_values_dict

        # Add widget handler information for interactive widgets.
        if self.type == feconf.INTERACTIVE_PREFIX:
            result['handlers'] = [h.to_dict() for h in self.handlers]
            for idx, handler in enumerate(self.handlers):
                result['handlers'][idx]['rules'] = dict((
                    rule_cls.description,
                    {'classifier': rule_cls.__name__}
                ) for rule_cls in handler.rules)

            result['tag'] = self.get_interactive_widget_tag(customization_args)

        # Add RTE toolbar information for noninteractive widgets.
        if self.type == feconf.NONINTERACTIVE_PREFIX:
            result['frontend_name'] = self.frontend_name
            result['tooltip'] = self.tooltip
            result['icon_data_url'] = self.icon_data_url

        return result

    def get_handler_by_name(self, handler_name):
        """Get the handler for a widget, given the name of the handler."""
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
