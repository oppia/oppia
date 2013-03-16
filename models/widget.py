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

import feconf
import utils

from google.appengine.ext import ndb
from google.appengine.ext.ndb import polymodel


class Parameter(ndb.Model):
    """A class for parameters."""
    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty()
    param_type = ndb.StringProperty(required=True)
    # TODO(sll): Validate that this default value is of the correct type.
    default_value = ndb.JsonProperty(required=True)


class AnswerHandler(ndb.Model):
    """An event stream."""
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
    params = ndb.StructuredProperty(Parameter, repeated=True)

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

        # Get the raw code by parameterizing widget with params. For now, just
        # use default values.
        # TODO(sll): Actually use params.
        parameters = {}
        for param in widget.params:
            if param.name in params:
                # TODO(sll): Do type-checking.
                parameters[param.name] = params[param.name]
            else:
                parameters[param.name] = param.default_value
        raw = utils.parse_with_jinja(widget.template, parameters)

        result = widget.to_dict()
        if 'handlers' in result:
            actions = {}
            for item in result['handlers']:
                actions[item['name']] = {'classifier': item['classifier']}
            result['actions'] = actions
            del result['handlers']
        result['params'] = parameters
        result['id'] = widget_id
        result['raw'] = raw
        return result


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

            html_file = os.path.join(widget_id, '%s.html' % widget_id)
            template = utils.get_file_contents(feconf.SAMPLE_WIDGETS_DIR, html_file)

            params = []
            for key, value in widget_config['params'].iteritems():
                params.append(Parameter(
                    name=key, default_value=value,
                    param_type=type(value).__name__
                ))

            actions = []
            for key, value in widget_config['actions'].iteritems():
                actions.append(AnswerHandler(
                    name=key, classifier=value['classifier']
                ))

            widget = cls(
                id=widget_config['id'],
                name=widget_config['name'],
                category=widget_config['category'],
                description=widget_config['description'],
                template=template,
                params=params,
                handlers=actions
            )

            widget.put()
