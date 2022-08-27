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

"""Tests for rights domain objects."""

from __future__ import annotations

import logging

from core import utils
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils

from typing import Sequence


class ActivityRightsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.viewer = user_services.get_user_actions_info(self.viewer_id)

        self.exp_id = 'exp_id'
        self.save_new_valid_exploration(self.exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.exp_id)
        self.activity_rights = rights_manager.get_exploration_rights(
            self.exp_id)

    def test_validate_community_owned_explorations(self) -> None:
        self.activity_rights.community_owned = True
        with self.assertRaisesRegex(
            Exception,
            'Community-owned explorations should have no owners, '
            'editors, voice artists or viewers specified.'):
            self.activity_rights.validate()

        self.activity_rights.owner_ids = []
        self.activity_rights.status = rights_domain.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegex(
            Exception, 'Community-owned explorations cannot be private'):
            self.activity_rights.validate()

    def test_validate_private_explorations(self) -> None:
        self.activity_rights.viewer_ids = [self.viewer_id]
        with self.assertRaisesRegex(
            Exception, 'Public explorations should have no viewers specified.'):
            self.activity_rights.validate()

    def test_validate_owner_cannot_be_editor(self) -> None:
        self.activity_rights.editor_ids = [self.owner_id]
        with self.assertRaisesRegex(
            Exception, 'A user cannot be both an owner and an editor.'):
            self.activity_rights.validate()

    def test_validate_owner_cannot_be_voice_artist(self) -> None:
        self.activity_rights.voice_artist_ids = [self.owner_id]
        with self.assertRaisesRegex(
            Exception, 'A user cannot be both an owner and a voice artist.'):
            self.activity_rights.validate()

    def test_validate_owner_cannot_be_viewer(self) -> None:
        self.activity_rights.viewer_ids = [self.owner_id]
        self.activity_rights.status = rights_domain.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegex(
            Exception, 'A user cannot be both an owner and a viewer.'):
            self.activity_rights.validate()

    def test_validate_editor_cannot_be_voice_artist(self) -> None:
        self.activity_rights.voice_artist_ids = [self.viewer_id]
        self.activity_rights.editor_ids = [self.viewer_id]
        self.activity_rights.status = rights_domain.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegex(
            Exception, 'A user cannot be both an editor and a voice artist.'):
            self.activity_rights.validate()

    def test_validate_editor_cannot_be_viewer(self) -> None:
        self.activity_rights.viewer_ids = [self.viewer_id]
        self.activity_rights.editor_ids = [self.viewer_id]
        self.activity_rights.status = rights_domain.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegex(
            Exception, 'A user cannot be both an editor and a viewer.'):
            self.activity_rights.validate()

    def test_validate_voice_artist_cannot_be_viewer(self) -> None:
        self.activity_rights.viewer_ids = [self.viewer_id]
        self.activity_rights.voice_artist_ids = [self.viewer_id]
        self.activity_rights.status = rights_domain.ACTIVITY_STATUS_PRIVATE
        with self.assertRaisesRegex(
            Exception, 'A user cannot be both a voice artist and a viewer.'):
            self.activity_rights.validate()

    def test_check_cannot_access_activity_with_no_activity_rights(self) -> None:
        self.assertFalse(rights_manager.check_can_access_activity(
            self.owner, None))

    def test_check_cannot_edit_activity_with_no_activity_rights(self) -> None:
        self.assertFalse(rights_manager.check_can_edit_activity(
            self.owner, None))

    def test_check_cannot_voiceover_activity_with_no_activity_rights(
        self
    ) -> None:
        self.assertFalse(rights_manager.check_can_voiceover_activity(
            self.owner, None))

    def test_cannot_save_activity_with_no_activity_rights(self) -> None:
        self.assertFalse(rights_manager.check_can_save_activity(
            self.owner, None))

    def test_check_cannot_delete_activity_with_no_activity_rights(self) -> None:
        self.assertFalse(rights_manager.check_can_delete_activity(
            self.owner, None))

    def test_check_cannot_modify_activity_roles_with_no_activity_rights(
        self
    ) -> None:
        self.assertFalse(rights_manager.check_can_modify_core_activity_roles(
            self.owner, None))

    def test_check_cannot_release_ownership_with_no_activity_rights(
        self
    ) -> None:
        self.assertFalse(rights_manager.check_can_release_ownership(
            self.owner, None))

    def test_check_cannnot_publish_activity_with_no_activity_rights(
        self
    ) -> None:
        self.assertFalse(rights_manager.check_can_publish_activity(
            self.owner, None))

    def test_check_cannot_publish_activity_with_cloned_from(self) -> None:
        self.activity_rights.cloned_from = 'abcdefg'
        self.assertFalse(rights_manager.check_can_publish_activity(
            self.owner, self.activity_rights))

    def test_check_cannot_unpublish_activity_with_no_activity_rights(
        self
    ) -> None:
        self.assertFalse(rights_manager.check_can_unpublish_activity(
            self.owner, None))

    def test_cannot_release_ownership_of_exploration_with_insufficient_rights(
        self
    ) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: Sequence[str]) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'The ownership of this exploration cannot be released.')

        with logging_swap, assert_raises_regexp_context_manager:
            rights_manager.release_ownership_of_exploration(
                self.viewer, self.exp_id)

        self.assertEqual(len(observed_log_messages), 1)
        self.assertEqual(
            observed_log_messages[0],
            'User %s tried to release ownership of exploration %s but was '
            'refused permission.' % (self.viewer_id, self.exp_id))

    def test_activity_should_have_atlest_one_owner(self) -> None:
        self.activity_rights.community_owned = False
        self.activity_rights.owner_ids = []

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Activity should have atleast one owner.'):
            self.activity_rights.validate()

    def test_to_dict(self) -> None:
        sample_activity_rights_dict: rights_domain.ActivityRightsDict = {
            'cloned_from': None,
            'status': rights_domain.ACTIVITY_STATUS_PUBLIC,
            'community_owned': False,
            'owner_names': ['owner'],
            'editor_names': [],
            'voice_artist_names': [],
            'viewer_names': [],
            'viewable_if_private': False,
        }
        self.assertEqual(
            self.activity_rights.to_dict(), sample_activity_rights_dict
        )

        self.activity_rights.community_owned = True
        sample_activity_rights_dict['community_owned'] = True
        sample_activity_rights_dict['owner_names'] = []
        self.assertEqual(
            self.activity_rights.to_dict(), sample_activity_rights_dict
        )

    def test_is_editor(self) -> None:
        self.activity_rights.editor_ids = ['123456']
        self.assertTrue(self.activity_rights.is_editor('123456'))
        self.assertFalse(self.activity_rights.is_editor('123457'))

    def test_is_voice_artist(self) -> None:
        self.activity_rights.voice_artist_ids = ['123456']
        self.assertTrue(self.activity_rights.is_voice_artist('123456'))
        self.assertFalse(self.activity_rights.is_voice_artist('123457'))

    def test_is_viewer(self) -> None:
        self.activity_rights.viewer_ids = ['123456']
        self.assertTrue(self.activity_rights.is_viewer('123456'))
        self.assertFalse(self.activity_rights.is_viewer('123457'))

    def test_is_solely_owned_by_user(self) -> None:
        self.activity_rights.owner_ids = ['123456']
        self.assertTrue(self.activity_rights.is_solely_owned_by_user('123456'))

        self.activity_rights.owner_ids = ['123456', '1234567']
        self.assertFalse(self.activity_rights.is_solely_owned_by_user('123456'))

    def test_assign_role_replaces_old_role(self) -> None:
        self.activity_rights.owner_ids = ['123456']
        self.activity_rights.editor_ids = []
        self.activity_rights.viewer_ids = []
        self.activity_rights.voice_artist_ids = []

        self.activity_rights.assign_new_role(
            '123456', rights_domain.ROLE_VOICE_ARTIST)
        self.assertTrue('123456' not in self.activity_rights.owner_ids)
        self.assertTrue('123456' in self.activity_rights.voice_artist_ids)

    def test_assign_new_role(self) -> None:
        self.activity_rights.owner_ids = []
        self.activity_rights.editor_ids = []
        self.activity_rights.viewer_ids = []

        self.activity_rights.assign_new_role('123456', rights_domain.ROLE_OWNER)
        self.assertTrue('123456' in self.activity_rights.owner_ids)

    def test_cannot_assign_same_role(self) -> None:
        self.activity_rights.owner_ids = ['123456']
        self.activity_rights.editor_ids = []
        self.activity_rights.viewer_ids = []

        with self.assertRaisesRegex(
            Exception, 'This user already owns this exploration.'):
            self.activity_rights.assign_new_role(
                '123456', rights_domain.ROLE_OWNER)

        self.activity_rights.assign_new_role(
            '123456', rights_domain.ROLE_EDITOR)
        with self.assertRaisesRegex(
            Exception, 'This user already can edit this exploration.'):
            self.activity_rights.assign_new_role(
                '123456', rights_domain.ROLE_EDITOR)

        self.activity_rights.assign_new_role(
            '123456', rights_domain.ROLE_VOICE_ARTIST)
        with self.assertRaisesRegex(
            Exception, 'This user already can voiceover this exploration.'):
            self.activity_rights.assign_new_role(
                '123456', rights_domain.ROLE_VOICE_ARTIST)

        self.activity_rights.status = rights_domain.ACTIVITY_STATUS_PRIVATE
        self.activity_rights.assign_new_role(
                '123456', rights_domain.ROLE_VIEWER)
        with self.assertRaisesRegex(
            Exception, 'This user already can view this exploration.'):
            self.activity_rights.assign_new_role(
                '123456', rights_domain.ROLE_VIEWER)

    def test_cannot_assign_viewer_to_public_exp(self) -> None:
        self.activity_rights.owner_ids = []
        self.activity_rights.editor_ids = []
        self.activity_rights.viewer_ids = []
        self.activity_rights.status = rights_domain.ACTIVITY_STATUS_PUBLIC

        with self.assertRaisesRegex(
            Exception, 'Public explorations can be viewed by anyone.'):
            self.activity_rights.assign_new_role(
                '123456', rights_domain.ROLE_VIEWER)


class ExplorationRightsChangeTests(test_utils.GenericTestBase):

    def test_exploration_rights_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            rights_domain.ExplorationRightsChange({'invalid': 'data'})

    def test_exploration_rights_change_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            rights_domain.ExplorationRightsChange({'cmd': 'invalid'})

    def test_exploration_rights_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_role, old_role')):
            rights_domain.ExplorationRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
            })

    def test_exploration_rights_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            rights_domain.ExplorationRightsChange({
                'cmd': 'change_private_viewability',
                'old_viewable_if_private': 'old_viewable_if_private',
                'new_viewable_if_private': 'new_viewable_if_private',
                'invalid': 'invalid'
            })

    def test_exploration_rights_change_object_with_invalid_role(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for new_role in cmd change_role: '
                'invalid is not allowed')):
            rights_domain.ExplorationRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
                'old_role': rights_domain.ROLE_OWNER,
                'new_role': 'invalid',
            })

    def test_exploration_rights_change_object_with_invalid_status(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for new_status in cmd change_exploration_status: '
                'invalid is not allowed')):
            rights_domain.ExplorationRightsChange({
                'cmd': 'change_exploration_status',
                'old_status': rights_domain.ACTIVITY_STATUS_PRIVATE,
                'new_status': 'invalid'
            })

    def test_exploration_rights_change_object_with_create_new(self) -> None:
        exploration_rights_change_object = (
            rights_domain.ExplorationRightsChange({'cmd': 'create_new'}))
        self.assertEqual(exploration_rights_change_object.cmd, 'create_new')

    def test_exploration_rights_change_object_with_change_role(self) -> None:
        exploration_rights_change_object = (
            rights_domain.ExplorationRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
                'old_role': rights_domain.ROLE_OWNER,
                'new_role': rights_domain.ROLE_VIEWER
            })
        )

        self.assertEqual(exploration_rights_change_object.cmd, 'change_role')
        self.assertEqual(
            exploration_rights_change_object.assignee_id, 'assignee_id')
        self.assertEqual(
            exploration_rights_change_object.old_role,
            rights_domain.ROLE_OWNER
        )
        self.assertEqual(
            exploration_rights_change_object.new_role,
            rights_domain.ROLE_VIEWER
        )

    def test_exploration_rights_change_object_with_release_ownership(
        self
    ) -> None:
        exploration_rights_change_object = (
            rights_domain.ExplorationRightsChange(
                {'cmd': 'release_ownership'}
            )
        )

        self.assertEqual(
            exploration_rights_change_object.cmd, 'release_ownership')

    def test_exploration_rights_change_object_with_change_private_viewability(
        self
    ) -> None:
        exploration_rights_change_object = (
            rights_domain.ExplorationRightsChange({
                'cmd': 'change_private_viewability',
                'old_viewable_if_private': 'old_viewable_if_private',
                'new_viewable_if_private': 'new_viewable_if_private'
            })
        )

        self.assertEqual(
            exploration_rights_change_object.cmd, 'change_private_viewability')
        self.assertEqual(
            exploration_rights_change_object.old_viewable_if_private,
            'old_viewable_if_private')
        self.assertEqual(
            exploration_rights_change_object.new_viewable_if_private,
            'new_viewable_if_private')

    def test_exploration_rights_change_object_with_update_first_published_msec(
        self
    ) -> None:
        exploration_rights_change_object = (
            rights_domain.ExplorationRightsChange({
                'cmd': 'update_first_published_msec',
                'old_first_published_msec': 'old_first_published_msec',
                'new_first_published_msec': 'new_first_published_msec'
            })
        )

        self.assertEqual(
            exploration_rights_change_object.cmd, 'update_first_published_msec')
        self.assertEqual(
            exploration_rights_change_object.old_first_published_msec,
            'old_first_published_msec')
        self.assertEqual(
            exploration_rights_change_object.new_first_published_msec,
            'new_first_published_msec')

    def test_exploration_rights_change_object_with_change_exploration_status(
        self
    ) -> None:
        exploration_rights_change_object = (
            rights_domain.ExplorationRightsChange({
                'cmd': 'change_exploration_status',
                'old_status': rights_domain.ACTIVITY_STATUS_PRIVATE,
                'new_status': rights_domain.ACTIVITY_STATUS_PUBLIC
            })
        )

        self.assertEqual(
            exploration_rights_change_object.cmd, 'change_exploration_status')
        self.assertEqual(
            exploration_rights_change_object.old_status,
            rights_domain.ACTIVITY_STATUS_PRIVATE)
        self.assertEqual(
            exploration_rights_change_object.new_status,
            rights_domain.ACTIVITY_STATUS_PUBLIC)

    def test_to_dict(self) -> None:
        exploration_rights_change_dict = {
            'cmd': 'change_private_viewability',
            'old_viewable_if_private': 'old_viewable_if_private',
            'new_viewable_if_private': 'new_viewable_if_private'
        }
        exploration_rights_change_object = (
            rights_domain.ExplorationRightsChange(
                exploration_rights_change_dict))
        self.assertEqual(
            exploration_rights_change_object.to_dict(),
            exploration_rights_change_dict)


class CollectionRightsChangeTests(test_utils.GenericTestBase):

    def test_collection_rights_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            rights_domain.CollectionRightsChange({'invalid': 'data'})

    def test_collection_rights_change_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            rights_domain.CollectionRightsChange({'cmd': 'invalid'})

    def test_collection_rights_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_role, old_role')):
            rights_domain.CollectionRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
            })

    def test_collection_rights_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            rights_domain.CollectionRightsChange({
                'cmd': 'change_private_viewability',
                'old_viewable_if_private': 'old_viewable_if_private',
                'new_viewable_if_private': 'new_viewable_if_private',
                'invalid': 'invalid'
            })

    def test_collection_rights_change_object_with_invalid_role(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for new_role in cmd change_role: '
                'invalid is not allowed')):
            rights_domain.CollectionRightsChange({
                'cmd': 'change_role',
                'assignee_id': 'assignee_id',
                'old_role': rights_domain.ROLE_OWNER,
                'new_role': 'invalid',
            })

    def test_collection_rights_change_object_with_invalid_status(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for new_status in cmd change_collection_status: '
                'invalid is not allowed')):
            rights_domain.CollectionRightsChange({
                'cmd': 'change_collection_status',
                'old_status': rights_domain.ACTIVITY_STATUS_PRIVATE,
                'new_status': 'invalid'
            })

    def test_collection_rights_change_object_with_create_new(self) -> None:
        collection_rights_change_object = rights_domain.CollectionRightsChange({
            'cmd': 'create_new'
        })

        self.assertEqual(collection_rights_change_object.cmd, 'create_new')

    def test_collection_rights_change_object_with_change_role(self) -> None:
        collection_rights_change_object = rights_domain.CollectionRightsChange({
            'cmd': 'change_role',
            'assignee_id': 'assignee_id',
            'old_role': rights_domain.ROLE_OWNER,
            'new_role': rights_domain.ROLE_VIEWER
        })

        self.assertEqual(collection_rights_change_object.cmd, 'change_role')
        self.assertEqual(
            collection_rights_change_object.assignee_id, 'assignee_id')
        self.assertEqual(
            collection_rights_change_object.old_role, rights_domain.ROLE_OWNER)
        self.assertEqual(
            collection_rights_change_object.new_role, rights_domain.ROLE_VIEWER)

    def test_collection_rights_change_object_with_release_ownership(
        self
    ) -> None:
        collection_rights_change_object = rights_domain.CollectionRightsChange({
            'cmd': 'release_ownership'
        })

        self.assertEqual(
            collection_rights_change_object.cmd, 'release_ownership')

    def test_collection_rights_change_object_with_change_private_viewability(
        self
    ) -> None:
        collection_rights_change_object = rights_domain.CollectionRightsChange({
            'cmd': 'change_private_viewability',
            'old_viewable_if_private': 'old_viewable_if_private',
            'new_viewable_if_private': 'new_viewable_if_private'
        })

        self.assertEqual(
            collection_rights_change_object.cmd, 'change_private_viewability')
        self.assertEqual(
            collection_rights_change_object.old_viewable_if_private,
            'old_viewable_if_private')
        self.assertEqual(
            collection_rights_change_object.new_viewable_if_private,
            'new_viewable_if_private')

    def test_collection_rights_change_object_with_update_first_published_msec(
        self
    ) -> None:
        collection_rights_change_object = rights_domain.CollectionRightsChange({
            'cmd': 'update_first_published_msec',
            'old_first_published_msec': 'old_first_published_msec',
            'new_first_published_msec': 'new_first_published_msec'
        })

        self.assertEqual(
            collection_rights_change_object.cmd, 'update_first_published_msec')
        self.assertEqual(
            collection_rights_change_object.old_first_published_msec,
            'old_first_published_msec')
        self.assertEqual(
            collection_rights_change_object.new_first_published_msec,
            'new_first_published_msec')

    def test_collection_rights_change_object_with_change_collection_status(
        self
    ) -> None:
        collection_rights_change_object = (
            rights_domain.CollectionRightsChange({
                'cmd': 'change_collection_status',
                'old_status': rights_domain.ACTIVITY_STATUS_PRIVATE,
                'new_status': rights_domain.ACTIVITY_STATUS_PUBLIC
            })
        )

        self.assertEqual(
            collection_rights_change_object.cmd, 'change_collection_status')
        self.assertEqual(
            collection_rights_change_object.old_status,
            rights_domain.ACTIVITY_STATUS_PRIVATE)
        self.assertEqual(
            collection_rights_change_object.new_status,
            rights_domain.ACTIVITY_STATUS_PUBLIC)

    def test_to_dict(self) -> None:
        collection_rights_change_dict = {
            'cmd': 'change_private_viewability',
            'old_viewable_if_private': 'old_viewable_if_private',
            'new_viewable_if_private': 'new_viewable_if_private'
        }
        collection_rights_change_object = rights_domain.CollectionRightsChange(
            collection_rights_change_dict)
        self.assertEqual(
            collection_rights_change_object.to_dict(),
            collection_rights_change_dict)
