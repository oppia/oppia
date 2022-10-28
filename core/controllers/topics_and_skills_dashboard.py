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

"""Controllers for the topics and skills dashboard, from where topics and skills
are created.
"""

from __future__ import annotations

import base64

from core import android_validation_constants
from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator
from core.domain import config_domain
from core.domain import fs_services
from core.domain import image_validation_services
from core.domain import question_services
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.domain import state_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services


class TopicsAndSkillsDashboardPage(base.BaseHandler):
    """Page showing the topics and skills dashboard."""

    @acl_decorators.can_access_topics_and_skills_dashboard
    def get(self):
        self.render_template(
            'topics-and-skills-dashboard-page.mainpage.html')


class TopicsAndSkillsDashboardPageDataHandler(base.BaseHandler):
    """Provides data for the user's topics and skills dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_access_topics_and_skills_dashboard
    def get(self):
        """Handles GET requests."""

        topic_summaries = topic_fetchers.get_all_topic_summaries()
        topic_summary_dicts = [
            summary.to_dict() for summary in topic_summaries]

        skill_summaries = skill_services.get_all_skill_summaries()
        skill_summary_dicts = [
            summary.to_dict() for summary in skill_summaries]

        skill_ids_assigned_to_some_topic = (
            topic_fetchers.get_all_skill_ids_assigned_to_some_topic())
        merged_skill_ids = (
            skill_services.get_merged_skill_ids())
        topic_rights_dict = topic_fetchers.get_all_topic_rights()
        for topic_summary in topic_summary_dicts:
            if topic_rights_dict[topic_summary['id']]:
                topic_rights = topic_rights_dict[topic_summary['id']]
                if topic_rights:
                    topic_summary['is_published'] = (
                        topic_rights.topic_is_published)
                    topic_summary['can_edit_topic'] = (
                        topic_services.check_can_edit_topic(
                            self.user, topic_rights)
                    )

        all_classrooms_dict = config_domain.CLASSROOM_PAGES_DATA.value
        all_classroom_names = [
            classroom['name'] for classroom in all_classrooms_dict]

        topic_classroom_dict = {}
        for classroom in all_classrooms_dict:
            for topic_id in classroom['topic_ids']:
                topic_classroom_dict[topic_id] = classroom['name']

        for topic_summary_dict in topic_summary_dicts:
            topic_summary_dict['classroom'] = topic_classroom_dict.get(
                topic_summary_dict['id'], None)

        mergeable_skill_summary_dicts = []

        untriaged_skill_summaries = (
            skill_services.get_untriaged_skill_summaries(
                skill_summaries, skill_ids_assigned_to_some_topic,
                merged_skill_ids))

        categorized_skills = (
            skill_services.get_categorized_skill_ids_and_descriptions())

        for skill_summary_dict in skill_summary_dicts:
            skill_id = skill_summary_dict['id']
            if (skill_id in skill_ids_assigned_to_some_topic) and (
                    skill_id not in merged_skill_ids):
                mergeable_skill_summary_dicts.append(skill_summary_dict)

        can_delete_topic = (
            role_services.ACTION_DELETE_TOPIC in self.user.actions)

        can_create_topic = (
            role_services.ACTION_CREATE_NEW_TOPIC in self.user.actions)

        can_delete_skill = (
            role_services.ACTION_DELETE_ANY_SKILL in self.user.actions)

        can_create_skill = (
            role_services.ACTION_CREATE_NEW_SKILL in self.user.actions)

        self.values.update({
            'untriaged_skill_summary_dicts': [
                skill_summary.to_dict()
                for skill_summary in untriaged_skill_summaries
            ],
            'mergeable_skill_summary_dicts': mergeable_skill_summary_dicts,
            'topic_summary_dicts': topic_summary_dicts,
            'total_skill_count': len(skill_summary_dicts),
            'all_classroom_names': all_classroom_names,
            'can_delete_topic': can_delete_topic,
            'can_create_topic': can_create_topic,
            'can_delete_skill': can_delete_skill,
            'can_create_skill': can_create_skill,
            'categorized_skills_dict': categorized_skills.to_dict()
        })
        self.render_json(self.values)


class CategorizedAndUntriagedSkillsDataHandler(base.BaseHandler):
    """Provides information about categorized skills and untriaged skill
    summaries for the exploration editor page's skill editor component."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        skill_summaries = skill_services.get_all_skill_summaries()
        skill_ids_assigned_to_some_topic = (
            topic_fetchers.get_all_skill_ids_assigned_to_some_topic())
        merged_skill_ids = skill_services.get_merged_skill_ids()

        untriaged_skill_summaries = (
            skill_services.get_untriaged_skill_summaries(
                skill_summaries, skill_ids_assigned_to_some_topic,
                merged_skill_ids))
        untriaged_short_skill_summaries = [
            skill_domain.ShortSkillSummary.from_skill_summary(skill_summary)
            for skill_summary in untriaged_skill_summaries]

        categorized_skills = (
            skill_services.get_categorized_skill_ids_and_descriptions())

        self.values.update({
            'untriaged_skill_summary_dicts': [
                short_skill_summary.to_dict()
                for short_skill_summary in untriaged_short_skill_summaries
            ],
            'categorized_skills_dict': categorized_skills.to_dict()
        })
        self.render_json(self.values)


class TopicAssignmentsHandler(base.BaseHandler):
    """Provides information about which topics contain the given skill."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'skill_id': {
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

    @acl_decorators.can_access_topics_and_skills_dashboard
    def get(self, skill_id):
        """Handles GET requests."""
        topic_assignments = skill_services.get_all_topic_assignments_for_skill(
            skill_id)
        topic_assignment_dicts = [
            topic_assignment.to_dict()
            for topic_assignment in topic_assignments]

        self.render_json({
            'topic_assignment_dicts': topic_assignment_dicts
        })


class SkillsDashboardPageDataHandler(base.BaseHandler):
    """Provides data for the user's skills dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'classroom_name': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'next_cursor': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'keywords': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'basestring'
                    }
                }
            },
            'num_skills_to_fetch': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 1
                    }]
                }
            },
            'sort': {
                'schema': {
                    'type': 'basestring'
                },
                'choices': constants.TOPIC_SKILL_DASHBOARD_SORT_OPTIONS
            },
            'status': {
                'schema': {
                    'type': 'basestring'
                },
                'choices': constants.SKILL_STATUS_OPTIONS
            }
        }
    }

    @acl_decorators.can_access_topics_and_skills_dashboard
    def post(self):
        """Handles POST requests."""

        classroom_name = self.normalized_payload.get('classroom_name')
        urlsafe_start_cursor = self.normalized_payload.get('next_cursor')
        keywords = self.normalized_payload.get('keywords')
        num_skills_to_fetch = self.normalized_payload.get('num_skills_to_fetch')
        sort_by = self.normalized_payload.get('sort')
        status = self.normalized_payload.get('status')

        skill_summaries, next_cursor, more = (
            skill_services.get_filtered_skill_summaries(
                num_skills_to_fetch, status, classroom_name,
                keywords, sort_by, urlsafe_start_cursor))

        skill_summary_dicts = [summary.to_dict() for summary in skill_summaries]

        self.render_json({
            'skill_summary_dicts': skill_summary_dicts,
            'next_cursor': next_cursor,
            'more': more,
        })


class NewTopicHandler(base.BaseHandler):
    """Creates a new topic."""

    @acl_decorators.can_create_topic
    def post(self):
        """Handles POST requests."""
        name = self.payload.get('name')
        url_fragment = self.payload.get('url_fragment')
        description = self.payload.get('description')
        thumbnail_filename = self.payload.get('filename')
        thumbnail_bg_color = self.payload.get('thumbnailBgColor')
        raw_image = self.request.get('image')
        page_title_frag = self.payload.get('page_title_fragment')

        try:
            topic_domain.Topic.require_valid_name(name)
        except Exception as e:
            raise self.InvalidInputException(
                'Invalid topic name, received %s.' % name) from e
        new_topic_id = topic_fetchers.get_new_topic_id()
        topic = topic_domain.Topic.create_default_topic(
            new_topic_id, name, url_fragment, description, page_title_frag)
        topic_services.save_new_topic(self.user_id, topic)

        try:
            file_format = image_validation_services.validate_image_and_filename(
                raw_image, thumbnail_filename)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        entity_id = new_topic_id
        filename_prefix = 'thumbnail'

        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            thumbnail_filename, feconf.ENTITY_TYPE_TOPIC, entity_id, raw_image,
            filename_prefix, image_is_compressible)

        topic_services.update_topic_and_subtopic_pages(
            self.user_id, new_topic_id, [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'thumbnail_filename',
                'old_value': None,
                'new_value': thumbnail_filename
            }), topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'thumbnail_bg_color',
                'old_value': None,
                'new_value': thumbnail_bg_color
            }), ], 'Add topic thumbnail.')

        self.render_json({
            'topicId': new_topic_id
        })


class NewSkillHandler(base.BaseHandler):
    """Creates a new skill."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'description': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': android_validation_constants
                            .MAX_CHARS_IN_SKILL_DESCRIPTION
                    }]
                }
            },
            'linked_topic_ids': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'basestring',
                        'validators': [{
                            'id': 'is_regex_matched',
                            'regex_pattern': constants.ENTITY_ID_REGEX
                        }]
                    }
                }
            },
            'explanation_dict': {
                'schema': {
                    'type': 'object_dict',
                    'object_class': state_domain.SubtitledHtml
                }
            },
            'rubrics': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': skill_domain.Rubric
                    }
                }
            },
            'files': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        domain_objects_validator.
                            validate_suggestion_images
                    )
                }
            }
        }
    }

    @acl_decorators.can_create_skill
    def post(self):
        description = self.normalized_payload.get('description')
        linked_topic_ids = self.normalized_payload.get('linked_topic_ids')
        explanation_dict = self.normalized_payload.get('explanation_dict')
        rubrics = self.normalized_payload.get('rubrics')
        files = self.normalized_payload.get('files')

        new_skill_id = skill_services.get_new_skill_id()
        if linked_topic_ids is not None:
            topics = topic_fetchers.get_topics_by_ids(linked_topic_ids)
            for topic in topics:
                if topic is None:
                    raise self.InvalidInputException
                topic_services.add_uncategorized_skill(
                    self.user_id, topic.id, new_skill_id)

        if skill_services.does_skill_with_description_exist(description):
            raise self.InvalidInputException(
                'Skill description should not be a duplicate.')

        skill = skill_domain.Skill.create_default_skill(
            new_skill_id, description, rubrics)

        skill.update_explanation(explanation_dict)

        image_filenames = skill_services.get_image_filenames_from_skill(skill)

        skill_services.save_new_skill(self.user_id, skill)

        for filename in image_filenames:
            base64_image = files.get(filename)
            bytes_image = base64.decodebytes(base64_image.encode('utf-8'))
            file_format = (
                image_validation_services.validate_image_and_filename(
                    bytes_image, filename))
            image_is_compressible = (
                file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
            fs_services.save_original_and_compressed_versions_of_image(
                filename, feconf.ENTITY_TYPE_SKILL, skill.id, bytes_image,
                'image', image_is_compressible)

        self.render_json({
            'skillId': new_skill_id
        })


class MergeSkillHandler(base.BaseHandler):
    """Handles merging of the skills."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_topics_and_skills_dashboard
    def post(self):
        """Handles the POST request."""
        old_skill_id = self.payload.get('old_skill_id')
        new_skill_id = self.payload.get('new_skill_id')
        new_skill = skill_fetchers.get_skill_by_id(new_skill_id, strict=False)
        if new_skill is None:
            raise self.PageNotFoundException(
                Exception('The new skill with the given id doesn\'t exist.'))
        old_skill = skill_fetchers.get_skill_by_id(old_skill_id, strict=False)
        if old_skill is None:
            raise self.PageNotFoundException(
                Exception('The old skill with the given id doesn\'t exist.'))

        skill_services.replace_skill_id_in_all_topics(
            self.user_id, old_skill_id, new_skill_id)
        question_services.replace_skill_id_for_all_questions(
            old_skill_id, old_skill.description, new_skill_id)
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'old_value': old_skill.superseding_skill_id,
                'new_value': new_skill_id
            })
        ]
        skill_services.update_skill(
            self.user_id, old_skill_id, changelist,
            'Marking the skill as having being merged successfully.')
        skill_services.delete_skill(self.user_id, old_skill_id)
        self.render_json({
            'merged_into_skill': new_skill_id
        })


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


class TopicIdToDiagnosticTestSkillIdsHandler(base.BaseHandler):
    """Handler class to get topic ID to diagnostic test skill IDs dict."""

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

    @acl_decorators.open_access
    def get(self):
        topic_ids = self.normalized_request.get(
            'comma_separated_topic_ids')
        self.values.update({
            'topic_id_to_diagnostic_test_skill_ids': (
                topic_services.get_topic_id_to_diagnostic_test_skill_ids(
                    topic_ids))
        })
        self.render_json(self.values)
