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

from core import feature_flag_list, feconf, utils
from core.constants import constants
from core.controllers import acl_decorators, base
from core.domain import (
    classroom_config_services,
    email_manager,
    exp_fetchers,
    feature_flag_services,
    skill_services,
    story_domain,
    story_fetchers,
    topic_fetchers,
    topic_services,
    translation_services,
    voiceover_services,
)

from typing import Dict, List, Optional, Sequence, TypedDict, cast


class StoryNodeResponseDict(story_domain.StoryNodeDict):
    """TypedDict for the StoryNode dict enriched with voiceover metadata."""

    available_text_language_codes: List[str]
    available_voiceover_language_codes: List[str]
    available_voiceover_language_accent_descriptions: Dict[str, str]


class StoryResponseDict(TypedDict, total=False):
    """TypedDict for the canonical/additional story data in the API response."""

    id: str
    title: str
    description: str
    node_titles: List[str]
    thumbnail_bg_color: Optional[str]
    thumbnail_filename: Optional[str]
    url_fragment: str
    story_is_published: bool
    completed_node_titles: List[str]
    all_node_dicts: List[StoryNodeResponseDict]
    arcs: List[story_domain.ArcDict]


class TopicPageDataHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Manages the data that needs to be displayed to a learner on the topic
    viewer page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_topic_viewer_page
    def get(self, topic_name: str) -> None:
        """Accesses a topic viewer page.

        Args:
            topic_name: str. The topic name.
        """

        topic = topic_fetchers.get_topic_by_name(topic_name)

        def _get_language_root_code(language_code: str) -> str:
            return language_code.replace('_', '-').split('-')[0].lower()

        canonical_story_ids = topic.get_canonical_story_ids(
            include_only_published=True
        )
        additional_story_ids = topic.get_additional_story_ids(
            include_only_published=True
        )
        canonical_story_summaries = [
            story_fetchers.get_story_summary_by_id(canonical_story_id)
            for canonical_story_id in canonical_story_ids
        ]

        additional_story_summaries = [
            story_fetchers.get_story_summary_by_id(additional_story_id)
            for additional_story_id in additional_story_ids
        ]

        are_story_arcs_enabled = feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.STORY_EDITOR_ARCS.value,
            None,
        )

        canonical_story_dicts: List[StoryResponseDict] = []
        canonical_story_nodes: List[Sequence[story_domain.StoryNode]] = []
        exploration_ids: set[str] = set()

        def _collect_exploration_ids_from_nodes(
            nodes: Sequence[story_domain.StoryNode],
        ) -> None:
            for node in nodes:
                if node.exploration_id:  # pragma: no cover
                    exploration_ids.add(node.exploration_id)

        for story_summary in canonical_story_summaries:
            all_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id
            )['all_nodes']
            filtered_nodes = [
                node
                for node in all_nodes
                if node.status != constants.STORY_NODE_STATUS_DRAFT
            ]
            _collect_exploration_ids_from_nodes(filtered_nodes)
            pending_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id
            )['pending_nodes']
            pending_node_titles = [node.title for node in pending_nodes]
            completed_node_titles = utils.compute_list_difference(
                story_summary.node_titles, pending_node_titles
            )
            story_summary_dict = story_summary.to_human_readable_dict()
            canonical_story_dict: StoryResponseDict = {
                'id': story_summary_dict['id'],
                'title': story_summary_dict['title'],
                'description': story_summary_dict['description'],
                'node_titles': [node.title for node in filtered_nodes],
                'thumbnail_bg_color': story_summary_dict['thumbnail_bg_color'],
                'thumbnail_filename': story_summary_dict['thumbnail_filename'],
                'url_fragment': story_summary_dict['url_fragment'],
                'story_is_published': True,
                'completed_node_titles': completed_node_titles,
                'all_node_dicts': [],
            }
            if are_story_arcs_enabled:
                story = story_fetchers.get_story_by_id(story_summary.id)
                canonical_story_dict['arcs'] = [
                    arc.to_dict() for arc in story.story_contents.arcs
                ]
            canonical_story_dicts.append(canonical_story_dict)
            canonical_story_nodes.append(filtered_nodes)

        additional_story_dicts: List[StoryResponseDict] = []
        additional_story_nodes: List[Sequence[story_domain.StoryNode]] = []
        for story_summary in additional_story_summaries:
            all_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id
            )['all_nodes']
            _collect_exploration_ids_from_nodes(all_nodes)
            pending_nodes = story_fetchers.get_pending_and_all_nodes_in_story(
                self.user_id, story_summary.id
            )['pending_nodes']
            pending_node_titles = [node.title for node in pending_nodes]
            completed_node_titles = utils.compute_list_difference(
                story_summary.node_titles, pending_node_titles
            )
            additional_story_nodes.append(all_nodes)
            story_summary_dict = story_summary.to_human_readable_dict()
            additional_story_dict: StoryResponseDict = {
                'id': story_summary_dict['id'],
                'title': story_summary_dict['title'],
                'description': story_summary_dict['description'],
                'node_titles': story_summary_dict['node_titles'],
                'thumbnail_bg_color': story_summary_dict['thumbnail_bg_color'],
                'thumbnail_filename': story_summary_dict['thumbnail_filename'],
                'url_fragment': story_summary_dict['url_fragment'],
                'story_is_published': True,
                'completed_node_titles': completed_node_titles,
                'all_node_dicts': [],
            }
            if are_story_arcs_enabled:
                story = story_fetchers.get_story_by_id(story_summary.id)
                additional_story_dict['arcs'] = [
                    arc.to_dict() for arc in story.story_contents.arcs
                ]
            additional_story_dicts.append(additional_story_dict)

        exploration_id_to_available_text_languages: Dict[str, List[str]] = {}
        exploration_id_to_available_voiceover_languages: Dict[
            str, List[str]
        ] = {}

        if exploration_ids:
            explorations_by_id = exp_fetchers.get_multiple_explorations_by_id(
                list(exploration_ids), strict=False
            )

            language_accent_mapping = (
                voiceover_services.get_all_language_accent_codes_for_voiceovers()
            )

            for exploration_id, exploration in explorations_by_id.items():
                displayable_language_codes = (
                    translation_services.get_displayable_translation_languages(
                        feconf.TranslatableEntityType.EXPLORATION,
                        exploration,
                    )
                )

                if (
                    exploration.language_code
                    and exploration.language_code
                    not in displayable_language_codes
                ):
                    displayable_language_codes.insert(
                        0, exploration.language_code
                    )

                unique_displayable_language_codes = list(
                    dict.fromkeys(displayable_language_codes)
                )

                exploration_id_to_available_text_languages[exploration_id] = (
                    unique_displayable_language_codes
                )
                displayable_language_roots = {
                    _get_language_root_code(language_code)
                    for language_code in unique_displayable_language_codes
                }

                voiceover_language_codes = []
                entity_voiceovers_for_exp = voiceover_services.get_entity_voiceovers_for_given_exploration(
                    exploration_id,
                    feconf.TranslatableEntityType.EXPLORATION.value,
                    exploration.version,
                )

                for entity_voiceovers in entity_voiceovers_for_exp:
                    if not entity_voiceovers.voiceovers_mapping:
                        continue

                    accent_code = entity_voiceovers.language_accent_code
                    accent_root_code = _get_language_root_code(accent_code)

                    if accent_root_code in displayable_language_roots:
                        voiceover_language_codes.append(accent_code)
                        continue

                    for language_code in unique_displayable_language_codes:
                        if accent_code in language_accent_mapping.get(
                            language_code, {}
                        ):
                            voiceover_language_codes.append(accent_code)
                            break

                voiceover_language_codes = list(
                    dict.fromkeys(voiceover_language_codes)
                )

                exploration_id_to_available_voiceover_languages[
                    exploration_id
                ] = voiceover_language_codes

        language_accent_codes_to_descriptions = (
            voiceover_services.get_language_accent_codes_to_descriptions()
        )

        def _create_node_dict(
            node: story_domain.StoryNode,
        ) -> StoryNodeResponseDict:
            available_text_language_codes: List[str] = []
            available_voiceover_language_codes: List[str] = []

            if node.exploration_id:  # pragma: no cover
                available_text_language_codes = (
                    exploration_id_to_available_text_languages.get(
                        node.exploration_id, []
                    )
                )
                available_voiceover_language_codes = (
                    exploration_id_to_available_voiceover_languages.get(
                        node.exploration_id, []
                    )
                )

            # Here we use cast because the dict returned from node.to_dict()
            # has a different type than StoryNodeResponseDict and we need to
            # override the type for the caller.
            return cast(
                StoryNodeResponseDict,
                {
                    **node.to_dict(),
                    'available_text_language_codes': (
                        available_text_language_codes
                    ),
                    'available_voiceover_language_codes': (
                        available_voiceover_language_codes
                    ),
                    'available_voiceover_language_accent_descriptions': {
                        accent_code: (
                            language_accent_codes_to_descriptions.get(
                                accent_code, accent_code
                            )
                        )
                        for accent_code in available_voiceover_language_codes
                    },
                },
            )

        for canonical_story_dict, canonical_nodes in zip(
            canonical_story_dicts, canonical_story_nodes
        ):
            canonical_story_dict['all_node_dicts'] = [
                _create_node_dict(node) for node in canonical_nodes
            ]

        for additional_story_dict, additional_nodes in zip(
            additional_story_dicts, additional_story_nodes
        ):
            additional_story_dict['all_node_dicts'] = [
                _create_node_dict(node) for node in additional_nodes
            ]

        uncategorized_skill_ids = topic.get_all_uncategorized_skill_ids()
        subtopics = topic.get_all_subtopics()

        all_skill_ids = topic.get_all_skill_ids()
        skill_descriptions, deleted_skill_ids = (
            skill_services.get_descriptions_of_skills(all_skill_ids)
        )

        if deleted_skill_ids:
            deleted_skills_string = ', '.join(deleted_skill_ids)
            logging.exception(
                'The deleted skills: %s are still present in topic with id %s'
                % (deleted_skills_string, topic.id)
            )
            email_manager.send_mail_to_admin(
                'Deleted skills present in topic',
                'The deleted skills: %s are still present in topic with '
                'id %s' % (deleted_skills_string, topic.id),
            )

        if self.user_id:
            degrees_of_mastery = skill_services.get_multi_user_skill_mastery(
                self.user_id, all_skill_ids
            )
        else:
            degrees_of_mastery = {}
            for skill_id in all_skill_ids:
                degrees_of_mastery[skill_id] = None

        classroom_name = (
            classroom_config_services.get_classroom_name_for_topic_id(topic.id)
        )

        self.values.update(
            {
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
                    None
                    if (
                        classroom_name
                        == str(constants.CLASSROOM_NAME_FOR_UNATTACHED_TOPICS)
                    )
                    else classroom_name
                ),
            }
        )
        self.render_json(self.values)


class TopicNameHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A data handler for checking if a topic with given name exists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_name': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_CHARS_IN_TOPIC_NAME,
                    }
                ],
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, topic_name: str) -> None:
        """Handler that receives a topic name and checks whether
        a topic with the same name exists.

        Args:
            topic_name: str. The topic name.
        """
        self.values.update(
            {
                'topic_name_exists': (
                    topic_services.does_topic_with_name_exist(topic_name)
                )
            }
        )
        self.render_json(self.values)
