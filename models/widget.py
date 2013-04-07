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

import os
import re

import feconf
import utils

from google.appengine.ext import ndb
from google.appengine.ext.ndb import polymodel


class AlphanumericProperty(ndb.StringProperty):
    """A property for strings with alphanumeric characters."""

    def _validate(self, value):
        """Check that the value is alphanumeric."""
        assert re.compile("^[a-zA-Z0-9]+$").match(value), (
            'Only parameter names with characters in [a-zA-Z0-9] are accepted.')


class WidgetParameter(ndb.Model):
    """A class for parameters."""
    name = AlphanumericProperty(required=True)
    description = ndb.TextProperty()
    param_type = ndb.StringProperty(required=True)
    # TODO(sll): Validate that this default value is of the correct type, or None.
    default_value = ndb.JsonProperty()


class AnswerHandler(ndb.Model):
    """An answer event stream (submit, click, drag, etc.)."""
    name = ndb.StringProperty(default='submit')
    # TODO(sll): Change the following to become a reference.
    classifier = ndb.StringProperty()


class Widget(polymodel.PolyModel):
    """A superclass for NonInteractiveWidget and InteractiveWidget.

    NB: The ids for this class are strings that are similar to the
    human-readable names.
    """
    @property
    def id(self):
        return self.key.id()

    # The human-readable name of the widget.
    name = ndb.StringProperty(required=True)
    # The category in the widget repository to which this widget belongs.
    category = ndb.StringProperty(required=True)
    # The description of the widget.
    description = ndb.TextProperty()
    # The widget html template (this is the entry point).
    template = ndb.TextProperty(required=True)
    # Parameter specifications for this widget. The default parameters can be
    # overridden when the widget is used.
    params = ndb.StructuredProperty(WidgetParameter, repeated=True)

    @classmethod
    def get(cls, widget_id):
        """Gets a widget by id. If it does not exist, returns None."""
        return cls.get_by_id(widget_id)

    @classmethod
    def get_with_params(cls, widget_id, params=None):
        """Gets a parameterized widget."""
        if params is None:
            params = {}

        widget = cls.get(widget_id)
        if widget is None:
            raise Exception('Widget %s does not exist.' % widget_id)

        # Get the raw code by parameterizing widget with params.
        parameters = {}
        for param in widget.params:
            if param.name in params:
                # TODO(sll): Do type-checking.
                parameters[param.name] = params[param.name]
            else:
                parameters[param.name] = utils.convert_to_js_string(
                    param.default_value)

        raw = utils.parse_with_jinja(widget.template, parameters)

        # The following are NOT stringified.
        actual_params = {}
        for param in widget.params:
            if param.name in params:
                actual_params[param.name] = params[param.name]
            else:
                actual_params[param.name] = param.default_value

        result = widget.to_dict()
        result['id'] = widget_id
        result['raw'] = raw
        # TODO(sll): Restructure this so that it is
        # {key: {value: ..., param_type: ..., default_value: ...}}
        result['params'] = actual_params
        if 'handlers' in result:
            actions = {}
            for item in result['handlers']:
                actions[item['name']] = {'classifier': item['classifier']}
            result['actions'] = actions
            del result['handlers']

        for unused_action, properties in result['actions'].iteritems():
            classifier = properties['classifier']
            if classifier and classifier != 'None':
                with open(os.path.join(
                        feconf.SAMPLE_CLASSIFIERS_DIR,
                        classifier,
                        '%sRules.yaml' % classifier)) as f:
                    rules = utils.get_dict_from_yaml(f.read().decode('utf-8'))
                    rule_dict = {}
                    for rule in rules:
                        rule_dict[rules[rule]['name']] = {'classifier': rule}
                        if 'checks' in rules[rule]:
                            rule_dict[rules[rule]['name']]['checks'] = (
                                rules[rule]['checks'])
                    properties['rules'] = rule_dict

        return result

    @classmethod
    def delete_all_widgets(cls):
        """Deletes all widgets."""
        widget_list = Widget.query()
        for widget in widget_list:
            widget.key.delete()


class NonInteractiveWidget(Widget):
    """A generic non-interactive widget."""

    @classmethod
    def load_default_widgets(cls):
        """Loads the default widgets."""
        # TODO(sll): Implement this.
        pass


class InteractiveWidget(Widget):
    """A generic interactive widget."""
    handlers = ndb.StructuredProperty(AnswerHandler, repeated=True)

    def _pre_put_hook(self):
        """Ensures that at least one handler exists."""
        assert len(self.handlers)

    @classmethod
    def load_default_widgets(cls):
        """Loads the default widgets."""

        widget_ids = os.listdir(os.path.join(feconf.SAMPLE_WIDGETS_DIR))

        for widget_id in widget_ids:
            with open(os.path.join(
                    feconf.SAMPLE_WIDGETS_DIR, widget_id,
                    '%s.config.yaml' % widget_id)) as f:
                widget_config = utils.get_dict_from_yaml(
                    f.read().decode('utf-8'))

            assert widget_id == widget_config['id']

            html_file = os.path.join(widget_id, '%s.html' % widget_id)
            template = utils.get_file_contents(os.path.join(
                feconf.SAMPLE_WIDGETS_DIR, html_file))

            params = []
            for param in widget_config['params']:
                params.append(WidgetParameter(
                    name=param.get('name'),
                    description=param.get('description'),
                    param_type=param.get('param_type'),
                    default_value=param.get('default_value'),
                ))

            handlers = []
            for handler in widget_config['handlers']:
                handlers.append(AnswerHandler(
                    name=handler.get('name'),
                    classifier=handler.get('classifier')),
                )

            widget = cls(
                id=widget_config['id'],
                name=widget_config['name'],
                category=widget_config['category'],
                description=widget_config['description'],
                template=template,
                params=params,
                handlers=handlers,
            )

            widget.put()

    def get_readable_name(self, handler_name, rule_name):
        """Get the human-readable name for a rule."""
        for handler in self.handlers:
            if handler.name == handler_name:
                classifier = handler.classifier
                with open(os.path.join(
                        feconf.SAMPLE_CLASSIFIERS_DIR,
                        classifier,
                        '%sRules.yaml' % classifier)) as f:
                    rules = utils.get_dict_from_yaml(f.read().decode('utf-8'))
                    return rules[rule_name]['name']
        raise Exception('No rule name found for %s' % rule_name)
