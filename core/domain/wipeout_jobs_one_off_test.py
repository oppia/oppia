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

"""Tests for wipeout one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import wipeout_jobs_one_off
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])
taskqueue_services = models.Registry.import_taskqueue_services()
search_services = models.Registry.import_search_services()


class UserDeletionOneOffJobTests(test_utils.GenericTestBase):
    """Tests for UserDeletionOneOffJob."""

    USER_1_EMAIL = 'a@example.com'
    USER_1_USERNAME = 'a'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = wipeout_jobs_one_off.UserDeletionOneOffJob.create_new()
        wipeout_jobs_one_off.UserDeletionOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            wipeout_jobs_one_off.UserDeletionOneOffJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        super(UserDeletionOneOffJobTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_repeated_migration(self):
        output = self._run_one_off_job()
        self.assertIn(['SUCCESS', [self.user_1_id]], output)
        output = self._run_one_off_job()
        self.assertIn(['ALREADY DONE', [self.user_1_id]], output)

    def test_regular_migration(self):
        output = self._run_one_off_job()
        self.assertIn(['SUCCESS', [self.user_1_id]], output)

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertTrue(pending_deletion_model.deletion_complete)


class VerifyUserDeletionOneOffJobTests(test_utils.GenericTestBase):
    """Tests for VerifyUserDeletionOneOffJob."""

    USER_1_EMAIL = 'a@example.com'
    USER_1_USERNAME = 'a'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = wipeout_jobs_one_off.VerifyUserDeletionOneOffJob.create_new()
        wipeout_jobs_one_off.VerifyUserDeletionOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            wipeout_jobs_one_off.VerifyUserDeletionOneOffJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        super(VerifyUserDeletionOneOffJobTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_not_deleted(self):
        output = self._run_one_off_job()
        self.assertIn(['NOT DELETED', [self.user_1_id]], output)

    def test_deleted_success(self):
        wipeout_service.delete_user(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        output = self._run_one_off_job()
        self.assertIn(['SUCCESS', [self.user_1_id]], output)

    def test_deleted_failure(self):
        wipeout_service.delete_user(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        output = self._run_one_off_job()
        self.assertIn(['FAILURE', [self.user_1_id]], output)
