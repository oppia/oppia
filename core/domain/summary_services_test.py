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

from core.domain import activity_domain
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import collection_services_test
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import exp_services_test
from core.domain import rights_manager
from core.domain import summary_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class HumanReadableContributorsSummariesTest(
        exp_services_test.ExplorationServicesUnitTests):
    """Test functions for getting human readable contributors summaries."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    USER_C_NAME = 'c'
    USER_D_NAME = 'd'
    USER_C_EMAIL = 'c@example.com'
    USER_D_EMAIL = 'd@example.com'

    USER_C_PROFILE_PICTURE = 'c_profile_picture'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'
    EXP_ID_3 = 'eid3'
    EXP_ID_4 = 'eid4'
    EXP_ID_5 = 'eid5'

    EXPECTED_VERSION_1 = 4
    EXPECTED_VERSION_2 = 2

    def setUp(self):
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Bob edits the title of EXP_ID_1.
        - (3) Albert creates EXP_ID_2.
        - (4) Albert edits the title of EXP_ID_1.
        - (5) Albert edits the title of EXP_ID_2.
        - (6) Bob reverts Albert's last edit to EXP_ID_1.
        - Bob tries to publish EXP_ID_2, and is denied access.
        - (7) Albert publishes EXP_ID_2.
        - (8) Albert creates EXP_ID_3
        - (9) Albert publishes EXP_ID_3
        - (10) Albert deletes EXP_ID_3

        - (1) User_3 (has a profile_picture) creates EXP_ID_4.
        - (2) User_4 edits the title of EXP_ID_4.
        - (3) User_4 edits the title of EXP_ID_4.
        """

        super(HumanReadableContributorsSummariesTest, self).setUp()

        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)

        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')

        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            }], 'Changed title to Albert1 title.')

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_2, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 2 Albert title'
            }], 'Changed title to Albert2 title.')

        exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 3, 2)

        with self.assertRaisesRegexp(
            Exception, 'This exploration cannot be published'
            ):
            rights_manager.publish_exploration(self.bob_id, self.EXP_ID_2)

        rights_manager.publish_exploration(self.albert_id, self.EXP_ID_2)

        self.save_new_valid_exploration(self.EXP_ID_3, self.albert_id)
        rights_manager.publish_exploration(self.albert_id, self.EXP_ID_3)
        exp_services.delete_exploration(self.albert_id, self.EXP_ID_3)

        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)
        self.user_d_id = self.get_user_id_from_email(self.USER_D_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_NAME)
        self.signup(self.USER_D_EMAIL, self.USER_D_NAME)
        user_services.update_profile_picture_data_url(
            self.user_c_id, self.USER_C_PROFILE_PICTURE)

        self.save_new_valid_exploration(self.EXP_ID_4, self.user_c_id)
        exp_services.update_exploration(
            self.user_d_id, self.EXP_ID_4, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration updated title'
            }], 'Changed title once.')

        exp_services.update_exploration(
            self.user_d_id, self.EXP_ID_4, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration updated title again'
            }], 'Changed title twice.')

        self.save_new_valid_exploration(self.EXP_ID_5, self.bob_id)

    def test_get_human_readable_contributors_summary(self):
        contributors_summary = {self.albert_id: 10, self.bob_id: 13}
        self.assertEqual({
            self.ALBERT_NAME: {
                'num_commits': 10,
                'profile_picture_data_url': (
                    user_services.DEFAULT_IDENTICON_DATA_URL)
            },
            self.BOB_NAME: {
                'num_commits': 13,
                'profile_picture_data_url': (
                    user_services.DEFAULT_IDENTICON_DATA_URL)
            }
        }, summary_services.get_human_readable_contributors_summary(
            contributors_summary))

        contributors_summary = {self.user_c_id: 1, self.user_d_id: 2}
        self.assertEqual({
            self.USER_C_NAME: {
                'num_commits': 1,
                'profile_picture_data_url': self.USER_C_PROFILE_PICTURE
            },
            self.USER_D_NAME: {
                'num_commits': 2,
                'profile_picture_data_url': (
                    user_services.DEFAULT_IDENTICON_DATA_URL)
            }
        }, summary_services.get_human_readable_contributors_summary(
            contributors_summary))


class ActivityReferenceAccessCheckerTests(test_utils.GenericTestBase):
    """Tests for requiring that activity references are public."""

    EXP_ID_0 = 'exp_id_0'
    EXP_ID_1 = 'exp_id_1'
    COL_ID_2 = 'col_id_2'

    def setUp(self):
        super(ActivityReferenceAccessCheckerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_requiring_nonexistent_activities_be_public_raises_exception(self):
        with self.assertRaisesRegexp(Exception, 'non-existent exploration'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    feconf.ACTIVITY_TYPE_EXPLORATION, 'fake')])
        with self.assertRaisesRegexp(Exception, 'non-existent collection'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    feconf.ACTIVITY_TYPE_COLLECTION, 'fake')])

    def test_requiring_private_activities_to_be_public_raises_exception(self):
        self.save_new_valid_exploration(self.EXP_ID_0, self.owner_id)
        self.save_new_valid_exploration(self.EXP_ID_1, self.owner_id)
        self.save_new_valid_collection(
            self.COL_ID_2, self.owner_id, exploration_id=self.EXP_ID_0)

        with self.assertRaisesRegexp(Exception, 'private exploration'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID_0)])
        with self.assertRaisesRegexp(Exception, 'private collection'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    feconf.ACTIVITY_TYPE_COLLECTION, self.COL_ID_2)])

    def test_requiring_public_activities_to_be_public_succeeds(self):
        self.save_new_valid_exploration(self.EXP_ID_0, self.owner_id)
        self.save_new_valid_collection(
            self.COL_ID_2, self.owner_id, exploration_id=self.EXP_ID_0)

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID_0)
        rights_manager.publish_collection(self.owner_id, self.COL_ID_2)

        # There are no validation errors.
        summary_services.require_activities_to_be_public([
            activity_domain.ActivityReference(
                feconf.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID_0),
            activity_domain.ActivityReference(
                feconf.ACTIVITY_TYPE_COLLECTION, self.COL_ID_2)])


class ExplorationSummaryGetTests(
        exp_services_test.ExplorationServicesUnitTests):
    """Test exploration summaries get_* functions."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'
    EXP_ID_3 = 'eid3'

    EXPECTED_VERSION_1 = 4
    EXPECTED_VERSION_2 = 2

    def setUp(self):
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Bob edits the title of EXP_ID_1.
        - (3) Albert creates EXP_ID_2.
        - (4) Albert edits the title of EXP_ID_1.
        - (5) Albert edits the title of EXP_ID_2.
        - (6) Bob reverts Albert's last edit to EXP_ID_1.
        - Bob tries to publish EXP_ID_2, and is denied access.
        - (7) Albert publishes EXP_ID_2.
        - (8) Albert creates EXP_ID_3
        - (9) Albert publishes EXP_ID_3
        - (10) Albert deletes EXP_ID_3
        """
        super(ExplorationSummaryGetTests, self).setUp()

        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)

        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')

        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            }], 'Changed title to Albert1 title.')

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_2, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 2 Albert title'
            }], 'Changed title to Albert2 title.')

        exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 3, 2)

        with self.assertRaisesRegexp(
            Exception, 'This exploration cannot be published'
            ):
            rights_manager.publish_exploration(self.bob_id, self.EXP_ID_2)

        rights_manager.publish_exploration(self.albert_id, self.EXP_ID_2)

        self.save_new_valid_exploration(self.EXP_ID_3, self.albert_id)
        rights_manager.publish_exploration(self.albert_id, self.EXP_ID_3)
        exp_services.delete_exploration(self.albert_id, self.EXP_ID_3)

    def test_get_non_private_exploration_summaries(self):

        actual_summaries = summary_services.get_non_private_exploration_summaries() # pylint: disable=line-too-long

        expected_summaries = {
            self.EXP_ID_2: exp_domain.ExplorationSummary(
                self.EXP_ID_2, 'Exploration 2 Albert title',
                'A category', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_manager.ACTIVITY_STATUS_PUBLIC,
                False, [self.albert_id], [], [], [self.albert_id],
                {self.albert_id: 1},
                self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
                )}

        # check actual summaries equal expected summaries
        self.assertEqual(actual_summaries.keys(),
                         expected_summaries.keys())
        simple_props = ['id', 'title', 'category', 'objective',
                        'language_code', 'tags', 'ratings',
                        'scaled_average_rating', 'status',
                        'community_owned', 'owner_ids',
                        'editor_ids', 'viewer_ids',
                        'contributor_ids', 'version',
                        'exploration_model_created_on',
                        'exploration_model_last_updated']
        for exp_id in actual_summaries.keys():
            for prop in simple_props:
                self.assertEqual(getattr(actual_summaries[exp_id], prop),
                                 getattr(expected_summaries[exp_id], prop))

    def test_get_all_exploration_summaries(self):
        actual_summaries = summary_services.get_all_exploration_summaries()

        expected_summaries = {
            self.EXP_ID_1: exp_domain.ExplorationSummary(
                self.EXP_ID_1, 'Exploration 1 title',
                'A category', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_manager.ACTIVITY_STATUS_PRIVATE,
                False, [self.albert_id], [], [], [self.albert_id, self.bob_id],
                {self.albert_id: 1, self.bob_id: 1}, self.EXPECTED_VERSION_1,
                actual_summaries[self.EXP_ID_1].exploration_model_created_on,
                actual_summaries[self.EXP_ID_1].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_1].first_published_msec
            ),
            self.EXP_ID_2: exp_domain.ExplorationSummary(
                self.EXP_ID_2, 'Exploration 2 Albert title',
                'A category', 'An objective', 'en', [],
                feconf.get_empty_ratings(), feconf.EMPTY_SCALED_AVERAGE_RATING,
                rights_manager.ACTIVITY_STATUS_PUBLIC,
                False, [self.albert_id], [], [], [self.albert_id],
                {self.albert_id: 1}, self.EXPECTED_VERSION_2,
                actual_summaries[self.EXP_ID_2].exploration_model_created_on,
                actual_summaries[self.EXP_ID_2].exploration_model_last_updated,
                actual_summaries[self.EXP_ID_2].first_published_msec
            )
        }

        # check actual summaries equal expected summaries
        self.assertEqual(actual_summaries.keys(),
                         expected_summaries.keys())
        simple_props = ['id', 'title', 'category', 'objective',
                        'language_code', 'tags', 'ratings', 'status',
                        'community_owned', 'owner_ids',
                        'editor_ids', 'viewer_ids', 'contributor_ids',
                        'version', 'exploration_model_created_on',
                        'exploration_model_last_updated']
        for exp_id in actual_summaries.keys():
            for prop in simple_props:
                self.assertEqual(getattr(actual_summaries[exp_id], prop),
                                 getattr(expected_summaries[exp_id], prop))


class CollectionSummaryTests(
        collection_services_test.CollectionServicesUnitTests):
    """Test collection summaries."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    COLLECTION_ID_1 = 'cid1'
    COLLECTION_ID_2 = 'cid2'

    def test_is_collection_summary_editable(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.owner_id)

        # Check that only the owner may edit.
        collection_summary = summary_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertTrue(summary_services.is_collection_summary_editable(
            collection_summary, user_id=self.owner_id))
        self.assertFalse(summary_services.is_collection_summary_editable(
            collection_summary, user_id=self.editor_id))
        self.assertFalse(summary_services.is_collection_summary_editable(
            collection_summary, user_id=self.viewer_id))

        # Owner makes viewer a viewer and editor an editor.
        rights_manager.assign_role_for_collection(
            self.owner_id, self.COLLECTION_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_collection(
            self.owner_id, self.COLLECTION_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        collection_summary = summary_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertTrue(summary_services.is_collection_summary_editable(
            collection_summary, user_id=self.owner_id))
        self.assertTrue(summary_services.is_collection_summary_editable(
            collection_summary, user_id=self.editor_id))
        self.assertFalse(summary_services.is_collection_summary_editable(
            collection_summary, user_id=self.viewer_id))

    def test_contributor_ids(self):
        # Sign up two users.
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        # Have Albert create a collection.
        self.save_new_valid_collection(self.COLLECTION_ID, albert_id)
        # Have Bob edit the collection.
        changelist_cmds = [{
            'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'property_name': 'title',
            'new_value': 'Collection Bob title'
        }]
        collection_services.update_collection(
            bob_id, self.COLLECTION_ID, changelist_cmds,
            'Changed title to Bob title.')
        # Albert adds an owner and an editor.
        rights_manager.assign_role_for_collection(
            albert_id, self.COLLECTION_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_collection(
            albert_id, self.COLLECTION_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)
        # Verify that only Albert and Bob are listed as contributors for the
        # collection.
        collection_summary = summary_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertEqual(
            collection_summary.contributor_ids,
            [albert_id, bob_id])

    def _check_contributors_summary(self, collection_id, expected):
        contributors_summary = summary_services.get_collection_summary_by_id(
            collection_id).contributors_summary
        self.assertEqual(expected, contributors_summary)

    def test_contributor_summary(self):
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        # Have Albert create a new collection. Version 1
        self.save_new_valid_collection(self.COLLECTION_ID, albert_id)
        self._check_contributors_summary(self.COLLECTION_ID, {albert_id: 1})
        changelist_cmds = [{
            'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'property_name': 'title',
            'new_value': 'Collection Bob title'
        }]
         # Have Bob update that collection. Version 2
        collection_services.update_collection(
            bob_id, self.COLLECTION_ID, changelist_cmds, 'Changed title.')
        self._check_contributors_summary(self.COLLECTION_ID,
                                         {albert_id: 1, bob_id: 1})
        # Have Bob update that collection. Version 3
        collection_services.update_collection(
            bob_id, self.COLLECTION_ID, changelist_cmds, 'Changed title.')
        self._check_contributors_summary(self.COLLECTION_ID,
                                         {albert_id: 1, bob_id: 2})

        # Have Albert update that collection. Version 4
        collection_services.update_collection(
            albert_id, self.COLLECTION_ID, changelist_cmds, 'Changed title.')
        self._check_contributors_summary(self.COLLECTION_ID,
                                         {albert_id: 2, bob_id: 2})

        # TODO(madiyar): uncomment after revert_collection implementation
        # Have Albert revert to version 3. Version 5
        # collection_services.revert_collection(albert_id,
        #       self.COLLECTION_ID, 4, 3)
        # self._check_contributors_summary(self.COLLECTION_ID,
        #                                 {albert_id: 1, bob_id: 2})


class ExplorationSummaryTests(exp_services_test.ExplorationServicesUnitTests):
    """Test exploration summaries."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'

    def test_is_exp_summary_editable(self):
        self.save_new_default_exploration(self.EXP_ID, self.owner_id)

        # Check that only the owner may edit.
        exp_summary = summary_services.get_exploration_summary_by_id(
            self.EXP_ID)
        self.assertTrue(summary_services.is_exp_summary_editable(
            exp_summary, user_id=self.owner_id))
        self.assertFalse(summary_services.is_exp_summary_editable(
            exp_summary, user_id=self.editor_id))
        self.assertFalse(summary_services.is_exp_summary_editable(
            exp_summary, user_id=self.viewer_id))

        # Owner makes viewer a viewer and editor an editor.
        rights_manager.assign_role_for_exploration(
            self.owner_id, self.EXP_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_exploration(
            self.owner_id, self.EXP_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        exp_summary = summary_services.get_exploration_summary_by_id(
            self.EXP_ID)
        self.assertTrue(summary_services.is_exp_summary_editable(
            exp_summary, user_id=self.owner_id))
        self.assertTrue(summary_services.is_exp_summary_editable(
            exp_summary, user_id=self.editor_id))
        self.assertFalse(summary_services.is_exp_summary_editable(
            exp_summary, user_id=self.viewer_id))

    def test_contributors_not_updated_on_revert(self):
        """Test that a user who only makes a revert on an exploration
        is not counted in the list of that exploration's contributors.
        """
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        # Have Albert create a new exploration.
        self.save_new_valid_exploration(self.EXP_ID_1, albert_id)
        # Have Albert update that exploration.
        exp_services.update_exploration(
            albert_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        # Have Bob revert Albert's update.
        exp_services.revert_exploration(bob_id, self.EXP_ID_1, 2, 1)

        # Verify that only Albert (and not Bob, who has not made any non-
        # revert changes) appears in the contributors list for this
        # exploration.
        exploration_summary = summary_services.get_exploration_summary_by_id(
            self.EXP_ID_1)
        self.assertEqual([albert_id], exploration_summary.contributor_ids)

    def _check_contributors_summary(self, exp_id, expected):
        contributors_summary = summary_services.get_exploration_summary_by_id(
            exp_id).contributors_summary
        self.assertEqual(expected, contributors_summary)

    def test_contributors_summary(self):
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        # Have Albert create a new exploration. Version 1
        self.save_new_valid_exploration(self.EXP_ID_1, albert_id)
        self._check_contributors_summary(self.EXP_ID_1, {albert_id: 1})

         # Have Bob update that exploration. Version 2
        exp_services.update_exploration(
            bob_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        self._check_contributors_summary(self.EXP_ID_1,
                                         {albert_id: 1, bob_id: 1})
        # Have Bob update that exploration. Version 3
        exp_services.update_exploration(
            bob_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        self._check_contributors_summary(self.EXP_ID_1,
                                         {albert_id: 1, bob_id: 2})

        # Have Albert update that exploration. Version 4
        exp_services.update_exploration(
            albert_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')
        self._check_contributors_summary(self.EXP_ID_1,
                                         {albert_id: 2, bob_id: 2})

        # Have Albert revert to version 3. Version 5
        exp_services.revert_exploration(albert_id, self.EXP_ID_1, 4, 3)
        self._check_contributors_summary(self.EXP_ID_1,
                                         {albert_id: 1, bob_id: 2})
