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

"""Controllers for the profile page."""

__author__ = 'sfederwisch@google.com (Stephanie Federwisch)'

from core.controllers import base
from core.domain import exp_services
from core.domain import stats_services
from core.platform import models
user_services = models.Registry.import_user_services()
(user_pref_services,) = models.Registry.import_models([
    models.NAMES.users
])



class ProfilePage(base.BaseHandler):
    """The profile page."""

    PAGE_NAME_FOR_CSRF = 'gallery_or_profile'

    @base.require_user
    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': 'profile',
        })
        self.render_template('profile/profile.html')


class ProfileHandler(base.BaseHandler):
    """Provides data for the profile gallery."""

    @base.require_user
    def get(self):
        """Handles GET requests."""
        if user_services.is_current_user_admin(self.request):
            exps = exp_services.get_all_explorations()
        else:
            exps = exp_services.get_editable_explorations(self.user_id)

        # Make each entry of the category list unique.
        category_list = list(set([exp.category for exp in exps]))

        self.values.update({
            'explorations': [{
                'id': exp.id,
                'name': exp.title,
            } for exp in exps],
            'improvable': stats_services.get_top_improvable_states(
                [exp.id for exp in exps], 10),
            'category_list': list(category_list)
        })
        self.render_json(self.values)


class CreateUserNamePage(base.BaseHandler):
    """The profile page."""

    PAGE_NAME_FOR_CSRF = 'create_user_name'

    @base.require_user
    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': 'profile',
        })
        self.render_template('profile/create_user_name.html')

    @base.require_user
    def post(self):
      """Handles POST requests.""" 
      username = self.payload.get('username');
      user_settings = user_pref_services.set_username(self.user_id, username)

