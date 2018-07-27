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

        self.assertEqual(True, receive_email_updates)
        self.assertEqual(False, receive_editor_role_email)
        self.assertEqual(True, receive_feedback_message_email)
        self.assertEqual(False, receive_subscription_email)

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
            default_email_update, receive_email_updates)
        self.assertEqual(
            default_editor_role, receive_editor_role_email)
        self.assertEqual(
            default_feedback_message, receive_feedback_message_email)
        self.assertEqual(
            default_subscription_email, receive_subscription_email)


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

        self.assertEqual(False, mute_feedback_notifications)
        self.assertEqual(True, mute_suggestion_notifications)

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
            default_feedback_notifs, mute_feedback_notifications)
        self.assertEqual(
            default_suggestion_notifs, mute_suggestion_notifications)

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
            'user_id0.exp_id0', self.exp_last_playthrough.id)
        self.assertEqual(
            'user_id0', self.exp_last_playthrough.user_id)
        self.assertEqual(
            'exp_id0', self.exp_last_playthrough.exploration_id)
        self.assertEqual(
            0, self.exp_last_playthrough.last_played_exp_version)
        self.assertEqual(
            'last_updated', self.exp_last_playthrough.last_updated)
        self.assertEqual(
            'state0', self.exp_last_playthrough.last_played_state_name)

    def test_update_last_played_information(self):
        """Testing update_last_played_information."""
        self.exp_last_playthrough.update_last_played_information(1, 'state1')
        self.assertEqual(
            1, self.exp_last_playthrough.last_played_exp_version)
        self.assertEqual(
            'state1', self.exp_last_playthrough.last_played_state_name)


class IncompleteActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for incomplete activities model."""
    def setUp(self):
        super(IncompleteActivitiesTests, self).setUp()
        self.incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

    def test_initialization(self):
        """Testing init method."""
        self.assertEqual('user_id0', self.incomplete_activities.id)
        self.assertEqual(
            ['exp_id0'], self.incomplete_activities.exploration_ids)
        self.assertEqual(
            ['collect_id0'], self.incomplete_activities.collection_ids)

    def test_add_exploration_id(self):
        """Testing add_exploration_id."""
        self.incomplete_activities.add_exploration_id('exp_id1')
        self.assertEqual(
            'exp_id1', self.incomplete_activities.exploration_ids[-1])
        self.assertEqual(
            2, len(self.incomplete_activities.exploration_ids))

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        self.incomplete_activities.remove_exploration_id('exp_id0')
        self.assertEqual(
            0, len(self.incomplete_activities.exploration_ids))

    def test_add_collection_id(self):
        """Testing add_collection_id."""
        self.incomplete_activities.add_collection_id('collect_id1')
        self.assertEqual(
            'collect_id1', self.incomplete_activities.collection_ids[-1])
        self.assertEqual(
            2, len(self.incomplete_activities.collection_ids))

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        self.incomplete_activities.remove_collection_id('collect_id0')
        self.assertEqual(
            0, len(self.incomplete_activities.collection_ids))


class CompletedActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for the activities completed."""
    def setUp(self):
        super(CompletedActivitiesTests, self).setUp()
        self.completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0']))

    def test_initialization(self):
        """Testing init method."""
        self.assertEqual('user_id0', self.completed_activities.id)
        self.assertEqual(
            1, len(self.completed_activities.exploration_ids))
        self.assertEqual(
            'exp_id0', self.completed_activities.exploration_ids[-1])
        self.assertEqual(
            1, len(self.completed_activities.collection_ids))
        self.assertEqual(
            'collect_id0', self.completed_activities.collection_ids[-1])

    def test_add_exploration_id(self):
        """Testing add_exploration_id."""
        self.completed_activities.add_exploration_id('exp_id1')
        self.assertEqual(
            'exp_id1', self.completed_activities.exploration_ids[-1])
        self.assertEqual(
            2, len(self.completed_activities.exploration_ids))

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        self.completed_activities.remove_exploration_id('exp_id0')
        self.assertEqual(
            0, len(self.completed_activities.exploration_ids))

    def test_add_collection_id(self):
        """Testing add_collection_id."""
        self.completed_activities.add_collection_id('collect_id1')
        self.assertEqual(
            'collect_id1', self.completed_activities.collection_ids[-1])
        self.assertEqual(
            2, len(self.completed_activities.collection_ids))

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        self.completed_activities.remove_collection_id('collect_id0')
        self.assertEqual(
            0, len(self.completed_activities.collection_ids))


class LearnerPlaylistTests(test_utils.GenericTestBase):
    """Testing domain object for the learner playlist."""
    def setUp(self):
        super(LearnerPlaylistTests, self).setUp()
        self.learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

    def test_initialization(self):
        """Testing init method."""
        self.assertEqual('user_id0', self.learner_playlist.id)
        self.assertEqual(
            1, len(self.learner_playlist.exploration_ids))
        self.assertEqual(
            'exp_id0', self.learner_playlist.exploration_ids[-1])
        self.assertEqual(
            1, len(self.learner_playlist.collection_ids))
        self.assertEqual(
            'collect_id0', self.learner_playlist.collection_ids[-1])

    def test_insert_exploration_id_at_given_position(self):
        """Testing inserting the given exploration id at the given position."""
        self.learner_playlist.insert_exploration_id_at_given_position(
            'exp_id1', 1)
        self.assertEqual(
            'exp_id1', self.learner_playlist.exploration_ids[1])
        self.assertEqual(
            2, len(self.learner_playlist.exploration_ids))
        self.learner_playlist.insert_exploration_id_at_given_position(
            'exp_id2', 1)
        self.assertEqual(
            'exp_id2', self.learner_playlist.exploration_ids[1])
        self.assertEqual(
            3, len(self.learner_playlist.exploration_ids))

    def test_add_exploration_id_to_list(self):
        """Testing add_exploration_id_to_list."""
        self.learner_playlist.add_exploration_id_to_list('exp_id1')
        self.assertEqual(
            'exp_id1', self.learner_playlist.exploration_ids[-1])
        self.assertEqual(
            2, len(self.learner_playlist.exploration_ids))

    def test_insert_collection_id_at_given_position(self):
        """Testing insert_exploration_id_at_given_position."""
        self.learner_playlist.insert_collection_id_at_given_position(
            'collect_id1', 1)
        self.assertEqual(
            'collect_id1', self.learner_playlist.collection_ids[1])
        self.assertEqual(
            2, len(self.learner_playlist.collection_ids))
        self.learner_playlist.insert_collection_id_at_given_position(
            'collect_id2', 1)
        self.assertEqual(
            'collect_id2', self.learner_playlist.collection_ids[1])
        self.assertEqual(
            3, len(self.learner_playlist.collection_ids))

    def test_add_collection_id_list(self):
        """Testing add_collection_id."""
        self.learner_playlist.add_collection_id_to_list('collect_id1')
        self.assertEqual(
            'collect_id1', self.learner_playlist.collection_ids[-1])
        self.assertEqual(
            2, len(self.learner_playlist.collection_ids))

    def test_remove_exploration_id(self):
        """Testing remove_exploration_id."""
        self.learner_playlist.remove_exploration_id('exp_id0')
        self.assertEqual(
            0, len(self.learner_playlist.exploration_ids))

    def test_remove_collection_id(self):
        """Testing remove_collection_id."""
        self.learner_playlist.remove_collection_id('collect_id0')
        self.assertEqual(
            0, len(self.learner_playlist.collection_ids))


class UserContributionScoringTests(test_utils.GenericTestBase):
    """Testing domain object for user contribution scoring model."""
    def setUp(self):
        super(UserContributionScoringTests, self).setUp()
        self.user_contribution_scoring = (user_domain.UserContributionScoring(
            'user_id0', 'category0', 5))

    def test_initialization(self):
        """Testing init method."""
        self.assertEqual(
            'user_id0', self.user_contribution_scoring.user_id)
        self.assertEqual(
            'category0', self.user_contribution_scoring.score_category)
        self.assertEqual(
            5, self.user_contribution_scoring.score)
