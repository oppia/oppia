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
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager


class GalleryPage(base.BaseHandler):
    """The exploration gallery page."""

    PAGE_NAME_FOR_CSRF = 'gallery_or_profile'

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': feconf.NAV_MODE_GALLERY,
        })
        self.render_template('gallery/gallery.html')


class GalleryHandler(base.BaseHandler):
    """Provides data for the exploration gallery."""

    def get(self):
        """Handles GET requests."""
        # TODO(sll): Instead of doing all this, make three queries that get
        # all viewable/clonable/editable explorations for this user. Get only
        # the metadata and implement paging.
        explorations = exp_services.get_viewable_explorations(self.user_id)

        categories = collections.defaultdict(list)
        for exploration in explorations:
            categories[exploration.category].append({
                'can_clone': rights_manager.Actor(self.user_id).can_clone(
                    exploration.id),
                'can_edit': rights_manager.Actor(self.user_id).can_edit(
                    exploration.id),
                'can_view': (
                    rights_manager.Actor(self.user_id).can_view(exploration.id)
                ),
                'id': exploration.id,
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

        new_exploration_id = exp_services.get_new_exploration_id()
        if yaml_content and feconf.ALLOW_YAML_FILE_UPLOAD:
            exp_services.save_new_exploration_from_zip_file(
                self.user_id, yaml_content, title, category,
                new_exploration_id)
        else:
            exploration = exp_domain.Exploration.create_default_exploration(
                new_exploration_id, title, category)
            exp_services.save_new_exploration(self.user_id, exploration)

        self.render_json({'explorationId': exploration.id})


class CloneExploration(base.BaseHandler):
    """Clones an existing exploration."""

    PAGE_NAME_FOR_CSRF = 'gallery_or_profile'

    @base.require_user
    def post(self):
        """Handles POST requests."""
        exploration_id = self.payload.get('exploration_id')

        self.render_json({
            'explorationId': exp_services.clone_exploration(
                self.user_id, exploration_id)
        })
