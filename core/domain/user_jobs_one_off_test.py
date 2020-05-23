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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import re

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_jobs_continuous
from core.domain import user_jobs_one_off
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(user_models, feedback_models, exp_models) = models.Registry.import_models(
    [models.NAMES.user, models.NAMES.feedback, models.NAMES.exploration])
taskqueue_services = models.Registry.import_taskqueue_services()
search_services = models.Registry.import_search_services()


class UserContributionsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""
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
        job_id = user_jobs_one_off.UserContributionsOneOffJob.create_new()
        user_jobs_one_off.UserContributionsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def setUp(self):
        super(UserContributionsOneOffJobTests, self).setUp()
        # User A has no created or edited explorations.
        # User B has one created exploration.
        # User C has one edited exploration.
        # User D has created an exploration and then edited it.
        # (This is used to check that there are no duplicate
        # entries in the contribution lists).
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        self.user_d_id = self.get_user_id_from_email(self.USER_D_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_b_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_c_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_d_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_d_id, self.EXP_ID_2, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

    def test_null_case(self):
        """Tests the case where user has no created or edited explorations."""

        self._run_one_off_job()
        user_a_contributions_model = user_models.UserContributionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_contributions_model.created_exploration_ids, [])
        self.assertEqual(user_a_contributions_model.edited_exploration_ids, [])

    def test_created_exp(self):
        """Tests the case where user has created (and therefore edited)
        an exploration.
        """

        self._run_one_off_job()
        user_b_contributions_model = user_models.UserContributionsModel.get(
            self.user_b_id)
        self.assertEqual(
            user_b_contributions_model.created_exploration_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_contributions_model.edited_exploration_ids, [self.EXP_ID_1])

    def test_edited_exp(self):
        """Tests the case where user has an edited exploration."""

        self._run_one_off_job()
        user_c_contributions_model = user_models.UserContributionsModel.get(
            self.user_c_id)
        self.assertEqual(
            user_c_contributions_model.created_exploration_ids, [])
        self.assertEqual(
            user_c_contributions_model.edited_exploration_ids, [self.EXP_ID_1])

    def test_for_duplicates(self):
        """Tests the case where user has an edited exploration, and edits
        it again making sure it is not duplicated.
        """

        self._run_one_off_job()
        user_d_contributions_model = user_models.UserContributionsModel.get(
            self.user_d_id)
        self.assertEqual(
            user_d_contributions_model.edited_exploration_ids,
            [self.EXP_ID_2])
        self.assertEqual(
            user_d_contributions_model.created_exploration_ids,
            [self.EXP_ID_2])

    def test_no_new_user_contributions_model_get_created_with_existing_model(
            self):
        model1 = exp_models.ExplorationSnapshotMetadataModel(
            id='exp_id-1', committer_id=self.user_a_id, commit_type='create')
        model1.put()
        user_models.UserContributionsModel(
            id=self.user_a_id,
            created_exploration_ids=['exp_id']
        ).put()

        user_contributions_model = user_models.UserContributionsModel.get(
            self.user_a_id)
        self.assertEqual(
            user_contributions_model.created_exploration_ids,
            ['exp_id'])

        self._run_one_off_job()

        user_contributions_model = user_models.UserContributionsModel.get(
            self.user_a_id)
        self.assertEqual(
            user_contributions_model.created_exploration_ids,
            ['exp_id'])

    def test_user_contributions_get_created_after_running_the_job(self):
        model1 = exp_models.ExplorationSnapshotMetadataModel(
            id='exp_id-1', committer_id='new_user', commit_type='create')
        model1.put()

        user_contributions_model = user_models.UserContributionsModel.get(
            'new_user', strict=False)
        self.assertIsNone(user_contributions_model)

        self._run_one_off_job()

        user_contributions_model = user_models.UserContributionsModel.get(
            'new_user', strict=False)
        self.assertEqual(
            user_contributions_model.created_exploration_ids,
            ['exp_id'])


class UsernameLengthDistributionOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off username length distribution job."""
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'ab@example.com'
    USER_B_USERNAME = 'ab'
    USER_C_EMAIL = 'bc@example.com'
    USER_C_USERNAME = 'bc'
    USER_D_EMAIL = 'bcd@example.com'
    USER_D_USERNAME = 'bcd'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UsernameLengthDistributionOneOffJob.create_new())
        user_jobs_one_off.UsernameLengthDistributionOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            user_jobs_one_off.UsernameLengthDistributionOneOffJob.get_output(
                job_id))

        output = {}
        for stringified_distribution in stringified_output:
            value = re.findall(r'\d+', stringified_distribution)
            # The following is output['username length'] = number of users.
            output[value[0]] = int(value[1])

        return output

    def test_null_case(self):
        """Tests the case when there are no signed up users but there is one
        default user having the username - 'tmpsuperadm1n'.
        """
        output = self._run_one_off_job()
        # Number of users = 1.
        # length of usernames = 13 (tmpsuperadm1n).
        self.assertEqual(output['13'], 1)

    def test_single_user_case(self):
        """Tests the case when there is only one signed up user and a default
        user - 'tmpsuperadm1n'.
        """
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        output = self._run_one_off_job()
        # Number of users = 2.
        # length of usernames = 13 (tmpsuperadm1n), 1 (a).
        self.assertEqual(output['13'], 1)
        self.assertEqual(output['1'], 1)

    def test_multiple_users_case(self):
        """Tests the case when there are multiple signed up users and a
        default user - 'tmpsuperadm1n'.
        """
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        output = self._run_one_off_job()
        # Number of users = 3
        # length of usernames = 13 (tmpsuperadm1n), 2 (ab), 1 (a).
        self.assertEqual(output['13'], 1)
        self.assertEqual(output['2'], 1)
        self.assertEqual(output['1'], 1)

        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        output = self._run_one_off_job()
        # Number of users = 5
        # length of usernames = 13 (tmpsuperadm1n), 3 (bcd), 2 (ab, bc), 1 (a).
        self.assertEqual(output['13'], 1)
        self.assertEqual(output['3'], 1)
        self.assertEqual(output['2'], 2)
        self.assertEqual(output['1'], 1)


class UsernameLengthAuditOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off username length limit job."""

    USER_1_EMAIL = '1@example.com'
    USER_1_USERNAME = '123456789123456789123'
    USER_2_EMAIL = '2@example.com'
    USER_2_USERNAME = '123456789123456789124'
    USER_3_EMAIL = '3@example.com'
    USER_3_USERNAME = 'a' * 30
    USER_4_EMAIL = '4@example.com'
    # Username 4 length is 20, so it shouldn't be in the output.
    USER_4_USERNAME = '12345678912345678912'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UsernameLengthAuditOneOffJob.create_new())
        user_jobs_one_off.UsernameLengthAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        return user_jobs_one_off.UsernameLengthAuditOneOffJob.get_output(job_id)

    def test_username_length_limit(self):
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.signup(self.USER_3_EMAIL, self.USER_3_USERNAME)

        expected_output = [u'[u\'Length: 21\', u"Usernames: [\'%s\', \'%s\']"]'
                           % (self.USER_1_USERNAME, self.USER_2_USERNAME),
                           u'[u\'Length: 30\', u"Usernames: [\'%s\']"]'
                           % self.USER_3_USERNAME]

        actual_output = self._run_one_off_job()

        self.assertEqual(actual_output, expected_output)


class LongUserBiosOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off long userbio length job."""
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_A_BIO = 'I am less than 500'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_B_BIO = 'Long Bio' * 100
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'
    USER_C_BIO = 'Same Bio' * 100
    USER_D_EMAIL = 'd@example.com'
    USER_D_USERNAME = 'd'
    USER_D_BIO = 'Diff Bio' * 300

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.LongUserBiosOneOffJob.create_new())
        user_jobs_one_off.LongUserBiosOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        stringified_output = (
            user_jobs_one_off.LongUserBiosOneOffJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [[int(eval_item[0]), eval_item[1]]
                  for eval_item in eval_output]
        return output

    def test_no_userbio_returns_empty_list(self):
        """Tests the case when userbio is None."""
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        result = self._run_one_off_job()
        self.assertEqual(result, [])

    def test_short_userbio_returns_empty_list(self):
        """Tests the case where the userbio is less than 500 characters."""
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        user_services.update_user_bio(user_id_a, self.USER_A_BIO)
        result = self._run_one_off_job()
        self.assertEqual(result, [])

    def test_long_userbio_length(self):
        """Tests the case where the userbio is more than 500 characters."""
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        user_services.update_user_bio(user_id_b, self.USER_B_BIO)
        result = self._run_one_off_job()
        expected_result = [[800, ['b']]]
        self.assertEqual(result, expected_result)

    def test_same_userbio_length(self):
        """Tests the case where two users have same userbio length."""
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        user_services.update_user_bio(user_id_b, self.USER_B_BIO)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_id_c = self.get_user_id_from_email(self.USER_C_EMAIL)
        user_services.update_user_bio(user_id_c, self.USER_C_BIO)
        result = self._run_one_off_job()
        result[0][1].sort()
        expected_result = [[800, ['b', 'c']]]
        self.assertEqual(result, expected_result)

    def test_diff_userbio_length(self):
        """Tests the case where two users have different userbio lengths."""
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_id_c = self.get_user_id_from_email(self.USER_C_EMAIL)
        user_services.update_user_bio(user_id_c, self.USER_C_BIO)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        user_id_d = self.get_user_id_from_email(self.USER_D_EMAIL)
        user_services.update_user_bio(user_id_d, self.USER_D_BIO)
        result = sorted(self._run_one_off_job(), key=lambda x: x[0])
        expected_result = [[800, ['c']], [2400, ['d']]]
        self.assertEqual(result, expected_result)

    def test_bio_length_for_users_with_no_bio(self):
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        model1 = user_models.UserSettingsModel(
            id=user_id_a,
            gae_id='gae_' + user_id_a,
            email=self.USER_A_EMAIL)
        model1.put()

        result = self._run_one_off_job()

        self.assertEqual(result, [])


class DashboardSubscriptionsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""
    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    COLLECTION_ID_1 = 'col_id_1'
    COLLECTION_ID_2 = 'col_id_2'
    EXP_ID_FOR_COLLECTION_1 = 'id_of_exp_in_collection_1'
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

    def test_null_case(self):
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_b_subscriptions_model, None)

        self._run_one_off_job()

        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_b_subscriptions_model, None)

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
            # User B starts a feedback thread.
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, self.user_b_id, 'subject', 'text')
            # User C adds to that thread.
            thread_id = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)[0].id
            feedback_services.create_message(
                thread_id, self.user_c_id, None, None, 'more text')

        self._run_one_off_job()

        # Both users are subscribed to the feedback thread.
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id)

        self.assertEqual(user_b_subscriptions_model.activity_ids, [])
        self.assertEqual(user_c_subscriptions_model.activity_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.general_feedback_thread_ids, [thread_id])
        self.assertEqual(
            user_c_subscriptions_model.general_feedback_thread_ids, [thread_id])

    def test_exploration_subscription(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID_1, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # User A adds user C as a viewer of the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID_1, self.user_c_id,
                rights_manager.ROLE_VIEWER)

        self._run_one_off_job()

        # Users A and B are subscribed to the exploration. User C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(user_a_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_b_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_two_explorations(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A creates and saves another valid exploration.
            self.save_new_valid_exploration(self.EXP_ID_2, self.user_a_id)

        self._run_one_off_job()

        # User A is subscribed to two explorations.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)

        self.assertEqual(
            sorted(user_a_subscriptions_model.activity_ids),
            sorted([self.EXP_ID_1, self.EXP_ID_2]))

    def test_community_owned_exploration(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID_1, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # The exploration becomes community-owned.
            rights_manager.publish_exploration(self.user_a, self.EXP_ID_1)
            rights_manager.release_ownership_of_exploration(
                self.user_a, self.EXP_ID_1)
            # User C edits the exploration.
            exp_services.update_exploration(
                self.user_c_id, self.EXP_ID_1, [], 'Update exploration')

        self._run_one_off_job()

        # User A and user B are subscribed to the exploration; user C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_deleted_exploration(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):

            # User A deletes the exploration.
            exp_services.delete_exploration(self.user_a_id, self.EXP_ID_1)
            self.process_and_flush_pending_tasks()

        self._run_one_off_job()

        # User A is not subscribed to the exploration.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)

    def test_collection_subscription(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

            # User A adds user B as an editor to the collection.
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID_1, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # User A adds user C as a viewer of the collection.
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID_1, self.user_c_id,
                rights_manager.ROLE_VIEWER)

        self._run_one_off_job()

        # Users A and B are subscribed to the collection. User C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        # User A is also subscribed to the exploration within the collection
        # because they created both.
        self.assertEqual(
            sorted(user_a_subscriptions_model.activity_ids), [
                self.EXP_ID_1, self.EXP_ID_FOR_COLLECTION_1])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        self.assertEqual(user_a_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_b_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_two_collections(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

            # User A creates and saves another valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_2, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

        self._run_one_off_job()

        # User A is subscribed to two collections.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)

        self.assertEqual(
            sorted(user_a_subscriptions_model.collection_ids),
            sorted([self.COLLECTION_ID_1, self.COLLECTION_ID_2]))

    def test_deleted_collection(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User A creates and saves a new collection.
            self.save_new_default_collection(
                self.COLLECTION_ID_1, self.user_a_id)

            # User A deletes the collection.
            collection_services.delete_collection(
                self.user_a_id, self.COLLECTION_ID_1)

            # User A deletes the exploration from earlier.
            exp_services.delete_exploration(self.user_a_id, self.EXP_ID_1)
            self.process_and_flush_pending_tasks()

        self._run_one_off_job()

        # User A is not subscribed to the collection.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)

    def test_adding_exploration_to_collection(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User B creates and saves a new collection.
            self.save_new_default_collection(
                self.COLLECTION_ID_1, self.user_b_id)

            # User B adds the exploration created by user A to the collection.
            collection_services.update_collection(
                self.user_b_id, self.COLLECTION_ID_1, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': self.EXP_ID_1
                }], 'Add new exploration to collection.')

        # Users A and B have no subscriptions (to either explorations or
        # collections).
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)
        self.assertEqual(user_b_subscriptions_model, None)

        self._run_one_off_job()

        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)

        # User B should be subscribed to the collection and user A to the
        # exploration.
        self.assertEqual(
            user_a_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])

    def test_community_owned_collection(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            rights_manager.publish_exploration(self.user_a, self.EXP_ID_1)

            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_1)

            # User A adds user B as an editor to the collection.
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID_1, self.user_b_id,
                rights_manager.ROLE_EDITOR)

            # The collection becomes community-owned.
            rights_manager.publish_collection(self.user_a, self.COLLECTION_ID_1)
            rights_manager.release_ownership_of_collection(
                self.user_a, self.COLLECTION_ID_1)

            # User C edits the collection.
            collection_services.update_collection(
                self.user_c_id, self.COLLECTION_ID_1, [{
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': (
                        collection_domain.COLLECTION_PROPERTY_TITLE),
                    'new_value': 'New title'
                }], 'Changed title.')

        self._run_one_off_job()

        # User A and user B are subscribed to the collection; user C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        self.assertEqual(user_c_subscriptions_model, None)


class MockUserStatsAggregator(
        user_jobs_continuous.UserStatsAggregator):
    """A modified UserStatsAggregator that does not start a new
     batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return MockUserStatsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class MockUserStatsMRJobManager(
        user_jobs_continuous.UserStatsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return MockUserStatsAggregator


class DashboardStatsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard stats job."""

    CURRENT_DATE_AS_STRING = user_services.get_current_date_as_string()
    DATE_AFTER_ONE_WEEK = (
        (datetime.datetime.utcnow() + datetime.timedelta(7)).strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT))

    USER_SESSION_ID = 'session1'

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    EXP_VERSION = 1

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.DashboardStatsOneOffJob.create_new()
        user_jobs_one_off.DashboardStatsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def setUp(self):
        super(DashboardStatsOneOffJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def mock_get_current_date_as_string(self):
        return self.CURRENT_DATE_AS_STRING

    def _rate_exploration(self, user_id, exp_id, rating):
        """Assigns rating to the exploration corresponding to the given
        exploration id.

        Args:
            user_id: str. The user id.
            exp_id: str. The exploration id.
            rating: int. The rating to be assigned to the given exploration.
        """
        rating_services.assign_rating_to_exploration(user_id, exp_id, rating)

    def _record_play(self, exp_id, state):
        """Calls StartExplorationEventHandler and records the 'play' event
        corresponding to the given exploration id.

        Args:
            exp_id: str. The exploration id.
            state: dict(str, *). The state of the exploration corresponding to
                the given id.
        """
        event_services.StartExplorationEventHandler.record(
            exp_id, self.EXP_VERSION, state, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)

    def test_weekly_stats_if_continuous_stats_job_has_not_been_run(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._record_play(exp_id, init_state_name)
        self._rate_exploration('user1', exp_id, 5)

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(weekly_stats, None)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id), None)

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        expected_results_list = [{
            self.mock_get_current_date_as_string(): {
                'num_ratings': 0,
                'average_ratings': None,
                'total_plays': 0
            }
        }]
        self.assertEqual(weekly_stats, expected_results_list)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id),
            expected_results_list[0])

    def test_weekly_stats_if_no_explorations(self):
        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 0,
                    'average_ratings': None,
                    'total_plays': 0
                }
            }])

    def test_weekly_stats_for_single_exploration(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._record_play(exp_id, init_state_name)
        self._rate_exploration('user1', exp_id, 5)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 5.0,
                    'total_plays': 1
                }
            }])

    def test_weekly_stats_for_multiple_explorations(self):
        exploration_1 = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id_1 = exploration_1.id
        exploration_2 = self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id)
        exp_id_2 = exploration_2.id
        init_state_name_1 = exploration_1.init_state_name
        self._record_play(exp_id_1, init_state_name_1)
        self._rate_exploration('user1', exp_id_1, 5)
        self._rate_exploration('user2', exp_id_2, 4)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 2,
                    'average_ratings': 4.5,
                    'total_plays': 1
                }
            }])

    def test_stats_for_multiple_weeks(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._rate_exploration('user1', exp_id, 4)
        self._record_play(exp_id, init_state_name)
        self._record_play(exp_id, init_state_name)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 2,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 4.0,
                    'total_plays': 2
                }
            }])

        MockUserStatsAggregator.stop_computation(self.owner_id)
        self.process_and_flush_pending_tasks()

        self._rate_exploration('user2', exp_id, 2)

        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_tasks()

        def _mock_get_date_after_one_week():
            """Returns the date of the next week."""
            return self.DATE_AFTER_ONE_WEEK

        with self.swap(
            user_services,
            'get_current_date_as_string',
            _mock_get_date_after_one_week):
            self._run_one_off_job()

        expected_results_list = [
            {
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 4.0,
                    'total_plays': 2
                }
            },
            {
                _mock_get_date_after_one_week(): {
                    'num_ratings': 2,
                    'average_ratings': 3.0,
                    'total_plays': 2
                }
            }
        ]
        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(weekly_stats, expected_results_list)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id),
            expected_results_list[1])


class UserFirstContributionMsecOneOffJobTests(test_utils.GenericTestBase):

    EXP_ID = 'test_exp'

    def setUp(self):
        super(UserFirstContributionMsecOneOffJobTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def test_contribution_msec_updates_on_published_explorations(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.admin_id, end_state_name='End')
        init_state_name = exploration.init_state_name

        # Test that no contribution time is set.
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        self.assertIsNone(
            user_services.get_user_settings(
                self.admin_id).first_contribution_msec)

        # Test all owners and editors of exploration after publication have
        # updated times.
        exp_services.publish_exploration_and_update_user_profiles(
            self.admin, self.EXP_ID)
        rights_manager.release_ownership_of_exploration(
            self.admin, self.EXP_ID)
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': init_state_name,
                'property_name': 'widget_id',
                'new_value': 'MultipleChoiceInput'
            })], 'commit')
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)
        self.assertIsNotNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_update_on_unpublished_explorations(
            self):
        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        exp_services.publish_exploration_and_update_user_profiles(
            self.owner, self.EXP_ID)
        # We now manually reset the user's first_contribution_msec to None.
        # This is to test that the one off job skips over the unpublished
        # exploration and does not reset the user's first_contribution_msec.
        user_models.UserSettingsModel(
            id=self.owner_id,
            gae_id='gae_id',
            email='email@email.com',
            username='username',
            first_contribution_msec=None
        ).put()
        rights_manager.unpublish_exploration(self.admin, self.EXP_ID)

        # Test that first contribution time is not set for unpublished
        # explorations.
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        self.assertIsNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)

    def test_contribution_msec_is_not_generated_if_exploration_not_created(
            self):
        model1 = exp_models.ExplorationRightsSnapshotMetadataModel(
            id='exp_id-1', committer_id=self.owner_id, commit_type='create')
        model1.put()

        self.assertIsNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)

        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)


class UserProfilePictureOneOffJobTests(test_utils.GenericTestBase):

    FETCHED_GRAVATAR = 'fetched_gravatar'

    def setUp(self):
        super(UserProfilePictureOneOffJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def _mock_fetch_gravatar(self, unused_email):
        """Mocks user_services.fetch_gravatar()."""
        return self.FETCHED_GRAVATAR

    def test_new_profile_picture_is_generated_if_it_does_not_exist(self):
        user_services.update_profile_picture_data_url(self.owner_id, None)

        # Before the job runs, the data URL is None.
        user_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNone(user_settings.profile_picture_data_url)

        job_id = (
            user_jobs_one_off.UserProfilePictureOneOffJob.create_new())
        user_jobs_one_off.UserProfilePictureOneOffJob.enqueue(job_id)

        with self.swap(
            user_services, 'fetch_gravatar', self._mock_fetch_gravatar):
            self.process_and_flush_pending_tasks()

        # After the job runs, the data URL has been updated.
        new_user_settings = user_services.get_user_settings(self.owner_id)
        self.assertEqual(
            new_user_settings.profile_picture_data_url, self.FETCHED_GRAVATAR)

    def test_profile_picture_is_not_regenerated_if_it_already_exists(self):
        user_services.update_profile_picture_data_url(
            self.owner_id, 'manually_added_data_url')

        # Before the job runs, the data URL is the manually-added one.
        user_settings = user_services.get_user_settings(self.owner_id)
        self.assertEqual(
            user_settings.profile_picture_data_url, 'manually_added_data_url')

        job_id = (
            user_jobs_one_off.UserProfilePictureOneOffJob.create_new())
        user_jobs_one_off.UserProfilePictureOneOffJob.enqueue(job_id)

        with self.swap(
            user_services, 'fetch_gravatar', self._mock_fetch_gravatar):
            self.process_and_flush_pending_tasks()

        # After the job runs, the data URL is still the manually-added one.
        new_user_settings = user_services.get_user_settings(self.owner_id)
        self.assertEqual(
            new_user_settings.profile_picture_data_url,
            'manually_added_data_url')


class UserLastExplorationActivityOneOffJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserLastExplorationActivityOneOffJobTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exp_id = 'exp'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UserLastExplorationActivityOneOffJob.create_new())
        user_jobs_one_off.UserLastExplorationActivityOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def test_that_last_created_time_is_updated(self):
        self.login(self.OWNER_EMAIL)
        self.save_new_valid_exploration(
            self.exp_id, self.owner_id, end_state_name='End')
        self.logout()

        user_models.UserSettingsModel(
            id=self.owner_id,
            gae_id='gae_' + self.owner_id,
            email=self.OWNER_EMAIL,
            last_created_an_exploration=None
        ).put()

        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)

        self._run_one_off_job()

        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNotNone(owner_settings.last_created_an_exploration)
        self.assertIsNotNone(owner_settings.last_edited_an_exploration)

    def test_that_last_edited_time_is_updated(self):
        self.login(self.OWNER_EMAIL)
        self.save_new_valid_exploration(
            self.exp_id, self.owner_id, end_state_name='End')
        self.logout()
        self.login(self.EDITOR_EMAIL)
        exp_services.update_exploration(
            self.editor_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        self.logout()

        user_models.UserSettingsModel(
            id=self.editor_id,
            gae_id='gae_' + self.editor_id,
            email=self.EDITOR_EMAIL,
            last_edited_an_exploration=None
        ).put()

        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNone(editor_settings.last_created_an_exploration)
        self.assertIsNone(editor_settings.last_edited_an_exploration)

        self._run_one_off_job()

        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNotNone(editor_settings.last_edited_an_exploration)
        self.assertIsNone(editor_settings.last_created_an_exploration)

    def test_that_last_edited_and_created_time_both_updated(self):
        self.login(self.OWNER_EMAIL)
        self.save_new_valid_exploration(
            self.exp_id, self.owner_id, end_state_name='End')
        exp_services.update_exploration(
            self.owner_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        self.logout()
        self.login(self.EDITOR_EMAIL)
        exp_services.update_exploration(
            self.editor_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'new objective'
            })], 'Test edit new')
        self.logout()

        user_models.UserSettingsModel(
            id=self.owner_id,
            gae_id='gae_' + self.owner_id,
            email=self.OWNER_EMAIL,
            last_created_an_exploration=None,
            last_edited_an_exploration=None
        ).put()

        user_models.UserSettingsModel(
            id=self.editor_id,
            gae_id='gae_' + self.editor_id,
            email=self.EDITOR_EMAIL,
            last_edited_an_exploration=None
        ).put()

        owner_settings = user_services.get_user_settings(self.owner_id)
        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)
        self.assertIsNone(editor_settings.last_created_an_exploration)
        self.assertIsNone(editor_settings.last_edited_an_exploration)

        self._run_one_off_job()

        owner_settings = user_services.get_user_settings(self.owner_id)
        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNotNone(owner_settings.last_edited_an_exploration)
        self.assertIsNotNone(owner_settings.last_created_an_exploration)
        self.assertIsNotNone(editor_settings.last_edited_an_exploration)
        self.assertIsNone(editor_settings.last_created_an_exploration)

    def test_that_last_edited_and_created_time_are_not_updated(self):
        user_models.UserSettingsModel(
            id=self.owner_id,
            gae_id='gae_' + self.owner_id,
            email=self.OWNER_EMAIL,
            last_created_an_exploration=None,
            last_edited_an_exploration=None
        ).put()

        owner_settings = user_services.get_user_settings(self.owner_id)

        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)

        self._run_one_off_job()

        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)


class CleanupUserSubscriptionsModelUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CleanupUserSubscriptionsModelUnitTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('user@email', 'user')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email('user@email')
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        for exp in explorations:
            subscription_services.subscribe_to_exploration(
                self.user_id, exp.id)
        self.process_and_flush_pending_tasks()

    def test_standard_operation(self):
        for exp_id in python_utils.RANGE(3):
            exp_models.ExplorationModel.get('%s' % exp_id).delete(
                self.owner_id, 'deleted exploration')

        self.assertEqual(
            len(user_models.UserSubscriptionsModel.get(self.owner_id)
                .activity_ids), 3)
        self.assertEqual(
            len(user_models.UserSubscriptionsModel.get(self.user_id)
                .activity_ids), 3)

        job = user_jobs_one_off.CleanupActivityIdsFromUserSubscriptionsModelOneOffJob # pylint: disable=line-too-long
        job_id = job.create_new()
        job.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        self.assertEqual(
            len(user_models.UserSubscriptionsModel.get(self.owner_id)
                .activity_ids), 0)
        self.assertEqual(
            len(user_models.UserSubscriptionsModel.get(self.user_id)
                .activity_ids), 0)
        actual_output = job.get_output(job_id)
        expected_output = [
            u'[u\'Successfully cleaned up UserSubscriptionsModel %s and '
            'removed explorations 0, 1, 2\', 1]' %
            self.owner_id,
            u'[u\'Successfully cleaned up UserSubscriptionsModel %s and '
            'removed explorations 0, 1, 2\', 1]' %
            self.user_id]
        self.assertEqual(sorted(actual_output), sorted(expected_output))
