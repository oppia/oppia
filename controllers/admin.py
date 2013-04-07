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

from controllers.base import BaseHandler
from controllers.base import require_admin
from models.exploration import Exploration
from models.widget import InteractiveWidget
from models.widget import NonInteractiveWidget
from models.widget import Widget
import utils


def reload_default_data():
    """Reload the default widgets, then reload the default explorations."""
    Widget.delete_all_widgets()
    InteractiveWidget.load_default_widgets()
    NonInteractiveWidget.load_default_widgets()

    Exploration.delete_demo_explorations()
    Exploration.load_demo_explorations()


class AdminPage(BaseHandler):
    """Admin page shown in the App Engine admin console."""

    @require_admin
    def get(self, user):
        """Handles GET requests."""
        self.values.update({
            'js': utils.get_js_controllers([]),
        })
        self.render_template('admin/admin.html')

    @require_admin
    def post(self, user):
        """Reloads the default widgets and explorations."""
        reload_default_data()
