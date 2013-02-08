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
from controllers.base import BaseHandler
import feconf, models, utils

from google.appengine.api import users


class GalleryPage(BaseHandler):
    """The exploration gallery page."""

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        self.values.update({
            'js': utils.GetJsFilesWithBase(['gallery']),
            'nav_mode': 'gallery',
        })
        self.response.out.write(
            feconf.JINJA_ENV.get_template('gallery.html').render(self.values))


class GalleryHandler(BaseHandler):
    """Provides data for the exploration gallery."""

    def get(self):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        user = users.get_current_user()
        augmented_user = utils.GetAugmentedUser(user) if user else None

        used_keys = []

        categories = {}
        for exploration in models.Exploration.query().filter(
                models.Exploration.is_public == True):
            category_name = exploration.category

            if augmented_user:
                can_edit = exploration.key in augmented_user.editable_explorations
            else:
                can_edit = False

            used_keys.append(exploration.key)

            if not categories.get(category_name):
                categories[category_name] = []
            categories[category_name].append({
                'data': exploration.to_dict(
                    exclude=['states', 'init_state', 'owner']),
                'can_edit': can_edit,
                'is_owner': user == exploration.owner,
            })

        if augmented_user:
            MY_EXPLORATIONS = 'My Explorations'
            categories[MY_EXPLORATIONS] = []
            for exploration_key in augmented_user.editable_explorations:
                exploration = exploration_key.get()
                if exploration.key not in used_keys:
                    exploration_data = {
                        'data': exploration.to_dict(
                            exclude=['states', 'init_state', 'owner']),
                        'can_edit': True,
                        'is_owner': user == exploration.owner,
                    }
                    categories[MY_EXPLORATIONS].append(exploration_data)

                    # Also, add this exploration to the relevant category.
                    if not categories.get(exploration.category):
                        categories[exploration.category] = []
                    categories[exploration.category].append(exploration_data)

        self.data_values.update({
            'categories': categories,
        })
        self.response.out.write(json.dumps(self.data_values))
