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

"""Classes relating to widget definitions.

A note on terminology: state_customization_args refers to the values of
customization args that are provided by an exploration editor. They are
formatted as

    {ca_name: {value: ca_value}}

On the other hand, widget.customization_args refers to a combination of
the widget customization arg spec and the value used. It is a list of
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

    def __init__(self, name, description, schema, default_value):
        self.name = name
        self.description = description
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
    # Customization arg specifications for displaying this widget. The default
    # values for these can be overridden when the widget is used within a
    # state. Overridden in subclasses.
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

        raise Exception(
            'Could not find handler in widget %s with name %s' %
            (self.name, handler_name))

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
    def html_body(self):
        """The HTML code containing directives and templates for the widget.

        This contains everything needed to display the widget once the
        necessary attributes are supplied.

        For noninteractive widgets, there is one directive/template pair.
        For interactive widgets, there are two (the additional one is for
        displaying the learner's response).
        """
        js_directives = utils.get_file_contents(os.path.join(
            feconf.WIDGETS_DIR, self.type, self.id, '%s.js' % self.id))
        html_templates = utils.get_file_contents(os.path.join(
            feconf.WIDGETS_DIR, self.type, self.id, '%s.html' % self.id))
        return '<script>%s</script>\n%s' % (js_directives, html_templates)

    def to_dict(self):
        """Gets a dict representing this widget. Only default values are provided."""

        result = {
            'widget_id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'customization_args': [{
                'name': ca_spec.name,
                'description': ca_spec.description,
                'default_value': ca_spec.default_value,
                'schema': ca_spec.schema,
            } for ca_spec in self.customization_arg_specs]
        }

        if self.type == feconf.INTERACTIVE_PREFIX:
            # Add widget handler information for interactive widgets.
            result['handler_specs'] = [h.to_dict() for h in self.handlers]
            for idx, handler in enumerate(self.handlers):
                result['handler_specs'][idx]['rules'] = dict((
                    rule_cls.description,
                    {'classifier': rule_cls.__name__}
                ) for rule_cls in handler.rules)

            result['tag'] = self.get_interactive_widget_tag({})
        elif self.type == feconf.NONINTERACTIVE_PREFIX:
            # Add RTE toolbar information for noninteractive widgets.
            result.update({
                'frontend_name': self.frontend_name,
                'tooltip': self.tooltip,
                'icon_data_url': self.icon_data_url,
            })

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

    def get_interactive_widget_tag(self, state_customization_args):
        """Gets the HTML tag used to display an interactive widget."""
        if state_customization_args is None:
            state_customization_args = {}

        tag_name = ('oppia-interactive-%s' %
                    utils.camelcase_to_hyphenated(self.id))

        attr_strings = []
        for ca_spec in self.customization_arg_specs:
            ca_value = (
                state_customization_args[ca_spec.name]['value']
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

        parameters = {
            'answer': answer,
            # The widget stays through the state transition because it is marked
            # sticky in the exploration and the new state uses the same widget.
            'stateSticky': sticky,
        }

        # Special case for multiple-choice input. 
        # TODO(sll): Turn the answer into the actual multiple-choice string, and
        # remove this special case.
        for ca_spec in self.customization_arg_specs:
            if ca_spec.name == 'choices':
                parameters['choices'] = (
                    state_customization_args['choices']['value']
                    if 'choices' in state_customization_args
                    else ca_spec.default_value)

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
