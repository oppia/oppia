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

import apps.exploration.services as exp_services
from controllers.base import BaseHandler


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
        explorations = exp_services.get_viewable_explorations(self.user)
        editable_exploration_ids = [
            e.id for e in exp_services.get_editable_explorations(self.user)]

        categories = collections.defaultdict(list)

        for exploration in explorations:
            categories[exploration.category].append({
                'can_edit': exploration.id in editable_exploration_ids,
                'can_fork': self.user and exp_services.is_demo(exploration),
                'id': exploration.id,
                'image_id': exploration.image_id,
                'is_owner': exp_services.is_owner(self.user, exploration),
                'title': exploration.title,
            })

        self.values.update({
            'categories': categories,
        })
        self.render_json(self.values)
