# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for TakeoutDomain-related one-off jobs"""

from core.domain import takeout_domain_jobs_one_off
from core.platform import models
from core.tests import test_utils

from google.appengine.ext import ndb
from google.appengine.api.datastore_errors import BadFilterError

(base_models, config_models) = models.Registry.import_models([models.NAMES.base_model, models.NAMES.config])

taskqueue_services = models.Registry.import_taskqueue_services()

class SnapshotMetadataCommitMsgOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off commit message indexing job."""

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            takeout_domain_jobs_one_off
            .SnapshotMetadataCommitMsgOneOffJob.create_new())
        (
            takeout_domain_jobs_one_off
            .SnapshotMetadataCommitMsgOneOffJob.enqueue(job_id))
        
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

    def test_indexing_fails(self):
        """Ensures the indexing does not work without the one-off-job."""

        commit_message_swapped = ndb.TextProperty(indexed=False)
        index_swap = self.swap(
            base_models.BaseSnapshotMetadataModel, 'commit_message',
            commit_message_swapped)
        
        with index_swap:
            model_class = config_models.ConfigPropertySnapshotMetadataModel
            model_class(
            id='model_id-1', committer_id='committer_id', commit_type='create',
            commit_message='test1').put()

            # ensure the model is created
            models = model_class.query(
                model_class.committer_id == 'committer_id'
            ).fetch()
            self.assertEqual(len(models), 1)

            # try a query on unindexed field and observe failure
            with self.assertRaisesRegexp(
                BadFilterError,
                'invalid filter: Cannot query for unindexed property None.'):
                model_class.query(model_class.commit_message == 'test1')
    
    def test_indexing_succeeds_after_one_off(self):
        """Ensures that indexing works after performing the one-off-job."""

        commit_message_swapped = ndb.TextProperty(indexed=False)
        index_swap = self.swap(
            base_models.BaseSnapshotMetadataModel, 'commit_message',
            commit_message_swapped)
        
        model_class = config_models.ConfigPropertySnapshotMetadataModel
        model_class(
        id='model_id-1', committer_id='committer_id', commit_type='create',
        commit_message='test1').put()

        # ensure the model is created
        models = model_class.query(
            model_class.committer_id == 'committer_id'
        ).fetch()
        self.assertEqual(len(models), 1)

        self._run_one_off_job()

        models = model_class.query(
            model_class.commit_message == 'test1').fetch()
        self.assertEqual(len(models), 1)
        self.assertEqual(models[0].id, 'model_id-1')