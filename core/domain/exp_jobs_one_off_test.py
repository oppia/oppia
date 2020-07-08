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

"""Tests for Exploration-related jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import logging

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import html_cleaner
from core.domain import html_validation_service
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(job_models, exp_models, base_models, classifier_models) = (
    models.Registry.import_models([
        models.NAMES.job, models.NAMES.exploration, models.NAMES.base_model,
        models.NAMES.classifier]))
memcache_services = models.Registry.import_memcache_services()
search_services = models.Registry.import_search_services()
taskqueue_services = models.Registry.import_taskqueue_services()


# This mock should be used only in ExplorationContentValidationJobForCKEditor
# and InteractionCustomizationArgsValidationJob.
# The first job validates the html strings and produces as output the invalid
# strings. If we do not use mock validation for rte while updating
# states and saving exploration, the validation for subtitled html
# in state will fail, thereby resulting in failure of job.
# The second job validates the customization args in html and if the
# mock is not used while updating states and saving explorations,
# the validation for subtitled html in state will fail, thereby
# resulting in failure of job.
def mock_validate(unused_self):
    pass


def run_job_for_deleted_exp(
        self, job_class, check_error=False,
        error_type=None, error_msg=None, function_to_be_called=None,
        exp_id=None):
    """Helper function to run job for a deleted exploration and check the
    output or error condition.
    """
    job_id = job_class.create_new()
    # Check there is one job in the taskqueue corresponding to
    # delete_exploration_from_subscribed_users.
    self.assertEqual(
        self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
    job_class.enqueue(job_id)
    self.assertEqual(
        self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 2)
    self.process_and_flush_pending_tasks()

    if check_error:
        with self.assertRaisesRegexp(error_type, error_msg):
            function_to_be_called(exp_id)

    else:
        self.assertEqual(job_class.get_output(job_id), [])


class DragAndDropSortInputInteractionOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(DragAndDropSortInputInteractionOneOffJobTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)
        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_exp_state_pairs_are_produced_only_for_desired_interactions(self):
        """Checks output pairs are produced only for
        desired interactions.
        """
        owner = user_services.UserActionsInfo(self.albert_id)
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1', 'State2'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']

        state1.update_interaction_id('DragAndDropSortInput')
        state2.update_interaction_id('DragAndDropSortInput')

        customization_args_dict1 = {
            'choices': {'value': [
                '<p>This is value1 for DragAndDropSortInput</p>',
                '<p>This is value2 for DragAndDropSortInput</p>',
            ]}
        }

        answer_group_list1 = [{
            'rule_specs': [{
                'rule_type': 'IsEqualToOrdering',
                'inputs': {'x': [['a'], ['b']]}
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback1',
                    'html': '<p>Outcome for state1</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        customization_args_dict2 = {
            'choices': {'value': [
                '<p>This is value1 for DragAndDropSortInput</p>',
                '<p>This is value2 for DragAndDropSortInput</p>',
            ]}
        }

        answer_group_list2 = [{
            'rule_specs': [{
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                'inputs': {
                    'x': []
                }
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {'x': [['a']]}
            }, {
                'rule_type': 'HasElementXBeforeElementY',
                'inputs': {
                    'x': '',
                    'y': ''
                }
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {'x': []}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }, {
            'rule_specs': [{
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': '',
                    'y': 1
                }
            }, {
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': 'a',
                    'y': 2
                }
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback2',
                    'html': '<p>Outcome for state1</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start DragAndDropSortInputInteractionOneOffJob on sample exploration.
        job_id = (
            exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .get_output(job_id))
        self.assertEqual(actual_output, [])

        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_interaction_answer_groups(answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start DragAndDropSortInputInteractionOneOffJob on sample exploration.
        job_id = (
            exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .get_output(job_id))
        expected_output = [(
            u'[u\'exp_id0\', [u"[u\'State name: State2, AnswerGroup: 0, Rule '
            'input x in rule with index 0 is empty. \', u\'State name: State2,'
            ' AnswerGroup: 0, Rule input y in rule with index 2 is empty. \', '
            'u\'State name: State2, AnswerGroup: 0, Rule input x in rule with '
            'index 2 is empty. \', u\'State name: State2, AnswerGroup: 0, Rule'
            ' input x in rule with index 3 is empty. \', u\'State name: State2'
            ', AnswerGroup: 1, Rule input x in rule with index 0 is empty. \']'
            '"]]'
        )]
        self.assertEqual(actual_output, expected_output)

        rights_manager.unpublish_exploration(self.admin, self.VALID_EXP_ID)
        # Start DragAndDropSortInputInteractionOneOffJob on private
        # exploration.
        job_id = (
            exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()
        actual_output = (
            exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .get_output(job_id))
        self.assertEqual(actual_output, [])

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('DragAndDropSortInput')

        customization_args_dict = {
            'choices': {'value': [
                '<p>This is value1 for DragAndDropSortInput</p>',
                '<p>This is value2 for DragAndDropSortInput</p>',
            ]}
        }

        answer_group_list = [{
            'rule_specs': [{
                'rule_type': 'IsEqualToOrdering',
                'inputs': {'x': []}
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {'x': []}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_customization_args(customization_args_dict)
        state1.update_interaction_answer_groups(answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.DragAndDropSortInputInteractionOneOffJob)


class MultipleChoiceInteractionOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(MultipleChoiceInteractionOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_exp_state_pairs_are_produced_only_for_desired_interactions(self):
        """Checks output pairs are produced only for
        desired interactions.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1', 'State2'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']

        state1.update_interaction_id('MultipleChoiceInput')
        state2.update_interaction_id('MultipleChoiceInput')

        customization_args_dict1 = {
            'choices': {'value': [
                '<p>This is value1 for MultipleChoiceInput</p>',
                '<p>This is value2 for MultipleChoiceInput</p>',
            ]}
        }

        answer_group_list1 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': '1'}
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state1</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start MultipleChoiceInteractionOneOffJob job on sample exploration.
        job_id = exp_jobs_one_off.MultipleChoiceInteractionOneOffJob.create_new(
        )
        exp_jobs_one_off.MultipleChoiceInteractionOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.MultipleChoiceInteractionOneOffJob.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        customization_args_dict2 = {
            'choices': {'value': [
                '<p>This is value1 for MultipleChoiceInput</p>',
                '<p>This is value2 for MultipleChoiceInput</p>',
                '<p>This is value3 for MultipleChoiceInput</p>',
                '<p>This is value4 for MultipleChoiceInput</p>',
            ]}
        }

        answer_group_list2 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': '0'}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': '9007199254740991'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_interaction_answer_groups(answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start MultipleChoiceInteractionOneOffJob job on sample exploration.
        job_id = exp_jobs_one_off.MultipleChoiceInteractionOneOffJob.create_new(
        )
        exp_jobs_one_off.MultipleChoiceInteractionOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.MultipleChoiceInteractionOneOffJob.get_output(
                job_id))
        expected_output = [(
            u'[u\'exp_id0\', '
            u'[u\'State name: State2, AnswerGroup: 0, Rule: 1 is invalid.' +
            '(Indices here are 0-indexed.)\']]'
        )]
        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('MultipleChoiceInput')

        customization_args_dict = {
            'choices': {'value': [
                '<p>This is value1 for MultipleChoiceInput</p>',
                '<p>This is value2 for MultipleChoiceInput</p>',
            ]}
        }

        answer_group_list = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': '0'}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': '9007199254740991'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_customization_args(customization_args_dict)
        state1.update_interaction_answer_groups(answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.MultipleChoiceInteractionOneOffJob)


class MathExpressionValidationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(MathExpressionValidationOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_exp_state_pairs_are_produced_only_for_desired_interactions(self):
        """Checks output is produced only for desired interactions."""
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states([
            'State1', 'State2', 'State3', 'State4', 'State5', 'State6',
            'State7'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        state3 = exploration.states['State3']
        state4 = exploration.states['State4']
        state5 = exploration.states['State5']
        state6 = exploration.states['State6']
        state7 = exploration.states['State7']

        state1.update_interaction_id('MathExpressionInput')
        state2.update_interaction_id('MathExpressionInput')
        state3.update_interaction_id('MathExpressionInput')
        state4.update_interaction_id('MathExpressionInput')
        state5.update_interaction_id('MathExpressionInput')
        state6.update_interaction_id('MathExpressionInput')
        state7.update_interaction_id('MathExpressionInput')

        answer_group_list1 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': 'x+y-z'}
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state1</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list2 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': 'y=m*x+c'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state2.update_interaction_answer_groups(answer_group_list2)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list3 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': 'x<y>z'}
            }],
            'outcome': {
                'dest': 'State2',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state3</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state3.update_interaction_answer_groups(answer_group_list3)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list4 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': r'\sqrt{\frac{x}{y}}'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state4</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state4.update_interaction_answer_groups(answer_group_list4)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list5 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': u'âéîôü'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state5</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state5.update_interaction_answer_groups(answer_group_list5)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list6 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': u'sin^2(\u03b8) + cos^2(\u03b8) = 1'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state6</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state6.update_interaction_answer_groups(answer_group_list6)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list7 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {
                    'x': u'(asinA*cosB + cosA*asinB)/(cosA*acosB - asinA*sinB)'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state7</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state7.update_interaction_answer_groups(answer_group_list7)
        exp_services.save_new_exploration(self.albert_id, exploration)

        job_id = (
            exp_jobs_one_off.MathExpressionValidationOneOffJob.create_new(
            ))
        exp_jobs_one_off.MathExpressionValidationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.MathExpressionValidationOneOffJob.get_output(
                job_id))
        expected_output = [
            u'[u\'Invalid\', [u\'exp_id0 State3: x<y>z\', '
            u'u\'exp_id0 State5: \\xe2\\xe9\\xee\\xf4\\xfc\']]',
            u'[u\'Valid Equation\', [u\'exp_id0 State2: y=m*x+c\', '
            u'u\'exp_id0 State6: sin(theta)^2 + cos(theta)^2 = 1\']]',
            u'[u\'Valid Expression\', [u\'exp_id0 State1: x+y-z\', '
            u'u\'exp_id0 State7: (arcsin(A)*cos(B) + cos(A)*arcsin(B))/'
            u'(cos(A)*arccos(B) - arcsin(A)*sin(B))\', '
            u'u\'exp_id0 State4: sqrt(x/y)\']]']

        self.assertEqual(actual_output, expected_output)

    def test_no_of_valid_exps_yielded_is_under_limit(self):
        """Checks that the number of valid explorations yielded is less than
        the limit mentioned by the VALID_MATH_EXP_YIELD_LIMIT constant.
        """
        one_off_job_cls = exp_jobs_one_off.MathExpressionValidationOneOffJob
        # Resetting the threshold only for testing purposes.
        one_off_job_cls.VALID_MATH_INPUTS_YIELD_LIMIT = 3

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states([
            'State1', 'State2', 'State3', 'State4', 'State5'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        state3 = exploration.states['State3']
        state4 = exploration.states['State4']
        state5 = exploration.states['State5']

        state1.update_interaction_id('MathExpressionInput')
        state2.update_interaction_id('MathExpressionInput')
        state3.update_interaction_id('MathExpressionInput')
        state4.update_interaction_id('MathExpressionInput')
        state5.update_interaction_id('MathExpressionInput')

        answer_group_list1 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': 'x+y-z'}
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state1</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list2 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': 'y=m*x+c'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state2.update_interaction_answer_groups(answer_group_list2)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list3 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': r'\sqrt{\frac{x}{y}}'}
            }],
            'outcome': {
                'dest': 'State2',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state3</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state3.update_interaction_answer_groups(answer_group_list3)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list4 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': '(a+b+c)^3'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state4</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state4.update_interaction_answer_groups(answer_group_list4)
        exp_services.save_new_exploration(self.albert_id, exploration)

        answer_group_list5 = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': r'\pi \cdot r^2'}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state5</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state5.update_interaction_answer_groups(answer_group_list5)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start MathExpressionInteractionOneOff job on sample exploration.
        job_id = (
            exp_jobs_one_off.MathExpressionValidationOneOffJob.create_new(
            ))
        exp_jobs_one_off.MathExpressionValidationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.MathExpressionValidationOneOffJob.get_output(
                job_id))
        # Only 3 exploration details should be yielded since the threshold is 3.
        expected_output = [
            u'[u\'Valid Equation\', [u\'exp_id0 State2: y=m*x+c\']]',
            u'[u\'Valid Expression\', [u\'exp_id0 State3: sqrt(x/y)\', '
            u'u\'exp_id0 State1: x+y-z\', u\'exp_id0 State5: pi* r^2\']]']

        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('MathExpressionInput')

        answer_group_list = [{
            'rule_specs': [{
                'rule_type': 'IsMathematicallyEquivalentTo',
                'inputs': {'x': u'[\'y=mx+c\']'}
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state1</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_answer_groups(answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.MathExpressionValidationOneOffJob)


class OneOffExplorationFirstPublishedJobTests(test_utils.GenericTestBase):

    EXP_ID = 'exp_id'

    def setUp(self):
        super(OneOffExplorationFirstPublishedJobTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

    def test_first_published_time_of_exploration_that_is_unpublished(self):
        """This tests that, if an exploration is published, unpublished, and
        then published again, the job uses the first publication time as the
        value for first_published_msec.
        """

        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        job_class = exp_jobs_one_off.ExplorationFirstPublishedOneOffJob
        job_id = job_class.create_new()
        exp_jobs_one_off.ExplorationFirstPublishedOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        exploration_rights = rights_manager.get_exploration_rights(self.EXP_ID)

        # Test to see whether first_published_msec was correctly updated.
        exp_first_published = exploration_rights.first_published_msec
        exp_rights_model = exp_models.ExplorationRightsModel.get(self.EXP_ID)
        last_updated_time_msec = utils.get_time_in_millisecs(
            exp_rights_model.last_updated)
        self.assertLess(
            exp_first_published, last_updated_time_msec)

        rights_manager.unpublish_exploration(self.admin, self.EXP_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        job_id = job_class.create_new()
        exp_jobs_one_off.ExplorationFirstPublishedOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Test to see whether first_published_msec remains the same despite the
        # republication.
        exploration_rights = rights_manager.get_exploration_rights(self.EXP_ID)
        self.assertEqual(
            exp_first_published, exploration_rights.first_published_msec)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

        exp_services.delete_exploration(self.owner_id, self.EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.ExplorationFirstPublishedOneOffJob,
            check_error=True,
            error_type=base_models.BaseModel.EntityNotFoundError,
            error_msg=(
                'Entity for class ExplorationRightsModel with id '
                'exp_id not found'),
            function_to_be_called=rights_manager.get_exploration_rights,
            exp_id=self.EXP_ID)


class ExplorationValidityJobManagerTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExplorationValidityJobManagerTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_validation_errors_are_not_raised_for_valid_exploration(self):
        """Checks validation errors are not raised for a valid exploration."""
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category',
            objective='Test Exploration')

        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        intro_state.update_interaction_id('TextInput')
        end_state.update_interaction_id('EndExploration')

        default_outcome = state_domain.Outcome(
            'End', state_domain.SubtitledHtml(
                'default_outcome', '<p>Introduction</p>'
            ), False, [], None, None
        )
        intro_state.update_interaction_default_outcome(default_outcome)
        end_state.update_interaction_default_outcome(None)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ExplorationValidityJobManager job on unpublished exploration.
        job_id = exp_jobs_one_off.ExplorationValidityJobManager.create_new()
        exp_jobs_one_off.ExplorationValidityJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationValidityJobManager.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.UserActionsInfo(self.albert_id)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ExplorationValidityJobManager job on published exploration.
        job_id = exp_jobs_one_off.ExplorationValidityJobManager.create_new()
        exp_jobs_one_off.ExplorationValidityJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationValidityJobManager.get_output(
                job_id))

        self.assertEqual(actual_output, [])

    def test_strict_validation_errors_are_raised_for_published_exploration(
            self):
        """Checks validation errors are not present for valid exploration."""
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ExplorationValidityJobManager job on unpublished exploration.
        job_id = exp_jobs_one_off.ExplorationValidityJobManager.create_new()
        exp_jobs_one_off.ExplorationValidityJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationValidityJobManager.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.UserActionsInfo(self.albert_id)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ExplorationValidityJobManager job on published exploration.
        job_id = exp_jobs_one_off.ExplorationValidityJobManager.create_new()
        exp_jobs_one_off.ExplorationValidityJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationValidityJobManager.get_output(
                job_id))
        expected_output = [(
            '[u\'exp_id0\', '
            '[u\'This state does not have any interaction specified.\']]'
        )]
        self.assertEqual(actual_output, expected_output)

        exploration.states['Introduction'].update_interaction_id(
            'TextInput')

        exp_services.save_new_exploration(self.albert_id, exploration)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ExplorationValidityJobManager job on published exploration.
        job_id = exp_jobs_one_off.ExplorationValidityJobManager.create_new()
        exp_jobs_one_off.ExplorationValidityJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationValidityJobManager.get_output(job_id))
        expected_output = [(
            '[u\'exp_id0\', '
            '[u"Please fix the following issues before saving this '
            'exploration: 1. It is impossible to complete the exploration '
            'from the following states: Introduction '
            '2. An objective must be specified (in the \'Settings\' tab). "]]')]
        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exp_services.save_new_exploration(self.albert_id, exploration)

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.UserActionsInfo(self.albert_id)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.ExplorationValidityJobManager)


class ExplorationMigrationJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExplorationMigrationJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_migration_job_does_not_convert_up_to_date_exp(self):
        """Tests that the exploration migration job does not convert an
        exploration that is already the latest states schema version.
        """
        # Create a new, default exploration that should not be affected by the
        # job.
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        init_state = exploration.states[exploration.init_state_name]
        init_state.update_interaction_id('EndExploration')
        init_state.update_interaction_default_outcome(None)
        exp_services.save_new_exploration(self.albert_id, exploration)
        self.assertEqual(
            exploration.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        yaml_before_migration = exploration.to_yaml()

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the exploration is exactly the same after migration.
        updated_exp = exp_fetchers.get_exploration_by_id(self.VALID_EXP_ID)
        self.assertEqual(
            updated_exp.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        after_converted_yaml = updated_exp.to_yaml()
        self.assertEqual(after_converted_yaml, yaml_before_migration)

    def test_migration_job_does_not_have_validation_fail_on_default_exp(self):
        """Tests that the exploration migration job does not have a validation
        failure for a default exploration (of states schema version 0), due to
        the exploration having a null interaction ID in its initial state.
        """
        self.save_new_exp_with_states_schema_v0(
            self.NEW_EXP_ID, self.albert_id, self.EXP_TITLE)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the new exploration has been migrated by the job.
        updated_exp = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        self.assertEqual(
            updated_exp.states_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        # Ensure the states structure within the exploration was changed.
        self.assertNotEqual(
            updated_exp.to_dict()['states'], self.VERSION_0_STATES_DICT)

    def test_migration_job_skips_deleted_explorations(self):
        """Tests that the exploration migration job skips deleted explorations
        and does not attempt to migrate.
        """
        self.save_new_exp_with_states_schema_v0(
            self.NEW_EXP_ID, self.albert_id, self.EXP_TITLE)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the exploration.
        exp_services.create_exploration_summary(
            self.NEW_EXP_ID, None)

        # Delete the exploration before migration occurs.
        exp_services.delete_exploration(self.albert_id, self.NEW_EXP_ID)

        # Ensure the exploration is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)

        # This running without errors indicates the deleted exploration is
        # being ignored, since otherwise exp_fetchers.get_exploration_by_id
        # (used within the job) will raise an error.
        self.process_and_flush_pending_tasks()

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_exploration_migration_job_output(self):
        """Test that Exploration Migration job output is correct."""
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        self.save_new_exp_with_states_schema_v0(
            self.NEW_EXP_ID, self.albert_id, self.EXP_TITLE)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ExplorationMigrationJobManager.get_output(job_id))
        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_migration_job_creates_appropriate_classifier_models(self):
        """Tests that the exploration migration job creates appropriate
        classifier data models for explorations.
        """
        self.save_new_exp_with_states_schema_v21(
            self.NEW_EXP_ID, self.albert_id, self.EXP_TITLE)
        exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

        initial_state_name = list(exploration.states.keys())[0]
        # Store classifier model for the new exploration.
        classifier_model_id = classifier_models.ClassifierTrainingJobModel.create( # pylint: disable=line-too-long
            'TextClassifier', 'TextInput', self.NEW_EXP_ID, exploration.version,
            datetime.datetime.utcnow(), {}, initial_state_name,
            feconf.TRAINING_JOB_STATUS_COMPLETE, 1)
        # Store training job model for the classifier model.
        classifier_models.TrainingJobExplorationMappingModel.create(
            self.NEW_EXP_ID, exploration.version, initial_state_name,
            classifier_model_id)

        # Start migration job on sample exploration.
        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            with self.swap(feconf, 'MIN_TOTAL_TRAINING_EXAMPLES', 2):
                with self.swap(feconf, 'MIN_ASSIGNED_LABELS', 1):
                    self.process_and_flush_pending_tasks()

        new_exploration = exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)
        initial_state_name = list(new_exploration.states.keys())[0]
        self.assertLess(exploration.version, new_exploration.version)
        classifier_exp_mapping_model = classifier_models.TrainingJobExplorationMappingModel.get_models( # pylint: disable=line-too-long
            self.NEW_EXP_ID, new_exploration.version,
            [initial_state_name])[0]
        self.assertEqual(
            classifier_exp_mapping_model.job_id, classifier_model_id)

    def test_migration_job_fails_with_invalid_exploration(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)


        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.language_code = 'invalid_language_code'
        exploration_model.commit(
            self.albert_id, 'Changed language_code.', [])
        memcache_services.delete('exploration:%s' % self.VALID_EXP_ID)

        job_id = exp_jobs_one_off.ExplorationMigrationJobManager.create_new()
        exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
        with self.swap(logging, 'error', _mock_logging_function):
            self.process_and_flush_pending_tasks()

        self.assertEqual(
            observed_log_messages,
            ['Exploration %s failed non-strict validation: '
             'Invalid language_code: invalid_language_code'
             % (self.VALID_EXP_ID)])


class ItemSelectionInteractionOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ItemSelectionInteractionOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_exp_state_pairs_are_produced_only_for_desired_interactions(self):
        """Checks (exp, state) pairs are produced only for
        desired interactions.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1', 'State2'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']

        state1.update_interaction_id('ItemSelectionInput')
        state2.update_interaction_id('ItemSelectionInput')

        customization_args_dict1 = {
            'choices': {'value': [
                '<p>This is value1 for ItemSelection</p>',
                '<p>This is value2 for ItemSelection</p>',
            ]}
        }

        answer_group_list1 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value1 for ItemSelection</p>'
                ]}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value2 for ItemSelection</p>'
                ]}
            }],
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state1</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = exp_jobs_one_off.ItemSelectionInteractionOneOffJob.create_new()
        exp_jobs_one_off.ItemSelectionInteractionOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ItemSelectionInteractionOneOffJob.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        customization_args_dict2 = {
            'choices': {'value': [
                '<p>This is value1 for ItemSelection</p>',
                '<p>This is value2 for ItemSelection</p>',
            ]}
        }

        answer_group_list2 = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value1 for ItemSelection</p>'
                ]}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value3 for ItemSelection</p>'
                ]}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_interaction_answer_groups(answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = exp_jobs_one_off.ItemSelectionInteractionOneOffJob.create_new()
        exp_jobs_one_off.ItemSelectionInteractionOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ItemSelectionInteractionOneOffJob.get_output(
                job_id))
        expected_output = [(
            u'[u\'exp_id0\', '
            u'[u\'State2: <p>This is value3 for ItemSelection</p>\']]'
        )]
        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('ItemSelectionInput')

        customization_args_dict = {
            'choices': {'value': [
                '<p>This is value1 for ItemSelection</p>',
                '<p>This is value2 for ItemSelection</p>',
            ]}
        }

        answer_group_list = [{
            'rule_specs': [{
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value1 for ItemSelection</p>'
                ]}
            }, {
                'rule_type': 'Equals',
                'inputs': {'x': [
                    '<p>This is value3 for ItemSelection</p>'
                ]}
            }],
            'outcome': {
                'dest': 'State1',
                'feedback': {
                    'content_id': 'feedback',
                    'html': '<p>Outcome for state2</p>'
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        state1.update_interaction_customization_args(customization_args_dict)
        state1.update_interaction_answer_groups(answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.ItemSelectionInteractionOneOffJob)


class ViewableExplorationsAuditJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ViewableExplorationsAuditJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_output_contains_only_viewable_private_explorations(self):
        """Checks that only viewable private explorations are present
        in output.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ViewableExplorationsAudit job on sample exploration.
        job_id = exp_jobs_one_off.ViewableExplorationsAuditJob.create_new()
        exp_jobs_one_off.ViewableExplorationsAuditJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ViewableExplorationsAuditJob.get_output(
                job_id))
        self.assertEqual(actual_output, [])

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.UserActionsInfo(self.albert_id)

        rights_manager.set_private_viewability_of_exploration(
            owner, self.VALID_EXP_ID, True)

        # Start ViewableExplorationsAudit job on sample exploration.
        job_id = exp_jobs_one_off.ViewableExplorationsAuditJob.create_new()
        exp_jobs_one_off.ViewableExplorationsAuditJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ViewableExplorationsAuditJob.get_output(
                job_id))
        expected_output = ['[u\'exp_id0\', [u\'title\']]']
        self.assertEqual(actual_output, expected_output)

        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ViewableExplorationsAudit job on sample exploration.
        job_id = exp_jobs_one_off.ViewableExplorationsAuditJob.create_new()
        exp_jobs_one_off.ViewableExplorationsAuditJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ViewableExplorationsAuditJob.get_output(
                job_id))
        self.assertEqual(actual_output, [])

    def test_no_action_is_performed_when_exploration_rights_is_none(self):
        """Test that no action is performed when exploration rights is none."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exp_services.save_new_exploration(self.albert_id, exploration)

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.UserActionsInfo(self.albert_id)

        rights_manager.set_private_viewability_of_exploration(
            owner, self.VALID_EXP_ID, True)

        exp_rights_model = exp_models.ExplorationRightsModel.get(
            self.VALID_EXP_ID)
        exp_rights_model.delete(feconf.SYSTEM_COMMITTER_ID, 'Delete model')

        # Start ViewableExplorationsAudit job on sample exploration.
        job_id = exp_jobs_one_off.ViewableExplorationsAuditJob.create_new()
        exp_jobs_one_off.ViewableExplorationsAuditJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.ViewableExplorationsAuditJob.get_output(
                job_id))
        self.assertEqual(actual_output, [])

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exp_services.save_new_exploration(self.albert_id, exploration)

        self.set_admins([self.ALBERT_NAME])
        owner = user_services.UserActionsInfo(self.albert_id)

        rights_manager.set_private_viewability_of_exploration(
            owner, self.VALID_EXP_ID, True)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, exp_jobs_one_off.ViewableExplorationsAuditJob)


class HintsAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(HintsAuditOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_number_of_hints_tabulated_are_correct_in_single_exp(self):
        """Checks that correct number of hints are tabulated when
        there is single exploration.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1', 'State2', 'State3'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']

        hint_list1 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint1', '<p>Hello, this is html1 for state1</p>'
                )
            ),
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint2', '<p>Hello, this is html2 for state1</p>'
                )
            ),
        ]

        hint_list2 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint1', '<p>Hello, this is html1 for state2</p>'
                )
            )
        ]

        state1.update_interaction_hints(hint_list1)
        state2.update_interaction_hints(hint_list2)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start HintsAuditOneOff job on sample exploration.
        job_id = exp_jobs_one_off.HintsAuditOneOffJob.create_new()
        exp_jobs_one_off.HintsAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = exp_jobs_one_off.HintsAuditOneOffJob.get_output(job_id)
        expected_output = [
            '[u\'1\', [u\'exp_id0 State2\']]',
            '[u\'2\', [u\'exp_id0 State1\']]'
        ]
        self.assertEqual(actual_output, expected_output)

    def test_number_of_hints_tabulated_are_correct_in_multiple_exps(self):
        """Checks that correct number of hints are tabulated when
        there are multiple explorations.
        """

        exploration1 = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration1.add_states(['State1', 'State2', 'State3'])

        state1 = exploration1.states['State1']
        state2 = exploration1.states['State2']

        hint_list1 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint1', '<p>Hello, this is html1 for state1</p>')
            ),
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint2', '<p>Hello, this is html2 for state1</p>')
            ),
        ]
        hint_list2 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint1', '<p>Hello, this is html1 for state2</p>'
                )
            )
        ]

        state1.update_interaction_hints(hint_list1)

        state2.update_interaction_hints(hint_list2)

        exp_services.save_new_exploration(self.albert_id, exploration1)

        exploration2 = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title='title', category='category')

        exploration2.add_states(['State1', 'State2'])

        state1 = exploration2.states['State1']

        hint_list1 = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint1', '<p>Hello, this is html1 for state1</p>'
                )
            ),
        ]

        state1.update_interaction_hints(hint_list1)

        exp_services.save_new_exploration(self.albert_id, exploration2)

        # Start HintsAuditOneOff job on sample exploration.
        job_id = exp_jobs_one_off.HintsAuditOneOffJob.create_new()
        exp_jobs_one_off.HintsAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = exp_jobs_one_off.HintsAuditOneOffJob.get_output(job_id)

        actual_output_dict = {}

        for item in [ast.literal_eval(value) for value in actual_output]:
            actual_output_dict[item[0]] = set(item[1])

        expected_output_dict = {
            '1': set(['exp_id0 State2', 'exp_id1 State1']),
            '2': set(['exp_id0 State1'])
        }

        self.assertEqual(actual_output_dict, expected_output_dict)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        hint_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint1', '<p>Hello, this is html1 for state1</p>'
                )
            ),
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint2', '<p>Hello, this is html2 for state1</p>'
                )
            )
        ]

        state1.update_interaction_hints(hint_list)
        exp_services.save_new_exploration(self.albert_id, exploration)
        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(self, exp_jobs_one_off.HintsAuditOneOffJob)


class ExplorationContentValidationJobForCKEditorTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExplorationContentValidationJobForCKEditorTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_for_validation_job(self):
        """Tests that the exploration validation job validates the content
        without skipping any tags.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exploration.add_states(['State1', 'State2', 'State3'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        state3 = exploration.states['State3']
        content1_dict = {
            'content_id': 'content',
            'html': (
                '<p>Lorem ipsum </p><p> Hello this is oppia </p>'
            )
        }

        state1.update_content(
            state_domain.SubtitledHtml.from_dict(content1_dict))

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start validation job on sample exploration.
        job_id = (
            exp_jobs_one_off
            .ExplorationContentValidationJobForCKEditor.create_new())
        exp_jobs_one_off.ExplorationContentValidationJobForCKEditor.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationContentValidationJobForCKEditor.get_output(job_id))
        expected_output = []

        self.assertEqual(actual_output, expected_output)

        content1_dict = {
            'content_id': 'content',
            'html': (
                '<p>Lorem <span>ipsum </span></p> Hello this is '
                '<code>oppia </code>'
            )
        }
        content2_dict = {
            'content_id': 'content',
            'html': (
                '<p><oppia-noninteractive-image filepath-with-value="amp;quot;'
                'random.png&amp;quot;"></oppia-noninteractive-image>Hello this '
                'is test case to check image tag inside p tag</p>'
            )
        }
        content3_dict = {
            'content_id': 'content',
            'html': (
                '<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;pre&amp;gt;&amp;lt;p&amp;gt;lorem ipsum&'
                'amp;lt;/p&amp;gt;&amp;lt;/pre&amp;gt;'
                '&amp;quot;" heading-with-value="&amp;quot;'
                'lorem ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                '</oppia-noninteractive-collapsible>'
            )
        }

        default_outcome1 = state_domain.Outcome(
            'State2', state_domain.SubtitledHtml(
                'default_outcome',
                '<ol><ol><li>Item1</li></ol><li>Item2</li></ol>'
            ), False, [], None, None
        )
        default_outcome2 = state_domain.Outcome(
            'State1',
            state_domain.SubtitledHtml(
                'default_outcome',
                (
                    '<pre>Hello this is <b> testing '
                    '<oppia-noninteractive-image filepath-with-value="amp;quot;'
                    'random.png&amp;quot;"></oppia-noninteractive-image> in '
                    '</b>progress</pre>'
                )
            ), False, [], None, None,
        )

        mock_validate_context = self.swap(
            state_domain.SubtitledHtml, 'validate', mock_validate)

        with mock_validate_context:
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content1_dict))
            state2.update_content(
                state_domain.SubtitledHtml.from_dict(content2_dict))
            state3.update_content(
                state_domain.SubtitledHtml.from_dict(content3_dict))

            state1.update_interaction_default_outcome(default_outcome1)
            state2.update_interaction_default_outcome(default_outcome2)
            exp_services.save_new_exploration(self.albert_id, exploration)
            job_id = (
                exp_jobs_one_off
                .ExplorationContentValidationJobForCKEditor.create_new())
            exp_jobs_one_off.ExplorationContentValidationJobForCKEditor.enqueue(
                job_id)
            self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationContentValidationJobForCKEditor.get_output(job_id))

        expected_output = [
            '[u\'invalidTags\', [u\'span\', u\'code\', u\'b\', '
            'u\'Exp Id: exp_id0\']]',
            '[u\'ol\', [u\'ol\', u\'Exp Id: exp_id0\']]',
            '[u\'oppia-noninteractive-image\', [u\'p\', u\'b\', '
            'u\'Exp Id: exp_id0\']]',
            '[u\'p\', [u\'pre\', u\'Exp Id: exp_id0\']]',
            (
                '[u\'strings\', '
                '[u\'<p>Lorem <span>ipsum </span></p> Hello this is <code>'
                'oppia </code>\', u\'<pre>Hello this is <b> testing <oppia-'
                'noninteractive-image filepath-with-value="amp;quot;random.'
                'png&amp;quot;"></oppia-noninteractive-image>'
                ' in </b>progress</pre>\', '
                'u\'<ol><ol><li>Item1</li></ol><li>Item2</li></ol>\', '
                'u\'<p><oppia-noninteractive-image filepath-with-value="'
                'amp;quot;random.png&amp;quot;"></oppia-noninteractive-image>'
                'Hello this is test case to check '
                'image tag inside p tag</p>\', '
                'u\'<oppia-noninteractive-collapsible content-'
                'with-value="&amp;quot;&amp;lt;pre&amp;gt;&amp;lt;'
                'p&amp;gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;lt;/pre&amp;'
                'gt;&amp;quot;" heading-with-value="&amp;quot;lorem '
                'ipsum&amp;quot;lorem ipsum&amp;quot;?&amp;quot;">'
                '</oppia-noninteractive-collapsible>\', u\'Exp Id: exp_id0\']]'
            )
        ]
        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        content_dict = {
            'html': '<code>Hello</code>',
            'content_id': 'content'
        }

        state1 = exploration.states['State1']

        with self.swap(
            state_domain.SubtitledHtml, 'validate', mock_validate):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content_dict))
            exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            exp_jobs_one_off.ExplorationContentValidationJobForCKEditor)

    def test_validation_job_fails_for_invalid_schema_version(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.states_schema_version = 100
        exploration_model.commit(
            self.albert_id, 'Changed states_schema_version.', [])
        memcache_services.delete('exploration:%s' % self.VALID_EXP_ID)

        job_id = (
            exp_jobs_one_off
            .ExplorationContentValidationJobForCKEditor.create_new())
        exp_jobs_one_off.ExplorationContentValidationJobForCKEditor.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationContentValidationJobForCKEditor.get_output(job_id))
        expected_output = [
            u'[u\'Error Sorry, we can only process v1-v%s and unversioned '
            'exploration state schemas at present. when loading exploration\', '
            '[u\'exp_id0\']]' % feconf.CURRENT_STATE_SCHEMA_VERSION]

        self.assertEqual(actual_output, expected_output)


class InteractionCustomizationArgsValidationJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            InteractionCustomizationArgsValidationJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_for_customization_arg_validation_job(self):
        """Validates customization args for rich text components."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exploration.add_states(['State1', 'State2', 'State3'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        state3 = exploration.states['State3']
        content1_dict = {
            'content_id': 'content',
            'html': (
                '<oppia-noninteractive-tabs tab_contents-with-value="'
                '[{&amp;quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;'
                'gt;lorem ipsum&amp;lt;/p&amp;gt;&amp;quot;, &amp;quot;'
                'title&amp;quot;: &amp;quot;hello&amp;quot;}, {&amp;'
                'quot;content&amp;quot;: &amp;quot;&amp;lt;p&amp;gt;'
                'oppia&amp;lt;/p&amp;gt;&amp;quot;, &amp;'
                'quot;title&amp;quot;: &amp;quot;Savjet 1&amp;quot;}]">'
                '</oppia-noninteractive-tabs>'
            )
        }
        default_outcome2 = state_domain.Outcome(
            'State1',
            state_domain.SubtitledHtml(
                'default_outcome',
                (
                    '<p><oppia-noninteractive-link text-with-value="'
                    '&amp;quot;What is a link?&amp;quot;" url-with-'
                    'value="&amp;quot;htt://link.com&amp'
                    ';quot;"></oppia-noninteractive-link></p>'
                )
            ), False, [], None, None
        )
        content3_dict = {
            'content_id': 'content',
            'html': (
                '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
                'circle divided into equal fifths.&amp;quot;" '
                'caption-with-value="&amp;quot;Hello&amp;quot;" '
                'filepath-with-value="&amp;quot;xy.z.png&amp;quot;">'
                '</oppia-noninteractive-image>'
            )
        }

        with self.swap(state_domain.SubtitledHtml, 'validate', mock_validate):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content1_dict))
            state2.update_interaction_default_outcome(default_outcome2)
            state3.update_content(
                state_domain.SubtitledHtml.from_dict(content3_dict))
            exp_services.save_new_exploration(self.albert_id, exploration)

            # Start CustomizationArgsValidation job on sample exploration.
            job_id = (
                exp_jobs_one_off
                .InteractionCustomizationArgsValidationJob.create_new())
            exp_jobs_one_off.InteractionCustomizationArgsValidationJob.enqueue(
                job_id)
            self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .InteractionCustomizationArgsValidationJob.get_output(job_id))

        expected_output = [(
            '[u"Invalid URL: Sanitized URL should start with \'http://\' or \''
            'https://\'; received htt://link.com", '
            '[u\'<p><oppia-noninteractive-link text-with-value="&amp;quot;What '
            'is a link?&amp;quot;" url-with-value="&amp;quot;htt://link.com'
            '&amp;quot;"></oppia-noninteractive-link></p>\', '
            'u\'Exp Id: exp_id0\']]'
        ), (
            '[u\'Invalid filepath\', '
            '[u\'<oppia-noninteractive-image alt-with-value="&amp;quot;A '
            'circle divided into equal fifths.&amp;quot;" caption-with-value'
            '="&amp;quot;Hello&amp;quot;" filepath-with-value="&amp;quot;xy.z.'
            'png&amp;quot;"></oppia-noninteractive-image>\', '
            'u\'Exp Id: exp_id0\']]'
        )]

        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        content_dict = {
            'html': (
                '<p><oppia-noninteractive-link text-with-value="'
                '&amp;quot;What is a link?&amp;quot;" url-with-'
                'value="&amp;quot;htt://link.com&amp'
                ';quot;"></oppia-noninteractive-link></p>'
            ),
            'content_id': 'content'
        }

        state1 = exploration.states['State1']

        with self.swap(state_domain.SubtitledHtml, 'validate', mock_validate):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content_dict))
            exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            exp_jobs_one_off.InteractionCustomizationArgsValidationJob)

    def test_validation_job_fails_for_invalid_schema_version(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.states_schema_version = 100
        exploration_model.commit(
            self.albert_id, 'Changed states_schema_version.', [])
        memcache_services.delete('exploration:%s' % self.VALID_EXP_ID)

        job_id = (
            exp_jobs_one_off
            .InteractionCustomizationArgsValidationJob.create_new())
        exp_jobs_one_off.InteractionCustomizationArgsValidationJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .InteractionCustomizationArgsValidationJob.get_output(job_id))
        expected_output = [
            u'[u\'Error Sorry, we can only process v1-v%s and unversioned '
            'exploration state schemas at present. when loading exploration\', '
            '[u\'exp_id0\']]' % feconf.CURRENT_STATE_SCHEMA_VERSION]

        self.assertEqual(actual_output, expected_output)


class ExplorationMathTagValidationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            ExplorationMathTagValidationOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_explorations_with_invalid_math_tags_fails_validation(self):
        """Tests for the case when there are invalid math tags in the
        explorations.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')
        exploration.add_states(['State1', 'State2'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        invalid_html_content1 = (
            '<p>Value</p><oppia-noninteractive-math></oppia-noninteractive-m'
            'ath>')

        invalid_html_content2 = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="'
            '+,-,-,+"></oppia-noninteractive-math>')

        content1_dict = {
            'content_id': 'content',
            'html': invalid_html_content1
        }
        content2_dict = {
            'content_id': 'content',
            'html': invalid_html_content2
        }
        customization_args_dict = {
            'choices': {
                'value': [
                    invalid_html_content1,
                    '<p>2</p>',
                    '<p>3</p>',
                    '<p>4</p>'
                ]
            }
        }

        answer_group_dict = {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': [[invalid_html_content1]]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': invalid_html_content2,
                    'y': 2
                }
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {
                    'x': [[invalid_html_content2]]
                }
            }, {
                'rule_type': 'HasElementXBeforeElementY',
                'inputs': {
                    'x': invalid_html_content1,
                    'y': invalid_html_content1
                }
            }, {
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                'inputs': {
                    'x': [[invalid_html_content1]]
                }
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'html': invalid_html_content1,
                        'needs_update': True
                    },
                    'hi': {
                        'html': 'Hey!',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'html': invalid_html_content2,
                        'needs_update': False
                    },
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'html': invalid_html_content2,
                        'needs_update': False
                    },
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        with self.swap(state_domain.SubtitledHtml, 'validate', mock_validate):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content1_dict))
            state2.update_content(
                state_domain.SubtitledHtml.from_dict(content2_dict))
            state2.update_interaction_id('DragAndDropSortInput')
            state2.update_interaction_customization_args(
                customization_args_dict)
            state2.update_interaction_answer_groups([answer_group_dict])
            state2.update_written_translations(
                state_domain.WrittenTranslations.from_dict(
                    written_translations_dict))

            exp_services.save_new_exploration(self.albert_id, exploration)

            job_id = (
                exp_jobs_one_off
                .ExplorationMathTagValidationOneOffJob.create_new())
            exp_jobs_one_off.ExplorationMathTagValidationOneOffJob.enqueue(
                job_id)
            self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationMathTagValidationOneOffJob.get_output(job_id))

        actual_output_list = ast.literal_eval(actual_output[0])
        invalid_tag1 = (
            '<oppia-noninteractive-math></oppia-noninteractive-math>')
        invalid_tag2 = (
            '<oppia-noninteractive-math raw_latex-with-value="+,-,-,+"></oppi'
            'a-noninteractive-math>')
        expected_invalid_tags = [invalid_tag1, invalid_tag2]

        no_of_invalid_tags_in_output = 0
        for output in actual_output_list[1]:
            list_starting_index = output.find('[')
            list_finishing_index = output.find(']')
            stringified_error_list = (
                output[list_starting_index + 1:list_finishing_index].split(
                    ', '))
            no_of_invalid_tags_in_output = (
                no_of_invalid_tags_in_output + len(stringified_error_list))
            for invalid_tag in stringified_error_list:
                self.assertTrue(invalid_tag in expected_invalid_tags)

        self.assertEqual(no_of_invalid_tags_in_output, 12)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')

        exploration.add_states(['State1'])
        invalid_html_content = (
            '<p>Value</p><oppia-noninteractive-math></oppia-noninteractive-m'
            'ath>')
        content_dict = {
            'html': invalid_html_content,
            'content_id': 'content'
        }
        state1 = exploration.states['State1']

        with self.swap(state_domain.SubtitledHtml, 'validate', mock_validate):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content_dict))
            exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            exp_jobs_one_off.ExplorationMathTagValidationOneOffJob)

    def test_explorations_with_valid_math_tags(self):
        """Tests for the case when there are no invalid math tags in the
        explorations.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')
        exploration.add_states(['State1', 'State2'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        valid_html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')

        content1_dict = {
            'content_id': 'content',
            'html': valid_html_content
        }
        content2_dict = {
            'content_id': 'content',
            'html': valid_html_content
        }
        customization_args_dict = {
            'choices': {
                'value': [
                    valid_html_content,
                    '<p>2</p>',
                    '<p>3</p>',
                    '<p>4</p>'
                ]
            }
        }
        # Since the Old math-schema with raw_latex attribute is no longer valid,
        # it gets cleaned by html_cleaner. We need to prevent this for testing
        # by swapping it.
        with self.swap(html_cleaner, 'clean', lambda html: html):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content1_dict))
            state2.update_content(
                state_domain.SubtitledHtml.from_dict(content2_dict))
            state2.update_interaction_id('DragAndDropSortInput')
            state2.update_interaction_customization_args(
                customization_args_dict)
            exp_services.save_new_exploration(self.albert_id, exploration)

            job_id = (
                exp_jobs_one_off
                .ExplorationMathTagValidationOneOffJob.create_new())
            exp_jobs_one_off.ExplorationMathTagValidationOneOffJob.enqueue(
                job_id)
            self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationMathTagValidationOneOffJob.get_output(job_id))
        self.assertEqual(len(actual_output), 0)


class ExplorationMockMathMigrationOneOffJobOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            ExplorationMockMathMigrationOneOffJobOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_explorations_with_unconverted_math_tags_after_migration(self):
        """Tests for the case when the conversion function doesn not convert
        the math-tags to the new schema. The old schema has the attribute
        raw_latex-with-value while the new schema has the attribute
        math-content-with-value which includes a field for storing reference to
        SVGs.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')
        exploration.add_states(['State1'])
        state1 = exploration.states['State1']
        valid_html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')

        content1_dict = {
            'content_id': 'content',
            'html': valid_html_content
        }
        customization_args_dict = {
            'choices': {
                'value': [
                    '<p>1</p>',
                    '<p>2</p>',
                    '<p>3</p>',
                    '<p>4</p>'
                ]
            }
        }

        answer_group_dict = {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': [[valid_html_content]]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': valid_html_content,
                    'y': 2
                }
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {
                    'x': [[valid_html_content]]
                }
            }, {
                'rule_type': 'HasElementXBeforeElementY',
                'inputs': {
                    'x': valid_html_content,
                    'y': valid_html_content
                }
            }, {
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                'inputs': {
                    'x': [[valid_html_content]]
                }
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        written_translations_dict = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'html': valid_html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'html': 'Hey!',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'html': valid_html_content,
                        'needs_update': False
                    },
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'html': valid_html_content,
                        'needs_update': False
                    },
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        # Since the Old math-schema with raw_latex attribute is no longer valid,
        # it gets cleaned by html_cleaner. We need to prevent this for testing
        # by swapping it.
        with self.swap(html_cleaner, 'clean', lambda html: html):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content1_dict))
            state1.update_interaction_id('DragAndDropSortInput')
            state1.update_interaction_customization_args(
                customization_args_dict)
            state1.update_interaction_answer_groups([answer_group_dict])
            state1.update_written_translations(
                state_domain.WrittenTranslations.from_dict(
                    written_translations_dict))

        exp_services.save_new_exploration(self.albert_id, exploration)
        with self.swap(
            html_validation_service,
            'add_math_content_to_math_rte_components', lambda html: html):
            with self.swap(html_cleaner, 'clean', lambda html: html):
                job_id = (
                    exp_jobs_one_off
                    .ExplorationMockMathMigrationOneOffJob.create_new())
                exp_jobs_one_off.ExplorationMockMathMigrationOneOffJob.enqueue(
                    job_id)
                self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationMockMathMigrationOneOffJob.get_output(job_id))
        actual_output_list = ast.literal_eval(actual_output[0])
        self.assertEqual(
            actual_output_list[0],
            'exp_id: exp_id0, exp_status: private failed validation after mi'
            'gration')
        expected_invalid_tag = (
            '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;+,-,-,'
            '+&amp;quot;"></oppia-noninteractive-math>')

        expected_invalid_tags = [expected_invalid_tag]

        no_of_invalid_tags_in_output = 0
        for output in actual_output_list[1]:
            list_starting_index = output.find('[')
            list_finishing_index = output.find(']')
            stringified_error_list = (
                output[list_starting_index + 1:list_finishing_index].split(
                    ', '))
            no_of_invalid_tags_in_output = (
                no_of_invalid_tags_in_output + len(stringified_error_list))
            for invalid_tag in stringified_error_list:
                self.assertTrue(invalid_tag in expected_invalid_tags)
        self.assertEqual(no_of_invalid_tags_in_output, 10)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')

        exploration.add_states(['State1'])
        invalid_html_content = (
            '<p>Value</p><oppia-noninteractive-math></oppia-noninteractive-m'
            'ath>')
        content_dict = {
            'html': invalid_html_content,
            'content_id': 'content'
        }
        state1 = exploration.states['State1']

        with self.swap(state_domain.SubtitledHtml, 'validate', mock_validate):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content_dict))
            exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            exp_jobs_one_off.ExplorationMockMathMigrationOneOffJob)

    def test_explorations_with_valid_math_tags_passes_migration(self):
        """Tests for the case when there are no invalid math tags in the
        explorations and the migration converts all the math tags to the new
        schema. The old schema has the attribute raw_latex-with-value while
        the new schema has the attribute math-content-with-value which includes
        a field for storing reference to SVGs.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')
        exploration.add_states(['State1', 'State2'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        valid_html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')

        content1_dict = {
            'content_id': 'content',
            'html': valid_html_content
        }
        content2_dict = {
            'content_id': 'content',
            'html': valid_html_content
        }
        answer_group_dict = {
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': False,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': [[valid_html_content]]
                },
                'rule_type': 'IsEqualToOrdering'
            }, {
                'rule_type': 'HasElementXAtPositionY',
                'inputs': {
                    'x': valid_html_content,
                    'y': 2
                }
            }, {
                'rule_type': 'IsEqualToOrdering',
                'inputs': {
                    'x': [[valid_html_content]]
                }
            }, {
                'rule_type': 'HasElementXBeforeElementY',
                'inputs': {
                    'x': valid_html_content,
                    'y': valid_html_content
                }
            }, {
                'rule_type': 'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                'inputs': {
                    'x': [[valid_html_content]]
                }
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }

        with self.swap(html_cleaner, 'clean', lambda html: html):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content1_dict))
            state2.update_content(
                state_domain.SubtitledHtml.from_dict(content2_dict))
            state2.update_interaction_id('DragAndDropSortInput')
            state2.update_interaction_answer_groups(
                [answer_group_dict])
            exp_services.save_new_exploration(self.albert_id, exploration)

            job_id = (
                exp_jobs_one_off
                .ExplorationMockMathMigrationOneOffJob.create_new())
            exp_jobs_one_off.ExplorationMockMathMigrationOneOffJob.enqueue(
                job_id)
            self.process_and_flush_pending_tasks()
        actual_output = (
            exp_jobs_one_off
            .ExplorationMockMathMigrationOneOffJob.get_output(job_id))
        self.assertEqual(len(actual_output), 0)
