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
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import search_services
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

datastore_services = models.Registry.import_datastore_services()
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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
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

        self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
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

        self.process_and_flush_pending_mapreduce_tasks()

    def test_standard_operation(self):
        job_id = (
            activity_jobs_one_off.IndexAllActivitiesJobManager.create_new())
        activity_jobs_one_off.IndexAllActivitiesJobManager.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
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
            self.process_and_flush_pending_mapreduce_tasks()

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

    username = datastore_services.StringProperty(indexed=True, required=False)


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
            ).put()


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
            ).put()


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


class AddContentUserIdsContentJobTests(test_utils.GenericTestBase):

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
            activity_jobs_one_off.AddContentUserIdsContentJob.create_new())
        activity_jobs_one_off.AddContentUserIdsContentJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            activity_jobs_one_off.AddContentUserIdsContentJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return [
            [key, sorted(values) if isinstance(values, list) else values]
            for key, values in eval_output]

    def setUp(self):
        super(AddContentUserIdsContentJobTests, self).setUp()

        self.collection_rights_model_swap = self.swap(
            collection_models,
            'CollectionRightsModel',
            MockCollectionRightsModel)
        self.exploration_rights_model_swap = self.swap(
            exp_models, 'ExplorationRightsModel', MockExplorationRightsModel)
        self.topic_rights_model_swap = self.swap(
            topic_models, 'TopicRightsModel', MockTopicRightsModel)

    def test_add_content_user_ids_to_collection_rights_snapshot(self):
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            collection_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
            collection_model.save(
                'cid', 'Change owner',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-CollectionRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.COL_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).content_user_ids)

    def test_add_content_user_ids_to_exploration_rights_snapshot(self):
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            exp_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
            exp_model.save(
                'cid', 'Change owner',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-ExplorationRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).content_user_ids)

    def test_add_content_user_ids_to_topic_rights_snapshot(self):
        with self.topic_rights_model_swap:
            topic_model = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])
            topic_model.commit(
                'cid', 'Created new topic rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            topic_model.manager_ids = [self.USER_2_ID, self.USER_3_ID]
            topic_model.commit(
                'cid', 'Change manager',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-TopicRightsSnapshotContentModel', 2]])
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_2_ID, self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).content_user_ids)

    def test_add_content_user_ids_to_multiple_rights_snapshots(self):
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            collection_model.editor_ids = [self.USER_1_ID, self.USER_4_ID]
            collection_model.save(
                'cid', 'Add editors',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_4_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            exp_model.owner_ids = [self.USER_1_ID, self.USER_3_ID]
            exp_model.save(
                'cid', 'Change owner',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_4_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])

        with self.topic_rights_model_swap:
            topic_model_1 = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])
            topic_model_1.commit(
                'cid', 'Created new topic rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            topic_model_1.manager_ids = [self.USER_2_ID, self.USER_3_ID]
            topic_model_1.commit(
                'cid', 'Change manager',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])
            topic_model_2 = topic_models.TopicRightsModel(
                id=self.TOP_2_ID,
                manager_ids=[self.USER_1_ID])
            topic_model_2.commit(
                'cid', 'Created new topic rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            topic_model_2.manager_ids = [self.USER_1_ID, self.USER_4_ID]
            topic_model_2.commit(
                'cid', 'Change manager',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
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
            .get_by_id('%s-1' % self.COL_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_4_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID, self.USER_3_ID, self.USER_4_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_2_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_2_ID, self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_2_ID).content_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID, self.USER_4_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_2_ID).content_user_ids)


class AddCommitCmdsUserIdsMetadataJobTests(test_utils.GenericTestBase):

    COL_1_ID = 'col_1_id'
    EXP_1_ID = 'exp_1_id'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'

    USER_3_ID = 'user_3_id'
    USER_4_ID = 'user_4_id'
    USER_GAE_3_ID = 'user_gae_3_id'
    USERNAME_1 = 'usernamea'
    USERNAME_2 = 'usernameb'
    EMAIL_1 = 'emaila@example.com'
    EMAIL_2 = 'emailb@example.com'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.AddCommitCmdsUserIdsMetadataJob.create_new())
        activity_jobs_one_off.AddCommitCmdsUserIdsMetadataJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            activity_jobs_one_off.AddCommitCmdsUserIdsMetadataJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return [
            [key, sorted(values) if isinstance(values, list) else values]
            for key, values in eval_output]

    def setUp(self):
        super(AddCommitCmdsUserIdsMetadataJobTests, self).setUp()

        self.collection_rights_model_swap = self.swap(
            collection_models,
            'CollectionRightsModel',
            MockCollectionRightsModel)
        self.exploration_rights_model_swap = self.swap(
            exp_models, 'ExplorationRightsModel', MockExplorationRightsModel)
        self.topic_rights_model_swap = self.swap(
            topic_models, 'TopicRightsModel', MockTopicRightsModel)

        self.signup(self.EMAIL_1, self.USERNAME_1)
        self.signup(self.EMAIL_2, self.USERNAME_2)

        self.USER_1_ID = self.get_user_id_from_email(self.EMAIL_1)
        self.USER_2_ID = self.get_user_id_from_email(self.EMAIL_2)

        self.USER_GAE_1_ID = self.get_gae_id_from_email(self.EMAIL_1)
        self.USER_GAE_2_ID = self.get_gae_id_from_email(self.EMAIL_2)

    def test_add_commit_cmds_user_ids_to_collection_rights_snapshot(self):
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            collection_model.owner_ids = [self.USER_3_ID]
            collection_model.save(
                'cid',
                'Change owner',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-CollectionRightsSnapshotMetadataModel', 2]])
        self.assertItemsEqual(
            [],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.COL_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).commit_cmds_user_ids)

    def test_add_commit_cmds_user_ids_to_exploration_rights_snapshot(self):
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            exp_model.owner_ids = [self.USER_3_ID]
            exp_model.save(
                'cid',
                'Change owner',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])

        output = self._run_one_off_job()
        self.assertEqual(
            output, [['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2]])
        self.assertItemsEqual(
            [],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).commit_cmds_user_ids)

    def test_fix_user_ids_in_exploration_rights_snapshot(self):
        with self.exploration_rights_model_swap:
            exp_model = exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_3_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)
            exp_model.save(
                'cid', 'Created new exploration rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            exp_model.owner_ids = [
                self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
            exp_model.save(
                'cid',
                'Change owner',
                [
                    {
                        'cmd': rights_domain.CMD_CHANGE_ROLE,
                        'assignee_id': self.USER_GAE_1_ID,
                        'old_role': rights_domain.ROLE_NONE,
                        'new_role': rights_domain.ROLE_OWNER
                    },
                    {
                        'cmd': rights_domain.CMD_CHANGE_ROLE,
                        'assignee_id': self.USER_GAE_2_ID,
                        'old_role': rights_domain.ROLE_EDITOR,
                        'new_role': rights_domain.ROLE_OWNER
                    }
                ])

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2],
                ['MIGRATION_SUCCESS', 1]
            ]
        )

        self.assertItemsEqual(
            [
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_1_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                },
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_2_ID,
                    'old_role': rights_domain.ROLE_EDITOR,
                    'new_role': rights_domain.ROLE_OWNER
                }
            ],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).commit_cmds
        )
        self.assertItemsEqual(
            [
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_1_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                },
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_2_ID,
                    'old_role': rights_domain.ROLE_EDITOR,
                    'new_role': rights_domain.ROLE_OWNER
                }
            ],
            exp_models.ExplorationCommitLogEntryModel
            .get_by_id('rights-%s-2' % self.EXP_1_ID).commit_cmds
        )

    def test_fix_user_ids_in_exploration_rights_snapshot_with_missing_commit(
            self):
        with self.exploration_rights_model_swap:
            exp_model = exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_3_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)
            exp_model.save(
                'cid', 'Created new exploration rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            exp_model.owner_ids = [
                self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
            exp_model.save(
                'cid',
                'Change owner',
                [
                    {
                        'cmd': rights_domain.CMD_CHANGE_ROLE,
                        'assignee_id': self.USER_GAE_1_ID,
                        'old_role': rights_domain.ROLE_NONE,
                        'new_role': rights_domain.ROLE_OWNER
                    },
                    {
                        'cmd': rights_domain.CMD_CHANGE_ROLE,
                        'assignee_id': self.USER_GAE_2_ID,
                        'old_role': rights_domain.ROLE_EDITOR,
                        'new_role': rights_domain.ROLE_OWNER
                    }
                ])

            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'rights-%s-2' % self.EXP_1_ID
            ).delete()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2],
                [
                    'MIGRATION_SUCCESS_MISSING_COMMIT_LOG',
                    ['%s-2' % self.EXP_1_ID]
                ]
            ]
        )

        self.assertItemsEqual(
            [
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_1_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                },
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_2_ID,
                    'old_role': rights_domain.ROLE_EDITOR,
                    'new_role': rights_domain.ROLE_OWNER
                }
            ],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).commit_cmds
        )

    def test_fix_user_ids_in_exploration_rights_snapshot_with_missing_user(
            self):
        with self.exploration_rights_model_swap:
            exp_model = exp_models.ExplorationRightsModel(
                id=self.EXP_1_ID,
                owner_ids=[self.USER_3_ID],
                editor_ids=[self.USER_2_ID],
                voice_artist_ids=[],
                viewer_ids=[],
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
                viewable_if_private=False,
                first_published_msec=0.0)
            exp_model.save(
                'cid', 'Created new exploration rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            exp_model.owner_ids = [
                self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
            exp_model.save(
                'cid',
                'Change owner',
                [
                    {
                        'cmd': rights_domain.CMD_CHANGE_ROLE,
                        'assignee_id': self.USER_GAE_1_ID,
                        'old_role': rights_domain.ROLE_NONE,
                        'new_role': rights_domain.ROLE_OWNER
                    },
                    {
                        'cmd': rights_domain.CMD_CHANGE_ROLE,
                        'assignee_id': self.USER_GAE_3_ID,
                        'old_role': rights_domain.ROLE_EDITOR,
                        'new_role': rights_domain.ROLE_OWNER
                    }
                ])

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2],
                ['MIGRATION_FAILURE', ['(\'exp_1_id-2\', u\'user_gae_3_id\')']],
            ]
        )

        self.assertItemsEqual(
            [
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_GAE_1_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                },
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_GAE_3_ID,
                    'old_role': rights_domain.ROLE_EDITOR,
                    'new_role': rights_domain.ROLE_OWNER
                }
            ],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).commit_cmds
        )
        self.assertItemsEqual(
            [
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_GAE_1_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                },
                {
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_GAE_3_ID,
                    'old_role': rights_domain.ROLE_EDITOR,
                    'new_role': rights_domain.ROLE_OWNER
                }
            ],
            exp_models.ExplorationCommitLogEntryModel
            .get_by_id('rights-%s-2' % self.EXP_1_ID).commit_cmds
        )

    def test_add_commit_cmds_user_ids_to_topic_rights_snapshot(self):
        with self.topic_rights_model_swap:
            topic_model = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID])
            topic_model.commit(
                'cid',
                'Created new topic rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
            .get_by_id('%s-1' % self.TOP_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-3' % self.TOP_1_ID).commit_cmds_user_ids)

    def test_add_commit_cmds_user_ids_to_multiple_rights_snapshots(self):
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            collection_model.editor_ids = [self.USER_1_ID, self.USER_4_ID]
            collection_model.save(
                'cid',
                'Add editor',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_4_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_EDITOR
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            exp_model.owner_ids = [
                self.USER_1_ID, self.USER_2_ID, self.USER_3_ID]
            exp_model.save(
                'cid',
                'Add owner',
                [{
                    'cmd': rights_domain.CMD_CHANGE_ROLE,
                    'assignee_id': self.USER_3_ID,
                    'old_role': rights_domain.ROLE_NONE,
                    'new_role': rights_domain.ROLE_OWNER
                }])

        with self.topic_rights_model_swap:
            topic_model_1 = topic_models.TopicRightsModel(
                id=self.TOP_1_ID,
                manager_ids=[self.USER_1_ID, self.USER_2_ID])
            topic_model_1.commit(
                'cid',
                'Created new topic rights',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
            topic_model_2.manager_ids = [self.USER_4_ID]
            topic_model_2.commit(
                'cid', 'Remove manager',
                [{
                    'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
                    'removed_user_id': self.USER_1_ID,
                }])

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['SUCCESS-CollectionRightsSnapshotMetadataModel', 2],
                ['SUCCESS-ExplorationRightsSnapshotMetadataModel', 2],
                ['SUCCESS-TopicRightsSnapshotMetadataModel', 4]
            ]
        )

        self.assertItemsEqual(
            [],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.COL_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_4_ID],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.COL_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.EXP_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.EXP_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_3_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_1_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-1' % self.TOP_2_ID).commit_cmds_user_ids)
        self.assertItemsEqual(
            [self.USER_1_ID],
            topic_models.TopicRightsSnapshotMetadataModel
            .get_by_id('%s-2' % self.TOP_2_ID).commit_cmds_user_ids)


class AuditSnapshotMetadataModelsJobTests(test_utils.GenericTestBase):

    COL_1_ID = 'col_1_id'
    EXP_1_ID = 'exp_1_id'
    TOP_1_ID = 'top_1_id'
    USER_1_ID = 'user_1_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.AuditSnapshotMetadataModelsJob.create_new())
        activity_jobs_one_off.AuditSnapshotMetadataModelsJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            activity_jobs_one_off.AuditSnapshotMetadataModelsJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return [
            [key, sorted(values) if isinstance(values, list) else values]
            for key, values in eval_output]

    def test_audit_collection_rights_snapshot(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='%s-1' % self.COL_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[
                {
                    'cmd': 'some_command',
                    'other_field': 'test'
                }, {
                    'cmd': 'some_other_command',
                    'other_field': 'test',
                    'different_field': 'test'
                }
            ]
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['collection-some_command-length-2', 1],
                ['collection-cmd-some_command', 1],
                ['collection-cmd-some_other_command', 1],
                ['collection-some_command-field-other_field', 1],
                ['collection-some_other_command-field-other_field', 1],
                ['collection-some_other_command-field-different_field', 1],
            ]
        )

    def test_audit_deleted_collection_rights_snapshot(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='%s-1' % self.COL_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[
                {
                    'cmd': 'some_command',
                    'other_field': 'test'
                }, {
                    'cmd': 'some_other_command',
                    'other_field': 'test',
                    'different_field': 'test'
                }
            ],
            deleted=True
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(output, [['collection-deleted', 1]])

    def test_audit_collection_rights_snapshot_with_missing_cmd(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='%s-1' % self.COL_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[
                {
                    'other_field': 'test',
                    'different_field': 'test'
                }
            ]
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['collection-missing_cmd-length-1', 1],
                ['collection-missing-cmd', 1],
                ['collection-missing_cmd-field-other_field', 1],
                ['collection-missing_cmd-field-different_field', 1],
            ]
        )

    def test_audit_exploration_rights_snapshot_with_empty_commit_cmds(self):
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='%s-1' % self.EXP_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[]
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(output, [['exploration-length-0', 1]])

    def test_audit_topic_rights_snapshot(self):
        topic_models.TopicRightsSnapshotMetadataModel(
            id='%s-1' % self.TOP_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[
                {
                    'cmd': 'some_command',
                    'other_field': 'test'
                }, {
                    'cmd': 'some_other_command',
                    'other_field': 'test',
                    'different_field': 'test'
                }
            ]
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['topic-some_command-length-2', 1],
                ['topic-cmd-some_command', 1],
                ['topic-cmd-some_other_command', 1],
                ['topic-some_command-field-other_field', 1],
                ['topic-some_other_command-field-other_field', 1],
                ['topic-some_other_command-field-different_field', 1],
            ]
        )

    def test_audit_multiple_rights_snapshots(self):
        collection_models.CollectionRightsSnapshotMetadataModel(
            id='%s-1' % self.COL_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[
                {
                    'cmd': 'some_command',
                    'other_field': 'test'
                }, {
                    'cmd': 'some_other_command',
                    'other_field': 'test',
                    'different_field': 'test'
                }
            ]
        ).put()
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='%s-1' % self.EXP_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[
                {
                    'cmd': 'some_command',
                    'other_field': 'test'
                }
            ]
        ).put()
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='%s-2' % self.EXP_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[
                {
                    'cmd': 'some_command',
                    'other_field': 'test'
                }
            ]
        ).put()
        topic_models.TopicRightsSnapshotMetadataModel(
            id='%s-1' % self.TOP_1_ID,
            committer_id=self.USER_1_ID,
            commit_type='edit',
            commit_cmds=[]
        ).put()
        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['collection-some_command-length-2', 1],
                ['collection-cmd-some_command', 1],
                ['collection-cmd-some_other_command', 1],
                ['collection-some_command-field-other_field', 1],
                ['collection-some_other_command-field-other_field', 1],
                ['collection-some_other_command-field-different_field', 1],
                ['exploration-some_command-length-1', 2],
                ['exploration-cmd-some_command', 2],
                ['exploration-some_command-field-other_field', 2],
                ['topic-length-0', 1]
            ]
        )
