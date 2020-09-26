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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import user_domain
from core.tests import test_utils
import feconf
import utils


# This mock class will not be needed once the schema version is >=2 for the
# original class ModifiableUserData. Tests below using this class should also
# be modified then.
class MockModifiableUserData(user_domain.ModifiableUserData):
    """A mock ModifiableUserData class that adds a new attribute to the original
    class to create a new version of the schema for testing migration of old
    schema user data dict to latest one.
    """

    def __init__(
            self, display_alias, pin, preferred_language_codes,
            preferred_site_language_code, preferred_audio_language_code,
            version, user_id=None, fake_field=None):
        super(MockModifiableUserData, self).__init__(
            display_alias, pin, preferred_language_codes,
            preferred_site_language_code, preferred_audio_language_code,
            version, user_id=None)
        self.fake_field = fake_field

    CURRENT_SCHEMA_VERSION = 2

    # Overriding method to add a new attribute added names 'fake_field'.
    @classmethod
    def from_dict(cls, modifiable_user_data_dict):
        return MockModifiableUserData(
            modifiable_user_data_dict['display_alias'],
            modifiable_user_data_dict['pin'],
            modifiable_user_data_dict['preferred_language_codes'],
            modifiable_user_data_dict['preferred_site_language_code'],
            modifiable_user_data_dict['preferred_audio_language_code'],
            modifiable_user_data_dict['schema_version'],
            modifiable_user_data_dict['user_id'],
            modifiable_user_data_dict['fake_field']
        )

    # Adding a new method to convert v1 schema data dict to v2.
    @classmethod
    def _convert_v1_dict_to_v2_dict(cls, user_data_dict):
        """Mock function to convert v1 dict to v2."""
        user_data_dict['schema_version'] = 2
        user_data_dict['fake_field'] = 'default_value'
        return user_data_dict

    # Overiding method to first convert raw user data dict to latest version
    # then returning a ModifiableUserData domain object.
    @classmethod
    def from_raw_dict(cls, raw_user_data_dict):
        intial_schema_version = raw_user_data_dict['schema_version']
        data_schema_version = intial_schema_version
        user_data_dict = raw_user_data_dict

        if data_schema_version == 1:
            user_data_dict = cls._convert_v1_dict_to_v2_dict(user_data_dict)

        return MockModifiableUserData.from_dict(user_data_dict)


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


class UserContributionProficiencyTests(test_utils.GenericTestBase):
    """Testing domain object for user contribution scoring model."""

    def setUp(self):
        super(UserContributionProficiencyTests, self).setUp()
        self.user_proficiency = user_domain.UserContributionProficiency(
            'user_id0', 'category0', 0, False)

    def test_initialization(self):
        """Testing init method."""
        self.assertEqual(self.user_proficiency.user_id, 'user_id0')
        self.assertEqual(
            self.user_proficiency.score_category, 'category0')
        self.assertEqual(self.user_proficiency.score, 0)
        self.assertEqual(
            self.user_proficiency.onboarding_email_sent, False)

    def test_increment_score(self):
        self.assertEqual(self.user_proficiency.score, 0)

        self.user_proficiency.increment_score(4)
        self.assertEqual(self.user_proficiency.score, 4)

        self.user_proficiency.increment_score(-3)
        self.assertEqual(self.user_proficiency.score, 1)

    def test_can_user_review_category(self):
        self.assertEqual(self.user_proficiency.score, 0)
        self.assertFalse(self.user_proficiency.can_user_review_category())

        self.user_proficiency.increment_score(
            feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW)

        self.assertTrue(self.user_proficiency.can_user_review_category())

    def test_mark_onboarding_email_as_sent(self):
        self.assertFalse(self.user_proficiency.onboarding_email_sent)

        self.user_proficiency.mark_onboarding_email_as_sent()

        self.assertTrue(self.user_proficiency.onboarding_email_sent)


class UserContributionRightsTests(test_utils.GenericTestBase):
    """Testing UserContributionRights domain object."""

    def setUp(self):
        super(UserContributionRightsTests, self).setUp()
        self.user_contribution_rights = user_domain.UserContributionRights(
            'user_id', ['hi'], [], True)

    def test_initialization(self):
        """Testing init method."""

        self.assertEqual(self.user_contribution_rights.id, 'user_id')
        self.assertEqual(
            self.user_contribution_rights
            .can_review_translation_for_language_codes, ['hi'])
        self.assertEqual(
            self.user_contribution_rights
            .can_review_voiceover_for_language_codes,
            [])
        self.assertEqual(
            self.user_contribution_rights.can_review_questions, True)

    def test_can_review_translation_for_language_codes_incorrect_type(self):
        self.user_contribution_rights.can_review_translation_for_language_codes = 5 # pylint: disable=line-too-long
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected can_review_translation_for_language_codes to be a list'):
            self.user_contribution_rights.validate()

    def test_can_review_voiceover_for_language_codes_incorrect_type(self):
        self.user_contribution_rights.can_review_voiceover_for_language_codes = 5 # pylint: disable=line-too-long
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected can_review_voiceover_for_language_codes to be a list'):
            self.user_contribution_rights.validate()

    def test_incorrect_language_code_for_voiceover_raise_error(self):
        self.user_contribution_rights.can_review_voiceover_for_language_codes = [ # pylint: disable=line-too-long
            'invalid_lang_code']
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid language_code: invalid_lang_code'):
            self.user_contribution_rights.validate()

    def test_incorrect_language_code_for_translation_raise_error(self):
        self.user_contribution_rights.can_review_translation_for_language_codes = [ # pylint: disable=line-too-long
            'invalid_lang_code']
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid language_code: invalid_lang_code'):
            self.user_contribution_rights.validate()

    def test_can_review_voiceover_for_language_codes_with_duplicate_values(
            self):
        self.user_contribution_rights.can_review_voiceover_for_language_codes = [ # pylint: disable=line-too-long
            'hi']
        self.user_contribution_rights.validate()

        self.user_contribution_rights.can_review_voiceover_for_language_codes = [ # pylint: disable=line-too-long
            'hi', 'hi']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected can_review_voiceover_for_language_codes list not to have '
            'duplicate values'):
            self.user_contribution_rights.validate()

    def test_can_review_translation_for_language_codes_with_duplicate_values(
            self):
        self.user_contribution_rights.can_review_translation_for_language_codes = [ # pylint: disable=line-too-long
            'hi']
        self.user_contribution_rights.validate()

        self.user_contribution_rights.can_review_translation_for_language_codes = [ # pylint: disable=line-too-long
            'hi', 'hi']
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected can_review_translation_for_language_codes list not to '
            'have duplicate values'):
            self.user_contribution_rights.validate()

    def test_incorrect_type_for_can_review_questions_raise_error(self):
        self.user_contribution_rights.can_review_questions = 5
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected can_review_questions to be a boolean value'):
            self.user_contribution_rights.validate()


class ModifiableUserDataTests(test_utils.GenericTestBase):
    """Testing domain object for modifiable user data."""

    def test_initialization_with_none_user_id_is_successful(self):
        """Testing init method user id set None."""
        schema_version = 1
        user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '123',
            'preferred_language_codes': 'preferred_language_codes',
            'preferred_site_language_code': 'preferred_site_language_code',
            'preferred_audio_language_code': 'preferred_audio_language_code',
            'user_id': None,
        }
        modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict)
        )

        self.assertEqual(
            modifiable_user_data.display_alias, 'display_alias')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes,
            'preferred_language_codes'
        )
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code,
            'preferred_site_language_code'
        )
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code,
            'preferred_audio_language_code'
        )
        self.assertIsNone(modifiable_user_data.user_id)
        self.assertEqual(modifiable_user_data.version, schema_version)

    def test_initialization_with_valid_user_id_is_successful(self):
        """Testing init method with a valid user id set."""
        schema_version = 1
        user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '123',
            'preferred_language_codes': 'preferred_language_codes',
            'preferred_site_language_code': 'preferred_site_language_code',
            'preferred_audio_language_code': 'preferred_audio_language_code',
            'user_id': 'user_id',
        }
        modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict)
        )

        self.assertEqual(
            modifiable_user_data.display_alias, 'display_alias')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes,
            'preferred_language_codes'
        )
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code,
            'preferred_site_language_code'
        )
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code,
            'preferred_audio_language_code'
        )
        self.assertEqual(modifiable_user_data.user_id, 'user_id')
        self.assertEqual(modifiable_user_data.version, schema_version)

    # This test should be modified to use the original class ModifiableUserData
    # itself when the CURRENT_SCHEMA_VERSION has been updated to 2 or higher.
    def test_mock_modifiable_user_data_class_with_all_attributes_given(self):
        user_data_dict = {
            'schema_version': 2,
            'display_alias': 'name',
            'pin': '123',
            'preferred_language_codes': ['en', 'es'],
            'preferred_site_language_code': 'es',
            'preferred_audio_language_code': 'en',
            'user_id': None,
            'fake_field': 'set_value'
        }
        modifiable_user_data = (
            MockModifiableUserData.from_raw_dict(user_data_dict))
        self.assertEqual(modifiable_user_data.display_alias, 'name')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes, ['en', 'es'])
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code, 'es')
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code, 'en')
        self.assertEqual(modifiable_user_data.fake_field, 'set_value')
        self.assertEqual(modifiable_user_data.user_id, None)
        self.assertEqual(modifiable_user_data.version, 2)

    # This test should be modified to use the original class ModifiableUserData
    # itself when the CURRENT_SCHEMA_VERSION has been updated to 2 or higher.
    def test_mock_migration_from_old_version_to_new_works_correctly(self):
        user_data_dict = {
            'schema_version': 1,
            'display_alias': 'name',
            'pin': '123',
            'preferred_language_codes': ['en', 'es'],
            'preferred_site_language_code': 'es',
            'preferred_audio_language_code': 'en',
            'user_id': None
        }
        modifiable_user_data = MockModifiableUserData.from_raw_dict(
            user_data_dict)
        self.assertEqual(modifiable_user_data.display_alias, 'name')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes, ['en', 'es'])
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code, 'es')
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code, 'en')
        self.assertEqual(modifiable_user_data.fake_field, 'default_value')
        self.assertEqual(modifiable_user_data.user_id, None)
        self.assertEqual(modifiable_user_data.version, 2)
