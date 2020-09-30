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

"""Tests for TakeoutDomain-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import takeout_domain_jobs_one_off
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils

(base_models, config_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.config])

datastore_services = models.Registry.import_datastore_services()


class SnapshotMetadataCommitMsgMigrationOneOffJobTests(
        test_utils.GenericTestBase):
    """Tests for the one-off commit message indexing job."""

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            takeout_domain_jobs_one_off
            .SnapshotMetadataCommitMsgMigrationOneOffJob.create_new())
        (
            takeout_domain_jobs_one_off
            .SnapshotMetadataCommitMsgMigrationOneOffJob.enqueue(job_id))

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        stringified_output = (
            takeout_domain_jobs_one_off
            .SnapshotMetadataCommitMsgMigrationOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_indexing_fails(self):
        """Ensures the indexing does not work without the one-off-job."""

        commit_message_swapped = datastore_services.TextProperty(indexed=False)
        index_swap = self.swap(
            base_models.BaseSnapshotMetadataModel, 'commit_message',
            commit_message_swapped)

        with index_swap:
            model_class = config_models.ConfigPropertySnapshotMetadataModel
            model_class(
                id='model_id-1', committer_id='committer_id',
                commit_type='create', commit_message='test1').put()

            # Ensure the model is created.
            queried_models = model_class.query(
                model_class.committer_id == 'committer_id'
            ).fetch()
            self.assertEqual(len(queried_models), 1)

            # Try a query on the unindexed field and observe failure.
            with self.assertRaisesRegexp(
                Exception,
                'invalid filter: Cannot query for unindexed property None.'):
                model_class.query(model_class.commit_message == 'test1')

    def test_indexing_succeeds_after_one_off(self):
        """Ensures that indexing works after performing the one-off-job."""

        model_class = config_models.ConfigPropertySnapshotMetadataModel
        model_class(
            id='model_id-1', committer_id='committer_id', commit_type='create',
            commit_message='test1').put()

        # Ensure the model is created.
        queried_models = model_class.query(
            model_class.committer_id == 'committer_id'
        ).fetch()
        self.assertEqual(len(queried_models), 1)

        output = self._run_one_off_job()

        # Ensure valid output.
        self.assertEqual(output, [['SUCCESS', 2]])

        # Ensure valid querying on commit_message.
        queried_models = model_class.query(
            model_class.commit_message == 'test1').fetch()
        self.assertEqual(len(queried_models), 1)
        self.assertEqual(queried_models[0].id, 'model_id-1')

    def test_exception_thrown_with_failed_put(self):
        """Ensures that an exception is thrown when a put fails while
        performing the one-off-job.
        """
        model_class = config_models.ConfigPropertySnapshotMetadataModel

        def replacement_put(*args, **kwargs): # pylint: disable=unused-argument
            """Intended to be a replacement for the default put function for
            models, and raises an exception.
            """
            raise Exception('Failed to put.')

        model_class(
            id='model_id-1', committer_id='committer_id', commit_type='create',
            commit_message='test1').put()

        with self.swap(model_class, 'put', replacement_put):
            output = self._run_one_off_job()
            self.assertEqual(output, [['FAILURE', [
                'ConfigPropertySnapshotMetadataModel with id model_id-1 ' +
                'failed with error: Failed to put.',
                'ConfigPropertySnapshotMetadataModel with id ' +
                'oppia_csrf_secret-1 failed with error: Failed to put.'
            ]]])
