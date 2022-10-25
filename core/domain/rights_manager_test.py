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

from __future__ import annotations

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import learner_progress_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import role_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([
    models.Names.EXPLORATION
])


class ExplorationRightsTests(test_utils.GenericTestBase):
    """Test that rights for actions on explorations work as expected."""

    EXP_ID: Final = 'exp_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup('c@example.com', 'C')
        self.signup('d@example.com', 'D')
        self.signup('e@example.com', 'E')
        self.signup('f@example.com', 'F')
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_f = self.get_user_id_from_email('f@example.com')
        self.user_id_moderator = self.get_user_id_from_email(
            self.MODERATOR_EMAIL)
        self.user_id_voiceover_admin = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL)

        self.set_moderators([self.MODERATOR_USERNAME])
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)
        self.user_c = user_services.get_user_actions_info(self.user_id_c)
        self.user_d = user_services.get_user_actions_info(self.user_id_d)
        self.user_e = user_services.get_user_actions_info(self.user_id_e)
        self.user_f = user_services.get_user_actions_info(self.user_id_f)

        self.user_moderator = user_services.get_user_actions_info(
            self.user_id_moderator)
        self.system_user = user_services.get_system_user()
        self.login(self.MODERATOR_EMAIL)

        self.user_voiceover_admin = user_services.get_user_actions_info(
            self.user_id_voiceover_admin)

    def test_get_exploration_rights_for_nonexistent_exploration(self) -> None:
        non_exp_id = 'this_exp_does_not_exist_id'

        with self.assertRaisesRegex(
            Exception,
            'Entity for class ExplorationRightsModel with id '
            'this_exp_does_not_exist_id not found'
            ):
            rights_manager.get_exploration_rights(non_exp_id)

        self.assertIsNone(
            rights_manager.get_exploration_rights(non_exp_id, strict=False))

    def test_demo_exploration(self) -> None:
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
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(
            rights_manager.check_can_manage_voice_artist_in_activity(
                self.user_voiceover_admin, exp_rights))
        self.assertFalse(
            rights_manager.check_can_manage_voice_artist_in_activity(
                self.user_a, exp_rights))
        self.assertFalse(
            rights_manager.check_can_manage_voice_artist_in_activity(
                self.user_moderator, exp_rights))
        self.assertFalse(
            rights_manager.check_can_manage_voice_artist_in_activity(
                self.user_a, None))

    def test_check_can_modify_core_activity_roles_for_none_activity(
        self
    ) -> None:
        self.assertFalse(
            rights_manager.check_can_modify_core_activity_roles(
                self.user_a, None))

    def test_non_splash_page_demo_exploration(self) -> None:
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
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_moderator, exp_rights))

    def test_ownership_of_exploration(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_a))
        self.assertFalse(exp_rights.is_owner(self.user_id_b))
        self.assertFalse(exp_rights.is_owner(self.user_id_moderator))

    def test_newly_created_exploration(self) -> None:
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
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            self.user_moderator, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
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

    def test_inviting_collaborator_to_exploration(self) -> None:
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
            rights_domain.ROLE_EDITOR)
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

    def test_inviting_voice_artist_to_exploration(self) -> None:
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

        rights_manager.publish_exploration(self.user_a, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)
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

    def test_get_activity_rights_raise_error_for_invalid_activity_type(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Cannot get activity rights for unknown activity'
        ):
            rights_manager._get_activity_rights('invalid_type', self.user_id_a)  # pylint: disable=protected-access

    def test_inviting_playtester_to_exploration(self) -> None:
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
            rights_domain.ROLE_VIEWER)
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

    def test_user_with_rights_to_edit_any_public_activity(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        user_with_public_activity_rights = user_domain.UserActionsInfo(
            self.user_id_b, ['FULL_USER'], [
                role_services.ACTION_EDIT_OWNED_ACTIVITY,
                role_services.ACTION_EDIT_ANY_PUBLIC_ACTIVITY])

        self.assertTrue(rights_manager.check_can_edit_activity(
            user_with_public_activity_rights, exp_rights))
        self.assertTrue(rights_manager.check_can_voiceover_activity(
            user_with_public_activity_rights, exp_rights))
        self.assertTrue(rights_manager.check_can_save_activity(
            user_with_public_activity_rights, exp_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            user_with_public_activity_rights, exp_rights))

    def test_user_with_rights_to_delete_any_public_activity(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        user_with_public_activity_rights = user_domain.UserActionsInfo(
            self.user_id_b, ['FULL_USER'], [
                role_services.ACTION_EDIT_OWNED_ACTIVITY,
                role_services.ACTION_DELETE_ANY_PUBLIC_ACTIVITY])

        self.assertFalse(rights_manager.check_can_edit_activity(
            user_with_public_activity_rights, exp_rights))
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            user_with_public_activity_rights, exp_rights))
        self.assertFalse(rights_manager.check_can_save_activity(
            user_with_public_activity_rights, exp_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            user_with_public_activity_rights, exp_rights))

    def test_assign_role_for_exploration_raises_error_for_invalid_activity_id(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegex(Exception, 'No activity_rights exists'):
            rights_manager.assign_role_for_exploration(
                self.user_b, 'abcdefg', self.user_id_c,
                rights_domain.ROLE_VIEWER)

    def test_setting_rights_of_exploration(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)

        with self.assertRaisesRegex(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_b, self.EXP_ID, self.user_id_c,
                rights_domain.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)

        with self.assertRaisesRegex(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_b, self.EXP_ID, self.user_id_c,
                rights_domain.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_OWNER)

        rights_manager.assign_role_for_exploration(
            self.user_b, self.EXP_ID, self.user_id_c,
            rights_domain.ROLE_OWNER)
        rights_manager.assign_role_for_exploration(
            self.user_b, self.EXP_ID, self.user_id_d,
            rights_domain.ROLE_EDITOR)
        rights_manager.assign_role_for_exploration(
            self.user_b, self.EXP_ID, self.user_id_f,
            rights_domain.ROLE_VIEWER)

    def test_publishing_and_unpublishing_exploration(self) -> None:
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

        rights_manager.unpublish_exploration(self.user_moderator, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, exp_rights))
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))

    def test_unpublished_exploration_is_removed_from_completed_activities(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id_f, self.EXP_ID)

        self.assertEqual(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id_f),
            [self.EXP_ID]
        )

        rights_manager.unpublish_exploration(self.user_moderator, self.EXP_ID)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id_f),
            []
        )

    def test_unpublished_exploration_is_removed_from_incomplete_activities(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id_e, self.EXP_ID, 'state', 1)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id_e),
            [self.EXP_ID]
        )

        rights_manager.unpublish_exploration(self.user_moderator, self.EXP_ID)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id_e),
            []
        )

    def test_can_only_delete_unpublished_explorations(self) -> None:
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

        rights_manager.unpublish_exploration(self.user_moderator, self.EXP_ID)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, exp_rights))

    def test_changing_viewability_of_exploration(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, title='A title', category='A category')
        exp_services.save_new_exploration(self.user_id_a, exp)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, exp_rights))

        with self.assertRaisesRegex(Exception, 'already the current value'):
            rights_manager.set_private_viewability_of_exploration(
                self.user_a, self.EXP_ID, False)
        with self.assertRaisesRegex(Exception, 'cannot be changed'):
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

    def test_reassign_higher_role_to_exploration(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_viewer(self.user_id_b))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_OWNER)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_owner(self.user_id_b))

    def test_reassign_lower_role_to_exploration(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_OWNER)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_owner(self.user_id_a))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_viewer(self.user_id_b))

    def test_check_exploration_rights(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_c,
            rights_domain.ROLE_EDITOR)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_a))
        self.assertTrue(exp_rights.is_editor(self.user_id_c))
        self.assertTrue(exp_rights.is_viewer(self.user_id_b))
        self.assertFalse(exp_rights.is_viewer(self.user_id_a))
        self.assertFalse(exp_rights.is_owner(self.user_id_b))
        self.assertFalse(exp_rights.is_editor(self.user_id_b))

        rights_manager.publish_exploration(self.user_a, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_d,
            rights_domain.ROLE_VOICE_ARTIST)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_voice_artist(self.user_id_d))
        self.assertFalse(exp_rights.is_voice_artist(self.user_id_b))

    def test_get_multiple_exploration_rights(self) -> None:
        exp_ids = ['exp1', 'exp2', 'exp3', 'exp4']

        # Saving only first 3 explorations to check that None is returned for
        # non-existing exploration.
        for exp_id in exp_ids[:3]:
            self.save_new_valid_exploration(exp_id, self.user_id_moderator)
        exp_rights = rights_manager.get_multiple_exploration_rights_by_ids(
            exp_ids)

        self.assertEqual(len(exp_rights), 4)
        for rights_object in exp_rights[:3]:
            self.assertIsNotNone(rights_object)
        self.assertIsNone(exp_rights[3])

    def test_owner_cannot_be_reassigned_as_owner(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegex(Exception, 'This user already owns this'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_a,
                rights_domain.ROLE_OWNER)

    def test_assign_viewer_to_role_owner(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(exp_rights.is_owner(self.user_id_b))

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b, rights_domain.ROLE_OWNER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertTrue(exp_rights.is_owner(self.user_id_b))

    def test_owner_cannot_assign_voice_artist(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        with self.assertRaisesRegex(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_domain.ROLE_VOICE_ARTIST)

    def test_voiceover_admin_can_modify_voice_artist_role(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        rights_manager.assign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_voice_artist(self.user_id_b))

        rights_manager.deassign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_b)

        self.assertFalse(exp_rights.is_voice_artist(self.user_id_b))

    def test_voice_artist_cannot_be_assigned_to_private_exploration(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegex(
            Exception, 'Could not assign voice artist to private activity.'
        ):
            rights_manager.assign_role_for_exploration(
                self.user_voiceover_admin, self.EXP_ID, self.user_id_b,
                rights_domain.ROLE_VOICE_ARTIST)

    def test_voice_artist_can_be_unassigned_from_private_exploration(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        rights_manager.assign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_voice_artist(self.user_id_b))

        rights_manager.unpublish_exploration(self.user_moderator, self.EXP_ID)
        rights_manager.deassign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_b)

        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertFalse(exp_rights.is_voice_artist(self.user_id_b))

    def test_owner_cannot_assign_voice_artist_to_core_role(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        rights_manager.assign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        self.assertFalse(exp_rights.is_owner(self.user_id_b))
        with self.assertRaisesRegex(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_domain.ROLE_VOICE_ARTIST)

    def test_voice_artist_cannot_be_reassigned_as_voice_artist(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)
        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        rights_manager.assign_role_for_exploration(
            self.user_voiceover_admin, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)

        with self.assertRaisesRegex(
            Exception, 'This user already can voiceover this'):
            rights_manager.assign_role_for_exploration(
                self.user_voiceover_admin, self.EXP_ID, self.user_id_b,
                rights_domain.ROLE_VOICE_ARTIST)

    def test_viewer_cannot_be_reassigned_as_viewer(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)

        with self.assertRaisesRegex(
            Exception, 'This user already can view this'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_domain.ROLE_VIEWER)

    def test_public_explorations_cannot_be_assigned_role_viewer(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.publish_exploration(self.user_a, self.EXP_ID)

        with self.assertRaisesRegex(
            Exception, 'Public explorations can be viewed by anyone.'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b,
                rights_domain.ROLE_VIEWER)

    def test_cannot_assign_invalid_role(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegex(Exception, 'Invalid role: invalid_role'):
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b, 'invalid_role')

    def test_deassign_role_for_exploration_raise_error_with_invalid_activity_id(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegex(
            Exception, 'No activity_rights exists for the given activity_id'
        ):
            rights_manager.deassign_role_for_exploration(
                self.user_b, 'abcdefg', self.user_id_a)

    def test_deassign_without_rights_fails(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegex(
            Exception, 'Could not deassign role'):
            rights_manager.deassign_role_for_exploration(
                self.user_b, self.EXP_ID, self.user_id_a)

    def test_deassign_viewer_is_successful(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b, rights_domain.ROLE_VIEWER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_viewer(self.user_id_b))

        rights_manager.deassign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertFalse(exp_rights.is_viewer(self.user_id_b))

    def test_deassign_editor_is_successful(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b, rights_domain.ROLE_EDITOR)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_editor(self.user_id_b))

        rights_manager.deassign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertFalse(exp_rights.is_editor(self.user_id_b))

    def test_deassign_editor_is_successful_with_commit_message_having_anonymous(
        self
    ) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b, rights_domain.ROLE_EDITOR)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_editor(self.user_id_b))

        with self.swap_to_always_return(user_services, 'get_usernames', [None]):
            rights_manager.deassign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b)
            exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
            self.assertFalse(exp_rights.is_editor(self.user_id_b))

    def test_deassign_owner_is_successful(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b, rights_domain.ROLE_OWNER)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_owner(self.user_id_b))

        rights_manager.deassign_role_for_exploration(
            self.user_a, self.EXP_ID, self.user_id_b)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertFalse(exp_rights.is_owner(self.user_id_b))

    def test_deassign_non_existent_fails(self) -> None:
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        with self.assertRaisesRegex(
            Exception, 'This user does not have any role in'):
            rights_manager.deassign_role_for_exploration(
                self.user_a, self.EXP_ID, self.user_id_b)

    def test_deassign_editor_is_successful_with_all_valid_commit_messages(
        self
    ) -> None:
        self.signup('testuser@example.com', 'TestUser')
        test_user = self.get_user_id_from_email('testuser@example.com')
        editor_username = 'TestUser'
        self.assertEqual(
            user_services.get_username(test_user),
            editor_username
        )

        # Creating new exploration.
        exp = exp_domain.Exploration.create_default_exploration(self.EXP_ID)
        exp_services.save_new_exploration(self.user_id_a, exp)

        snapshots_data = (
            exp_models.ExplorationRightsModel.get_snapshots_metadata(
                self.EXP_ID, [1]
            )
        )
        self.assertEqual(
            snapshots_data[0]['commit_message'],
            'Created new exploration'
        )

        # Assigning editor role to editor_username ('TestUser').
        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID, test_user, rights_domain.ROLE_EDITOR)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertTrue(exp_rights.is_editor(test_user))

        snapshots_data = (
            exp_models.ExplorationRightsModel.get_snapshots_metadata(
                self.EXP_ID, [2]
            )
        )
        self.assertEqual(
            snapshots_data[0]['commit_message'],
            'Changed role of TestUser from none to editor'
        )

        # De-assigning editor role from editor_username ('TestUser').
        rights_manager.deassign_role_for_exploration(
            self.user_a, self.EXP_ID, test_user)
        exp_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertFalse(exp_rights.is_editor(test_user))

        snapshots_data = (
            exp_models.ExplorationRightsModel.get_snapshots_metadata(
                self.EXP_ID, [3]
            )
        )
        self.assertEqual(
            snapshots_data[0]['commit_message'],
            'Remove TestUser from role editor for exploration'
        )


class CollectionRightsTests(test_utils.GenericTestBase):
    """Test that rights for actions on collections work as expected."""

    COLLECTION_ID: Final = 'collection_id'
    EXP_ID_FOR_COLLECTION: Final = 'exp_id_for_collection'

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup('c@example.com', 'C')
        self.signup('d@example.com', 'D')
        self.signup('e@example.com', 'E')
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_c = self.get_user_id_from_email('c@example.com')
        self.user_id_d = self.get_user_id_from_email('d@example.com')
        self.user_id_e = self.get_user_id_from_email('e@example.com')
        self.user_id_moderator = self.get_user_id_from_email(
            self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)
        self.user_c = user_services.get_user_actions_info(self.user_id_c)
        self.user_d = user_services.get_user_actions_info(self.user_id_d)
        self.user_e = user_services.get_user_actions_info(self.user_id_e)
        self.user_moderator = user_services.get_user_actions_info(
            self.user_id_moderator)
        self.system_user = user_services.get_system_user()
        self.login(self.MODERATOR_EMAIL)

    def test_get_collection_rights_for_nonexistent_collection(self) -> None:
        non_col_id = 'this_collection_does_not_exist_id'

        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionRightsModel with id '
            'this_collection_does_not_exist_id not found'
            ):
            rights_manager.get_collection_rights(non_col_id)

        self.assertIsNone(
            rights_manager.get_collection_rights(non_col_id, strict=False))

    def test_demo_collection(self) -> None:
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
            self.user_moderator, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, collection_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_moderator, collection_rights))
        collection_rights.status = 'invalid_status'
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_moderator, collection_rights))

    def test_ownership_of_collection(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)

        self.assertListEqual(
            ['A'],
            rights_manager.get_collection_owner_names(
                self.COLLECTION_ID))
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_owner(self.user_id_a))
        self.assertFalse(collection_rights.is_owner(self.user_id_b))

        self.assertFalse(collection_rights.is_owner(self.user_id_moderator))

    def test_newly_created_collection(self) -> None:
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
            self.user_moderator, collection_rights))
        self.assertTrue(rights_manager.check_can_edit_activity(
            self.user_moderator, collection_rights))
        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_moderator, collection_rights))

        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.user_b, collection_rights))
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.user_b, collection_rights))

    def test_owner_cannot_be_reassigned_as_owner(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        with self.assertRaisesRegex(Exception, 'This user already owns this'):
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID, self.user_id_a,
                rights_domain.ROLE_OWNER)

    def test_editor_can_be_reassigned_as_owner(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_editor(self.user_id_b))

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_OWNER)

        self.assertTrue(collection_rights.is_owner(self.user_id_b))
        self.assertFalse(collection_rights.is_editor(self.user_id_b))

    def test_voiceartist_can_be_reassigned_as_owner(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_voice_artist(self.user_id_b))

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_OWNER)

        self.assertTrue(collection_rights.is_owner(self.user_id_b))
        self.assertFalse(collection_rights.is_voice_artist(self.user_id_b))

    def test_viewer_can_be_reassigned_as_owner(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_viewer(self.user_id_b))

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_OWNER)

        self.assertTrue(collection_rights.is_owner(self.user_id_b))
        self.assertFalse(collection_rights.is_viewer(self.user_id_b))

    def test_viewer_can_be_reassigned_as_editor(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_viewer(self.user_id_b))

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)

        self.assertTrue(collection_rights.is_editor(self.user_id_b))
        self.assertFalse(collection_rights.is_viewer(self.user_id_b))

    def test_voiceartist_can_be_reassigned_as_editor(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_voice_artist(self.user_id_b))

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)

        self.assertTrue(collection_rights.is_editor(self.user_id_b))
        self.assertFalse(collection_rights.is_voice_artist(self.user_id_b))

    def test_viewer_can_be_reassigned_as_voiceartist(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(collection_rights.is_viewer(self.user_id_b))

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)

        self.assertTrue(collection_rights.is_voice_artist(self.user_id_b))
        self.assertFalse(collection_rights.is_viewer(self.user_id_b))

    def test_editor_cannot_be_reassigned_as_editor(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)

        with self.assertRaisesRegex(
            Exception, 'This user already can edit this'):
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID, self.user_id_b,
                rights_domain.ROLE_EDITOR)

    def test_voice_artist_cannot_be_reassigned_as_voice_artist(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST)

        with self.assertRaisesRegex(
            Exception, 'This user already can voiceover this'):
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID, self.user_id_b,
                rights_domain.ROLE_VOICE_ARTIST)

    def test_viewer_cannot_be_reassigned_as_viewer(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)

        with self.assertRaisesRegex(
            Exception, 'This user already can view this'):
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID, self.user_id_b,
                rights_domain.ROLE_VIEWER)

    def test_public_collection_cannot_be_assigned_role_viewer(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)
        collection_services.save_new_collection(self.user_id_a, collection)

        rights_manager.publish_collection(self.user_a, self.COLLECTION_ID)

        with self.assertRaisesRegex(
            Exception, 'Public collections can be viewed by anyone.'):
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID, self.user_id_b,
                rights_domain.ROLE_VIEWER)

    def test_inviting_collaborator_to_collection(self) -> None:
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
            rights_domain.ROLE_EDITOR)

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

    def test_inviting_playtester_to_collection(self) -> None:
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
            rights_domain.ROLE_VIEWER)
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

    def test_setting_rights_of_collection(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_VIEWER)

        with self.assertRaisesRegex(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_collection(
                self.user_b, self.COLLECTION_ID, self.user_id_c,
                rights_domain.ROLE_VIEWER)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_EDITOR)

        with self.assertRaisesRegex(Exception, 'Could not assign new role.'):
            rights_manager.assign_role_for_collection(
                self.user_b, self.COLLECTION_ID, self.user_id_c,
                rights_domain.ROLE_VIEWER)

        rights_manager.assign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b,
            rights_domain.ROLE_OWNER)

        rights_manager.assign_role_for_collection(
            self.user_b, self.COLLECTION_ID, self.user_id_c,
            rights_domain.ROLE_OWNER)
        rights_manager.assign_role_for_collection(
            self.user_b, self.COLLECTION_ID, self.user_id_d,
            rights_domain.ROLE_EDITOR)
        rights_manager.assign_role_for_collection(
            self.user_b, self.COLLECTION_ID, self.user_id_e,
            rights_domain.ROLE_VIEWER)

    def test_publishing_and_unpublishing_collection(self) -> None:
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
            self.user_moderator, self.COLLECTION_ID)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(rights_manager.check_can_access_activity(
            self.user_a, collection_rights))
        self.assertFalse(rights_manager.check_can_access_activity(
            self.user_b, collection_rights))

    def test_can_only_delete_unpublished_collections(self) -> None:
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
            self.user_moderator, self.COLLECTION_ID)
        collection_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)

        self.assertTrue(rights_manager.check_can_delete_activity(
            self.user_a, collection_rights))

    def test_deassign_without_rights_fails(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        with self.assertRaisesRegex(
            Exception, 'Could not deassign role'):
            rights_manager.deassign_role_for_collection(
                self.user_b, self.COLLECTION_ID, self.user_id_a)

    def test_deassign_viewer_is_successful(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a,
            self.COLLECTION_ID,
            self.user_id_b,
            rights_domain.ROLE_VIEWER
        )
        col_rights = rights_manager.get_collection_rights(
            self.COLLECTION_ID)
        self.assertTrue(col_rights.is_viewer(self.user_id_b))

        rights_manager.deassign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b)
        col_rights = rights_manager.get_collection_rights(self.COLLECTION_ID)
        self.assertFalse(col_rights.is_viewer(self.user_id_b))

    def test_deassign_voice_artist_is_successful(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a,
            self.COLLECTION_ID,
            self.user_id_b,
            rights_domain.ROLE_VOICE_ARTIST
        )
        col_rights = rights_manager.get_collection_rights(self.COLLECTION_ID)
        self.assertTrue(col_rights.is_voice_artist(self.user_id_b))

        rights_manager.deassign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b)
        col_rights = rights_manager.get_collection_rights(self.COLLECTION_ID)
        self.assertFalse(col_rights.is_voice_artist(self.user_id_b))

    def test_deassign_editor_is_successful(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a,
            self.COLLECTION_ID,
            self.user_id_b,
            rights_domain.ROLE_EDITOR
        )
        col_rights = rights_manager.get_collection_rights(self.COLLECTION_ID)
        self.assertTrue(col_rights.is_editor(self.user_id_b))

        rights_manager.deassign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b)
        col_rights = rights_manager.get_collection_rights(self.COLLECTION_ID)
        self.assertFalse(col_rights.is_editor(self.user_id_b))

    def test_deassign_owner_is_successful(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        rights_manager.assign_role_for_collection(
            self.user_a,
            self.COLLECTION_ID,
            self.user_id_b,
            rights_domain.ROLE_OWNER
        )
        col_rights = rights_manager.get_collection_rights(self.COLLECTION_ID)
        self.assertTrue(col_rights.is_owner(self.user_id_b))

        rights_manager.deassign_role_for_collection(
            self.user_a, self.COLLECTION_ID, self.user_id_b)
        col_rights = rights_manager.get_collection_rights(self.COLLECTION_ID)
        self.assertFalse(col_rights.is_owner(self.user_id_b))

    def test_deassign_non_existent_fails(self) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.user_id_a)

        with self.assertRaisesRegex(
            Exception, 'This user does not have any role in'):
            rights_manager.deassign_role_for_collection(
                self.user_a, self.COLLECTION_ID, self.user_id_b)


class CheckCanReleaseOwnershipTest(test_utils.GenericTestBase):
    """Tests for check_can_release_ownership function."""

    published_exp_id: str = 'exp_id_1'
    private_exp_id: str = 'exp_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.moderator = user_services.get_user_actions_info(self.moderator_id)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id)

    def test_moderator_can_release_ownership_of_published_exploration(
        self
    ) -> None:
        self.assertTrue(rights_manager.check_can_release_ownership(
            self.moderator,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_owner_can_release_ownership_of_published_exploration(
        self
    ) -> None:
        self.assertTrue(rights_manager.check_can_release_ownership(
            self.owner,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_moderator_cannot_release_ownership_of_private_exploration(
        self
    ) -> None:
        self.assertFalse(rights_manager.check_can_release_ownership(
            self.moderator,
            rights_manager.get_exploration_rights(self.private_exp_id)))

    def test_owner_cannot_release_ownership_of_private_exploration(
        self
    ) -> None:
        self.assertFalse(rights_manager.check_can_release_ownership(
            self.owner,
            rights_manager.get_exploration_rights(self.private_exp_id)))


class CheckCanUnpublishActivityTest(test_utils.GenericTestBase):
    """Tests for check_can_unpublish_activity function."""

    published_exp_id: str = 'exp_id_1'
    private_exp_id: str = 'exp_id_2'
    private_col_id: str = 'col_id_1'
    published_col_id: str = 'col_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.moderator = user_services.get_user_actions_info(self.moderator_id)
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

    def test_moderator_can_unpublish_published_collection(self) -> None:
        self.assertTrue(rights_manager.check_can_unpublish_activity(
            self.moderator,
            rights_manager.get_collection_rights(self.published_col_id)))

    def test_owner_cannot_unpublish_published_collection(self) -> None:
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.owner,
            rights_manager.get_collection_rights(self.published_col_id)))

    def test_moderator_cannot_unpublish_private_collection(self) -> None:
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.moderator,
            rights_manager.get_collection_rights(self.private_col_id)))

    def test_moderator_can_unpublish_published_exploration(self) -> None:
        self.assertTrue(rights_manager.check_can_unpublish_activity(
            self.moderator,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_owner_cannot_unpublish_published_exploration(self) -> None:
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.owner,
            rights_manager.get_exploration_rights(self.published_exp_id)))

    def test_moderator_cannot_unpublish_private_exploration(self) -> None:
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.moderator,
            rights_manager.get_exploration_rights(self.private_exp_id)))
