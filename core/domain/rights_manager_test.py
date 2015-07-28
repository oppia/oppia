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

"""Tests for classes and methods relating to user rights."""

__author__ = 'Sean Lip'

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
import feconf
import test_utils


class ExplorationRightsTests(test_utils.GenericTestBase):
    """Test that rights for actions on explorations work as expected."""

    def setUp(self):
        super(ExplorationRightsTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup('c@example.com', 'C')
        self.signup('d@example.com', 'D')
        self.signup('e@example.com', 'E')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_admins([self.ADMIN_EMAIL])

        self.EXP_ID = 'exp_id'

    def test_demo_exploration(self):
        exp_services.load_demo('1')
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, '1')

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(
                self.user_id_admin).can_view(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(
                self.user_id_admin).can_delete(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, '1'))

    def test_non_splash_page_demo_exploration(self):
        # Note: there is no difference between permissions for demo
        # explorations, whether or not they are on the splash page.
        exp_services.load_demo('3')
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, '3')

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(rights_manager.Actor(
            self.user_id_a).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertFalse(rights_manager.Actor(
            self.user_id_a).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(rights_manager.Actor(
            self.user_id_admin).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(
            rights_manager.Actor(
                self.user_id_admin).can_delete(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, '3'))

    def test_ownership(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).is_owner(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).is_owner(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).is_owner(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_newly_created_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_inviting_collaborator(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_inviting_playtester(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_setting_rights(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_id_b, self.EXP_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_id_b, self.EXP_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_OWNER)

        rights_manager.assign_role_for_exploration(
            self.user_id_b, self.EXP_ID, self.user_id_c,
            rights_manager.ROLE_OWNER)
        rights_manager.assign_role_for_exploration(
            self.user_id_b, self.EXP_ID, self.user_id_d,
            rights_manager.ROLE_EDITOR)
        rights_manager.assign_role_for_exploration(
            self.user_id_b, self.EXP_ID, self.user_id_e,
            rights_manager.ROLE_VIEWER)

    def test_publishing_and_unpublishing_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_unpublish(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.unpublish_exploration(self.user_id_admin, self.EXP_ID)
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_cannot_delete_published_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)
        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_can_unpublish_and_delete_published_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)
        rights_manager.unpublish_exploration(self.user_id_admin, self.EXP_ID)
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

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
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)

        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_publicize(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_publicize(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_changing_viewability(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertTrue(rights_manager.Actor(
            self.user_id_a).can_change_private_viewability(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(rights_manager.Actor(
            self.user_id_b).can_change_private_viewability(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(rights_manager.Actor(
            self.user_id_admin).can_change_private_viewability(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        with self.assertRaisesRegexp(Exception, 'already the current value'):
            rights_manager.set_private_viewability_of_exploration(
                self.user_id_a, self.EXP_ID, False)
        with self.assertRaisesRegexp(Exception, 'cannot be changed'):
            rights_manager.set_private_viewability_of_exploration(
                self.user_id_b, self.EXP_ID, True)

        rights_manager.set_private_viewability_of_exploration(
            self.user_id_a, self.EXP_ID, True)
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.set_private_viewability_of_exploration(
            self.user_id_a, self.EXP_ID, False)
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)
        self.assertFalse(rights_manager.Actor(
            self.user_id_a).can_change_private_viewability(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.unpublish_exploration(self.user_id_admin, self.EXP_ID)
        self.assertTrue(rights_manager.Actor(
            self.user_id_a).can_change_private_viewability(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(rights_manager.Actor(
            self.user_id_b).can_change_private_viewability(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(rights_manager.Actor(
            self.user_id_admin).can_change_private_viewability(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
