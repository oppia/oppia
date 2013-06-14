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

"""Controllers for the gallery page."""

__author__ = 'sll@google.com (Sean Lip)'

import apps.exploration.services as exp_services
from controllers.base import BaseHandler
import utils

from google.appengine.api import users


class GalleryPage(BaseHandler):
    """The exploration gallery page."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': 'gallery',
        })
        self.render_template('gallery/gallery.html')


class GalleryHandler(BaseHandler):
    """Provides data for the exploration gallery."""

    def get(self):
        """Handles GET requests."""
        user = users.get_current_user()

        used_keys = []

        categories = {}
        editable_explorations = exp_services.get_editable_explorations(user)
        editable_exploration_ids = [e.id for e in editable_explorations]
        explorations = exp_services.get_viewable_explorations(user)

        for exploration in explorations:
            used_keys.append(exploration.key)

            data = exploration.to_dict(exclude=['states', 'init_state'])
            data.update({
                'id': exploration.id,
                'editors': [
                    editor.nickname() for editor in exploration.editors
                ]
            })

            category_name = exploration.category
            if not categories.get(category_name):
                categories[category_name] = []

            categories[category_name].append({
                'data': data,
                'can_edit': exploration.id in editable_exploration_ids,
                'can_fork': user and exp_services.is_demo(exploration),
                'is_owner': (user and exploration.editors and
                             exp_services.is_owner(user, exploration)),
            })

        self.values.update({
            'categories': categories,
        })
        self.render_json(self.values)
