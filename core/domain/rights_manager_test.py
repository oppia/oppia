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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils

import utils


class ActivityRightsChangeTests(test_utils.GenericTestBase):

    def test_activity_rights_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            rights_manager.ActivityRightsChange({'invalid': 'data'})

    def test_activity_rights_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            rights_manager.ActivityRightsChange({'cmd': 'invalid'})

    def test_activity_rights_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_role, old_role')):
            rights_manager.ActivityRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
            })

    def test_activity_rights_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            rights_manager.ActivityRightsChange({
                'cmd': 'change_private_viewability',
                'old_viewable_if_private': 'old_viewable_if_private',
                'new_viewable_if_private': 'new_viewable_if_private',
                'invalid': 'invalid'
            })

    def test_activity_rights_change_object_with_invalid_role(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for new_role in cmd change_role: '
                'invalid is not allowed')):
            rights_manager.ActivityRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
                'old_role': rights_manager.ROLE_OWNER,
                'new_role': 'invalid',
            })

    def test_exploration_rights_change_object_with_invalid_status(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for new_status in cmd change_exploration_status: '
                'invalid is not allowed')):
            rights_manager.ExplorationRightsChange({
                'cmd': 'change_exploration_status',
                'old_status': rights_manager.ACTIVITY_STATUS_PRIVATE,
                'new_status': 'invalid'
            })

    def test_collection_rights_change_object_with_invalid_status(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for old_status in cmd change_collection_status: '
                'invalid is not allowed')):
            rights_manager.CollectionRightsChange({
                'cmd': 'change_collection_status',
                'old_status': 'invalid',
                'new_status': rights_manager.ACTIVITY_STATUS_PRIVATE,
            })

    def test_activity_rights_change_object_with_create_new(self):
        activity_rights_change_object = rights_manager.ActivityRightsChange({
            'cmd': 'create_new'
        })

        self.assertEqual(activity_rights_change_object.cmd, 'create_new')

    def test_activity_rights_change_object_with_change_role(self):
        activity_rights_change_object = rights_manager.ActivityRightsChange({
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
            'old_role': rights_manager.ROLE_OWNER,
            'new_role': rights_manager.ROLE_VIEWER
        })

        self.assertEqual(activity_rights_change_object.cmd, 'change_role')
        self.assertEqual(
            activity_rights_change_object.assignee_id, 'assignee_id')
        self.assertEqual(
            activity_rights_change_object.old_role, rights_manager.ROLE_OWNER)
        self.assertEqual(
            activity_rights_change_object.new_role, rights_manager.ROLE_VIEWER)

    def test_activity_rights_change_object_with_release_ownership(self):
        activity_rights_change_object = rights_manager.ActivityRightsChange({
            'cmd': 'release_ownership'
        })

        self.assertEqual(activity_rights_change_object.cmd, 'release_ownership')

    def test_activity_rights_change_object_with_change_private_viewability(
            self):
        activity_rights_change_object = rights_manager.ActivityRightsChange({
            'cmd': 'change_private_viewability',
            'old_viewable_if_private': 'old_viewable_if_private',
            'new_viewable_if_private': 'new_viewable_if_private'
        })

        self.assertEqual(
            activity_rights_change_object.cmd, 'change_private_viewability')
        self.assertEqual(
            activity_rights_change_object.old_viewable_if_private,
            'old_viewable_if_private')
        self.assertEqual(
            activity_rights_change_object.new_viewable_if_private,
            'new_viewable_if_private')

    def test_activity_rights_change_object_with_update_first_published_msec(
            self):
        activity_rights_change_object = rights_manager.ActivityRightsChange({
            'cmd': 'update_first_published_msec',
            'old_first_published_msec': 'old_first_published_msec',
            'new_first_published_msec': 'new_first_published_msec'
        })

        self.assertEqual(
            activity_rights_change_object.cmd, 'update_first_published_msec')
        self.assertEqual(
            activity_rights_change_object.old_first_published_msec,
            'old_first_published_msec')
        self.assertEqual(
            activity_rights_change_object.new_first_published_msec,
            'new_first_published_msec')

    def test_exploration_rights_change_object_with_change_exploration_status(
            self):
        exp_rights_change_object = rights_manager.ExplorationRightsChange({
            'cmd': 'change_exploration_status',
            'old_status': rights_manager.ACTIVITY_STATUS_PRIVATE,
            'new_status': rights_manager.ACTIVITY_STATUS_PUBLIC
        })

        self.assertEqual(
            exp_rights_change_object.cmd, 'change_exploration_status')
        self.assertEqual(
            exp_rights_change_object.old_status,
            rights_manager.ACTIVITY_STATUS_PRIVATE)
        self.assertEqual(
            exp_rights_change_object.new_status,
            rights_manager.ACTIVITY_STATUS_PUBLIC)

    def test_exploration_rights_change_object_with_change_collection_status(
            self):
        col_rights_change_object = rights_manager.CollectionRightsChange({
            'cmd': 'change_collection_status',
            'old_status': rights_manager.ACTIVITY_STATUS_PUBLIC,
            'new_status': rights_manager.ACTIVITY_STATUS_PRIVATE
        })

        self.assertEqual(
            col_rights_change_object.cmd, 'change_collection_status')
        self.assertEqual(
            col_rights_change_object.old_status,
            rights_manager.ACTIVITY_STATUS_PUBLIC)
        self.assertEqual(
            col_rights_change_object.new_status,
            rights_manager.ACTIVITY_STATUS_PRIVATE)

    def test_to_dict(self):
        activity_rights_change_dict = {
            'cmd': 'change_private_viewability',
            'old_viewable_if_private': 'old_viewable_if_private',
            'new_viewable_if_private': 'new_viewable_if_private'
        }
        activity_rights_change_object = rights_manager.ActivityRightsChange(
            activity_rights_change_dict)
        self.assertEqual(
            activity_rights_change_object.to_dict(),
            activity_rights_change_dict)


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
        self.signup('f@example.com', 'F')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)
        self.signup(self.MODERATOR_EMAIL, username=self.MODERATOR_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_f = self.get_user_id_from_email('f@example.com')
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
        self.user_f = user_services.UserActionsInfo(self.user_id_f)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)
        self.user_moderator = user_services.UserActionsInfo(
            self.user_id_moderator)
        self.system_user = user_services.get_system_user()
        self.login(self.ADMIN_EMAIL)

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
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_a, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
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
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_a, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
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
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_a, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_admin, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_admin, exp_rights))

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_moderator, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.user_moderator, exp_rights))
        self.assertFalse(rights_manager.check_can_save_activity(
            self.user_moderator, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_moderator, exp_rights))

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_save_activity(
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
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_save_activity(
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
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_b, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, exp_rights))

    def test_inviting_voice_artist_to_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_save_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, exp_rights))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VOICE_ARTIST)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_b, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
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
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_save_activity(
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
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.user_b, exp_rights))
        self.assertFalse(rights_manager.check_can_save_activity(
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
            rights_manager.ROLE_VOICE_ARTIST)

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
            rights_manager.ROLE_VOICE_ARTIST)
        rights_manager.assign_role_for_exploration(
            self.user_b, self.EXP_ID, self.user_id_f,
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

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_d,
            rights_manager.ROLE_VOICE_ARTIST)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_a))
        self.assertTrue(exp_rights.is_editor(self.user_id_c))
        self.assertTrue(exp_rights.is_viewer(self.user_id_b))
        self.assertFalse(exp_rights.is_viewer(self.user_id_a))
        self.assertFalse(exp_rights.is_owner(self.user_id_b))
        self.assertFalse(exp_rights.is_editor(self.user_id_b))
        self.assertTrue(exp_rights.is_voice_artist(self.user_id_d))
        self.assertFalse(exp_rights.is_voice_artist(self.user_id_b))

    def test_get_multiple_exploration_rights(self):
        exp_ids = ['exp1', 'exp2', 'exp3', 'exp4']

        # Saving only first 3 explorations to check that None is returned for
        # non-existing exploration.
        for exp_id in exp_ids[:3]:
            self.save_new_valid_exploration(exp_id, self.user_id_admin)
        exp_rights = rights_manager.get_multiple_exploration_rights_by_ids(
            exp_ids)

        self.assertEqual(len(exp_rights), 4)
        for rights_object in exp_rights[:3]:
            self.assertIsNotNone(rights_object)
        self.assertIsNone(exp_rights[3])

    def test_owner_cannot_be_reassigned_as_owner(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegexp(Exception, 'This user already owns this'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_a,
                rights_manager.ROLE_OWNER)

    def test_assign_viewer_to_role_owner(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(exp_rights.is_owner(self.user_id_b))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b, rights_manager.ROLE_OWNER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_b))

    def test_assign_voice_artist_to_role_owner(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VOICE_ARTIST)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(exp_rights.is_owner(self.user_id_b))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b, rights_manager.ROLE_OWNER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_b))

    def test_editor_cannot_be_reassigned_as_editor(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_EDITOR)

        with self.assertRaisesRegexp(
            Exception, 'This user already can edit this'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_manager.ROLE_EDITOR)

    def test_voice_artist_cannot_be_reassigned_as_voice_artist(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VOICE_ARTIST)

        with self.assertRaisesRegexp(
            Exception, 'This user already can voiceover this'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_manager.ROLE_VOICE_ARTIST)

    def test_viewer_cannot_be_reassigned_as_viewer(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_manager.ROLE_VIEWER)

        with self.assertRaisesRegexp(
            Exception, 'This user already can view this'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_manager.ROLE_VIEWER)

    def test_public_explorations_cannot_be_assigned_role_viewer(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        with self.assertRaisesRegexp(
            Exception, 'Public explorations can be viewed by anyone.'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_manager.ROLE_VIEWER)

    def test_cannot_assign_invalid_role(self):
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegexp(Exception, 'Invalid role: invalid_role'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b, 'invalid_role')


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
        self.login(self.ADMIN_EMAIL)

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


class ActivityRightsTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ActivityRightsTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.viewer = user_services.UserActionsInfo(self.viewer_id)

        self.exp_id = 'exp_id'
        self.save_new_valid_exploration(self.exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.exp_id)
        self.activity_rights = rights_manager.get_exploration_rights(
            self.exp_id)

    def test_validate_community_owned_explorations(self):
        self.activity_rights.community_owned = True
        with self.assertRaisesRegexp(
            Exception,
            'Community-owned explorations should have no owners, '
            'editors, voice artists or viewers specified.'):
            self.activity_rights.validate()

        self.activity_rights.owner_ids = []
        self.activity_rights.status = rights_manager.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegexp(
            Exception, 'Community-owned explorations cannot be private'):
            self.activity_rights.validate()

    def test_validate_private_explorations(self):
        self.activity_rights.viewer_ids = [self.viewer_id]
        with self.assertRaisesRegexp(
            Exception, 'Public explorations should have no viewers specified.'):
            self.activity_rights.validate()

    def test_validate_owner_cannot_be_editor(self):
        self.activity_rights.editor_ids = [self.owner_id]
        with self.assertRaisesRegexp(
            Exception, 'A user cannot be both an owner and an editor.'):
            self.activity_rights.validate()

    def test_validate_owner_cannot_be_voice_artist(self):
        self.activity_rights.voice_artist_ids = [self.owner_id]
        with self.assertRaisesRegexp(
            Exception, 'A user cannot be both an owner and a voice artist.'):
            self.activity_rights.validate()

    def test_validate_owner_cannot_be_viewer(self):
        self.activity_rights.viewer_ids = [self.owner_id]
        self.activity_rights.status = rights_manager.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegexp(
            Exception, 'A user cannot be both an owner and a viewer.'):
            self.activity_rights.validate()

    def test_validate_editor_cannot_be_voice_artist(self):
        self.activity_rights.voice_artist_ids = [self.viewer_id]
        self.activity_rights.editor_ids = [self.viewer_id]
        self.activity_rights.status = rights_manager.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegexp(
            Exception, 'A user cannot be both an editor and a voice artist.'):
            self.activity_rights.validate()

    def test_validate_editor_cannot_be_viewer(self):
        self.activity_rights.viewer_ids = [self.viewer_id]
        self.activity_rights.editor_ids = [self.viewer_id]
        self.activity_rights.status = rights_manager.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegexp(
            Exception, 'A user cannot be both an editor and a viewer.'):
            self.activity_rights.validate()

    def test_validate_voice_artist_cannot_be_viewer(self):
        self.activity_rights.viewer_ids = [self.viewer_id]
        self.activity_rights.voice_artist_ids = [self.viewer_id]
        self.activity_rights.status = rights_manager.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegexp(
            Exception, 'A user cannot be both a voice artist and a viewer.'):
            self.activity_rights.validate()

    def test_cannot_update_activity_first_published_msec_for_invalid_activity(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Cannot get activity rights for unknown activity type'):
            rights_manager.update_activity_first_published_msec(
                'invalid_activity', 'activity_id', 0.0)

    def test_check_cannot_access_activity_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_access_activity(
            self.owner, None))

    def test_check_cannot_edit_activity_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.owner, None))

    def test_check_cannot_voiceover_activity_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.owner, None))

    def test_cannot_save_activity_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_save_activity(
            self.owner, None))

    def test_check_cannot_delete_activity_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.owner, None))

    def test_check_cannot_modify_activity_roles_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_modify_activity_roles(
            self.owner, None))

    def test_check_cannot_release_ownership_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_release_ownership(
            self.owner, None))

    def test_check_cannnot_publish_activity_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_publish_activity(
            self.owner, None))

    def test_check_cannot_publish_activity_with_cloned_from(self):
        self.activity_rights.cloned_from = True
        self.assertFalse(rights_manager.check_can_publish_activity(
            self.owner, self.activity_rights))

    def test_check_cannot_unpublish_activity_with_no_activity_rights(self):
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.owner, None))

    def test_cannot_release_ownership_of_exploration_with_insufficient_rights(
            self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'The ownership of this exploration cannot be released.')

        with logging_swap, assert_raises_regexp_context_manager:
            rights_manager.release_ownership_of_exploration(
                self.viewer, self.exp_id)

        self.assertEqual(len(observed_log_messages), 1)
        self.assertEqual(
            observed_log_messages[0],
            'User %s tried to release ownership of exploration %s but was '
            'refused permission.' % (self.viewer_id, self.exp_id))
