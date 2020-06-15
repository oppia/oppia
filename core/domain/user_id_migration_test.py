# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for user-related one-off computations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from constants import constants
from core.domain import rights_manager
from core.domain import topic_domain
from core.domain import user_id_migration
from core.platform import models
from core.tests import test_utils
import feconf

from google.appengine.ext import ndb

(
    activity_models, base_models,
    collection_models, exp_models,
    feedback_models, question_models, skill_models,
    topic_models, user_models) = models.Registry.import_models(
        [models.NAMES.activity, models.NAMES.base_model,
         models.NAMES.collection, models.NAMES.exploration,
         models.NAMES.feedback, models.NAMES.question, models.NAMES.skill,
         models.NAMES.topic, models.NAMES.user])
taskqueue_services = models.Registry.import_taskqueue_services()
search_services = models.Registry.import_search_services()


class HelperFunctionsTests(test_utils.GenericTestBase):
    """Tests for UserIdMigrationJobTests."""
    USER_1_USER_ID = 'uid_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    USER_1_GAE_ID = 'gae_id_1'
    USER_2_USER_ID = 'uid_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    USER_2_GAE_ID = 'gae_id_2'
    USER_3_USER_ID = 'uid_cccccccccccccccccccccccccccccccc'
    USER_3_GAE_ID = 'gae_id_3'

    def setUp(self):
        super(HelperFunctionsTests, self).setUp()

        user_models.UserSettingsModel(
            id=self.USER_1_USER_ID,
            gae_id=self.USER_1_GAE_ID,
            email='some@email.com'
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_2_USER_ID,
            gae_id=self.USER_2_GAE_ID,
            email='some.different@email.com'
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_3_USER_ID,
            gae_id=self.USER_3_GAE_ID,
            email='some.different@email.cz'
        ).put()

    def test_verify_user_id_correct(self):
        self.assertTrue(
            user_id_migration.verify_user_id_correct('uid_' + 'a' * 32))
        self.assertFalse(
            user_id_migration.verify_user_id_correct('uid_' + 'a' * 31 + 'A'))
        self.assertFalse(
            user_id_migration.verify_user_id_correct('uid_' + 'a' * 31))
        self.assertFalse(user_id_migration.verify_user_id_correct('a' * 36))

    def test_replace_gae_ids(self):
        self.assertEqual(
            user_id_migration.get_user_ids_corresponding_to_gae_ids(
                [self.USER_1_GAE_ID, self.USER_2_GAE_ID, self.USER_3_GAE_ID]),
            [self.USER_1_USER_ID, self.USER_2_USER_ID, self.USER_3_USER_ID]
        )
        with self.assertRaises(user_id_migration.AlreadyMigratedUserException):
            user_id_migration.get_user_ids_corresponding_to_gae_ids(
                [self.USER_1_USER_ID, 'nonexistent_gae_id'])

        with self.assertRaises(user_id_migration.MissingUserException):
            user_id_migration.get_user_ids_corresponding_to_gae_ids(
                [self.USER_1_GAE_ID, 'nonexistent_gae_id'])

        self.assertEqual(
            user_id_migration.get_user_ids_corresponding_to_gae_ids(
                [self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID]),
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID]
        )

    def test_replace_gae_id(self):
        self.assertEqual(
            user_id_migration.get_user_id_corresponding_to_gae_id(
                self.USER_1_GAE_ID),
            self.USER_1_USER_ID
        )

        with self.assertRaises(user_id_migration.AlreadyMigratedUserException):
            user_id_migration.get_user_id_corresponding_to_gae_id(
                self.USER_1_USER_ID)

        with self.assertRaises(user_id_migration.MissingUserException):
            user_id_migration.get_user_id_corresponding_to_gae_id(
                'nonexistent_gae_id')

        self.assertEqual(
            user_id_migration.get_user_id_corresponding_to_gae_id(
                feconf.SYSTEM_COMMITTER_ID),
            feconf.SYSTEM_COMMITTER_ID
        )

    def test_are_commit_cmds_role_change(self):
        self.assertTrue(
            user_id_migration.are_commit_cmds_role_change([{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR
            }])
        )
        self.assertTrue(
            user_id_migration.are_commit_cmds_role_change([{
                'cmd': topic_domain.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR
            }])
        )
        self.assertTrue(
            user_id_migration.are_commit_cmds_role_change([{
                'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                'removed_user_id': self.USER_1_GAE_ID
            }])
        )
        self.assertFalse(
            user_id_migration.are_commit_cmds_role_change([
                {
                    'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                    'removed_user_id': self.USER_1_GAE_ID
                },
                {
                    'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                    'removed_user_id': self.USER_1_GAE_ID
                }
            ])
        )
        self.assertFalse(
            user_id_migration.are_commit_cmds_role_change([{
                'cmd': topic_domain.CMD_PUBLISH_TOPIC
            }])
        )


class CreateNewUsersMigrationJobTests(test_utils.GenericTestBase):
    """Tests for UserIdMigrationJobTests."""
    USER_A_ID = 'user_1_id'
    USER_A_EMAIL = 'a@example.com'
    USER_B_ID = 'user_2_id'
    USER_B_EMAIL = 'b@example.com'
    USER_C_ID = 'user_3_id'
    USER_C_EMAIL = 'c@example.com'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_id_migration.CreateNewUsersMigrationJob.create_new()
        user_id_migration.CreateNewUsersMigrationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.CreateNewUsersMigrationJob.get_output(job_id))
        return [ast.literal_eval(item) for item in stringified_output]

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(CreateNewUsersMigrationJobTests, self).setUp()

    def test_one_user_user_settings_model(self):
        original_model = user_models.UserSettingsModel(
            id=self.USER_A_ID,
            gae_id=self.USER_A_ID,
            gae_user_id=self.USER_A_ID,
            email=self.USER_A_EMAIL,
        )
        original_model.put()

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 1]])
        migrated_model = user_models.UserSettingsModel.query(
            user_models.UserSettingsModel.gae_id == self.USER_A_ID).get()

        self.assertNotEqual(original_model.id, migrated_model.id)
        self.assertEqual(original_model.gae_user_id, migrated_model.gae_user_id)
        self.assertEqual(original_model.email, migrated_model.email)
        self.assertEqual(original_model.created_on, migrated_model.created_on)
        self.assertEqual(
            original_model.last_updated, migrated_model.last_updated)

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.USER_A_ID))

    def test_multiple_user_user_settings_model(self):
        original_models = {}
        original_models[self.USER_A_ID] = user_models.UserSettingsModel(
            id=self.USER_A_ID,
            gae_id=self.USER_A_ID,
            email=self.USER_A_EMAIL,
        )
        original_models[self.USER_A_ID].put()
        original_models[self.USER_B_ID] = user_models.UserSettingsModel(
            id=self.USER_B_ID,
            gae_id=self.USER_B_ID,
            email=self.USER_B_EMAIL,
        )
        original_models[self.USER_B_ID].put()
        original_models[self.USER_C_ID] = user_models.UserSettingsModel(
            id=self.USER_C_ID,
            gae_id=self.USER_C_ID,
            email=self.USER_C_EMAIL,
        )
        original_models[self.USER_C_ID].put()

        output = self._run_one_off_job()
        self.assertIn(['SUCCESS', 3], output)
        for user_id, original_model in original_models.items():
            migrated_model = user_models.UserSettingsModel.query(
                user_models.UserSettingsModel.gae_id == user_id).get()

            self.assertNotEqual(original_model.id, migrated_model.id)
            self.assertEqual(
                original_model.gae_user_id, migrated_model.gae_user_id)
            self.assertEqual(original_model.email, migrated_model.email)
            self.assertEqual(
                original_model.created_on, migrated_model.created_on)
            self.assertEqual(
                original_model.last_updated, migrated_model.last_updated)

            self.assertIsNone(
                user_models.UserSettingsModel.get_by_id(migrated_model.gae_id))

    def test_repeated_run(self):
        original_model = user_models.UserSettingsModel(
            id=self.USER_A_ID,
            gae_id=self.USER_A_ID,
            gae_user_id=self.USER_A_ID,
            email=self.USER_A_EMAIL,
        )
        original_model.put()

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 1]])

        migrated_model = user_models.UserSettingsModel.query(
            user_models.UserSettingsModel.gae_id == self.USER_A_ID).get()

        self.assertNotEqual(original_model.id, migrated_model.id)
        self.assertEqual(original_model.gae_user_id, migrated_model.gae_user_id)
        self.assertEqual(original_model.email, migrated_model.email)
        self.assertEqual(original_model.created_on, migrated_model.created_on)
        self.assertEqual(
            original_model.last_updated, migrated_model.last_updated)

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.USER_A_ID))

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS_ALREADY_MIGRATED', 1]])


class UserIdMigrationJobTests(test_utils.GenericTestBase):
    """Tests for UserIdMigrationJobTests."""

    USER_A_ID = 'user_0_id'
    USER_A_GAE_ID = 'gae_0_id'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_ID = 'user_1_id'
    USER_B_GAE_ID = 'gae_1_id'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_ID = 'user_2_id'
    USER_C_GAE_ID = 'gae_2_id'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'
    USER_D_ID = 'user_3_id'
    USER_D_GAE_ID = 'gae_3_id'
    USER_D_EMAIL = 'd@example.com'
    USER_D_USERNAME = 'd'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_id_migration.UserIdMigrationJob.create_new()
        user_id_migration.UserIdMigrationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.UserIdMigrationJob.get_output(job_id))
        return [ast.literal_eval(item) for item in stringified_output]

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(UserIdMigrationJobTests, self).setUp()

        user_models.UserSettingsModel(
            id=self.USER_A_ID,
            gae_id=self.USER_A_GAE_ID,
            email=self.USER_A_EMAIL,
        ).put()

    def test_one_user_two_models_full_id(self):
        original_model_1 = user_models.CompletedActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2'])
        original_model_1.put()
        original_model_2 = user_models.UserStatsModel(
            id=self.USER_A_GAE_ID,
            impact_score=1,
            average_ratings=1.1)
        original_model_2.put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 10]])

        migrated_model_1 = (
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_ID))
        self.assertNotEqual(original_model_1.id, migrated_model_1.id)
        self.assertEqual(
            original_model_1.exploration_ids, migrated_model_1.exploration_ids)
        self.assertEqual(
            original_model_1.collection_ids, migrated_model_1.collection_ids)
        self.assertEqual(
            original_model_1.created_on, migrated_model_1.created_on)
        self.assertEqual(
            original_model_1.last_updated, migrated_model_1.last_updated)
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_GAE_ID))

        migrated_model_2 = (
            user_models.UserStatsModel.get_by_id(self.USER_A_ID))
        self.assertNotEqual(original_model_2.id, migrated_model_2.id)
        self.assertEqual(
            original_model_2.impact_score, migrated_model_2.impact_score)
        self.assertEqual(
            original_model_2.average_ratings, migrated_model_2.average_ratings)
        self.assertEqual(
            original_model_2.created_on, migrated_model_2.created_on)
        self.assertEqual(
            original_model_2.last_updated, migrated_model_2.last_updated)
        self.assertIsNone(
            user_models.UserStatsModel.get_by_id(self.USER_A_GAE_ID))

    def test_multiple_users_one_model_full_id(self):
        user_models.UserSettingsModel(
            id=self.USER_B_ID,
            gae_id=self.USER_B_GAE_ID,
            email=self.USER_B_EMAIL,
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_C_ID,
            gae_id=self.USER_C_GAE_ID,
            email=self.USER_C_EMAIL,
        ).put()

        original_models = []
        original_models.append(user_models.CompletedActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['11', '22']))
        original_models[-1].put()
        original_models.append(user_models.CompletedActivitiesModel(
            id=self.USER_B_GAE_ID,
            exploration_ids=['3', '4'],
            collection_ids=['33', '44']))
        original_models[-1].put()
        original_models.append(user_models.CompletedActivitiesModel(
            id=self.USER_C_GAE_ID,
            exploration_ids=['5', '6'],
            collection_ids=['55', '66']))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.id)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 3], ['SUCCESS_MISSING_OLD_MODEL', 33]])
        for i, user_id in enumerate(
                (self.USER_A_ID, self.USER_B_ID, self.USER_C_ID)):
            migrated_model = (
                user_models.CompletedActivitiesModel.get_by_id(user_id))
            self.assertNotEqual(
                original_models[i].id, migrated_model.id)
            self.assertEqual(
                original_models[i].exploration_ids,
                migrated_model.exploration_ids)
            self.assertEqual(
                original_models[i].collection_ids,
                migrated_model.collection_ids)
            self.assertEqual(
                original_models[i].created_on, migrated_model.created_on)
            self.assertEqual(
                original_models[i].last_updated, migrated_model.last_updated)

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_GAE_ID))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_B_GAE_ID))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_C_GAE_ID))

    def test_one_user_one_model_part_id(self):
        original_model = user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_A_GAE_ID, 'exp_id'),
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start')
        original_model.put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        migrated_model = (
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                '%s.%s' % (self.USER_A_ID, 'exp_id')))
        self.assertNotEqual(
            original_model.id, migrated_model.id)
        self.assertNotEqual(
            original_model.user_id, migrated_model.user_id)
        self.assertEqual(
            original_model.exploration_id, migrated_model.exploration_id)
        self.assertEqual(
            original_model.last_played_exp_version,
            migrated_model.last_played_exp_version)
        self.assertEqual(
            original_model.last_played_state_name,
            migrated_model.last_played_state_name)
        self.assertEqual(
            original_model.created_on, migrated_model.created_on)
        self.assertEqual(
            original_model.last_updated, migrated_model.last_updated)

        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                '%s.%s' % (self.USER_A_GAE_ID, 'exp_id')))

    def test_one_user_different_one_model_part_id(self):
        original_model = user_models.UserContributionScoringModel(
            id='%s.%s' % ('category', self.USER_A_GAE_ID),
            user_id=self.USER_A_GAE_ID,
            score_category='category',
            score=1.5,
            has_email_been_sent=False
        )
        original_model.put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        migrated_model = (
            user_models.UserContributionScoringModel.get_by_id(
                '%s.%s' % ('category', self.USER_A_ID)))
        self.assertNotEqual(
            original_model.id, migrated_model.id)
        self.assertNotEqual(
            original_model.user_id, migrated_model.user_id)
        self.assertEqual(
            original_model.score_category, migrated_model.score_category)
        self.assertEqual(original_model.score, migrated_model.score)
        self.assertEqual(
            original_model.has_email_been_sent,
            migrated_model.has_email_been_sent)
        self.assertEqual(original_model.created_on, migrated_model.created_on)
        self.assertEqual(
            original_model.last_updated, migrated_model.last_updated)

        self.assertIsNone(user_models.UserContributionScoringModel.get_by_id(
            '%s.%s' % ('category', self.USER_A_GAE_ID)))

    def test_multiple_users_one_model_part_id(self):
        user_models.UserSettingsModel(
            id=self.USER_B_ID,
            gae_id=self.USER_B_GAE_ID,
            email=self.USER_B_EMAIL,
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_C_ID,
            gae_id=self.USER_C_GAE_ID,
            email=self.USER_C_EMAIL,
        ).put()

        original_models = []
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_A_GAE_ID, 'exp_id'),
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_B_GAE_ID, 'exp_id'),
            user_id=self.USER_B_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=3,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_C_GAE_ID, 'exp_id'),
            user_id=self.USER_C_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=4,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.user_id)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 3], ['SUCCESS_MISSING_OLD_MODEL', 36]])

        for i, user_id in enumerate(
                (self.USER_A_ID, self.USER_B_ID, self.USER_C_ID)):
            migrated_model = (
                user_models.ExpUserLastPlaythroughModel.get_by_id(
                    '%s.%s' % (user_id, 'exp_id')))
            self.assertNotEqual(
                original_models[i].id, migrated_model.id)
            self.assertNotEqual(
                original_models[i].user_id, migrated_model.user_id)
            self.assertEqual(
                original_models[i].exploration_id,
                migrated_model.exploration_id)
            self.assertEqual(
                original_models[i].last_played_exp_version,
                migrated_model.last_played_exp_version)
            self.assertEqual(
                original_models[i].last_played_state_name,
                migrated_model.last_played_state_name)
            self.assertEqual(
                original_models[i].created_on, migrated_model.created_on)
            self.assertEqual(
                original_models[i].last_updated, migrated_model.last_updated)

            self.assertIsNone(
                user_models.CompletedActivitiesModel.get_by_id(
                    self.USER_A_GAE_ID))
            self.assertIsNone(
                user_models.CompletedActivitiesModel.get_by_id(
                    self.USER_B_GAE_ID))
            self.assertIsNone(
                user_models.CompletedActivitiesModel.get_by_id(
                    self.USER_C_GAE_ID))

    def test_multiple_users_different_one_model_part_id(self):
        user_models.UserSettingsModel(
            id=self.USER_B_ID,
            gae_id=self.USER_B_GAE_ID,
            email=self.USER_B_EMAIL,
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_C_ID,
            gae_id=self.USER_C_GAE_ID,
            email=self.USER_C_EMAIL,
        ).put()

        original_models = []
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.USER_A_GAE_ID),
            user_id=self.USER_A_GAE_ID,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.USER_B_GAE_ID),
            user_id=self.USER_B_GAE_ID,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.USER_C_GAE_ID),
            user_id=self.USER_C_GAE_ID,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.user_id)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 3], ['SUCCESS_MISSING_OLD_MODEL', 36]])

        for i, user_id in enumerate(
                (self.USER_A_ID, self.USER_B_ID, self.USER_C_ID)):
            migrated_model = (
                user_models.UserContributionScoringModel.get_by_id(
                    '%s.%s' % ('score_category', user_id)))
            self.assertNotEqual(
                original_models[i].id, migrated_model.id)
            self.assertNotEqual(
                original_models[i].user_id, migrated_model.user_id)
            self.assertEqual(
                original_models[i].score_category,
                migrated_model.score_category)
            self.assertEqual(original_models[i].score, migrated_model.score)
            self.assertEqual(
                original_models[i].has_email_been_sent,
                migrated_model.has_email_been_sent)
            self.assertEqual(
                original_models[i].created_on, migrated_model.created_on)
            self.assertEqual(
                original_models[i].last_updated, migrated_model.last_updated)

        self.assertIsNone(user_models.UserContributionScoringModel.get_by_id(
            '%s.%s' % ('score_category', self.USER_A_GAE_ID)))
        self.assertIsNone(user_models.UserContributionScoringModel.get_by_id(
            '%s.%s' % ('score_category', self.USER_B_GAE_ID)))
        self.assertIsNone(user_models.UserContributionScoringModel.get_by_id(
            '%s.%s' % ('score_category', self.USER_C_GAE_ID)))

    def test_one_user_one_model_user_id_field(self):
        original_model = exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}])
        original_model.put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        migrated_model = (
            exp_models.ExplorationSnapshotMetadataModel.query(
                exp_models.ExplorationSnapshotMetadataModel.committer_id ==
                self.USER_A_ID
            ).get())

        self.assertNotEqual(
            original_model.committer_id, migrated_model.committer_id)
        self.assertEqual(original_model.id, migrated_model.id)
        self.assertEqual(
            original_model.commit_type, migrated_model.commit_type)
        self.assertEqual(
            original_model.commit_message, migrated_model.commit_message)
        self.assertEqual(
            original_model.commit_cmds, migrated_model.commit_cmds)
        self.assertEqual(
            original_model.created_on, migrated_model.created_on)
        self.assertEqual(
            original_model.last_updated, migrated_model.last_updated)

    def test_multiple_users_one_model_user_id_field(self):
        user_models.UserSettingsModel(
            id=self.USER_B_ID,
            gae_id=self.USER_B_GAE_ID,
            email=self.USER_B_EMAIL,
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_C_ID,
            gae_id=self.USER_C_GAE_ID,
            email=self.USER_C_EMAIL,
        ).put()

        original_models = []
        original_models.append(exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id1',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.append(exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id2',
            committer_id=self.USER_B_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.append(exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id3',
            committer_id=self.USER_C_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.committer_id)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 3], ['SUCCESS_MISSING_OLD_MODEL', 36]])

        for i, user_id in enumerate(
                (self.USER_A_ID, self.USER_B_ID, self.USER_C_ID)):
            migrated_model = (
                exp_models.ExplorationSnapshotMetadataModel.query(
                    exp_models.ExplorationSnapshotMetadataModel.committer_id ==
                    user_id
                ).get())

            self.assertNotEqual(
                original_models[i].committer_id, migrated_model.committer_id)
            self.assertEqual(original_models[i].id, migrated_model.id)
            self.assertEqual(
                original_models[i].commit_type, migrated_model.commit_type)
            self.assertEqual(
                original_models[i].commit_message,
                migrated_model.commit_message)
            self.assertEqual(
                original_models[i].commit_cmds, migrated_model.commit_cmds)
            self.assertEqual(
                original_models[i].created_on, migrated_model.created_on)
            self.assertEqual(
                original_models[i].last_updated, migrated_model.last_updated)

    def test_idempotent_copy_model_with_new_id_not_migrated(self):
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        user_models.IncompleteActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()
        user_models.CompletedActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 10]])

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_GAE_ID))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_A_GAE_ID))
        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_ID))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_A_ID))

    def test_idempotent_copy_model_with_new_id_half_migrated(self):
        user_models.IncompleteActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 11]])

        user_models.CompletedActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [
                ['SUCCESS', 1],
                ['SUCCESS_ALREADY_MIGRATED', 1],
                ['SUCCESS_MISSING_OLD_MODEL', 10]
            ])

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_GAE_ID))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_A_GAE_ID))
        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_ID))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_A_ID))

    def test_idempotent_copy_model_with_new_id_all_migrated(self):
        user_models.IncompleteActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()
        user_models.CompletedActivitiesModel(
            id=self.USER_A_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 10]])

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [
                ['SUCCESS', 1],
                ['SUCCESS_ALREADY_MIGRATED', 2],
                ['SUCCESS_MISSING_OLD_MODEL', 10]
            ])

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_GAE_ID))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_A_GAE_ID))
        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_A_ID))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_A_ID))

    def test_idempotent_copy_model_with_new_id_and_user_id_not_migrated(self):
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        exp_play_model_id_1 = '%s.%s' % (self.USER_A_GAE_ID, 'exp_1_id')
        user_models.ExpUserLastPlaythroughModel(
            id=exp_play_model_id_1,
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'
        ).put()
        exp_play_model_id_2 = '%s.%s' % (self.USER_A_GAE_ID, 'exp_2_id')
        user_models.ExpUserLastPlaythroughModel(
            id=exp_play_model_id_2,
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_1))
        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_2))
        self.assertIsNotNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_1.replace(
                    self.USER_A_GAE_ID, self.USER_A_ID)))
        self.assertIsNotNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_2.replace(
                    self.USER_A_GAE_ID, self.USER_A_ID)))

    def test_idempotent_copy_model_with_new_id_and_user_id_half_migrated(self):
        exp_play_model_id_1 = '%s.%s' % (self.USER_A_GAE_ID, 'exp_1_id')
        user_models.ExpUserLastPlaythroughModel(
            id=exp_play_model_id_1,
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        exp_play_model_id_2 = '%s.%s' % (self.USER_A_GAE_ID, 'exp_2_id')
        user_models.ExpUserLastPlaythroughModel(
            id=exp_play_model_id_2,
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_1))
        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_2))
        self.assertIsNotNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_1.replace(
                    self.USER_A_GAE_ID, self.USER_A_ID)))
        self.assertIsNotNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_2.replace(
                    self.USER_A_GAE_ID, self.USER_A_ID)))

    def test_idempotent_copy_model_with_new_id_and_user_id_all_migrated(self):
        exp_play_model_id_1 = '%s.%s' % (self.USER_A_GAE_ID, 'exp_1_id')
        user_models.ExpUserLastPlaythroughModel(
            id=exp_play_model_id_1,
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'
        ).put()
        exp_play_model_id_2 = '%s.%s' % (self.USER_A_GAE_ID, 'exp_2_id')
        user_models.ExpUserLastPlaythroughModel(
            id=exp_play_model_id_2,
            user_id=self.USER_A_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_1))
        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_2))
        self.assertIsNotNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_1.replace(
                    self.USER_A_GAE_ID, self.USER_A_ID)))
        self.assertIsNotNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                exp_play_model_id_2.replace(
                    self.USER_A_GAE_ID, self.USER_A_ID)))

    def test_idempotent_change_model_with_one_user_id_field_not_migrated(self):
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        exp_models.ExplorationSnapshotMetadataModel(
            id='instance_1_id',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]
        ).put()
        exp_models.ExplorationSnapshotMetadataModel(
            id='instance_2_id',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        self.assertEqual(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                'instance_1_id').committer_id, self.USER_A_ID)
        self.assertEqual(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                'instance_2_id').committer_id, self.USER_A_ID)

    def test_idempotent_change_model_with_one_user_id_field_half_migrated(self):
        exp_models.ExplorationSnapshotMetadataModel(
            id='instance_1_id',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        exp_models.ExplorationSnapshotMetadataModel(
            id='instance_2_id',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        self.assertEqual(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                'instance_1_id').committer_id, self.USER_A_ID)
        self.assertEqual(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                'instance_2_id').committer_id, self.USER_A_ID)

    def test_idempotent_change_model_with_one_user_id_field_all_migrated(self):
        exp_models.ExplorationSnapshotMetadataModel(
            id='instance_1_id',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]
        ).put()
        exp_models.ExplorationSnapshotMetadataModel(
            id='instance_2_id',
            committer_id=self.USER_A_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS', 1], ['SUCCESS_MISSING_OLD_MODEL', 12]])

        self.assertEqual(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                'instance_1_id').committer_id, self.USER_A_ID)
        self.assertEqual(
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                'instance_2_id').committer_id, self.USER_A_ID)


class SnapshotsContentUserIdMigrationJobTests(test_utils.GenericTestBase):
    """Tests for SnapshotsUserIdMigrationJobTests."""
    SNAPSHOT_ID = '2'
    USER_1_USER_ID = 'uid_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    USER_1_GAE_ID = 'gae_id_1'
    USER_2_USER_ID = 'uid_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    USER_2_GAE_ID = 'gae_id_2'
    USER_3_USER_ID = 'uid_cccccccccccccccccccccccccccccccc'
    USER_3_GAE_ID = 'gae_id_3'
    WRONG_GAE_ID = 'wrong_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_id_migration.SnapshotsContentUserIdMigrationJob.create_new())
        user_id_migration.SnapshotsContentUserIdMigrationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.SnapshotsContentUserIdMigrationJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(SnapshotsContentUserIdMigrationJobTests, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_1_USER_ID,
            gae_id=self.USER_1_GAE_ID,
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_2_USER_ID,
            gae_id=self.USER_2_GAE_ID,
            email='some.different@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_3_USER_ID,
            gae_id=self.USER_3_GAE_ID,
            email='some.different@email.cz',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()

    def test_migrate_collection_rights_snapshot_model(self):
        original_rights_model = collection_models.CollectionRightsModel(
            id=self.SNAPSHOT_ID,
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        original_rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertEqual(
            output[0], [u'SUCCESS - CollectionRightsSnapshotContentModel', 1])

        migrated_rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                self.SNAPSHOT_ID))
        self.assertEqual(
            original_rights_snapshot_model.last_updated,
            migrated_rights_snapshot_model.last_updated)

        migrated_rights_model = collection_models.CollectionRightsModel(
            **migrated_rights_snapshot_model.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model.viewer_ids)

    def test_migrate_collection_rights_snapshot_model_wrong_id(self):
        original_rights_model = collection_models.CollectionRightsModel(
            id=self.SNAPSHOT_ID,
            owner_ids=[self.WRONG_GAE_ID],
            editor_ids=[self.WRONG_GAE_ID],
            voice_artist_ids=[self.WRONG_GAE_ID],
            viewer_ids=[self.WRONG_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        original_rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertIn(
            ['FAILURE - CollectionRightsSnapshotContentModel',
             [self.WRONG_GAE_ID]],
            output)

    def test_migrate_exp_rights_snapshot_model(self):
        original_rights_model = exp_models.ExplorationRightsModel(
            id=self.SNAPSHOT_ID,
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        original_rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertEqual(
            output[0],
            [u'SUCCESS - ExplorationRightsSnapshotContentModel', 1])

        migrated_rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                self.SNAPSHOT_ID))
        self.assertEqual(
            original_rights_snapshot_model.last_updated,
            migrated_rights_snapshot_model.last_updated)

        migrated_rights_model = exp_models.ExplorationRightsModel(
            **migrated_rights_snapshot_model.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model.viewer_ids)

    def test_migrate_exp_rights_snapshot_model_wrong_id(self):
        original_rights_model = exp_models.ExplorationRightsModel(
            id=self.SNAPSHOT_ID,
            owner_ids=[self.WRONG_GAE_ID],
            editor_ids=[self.WRONG_GAE_ID],
            voice_artist_ids=[self.WRONG_GAE_ID],
            viewer_ids=[self.WRONG_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        original_rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertIn(
            ['FAILURE - ExplorationRightsSnapshotContentModel',
             [self.WRONG_GAE_ID]],
            output)

    def test_migrate_exp_rights_snapshot_model_admin(self):
        original_rights_model = exp_models.ExplorationRightsModel(
            id=self.SNAPSHOT_ID,
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        original_rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.content['all_viewer_ids'] = ['id1']
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertEqual(
            output[0],
            [u'SUCCESS - ExplorationRightsSnapshotContentModel', 1])

        migrated_rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                self.SNAPSHOT_ID))
        self.assertEqual(
            original_rights_snapshot_model.last_updated,
            migrated_rights_snapshot_model.last_updated)

        self.assertNotIn(
            'all_viewer_ids', migrated_rights_snapshot_model.content)

        migrated_rights_model = exp_models.ExplorationRightsModel(
            **migrated_rights_snapshot_model.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model.viewer_ids)

    def test_migrate_exp_rights_snapshot_model_migration_bot(self):
        original_rights_model = exp_models.ExplorationRightsModel(
            id=self.SNAPSHOT_ID,
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.MIGRATION_BOT_USER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        original_rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.content['all_viewer_ids'] = ['id1']
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertEqual(
            output[0],
            [u'SUCCESS - ExplorationRightsSnapshotContentModel', 1])

        migrated_rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                self.SNAPSHOT_ID))
        self.assertEqual(
            original_rights_snapshot_model.last_updated,
            migrated_rights_snapshot_model.last_updated)

        self.assertNotIn(
            'all_viewer_ids', migrated_rights_snapshot_model.content)

        migrated_rights_model = exp_models.ExplorationRightsModel(
            **migrated_rights_snapshot_model.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.MIGRATION_BOT_USER_ID],
            migrated_rights_model.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model.viewer_ids)

    def test_migrate_topic_rights_snapshot_model(self):
        original_rights_model = topic_models.TopicRightsModel(
            manager_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID,
                         feconf.SYSTEM_COMMITTER_ID])
        original_rights_snapshot_model = (
            topic_models.TopicRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertEqual(
            output[0], [u'SUCCESS - TopicRightsSnapshotContentModel', 1])

        migrated_rights_snapshot_model = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                self.SNAPSHOT_ID))
        self.assertEqual(
            original_rights_snapshot_model.last_updated,
            migrated_rights_snapshot_model.last_updated)

        migrated_rights_model = topic_models.TopicRightsModel(
            **migrated_rights_snapshot_model.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID,
             feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model.manager_ids)

    def test_migrate_topic_rights_snapshot_model_wrong_id(self):
        original_rights_model = topic_models.TopicRightsModel(
            manager_ids=[self.WRONG_GAE_ID])
        original_rights_snapshot_model = (
            topic_models.TopicRightsSnapshotContentModel(
                id=self.SNAPSHOT_ID,
                content=original_rights_model.to_dict()))
        original_rights_snapshot_model.put()

        output = self._run_one_off_job()
        self.assertIn(
            ['FAILURE - TopicRightsSnapshotContentModel',
             [self.WRONG_GAE_ID]],
            output)

    def test_idempotent_change_model_not_migrated(self):
        original_rights_model_1 = collection_models.CollectionRightsModel(
            id='instance_1_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_1_id',
            content=original_rights_model_1.to_dict()).put()
        original_rights_model_2 = collection_models.CollectionRightsModel(
            id='instance_2_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_2_id',
            content=original_rights_model_2.to_dict()).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotContentModel', 2]])

        original_rights_model_1 = collection_models.CollectionRightsModel(
            id='instance_1_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_1_id',
            content=original_rights_model_1.to_dict()).put()
        original_rights_model_2 = collection_models.CollectionRightsModel(
            id='instance_2_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_2_id',
            content=original_rights_model_2.to_dict()).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotContentModel', 2]])

        migrated_rights_snapshot_model_1 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                'instance_1_id'))
        migrated_rights_model_1 = collection_models.CollectionRightsModel(
            **migrated_rights_snapshot_model_1.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_1.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model_1.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_1.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model_1.viewer_ids)

        migrated_rights_snapshot_model_2 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                'instance_2_id'))
        migrated_rights_model_2 = collection_models.CollectionRightsModel(
            **migrated_rights_snapshot_model_2.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_2.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model_2.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_2.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model_2.viewer_ids)

    def test_idempotent_change_model_half_migrated(self):
        original_rights_model_1 = collection_models.CollectionRightsModel(
            id='instance_1_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_1_id',
            content=original_rights_model_1.to_dict()).put()
        original_rights_model_2 = collection_models.CollectionRightsModel(
            id='instance_2_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_2_id',
            content=original_rights_model_2.to_dict()).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotContentModel', 2]])

        original_rights_model_2 = collection_models.CollectionRightsModel(
            id='instance_2_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_2_id',
            content=original_rights_model_2.to_dict()).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [['SUCCESS - CollectionRightsSnapshotContentModel', 1],
             ['SUCCESS_ALREADY_MIGRATED - CollectionRightsSnapshotContentModel',
              1]])

        migrated_rights_snapshot_model_1 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                'instance_1_id'))
        migrated_rights_model_1 = collection_models.CollectionRightsModel(
            **migrated_rights_snapshot_model_1.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_1.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model_1.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_1.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model_1.viewer_ids)

        migrated_rights_snapshot_model_2 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                'instance_2_id'))
        migrated_rights_model_2 = collection_models.CollectionRightsModel(
            **migrated_rights_snapshot_model_2.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_2.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model_2.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_2.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model_2.viewer_ids)

    def test_idempotent_change_model_all_migrated(self):
        original_rights_model_1 = collection_models.CollectionRightsModel(
            id='instance_1_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_1_id',
            content=original_rights_model_1.to_dict()).put()
        original_rights_model_2 = collection_models.CollectionRightsModel(
            id='instance_2_id',
            owner_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            editor_ids=[self.USER_1_GAE_ID, feconf.SYSTEM_COMMITTER_ID],
            voice_artist_ids=[self.USER_1_GAE_ID, self.USER_2_GAE_ID],
            viewer_ids=[self.USER_1_GAE_ID, self.USER_3_GAE_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        collection_models.CollectionRightsSnapshotContentModel(
            id='instance_2_id',
            content=original_rights_model_2.to_dict()).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotContentModel', 2]])

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [['SUCCESS_ALREADY_MIGRATED - CollectionRightsSnapshotContentModel',
              2]])

        migrated_rights_snapshot_model_1 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                'instance_1_id'))
        migrated_rights_model_1 = collection_models.CollectionRightsModel(
            **migrated_rights_snapshot_model_1.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_1.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model_1.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_1.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model_1.viewer_ids)

        migrated_rights_snapshot_model_2 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                'instance_2_id'))
        migrated_rights_model_2 = collection_models.CollectionRightsModel(
            **migrated_rights_snapshot_model_2.content)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_2.owner_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, feconf.SYSTEM_COMMITTER_ID],
            migrated_rights_model_2.editor_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_2_USER_ID],
            migrated_rights_model_2.voice_artist_ids)
        self.assertEqual(
            [self.USER_1_USER_ID, self.USER_3_USER_ID],
            migrated_rights_model_2.viewer_ids)


class SnapshotsMetadataUserIdMigrationJobTests(test_utils.GenericTestBase):
    """Tests for SnapshotsUserIdMigrationJobTests."""
    USER_1_USER_ID = 'uid_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    USER_1_GAE_ID = 'gae_id_1'
    WRONG_GAE_ID = 'wrong_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_id_migration.SnapshotsMetadataUserIdMigrationJob.create_new())
        user_id_migration.SnapshotsMetadataUserIdMigrationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.SnapshotsMetadataUserIdMigrationJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(SnapshotsMetadataUserIdMigrationJobTests, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_1_USER_ID,
            gae_id=self.USER_1_GAE_ID,
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()

    def test_migrate_collection_rights_snapshot_model(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS - CollectionRightsSnapshotMetadataModel', 1]])

        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

    def test_migrate_collection_rights_snapshot_model_admin_id(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': feconf.SYSTEM_COMMITTER_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': feconf.SYSTEM_COMMITTER_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS - CollectionRightsSnapshotMetadataModel', 1]])

        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            feconf.SYSTEM_COMMITTER_ID)

        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            feconf.SYSTEM_COMMITTER_ID)

    def test_migrate_collection_rights_snapshot_model_bot_id(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': feconf.MIGRATION_BOT_USER_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': feconf.MIGRATION_BOT_USER_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS - CollectionRightsSnapshotMetadataModel', 1]])

        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            feconf.MIGRATION_BOT_USER_ID)

        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            feconf.MIGRATION_BOT_USER_ID)

    def test_migrate_collection_rights_snapshot_model_missing_commit(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [
                ['SUCCESS_MISSING_COMMIT - '
                 'CollectionRightsSnapshotMetadataModel',
                 ['col_1_id-1']]])

        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

    def test_migrate_collection_rights_snapshot_model_wrong_id(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.WRONG_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.WRONG_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [['FAILURE - CollectionRightsSnapshotMetadataModel',
              [self.WRONG_GAE_ID]]])

    def test_migrate_exploration_rights_snapshot_model(self):
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='exp_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        exp_models.ExplorationCommitLogEntryModel(
            id='rights-exp_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            exploration_id='exp_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS - ExplorationRightsSnapshotMetadataModel', 1]])

        rights_snapshot_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                'exp_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

        rights_commit_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'rights-exp_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

    def test_migrate_topic_rights_snapshot_model_change_role(self):
        topic_models.TopicRightsSnapshotMetadataModel(
            id='top_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': topic_domain.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        topic_models.TopicCommitLogEntryModel(
            id='rights-top_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            topic_id='top_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': topic_domain.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS - TopicRightsSnapshotMetadataModel', 1]])

        rights_snapshot_model = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                'top_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

        rights_commit_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-top_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

    def test_migrate_topic_rights_snapshot_model_remove_manager_role(self):
        topic_models.TopicRightsSnapshotMetadataModel(
            id='top_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                'removed_user_id': self.USER_1_GAE_ID}]
        ).put()
        topic_models.TopicCommitLogEntryModel(
            id='rights-top_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            topic_id='top_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                'removed_user_id': self.USER_1_GAE_ID}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS - TopicRightsSnapshotMetadataModel', 1]])

        rights_snapshot_model = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                'top_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['removed_user_id'],
            self.USER_1_USER_ID)

        rights_commit_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-top_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['removed_user_id'],
            self.USER_1_USER_ID)

    def test_migrate_topic_rights_snapshot_model_missing_commit(self):
        topic_models.TopicRightsSnapshotMetadataModel(
            id='top_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                'removed_user_id': self.USER_1_GAE_ID}]
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(
            output, [
                ['SUCCESS_MISSING_COMMIT - '
                 'TopicRightsSnapshotMetadataModel',
                 ['top_1_id-1']]])

        rights_snapshot_model = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                'top_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['removed_user_id'],
            self.USER_1_USER_ID)

    def test_idempotent_change_model_not_migrated(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_2_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_2_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotMetadataModel', 2]])

        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_2_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_2_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotMetadataModel', 2]])

        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_2_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_2_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

    def test_idempotent_change_model_half_migrated(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_2_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_2_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotMetadataModel', 2]])

        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [['SUCCESS - CollectionRightsSnapshotMetadataModel', 1],
             ['SUCCESS_ALREADY_MIGRATED - '
              'CollectionRightsSnapshotMetadataModel', 1]])

        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_2_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_2_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)

    def test_idempotent_change_model_all_migrated(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_1_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_1_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='col_2_id-1',
            committer_id=self.USER_1_GAE_ID,
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}]
        ).put()
        collection_models.CollectionCommitLogEntryModel(
            id='rights-col_2_id-1',
            user_id=self.USER_1_GAE_ID,
            username='user',
            collection_id='col_1_id',
            commit_type='edit',
            commit_message='commit message 2',
            commit_cmds=[{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_1_GAE_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR}],
            version=1,
            post_commit_status='public'
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output, [['SUCCESS - CollectionRightsSnapshotMetadataModel', 2]])


        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [['SUCCESS_ALREADY_MIGRATED - '
              'CollectionRightsSnapshotMetadataModel', 2]])

        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_1_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_1_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_snapshot_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                'col_2_id-1'))
        self.assertEqual(
            rights_snapshot_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)
        rights_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-col_2_id-1'))
        self.assertEqual(
            rights_commit_model.commit_cmds[0]['assignee_id'],
            self.USER_1_USER_ID)


class GaeIdNotInModelsVerificationJobTests(test_utils.GenericTestBase):
    """Tests for GaeIdNotInModelsVerificationJob."""
    USER_1_USER_ID = 'uid_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    USER_1_GAE_ID = 'gae_id_1'
    USER_2_USER_ID = 'uid_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    USER_2_GAE_ID = 'gae_id_2'
    USER_3_USER_ID = 'uid_cccccccccccccccccccccccccccccccc'
    USER_3_GAE_ID = 'gae_id_3'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_id_migration.GaeIdNotInModelsVerificationJob.create_new()
        user_id_migration.GaeIdNotInModelsVerificationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.GaeIdNotInModelsVerificationJob.get_output(
                job_id))
        eval_output = []
        for stringified_item in stringified_output:
            items = ast.literal_eval(stringified_item)
            if isinstance(items[1], int):
                eval_output.append([items[0], items[1]])
            else:
                user_ids = [ast.literal_eval(item) for item in items[1]]
                eval_output.append([items[0], user_ids])
        return eval_output

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(GaeIdNotInModelsVerificationJobTests, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_1_USER_ID,
            gae_id=self.USER_1_GAE_ID,
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_2_USER_ID,
            gae_id=self.USER_2_GAE_ID,
            email='some.different@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_3_USER_ID,
            gae_id=self.USER_3_GAE_ID,
            email='some.different@email.cz',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()

    def test_wrong_user_ids(self):
        user_models.UserSettingsModel(
            id='aa',
            gae_id=self.USER_1_GAE_ID,
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            gae_id=self.USER_2_GAE_ID,
            email='some.different@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()

        output = self._run_one_off_job()
        output = [
            key[1] for key in output if key[0] == 'FAILURE - WRONG ID FORMAT'
        ][0]
        self.assertEqual(len(output), 2)
        self.assertIn(('gae_id_1', 'aa'), output)
        self.assertIn(('gae_id_2', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'), output)

    def test_failure(self):
        user_models.CompletedActivitiesModel(
            id=self.USER_1_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()
        user_models.CompletedActivitiesModel(
            id=self.USER_2_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']
        ).put()
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_3_GAE_ID, 'exp_id'),
            user_id=self.USER_3_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'
        ).put()

        # Model with DELETION_POLICY equal to NOT_APPLICABLE.
        activity_models.ActivityReferencesModel(id='some_id').put()

        output = self._run_one_off_job()
        self.assertNotIn('SUCCESS', [key[0] for key in output])
        output = [
            key[1] for key in output
            if key[0] == 'FAILURE - HAS REFERENCE TO GAE ID'][0]
        self.assertEqual(len(output), 3)
        self.assertIn((self.USER_1_GAE_ID, 'CompletedActivitiesModel'), output)
        self.assertIn((self.USER_2_GAE_ID, 'CompletedActivitiesModel'), output)
        self.assertIn(
            (self.USER_3_GAE_ID, 'ExpUserLastPlaythroughModel'), output)

    def test_success(self):
        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 3]])


class BaseModelsUserIdsHaveUserSettingsVerificationJobTests(
        test_utils.GenericTestBase):

    def test_entity_classes_to_map_over(self):
        with self.assertRaises(NotImplementedError):
            (user_id_migration.BaseModelsUserIdsHaveUserSettingsVerificationJob
             .entity_classes_to_map_over())


class MockGeneralFeedbackThreadUserModel(
        feedback_models.GeneralFeedbackThreadUserModel):
    """Mock GeneralFeedbackThreadUserModel so that it allows empty user_id."""

    user_id = ndb.StringProperty(required=False, indexed=True)


class ModelsUserIdsHaveUserSettingsVerificationJobTests(
        test_utils.GenericTestBase):
    """Tests for ModelsUserIdsHaveUserSettingsVerificationJob."""
    USER_1_USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    USER_1_GAE_ID = 'gae_id_1'
    USER_2_USER_ID = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    USER_2_GAE_ID = 'gae_id_2'
    USER_3_USER_ID = 'cccccccccccccccccccccccccccccccc'
    USER_3_GAE_ID = 'gae_id_3'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_id_migration.ModelsUserIdsHaveUserSettingsVerificationJob
            .create_new())
        (user_id_migration.ModelsUserIdsHaveUserSettingsVerificationJob
         .enqueue(job_id))
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.ModelsUserIdsHaveUserSettingsVerificationJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(
                ModelsUserIdsHaveUserSettingsVerificationJobTests, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_1_USER_ID,
            gae_id=self.USER_1_GAE_ID,
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_2_USER_ID,
            gae_id=self.USER_2_GAE_ID,
            email='some.different@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_3_USER_ID,
            gae_id=self.USER_3_GAE_ID,
            email='some.different@email.cz',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()

    def test_one_user_one_model_full_id(self):
        user_models.CompletedActivitiesModel(
            id=self.USER_1_GAE_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']).put()
        user_models.CompletedActivitiesModel(
            id=feconf.MIGRATION_BOT_USER_ID,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2']).put()
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_2_GAE_ID, 'exp_id'),
            user_id=self.USER_2_GAE_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start').put()
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (feconf.SYSTEM_COMMITTER_ID, 'exp_id'),
            user_id=feconf.SYSTEM_COMMITTER_ID,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start').put()
        user_models.UserContributionScoringModel(
            id='%s.%s' % ('category', self.USER_2_GAE_ID),
            user_id=self.USER_2_USER_ID,
            score_category='category',
            score=1.5,
            has_email_been_sent=False).put()
        feedback_models.GeneralFeedbackMessageModel(
            id='type.id.generated',
            thread_id='thread_id',
            message_id=2).put()
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id='topic_1_id',
                manager_ids=[self.USER_1_GAE_ID])])
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id='topic_2_id',
                manager_ids=[feconf.SYSTEM_COMMITTER_ID])])

        with self.swap(
            feedback_models, 'GeneralFeedbackThreadUserModel',
            MockGeneralFeedbackThreadUserModel
        ):
            feedback_models.GeneralFeedbackThreadUserModel(
                id='%s.thread_id' % self.USER_1_USER_ID,
                user_id=self.USER_1_USER_ID,
                thread_id='thread_id').put()
            feedback_models.GeneralFeedbackThreadUserModel(
                id='%s.thread_id' % None,
                user_id=None,
                thread_id='thread_id').put()

            output = self._run_one_off_job()

        self.assertItemsEqual([
            ['SUCCESS - UserSettingsModel', 3],
            ['FAILURE - CompletedActivitiesModel', [self.USER_1_GAE_ID]],
            ['SUCCESS - CompletedActivitiesModel', 1],
            ['FAILURE - ExpUserLastPlaythroughModel',
             ['%s.%s' % (self.USER_2_GAE_ID, 'exp_id')]],
            ['SUCCESS - ExpUserLastPlaythroughModel', 1],
            ['FAILURE - UserContributionScoringModel',
             ['%s.%s' % ('category', self.USER_2_GAE_ID)]],
            ['SUCCESS_NONE - GeneralFeedbackMessageModel', 1],
            ['SUCCESS - MockGeneralFeedbackThreadUserModel', 1],
            ['FAILURE_NONE - MockGeneralFeedbackThreadUserModel',
             ['None.thread_id']],
            ['FAILURE - TopicRightsModel', ['topic_1_id']],
            ['SUCCESS - TopicRightsModel', 1],
        ], output)


class ModelsUserIdsHaveUserSettingsExplorationsVerificationJobTests(
        test_utils.GenericTestBase):
    """Tests for ModelsUserIdsHaveUserSettingsExplorationsVerificationJob."""
    USER_1_USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    USER_1_GAE_ID = 'gae_id_1'
    USER_1_USERNAME = 'username_1'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_id_migration
            .ModelsUserIdsHaveUserSettingsExplorationsVerificationJob
            .create_new())
        (user_id_migration
         .ModelsUserIdsHaveUserSettingsExplorationsVerificationJob
         .enqueue(job_id))
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration
            .ModelsUserIdsHaveUserSettingsExplorationsVerificationJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(
                ModelsUserIdsHaveUserSettingsExplorationsVerificationJobTests,
                self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_1_USER_ID,
            gae_id=self.USER_1_GAE_ID,
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()

    def test_one_user_one_model_full_id(self):

        exp_models.ExplorationCommitLogEntryModel(
            id='exp_1_id_1',
            user_id=self.USER_1_GAE_ID,
            username=self.USER_1_USERNAME,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='private',
            post_commit_community_owned=False,
            post_commit_is_private=True,
            version=2,
            exploration_id='exp_1_id').put()
        exp_models.ExplorationCommitLogEntryModel(
            id='exp_2_id_1',
            user_id=self.USER_1_USER_ID,
            username=self.USER_1_USERNAME,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='private',
            post_commit_community_owned=False,
            post_commit_is_private=True,
            version=2,
            exploration_id='exp_2_id').put()
        exp_models.ExplorationCommitLogEntryModel(
            id='exp_3_id_1',
            user_id=feconf.SYSTEM_COMMITTER_ID,
            username=feconf.SYSTEM_COMMITTER_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='private',
            post_commit_community_owned=False,
            post_commit_is_private=True,
            version=2,
            exploration_id='exp_3_id').put()
        exp_models.ExplorationSnapshotMetadataModel(
            id='exp_1_id',
            committer_id=self.USER_1_GAE_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()
        exp_models.ExplorationSnapshotMetadataModel(
            id='exp_2_id',
            committer_id=self.USER_1_USER_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()
        exp_models.ExplorationSnapshotMetadataModel(
            id='exp_3_id',
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()
        exp_models.ExplorationSnapshotMetadataModel(
            id='exp_4_id',
            committer_id=feconf.SUGGESTION_BOT_USER_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()


        output = self._run_one_off_job()
        self.assertIn(
            ['FAILURE - ExplorationCommitLogEntryModel', ['exp_1_id_1']],
            output)
        self.assertIn(
            ['SUCCESS - ExplorationCommitLogEntryModel', 2], output)
        self.assertIn(
            ['FAILURE - ExplorationSnapshotMetadataModel', ['exp_1_id']],
            output)
        self.assertIn(
            ['SUCCESS - ExplorationSnapshotMetadataModel', 3], output)


class AddAllUserIdsVerificationJobTests(test_utils.GenericTestBase):

    COL_1_ID = 'col_1_id'
    COL_2_ID = 'col_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    USER_4_ID = 'user_4_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_id_migration.AddAllUserIdsVerificationJob.create_new()
        user_id_migration.AddAllUserIdsVerificationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.AddAllUserIdsVerificationJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_one_collection_rights_subset(self):
        collection_models.CollectionRightsAllUsersModel(
            id=self.COL_1_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
        ).put()
        collection_models.CollectionRightsModel.put_multi([
            collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[self.USER_3_ID],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS-SUBSET-CollectionRightsModel', 1]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_1_ID).all_user_ids)

    def test_one_exploration_rights_subset(self):
        exp_models.ExplorationRightsAllUsersModel(
            id=self.EXP_1_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_4_ID]
        ).put()
        exp_models.ExplorationRightsModel.put_multi([
            exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[self.USER_4_ID],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS-SUBSET-ExplorationRightsModel', 1]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_4_ID],
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_1_ID)
            .all_user_ids)

    def test_one_topic_rights_subset(self):
        topic_models.TopicRightsAllUsersModel(
            id=self.TOP_1_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID]
        ).put()
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])])

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS-SUBSET-TopicRightsModel', 1]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_1_ID)
            .all_user_ids)

    def test_one_collection_rights_not_subset(self):
        collection_models.CollectionRightsAllUsersModel(
            id=self.COL_1_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_4_ID]
        ).put()
        collection_models.CollectionRightsModel.put_multi([
            collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[self.USER_3_ID],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])

        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [['SUCCESS-NOT_SUBSET-CollectionRightsModel', 1]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_1_ID).all_user_ids)

    def test_one_exploration_rights_not_subset(self):
        exp_models.ExplorationRightsAllUsersModel(
            id=self.EXP_1_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
        ).put()
        exp_models.ExplorationRightsModel.put_multi([
            exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[self.USER_4_ID],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-NOT_SUBSET-ExplorationRightsModel', 1]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_1_ID)
            .all_user_ids)

    def test_one_topic_rights_not_subset(self):
        topic_models.TopicRightsAllUsersModel(
            id=self.TOP_1_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
        ).put()
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])])

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS-NOT_SUBSET-TopicRightsModel', 1]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_1_ID)
            .all_user_ids)

    def test_one_collection_rights_failure(self):
        collection_models.CollectionRightsModel.put_multi([
            collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[self.USER_3_ID],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['FAILURE-CollectionRightsModel', [self.COL_1_ID]]])

    def test_one_exploration_rights_failure(self):
        exp_models.ExplorationRightsModel.put_multi([
            exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[self.USER_4_ID],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['FAILURE-ExplorationRightsModel', [self.EXP_1_ID]]])

    def test_one_topic_rights_failure(self):
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['FAILURE-TopicRightsModel', [self.TOP_1_ID]]])

    def test_multiple_rights(self):
        collection_models.CollectionRightsAllUsersModel(
            id=self.COL_1_ID,
            all_user_ids=[self.USER_1_ID]
        ).put()
        collection_models.CollectionRightsAllUsersModel(
            id=self.COL_2_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
        ).put()
        collection_models.CollectionRightsModel.put_multi([
            collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0),
            collection_models.CollectionRightsModel(
                id=self.COL_2_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])
        exp_models.ExplorationRightsAllUsersModel(
            id=self.EXP_1_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_4_ID]
        ).put()
        exp_models.ExplorationRightsAllUsersModel(
            id=self.EXP_2_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID, self.USER_4_ID]
        ).put()
        exp_models.ExplorationRightsModel.put_multi([
            exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[self.USER_3_ID],
                viewer_ids=[self.USER_4_ID],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0),
            exp_models.ExplorationRightsModel(
                id=self.EXP_2_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)])
        topic_models.TopicRightsAllUsersModel(
            id=self.TOP_1_ID,
            all_user_ids=[self.USER_3_ID, self.USER_4_ID]
        ).put()
        topic_models.TopicRightsAllUsersModel(
            id=self.TOP_2_ID,
            all_user_ids=[self.USER_1_ID, self.USER_2_ID]
        ).put()
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_3_ID, self.USER_4_ID]),
            topic_models.TopicRightsModel(
                id=self.TOP_2_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])])

        output = self._run_one_off_job()
        self.assertIn(['SUCCESS-SUBSET-CollectionRightsModel', 1], output)
        self.assertIn(
            ['SUCCESS-NOT_SUBSET-CollectionRightsModel', 1], output)
        self.assertIn(['SUCCESS-SUBSET-ExplorationRightsModel', 1], output)
        self.assertIn(
            ['SUCCESS-NOT_SUBSET-ExplorationRightsModel', 1], output)
        self.assertIn(['SUCCESS-SUBSET-TopicRightsModel', 2], output)

        self.assertItemsEqual(
            [self.USER_1_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_1_ID).all_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_2_ID).all_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_1_ID)
            .all_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID, self.USER_4_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_1_ID)
            .all_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_2_ID)
            .all_user_ids)


class AddAllUserIdsSnapshotContentVerificationJobTests(
        test_utils.GenericTestBase):

    COL_1_ID = 'col_1_id'
    EXP_1_ID = 'exp_1_id'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    USER_4_ID = 'user_4_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_id_migration.AddAllUserIdsSnapshotContentVerificationJob
            .create_new())
        (user_id_migration.AddAllUserIdsSnapshotContentVerificationJob
         .enqueue(job_id))
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.AddAllUserIdsSnapshotContentVerificationJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return [
            [key, sorted(values) if isinstance(values, list) else values]
            for key, values in eval_output]

    def test_one_collection_rights(self):
        collection_model = collection_models.CollectionRightsModel(
            id=self.COL_1_ID,
            owner_ids=[self.USER_1_ID],
            editor_ids=[self.USER_2_ID],
            voice_artist_ids=[],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        collection_model.save(
            'cid', 'Created new collection rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_model.owner_ids = [self.USER_3_ID]
        collection_model.save(
            'cid', 'Change owner',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-CollectionRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_1_ID).all_user_ids)

    def test_one_exploration_rights(self):
        exp_model = exp_models.ExplorationRightsModel(
            id=self.EXP_1_ID,
            owner_ids=[self.USER_1_ID, self.USER_2_ID],
            editor_ids=[self.USER_2_ID],
            voice_artist_ids=[],
            viewer_ids=[self.USER_4_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        exp_model.save(
            'cid', 'Created new exploration rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        exp_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
        exp_model.save(
            'cid', 'Change owner',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-ExplorationRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_1_ID)
            .all_user_ids)

    def test_one_topic_rights(self):
        topic_model = topic_models.TopicRightsModel(
            id=self.TOP_1_ID,
            manager_ids=[self.USER_1_ID, self.USER_2_ID])
        topic_model.commit(
            'cid', 'Created new topic rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        topic_model.manager_ids = [self.USER_2_ID, self.USER_3_ID]
        topic_model.commit(
            'cid', 'Change manager',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-TopicRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_1_ID)
            .all_user_ids)

    def test_multiple_rights(self):
        collection_model = collection_models.CollectionRightsModel(
            id=self.COL_1_ID,
            owner_ids=[self.USER_1_ID],
            editor_ids=[],
            voice_artist_ids=[],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        collection_model.save(
            'cid', 'Created new collection rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_model.editor_ids = [self.USER_1_ID, self.USER_4_ID]
        collection_model.save(
            'cid', 'Add editors',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])
        exp_model = exp_models.ExplorationRightsModel(
            id=self.EXP_1_ID,
            owner_ids=[self.USER_1_ID, self.USER_2_ID],
            editor_ids=[self.USER_2_ID],
            voice_artist_ids=[],
            viewer_ids=[self.USER_4_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        exp_model.save(
            'cid', 'Created new exploration rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        exp_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
        exp_model.save(
            'cid', 'Change owner',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])
        topic_model_1 = topic_models.TopicRightsModel(
            id=self.TOP_1_ID,
            manager_ids=[self.USER_1_ID, self.USER_2_ID])
        topic_model_1.commit(
            'cid', 'Created new topic rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        topic_model_1.manager_ids = [self.USER_2_ID, self.USER_3_ID]
        topic_model_1.commit(
            'cid', 'Change manager',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])
        topic_model_2 = topic_models.TopicRightsModel(
            id=self.TOP_2_ID,
            manager_ids=[self.USER_1_ID])
        topic_model_2.commit(
            'cid', 'Created new topic rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        topic_model_2.manager_ids = [self.USER_4_ID]
        topic_model_2.commit(
            'cid', 'Change manager',
            [{'cmd': rights_manager.CMD_CHANGE_ROLE}])

        output = self._run_one_off_job()
        self.assertIn(
            ['SUCCESS-CollectionRightsSnapshotContentModel', 2], output)
        self.assertIn(
            ['SUCCESS-ExplorationRightsSnapshotContentModel', 2], output)
        self.assertIn(['SUCCESS-TopicRightsSnapshotContentModel', 4], output)

        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_4_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_1_ID).all_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_1_ID)
            .all_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_1_ID)
            .all_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_4_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_2_ID)
            .all_user_ids)


class AddAllUserIdsSnapshotMetadataVerificationJobTests(
        test_utils.GenericTestBase):

    COL_1_ID = 'col_1_id'
    EXP_1_ID = 'exp_1_id'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    USER_4_ID = 'user_4_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_id_migration.AddAllUserIdsSnapshotMetadataVerificationJob
            .create_new())
        (user_id_migration.AddAllUserIdsSnapshotMetadataVerificationJob
         .enqueue(job_id))
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.AddAllUserIdsSnapshotMetadataVerificationJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return [
            [key, sorted(values) if isinstance(values, list) else values]
            for key, values in eval_output]

    def test_one_collection_rights(self):
        collection_model = collection_models.CollectionRightsModel(
            id=self.COL_1_ID,
            owner_ids=[self.USER_1_ID],
            editor_ids=[self.USER_2_ID],
            voice_artist_ids=[],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        collection_model.save(
            'cid',
            'Created new collection rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_model.owner_ids = [self.USER_3_ID]
        collection_model.save(
            'cid',
            'Change owner',
            [{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_3_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_OWNER
            }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-CollectionRightsSnapshotMetadataModel', 2]])
        self.assertItemsEqual(
            [self.USER_3_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_1_ID).all_user_ids)

    def test_one_exploration_rights(self):
        exp_model = exp_models.ExplorationRightsModel(
            id=self.EXP_1_ID,
            owner_ids=[self.USER_1_ID, self.USER_2_ID],
            editor_ids=[self.USER_2_ID],
            voice_artist_ids=[],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        exp_model.save(
            'cid', 'Created new exploration rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        exp_model.owner_ids = [self.USER_3_ID]
        exp_model.save(
            'cid',
            'Change owner',
            [{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_3_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_OWNER
            }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2]])
        self.assertItemsEqual(
            [self.USER_3_ID],
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_1_ID)
            .all_user_ids)

    def test_one_topic_rights_change_role(self):
        topic_model = topic_models.TopicRightsModel(
            id=self.TOP_1_ID,
            manager_ids=[self.USER_1_ID])
        topic_model.commit(
            'cid',
            'Created new topic rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        topic_model.manager_ids = [self.USER_1_ID, self.USER_3_ID]
        topic_model.commit(
            'cid',
            'Add manager',
            [{
                'cmd': topic_domain.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_3_ID,
                'old_role': topic_domain.ROLE_NONE,
                'new_role': topic_domain.ROLE_MANAGER
            }])
        topic_model.manager_ids = [self.USER_3_ID]
        topic_model.commit(
            'cid',
            'Remove manager',
            [{
                'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                'removed_user_id': self.USER_1_ID,
            }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-TopicRightsSnapshotMetadataModel', 3]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_3_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_1_ID)
            .all_user_ids)

    def test_multiple_rights(self):
        collection_model = collection_models.CollectionRightsModel(
            id=self.COL_1_ID,
            owner_ids=[],
            editor_ids=[self.USER_1_ID],
            voice_artist_ids=[],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        collection_model.save(
            'cid',
            'Created new collection rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_model.editor_ids = [self.USER_1_ID, self.USER_4_ID]
        collection_model.save(
            'cid',
            'Add editor',
            [{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_4_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_EDITOR
            }])
        exp_model = exp_models.ExplorationRightsModel(
            id=self.EXP_1_ID,
            owner_ids=[self.USER_1_ID, self.USER_2_ID],
            editor_ids=[],
            voice_artist_ids=[],
            viewer_ids=[self.USER_4_ID],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0)
        exp_model.save(
            'cid', 'Created new exploration rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        exp_model.owner_ids = [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
        exp_model.save(
            'cid',
            'Add owner',
            [{
                'cmd': rights_manager.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_3_ID,
                'old_role': rights_manager.ROLE_NONE,
                'new_role': rights_manager.ROLE_OWNER
            }])
        topic_model_1 = topic_models.TopicRightsModel(
            id=self.TOP_1_ID,
            manager_ids=[self.USER_1_ID, self.USER_2_ID])
        topic_model_1.commit(
            'cid',
            'Created new topic rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        topic_model_1.manager_ids = [
            self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
        topic_model_1.commit(
            'cid',
            'Add manager',
            [{
                'cmd': topic_domain.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_3_ID,
                'old_role': topic_domain.ROLE_NONE,
                'new_role': topic_domain.ROLE_MANAGER
            }])
        topic_model_2 = topic_models.TopicRightsModel(
            id=self.TOP_2_ID,
            manager_ids=[self.USER_1_ID, self.USER_4_ID])
        topic_model_2.commit(
            'cid', 'Created new topic rights',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        topic_model_2.manager_ids = [self.USER_4_ID]
        topic_model_2.commit(
            'cid', 'Remove manager',
            [{
                'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                'removed_user_id': self.USER_1_ID,
            }])

        output = self._run_one_off_job()
        self.assertIn(
            ['SUCCESS-CollectionRightsSnapshotMetadataModel', 2], output)
        self.assertIn(
            ['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2], output)
        self.assertIn(['SUCCESS-TopicRightsSnapshotMetadataModel', 4], output)

        self.assertItemsEqual(
            [self.USER_4_ID],
            collection_models.CollectionRightsAllUsersModel
            .get_by_id(self.COL_1_ID).all_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_1_ID)
            .all_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_1_ID)
            .all_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID],
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_2_ID)
            .all_user_ids)


class DeleteAllUserIdsVerificationJobTests(test_utils.GenericTestBase):

    COL_ID = 'col_id'
    EXP_ID = 'exp_id'
    TOP_ID = 'top_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_id_migration.DeleteAllUserIdsVerificationJob.create_new()
        user_id_migration.DeleteAllUserIdsVerificationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.DeleteAllUserIdsVerificationJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_one_collection_rights(self):
        collection_models.CollectionRightsAllUsersModel(
            id=self.COL_ID,
            all_user_ids=['some_id']
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 1]])

        self.assertIsNone(
            collection_models.CollectionRightsAllUsersModel.get_by_id(
                self.COL_ID))

    def test_one_exploration_rights(self):
        exp_models.ExplorationRightsAllUsersModel(
            id=self.EXP_ID,
            all_user_ids=['some_id']
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 1]])

        self.assertIsNone(
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_ID))

    def test_one_topic_rights(self):
        topic_models.TopicRightsAllUsersModel(
            id=self.EXP_ID,
            all_user_ids=['some_id']
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 1]])

        self.assertIsNone(
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_ID))

    def test_multiple_rights(self):
        collection_models.CollectionRightsAllUsersModel(
            id=self.COL_ID,
            all_user_ids=[]
        ).put()
        exp_models.ExplorationRightsAllUsersModel(
            id=self.EXP_ID,
            all_user_ids=['some_id']
        ).put()
        topic_models.TopicRightsAllUsersModel(
            id=self.EXP_ID,
            all_user_ids=['some_id', 'some_other_id']
        ).put()

        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 3]])

        self.assertIsNone(
            collection_models.CollectionRightsAllUsersModel.get_by_id(
                self.COL_ID))
        self.assertIsNone(
            exp_models.ExplorationRightsAllUsersModel.get_by_id(self.EXP_ID))
        self.assertIsNone(
            topic_models.TopicRightsAllUsersModel.get_by_id(self.TOP_ID))
