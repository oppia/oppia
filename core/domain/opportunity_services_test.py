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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.tests import test_utils


class OpportunityServicesIntegerationTest(test_utils.GenericTestBase):
    """Test the opportunity services module."""
    def setUp(self):
        super(OpportunityServicesIntegerationTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(5)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        topic = topic_domain.Topic.create_default_topic(
            topic_id=self.TOPIC_ID, name='topic')
        topic_services.save_new_topic(self.owner_id, topic)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, title='A story',
            corresponding_topic_id=self.TOPIC_ID)
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)

    def test_new_opportunity_with_adding_exploration_in_story_node(self):
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 0)

        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)
        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity['topic_name'], 'topic')
        self.assertEqual(opportunity['story_title'], 'A story')

    def test_opportunity_get_deleted_with_removing_exploration_from_story_node(
            self):
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'delete_story_node',
                'node_id': 'node_1',
            })], 'Deleted one node.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 0)

    def test_opportunity_get_deleted_with_deleting_story(self):
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        story_services.delete_story(self.owner_id, self.STORY_ID)

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 0)

    def test_opportunity_get_deleted_with_deleting_topic(self):
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        topic_services.delete_topic(self.owner_id, self.TOPIC_ID)

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 0)

    def test_opportunities_updates_with_updating_topic_name(self):
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity['story_title'], 'A story')
        self.assertEqual(opportunity['topic_name'], 'topic')

        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, self.TOPIC_ID, [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'name',
                'old_value': 'topic',
                'new_value': 'A new topic'
            })], 'Change topic title.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity['story_title'], 'A story')
        self.assertEqual(opportunity['topic_name'], 'A new topic')

    def test_opportunities_updates_with_updating_story_title(self):
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity['story_title'], 'A story')

        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
                'old_value': 'A story',
                'new_value': 'A new story'
            })], 'Change story title.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity['story_title'], 'A new story')

    def test_opportunity_updates_with_updating_story_node_title(self):
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity['chapter_title'], 'Node1')

        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'title',
                'node_id': 'node_1',
                'old_value': 'Node1',
                'new_value': 'A new Node1'
            })], 'Change node title.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)

        opportunity = translation_opportunities[0]
        self.assertEqual(opportunity['chapter_title'], 'A new Node1')

    def test_opportunity_updates_with_updating_exploration(self):
        story_services.update_story(
            self.owner_id, self.STORY_ID, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)
        self.assertEqual(translation_opportunities[0]['content_count'], 2)

        answer_group_dict = {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': 'Test'
                },
                'rule_type': 'Contains'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }

        hints_list = []
        hints_list.append({
            'hint_content': {
                'content_id': 'hint_1',
                'html': '<p>hint one</p>'
            },
        })

        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'helloworld!',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>hello_world is a string</p>'
            },
        }
        exp_services.update_exploration(
            self.owner_id, '0', [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'state_name': 'Introduction',
                    'new_value': 'TextInput'
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                    'state_name': 'Introduction',
                    'new_value': [answer_group_dict]
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_HINTS),
                    'state_name': 'Introduction',
                    'new_value': hints_list
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION),
                    'state_name': 'Introduction',
                    'new_value': solution_dict
                })], 'Add state name')
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 1)
        self.assertEqual(translation_opportunities[0]['content_count'], 5)
