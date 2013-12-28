# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Tests for classes and methods relating to user rights."""

__author__ = 'Sean Lip'

from core.domain import exp_services
from core.domain import rights_manager
import test_utils


class ExplorationRightsTests(test_utils.GenericTestBase):
    """Test that rights for actions on explorations work as expected."""

    def setUp(self):
        super(ExplorationRightsTests, self).setUp()
        self.register_editor('a@example.com', 'A')
        self.register_editor('b@example.com', 'B')
        self.register_editor('c@example.com', 'C')
        self.register_editor('d@example.com', 'D')
        self.register_editor('e@example.com', 'E')
        self.register_editor('admin@example.com', 'adm')

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_admin = self.get_user_id_from_email('admin@example.com')

    def test_demo_exploration(self):
        exp_services.load_demo('0')

        self.assertTrue(rights_manager.Actor(self.user_id_a).can_view('0'))
        self.assertFalse(rights_manager.Actor(self.user_id_a).can_edit('0'))
        self.assertFalse(rights_manager.Actor(self.user_id_a).can_delete('0'))

        # TODO(sll): Rewrite things so that this and other logins are not
        # needed.
        self.login('admin@example.com', is_admin=True)
        self.assertTrue(rights_manager.Actor(self.user_id_admin).can_view('0'))
        self.assertTrue(rights_manager.Actor(self.user_id_admin).can_edit('0'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_delete('0'))
        self.logout()

    def test_ownership(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')

        rights_manager.assign_role(
            self.user_id_a, eid, self.user_id_b, rights_manager.ROLE_EDITOR)

        self.assertTrue(rights_manager.Actor(self.user_id_a).is_owner(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).is_owner(eid))

        self.login('admin@example.com', is_admin=True)
        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).is_owner(eid))
        self.logout()

    def test_newly_created_exploration(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')

        self.assertTrue(rights_manager.Actor(self.user_id_a).can_view(eid))
        self.assertTrue(rights_manager.Actor(self.user_id_a).can_edit(eid))
        self.assertTrue(rights_manager.Actor(self.user_id_a).can_delete(eid))

        self.login('admin@example.com', is_admin=True)
        self.assertTrue(rights_manager.Actor(self.user_id_admin).can_view(eid))
        self.assertTrue(rights_manager.Actor(self.user_id_admin).can_edit(eid))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_delete(eid))
        self.logout()

        self.assertFalse(rights_manager.Actor(self.user_id_b).can_view(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_edit(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_delete(eid))

    def test_inviting_collaborator(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')

        rights_manager.assign_role(
            self.user_id_a, eid, self.user_id_b, rights_manager.ROLE_EDITOR)

        self.assertTrue(rights_manager.Actor(self.user_id_b).can_view(eid))
        self.assertTrue(rights_manager.Actor(self.user_id_b).can_edit(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_delete(eid))

    def test_inviting_playtester(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')

        self.assertFalse(rights_manager.Actor(self.user_id_b).can_view(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_edit(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_delete(eid))

        rights_manager.assign_role(
            self.user_id_a, eid, self.user_id_b, rights_manager.ROLE_VIEWER)

        self.assertTrue(rights_manager.Actor(self.user_id_b).can_view(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_edit(eid))
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_delete(eid))

    def test_setting_rights(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')

        rights_manager.assign_role(
            self.user_id_a, eid, self.user_id_b, rights_manager.ROLE_VIEWER)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role(
                self.user_id_b, eid, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role(
            self.user_id_a, eid, self.user_id_b, rights_manager.ROLE_EDITOR)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role(
                self.user_id_b, eid, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role(
            self.user_id_a, eid, self.user_id_b, rights_manager.ROLE_OWNER)

        rights_manager.assign_role(
            self.user_id_b, eid, self.user_id_c, rights_manager.ROLE_OWNER)
        rights_manager.assign_role(
            self.user_id_b, eid, self.user_id_d, rights_manager.ROLE_EDITOR)
        rights_manager.assign_role(
            self.user_id_b, eid, self.user_id_e, rights_manager.ROLE_VIEWER)

    def test_publishing_exploration(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')

        rights_manager.publish_exploration(self.user_id_a, eid)
        self.assertTrue(rights_manager.Actor(self.user_id_b).can_view(eid))

        rights_manager.unpublish_exploration(self.user_id_a, eid)
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_view(eid))

    def test_cannot_delete_published_exploration(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')
        rights_manager.publish_exploration(self.user_id_a, eid)
        self.assertFalse(rights_manager.Actor(self.user_id_a).can_delete(eid))

    def test_can_unpublish_and_delete_published_exploration(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')
        rights_manager.publish_exploration(self.user_id_a, eid)
        rights_manager.unpublish_exploration(self.user_id_a, eid)
        self.assertTrue(rights_manager.Actor(self.user_id_a).can_delete(eid))

    def test_cloned_explorations_cannot_be_published(self):
        eid = exp_services.create_new(
            self.user_id_a, 'New exploration', 'A category')
        rights_manager.publish_exploration(self.user_id_a, eid)

        new_eid = exp_services.clone_exploration(self.user_id_b, eid)
        self.assertFalse(rights_manager.Actor(self.user_id_b).can_edit(eid))

        self.assertTrue(rights_manager.Actor(self.user_id_b).can_view(new_eid))
        self.assertTrue(rights_manager.Actor(self.user_id_b).can_edit(new_eid))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_publish(new_eid))

    def test_cannot_unpublish_exploration_after_edited(self):
        # User A creates an exploration, marks it private.
        # User A publishes the exploration.
        # User B submits a change.
        # User A cannot unpublish the exploration.
        pass

    def test_anyone_can_submit_a_fix(self):
        # User A creates an exploration, marks it private.
        # User A submits a change.
        # User B submits a change.
        pass

    def test_can_publicize_exploration(self):
        # User A creates an exploration, marks it private.
        # User A publishes the exploration.
        # User A cannot publicize the exploration.
        # Admin can publicize the exploration.
        pass


class PageRightsTest(test_utils.GenericTestBase):
    """Test which pages can be viewed by different users."""
    pass
