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

"""Tests for recommendations_jobs_continuous."""

from core import jobs_registry
from core.domain import recommendations_jobs_continuous
from core.domain import recommendations_services
from core.domain import recommendations_services_test
from core.domain import rights_manager
from core.platform import models
(recommendations_models,) = models.Registry.import_models([
    models.NAMES.recommendations])
taskqueue_services = models.Registry.import_taskqueue_services()


class ModifiedExplorationRecommendationsAggregator(
        recommendations_jobs_continuous.ExplorationRecommendationsAggregator):
    """A modified ExplorationRecommendationsAggregator that does not start a
    new batch job when the previous one has finished.
    """

    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedExplorationRecommendationsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedExplorationRecommendationsMRJobManager(
        recommendations_jobs_continuous.ExplorationRecommendationsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedExplorationRecommendationsAggregator


class ExplorationRecommendationsAggregatorUnitTests(
        recommendations_services_test.RecommendationsServicesUnitTests):
    """Test recommendations services."""

    ALL_CC_MANAGERS_FOR_TESTS = [
        ModifiedExplorationRecommendationsAggregator]

    def test_basic_computation(self):
        recommendations_services.update_topic_similarities(
            'Art,Biology,Chemistry\n'
            '1.0,0.2,0.1\n'
            '0.2,1.0,0.8\n'
            '0.1,0.8,1.0')

        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS
            ):
            ModifiedExplorationRecommendationsAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

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
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS
            ):
            ModifiedExplorationRecommendationsAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT), 1)
            self.process_and_flush_pending_tasks()

            recommendations = (
                recommendations_services.get_exploration_recommendations(
                    'exp_id_1'))
            self.assertEqual(
                recommendations, ['exp_id_4', 'exp_id_2', 'exp_id_3'])

            rights_manager.unpublish_exploration(self.admin_id, 'exp_id_4')
            ModifiedExplorationRecommendationsAggregator.stop_computation(
                self.admin_id)
            ModifiedExplorationRecommendationsAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT), 1)
            self.process_and_flush_pending_tasks()
            recommendations = (
                recommendations_services.get_exploration_recommendations(
                    'exp_id_1'))
            self.assertEqual(recommendations, ['exp_id_2', 'exp_id_3'])
