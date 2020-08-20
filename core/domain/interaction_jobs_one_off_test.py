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
from core.domain import interaction_jobs_one_off
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(job_models, exp_models, base_models, classifier_models) = (
    models.Registry.import_models([
        models.NAMES.job, models.NAMES.exploration, models.NAMES.base_model,
        models.NAMES.classifier]))
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

        customization_args_dict1 = {
            'choices': {'value': [{
                'html': '<p>This is value1 for DragAndDropSortInput</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for DragAndDropSortInput</p>',
                'content_id': 'ca_choices_1'
            }]},
            'allowMultipleItemsInSamePosition': {'value': True}
        }

        answer_group_list1 = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'IsEqualToOrdering': [{
                    'x': [
                        ['a'],
                        ['b']
                    ]
                }]
            },
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
            'choices': {'value': [{
                'html': '<p>This is value1 for DragAndDropSortInput</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for DragAndDropSortInput</p>',
                'content_id': 'ca_choices_1'
            }]},
            'allowMultipleItemsInSamePosition': {'value': True}
        }

        answer_group_list2 = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'HasElementXBeforeElementY': [{
                    'x': '',
                    'y': ''
                }],
                'IsEqualToOrdering': [{
                    'x': [
                        ['a']
                    ]
                }, {
                    'x': []
                }],
                'IsEqualToOrderingWithOneItemAtIncorrectPosition': [{
                    'x': []
                }]
            },
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
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'HasElementXAtPositionY': [{
                    'x': '',
                    'y': 1
                }, {
                    'x': 'a',
                    'y': 2
                }]
            },
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

        state1.update_interaction_id('DragAndDropSortInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start DragAndDropSortInputInteractionOneOffJob on sample exploration.
        job_id = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .get_output(job_id))
        self.assertEqual(actual_output, [])

        state2.update_interaction_id('DragAndDropSortInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(2)
        state2.update_interaction_answer_groups(answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start DragAndDropSortInputInteractionOneOffJob on sample exploration.
        job_id = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .get_output(job_id))
        expected_output = [(
            u'[u\'exp_id0\', [u"[u\'State name: State2, AnswerGroup: 0, Rule in'
            'put x in rule with rule type IsEqualToOrderingWithOneItemAtIncorre'
            'ctPosition and rule input index 0 is empty. \', u\'State name: Sta'
            'te2, AnswerGroup: 0, Rule input y in rule with rule type HasElemen'
            'tXBeforeElementY and rule input index 0 is empty. \', u\'State nam'
            'e: State2, AnswerGroup: 0, Rule input x in rule with rule type Has'
            'ElementXBeforeElementY and rule input index 0 is empty. \', u\'Sta'
            'te name: State2, AnswerGroup: 0, Rule input x in rule with rule ty'
            'pe IsEqualToOrdering and rule input index 1 is empty. \', u\'State'
            ' name: State2, AnswerGroup: 1, Rule input x in rule with rule type'
            ' HasElementXAtPositionY and rule input index 0 is empty. \']"]]'
        )]
        self.assertEqual(actual_output, expected_output)

        rights_manager.unpublish_exploration(self.admin, self.VALID_EXP_ID)
        # Start DragAndDropSortInputInteractionOneOffJob on private
        # exploration.
        job_id = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()
        actual_output = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
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
            'choices': {'value': [{
                'html': '<p>This is value1 for DragAndDropSortInput</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for DragAndDropSortInput</p>',
                'content_id': 'ca_choices_1'
            }]},
            'allowMultipleItemsInSamePosition': {'value': True}
        }

        answer_group_list = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'IsEqualToOrdering': [{
                    'x': []
                }, {
                    'x': []
                }]
            },
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
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob)


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

        customization_args_dict1 = {
            'choices': {'value': [{
                'html': '<p>This is value1 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_1'
            }]},
            'showChoicesInShuffledOrder': {'value': True}
        }

        answer_group_list1 = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{
                    'x': '1'
                }]
            },
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

        state1.update_interaction_id('MultipleChoiceInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start MultipleChoiceInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.create_new())
        interaction_jobs_one_off.MultipleChoiceInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])

        customization_args_dict2 = {
            'choices': {'value': [{
                'html': '<p>This is value1 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_1'
            }, {
                'html': '<p>This is value3 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_2'
            }, {
                'html': '<p>This is value4 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_3'
            }]},
            'showChoicesInShuffledOrder': {'value': True}
        }

        answer_group_list2 = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{
                    'x': '0'
                }, {
                    'x': '9007199254740991'
                }]
            },
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

        state2.update_interaction_id('MultipleChoiceInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(4)
        state2.update_interaction_answer_groups(answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start MultipleChoiceInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.create_new())
        interaction_jobs_one_off.MultipleChoiceInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.get_output(job_id))
        expected_output = [(
            u'[u\'exp_id0\', [u\'State name: State2, AnswerGroup: 0, Rule with '
            '(rule type: Equals, rule input index: 1) is invalid.\']]'
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
            'choices': {'value': [{
                'html': '<p>This is value1 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_1'
            }]},
            'showChoicesInShuffledOrder': {'value': True}
        }

        answer_group_list = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{
                    'x': '0'
                }, {
                    'x': '9007199254740991'
                }]
            },
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
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, interaction_jobs_one_off.MultipleChoiceInteractionOneOffJob)


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

        customization_args_dict1 = {
            'choices': {'value': [{
                'html': '<p>This is value1 for ItemSelection</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for ItemSelection</p>',
                'content_id': 'ca_choices_1'
            }]},
            'minAllowableSelectionCount': {'value': 0},
            'maxAllowableSelectionCount': {'value': 1}
        }

        answer_group_list1 = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{
                    'x': ['<p>This is value1 for ItemSelection</p>']
                }, {
                    'x': ['<p>This is value2 for ItemSelection</p>']
                }]
            },
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

        state1.update_interaction_id('ItemSelectionInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .ItemSelectionInteractionOneOffJob.create_new())
        interaction_jobs_one_off.ItemSelectionInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off
            .ItemSelectionInteractionOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])

        customization_args_dict2 = {
            'choices': {'value': [{
                'html': '<p>This is value1 for ItemSelection</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for ItemSelection</p>',
                'content_id': 'ca_choices_1'
            }]},
            'minAllowableSelectionCount': {'value': 0},
            'maxAllowableSelectionCount': {'value': 1}
        }

        answer_group_list2 = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{
                    'x': ['<p>This is value1 for ItemSelection</p>']
                }, {
                    'x': ['<p>This is value3 for ItemSelection</p>']
                }]
            },
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

        state2.update_interaction_id('ItemSelectionInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(2)
        state2.update_interaction_answer_groups(answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .ItemSelectionInteractionOneOffJob.create_new())
        interaction_jobs_one_off.ItemSelectionInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off
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
            'choices': {'value': [{
                'html': '<p>This is value1 for ItemSelection</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for ItemSelection</p>',
                'content_id': 'ca_choices_1'
            }]},
            'minAllowableSelectionCount': {'value': 0},
            'maxAllowableSelectionCount': {'value': 1}
        }

        answer_group_list = [{
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{
                    'x': ['<p>This is value1 for ItemSelection</p>']
                }, {
                    'x': ['<p>This is value3 for ItemSelection</p>']
                }]
            },
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
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, interaction_jobs_one_off.ItemSelectionInteractionOneOffJob)


class InteractionCustomizationArgsValidationOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            InteractionCustomizationArgsValidationOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_for_customization_arg_validation_job(self):
        """Check that expected errors are produced for invalid
        customization args.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1', 'State2'])

        state1 = exploration.states['State1']
        state2 = exploration.states['State2']

        state1.update_interaction_id('ItemSelectionInput')

        customization_args_dict1 = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': {'value': [{
                'html': '<p>This is value1 for ItemSelection</p>',
                'content_id': 'ca_choices_0'
            }]},
        }

        state1.update_interaction_customization_args(customization_args_dict1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.create_new())
        (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])

        customization_args_dict2 = {
            'minAllowableSelectionCount': {'value': '1b'},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': {'value': [{
                'html': '<p>This is value1 for ItemSelection</p>',
                'content_id': 'ca_choices_0'
            }]},
        }
        state2.update_interaction_id('ItemSelectionInput')
        state2.update_interaction_customization_args(customization_args_dict2)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.create_new())
        (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.get_output(job_id))
        expected_output = [(
            u'[u\'Failed customization args validation for exp id exp_id0\', '
            '[u\'ItemSelectionInput: Could not convert unicode to int: 1b\']]')]
        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('ItemSelectionInput')

        customization_args_dict = {
            'minAllowableSelectionCount': {'value': '1b'},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': {'value': [{
                'html': '<p>This is value1 for ItemSelection</p>',
                'content_id': 'ca_choices_0'
            }]},
        }

        state1.update_interaction_customization_args(customization_args_dict)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob)
