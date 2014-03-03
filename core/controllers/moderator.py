# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the moderator page."""

__author__ = 'yanamal@google.com (Yana Malysheva)'

from core.controllers import base
from core.domain import user_services
import feconf
import utils


class ModeratorPage(base.BaseHandler):
    """The moderator page."""

    PAGE_NAME_FOR_CSRF = 'moderator_page'

    @base.require_moderator
    def get(self):
        """Handles GET requests."""
        self.render_template('moderator/moderator.html')


class UserServiceHandler(base.BaseHandler):
    """Provide data for the moderator page"""

    PAGE_NAME_FOR_CSRF = 'moderator_page'

    @base.require_moderator
    def get(self):
        """Handles GET requests."""
        self.render_json({})

    @base.require_moderator
    def post(self):
        """Handles POST requests."""
        username = self.payload.get('username')
        self.render_json({
            'user_email': user_services.get_email_from_username(username),
        })
                          
