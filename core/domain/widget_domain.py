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

import inspect
import os
import pkgutil

import feconf
from core.domain import param_domain
from core.domain import rule_domain
import utils


class AnswerHandler(object):
    """Value object for an answer event stream (e.g. submit, click, drag)."""

    def __init__(self, name='submit', input_type=None):
        self.name = name
        self.input_type = input_type
        # TODO(sll): Add an assert for input_type: it should be None or a
        # class in data.objects.models.objects.

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
        return [param_domain.Parameter(**param) for param in self._params]

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

    def get_raw_code(self, params=None):
        """Gets the raw code for a parameterized widget."""

        if params is None:
            params = {}

        # Parameters used to generate the raw code for the widget.
        # TODO(sll): Why do we convert only the default value to a JS string?
        parameters = dict(
            (param.name, params.get(
                param.name, utils.convert_to_js_string(param.value))
             ) for param in self.params)

        return utils.parse_with_jinja(self.template, parameters)

    def get_with_params(self, params):
        """Gets a dict representing a parameterized widget."""

        result = {
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'id': self.id,
            'raw': self.get_raw_code(params),
            # TODO(sll): Restructure this so that it is
            # {key: {value: ..., obj_type: ...}}
            'params': dict((param.name, params.get(param.name, param.value))
                           for param in self.params),
        }

        if self.type == feconf.INTERACTIVE_PREFIX:
            result['handlers'] = [h.to_dict() for h in self.handlers]
            for idx, handler in enumerate(self.handlers):
                result['handlers'][idx]['rules'] = dict((
                    rule_cls.description,
                    {'classifier': rule_cls.__name__}
                ) for rule_cls in handler.rules)

        return result

    def get_reader_response_html(self, params=None):
        """Gets the parameterized HTML and iframes for a reader response."""
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        # TODO(kashida): Make this consistent with get_raw_code.
        if params is None:
            params = {}

        html, iframe = self._response_template_and_iframe
        html = utils.parse_with_jinja(html, params)
        iframe = utils.parse_with_jinja(iframe, params)
        return html, iframe

    def get_stats_log_html(self, params=None):
        """Gets the HTML for recording a reader response for the stats log.

        Returns an HTML string.
        """
        if not self.is_interactive:
            raise Exception(
                'This method should only be called for interactive widgets.')

        # TODO(kashida): Make this consistent with get_raw_code.
        if params is None:
            params = {}

        return utils.parse_with_jinja(self._stats_log_template, params)

    def get_handler_by_name(self, handler_name):
        """Get the handler for a widget, given the name of the handler."""
        return next(h for h in self.handlers if h.name == handler_name)

    def get_rule_by_name(self, handler_name, rule_name):
        """Gets a rule, given its name and ancestors."""
        handler = self.get_handler_by_name(handler_name)
        return next(
            r for r in handler.rules if r.__name__ == rule_name)

    def get_rule_description(self, handler_name, rule_name):
        """Gets a rule description, given its name and ancestors."""
        return self.get_rule_by_name(handler_name, rule_name).description


class Registry(object):
    """Registry of all widgets."""

    # The keys of these dicts are the widget ids and the values are instances
    # of the corresponding widgets.
    interactive_widgets = {}
    noninteractive_widgets = {}

    # Maps a widget_type to a (registry_dict, source_dir) pair.
    WIDGET_TYPE_MAPPING = {
        feconf.INTERACTIVE_PREFIX: (
            interactive_widgets, feconf.INTERACTIVE_WIDGETS_DIR
        ),
        feconf.NONINTERACTIVE_PREFIX: (
            noninteractive_widgets, feconf.NONINTERACTIVE_WIDGETS_DIR
        ),
    }

    @classmethod
    def _refresh_widgets_of_type(cls, widget_type):
        registry_dict = cls.WIDGET_TYPE_MAPPING[widget_type][0]
        widget_dir = cls.WIDGET_TYPE_MAPPING[widget_type][1]

        registry_dict.clear()

        # Assemble all paths of the form data/widgets/[WIDGET_TYPE]/[WIDGET_ID].
        ALL_WIDGET_PATHS = []
        full_dir = os.path.join(os.getcwd(), widget_dir)
        ALL_WIDGET_PATHS += [
            os.path.join(os.getcwd(), full_dir, widget_id)
            for widget_id in os.listdir(full_dir)
            if os.path.isdir(os.path.join(full_dir, widget_id))
        ]

        # Crawl the directories and add new widget instances to the registries.
        for loader, name, _ in pkgutil.iter_modules(path=ALL_WIDGET_PATHS):
            module = loader.find_module(name).load_module(name)
            for name, clazz in inspect.getmembers(module, inspect.isclass):
                if issubclass(clazz, BaseWidget):
                    if clazz.__name__ in registry_dict:
                        raise Exception(
                            'Duplicate widget name %s' % clazz.__name__)

                    registry_dict[clazz.__name__] = clazz()

    @classmethod
    def refresh(cls):
        """Repopulate the dict of widget bindings."""
        cls._refresh_widgets_of_type(feconf.INTERACTIVE_PREFIX)
        cls._refresh_widgets_of_type(feconf.NONINTERACTIVE_PREFIX)

    @classmethod
    def get_widgets_of_type(cls, widget_type):
        """Get a list of widget classes whose id starts with widget_prefix."""
        assert widget_type in cls.WIDGET_TYPE_MAPPING

        Registry.refresh()
        return cls.WIDGET_TYPE_MAPPING[widget_type][0].values()

    @classmethod
    def get_widget_by_id(cls, widget_type, widget_id):
        """Gets a widget instance by its type and id.

        Refreshes once if the widget is not found; subsequently, throws an
        error."""
        if widget_id not in cls.WIDGET_TYPE_MAPPING[widget_type][0]:
            cls.refresh()
        return cls.WIDGET_TYPE_MAPPING[widget_type][0][widget_id]
