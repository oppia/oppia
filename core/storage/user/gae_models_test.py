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

"""Tests for core.storage.user.gae_models."""

import datetime

from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


class UserSettingsModelTest(test_utils.GenericTestBase):
    """Tests for UserSettingsModel class."""
    user_id = 'user_id'
    user_email = 'user@example.com'
    user_role = feconf.ROLE_ID_ADMIN
    user2_email = 'user2@example.com'
    user2_role = feconf.ROLE_ID_BANNED_USER
    user3_email = 'user3@example.com'
    user3_role = feconf.ROLE_ID_ADMIN
    user3_id = 'user3_id'
    generic_username = 'user'
    generic_date = datetime.datetime(2019, 5, 20)
    generic_image_url = 'www.example.com/example.png'
    generic_user_bio = 'I am a user of Oppia!'
    generic_subject_interests = ['Math', 'Science']
    generic_language_codes = ['en', 'es']

    def setUp(self):
        super(UserSettingsModelTest, self).setUp()
        user_models.UserSettingsModel(
            id=self.user_id, email=self.user_email, role=self.user_role).put()
        user_models.UserSettingsModel(
            email=self.user2_email, role=self.user2_role).put()
        user_models.UserSettingsModel(
            email=self.user3_email, role=self.user3_role).put()
        user_models.UserSettingsModel(
            id=self.user3_id,
            email=self.user3_email,
            role=self.user3_role,
            username=self.generic_username,
            normalized_username=self.generic_username,
            last_agreed_to_terms=self.generic_date,
            last_started_state_editor_tutorial=self.generic_date,
            last_started_state_translation_tutorial=self.generic_date,
            last_logged_in=self.generic_date,
            last_created_an_exploration=self.generic_date,
            last_edited_an_exploration=self.generic_date,
            profile_picture_data_url=self.generic_image_url,
            default_dashboard='learner', creator_dashboard_display_pref='card',
            user_bio=self.generic_user_bio,
            subject_interests=self.generic_subject_interests,
            first_contribution_msec=1,
            preferred_language_codes=self.generic_language_codes,
            preferred_site_language_code=(self.generic_language_codes[0]),
            preferred_audio_language_code=(self.generic_language_codes[0])
        ).put()

    def test_get_by_role(self):
        user = user_models.UserSettingsModel.get_by_role(
            feconf.ROLE_ID_ADMIN)
        self.assertEqual(user[0].role, feconf.ROLE_ID_ADMIN)

    def test_export_data_trivial(self):
        user = user_models.UserSettingsModel.get_by_id(self.user_id)
        user_data = user.export_data(user.id)
        expected_user_data = {
            'email': 'user@example.com',
            'role': feconf.ROLE_ID_ADMIN,
            'username': None,
            'normalized_username': None,
            'last_agreed_to_terms': None,
            'last_started_state_editor_tutorial': None,
            'last_started_state_translation_tutorial': None,
            'last_logged_in': None,
            'last_edited_an_exploration': None,
            'profile_picture_data_url': None,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': None,
            'subject_interests': [],
            'first_contribution_msec': None,
            'preferred_language_codes': [],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None
        }
        self.assertEqual(expected_user_data, user_data)

    def test_export_data_nontrivial(self):
        user = user_models.UserSettingsModel.get_by_id(self.user3_id)
        user_data = user.export_data(user.id)
        expected_user_data = {
            'email': self.user3_email,
            'role': feconf.ROLE_ID_ADMIN,
            'username': self.generic_username,
            'normalized_username': self.generic_username,
            'last_agreed_to_terms': self.generic_date,
            'last_started_state_editor_tutorial': self.generic_date,
            'last_started_state_translation_tutorial': self.generic_date,
            'last_logged_in': self.generic_date,
            'last_edited_an_exploration': self.generic_date,
            'profile_picture_data_url': self.generic_image_url,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': self.generic_user_bio,
            'subject_interests': self.generic_subject_interests,
            'first_contribution_msec': 1,
            'preferred_language_codes': self.generic_language_codes,
            'preferred_site_language_code': self.generic_language_codes[0],
            'preferred_audio_language_code': self.generic_language_codes[0]
        }
        self.assertEqual(expected_user_data, user_data)


class StoryProgressModelTests(test_utils.GenericTestBase):

    def test_get_multi(self):
        model = user_models.StoryProgressModel.create(
            'user_id', 'story_id_1')
        model.put()

        model = user_models.StoryProgressModel.create(
            'user_id', 'story_id_2')
        model.put()

        story_progress_models = user_models.StoryProgressModel.get_multi(
            'user_id', ['story_id_1', 'story_id_2'])
        self.assertEqual(len(story_progress_models), 2)
        self.assertEqual(story_progress_models[0].user_id, 'user_id')
        self.assertEqual(story_progress_models[0].story_id, 'story_id_1')

        self.assertEqual(story_progress_models[1].user_id, 'user_id')
        self.assertEqual(story_progress_models[1].story_id, 'story_id_2')


class ExpUserLastPlaythroughModelTest(test_utils.GenericTestBase):
    """Tests for ExpUserLastPlaythroughModel class."""

    USER_ID = 'user_id'
    EXP_ID_0 = 'exp_id_0'
    EXP_ID_1 = 'exp_id_1'

    def setUp(self):
        super(ExpUserLastPlaythroughModelTest, self).setUp()
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID_0), user_id=self.USER_ID,
            exploration_id=self.EXP_ID_0, last_played_exp_version=1,
            last_played_state_name='state_name').put()

    def test_create_success(self):
        user_models.ExpUserLastPlaythroughModel.create(
            self.USER_ID, self.EXP_ID_1).put()
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID_1))

        self.assertEqual(retrieved_object.user_id, self.USER_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_1)

    def test_get_success(self):
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get(
            self.USER_ID, self.EXP_ID_0)

        self.assertEqual(retrieved_object.user_id, self.USER_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_0)
        self.assertEqual(retrieved_object.last_played_exp_version, 1)
        self.assertEqual(retrieved_object.last_played_state_name, 'state_name')

    def test_get_failure(self):
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get(
            self.USER_ID, 'unknown_exp_id')

        self.assertEqual(retrieved_object, None)


class UserStatsModelTest(test_utils.GenericTestBase):
    """Tests for the UserStatsModel class."""

    USER_ID_1 = 1
    USER_ID_2 = 2
    USER_ID_3 = 3

    USER_1_IMPACT_SCORE = 0.87
    USER_1_TOTAL_PLAYS = 33
    USER_1_AVERAGE_RATINGS = 4.37
    USER_1_NUM_RATINGS = 22
    USER_1_WEEKLY_CREATOR_STATS_LIST = [
        {
            ('2019-05-21'): {
                'average_ratings': 4.00,
                'total_plays': 5
            }
        },
        {
            ('2019-05-28'): {
                'average_ratings': 4.95,
                'total_plays': 10
            }
        }
    ]

    USER_2_IMPACT_SCORE = 0.33
    USER_2_TOTAL_PLAYS = 15
    USER_2_AVERAGE_RATINGS = 2.50
    USER_2_NUM_RATINGS = 10
    USER_2_WEEKLY_CREATOR_STATS_LIST = [
        {
            ('2019-05-21'): {
                'average_ratings': 2.50,
                'total_plays': 4
            }
        },
        {
            ('2019-05-28'): {
                'average_ratings': 2.50,
                'total_plays': 6
            }
        }
    ]

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserStatsModelTest, self).setUp()

        user_model_1 = user_models.UserStatsModel(id=self.USER_ID_1)
        user_model_1.impact_score = self.USER_1_IMPACT_SCORE
        user_model_1.total_plays = self.USER_1_TOTAL_PLAYS
        user_model_1.average_ratings = self.USER_1_AVERAGE_RATINGS
        user_model_1.num_ratings = self.USER_1_NUM_RATINGS
        user_model_1.weekly_creator_stats_list = (
            self.USER_1_WEEKLY_CREATOR_STATS_LIST)
        user_models.UserStatsModel.put(user_model_1)

        user_model_2 = user_models.UserStatsModel(id=self.USER_ID_2)
        user_model_2.impact_score = self.USER_2_IMPACT_SCORE
        user_model_2.total_plays = self.USER_2_TOTAL_PLAYS
        user_model_2.average_ratings = self.USER_2_AVERAGE_RATINGS
        user_model_2.num_ratings = self.USER_2_NUM_RATINGS
        user_model_2.weekly_creator_stats_list = (
            self.USER_2_WEEKLY_CREATOR_STATS_LIST)
        user_models.UserStatsModel.put(user_model_2)

    def test_export_data_on_existing_user(self):
        """Test if export_data works when user is in data store."""
        user_data = user_models.UserStatsModel.export_data(self.USER_ID_1)
        test_data = {
            'impact_score': self.USER_1_IMPACT_SCORE,
            'total_plays': self.USER_1_TOTAL_PLAYS,
            'average_ratings': self.USER_1_AVERAGE_RATINGS,
            'num_ratings': self.USER_1_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_1_WEEKLY_CREATOR_STATS_LIST
        }
        self.assertEqual(user_data, test_data)

    def test_export_data_on_multiple_users(self):
        """Test if export_data works on multiple users in data store."""
        user_1_data = user_models.UserStatsModel.export_data(self.USER_ID_1)
        test_1_data = {
            'impact_score': self.USER_1_IMPACT_SCORE,
            'total_plays': self.USER_1_TOTAL_PLAYS,
            'average_ratings': self.USER_1_AVERAGE_RATINGS,
            'num_ratings': self.USER_1_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_1_WEEKLY_CREATOR_STATS_LIST
        }

        user_2_data = user_models.UserStatsModel.export_data(self.USER_ID_2)
        test_2_data = {
            'impact_score': self.USER_2_IMPACT_SCORE,
            'total_plays': self.USER_2_TOTAL_PLAYS,
            'average_ratings': self.USER_2_AVERAGE_RATINGS,
            'num_ratings': self.USER_2_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_2_WEEKLY_CREATOR_STATS_LIST
        }

        self.assertEqual(user_1_data, test_1_data)
        self.assertEqual(user_2_data, test_2_data)

    def test_export_data_on_nonexistent_user(self):
        """Test if export_data returns None when user is not in data store."""
        user_data = user_models.UserStatsModel.export_data(self.USER_ID_3)
        test_data = None
        self.assertEqual(user_data, test_data)


class ExplorationUserDataModelTest(test_utils.GenericTestBase):
    """Tests for the ExplorationUserDataModel class."""

    DATETIME_OBJECT = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')
    USER_ID = 'user_id'
    EXP_ID_ONE = 'exp_id_one'
    EXP_ID_TWO = 'exp_id_two'

    def setUp(self):
        super(ExplorationUserDataModelTest, self).setUp()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID_ONE), user_id=self.USER_ID,
            exploration_id=self.EXP_ID_ONE, rating=2,
            rated_on=self.DATETIME_OBJECT,
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=self.DATETIME_OBJECT,
            draft_change_list_exp_version=3,
            draft_change_list_id=1).put()

    def test_create_success(self):
        user_models.ExplorationUserDataModel.create(
            self.USER_ID, self.EXP_ID_TWO).put()
        retrieved_object = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID_TWO))

        self.assertEqual(retrieved_object.user_id, self.USER_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_TWO)

    def test_get_success(self):
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID_ONE)

        self.assertEqual(retrieved_object.user_id, self.USER_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_ONE)
        self.assertEqual(retrieved_object.rating, 2)
        self.assertEqual(retrieved_object.rated_on, self.DATETIME_OBJECT)
        self.assertEqual(
            retrieved_object.draft_change_list, {'new_content': {}})
        self.assertEqual(
            retrieved_object.draft_change_list_last_updated,
            self.DATETIME_OBJECT)
        self.assertEqual(retrieved_object.draft_change_list_exp_version, 3)
        self.assertEqual(retrieved_object.draft_change_list_id, 1)

    def test_get_failure(self):
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_ID, 'unknown_exp_id')

        self.assertEqual(retrieved_object, None)


class UserQueryModelTests(test_utils.GenericTestBase):
    """Tests for UserQueryModel."""

    def test_instance_stores_correct_data(self):
        submitter_id = 'submitter'
        query_id = 'qid'
        inactive_in_last_n_days = 5
        created_at_least_n_exps = 1
        created_fewer_than_n_exps = 3
        edited_at_least_n_exps = 2
        edited_fewer_than_n_exps = 5
        has_not_logged_in_for_n_days = 10
        user_models.UserQueryModel(
            id=query_id,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            submitter_id=submitter_id).put()

        query_model = user_models.UserQueryModel.get(query_id)
        self.assertEqual(query_model.submitter_id, submitter_id)
        self.assertEqual(
            query_model.inactive_in_last_n_days, inactive_in_last_n_days)
        self.assertEqual(
            query_model.has_not_logged_in_for_n_days,
            has_not_logged_in_for_n_days)
        self.assertEqual(
            query_model.created_at_least_n_exps, created_at_least_n_exps)
        self.assertEqual(
            query_model.created_fewer_than_n_exps, created_fewer_than_n_exps)
        self.assertEqual(
            query_model.edited_at_least_n_exps, edited_at_least_n_exps)
        self.assertEqual(
            query_model.edited_fewer_than_n_exps, edited_fewer_than_n_exps)


    def test_fetch_page(self):

        submitter_id = 'submitter_1'
        query_id = 'qid_1'
        inactive_in_last_n_days = 5
        created_at_least_n_exps = 1
        created_fewer_than_n_exps = 3
        edited_at_least_n_exps = 2
        edited_fewer_than_n_exps = 5
        has_not_logged_in_for_n_days = 10
        user_models.UserQueryModel(
            id=query_id,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            submitter_id=submitter_id).put()

        submitter_id = 'submitter_2'
        query_id = 'qid_2'
        inactive_in_last_n_days = 6
        created_at_least_n_exps = 7
        created_fewer_than_n_exps = 4
        edited_at_least_n_exps = 3
        edited_fewer_than_n_exps = 6
        has_not_logged_in_for_n_days = 11
        user_models.UserQueryModel(
            id=query_id,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            submitter_id=submitter_id).put()

        # Fetch only one entity.
        query_models, _, _ = user_models.UserQueryModel.fetch_page(
            1, None)
        self.assertEqual(len(query_models), 1)

        self.assertEqual(query_models[0].submitter_id, 'submitter_2')
        self.assertEqual(query_models[0].id, 'qid_2')
        self.assertEqual(query_models[0].inactive_in_last_n_days, 6)
        self.assertEqual(query_models[0].created_at_least_n_exps, 7)
        self.assertEqual(query_models[0].created_fewer_than_n_exps, 4)
        self.assertEqual(query_models[0].edited_at_least_n_exps, 3)
        self.assertEqual(query_models[0].edited_fewer_than_n_exps, 6)
        self.assertEqual(query_models[0].has_not_logged_in_for_n_days, 11)

        # Fetch both entities.
        query_models, _, _ = user_models.UserQueryModel.fetch_page(
            2, None)
        self.assertEqual(len(query_models), 2)

        self.assertEqual(query_models[0].submitter_id, 'submitter_2')
        self.assertEqual(query_models[0].id, 'qid_2')
        self.assertEqual(query_models[0].inactive_in_last_n_days, 6)
        self.assertEqual(query_models[0].created_at_least_n_exps, 7)
        self.assertEqual(query_models[0].created_fewer_than_n_exps, 4)
        self.assertEqual(query_models[0].edited_at_least_n_exps, 3)
        self.assertEqual(query_models[0].edited_fewer_than_n_exps, 6)
        self.assertEqual(query_models[0].has_not_logged_in_for_n_days, 11)

        self.assertEqual(query_models[1].submitter_id, 'submitter_1')
        self.assertEqual(query_models[1].id, 'qid_1')
        self.assertEqual(query_models[1].inactive_in_last_n_days, 5)
        self.assertEqual(query_models[1].created_at_least_n_exps, 1)
        self.assertEqual(query_models[1].created_fewer_than_n_exps, 3)
        self.assertEqual(query_models[1].edited_at_least_n_exps, 2)
        self.assertEqual(query_models[1].edited_fewer_than_n_exps, 5)
        self.assertEqual(query_models[1].has_not_logged_in_for_n_days, 10)


class UserSkillMasteryModelTests(test_utils.GenericTestBase):
    """Tests for UserSkillMasteryModel."""

    USER_ID = 'user_id'
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    DEGREE_OF_MASTERY = 0.5

    def setUp(self):
        super(UserSkillMasteryModelTests, self).setUp()
        user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_1),
            user_id=self.USER_ID,
            skill_id=self.SKILL_ID_1,
            degree_of_mastery=self.DEGREE_OF_MASTERY).put()

        user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_2),
            user_id=self.USER_ID,
            skill_id=self.SKILL_ID_2,
            degree_of_mastery=self.DEGREE_OF_MASTERY).put()

    def test_construct_model_id(self):
        constructed_model_id = (
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_1))

        self.assertEqual(constructed_model_id, 'user_id.skill_id_1')

    def test_get_success(self):
        constructed_model_id = (
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_1))
        retrieved_object = user_models.UserSkillMasteryModel.get(
            constructed_model_id)

        self.assertEqual(retrieved_object.user_id, 'user_id')
        self.assertEqual(retrieved_object.skill_id, 'skill_id_1')
        self.assertEqual(retrieved_object.degree_of_mastery, 0.5)

    def test_get_failure(self):
        retrieved_object = user_models.UserSkillMasteryModel.get(
            'unknown_model_id', strict=False)

        self.assertEqual(retrieved_object, None)

    def test_get_multi_success(self):
        skill_ids = [
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_1),
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_2)]
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            skill_ids)

        self.assertEqual(retrieved_object[0].user_id, 'user_id')
        self.assertEqual(retrieved_object[0].skill_id, 'skill_id_1')
        self.assertEqual(retrieved_object[0].degree_of_mastery, 0.5)
        self.assertEqual(retrieved_object[1].user_id, 'user_id')
        self.assertEqual(retrieved_object[1].skill_id, 'skill_id_2')
        self.assertEqual(retrieved_object[1].degree_of_mastery, 0.5)

    def test_get_multi_failure(self):
        skill_ids = ['unknown_model_id_1', 'unknown_model_id_2']
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            skill_ids)

        self.assertEqual(retrieved_object, [None, None])


class UserContributionsScoringModelTests(test_utils.GenericTestBase):
    """Tests for UserContributionScoringModel."""

    def test_create_model(self):
        user_models.UserContributionScoringModel.create('user1', 'category1', 1)
        score_models = (user_models.UserContributionScoringModel
                        .get_all_scores_of_user('user1'))
        self.assertEqual(len(score_models), 1)
        self.assertEqual(score_models[0].id, 'category1.user1')
        self.assertEqual(score_models[0].user_id, 'user1')
        self.assertEqual(score_models[0].score_category, 'category1')
        self.assertEqual(score_models[0].score, 1)

    def test_create_entry_already_exists_failure(self):
        user_models.UserContributionScoringModel.create('user1', 'category1', 1)
        with self.assertRaisesRegexp(
            Exception, 'There is already an entry with the given id:'
                       ' category1.user1'):
            user_models.UserContributionScoringModel.create(
                'user1', 'category1', 2)

    def test_get_all_users_with_score_above_minimum_for_category(self):
        user_models.UserContributionScoringModel.create('user1', 'category1', 1)
        user_models.UserContributionScoringModel.create(
            'user2', 'category1', 21)
        user_models.UserContributionScoringModel.create(
            'user3', 'category1', 11)
        user_models.UserContributionScoringModel.create(
            'user4', 'category1', 11)
        user_models.UserContributionScoringModel.create(
            'user1', 'category2', 11)
        user_models.UserContributionScoringModel.create('user2', 'category2', 1)
        user_models.UserContributionScoringModel.create('user3', 'category2', 1)
        user_models.UserContributionScoringModel.create('user4', 'category2', 1)

        score_models = (user_models.UserContributionScoringModel
                        .get_all_users_with_score_above_minimum_for_category(
                            'category1'))

        self.assertEqual(len(score_models), 3)
        self.assertIn(user_models.UserContributionScoringModel.get_by_id(
            'category1.user2'), score_models)
        self.assertIn(user_models.UserContributionScoringModel.get_by_id(
            'category1.user3'), score_models)
        self.assertIn(user_models.UserContributionScoringModel.get_by_id(
            'category1.user4'), score_models)

        score_models = (user_models.UserContributionScoringModel
                        .get_all_users_with_score_above_minimum_for_category(
                            'category2'))

        self.assertEqual(len(score_models), 1)
        self.assertIn(user_models.UserContributionScoringModel.get_by_id(
            'category2.user1'), score_models)

    def test_get_score_of_user_for_category(self):
        user_models.UserContributionScoringModel.create('user1', 'category1', 1)

        score = (user_models.UserContributionScoringModel
                 .get_score_of_user_for_category('user1', 'category1'))

        self.assertEqual(score, 1)

    def test_increment_score_for_user(self):
        user_models.UserContributionScoringModel.create('user1', 'category1', 1)

        user_models.UserContributionScoringModel.increment_score_for_user(
            'user1', 'category1', 2)

        score = (user_models.UserContributionScoringModel
                 .get_score_of_user_for_category('user1', 'category1'))

        self.assertEqual(score, 3)

    def test_get_all_scores_of_user(self):
        user_models.UserContributionScoringModel.create('user1', 'category1', 1)
        user_models.UserContributionScoringModel.create('user1', 'category2', 1)
        user_models.UserContributionScoringModel.create('user1', 'category3', 1)

        score_models = (user_models.UserContributionScoringModel
                        .get_all_scores_of_user('user1'))
        self.assertEqual(len(score_models), 3)
        self.assertIn(user_models.UserContributionScoringModel.get_by_id(
            'category1.user1'), score_models)
        self.assertIn(user_models.UserContributionScoringModel.get_by_id(
            'category2.user1'), score_models)
        self.assertIn(user_models.UserContributionScoringModel.get_by_id(
            'category3.user1'), score_models)

    def test_get_categories_where_user_can_review(self):
        user_models.UserContributionScoringModel.create(
            'user1', 'category1', 15)
        user_models.UserContributionScoringModel.create('user1', 'category2', 1)
        user_models.UserContributionScoringModel.create(
            'user1', 'category3', 15)
        score_categories = (
            user_models.UserContributionScoringModel
            .get_all_categories_where_user_can_review('user1'))
        self.assertIn('category1', score_categories)
        self.assertIn('category3', score_categories)
        self.assertNotIn('category2', score_categories)


class UserSubscriptionsModelTests(test_utils.GenericTestBase):
    """Tests for UserSubscriptionsModel."""
    USER_ID_1 = 'user_id_1'
    USER_ID_2 = 'user_id_2'
    USER_ID_3 = 'user_id_3'
    CREATOR_IDS = ['4', '8', '16']
    COLLECTION_IDS = ['23', '42', '4']
    ACTIVITY_IDS = ['8', '16', '23']
    GENERAL_FEEDBACK_THREAD_IDS = ['42', '4', '8']

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserSubscriptionsModelTests, self).setUp()
        user_models.UserSubscriptionsModel(id=self.USER_ID_1).put()

        user_models.UserSubscriptionsModel(
            id=self.USER_ID_2, creator_ids=self.CREATOR_IDS,
            collection_ids=self.COLLECTION_IDS,
            activity_ids=self.ACTIVITY_IDS,
            general_feedback_thread_ids=self.GENERAL_FEEDBACK_THREAD_IDS).put()

    def test_export_data_trivial(self):
        """Test if empty user data is properly exported."""
        user_data = (
            user_models.UserSubscriptionsModel.export_data(self.USER_ID_1))
        test_data = {
            'creator_ids': [],
            'collection_ids': [],
            'activity_ids': [],
            'general_feedback_thread_ids': [],
            'last_checked': None
        }
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self):
        """Test if nonempty user data is properly exported."""
        user_data = (
            user_models.UserSubscriptionsModel.export_data(self.USER_ID_2))
        test_data = {
            'creator_ids': self.CREATOR_IDS,
            'collection_ids': self.COLLECTION_IDS,
            'activity_ids': self.ACTIVITY_IDS,
            'general_feedback_thread_ids': self.GENERAL_FEEDBACK_THREAD_IDS,
            'last_checked': None
        }
        self.assertEqual(user_data, test_data)

    def test_export_data_on_nonexistent_user(self):
        """Test if exception is raised on nonexistent UserSubscriptionsModel."""
        export_data_exception = (
            self.assertRaisesRegexp(
                Exception, 'UserSubscriptionsModel does not exist.'))
        with export_data_exception:
            user_models.UserSubscriptionsModel.export_data(self.USER_ID_3)
