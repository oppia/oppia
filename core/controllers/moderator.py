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

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import activity_domain
from core.domain import activity_services
from core.domain import email_manager
from core.domain import summary_services
import feconf


class ModeratorPage(base.BaseHandler):
    """The moderator page."""

    @acl_decorators.can_access_moderator_page
    def get(self):
        """Handles GET requests."""
        self.render_template('pages/moderator/moderator.html')


class FeaturedActivitiesHandler(base.BaseHandler):
    """The moderator page handler for featured activities."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_moderator_page
    def get(self):
        """Handles GET requests."""
        self.render_json({
            'featured_activity_references': [
                activity_reference.to_dict() for activity_reference in
                activity_services.get_featured_activity_references()
            ],
        })

    @acl_decorators.can_access_moderator_page
    def post(self):
        """Handles POST requests."""
        featured_activity_reference_dicts = self.payload.get(
            'featured_activity_reference_dicts')
        featured_activity_references = [
            activity_domain.ActivityReference(
                reference_dict['type'], reference_dict['id'])
            for reference_dict in featured_activity_reference_dicts]

        try:
            summary_services.require_activities_to_be_public(
                featured_activity_references)
        except Exception as e:
            raise self.InvalidInputException(e)

        activity_services.update_featured_activity_references(
            featured_activity_references)

        self.render_json({})


class EmailDraftHandler(base.BaseHandler):
    """Provide default email templates for moderator emails."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_send_moderator_emails
    def get(self):
        """Handles GET requests."""
        self.render_json({
            'draft_email_body': (
                email_manager.get_moderator_unpublish_exploration_email()),
        })
