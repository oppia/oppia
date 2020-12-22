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

from core.domain import takeout_commit_message_truncate_jobs_one_off
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import python_utils

(base_models, config_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.config])


class SnapshotMetadataCommitMsgAuditOneOffJob(
        test_utils.GenericTestBase):
    """Tests for the one-off commit message audit job."""

    def _count_one_off_jobs_in_queue(self):
        """Counts one off jobs in the taskqueue."""
        return self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            takeout_commit_message_truncate_jobs_one_off
            .SnapshotMetadataCommitMsgAuditOneOffJob.create_new())
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        (
            takeout_commit_message_truncate_jobs_one_off
            .SnapshotMetadataCommitMsgAuditOneOffJob.enqueue(job_id))
        self.assertEqual(self._count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        results = (
            takeout_commit_message_truncate_jobs_one_off
            .SnapshotMetadataCommitMsgAuditOneOffJob.get_output(job_id))
        return [ast.literal_eval(stringified_item) for
                stringified_item in results]

    def test_message_counts_correct(self):
        """Ensures the audit job correctly gets commit message counts of
        varying lengths.
        """

        value_less_than_1000 = 100
        value_equal_to_1000 = 1000
        value_between_1000_and_1500 = 1200
        value_equal_to_1500 = 1500
        num_models_per_category = 10

        model_class = config_models.ConfigPropertySnapshotMetadataModel
        for i in python_utils.RANGE(num_models_per_category):
            model_class(
                id='model_id-%d-%d' % (i, value_less_than_1000),
                committer_id='committer_id',
                commit_type='create',
                commit_message='a' * value_less_than_1000).put()
            model_class(
                id='model_id-%d-%d' % (i, value_equal_to_1000),
                committer_id='committer_id',
                commit_type='create',
                commit_message='a' * value_equal_to_1000).put()
            model_class(
                id='model_id-%d-%d' % (i, value_between_1000_and_1500),
                committer_id='committer_id',
                commit_type='create',
                commit_message='a' * value_between_1000_and_1500).put()
            model_class(
                id='model_id-%d-%d' % (i, value_equal_to_1500),
                committer_id='committer_id',
                commit_type='create',
                commit_message='a' * value_equal_to_1500).put()
        self.assertItemsEqual(self._run_one_off_job(), [
            # One model created when GenericTestBase instantiated.
            ['BETWEEN_1000_AND_1500', 2 * num_models_per_category],
            ['LESS_OR_EQUAL_TO_1000', 2 * num_models_per_category + 1],
        ])


class SnapshotMetadataCommitMsgShrinkOneOffJob(
        test_utils.GenericTestBase):
    """Tests for the one-off commit message shrinking job."""

    def _count_one_off_jobs_in_queue(self):
        """Counts one off jobs in the taskqueue."""
        return self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            takeout_commit_message_truncate_jobs_one_off
            .SnapshotMetadataCommitMsgShrinkOneOffJob.create_new())
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        (
            takeout_commit_message_truncate_jobs_one_off
            .SnapshotMetadataCommitMsgShrinkOneOffJob.enqueue(job_id))
        self.assertEqual(self._count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        results = (
            takeout_commit_message_truncate_jobs_one_off
            .SnapshotMetadataCommitMsgShrinkOneOffJob.get_output(job_id))
        return [ast.literal_eval(stringified_item) for
                stringified_item in results]

    def test_message_counts_correct(self):
        """Ensures the job corretly shrinks commit message lengths."""
        model_class = config_models.ConfigPropertySnapshotMetadataModel
        model_class(
            id='model_id-0',
            committer_id='committer_id',
            commit_type='create',
            commit_message='a' * 1200).put()
        self._run_one_off_job()
        self.assertEqual(
            len(model_class.get_by_id('model_id-0').commit_message),
            1000)
