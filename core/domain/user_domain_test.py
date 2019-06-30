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

"""Tests for user domain objects."""

from core.domain import user_domain
from core.tests import test_utils
import feconf


class UserGlobalPrefsTests(test_utils.GenericTestBase):
    """Test domain object for user global email preferences."""

    def test_initialization(self):
        """Testing init method."""
        user_global_prefs = (user_domain.UserGlobalPrefs(
            True, False, True, False))

        self.assertTrue(user_global_prefs.can_receive_email_updates)
        self.assertFalse(user_global_prefs.can_receive_editor_role_email)
        self.assertTrue(user_global_prefs.can_receive_feedback_message_email)
        self.assertFalse(user_global_prefs.can_receive_subscription_email)

    def test_create_default_prefs(self):
        """Testing create_default_prefs."""
        default_user_global_prefs = (
            user_domain.UserGlobalPrefs.create_default_prefs())

        self.assertEqual(
            default_user_global_prefs.can_receive_email_updates,
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE)
        self.assertEqual(
            default_user_global_prefs.can_receive_editor_role_email,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
        self.assertEqual(
            default_user_global_prefs.can_receive_feedback_message_email,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
        self.assertEqual(
            default_user_global_prefs.can_receive_subscription_email,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)


class UserExplorationPrefsTests(test_utils.GenericTestBase):
    """Test domain object for user exploration email preferences."""

    def test_initialization(self):
        """Testing init method."""
        user_exp_prefs = (user_domain.UserExplorationPrefs(
            False, True))

        mute_feedback_notifications = (
            user_exp_prefs.mute_feedback_notifications)
        mute_suggestion_notifications = (
            user_exp_prefs.mute_suggestion_notifications)

        self.assertFalse(mute_feedback_notifications)
        self.assertTrue(mute_suggestion_notifications)

    def test_create_default_prefs(self):
        """Testing create_default_prefs."""
        default_user_exp_prefs = (
            user_domain.UserExplorationPrefs.create_default_prefs())

        self.assertEqual(
            default_user_exp_prefs.mute_feedback_notifications,
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
        self.assertEqual(
            default_user_exp_prefs.mute_suggestion_notifications,
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

    def test_to_dict(self):
        """Testing to_dict."""
        user_exp_prefs = (user_domain.UserExplorationPrefs(
            False, True))
        default_user_global_prefs = (
            user_domain.UserExplorationPrefs.create_default_prefs())

        test_dict = user_exp_prefs.to_dict()
        default_dict = default_user_global_prefs.to_dict()

        self.assertEqual(
            test_dict,
            {
                'mute_feedback_notifications': False,
                'mute_suggestion_notifications': True
            }
        )
        self.assertEqual(
            default_dict,
            {
                'mute_feedback_notifications':
                feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE,
                'mute_suggestion_notifications':
                feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE
            }
        )


class ExpUserLastPlaythroughTests(test_utils.GenericTestBase):
    """Testing domain object for an exploration last playthrough model."""

    def test_initialization(self):
        """Testing init method."""
        exp_last_playthrough = (user_domain.ExpUserLastPlaythrough(
            'user_id0', 'exp_id0', 0, 'last_updated', 'state0'))

        self.assertEqual(
            exp_last_playthrough.id, 'user_id0.exp_id0')
        self.assertEqual(
            exp_last_playthrough.user_id, 'user_id0')
        self.assertEqual(
            exp_last_playthrough.exploration_id, 'exp_id0')
        self.assertEqual(
            exp_last_playthrough.last_played_exp_version, 0)
        self.assertEqual(
            exp_last_playthrough.last_updated, 'last_updated')
        self.assertEqual(
            exp_last_playthrough.last_played_state_name, 'state0')

    def test_update_last_played_information(self):
        """Testing update_last_played_information."""
        exp_last_playthrough = (user_domain.ExpUserLastPlaythrough(
            'user_id0', 'exp_id0', 0, 'last_updated', 'state0'))

        self.assertEqual(
            exp_last_playthrough.last_played_exp_version, 0)

        self.assertEqual(
            exp_last_playthrough.last_played_state_name, 'state0')

        exp_last_playthrough.update_last_played_information(1, 'state1')
        self.assertEqual(
            exp_last_playthrough.last_played_exp_version, 1)
        self.assertEqual(
            exp_last_playthrough.last_played_state_name, 'state1')


class IncompleteActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for incomplete activities model."""

    def test_initialization(self):
        """Testing init method."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertEqual(incomplete_activities.id, 'user_id0')
        self.assertListEqual(
            incomplete_activities.exploration_ids, ['exp_id0'])
        self.assertListEqual(
            incomplete_activities.collection_ids, ['collect_id0'])

    def test_add_exploration_id(self):
        """Testing add_exploration_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            incomplete_activities.exploration_ids, ['exp_id0'])

        incomplete_activities.add_exploration_id('exp_id1')

        self.assertListEqual(
            incomplete_activities.exploration_ids,
            ['exp_id0', 'exp_id1'])

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            incomplete_activities.exploration_ids, ['exp_id0'])

        incomplete_activities.remove_exploration_id('exp_id0')

        self.assertListEqual(
            incomplete_activities.exploration_ids, [])

    def test_add_collection_id(self):
        """Testing add_collection_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            incomplete_activities.collection_ids, ['collect_id0'])

        incomplete_activities.add_collection_id('collect_id1')

        self.assertListEqual(
            incomplete_activities.collection_ids,
            ['collect_id0', 'collect_id1'])

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            incomplete_activities.collection_ids, ['collect_id0'])

        incomplete_activities.remove_collection_id('collect_id0')

        self.assertListEqual(
            incomplete_activities.collection_ids, [])


class CompletedActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for the activities completed."""

    def test_initialization(self):
        """Testing init method."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertEqual('user_id0', completed_activities.id)
        self.assertListEqual(
            completed_activities.exploration_ids, ['exp_id0'])
        self.assertListEqual(
            completed_activities.collection_ids, ['collect_id0'])

    def test_add_exploration_id(self):
        """Testing add_exploration_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            completed_activities.exploration_ids, ['exp_id0'])

        completed_activities.add_exploration_id('exp_id1')

        self.assertListEqual(
            completed_activities.exploration_ids,
            ['exp_id0', 'exp_id1'])

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            completed_activities.exploration_ids, ['exp_id0'])

        completed_activities.remove_exploration_id('exp_id0')

        self.assertListEqual(
            completed_activities.exploration_ids, [])

    def test_add_collection_id(self):
        """Testing add_collection_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            completed_activities.collection_ids, ['collect_id0'])

        completed_activities.add_collection_id('collect_id1')

        self.assertListEqual(
            completed_activities.collection_ids,
            ['collect_id0', 'collect_id1'])

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            completed_activities.collection_ids, ['collect_id0'])

        completed_activities.remove_collection_id('collect_id0')

        self.assertListEqual(
            completed_activities.collection_ids, [])


class LearnerPlaylistTests(test_utils.GenericTestBase):
    """Testing domain object for the learner playlist."""

    def test_initialization(self):
        """Testing init method."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertEqual(learner_playlist.id, 'user_id0')
        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])
        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

    def test_insert_exploration_id_at_given_position(self):
        """Testing inserting the given exploration id at the given position."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])

        learner_playlist.insert_exploration_id_at_given_position(
            'exp_id1', 1)
        learner_playlist.insert_exploration_id_at_given_position(
            'exp_id2', 1)

        self.assertListEqual(
            learner_playlist.exploration_ids,
            ['exp_id0', 'exp_id2', 'exp_id1'])

    def test_add_exploration_id_to_list(self):
        """Testing add_exploration_id_to_list."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])

        learner_playlist.add_exploration_id_to_list('exp_id1')

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0', 'exp_id1'])

    def test_insert_collection_id_at_given_position(self):
        """Testing insert_exploration_id_at_given_position."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

        learner_playlist.insert_collection_id_at_given_position(
            'collect_id1', 1)
        learner_playlist.insert_collection_id_at_given_position(
            'collect_id2', 1)


        self.assertListEqual(
            learner_playlist.collection_ids,
            ['collect_id0', 'collect_id2', 'collect_id1'])

    def test_add_collection_id_list(self):
        """Testing add_collection_id."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

        learner_playlist.add_collection_id_to_list('collect_id1')

        self.assertListEqual(
            learner_playlist.collection_ids,
            ['collect_id0', 'collect_id1'])

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])

        learner_playlist.remove_exploration_id('exp_id0')

        self.assertListEqual(
            learner_playlist.exploration_ids, [])

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

        learner_playlist.remove_collection_id('collect_id0')

        self.assertListEqual(
            learner_playlist.collection_ids, [])


class UserContributionScoringTests(test_utils.GenericTestBase):
    """Testing domain object for user contribution scoring model."""

    def test_initialization(self):
        """Testing init method."""
        user_contribution_scoring = (user_domain.UserContributionScoring(
            'user_id0', 'category0', 5, True))

        self.assertEqual(user_contribution_scoring.user_id, 'user_id0')
        self.assertEqual(user_contribution_scoring.score_category, 'category0')
        self.assertEqual(user_contribution_scoring.score, 5)
        self.assertEqual(user_contribution_scoring.has_email_been_sent, True)
