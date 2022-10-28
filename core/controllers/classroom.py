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

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_config_domain
from core.domain import classroom_config_services
from core.domain import classroom_services
from core.domain import config_domain
from core.domain import topic_fetchers

SCHEMA_FOR_CLASSROOM_ID = {
    'type': 'basestring',
    'validators': [{
        'id': 'is_regex_matched',
        'regex_pattern': constants.ENTITY_ID_REGEX
    }]
}


class ClassroomDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the classroom
    page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

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
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        self.render_json({
            'classroom_promos_are_enabled': (
                config_domain.CLASSROOM_PROMOS_ARE_ENABLED.value)
        })


class DefaultClassroomRedirectPage(base.BaseHandler):
    """Redirects to the default classroom page."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect('/learn/%s' % constants.DEFAULT_CLASSROOM_URL_FRAGMENT)


class ClassroomAdminPage(base.BaseHandler):
    """Renders the classroom admin page."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_access_admin_page
    def get(self):
        """Handles GET requests."""
        self.render_template('classroom-admin-page.mainpage.html')


class ClassroomAdminDataHandler(base.BaseHandler):
    """Fetches relevant data for the classroom admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_access_admin_page
    def get(self):
        """Handles GET requests."""
        classroom_id_to_classroom_name = (
            classroom_config_services.get_classroom_id_to_classroom_name_dict())

        self.values.update({
            'classroom_id_to_classroom_name': classroom_id_to_classroom_name
        })
        self.render_json(self.values)


class NewClassroomIdHandler(base.BaseHandler):
    """Creates a new classroom ID."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_access_admin_page
    def get(self):
        """Handles GET requests."""
        self.values.update({
            'classroom_id': classroom_config_services.get_new_classroom_id()
        })
        self.render_json(self.values)


class ClassroomHandler(base.BaseHandler):
    """Edits classroom data."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_id': {
            'schema': SCHEMA_FOR_CLASSROOM_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'classroom_dict': {
                'schema': {
                    'type': 'object_dict',
                    'object_class': classroom_config_domain.Classroom
                }
            }
        },
        'DELETE': {}
    }

    @acl_decorators.can_access_admin_page
    def get(self, classroom_id):
        """Handles GET requests."""
        classroom = classroom_config_services.get_classroom_by_id(
            classroom_id, strict=False)
        if classroom is None:
            raise self.PageNotFoundException(
                'The classroom with the given id or url doesn\'t exist.')

        self.values.update({
            'classroom_dict': classroom.to_dict()
        })
        self.render_json(self.values)

    @acl_decorators.can_access_admin_page
    def put(self, classroom_id):
        """Updates properties of a given classroom."""
        classroom = self.normalized_payload.get('classroom_dict')
        if classroom_id != classroom.classroom_id:
            raise self.InvalidInputException(
                'Classroom ID of the URL path argument must match with the ID '
                'given in the classroom payload dict.'
            )

        classroom_config_services.update_or_create_classroom_model(classroom)
        self.render_json(self.values)

    @acl_decorators.can_access_admin_page
    def delete(self, classroom_id):
        """Deletes classroom from the classroom admin page."""
        classroom_config_services.delete_classroom(classroom_id)
        self.render_json(self.values)


class ClassroomUrlFragmentHandler(base.BaseHandler):
    """A data handler for checking if a classroom with given url fragment
    exists.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_access_admin_page
    def get(self, classroom_url_fragment):
        """Get request to check whether a classroom with given exists."""
        classroom_url_fragment_exists = False
        if classroom_config_services.get_classroom_by_url_fragment(
                classroom_url_fragment):
            classroom_url_fragment_exists = True

        self.values.update({
            'classroom_url_fragment_exists': classroom_url_fragment_exists
        })
        self.render_json(self.values)
