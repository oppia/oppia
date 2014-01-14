# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

import os

from core.domain import obj_services
from core.domain import rule_domain
import feconf
import jinja_utils
import utils


class AnswerHandler(object):
    """Value object for an answer event stream (e.g. submit, click, drag)."""

    def __init__(self, name='submit', input_type=None):
        self.name = name
        self.input_type = input_type
        # TODO(sll): Add an assertion to check that input_type is either None
        # or a class in extensions.objects.models.objects.

    @property
    def rules(self):
        return rule_domain.get_rules_for_input_type(self.input_type)

    def to_dict(self):
        return {
            'name': self.name,
            'input_type': (
                None if self.input_type is None else self.input_type.__name__
            )
        }


class WidgetParamSpec(object):
    """Value object for a widget parameter specification."""

    def __init__(self, name, description, generator, init_args,
                 customization_args, obj_type):
        self.name = name
        self.description = description
        self.generator = generator
        # TODO(sll): init_args and customization_args should be JSONifiable;
        # need to check this.
        self.init_args = init_args
        self.customization_args = customization_args
        self.obj_type = obj_type


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
    # Parameter specifications for this widget. The default parameters can be
    # overridden when the widget is used within a State. Overridden in
    # subclasses.
    _params = []

    # Answer handlers. Overridden in subclasses.
    _handlers = []

    @property
    def params(self):
        return [WidgetParamSpec(**param) for param in self._params]

    @property
    def handlers(self):
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        return [AnswerHandler(**ah) for ah in self._handlers]

    @property
    def is_interactive(self):
        """A widget is interactive iff its handlers array is non-empty."""
        return bool(self._handlers)

    @property
    def _response_template_and_iframe(self):
        """The template that generates the html to display reader responses."""
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        html = utils.get_file_contents(os.path.join(
            feconf.WIDGETS_DIR, feconf.INTERACTIVE_PREFIX,
            self.id, 'response.html'))

        try:
            iframe = utils.get_file_contents(os.path.join(
                feconf.WIDGETS_DIR, feconf.INTERACTIVE_PREFIX,
                self.id, 'response_iframe.html'))
        except IOError:
            iframe = ''

        return html, iframe

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
    def template(self):
        """The template used to generate the widget html."""
        return utils.get_file_contents(os.path.join(
            feconf.WIDGETS_DIR, self.type, self.id, '%s.html' % self.id))

    def _get_widget_param_instances(self, state_customization_args,
                                    context_params, preview_mode=False):
        """Returns a dict of parameter names and values for the widget.

        This dict is used to evaluate widget templates. The parameter values
        are generated based on the widget customizations that are defined by
        the exploration creator. These customizations may also make use of the
        state parameters.

        Args:
          - state_customization_args: dict that maps parameter names to
              custom customization args that are defined in the exploration.
          - context_params: dict with state parameters that is used to
              evaluate any values in state_customization_args that are of the
              form {{STATE_PARAM_NAME}}.
          - preview_mode: if True, default values are generated if the
              customization_args do not permit the generation of an acceptable
              parameter value. Otherwise, this method fails noisily if the
              customization_args are not valid.

        Returns:
          A dict of key-value pairs; the keys are parameter names and the
          values are the generated values for the parameter instance.
        """
        if state_customization_args is None:
            state_customization_args = {}

        parameters = {}
        for param in self.params:
            value_generator = param.generator(**param.init_args)
            # Use the given customization args. If they do not exist, use the
            # default customization args for the parameter.
            args_to_use = (
                state_customization_args[param.name]
                if param.name in state_customization_args
                else param.customization_args
            )

            try:
                generated_value = value_generator.generate_value(
                    context_params, **args_to_use)
            except Exception:
                if preview_mode:
                    generated_value = value_generator.default_value
                else:
                    raise

            # Normalize the generated values to the correct obj_type.
            parameters[param.name] = (
                obj_services.Registry.get_object_class_by_type(
                    param.obj_type).normalize(generated_value))

        return parameters

    def get_raw_code(self, state_customization_args, context_params,
                     preview_mode=False):
        """Gets the raw code for a parameterized widget."""
        return jinja_utils.parse_string(
            self.template,
            self._get_widget_param_instances(
                state_customization_args, context_params,
                preview_mode=preview_mode))

    def get_reader_response_html(self, state_customization_args,
                                 context_params, answer, sticky):
        """Gets the parameterized HTML and iframes for a reader response."""
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        parameters = self._get_widget_param_instances(
            state_customization_args, context_params)
        parameters['answer'] = answer

        # The widget stays through the state transition because it is marked
        # sticky in the exploration and the new state uses the same widget.
        parameters['stateSticky'] = sticky

        html, iframe = self._response_template_and_iframe
        html = jinja_utils.parse_string(html, parameters)
        iframe = jinja_utils.parse_string(iframe, parameters)
        return html, iframe

    def get_stats_log_html(self, state_customization_args,
                           context_params, answer):
        """Gets the HTML for recording a reader response for the stats log.

        Returns an HTML string.
        """
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        parameters = self._get_widget_param_instances(
            state_customization_args, context_params)
        parameters['answer'] = answer

        return jinja_utils.parse_string(
            self._stats_log_template, parameters, autoescape=False)

    def get_widget_instance_dict(self, customization_args, context_params,
                                 preview_mode=True):
        """Gets a dict representing a parameterized widget.

        The value for params in the result is a dict, formatted as:

            {PARAM_NAME: PARAM_DESCRIPTION_DICT}

        where PARAM_DESCRIPTION_DICT has the keys ['value', 'generator_id',
        'init_args', 'customization_args', 'obj_type'].

        If preview_mode is True then a default parameter value is used when the
        customization_args are invalid. This is necessary if, for example, a
        widget parameter depends on a state parameter which has not been set,
        as would be the case in the editor preview mode.
        """

        result = {
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'widget_id': self.id,
            'raw': self.get_raw_code(
                customization_args, context_params, preview_mode=preview_mode),
        }

        param_instances = self._get_widget_param_instances(
            customization_args, context_params, preview_mode=preview_mode)

        param_dict = {}
        customization_args_dict = {}
        for param in self.params:
            param_customization_args = (
                customization_args[param.name]
                if param.name in customization_args
                else param.customization_args)

            param_dict[param.name] = {
                'value': param_instances[param.name],
                'generator_id': param.generator.__name__,
                'description': param.description,
                'init_args': param.init_args,
                'customization_args': param_customization_args,
                'obj_type': param.obj_type,
            }

            customization_args_dict[param.name] = param_customization_args

        result['params'] = param_dict
        result['customization_args'] = customization_args_dict

        # Add widget handler information for interactive widgets.
        if self.type == feconf.INTERACTIVE_PREFIX:
            result['handlers'] = [h.to_dict() for h in self.handlers]
            for idx, handler in enumerate(self.handlers):
                result['handlers'][idx]['rules'] = dict((
                    rule_cls.description,
                    {'classifier': rule_cls.__name__}
                ) for rule_cls in handler.rules)

        # Add RTE toolbar information for noninteractive widgets.
        if self.type == feconf.NONINTERACTIVE_PREFIX:
            result['frontend_name'] = self.frontend_name
            result['tooltip'] = self.tooltip
            result['icon_data_url'] = self.icon_data_url

        return result

    def get_handler_by_name(self, handler_name):
        """Get the handler for a widget, given the name of the handler."""
        return next(h for h in self.handlers if h.name == handler_name)

    def get_rule_by_name(self, handler_name, rule_name):
        """Gets a rule, given its name and ancestors."""
        handler = self.get_handler_by_name(handler_name)
        return next(
            r for r in handler.rules if r.__name__ == rule_name)
