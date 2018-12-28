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

"""Tests for core.domain.stats_domain."""

from core.domain import exp_domain
from core.domain import stats_domain
from core.tests import test_utils
import feconf
import utils


class ExplorationStatsTests(test_utils.GenericTestBase):
    """Tests the ExplorationStats domain object."""

    def _get_exploration_stats_from_dict(self, exploration_stats_dict):
        """Converts and returns the ExplorationStats object from the given
        exploration stats dict.
        """
        state_stats_mapping = {}
        for state_name in exploration_stats_dict['state_stats_mapping']:
            state_stats_mapping[state_name] = stats_domain.StateStats.from_dict(
                exploration_stats_dict['state_stats_mapping'][state_name])
        return stats_domain.ExplorationStats(
            exploration_stats_dict['exp_id'],
            exploration_stats_dict['exp_version'],
            exploration_stats_dict['num_starts_v1'],
            exploration_stats_dict['num_starts_v2'],
            exploration_stats_dict['num_actual_starts_v1'],
            exploration_stats_dict['num_actual_starts_v2'],
            exploration_stats_dict['num_completions_v1'],
            exploration_stats_dict['num_completions_v2'],
            state_stats_mapping)

    def test_to_dict(self):
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        expected_exploration_stats_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'num_starts_v1': 0,
            'num_starts_v2': 30,
            'num_actual_starts_v1': 0,
            'num_actual_starts_v2': 10,
            'num_completions_v1': 0,
            'num_completions_v2': 5,
            'state_stats_mapping': {
                'Home': state_stats_dict
            }
        }
        observed_exploration_stats = self._get_exploration_stats_from_dict(
            expected_exploration_stats_dict)
        self.assertDictEqual(
            expected_exploration_stats_dict,
            observed_exploration_stats.to_dict())

    def test_get_sum_of_first_hit_counts(self):
        """Test the get_sum_of_first_hit_counts method."""
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        exploration_stats_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'num_starts_v1': 0,
            'num_starts_v2': 30,
            'num_actual_starts_v1': 0,
            'num_actual_starts_v2': 10,
            'num_completions_v1': 0,
            'num_completions_v2': 5,
            'state_stats_mapping': {
                'Home': state_stats_dict,
                'Home2': state_stats_dict
            }
        }
        exploration_stats = self._get_exploration_stats_from_dict(
            exploration_stats_dict)

        self.assertEqual(exploration_stats.get_sum_of_first_hit_counts(), 14)

    def test_validate(self):
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        exploration_stats_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'num_starts_v1': 0,
            'num_starts_v2': 30,
            'num_actual_starts_v1': 0,
            'num_actual_starts_v2': 10,
            'num_completions_v1': 0,
            'num_completions_v2': 5,
            'state_stats_mapping': {
                'Home': state_stats_dict
            }
        }
        exploration_stats = self._get_exploration_stats_from_dict(
            exploration_stats_dict)
        exploration_stats.validate()

        # Make the exp_id integer.
        exploration_stats.exp_id = 10
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected exp_id to be a string')):
            exploration_stats.validate()

        # Make the num_actual_starts string.
        exploration_stats.exp_id = 'exp_id1'
        exploration_stats.num_actual_starts_v2 = '0'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected num_actual_starts_v2 to be an int')):
            exploration_stats.validate()

        # Make the state_stats_mapping list.
        exploration_stats.num_actual_starts_v2 = 10
        exploration_stats.state_stats_mapping = []
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected state_stats_mapping to be a dict')):
            exploration_stats.validate()

        # Make the num_completions negative.
        exploration_stats.state_stats_mapping = {}
        exploration_stats.num_completions_v2 = -5
        with self.assertRaisesRegexp(utils.ValidationError, (
            '%s cannot have negative values' % ('num_completions_v2'))):
            exploration_stats.validate()


class StateStatsTests(test_utils.GenericTestBase):
    """Tests the StateStats domain object."""

    def test_from_dict(self):
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        state_stats = stats_domain.StateStats(0, 10, 0, 4, 0, 18, 0, 7, 2, 0, 2)
        expected_state_stats = stats_domain.StateStats.from_dict(
            state_stats_dict)
        self.assertEqual(
            state_stats.total_answers_count_v1,
            expected_state_stats.total_answers_count_v1)
        self.assertEqual(
            state_stats.total_answers_count_v2,
            expected_state_stats.total_answers_count_v2)
        self.assertEqual(
            state_stats.useful_feedback_count_v1,
            expected_state_stats.useful_feedback_count_v1)
        self.assertEqual(
            state_stats.useful_feedback_count_v2,
            expected_state_stats.useful_feedback_count_v2)
        self.assertEqual(
            state_stats.total_hit_count_v1,
            expected_state_stats.total_hit_count_v1)
        self.assertEqual(
            state_stats.total_hit_count_v2,
            expected_state_stats.total_hit_count_v2)
        self.assertEqual(
            state_stats.first_hit_count_v1,
            expected_state_stats.first_hit_count_v1)
        self.assertEqual(
            state_stats.first_hit_count_v2,
            expected_state_stats.first_hit_count_v2)
        self.assertEqual(
            state_stats.num_times_solution_viewed_v2,
            expected_state_stats.num_times_solution_viewed_v2)
        self.assertEqual(
            state_stats.num_completions_v1,
            expected_state_stats.num_completions_v1)
        self.assertEqual(
            state_stats.num_completions_v2,
            expected_state_stats.num_completions_v2)

    def test_create_default(self):
        state_stats = stats_domain.StateStats.create_default()
        self.assertEqual(state_stats.total_answers_count_v1, 0)
        self.assertEqual(state_stats.total_answers_count_v2, 0)
        self.assertEqual(state_stats.useful_feedback_count_v1, 0)
        self.assertEqual(state_stats.useful_feedback_count_v2, 0)
        self.assertEqual(state_stats.total_hit_count_v1, 0)
        self.assertEqual(state_stats.total_hit_count_v2, 0)
        self.assertEqual(state_stats.total_answers_count_v1, 0)
        self.assertEqual(state_stats.total_answers_count_v2, 0)
        self.assertEqual(state_stats.num_times_solution_viewed_v2, 0)
        self.assertEqual(state_stats.num_completions_v1, 0)
        self.assertEqual(state_stats.num_completions_v2, 0)

    def test_to_dict(self):
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        state_stats = stats_domain.StateStats(0, 10, 0, 4, 0, 18, 0, 7, 2, 0, 2)
        self.assertEqual(state_stats_dict, state_stats.to_dict())

    def test_validation(self):
        state_stats = stats_domain.StateStats(0, 10, 0, 4, 0, 18, 0, 7, 2, 0, 2)
        state_stats.validate()

        # Change total_answers_count to string.
        state_stats.total_answers_count_v2 = '10'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected total_answers_count_v2 to be an int')):
            state_stats.validate()

        # Make the total_answers_count negative.
        state_stats.total_answers_count_v2 = -5
        with self.assertRaisesRegexp(utils.ValidationError, (
            '%s cannot have negative values' % ('total_answers_count_v2'))):
            state_stats.validate()


class ExplorationIssuesTests(test_utils.GenericTestBase):
    """Tests the ExplorationIssues domain object."""

    def test_create_default(self):
        exp_issues = stats_domain.ExplorationIssues.create_default('exp_id1', 1)
        self.assertEqual(exp_issues.exp_id, 'exp_id1')
        self.assertEqual(exp_issues.exp_version, 1)
        self.assertEqual(exp_issues.unresolved_issues, [])

    def test_to_dict(self):
        exp_issues = stats_domain.ExplorationIssues(
            'exp_id1', 1, [
                stats_domain.ExplorationIssue.from_dict({
                    'issue_type': 'EarlyQuit',
                    'issue_customization_args': {
                        'state_name': {
                            'value': 'state_name1'
                        },
                        'time_spent_in_exp_in_msecs': {
                            'value': 200
                        }
                    },
                    'playthrough_ids': ['playthrough_id1'],
                    'schema_version': 1,
                    'is_valid': True})
                ])

        exp_issues_dict = exp_issues.to_dict()

        self.assertEqual(exp_issues_dict['exp_id'], 'exp_id1')
        self.assertEqual(exp_issues_dict['exp_version'], 1)
        self.assertEqual(
            exp_issues_dict['unresolved_issues'], [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1'],
                'schema_version': 1,
                'is_valid': True
            }])

    def test_from_dict(self):
        exp_issues_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'unresolved_issues': [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1'],
                'schema_version': 1,
                'is_valid': True
            }]
        }

        exp_issues = stats_domain.ExplorationIssues.from_dict(exp_issues_dict)

        self.assertEqual(exp_issues.exp_id, 'exp_id1')
        self.assertEqual(exp_issues.exp_version, 1)
        self.assertEqual(
            exp_issues.unresolved_issues[0].to_dict(),
            {
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1'],
                'schema_version': 1,
                'is_valid': True})

    def test_validate(self):
        exp_issues = stats_domain.ExplorationIssues(
            'exp_id1', 1, [
                stats_domain.ExplorationIssue.from_dict({
                    'issue_type': 'EarlyQuit',
                    'issue_customization_args': {
                        'state_name': {
                            'value': 'state_name1'
                        },
                        'time_spent_in_exp_in_msecs': {
                            'value': 200
                        }
                    },
                    'playthrough_ids': ['playthrough_id1'],
                    'schema_version': 1,
                    'is_valid': True})
                ])
        exp_issues.validate()

        # Change ID to int.
        exp_issues.exp_id = 5
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected exp_id to be a string, received %s' % (type(5)))):
            exp_issues.validate()


class PlaythroughTests(test_utils.GenericTestBase):
    """Tests the Playthrough domain object."""

    def test_to_dict(self):
        playthrough = stats_domain.Playthrough(
            'exp_id1', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [stats_domain.LearnerAction.from_dict({
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            })])

        playthrough_dict = playthrough.to_dict()

        self.assertEqual(playthrough_dict['exp_id'], 'exp_id1')
        self.assertEqual(playthrough_dict['exp_version'], 1)
        self.assertEqual(playthrough_dict['issue_type'], 'EarlyQuit')
        self.assertEqual(
            playthrough_dict['issue_customization_args'], {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            })
        self.assertEqual(
            playthrough_dict['actions'], [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {
                            'value': 'state_name1'
                        }
                    },
                    'schema_version': 1
                }])

    def test_from_dict(self):
        playthrough_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            'actions': [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }],
        }

        playthrough = stats_domain.Playthrough.from_dict(playthrough_dict)

        self.assertEqual(playthrough.exp_id, 'exp_id1')
        self.assertEqual(playthrough.exp_version, 1)
        self.assertEqual(playthrough.issue_type, 'EarlyQuit')
        self.assertEqual(
            playthrough.issue_customization_args, {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            })
        self.assertEqual(
            playthrough.actions[0].to_dict(),
            {
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            })

    def test_from_backend_dict(self):
        """Test the from_backend_dict() method."""
        # Test that a playthrough dict without 'exp_id' key raises exception.
        playthrough_dict = {
            'exp_version': 1,
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {},
            'actions': []
        }
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'exp_id not in playthrough data dict.'):
            stats_domain.Playthrough.from_backend_dict(playthrough_dict)

    def test_validate(self):
        playthrough = stats_domain.Playthrough(
            'exp_id1', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [stats_domain.LearnerAction.from_dict({
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            })])
        playthrough.validate()

        # Change exp_version to string.
        playthrough.exp_version = '1'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected exp_version to be an int, received %s' % (type('1')))):
            playthrough.validate()

        # Change to invalid issue_type.
        playthrough.exp_version = 1
        playthrough.issue_type = 'InvalidIssueType'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Invalid issue type: %s' % playthrough.issue_type)):
            playthrough.validate()

        # Change to invalid action_type.
        playthrough.issue_type = 'EarlyQuit'
        playthrough.actions = [
            stats_domain.LearnerAction.from_dict({
                'action_type': 'InvalidActionType',
                'schema_version': 1,
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
            })]
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Invalid action type: %s' % 'InvalidActionType')):
            playthrough.validate()


class ExplorationIssueTests(test_utils.GenericTestBase):
    """Tests the ExplorationIssue domain object."""

    def _dummy_convert_issue_v1_dict_to_v2_dict(self, issue_dict):
        """A test implementation of schema conversion function."""
        issue_dict['schema_version'] = 2
        if issue_dict['issue_type'] == 'EarlyQuit':
            issue_dict['issue_type'] = 'EarlyQuit1'
            issue_dict['issue_customization_args']['new_key'] = 5

        return issue_dict

    def test_to_dict(self):
        exp_issue = stats_domain.ExplorationIssue('EarlyQuit', {}, [], 1, True)
        exp_issue_dict = exp_issue.to_dict()
        expected_customization_args = {
            'time_spent_in_exp_in_msecs': {
                'value': 0
            },
            'state_name': {
                'value': ''
            }
        }
        self.assertEqual(
            exp_issue_dict, {
                'issue_type': 'EarlyQuit',
                'issue_customization_args': expected_customization_args,
                'playthrough_ids': [],
                'schema_version': 1,
                'is_valid': True
            })

    def test_from_backend_dict(self):
        """Test the from_backend_dict() method."""
        # Test that an exploration issue dict without 'issue_type' key raises
        # exception.
        exp_issue_dict = {
            'issue_customization_args': {},
            'playthrough_ids': [],
            'schema_version': 1,
            'is_valid': True
        }
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'issue_type not in exploration issue dict.'):
            stats_domain.ExplorationIssue.from_backend_dict(exp_issue_dict)

    def test_update_exp_issue_from_model(self):
        """Test the migration of exploration issue domain objects."""
        exp_issue = stats_domain.ExplorationIssue('EarlyQuit', {}, [], 1, True)
        exp_issue_dict = exp_issue.to_dict()

        with self.swap(
            stats_domain.ExplorationIssue,
            '_convert_issue_v1_dict_to_v2_dict',
            self._dummy_convert_issue_v1_dict_to_v2_dict):
            stats_domain.ExplorationIssue.update_exp_issue_from_model(
                exp_issue_dict)
        self.assertEqual(exp_issue_dict['issue_type'], 'EarlyQuit1')
        self.assertEqual(
            exp_issue_dict['issue_customization_args']['new_key'], 5)

        # For other issue types, no changes happen during migration.
        exp_issue1 = stats_domain.ExplorationIssue(
            'MultipleIncorrectSubmissions', {}, [], 1, True)
        exp_issue_dict1 = exp_issue1.to_dict()
        with self.swap(
            stats_domain.ExplorationIssue,
            '_convert_issue_v1_dict_to_v2_dict',
            self._dummy_convert_issue_v1_dict_to_v2_dict):
            stats_domain.ExplorationIssue.update_exp_issue_from_model(
                exp_issue_dict1)
        self.assertEqual(
            exp_issue_dict1['issue_type'], 'MultipleIncorrectSubmissions')

    def test_validate(self):
        exp_issue = stats_domain.ExplorationIssue('EarlyQuit', {}, [], 1, True)
        exp_issue.validate()

        # Change issue_type to int.
        exp_issue.issue_type = 5
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected issue_type to be a string, received %s' % (type(5)))):
            exp_issue.validate()

        # Change schema_version to string.
        exp_issue.issue_type = 'EarlyQuit'
        exp_issue.schema_version = '1'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected schema_version to be an int, received %s' % (type('1')))):
            exp_issue.validate()


class LearnerActionTests(test_utils.GenericTestBase):
    """Tests the LearnerAction domain object."""

    def _dummy_convert_action_v1_dict_to_v2_dict(self, action_dict):
        """A test implementation of schema conversion function."""
        action_dict['schema_version'] = 2
        if action_dict['action_type'] == 'ExplorationStart':
            action_dict['action_type'] = 'ExplorationStart1'
            action_dict['action_customization_args']['new_key'] = 5

        return action_dict

    def test_to_dict(self):
        learner_action = stats_domain.LearnerAction('ExplorationStart', {}, 1)
        learner_action_dict = learner_action.to_dict()
        expected_customization_args = {
            'state_name': {
                'value': ''
            }
        }
        self.assertEqual(
            learner_action_dict, {
                'action_type': 'ExplorationStart',
                'action_customization_args': expected_customization_args,
                'schema_version': 1
            })

    def test_update_learner_action_from_model(self):
        """Test the migration of learner action domain objects."""
        learner_action = stats_domain.LearnerAction('ExplorationStart', {}, 1)
        learner_action_dict = learner_action.to_dict()

        with self.swap(
            stats_domain.LearnerAction,
            '_convert_action_v1_dict_to_v2_dict',
            self._dummy_convert_action_v1_dict_to_v2_dict):
            stats_domain.LearnerAction.update_learner_action_from_model(
                learner_action_dict)
        self.assertEqual(
            learner_action_dict['action_type'], 'ExplorationStart1')
        self.assertEqual(
            learner_action_dict['action_customization_args']['new_key'], 5)

        # For other action types, no changes happen during migration.
        learner_action1 = stats_domain.LearnerAction('ExplorationQuit', {}, 1)
        learner_action_dict1 = learner_action1.to_dict()

        with self.swap(
            stats_domain.LearnerAction,
            '_convert_action_v1_dict_to_v2_dict',
            self._dummy_convert_action_v1_dict_to_v2_dict):
            stats_domain.LearnerAction.update_learner_action_from_model(
                learner_action_dict1)
        self.assertEqual(
            learner_action_dict1['action_type'], 'ExplorationQuit')

    def test_validate(self):
        learner_action = stats_domain.LearnerAction('ExplorationStart', {}, 1)
        learner_action.validate()

        # Change action_type to int.
        learner_action.action_type = 5
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected action_type to be a string, received %s' % (type(5)))):
            learner_action.validate()

        # Change schema_version to string.
        learner_action.action_type = 'EarlyQuit'
        learner_action.schema_version = '1'
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected schema_version to be an int, received %s' % (type('1')))):
            learner_action.validate()


class StateAnswersTests(test_utils.GenericTestBase):
    """Tests the StateAnswers domain object."""

    def test_can_retrieve_properly_constructed_submitted_answer_dict_list(self):
        state_answers = stats_domain.StateAnswers(
            'exp_id', 1, 'initial_state', 'TextInput', [
                stats_domain.SubmittedAnswer(
                    'Text', 'TextInput', 0, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'sess', 10.5,
                    rule_spec_str='rule spec str1', answer_str='answer str1'),
                stats_domain.SubmittedAnswer(
                    'Other text', 'TextInput', 1, 0,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION, {}, 'sess', 7.5,
                    rule_spec_str='rule spec str2', answer_str='answer str2')])
        submitted_answer_dict_list = (
            state_answers.get_submitted_answer_dict_list())
        self.assertEqual(
            submitted_answer_dict_list, [{
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': 'rule spec str1',
                'answer_str': 'answer str1'
            }, {
                'answer': 'Other text',
                'interaction_id': 'TextInput',
                'answer_group_index': 1,
                'rule_spec_index': 0,
                'classification_categorization': (
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 7.5,
                'rule_spec_str': 'rule spec str2',
                'answer_str': 'answer str2'
            }])


class StateAnswersValidationTests(test_utils.GenericTestBase):
    """Tests the StateAnswers domain object for validation."""

    def setUp(self):
        super(StateAnswersValidationTests, self).setUp()
        self.state_answers = stats_domain.StateAnswers(
            'exp_id', 1, 'initial_state', 'TextInput', [])

        # The canonical object should have no validation problems.
        self.state_answers.validate()

    def test_exploration_id_must_be_string(self):
        self.state_answers.exploration_id = 0
        self._assert_validation_error(
            self.state_answers, 'Expected exploration_id to be a string')

    def test_state_name_must_be_string(self):
        self.state_answers.state_name = ['state']
        self._assert_validation_error(
            self.state_answers, 'Expected state_name to be a string')

    def test_interaction_id_can_be_none(self):
        self.state_answers.interaction_id = None
        self.state_answers.validate()

    def test_interaction_id_must_otherwise_be_string(self):
        self.state_answers.interaction_id = 10
        self._assert_validation_error(
            self.state_answers, 'Expected interaction_id to be a string')

    def test_interaction_id_must_refer_to_existing_interaction(self):
        self.state_answers.interaction_id = 'FakeInteraction'
        self._assert_validation_error(
            self.state_answers, 'Unknown interaction_id: FakeInteraction')

    def test_submitted_answer_list_must_be_list(self):
        self.state_answers.submitted_answer_list = {}
        self._assert_validation_error(
            self.state_answers, 'Expected submitted_answer_list to be a list')

    def test_schema_version_must_be_integer(self):
        self.state_answers.schema_version = '1'
        self._assert_validation_error(
            self.state_answers, 'Expected schema_version to be an integer')

    def test_schema_version_must_be_between_one_and_current_version(self):
        self.state_answers.schema_version = 0
        self._assert_validation_error(
            self.state_answers, 'schema_version < 1: 0')

        self.state_answers.schema_version = (
            feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION + 1)
        self._assert_validation_error(
            self.state_answers,
            'schema_version > feconf\\.CURRENT_STATE_ANSWERS_SCHEMA_VERSION')

        self.state_answers.schema_version = 1
        self.state_answers.validate()


class SubmittedAnswerTests(test_utils.GenericTestBase):
    """Tests the SubmittedAnswer domain object."""

    def test_can_be_converted_to_from_full_dict(self):
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5, rule_spec_str='rule spec str',
            answer_str='answer str')
        submitted_answer_dict = submitted_answer.to_dict()
        cloned_submitted_answer = stats_domain.SubmittedAnswer.from_dict(
            submitted_answer_dict)
        self.assertEqual(
            cloned_submitted_answer.to_dict(), submitted_answer_dict)

    def test_can_be_converted_to_full_dict(self):
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5, rule_spec_str='rule spec str',
            answer_str='answer str')
        self.assertEqual(submitted_answer.to_dict(), {
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        })

    def test_dict_may_not_include_rule_spec_str_or_answer_str(self):
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5)
        self.assertEqual(submitted_answer.to_dict(), {
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5
        })

    def test_requires_answer_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'answer'):
            stats_domain.SubmittedAnswer.from_dict({
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_interaction_id_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'interaction_id'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_answer_group_index_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'answer_group_index'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_rule_spec_index_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'rule_spec_index'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_classification_categ_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'classification_categorization'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_params_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'params'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_session_id_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'session_id'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'time_spent_in_sec': 10.5
            })

    def test_requires_time_spent_in_sec_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'time_spent_in_sec'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
            })

    def test_can_be_created_from_full_dict(self):
        submitted_answer = stats_domain.SubmittedAnswer.from_dict({
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        })
        self.assertEqual(submitted_answer.answer, 'Text')
        self.assertEqual(submitted_answer.interaction_id, 'TextInput')
        self.assertEqual(submitted_answer.answer_group_index, 0)
        self.assertEqual(submitted_answer.rule_spec_index, 1)
        self.assertEqual(
            submitted_answer.classification_categorization,
            exp_domain.EXPLICIT_CLASSIFICATION)
        self.assertEqual(submitted_answer.params, {})
        self.assertEqual(submitted_answer.session_id, 'sess')
        self.assertEqual(submitted_answer.time_spent_in_sec, 10.5)
        self.assertEqual(submitted_answer.rule_spec_str, 'rule spec str')
        self.assertEqual(submitted_answer.answer_str, 'answer str')

    def test_can_be_created_from_dict_missing_rule_spec_and_answer(self):
        submitted_answer = stats_domain.SubmittedAnswer.from_dict({
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5
        })
        self.assertEqual(submitted_answer.answer, 'Text')
        self.assertEqual(submitted_answer.interaction_id, 'TextInput')
        self.assertEqual(submitted_answer.answer_group_index, 0)
        self.assertEqual(submitted_answer.rule_spec_index, 1)
        self.assertEqual(
            submitted_answer.classification_categorization,
            exp_domain.EXPLICIT_CLASSIFICATION)
        self.assertEqual(submitted_answer.params, {})
        self.assertEqual(submitted_answer.session_id, 'sess')
        self.assertEqual(submitted_answer.time_spent_in_sec, 10.5)
        self.assertIsNone(submitted_answer.rule_spec_str)
        self.assertIsNone(submitted_answer.answer_str)


class SubmittedAnswerValidationTests(test_utils.GenericTestBase):
    """Tests the SubmittedAnswer domain object for validation."""

    def setUp(self):
        super(SubmittedAnswerValidationTests, self).setUp()
        self.submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 0, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'session_id', 0.)

        # The canonical object should have no validation problems.
        self.submitted_answer.validate()

    def test_answer_may_be_none_only_for_linear_interaction(self):
        # It's valid for answer to be None if the interaction type is Continue.
        self.submitted_answer.answer = None
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided answer except for linear '
            'interactions')

        self.submitted_answer.interaction_id = 'Continue'
        self.submitted_answer.validate()

    def test_time_spent_in_sec_must_not_be_none(self):
        self.submitted_answer.time_spent_in_sec = None
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided time_spent_in_sec')

    def test_time_spent_in_sec_must_be_number(self):
        self.submitted_answer.time_spent_in_sec = '0'
        self._assert_validation_error(
            self.submitted_answer, 'Expected time_spent_in_sec to be a number')

    def test_time_spent_in_sec_must_be_positive(self):
        self.submitted_answer.time_spent_in_sec = -1.
        self._assert_validation_error(
            self.submitted_answer,
            'Expected time_spent_in_sec to be non-negative')

    def test_session_id_must_not_be_none(self):
        self.submitted_answer.session_id = None
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided session_id')

    def test_session_id_must_be_string(self):
        self.submitted_answer.session_id = 90
        self._assert_validation_error(
            self.submitted_answer, 'Expected session_id to be a string')

    def test_params_must_be_dict(self):
        self.submitted_answer.params = []
        self._assert_validation_error(
            self.submitted_answer, 'Expected params to be a dict')

    def test_answer_group_index_must_be_integer(self):
        self.submitted_answer.answer_group_index = '0'
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_group_index to be an integer')

    def test_answer_group_index_must_be_positive(self):
        self.submitted_answer.answer_group_index = -1
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_group_index to be non-negative')

    def test_rule_spec_index_can_be_none(self):
        self.submitted_answer.rule_spec_index = None
        self.submitted_answer.validate()

    def test_rule_spec_index_must_be_integer(self):
        self.submitted_answer.rule_spec_index = '0'
        self._assert_validation_error(
            self.submitted_answer, 'Expected rule_spec_index to be an integer')
        self.submitted_answer.rule_spec_index = ''
        self._assert_validation_error(
            self.submitted_answer, 'Expected rule_spec_index to be an integer')
        self.submitted_answer.rule_spec_index = 0
        self.submitted_answer.validate()

    def test_rule_spec_index_must_be_positive(self):
        self.submitted_answer.rule_spec_index = -1
        self._assert_validation_error(
            self.submitted_answer,
            'Expected rule_spec_index to be non-negative')

    def test_classification_categorization_must_be_valid_category(self):
        self.submitted_answer.classification_categorization = (
            exp_domain.TRAINING_DATA_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = (
            exp_domain.STATISTICAL_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = (
            exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = 'soft'
        self._assert_validation_error(
            self.submitted_answer,
            'Expected valid classification_categorization')

    def test_rule_spec_str_must_be_none_or_string(self):
        self.submitted_answer.rule_spec_str = 10
        self._assert_validation_error(
            self.submitted_answer,
            'Expected rule_spec_str to be either None or a string')

        self.submitted_answer.rule_spec_str = 'str'
        self.submitted_answer.validate()

        self.submitted_answer.rule_spec_str = None
        self.submitted_answer.validate()

    def test_answer_str_must_be_none_or_string(self):
        self.submitted_answer.answer_str = 10
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_str to be either None or a string')

        self.submitted_answer.answer_str = 'str'
        self.submitted_answer.validate()

        self.submitted_answer.answer_str = None
        self.submitted_answer.validate()


class AnswerFrequencyListDomainTests(test_utils.GenericTestBase):
    """Tests AnswerFrequencyList for basic domain object operations."""

    ANSWER_A = stats_domain.AnswerOccurrence('answer a', 3)
    ANSWER_B = stats_domain.AnswerOccurrence('answer b', 2)
    ANSWER_C = stats_domain.AnswerOccurrence('answer c', 1)

    def test_has_correct_type(self):
        answer_frequency_list = stats_domain.AnswerFrequencyList([])
        self.assertEqual(
            answer_frequency_list.calculation_output_type,
            stats_domain.CALC_OUTPUT_TYPE_ANSWER_FREQUENCY_LIST)

    def test_defaults_to_empty_list(self):
        answer_frequency_list = stats_domain.AnswerFrequencyList()
        self.assertEqual(len(answer_frequency_list.answer_occurrences), 0)

    def test_create_list_from_raw_object(self):
        answer_frequency_list = (
            stats_domain.AnswerFrequencyList.from_raw_type([{
                'answer': 'answer a', 'frequency': 3
            }, {
                'answer': 'answer b', 'frequency': 2
            }]))
        answer_occurrences = answer_frequency_list.answer_occurrences
        self.assertEqual(len(answer_occurrences), 2)
        self.assertEqual(answer_occurrences[0].answer, 'answer a')
        self.assertEqual(answer_occurrences[0].frequency, 3)
        self.assertEqual(answer_occurrences[1].answer, 'answer b')
        self.assertEqual(answer_occurrences[1].frequency, 2)

    def test_convert_list_to_raw_object(self):
        answer_frequency_list = stats_domain.AnswerFrequencyList(
            [self.ANSWER_A, self.ANSWER_B])
        self.assertEqual(answer_frequency_list.to_raw_type(), [{
            'answer': 'answer a', 'frequency': 3
        }, {
            'answer': 'answer b', 'frequency': 2
        }])


class CategorizedAnswerFrequencyListsDomainTests(test_utils.GenericTestBase):
    """Tests CategorizedAnswerFrequencyLists for basic domain object
    operations.
    """
    ANSWER_A = stats_domain.AnswerOccurrence('answer a', 3)
    ANSWER_B = stats_domain.AnswerOccurrence('answer b', 2)
    ANSWER_C = stats_domain.AnswerOccurrence('answer c', 1)

    def test_has_correct_type(self):
        answer_frequency_lists = (
            stats_domain.CategorizedAnswerFrequencyLists({}))
        self.assertEqual(
            answer_frequency_lists.calculation_output_type,
            stats_domain.CALC_OUTPUT_TYPE_CATEGORIZED_ANSWER_FREQUENCY_LISTS)

    def test_defaults_to_empty_dict(self):
        answer_frequency_lists = stats_domain.CategorizedAnswerFrequencyLists()
        self.assertEqual(
            len(answer_frequency_lists.categorized_answer_freq_lists), 0)

    def test_create_list_from_raw_object(self):
        answer_frequency_lists = (
            stats_domain.CategorizedAnswerFrequencyLists.from_raw_type({
                'category a': [{'answer': 'answer a', 'frequency': 3}],
                'category b': [{
                    'answer': 'answer b',
                    'frequency': 2
                }, {
                    'answer': 'answer c',
                    'frequency': 1
                }]
            }))
        self.assertEqual(
            len(answer_frequency_lists.categorized_answer_freq_lists), 2)
        self.assertIn(
            'category a', answer_frequency_lists.categorized_answer_freq_lists)
        self.assertIn(
            'category b', answer_frequency_lists.categorized_answer_freq_lists)

        category_a_answer_list = (
            answer_frequency_lists.categorized_answer_freq_lists['category a'])
        category_b_answer_list = (
            answer_frequency_lists.categorized_answer_freq_lists['category b'])
        category_a_answers = category_a_answer_list.answer_occurrences
        category_b_answers = category_b_answer_list.answer_occurrences
        self.assertEqual(len(category_a_answers), 1)
        self.assertEqual(len(category_b_answers), 2)

        self.assertEqual(category_a_answers[0].answer, 'answer a')
        self.assertEqual(category_a_answers[0].frequency, 3)
        self.assertEqual(category_b_answers[0].answer, 'answer b')
        self.assertEqual(category_b_answers[0].frequency, 2)
        self.assertEqual(category_b_answers[1].answer, 'answer c')
        self.assertEqual(category_b_answers[1].frequency, 1)

    def test_convert_list_to_raw_object(self):
        answer_frequency_lists = stats_domain.CategorizedAnswerFrequencyLists({
            'category a': stats_domain.AnswerFrequencyList([self.ANSWER_A]),
            'category b': stats_domain.AnswerFrequencyList(
                [self.ANSWER_B, self.ANSWER_C]),
        })
        self.assertEqual(answer_frequency_lists.to_raw_type(), {
            'category a': [{'answer': 'answer a', 'frequency': 3}],
            'category b': [{
                'answer': 'answer b',
                'frequency': 2
            }, {
                'answer': 'answer c',
                'frequency': 1
            }]
        })


class StateAnswersCalcOutputValidationTests(test_utils.GenericTestBase):
    """Tests the StateAnswersCalcOutput domain object for validation."""

    class MockCalculationOutputObjectWithUnknownType(object):
        pass

    def setUp(self):
        super(StateAnswersCalcOutputValidationTests, self).setUp()
        self.state_answers_calc_output = stats_domain.StateAnswersCalcOutput(
            'exp_id', 1, 'initial_state', 'TextInput', 'AnswerFrequencies',
            stats_domain.AnswerFrequencyList.from_raw_type([]))

        # The canonical object should have no validation problems.
        self.state_answers_calc_output.validate()

    def test_exploration_id_must_be_string(self):
        self.state_answers_calc_output.exploration_id = 0
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected exploration_id to be a string')

    def test_state_name_must_be_string(self):
        self.state_answers_calc_output.state_name = ['state']
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected state_name to be a string')

    def test_calculation_id_must_be_string(self):
        self.state_answers_calc_output.calculation_id = ['calculation id']
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected calculation_id to be a string')

    def test_calculation_output_must_be_known_type(self):
        self.state_answers_calc_output.calculation_output = (
            self.MockCalculationOutputObjectWithUnknownType())
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected calculation output to be one of')

    def test_calculation_output_must_be_less_than_one_million_bytes(self):
        occurred_answer = stats_domain.AnswerOccurrence(
            'This is not a long sentence.', 1)
        self.state_answers_calc_output.calculation_output = (
            stats_domain.AnswerFrequencyList(
                [occurred_answer] * 200000))
        self._assert_validation_error(
            self.state_answers_calc_output,
            'calculation_output is too big to be stored')
