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

"""Tests for the learner playlist."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.tests import test_utils


class LearnerPlaylistHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1 = 'exp_id_1'
    EXP_TITLE_1 = 'exp title 1'
    EXP_ID_2 = 'exp_id_2'
    EXP_TITLE_2 = 'exp title 2'
    EXP_ID_3 = 'exp_id_3'
    EXP_TITLE_3 = 'exp title 3'
    EXP_ID_4 = 'exp_id_4'
    EXP_TITLE_4 = 'exp title 4'
    COL_ID_1 = 'col_id_1'
    COL_TITLE_1 = 'col title 1'
    COL_ID_2 = 'col_id_2'
    COL_TITLE_2 = 'col title 2'
    COL_ID_3 = 'col_id_3'
    COL_TITLE_3 = 'col title 3'
    COL_ID_4 = 'col_id_4'
    COL_TITLE_4 = 'col title 4'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Save the explorations.
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id, title=self.EXP_TITLE_2)
        self.save_new_default_exploration(
            self.EXP_ID_3, self.owner_id, title=self.EXP_TITLE_3)
        self.save_new_default_exploration(
            self.EXP_ID_4, self.viewer_id, title=self.EXP_TITLE_3)
        # Save the collections.
        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.save_new_default_collection(
            self.COL_ID_2, self.owner_id, title=self.COL_TITLE_2)
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title=self.COL_TITLE_3)
        self.save_new_default_collection(
            self.COL_ID_4, self.viewer_id, title=self.COL_TITLE_4)

    def test_add_exploration_to_learner_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Add one exploration to the playlist.
        self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_1), {},
            csrf_token=csrf_token)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_1])

        # Add another exploration.
        self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_2), {},
            csrf_token=csrf_token)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_1, self.EXP_ID_2])

        # User rearranges the explorations. 'exp title 2' is shifted to the
        # first position.
        payload = {
            'index': 0
        }
        self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_2), payload,
            csrf_token=csrf_token)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_2, self.EXP_ID_1])

        # If an exploration belongs to the incomplete list or completed list, it
        # should not be added. Here we test for the completed case.
        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_3)
        response = self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_3), {},
            csrf_token=csrf_token)
        self.assertEqual(
            response['belongs_to_completed_or_incomplete_list'], True)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_2, self.EXP_ID_1])

        # If an exploration belongs to one of the subscribed explorations,
        # it should not be added to the learner playlist.
        response = self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_4), {},
            csrf_token=csrf_token)
        self.assertEqual(
            response['belongs_to_subscribed_activities'], True)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_2, self.EXP_ID_1])

        # Now we begin testing of not exceeding the limit of activities in the
        # learner playlist.
        # Add feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT - 2 activities to reach
        # the maximum limit.
        for exp_id in range(5, feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT + 3):
            self.post_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_PLAYLIST_DATA_URL,
                    constants.ACTIVITY_TYPE_EXPLORATION,
                    'exp_id_%s' % exp_id), {},
                csrf_token=csrf_token)

        # Now if we try and add an activity we should get a message saying we
        # are exceeding the limit.
        response = self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                'exp_id_%s' %
                str(feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT + 3)),
            {}, csrf_token=csrf_token)
        self.assertEqual(response['playlist_limit_exceeded'], True)

        self.logout()

    def test_add_collection_to_learner_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Add one collection to the playlist.
        self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_1), {},
            csrf_token=csrf_token)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [self.COL_ID_1])

        # Add another exploration.
        self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_2), {},
            csrf_token=csrf_token)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [self.COL_ID_1, self.COL_ID_2])

        # User rearranges the explorations. 'exp title 2' is shifted to the
        # first position.
        payload = {
            'index': 0
        }
        self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_2), payload,
            csrf_token=csrf_token)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [self.COL_ID_2, self.COL_ID_1])

        # If an exploration belongs to the incomplete list or completed list, it
        # should not be added. Here we test for the completed case.
        learner_progress_services.mark_collection_as_completed(
            self.viewer_id, self.COL_ID_3)
        response = self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_3), {},
            csrf_token=csrf_token)
        self.assertEqual(
            response['belongs_to_completed_or_incomplete_list'], True)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [self.COL_ID_2, self.COL_ID_1])

        # If a collection belongs to one of the subscribed collections,
        # it should not be added to the learner playlist.
        response = self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                self.COL_ID_4), {},
            csrf_token=csrf_token)
        self.assertEqual(
            response['belongs_to_subscribed_activities'], True)
        self.assertEqual(
            learner_playlist_services
            .get_all_collection_ids_in_learner_playlist(
                self.viewer_id), [self.COL_ID_2, self.COL_ID_1])

        # Now we begin testing of not exceeding the limit of activities in the
        # learner playlist.
        # Add feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT - 2 activities to reach
        # the maximum limit.
        for exp_id in range(5, feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT + 3):
            response = self.post_json(
                '%s/%s/%s' % (
                    feconf.LEARNER_PLAYLIST_DATA_URL,
                    constants.ACTIVITY_TYPE_COLLECTION,
                    'col_id_%s' % exp_id), {},
                csrf_token=csrf_token)

        # Now if we try and add an activity we should get a message saying we
        # are exceeding the limit.
        response = self.post_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_COLLECTION,
                'exp_id_%s' %
                str(feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT + 3)),
            {}, csrf_token=csrf_token)
        self.assertEqual(response['playlist_limit_exceeded'], True)

        self.logout()

    def test_remove_exploration_from_learner_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)

        # Add explorations to the learner playlist.
        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_1)
        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_2)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_1, self.EXP_ID_2])

        # Remove an exploration.
        self.delete_json(
            '%s/%s/%s' % (
                feconf.LEARNER_PLAYLIST_DATA_URL,
                constants.ACTIVITY_TYPE_EXPLORATION,
                self.EXP_ID_1))
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_2])

        # Removing the same exploration again has no effect.
        self.delete_json('%s/%s/%s' % (
            feconf.LEARNER_PLAYLIST_DATA_URL,
            constants.ACTIVITY_TYPE_EXPLORATION,
            self.EXP_ID_1))
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [self.EXP_ID_2])

        # Remove the second exploration.
        self.delete_json('%s/%s/%s' % (
            feconf.LEARNER_PLAYLIST_DATA_URL,
            constants.ACTIVITY_TYPE_EXPLORATION,
            self.EXP_ID_2))
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.viewer_id), [])

        self.logout()

    def test_remove_collection_from_learner_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)

        # Add collections to the learner playlist.
        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_1)
        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_2)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [self.COL_ID_1, self.COL_ID_2])

        # Remove a collection.
        self.delete_json('%s/%s/%s' % (
            feconf.LEARNER_PLAYLIST_DATA_URL,
            constants.ACTIVITY_TYPE_COLLECTION, self.COL_ID_1))
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [self.COL_ID_2])

        # Removing the same collection again has no effect.
        self.delete_json('%s/%s/%s' % (
            feconf.LEARNER_PLAYLIST_DATA_URL,
            constants.ACTIVITY_TYPE_COLLECTION, self.COL_ID_1))
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [self.COL_ID_2])

        # Remove the second collection.
        self.delete_json('%s/%s/%s' % (
            feconf.LEARNER_PLAYLIST_DATA_URL,
            constants.ACTIVITY_TYPE_COLLECTION, self.COL_ID_2))
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.viewer_id), [])

        self.logout()
