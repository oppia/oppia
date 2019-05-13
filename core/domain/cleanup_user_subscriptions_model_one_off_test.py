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

"""Unit tests for core.domain.cleanup_user_subscriptions_model_one_off."""

from core.domain import cleanup_user_subscriptions_model_one_off
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils

(user_models, exp_models) = (models.Registry.import_models(
    [models.NAMES.user, models.NAMES.exploration]))


class CleanupUserSubscriptionsModelUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CleanupUserSubscriptionsModelUnitTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email('user@email')
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in xrange(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        for exp in explorations:
            subscription_services.subscribe_to_exploration(
                self.user_id, exp.id)
        self.process_and_flush_pending_tasks()

    def test_standard_operation(self):
        for exp_id in xrange(3):
            exp_models.ExplorationModel.get('%s' % exp_id).delete(
                self.owner_id, 'deleted exploration')

        self.assertEqual(
            len(user_models.UserSubscriptionsModel.get(self.owner_id)
                .activity_ids), 3)
        self.assertEqual(
            len(user_models.UserSubscriptionsModel.get(self.user_id)
                .activity_ids), 3)

        job = cleanup_user_subscriptions_model_one_off.CleanupActivityIdsFromUserSubscriptionsModelOneOffJob # pylint: disable=line-too-long
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
            u'[u\'Successfully cleaned up UserSubscriptionsModel\', 2]']
        self.assertEqual(actual_output, expected_output)
