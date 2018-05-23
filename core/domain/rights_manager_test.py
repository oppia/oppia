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

from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils


class ExplorationRightsTests(test_utils.GenericTestBase):
    """Test that rights for actions on explorations work as expected."""

    EXP_ID = 'exp_id'

    def setUp(self):
        super(ExplorationRightsTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup('c@example.com', 'C')
        self.signup('d@example.com', 'D')
        self.signup('e@example.com', 'E')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, username=self.MODERATOR_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id_moderator = self.get_user_id_from_email(
            self.MODERATOR_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)
        self.user_c = user_services.UserActionsInfo(self.user_id_c)
        self.user_d = user_services.UserActionsInfo(self.user_id_d)
        self.user_e = user_services.UserActionsInfo(self.user_id_e)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)
        self.user_moderator = user_services.UserActionsInfo(
            self.user_id_moderator)
        self.system_user = user_services.get_system_user()

    def test_get_exploration_rights_for_nonexistent_exploration(self):
        non_exp_id = 'this_exp_does_not_exist_id'

        with self.assertRaisesRegexp(
            Exception,
            'Entity for class ExplorationRightsModel with id '
            'this_exp_does_not_exist_id not found'
            ):
            rights_manager.get_exploration_rights(non_exp_id)

        self.assertIsNone(
            rights_manager.get_exploration_rights(non_exp_id, strict=False))

    def test_demo_exploration(self):
        exp_services.load_demo('1')
        rights_manager.release_ownership_of_exploration(
            self.system_user, '1')
        exp_rights = rights_manager.get_exploration_rights('1')

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_a, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_moderator, exp_rights))

    def test_non_splash_page_demo_exploration(self):
        # Note: there is no difference between permissions for demo
        # explorations, whether or not they are on the splash page.
        exp_services.load_demo('3')
        rights_manager.release_ownership_of_exploration(
            self.system_user, '3')
        exp_rights = rights_manager.get_exploration_rights('3')

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_a, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_moderator, exp_rights))

    def test_ownership_of_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_a))
        self.assertFalse(exp_rights.is_owner(self.user_id_b))
        self.assertFalse(exp_rights.is_owner(self.user_id_admin))

    def test_newly_created_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_moderator, exp_rights))

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, exp_rights))

    def test_inviting_collaborator_to_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, exp_rights))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, exp_rights))

    def test_inviting_playtester_to_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, exp_rights))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, exp_rights))

    def test_setting_rights_of_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_b, self.EXP_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_b, self.EXP_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_OWNER)

        rights_manager.assign_role_for_exploration(
            self.user_b, self.EXP_ID, self.user_id_c,
            rights_manager.ROLE_OWNER)
        rights_manager.assign_role_for_exploration(
            self.user_b, self.EXP_ID, self.user_id_d,
            rights_manager.ROLE_EDITOR)
        rights_manager.assign_role_for_exploration(
            self.user_b, self.EXP_ID, self.user_id_e,
            rights_manager.ROLE_VIEWER)

    def test_publishing_and_unpublishing_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))

        rights_manager.publish_exploration(self.user_a, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.user_a, exp_rights))

        rights_manager.unpublish_exploration(self.user_admin, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, exp_rights))
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))

    def test_can_only_delete_unpublished_explorations(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        rights_manager.publish_exploration(self.user_a, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        rights_manager.unpublish_exploration(self.user_admin, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

    def test_changing_viewability_of_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))

        with self.assertRaisesRegexp(Exception, 'already the current value'):
            rights_manager.set_private_viewability_of_exploration(
                self.user_a, self.EXP_ID, False)
        with self.assertRaisesRegexp(Exception, 'cannot be changed'):
            rights_manager.set_private_viewability_of_exploration(
                self.user_b, self.EXP_ID, True)

        rights_manager.set_private_viewability_of_exploration(
            self.user_a, self.EXP_ID, True)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))

        rights_manager.set_private_viewability_of_exploration(
            self.user_a, self.EXP_ID, False)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, exp_rights))
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))

    def test_check_exploration_rights(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_c,
            rights_manager.ROLE_EDITOR)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_a))
        self.assertTrue(exp_rights.is_editor(self.user_id_c))
        self.assertTrue(exp_rights.is_viewer(self.user_id_b))
        self.assertFalse(exp_rights.is_viewer(self.user_id_a))
        self.assertFalse(exp_rights.is_owner(self.user_id_b))
        self.assertFalse(exp_rights.is_editor(self.user_id_b))

    def test_get_multiple_exploration_rights(self):
        exp_ids = ['exp1', 'exp2', 'exp3', 'exp4']

        # saving only first 3 explorations to check that None is returned for
        # non-existing exploration.
        for exp_id in exp_ids[:3]:
            self.save_new_valid_exploration(exp_id, self.user_id_admin)
        exp_rights = rights_manager.get_multiple_exploration_rights_by_ids(
            exp_ids)

        self.assertEqual(len(exp_rights), 4)
        for rights_object in exp_rights[:3]:
            self.assertIsNotNone(rights_object)
        self.assertIsNone(exp_rights[3])


class CollectionRightsTests(test_utils.GenericTestBase):
    """Test that rights for actions on collections work as expected."""

    COLLECTION_ID = 'collection_id'
    EXP_ID_FOR_COLLECTION = 'exp_id_for_collection'

    def setUp(self):
        super(CollectionRightsTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup('c@example.com', 'C')
        self.signup('d@example.com', 'D')
        self.signup('e@example.com', 'E')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, username=self.MODERATOR_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id_moderator = self.get_user_id_from_email(
            self.MODERATOR_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)
        self.user_c = user_services.UserActionsInfo(self.user_id_c)
        self.user_d = user_services.UserActionsInfo(self.user_id_d)
        self.user_e = user_services.UserActionsInfo(self.user_id_e)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)
        self.user_moderator = user_services.UserActionsInfo(
            self.user_id_moderator)
        self.system_user = user_services.get_system_user()


    def test_get_collection_rights_for_nonexistent_collection(self):
        non_col_id = 'this_collection_does_not_exist_id'

        with self.assertRaisesRegexp(
            Exception,
            'Entity for class CollectionRightsModel with id '
            'this_collection_does_not_exist_id not found'
            ):
            rights_manager.get_collection_rights(non_col_id)

        self.assertIsNone(
            rights_manager.get_collection_rights(non_col_id, strict=False))

    def test_demo_collection(self):
        collection_services.load_demo('0')
        rights_manager.release_ownership_of_collection(
            self.system_user, '0')
        collection_rights = rights_manager.get_collection_rights('0')

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_a, collection_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_a, collection_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, collection_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, collection_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, collection_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_moderator, collection_rights))

    def test_ownership_of_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        self.assertListEqual(
            ['A'],
            rights_manager.get_collection_owner_names(
                self.COLLECTION_ID))
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_owner(self.user_id_a))
        self.assertFalse(collection_rights.is_owner(self.user_id_b))

        self.assertFalse(collection_rights.is_owner(self.user_id_admin))

    def test_newly_created_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        self.assertListEqual(
            ['A'],
            rights_manager.get_collection_owner_names(
                self.COLLECTION_ID))
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_a, collection_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, collection_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, collection_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, collection_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_moderator, collection_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_moderator, collection_rights))

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, collection_rights))

    def test_inviting_collaborator_to_collection(self):
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.user_id_a,
            exploration_id=self.EXP_ID_FOR_COLLECTION)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        # Verify initial editor permissions for the collection.
        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_a, collection_rights))

        # Verify initial editor permissions for the exploration within the
        # collection.
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, collection_rights))

        # User A adds user B to the collection as an editor.
        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        # Ensure User A is the only user in the owner names list.
        self.assertListEqual(
            ['A'],
            rights_manager.get_collection_owner_names(
                self.COLLECTION_ID))
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        # Ensure User B is now an editor of the collection.
        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, collection_rights))

        exp_for_collection_rights = rights_manager.get_exploration_rights(
            self.EXP_ID_FOR_COLLECTION)
        # Ensure User B is not an editor of the exploration within the
        # collection.
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_for_collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_for_collection_rights))

    def test_inviting_playtester_to_collection(self):
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.user_id_a,
            exploration_id=self.EXP_ID_FOR_COLLECTION)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)
        exp_for_collection_rights = rights_manager.get_exploration_rights(
            self.EXP_ID_FOR_COLLECTION)

        # Verify initial viewer permissions for the collection.
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, collection_rights))

        # Verify initial viewer permissions for the exploration within the
        # collection.
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_for_collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_for_collection_rights))

        # User A adds user B to the collection as a viewer.
        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)
        exp_for_collection_rights = rights_manager.get_exploration_rights(
            self.EXP_ID_FOR_COLLECTION)

        # Ensure User B is now a viewer of the collection.
        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, collection_rights))

        # Ensure User B cannot view the exploration just because he/she has
        # access to the collection containing it.
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_for_collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_for_collection_rights))

    def test_setting_rights_of_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_collection(
                self.user_b, self.COLLECTION_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_collection(
                self.user_b, self.COLLECTION_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_OWNER)

        rights_manager.assign_role_for_collection(
            self.user_b, self.COLLECTION_ID, self.user_id_c,
            rights_manager.ROLE_OWNER)
        rights_manager.assign_role_for_collection(
            self.user_b, self.COLLECTION_ID, self.user_id_d,
            rights_manager.ROLE_EDITOR)
        rights_manager.assign_role_for_collection(
            self.user_b, self.COLLECTION_ID, self.user_id_e,
            rights_manager.ROLE_VIEWER)

    def test_publishing_and_unpublishing_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))

        rights_manager.publish_collection(self.user_a, self.COLLECTION_ID)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.user_a, collection_rights))

        rights_manager.unpublish_collection(
            self.user_admin, self.COLLECTION_ID)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, collection_rights))
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))

    def test_can_only_delete_unpublished_collections(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, collection_rights))

        rights_manager.publish_collection(self.user_a, self.COLLECTION_ID)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_a, collection_rights))

        rights_manager.unpublish_collection(
            self.user_admin, self.COLLECTION_ID)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, collection_rights))


class CheckCanReleaseOwnershipTest(test_utils.GenericTestBase):
    """Tests for check_can_release_ownership function."""
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    def setUp(self):
        super(CheckCanReleaseOwnershipTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_admin_can_release_ownership_of_published_exploration(self):
        self.assertTrue(rights_manager.check_can_release_ownership(
            self.admin,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_owner_can_release_ownership_of_published_exploration(self):
        self.assertTrue(rights_manager.check_can_release_ownership(
            self.owner,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_admin_cannot_release_ownership_of_private_exploration(self):
        self.assertFalse(rights_manager.check_can_release_ownership(
            self.admin,
            rights_manager.get_exploration_rights(self.private_exp_id)))

    def test_owner_cannot_release_ownership_of_private_exploration(self):
        self.assertFalse(rights_manager.check_can_release_ownership(
            self.owner,
            rights_manager.get_exploration_rights(self.private_exp_id)))


class CheckCanUnpublishActivityTest(test_utils.GenericTestBase):
    """Tests for check_can_unpublish_activity function."""
    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'
    private_col_id = 'col_id_1'
    published_col_id = 'col_id_2'

    def setUp(self):
        super(CheckCanUnpublishActivityTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.moderator = user_services.UserActionsInfo(self.moderator_id)
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        self.save_new_valid_collection(
            self.published_col_id, self.owner_id,
            exploration_id=self.published_col_id)
        self.save_new_valid_collection(
            self.private_col_id, self.owner_id,
            exploration_id=self.private_col_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)
        rights_manager.publish_collection(self.owner, self.published_col_id)

    def test_admin_can_unpublish_published_collection(self):
        self.assertTrue(rights_manager.check_can_unpublish_activity(
            self.admin,
            rights_manager.get_collection_rights(self.published_col_id)))

    def test_owner_cannot_unpublish_published_collection(self):
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.owner,
            rights_manager.get_collection_rights(self.published_col_id)))

    def test_admin_cannot_unpublish_private_collection(self):
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.admin,
            rights_manager.get_collection_rights(self.private_col_id)))

    def test_admin_can_unpublish_published_exploration(self):
        self.assertTrue(rights_manager.check_can_unpublish_activity(
            self.admin,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_owner_cannot_unpublish_published_exploration(self):
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.owner,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_admin_cannot_unpublish_private_exploration(self):
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.admin,
            rights_manager.get_exploration_rights(self.private_exp_id)))

    def test_moderator_can_unpublish_published_exploration(self):
        self.assertTrue(rights_manager.check_can_unpublish_activity(
            self.moderator,
            rights_manager.get_exploration_rights(self.published_exp_id)))
