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

import collections
import feconf

from core.controllers import base
from core.domain import exp_services
from core.platform import models
current_user_services = models.Registry.import_current_user_services()


class GalleryPage(base.BaseHandler):
    """The exploration gallery page."""

    PAGE_NAME_FOR_CSRF = 'gallery_or_profile'

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': 'gallery',
        })
        self.render_template('gallery/gallery.html')


class GalleryHandler(base.BaseHandler):
    """Provides data for the exploration gallery."""

    def get(self):
        """Handles GET requests."""
        if current_user_services.is_current_user_admin(self.request):
            explorations = exp_services.get_all_explorations()
            editable_exploration_ids = [e.id for e in explorations]
        elif self.user_id:
            explorations = exp_services.get_viewable_explorations(self.user_id)
            editable_exploration_ids = [
                e.id for e in exp_services.get_editable_explorations(
                    self.user_id)
            ]
        else:
            explorations = exp_services.get_public_explorations()
            editable_exploration_ids = []

        categories = collections.defaultdict(list)

        for exploration in explorations:
            categories[exploration.category].append({
                'can_edit': exploration.id in editable_exploration_ids,
                'can_fork': self.user_id and exploration.is_demo,
                'id': exploration.id,
                'is_owner': (current_user_services.is_current_user_admin(self.request) or
                             exploration.is_owned_by(self.user_id)),
                'title': exploration.title,
            })

        self.values.update({
            'categories': categories,
        })
        self.render_json(self.values)


class NewExploration(base.BaseHandler):
    """Creates a new exploration."""

    PAGE_NAME_FOR_CSRF = 'gallery_or_profile'

    @base.require_user
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')

        yaml_content = self.request.get('yaml')

        if yaml_content and feconf.ALLOW_YAML_FILE_UPLOAD:
            exploration_id = exp_services.create_from_yaml(
                yaml_content, self.user_id, title, category)
        else:
            exploration_id = exp_services.create_new(
                self.user_id, title=title, category=category)

        self.render_json({'explorationId': exploration_id})


class ForkExploration(base.BaseHandler):
    """Forks an existing exploration."""

    PAGE_NAME_FOR_CSRF = 'gallery_or_profile'

    @base.require_user
    def post(self):
        """Handles POST requests."""
        exploration_id = self.payload.get('exploration_id')

        self.render_json({
            'explorationId': exp_services.fork_exploration(
                exploration_id, self.user_id)
        })
