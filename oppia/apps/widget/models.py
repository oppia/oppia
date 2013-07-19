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

"""Models for Oppia widgets."""

__author__ = 'Sean Lip'

import inspect
import os
import pkgutil

import feconf
import oppia.apps.base_model.models as base_models
import oppia.apps.classifier.models as cl_models
import oppia.apps.parameter.models as param_models
import utils

from google.appengine.ext import ndb


class AnswerHandler(base_models.BaseModel):
    """An answer event stream (submit, click, drag, etc.)."""
    name = ndb.StringProperty(default='submit')
    # TODO(sll): Store a reference instead?
    classifier = ndb.StringProperty(
        choices=cl_models.Classifier.get_classifier_ids())

    @property
    def rules(self):
        if not self.classifier:
            return []
        return cl_models.Classifier.get(self.classifier).rules


class BaseWidget(object):
    """Base widget definition class."""
    @property
    def type(self):
        return 'interactive' if self.is_interactive else 'noninteractive'

    @property
    def id(self):
        return self.__class__.__name__

    # The human-readable name of the widget.
    name = ''
    # The category in the widget repository to which this widget belongs.
    category = ''
    # The description of the widget.
    description = ''
    # Parameter specifications for this widget. The default parameters can be
    # overridden when the widget is used within a State.
    params = []

    handlers = []

    @property
    def is_interactive(self):
        """A widget is interactive iff its handlers array is non-empty."""
        return bool(self.handlers)

    @property
    def response_template_and_iframe(self):
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
    def stats_log_template(self):
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


class Registry(object):
    """Registry of all widgets."""

    # The keys of these dicts are the widget ids and the values are instances
    # of the corresponding widgets.
    # TODO(sll): Actually make them instances, not classes.
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

        # Crawl the directories and add new widgets to the bindings dict.
        for loader, name, _ in pkgutil.iter_modules(path=ALL_WIDGET_PATHS):
            module = loader.find_module(name).load_module(name)
            for name, clazz in inspect.getmembers(module, inspect.isclass):
                if issubclass(clazz, BaseWidget):
                    if clazz.__name__ in registry_dict:
                        raise Exception(
                            'Duplicate widget name %s' % clazz.__name__)

                    registry_dict[clazz.__name__] = clazz

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


def get_rules_for_handler(widget_id, handler_name):
    for handler in get_widget_handlers(widget_id):
        if handler['name'] == handler_name:
            if handler['classifier'] is None:
                return []
            else:
                return cl_models.Classifier.get(handler['classifier']).rules


def get_widget_template(widget_type, widget_id):
    """The template used to generate the widget html."""
    if widget_id not in Registry.WIDGET_TYPE_MAPPING[widget_type][0]:
        Registry.refresh()
    assert widget_id in Registry.WIDGET_TYPE_MAPPING[widget_type][0]

    return utils.get_file_contents(os.path.join(
        feconf.WIDGETS_DIR, widget_type, widget_id, '%s.html' % widget_id))


def get_widget_params(widget_type, widget_id):
    widget_cls = Registry.get_widget_by_id(widget_type, widget_id)
    return [param_models.Parameter(**param) for param in widget_cls.params]


def get_widget_handlers(widget_id):
    widget_cls = Registry.get_widget_by_id(
        feconf.INTERACTIVE_PREFIX, widget_id)
    return [AnswerHandler(**ah) for ah in widget_cls.handlers]


def get_raw_code(widget_type, widget_id, params=None):
    """Gets the raw code for a parameterized widget."""
    if params is None:
        params = {}

    widget_params = get_widget_params(widget_type, widget_id)

    # Parameters used to generate the raw code for the widget.
    # TODO(sll): Why do we convert only the default value to a JS string?
    parameters = dict(
        (param.name, params.get(
            param.name, utils.convert_to_js_string(param.value))
         ) for param in widget_params)

    return utils.parse_with_jinja(
        get_widget_template(widget_type, widget_id), parameters)


def get_with_params(widget_type, widget_id, params):
    """Gets a dict representing a parameterized widget."""
    widget_cls = Registry.get_widget_by_id(widget_type, widget_id)
    widget_params = get_widget_params(widget_type, widget_id)

    result = {
        'name': widget_cls.name,
        'category': widget_cls.category,
        'description': widget_cls.description,
        'id': widget_id,
        'raw': get_raw_code(widget_type, widget_id, params),
        # TODO(sll): Restructure this so that it is
        # {key: {value: ..., obj_type: ...}}
        'params': dict((param.name, params.get(param.name, param.value))
                       for param in widget_params),
    }

    if widget_type == feconf.INTERACTIVE_PREFIX:
        widget_handlers = get_widget_handlers(widget_id)
        result['handlers'] = [h.to_dict() for h in widget_handlers]
        for idx, handler in enumerate(widget_handlers):
            result['handlers'][idx]['rules'] = dict(
                (rule.name, {'classifier': rule.rule, 'checks': rule.checks})
                for rule in handler.rules)

    return result


def get_reader_response_html(widget_id, params=None):
    """Gets the parameterized HTML and iframes for a reader response."""
    # TODO(kashida): Make this consistent with get_raw_code.
    if params is None:
        params = {}

    widget_cls = Registry.get_widget_by_id(
        feconf.INTERACTIVE_PREFIX, widget_id)
    assert widget_cls().is_interactive

    html, iframe = widget_cls().response_template_and_iframe
    html = utils.parse_with_jinja(html, params)
    iframe = utils.parse_with_jinja(iframe, params)
    return html, iframe


def get_stats_log_html(widget_id, params=None):
    """Gets the HTML for recording a reader response for the stats log."""
    # TODO(kashida): Make this consistent with get_raw_code.
    if params is None:
        params = {}

    widget_cls = Registry.get_widget_by_id(
        feconf.INTERACTIVE_PREFIX, widget_id)
    return utils.parse_with_jinja(widget_cls().stats_log_template, params)


def get_readable_rule_name(widget_id, handler_name, rule_rule):
    """Get the human-readable text for a rule."""
    handlers = get_widget_handlers(widget_id)

    handler = next((h for h in handlers if h.name == handler_name), None)

    try:
        rule = next(r.name for r in handler.rules if r.rule == rule_rule)
    except StopIteration:
        raise Exception('No rule name found for %s' % rule_rule)

    return rule
