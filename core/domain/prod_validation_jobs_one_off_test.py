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

"""Unit tests for core.domain.prod_validation_jobs_one_off."""

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import prod_validation_jobs_one_off
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils

gae_search_services = models.Registry.import_search_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'


class ProdValidationJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ProdValidationJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in xrange(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in xrange(3, 6)]

        for collection in collections:
            collection_services.save_new_collection(self.owner_id, collection)
            rights_manager.publish_collection(self.owner, collection.id)

        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', None, 'a subject', 'some text')

        subscription_services.subscribe_to_thread(
            self.user_id, thread_id)
        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)
        for exp in explorations:
            subscription_services.subscribe_to_exploration(
                self.user_id, exp.id)
        for collection in collections:
            subscription_services.subscribe_to_collection(
                self.user_id, collection.id)
        self.process_and_flush_pending_tasks()

    def test_standard_operation(self):
        job = prod_validation_jobs_one_off.ProdValidationAuditOneOffJob
        job_id = (
            job.create_new())
        job.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        actual_output = job.get_output(job_id)
        expected_output = [
            u'[u\'fully-validated UserSubscriptionModels\', 2]']
        self.assertEqual(actual_output, expected_output)

    def test_external_id_relationship_failure(self):
        nonexist_thread_id = 'nonexist_thread_id'
        subscription_services.subscribe_to_thread(
            self.user_id, nonexist_thread_id)

        job = prod_validation_jobs_one_off.ProdValidationAuditOneOffJob
        job_id = (
            job.create_new())
        job.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        actual_output = job.get_output(job_id)
        expected_output = [
            (
                u'[u\'failed validation check for general_feedback_thread_ids '
                'field check of UserSubscriptionModel\', '
                '[u"Model id 110211048197157141232: based on '
                'field general_feedback_thread_ids having value '
                'nonexist_thread_id, expect model GeneralFeedbackThreadModel '
                'with id nonexist_thread_id but it doesn\'t exist"]]'),
            u'[u\'fully-validated UserSubscriptionModels\', 1]']
        self.assertEqual(sorted(actual_output), sorted(expected_output))
