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
from core.tests import test_utils


class TopicServicesUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""
    topic_id = 'topic_id'

    def setUp(self):
        super(TopicServicesUnitTests, self).setUp()
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

    def test_admin_can_manage_topic(self):
        topic_services.create_new_topic_rights(
            self.topic_id, self.user_id_admin)
        topic_rights = topic_services.get_topic_rights(self.topic_id)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_admin, topic_rights))

    def test_create_new_topic_rights(self):
        topic_services.create_new_topic_rights(
            self.topic_id, self.user_id_admin)
        topic_services.assign_role(
            self.user_admin, self.user_id_a,
            topic_domain.ROLE_MANAGER, self.topic_id)

        topic_rights = topic_services.get_topic_rights(self.topic_id)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_non_admin_cannot_assign_roles(self):
        topic_services.create_new_topic_rights(
            self.topic_id, self.user_id_admin)
        with self.assertRaisesRegexp(
            Exception,
            'UnauthorizedUserException: Could not assign new role.'):
            topic_services.assign_role(
                self.user_b, self.user_id_a,
                topic_domain.ROLE_MANAGER, self.topic_id)

        topic_rights = topic_services.get_topic_rights(self.topic_id)
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_manager_cannot_assign_roles(self):
        topic_services.create_new_topic_rights(
            self.topic_id, self.user_id_admin)
        topic_services.assign_role(self.user_admin, self.user_id_a,
                topic_domain.ROLE_MANAGER, self.topic_id)
        with self.assertRaisesRegexp(
            Exception,
            'UnauthorizedUserException: Could not assign new role.'):
            topic_services.assign_role(
                self.user_a, self.user_id_b,
                topic_domain.ROLE_MANAGER, self.topic_id)

        topic_rights = topic_services.get_topic_rights(self.topic_id)
        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_reassigning_manager_role_to_same_user(self):
        topic_services.create_new_topic_rights(
            self.topic_id, self.user_id_admin)
        topic_services.assign_role(
            self.user_admin, self.user_id_a,
            topic_domain.ROLE_MANAGER, self.topic_id)
        with self.assertRaisesRegexp(
            Exception, 'This user already is a manager for this topic'):
            topic_services.assign_role(
                self.user_admin, self.user_id_a,
                topic_domain.ROLE_MANAGER, self.topic_id)

        topic_rights = topic_services.get_topic_rights(self.topic_id)
        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

    def test_deassigning_manager_role(self):
        topic_services.create_new_topic_rights(
            self.topic_id, self.user_id_admin)
        topic_services.assign_role(
            self.user_admin, self.user_id_a,
            topic_domain.ROLE_MANAGER, self.topic_id)

        topic_rights = topic_services.get_topic_rights(self.topic_id)

        self.assertTrue(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

        topic_services.assign_role(
            self.user_admin, self.user_id_a,
            topic_domain.ROLE_NONE, self.topic_id)

        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))

        topic_services.assign_role(
            self.user_admin, self.user_id_a,
            topic_domain.ROLE_NONE, self.topic_id)

        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_a, topic_rights))
        self.assertFalse(topic_services.check_can_edit_topic(
            self.user_b, topic_rights))
