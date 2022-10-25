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

from __future__ import annotations

from core import feconf
from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.domain import subscription_services
from core.platform import models
from core.tests import test_utils

from typing import Final, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])

MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT: Final = (
    feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT
)


class LearnerPlaylistTests(test_utils.GenericTestBase):
    """Test the services related to learner playlist services."""

    EXP_ID_0: Final = '0_en_arch_bridges_in_england'
    EXP_ID_1: Final = '1_fi_arch_sillat_suomi'
    EXP_ID_2: Final = '2_en_welcome_introduce_oppia'
    EXP_ID_3: Final = '3_welcome_oppia'
    COL_ID_0: Final = '0_arch_bridges_in_england'
    COL_ID_1: Final = '1_welcome_introduce_oppia'
    COL_ID_2: Final = '2_welcome_introduce_oppia_interactions'
    COL_ID_3: Final = '3_welcome_oppia_collection'
    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'

    def setUp(self) -> None:
        super().setUp()

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

    def _get_all_learner_playlist_exp_ids(self, user_id: str) -> List[str]:
        """Returns the list of all the exploration ids in the learner's playlist
        corresponding to the given user id.
        """
        learner_playlist_model = user_models.LearnerPlaylistModel.get(
            user_id, strict=False)

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if learner_playlist_model:
            exp_ids: List[str] = learner_playlist_model.exploration_ids
            return exp_ids
        else:
            return []

    def _get_all_learner_playlist_collection_ids(
        self, user_id: str
    ) -> List[str]:
        """Returns the list of all the collection ids in the learner's playlist
        corresponding to the given user id.
        """
        learner_playlist_model = user_models.LearnerPlaylistModel.get(
            user_id, strict=False)

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if learner_playlist_model:
            collection_ids: List[str] = learner_playlist_model.collection_ids
            return collection_ids
        else:
            return []

    def test_subscribed_exploration_cannot_be_added_to_playlist(self) -> None:
        # Subscribe to exploration.
        subscription_services.subscribe_to_exploration(
            self.user_id, self.EXP_ID_0)

        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), [])
        # Now if we try to add the same exploration, it shouldn't be added.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), [])

    def test_single_exploration_is_added_correctly_to_playlist(self) -> None:
        # Test adding a single exploration_id to learner playlist.
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), [])
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_0])

        # Test adding a single exploration_id to learner playlist at
        # a specific position.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_1, position_to_be_inserted=0)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_1, self.EXP_ID_0])

    def test_multiple_explorations_are_added_correctly_to_playlist(
        self
    ) -> None:
        # Test adding two explorations to the learner playlist.
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [])

        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_0])

        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

    def test_adding_exisiting_exploration_changes_order_of_explorations(
        self
    ) -> None:
        # Test adding the exploration_id if it is already in
        # learner_playlist.exploration_ids.
        # Add the first exploration to the second position.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0,
            position_to_be_inserted=1)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_1, self.EXP_ID_0])

    def test_incomplete_exploration_is_not_added_to_learner_playlist(
        self
    ) -> None:
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_0])

        state_name = 'state_name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)

        # Test that the exploration added to the in progress list doesn't get
        # added to the learner playlist.
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(
                self.user_id), [self.EXP_ID_0])

    def test_number_of_explorations_cannot_exceed_max(self) -> None:
        # Add MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT explorations.
        exp_ids = ['SAMPLE_EXP_ID_%s' % index for index in range(
            0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)]
        for exp_id in exp_ids:
            learner_progress_services.add_exp_to_learner_playlist(
                self.user_id, exp_id)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), exp_ids)

        # Now if we try to add another exploration at the end of the list,
        # it shouldn't be added as the list length would exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, 'SAMPLE_EXP_ID_MAX',
            position_to_be_inserted=MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), exp_ids)

        # Also if we try adding another exploration at no specific location,
        # it shouldn't be added as the list length would exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, 'SAMPLE_EXP_ID_MAX')
        self.assertEqual(
            self._get_all_learner_playlist_exp_ids(self.user_id), exp_ids)

    def test_subscribed_collection_cannot_be_added_to_playlist(self) -> None:
        # Subscribe to collection.
        subscription_services.subscribe_to_collection(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [])

        # Now if we try to add the same collection, it shouldn't be added.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(self.user_id), [])

    def test_single_collection_is_added_correctly_to_playlist(self) -> None:
        # Test adding a single collection_id to learner playlist.
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(self.user_id), [])
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_0])

        # Test adding a single collection_id to learner playlist at
        # a specific position.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_1, position_to_be_inserted=0)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_1, self.COL_ID_0])

    def test_multiple_collections_are_added_correctly_to_playlist(self) -> None:
        # Test adding two explorations to the learner playlist.
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [])

        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_0])

        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

    def test_adding_existing_collection_changes_order_of_collections(
        self
    ) -> None:
        # Test adding the collection_id if it is already in
        # learner_playlist.collection_ids.
        # Add the first collection to the second position.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0,
            position_to_be_inserted=1)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), [self.COL_ID_1, self.COL_ID_0])

    def test_number_of_collections_cannot_exceed_max(self) -> None:
        # Add MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT collections.
        col_ids = ['SAMPLE_COL_ID_%s' % index for index in range(
            0, MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)]
        for col_id in col_ids:
            learner_progress_services.add_collection_to_learner_playlist(
                self.user_id, col_id)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), col_ids)

        # Now if we try to add another collection at the end of the list,
        # it shouldn't be added as the list length would exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, 'SAMPLE_COL_ID_MAX',
            position_to_be_inserted=MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT)
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), col_ids)

        # Now if we try adding another collection at no specific position,
        # it shouldn't be added as the list length would exceed
        # MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, 'SAMPLE_COL_ID_MAX')
        self.assertEqual(
            self._get_all_learner_playlist_collection_ids(
                self.user_id), col_ids)

    def test_remove_exploration_from_learner_playlist(self) -> None:
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

    def test_remove_collection_from_learner_playlist(self) -> None:
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

    def test_get_all_exp_ids_in_learner_playlist(self) -> None:
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

    def test_get_all_learner_playlist_collection_ids(self) -> None:
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
