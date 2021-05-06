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
from core.domain import state_domain
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

datastore_services = models.Registry.import_datastore_services()
gae_search_services = models.Registry.import_search_services()

(
    base_models, collection_models, config_models,
    exp_models, question_models, skill_models,
    story_models, topic_models, subtopic_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.config,
    models.NAMES.exploration, models.NAMES.question, models.NAMES.skill,
    models.NAMES.story, models.NAMES.topic, models.NAMES.subtopic
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
        self.owner = user_services.get_user_actions_info(self.owner_id)

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


class ValidateSnapshotMetadataModelsJobTests(test_utils.GenericTestBase):
    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    EXP_ID = 'exp_id0'
    COLLECTION_ID = 'collection_id0'
    QUESTION_ID = 'question_id0'
    SKILL_ID = 'skill_id0'
    STORY_ID = 'story_id0'
    TOPIC_ID = 'topic_id0'
    # The subtopic snapshot ID is in the format
    # '<topicId>-<subtopicNum>-<version>'.
    SUBTOPIC_ID = 'topic_id0-1'
    TOPIC_RIGHTS_ID = 'topic_rights_id0'
    DUMMY_COMMIT_CMDS = [
        {
            'cmd': 'some_command',
            'other_field': 'test'
        }, {
            'cmd': 'some_other_command',
            'other_field': 'test',
            'different_field': 'test'
        }
    ]
    # A commit log entry model is not being created by the commit or
    # the create function of the ConfigPropertyModel and
    # the PlatformParameterModel. So, these models are excluded.
    EXCLUDED_CLASS_NAMES = [
        'ConfigPropertySnapshotMetadataModel',
        'PlatformParameterSnapshotMetadataModel'
    ]

    def setUp(self):
        super(ValidateSnapshotMetadataModelsJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_class = activity_jobs_one_off.ValidateSnapshotMetadataModelsJob
        job_id = job_class.create_new()
        activity_jobs_one_off.ValidateSnapshotMetadataModelsJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            activity_jobs_one_off.ValidateSnapshotMetadataModelsJob
            .get_output(job_id))

        eval_output = [
            ast.literal_eval(stringified_item) for
            stringified_item in stringified_output]
        return eval_output

    def test_validate_snapshot_model_list(self):
        job_class = activity_jobs_one_off.ValidateSnapshotMetadataModelsJob
        actual_class_names = [
            cls.__name__ for cls in job_class.SNAPSHOT_METADATA_MODELS]
        class_names = [
            cls.__name__ for
            cls in base_models.BaseSnapshotMetadataModel.__subclasses__()]
        expected_class_names = [
            i for i in class_names if i not in self.EXCLUDED_CLASS_NAMES]

        self.assertItemsEqual(expected_class_names, actual_class_names)

    def test_correct_collection_models(self):
        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.albert_id)

        collection_model = collection_models.CollectionModel(
            id=self.COLLECTION_ID,
            category='category',
            title='title',
            objective='objective',
            collection_contents={
                'nodes': {}
            },
        )
        collection_model.commit(
            self.albert_id, 'collection model created', self.DUMMY_COMMIT_CMDS)

        actual_output = self._run_one_off_job()

        expected_output = [
            ['FOUND PARENT MODEL - CollectionRightsSnapshotMetadataModel', 1],
            ['FOUND COMMIT LOGS - CollectionSnapshotMetadataModel', 1],
            ['FOUND PARENT MODEL - CollectionSnapshotMetadataModel', 1],
            [
                'COMMIT LOGS SHOULD NOT EXIST AND DOES NOT EXIST - ' +
                'CollectionRightsSnapshotMetadataModel',
                1
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_correct_exp_models(self):
        rights_manager.create_new_exploration_rights(
            self.EXP_ID, self.albert_id)

        exp_model = exp_models.ExplorationModel(
            id=self.EXP_ID,
            title='title',
            category='category',
            states_schema_version=1,
            init_state_name='init_state_name'
        )
        exp_model.commit(
            self.albert_id, 'exp model created', self.DUMMY_COMMIT_CMDS)

        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'COMMIT LOGS SHOULD NOT EXIST AND DOES NOT EXIST - ' +
                'ExplorationRightsSnapshotMetadataModel',
                1
            ],
            ['FOUND COMMIT LOGS - ExplorationSnapshotMetadataModel', 1],
            ['FOUND PARENT MODEL - ExplorationSnapshotMetadataModel', 1],
            ['FOUND PARENT MODEL - ExplorationRightsSnapshotMetadataModel', 1]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_correct_question_models(self):
        state = state_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()
        question_model = question_models.QuestionModel(
            id=self.QUESTION_ID,
            question_state_data=question_state_data,
            question_state_data_schema_version=1,
            language_code='en'
        )

        question_model.commit(
            self.albert_id, 'question model created', self.DUMMY_COMMIT_CMDS)

        actual_output = self._run_one_off_job()

        expected_output = [
            ['FOUND PARENT MODEL - QuestionSnapshotMetadataModel', 1],
            ['FOUND COMMIT LOGS - QuestionSnapshotMetadataModel', 1]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_correct_skill_models(self):
        skill_model = skill_models.SkillModel(
            id=self.SKILL_ID,
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            next_misconception_id=0,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        skill_model.commit(
            self.albert_id, 'skill model created', self.DUMMY_COMMIT_CMDS)

        actual_output = self._run_one_off_job()

        expected_output = [
            ['FOUND PARENT MODEL - SkillSnapshotMetadataModel', 1],
            ['FOUND COMMIT LOGS - SkillSnapshotMetadataModel', 1]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_correct_story_models(self):
        story_model = story_models.StoryModel(
            id=self.STORY_ID,
            title='title',
            description='Story description',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id=self.TOPIC_ID,
            url_fragment='story'
        )
        story_model.commit(
            self.albert_id, 'story model created', self.DUMMY_COMMIT_CMDS)

        actual_output = self._run_one_off_job()
        expected_output = [
            ['FOUND PARENT MODEL - StorySnapshotMetadataModel', 1],
            ['FOUND COMMIT LOGS - StorySnapshotMetadataModel', 1]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_correct_topic_models(self):
        topic_rights = topic_models.TopicRightsModel(
            id=self.TOPIC_ID,
            manager_ids=[],
            topic_is_published=True
        )
        topic_rights.commit(
            self.albert_id, 'topic rights model created',
            [{'cmd': 'create_new'}])

        topic_model = topic_models.TopicModel(
            id=self.TOPIC_ID,
            name='name',
            url_fragment='name-two',
            canonical_name='canonical_name',
            next_subtopic_id=1,
            language_code='en',
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        topic_model.commit(
            self.albert_id, 'topic model created', self.DUMMY_COMMIT_CMDS)

        actual_output = self._run_one_off_job()

        expected_output = [
            ['FOUND PARENT MODEL - TopicRightsSnapshotMetadataModel', 1],
            ['FOUND COMMIT LOGS - TopicSnapshotMetadataModel', 1],
            ['FOUND PARENT MODEL - TopicSnapshotMetadataModel', 1],
            ['FOUND COMMIT LOGS - TopicRightsSnapshotMetadataModel', 1]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_correct_subtopic_models(self):
        subtopic_page = subtopic_models.SubtopicPageModel(
            id=self.SUBTOPIC_ID,
            topic_id=self.TOPIC_ID,
            page_contents={},
            page_contents_schema_version=1,
            language_code='en'
        )
        subtopic_page.commit(
            self.albert_id, 'subtopic model created', self.DUMMY_COMMIT_CMDS)

        actual_output = self._run_one_off_job()

        expected_output = [
            ['FOUND COMMIT LOGS - SubtopicPageSnapshotMetadataModel', 1],
            ['FOUND PARENT MODEL - SubtopicPageSnapshotMetadataModel', 1]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_collection_commit_logs(self):
        collection_models.CollectionSnapshotMetadataModel(
            id='%s-1' % self.COLLECTION_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - CollectionSnapshotMetadataModel',
                ['collection_id0-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - CollectionSnapshotMetadataModel',
                ['collection_id0-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_exp_commit_logs(self):
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='%s-1' % self.EXP_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - ExplorationRightsSnapshotMetadataModel',
                ['exp_id0-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - ExplorationRightsSnapshotMetadataModel',
                ['exp_id0-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_question_commit_logs(self):
        question_models.QuestionSnapshotMetadataModel(
            id='%s-1' % self.QUESTION_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - QuestionSnapshotMetadataModel',
                ['question_id0-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - QuestionSnapshotMetadataModel',
                ['question_id0-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_skill_commit_logs(self):
        skill_models.SkillSnapshotMetadataModel(
            id='%s-1' % self.SKILL_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - SkillSnapshotMetadataModel',
                ['skill_id0-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - SkillSnapshotMetadataModel',
                ['skill_id0-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_story_commit_logs(self):
        story_models.StorySnapshotMetadataModel(
            id='%s-1' % self.STORY_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - StorySnapshotMetadataModel',
                ['story_id0-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - StorySnapshotMetadataModel',
                ['story_id0-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_topic_commit_logs(self):
        topic_models.TopicSnapshotMetadataModel(
            id='%s-1' % self.TOPIC_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - TopicSnapshotMetadataModel',
                ['topic_id0-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - TopicSnapshotMetadataModel',
                ['topic_id0-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_subtopic_commit_logs(self):
        subtopic_models.SubtopicPageSnapshotMetadataModel(
            id='%s-1' % self.SUBTOPIC_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - SubtopicPageSnapshotMetadataModel',
                ['topic_id0-1-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - SubtopicPageSnapshotMetadataModel',
                ['topic_id0-1-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_missing_topic_rights_commit_logs(self):
        topic_models.TopicRightsSnapshotMetadataModel(
            id='%s-1' % self.TOPIC_RIGHTS_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()
        actual_output = self._run_one_off_job()

        expected_output = [
            [
                'VALIDATION FAILURE - MISSING PARENT MODEL' +
                ' - TopicRightsSnapshotMetadataModel',
                ['topic_rights_id0-1']
            ],
            [
                'VALIDATION FAILURE - MISSING COMMIT LOGS' +
                ' - TopicRightsSnapshotMetadataModel',
                ['topic_rights_id0-1']
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)


class AddMissingCommitLogsOneOffJobTests(test_utils.GenericTestBase):
    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    EXP_ID = 'exp_id0'
    QUESTION_ID = 'question_id0'
    SKILL_ID = 'skill_id0'
    DUMMY_COMMIT_CMDS = [
        {
            'cmd': 'some_command',
            'other_field': 'test'
        }, {
            'cmd': 'some_other_command',
            'other_field': 'test',
            'different_field': 'test'
        }
    ]
    DUMMY_CREATE_COMMIT_CMDS = [
        {
            'cmd': 'create_new',
            'other_field': 'test'
        }
    ]
    DUMMY_CREATE_COMMIT_CMDS = [
        {
            'cmd': 'create_new',
            'other_field': 'test'
        }
    ]

    def setUp(self):
        super(AddMissingCommitLogsOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_class = activity_jobs_one_off.AddMissingCommitLogsOneOffJob
        job_id = job_class.create_new()
        activity_jobs_one_off.AddMissingCommitLogsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            activity_jobs_one_off.AddMissingCommitLogsOneOffJob
            .get_output(job_id))

        eval_output = [
            ast.literal_eval(stringified_item) for
            stringified_item in stringified_output]
        return eval_output

    def test_validate_model_names_list(self):
        job_class = activity_jobs_one_off.AddMissingCommitLogsOneOffJob
        class_names = {
            cls.__name__ for cls in (
                job_class.SNAPSHOT_METADATA_MODELS_WITH_MISSING_COMMIT_LOGS)}
        model_names_with_default_commit_status = set(
            job_class.MODEL_NAMES_WITH_DEFAULT_COMMIT_STATUS)
        model_names_with_commit_status_in_rights = set(
            job_class.MODEL_NAMES_WITH_COMMIT_STATUS_IN_RIGHTS)
        aggregate_model_names = (
            model_names_with_default_commit_status |
            model_names_with_commit_status_in_rights)
        common_model_names = (
            model_names_with_default_commit_status &
            model_names_with_commit_status_in_rights)

        self.assertEqual(len(common_model_names), 0)
        self.assertItemsEqual(class_names, aggregate_model_names)
        self.assertItemsEqual(
            class_names, set(job_class.MODEL_NAMES_TO_PROPERTIES.keys()))

    def test_delete_exp_rights_related_models(self):
        exp_rights = exp_models.ExplorationRightsModel(
            id=self.EXP_ID,
            status='public',
            version=1,
            deleted=True
        )
        base_models.BaseModel.put_multi([exp_rights])
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='%s-1' % self.EXP_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS,
        ).put()

        expected_output = [
            [
                'SUCCESS-Parent model marked deleted-Deleted all ' +
                'related models-ExplorationRightsSnapshotMetadataModel',
                ['exp_id0-1']
            ]
        ]

        actual_output = self._run_one_off_job()

        parent_model = exp_models.ExplorationRightsModel.get_by_id(
            self.EXP_ID)
        snapshot_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '%s-%s' % (self.EXP_ID, 1)))

        self.assertIsNone(parent_model)
        self.assertIsNone(snapshot_model)
        self.assertItemsEqual(expected_output, actual_output)

    def test_delete_skill_related_models(self):
        skill_model = skill_models.SkillModel(
            id=self.SKILL_ID,
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            next_misconception_id=0,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False,
            deleted=True,
            version=1
        )
        base_models.BaseModel.put_multi([skill_model])
        skill_models.SkillSnapshotMetadataModel(
            id='%s-1' % self.SKILL_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()

        expected_output = [
            [
                'SUCCESS-Parent model marked deleted-Deleted all ' +
                'related models-SkillSnapshotMetadataModel',
                ['skill_id0-1']
            ]
        ]

        actual_output = self._run_one_off_job()

        parent_model = skill_models.SkillModel.get_by_id(
            self.SKILL_ID)
        snapshot_model = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                '%s-%s' % (self.SKILL_ID, 1)))

        self.assertIsNone(parent_model)
        self.assertIsNone(snapshot_model)
        self.assertItemsEqual(expected_output, actual_output)

    def test_delete_question_related_models(self):
        state = state_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()
        question_model = question_models.QuestionModel(
            id=self.QUESTION_ID,
            question_state_data=question_state_data,
            question_state_data_schema_version=1,
            language_code='en',
            deleted=True,
            version=1
        )
        base_models.BaseModel.put_multi([question_model])
        question_models.QuestionSnapshotMetadataModel(
            id='%s-1' % self.QUESTION_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()

        expected_output = [
            [
                'SUCCESS-Parent model marked deleted-Deleted all ' +
                'related models-QuestionSnapshotMetadataModel',
                ['question_id0-1']
            ]
        ]

        actual_output = self._run_one_off_job()

        parent_model = question_models.QuestionModel.get_by_id(
            self.QUESTION_ID)
        snapshot_model = (
            question_models.QuestionSnapshotContentModel.get_by_id(
                '%s-%s' % (self.QUESTION_ID, 1)))

        self.assertIsNone(parent_model)
        self.assertIsNone(snapshot_model)
        self.assertItemsEqual(expected_output, actual_output)

    def test_add_missing_exp_rights_commit_logs(self):
        exp_rights = exp_models.ExplorationRightsModel(
            id=self.EXP_ID,
            status='public'
        )
        base_models.BaseModel.put_multi([exp_rights])
        content_dict = {
            'status': 'public',
            'owner_ids': self.albert_id,
            'editor_ids': self.albert_id,
            'voice_artist_ids': self.albert_id,
            'viewer_ids': self.albert_id
        }

        exp_models.ExplorationRightsSnapshotContentModel(
            id='%s-1' % self.EXP_ID,
            content=content_dict
        ).put()
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='%s-1' % self.EXP_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()

        actual_output = self._run_one_off_job()
        commit_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'rights-%s-%s' % (self.EXP_ID, 1)))

        expected_output = [
            [
                'SUCCESS-Added missing commit log model-' +
                'ExplorationRightsSnapshotMetadataModel',
                ['exp_id0-1']
            ]
        ]
        expected_commit_model = exp_models.ExplorationCommitLogEntryModel(
            exploration_id=self.EXP_ID,
            user_id=self.albert_id,
            commit_type='edit',
            commit_message=None,
            commit_cmds=self.DUMMY_COMMIT_CMDS,
            post_commit_status='public',
            post_commit_is_private=False,
            version=1
        )

        self.assertIsNotNone(commit_model)
        self.assertEqual(
            commit_model.to_dict(exclude=['created_on', 'last_updated']),
            expected_commit_model.to_dict(
                exclude=['created_on', 'last_updated'])
        )
        self.assertItemsEqual(expected_output, actual_output)

    def test_exp_rights_with_commit_type_create(self):
        exp_rights = exp_models.ExplorationRightsModel(
            id=self.EXP_ID,
            status='public'
        )
        base_models.BaseModel.put_multi([exp_rights])
        content_dict = {
            'status': 'public',
            'owner_ids': self.albert_id,
            'editor_ids': self.albert_id,
            'voice_artist_ids': self.albert_id,
            'viewer_ids': self.albert_id
        }

        exp_models.ExplorationRightsSnapshotContentModel(
            id='%s-1' % self.EXP_ID,
            content=content_dict
        ).put()
        exp_models.ExplorationRightsSnapshotMetadataModel(
            id='%s-1' % self.EXP_ID,
            committer_id=self.albert_id,
            commit_type='create',
            commit_cmds=self.DUMMY_CREATE_COMMIT_CMDS
        ).put()

        actual_output = self._run_one_off_job()
        expected_output = [
            [
                'Found commit log model-' +
                'ExplorationRightsSnapshotMetadataModel',
                1
            ]
        ]

        self.assertItemsEqual(expected_output, actual_output)

    def test_add_missing_question_commit_logs(self):
        state = state_domain.State.create_default_state('ABC')
        question_state_data = state.to_dict()
        question_model = question_models.QuestionModel(
            id=self.QUESTION_ID,
            question_state_data=question_state_data,
            question_state_data_schema_version=1,
            language_code='en'
        )
        base_models.BaseModel.put_multi([question_model])
        question_models.QuestionSnapshotContentModel(
            id='%s-1' % self.QUESTION_ID).put()
        question_models.QuestionSnapshotMetadataModel(
            id='%s-1' % self.QUESTION_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()

        actual_output = self._run_one_off_job()
        commit_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-%s' % (self.QUESTION_ID, 1)))

        expected_output = [
            [
                'SUCCESS-Added missing commit log model-' +
                'QuestionSnapshotMetadataModel',
                ['question_id0-1']
            ]
        ]
        expected_commit_model = question_models.QuestionCommitLogEntryModel(
            question_id=self.QUESTION_ID,
            user_id=self.albert_id,
            commit_type='edit',
            commit_message=None,
            commit_cmds=self.DUMMY_COMMIT_CMDS,
            post_commit_status='public',
            post_commit_is_private=False,
            version=1
        )

        self.assertIsNotNone(commit_model)
        self.assertEqual(
            commit_model.to_dict(exclude=['created_on', 'last_updated']),
            expected_commit_model.to_dict(
                exclude=['created_on', 'last_updated'])
        )
        self.assertItemsEqual(expected_output, actual_output)

    def test_add_missing_skill_commit_logs(self):
        skill_model = skill_models.SkillModel(
            id=self.SKILL_ID,
            description='description',
            language_code='en',
            misconceptions=[],
            rubrics=[],
            next_misconception_id=0,
            misconceptions_schema_version=1,
            rubric_schema_version=1,
            skill_contents_schema_version=1,
            all_questions_merged=False
        )
        base_models.BaseModel.put_multi([skill_model])

        skill_models.SkillSnapshotMetadataModel(
            id='%s-1' % self.SKILL_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()

        actual_output = self._run_one_off_job()
        commit_model = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-%s-%s' % (self.SKILL_ID, 1)))

        expected_output = [
            [
                'SUCCESS-Added missing commit log model-' +
                'SkillSnapshotMetadataModel',
                ['skill_id0-1']
            ]
        ]
        expected_commit_model = skill_models.SkillCommitLogEntryModel(
            skill_id=self.SKILL_ID,
            user_id=self.albert_id,
            commit_type='edit',
            commit_message=None,
            commit_cmds=self.DUMMY_COMMIT_CMDS,
            post_commit_status='public',
            post_commit_is_private=False,
            version=1
        )

        self.assertIsNotNone(commit_model)
        self.assertEqual(
            commit_model.to_dict(exclude=['created_on', 'last_updated']),
            expected_commit_model.to_dict(
                exclude=['created_on', 'last_updated'])
        )
        self.assertItemsEqual(expected_output, actual_output)

    def test_add_missing_skill_parent_model(self):
        skill_models.SkillSnapshotMetadataModel(
            id='%s-1' % self.SKILL_ID,
            committer_id=self.albert_id,
            commit_type='edit',
            commit_cmds=self.DUMMY_COMMIT_CMDS
        ).put()

        actual_output = self._run_one_off_job()
        commit_model = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-%s-%s' % (self.SKILL_ID, 1)))

        expected_output = [
            [
                'Missing Parent Model-No changes-' +
                'SkillSnapshotMetadataModel',
                1
            ]
        ]

        self.assertIsNone(commit_model)
        self.assertItemsEqual(expected_output, actual_output)


class SnapshotMetadataCommitMsgAuditOneOffJobTests(
        test_utils.GenericTestBase):
    """Tests for the one-off commit message audit job."""

    def _count_one_off_jobs_in_queue(self):
        """Counts one off jobs in the taskqueue."""
        return self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off
            .SnapshotMetadataCommitMsgAuditOneOffJob.create_new())
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        (
            activity_jobs_one_off
            .SnapshotMetadataCommitMsgAuditOneOffJob.enqueue(job_id))
        self.assertEqual(self._count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        results = (
            activity_jobs_one_off
            .SnapshotMetadataCommitMsgAuditOneOffJob.get_output(job_id))
        return [ast.literal_eval(stringified_item) for
                stringified_item in results]

    def test_message_counts_correct(self):
        """Ensures the audit job correctly gets commit message counts of
        varying lengths.
        """

        value_less_than_375 = 100
        value_equal_to_375 = 375
        value_greater_than_375 = 400
        num_models_per_category = 2

        model_class = config_models.ConfigPropertySnapshotMetadataModel
        for i in python_utils.RANGE(num_models_per_category):
            model_class(
                id='model_id-%d-%d' % (i, value_less_than_375),
                committer_id='committer_id',
                commit_type='create',
                commit_message='a' * value_less_than_375).put()
            model_class(
                id='model_id-%d-%d' % (i, value_equal_to_375),
                committer_id='committer_id',
                commit_type='create',
                commit_message='a' * value_equal_to_375).put()
            model_class(
                id='model_id-%d-%d' % (i, value_greater_than_375),
                committer_id='committer_id',
                commit_type='create',
                commit_message='a' * value_greater_than_375).put()
        self.maxDiff = None
        one_off_results = self._run_one_off_job()
        expected_results = [
            ['GREATER_THAN_375', [
                'ConfigPropertySnapshotMetadataModel with id model_id-0-400.' +
                ' Message: %s' % ('a' * value_greater_than_375),
                'ConfigPropertySnapshotMetadataModel with id model_id-1-400.' +
                ' Message: %s' % ('a' * value_greater_than_375),
            ]],
            ['LESS_OR_EQUAL_TO_375', 2 * num_models_per_category + 1]]

        # Ensure results have same length.
        self.assertEqual(len(one_off_results), len(expected_results))

        # Create results dictionaries.
        one_off_results_dict = dict()
        expected_results_dict = dict()
        for i, _ in enumerate(one_off_results):
            one_off_results_dict[one_off_results[i][0]] = one_off_results[i][1]
            expected_results_dict[
                expected_results[i][0]] = expected_results[i][1]

        one_off_results_dict[
            'GREATER_THAN_375'
        ] = sorted(one_off_results_dict['GREATER_THAN_375'])
        expected_results_dict[
            'GREATER_THAN_375'
        ] = sorted(expected_results_dict['GREATER_THAN_375'])
        self.assertDictEqual(one_off_results_dict, expected_results_dict)

    def test_job_can_run_multiple_times(self):
        num_test_runs = 5
        for _ in python_utils.RANGE(num_test_runs):
            self.test_message_counts_correct()


class SnapshotMetadataCommitMsgShrinkOneOffJobTests(
        test_utils.GenericTestBase):
    """Tests for the one-off commit message shrinking job for
    BaseSnapshotMetadata classes.
    """

    def _count_one_off_jobs_in_queue(self):
        """Counts one off jobs in the taskqueue."""
        return self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off
            .SnapshotMetadataCommitMsgShrinkOneOffJob.create_new())
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        (
            activity_jobs_one_off
            .SnapshotMetadataCommitMsgShrinkOneOffJob.enqueue(job_id))
        self.assertEqual(self._count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self._count_one_off_jobs_in_queue(), 0)
        results = (
            activity_jobs_one_off
            .SnapshotMetadataCommitMsgShrinkOneOffJob.get_output(job_id))
        return [ast.literal_eval(stringified_item) for
                stringified_item in results]

    def test_message_truncated_correctly_base_snapshot_metadata(self):
        """Ensures the job corretly shrinks commit message lengths for
        BaseSnapshotMetadataModel.
        """
        model_class = config_models.ConfigPropertySnapshotMetadataModel
        model_class(
            id='model_id-0',
            committer_id='committer_id',
            commit_type='create',
            commit_message='a' * 400).put()
        self._run_one_off_job()
        self.assertEqual(
            len(model_class.get_by_id('model_id-0').commit_message),
            375)

    def test_message_truncated_correctly_commit_log_entry(self):
        """Ensures the job corretly shrinks commit message lengths for
        CommitLogEntryModel.
        """
        commit = collection_models.CollectionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'a', 'a' * 400, [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.collection_id = 'b'
        commit.update_timestamps()
        commit.put()
        self._run_one_off_job()
        self.assertEqual(
            len(
                collection_models.CollectionCommitLogEntryModel.get_by_id(
                    commit.id).commit_message),
            375)

        # Ensure nothing happens to messages of proper length.
        self._run_one_off_job()
        self.assertEqual(
            len(
                collection_models.CollectionCommitLogEntryModel.get_by_id(
                    commit.id).commit_message),
            375)
