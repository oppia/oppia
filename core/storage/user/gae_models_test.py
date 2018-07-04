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

import datetime

from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


class UserSettingsModelTest(test_utils.GenericTestBase):
    """Tests for UserSettingsModel class."""
    user_email = 'user@example.com'
    user_role = feconf.ROLE_ID_ADMIN
    user2_email = 'user2@example.com'
    user2_role = feconf.ROLE_ID_BANNED_USER

    def setUp(self):
        super(UserSettingsModelTest, self).setUp()
        user_models.UserSettingsModel(
            email=self.user_email, role=self.user_role).put()
        user_models.UserSettingsModel(
            email=self.user2_email, role=self.user2_role).put()

    def test_get_by_role(self):
        user = user_models.UserSettingsModel.get_by_role(
            feconf.ROLE_ID_ADMIN)
        self.assertEqual(user[0].role, feconf.ROLE_ID_ADMIN)


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
        SKILL_IDS = [
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_1),
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID, self.SKILL_ID_2)]
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            SKILL_IDS)

        self.assertEqual(retrieved_object[0].user_id, 'user_id')
        self.assertEqual(retrieved_object[0].skill_id, 'skill_id_1')
        self.assertEqual(retrieved_object[0].degree_of_mastery, 0.5)
        self.assertEqual(retrieved_object[1].user_id, 'user_id')
        self.assertEqual(retrieved_object[1].skill_id, 'skill_id_2')
        self.assertEqual(retrieved_object[1].degree_of_mastery, 0.5)

    def test_get_multi_failure(self):
        SKILL_IDS = ['unknown_model_id_1', 'unknown_model_id_2']
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            SKILL_IDS)

        self.assertEqual(retrieved_object, [None, None])


class UserContributionsScoringModelTests(test_utils.GenericTestBase):
    """Tests for UserContributionScoringModel."""

    def test_create_model(self):
        user_models.UserContributionScoringModel.create('user1', 'category1', 1)
        scoreModels = (user_models.UserContributionScoringModel
                       .get_all_scores_of_user('user1'))
        self.assertEqual(len(scoreModels), 1)
        self.assertEqual(scoreModels[0].id, 'category1.user1')
        self.assertEqual(scoreModels[0].user_id, 'user1')
        self.assertEqual(scoreModels[0].score_category, 'category1')
        self.assertEqual(scoreModels[0].score, 1)

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
