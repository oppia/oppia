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

    def setUp(self):
        super(UserGlobalPrefsTests, self).setUp()
        self.test_prefs_email = (user_domain.UserGlobalPrefs(
            True, False, True, False))
        self.default_prefs_email = (
            user_domain.UserGlobalPrefs.create_default_prefs())

    def test_initialization(self):
        """Testing init method."""
        receive_email_updates = (
            self.test_prefs_email.can_receive_email_updates)
        receive_editor_role_email = (
            self.test_prefs_email.can_receive_editor_role_email)
        receive_feedback_message_email = (
            self.test_prefs_email.can_receive_feedback_message_email)
        receive_subscription_email = (
            self.test_prefs_email.can_receive_subscription_email)

        self.assertTrue(receive_email_updates)
        self.assertFalse(receive_editor_role_email)
        self.assertTrue(receive_feedback_message_email)
        self.assertFalse(receive_subscription_email)

    def test_create_default_prefs(self):
        """Testing create_default_prefs."""
        default_email_update = (
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE)
        default_editor_role = (
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
        default_feedback_message = (
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
        default_subscription_email = (
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        receive_email_updates = (
            self.default_prefs_email.can_receive_email_updates)
        receive_editor_role_email = (
            self.default_prefs_email.can_receive_editor_role_email)
        receive_feedback_message_email = (
            self.default_prefs_email.can_receive_feedback_message_email)
        receive_subscription_email = (
            self.default_prefs_email.can_receive_subscription_email)

        self.assertEqual(
            receive_email_updates, default_email_update)
        self.assertEqual(
            receive_editor_role_email, default_editor_role)
        self.assertEqual(
            receive_feedback_message_email, default_feedback_message)
        self.assertEqual(
            receive_subscription_email, default_subscription_email)


class UserExplorationPrefsTests(test_utils.GenericTestBase):
    """Test domain object for user exploration email preferences."""

    def setUp(self):
        super(UserExplorationPrefsTests, self).setUp()
        self.test_prefs_email = (user_domain.UserExplorationPrefs(
            False, True))
        self.default_prefs_email = (
            user_domain.UserExplorationPrefs.create_default_prefs())

    def test_initialization(self):
        """Testing init method."""
        mute_feedback_notifications = (
            self.test_prefs_email.mute_feedback_notifications)
        mute_suggestion_notifications = (
            self.test_prefs_email.mute_suggestion_notifications)

        self.assertFalse(mute_feedback_notifications)
        self.assertTrue(mute_suggestion_notifications)

    def test_create_default_prefs(self):
        """Testing create_default_prefs."""
        default_feedback_notifs = (
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
        default_suggestion_notifs = (
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

        mute_feedback_notifications = (
            self.default_prefs_email.mute_feedback_notifications)
        mute_suggestion_notifications = (
            self.default_prefs_email.mute_suggestion_notifications)

        self.assertEqual(
            mute_feedback_notifications, default_feedback_notifs)
        self.assertEqual(
            mute_suggestion_notifications, default_suggestion_notifs)

    def test_to_dict(self):
        """Testing to_dict."""
        default_feedback_notifs = (
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
        default_suggestion_notifs = (
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

        test_dict = self.test_prefs_email.to_dict()
        default_dict = self.default_prefs_email.to_dict()
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
                default_feedback_notifs,
                'mute_suggestion_notifications':
                default_suggestion_notifs
            }
        )


class ExpUserLastPlaythroughTests(test_utils.GenericTestBase):
    """Testing domain object for an exploration last playthrough model."""

    def setUp(self):
        super(ExpUserLastPlaythroughTests, self).setUp()
        self.exp_last_playthrough = (user_domain.ExpUserLastPlaythrough(
            'user_id0', 'exp_id0', 0, 'last_updated', 'state0'))

    def test_initialization(self):
        """Testing init method."""
        self.assertEqual(
            self.exp_last_playthrough.id, 'user_id0.exp_id0')
        self.assertEqual(
            self.exp_last_playthrough.user_id, 'user_id0')
        self.assertEqual(
            self.exp_last_playthrough.exploration_id, 'exp_id0')
        self.assertEqual(
            self.exp_last_playthrough.last_played_exp_version, 0)
        self.assertEqual(
            self.exp_last_playthrough.last_updated, 'last_updated')
        self.assertEqual(
            self.exp_last_playthrough.last_played_state_name, 'state0')

    def test_update_last_played_information(self):
        """Testing update_last_played_information."""
        self.exp_last_playthrough.update_last_played_information(1, 'state1')
        self.assertEqual(
            self.exp_last_playthrough.last_played_exp_version, 1)
        self.assertEqual(
            self.exp_last_playthrough.last_played_state_name, 'state1')


class IncompleteActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for incomplete activities model."""

    def setUp(self):
        super(IncompleteActivitiesTests, self).setUp()
        self.incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

    def test_initialization(self):
        """Testing init method."""
        expected_exp_list = ['exp_id0']
        expected_coll_list = ['collect_id0']

        self.assertEqual(self.incomplete_activities.id, 'user_id0')
        self.assertListEqual(
            self.incomplete_activities.exploration_ids, expected_exp_list)
        self.assertListEqual(
            self.incomplete_activities.collection_ids, expected_coll_list)

    def test_add_exploration_id(self):
        """Testing add_exploration_id."""
        expected_exp_list = ['exp_id0', 'exp_id1']
        self.incomplete_activities.add_exploration_id('exp_id1')
        self.assertListEqual(
            self.incomplete_activities.exploration_ids, expected_exp_list)

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        expected_exp_list = []
        self.incomplete_activities.remove_exploration_id('exp_id0')
        self.assertListEqual(
            self.incomplete_activities.exploration_ids, expected_exp_list)

    def test_add_collection_id(self):
        """Testing add_collection_id."""
        expected_coll_list = ['collect_id0', 'collect_id1']
        self.incomplete_activities.add_collection_id('collect_id1')
        self.assertListEqual(
            self.incomplete_activities.collection_ids, expected_coll_list)

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        expected_coll_list = []
        self.incomplete_activities.remove_collection_id('collect_id0')
        self.assertListEqual(
            self.incomplete_activities.collection_ids, expected_coll_list)


class CompletedActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for the activities completed."""

    def setUp(self):
        super(CompletedActivitiesTests, self).setUp()
        self.completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

    def test_initialization(self):
        """Testing init method."""
        expected_exp_list = ['exp_id0']
        expected_coll_list = ['collect_id0']
        self.assertEqual('user_id0', self.completed_activities.id)
        self.assertListEqual(
            self.completed_activities.exploration_ids, expected_exp_list)
        self.assertListEqual(
            self.completed_activities.collection_ids, expected_coll_list)

    def test_add_exploration_id(self):
        """Testing add_exploration_id."""
        expected_exp_list = ['exp_id0', 'exp_id1']
        self.completed_activities.add_exploration_id('exp_id1')
        self.assertListEqual(
            self.completed_activities.exploration_ids, expected_exp_list)

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        expected_exp_list = []
        self.completed_activities.remove_exploration_id('exp_id0')
        self.assertListEqual(
            self.completed_activities.exploration_ids, expected_exp_list)

    def test_add_collection_id(self):
        """Testing add_collection_id."""
        expected_coll_list = ['collect_id0', 'collect_id1']
        self.completed_activities.add_collection_id('collect_id1')
        self.assertListEqual(
            self.completed_activities.collection_ids, expected_coll_list)

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        expected_coll_list = []
        self.completed_activities.remove_collection_id('collect_id0')
        self.assertListEqual(
            self.completed_activities.collection_ids, expected_coll_list)


class LearnerPlaylistTests(test_utils.GenericTestBase):
    """Testing domain object for the learner playlist."""

    def setUp(self):
        super(LearnerPlaylistTests, self).setUp()
        self.learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

    def test_initialization(self):
        """Testing init method."""
        expected_exp_list = ['exp_id0']
        expected_coll_list = ['collect_id0']
        self.assertEqual(self.learner_playlist.id, 'user_id0')
        self.assertListEqual(
            self.learner_playlist.exploration_ids, expected_exp_list)
        self.assertListEqual(
            self.learner_playlist.collection_ids, expected_coll_list)

    def test_insert_exploration_id_at_given_position(self):
        """Testing inserting the given exploration id at the given position."""
        expected_exp_list = ['exp_id0', 'exp_id2', 'exp_id1']
        self.learner_playlist.insert_exploration_id_at_given_position(
            'exp_id1', 1)
        self.learner_playlist.insert_exploration_id_at_given_position(
            'exp_id2', 1)
        self.assertListEqual(
            self.learner_playlist.exploration_ids, expected_exp_list)

    def test_add_exploration_id_to_list(self):
        """Testing add_exploration_id_to_list."""
        expected_exp_list = ['exp_id0', 'exp_id1']
        self.learner_playlist.add_exploration_id_to_list('exp_id1')
        self.assertListEqual(
            self.learner_playlist.exploration_ids, expected_exp_list)

    def test_insert_collection_id_at_given_position(self):
        """Testing insert_exploration_id_at_given_position."""
        expected_coll_list = ['collect_id0', 'collect_id2', 'collect_id1']
        self.learner_playlist.insert_collection_id_at_given_position(
            'collect_id1', 1)
        self.learner_playlist.insert_collection_id_at_given_position(
            'collect_id2', 1)
        self.assertListEqual(
            self.learner_playlist.collection_ids, expected_coll_list)

    def test_add_collection_id_list(self):
        """Testing add_collection_id."""
        expected_coll_list = ['collect_id0', 'collect_id1']
        self.learner_playlist.add_collection_id_to_list('collect_id1')
        self.assertListEqual(
            self.learner_playlist.collection_ids, expected_coll_list)

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        expected_exp_list = []
        self.learner_playlist.remove_exploration_id('exp_id0')
        self.assertListEqual(
            self.learner_playlist.exploration_ids, expected_exp_list)

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        expected_coll_list = []
        self.learner_playlist.remove_collection_id('collect_id0')
        self.assertListEqual(
            self.learner_playlist.collection_ids, expected_coll_list)


class UserContributionScoringTests(test_utils.GenericTestBase):
    """Testing domain object for user contribution scoring model."""

    def setUp(self):
        super(UserContributionScoringTests, self).setUp()
        self.user_contribution_scoring = (user_domain.UserContributionScoring(
            'user_id0', 'category0', 5))

    def test_initialization(self):
        """Testing init method."""
        self.assertEqual(
            self.user_contribution_scoring.user_id, 'user_id0')
        self.assertEqual(
            self.user_contribution_scoring.score_category, 'category0')
        self.assertEqual(
            self.user_contribution_scoring.score, 5)
