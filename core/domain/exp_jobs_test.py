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

"""Jobs for explorations."""

__author__ = 'Frederik Creemers'

from core import jobs
from core.domain import exp_jobs
from core.domain import exp_services
from core.domain import exp_domain
from core.platform import models
(exp_models) = models.Registry.import_models([models.NAMES.exploration])
search_services = models.Registry.import_search_services()
from core.tests import test_utils


class OneOffReindexExplorationsJobTest(test_utils.GenericTestBase):

    EXP_ID = 'exp_id'

    def setUp(self):
        super(OneOffReindexExplorationsJobTest, self).setUp()

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s%s' % (self.EXP_ID, i), 'title %d' % i, 'category%d' % i)
            for i in xrange(5)]

        for exp in explorations:
            exp_services.save_new_exploration('owner_id', exp)


    def test_standard_operation(self):
        job_id = (exp_jobs.IndexAllExplorationsJobManager.create_new())
        exp_jobs.IndexAllExplorationsJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        indexed_docs = []

        def add_docs_mock(docs, index):
            indexed_docs.extend(docs)
            self.assertEqual(index, exp_services.SEARCH_INDEX_EXPLORATIONS)

        add_docs_swap = self.swap(search_services, 'add_documents_to_index', add_docs_mock)

        with add_docs_swap:
            self.process_and_flush_pending_tasks()

        ids = [doc['id'] for doc in indexed_docs]
        titles = [doc['title'] for doc in indexed_docs]
        categories = [doc['category'] for doc in indexed_docs]

        for i in xrange(5):
            self.assertIn("%s%s" % (self.EXP_ID, i), ids)
            self.assertIn('title %d' % i, titles)
            self.assertIn('category%d' % i, categories)
