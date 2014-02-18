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

"""Controllers for interactive and non-interactive widgets."""

__author__ = 'sll@google.com (Sean Lip)'

import collections

from core.controllers import base
from core.domain import widget_registry
import feconf


class WidgetRepositoryHandler(base.BaseHandler):
    """Populates the widget repository pages."""

    def get(self, widget_type):
        """Handles GET requests."""
        try:
            widget_list = widget_registry.Registry.get_widgets_of_type(
                widget_type)
        except Exception:
            raise self.PageNotFoundException

        widgets = collections.defaultdict(list)
        for widget in widget_list:
            widget_instance_dict = widget.get_widget_instance_dict({}, {})
            if widget_type == feconf.INTERACTIVE_PREFIX:
                widget_instance_dict['tag'] = (
                    widget.get_interactive_widget_tag({}, {}))
            widgets[widget.category].append(widget_instance_dict)

        for category in widgets:
            widgets[category].sort()

        response = {'widgetRepository': widgets}

        self.render_json(response)


class WidgetHandler(base.BaseHandler):
    """Returns instance dicts for individual widgets."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    def post(self, widget_type, widget_id):
        """Handles POST requests for parameterized widgets."""

        customization_args = self.payload.get('customization_args', {})

        widget = widget_registry.Registry.get_widget_by_id(
            widget_type, widget_id)

        result = {
            'widget': widget.get_widget_instance_dict(
                customization_args, {}, preview_mode=True),
        }

        if widget_type == feconf.INTERACTIVE_PREFIX:
            result['tag'] = widget.get_interactive_widget_tag(
                customization_args, {})

        self.render_json(result)
