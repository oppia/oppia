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

"""Controllers for the topic viewer page."""

from __future__ import annotations

import logging

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_config_services
from core.domain import email_manager
from core.domain import platform_parameter_list
from core.domain import platform_parameter_services
from core.domain import skill_services
from core.domain import story_fetchers
from core.domain import topic_fetchers

from typing import Dict


class TopicPageDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Manages the data that needs to be displayed to a learner on the topic
    viewer page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_topic_viewer_page
    def get(self, topic_name: str) -> None:
        """Accesses a topic viewer page.

        Args:
            topic_name: str. The topic name.
        """

        topic = topic_fetchers.get_topic_by_name(topic_name)
        canonical_story_ids = topic.get_canonical_story_ids(
            include_only_published=True)
        additional_story_ids = topic.get_additional_story_ids(
            include_only_published=True)
        canonical_story_summaries = [
            story_fetchers.get_story_summary_by_id(
                canonical_story_id) for canonical_story_id
            in canonical_story_ids]

        additional_story_summaries = [
            story_fetchers.get_story_summary_by_id(
                additional_story_id) for additional_story_id
            in additional_story_ids]

        canonical_story_dicts = []
        for story_summary in canonical_story_summaries:
            all_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id)['all_nodes']
            filtered_nodes = [node for node in all_nodes if
                node.status != constants.STORY_NODE_STATUS_DRAFT]
            pending_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id)['pending_nodes']
            pending_node_titles = [node.title for node in pending_nodes]
            completed_node_titles = utils.compute_list_difference(
                story_summary.node_titles, pending_node_titles)
            story_summary_dict = story_summary.to_human_readable_dict()
            canonical_story_dict = {
                'id': story_summary_dict['id'],
                'title': story_summary_dict['title'],
                'description': story_summary_dict['description'],
                'node_titles': [node.title for node in filtered_nodes],
                'thumbnail_bg_color': story_summary_dict['thumbnail_bg_color'],
                'thumbnail_filename': story_summary_dict['thumbnail_filename'],
                'url_fragment': story_summary_dict['url_fragment'],
                'story_is_published': True,
                'completed_node_titles': completed_node_titles,
                'all_node_dicts': [node.to_dict() for node in filtered_nodes]
            }
            canonical_story_dicts.append(canonical_story_dict)

        additional_story_dicts = []
        for story_summary in additional_story_summaries:
            all_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id)['all_nodes']
            pending_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id)['pending_nodes']
            pending_node_titles = [node.title for node in pending_nodes]
            completed_node_titles = utils.compute_list_difference(
                story_summary.node_titles, pending_node_titles)
            story_summary_dict = story_summary.to_human_readable_dict()
            additional_story_dict = {
                'id': story_summary_dict['id'],
                'title': story_summary_dict['title'],
                'description': story_summary_dict['description'],
                'node_titles': story_summary_dict['node_titles'],
                'thumbnail_bg_color': story_summary_dict['thumbnail_bg_color'],
                'thumbnail_filename': story_summary_dict['thumbnail_filename'],
                'url_fragment': story_summary_dict['url_fragment'],
                'story_is_published': True,
                'completed_node_titles': completed_node_titles,
                'all_node_dicts': [node.to_dict() for node in all_nodes]
            }
            additional_story_dicts.append(additional_story_dict)

        uncategorized_skill_ids = topic.get_all_uncategorized_skill_ids()
        subtopics = topic.get_all_subtopics()

        all_skill_ids = topic.get_all_skill_ids()
        skill_descriptions, deleted_skill_ids = (
            skill_services.get_descriptions_of_skills(
                all_skill_ids))

        if deleted_skill_ids:
            deleted_skills_string = ', '.join(deleted_skill_ids)
            logging.exception(
                'The deleted skills: %s are still present in topic with id %s'
                % (deleted_skills_string, topic.id)
            )
            server_can_send_emails = (
                platform_parameter_services.get_platform_parameter_value(
                    platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS
                    .value
                )
            )
            if server_can_send_emails:
                email_manager.send_mail_to_admin(
                    'Deleted skills present in topic',
                    'The deleted skills: %s are still present in topic with '
                    'id %s' % (deleted_skills_string, topic.id))

        if self.user_id:
            degrees_of_mastery = skill_services.get_multi_user_skill_mastery(
                self.user_id, all_skill_ids)
        else:
            degrees_of_mastery = {}
            for skill_id in all_skill_ids:
                degrees_of_mastery[skill_id] = None

        classroom_name = (
            classroom_config_services.get_classroom_name_for_topic_id(
                topic.id))

        self.values.update({
            'topic_id': topic.id,
            'topic_name': topic.name,
            'topic_description': topic.description,
            'canonical_story_dicts': canonical_story_dicts,
            'additional_story_dicts': additional_story_dicts,
            'uncategorized_skill_ids': uncategorized_skill_ids,
            'subtopics': subtopics,
            'degrees_of_mastery': degrees_of_mastery,
            'skill_descriptions': skill_descriptions,
            'practice_tab_is_displayed': topic.practice_tab_is_displayed,
            'meta_tag_content': topic.meta_tag_content,
            'page_title_fragment_for_web': topic.page_title_fragment_for_web,
            'classroom_name': (
                None if (
                    classroom_name
                    ==
                    str(constants.CLASSROOM_NAME_FOR_UNATTACHED_TOPICS)
                ) else classroom_name
            )
        })
        self.render_json(self.values)
