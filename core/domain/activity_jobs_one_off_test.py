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
import datetime

from constants import constants
from core.domain import activity_jobs_one_off
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import topic_domain
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import python_utils

from google.appengine.ext import ndb

gae_search_services = models.Registry.import_search_services()

(
    base_models, collection_models,
    exp_models, topic_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection,
    models.NAMES.exploration, models.NAMES.topic
])


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
            self.assertIn(index, (
                search_services.SEARCH_INDEX_EXPLORATIONS,
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

            self.assertIsNotNone(original_commit_model.username)
            self.assertIn('username', original_commit_model._values)  # pylint: disable=protected-access
            self.assertIn('username', original_commit_model._properties)  # pylint: disable=protected-access

            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_REMOVED - MockCollectionCommitLogEntryModel', 1]],
                output)

            migrated_commit_model = (
                collection_models.CollectionCommitLogEntryModel.get_by_id('id'))
            self.assertIsNone(migrated_commit_model.username)
            self.assertNotIn('username', migrated_commit_model._values)  # pylint: disable=protected-access
            self.assertNotIn('username', migrated_commit_model._properties)  # pylint: disable=protected-access
            self.assertEqual(
                original_commit_model.last_updated,
                migrated_commit_model.last_updated)

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

        self.assertNotIn('username', original_commit_model._values)  # pylint: disable=protected-access
        self.assertNotIn('username', original_commit_model._properties)  # pylint: disable=protected-access

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - CollectionCommitLogEntryModel', 1]],
            output)

        migrated_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id'))
        self.assertNotIn('username', migrated_commit_model._values)  # pylint: disable=protected-access
        self.assertNotIn('username', migrated_commit_model._properties)  # pylint: disable=protected-access
        self.assertEqual(
            original_commit_model.last_updated,
            migrated_commit_model.last_updated)


class FixCommitLastUpdatedOneOffJobTests(test_utils.GenericTestBase):

    USER_1_ID = 'user_1_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.FixCommitLastUpdatedOneOffJob.create_new())
        activity_jobs_one_off.FixCommitLastUpdatedOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.FixCommitLastUpdatedOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_one_commit_model_last_updated_before(self):
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
                post_commit_is_private=False,
                created_on=datetime.datetime.strptime(
                    '2020-06-18T22:00:00Z', '%Y-%m-%dT%H:%M:%SZ'),
                last_updated=datetime.datetime.strptime(
                    '2020-06-18T22:01:00Z', '%Y-%m-%dT%H:%M:%SZ')
            )
        )
        original_commit_model.put(update_last_updated_time=False)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_NEWLY_CREATED - CollectionCommitLogEntryModel', 1]],
            output)

        migrated_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id'))
        self.assertEqual(
            original_commit_model.created_on,
            migrated_commit_model.created_on)
        self.assertEqual(
            original_commit_model.last_updated,
            migrated_commit_model.last_updated)

    def test_one_commit_model_last_updated_during(self):
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
                post_commit_is_private=False,
                created_on=datetime.datetime.strptime(
                    '2019-06-29T01:00:00Z', '%Y-%m-%dT%H:%M:%SZ'),
                last_updated=datetime.datetime.strptime(
                    '2020-06-29T11:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
            )
        )
        original_commit_model.put(update_last_updated_time=False)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_FIXED - CollectionCommitLogEntryModel', 1]], output)

        migrated_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id'))
        self.assertEqual(
            original_commit_model.created_on,
            migrated_commit_model.created_on)
        self.assertNotEqual(
            original_commit_model.last_updated,
            migrated_commit_model.last_updated)
        self.assertEqual(
            original_commit_model.created_on,
            migrated_commit_model.last_updated)

    def test_one_commit_model_last_updated_after(self):
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
                post_commit_is_private=False,
                created_on=datetime.datetime.strptime(
                    '2020-07-01T08:59:59Z', '%Y-%m-%dT%H:%M:%SZ'),
                last_updated=datetime.datetime.strptime(
                    '2020-07-01T09:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
            )
        )
        original_commit_model.put(update_last_updated_time=False)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_NEWLY_CREATED - CollectionCommitLogEntryModel', 1]],
            output)

        migrated_commit_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id'))
        self.assertEqual(
            original_commit_model.created_on,
            migrated_commit_model.created_on)
        self.assertEqual(
            original_commit_model.last_updated,
            migrated_commit_model.last_updated)

    def test_multiple_commit_models_admins(self):
        original_commit_model_1 = (
            collection_models.CollectionCommitLogEntryModel(
                id='id1',
                user_id=feconf.SYSTEM_COMMITTER_ID,
                collection_id='col_id',
                commit_type='create',
                commit_message='Message',
                commit_cmds=[],
                version=1,
                post_commit_status='public',
                post_commit_community_owned=False,
                post_commit_is_private=False,
                created_on=datetime.datetime.strptime(
                    '2020-07-01T09:59:59Z', '%Y-%m-%dT%H:%M:%SZ'),
                last_updated=datetime.datetime.strptime(
                    '2020-07-01T11:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
            )
        )
        original_commit_model_1.put(update_last_updated_time=False)
        original_commit_model_2 = (
            collection_models.CollectionCommitLogEntryModel(
                id='id2',
                user_id=feconf.MIGRATION_BOT_USER_ID,
                collection_id='col_id',
                commit_type='create',
                commit_message='Message',
                commit_cmds=[],
                version=1,
                post_commit_status='public',
                post_commit_community_owned=False,
                post_commit_is_private=False,
                created_on=datetime.datetime.strptime(
                    '2020-07-01T09:59:59Z', '%Y-%m-%dT%H:%M:%SZ'),
                last_updated=datetime.datetime.strptime(
                    '2020-07-01T11:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
            )
        )
        original_commit_model_2.put(update_last_updated_time=False)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ADMIN - CollectionCommitLogEntryModel', 2]], output)

        migrated_commit_model_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id1'))
        self.assertEqual(
            original_commit_model_1.created_on,
            migrated_commit_model_1.created_on)
        self.assertEqual(
            original_commit_model_1.last_updated,
            migrated_commit_model_1.last_updated)

        migrated_commit_model_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id2'))
        self.assertEqual(
            original_commit_model_2.created_on,
            migrated_commit_model_2.created_on)
        self.assertEqual(
            original_commit_model_2.last_updated,
            migrated_commit_model_2.last_updated)

    def test_multiple_commit_models_last_updated_wrong(self):
        original_commit_model_1 = (
            collection_models.CollectionCommitLogEntryModel(
                id='id1',
                user_id='committer_id',
                collection_id='col_id',
                commit_type='create',
                commit_message='Message',
                commit_cmds=[],
                version=1,
                post_commit_status='public',
                post_commit_community_owned=False,
                post_commit_is_private=False,
                created_on=datetime.datetime.strptime(
                    '2020-07-01T09:59:59Z', '%Y-%m-%dT%H:%M:%SZ'),
                last_updated=datetime.datetime.strptime(
                    '2020-07-01T09:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
            )
        )
        original_commit_model_1.put(update_last_updated_time=False)
        original_commit_model_2 = (
            collection_models.CollectionCommitLogEntryModel(
                id='id2',
                user_id='committer_id',
                collection_id='col_id',
                commit_type='create',
                commit_message='Message',
                commit_cmds=[],
                version=1,
                post_commit_status='public',
                post_commit_community_owned=False,
                post_commit_is_private=False,
                created_on=datetime.datetime.strptime(
                    '2020-07-01T09:59:59Z', '%Y-%m-%dT%H:%M:%SZ'),
                last_updated=datetime.datetime.strptime(
                    '2020-07-20T09:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
            )
        )
        original_commit_model_2.put(update_last_updated_time=False)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['FAILURE_INCORRECT - CollectionCommitLogEntryModel',
              ['id1', 'id2']]],
            output)

        migrated_commit_model_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id1'))
        self.assertEqual(
            original_commit_model_1.created_on,
            migrated_commit_model_1.created_on)
        self.assertEqual(
            original_commit_model_1.last_updated,
            migrated_commit_model_1.last_updated)

        migrated_commit_model_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id('id2'))
        self.assertEqual(
            original_commit_model_2.created_on,
            migrated_commit_model_2.created_on)
        self.assertEqual(
            original_commit_model_2.last_updated,
            migrated_commit_model_2.last_updated)


class MockCollectionRightsModel(
        collection_models.CollectionRightsModel):
    """Mock CollectionRightsModel so that it uses old version of
    _trusted_commit.
    """

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this overrides the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """
        base_models.VersionedModel._trusted_commit(  # pylint: disable=protected-access
            self, committer_id, commit_type, commit_message, commit_cmds)

        # Create and delete events will already be recorded in the
        # CollectionModel.
        if commit_type not in ['create', 'delete']:
            # TODO(msl): Test if put_async() leads to any problems (make
            # sure summary dicts get updated correctly when collections
            # are changed).
            collection_models.CollectionCommitLogEntryModel(
                id=('rights-%s-%s' % (self.id, self.version)),
                user_id=committer_id,
                collection_id=self.id,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=None,
                post_commit_status=self.status,
                post_commit_community_owned=self.community_owned,
                post_commit_is_private=(
                    self.status == constants.ACTIVITY_STATUS_PRIVATE)
            ).put_async()


class MockExplorationRightsModel(exp_models.ExplorationRightsModel):
    """Mock ExplorationRightsModel so that it uses old version of
    _trusted_commit.
    """

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """
        base_models.VersionedModel._trusted_commit(  # pylint: disable=protected-access
            self, committer_id, commit_type, commit_message, commit_cmds)

        # Create and delete events will already be recorded in the
        # ExplorationModel.
        if commit_type not in ['create', 'delete']:
            # TODO(msl): Test if put_async() leads to any problems (make
            # sure summary dicts get updated correctly when explorations
            # are changed).
            exp_models.ExplorationCommitLogEntryModel(
                id=('rights-%s-%s' % (self.id, self.version)),
                user_id=committer_id,
                exploration_id=self.id,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=None,
                post_commit_status=self.status,
                post_commit_community_owned=self.community_owned,
                post_commit_is_private=(
                    self.status == constants.ACTIVITY_STATUS_PRIVATE)
            ).put_async()


class MockTopicRightsModel(topic_models.TopicRightsModel):
    """Mock TopicRightsModel so that it uses old version of _trusted_commit."""

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """
        base_models.VersionedModel._trusted_commit(  # pylint: disable=protected-access
            self, committer_id, commit_type, commit_message, commit_cmds)

        topic_rights = MockTopicRightsModel.get_by_id(self.id)
        if topic_rights.topic_is_published:
            status = constants.ACTIVITY_STATUS_PUBLIC
        else:
            status = constants.ACTIVITY_STATUS_PRIVATE

        topic_models.TopicCommitLogEntryModel(
            id=('rights-%s-%s' % (self.id, self.version)),
            user_id=committer_id,
            topic_id=self.id,
            commit_type=commit_type,
            commit_message=commit_message,
            commit_cmds=commit_cmds,
            version=None,
            post_commit_status=status,
            post_commit_community_owned=False,
            post_commit_is_private=not topic_rights.topic_is_published
        ).put()


class AddMentionedUserIdsContentJobTests(test_utils.GenericTestBase):

    COL_1_ID = 'col_1_id'
    EXP_1_ID = 'exp_1_id'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    USER_4_ID = 'user_4_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.AddMentionedUserIdsContentJob.create_new())
        activity_jobs_one_off.AddMentionedUserIdsContentJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.AddMentionedUserIdsContentJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return [
            [key, sorted(values) if isinstance(values, list) else values]
            for key, values in eval_output]

    def setUp(self):
        super(AddMentionedUserIdsContentJobTests, self).setUp()

        self.collection_rights_model_swap = self.swap(
            collection_models,
            'CollectionRightsModel',
            MockCollectionRightsModel)
        self.exploration_rights_model_swap = self.swap(
            exp_models, 'ExplorationRightsModel', MockExplorationRightsModel)
        self.topic_rights_model_swap = self.swap(
            topic_models, 'TopicRightsModel', MockTopicRightsModel)

    def test_add_mentioned_user_ids_to_collection_rights_snapshot(self):
        with self.collection_rights_model_swap:
            collection_model = collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0
            )
            collection_model.save(
                'cid', 'Created new collection rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            collection_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
            collection_model.save(
                'cid', 'Change owner',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-CollectionRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.COL_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).mentioned_user_ids)

    def test_add_mentioned_user_ids_to_exploration_rights_snapshot(self):
        with self.exploration_rights_model_swap:
            exp_model = exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[self.USER_4_ID],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)
            exp_model.save(
                'cid', 'Created new exploration rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            exp_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
            exp_model.save(
                'cid', 'Change owner',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-ExplorationRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).mentioned_user_ids)

    def test_add_mentioned_user_ids_to_topic_rights_snapshot(self):
        with self.topic_rights_model_swap:
            topic_model = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])
            topic_model.commit(
                'cid', 'Created new topic rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            topic_model.manager_ids = [self.USER_2_ID, self.USER_3_ID]
            topic_model.commit(
                'cid', 'Change manager',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-TopicRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_2_ID, self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).mentioned_user_ids)

    def test_add_mentioned_user_ids_to_multiple_rights_snapshots(self):
        with self.collection_rights_model_swap:
            collection_model = collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0
            )
            collection_model.save(
                'cid', 'Created new collection rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            collection_model.editor_ids = [self.USER_1_ID, self.USER_4_ID]
            collection_model.save(
                'cid', 'Add editors',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_4_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        with self.exploration_rights_model_swap:
            exp_model = exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[self.USER_4_ID],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)
            exp_model.save(
                'cid', 'Created new exploration rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            exp_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
            exp_model.save(
                'cid', 'Change owner',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_4_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        with self.topic_rights_model_swap:
            topic_model_1 = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])
            topic_model_1.commit(
                'cid', 'Created new topic rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            topic_model_1.manager_ids = [self.USER_2_ID, self.USER_3_ID]
            topic_model_1.commit(
                'cid', 'Change manager',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])
            topic_model_2 = topic_models.TopicRightsModel(
                id=self.TOP_2_ID,
                manager_ids=[self.USER_1_ID])
            topic_model_2.commit(
                'cid', 'Created new topic rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            topic_model_2.manager_ids = [self.USER_1_ID, self.USER_4_ID]
            topic_model_2.commit(
                'cid', 'Change manager',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertIn(
            ['SUCCESS-CollectionRightsSnapshotContentModel', 2], output)
        self.assertIn(
            ['SUCCESS-ExplorationRightsSnapshotContentModel', 2], output)
        self.assertIn(['SUCCESS-TopicRightsSnapshotContentModel', 4], output)

        self.assertItemsEqual(
            [self.USER_1_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.COL_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_4_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_2_ID, self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_2_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_4_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_2_ID).mentioned_user_ids)


class AddMentionedUserIdsMetadataJobTests(test_utils.GenericTestBase):

    COL_1_ID = 'col_1_id'
    EXP_1_ID = 'exp_1_id'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    USER_4_ID = 'user_4_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.AddMentionedUserIdsMetadataJob.create_new())
        activity_jobs_one_off.AddMentionedUserIdsMetadataJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.AddMentionedUserIdsMetadataJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return [
            [key, sorted(values) if isinstance(values, list) else values]
            for key, values in eval_output]

    def setUp(self):
        super(AddMentionedUserIdsMetadataJobTests, self).setUp()

        self.collection_rights_model_swap = self.swap(
            collection_models,
            'CollectionRightsModel',
            MockCollectionRightsModel)
        self.exploration_rights_model_swap = self.swap(
            exp_models, 'ExplorationRightsModel', MockExplorationRightsModel)
        self.topic_rights_model_swap = self.swap(
            topic_models, 'TopicRightsModel', MockTopicRightsModel)

    def test_add_mentioned_user_ids_to_collection_rights_snapshot(self):
        with self.collection_rights_model_swap:
            collection_model = collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[self.USER_1_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0
            )
            collection_model.save(
                'cid',
                'Created new collection rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            collection_model.owner_ids = [self.USER_3_ID]
            collection_model.save(
                'cid',
                'Change owner',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-CollectionRightsSnapshotMetadataModel', 2]])
        self.assertItemsEqual(
            [],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.COL_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).mentioned_user_ids)

    def test_add_mentioned_user_ids_to_exploration_rights_snapshot(self):
        with self.exploration_rights_model_swap:
            exp_model = exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)
            exp_model.save(
                'cid', 'Created new exploration rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            exp_model.owner_ids = [self.USER_3_ID]
            exp_model.save(
                'cid',
                'Change owner',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2]])
        self.assertItemsEqual(
            [],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).mentioned_user_ids)

    def test_add_mentioned_user_ids_to_topic_rights_snapshot(self):
        with self.topic_rights_model_swap:
            topic_model = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID])
            topic_model.commit(
                'cid',
                'Created new topic rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            topic_model.manager_ids = [self.USER_1_ID, self.USER_3_ID]
            topic_model.commit(
                'cid',
                'Add manager',
                [{
                    'cmd': topic_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': topic_domain.ROLE_NONE,
                    'new_role': topic_domain.ROLE_MANAGER
                }])
            topic_model.manager_ids = [self.USER_3_ID]
            topic_model.commit(
                'cid',
                'Remove manager',
                [{
                    'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                    'removed_user_id': self.USER_1_ID,
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-TopicRightsSnapshotMetadataModel', 3]])
        self.assertItemsEqual(
            [],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-3' % self.TOP_1_ID).mentioned_user_ids)

    def test_add_mentioned_user_ids_to_multiple_rights_snapshots(self):
        with self.collection_rights_model_swap:
            collection_model = collection_models.CollectionRightsModel(
                id=self.COL_1_ID,
                owner_ids=[],
                editor_ids=[self.USER_1_ID],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0
            )
            collection_model.save(
                'cid',
                'Created new collection rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            collection_model.editor_ids = [self.USER_1_ID, self.USER_4_ID]
            collection_model.save(
                'cid',
                'Add editor',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_4_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_EDITOR
                }])

        with self.exploration_rights_model_swap:
            exp_model = exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_1_ID, self.USER_2_ID],
                editor_ids=[],
                voice_artist_ids=[],
                viewer_ids=[self.USER_4_ID],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)
            exp_model.save(
                'cid', 'Created new exploration rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            exp_model.owner_ids = [
                self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
            exp_model.save(
                'cid',
                'Add owner',
                [{
                    'cmd': rights_manager.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_manager.ROLE_NONE,
                    'new_role': rights_manager.ROLE_OWNER
                }])

        with self.topic_rights_model_swap:
            topic_model_1 = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])
            topic_model_1.commit(
                'cid',
                'Created new topic rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            topic_model_1.manager_ids = [
                self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
            topic_model_1.commit(
                'cid',
                'Add manager',
                [{
                    'cmd': topic_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': topic_domain.ROLE_NONE,
                    'new_role': topic_domain.ROLE_MANAGER
                }])
            topic_model_2 = topic_models.TopicRightsModel(
                id=self.TOP_2_ID,
                manager_ids=[self.USER_1_ID, self.USER_4_ID])
            topic_model_2.commit(
                'cid', 'Created new topic rights',
                [{'cmd': rights_manager.CMD_CREATE_NEW}])
            topic_model_2.manager_ids = [self.USER_4_ID]
            topic_model_2.commit(
                'cid', 'Remove manager',
                [{
                    'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                    'removed_user_id': self.USER_1_ID,
                }])

        output = self._run_one_off_job()
        self.assertIn(
            ['SUCCESS-CollectionRightsSnapshotMetadataModel', 2], output)
        self.assertIn(
            ['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2], output)
        self.assertIn(['SUCCESS-TopicRightsSnapshotMetadataModel', 4], output)

        self.assertItemsEqual(
            [],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.COL_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_4_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_2_ID).mentioned_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_2_ID).mentioned_user_ids)
