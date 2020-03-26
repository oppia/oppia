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
from core.domain import user_id_migration
from core.platform import models
from core.tests import test_utils
import feconf

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


class UserIdMigrationJobTests(test_utils.GenericTestBase):
    """Tests for UserIdMigrationJobTests."""
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

    def _get_migrated_model_ids(self, job_output):
        """Get successfully migrated model IDs."""
        for item in job_output:
            if item[0] == 'SUCCESS':
                migrated_model_ids = sorted(item[1], key=lambda item: item[0])
                migrated_model_ids = [item[1] for item in migrated_model_ids]
        return migrated_model_ids

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
        return eval_output

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(UserIdMigrationJobTests, self).setUp()
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)

    def test_repeated_migration(self):
        self._run_one_off_job()
        output = self._run_one_off_job()
        self.assertIn(['ALREADY DONE', [(self.user_a_id, '')]], output)

    def test_one_user_one_model_full_id(self):
        original_model = user_models.CompletedActivitiesModel(
            id=self.user_a_id,
            exploration_ids=['1', '2'],
            collection_ids=['1', '2'])
        original_model.put()

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())
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
        user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        original_models = []
        original_models.append(user_models.CompletedActivitiesModel(
            id=self.user_a_id,
            exploration_ids=['1', '2'],
            collection_ids=['11', '22']))
        original_models[-1].put()
        original_models.append(user_models.CompletedActivitiesModel(
            id=user_b_id,
            exploration_ids=['3', '4'],
            collection_ids=['33', '44']))
        original_models[-1].put()
        original_models.append(user_models.CompletedActivitiesModel(
            id=user_c_id,
            exploration_ids=['5', '6'],
            collection_ids=['55', '66']))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.id)

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())
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
            user_models.CompletedActivitiesModel.get_by_id(user_b_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(user_c_id))

    def test_one_user_one_model_part_id(self):
        original_model = user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.user_a_id, 'exp_id'),
            user_id=self.user_a_id,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start')
        original_model.put()

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())

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

    def test_one_user_different_one_model_part_id(self):
        original_model = user_models.UserContributionScoringModel(
            id='%s.%s' % ('category', self.user_a_id),
            user_id=self.user_a_id,
            score_category='category',
            score=1.5,
            has_email_been_sent=False
        )
        original_model.put()

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())

        migrated_model = (
            user_models.UserContributionScoringModel.get_by_id(
                '%s.%s' % ('category', migrated_model_ids[0])))
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
            '%s.%s' % ('category', self.user_a_id)))

    def test_multiple_users_one_model_part_id(self):
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        original_models = []
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.user_a_id, 'exp_id'),
            user_id=self.user_a_id,
            exploration_id='exp_id',
            last_played_exp_version=2,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (user_b_id, 'exp_id'),
            user_id=user_b_id,
            exploration_id='exp_id',
            last_played_exp_version=3,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.append(user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (user_c_id, 'exp_id'),
            user_id=user_c_id,
            exploration_id='exp_id',
            last_played_exp_version=4,
            last_played_state_name='start'))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.user_id)

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())

        for i, model_id in enumerate(migrated_model_ids):
            migrated_model = (
                user_models.ExpUserLastPlaythroughModel.get_by_id(
                    '%s.%s' % (model_id, 'exp_id')))
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
                user_models.CompletedActivitiesModel.get_by_id(self.user_a_id))
            self.assertIsNone(
                user_models.CompletedActivitiesModel.get_by_id(user_b_id))
            self.assertIsNone(
                user_models.CompletedActivitiesModel.get_by_id(user_c_id))

    def test_multiple_users_different_one_model_part_id(self):
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        original_models = []
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', self.user_a_id),
            user_id=self.user_a_id,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', user_b_id),
            user_id=user_b_id,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.append(user_models.UserContributionScoringModel(
            id='%s.%s' % ('score_category', user_c_id),
            user_id=user_c_id,
            score_category='score_category',
            score=2,
            has_email_been_sent=False))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.user_id)

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())
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

    def test_one_user_one_model_user_id_field(self):
        original_model = exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id',
            committer_id=self.user_a_id,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}])
        original_model.put()

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())

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
        user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

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
            committer_id=user_b_id,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.append(exp_models.ExplorationSnapshotMetadataModel(
            id='instance_id3',
            committer_id=user_c_id,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]))
        original_models[-1].put()
        original_models.sort(key=lambda model: model.committer_id)

        migrated_model_ids = self._get_migrated_model_ids(
            self._run_one_off_job())
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


class SnapshotsUserIdMigrationJobTests(test_utils.GenericTestBase):
    """Tests for SnapshotsUserIdMigrationJobTests."""
    SNAPSHOT_ID = '2'
    USER_1_USER_ID = 'user_id_1'
    USER_1_GAE_ID = 'gae_id_1'
    USER_2_USER_ID = 'user_id_2'
    USER_2_GAE_ID = 'gae_id_2'
    USER_3_USER_ID = 'user_id_3'
    USER_3_GAE_ID = 'gae_id_3'
    WRONG_GAE_ID = 'wrong_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_id_migration.SnapshotsUserIdMigrationJob.create_new()
        user_id_migration.SnapshotsUserIdMigrationJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_id_migration.SnapshotsUserIdMigrationJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to signup the superadmin user.
        with self.swap(test_utils.TestBase, 'signup_superadmin_user', empty):
            super(SnapshotsUserIdMigrationJobTests, self).setUp()
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


class GaeIdNotInModelsVerificationJobTests(test_utils.GenericTestBase):
    """Tests for GaeIdNotInModelsVerificationJob."""
    USER_1_USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    USER_1_GAE_ID = 'gae_id_1'
    USER_2_USER_ID = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    USER_2_GAE_ID = 'gae_id_2'
    USER_3_USER_ID = 'cccccccccccccccccccccccccccccccc'
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
            item = ast.literal_eval(stringified_item)
            item[1] = [ast.literal_eval(ids) for ids in item[1]]
            eval_output.append(item)
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
        output = [key[1] for key in output if key[0] == 'SUCCESS'][0]

        self.assertEqual(len(output), 3)
        self.assertIn((self.USER_1_GAE_ID, self.USER_1_USER_ID), output)
        self.assertIn((self.USER_2_GAE_ID, self.USER_2_USER_ID), output)
        self.assertIn((self.USER_3_GAE_ID, self.USER_3_USER_ID), output)


class BaseModelsUserIdsHaveUserSettingsVerificationJobTests(
        test_utils.GenericTestBase):

    def test_entity_classes_to_map_over(self):
        with self.assertRaises(NotImplementedError):
            (user_id_migration.BaseModelsUserIdsHaveUserSettingsVerificationJob
             .entity_classes_to_map_over())


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
        feedback_models.GeneralFeedbackThreadModel(
            id='type.id.generated',
            entity_type='type',
            entity_id='id',
            subject='subject').put()
        feedback_models.GeneralFeedbackThreadUserModel(
            id='None.thread_id',
            thread_id='thread_id').put()
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id='topic_1_id',
                manager_ids=[self.USER_1_GAE_ID])])
        topic_models.TopicRightsModel.put_multi([
            topic_models.TopicRightsModel(
                id='topic_2_id',
                manager_ids=[feconf.SYSTEM_COMMITTER_ID])])

        output = self._run_one_off_job()
        self.assertIn(
            ['FAILURE - CompletedActivitiesModel', [self.USER_1_GAE_ID]],
            output)
        self.assertIn(
            ['SUCCESS - CompletedActivitiesModel', 1], output)
        self.assertIn(
            ['FAILURE - ExpUserLastPlaythroughModel',
             ['%s.%s' % (self.USER_2_GAE_ID, 'exp_id')]],
            output)
        self.assertIn(
            ['SUCCESS - ExpUserLastPlaythroughModel', 1],
            output)
        self.assertIn(
            ['FAILURE - UserContributionScoringModel',
             ['%s.%s' % ('category', self.USER_2_GAE_ID)]],
            output)
        self.assertIn(
            ['SUCCESS_NONE - GeneralFeedbackThreadModel', 1], output)
        self.assertIn(
            ['SUCCESS_NONE - GeneralFeedbackThreadUserModel', 1], output)
        self.assertIn(
            ['FAILURE - TopicRightsModel', ['topic_1_id']], output)
        self.assertIn(['SUCCESS - TopicRightsModel', 1], output)
        self.assertIn(['SUCCESS - UserSettingsModel', 3], output)


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
