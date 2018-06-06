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

"""Tests for topic domain objects."""

from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class TopicServicesUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""
    user_id = 'user_id'
    story_id_1 = 'story_1'
    story_id_2 = 'story_2'
    story_id_3 = 'story_3'
    skill_id = 'skill'

    def setUp(self):
        super(TopicServicesUnitTests, self).setUp()
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.topic = self.save_new_topic(
            self.TOPIC_ID, self.user_id, 'Name', 'Description',
            [self.story_id_1, self.story_id_2], [self.story_id_3],
            [self.skill_id], []
        )
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

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
        self.assertEqual(topic_summary.skill_count, 1)

    def test_get_new_topic_id(self):
        new_topic_id = topic_services.get_new_topic_id()

        self.assertEqual(len(new_topic_id), 12)
        self.assertEqual(topic_models.TopicModel.get_by_id(new_topic_id), None)

    def test_get_topic_from_model(self):
        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic = topic_services.get_topic_from_model(topic_model)

        self.assertEqual(topic.to_dict(), self.topic.to_dict())

    def test_get_topic_summary_from_model(self):
        topic_summary_model = topic_models.TopicSummaryModel.get(self.TOPIC_ID)
        topic_summary = topic_services.get_topic_summary_from_model(
            topic_summary_model)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.canonical_story_count, 2)
        self.assertEqual(topic_summary.additional_story_count, 1)
        self.assertEqual(topic_summary.skill_count, 1)

    def test_get_topic_by_id(self):
        expected_topic = self.topic.to_dict()
        topic = topic_services.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.to_dict(), expected_topic)

    def test_commit_log_entry(self):
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 1)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'create')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id)

    def test_get_topic_summary_by_id(self):
        topic_summary = topic_services.get_topic_summary_by_id(self.TOPIC_ID)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.canonical_story_count, 2)
        self.assertEqual(topic_summary.additional_story_count, 1)
        self.assertEqual(topic_summary.skill_count, 1)

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
        topic_services.update_topic(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated Description.')
        topic = topic_services.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_services.get_topic_summary_by_id(self.TOPIC_ID)
        self.assertEqual(topic.description, 'New Description')
        self.assertEqual(topic.version, 2)
        self.assertEqual(topic_summary.version, 2)

        # Test whether a topic_manager can edit a topic.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_NAME,
            'old_value': 'Name',
            'new_value': 'New Name'
        })]
        topic_services.update_topic(
            self.user_id_a, self.TOPIC_ID, changelist, 'Updated Name.')
        topic = topic_services.get_topic_by_id(self.TOPIC_ID)
        topic_summary = topic_services.get_topic_summary_by_id(self.TOPIC_ID)
        self.assertEqual(topic.name, 'New Name')
        self.assertEqual(topic.version, 3)
        self.assertEqual(topic_summary.name, 'New Name')
        self.assertEqual(topic_summary.version, 3)

    def test_add_skill(self):
        topic_services.add_skill(
            self.user_id_admin, self.TOPIC_ID, 'skill_id_2')
        topic = topic_services.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.skill_ids, [self.skill_id, 'skill_id_2'])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 2)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added skill_id_2 to skill ids')

    def test_delete_skill(self):
        topic_services.delete_skill(
            self.user_id_admin, self.TOPIC_ID, self.skill_id)
        topic = topic_services.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.skill_ids, [])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 2)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Removed %s from skill ids' % self.skill_id)

    def test_delete_story(self):
        topic_services.delete_story(
            self.user_id_admin, self.TOPIC_ID, self.story_id_1)
        topic = topic_services.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.canonical_story_ids, [self.story_id_2])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 2)
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
        topic = topic_services.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(
            topic.canonical_story_ids,
            [self.story_id_1, self.story_id_2, 'story_id'])
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 2)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'edit')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id_admin)
        self.assertEqual(
            topic_commit_log_entry.commit_message,
            'Added %s to canonical story ids' % 'story_id')

    def test_delete_topic(self):
        # Test whether an admin can delete a topic.
        topic_services.delete_topic(self.user_id_admin, self.TOPIC_ID)
        self.assertEqual(
            topic_services.get_topic_by_id(self.TOPIC_ID, strict=False), None)
        self.assertEqual(
            topic_services.get_topic_summary_by_id(
                self.TOPIC_ID, strict=False), None)

    def test_admin_can_manage_topic(self):
        topic_rights = topic_services.get_topic_rights(self.TOPIC_ID)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_admin, topic_rights))

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
