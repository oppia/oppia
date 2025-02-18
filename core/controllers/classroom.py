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
from core.domain import fs_services
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
        classrooms = classroom_config_services.get_all_classrooms()
        public_classrooms_count = 0

        for c in classrooms:
            if c.url_fragment == classroom_url_fragment:
                classroom = c
            if c.is_published:
                public_classrooms_count += 1
        # Here we are asserting that classroom can never be none, because
        # in the decorator `does_classroom_exist` we are already handling
        # the None case of classroom.
        assert classroom is not None
        topic_ids = classroom.get_topic_ids()
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
                    'published_story_exploration_mapping': (
                        topic_summary_dict[
                            'published_story_exploration_mapping']),
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
            'name': classroom.name,
            'url_fragment': classroom.url_fragment,
            'teaser_text': classroom.teaser_text,
            'is_published': classroom.is_published,
            'is_diagnostic_test_enabled': classroom.is_diagnostic_test_enabled,
            'thumbnail_data': classroom.thumbnail_data.to_dict(),
            'banner_data': classroom.banner_data.to_dict(),
            'public_classrooms_count': public_classrooms_count,
            'classroom_id': classroom.classroom_id
        })
        self.render_json(self.values)


class ClassroomIdIndexMappingDict(TypedDict):
    """Dict for representing the mapping of a classroom's
    ID and name to its index.
    """

    classroom_id: str
    classroom_name: str
    classroom_index: int


class ClassroomDisplayInfoHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Fetches a list of classroom name & index
    corresponding to the given ids."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves a mapping of classroom IDs to classroom name and index."""
        classroom_id_index_mappings: List[ClassroomIdIndexMappingDict] = []
        classrooms = classroom_config_services.get_all_classrooms()

        for classroom in classrooms:
            classroom_id_index_mapping_dict: ClassroomIdIndexMappingDict = {
                'classroom_id': classroom.classroom_id,
                'classroom_name': classroom.name,
                'classroom_index': classroom.index
            }
            classroom_id_index_mappings.append(classroom_id_index_mapping_dict)

        self.values.update({
            'classroom_display_info': sorted(
                classroom_id_index_mappings,
                key=lambda x: int(x['classroom_index'])
            )
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


class ClassroomHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of NewTopicHandler's
    normalized_request dictionary.
    """

    thumbnail_image: bytes
    banner_image: bytes


class ClassroomHandler(
    base.BaseHandler[
        ClassroomHandlerNormalizedPayloadDict,
        ClassroomHandlerNormalizedRequestDict
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
            },
            'thumbnail_image': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'banner_image': {
                'schema': {
                    'type': 'basestring'
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
            NotFoundException. The classroom with the given id or
                url doesn't exist.
        """
        classroom = classroom_config_services.get_classroom_by_id(
            classroom_id, strict=False)
        if classroom is None:
            raise self.NotFoundException(
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
            InvalidInputException. A topic can only be assigned to one
                classroom.
        """
        assert self.normalized_payload is not None
        assert self.normalized_request is not None
        classroom = self.normalized_payload['classroom_dict']

        if classroom_id != classroom.classroom_id:
            raise self.InvalidInputException(
                'Classroom ID of the URL path argument must match with the ID '
                'given in the classroom payload dict.'
            )
        classrooms = classroom_config_services.get_all_classrooms()
        invalid_topic_ids = [
            topic_id for classroom in classrooms
            if classroom.classroom_id != classroom_id
            for topic_id in classroom.get_topic_ids()
        ]

        for topic_id in classroom.get_topic_ids():
            if topic_id in invalid_topic_ids:
                topic_name = topic_fetchers.get_topic_by_id(topic_id).name
                raise self.InvalidInputException(
                    'Topic %s is already assigned to a classroom. A topic '
                    'can only be assigned to one classroom.' % topic_name
                )

        raw_thumbnail_image = self.normalized_request['thumbnail_image']
        thumbnail_filename = classroom.thumbnail_data.filename
        raw_banner_image = self.normalized_request['banner_image']
        banner_filename = classroom.banner_data.filename
        existing_classroom = classroom_config_services.get_classroom_by_id(
            classroom_id)

        if thumbnail_filename != existing_classroom.thumbnail_data.filename:
            fs_services.validate_and_save_image(
                raw_thumbnail_image, thumbnail_filename, 'thumbnail',
                feconf.ENTITY_TYPE_CLASSROOM, classroom_id
            )

        if (
            banner_filename !=
            existing_classroom.banner_data.filename
        ):
            fs_services.validate_and_save_image(
                raw_banner_image, banner_filename, 'image',
                feconf.ENTITY_TYPE_CLASSROOM, classroom_id
            )

        for cls in classrooms:
            if cls.classroom_id == classroom_id:
                classroom.index = cls.index

        classroom_config_services.update_classroom(
            classroom, strict=classroom.is_published
        )
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
            NotFoundException. The classroom with the given url doesn't
                exist.
        """
        classroom = classroom_config_services.get_classroom_by_url_fragment(
            classroom_url_fragment)
        if classroom is None:
            raise self.NotFoundException(
                'The classroom with the given url doesn\'t exist.')

        self.render_json({
            'classroom_id': classroom.classroom_id
        })


class NewClassroomDataHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of NewClassroomHandler's
    normalized_payload dictionary.
    """

    name: str
    url_fragment: str


class NewClassroomHandler(
    base.BaseHandler[
        NewClassroomDataHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Creates a new classroom."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_CHARS_IN_CLASSROOM_NAME
                    }, {
                        'id': 'is_nonempty',
                    }]
                }
            },
            'url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        }
    }

    @acl_decorators.can_access_classroom_admin_page
    def post(self) -> None:
        """Creates a new classroom.

        Raise:
            InvalidInputException. If there are validation errors
                with name or url_fragment.
        """
        assert self.normalized_payload is not None

        name = self.normalized_payload['name']
        url_fragment = self.normalized_payload['url_fragment']

        new_classroom_id = classroom_config_services.get_new_classroom_id()
        classroom_config_services.create_new_default_classroom(
            new_classroom_id, name, url_fragment
        )

        self.render_json({
            'new_classroom_id': new_classroom_id
        })


class TopicsToClassroomsRelationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """return a list of all topics and their
    relation with classrooms.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_classroom_admin_page
    def get(self) -> None:
        topic_dicts = [
            topic.to_dict() for topic in topic_fetchers.get_all_topics()
        ]

        classrooms = classroom_config_services.get_all_classrooms()
        topics_classroom_info_dicts: Dict[
            str, Dict[str, str|None]] = {}

        for topic_dict in topic_dicts:
            topics_classroom_info_dicts[topic_dict['id']] = {
                'topic_id': topic_dict['id'],
                'topic_name': topic_dict['name'],
                'classroom_name': None,
                'classroom_url_fragment': None
            }

        for classroom in classrooms:
            for topic_id in classroom.get_topic_ids():
                topics_classroom_info_dicts[topic_id].update({
                    'classroom_name': classroom.name,
                    'classroom_url_fragment': classroom.url_fragment
                })

        self.render_json({
            'topics_to_classrooms_relation': list(
                topics_classroom_info_dicts.values())
        })


class AllClassroomsSummaryHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """return a list of properties which are needed
        to show a classroom card.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        classrooms = classroom_config_services.get_all_classrooms()
        all_classrooms_summary_dicts: List[Dict[str, str|bool|int]] = []

        for classroom in classrooms:
            classroom_summary_dict: Dict[str, str|bool|int] = {
                'classroom_id': classroom.classroom_id,
                'name': classroom.name,
                'url_fragment': classroom.url_fragment,
                'teaser_text': classroom.teaser_text,
                'is_published': classroom.is_published,
                'is_diagnostic_test_enabled': (
                    classroom.is_diagnostic_test_enabled),
                'thumbnail_filename': classroom.thumbnail_data.filename,
                'thumbnail_bg_color': classroom.banner_data.bg_color,
                'index': 0 if classroom.index is None else classroom.index
            }
            all_classrooms_summary_dicts.append(
                classroom_summary_dict
            )

        self.render_json({
            'all_classrooms_summary': sorted(
                all_classrooms_summary_dicts,
                key=lambda x: int(x['index'])
            )
        })


class UpdateClassroomIndexMappingHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of UpdateClassroomIndexMappingHandler's
    normalized_payload dictionary.
    """

    classroom_index_mappings: List[
        classroom_config_domain.ClassroomIdToIndexDict
    ]


class UpdateClassroomIndexMappingHandler(
    base.BaseHandler[
        UpdateClassroomIndexMappingHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Updates the order of classrooms."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'classroom_index_mappings': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'dict',
                        'properties': [
                            {
                                'name': 'classroom_id',
                                'schema': {
                                    'type': 'basestring',
                                    'validators': [{
                                        'id': 'is_regex_matched',
                                        'regex_pattern': (
                                            constants.ENTITY_ID_REGEX
                                        )
                                    }]
                                }
                            },
                            {
                                'name': 'classroom_name',
                                'schema': {
                                    'type': 'basestring',
                                    'validators': [{
                                        'id': 'is_nonempty'
                                    }]
                                }
                            },
                            {
                                'name': 'classroom_index',
                                'schema': {
                                    'type': 'int',
                                    'validators': [{
                                        'id': 'is_at_least',
                                        'min_value': 0
                                    }]
                                }
                            }
                        ],
                        'required': [
                            'classroom_id', 'classroom_name',
                            'classroom_index'
                        ]
                    }
                }
            }
        }
    }

    @acl_decorators.can_access_classroom_admin_page
    def put(self) -> None:
        """Updates the order of classrooms.

        Raise:
            InvalidInputException: If there are validation errors
                with classroom_order.
        """
        assert self.normalized_payload is not None
        classroom_index_mappings = self.normalized_payload[
            'classroom_index_mappings']

        classroom_config_services.update_classroom_id_to_index_mappings(
            classroom_index_mappings
        )
        self.render_json({})
