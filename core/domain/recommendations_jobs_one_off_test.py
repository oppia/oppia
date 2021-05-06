# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Tests for recommendations_jobs_one_off."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core import jobs_registry
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import recommendations_jobs_one_off
from core.domain import recommendations_services
from core.domain import recommendations_services_test
from core.domain import rights_manager
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import python_utils

(exp_models, recommendations_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.recommendations])


class ExplorationRecommendationsOneOffJobUnitTests(
        recommendations_services_test.RecommendationsServicesUnitTests):
    """Test exploration recommendations one-off job."""

    ONE_OFF_JOB_MANAGERS_FOR_TESTS = [
        recommendations_jobs_one_off.ExplorationRecommendationsOneOffJob]

    def setUp(self):
        super(ExplorationRecommendationsOneOffJobUnitTests, self).setUp()
        self.job_class = (
            recommendations_jobs_one_off.ExplorationRecommendationsOneOffJob)

    def test_basic_computation(self):
        recommendations_services.update_topic_similarities(
            'Art,Biology,Chemistry\n'
            '1.0,0.2,0.1\n'
            '0.2,1.0,0.8\n'
            '0.1,0.8,1.0')

        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS',
            self.ONE_OFF_JOB_MANAGERS_FOR_TESTS
            ):
            self.job_class.enqueue(self.job_class.create_new())
            self.assertEqual(
                self.count_jobs_in_mapreduce_taskqueue(
                    taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
            self.process_and_flush_pending_mapreduce_tasks()

            recommendations = (
                recommendations_services.get_exploration_recommendations(
                    'exp_id_1'))
            self.assertEqual(
                recommendations, ['exp_id_4', 'exp_id_2', 'exp_id_3'])
            recommendations = (
                recommendations_services.get_exploration_recommendations(
                    'exp_id_4'))
            self.assertEqual(
                recommendations, ['exp_id_1', 'exp_id_2', 'exp_id_3'])

    def test_recommendations_after_changes_in_rights(self):
        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS',
            self.ONE_OFF_JOB_MANAGERS_FOR_TESTS
            ):
            self.job_class.enqueue(self.job_class.create_new())
            self.assertEqual(
                self.count_jobs_in_mapreduce_taskqueue(
                    taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
            self.process_and_flush_pending_mapreduce_tasks()

            recommendations = (
                recommendations_services.get_exploration_recommendations(
                    'exp_id_1'))
            self.assertEqual(
                recommendations, ['exp_id_4', 'exp_id_2', 'exp_id_3'])

            rights_manager.unpublish_exploration(self.admin, 'exp_id_4')

            self.job_class.enqueue(self.job_class.create_new())
            self.assertEqual(
                self.count_jobs_in_mapreduce_taskqueue(
                    taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
            self.process_and_flush_pending_mapreduce_tasks()
            recommendations = (
                recommendations_services.get_exploration_recommendations(
                    'exp_id_1'))
            self.assertEqual(recommendations, ['exp_id_2', 'exp_id_3'])

    def test_recommendations_with_invalid_exploration_summaries_would_be_empty(
            self):
        def _mock_get_non_private_exploration_summaries():
            """Return an invalid exploration summary dict."""
            return {'new_exp_id': 'new_exploration_summary'}

        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS',
            self.ONE_OFF_JOB_MANAGERS_FOR_TESTS
            ):
            # We need to swap here to make the recommendations an empty list
            # (since 'get_exploration_recommendations()' returns a list of ids
            # of at most 10 recommended explorations to play after completing
            # the exploration).
            with self.swap(
                exp_services, 'get_non_private_exploration_summaries',
                _mock_get_non_private_exploration_summaries):
                self.job_class.enqueue(self.job_class.create_new())
                self.assertEqual(
                    self.count_jobs_in_mapreduce_taskqueue(
                        taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
                self.process_and_flush_pending_mapreduce_tasks()

                recommendations = (
                    recommendations_services.get_exploration_recommendations(
                        'exp_id_1'))
                self.assertEqual(
                    recommendations, [])


class DeleteAllExplorationRecommendationsOneOffJobTests(
        test_utils.GenericTestBase):
    """Test delete exploration recommendations one-off job."""

    RECOMMENDATION_1_ID = 'rec_1_id'
    RECOMMENDATION_2_ID = 'rec_2_id'
    RECOMMENDATION_3_ID = 'rec_3_id'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            recommendations_jobs_one_off
            .DeleteAllExplorationRecommendationsOneOffJob.create_new())
        (
            recommendations_jobs_one_off
            .DeleteAllExplorationRecommendationsOneOffJob.enqueue(
                job_id)
        )
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            recommendations_jobs_one_off
            .DeleteAllExplorationRecommendationsOneOffJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_delete_one_exploration_recommendations_is_successful(self):
        recommendations_models.ExplorationRecommendationsModel(
            id=self.RECOMMENDATION_1_ID,
            recommended_exploration_ids=['exp_1']
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual([['DELETED', 1]], output)

        self.assertIsNone(
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                self.RECOMMENDATION_1_ID))

    def test_delete_multiple_explorations_recommendations_is_successful(self):
        recommendations_models.ExplorationRecommendationsModel(
            id=self.RECOMMENDATION_1_ID,
            recommended_exploration_ids=['exp_1']
        ).put()
        recommendations_models.ExplorationRecommendationsModel(
            id=self.RECOMMENDATION_2_ID,
            recommended_exploration_ids=['exp_1']
        ).put()
        recommendations_models.ExplorationRecommendationsModel(
            id=self.RECOMMENDATION_3_ID,
            recommended_exploration_ids=['exp_1']
        ).put()

        output = self._run_one_off_job()
        self.assertItemsEqual([['DELETED', 3]], output)

        self.assertIsNone(
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                self.RECOMMENDATION_1_ID))
        self.assertIsNone(
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                self.RECOMMENDATION_2_ID))
        self.assertIsNone(
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                self.RECOMMENDATION_3_ID))


class CleanUpExplorationRecommendationsOneOffJob(test_utils.GenericTestBase):
    """Test clean up exploration recommendations one-off job."""

    def setUp(self):
        super(CleanUpExplorationRecommendationsOneOffJob, self).setUp()

        self.signup('user@email', 'user')
        self.user_id = self.get_user_id_from_email('user@email')

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(4)]

        for exp in explorations:
            exp_services.save_new_exploration(self.user_id, exp)

        recommendations_services.set_exploration_recommendations(
            '0', ['1', '2'])

    def test_standard_operation(self):
        job_id = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.create_new())
        (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.get_output(job_id))
        self.assertEqual(output, [])

        recommendation_model = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))
        self.assertEqual(
            recommendation_model.recommended_exploration_ids, ['1', '2'])

    def test_migration_job_skips_deleted_model(self):
        recommendation_model = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))
        recommendation_model.deleted = True
        recommendation_model.update_timestamps()
        recommendation_model.put()

        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, 'Delete')
        job_id = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.create_new())
        (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.get_output(job_id))
        self.assertEqual(output, [])

    def test_job_deletes_model_if_exp_model_is_deleted(self):
        recommendation_model = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))
        self.assertEqual(
            recommendation_model.recommended_exploration_ids, ['1', '2'])

        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, 'Delete')
        job_id = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.create_new())
        (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.get_output(job_id))
        self.assertEqual(
            output, ['[u\'Removed recommendation model\', [u\'0\']]'])

        self.assertIsNone(
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))

    def test_job_removes_deleted_exp_ids_from_recommendation_list(self):
        recommendation_model = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))
        self.assertEqual(
            recommendation_model.recommended_exploration_ids, ['1', '2'])

        exp_models.ExplorationModel.get_by_id('1').delete(
            self.user_id, 'Delete')
        job_id = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.create_new())
        (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            recommendations_jobs_one_off
            .CleanUpExplorationRecommendationsOneOffJob.get_output(job_id))
        self.assertEqual(
            output,
            ['[u\'Removed deleted exp ids from recommendations\', [u\'0\']]'])

        recommendation_model = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))
        self.assertEqual(
            recommendation_model.recommended_exploration_ids, ['2'])
