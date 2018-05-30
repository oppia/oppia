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

"""Tests for learner progress services."""

import datetime

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_services
from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.platform import models
from core.tests import test_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


class LearnerProgressTests(test_utils.GenericTestBase):
    """Test the services related to tracking the progress of the learner."""

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
        super(LearnerProgressTests, self).setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        # Save a few explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_0)
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_id, title='Introduce Oppia',
            category='Welcome', language_code='en')
        self.publish_exploration(self.user_id, self.EXP_ID_2)
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.owner_id, title='Welcome Oppia',
            category='Welcome', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_3)

        # Save a few collections.
        self.save_new_default_collection(
            self.COL_ID_0, self.owner_id, title='Bridges',
            category='Architecture')
        self.publish_collection(self.owner_id, self.COL_ID_0)
        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title='Introduce Oppia',
            category='Welcome')
        self.publish_collection(self.owner_id, self.COL_ID_1)
        self.save_new_default_collection(
            self.COL_ID_2, self.user_id,
            title='Introduce Interactions in Oppia', category='Welcome')
        self.publish_collection(self.user_id, self.COL_ID_2)
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title='Welcome Oppia Collection',
            category='Welcome')
        self.publish_collection(self.owner_id, self.COL_ID_3)

    def _get_all_completed_exp_ids(self, user_id):
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get(
                user_id, strict=False))

        return (
            completed_activities_model.exploration_ids if
            completed_activities_model else [])

    def _get_all_completed_collection_ids(self, user_id):
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get(
                user_id, strict=False))

        return (
            completed_activities_model.collection_ids if
            completed_activities_model else [])

    def _get_all_incomplete_exp_ids(self, user_id):
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel.get(user_id, strict=False))

        return (
            incomplete_activities_model.exploration_ids if
            incomplete_activities_model else [])

    def _get_incomplete_exp_details(self, user_id, exploration_id):
        incomplete_exploration_user_model = (
            user_models.ExpUserLastPlaythroughModel.get(
                user_id, exploration_id))

        return {
            'timestamp': (
                incomplete_exploration_user_model.last_updated),
            'state_name': (
                incomplete_exploration_user_model.last_played_state_name),
            'version': incomplete_exploration_user_model.last_played_exp_version
        }

    def _check_if_exp_details_match(
            self, actual_details, details_fetched_from_model):
        self.assertEqual(
            actual_details['state_name'],
            details_fetched_from_model['state_name'])
        self.assertEqual(
            actual_details['version'],
            details_fetched_from_model['version'])
        # Due to the slight difference in the time in which we call the
        # get_current_time_in_millisecs function while testing, the times are
        # usually offset by  few seconds. Therefore we check if the difference
        # between the times is less than 10 seconds.
        self.assertLess((
            actual_details['timestamp'] -
            details_fetched_from_model['timestamp']).total_seconds(), 10)

    def _get_all_incomplete_collection_ids(self, user_id):
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel.get(user_id, strict=False))

        return (
            incomplete_activities_model.collection_ids if
            incomplete_activities_model else [])

    def test_mark_exploration_as_completed(self):
        self.assertEqual(self._get_all_completed_exp_ids(self.user_id), [])

        # Add an exploration to the completed list of a learner.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_completed_exp_ids(self.user_id), [self.EXP_ID_0])

        # Completing an exploration again has no effect.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_completed_exp_ids(self.user_id), [self.EXP_ID_0])

        state_name = 'state_name'
        version = 1

        # Add an exploration to the in progress list of the learner.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_1])
        # Add an exploration to the learner playlist of the learner.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_3])

        # Test that on adding an incomplete exploration to the completed list
        # it gets removed from the incomplete list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(self._get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1])
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

        # Test that on adding an exploration to the completed list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(self._get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [])

        # Test that an exploration created by the user is not added to the
        # completed list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_2)
        self.assertEqual(self._get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3])

    def test_mark_collection_as_completed(self):
        self.assertEqual(
            self._get_all_completed_collection_ids(self.user_id), [])

        # Add a collection to the completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Completing a collection again has no effect.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Add a collection to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_1])

        # If the collection is present in the incomplete list, on completion
        # it is removed from the incomplete list and added to the complete
        # list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Add a collection to the learner playlist of the learner.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_3])

        # Test that on adding a collection to the completed list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_3)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1, self.COL_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [])

        # Test that a collection created by the user is not added to the
        # completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_2)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1, self.COL_ID_3])

    def test_mark_exploration_as_incomplete(self):
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

        state_name = u'state name'
        version = 1

        exp_details = {
            'timestamp': datetime.datetime.utcnow(),
            'state_name': state_name,
            'version': version
        }

        # Add an exploration to the incomplete list of a learner.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0])
        self._check_if_exp_details_match(
            self._get_incomplete_exp_details(self.user_id, self.EXP_ID_0),
            exp_details)

        state_name = u'new_state_name'
        version = 2

        modified_exp_details = {
            'timestamp': datetime.datetime.utcnow(),
            'state_name': state_name,
            'version': version
        }

        # On adding an exploration again, its details are updated to the latest
        # version.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0])
        self._check_if_exp_details_match(
            self._get_incomplete_exp_details(self.user_id, self.EXP_ID_0),
            modified_exp_details)

        # If an exploration has already been completed, it is not added.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0])

        # Add an exploration to the learner playlist.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_3])

        # Test that on adding an exploration to the incomplete list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_3, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [])

        # Test that an exploration created by the user is not added to the
        # incomplete list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_2, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_3])

    def test_mark_collection_as_incomplete(self):
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])

        # Add a collection to the incomplete list of the learner.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Adding a collection again has no effect.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0])

        # If a collection has been completed, it is not added to the incomplete
        # list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_1)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Add a collection to the learner playlist of the learner.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_3])

        # Test that on adding a collection to the incomplete list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_3)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [])

        # Test that a collection created by the user is not added to the
        # incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_2)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_3])

    def test_remove_exp_from_incomplete_list(self):
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

        state_name = 'state name'
        version = 1

        # Add incomplete explorations.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        # Removing an exploration.
        learner_progress_services.remove_exp_from_incomplete_list(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_1])

        # Removing the same exploration again has no effect.
        learner_progress_services.remove_exp_from_incomplete_list(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_1])

        # Removing the second exploration.
        learner_progress_services.remove_exp_from_incomplete_list(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

    def test_remove_collection_from_incomplete_list(self):
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])

        # Add two collections to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Remove one collection.
        learner_progress_services.remove_collection_from_incomplete_list(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_1])

        # Removing the same collection again has no effect.
        learner_progress_services.remove_collection_from_incomplete_list(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_1])

        # Removing another collection.
        learner_progress_services.remove_collection_from_incomplete_list(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])

    def test_get_all_completed_exp_ids(self):
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [])

        # Add an exploration to the completed list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0])

        # Add another exploration.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

    def test_get_all_completed_collection_ids(self):
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [])

        # Add a collection to the completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_0])

        # Add another collection.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

    def test_get_all_incomplete_exp_ids(self):
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [])

        state_name = 'state name'
        version = 1

        # Add an exploration to the incomplete list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0])

        # Add another exploration.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

    def test_get_all_incomplete_collection_ids(self):
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])

        # Add a collection to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0])

        # Add another collection.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

    def test_get_ids_of_activities_in_learner_dashboard(self):
        # Add activities to the completed section.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)

        # Add activities to the incomplete section.
        state_name = 'state name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)

        # Add activities to the playlist section.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_3)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_3)

        # Get the ids of all the activities.
        activity_ids = (
            learner_progress_services.get_learner_dashboard_activities( # pylint: disable=line-too-long
                self.user_id))

        self.assertEqual(
            activity_ids.completed_exploration_ids, [self.EXP_ID_0])
        self.assertEqual(
            activity_ids.completed_collection_ids, [self.COL_ID_0])
        self.assertEqual(
            activity_ids.incomplete_exploration_ids, [self.EXP_ID_1])
        self.assertEqual(
            activity_ids.incomplete_collection_ids, [self.COL_ID_1])
        self.assertEqual(
            activity_ids.exploration_playlist_ids, [self.EXP_ID_3])
        self.assertEqual(
            activity_ids.collection_playlist_ids, [self.COL_ID_3])

    def test_get_activity_progress(self):
        # Add activities to the completed section.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)

        # Add activities to the incomplete section.
        state_name = 'state name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)

        # Add activities to the playlist section.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_3)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_3)

        # Get the progress of the user.
        activity_progress = learner_progress_services.get_activity_progress(
            self.user_id)

        incomplete_exp_summaries = (
            activity_progress[0].incomplete_exp_summaries)
        incomplete_collection_summaries = (
            activity_progress[0].incomplete_collection_summaries)
        completed_exp_summaries = (
            activity_progress[0].completed_exp_summaries)
        completed_collection_summaries = (
            activity_progress[0].completed_collection_summaries)
        exploration_playlist_summaries = (
            activity_progress[0].exploration_playlist_summaries)
        collection_playlist_summaries = (
            activity_progress[0].collection_playlist_summaries)

        self.assertEqual(len(incomplete_exp_summaries), 1)
        self.assertEqual(len(incomplete_collection_summaries), 1)
        self.assertEqual(len(completed_exp_summaries), 1)
        self.assertEqual(len(completed_collection_summaries), 1)
        self.assertEqual(len(exploration_playlist_summaries), 1)
        self.assertEqual(len(collection_playlist_summaries), 1)

        self.assertEqual(
            incomplete_exp_summaries[0].title, 'Sillat Suomi')
        self.assertEqual(
            incomplete_collection_summaries[0].title, 'Introduce Oppia')
        self.assertEqual(
            completed_exp_summaries[0].title, 'Bridges in England')
        self.assertEqual(
            completed_collection_summaries[0].title, 'Bridges')
        self.assertEqual(
            exploration_playlist_summaries[0].title, 'Welcome Oppia')
        self.assertEqual(
            collection_playlist_summaries[0].title, 'Welcome Oppia Collection')

        # Delete an exploration in the completed section.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_0)
        # Delete an exploration in the incomplete section.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_1)
        # Delete an exploration in the playlist section.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_3)
        # Add an exploration to a collection that has already been completed.
        collection_services.update_collection(
            self.owner_id, self.COL_ID_0, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': self.EXP_ID_2
            }], 'Add new exploration')

        # Get the progress of the user.
        activity_progress = learner_progress_services.get_activity_progress(
            self.user_id)

        # Check that the exploration is no longer present in the incomplete
        # section.
        self.assertEqual(
            len(activity_progress[0].incomplete_exp_summaries), 0)
        # Check that the dashboard records the exploration deleted in the
        # completed section.
        self.assertEqual(activity_progress[1]['completed_explorations'], 1)
        # Check that the dashboard records the exploration deleted in the
        # incomplete section.
        self.assertEqual(activity_progress[1]['incomplete_explorations'], 1)
        # Check that the dashboard records the exploration deleted in the
        # playlist section.
        self.assertEqual(activity_progress[1]['exploration_playlist'], 1)

        incomplete_collection_summaries = (
            activity_progress[0].incomplete_collection_summaries)

        # Check that the collection to which a new exploration has been added
        # has been moved to the incomplete section.
        self.assertEqual(len(incomplete_collection_summaries), 2)
        self.assertEqual(incomplete_collection_summaries[1].title, 'Bridges')
        # Check that the dashboard has recorded the change in the collection.
        self.assertEqual(activity_progress[2], ['Bridges'])

        # Now suppose the user has completed the collection. It should be added
        # back to the completed section.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)

        # Delete a collection in the completed section.
        collection_services.delete_collection(self.owner_id, self.COL_ID_0)
        # Delete a collection in the incomplete section.
        collection_services.delete_collection(self.owner_id, self.COL_ID_1)
        # Delete a collection in the playlist section.
        collection_services.delete_collection(self.owner_id, self.COL_ID_3)

        # Get the progress of the user.
        activity_progress = learner_progress_services.get_activity_progress(
            self.user_id)

        # Check that the dashboard records the collection deleted in the
        # completed section.
        self.assertEqual(activity_progress[1]['completed_collections'], 1)
        # Check that the dashboard records the collection deleted in the
        # incomplete section.
        self.assertEqual(activity_progress[1]['incomplete_collections'], 1)
        # Check that the dashboard records the collection deleted in the
        # playlist section.
        self.assertEqual(activity_progress[1]['collection_playlist'], 1)
