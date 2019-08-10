# coding: utf-8
#
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

"""Tests for topic services."""

from core.domain import exp_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class TopicServicesUnitTests(test_utils.GenericTestBase):
    """Tests for topic services."""
    user_id = 'user_id'
    story_id_1 = 'story_1'
    story_id_2 = 'story_2'
    story_id_3 = 'story_3'
    subtopic_id = 1
    skill_id_1 = 'skill_1'
    skill_id_2 = 'skill_2'

    def setUp(self):
        super(TopicServicesUnitTests, self).setUp()
        self.TOPIC_ID = topic_services.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1
        })]
        self.save_new_topic(
            self.TOPIC_ID, self.user_id, 'Name', 'Description',
            [self.story_id_1, self.story_id_2], [self.story_id_3],
            [self.skill_id_1, self.skill_id_2], [], 1
        )
        self.save_new_story(
            self.story_id_1, self.user_id, 'Title', 'Description', 'Notes',
            self.TOPIC_ID)
        self.save_new_story(
            self.story_id_3, self.user_id, 'Title 3', 'Description 3', 'Notes',
            self.TOPIC_ID)
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist, 'Added a subtopic')

        self.topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([user_services.get_username(self.user_id_a)])
        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)

    def test_compute_summary(self):
        topic_summary = topic_services.compute_summary_of_topic(self.topic)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.canonical_story_count, 2)
        self.assertEqual(topic_summary.additional_story_count, 1)
        self.assertEqual(topic_summary.uncategorized_skill_count, 2)
        self.assertEqual(topic_summary.subtopic_count, 1)
        self.assertEqual(topic_summary.total_skill_count, 2)

    def test_get_all_summaries(self):
        topic_summaries = topic_services.get_all_topic_summaries()

        self.assertEqual(len(topic_summaries), 1)
        self.assertEqual(topic_summaries[0].name, 'Name')
        self.assertEqual(topic_summaries[0].canonical_story_count, 2)
        self.assertEqual(topic_summaries[0].additional_story_count, 1)
        self.assertEqual(topic_summaries[0].total_skill_count, 2)
        self.assertEqual(topic_summaries[0].uncategorized_skill_count, 2)
        self.assertEqual(topic_summaries[0].subtopic_count, 1)

    def test_get_new_topic_id(self):
        new_topic_id = topic_services.get_new_topic_id()

        self.assertEqual(len(new_topic_id), 12)
        self.assertEqual(topic_models.TopicModel.get_by_id(new_topic_id), None)

    def test_get_topic_from_model(self):
        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic = topic_fetchers.get_topic_from_model(topic_model)
        self.assertEqual(topic.to_dict(), self.topic.to_dict())

    def test_cannot_get_topic_from_model_with_invalid_schema_version(self):
        topic_services.create_new_topic_rights('topic_id', self.user_id_a)
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        subtopic_dict = {
            'id': 1,
            'title': 'subtopic_title',
            'skill_ids': []
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name',
            canonical_name='canonical_name',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d subtopic schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

        topic_services.create_new_topic_rights('topic_id_2', self.user_id_a)
        model = topic_models.TopicModel(
            id='topic_id_2',
            name='name 2',
            canonical_name='canonical_name_2',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=1,
            story_reference_schema_version=0
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d story reference schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

    def test_get_topic_summary_from_model(self):
        topic_summary_model = topic_models.TopicSummaryModel.get(self.TOPIC_ID)
        topic_summary = topic_services.get_topic_summary_from_model(
            topic_summary_model)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.canonical_story_count, 2)
        self.assertEqual(topic_summary.additional_story_count, 1)
        self.assertEqual(topic_summary.uncategorized_skill_count, 2)
        self.assertEqual(topic_summary.total_skill_count, 2)
        self.assertEqual(topic_summary.subtopic_count, 1)

    def test_get_topic_summary_by_id(self):
        topic_summary = topic_services.get_topic_summary_by_id(self.TOPIC_ID)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.canonical_story_count, 2)
        self.assertEqual(topic_summary.additional_story_count, 1)
        self.assertEqual(topic_summary.uncategorized_skill_count, 2)
        self.assertEqual(topic_summary.subtopic_count, 1)

    def test_get_all_skill_ids_assigned_to_some_topic(self):
        change_list = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_1
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, change_list,
            'Moved skill to subtopic.')
        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.user_id, 'Name 2', 'Description',
            [], [], [self.skill_id_1, 'skill_3'], [], 1
        )
        self.assertEqual(
            topic_services.get_all_skill_ids_assigned_to_some_topic(),
            set([self.skill_id_1, self.skill_id_2, 'skill_3']))

    def test_cannot_create_topic_change_class_with_invalid_changelist(self):
        with self.assertRaisesRegexp(
            Exception, 'Missing cmd key in change dict'):
            topic_domain.TopicChange({
                'invalid_cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': topic_domain.TOPIC_PROPERTY_DESCRIPTION,
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_cannot_update_topic_property_with_invalid_changelist(self):
        with self.assertRaisesRegexp(
            Exception, (
                'Value for property_name in cmd update_topic_property: '
                'invalid property is not allowed')):
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
                'property_name': 'invalid property',
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_cannot_update_subtopic_property_with_invalid_changelist(self):
        with self.assertRaisesRegexp(
            Exception, (
                'The following required attributes are '
                'missing: subtopic_id')):
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
                'property_name': 'invalid property',
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_update_subtopic_property(self):
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.subtopics[0].title, 'Title')

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY,
            'property_name': 'title',
            'subtopic_id': 1,
            'old_value': 'Title',
            'new_value': 'New Title'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Update title of subtopic.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.subtopics[0].title, 'New Title')

    def test_cannot_create_topic_change_class_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            Exception, 'Command invalid cmd is not allowed'):
            topic_domain.TopicChange({
                'cmd': 'invalid cmd',
                'property_name': 'title',
                'subtopic_id': 1,
                'old_value': 'Description',
                'new_value': 'New Description'
            })

    def test_publish_and_unpublish_story(self):
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.canonical_story_references[0].story_is_published, False)
        self.assertEqual(
            topic.additional_story_references[0].story_is_published, False)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id_1, self.user_id_admin)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id_3, self.user_id_admin)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.canonical_story_references[0].story_is_published, True)
        self.assertEqual(
            topic.additional_story_references[0].story_is_published, True)

        topic_services.unpublish_story(
            self.TOPIC_ID, self.story_id_1, self.user_id_admin)
        topic_services.unpublish_story(
            self.TOPIC_ID, self.story_id_3, self.user_id_admin)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.canonical_story_references[0].story_is_published, False)
        self.assertEqual(
            topic.additional_story_references[0].story_is_published, False)

    def test_invalid_publish_and_unpublish_story(self):
        with self.assertRaisesRegexp(
            Exception, 'A topic with the given ID doesn\'t exist'):
            topic_services.publish_story(
                'invalid_topic', 'story_id_new', self.user_id_admin)

        with self.assertRaisesRegexp(
            Exception, 'A topic with the given ID doesn\'t exist'):
            topic_services.unpublish_story(
                'invalid_topic', 'story_id_new', self.user_id_admin)

        with self.assertRaisesRegexp(
            Exception, 'The user does not have enough rights to publish the '
            'story.'):
            topic_services.publish_story(
                self.TOPIC_ID, self.story_id_3, self.user_id_b)

        with self.assertRaisesRegexp(
            Exception, 'The user does not have enough rights to unpublish the '
            'story.'):
            topic_services.unpublish_story(
                self.TOPIC_ID, self.story_id_3, self.user_id_b)

        with self.assertRaisesRegexp(
            Exception, 'A story with the given ID doesn\'t exist'):
            topic_services.publish_story(
                self.TOPIC_ID, 'invalid_story', self.user_id_admin)

        with self.assertRaisesRegexp(
            Exception, 'A story with the given ID doesn\'t exist'):
            topic_services.unpublish_story(
                self.TOPIC_ID, 'invalid_story', self.user_id_admin)

        self.save_new_story(
            'story_10', self.user_id, 'Title 2', 'Description 2', 'Notes',
            self.TOPIC_ID)
        with self.assertRaisesRegexp(
            Exception, 'Story with given id doesn\'t exist in the topic'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_10', self.user_id_admin)

        with self.assertRaisesRegexp(
            Exception, 'Story with given id doesn\'t exist in the topic'):
            topic_services.unpublish_story(
                self.TOPIC_ID, 'story_10', self.user_id_admin)

        # Throw error if a story node doesn't have an exploration.
        self.save_new_story(
            'story_id_new', self.user_id, 'Title 2', 'Description 2', 'Notes',
            self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.user_id_admin, self.TOPIC_ID, 'story_id_new')
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            })
        ]
        story_services.update_story(
            self.user_id_admin, 'story_id_new', changelist,
            'Added node.')

        with self.assertRaisesRegexp(
            Exception, 'Story node with id node_1 does not contain an '
            'exploration id.'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_id_new', self.user_id_admin)

        # Throw error if exploration isn't published.
        self.save_new_default_exploration(
            'exp_id', self.user_id_admin, title='title')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': 'node_1',
            'old_value': None,
            'new_value': 'exp_id'
        })]
        story_services.update_story(
            self.user_id_admin, 'story_id_new', change_list,
            'Updated story node.')

        with self.assertRaisesRegexp(
            Exception, 'Exploration with id exp_id isn\'t published.'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_id_new', self.user_id_admin)

        # Throws error if exploration doesn't exist.
        exp_services.delete_exploration(self.user_id_admin, 'exp_id')

        with self.assertRaisesRegexp(
            Exception, 'Exploration id exp_id doesn\'t exist.'):
            topic_services.publish_story(
                self.TOPIC_ID, 'story_id_new', self.user_id_admin)

    def test_update_topic(self):
        topic_services.assign_role(
            self.user_admin, self.user_a, topic_domain.ROLE_MANAGER,
            self.TOPIC_ID)

        # Test whether an admin can edit a topic.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_DESCRIPTION,
            'old_value': 'Description',
            'new_value': 'New Description'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated Description.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_services.get_topic_summary_by_id(self.TOPIC_ID)
        self.assertEqual(topic.description, 'New Description')
        self.assertEqual(topic.version, 3)
        self.assertEqual(topic_summary.version, 3)

        # Test whether a topic_manager can edit a topic.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_NAME,
            'old_value': 'Name',
            'new_value': 'New Name'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_a, self.TOPIC_ID, changelist, 'Updated Name.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_services.get_topic_summary_by_id(self.TOPIC_ID)
        self.assertEqual(topic.name, 'New Name')
        self.assertEqual(topic.version, 4)
        self.assertEqual(topic_summary.name, 'New Name')
        self.assertEqual(topic_summary.version, 4)

    def test_update_topic_and_subtopic_page(self):
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title3',
            'subtopic_id': 3
        })]
        with self.assertRaisesRegexp(
            Exception, 'The given new subtopic id 3 is not equal to '
            'the expected next subtopic id: 2'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Added subtopic.')

        # Test whether the subtopic page was created for the above failed
        # attempt.
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 3, strict=False)
        self.assertIsNone(subtopic_page)

        # Test exception raised for simultaneous adding and removing of
        # subtopics.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title2',
                'subtopic_id': 2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
                'subtopic_id': 2
            })
        ]
        with self.assertRaisesRegexp(
            Exception, 'The incoming changelist had simultaneous'
            ' creation and deletion of subtopics.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Added and deleted a subtopic.')

        # Test whether a subtopic page already existing in datastore can be
        # edited.
        changelist = [subtopic_page_domain.SubtopicPageChange({
            'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
            'property_name': (
                subtopic_page_domain.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
            'old_value': '',
            'subtopic_id': 1,
            'new_value': {
                'html': '<p>New Value</p>',
                'content_id': 'content'
            }
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated html data')
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1)
        self.assertEqual(
            subtopic_page.page_contents.subtitled_html.html,
            '<p>New Value</p>')

        # Test a sequence of changes with both topic and subtopic page changes.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title2',
                'subtopic_id': 2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
                'subtopic_id': 1
            }),
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'property_name': (
                    subtopic_page_domain
                    .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'subtopic_id': 2,
                'new_value': {
                    'html': '<p>New Value</p>',
                    'content_id': 'content'
                }
            }),
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'property_name': (
                    subtopic_page_domain
                    .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO),
                'old_value': {
                    'voiceovers_mapping': {
                        'content': {}
                    }
                },
                'new_value': {
                    'voiceovers_mapping': {
                        'content': {
                            'en': {
                                'filename': 'test.mp3',
                                'file_size_bytes': 100,
                                'needs_update': False
                            }
                        }
                    }
                },
                'subtopic_id': 2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': 2,
                'skill_id': self.skill_id_1
            })
        ]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Added and removed a subtopic.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.next_subtopic_id, 3)
        self.assertEqual(topic.subtopics[0].title, 'Title2')
        self.assertEqual(topic.subtopics[0].skill_ids, [self.skill_id_1])

        # Test whether the subtopic page corresponding to the deleted subtopic
        # was also deleted.
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1, strict=False)
        self.assertIsNone(subtopic_page)
        # Validate the newly created subtopic page.
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 2, strict=False)
        self.assertEqual(
            subtopic_page.page_contents.subtitled_html.html,
            '<p>New Value</p>')
        self.assertEqual(
            subtopic_page.page_contents.recorded_voiceovers.to_dict(), {
                'voiceovers_mapping': {
                    'content': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False
                        }
                    }
                }
            })

        # Making sure everything resets when an error is encountered anywhere.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title3',
                'subtopic_id': 3
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title4',
                'subtopic_id': 4
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
                'subtopic_id': 2
            }),
            # The following is an invalid command as subtopic with id 2 was
            # deleted in previous step.
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'property_name': (
                    subtopic_page_domain
                    .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
                'old_value': '',
                'subtopic_id': 2,
                'new_value': {
                    'html': '<p>New Value</p>',
                    'content_id': 'content'
                }
            }),
        ]
        with self.assertRaisesRegexp(
            Exception, 'The subtopic with id 2 doesn\'t exist'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Done some changes.')

        # Make sure the topic object in datastore is not affected.
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.next_subtopic_id, 3)
        self.assertEqual(topic.subtopics[0].title, 'Title2')
        self.assertEqual(topic.subtopics[0].skill_ids, [self.skill_id_1])

        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 3, strict=False)
        self.assertIsNone(subtopic_page)
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 4, strict=False)
        self.assertIsNone(subtopic_page)
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 2, strict=False)
        self.assertIsNotNone(subtopic_page)


    def test_add_uncategorized_skill(self):
        topic_services.add_uncategorized_skill(
            self.user_id_admin, self.TOPIC_ID, 'skill_id_3')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.uncategorized_skill_ids,
            [self.skill_id_1, self.skill_id_2, 'skill_id_3'])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added skill_id_3 to uncategorized skill ids')

    def test_delete_uncategorized_skill(self):
        topic_services.delete_uncategorized_skill(
            self.user_id_admin, self.TOPIC_ID, self.skill_id_1)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.uncategorized_skill_ids, [self.skill_id_2])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Removed %s from uncategorized skill ids' % self.skill_id_1)

    def test_delete_canonical_story(self):
        topic_services.delete_canonical_story(
            self.user_id_admin, self.TOPIC_ID, self.story_id_1)

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.canonical_story_references), 1)
        self.assertEqual(
            topic.canonical_story_references[0].story_id, self.story_id_2)
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Removed %s from canonical story ids' % self.story_id_1)

    def test_add_canonical_story(self):
        topic_services.add_canonical_story(
            self.user_id_admin, self.TOPIC_ID, 'story_id')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            len(topic.canonical_story_references), 3)
        self.assertEqual(
            topic.canonical_story_references[2].story_id, 'story_id')
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added %s to canonical story ids' % 'story_id')

    def test_delete_additional_story(self):
        topic_services.delete_additional_story(
            self.user_id_admin, self.TOPIC_ID, self.story_id_3)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(len(topic.additional_story_references), 0)

        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Removed %s from additional story ids' % self.story_id_3)

    def test_add_additional_story(self):
        topic_services.add_additional_story(
            self.user_id_admin, self.TOPIC_ID, 'story_id_4')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            len(topic.additional_story_references), 2)
        self.assertEqual(
            topic.additional_story_references[1].story_id, 'story_id_4')
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 3)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added story_id_4 to additional story ids')

    def test_delete_topic(self):
        # Test whether an admin can delete a topic.
        topic_services.delete_topic(self.user_id_admin, self.TOPIC_ID)
        self.assertIsNone(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID, strict=False))
        self.assertIsNone(
            topic_services.get_topic_summary_by_id(self.TOPIC_ID, strict=False))
        self.assertIsNone(
            subtopic_page_services.get_subtopic_page_by_id(
                self.TOPIC_ID, 1, strict=False))

    def test_delete_subtopic_with_skill_ids(self):
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_DELETE_SUBTOPIC,
            'subtopic_id': self.subtopic_id
        })]
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1, strict=False)
        self.assertEqual(subtopic_page.id, self.TOPIC_ID + '-1')
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Removed 1 subtopic.')
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1, strict=False)
        self.assertIsNone(subtopic_page)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.uncategorized_skill_ids, [self.skill_id_1, self.skill_id_2])
        self.assertEqual(topic.subtopics, [])

    def test_update_subtopic_skill_ids(self):
        # Adds a subtopic and moves skill id from one to another.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': self.skill_id_1
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': self.subtopic_id,
                'skill_id': self.skill_id_2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'title': 'Title2',
                'subtopic_id': 2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': self.subtopic_id,
                'new_subtopic_id': 2,
                'skill_id': self.skill_id_2
            })
        ]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic.id, 2)
        self.assertEqual(topic.uncategorized_skill_ids, [])
        self.assertEqual(topic.subtopics[0].skill_ids, [self.skill_id_1])
        self.assertEqual(topic.subtopics[1].skill_ids, [self.skill_id_2])
        self.assertEqual(topic.subtopics[1].id, 2)
        self.assertEqual(topic.next_subtopic_id, 3)
        self.assertEqual(subtopic_page.topic_id, topic.id)
        self.assertEqual(subtopic_page.id, self.TOPIC_ID + '-2')

        # Tests invalid case where skill id is not present in the old subtopic.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': self.subtopic_id,
                'new_subtopic_id': 2,
                'skill_id': self.skill_id_2
            })
        ]
        with self.assertRaisesRegexp(
            Exception,
            'Skill id %s is not present in the given old subtopic'
            % self.skill_id_2):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

        # Tests invalid case where skill id is not an uncategorized skill id.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
                'old_subtopic_id': None,
                'new_subtopic_id': 2,
                'skill_id': 'skill_10'
            })
        ]
        with self.assertRaisesRegexp(
            Exception,
            'Skill id skill_10 is not an uncategorized skill id'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

        # Tests invalid case where target subtopic doesn't exist.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': self.subtopic_id,
            'new_subtopic_id': None,
            'skill_id': self.skill_id_1
        })]
        with self.assertRaisesRegexp(
            Exception, 'The subtopic with id None does not exist.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

        # Tests valid case skill id removal case.
        changelist = [
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                'subtopic_id': 2,
                'skill_id': self.skill_id_2
            }),
            topic_domain.TopicChange({
                'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                'subtopic_id': self.subtopic_id,
                'skill_id': self.skill_id_1
            })
        ]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.uncategorized_skill_ids, [self.skill_id_2, self.skill_id_1])
        self.assertEqual(topic.subtopics[1].skill_ids, [])
        self.assertEqual(topic.subtopics[0].skill_ids, [])

        # Tests invalid case where skill id is not present in the subtopic
        # from which it is to be removed.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
            'subtopic_id': self.subtopic_id,
            'skill_id': 'skill_10'
        })]
        with self.assertRaisesRegexp(
            Exception,
            'Skill id skill_10 is not present in the old subtopic'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id_admin, self.TOPIC_ID, changelist,
                'Updated subtopic skill ids.')

    def test_admin_can_manage_topic(self):
        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_admin, topic_rights))

    def test_publish_and_unpublish_topic(self):
        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)
        topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)

        with self.assertRaisesRegexp(
            Exception,
            'The user does not have enough rights to unpublish the topic.'):
            topic_services.unpublish_topic(self.TOPIC_ID, self.user_id_a)

        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_rights.topic_is_published)

        topic_services.unpublish_topic(self.TOPIC_ID, self.user_id_admin)
        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)

        with self.assertRaisesRegexp(
            Exception,
            'The user does not have enough rights to publish the topic.'):
            topic_services.publish_topic(self.TOPIC_ID, self.user_id_a)

    def test_create_new_topic_rights(self):
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_non_admin_cannot_assign_roles(self):
        with self.assertRaisesRegexp(
            Exception,
            'UnauthorizedUserException: Could not assign new role.'):
            topic_services.assign_role(
                self.user_b, self.user_a,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_role_cannot_be_assigned_to_non_topic_manager(self):
        with self.assertRaisesRegexp(
            Exception,
            'The assignee doesn\'t have enough rights to become a manager.'):
            topic_services.assign_role(
                self.user_admin, self.user_b,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

    def test_manager_cannot_assign_roles(self):
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        with self.assertRaisesRegexp(
            Exception,
            'UnauthorizedUserException: Could not assign new role.'):
            topic_services.assign_role(
                self.user_a, self.user_b,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_get_all_topic_rights_of_user(self):
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, self.TOPIC_ID)
        topic_rights = topic_services.get_topic_rights_with_user(self.user_id_a)
        self.assertEqual(len(topic_rights), 1)
        self.assertEqual(topic_rights[0].id, self.TOPIC_ID)
        self.assertEqual(topic_rights[0].manager_ids, [self.user_id_a])

    def test_cannot_save_new_topic_with_existing_name(self):
        with self.assertRaisesRegexp(
            Exception, 'Topic with name \'Name\' already exists'):
            self.save_new_topic(
                'topic_2', self.user_id, 'Name', 'Description 2',
                [], [], [], [], 1)

    def test_update_topic_language_code(self):
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.language_code, 'en')

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE,
            'old_value': 'en',
            'new_value': 'bn'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id, self.TOPIC_ID, changelist, 'Change language code')

        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.language_code, 'bn')

    def test_cannot_update_topic_and_subtopic_pages_with_empty_changelist(self):
        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save topic'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, [], 'commit message')

    def test_cannot_update_topic_and_subtopic_pages_with_mismatch_of_versions(
            self):
        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic_model.version = 0
        topic_model.commit(self.user_id, 'changed version', [])

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE,
            'old_value': 'en',
            'new_value': 'bn'
        })]

        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: trying to update version 1 of topic '
            'from version 2. Please reload the page and try again.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, changelist, 'change language_code')

        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic_model.version = 100
        topic_model.commit(self.user_id, 'changed version', [])

        with self.assertRaisesRegexp(
            Exception,
            'Trying to update version 101 of topic from version 2, '
            'which is too old. Please reload the page and try again.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, changelist, 'change language_code')

    def test_cannot_update_topic_and_subtopic_pages_with_empty_commit_message(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Expected a commit message, received none.'):
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, self.TOPIC_ID, [], None)

    def test_cannot_publish_topic_with_no_topic_rights(self):
        with self.assertRaisesRegexp(
            Exception, 'The given topic does not exist'):
            topic_services.publish_topic('invalid_topic_id', self.user_id_admin)

    def test_cannot_publish_a_published_topic(self):
        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)

        topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)
        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_rights.topic_is_published)

        with self.assertRaisesRegexp(
            Exception, 'The topic is already published.'):
            topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)

    def test_cannot_unpublish_topic_with_no_topic_rights(self):
        with self.assertRaisesRegexp(
            Exception, 'The given topic does not exist'):
            topic_services.unpublish_topic(
                'invalid_topic_id', self.user_id_admin)

    def test_cannot_unpublish_an_unpublished_topic(self):
        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertFalse(topic_rights.topic_is_published)

        with self.assertRaisesRegexp(
            Exception, 'The topic is already unpublished.'):
            topic_services.unpublish_topic(self.TOPIC_ID, self.user_id_admin)

    def test_cannot_edit_topic_with_no_topic_rights(self):
        self.assertFalse(topic_services.check_can_edit_topic(self.user_a, None))

    def test_cannot_assign_role_with_invalid_role(self):
        with self.assertRaisesRegexp(Exception, 'Invalid role'):
            topic_services.assign_role(
                self.user_admin, self.user_a, 'invalid_role', self.TOPIC_ID)

    def test_deassign_user_from_all_topics(self):
        self.save_new_topic(
            'topic_2', self.user_id, 'Name 2', 'Description 2',
            [], [], [], [], 1)
        self.save_new_topic(
            'topic_3', self.user_id, 'Name 3', 'Description 3',
            [], [], [], [], 1)

        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, self.TOPIC_ID)
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, 'topic_2')
        topic_rights = topic_services.get_topic_rights_with_user(self.user_id_a)
        self.assertEqual(len(topic_rights), 2)

        topic_services.deassign_user_from_all_topics(
            self.user_admin, self.user_id_a)
        topic_rights = topic_services.get_topic_rights_with_user(self.user_id_a)
        self.assertEqual(len(topic_rights), 0)

    def test_reassigning_manager_role_to_same_user(self):
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, self.TOPIC_ID)
        with self.assertRaisesRegexp(
            Exception, 'This user already is a manager for this topic'):
            topic_services.assign_role(
                self.user_admin, self.user_a,
                topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)
        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_deassigning_manager_role(self):
        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_MANAGER, self.TOPIC_ID)

        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_NONE, self.TOPIC_ID)

        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

        topic_services.assign_role(
            self.user_admin, self.user_a,
            topic_domain.ROLE_NONE, self.TOPIC_ID)

        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))


# TODO(lilithxxx): Remove this mock class and the SubtopicMigrationTests class
# once the actual functions for subtopic migrations are implemented.
# See issue: https://github.com/oppia/oppia/issues/7009.
class MockTopicObject(topic_domain.Topic):
    """Mocks Topic domain object."""

    @classmethod
    def _convert_subtopic_v1_dict_to_v2_dict(cls, subtopic):
        """Converts v1 subtopic dict to v2."""
        return subtopic

    @classmethod
    def _convert_story_reference_v1_dict_to_v2_dict(cls, story_reference):
        """Converts v1 story reference dict to v2."""
        return story_reference


class SubtopicMigrationTests(test_utils.GenericTestBase):

    def test_migrate_subtopic_to_latest_schema(self):
        topic_services.create_new_topic_rights('topic_id', 'user_id_admin')
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        subtopic_dict = {
            'id': 1,
            'title': 'subtopic_title',
            'skill_ids': []
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name',
            canonical_name='Name',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=1,
            story_reference_schema_version=1
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'topic model created', commit_cmd_dicts)

        swap_topic_object = self.swap(topic_domain, 'Topic', MockTopicObject)
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_SCHEMA_VERSION', 2)

        with swap_topic_object, current_schema_version_swap:
            topic = topic_fetchers.get_topic_from_model(model)

        self.assertEqual(topic.subtopic_schema_version, 2)
        self.assertEqual(topic.name, 'name')
        self.assertEqual(topic.canonical_name, 'name')
        self.assertEqual(topic.next_subtopic_id, 1)
        self.assertEqual(topic.language_code, 'en')
        self.assertEqual(len(topic.subtopics), 1)
        self.assertEqual(topic.subtopics[0].to_dict(), subtopic_dict)


class StoryReferenceMigrationTests(test_utils.GenericTestBase):

    def test_migrate_story_reference_to_latest_schema(self):
        topic_services.create_new_topic_rights('topic_id', 'user_id_admin')
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        story_reference_dict = {
            'story_id': 'story_id',
            'story_is_published': False
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name',
            canonical_name='Name',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            canonical_story_references=[story_reference_dict]
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            'user_id_admin', 'topic model created', commit_cmd_dicts)

        swap_topic_object = self.swap(topic_domain, 'Topic', MockTopicObject)
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_REFERENCE_SCHEMA_VERSION', 2)

        with swap_topic_object, current_schema_version_swap:
            topic = topic_fetchers.get_topic_from_model(model)

        self.assertEqual(topic.story_reference_schema_version, 2)
        self.assertEqual(topic.name, 'name')
        self.assertEqual(topic.canonical_name, 'name')
        self.assertEqual(topic.next_subtopic_id, 1)
        self.assertEqual(topic.language_code, 'en')
        self.assertEqual(len(topic.canonical_story_references), 1)
        self.assertEqual(
            topic.canonical_story_references[0].to_dict(), story_reference_dict)
