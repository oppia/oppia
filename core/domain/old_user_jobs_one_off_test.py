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

"""Tests for user-related one-off computations."""

from constants import constants
from core.domain import feedback_services
from core.domain import subscription_services
from core.domain import user_jobs_one_off
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])
taskqueue_services = models.Registry.import_taskqueue_services()


class DashboardSubscriptionsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""
    EXP_ID_1 = 'exp_id_1'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.DashboardSubscriptionsOneOffJob.create_new()
        user_jobs_one_off.DashboardSubscriptionsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def _null_fn(self, *args, **kwargs):
        """A mock for functions of the form subscribe_to_*() to represent
        behavior prior to the implementation of subscriptions.
        """
        pass

    def setUp(self):
        super(DashboardSubscriptionsOneOffJobTests, self).setUp()

        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        self.user_a = user_services.UserActionsInfo(self.user_a_id)

        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A creates and saves a new valid exploration.
            self.save_new_valid_exploration(
                self.EXP_ID_1, self.user_a_id, end_state_name='End')

    def test_feedback_thread_subscription(self):
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(user_b_subscriptions_model, None)
        self.assertEqual(user_c_subscriptions_model, None)

        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            with self.swap(
                constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
                # User B starts a feedback thread.
                feedback_services.create_thread(
                    'exploration', self.EXP_ID_1, None, self.user_b_id,
                    'subject', 'text')
                # User C adds to that thread.
                thread_id = feedback_services.get_all_threads(
                    'exploration', self.EXP_ID_1, False)[0].id
                feedback_services.create_message(
                    thread_id, self.user_c_id, None, None, 'more text')

        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            self._run_one_off_job()

        # Both users are subscribed to the feedback thread.
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id)

        self.assertEqual(user_b_subscriptions_model.activity_ids, [])
        self.assertEqual(user_c_subscriptions_model.activity_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.feedback_thread_ids, [thread_id])
        self.assertEqual(
            user_c_subscriptions_model.feedback_thread_ids, [thread_id])
