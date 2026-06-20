# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.opportunity_services."""

from __future__ import annotations

import logging
import unittest.mock

from core import feature_flag_list, feconf
from core.constants import constants
from core.domain import (
    exp_domain,
    exp_fetchers,
    exp_services,
    opportunity_domain,
    opportunity_services,
    question_services,
    skill_domain,
    skill_services,
    state_domain,
    story_domain,
    story_fetchers,
    story_services,
    subtopic_page_domain,
    subtopic_page_services,
    suggestion_services,
    topic_domain,
    topic_services,
    translation_domain,
    translation_services,
    user_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        feedback_models,
        opportunity_models,
        story_models,
        suggestion_models,
        user_models,
    )

(
    feedback_models,
    opportunity_models,
    story_models,
    suggestion_models,
    user_models,
) = models.Registry.import_models(
    [
        models.Names.FEEDBACK,
        models.Names.OPPORTUNITY,
        models.Names.STORY,
        models.Names.SUGGESTION,
        models.Names.USER,
    ]
)


class OpportunityServicesIntegrationTest(test_utils.GenericTestBase):
    """Test the opportunity services module."""

    suggestion_target_id: str = '0'
    suggestion_target_version_at_submission: int = 1
    suggestion_change: Dict[str, str] = {
        'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
        'state_name': 'Introduction',
        'content_id': 'content_0',
        'language_code': 'hi',
        'content_html': '',
        'translation_html': '<p>This is translated html.</p>',
        'data_format': 'html',
    }

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        self.USER_ID = 'user'
        self.SKILL_ID = 'skill'
        self.QUESTION_ID = question_services.get_new_question_id()
        self.THREAD_ID = 'exploration.exp1.thread_1'

        # Since a valid exploration is created here, it has EndExploration
        # state as well, so the content in that has to be taken into account as
        # well when checking content_count in the tests.
        explorations = [
            self.save_new_valid_exploration(
                '%s' % i,
                self.owner_id,
                title='title %d' % i,
                category=constants.ALL_CATEGORIES[i],
                end_state_name='End State',
            )
            for i in range(5)
        ]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description', 'fragm'
        )
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1,
                'Title',
                ['skill_id_1'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url',
            )
        ]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID
            )
        )
        subtopic_page_services.save_subtopic_page(
            self.owner_id,
            subtopic_page,
            'Added subtopic',
            [
                topic_domain.TopicChange(
                    {
                        'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                        'subtopic_id': 1,
                        'title': 'Sample',
                        'url_fragment': 'dummy-fragment',
                    }
                )
            ],
        )
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A story', 'description', self.TOPIC_ID, 'story-one'
        )
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID
        )
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )

    def mock_generate_new_thread_id_for_suggestion(
        self,
        unused_entity_type: feedback_models.GeneralFeedbackThreadModel,
        unused_entity_id: str,
    ) -> str:
        """Mock generate_new_thread_id function when creating suggestions."""
        return self.THREAD_ID

    def create_translation_suggestion_for_exploration_0_and_verify(
        self,
    ) -> None:
        """Creates a translation suggestion for exploration 0 and performs basic
        assertions.
        """
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id',
            self.mock_generate_new_thread_id_for_suggestion,
        ):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.suggestion_target_id,
                self.suggestion_target_version_at_submission,
                self.owner_id,
                self.suggestion_change,
                'test description',
            )

        suggestion = suggestion_services.get_suggestion_by_id(self.THREAD_ID)

        self.assertIsNotNone(suggestion)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_IN_REVIEW)

    def add_exploration_0_to_story(self) -> None:
        """Adds exploration 0 as a node to the test story."""
        story_services.update_story(
            self.owner_id,
            self.STORY_ID,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'exploration_id',
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': '0',
                    }
                ),
            ],
            'Changes.',
        )

    def test_new_opportunity_with_adding_exploration_in_story_node(
        self,
    ) -> None:
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)
        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.topic_name, 'topic')
        self.assertEqual(opportunity.story_title, 'A story')

    def test_get_translation_opportunities_with_translations_in_review(
        self,
    ) -> None:
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)
        self.add_exploration_0_to_story()
        self.create_translation_suggestion_for_exploration_0_and_verify()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )

        self.assertEqual(len(translation_opportunities), 1)
        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.translation_in_review_counts, {'hi': 1})

    def test_get_translation_opportunities_with_no_translations_in_review(
        self,
    ) -> None:
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )

        self.assertEqual(len(translation_opportunities), 1)
        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.translation_in_review_counts, {})

    def test_opportunity_get_deleted_with_removing_exploration_from_story_node(
        self,
    ) -> None:
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        story_services.update_story(
            self.owner_id,
            self.STORY_ID,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'delete_story_node',
                        'node_id': 'node_1',
                    }
                )
            ],
            'Deleted one node.',
        )

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

    def test_opportunity_get_deleted_with_deleting_story(self) -> None:
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        story_services.delete_story(self.owner_id, self.STORY_ID)

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

    def test_opportunity_get_deleted_with_deleting_topic(self) -> None:
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        topic_services.delete_topic(self.owner_id, self.TOPIC_ID)

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

    def test_opportunities_updates_with_updating_topic_name(self) -> None:
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.story_title, 'A story')
        self.assertEqual(opportunity.topic_name, 'topic')

        topic_services.update_topic_and_subtopic_pages(
            self.owner_id,
            self.TOPIC_ID,
            [
                topic_domain.TopicChange(
                    {
                        'cmd': 'update_topic_property',
                        'property_name': 'name',
                        'old_value': 'topic',
                        'new_value': 'A new topic',
                    }
                )
            ],
            'Change topic title.',
        )

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'A new topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.story_title, 'A story')
        self.assertEqual(opportunity.topic_name, 'A new topic')

    def test_opportunities_updates_with_updating_story_title(self) -> None:
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.story_title, 'A story')

        story_services.update_story(
            self.owner_id,
            self.STORY_ID,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_property',
                        'property_name': 'title',
                        'old_value': 'A story',
                        'new_value': 'A new story',
                    }
                )
            ],
            'Change story title.',
        )

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.story_title, 'A new story')

    def test_opportunity_updates_with_updating_story_node_title(self) -> None:
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.chapter_title, 'Node1')

        story_services.update_story(
            self.owner_id,
            self.STORY_ID,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'title',
                        'node_id': 'node_1',
                        'old_value': 'Node1',
                        'new_value': 'A new Node1',
                    }
                )
            ],
            'Change node title.',
        )

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity.chapter_title, 'A new Node1')

    def test_opportunity_updates_with_updating_exploration(self) -> None:
        self.add_exploration_0_to_story()

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)
        self.assertEqual(translation_opportunities[0].content_count, 0)

        exp = exp_fetchers.get_exploration_by_id('0')
        content_id_generator = translation_domain.ContentIdGenerator(
            exp.next_content_id_index
        )
        answer_group_dict_inputs_value: Dict[str, Union[str, List[str]]] = {
            'contentId': content_id_generator.generate(
                translation_domain.ContentType.RULE, extra_prefix='input'
            ),
            'normalizedStrSet': ['Test'],
        }

        answer_group_dict: state_domain.AnswerGroupDict = {
            'outcome': {
                'dest': 'Introduction',
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': content_id_generator.generate(
                        translation_domain.ContentType.FEEDBACK
                    ),
                    'html': '<p>Feedback</p>',
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None,
            },
            'rule_specs': [
                {
                    'inputs': {'x': answer_group_dict_inputs_value},
                    'rule_type': 'Contains',
                }
            ],
            'training_data': [],
            'tagged_skill_misconception_id': None,
        }

        hints_list = []
        hints_list.append(
            {
                'hint_content': {
                    'content_id': content_id_generator.generate(
                        translation_domain.ContentType.HINT
                    ),
                    'html': '<p>hint one</p>',
                },
            }
        )

        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': content_id_generator.generate(
                    translation_domain.ContentType.SOLUTION
                ),
                'html': '<p>hello_world is a string</p>',
            },
        }
        exp_services.update_exploration(
            self.owner_id,
            '0',
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                        'state_name': 'Introduction',
                        'new_value': 'TextInput',
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                        'state_name': 'Introduction',
                        'new_value': {
                            'placeholder': {
                                'value': {
                                    'content_id': content_id_generator.generate(
                                        translation_domain.ContentType.CUSTOMIZATION_ARG,
                                        extra_prefix='placeholder',
                                    ),
                                    'unicode_str': '',
                                }
                            },
                            'rows': {'value': 1},
                            'catchMisspellings': {'value': False},
                        },
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS
                        ),
                        'state_name': 'Introduction',
                        'new_value': [answer_group_dict],
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_HINTS
                        ),
                        'state_name': 'Introduction',
                        'new_value': hints_list,
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION
                        ),
                        'state_name': 'Introduction',
                        'new_value': solution_dict,
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                        'property_name': 'next_content_id_index',
                        'new_value': content_id_generator.next_content_id_index,
                        'old_value': 0,
                    }
                ),
            ],
            'Add state name',
        )
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)
        self.assertEqual(translation_opportunities[0].content_count, 4)

    def test_update_opportunity_with_duplicate_suggestion_does_not_double_count(
        self,
    ) -> None:
        """Test to verify that accepting a duplicate translation suggestion does
        not incorrectly increase the translation count.
        """
        self.add_exploration_0_to_story()

        exp = exp_fetchers.get_exploration_by_id('0')
        change_list = [
            exp_domain.ExplorationChange(
                {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'Introduction',
                    'property_name': 'content',
                    'new_value': {
                        'html': '<p>Content</p>',
                        'content_id': 'content_0',
                    },
                }
            )
        ]
        exp_services.update_exploration(
            self.owner_id, '0', change_list, 'Setup content'
        )

        # Reload exploration to get the new version number.
        exp = exp_fetchers.get_exploration_by_id('0')

        translated_content = translation_domain.TranslatedContent(
            '<p>Translated Content</p>',
            translation_domain.TranslatableContentFormat.HTML,
            needs_update=False,
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            '0',
            exp.version,
            'hi',
            'content_0',
            translated_content,
        )

        opportunity_services.update_translation_opportunity_with_accepted_suggestion(
            '0', 'hi'
        )

        model = opportunity_models.ExplorationOpportunitySummaryModel.get('0')
        self.assertEqual(model.translation_counts['hi'], 1)

        # Simulate accepting a second translation for the same content (e.g. an
        # edit). The count should remain 1.
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            '0',
            exp.version,
            'hi',
            'content_0',
            translated_content,
        )

        opportunity_services.update_translation_opportunity_with_accepted_suggestion(
            '0', 'hi'
        )

        model = opportunity_models.ExplorationOpportunitySummaryModel.get('0')
        self.assertEqual(model.translation_counts['hi'], 1)

    def test_update_opportunity_with_no_translation_sets_count_to_zero(
        self,
    ) -> None:
        """Test to verify that accepting a suggestion when no translation exists
        in the datastore sets the translation count to 0.
        """
        self.add_exploration_0_to_story()

        # No translation has been added for exploration '0' in language 'hi'.
        # Simulate the acceptance of a suggestion.
        opportunity_services.update_translation_opportunity_with_accepted_suggestion(
            '0', 'hi'
        )

        model = opportunity_models.ExplorationOpportunitySummaryModel.get('0')
        self.assertEqual(model.translation_counts['hi'], 0)

    def test_completing_translation_removes_language_from_incomplete_language_codes(  # pylint: disable=line-too-long
        self,
    ) -> None:
        story_services.update_story(
            self.owner_id,
            self.STORY_ID,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'exploration_id',
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': '0',
                    }
                ),
            ],
            'Changes.',
        )
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        change_list = [
            exp_domain.ExplorationChange(
                {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': 'Introduction',
                    'property_name': 'content',
                    'new_value': {
                        'html': '<p><strong>Test content</strong></p>',
                        'content_id': 'content_0',
                    },
                }
            )
        ]
        exp_services.update_exploration(
            self.owner_id, '0', change_list, 'commit message'
        )

        exp = exp_fetchers.get_exploration_by_id('0')
        translated_content = translation_domain.TranslatedContent(
            '<p><strong>Test content</strong></p>',
            translation_domain.TranslatableContentFormat.HTML,
            needs_update=False,
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            '0',
            exp.version,
            'hi',
            'content_0',
            translated_content,
        )
        (
            opportunity_services.update_translation_opportunity_with_accepted_suggestion(
                '0', 'hi'
            )
        )

        # get_translation_opportunities should no longer return the opportunity
        # after translation completion.
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

        # The translation opportunity should be returned after marking a
        # translation as stale.
        translation_needs_update_change_list = [
            exp_domain.ExplorationChange(
                {
                    'cmd': exp_domain.CMD_MARK_TRANSLATIONS_NEEDS_UPDATE,
                    'content_id': 'content_0',
                }
            )
        ]
        exp_services.update_exploration(
            self.owner_id,
            '0',
            translation_needs_update_change_list,
            'commit message',
        )
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

    def test_create_new_skill_creates_new_skill_opportunity(self) -> None:
        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        self.assertEqual(len(skill_opportunities), 0)

        self.save_new_skill(
            self.SKILL_ID, self.USER_ID, description='skill_description'
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        self.assertEqual(len(skill_opportunities), 1)
        opportunity = skill_opportunities[0]
        self.assertEqual(opportunity.id, self.SKILL_ID)
        self.assertEqual(opportunity.skill_description, 'skill_description')

    def test_create_skill_opportunity_counts_existing_linked_questions(
        self,
    ) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_ID,
            self.USER_ID,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_ID],
            content_id_generator.next_content_id_index,
        )
        question_services.create_new_question_skill_link(
            self.USER_ID, self.QUESTION_ID, self.SKILL_ID, 0.3
        )

        opportunity_services.create_skill_opportunity(
            self.SKILL_ID, 'description'
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        self.assertEqual(len(skill_opportunities), 1)
        opportunity = skill_opportunities[0]
        self.assertEqual(opportunity.id, self.SKILL_ID)
        self.assertEqual(opportunity.skill_description, 'description')
        self.assertEqual(opportunity.question_count, 1)

    def test_create_skill_opportunity_for_existing_opportunity_raises_exception(
        self,
    ) -> None:
        opportunity_services.create_skill_opportunity(
            self.SKILL_ID, 'description'
        )
        with self.assertRaisesRegex(
            Exception,
            'SkillOpportunity corresponding to skill ID %s already exists.'
            % self.SKILL_ID,
        ):
            opportunity_services.create_skill_opportunity(
                self.SKILL_ID, 'description'
            )

    def test_update_skill_description_updates_skill_opportunity(self) -> None:
        self.save_new_skill(
            self.SKILL_ID, self.USER_ID, description='skill_description'
        )
        changelist = [
            skill_domain.SkillChange(
                {
                    'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                    'property_name': (skill_domain.SKILL_PROPERTY_DESCRIPTION),
                    'old_value': 'skill_description',
                    'new_value': 'new_description',
                }
            )
        ]

        skill_services.update_skill(
            self.admin_id,
            self.SKILL_ID,
            changelist,
            'Updated misconception name.',
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        opportunity = skill_opportunities[0]
        self.assertEqual(opportunity.id, self.SKILL_ID)
        self.assertEqual(opportunity.skill_description, 'new_description')

    def test_update_skill_opportunity_skill_description_invalid_skill_id(
        self,
    ) -> None:
        opportunity_services.update_skill_opportunity_skill_description(
            'bad_skill_id', 'bad_description'
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        self.assertEqual(len(skill_opportunities), 0)

    def test_delete_skill_deletes_skill_opportunity(self) -> None:
        self.save_new_skill(
            self.SKILL_ID, self.USER_ID, description='skill_description'
        )
        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        self.assertEqual(len(skill_opportunities), 1)

        skill_services.delete_skill(self.USER_ID, self.SKILL_ID)

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        self.assertEqual(len(skill_opportunities), 0)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS]
    )
    def test_publish_story_creates_exploration_opportunity(self) -> None:
        self.add_exploration_0_to_story()
        # Story is already published, so unpublish first.
        topic_services.unpublish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

    def test_publish_story_creates_exploration_opportunity_if_topic_is_not_published(  # pylint: disable=line-too-long
        self,
    ) -> None:
        self.add_exploration_0_to_story()
        # Story and topic are already published, so unpublish first.
        topic_services.unpublish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )
        topic_services.unpublish_topic(self.TOPIC_ID, self.admin_id)
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

    def test_unpublish_story_deletes_exploration_opportunity(self) -> None:
        self.add_exploration_0_to_story()
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 1)

        topic_services.unpublish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities(
                'hi', 'topic', None
            )
        )
        self.assertEqual(len(translation_opportunities), 0)

    def test_unpublish_story_rejects_translation_suggestions(self) -> None:
        self.add_exploration_0_to_story()
        self.create_translation_suggestion_for_exploration_0_and_verify()

        topic_services.unpublish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )

        suggestion = suggestion_services.get_suggestion_by_id(self.THREAD_ID)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_REJECTED)

    def test_add_question_increments_skill_opportunity_question_count(
        self,
    ) -> None:
        opportunity_services.create_skill_opportunity(
            self.SKILL_ID, 'description'
        )
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_ID,
            self.USER_ID,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_ID],
            content_id_generator.next_content_id_index,
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        opportunity = skill_opportunities[0]
        self.assertEqual(len(skill_opportunities), 1)
        self.assertEqual(opportunity.question_count, 1)

    def test_create_question_skill_link_increments_question_count(self) -> None:
        opportunity_services.create_skill_opportunity(
            self.SKILL_ID, 'description'
        )
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_ID,
            self.USER_ID,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_ID],
            content_id_generator.next_content_id_index,
        )

        question_services.create_new_question_skill_link(
            self.USER_ID, self.QUESTION_ID, self.SKILL_ID, 0.3
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        opportunity = skill_opportunities[0]
        self.assertEqual(opportunity.question_count, 1)

    def test_link_multiple_skills_for_question_increments_question_count(
        self,
    ) -> None:
        opportunity_services.create_skill_opportunity(
            self.SKILL_ID, 'description'
        )
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_ID,
            self.USER_ID,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_2'],
            content_id_generator.next_content_id_index,
        )

        question_services.link_multiple_skills_for_question(
            self.USER_ID, self.QUESTION_ID, [self.SKILL_ID], [0.3]
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        opportunity = skill_opportunities[0]
        self.assertEqual(opportunity.question_count, 1)

    def test_delete_question_decrements_question_count(self) -> None:
        opportunity_services.create_skill_opportunity(
            self.SKILL_ID, 'description'
        )
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_ID,
            self.USER_ID,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_ID],
            content_id_generator.next_content_id_index,
        )

        question_services.delete_question(self.USER_ID, self.QUESTION_ID)

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        opportunity = skill_opportunities[0]
        self.assertEqual(len(skill_opportunities), 1)
        self.assertEqual(opportunity.question_count, 0)

    def test_delete_question_skill_link_decrements_question_count(self) -> None:
        opportunity_services.create_skill_opportunity(
            self.SKILL_ID, 'description'
        )
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_ID,
            self.USER_ID,
            self._create_valid_question_data('ABC', content_id_generator),
            ['skill_2'],
            content_id_generator.next_content_id_index,
        )
        question_services.create_new_question_skill_link(
            self.USER_ID, self.QUESTION_ID, self.SKILL_ID, 0.3
        )

        question_services.delete_question_skill_link(
            self.USER_ID, self.QUESTION_ID, self.SKILL_ID
        )

        skill_opportunities, _, _ = (
            opportunity_services.get_skill_opportunities(None)
        )
        opportunity = skill_opportunities[0]
        self.assertEqual(opportunity.question_count, 0)


class OpportunityServicesUnitTest(test_utils.GenericTestBase):
    """Test the opportunity services methods."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        explorations = [
            self.save_new_valid_exploration(
                '%s' % i,
                self.owner_id,
                title='title %d' % i,
                category=constants.ALL_CATEGORIES[i],
                end_state_name='End State',
            )
            for i in range(5)
        ]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description', 'fragm'
        )
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1,
                'Title',
                ['skill_id_1'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url',
            )
        ]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A story', 'Description', self.TOPIC_ID, 'story-two'
        )
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID
        )
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id
        )

        story_services.update_story(
            self.owner_id,
            self.STORY_ID,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'exploration_id',
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': '0',
                    }
                ),
            ],
            'Changes.',
        )

    def test_get_exploration_opportunity_summaries_by_ids(self) -> None:
        output = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                []
            )
        )

        self.assertEqual(output, {})

        opportunities = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                ['0']
            )
        )

        opportunities_first_value = opportunities['0']
        # Ruling out the possibility of None for mypy type checking.
        assert opportunities_first_value is not None
        self.assertEqual(len(opportunities), 1)
        self.assertIsInstance(
            opportunities_first_value,
            opportunity_domain.ExplorationOpportunitySummary,
        )
        self.assertEqual(opportunities_first_value.id, '0')

    def test_get_exploration_opportunity_summaries_by_no_topic_id(self) -> None:
        opportunity_summaries = opportunity_services.get_exploration_opportunity_summaries_by_topic_id(
            'None'
        )

        self.assertEqual(opportunity_summaries, [])

    def test_get_exploration_opportunity_summaries_by_valid_topic_id(
        self,
    ) -> None:
        opportunity_summaries = opportunity_services.get_exploration_opportunity_summaries_by_topic_id(
            'topic'
        )

        self.assertEqual(len(opportunity_summaries), 1)
        self.assertIsInstance(
            opportunity_summaries[0],
            opportunity_domain.ExplorationOpportunitySummary,
        )
        self.assertEqual(opportunity_summaries[0].topic_id, 'topic')

    def test_get_exploration_opportunity_summaries_by_ids_for_invalid_id(
        self,
    ) -> None:
        opportunities = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                ['badID']
            )
        )

        self.assertEqual(len(opportunities), 1)
        self.assertEqual(opportunities['badID'], None)

    def test_get_exploration_opportunity_summary_from_model_populates_new_lang(
        self,
    ) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        opportunities = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                ['0']
            )
        )
        self.assertEqual(len(opportunities), 1)

        opportunity = opportunities['0']

        # Ruling out the possibility of None for mypy type checking.
        assert opportunity is not None
        self.assertFalse(
            'new_lang' in opportunity.incomplete_translation_language_codes
        )

        mock_supported_languages = constants.SUPPORTED_AUDIO_LANGUAGES + [
            {
                'id': 'new_lang',
                'description': 'New language',
                'relatedLanguages': ['new_lang'],
            }
        ]

        self.assertEqual(len(observed_log_messages), 0)

        with self.swap(logging, 'info', _mock_logging_function), self.swap(
            constants, 'SUPPORTED_AUDIO_LANGUAGES', mock_supported_languages
        ):
            opportunities = opportunity_services.get_exploration_opportunity_summaries_by_ids(
                ['0']
            )
            self.assertEqual(len(opportunities), 1)

            opportunity = opportunities['0']

            # Ruling out the possibility of None for mypy type checking.
            assert opportunity is not None
            self.assertTrue(
                'new_lang' in opportunity.incomplete_translation_language_codes
            )
            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                'Missing language codes [\'new_lang\'] in exploration '
                'opportunity model with id 0',
            )

    def test_get_exploration_opportunity_summary_by_id_for_none_result(
        self,
    ) -> None:
        self.assertIsNone(
            opportunity_services.get_exploration_opportunity_summary_by_id(
                'exp_1'
            )
        )

    def test_delete_exp_opportunities_corresponding_to_story_when_story_deleted(
        self,
    ) -> None:
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_1',
            topic_id='topic_id',
            topic_name='topic_name',
            story_id='story_id',
            story_title='story_title',
            chapter_title='chapter_title',
            content_count=1,
        ).put()
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_2',
            topic_id='topic_id',
            topic_name='topic_name',
            story_id='story_id',
            story_title='story_title',
            chapter_title='chapter_title',
            content_count=1,
        ).put()

        opportunity_services.delete_exp_opportunities_corresponding_to_story(
            'story_id'
        )

        self.assertIsNone(
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                'exp_1', strict=False
            )
        )
        self.assertIsNone(
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                'exp_2', strict=False
            )
        )

    def test_regenerate_opportunities_related_to_topic_when_story_deleted(
        self,
    ) -> None:
        story_models.StoryModel.delete_by_id(self.STORY_ID)

        with self.assertRaisesRegex(
            Exception, 'Failed to regenerate opportunities'
        ):
            opportunity_services.regenerate_opportunities_related_to_topic(
                self.TOPIC_ID
            )

    def test_update_and_get_pinned_opportunity_model(self) -> None:
        user_id = 'user123'
        language_code = 'en'
        topic_id = 'topic123'
        lesson_id = 'lesson456'

        mock_opportunity_summary = unittest.mock.MagicMock(
            id=lesson_id,
            topic_id=topic_id,
            topic_name='topic',
            story_id='story_id_1',
            story_title='A story title',
            chapter_title='Title 1',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar', 'en'],
            translation_counts={'hi': 1, 'ar': 2, 'en': 3},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[],
        )
        # Mock the get method of ExplorationOpportunitySummaryModel.
        with self.swap(
            opportunity_models.ExplorationOpportunitySummaryModel,
            'get',
            lambda _id: mock_opportunity_summary if _id == lesson_id else None,
        ):
            # Test pinning an opportunity.
            opportunity_services.update_pinned_opportunity_model(
                user_id, language_code, topic_id, lesson_id
            )

            pinned_opportunity = opportunity_services.get_pinned_lesson(
                user_id, language_code, topic_id
            )

            self.assertIsNotNone(pinned_opportunity)
            if pinned_opportunity is not None:
                self.assertEqual(pinned_opportunity.id, lesson_id)

            # Test unpinning the opportunity.
            opportunity_services.update_pinned_opportunity_model(
                user_id, language_code, topic_id, None
            )

            pinned_opportunity = opportunity_services.get_pinned_lesson(
                user_id, language_code, topic_id
            )

            self.assertIsNone(pinned_opportunity)

            # Test pinning an opportunity with default entity_type.
            opportunity_services.update_pinned_opportunity_model(
                user_id, language_code, topic_id, 'lesson_2'
            )
            pinned_model = user_models.PinnedOpportunityModel.get_model(
                user_id, language_code, topic_id
            )
            self.assertIsNotNone(pinned_model)
            assert pinned_model is not None
            self.assertEqual(pinned_model.opportunity_id, 'lesson_2')
            self.assertEqual(
                pinned_model.entity_type, feconf.ENTITY_TYPE_EXPLORATION
            )

            # Test updating pinning with a different entity_type.
            opportunity_services.update_pinned_opportunity_model(
                user_id,
                language_code,
                topic_id,
                'story_1',
                entity_type=feconf.ENTITY_TYPE_STORY,
            )
            pinned_model = user_models.PinnedOpportunityModel.get_model(
                user_id, language_code, topic_id
            )
            self.assertIsNotNone(pinned_model)
            assert pinned_model is not None
            self.assertEqual(pinned_model.opportunity_id, 'story_1')
            self.assertEqual(pinned_model.entity_type, feconf.ENTITY_TYPE_STORY)

            # Test pinning with a non-exploration entity_type when model does not exist.
            opportunity_services.update_pinned_opportunity_model(
                user_id, language_code, topic_id, None
            )
            opportunity_services.update_pinned_opportunity_model(
                user_id,
                language_code,
                topic_id,
                'skill_1',
                entity_type=feconf.ENTITY_TYPE_SKILL,
            )
            pinned_model = user_models.PinnedOpportunityModel.get_model(
                user_id, language_code, topic_id
            )
            self.assertIsNotNone(pinned_model)
            assert pinned_model is not None
            self.assertEqual(pinned_model.opportunity_id, 'skill_1')
            self.assertEqual(pinned_model.entity_type, feconf.ENTITY_TYPE_SKILL)

            opportunity_services.update_pinned_opportunity_model(
                user_id, 'lang', topic_id, None
            )


class OpportunityUpdateOnAcceeptingSuggestionUnitTest(
    test_utils.GenericTestBase
):
    """Unit test validating opportunity gets updated after accepting translation
    suggetion.
    """

    def setUp(self) -> None:
        super().setUp()
        supported_language_codes = set(
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES
        )
        self.new_incomplete_translation_language_codes = list(
            supported_language_codes - set(['en'])
        )

        self.opportunity_model = (
            opportunity_models.ExplorationOpportunitySummaryModel(
                id='exp_1',
                topic_id='topic_id',
                topic_name='topic_name',
                story_id='story_id',
                story_title='story_title',
                chapter_title='chapter_title',
                content_count=1,
                incomplete_translation_language_codes=(
                    self.new_incomplete_translation_language_codes
                ),
                translation_counts={},
                language_codes_needing_voice_artists=['en'],
                language_codes_with_assigned_voice_artists=[],
            )
        )
        self.opportunity_model.put()
        self.save_new_valid_exploration(
            'exp_1',
            'owner_id',
            title='title',
            category='category',
            content_html='<p>Content</p>',
        )

    def test_update_translation_opportunity_with_accepted_suggestion(
        self,
    ) -> None:
        exp = exp_fetchers.get_exploration_by_id('exp_1')
        translated_content = translation_domain.TranslatedContent(
            '<p>Translated Content</p>',
            translation_domain.TranslatableContentFormat.HTML,
            needs_update=False,
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            'exp_1',
            exp.version,
            'hi',
            'content_0',
            translated_content,
        )
        (
            opportunity_services.update_translation_opportunity_with_accepted_suggestion(
                'exp_1', 'hi'
            )
        )

        opportunity = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                ['exp_1']
            )
        )
        assert opportunity['exp_1'] is not None

        self.assertEqual(opportunity['exp_1'].translation_counts, {'hi': 1})

    def test_fully_translated_content_in_language_updated_in_opportunity(
        self,
    ) -> None:
        # With content_count=1, after adding 1 translation the language should
        # be removed from incomplete_translation_language_codes.
        exp = exp_fetchers.get_exploration_by_id('exp_1')
        translated_content = translation_domain.TranslatedContent(
            '<p>Translated Content</p>',
            translation_domain.TranslatableContentFormat.HTML,
            needs_update=False,
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            'exp_1',
            exp.version,
            'hi',
            'content_0',
            translated_content,
        )
        (
            opportunity_services.update_translation_opportunity_with_accepted_suggestion(
                'exp_1', 'hi'
            )
        )

        opportunity = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                ['exp_1']
            )
        )
        assert opportunity['exp_1'] is not None

        # With content_count=1 and translation_count=1, 'hi' should be removed
        # from incomplete_translation_language_codes.
        self.assertEqual(opportunity['exp_1'].translation_counts, {'hi': 1})
        self.assertFalse(
            'hi' in opportunity['exp_1'].incomplete_translation_language_codes
        )

    def test_update_opportunity_with_updated_exploration(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_default_exploration('exp_1', owner_id)
        opportunity = (
            opportunity_services.compute_opportunity_models_with_updated_exploration(
                'exp_1', 2, {'hi': 2}
            )
        )[0]

        self.assertFalse(
            'hi' in opportunity.incomplete_translation_language_codes
        )


class TranslationOpportunityServicesUnitTest(test_utils.GenericTestBase):
    """Unit tests for translations opportunity services."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        # Setup topic.
        topic = topic_domain.Topic.create_default_topic(
            'topic_id_1',
            'Topic 1',
            'topic-one',
            'Topic description',
            'topic-one',
        )
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1,
                'Title',
                ['skill_id_1'],
                'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url',
            )
        ]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, 'topic_id_1'
            )
        )
        subtopic_page_services.save_subtopic_page(
            self.owner_id,
            subtopic_page,
            'Added subtopic',
            [
                topic_domain.TopicChange(
                    {
                        'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                        'subtopic_id': 1,
                        'title': 'Sample',
                        'url_fragment': 'dummy-fragment',
                    }
                )
            ],
        )
        topic_services.save_new_topic(self.owner_id, topic)

        # Setup story.
        story = story_domain.Story.create_default_story(
            'story_id_1',
            'Story 1',
            'Story description',
            'topic_id_1',
            'story-one',
        )
        story_services.save_new_story(self.owner_id, story)

        # Setup skill.
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0],
                ['<p>[NOTE: Creator should fill this in]</p>'],
            ),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1],
                ['<p>[NOTE: Creator should fill this in]</p>'],
            ),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2],
                ['<p>[NOTE: Creator should fill this in]</p>'],
            ),
        ]
        skill = skill_domain.Skill.create_default_skill(
            'skill_id_1', 'Skill description', rubrics
        )
        skill_services.save_new_skill(self.owner_id, skill)

        # Publish the story and skill in topic.
        topic_services.add_canonical_story(
            self.owner_id, 'topic_id_1', 'story_id_1'
        )

        # Setup exploration.
        self.save_new_valid_exploration(
            'exp_1',
            self.owner_id,
            title='Title 1',
            category=constants.ALL_CATEGORIES[0],
            content_html='<p>Content</p>',
        )
        self.publish_exploration(self.owner_id, 'exp_1')

        story = story_fetchers.get_story_by_id('story_id_1')
        story_services.update_story(
            self.owner_id,
            'story_id_1',
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node 1Title',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': story_domain.STORY_NODE_PROPERTY_OUTLINE,
                        'node_id': 'node_1',
                        'old_value': '',
                        'new_value': 'Outline 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID,
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': 'exp_1',
                    }
                ),
            ],
            'Add story node linked to exploration.',
        )

        # Publish topic summary.
        topic_services.publish_topic('topic_id_1', self.admin_id)
        topic_services.publish_story('topic_id_1', 'story_id_1', self.admin_id)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_create_and_delete_translation_opportunities(self) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
            feconf.ENTITY_TYPE_STORY: ['story_id_1'],
            feconf.ENTITY_TYPE_SKILL: ['skill_id_1'],
            feconf.ENTITY_TYPE_TOPIC: ['topic_id_1'],
        }

        # Create.
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )

        # Fetch and verify cards.
        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, 'hi'
            )
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'exp_1')
        self.assertEqual(cards[0].topic_name, 'Topic 1')
        self.assertEqual(cards[0].entity_description, 'Node 1Title')
        self.assertTrue(cards[0].currently_available_to_learners)

        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_STORY, 'hi'
            )
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'story_id_1')
        self.assertEqual(cards[0].entity_description, 'Story 1')
        self.assertTrue(cards[0].currently_available_to_learners)

        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_SKILL, 'hi'
            )
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'skill_id_1')
        self.assertEqual(cards[0].entity_description, 'Skill description')
        self.assertTrue(cards[0].currently_available_to_learners)

        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_TOPIC, 'hi'
            )
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'topic_id_1')
        self.assertEqual(cards[0].entity_description, 'Topic 1')
        self.assertTrue(cards[0].currently_available_to_learners)

        # Delete.
        opportunity_services.delete_translation_opportunities(
            entity_types_and_ids
        )

        # Fetch and verify empty.
        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, 'hi'
            )
        )
        self.assertEqual(len(cards), 0)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunities_with_nonexistent_topic_name_returns_empty(
        self,
    ) -> None:
        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, 'hi', topic_name='Nonexistent'
            )
        )
        self.assertEqual(len(cards), 0)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_update_translation_opportunity_with_accepted_suggestion(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )

        exp = exp_fetchers.get_exploration_by_id('exp_1')
        translated_content = translation_domain.TranslatedContent(
            '<p>Translated Content</p>',
            translation_domain.TranslatableContentFormat.HTML,
            needs_update=False,
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            'exp_1',
            exp.version,
            'hi',
            'content_0',
            translated_content,
        )

        opportunity_services.update_translation_opportunity_with_accepted_suggestion(
            'exp_1', 'hi', entity_type=feconf.ENTITY_TYPE_EXPLORATION
        )

        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, 'hi'
            )
        )
        self.assertEqual(cards[0].translation_counts, {'hi': 1})

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_compute_translation_opportunity_models_with_updated_entity(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )

        opp_models = opportunity_services.compute_translation_opportunity_models_with_updated_entity(
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_1', 2, {'hi': 2}
        )
        self.assertEqual(len(opp_models), 1)
        self.assertEqual(opp_models[0].content_count, 2)
        self.assertEqual(opp_models[0].translation_counts, {'hi': 2})

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_compute_translation_opportunity_models_with_missing_topic_id_raises_value_error(
        self,
    ) -> None:
        # Save a new exploration that is not linked to any topic.
        self.save_new_valid_exploration(
            'exp_2',
            self.owner_id,
            title='Title 2',
            category='Category 2',
            content_html='<p>Content</p>',
        )
        # Create model directly to bypass validation during creation.
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='exp_2',
            topic_ids=[],
            content_count=1,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
        ).put()

        with self.assertRaisesRegex(
            ValueError, 'Missing topic id for exploration with id exp_2'
        ):
            opportunity_services.compute_translation_opportunity_models_with_updated_entity(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_2', 2, {'hi': 2}
            )

    def test_get_entity_by_type_and_id_with_invalid_entity_type_raises_exception(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Unsupported entity type: invalid'
        ):
            opportunity_services.get_entity_by_type_and_id('invalid', 'id')

    def test_get_entity_by_type_and_id_returns_story(self) -> None:
        entity = opportunity_services.get_entity_by_type_and_id(
            feconf.ENTITY_TYPE_STORY, 'story_id_1'
        )
        self.assertEqual(entity.id, 'story_id_1')

    def test_get_entity_by_type_and_id_returns_skill(self) -> None:
        entity = opportunity_services.get_entity_by_type_and_id(
            feconf.ENTITY_TYPE_SKILL, 'skill_id_1'
        )
        self.assertEqual(entity.id, 'skill_id_1')

    def test_get_entity_by_type_and_id_returns_topic(self) -> None:
        entity = opportunity_services.get_entity_by_type_and_id(
            feconf.ENTITY_TYPE_TOPIC, 'topic_id_1'
        )
        self.assertEqual(entity.id, 'topic_id_1')

    def test_fetch_entities_by_type_with_unsupported_type_raises_exception(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unsupported entity type: invalid'
        ):
            opportunity_services._fetch_entities_by_type(  # pylint: disable=protected-access
                'invalid', ['id']
            )

    def test_compute_topic_ids_with_unsupported_type_raises_exception(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unsupported entity type: invalid'
        ):
            opportunity_services._compute_topic_ids_of_translation_opportunities(  # pylint: disable=protected-access
                {'invalid': ['id']}
            )

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_compute_translation_opp_models_creates_model_when_not_exists(
        self,
    ) -> None:
        opp_models = opportunity_services.compute_translation_opportunity_models_with_updated_entity(
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_1', 3, {'hi': 1}
        )
        self.assertEqual(len(opp_models), 1)
        self.assertEqual(opp_models[0].content_count, 3)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_save_multi_translation_opportunities_updates_changed_model(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )
        # Fetch the created model, modify it, and save it using the private method.
        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, 'hi'
            )
        )
        card = cards[0]
        card.content_count = 100

        opportunity_services._save_multi_translation_opportunities(  # pylint: disable=protected-access
            [card]
        )

        updated_cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, 'hi'
            )
        )
        self.assertEqual(updated_cards[0].content_count, 100)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_update_translation_opp_returns_when_model_is_none(self) -> None:
        opportunity_services.update_translation_opportunity_with_accepted_suggestion(
            'nonexistent_exp',
            'hi',
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
        )

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_update_translation_opp_removes_entity_language_from_incomplete(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )
        model_id = f'{feconf.ENTITY_TYPE_EXPLORATION}.exp_1'
        model = opportunity_models.TranslationOpportunityModel.get(model_id)
        if 'en' not in model.incomplete_translation_language_codes:
            model.incomplete_translation_language_codes.append('en')
            model.update_timestamps()
            model.put()

        exp = exp_fetchers.get_exploration_by_id('exp_1')
        translated_content = translation_domain.TranslatedContent(
            '<p>Translated Content</p>',
            translation_domain.TranslatableContentFormat.HTML,
            needs_update=False,
        )
        translation_services.add_new_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            'exp_1',
            exp.version,
            'hi',
            'content_0',
            translated_content,
        )
        opportunity_services.update_translation_opportunity_with_accepted_suggestion(
            'exp_1', 'hi', entity_type=feconf.ENTITY_TYPE_EXPLORATION
        )
        updated_model = opportunity_models.TranslationOpportunityModel.get(
            model_id
        )
        self.assertNotIn(
            'en', updated_model.incomplete_translation_language_codes
        )

    def test_update_translation_opp_returns_for_non_exploration_without_flag(
        self,
    ) -> None:
        opportunity_services.update_translation_opportunity_with_accepted_suggestion(
            'story_id_1', 'hi', entity_type=feconf.ENTITY_TYPE_STORY
        )

    def test_update_translation_opp_returns_when_exp_model_is_none(
        self,
    ) -> None:
        with unittest.mock.patch.object(
            opportunity_models.ExplorationOpportunitySummaryModel,
            'get',
            return_value=None,
        ):
            opportunity_services.update_translation_opportunity_with_accepted_suggestion(
                'nonexistent_exp', 'hi'
            )

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunities_with_valid_topic_name_filter(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )
        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION,
                'hi',
                topic_name='Topic 1',
            )
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'exp_1')

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunities_with_translations_in_review(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )

        self.signup('suggester@example.com', 'suggester')
        suggester_id = self.get_user_id_from_email('suggester@example.com')
        change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>Content</p>',
            'translation_html': '<p>Translation</p>',
            'data_format': 'html',
        }

        exp = exp_fetchers.get_exploration_by_id('exp_1')

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp_1',
            exp.version,
            suggester_id,
            change_dict,
            'Translation suggestion',
        )

        cards, _, _ = (
            opportunity_services.get_translation_opportunities_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, 'hi'
            )
        )
        self.assertEqual(len(cards), 1)
        self.assertIn('hi', cards[0].translation_in_review_counts)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunity_cards_by_entity_ids_with_new_models_empty_entity_ids(
        self,
    ) -> None:
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_EXPLORATION, [], 'hi'
        )
        self.assertEqual(cards, [])

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunity_cards_by_entity_ids_with_new_models_nonexistent(
        self,
    ) -> None:
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_EXPLORATION, ['nonexistent'], 'hi'
        )
        self.assertEqual(cards, [])

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunity_cards_by_entity_ids_with_new_models_valid(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
            feconf.ENTITY_TYPE_STORY: ['story_id_1'],
            feconf.ENTITY_TYPE_SKILL: ['skill_id_1'],
            feconf.ENTITY_TYPE_TOPIC: ['topic_id_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )

        # 1. Test Exploration entity type.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_EXPLORATION, ['exp_1'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'exp_1')
        self.assertEqual(cards[0].entity_description, 'Node 1Title')
        self.assertTrue(cards[0].currently_available_to_learners)

        # 2. Test Story entity type.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_STORY, ['story_id_1'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'story_id_1')
        self.assertEqual(cards[0].entity_description, 'Story 1')
        self.assertTrue(cards[0].currently_available_to_learners)

        # 3. Test Skill entity type.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_SKILL, ['skill_id_1'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'skill_id_1')
        self.assertEqual(cards[0].entity_description, 'Skill description')
        self.assertTrue(cards[0].currently_available_to_learners)

        # 4. Test Topic entity type.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_TOPIC, ['topic_id_1'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'topic_id_1')
        self.assertEqual(cards[0].entity_description, 'Topic 1')
        self.assertTrue(cards[0].currently_available_to_learners)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunity_cards_by_entity_ids_with_new_models_unmatched_and_missing_branches(
        self,
    ) -> None:
        # Create models that cover the branches:
        # - Exploration not in published story mapping (covers currently_available_to_learners is False).
        # - Exploration without topic IDs.
        # - Story not in published story mapping.
        # - Skill without topic IDs.
        # - Nonexistent related entity models (covers None checks).
        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id='exp_no_topic',
            topic_ids=[],
            content_count=2,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
        ).put()

        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type=feconf.ENTITY_TYPE_STORY,
            entity_id='story_no_topic',
            topic_ids=[],
            content_count=2,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
        ).put()

        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type=feconf.ENTITY_TYPE_SKILL,
            entity_id='skill_no_topic',
            topic_ids=[],
            content_count=2,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
        ).put()

        opportunity_models.TranslationOpportunityModel.create_new(
            entity_type=feconf.ENTITY_TYPE_TOPIC,
            entity_id='topic_no_topic',
            topic_ids=[],
            content_count=2,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
        ).put()

        # Call with explorations including unmatched ones.
        # This will also hit exp_id not in entity_ids inside the mapping loop.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_EXPLORATION, ['exp_no_topic'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'exp_no_topic')
        self.assertEqual(cards[0].entity_description, '')
        self.assertFalse(cards[0].currently_available_to_learners)

        # Call for unmatched story.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_STORY, ['story_no_topic'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'story_no_topic')
        self.assertEqual(cards[0].entity_description, '')
        self.assertFalse(cards[0].currently_available_to_learners)

        # Call for unmatched skill.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_SKILL, ['skill_no_topic'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'skill_no_topic')
        self.assertEqual(cards[0].entity_description, '')
        self.assertFalse(cards[0].currently_available_to_learners)

        # Call for unmatched topic.
        cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
            feconf.ENTITY_TYPE_TOPIC, ['topic_no_topic'], 'hi'
        )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'topic_no_topic')
        self.assertEqual(cards[0].entity_description, '')
        self.assertFalse(cards[0].currently_available_to_learners)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
        ]
    )
    def test_get_translation_opportunity_cards_by_entity_ids_with_new_models_missing_story_node(
        self,
    ) -> None:
        entity_types_and_ids = {
            feconf.ENTITY_TYPE_EXPLORATION: ['exp_1'],
        }
        opportunity_services.create_translation_opportunity(
            entity_types_and_ids
        )

        with self.swap(
            story_domain.StoryContents,
            'get_node_with_corresponding_exp_id',
            lambda self, exp_id: None,
        ):
            cards = opportunity_services.get_translation_opportunity_cards_by_entity_ids_with_new_models(
                feconf.ENTITY_TYPE_EXPLORATION, ['exp_1'], 'hi'
            )
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].entity_id, 'exp_1')
        self.assertEqual(cards[0].entity_description, '')
