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

"""Tests for Activity-related jobs."""

from core.domain import exp_domain
from core.domain import activity_jobs_one_off
from core.domain import exp_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils

search_services = models.Registry.import_search_services()

class OneOffReindexActivitiesJobTest(test_utils.GenericTestBase):

    EXP_ID = 'exp_id'
    COLLECTION_ID = 'collection_id'

    def setUp(self):
        super(OneOffReindexActivitiesJobTest, self).setUp()

        # Setup explorations
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s%s' % (self.EXP_ID, i),
            title='title %d' % i,
            category='category%d' % i
        ) for i in xrange(5)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner_id, exp.id)

        self.process_and_flush_pending_tasks()


    def test_standard_operation(self):
        job_id = (activity_jobs_one_off.IndexAllActivitiesJobManager
                  .create_new())
        activity_jobs_one_off.IndexAllActivitiesJobManager.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        indexed_docs = []

        def add_docs_mock(docs, index):
            indexed_docs.extend(docs)
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)

        add_docs_swap = self.swap(
            search_services, 'add_documents_to_index', add_docs_mock)

        with add_docs_swap:
            self.process_and_flush_pending_tasks()

        ids = [doc['id'] for doc in indexed_docs]
        titles = [doc['title'] for doc in indexed_docs]
        categories = [doc['category'] for doc in indexed_docs]

        for index in xrange(5):
            self.assertIn("%s%s" % (self.EXP_ID, index), ids)
            self.assertIn('title %d' % index, titles)
            self.assertIn('category%d' % index, categories)
