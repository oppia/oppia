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
from core.domain import topic_domain
from core.domain import topic_fetchers

from typing import Dict, List, TypedDict


class ClassroomTopicSummaryDict(topic_domain.TopicSummaryDict):
    """Dict representation of classroom topic summary dict."""

    is_published: bool


SCHEMA_FOR_CLASSROOM_ID = {
    'type': 'basestring',
    'validators': [{
        'id': 'is_regex_matched',
        'regex_pattern': constants.ENTITY_ID_REGEX
    }]
}


class ClassroomDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
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
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.does_classroom_exist
    def get(self, classroom_url_fragment: str) -> None:
        """Retrieves information about a classroom.

        Args:
            classroom_url_fragment: str. THe classroom URL fragment.
        """
        classroom = classroom_config_services.get_classroom_by_url_fragment(
            classroom_url_fragment)

        # Here we are asserting that classroom can never be none, because
        # in the decorator `does_classroom_exist` we are already handling
        # the None case of classroom.
        assert classroom is not None
        topic_ids = list(classroom.topic_id_to_prerequisite_topic_ids.keys())
        topic_summaries = topic_fetchers.get_multi_topic_summaries(topic_ids)
        topic_rights = topic_fetchers.get_multi_topic_rights(topic_ids)
        topic_summary_dicts: List[ClassroomTopicSummaryDict] = []
        for index, summary in enumerate(topic_summaries):
            topic_right = topic_rights[index]
            if summary is not None and topic_right is not None:
                topic_summary_dict = summary.to_dict()
                classroom_page_topic_summary_dict: ClassroomTopicSummaryDict = {
                    'id': topic_summary_dict['id'],
                    'name': topic_summary_dict['name'],
                    'url_fragment': topic_summary_dict['url_fragment'],
                    'language_code': topic_summary_dict['language_code'],
                    'description': topic_summary_dict['description'],
                    'version': topic_summary_dict['version'],
                    'canonical_story_count': (
                        topic_summary_dict['canonical_story_count']),
                    'additional_story_count': (
                        topic_summary_dict['additional_story_count']),
                    'uncategorized_skill_count': (
                        topic_summary_dict['uncategorized_skill_count']),
                    'subtopic_count': topic_summary_dict['subtopic_count'],
                    'total_skill_count': (
                        topic_summary_dict['total_skill_count']),
                    'total_published_node_count': (
                        topic_summary_dict['total_published_node_count']),
                    'thumbnail_filename': (
                        topic_summary_dict['thumbnail_filename']),
                    'thumbnail_bg_color': (
                        topic_summary_dict['thumbnail_bg_color']),
                    'topic_model_created_on': (
                        topic_summary_dict['topic_model_created_on']),
                    'topic_model_last_updated': (
                        topic_summary_dict['topic_model_last_updated']),
                    'is_published': topic_right.topic_is_published
                }
                topic_summary_dicts.append(
                    classroom_page_topic_summary_dict
                )

        self.values.update({
            'topic_summary_dicts': topic_summary_dicts,
            'topic_list_intro': classroom.topic_list_intro,
            'course_details': classroom.course_details,
            'name': classroom.name
        })
        self.render_json(self.values)


class DefaultClassroomRedirectPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Redirects to the default classroom page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Redirects to default classroom page."""
        self.redirect('/learn/%s' % constants.DEFAULT_CLASSROOM_URL_FRAGMENT)


class ClassroomIdToNameHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Fetches a list of classroom names corresponding to the given ids."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves a mapping of classroom IDs to classroom names."""
        classroom_id_to_classroom_name = (
            classroom_config_services.get_classroom_id_to_classroom_name_dict())

        self.values.update({
            'classroom_id_to_classroom_name': classroom_id_to_classroom_name
        })
        self.render_json(self.values)


class UnusedTopicsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for fetching topics not associated with any classroom."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_classroom_admin_page
    def get(self) -> None:
        """Retrieves topics not associated with any classroom."""
        all_topics = topic_fetchers.get_all_topics()
        all_classrooms = classroom_config_services.get_all_classrooms()

        topics_not_in_classroom = [
            topic.to_dict() for topic in all_topics
            if not any(
                topic.id in classroom.topic_id_to_prerequisite_topic_ids
                for classroom in all_classrooms
            )
        ]
        self.values.update({
            'unused_topics': topics_not_in_classroom
        })
        self.render_json(self.values)


class NewClassroomIdHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Creates a new classroom ID."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_classroom_admin_page
    def get(self) -> None:
        """Retrieves the new classroom ID."""
        self.values.update({
            'classroom_id': classroom_config_services.get_new_classroom_id()
        })
        self.render_json(self.values)


class ClassroomHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ClassroomHandler's normalized_payload
    dictionary.
    """

    classroom_dict: classroom_config_domain.Classroom


class ClassroomHandler(
    base.BaseHandler[
        ClassroomHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
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

    @acl_decorators.open_access
    def get(self, classroom_id: str) -> None:
        """Retrieves the classroom details.

        Args:
            classroom_id: str. The ID of the classroom.

        Raises:
            PageNotFoundException. The classroom with the given id or
                url doesn't exist.
        """
        classroom = classroom_config_services.get_classroom_by_id(
            classroom_id, strict=False)
        if classroom is None:
            raise self.PageNotFoundException(
                'The classroom with the given id or url doesn\'t exist.')

        self.values.update({
            'classroom_dict': classroom.to_dict()
        })
        self.render_json(self.values)

    @acl_decorators.can_access_classroom_admin_page
    def put(self, classroom_id: str) -> None:
        """Updates properties of a given classroom.

        Args:
            classroom_id: str. The ID of the classroom.

        Raises:
            InvalidInputException. Classroom ID of the URL path argument must
                match with the ID given in the classroom payload dict.
        """
        assert self.normalized_payload is not None
        classroom = self.normalized_payload['classroom_dict']
        if classroom_id != classroom.classroom_id:
            raise self.InvalidInputException(
                'Classroom ID of the URL path argument must match with the ID '
                'given in the classroom payload dict.'
            )

        classroom_config_services.update_or_create_classroom_model(classroom)
        self.render_json(self.values)

    @acl_decorators.can_access_classroom_admin_page
    def delete(self, classroom_id: str) -> None:
        """Deletes classroom from the classroom admin page.

        Args:
            classroom_id: str. The ID of the classroom.
        """
        classroom_config_services.delete_classroom(classroom_id)
        self.render_json(self.values)


class ClassroomUrlFragmentHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A data handler for checking if a classroom with given url fragment
    exists.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_classroom_admin_page
    def get(self, classroom_url_fragment: str) -> None:
        """Checks whether a classroom with given URL fragment exists.

        Args:
            classroom_url_fragment: str. The classroom URL fragment.
        """
        classroom_url_fragment_exists = False
        if classroom_config_services.get_classroom_by_url_fragment(
                classroom_url_fragment):
            classroom_url_fragment_exists = True

        self.values.update({
            'classroom_url_fragment_exists': classroom_url_fragment_exists
        })
        self.render_json(self.values)


class ClassroomIdHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler class to get the classroom ID from the classroom URL fragment."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, classroom_url_fragment: str) -> None:
        """Retrieves the classroom ID.

        Args:
            classroom_url_fragment: str. The classroom URL fragment.

        Raises:
            PageNotFoundException. The classroom with the given url doesn't
                exist.
        """
        classroom = classroom_config_services.get_classroom_by_url_fragment(
            classroom_url_fragment)
        if classroom is None:
            raise self.PageNotFoundException(
                'The classroom with the given url doesn\'t exist.')

        self.render_json({
            'classroom_id': classroom.classroom_id
        })
