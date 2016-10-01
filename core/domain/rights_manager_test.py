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
from core.tests import test_utils
import feconf


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

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

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
            feconf.SYSTEM_COMMITTER_ID, '1')

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, '1'))

    def test_non_splash_page_demo_exploration(self):
        # Note: there is no difference between permissions for demo
        # explorations, whether or not they are on the splash page.
        exp_services.load_demo('3')
        rights_manager.release_ownership_of_exploration(
            feconf.SYSTEM_COMMITTER_ID, '3')

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(rights_manager.Actor(
            self.user_id_a).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertFalse(rights_manager.Actor(
            self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(rights_manager.Actor(
            self.user_id_admin).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, '3'))

    def test_ownership_of_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).is_owner(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).is_owner(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).is_owner(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_newly_created_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_inviting_collaborator_to_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_inviting_playtester_to_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.assign_role_for_exploration(
            self.user_id_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_setting_rights_of_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
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
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)

        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_unpublish(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.unpublish_exploration(self.user_id_admin, self.EXP_ID)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_can_only_delete_unpublished_explorations(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)

        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.unpublish_exploration(self.user_id_admin, self.EXP_ID)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_can_publicize_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)

        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_publicize(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_publicize(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

    def test_changing_viewability_of_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        self.assertTrue(rights_manager.Actor(
            self.user_id_a).can_change_private_viewability(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(rights_manager.Actor(
            self.user_id_b).can_change_private_viewability(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(rights_manager.Actor(
            self.user_id_admin).can_change_private_viewability(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

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
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.set_private_viewability_of_exploration(
            self.user_id_a, self.EXP_ID, False)
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.publish_exploration(self.user_id_a, self.EXP_ID)
        self.assertFalse(rights_manager.Actor(
            self.user_id_a).can_change_private_viewability(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))

        rights_manager.unpublish_exploration(self.user_id_admin, self.EXP_ID)
        self.assertTrue(rights_manager.Actor(
            self.user_id_a).can_change_private_viewability(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertFalse(rights_manager.Actor(
            self.user_id_b).can_change_private_viewability(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))
        self.assertTrue(rights_manager.Actor(
            self.user_id_admin).can_change_private_viewability(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID))


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

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

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
            feconf.SYSTEM_COMMITTER_ID, '0')

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))
        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, '0'))

    def test_ownership_of_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_id_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).is_owner(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).is_owner(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).is_owner(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

    def test_newly_created_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_admin).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

    def test_inviting_collaborator_to_collection(self):
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.user_id_a,
            exploration_id=self.EXP_ID_FOR_COLLECTION)

        # Verify initial editor permissions for the collection.
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        # Verify initial editor permissions for the exploration within the
        # collection.
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))

        # User A adds user B to the collection as an editor.
        rights_manager.assign_role_for_collection(
            self.user_id_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        # Ensure User B is now an editor of the collection.
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        # Ensure User B is not an editor of the exploration within the
        # collection.
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))

    def test_inviting_playtester_to_collection(self):
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.user_id_a,
            exploration_id=self.EXP_ID_FOR_COLLECTION)

        # Verify initial viewer permissions for the collection.
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        # Verify initial viewer permissions for the exploration within the
        # collection.
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))

        # User A adds user B to the collection as a viewer.
        rights_manager.assign_role_for_collection(
            self.user_id_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        # Ensure User B is now a viewer of the collection.
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        # Ensure User B cannot view the exploration just because he/she has
        # access to the collection containing it.
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_edit(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_delete(
                feconf.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_FOR_COLLECTION))

    def test_setting_rights_of_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_id_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_collection(
                self.user_id_b, self.COLLECTION_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_collection(
            self.user_id_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        with self.assertRaisesRegexp(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_collection(
                self.user_id_b, self.COLLECTION_ID, self.user_id_c,
                rights_manager.ROLE_VIEWER)

        rights_manager.assign_role_for_collection(
            self.user_id_a, self.COLLECTION_ID, self.user_id_b,
            rights_manager.ROLE_OWNER)

        rights_manager.assign_role_for_collection(
            self.user_id_b, self.COLLECTION_ID, self.user_id_c,
            rights_manager.ROLE_OWNER)
        rights_manager.assign_role_for_collection(
            self.user_id_b, self.COLLECTION_ID, self.user_id_d,
            rights_manager.ROLE_EDITOR)
        rights_manager.assign_role_for_collection(
            self.user_id_b, self.COLLECTION_ID, self.user_id_e,
            rights_manager.ROLE_VIEWER)

    def test_publishing_and_unpublishing_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        rights_manager.publish_collection(self.user_id_a, self.COLLECTION_ID)

        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_unpublish(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        rights_manager.unpublish_collection(
            self.user_id_admin, self.COLLECTION_ID)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_play(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertFalse(
            rights_manager.Actor(self.user_id_b).can_view(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

    def test_can_only_delete_unpublished_collections(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        rights_manager.publish_collection(self.user_id_a, self.COLLECTION_ID)

        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

        rights_manager.unpublish_collection(
            self.user_id_admin, self.COLLECTION_ID)

        self.assertTrue(
            rights_manager.Actor(self.user_id_a).can_delete(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))

    def test_can_publicize_collection(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.publish_collection(self.user_id_a, self.COLLECTION_ID)

        self.assertFalse(
            rights_manager.Actor(self.user_id_a).can_publicize(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
        self.assertTrue(
            rights_manager.Actor(self.user_id_admin).can_publicize(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COLLECTION_ID))
