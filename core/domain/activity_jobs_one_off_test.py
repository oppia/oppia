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

"""Unit tests for core.domain.activity_jobs_one_off."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import activity_jobs_one_off
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import python_utils

gae_search_services = models.Registry.import_search_services()

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class OneOffReindexActivitiesJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(OneOffReindexActivitiesJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for collection in collections:
            collection_services.save_new_collection(self.owner_id, collection)
            rights_manager.publish_collection(self.owner, collection.id)

        self.process_and_flush_pending_tasks()

    def test_standard_operation(self):
        job_id = (
            activity_jobs_one_off.IndexAllActivitiesJobManager.create_new())
        activity_jobs_one_off.IndexAllActivitiesJobManager.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        indexed_docs = []

        def mock_add_documents_to_index(docs, index):
            indexed_docs.extend(docs)
            self.assertIn(index, (search_services.SEARCH_INDEX_EXPLORATIONS,
                                  search_services.SEARCH_INDEX_COLLECTIONS))

        add_docs_swap = self.swap(
            gae_search_services, 'add_documents_to_index',
            mock_add_documents_to_index)

        with add_docs_swap:
            self.process_and_flush_pending_tasks()

        ids = [doc['id'] for doc in indexed_docs]
        titles = [doc['title'] for doc in indexed_docs]
        categories = [doc['category'] for doc in indexed_docs]

        for index in python_utils.RANGE(5):
            self.assertIn('%s' % index, ids)
            self.assertIn('title %d' % index, titles)
            self.assertIn('category%d' % index, categories)

        self.assertIsNone(
            activity_jobs_one_off.IndexAllActivitiesJobManager.reduce(
                'key', 'value'))


class ReplaceAdminIdOneOffJobTests(test_utils.GenericTestBase):

    USER_1_ID = 'user_1_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = activity_jobs_one_off.ReplaceAdminIdOneOffJob.create_new()
        activity_jobs_one_off.ReplaceAdminIdOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.ReplaceAdminIdOneOffJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_one_snapshot_model_wrong(self):
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='exp_1_id',
            committer_id='Admin',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()

        output = self._run_one_off_job()
        self.assertIn(['SUCCESS-RENAMED-SNAPSHOT', ['exp_1_id']], output)

        migrated_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                'exp_1_id'))
        self.assertEqual(
            migrated_model.committer_id, feconf.SYSTEM_COMMITTER_ID)

    def test_one_snapshot_model_correct(self):
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='exp_1_id',
            committer_id=self.USER_1_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()

        output = self._run_one_off_job()
        self.assertIn(['SUCCESS-KEPT-SNAPSHOT', 1], output)

        migrated_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                'exp_1_id'))
        self.assertEqual(migrated_model.committer_id, self.USER_1_ID)

    def test_one_commit_model_wrong(self):
        exp_models.ExplorationCommitLogEntryModel(
            id='exp_1_id-1',
            exploration_id='exp_1_id',
            user_id='Admin',
            username='Admin',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='public').put()

        output = self._run_one_off_job()
        self.assertIn(['SUCCESS-RENAMED-COMMIT', ['exp_1_id-1']], output)

        migrated_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id('exp_1_id-1'))
        self.assertEqual(migrated_model.user_id, feconf.SYSTEM_COMMITTER_ID)

    def test_one_commit_model_correct(self):
        exp_models.ExplorationCommitLogEntryModel(
            id='exp_1_id-1',
            exploration_id='exp_1_id',
            user_id=self.USER_1_ID,
            username='user',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='public').put()

        output = self._run_one_off_job()
        self.assertIn(['SUCCESS-KEPT-COMMIT', 1], output)

        migrated_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id('exp_1_id-1'))
        self.assertEqual(migrated_model.user_id, self.USER_1_ID)

    def test_multiple(self):
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='exp_1_id-1',
            committer_id='Admin',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='exp_1_id-2',
            committer_id=self.USER_1_ID,
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}]).put()
        exp_models.ExplorationCommitLogEntryModel(
            id='exp_1_id-1',
            exploration_id='exp_1_id',
            user_id='Admin',
            username='Admin',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='public').put()
        exp_models.ExplorationCommitLogEntryModel(
            id='exp_1_id-2',
            exploration_id='exp_1_id',
            user_id='Admin',
            username='Admin',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='public').put()
        exp_models.ExplorationCommitLogEntryModel(
            id='exp_1_id-3',
            exploration_id='exp_1_id',
            user_id=self.USER_1_ID,
            username='user',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}],
            post_commit_status='public').put()

        output = self._run_one_off_job()
        self.assertIn(
            ['SUCCESS-RENAMED-SNAPSHOT', ['exp_1_id-1']], output)
        self.assertIn(['SUCCESS-KEPT-SNAPSHOT', 1], output)
        self.assertIn(
            ['SUCCESS-RENAMED-COMMIT', ['exp_1_id-1', 'exp_1_id-2']], output)
        self.assertIn(['SUCCESS-KEPT-COMMIT', 1], output)

        migrated_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                'exp_1_id-1'))
        self.assertEqual(
            migrated_model.committer_id, feconf.SYSTEM_COMMITTER_ID)
        migrated_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                'exp_1_id-2'))
        self.assertEqual(migrated_model.committer_id, self.USER_1_ID)

        migrated_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exp_1_id-1'))
        self.assertEqual(migrated_model.user_id, feconf.SYSTEM_COMMITTER_ID)
        migrated_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exp_1_id-2'))
        self.assertEqual(migrated_model.user_id, feconf.SYSTEM_COMMITTER_ID)
        migrated_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exp_1_id-3'))
        self.assertEqual(migrated_model.user_id, self.USER_1_ID)
