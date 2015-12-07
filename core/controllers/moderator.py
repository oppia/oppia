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

import logging

from core.controllers import base
from core.domain import email_manager
from core.domain import user_services


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
    def post(self):
        """Handles POST requests."""
        username = self.payload.get('username')
        logging.info(
            '[MODERATOR] %s requested email corresponding to username %s' %
            (self.user_id, username))

        self.render_json({
            'user_email': user_services.get_email_from_username(username),
        })


class EmailDraftHandler(base.BaseHandler):
    """Provide default email templates for moderator emails."""

    @base.require_moderator
    def get(self, action):
        """Handles GET requests."""
        self.render_json({
            'draft_email_body': (
                email_manager.get_draft_moderator_action_email(action)),
        })
