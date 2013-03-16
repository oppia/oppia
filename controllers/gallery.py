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

import json
import controller_utils
from controllers.base import BaseHandler
from models.augmented_user import AugmentedUser
from models.exploration import Exploration
import utils

from google.appengine.api import users


class GalleryPage(BaseHandler):
    """The exploration gallery page."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'js': utils.get_js_controllers(['gallery']),
            'nav_mode': 'gallery',
        })
        self.render_template('gallery.html')


class GalleryHandler(BaseHandler):
    """Provides data for the exploration gallery."""

    def get(self):
        """Handles GET requests."""
        user = users.get_current_user()
        augmented_user = AugmentedUser.get(user) if user else None

        used_keys = []

        categories = {}
        for exploration in Exploration.query().filter(
                Exploration.is_public == True):
            category_name = exploration.category

            can_edit = user and controller_utils.check_can_edit(user, exploration)

            used_keys.append(exploration.key)

            data = exploration.to_dict(
                exclude=['states', 'init_state', 'owner'])
            data.update({'id': exploration.id})

            if not categories.get(category_name):
                categories[category_name] = []
            categories[category_name].append({
                'data': data,
                'can_edit': can_edit,
                'can_fork': user and exploration.is_demo(),
                'is_owner': user and user == exploration.owner,
            })

        if augmented_user:
            for exploration_key in augmented_user.editable_explorations:
                if exploration_key not in used_keys:
                    # Add this exploration to the relevant category.
                    exploration = exploration_key.get()

                    data = exploration.to_dict(
                        exclude=['states', 'init_state', 'owner'])
                    data.update({'id': exploration.id})
                    exploration_data = {
                        'data': data,
                        'can_edit': True,
                        'can_fork': False,
                        'is_owner': user == exploration.owner,
                    }

                    if not categories.get(exploration.category):
                        categories[exploration.category] = []
                    categories[exploration.category].append(exploration_data)

        self.values.update({
            'categories': categories,
        })
        self.response.write(json.dumps(self.values))
