# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Controller for initializing android specific structures."""

from __future__ import annotations

import os

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_services
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services

from typing import Dict, List


class InitializeAndroidTestDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler to initialize android specific structures."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'POST': {}}

    @acl_decorators.open_access
    def post(self) -> None:
        """Generates structures for Android end-to-end tests.

        This handler generates structures for Android end-to-end tests in
        order to evaluate the integration of network requests from the
        Android client to the backend. This handler should only be called
        once (or otherwise raises an exception), and can only be used in
        development mode (this handler is unavailable in production).

        Note that the handler outputs an empty JSON dict when the request is
        successful.

        The specific structures that are generated:
            Topic: A topic with both a test story and a subtopic.
            Story: A story with 'android_interactions' as a exploration
                node.
            Exploration: 'android_interactions' from the local assets.
            Subtopic: A dummy subtopic to validate the topic.
            Skill: A dummy skill to validate the subtopic.

        Raises:
            Exception. When used in production mode.
            InvalidInputException. The topic is already
                created but not published.
            InvalidInputException. The topic is already published.
        """

        if not constants.DEV_MODE:
            raise Exception('Cannot load new structures data in production.')
        if topic_services.does_topic_with_name_exist('Android test'):
            topic = topic_fetchers.get_topic_by_name(
                'Android test', strict=True
            )
            topic_rights = topic_fetchers.get_topic_rights(
                topic.id, strict=True
            )
            if topic_rights.topic_is_published:
                raise self.InvalidInputException(
                    'The topic is already published.')

            raise self.InvalidInputException(
                'The topic exists but is not published.')
        exp_id = '26'
        user_id = feconf.SYSTEM_COMMITTER_ID
        # Generate new Structure id for topic, story, skill and question.
        topic_id = topic_fetchers.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        skill_id = skill_services.get_new_skill_id()
        question_id = question_services.get_new_question_id()

        # Create dummy skill and question.
        skill = self._create_dummy_skill(
            skill_id, 'Dummy Skill for Android', '<p>Dummy Explanation 1</p>')
        question = self._create_dummy_question(
            question_id, 'Question 1', [skill_id])
        question_services.add_question(user_id, question)
        question_services.create_new_question_skill_link(
            user_id, question_id, skill_id, 0.3)

        # Create and update topic to validate before publishing.
        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'Android test', 'test-topic-one', 'description',
            'fragm')
        topic.update_url_fragment('test-topic')
        topic.update_meta_tag_content('tag')
        topic.update_page_title_fragment_for_web('page title for topic')
        # Save the dummy image to the filesystem to be used as thumbnail.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, topic_id)
        fs.commit(
            '%s/test_svg.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')
        # Update thumbnail properties.
        topic_services.update_thumbnail_filename(topic, 'test_svg.svg')
        topic.update_thumbnail_bg_color('#C6DCDA')

        # Add other structures to the topic.
        topic.add_canonical_story(story_id)
        topic.add_uncategorized_skill_id(skill_id)
        topic.add_subtopic(1, 'Test Subtopic Title', 'testsubtop')

        # Update and validate subtopic.
        topic_services.update_subtopic_thumbnail_filename(
            topic, 1, 'test_svg.svg')
        topic.update_subtopic_thumbnail_bg_color(1, '#FFFFFF')
        topic.update_subtopic_url_fragment(1, 'suburl')
        topic.move_skill_id_to_subtopic(None, 1, skill_id)
        topic.update_skill_ids_for_diagnostic_test([skill_id])
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, topic_id))

        # Upload local exploration to the datastore and enable feedback.
        exp_services.load_demo(exp_id)
        rights_manager.release_ownership_of_exploration(
            user_services.get_system_user(), exp_id)
        exp_services.update_exploration(
            user_id, exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'correctness_feedback_enabled',
                'new_value': True
            })], 'Changed correctness_feedback_enabled.')

        # Add and update the exploration/node to the story.
        story = story_domain.Story.create_default_story(
            story_id, 'Android End to End testing', 'Description',
            topic_id, 'android-end-to-end-testing')

        story.add_node(
            '%s%d' % (story_domain.NODE_ID_PREFIX, 1),
            'Testing with UI Automator'
        )

        story.update_node_description(
            '%s%d' % (story_domain.NODE_ID_PREFIX, 1),
            'To test all Android interactions'
        )
        story.update_node_exploration_id(
            '%s%d' % (story_domain.NODE_ID_PREFIX, 1),
            exp_id
        )

        # Save the dummy image to the filesystem to be used as thumbnail.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_STORY, story_id)
        fs.commit(
            '%s/test_svg.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')

        story.update_node_thumbnail_filename(
            '%s%d' % (story_domain.NODE_ID_PREFIX, 1),
            'test_svg.svg')
        story.update_node_thumbnail_bg_color(
            '%s%d' % (story_domain.NODE_ID_PREFIX, 1), '#F8BF74')

        # Update and validate the story.
        story.update_meta_tag_content('tag')
        story.update_thumbnail_filename('test_svg.svg')
        story.update_thumbnail_bg_color(
            constants.ALLOWED_THUMBNAIL_BG_COLORS['story'][0])

        # Save the previously created structures
        # (skill, story, topic, subtopic).
        skill_services.save_new_skill(user_id, skill)
        story_services.save_new_story(user_id, story)
        topic_services.save_new_topic(user_id, topic)
        subtopic_page_services.save_subtopic_page(
            user_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Dummy Subtopic Title',
                'url_fragment': 'dummy-fragment'
            })]
        )

        # Generates translation opportunities for the Contributor Dashboard.
        exp_ids_in_story = story.story_contents.get_all_linked_exp_ids()
        opportunity_services.add_new_exploration_opportunities(
            story_id, exp_ids_in_story)

        # Publish the story and topic.
        topic_services.publish_story(topic_id, story_id, user_id)
        topic_services.publish_topic(topic_id, user_id)

        # Upload thumbnails to be accessible through AssetsDevHandler.
        self._upload_thumbnail(topic_id, feconf.ENTITY_TYPE_TOPIC)
        self._upload_thumbnail(story_id, feconf.ENTITY_TYPE_STORY)
        self.render_json({})

    def _upload_thumbnail(self, structure_id: str, structure_type: str) -> None:
        """Uploads images to the local datastore to be fetched using the
        AssetDevHandler.
        """
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            image_content = f.read()
            fs_services.save_original_and_compressed_versions_of_image(
                'test_svg.svg', structure_type, structure_id,
                image_content, 'thumbnail', False)

    def _create_dummy_question(
        self,
        question_id: str,
        question_content: str,
        linked_skill_ids: List[str]
    ) -> question_domain.Question:
        """Creates a dummy question object with the given question ID.

        Args:
            question_id: str. The ID of the question to be created.
            question_content: str. The question content.
            linked_skill_ids: list(str). The IDs of the skills to which the
                question is linked to.

        Returns:
            Question. The dummy question with given values.
        """
        state = state_domain.State.create_default_state(
            'ABC', is_initial_state=True)
        state.update_interaction_id('TextInput')
        state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'rows': {'value': 1}
        })

        state.update_next_content_id_index(1)
        state.update_linked_skill_id(None)
        state.update_content(state_domain.SubtitledHtml('1', question_content))
        recorded_voiceovers = state_domain.RecordedVoiceovers({})
        written_translations = state_domain.WrittenTranslations({})
        recorded_voiceovers.add_content_id_for_voiceover('ca_placeholder_0')
        recorded_voiceovers.add_content_id_for_voiceover('1')
        recorded_voiceovers.add_content_id_for_voiceover('default_outcome')
        written_translations.add_content_id_for_translation('ca_placeholder_0')
        written_translations.add_content_id_for_translation('1')
        written_translations.add_content_id_for_translation('default_outcome')

        state.update_recorded_voiceovers(recorded_voiceovers)
        state.update_written_translations(written_translations)
        solution = state_domain.Solution(
            'TextInput', False, 'Solution', state_domain.SubtitledHtml(
                'solution', '<p>This is a solution.</p>'))
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>This is a hint.</p>')
            )
        ]

        state.update_interaction_solution(solution)
        state.update_interaction_hints(hints_list)
        state.update_interaction_default_outcome(
            state_domain.Outcome(
                None, None, state_domain.SubtitledHtml(
                    'feedback_id', '<p>Dummy Feedback</p>'),
                True, [], None, None
            )
        )
        question = question_domain.Question(
            question_id, state,
            feconf.CURRENT_STATE_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0, linked_skill_ids, [])
        return question

    def _create_dummy_skill(
        self, skill_id: str, skill_description: str, explanation: str
    ) -> skill_domain.Skill:
        """Creates a dummy skill object with the given values.

        Args:
            skill_id: str. The ID of the skill to be created.
            skill_description: str. The description of the skill.
            explanation: str. The review material for the skill.

        Returns:
            Skill. The dummy skill with given values.
        """
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            skill_id, skill_description, rubrics)
        skill.update_explanation(state_domain.SubtitledHtml('1', explanation))
        return skill
