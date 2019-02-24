# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for learner playlist services."""

from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.domain import subscription_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])

MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT = (
    feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)


class LearnerPlaylistTests(test_utils.GenericTestBase):
    """Test the services related to learner playlist services."""

    EXP_ID_0 = '0_en_arch_bridges_in_england'
    EXP_ID_1 = '1_fi_arch_sillat_suomi'
    EXP_ID_2 = '2_en_welcome_introduce_oppia'
    EXP_ID_3 = '3_welcome_oppia'
    COL_ID_0 = '0_arch_bridges_in_england'
    COL_ID_1 = '1_welcome_introduce_oppia'
    COL_ID_2 = '2_welcome_introduce_oppia_interactions'
    COL_ID_3 = '3_welcome_oppia_collection'
    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    def setUp(self):
        super(LearnerPlaylistTests, self).setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        # Save a few explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_id, title='Introduce Oppia',
            category='Welcome', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.owner_id, title='Welcome Oppia',
            category='Welcome', language_code='en')

        # Save a few collections.
        self.save_new_default_collection(
            self.COL_ID_0, self.owner_id, title='Bridges',
            category='Architecture')
        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title='Introduce Oppia',
            category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_2, self.user_id,
            title='Introduce Interactions in Oppia', category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title='Welcome Oppia Collection',
            category='Welcome')

    def _get_all_learner_playlist_exp_ids(self, user_id):
        """Returns the list of all the exploration ids in the learner's playlist
        corresponding to the given user id.
        """
        learner_playlist_model = user_models.LearnerPlaylistModel.get(
            user_id, strict=False)

        return (
            learner_playlist_model.exploration_ids if
            learner_playlist_model else [])

    def _get_all_learner_playlist_collection_ids(self, user_id):
        """Returns the list of all the collection ids in the learner's playlist
        corresponding to the given user id.
        """
        learner_playlist_model = user_models.LearnerPlaylistModel.get(
            user_id, strict=False)

        return (
            learner_playlist_model.collection_ids if
            learner_playlist_model else [])

    def test_adding_subscribed_exp_to_playlist_does_nothing_without_pos(self):
        # Subscribe to exploration.
        subscription_services.subscribe_to_exploration(
            self.user_id, 'SUBSCRIBED_ID')

        # Now if we try to add the same exploration, it shouldn't be added.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, 'SUBSCRIBED_ID')
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), [])

    def test_adding_existing_exp_to_playlist_does_not_add_again_with_pos(self):
        # Test adding the exploration_id if it is already in
        # learner_playlist.exploration_ids
        # Add two explorations to the learner playlist.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        # Add the first exploration to the second position.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0,
            position_to_be_inserted=1)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_1, self.EXP_ID_0])

    def test_nunmber_of_exps_cannot_exceed_max_with_given_pos(self):
        # Add MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT explorations at given
        # positions.
        exp_ids = ['SAMPLE_EXP_ID_%s' % index for index in range(
            0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)]
        for i in range(0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT):
            learner_progress_services.add_exp_to_learner_playlist(
                self.user_id, exp_ids[i], position_to_be_inserted=i)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), exp_ids)

        # Now if we try to add another exploration at the end of the list,
        # it shouldn't be added as the list length would exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, 'SAPMLE_EXP_ID',
            position_to_be_inserted=MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), exp_ids)

    def test_number_of_exps_cannot_exceed_max_without_given_pos(self):
        # Test that the length of the learner playlist doesn't exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        exp_ids = ['SAMPLE_EXP_ID_%s' % index for index in range(
            0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)]
        for exp_id in exp_ids:
            learner_progress_services.add_exp_to_learner_playlist(
                self.user_id, exp_id)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), exp_ids)

        # Now if we try adding another exploration, it shouldn't be added as the
        # list length would exceed MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, 'SAMPLE_EXP_ID')
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), exp_ids)

    def test_adding_subscribed_col_to_playlist_does_nothing_with_no_pos(self):
        # Subscribe to collection.
        subscription_services.subscribe_to_collection(
            self.user_id, 'SUBSCRIBED_ID')

        # Now if we try to add the same collection, it shouldn't be added.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, 'SUBSCRIBED_ID')
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(self.user_id), [])

    def test_adding_existing_col_to_playlist_does_not_add_again_with_pos(self):
        # Test adding the collection_id if it is already in
        # learner_playlist.collection_ids
        # Add two collections to the learner playlist.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Add the first collection to the second position.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0,
            position_to_be_inserted=1)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_1, self.COL_ID_0])

    def test_number_of_cols_cannot_exceed_max_with_given_pos(self):
        # Add MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT collections at given
        # positions.
        col_ids = ['SAMPLE_COL_ID_%s' % index for index in range(
            0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)]
        for i in range(0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT):
            learner_progress_services.add_collection_to_learner_playlist(
                self.user_id, col_ids[i], position_to_be_inserted=i)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), col_ids)

        # Now if we try to add another collection at the end of the list,
        # it shouldn't be added as the list length would exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, 'SAMPLE_COL_ID',
            position_to_be_inserted=MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), col_ids)

    def test_number_of_cols_cannot_exceed_max_without_given_pos(self):
        # Test that the length of the learner playlist doesn't exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        # List of collections to be added.
        col_ids = ['SAMPLE_COL_ID_%s' % index for index in range(
            0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)]
        for col_id in col_ids:
            learner_progress_services.add_collection_to_learner_playlist(
                self.user_id, col_id)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), col_ids)

        # Now if we try adding another collection, it shouldn't be added as the
        # list length would exceed MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, 'SAMPLE_COL_ID')
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), col_ids)

    def test_remove_exploration_from_learner_playlist(self):
        self.assertEqual(self._get_all_learner_playlist_exp_ids(
            self.user_id), [])

        # Add explorations to learner playlist.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_0)
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(self._get_all_learner_playlist_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        # Removing an exploration.
        learner_playlist_services.remove_exploration_from_learner_playlist(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(self._get_all_learner_playlist_exp_ids(
            self.user_id), [self.EXP_ID_1])

        # Removing the same exploration again has no effect.
        learner_playlist_services.remove_exploration_from_learner_playlist(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(self._get_all_learner_playlist_exp_ids(
            self.user_id), [self.EXP_ID_1])

        # Removing the second exploration.
        learner_playlist_services.remove_exploration_from_learner_playlist(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(self._get_all_learner_playlist_exp_ids(
            self.user_id), [])

    def test_remove_collection_from_learner_playlist(self):
        self.assertEqual(self._get_all_learner_playlist_collection_ids(
            self.user_id), [])

        # Add collections to learner playlist.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_0)
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_learner_playlist_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Removing a collection.
        learner_playlist_services.remove_collection_from_learner_playlist(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_learner_playlist_collection_ids(
            self.user_id), [self.COL_ID_1])

        # Removing the same collection again has no effect.
        learner_playlist_services.remove_collection_from_learner_playlist(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_learner_playlist_collection_ids(
            self.user_id), [self.COL_ID_1])

        # Removing the second collection.
        learner_playlist_services.remove_collection_from_learner_playlist(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_learner_playlist_collection_ids(
            self.user_id), [])

    def test_get_all_exp_ids_in_learner_playlist(self):
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [])

        # Add an exploration to the learner playlist.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_0])

        # Add another exploration.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

    def test_get_all_learner_playlist_collection_ids(self):
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [])

        # Add a collection to the learner playlist.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_0])

        # Add another collection.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_0, self.COL_ID_1])
