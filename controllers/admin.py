# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Controllers for the Oppia admin view."""

__author__ = 'sll@google.com (Sean Lip)'

import json

from apps.classifier.models import Classifier
from apps.exploration.models import Exploration
from apps.widget.models import InteractiveWidget
from apps.widget.models import NonInteractiveWidget
from apps.widget.models import Widget
from controllers.base import BaseHandler
from controllers.base import require_admin


def reload_widgets():
    """Reload the default classifiers and widgets."""
    Classifier.delete_all_classifiers()
    Classifier.load_default_classifiers()

    Widget.delete_all_widgets()
    InteractiveWidget.load_default_widgets()
    NonInteractiveWidget.load_default_widgets()


def reload_explorations():
    """Reload the default explorations."""
    Exploration.delete_demo_explorations()
    Exploration.load_demo_explorations()


def reload_demos():
    """Reload default classifiers, widgets, and explorations (in that order)."""
    reload_widgets()
    reload_explorations()


class AdminPage(BaseHandler):
    """Admin page shown in the App Engine admin console."""

    @require_admin
    def get(self):
        """Handles GET requests."""
        self.render_template('admin/admin.html')

    @require_admin
    def post(self):
        """Reloads the default widgets and explorations."""
        payload = json.loads(self.request.get('payload'))
        if payload.get('action') == 'reload':
            if payload.get('item') == 'explorations':
                reload_explorations()
            elif payload.get('item') == 'widgets':
                reload_widgets()
