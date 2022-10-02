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
from core.domain import classroom_services
from core.domain import email_manager
from core.domain import fs_services
from core.domain import image_validation_services
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


class TopicEditorStoryHandler(base.BaseHandler):
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
    def get(self, topic_id):
        """Handles GET requests."""
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

        for summary in canonical_story_summary_dicts:
            summary['story_is_published'] = (
                story_id_to_publication_status_map[summary['id']])
            summary['completed_node_titles'] = []
            summary['all_node_dicts'] = []

        for summary in additional_story_summary_dicts:
            summary['story_is_published'] = (
                story_id_to_publication_status_map[summary['id']])
            summary['completed_node_titles'] = []
            summary['all_node_dicts'] = []

        self.values.update({
            'canonical_story_summary_dicts': canonical_story_summary_dicts,
            'additional_story_summary_dicts': additional_story_summary_dicts
        })
        self.render_json(self.values)

    @acl_decorators.can_add_new_story_to_topic
    def post(self, topic_id):
        """Handles POST requests.
        Currently, this only adds the story to the canonical story id list of
        the topic.
        """
        title = self.normalized_payload.get('title')
        description = self.normalized_payload.get('description')
        thumbnail_filename = self.normalized_payload.get('filename')
        thumbnail_bg_color = self.normalized_payload.get('thumbnailBgColor')
        raw_image = self.normalized_request.get('image')
        story_url_fragment = self.normalized_payload.get('story_url_fragment')

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


class TopicEditorPage(base.BaseHandler):
    """The editor page for a single topic."""

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
        'GET': {}
    }

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id):
        """Handles GET requests."""
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        self.render_template('topic-editor-page.mainpage.html')


class EditableSubtopicPageDataHandler(base.BaseHandler):
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
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id, subtopic_id):
        """Handles GET requests."""
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic_id, subtopic_id, strict=False)

        if subtopic_page is None:
            raise self.PageNotFoundException(
                'The subtopic page with the given id doesn\'t exist.')

        self.values.update({
            'subtopic_page': subtopic_page.to_dict()
        })

        self.render_json(self.values)


class EditableTopicDataHandler(base.BaseHandler):
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

    def _require_valid_version(self, version_from_payload, topic_version):
        """Check that the payload version matches the given topic
        version.
        """

        if version_from_payload != topic_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (topic_version, version_from_payload))

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id):
        """Populates the data on the individual topic page."""
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.PageNotFoundException(
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
                if feconf.CAN_SEND_EMAILS:
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
            classroom_services.get_classroom_url_fragment_for_topic_id(
                topic_id))
        skill_question_count_dict = {}
        for skill_id in topic.get_all_skill_ids():
            skill_question_count_dict[skill_id] = (
                question_services.get_total_question_count_for_skill_ids(
                    [skill_id]))
        skill_creation_is_allowed = (
            role_services.ACTION_CREATE_NEW_SKILL in self.user.actions)

        self.values.update({
            'classroom_url_fragment': classroom_url_fragment,
            'topic_dict': topic.to_dict(),
            'grouped_skill_summary_dicts': grouped_skill_summary_dicts,
            'skill_question_count_dict': skill_question_count_dict,
            'skill_id_to_description_dict': skill_id_to_description_dict,
            'skill_id_to_rubrics_dict': skill_id_to_rubrics_dict,
            'skill_creation_is_allowed': skill_creation_is_allowed
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_topic
    def put(self, topic_id):
        """Updates properties of the given topic.
        Also, each change_dict given for editing should have an additional
        property called is_topic_change, which would be a boolean. If True, it
        means that change is for a topic (includes adding and removing
        subtopics), while False would mean it is for a Subtopic Page (this
        includes editing its html data as of now).
        """
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        version = self.normalized_payload.get('version')
        self._require_valid_version(version, topic.version)

        commit_message = self.normalized_payload.get('commit_message')

        topic_and_subtopic_page_change_dicts = self.normalized_payload.get(
            'topic_and_subtopic_page_change_dicts')
        topic_and_subtopic_page_change_list = []
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

        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

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
            if feconf.CAN_SEND_EMAILS:
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
    def delete(self, topic_id):
        """Handles Delete requests."""
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                'The topic with the given id doesn\'t exist.')
        topic_services.delete_topic(self.user_id, topic_id)

        self.render_json(self.values)


class TopicRightsHandler(base.BaseHandler):
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
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id):
        """Returns the TopicRights object of a topic."""
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


class TopicPublishSendMailHandler(base.BaseHandler):
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
    def put(self, topic_id):
        """Returns the TopicRights object of a topic."""
        topic_url = feconf.TOPIC_EDITOR_URL_PREFIX + '/' + topic_id
        if feconf.CAN_SEND_EMAILS:
            email_manager.send_mail_to_admin(
                'Request to review and publish a topic',
                '%s wants to publish topic: %s at URL %s, please review'
                ' and publish if it looks good.'
                % (
                    self.username,
                    self.normalized_payload.get('topic_name'),
                    topic_url
                )
            )

        self.render_json(self.values)


class TopicPublishHandler(base.BaseHandler):
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
            },
        }
    }

    @acl_decorators.can_change_topic_publication_status
    def put(self, topic_id):
        """Publishes or unpublishes a topic."""
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException

        publish_status = self.normalized_payload.get('publish_status')

        try:
            if publish_status:
                topic_services.publish_topic(topic_id, self.user_id)
            else:
                topic_services.unpublish_topic(topic_id, self.user_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        self.render_json(self.values)


class TopicUrlFragmentHandler(base.BaseHandler):
    """A data handler for checking if a topic with given url fragment exists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_create_topic
    def get(self, topic_url_fragment):
        """Handler that receives a topic url fragment and checks whether
        a topic with the same url fragment exists.
        """
        self.values.update({
            'topic_url_fragment_exists': (
                topic_services.does_topic_with_url_fragment_exist(
                    topic_url_fragment))
        })
        self.render_json(self.values)


class TopicNameHandler(base.BaseHandler):
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
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_create_topic
    def get(self, topic_name):
        """Handler that receives a topic name and checks whether
        a topic with the same name exists.
        """
        self.values.update({
            'topic_name_exists': (
                topic_services.does_topic_with_name_exist(topic_name))
        })
        self.render_json(self.values)


def normalize_comma_separated_topic_ids(comma_separated_topic_ids):
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


class TopicIdToTopicNameHandler(base.BaseHandler):
    """Handler class to get topic ID to topic name dict."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {}
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

    @acl_decorators.can_access_admin_page
    def get(self):
        topic_ids = self.normalized_request.get(
            'comma_separated_topic_ids')
        self.values.update({
            'topic_id_to_topic_name': (
                topic_services.get_topic_id_to_topic_name_dict(topic_ids))
        })
        self.render_json(self.values)
