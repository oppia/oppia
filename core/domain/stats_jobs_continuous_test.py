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

"""Tests for statistics continuous computations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import stats_jobs_continuous
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

(exp_models, stats_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics])

EMPTY_STATE_HIT_COUNTS_DICT = {
    feconf.DEFAULT_INIT_STATE_NAME: {
        'total_entry_count': 0,
        'no_answer_count': 0,
        'first_entry_count': 0,
    }
}


class InteractionAnswerSummariesAggregatorTests(test_utils.GenericTestBase):
    """Tests for interaction answer view aggregations."""

    def _record_start(self, exp_id, exp_version, state_name, session_id):
        """Calls StartExplorationEventHandler and starts recording the
        exploration events corresponding to the given exploration id.
        """
        event_services.StartExplorationEventHandler.record(
            exp_id, exp_version, state_name, session_id, {},
            feconf.PLAY_TYPE_NORMAL)

    def _get_calc_output_model(
            self, exploration_id, state_name, calculation_id,
            exploration_version=stats_jobs_continuous.VERSION_ALL):
        """Gets the StateAnswersCalcOutputModel corresponding to the given
        calculation_id.
        """
        return stats_models.StateAnswersCalcOutputModel.get_model(
            exploration_id, exploration_version, state_name, calculation_id)

    def _disable_batch_continuation(self):
        """Context manager that stops jobs from continuously batching tasks."""
        class NonContinuousInteractionAnswerSummariesAggregator(
                stats_jobs_continuous.InteractionAnswerSummariesAggregator):
            """A modified InteractionAnswerSummariesAggregator which does not
            start a new batch job when the previous one has finished.
            """

            @classmethod
            def _kickoff_batch_job_after_previous_one_ends(cls):
                pass
        return self.swap(
            stats_jobs_continuous, 'InteractionAnswerSummariesAggregator',
            NonContinuousInteractionAnswerSummariesAggregator)

    def test_answers_for_states_with_unicode_names(self):
        exp_id = 'eid'
        exp = self.save_new_valid_exploration(exp_id, 'author@website.com')
        # State names used by our test server to confirm unicode support.
        unicode_state_names = [
            'ÐšÐ°ÐºÐ¸Ðµ Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ð¸? Ð¤Ñ€Ð°Ð·Ñ‹ Ð½Ð° Ð´Ð¸Ð°Ð',
            'SadrÅ¾aj 1'
        ]
        exp = self.save_new_linear_exp_with_state_names_and_interactions(
            exp_id, 'author@website.com', unicode_state_names,
            ['MultipleChoiceInput'])

        event_services.AnswerSubmissionEventHandler.record(
            exp_id, exp.version, unicode_state_names[0], 'MultipleChoiceInput',
            0, 0, exp_domain.EXPLICIT_CLASSIFICATION, 'session1',
            5.0, {}, 'answer1')

        event_services.AnswerSubmissionEventHandler.record(
            exp_id, exp.version, unicode_state_names[1], 'MultipleChoiceInput',
            0, 0, exp_domain.EXPLICIT_CLASSIFICATION, 'session1',
            5.0, {}, 'answer2')

        with self._disable_batch_continuation():
            job_class, job_manager = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator,
                stats_jobs_continuous.InteractionAnswerSummariesMRJobManager)
            job_id = job_class.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

        # A successful job should output nothing.
        self.assertEqual(job_manager.get_output(job_id), [])

    def test_one_answer(self):
        with self._disable_batch_continuation():
            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            first_state_name = exp.init_state_name
            second_state_name = 'State 2'
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': first_state_name,
                    'new_value': {
                        'choices': {
                            'value': [{
                                'content_id': 'ca_choices_0',
                                'html': '<p>Choice 1</p>'
                            }]
                        },
                        'showChoicesInShuffledOrder': {'value': True}
                    }
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': second_state_name,
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': second_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': second_state_name,
                    'new_value': {
                        'choices': {
                            'value': [{
                                'content_id': 'ca_choices_0',
                                'html': '<p>Choice 1</p>'
                            }]
                        },
                        'showChoicesInShuffledOrder': {'value': True}
                    }
                })], 'Add new state')
            exp = exp_fetchers.get_exploration_by_id(exp_id)
            exp_version = exp.version

            time_spent = 5.0
            params = {}

            self._record_start(
                exp_id, exp_version, first_state_name, 'session1')
            self._record_start(
                exp_id, exp_version, first_state_name, 'session2')
            self.process_and_flush_pending_tasks()

            # Add some answers.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 'MultipleChoiceInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer1')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 'MultipleChoiceInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, 'session2', time_spent,
                params, 'answer1')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 'MultipleChoiceInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer2')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, second_state_name, 'MultipleChoiceInput',
                0, 0, exp_domain.EXPLICIT_CLASSIFICATION, 'session2',
                time_spent, params, 'answer3')

            # Run job on exploration with answers.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            calc_id = 'AnswerFrequencies'

            # Get job output of first state and check it.
            calc_output_model = self._get_calc_output_model(
                exp_id, first_state_name, calc_id,
                exploration_version=exp_version)
            self.assertEqual(
                'AnswerFrequencies', calc_output_model.calculation_id)

            calculation_output = calc_output_model.calculation_output

            expected_calculation_output = [{
                'answer': 'answer1',
                'frequency': 2
            }, {
                'answer': 'answer2',
                'frequency': 1
            }]

            self.assertEqual(calculation_output, expected_calculation_output)

            # Get job output of second state and check it.
            calc_output_model = self._get_calc_output_model(
                exp_id, second_state_name, calc_id,
                exploration_version=exp_version)

            self.assertEqual(
                'AnswerFrequencies', calc_output_model.calculation_id)

            calculation_output = calc_output_model.calculation_output

            expected_calculation_output = [{
                'answer': 'answer3',
                'frequency': 1
            }]

            self.assertEqual(calculation_output, expected_calculation_output)

    def test_one_answer_ignored_for_deleted_exploration(self):
        with self._disable_batch_continuation():
            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            first_state_name = exp.init_state_name
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': first_state_name,
                    'new_value': {
                        'choices': {
                            'value': [{
                                'content_id': 'ca_choices_0',
                                'html': '<p>Choice 1</p>'
                            }]
                        },
                        'showChoicesInShuffledOrder': {'value': True}
                    }
                })], 'Update interaction type')
            exp = exp_fetchers.get_exploration_by_id(exp_id)
            exp_version = exp.version

            time_spent = 5.0
            params = {}

            self._record_start(
                exp_id, exp_version, first_state_name, 'session1')
            self.process_and_flush_pending_tasks()

            # Add an answer.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 'MultipleChoiceInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer1')

            # Delete the exploration.
            exp_services.delete_exploration('fake@user.com', exp_id)

            # Now run the job.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # There should be no job output corresponding to all versions since
            # the exploration was deleted before the job could run. Note that
            # this applies regardless of whether the job runs before or after
            # deletion of the exploration.
            calc_output_model = self._get_calc_output_model(
                exp_id, first_state_name, 'AnswerFrequencies')
            self.assertIsNone(calc_output_model)

    def test_answers_across_multiple_exploration_versions(self):
        with self._disable_batch_continuation():
            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            first_state_name = exp.init_state_name
            second_state_name = 'State 2'
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': first_state_name,
                    'new_value': {
                        'choices': {
                            'value': [{
                                'content_id': 'ca_choices_0',
                                'html': '<p>Choice 1</p>'
                            }]
                        },
                        'showChoicesInShuffledOrder': {'value': True}
                    }
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': second_state_name,
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': second_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'MultipleChoiceInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': second_state_name,
                    'new_value': {
                        'choices': {
                            'value': [{
                                'content_id': 'ca_choices_0',
                                'html': '<p>Choice 1</p>'
                            }]
                        },
                        'showChoicesInShuffledOrder': {'value': True}
                    }
                })], 'Add new state')
            exp = exp_fetchers.get_exploration_by_id(exp_id)
            exp_version = exp.version

            time_spent = 5.0
            params = {}

            # Add an answer.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 'MultipleChoiceInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer1')

            # Run the answers aggregation job.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            calc_id = 'AnswerFrequencies'

            # Check the output of the job.
            calc_output_first_model = self._get_calc_output_model(
                exp_id, first_state_name, calc_id, exploration_version='2')
            calc_output_all_model = self._get_calc_output_model(
                exp_id, first_state_name, calc_id)

            self.assertEqual(
                'AnswerFrequencies', calc_output_first_model.calculation_id)
            self.assertEqual(
                'AnswerFrequencies', calc_output_all_model.calculation_id)

            calculation_output_first = (
                calc_output_first_model.calculation_output)
            calculation_output_all = calc_output_all_model.calculation_output

            expected_calculation_output_first_answer = [{
                'answer': 'answer1',
                'frequency': 1
            }]

            self.assertEqual(
                calculation_output_first,
                expected_calculation_output_first_answer)
            self.assertEqual(
                calculation_output_all,
                expected_calculation_output_first_answer)

            # Try modifying the exploration and adding another answer.
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'third state',
                })], 'Adding yet another state')
            exp = exp_fetchers.get_exploration_by_id(exp_id)
            self.assertNotEqual(exp.version, exp_version)

            # Submit another answer.
            exp_version = exp.version
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 'MultipleChoiceInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, 'session2', time_spent,
                params, 'answer1')

            # Run the aggregator again.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .stop_computation('a'))
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # Extract the output from the job.
            calc_output_first_model = self._get_calc_output_model(
                exp_id, first_state_name, calc_id, exploration_version='2')
            calc_output_second_model = self._get_calc_output_model(
                exp_id, first_state_name, calc_id, exploration_version='3')
            calc_output_all_model = self._get_calc_output_model(
                exp_id, first_state_name, calc_id)

            self.assertEqual(
                'AnswerFrequencies', calc_output_first_model.calculation_id)
            self.assertEqual(
                'AnswerFrequencies', calc_output_second_model.calculation_id)
            self.assertEqual(
                'AnswerFrequencies', calc_output_all_model.calculation_id)

            calculation_output_first = (
                calc_output_first_model.calculation_output)
            calculation_output_second = (
                calc_output_second_model.calculation_output)
            calculation_output_all = (
                calc_output_all_model.calculation_output)

            # The output for version 2 of the exploration should be the same,
            # but the total combined output should include both answers. Also,
            # the output for version 3 should only include the second answer.
            expected_calculation_output_second_answer = [{
                'answer': 'answer1',
                'frequency': 1
            }]
            expected_calculation_output_all_answers = [{
                'answer': 'answer1',
                'frequency': 2
            }]

            self.assertEqual(
                calculation_output_first,
                expected_calculation_output_first_answer)
            self.assertEqual(
                calculation_output_second,
                expected_calculation_output_second_answer)
            self.assertEqual(
                calculation_output_all,
                expected_calculation_output_all_answers)

    def test_ignores_old_answers_if_new_interaction_has_no_new_answers(self):
        """Similar to test_answers_across_multiple_exploration_versions except
        the exploration has changed interactions in the new versions. The
        aggregation job should not include answers corresponding to exploration
        versions which do not match the latest version's interaction ID.
        """
        with self._disable_batch_continuation():
            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            init_state_name = exp.init_state_name

            time_spent = 5.0
            params = {}

            # Add a few different answers.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'verb')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, '2')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'verb')

            # Change the interaction.
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': init_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'NumericInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': init_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'new_value': {},
                })], 'Change to NumericInput')

            exp = exp_fetchers.get_exploration_by_id(exp_id)
            self.assertEqual(exp.version, 2)

            # Run the answers aggregation job.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            calc_id = 'Top10AnswerFrequencies'

            # Check the output of the job.
            calc_output_model_latest_version = self._get_calc_output_model(
                exp_id, init_state_name, calc_id, exploration_version='2')
            calc_output_model_first_version = self._get_calc_output_model(
                exp_id, init_state_name, calc_id, exploration_version='1')
            calc_output_model_all = self._get_calc_output_model(
                exp_id, init_state_name, calc_id)

            # Since no answers were submitted to the latest version of the
            # exploration, there should be no calculated output for it.
            self.assertIsNone(calc_output_model_latest_version)

            # Top answers will still be computed for the first version.
            self.assertEqual(
                'Top10AnswerFrequencies',
                calc_output_model_first_version.calculation_id)
            calculation_output_first = (
                calc_output_model_first_version.calculation_output)
            expected_calculation_output_first_answer = [{
                'answer': 'verb',
                'frequency': 2
            }, {
                'answer': '2',
                'frequency': 1
            }]
            self.assertEqual(
                calculation_output_first,
                expected_calculation_output_first_answer)

            self.assertEqual(
                'Top10AnswerFrequencies', calc_output_model_all.calculation_id)

            # No answers should be aggregated since all past answers do not
            # match the newly submitted interaction ID.
            calculation_output_all = calc_output_model_all.calculation_output
            self.assertEqual(calculation_output_all, [])

    def test_uses_old_answers_if_updated_exploration_has_same_interaction(self):
        """Similar to
        test_ignores_old_answers_if_new_interaction_has_no_new_answers except
        this is demonstrating that if an exploration is updated and no new
        answers are submitted to the new version, but the interaction ID is the
        same then old answers should still be aggregated.
        """
        with self._disable_batch_continuation():
            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            init_state_name = exp.init_state_name

            time_spent = 5.0
            params = {}

            # Add a few different answers.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'verb')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, '2')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'verb')

            # Change something other than the interaction ID.
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': init_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>New content</p>'
                    },
                })], 'Change state content')

            exp = exp_fetchers.get_exploration_by_id(exp_id)
            self.assertEqual(exp.version, 2)

            # Run the answers aggregation job.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            calc_id = 'Top10AnswerFrequencies'

            # Extract the output from the job.
            calc_output_model_latest_version = self._get_calc_output_model(
                exp_id, init_state_name, calc_id, exploration_version='2')
            calc_output_model_all = self._get_calc_output_model(
                exp_id, init_state_name, calc_id)

            # Since no answers were submitted to the latest version of the
            # exploration, there should be no calculated output for it.
            self.assertIsNone(calc_output_model_latest_version)

            self.assertEqual(
                'Top10AnswerFrequencies', calc_output_model_all.calculation_id)
            calculation_output_all = calc_output_model_all.calculation_output
            expected_calculation_output_all_answers = [{
                'answer': 'verb',
                'frequency': 2
            }, {
                'answer': '2',
                'frequency': 1
            }]
            self.assertEqual(
                calculation_output_all,
                expected_calculation_output_all_answers)

    def test_answers_across_multiple_exp_versions_different_interactions(self):
        """Same as
        test_ignores_old_answers_if_new_interaction_has_no_new_answers except
        this also adds additional answers after changing the interaction a few
        times to ensure the aggregation job does not include answers across
        interaction changes, even if the interaction reverts back to a past
        interaction type with answers submitted to both versions of the
        exploration.
        """
        with self._disable_batch_continuation():
            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            init_state_name = exp.init_state_name

            time_spent = 5.0
            params = {}

            # Add a few different answers.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'verb')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, '2')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 1, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'verb')

            # Change the interaction ID.
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': init_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'NumericInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': init_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'new_value': {},
                })], 'Change to NumericInput')

            # Submit an answer to the numeric interaction.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 2, init_state_name, 'NumericInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 2)

            # Change back the interaction ID.
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': init_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'TextInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'state_name': init_state_name,
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': 'ca_placeholder_0',
                                'unicode_str': ''
                            }
                        },
                        'rows': {'value': 1}
                    }
                })], 'Change to TextInput')

            # Submit another number-like answer.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 3, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, '2')

            # Create a 4th exploration version by changing the state's content.
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': init_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>New content description</p>'
                    }
                })], 'Change content description')

            # Submit some more answers to the latest exploration version.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 4, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'noun')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 4, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'verb')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, 4, init_state_name, 'TextInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'noun')

            exp = exp_fetchers.get_exploration_by_id(exp_id)
            self.assertEqual(exp.version, 4)

            # Run the answers aggregation job.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            calc_id = 'Top10AnswerFrequencies'

            # Check the output of the job.
            calc_output_latest_version_model = self._get_calc_output_model(
                exp_id, init_state_name, calc_id, exploration_version='4')
            calc_output_all_model = self._get_calc_output_model(
                exp_id, init_state_name, calc_id)

            self.assertEqual(
                'Top10AnswerFrequencies',
                calc_output_latest_version_model.calculation_id)
            self.assertEqual(
                'Top10AnswerFrequencies', calc_output_all_model.calculation_id)

            expected_calculation_latest_version_output = [{
                'answer': 'noun',
                'frequency': 2
            }, {
                'answer': 'verb',
                'frequency': 1
            }]

            # Only includes versions 3-4 since version 2 has a different
            # interaction ID. Note that the output is dependent on the order of
            # submission (verb submitted before 2 -> verb ranked higher).
            expected_calculation_all_versions_output = [{
                'answer': 'noun',
                'frequency': 2
            }, {
                'answer': 'verb',
                'frequency': 1
            }, {
                'answer': '2',
                'frequency': 1
            }]

            calculation_latest_version_output = (
                calc_output_latest_version_model.calculation_output)
            calculation_output_all = calc_output_all_model.calculation_output

            self.assertEqual(
                calculation_latest_version_output,
                expected_calculation_latest_version_output)
            self.assertEqual(
                calculation_output_all,
                expected_calculation_all_versions_output)

    def test_multiple_computations_in_one_job(self):
        with self._disable_batch_continuation():
            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            first_state_name = exp.init_state_name
            second_state_name = 'State 2'
            exp_services.update_exploration('fake@user.com', exp_id, [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'SetInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'new_value': {
                        'buttonText': {
                            'value': {
                                'content_id': 'ca_buttonText_0',
                                'unicode_str': 'Enter here'
                            }
                        },
                    }
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': second_state_name,
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': second_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'SetInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': second_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'new_value': {
                        'buttonText': {
                            'value': {
                                'content_id': 'ca_buttonText_0',
                                'unicode_str': 'Enter here'
                            }
                        },
                    }
                })], 'Add new state')
            exp = exp_fetchers.get_exploration_by_id(exp_id)
            exp_version = exp.version

            time_spent = 5.0
            params = {}

            # Add an answer.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 'SetInput', 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, ['answer1', 'answer2'])

            # Run the aggregator job.
            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # Retrieve outputs for all of the computations running on this
            # interaction.
            answer_frequencies_calc_output_model = self._get_calc_output_model(
                exp_id, first_state_name, 'Top10AnswerFrequencies')
            self.assertEqual(
                'Top10AnswerFrequencies',
                answer_frequencies_calc_output_model.calculation_id)

            common_elements_calc_output_model = self._get_calc_output_model(
                exp_id, first_state_name, 'FrequencyCommonlySubmittedElements')
            self.assertEqual(
                'FrequencyCommonlySubmittedElements',
                common_elements_calc_output_model.calculation_id)

            calculation_output_first = (
                answer_frequencies_calc_output_model.calculation_output)
            calculation_output_second = (
                common_elements_calc_output_model.calculation_output)

            self.assertEqual(
                calculation_output_first, [{
                    'answer': ['answer1', 'answer2'],
                    'frequency': 1
                }])
            self.assertEqual(
                calculation_output_second, [{
                    'answer': 'answer1',
                    'frequency': 1
                }, {
                    'answer': 'answer2',
                    'frequency': 1
                }])

    def test_computation_with_different_interaction_id_for_same_exp_passes(
            self):
        with self._disable_batch_continuation():
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'fake@user.com')

            stats_models.StateAnswersModel(
                id='id_1',
                exploration_id=exp_id,
                exploration_version=1,
                state_name='State',
                shard_id=1,
                interaction_id='TextInput').put()
            stats_models.StateAnswersModel(
                id='id_2',
                exploration_id=exp_id,
                exploration_version=1,
                state_name='State',
                shard_id=1,
                interaction_id='SetInput').put()

            (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator
                .start_computation())
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)
