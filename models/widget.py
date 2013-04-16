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

import copy
import os

from classifier import Classifier
import feconf
import utils
from parameter import Parameter
from parameter import ParameterProperty

from google.appengine.ext import ndb
from google.appengine.ext.ndb import polymodel


class AnswerHandler(ndb.Model):
    """An answer event stream (submit, click, drag, etc.)."""
    name = ndb.StringProperty(default='submit')
    # TODO(sll): Store a reference instead?
    classifier = ndb.StringProperty()

    @property
    def rules(self):
        if not self.classifier:
            return []
        return Classifier.get_by_id(self.classifier).rules


class Widget(polymodel.PolyModel):
    """A superclass for NonInteractiveWidget and InteractiveWidget.

    NB: The ids for this class are strings that are camel-cased versions of the
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
    # overridden when the widget is used within a State.
    params = ParameterProperty(repeated=True)

    @classmethod
    def get(cls, widget_id):
        """Gets a widget by id. If it does not exist, returns None."""
        return cls.get_by_id(widget_id)

    @classmethod
    def get_raw_code(cls, widget_id, params=None):
        """Gets the raw code for a parameterized widget."""
        if params is None:
            params = {}

        widget = cls.get(widget_id)

        # Parameters used to generate the raw code for the widget.
        parameters = {}
        for param in widget.params:
            parameters[param.name] = params.get(
                param.name, utils.convert_to_js_string(param.value))

        return utils.parse_with_jinja(widget.template, parameters)

    @classmethod
    def get_with_params(cls, widget_id, params=None):
        """Gets a parameterized widget."""
        if params is None:
            params = {}

        widget = cls.get(widget_id)

        result = copy.deepcopy(widget.to_dict())
        result['id'] = widget_id
        result['raw'] = cls.get_raw_code(widget_id, params)
        # TODO(sll): Restructure this so that it is
        # {key: {value: ..., obj_type: ...}}
        result['params'] = dict((param.name, params.get(param.name, param.value))
                                for param in widget.params)

        for handler in widget.handlers:
            for r_handler in result['handlers']:
                if r_handler['classifier'] == handler.classifier:
                    rule_dict = {}
                    for rule in handler.rules:
                        rule_dict[rule.name] = {
                            'classifier': rule.rule, 'checks': rule.checks}
                    r_handler['rules'] = rule_dict

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

    def _get_handler(self, handler_name):
        """Get the handler object corresponding to a given handler name."""
        for handler in self.handlers:
            if handler.name == handler_name:
                return handler
        return None

    @classmethod
    def load_default_widgets(cls):
        """Loads the default widgets.

        Assumes that everything is valid (directories exist, widget config files
        are formatted correctly, etc.).
        """
        widget_ids = os.listdir(feconf.SAMPLE_WIDGETS_DIR)

        for widget_id in widget_ids:
            widget_dir = os.path.join(feconf.SAMPLE_WIDGETS_DIR, widget_id)
            widget_conf_filename = '%s.config.yaml' % widget_id
            with open(os.path.join(widget_dir, widget_conf_filename)) as f:
                conf = utils.dict_from_yaml(f.read().decode('utf-8'))

            conf['params'] = [Parameter(**param) for param in conf['params']]
            conf['handlers'] = [AnswerHandler(**ah) for ah in conf['handlers']]
            conf['template'] = utils.get_file_contents(
                os.path.join(widget_dir, '%s.html' % widget_id))

            widget = cls(**conf)
            widget.put()

    def get_readable_name(self, handler_name, rule_rule):
        """Get the human-readable text for a rule."""
        handler = self._get_handler(handler_name)
        for rule in handler.rules:
            if rule.rule == rule_rule:
                return rule.name

        raise Exception('No rule name found for %s' % rule_rule)
