# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the classroom page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_services
from core.domain import config_domain
from core.domain import topic_fetchers
import feconf


class ClassroomPage(base.BaseHandler):
    """Renders the classroom page."""

    @acl_decorators.does_classroom_exist
    def get(self, _):
        """Handles GET requests."""

        if not config_domain.CLASSROOM_PAGE_IS_ACCESSIBLE.value:
            raise self.PageNotFoundException

        self.render_template('classroom-page.mainpage.html')


class ClassroomDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the classroom
    page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.does_classroom_exist
    def get(self, classroom_url_fragment):
        """Handles GET requests."""

        classroom = classroom_services.get_classroom_by_url_fragment(
            classroom_url_fragment)

        topic_ids = classroom.topic_ids
        topic_summaries = topic_fetchers.get_multi_topic_summaries(topic_ids)
        topic_rights = topic_fetchers.get_multi_topic_rights(topic_ids)
        topic_summary_dicts = []
        for index, summary in enumerate(topic_summaries):
            if summary is not None:
                topic_summary_dict = summary.to_dict()
                topic_summary_dict['is_published'] = (
                    topic_rights[index].topic_is_published)
                topic_summary_dicts.append(topic_summary_dict)

        self.values.update({
            'topic_summary_dicts': topic_summary_dicts,
            'topic_list_intro': classroom.topic_list_intro,
            'course_details': classroom.course_details,
            'name': classroom.name
        })
        self.render_json(self.values)


class ClassroomPromosStatusHandler(base.BaseHandler):
    """The handler for checking whether the classroom promos are enabled."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    # This prevents partially logged in user from being logged out
    # during user registration.
    REDIRECT_UNFINISHED_SIGNUPS = False

    @acl_decorators.open_access
    def get(self):
        self.render_json({
            'classroom_promos_are_enabled': (
                config_domain.CLASSROOM_PROMOS_ARE_ENABLED.value)
        })


class DefaultClassroomRedirectPage(base.BaseHandler):
    """Redirects to the default classroom page."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect('/learn/%s' % constants.DEFAULT_CLASSROOM_URL_FRAGMENT)
