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

"""Controllers for the topics editor, from where topics are edited and stories
are created.
"""

from __future__ import annotations

import logging

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_config_services
from core.domain import email_manager
from core.domain import fs_services
from core.domain import image_validation_services
from core.domain import platform_parameter_list
from core.domain import platform_parameter_services
from core.domain import question_services
from core.domain import role_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services

from typing import Dict, List, TypedDict, Union


class TopicEditorStoryHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of TopicEditorStoryHandler's
    normalized_payload dictionary.
    """

    title: str
    description: str
    filename: str
    thumbnailBgColor: str
    story_url_fragment: str


class TopicEditorStoryHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TopicEditorStoryHandler's
    normalized_request dictionary.
    """

    image: bytes


class TopicEditorStoryHandler(
    base.BaseHandler[
        TopicEditorStoryHandlerNormalizedPayloadDict,
        TopicEditorStoryHandlerNormalizedRequestDict
    ]
):
    """Manages the creation of a story and receiving of all story summaries for
    display in topic editor page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'title': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'description': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': (
                            constants.MAX_CHARS_IN_STORY_DESCRIPTION)
                    }]
                }
            },
            'filename': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'thumbnailBgColor': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'image': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'story_url_fragment': constants.SCHEMA_FOR_STORY_URL_FRAGMENTS
        }
    }

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id: str) -> None:
        """Retrieves information about a topic.

        Args:
            topic_id: str. The ID of the topic.
        """
        topic = topic_fetchers.get_topic_by_id(topic_id)
        story_id_to_publication_status_map = {}
        for reference in topic.canonical_story_references:
            story_id_to_publication_status_map[reference.story_id] = (
                reference.story_is_published)
        for reference in topic.additional_story_references:
            story_id_to_publication_status_map[reference.story_id] = (
                reference.story_is_published)
        canonical_story_summaries = story_fetchers.get_story_summaries_by_ids(
            topic.get_canonical_story_ids())
        additional_story_summaries = story_fetchers.get_story_summaries_by_ids(
            topic.get_additional_story_ids())

        canonical_story_summary_dicts = [
            summary.to_dict() for summary in canonical_story_summaries]
        additional_story_summary_dicts = [
            summary.to_dict() for summary in additional_story_summaries]

        canonical_stories_ids = [summary['id'] for
            summary in canonical_story_summary_dicts]
        canonical_stories = list(filter(
            None, story_fetchers.get_stories_by_ids(canonical_stories_ids)))
        canonical_stories_dict: Dict[str, story_domain.Story] = {
            canonical_story.id: canonical_story for canonical_story in
            canonical_stories}
        updated_canonical_story_summary_dicts = []

        for summary in canonical_story_summary_dicts:
            if summary['id'] not in canonical_stories_dict:
                continue
            story = canonical_stories_dict[summary['id']]
            nodes = story.story_contents.nodes
            total_chapters_count = len(nodes)
            published_chapters_count = 0
            upcoming_chapters_count = 0
            overdue_chapters_count = 0
            upcoming_chapters_expected_days = []
            for node in nodes:
                if node.status == constants.STORY_NODE_STATUS_PUBLISHED:
                    published_chapters_count += 1
                if node.planned_publication_date_msecs is not None:
                    current_time_msecs = utils.get_current_time_in_millisecs()
                    planned_publication_date_msecs = (
                        node.planned_publication_date_msecs)
                    if node.is_node_upcoming():
                        upcoming_chapters_count += 1
                        upcoming_chapters_expected_days.append((int)((
                            planned_publication_date_msecs -
                            current_time_msecs) / (1000.0 * 3600 * 24)))
                    if node.is_node_behind_schedule():
                        overdue_chapters_count += 1

            upcoming_chapters_expected_days.sort()
            updated_canonical_story_summary_dict = {
                'id': summary['id'],
                'title': summary['title'],
                'description': summary['description'],
                'language_code': summary['language_code'],
                'version': summary['version'],
                'node_titles': summary['node_titles'],
                'thumbnail_filename': summary['thumbnail_filename'],
                'thumbnail_bg_color': summary['thumbnail_bg_color'],
                'url_fragment': summary['url_fragment'],
                'story_model_created_on': summary['story_model_created_on'],
                'story_model_last_updated': summary['story_model_last_updated'],
                'story_is_published': (
                    story_id_to_publication_status_map[summary['id']]),
                'completed_node_titles': [],
                'all_node_dicts': [node.to_dict() for node in nodes],
                'total_chapters_count': total_chapters_count,
                'published_chapters_count': published_chapters_count,
                'upcoming_chapters_count': upcoming_chapters_count,
                'upcoming_chapters_expected_days': (
                    upcoming_chapters_expected_days),
                'overdue_chapters_count': overdue_chapters_count
            }
            updated_canonical_story_summary_dicts.append(
                updated_canonical_story_summary_dict
            )

        updated_additional_story_summary_dicts = []
        for summary in additional_story_summary_dicts:
            updated_additional_story_summary_dict = {
                'id': summary['id'],
                'title': summary['title'],
                'description': summary['description'],
                'language_code': summary['language_code'],
                'version': summary['version'],
                'node_titles': summary['node_titles'],
                'thumbnail_filename': summary['thumbnail_filename'],
                'thumbnail_bg_color': summary['thumbnail_bg_color'],
                'url_fragment': summary['url_fragment'],
                'story_model_created_on': summary['story_model_created_on'],
                'story_model_last_updated': summary['story_model_last_updated'],
                'story_is_published': (
                    story_id_to_publication_status_map[summary['id']]),
                'completed_node_titles': [],
                'all_node_dicts': []
            }
            updated_additional_story_summary_dicts.append(
                updated_additional_story_summary_dict
            )

        self.values.update({
            'canonical_story_summary_dicts': (
                updated_canonical_story_summary_dicts
            ),
            'additional_story_summary_dicts': (
                updated_additional_story_summary_dicts
            )
        })
        self.render_json(self.values)

    @acl_decorators.can_add_new_story_to_topic
    def post(self, topic_id: str) -> None:
        """Handles POST requests.
        Currently, this only adds the story to the canonical story id list of
        the topic.
        """
        assert self.user_id is not None
        assert self.normalized_request is not None
        assert self.normalized_payload is not None
        title = self.normalized_payload['title']
        description = self.normalized_payload['description']
        thumbnail_filename = self.normalized_payload['filename']
        thumbnail_bg_color = self.normalized_payload['thumbnailBgColor']
        raw_image = self.normalized_request['image']
        story_url_fragment = self.normalized_payload['story_url_fragment']

        story_domain.Story.require_valid_title(title)
        if story_services.does_story_exist_with_url_fragment(
                story_url_fragment):
            raise self.InvalidInputException(
                'Story url fragment is not unique across the site.')

        new_story_id = story_services.get_new_story_id()
        # Add the story id to canonical_story_ids in the topic.
        # Topic validation occurs right before the field is updated. If there
        # is a validation failure, the story id will not be added to the
        # canonical_story_ids field in the Topic and the Story model does not
        # get created. Hence, topic_services.add_canonical_story is called
        # before story_services.save_new_story.
        topic_services.add_canonical_story(self.user_id, topic_id, new_story_id)
        story = story_domain.Story.create_default_story(
            new_story_id, title, description, topic_id, story_url_fragment)
        story_services.save_new_story(self.user_id, story)

        try:
            file_format = (
                image_validation_services.
                validate_image_and_filename(raw_image, thumbnail_filename))
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        entity_id = new_story_id
        filename_prefix = 'thumbnail'

        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            thumbnail_filename, feconf.ENTITY_TYPE_STORY, entity_id, raw_image,
            filename_prefix, image_is_compressible)

        topic_services.update_story_and_topic_summary(
            self.user_id, new_story_id, [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'thumbnail_filename',
                'old_value': None,
                'new_value': thumbnail_filename
            }), story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'thumbnail_bg_color',
                'old_value': None,
                'new_value': thumbnail_bg_color
            }), ], 'Added story thumbnail.', topic_id)

        self.render_json({
            'storyId': new_story_id
        })


class EditableSubtopicPageDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The data handler for subtopic pages."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        },
        'subtopic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id: str, subtopic_id: int) -> None:
        """Retrieves the details of a specific subtopic.

        Args:
            topic_id: str. The ID of the topic.
            subtopic_id: str. The ID of the subtopic.
        """
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic_id, subtopic_id, strict=False)

        if subtopic_page is None:
            raise self.NotFoundException(
                'The subtopic page with the given id doesn\'t exist.')

        self.values.update({
            'subtopic_page': subtopic_page.to_dict()
        })

        self.render_json(self.values)


class EditableTopicDataHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of EditableTopicDataHandler's
    normalized_payload dictionary.
    """

    version: int
    commit_message: str
    topic_and_subtopic_page_change_dicts: List[topic_domain.TopicChange]


class EditableTopicDataHandler(
    base.BaseHandler[
        EditableTopicDataHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """A data handler for topics which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }

    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'version': {
                'schema': {
                    'type': 'int'
                }
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_COMMIT_MESSAGE_LENGTH
                    }]
                }
            },
            'topic_and_subtopic_page_change_dicts': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': topic_domain.TopicChange
                    }
                }
            }
        },
        'DELETE': {}
    }

    def _require_valid_version(
        self, version_from_payload: int, topic_version: int
    ) -> None:
        """Check that the payload version matches the given topic
        version.

        Args:
            version_from_payload: int. The payload version.
            topic_version: int. The topic version.
        """

        if version_from_payload != topic_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (topic_version, version_from_payload))

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id: str) -> None:
        """Populates the data on the individual topic page.

        Args:
            topic_id: str. The ID of the topic.
        """
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.NotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        skill_id_to_description_dict, deleted_skill_ids = (
            skill_services.get_descriptions_of_skills(
                topic.get_all_skill_ids()))

        topics = topic_fetchers.get_all_topics()
        grouped_skill_summary_dicts = {}
        skill_id_to_rubrics_dict = {}

        for topic_object in topics:
            skill_id_to_rubrics_dict_local, deleted_skill_ids = (
                skill_services.get_rubrics_of_skills(
                    topic_object.get_all_skill_ids())
            )

            skill_id_to_rubrics_dict.update(skill_id_to_rubrics_dict_local)

            if deleted_skill_ids:
                deleted_skills_string = ', '.join(deleted_skill_ids)
                logging.exception(
                    'The deleted skills: %s are still present in topic with '
                    'id %s' % (deleted_skills_string, topic_id)
                )
                server_can_send_emails = (
                    platform_parameter_services.get_platform_parameter_value(
                        platform_parameter_list.ParamName
                        .SERVER_CAN_SEND_EMAILS.value
                    )
                )
                if server_can_send_emails:
                    email_manager.send_mail_to_admin(
                        'Deleted skills present in topic',
                        'The deleted skills: %s are still present in '
                        'topic with id %s' % (deleted_skills_string, topic_id))
            skill_summaries = skill_services.get_multi_skill_summaries(
                topic_object.get_all_skill_ids())
            skill_summary_dicts = [
                summary.to_dict() for summary in skill_summaries]
            grouped_skill_summary_dicts[topic_object.name] = skill_summary_dicts

        classroom_url_fragment = (
            classroom_config_services.get_classroom_url_fragment_for_topic_id(
                topic_id))
        classroom_name = (
            classroom_config_services.get_classroom_name_for_topic_id(
                topic_id))
        skill_question_count_dict = {}
        for skill_id in topic.get_all_skill_ids():
            skill_question_count_dict[skill_id] = (
                question_services.get_total_question_count_for_skill_ids(
                    [skill_id]))
        skill_creation_is_allowed = (
            role_services.ACTION_CREATE_NEW_SKILL in self.user.actions)

        curriculum_admin_usernames = (
            user_services.get_usernames_by_role('ADMIN'))

        self.values.update({
            'classroom_url_fragment': (
                None if (
                    classroom_url_fragment
                    ==
                    str(constants.CLASSROOM_URL_FRAGMENT_FOR_UNATTACHED_TOPICS)
                ) else classroom_url_fragment
            ),
            'classroom_name': (
                None if (
                    classroom_name
                    ==
                    str(constants.CLASSROOM_NAME_FOR_UNATTACHED_TOPICS)
                ) else classroom_name
            ),
            'topic_dict': topic.to_dict(),
            'grouped_skill_summary_dicts': grouped_skill_summary_dicts,
            'skill_question_count_dict': skill_question_count_dict,
            'skill_id_to_description_dict': skill_id_to_description_dict,
            'skill_id_to_rubrics_dict': skill_id_to_rubrics_dict,
            'skill_creation_is_allowed': skill_creation_is_allowed,
            'curriculum_admin_usernames': curriculum_admin_usernames
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_topic
    def put(self, topic_id: str) -> None:
        """Updates properties of the given topic.
        Also, each change_dict given for editing should have an additional
        property called is_topic_change, which would be a boolean. If True, it
        means that change is for a topic (includes adding and removing
        subtopics), while False would mean it is for a Subtopic Page (this
        includes editing its html data as of now).

        Args:
            topic_id: str. The ID of the topic.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=True)

        version = self.normalized_payload['version']
        self._require_valid_version(version, topic.version)

        commit_message = self.normalized_payload['commit_message']

        topic_and_subtopic_page_change_dicts = self.normalized_payload[
            'topic_and_subtopic_page_change_dicts']
        topic_and_subtopic_page_change_list: List[
            Union[
                subtopic_page_domain.SubtopicPageChange,
                topic_domain.TopicChange
            ]
        ] = []
        for change in topic_and_subtopic_page_change_dicts:
            if change.cmd == (
                    subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY):
                topic_and_subtopic_page_change_list.append(
                    subtopic_page_domain.SubtopicPageChange(change.to_dict()))
            else:
                topic_and_subtopic_page_change_list.append(change)
        try:
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, topic_id, topic_and_subtopic_page_change_list,
                commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        topic = topic_fetchers.get_topic_by_id(topic_id, strict=True)

        skill_id_to_description_dict, deleted_skill_ids = (
            skill_services.get_descriptions_of_skills(
                topic.get_all_skill_ids()))

        skill_id_to_rubrics_dict, deleted_skill_ids = (
            skill_services.get_rubrics_of_skills(topic.get_all_skill_ids())
        )

        if deleted_skill_ids:
            deleted_skills_string = ', '.join(deleted_skill_ids)
            logging.exception(
                'The deleted skills: %s are still present in topic with id %s'
                % (deleted_skills_string, topic_id)
            )
            server_can_send_emails = (
                platform_parameter_services.get_platform_parameter_value(
                    platform_parameter_list.ParamName
                    .SERVER_CAN_SEND_EMAILS.value
                )
            )
            if server_can_send_emails:
                email_manager.send_mail_to_admin(
                    'Deleted skills present in topic',
                    'The deleted skills: %s are still present in topic with '
                    'id %s' % (deleted_skills_string, topic_id))

        self.values.update({
            'topic_dict': topic.to_dict(),
            'skill_id_to_description_dict': skill_id_to_description_dict,
            'skill_id_to_rubrics_dict': skill_id_to_rubrics_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_topic
    def delete(self, topic_id: str) -> None:
        """Deletes a topic.

        Args:
            topic_id: str. The ID of the topic.

        Raises:
            Exception. If topic is assigned to a classroom.
        """
        assert self.user_id is not None
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.NotFoundException(
                'The topic with the given id doesn\'t exist.')

        classroom_name = (
            classroom_config_services.get_classroom_name_for_topic_id(
                topic_id))

        if classroom_name != str(
            constants.CLASSROOM_NAME_FOR_UNATTACHED_TOPICS):
            raise Exception(
                f'The topic is assigned to the {classroom_name} classroom. '
                f'Contact the curriculum admins to remove it '
                'from the classroom first.')

        topic_services.delete_topic(self.user_id, topic_id)

        self.render_json(self.values)


class TopicRightsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A handler for returning topic rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id: str) -> None:
        """Fetches the topic rights of a topic.

        Args:
            topic_id: str. The ID of the topic.

        Raises:
            InvalidInputException. The topic ID provided is not valid..
        """
        assert self.user_id is not None
        topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=False)
        if topic_rights is None:
            raise self.InvalidInputException(
                'Expected a valid topic id to be provided.')
        user_actions_info = user_services.get_user_actions_info(self.user_id)
        can_edit_topic = topic_services.check_can_edit_topic(
            user_actions_info, topic_rights)

        can_publish_topic = (
            role_services.ACTION_CHANGE_TOPIC_STATUS in
            user_actions_info.actions)

        self.values.update({
            'can_edit_topic': can_edit_topic,
            'published': topic_rights.topic_is_published,
            'can_publish_topic': can_publish_topic
        })

        self.render_json(self.values)


class TopicPublishSendMailHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of TopicPublishSendMailHandler's
    normalized_payload dictionary.
    """

    topic_name: str


class TopicPublishSendMailHandler(
    base.BaseHandler[
        TopicPublishSendMailHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """A handler for sending mail to admins to review and publish topic."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'topic_name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_CHARS_IN_TOPIC_NAME
                    }]
                }
            },
        }
    }

    @acl_decorators.can_view_any_topic_editor
    def put(self, topic_id: str) -> None:
        """Requests a review and publication of a topic.

        Args:
            topic_id: str. The ID of the topic.
        """
        assert self.normalized_payload is not None
        topic_url = '%s/%s' % (feconf.TOPIC_EDITOR_URL_PREFIX, topic_id)
        server_can_send_emails = (
            platform_parameter_services.get_platform_parameter_value(
                platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS.value
            )
        )
        if server_can_send_emails:
            email_manager.send_mail_to_admin(
                'Request to review and publish a topic',
                '%s wants to publish topic: %s at URL %s, please review'
                ' and publish if it looks good.'
                % (
                    self.username,
                    self.normalized_payload['topic_name'],
                    topic_url
                )
            )

        self.render_json(self.values)


class TopicPublishHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of TopicPublishHandler's
    normalized_payload dictionary.
    """

    publish_status: bool


class TopicPublishHandler(
    base.BaseHandler[
        TopicPublishHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """A handler for publishing and unpublishing topics."""

    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'publish_status': {
                'schema': {
                    'type': 'bool'
                }
            }
        }
    }

    @acl_decorators.can_change_topic_publication_status
    def put(self, topic_id: str) -> None:
        """Publishes or unpublishes a topic.

        Args:
            topic_id: str. The ID of the topic.

        Raises:
            NotFoundException. The page cannot be found.
            UnauthorizedUserException. User does not have permission.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.NotFoundException

        publish_status = self.normalized_payload['publish_status']

        classroom_name = (
            classroom_config_services.get_classroom_name_for_topic_id(
                topic_id))

        try:
            if publish_status:
                topic_services.publish_topic(topic_id, self.user_id)
            else:
                if classroom_name != str(
                    constants.CLASSROOM_NAME_FOR_UNATTACHED_TOPICS):
                    raise Exception(
                        f'The topic is assigned to the {classroom_name} '
                        f'classroom. Contact the curriculum admins to '
                        'remove it from the classroom first.')
                topic_services.unpublish_topic(topic_id, self.user_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        self.render_json(self.values)


class TopicUrlFragmentHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A data handler for checking if a topic with given url fragment exists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_create_topic
    def get(self, topic_url_fragment: str) -> None:
        """Handler that receives a topic url fragment and checks whether
        a topic with the same url fragment exists.

        Args:
            topic_url_fragment: str. The topic URL fragment.
        """
        self.values.update({
            'topic_url_fragment_exists': (
                topic_services.does_topic_with_url_fragment_exist(
                    topic_url_fragment))
        })
        self.render_json(self.values)


class TopicNameHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A data handler for checking if a topic with given name exists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_name': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_CHARS_IN_TOPIC_NAME
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_create_topic
    def get(self, topic_name: str) -> None:
        """Handler that receives a topic name and checks whether
        a topic with the same name exists.

        Args:
            topic_name: str. The topic name.
        """
        self.values.update({
            'topic_name_exists': (
                topic_services.does_topic_with_name_exist(topic_name))
        })
        self.render_json(self.values)


def normalize_comma_separated_topic_ids(
    comma_separated_topic_ids: str
) -> List[str]:
    """Normalizes a string of comma-separated topic IDs into a list of
    topic IDs.

    Args:
        comma_separated_topic_ids: str. Comma separated topic IDs.

    Returns:
        list(str). A list of topic IDs.
    """
    if not comma_separated_topic_ids:
        return list([])
    return list(comma_separated_topic_ids.split(','))


class TopicIdToTopicNameHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of TopicIdToTopicNameHandler's
    normalized_request dictionary.
    """

    comma_separated_topic_ids: List[str]


class TopicIdToTopicNameHandler(
    base.BaseHandler[
        Dict[str, str],
        TopicIdToTopicNameHandlerNormalizedRequestDict
    ]
):
    """Handler class to get topic ID to topic name dict."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'comma_separated_topic_ids': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': normalize_comma_separated_topic_ids
                }
            }
        }
    }

    @acl_decorators.can_access_classroom_admin_page
    def get(self) -> None:
        """Accesses a classroom admin page."""
        assert self.normalized_request is not None
        topic_ids = self.normalized_request[
            'comma_separated_topic_ids']
        self.values.update({
            'topic_id_to_topic_name': (
                topic_services.get_topic_id_to_topic_name_dict(topic_ids))
        })
        self.render_json(self.values)
