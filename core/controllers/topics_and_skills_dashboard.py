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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.controllers import acl_decorators
from core.controllers import base
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
import feconf
import python_utils
import utils


class TopicsAndSkillsDashboardPage(base.BaseHandler):
    """Page showing the topics and skills dashboard."""

    @acl_decorators.can_access_topics_and_skills_dashboard
    def get(self):
        self.render_template(
            'topics-and-skills-dashboard-page.mainpage.html')


class TopicsAndSkillsDashboardPageDataHandler(base.BaseHandler):
    """Provides data for the user's topics and skills dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

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

        untriaged_skill_summary_dicts = []
        mergeable_skill_summary_dicts = []
        categorized_skills_dict = {}
        topics = topic_fetchers.get_all_topics()
        for topic in topics:
            subtopics = topic.subtopics
            categorized_skills_dict[topic.name] = {}
            uncategorized_skills = (
                skill_services.get_descriptions_of_skills(
                    topic.uncategorized_skill_ids)[0])
            skills_list = []
            for skill_id in topic.uncategorized_skill_ids:
                skill_dict = {
                    'skill_id': skill_id,
                    'skill_description': uncategorized_skills[skill_id]
                }
                skills_list.append(skill_dict)
            categorized_skills_dict[topic.name]['uncategorized'] = (
                skills_list)
            for subtopic in subtopics:
                skills = (skill_services.get_descriptions_of_skills(
                    subtopic.skill_ids))[0]
                skills_list = []
                for skill_id in subtopic.skill_ids:
                    skill_dict = {
                        'skill_id': skill_id,
                        'skill_description': skills[skill_id]
                    }
                    skills_list.append(skill_dict)
                categorized_skills_dict[topic.name][
                    subtopic.title] = skills_list

        for skill_summary_dict in skill_summary_dicts:
            skill_id = skill_summary_dict['id']
            if (skill_id not in skill_ids_assigned_to_some_topic) and (
                    skill_id not in merged_skill_ids):
                untriaged_skill_summary_dicts.append(skill_summary_dict)
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
            'untriaged_skill_summary_dicts': untriaged_skill_summary_dicts,
            'mergeable_skill_summary_dicts': mergeable_skill_summary_dicts,
            'topic_summary_dicts': topic_summary_dicts,
            'total_skill_count': len(skill_summary_dicts),
            'all_classroom_names': all_classroom_names,
            'can_delete_topic': can_delete_topic,
            'can_create_topic': can_create_topic,
            'can_delete_skill': can_delete_skill,
            'can_create_skill': can_create_skill,
            'categorized_skills_dict': categorized_skills_dict
        })
        self.render_json(self.values)


class TopicAssignmentsHandler(base.BaseHandler):
    """Provides information about which topics contain the given skill."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

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

    @acl_decorators.can_access_topics_and_skills_dashboard
    def post(self):
        """Handles POST requests."""

        classroom_name = self.payload.get('classroom_name')
        urlsafe_start_cursor = self.payload.get('next_cursor', None)
        keywords = self.payload.get('keywords')
        num_skills_to_fetch = self.payload.get('num_skills_to_fetch')
        sort_by = self.payload.get('sort')
        status = self.payload.get('status')

        if (classroom_name is not None and
                not isinstance(classroom_name, python_utils.BASESTRING)):
            raise self.InvalidInputException(
                'Classroom name should be a string.')

        if (urlsafe_start_cursor is not None and
                not isinstance(urlsafe_start_cursor, python_utils.BASESTRING)):
            raise self.InvalidInputException(
                'Next Cursor should be a string.')

        if (num_skills_to_fetch is None or
                not isinstance(num_skills_to_fetch, int)):
            raise self.InvalidInputException(
                'Number of skills to fetch should be a number.')

        if (keywords is not None and (not isinstance(keywords, list) or (
                not all(
                    [isinstance(keyword, python_utils.BASESTRING)
                     for keyword in keywords])))):
            raise self.InvalidInputException(
                'Keywords should be a list of strings.')

        if (sort_by is not None and
                not isinstance(sort_by, python_utils.BASESTRING)):
            raise self.InvalidInputException(
                'The value of sort_by should be a string.')

        if (status is not None and
                not isinstance(status, python_utils.BASESTRING)):
            raise self.InvalidInputException(
                'Status should be a string.')

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

        try:
            topic_domain.Topic.require_valid_name(name)
        except:
            raise self.InvalidInputException(
                'Invalid topic name, received %s.' % name)
        new_topic_id = topic_fetchers.get_new_topic_id()
        topic = topic_domain.Topic.create_default_topic(
            new_topic_id, name, url_fragment, description)
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

    @acl_decorators.can_create_skill
    def post(self):
        description = self.payload.get('description')
        linked_topic_ids = self.payload.get('linked_topic_ids')
        explanation_dict = self.payload.get('explanation_dict')
        rubrics = self.payload.get('rubrics')

        if not isinstance(rubrics, list):
            raise self.InvalidInputException('Rubrics should be a list.')

        if not isinstance(explanation_dict, dict):
            raise self.InvalidInputException(
                'Explanation should be a dict.')

        try:
            subtitled_html = (
                state_domain.SubtitledHtml.from_dict(explanation_dict))
            subtitled_html.validate()
        except:
            raise self.InvalidInputException(
                'Explanation should be a valid SubtitledHtml dict.')

        rubrics = [skill_domain.Rubric.from_dict(rubric) for rubric in rubrics]
        new_skill_id = skill_services.get_new_skill_id()
        if linked_topic_ids is not None:
            topics = topic_fetchers.get_topics_by_ids(linked_topic_ids)
            for topic in topics:
                if topic is None:
                    raise self.InvalidInputException
                topic_services.add_uncategorized_skill(
                    self.user_id, topic.id, new_skill_id)

        skill_domain.Skill.require_valid_description(description)

        if skill_services.does_skill_with_description_exist(description):
            raise self.InvalidInputException(
                'Skill description should not be a duplicate.')

        skill = skill_domain.Skill.create_default_skill(
            new_skill_id, description, rubrics)

        skill.update_explanation(
            state_domain.SubtitledHtml.from_dict(explanation_dict))

        image_filenames = skill_services.get_image_filenames_from_skill(skill)

        skill_services.save_new_skill(self.user_id, skill)

        image_validation_error_message_suffix = (
            'Please go to oppia.org/skill_editor/%s to edit '
            'the image.' % skill.id)
        for filename in image_filenames:
            image = self.request.get(filename)
            if not image:
                logging.exception(
                    'Image not provided for file with name %s when the skill '
                    'with id %s was created.' % (filename, skill.id))
                raise self.InvalidInputException(
                    'No image data provided for file with name %s. %s'
                    % (filename, image_validation_error_message_suffix))
            try:
                file_format = (
                    image_validation_services.validate_image_and_filename(
                        image, filename))
            except utils.ValidationError as e:
                e = '%s %s' % (e, image_validation_error_message_suffix)
                raise self.InvalidInputException(e)
            image_is_compressible = (
                file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
            fs_services.save_original_and_compressed_versions_of_image(
                filename, feconf.ENTITY_TYPE_SKILL, skill.id, image,
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
