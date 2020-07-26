# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for Interaction validation jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import interaction_validation_jobs_one_off
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(job_models, exp_models, base_models, classifier_models) = (
    models.Registry.import_models([
        models.NAMES.job, models.NAMES.exploration, models.NAMES.base_model,
        models.NAMES.classifier]))
memcache_services = models.Registry.import_memcache_services()
search_services = models.Registry.import_search_services()
taskqueue_services = models.Registry.import_taskqueue_services()


# This mock should be used only in InteractionCustomizationArgsValidationJob.
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
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob
            .get_output(job_id))
        self.assertEqual(actual_output, [])

        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_interaction_answer_groups(answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start DragAndDropSortInputInteractionOneOffJob on sample exploration.
        job_id = (
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.get_output(job_id))
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
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.get_output(job_id))
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
            self, interaction_validation_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob)


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
        job_id = (
            interaction_validation_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.create_new())
        (
            interaction_validation_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.get_output(job_id))
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
        job_id = (
            interaction_validation_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.create_new())
        (
            interaction_validation_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.get_output(job_id))
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
            self,
            interaction_validation_jobs_one_off
            .MultipleChoiceInteractionOneOffJob)


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
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob.create_new())
        (
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob.get_output(job_id))
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
        one_off_job_cls = (
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob)
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
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob.create_new())
        (
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob.get_output(job_id))
        # Only 3 exploration details should be yielded since the threshold is 3.
        expected_output = [
            u'[u\'Valid Equation\', [u\'exp_id0 State2: y=m*x+c\']]',
            u'[u\'Valid Expression\', [u\'exp_id0 State3: sqrt(x/y)\', '
            u'u\'exp_id0 State1: x+y-z\', u\'exp_id0 State5: pi*r^2\']]']

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
            self,
            interaction_validation_jobs_one_off
            .MathExpressionValidationOneOffJob)


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
        job_id = (
            interaction_validation_jobs_one_off
            .ItemSelectionInteractionOneOffJob.create_new())
        (
            interaction_validation_jobs_one_off
            .ItemSelectionInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .ItemSelectionInteractionOneOffJob.get_output(job_id))
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
        job_id = (
            interaction_validation_jobs_one_off
            .ItemSelectionInteractionOneOffJob.create_new())
        (
            interaction_validation_jobs_one_off
            .ItemSelectionInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .ItemSelectionInteractionOneOffJob.get_output(job_id))
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
            self,
            interaction_validation_jobs_one_off
            .ItemSelectionInteractionOneOffJob)


class InteractionRTECustomizationArgsValidationJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            InteractionRTECustomizationArgsValidationJobTests, self).setUp()

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
                interaction_validation_jobs_one_off
                .InteractionRTECustomizationArgsValidationJob.create_new())
            (
                interaction_validation_jobs_one_off
                .InteractionRTECustomizationArgsValidationJob.enqueue(job_id))
            self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .InteractionRTECustomizationArgsValidationJob.get_output(job_id))

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
            interaction_validation_jobs_one_off
            .InteractionRTECustomizationArgsValidationJob)

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
            interaction_validation_jobs_one_off
            .InteractionRTECustomizationArgsValidationJob.create_new())
        (
            interaction_validation_jobs_one_off
            .InteractionRTECustomizationArgsValidationJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_validation_jobs_one_off
            .InteractionRTECustomizationArgsValidationJob.get_output(job_id))
        expected_output = [
            u'[u\'Error Sorry, we can only process v1-v%s and unversioned '
            'exploration state schemas at present. when loading exploration\', '
            '[u\'exp_id0\']]' % feconf.CURRENT_STATE_SCHEMA_VERSION]

        self.assertEqual(actual_output, expected_output)
