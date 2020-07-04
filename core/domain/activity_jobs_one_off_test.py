# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.activity_jobs_one_off."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from constants import constants
from core.domain import activity_jobs_one_off
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import python_utils

from google.appengine.ext import ndb

gae_search_services = models.Registry.import_search_services()

(collection_models, exp_models) = models.Registry.import_models(
    [models.NAMES.collection, models.NAMES.exploration])


class ActivityContributorsSummaryOneOffJobTests(test_utils.GenericTestBase):
    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        activity_jobs_one_off.ActivityContributorsSummaryOneOffJob]

    EXP_ID = 'exp_id'
    COL_ID = 'col_id'

    USERNAME_A = 'usernamea'
    USERNAME_B = 'usernameb'
    EMAIL_A = 'emaila@example.com'
    EMAIL_B = 'emailb@example.com'

    def setUp(self):
        super(ActivityContributorsSummaryOneOffJobTests, self).setUp()
        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.signup(self.EMAIL_B, self.USERNAME_B)

        self.user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        self.user_b_id = self.get_user_id_from_email(self.EMAIL_B)

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.ActivityContributorsSummaryOneOffJob
            .create_new())
        activity_jobs_one_off.ActivityContributorsSummaryOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.ActivityContributorsSummaryOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_contributors_for_valid_nonrevert_contribution(self):
        # Let USER A make three commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id)
        collection = self.save_new_valid_collection(self.COL_ID, self.user_a_id)

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            })], 'Changed title.')
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            })], 'Changed Objective.')
        collection_services.update_collection(
            self.user_a_id, self.COL_ID, [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            }], 'Changed title.')
        collection_services.update_collection(
            self.user_a_id, self.COL_ID, [{
                'cmd': 'edit_collection_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            }], 'Changed Objective.')

        output = self._run_one_off_job()
        self.assertEqual([['SUCCESS', 3]], output)

        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual([self.user_a_id], exploration_summary.contributor_ids)
        self.assertEqual(
            {self.user_a_id: 3}, exploration_summary.contributors_summary)

        collection_summary = collection_services.get_collection_summary_by_id(
            collection.id)
        self.assertEqual([self.user_a_id], collection_summary.contributor_ids)
        self.assertEqual(
            {self.user_a_id: 3}, collection_summary.contributors_summary)

    def test_contributors_with_only_reverts_not_included(self):
        # Let USER A make three commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title 1')

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            })], 'Changed title.')
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            })], 'Changed Objective.')

        # Let the second user revert version 3 to version 2.
        exp_services.revert_exploration(self.user_b_id, self.EXP_ID, 3, 2)

        output = self._run_one_off_job()
        self.assertEqual([['SUCCESS', 1]], output)

        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual([self.user_a_id], exploration_summary.contributor_ids)
        self.assertEqual(
            {self.user_a_id: 2}, exploration_summary.contributors_summary)

    def test_reverts_not_counted(self):
        # Let USER A make 3 non-revert commits.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id, title='Exploration Title')
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New Exploration Title'
            })], 'Changed title.')
        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'New Objective'
            })], 'Changed Objective.')

        # Let USER A revert version 3 to version 2.
        exp_services.revert_exploration(self.user_a_id, self.EXP_ID, 3, 2)

        output = self._run_one_off_job()
        self.assertEqual([['SUCCESS', 1]], output)

        # Check that USER A's number of contributions is equal to 2.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        self.assertEqual([self.user_a_id], exploration_summary.contributor_ids)
        self.assertEqual(
            {self.user_a_id: 2}, exploration_summary.contributors_summary)

    def test_nonhuman_committers_not_counted(self):
        # Create a commit with the system user id.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, feconf.SYSTEM_COMMITTER_ID, title='Original Title')
        collection = self.save_new_valid_collection(self.COL_ID, self.user_a_id)

        # Create commits with all the system user ids.
        for system_id in constants.SYSTEM_USER_IDS:
            exp_services.update_exploration(
                system_id, self.EXP_ID, [exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'Title changed by %s' % system_id
                })], 'Changed title.')
            collection_services.update_collection(
                system_id, self.COL_ID, [{
                    'cmd': 'edit_collection_property',
                    'property_name': 'title',
                    'new_value': 'New Exploration Title'
                }], 'Changed title.')

        output = self._run_one_off_job()
        self.assertEqual([['SUCCESS', 3]], output)

        # Check that no system id was added to the exploration's
        # contributor's summary.
        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            exploration.id)
        collection_summary = collection_services.get_collection_summary_by_id(
            collection.id)
        for system_id in constants.SYSTEM_USER_IDS:
            self.assertNotIn(
                system_id,
                exploration_summary.contributors_summary)
            self.assertNotIn(
                system_id,
                exploration_summary.contributor_ids)
            self.assertNotIn(
                system_id,
                collection_summary.contributors_summary)
            self.assertNotIn(
                system_id,
                collection_summary.contributor_ids)

    def test_deleted_exploration(self):
        self.save_new_valid_exploration(
            self.EXP_ID, self.user_a_id)
        exp_services.delete_exploration(feconf.SYSTEM_COMMITTER_ID, self.EXP_ID)

        self.process_and_flush_pending_tasks()

        output = self._run_one_off_job()
        self.assertEqual([], output)


class AuditContributorsOneOffJobTests(test_utils.GenericTestBase):

    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    USER_4_ID = 'user_4_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = activity_jobs_one_off.AuditContributorsOneOffJob.create_new()
        activity_jobs_one_off.AuditContributorsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.AuditContributorsOneOffJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        for item in eval_output:
            if isinstance(item[1], list):
                item[1] = [ast.literal_eval(triple) for triple in item[1]]
        return eval_output

    def test_correct_models(self):
        exp_models.ExpSummaryModel(
            id='id_1',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_1_ID],
            contributors_summary={self.USER_1_ID: 4},
        ).put()

        collection_models.CollectionSummaryModel(
            id='id_1',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_2_ID],
            contributors_summary={self.USER_2_ID: 4},
        ).put()

        output = self._run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertEqual([['SUCCESS', 2]], output)

    def test_duplicate_ids_models(self):
        exp_models.ExpSummaryModel(
            id='id_1',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_1_ID, self.USER_1_ID],
            contributors_summary={self.USER_1_ID: 4},
        ).put()

        collection_models.CollectionSummaryModel(
            id='id_2',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_2_ID, self.USER_2_ID],
            contributors_summary={self.USER_2_ID: 4},
        ).put()

        output = self._run_one_off_job()

        self.assertEqual(len(output), 2)
        self.assertIn(['SUCCESS', 2], output)
        self.assertIn([
            'DUPLICATE_IDS', [
                ('id_1', [self.USER_1_ID, self.USER_1_ID], {self.USER_1_ID: 4}),
                ('id_2', [self.USER_2_ID, self.USER_2_ID], {self.USER_2_ID: 4})
            ]], output)

    def test_missing_in_summary_models(self):
        exp_models.ExpSummaryModel(
            id='id_1',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_1_ID, self.USER_2_ID],
            contributors_summary={self.USER_1_ID: 4},
        ).put()

        collection_models.CollectionSummaryModel(
            id='id_2',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_1_ID, self.USER_2_ID],
            contributors_summary={self.USER_2_ID: 4},
        ).put()

        output = self._run_one_off_job()

        self.assertEqual(len(output), 2)
        self.assertIn(['SUCCESS', 2], output)
        self.assertIn([
            'MISSING_IN_SUMMARY', [
                ('id_1', [self.USER_1_ID, self.USER_2_ID], {self.USER_1_ID: 4}),
                ('id_2', [self.USER_1_ID, self.USER_2_ID], {self.USER_2_ID: 4})
            ]], output)

    def test_missing_in_ids_models(self):
        exp_models.ExpSummaryModel(
            id='id_1',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_1_ID],
            contributors_summary={self.USER_1_ID: 2, self.USER_2_ID: 4},
        ).put()

        collection_models.CollectionSummaryModel(
            id='id_2',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_2_ID],
            contributors_summary={self.USER_1_ID: 1, self.USER_2_ID: 3},
        ).put()

        output = self._run_one_off_job()

        self.assertEqual(len(output), 2)
        self.assertIn(['SUCCESS', 2], output)
        self.assertIn([
            'MISSING_IN_IDS', [
                (
                    'id_1',
                    [self.USER_1_ID],
                    {self.USER_1_ID: 2, self.USER_2_ID: 4}
                ),
                (
                    'id_2',
                    [self.USER_2_ID],
                    {self.USER_1_ID: 1, self.USER_2_ID: 3}
                )
            ]], output)

    def test_combined_models(self):
        exp_models.ExpSummaryModel(
            id='id_1',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_1_ID, self.USER_1_ID, self.USER_2_ID],
            contributors_summary={self.USER_2_ID: 4},
        ).put()

        collection_models.CollectionSummaryModel(
            id='id_2',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            contributor_ids=[self.USER_2_ID, self.USER_3_ID],
            contributors_summary={self.USER_1_ID: 4, self.USER_2_ID: 4},
        ).put()

        output = self._run_one_off_job()

        self.assertEqual(len(output), 4)
        self.assertIn(['SUCCESS', 2], output)
        self.assertIn([
            'DUPLICATE_IDS', [(
                'id_1',
                [self.USER_1_ID, self.USER_1_ID, self.USER_2_ID],
                {self.USER_2_ID: 4}
            )]], output)
        self.assertIn([
            'MISSING_IN_SUMMARY', [
                (
                    'id_1',
                    [self.USER_1_ID, self.USER_1_ID, self.USER_2_ID],
                    {self.USER_2_ID: 4}
                ),
                (
                    'id_2',
                    [self.USER_2_ID, self.USER_3_ID],
                    {self.USER_1_ID: 4, self.USER_2_ID: 4}
                )
            ]], output)
        self.assertIn([
            'MISSING_IN_IDS', [(
                'id_2',
                [self.USER_2_ID, self.USER_3_ID],
                {self.USER_1_ID: 4, self.USER_2_ID: 4}
            )]], output)


class OneOffReindexActivitiesJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(OneOffReindexActivitiesJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for collection in collections:
            collection_services.save_new_collection(self.owner_id, collection)
            rights_manager.publish_collection(self.owner, collection.id)

        self.process_and_flush_pending_tasks()

    def test_standard_operation(self):
        job_id = (
            activity_jobs_one_off.IndexAllActivitiesJobManager.create_new())
        activity_jobs_one_off.IndexAllActivitiesJobManager.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        indexed_docs = []

        def mock_add_documents_to_index(docs, index):
            indexed_docs.extend(docs)
            self.assertIn(index, (search_services.SEARCH_INDEX_EXPLORATIONS,
                                  search_services.SEARCH_INDEX_COLLECTIONS))

        add_docs_swap = self.swap(
            gae_search_services, 'add_documents_to_index',
            mock_add_documents_to_index)

        with add_docs_swap:
            self.process_and_flush_pending_tasks()

        ids = [doc['id'] for doc in indexed_docs]
        titles = [doc['title'] for doc in indexed_docs]
        categories = [doc['category'] for doc in indexed_docs]

        for index in python_utils.RANGE(5):
            self.assertIn('%s' % index, ids)
            self.assertIn('title %d' % index, titles)
            self.assertIn('category%d' % index, categories)

        self.assertIsNone(
            activity_jobs_one_off.IndexAllActivitiesJobManager.reduce(
                'key', 'value'))


class MockCollectionCommitLogEntryModel(
        collection_models.CollectionCommitLogEntryModel):
    """Mock CollectionCommitLogEntryModel so that it allows to set username."""

    username = ndb.StringProperty(indexed=True, required=False)


class RemoveCommitUsernamesOneOffJobTests(test_utils.GenericTestBase):

    USER_1_ID = 'user_1_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.RemoveCommitUsernamesOneOffJob.create_new())
        activity_jobs_one_off.RemoveCommitUsernamesOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.RemoveCommitUsernamesOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_one_commit_model_with_username(self):
        with self.swap(
            collection_models, 'CollectionCommitLogEntryModel',
            MockCollectionCommitLogEntryModel
        ):
            original_commit_model = (
                collection_models.CollectionCommitLogEntryModel(
                    id='id',
                    user_id='committer_id',
                    username='username',
                    collection_id='col_id',
                    commit_type='create',
                    commit_message='Message',
                    commit_cmds=[],
                    version=1,
                    post_commit_status='public',
                    post_commit_community_owned=False,
                    post_commit_is_private=False
                )
            )
            original_commit_model.put()

            # pylint: disable=protected-access
            self.assertIsNotNone(original_commit_model.username)
            self.assertIn('username', original_commit_model._values)
            self.assertIn('username', original_commit_model._properties)

            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_REMOVED - MockCollectionCommitLogEntryModel', 1]],
                output)

            migrated_commit_model = (
                collection_models.CollectionCommitLogEntryModel.get_by_id('id'))
            self.assertIsNone(migrated_commit_model.username)
            self.assertNotIn('username', migrated_commit_model._values)
            self.assertNotIn('username', migrated_commit_model._properties)
            self.assertEqual(
                original_commit_model.last_updated,
                migrated_commit_model.last_updated)
            # pylint: enable=protected-access

    def test_one_commit_model_without_username(self):
        original_commit_model = (
            collection_models.CollectionCommitLogEntryModel(
                id='id',
                user_id='committer_id',
                collection_id='col_id',
                commit_type='create',
                commit_message='Message',
                commit_cmds=[],
                version=1,
                post_commit_status='public',
                post_commit_community_owned=False,
                post_commit_is_private=False
            )
        )
        original_commit_model.put()

        # pylint: disable=protected-access
        self.assertNotIn('username', original_commit_model._values)
        self.assertNotIn('username', original_commit_model._properties)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - CollectionCommitLogEntryModel', 1]],
            output)

        migrated_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id'))
        self.assertNotIn('username', migrated_commit_model._values)
        self.assertNotIn('username', migrated_commit_model._properties)
        self.assertEqual(
            original_commit_model.last_updated,
            migrated_commit_model.last_updated)
