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
import types

from core.controllers import base
from core.domain import activity_jobs_one_off
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import python_utils

gae_search_services = models.Registry.import_search_services()

(
    collection_models, config_models,
    exp_models, question_models,
    skill_models, story_models,
    topic_models) = (
        models.Registry.import_models([
            models.NAMES.collection, models.NAMES.config,
            models.NAMES.exploration, models.NAMES.question,
            models.NAMES.skill, models.NAMES.story,
            models.NAMES.topic]))


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


class SnapshotMetadataModelsIndexesJobTest(test_utils.GenericTestBase):
    """Tests for QuestionSummaryModel migration."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        activity_jobs_one_off.SnapshotMetadataModelsIndexesJob]

    TESTED_MODEL_TYPES = [
        collection_models.CollectionSnapshotMetadataModel,
        collection_models.CollectionRightsSnapshotMetadataModel,
        config_models.ConfigPropertySnapshotMetadataModel,
        exp_models.ExplorationSnapshotMetadataModel,
        exp_models.ExplorationRightsSnapshotMetadataModel,
        question_models.QuestionSnapshotMetadataModel,
        question_models.QuestionRightsSnapshotMetadataModel,
        skill_models.SkillSnapshotMetadataModel,
        skill_models.SkillRightsSnapshotMetadataModel,
        story_models.StorySnapshotMetadataModel,
        topic_models.TopicSnapshotMetadataModel,
        topic_models.SubtopicPageSnapshotMetadataModel,
        topic_models.TopicRightsSnapshotMetadataModel
    ]

    def setUp(self):
        def empty(*_):
            """Function that takes any number of arguments and does nothing."""
            pass

        # We don't want to add ConfigPropertySnapshotMetadataModel for CSRF
        # secret, so we need to skip the CSRF token init.
        with self.swap(
            base.CsrfTokenManager, 'init_csrf_secret',
            types.MethodType(empty, base.CsrfTokenManager)
        ):
            super(SnapshotMetadataModelsIndexesJobTest, self).setUp()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            activity_jobs_one_off.SnapshotMetadataModelsIndexesJob.create_new())
        activity_jobs_one_off.SnapshotMetadataModelsIndexesJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            activity_jobs_one_off.SnapshotMetadataModelsIndexesJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [(eval_item[0], int(eval_item[1]))
                  for eval_item in eval_output]
        return output

    def _check_model_validity(self, original_model, migrated_model):
        """Checks if the model was migrated correctly."""
        self.assertEqual(
            migrated_model.committer_id,
            original_model.committer_id)
        self.assertEqual(
            migrated_model.commit_type,
            original_model.commit_type)
        self.assertEqual(
            migrated_model.commit_message,
            original_model.commit_message)
        self.assertEqual(
            migrated_model.commit_cmds,
            original_model.commit_cmds)
        self.assertEqual(
            migrated_model.last_updated,
            original_model.last_updated)

    def test_successful_migration_all_model_types(self):
        for model_type in self.TESTED_MODEL_TYPES:
            instance_id = 'id_1'
            model = model_type(
                id=instance_id,
                committer_id='committer_id',
                commit_type='create',
                commit_message='commit message',
                commit_cmds=[{'cmd': 'some_command'}])
            model.put()

            output = self._run_one_off_job()
            self.assertEqual(output, [(u'SUCCESS', 1)])
            migrated_model = model_type.get_by_id(instance_id)
            self._check_model_validity(model, migrated_model)

            model.delete()

    def test_successful_migration_multiple_models(self):
        instance_id_1 = 'id_1'
        instance_id_2 = 'id_2'
        instance_id_3 = 'id_3'
        collection_model = collection_models.CollectionSnapshotMetadataModel(
            id=instance_id_1,
            committer_id='committer_id',
            commit_type='create',
            commit_message='commit message 1',
            commit_cmds=[{'cmd': 'some_command'}])
        collection_model.put()
        exploration_model = exp_models.ExplorationSnapshotMetadataModel(
            id=instance_id_2,
            committer_id='committer_id',
            commit_type='create',
            commit_message='commit message 2',
            commit_cmds=[{'cmd': 'some_command'}])
        exploration_model.put()
        skill_model = skill_models.SkillRightsSnapshotMetadataModel(
            id=instance_id_3,
            committer_id='committer_id',
            commit_type='create',
            commit_message='commit message 3',
            commit_cmds=[{'cmd': 'some_command'}])
        skill_model.put()

        output = self._run_one_off_job()
        self.assertEqual(output, [(u'SUCCESS', 3)])

        migrated_collection_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                instance_id_1))
        self._check_model_validity(collection_model, migrated_collection_model)
        migrated_exploration_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                instance_id_2))
        self._check_model_validity(
            exploration_model, migrated_exploration_model)
        migrated_skill_model = (
            skill_models.SkillRightsSnapshotMetadataModel.get_by_id(
                instance_id_3))
        self._check_model_validity(skill_model, migrated_skill_model)
