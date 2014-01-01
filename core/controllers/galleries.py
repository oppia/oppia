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


class LearnPage(base.BaseHandler):
    """The exploration gallery page for learners."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': feconf.NAV_MODE_LEARN,
        })
        self.render_template('galleries/learn.html')


class LearnHandler(base.BaseHandler):
    """Provides data for the exploration gallery page for learners."""

    def get(self):
        """Handles GET requests."""
        # TODO(sll): Implement paging.
        explorations_dict = exp_services.get_public_explorations_summary_dict()

        categories = collections.defaultdict(list)
        for (eid, exploration_data) in explorations_dict.iteritems():
            categories[exploration_data['category']].append({
                'id': eid,
                'title': exploration_data['title'],
                'to_playtest': False,
            })

        if self.user_id:
            playtest_dict = (
                exp_services.get_explicit_viewer_explorations_summary_dict(
                    self.user_id))
            for (eid, exploration_data) in playtest_dict.iteritems():
                categories[exploration_data['category']].append({
                    'id': eid,
                    'title': exploration_data['title'],
                    'to_playtest': True,
                })

        self.values.update({
            'categories': categories,
        })
        self.render_json(self.values)


class ContributePage(base.BaseHandler):
    """The exploration gallery page for contributors."""

    PAGE_NAME_FOR_CSRF = 'contribute'

    @base.require_registered_as_editor
    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': feconf.NAV_MODE_CONTRIBUTE,
        })
        self.render_template('galleries/contribute.html')


class ContributeHandler(base.BaseHandler):
    """Provides data for the exploration gallery page for contributors."""

    @base.require_registered_as_editor
    def get(self):
        """Handles GET requests."""
        # TODO(sll): Implement paging.
        explorations_dict = (
            exp_services.get_editable_explorations_summary_dict(self.user_id))

        categories = collections.defaultdict(list)
        for (eid, exploration_data) in explorations_dict.iteritems():
            categories[exploration_data['category']].append({
                'id': eid,
                'title': exploration_data['title'],
                'can_clone': rights_manager.Actor(self.user_id).can_clone(eid),
                'can_edit': rights_manager.Actor(self.user_id).can_edit(eid),
                'is_private': (
                    exploration_data['rights']['status'] ==
                    rights_manager.EXPLORATION_STATUS_PRIVATE),
                'is_cloned': bool(exploration_data['rights']['cloned_from']),
            })

        self.values.update({
            'categories': categories,
        })
        self.render_json(self.values)


class NewExploration(base.BaseHandler):
    """Creates a new exploration."""

    PAGE_NAME_FOR_CSRF = 'contribute'

    @base.require_registered_as_editor
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

    PAGE_NAME_FOR_CSRF = 'contribute'

    @base.require_registered_as_editor
    def post(self):
        """Handles POST requests."""
        exploration_id = self.payload.get('exploration_id')

        if not rights_manager.Actor(self.user_id).can_clone(
                exploration_id):
            raise Exception('You cannot copy this exploration.')

        self.render_json({
            'explorationId': exp_services.clone_exploration(
                self.user_id, exploration_id)
        })
