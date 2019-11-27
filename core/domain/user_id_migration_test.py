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

from core.domain import user_id_migration
from core.platform import models
from core.tests import test_utils

(user_models, feedback_models, exp_models) = models.Registry.import_models(
    [models.NAMES.user, models.NAMES.feedback, models.NAMES.exploration])
taskqueue_services = models.Registry.import_taskqueue_services()
search_services = models.Registry.import_search_services()


class UserIdMigrationJobTests(test_utils.GenericTestBase):
    """Tests for tuser id migration job."""
    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'
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
        eval_output = []
        for stringified_item in stringified_output:
            items = ast.literal_eval(stringified_item)
            user_ids = [ast.literal_eval(item) for item in items[1]]
            eval_output.append([items[0], user_ids])
        migrated_model_ids = sorted(
            [item for item in eval_output[0][1]], key=lambda item: item[0])
        migrated_model_ids = [item[1] for item in migrated_model_ids]
        return migrated_model_ids

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(UserIdMigrationJobTests, self).setUp()
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)

    def test_one_user_one_model_full_id(self):
        original_model = user_models.CompletedActivitiesModel(
            id=self.user_a_id,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2'])
        original_model.put()

        migrated_model_ids = self._run_one_off_job()
        migrated_model = (
            user_models.CompletedActivitiesModel.get_by_id(
                migrated_model_ids[0]))
        self.assertNotEqual(
            original_model.id, migrated_model.id)
        self.assertEqual(
            original_model.exploration_ids, migrated_model.exploration_ids)
        self.assertEqual(
            original_model.collection_ids, migrated_model.collection_ids)
        self.assertEqual(
            original_model.created_on, migrated_model.created_on)
        self.assertEqual(
            original_model.last_updated, migrated_model.last_updated)

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_a_id))

    def test_multiple_users_one_model_full_id(self):
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        original_models = []
        original_models.append(user_models.CompletedActivitiesModel(
            id=self.user_a_id,
            exploration_ids=['1', '2'],
            collection_ids=['11', '22']))
        original_models[-1].put()
        original_models.append(user_models.CompletedActivitiesModel(
            id=self.user_b_id,
            exploration_ids=['3', '4'],
            collection_ids=['33', '44']))
        original_models[-1].put()
        original_models.append(user_models.CompletedActivitiesModel(
            id=self.user_c_id,
            exploration_ids=['5', '6'],
            collection_ids=['55', '66']))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.id)

        migrated_model_ids = self._run_one_off_job()
        for i, model_id in enumerate(migrated_model_ids):
            migrated_model = (
                user_models.CompletedActivitiesModel.get_by_id(model_id))
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
            user_models.CompletedActivitiesModel.get_by_id(self.user_a_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_b_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_c_id))

    def test_one_user_one_model_part_id(self):
        original_model = user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.user_a_id, 'exp_id'),
            user_id=self.user_a_id,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start')
        original_model.put()

        migrated_model_ids = self._run_one_off_job()

        migrated_model = (
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                '%s.%s' % (migrated_model_ids[0], 'exp_id')))
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
            user_models.CompletedActivitiesModel.get_by_id(self.user_a_id))

    def test_multiple_users__one_model_part_id(self):
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        original_models = []
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.user_a_id, 'exp_id'),
            user_id=self.user_a_id,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.user_b_id, 'exp_id'),
            user_id=self.user_b_id,
            exploration_id='exp_id',
            last_played_exp_version=3,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.user_c_id, 'exp_id'),
            user_id=self.user_c_id,
            exploration_id='exp_id',
            last_played_exp_version=4,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.user_id)

        migrated_model_ids = self._run_one_off_job()
        for i, model_id in enumerate(migrated_model_ids):
            migrated_model = (
                user_models.ExpUserLastPlaythroughModel.get_by_id(
                    '%s.%s' % (model_id, 'exp_id')))
            self.assertNotEqual(
                original_models[i].id, migrated_model.id)
            self.assertNotEqual(
                original_models[i].user_id, migrated_model.user_id)
            self.assertEqual(
                original_models[i].exploration_id, migrated_model.exploration_id)
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
                user_models.CompletedActivitiesModel.get_by_id(self.user_a_id))
            self.assertIsNone(
                user_models.CompletedActivitiesModel.get_by_id(self.user_b_id))
            self.assertIsNone(
                user_models.CompletedActivitiesModel.get_by_id(self.user_c_id))

    def test_one_user_one_model_user_id_field(self):
        original_model = exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id',
            committer_id=self.user_a_id,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}])
        original_model.put()

        migrated_model_ids = self._run_one_off_job()

        migrated_model = (
            exp_models.ExplorationSnapshotMetadataModel.query(
                exp_models.ExplorationSnapshotMetadataModel.committer_id ==
                migrated_model_ids[0]
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
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        original_models = []
        original_models.append(exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id1',
            committer_id=self.user_a_id,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.append(exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id2',
            committer_id=self.user_b_id,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.append(exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id3',
            committer_id=self.user_c_id,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.committer_id)

        migrated_model_ids = self._run_one_off_job()
        for i, model_id in enumerate(migrated_model_ids):
            migrated_model = (
                exp_models.ExplorationSnapshotMetadataModel.query(
                    exp_models.ExplorationSnapshotMetadataModel.committer_id ==
                    model_id
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

    def test_one_user_one_model_custom(self):
        original_model = user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.user_a_id),
            user_id=self.user_a_id,
            score_category='score_category',
            score=2,
            has_email_been_sent=False)
        original_model.put()

        migrated_model_ids = self._run_one_off_job()
        migrated_model = (
            user_models.UserContributionScoringModel.get_by_id(
                '%s.%s' % ('score_category', migrated_model_ids[0])))
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
        self.assertEqual(
            original_model.created_on, migrated_model.created_on)
        self.assertEqual(
            original_model.last_updated, migrated_model.last_updated)

    def test_multiple_users_one_model_custom(self):
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        original_models = []
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.user_a_id),
            user_id=self.user_a_id,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.user_b_id),
            user_id=self.user_b_id,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.user_c_id),
            user_id=self.user_c_id,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.user_id)

        migrated_model_ids = self._run_one_off_job()
        for i, model_id in enumerate(migrated_model_ids):
            migrated_model = (
                user_models.UserContributionScoringModel.get_by_id(
                    '%s.%s' % ('score_category', model_id)))
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