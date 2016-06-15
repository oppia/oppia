# coding: utf-8
#
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

from core.domain import collection_services
from core.domain import exp_services
from core.domain import library_services
from core.domain import rights_manager
from core.tests import test_utils


class LibraryServicesTests(test_utils.GenericTestBase):
    """Test the library services module."""

    EXP_ID_0 = 'EXP_ID_0'
    EXP_ID_1 = 'EXP_ID_1'
    COL_ID_2 = 'COL_ID_2'

    def setUp(self):
        """Publish two explorations and one collection."""
        super(LibraryServicesTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])

        self.save_new_valid_exploration(self.EXP_ID_0, self.owner_id)
        self.save_new_valid_exploration(self.EXP_ID_1, self.owner_id)
        self.save_new_valid_collection(
            self.COL_ID_2, self.owner_id, exploration_id=self.EXP_ID_0)

    def test_basic_operations(self):
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_0)
        rights_manager.publish_collection(self.owner_id, self.COL_ID_2)

        self.assertEqual(library_services.get_featured_activity_ids(), [])
        library_services.update_featured_activity_ids([
            'e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])
        self.assertEqual(
            library_services.get_featured_activity_ids(),
            ['e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])
        library_services.update_featured_activity_ids([])
        self.assertEqual(library_services.get_featured_activity_ids(), [])

    def test_error_handling(self):
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_0)
        rights_manager.publish_collection(self.owner_id, self.COL_ID_2)
        self.assertEqual(library_services.get_featured_activity_ids(), [])

        with self.assertRaisesRegexp(Exception, 'Invalid activity id:'):
            library_services.update_featured_activity_ids([self.EXP_ID_0])
        with self.assertRaisesRegexp(Exception, 'Invalid activity id:'):
            library_services.update_featured_activity_ids([self.COL_ID_2])

        with self.assertRaisesRegexp(Exception, 'should not have duplicates'):
            library_services.update_featured_activity_ids([
                'e:%s' % self.EXP_ID_0, 'e:%s' % self.EXP_ID_0])

    def test_deleted_activity_is_removed_from_featured_list(self):
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_0)
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_1)
        rights_manager.publish_collection(self.owner_id, self.COL_ID_2)

        self.assertEqual(library_services.get_featured_activity_ids(), [])
        library_services.update_featured_activity_ids([
            'e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])
        self.assertEqual(
            library_services.get_featured_activity_ids(),
            ['e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])

        # Deleting an unfeatured activity does not affect the featured list.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_1)
        self.assertEqual(
            library_services.get_featured_activity_ids(),
            ['e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])

        # Deleting a featured activity removes it from the featured list.
        collection_services.delete_collection(self.owner_id, self.COL_ID_2)
        self.assertEqual(
            library_services.get_featured_activity_ids(),
            ['e:%s' % self.EXP_ID_0])
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_0)
        self.assertEqual(
            library_services.get_featured_activity_ids(), [])

    def test_unpublished_activity_is_removed_from_featured_list(self):
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_0)
        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_1)
        rights_manager.publish_collection(self.owner_id, self.COL_ID_2)

        self.assertEqual(library_services.get_featured_activity_ids(), [])
        library_services.update_featured_activity_ids([
            'e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])
        self.assertEqual(
            library_services.get_featured_activity_ids(),
            ['e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])

        # Unpublishing an unfeatured activity does not affect the featured
        # list.
        rights_manager.unpublish_exploration(self.moderator_id, self.EXP_ID_1)
        self.assertEqual(
            library_services.get_featured_activity_ids(),
            ['e:%s' % self.EXP_ID_0, 'c:%s' % self.COL_ID_2])

        # Unpublishing a featured activity removes it from the featured list.
        rights_manager.unpublish_collection(self.moderator_id, self.COL_ID_2)
        self.assertEqual(
            library_services.get_featured_activity_ids(),
            ['e:%s' % self.EXP_ID_0])
        rights_manager.unpublish_exploration(self.moderator_id, self.EXP_ID_0)
        self.assertEqual(
            library_services.get_featured_activity_ids(), [])

    def test_publish_or_publicize_activity_does_not_affect_featured_list(self):
        self.assertEqual(library_services.get_featured_activity_ids(), [])

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_0)
        self.assertEqual(library_services.get_featured_activity_ids(), [])
        rights_manager.publicize_exploration(self.moderator_id, self.EXP_ID_0)
        self.assertEqual(library_services.get_featured_activity_ids(), [])
        rights_manager.unpublicize_exploration(
            self.moderator_id, self.EXP_ID_0)
        self.assertEqual(library_services.get_featured_activity_ids(), [])

        rights_manager.publish_collection(self.owner_id, self.COL_ID_2)
        self.assertEqual(library_services.get_featured_activity_ids(), [])
        rights_manager.publicize_collection(self.moderator_id, self.COL_ID_2)
        self.assertEqual(library_services.get_featured_activity_ids(), [])
        rights_manager.unpublicize_collection(
            self.moderator_id, self.COL_ID_2)
        self.assertEqual(library_services.get_featured_activity_ids(), [])
