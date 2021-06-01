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
from core.domain import state_domain
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(job_models, exp_models, base_models, classifier_models) = (
    models.Registry.import_models([
        models.NAMES.job, models.NAMES.exploration, models.NAMES.base_model,
        models.NAMES.classifier]))


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
    # Check there are two jobs in the taskqueue corresponding to
    # delete_explorations_from_user_models and
    # delete_explorations_from_activities.
    self.assertEqual(
        self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 2)
    job_class.enqueue(job_id)
    self.assertEqual(
        self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
    self.process_and_flush_pending_mapreduce_tasks()
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
        self.admin = user_services.get_user_actions_info(self.admin_id)
        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_exp_state_pairs_are_produced_only_for_desired_interactions(self):
        """Checks output pairs are produced only for
        desired interactions.
        """
        owner = user_services.get_user_actions_info(self.albert_id)
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
        state_answer_group_list1 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', state_domain.SubtitledHtml(
                    'feedback1', '<p>Outcome for state1</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': [['a'], ['b']]
                    })
            ],
            [],
            None
        )]

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
        state_answer_group_list2 = [
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'State1', state_domain.SubtitledHtml(
                        'feedback', '<p>Outcome for state2</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'IsEqualToOrderingWithOneItemAtIncorrectPosition',
                        {
                            'x': []
                        }),
                    state_domain.RuleSpec(
                        'IsEqualToOrdering',
                        {
                            'x': [['a']]
                        }),
                    state_domain.RuleSpec(
                        'HasElementXBeforeElementY',
                        {
                            'x': '',
                            'y': ''
                        }),
                    state_domain.RuleSpec(
                        'IsEqualToOrdering',
                        {
                            'x': []
                        })
                ],
                [],
                None
            ),
            state_domain.AnswerGroup(
                state_domain.Outcome(
                    'Introduction', state_domain.SubtitledHtml(
                        'feedback2', '<p>Outcome for state1</p>'),
                    False, [], None, None),
                [
                    state_domain.RuleSpec(
                        'HasElementXAtPositionY',
                        {
                            'x': '',
                            'y': 1
                        }),
                    state_domain.RuleSpec(
                        'HasElementXAtPositionY',
                        {
                            'x': 'a',
                            'y': 2
                        })
                ],
                [],
                None
            )
        ]

        state1.update_interaction_id('DragAndDropSortInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start DragAndDropSortInputInteractionOneOffJob on sample exploration.
        job_id = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .get_output(job_id))
        self.assertEqual(actual_output, [])

        state2.update_interaction_id('DragAndDropSortInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(2)
        state2.update_interaction_answer_groups(state_answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start DragAndDropSortInputInteractionOneOffJob on sample exploration.
        job_id = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
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
            interaction_jobs_one_off.DragAndDropSortInputInteractionOneOffJob
            .create_new())
        (
            interaction_jobs_one_off
            .DragAndDropSortInputInteractionOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()
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

        state_answer_groups = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': []
                    }),
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': []
                    })
            ],
            [],
            None
        )]

        state1.update_interaction_customization_args(customization_args_dict)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_groups)

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        state_answer_group_list1 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state1</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals', {'x': '1'})
            ],
            [],
            None
        )]

        state1.update_interaction_id('MultipleChoiceInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start MultipleChoiceInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.create_new())
        interaction_jobs_one_off.MultipleChoiceInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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

        state_answer_group_list2 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec('Equals', {'x': '0'}),
                state_domain.RuleSpec(
                    'Equals', {'x': '9007199254740991'})
            ],
            [],
            None
        )]

        state2.update_interaction_id('MultipleChoiceInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(4)
        state2.update_interaction_answer_groups(state_answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start MultipleChoiceInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .MultipleChoiceInteractionOneOffJob.create_new())
        interaction_jobs_one_off.MultipleChoiceInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
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
            'choices': {'value': [{
                'html': '<p>This is value1 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for MultipleChoiceInput</p>',
                'content_id': 'ca_choices_1'
            }]},
            'showChoicesInShuffledOrder': {'value': True}
        }

        state_answer_group_list = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec('Equals', {'x': '0'}),
                state_domain.RuleSpec(
                    'Equals', {'x': '9007199254740991'})
            ],
            [],
            None
        )]

        state1.update_interaction_customization_args(customization_args_dict)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list)

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
        self.process_and_flush_pending_mapreduce_tasks()

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

        state_answer_group_list1 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state1</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value1 for ItemSelection</p>']
                    }),
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value2 for ItemSelection</p>']
                    })
            ],
            [],
            None
        )]

        state1.update_interaction_id('ItemSelectionInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .ItemSelectionInteractionOneOffJob.create_new())
        interaction_jobs_one_off.ItemSelectionInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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

        state_answer_group_list2 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value1 for ItemSelection</p>']
                    }),
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value3 for ItemSelection</p>']
                    })
            ],
            [],
            None
        )]

        state2.update_interaction_id('ItemSelectionInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(2)
        state2.update_interaction_answer_groups(state_answer_group_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .ItemSelectionInteractionOneOffJob.create_new())
        interaction_jobs_one_off.ItemSelectionInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

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

        state_answer_group_list = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value1 for ItemSelection</p>']
                    }),
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value3 for ItemSelection</p>']
                    })
            ],
            [],
            None
        )]

        state1.update_interaction_customization_args(customization_args_dict)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list)

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
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])

        customization_args_dict2 = {
            'minAllowableSelectionCount': {'value': '1bθ'},
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
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .InteractionCustomizationArgsValidationOneOffJob.get_output(job_id))
        expected_output = [(
            u'[u\'Failed customization args validation for exp id exp_id0\', '
            '[u\'ItemSelectionInput: Could not convert unicode to int: '
            '1b\\u03b8\']]')]
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


class RuleInputToCustomizationArgsMappingOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(RuleInputToCustomizationArgsMappingOneOffJobTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_exp_state_pairs_are_produced_for_item_selection_interactions(self):
        """Checks (exp, state) pairs are produced correctly for ItemSelection
        interactions.
        """
        owner = user_services.get_user_actions_info(self.albert_id)
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

        state_answer_group_list1 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state1</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value1 for ItemSelection</p>']
                    }),
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value2 for ItemSelection</p>']
                    })
            ],
            [],
            None
        )]

        solution1 = state_domain.Solution.from_dict('ItemSelectionInput', {
            'answer_is_exclusive': True,
            'correct_answer': ['<p>This is value2 for DragAndDropSort</p>'],
            'explanation': {
                'content_id': 'solution',
                'html': ''
            }
        })

        hint_list1 = [state_domain.Hint.from_dict({
            'hint_content': {
                'content_id': 'hint_0',
                'html': ''
            }
        })]

        state1.update_interaction_id('ItemSelectionInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)
        state1.update_interaction_solution(solution1)
        state1.update_interaction_hints(hint_list1)

        # Start RuleInputToCustomizationArgsMappingOneOffJob job on sample
        # exploration.
        job_id = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.create_new())
        (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.get_output(job_id))
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

        state_answer_group_list2 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value1 for ItemSelection</p>']
                    }),
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value3 for ItemSelection</p>']
                    })
            ],
            [],
            None
        )]

        solution2 = state_domain.Solution.from_dict('ItemSelectionInput', {
            'answer_is_exclusive': True,
            'correct_answer': ['<p>This is value3 for DragAndDropSort</p>'],
            'explanation': {
                'content_id': 'solution',
                'html': ''
            }
        })

        hint_list2 = [state_domain.Hint.from_dict({
            'hint_content': {
                'content_id': 'hint_0',
                'html': ''
            }
        })]

        state2.update_interaction_id('ItemSelectionInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(2)
        state2.update_interaction_answer_groups(state_answer_group_list2)
        state2.update_interaction_solution(solution2)
        state2.update_interaction_hints(hint_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.create_new())
        (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.get_output(job_id))
        expected_output = [(
            u'[u\'exp_id0\', [u"<ItemSelectionInput Answer> State: State2, '
            'Invalid Values: [\'<p>This is value3 for DragAndDropSort</p>\']"'
            ', u"<ItemSelectionInput Rule> State: State2, '
            'Answer Group Index: 0, Invalid Values: [u\'<p>This is value3 '
            'for ItemSelection</p>\']", u"<ItemSelectionInput Answer> State: '
            'State1, Invalid Values: [\'<p>This is value2 for '
            'DragAndDropSort</p>\']"]]'
        )]

        self.assertEqual(actual_output, expected_output)

    def test_exp_state_pairs_are_produced_for_drag_and_drop_sort_interactions(
            self):
        """Checks (exp, state) pairs are produced correctly for DragAndDropSort
        interactions.
        """
        owner = user_services.get_user_actions_info(self.albert_id)
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1', 'اختبارات'])

        state1 = exploration.states['State1']
        state2 = exploration.states['اختبارات']

        customization_args_dict1 = {
            'choices': {'value': [{
                'html': '<p>This is value1 for DragAndDropSort</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for DragAndDropSort</p>',
                'content_id': 'ca_choices_1'
            }]},
            'allowMultipleItemsInSamePosition': {'value': True}
        }

        state_answer_group_list1 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'Introduction', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state1</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': [['<p>This is value1 for DragAndDropSort</p>']]
                    }),
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': [['<p>This is value2 for DragAndDropSort</p>']]
                    })
            ],
            [],
            None
        )]

        solution1 = state_domain.Solution.from_dict('DragAndDropSortInput', {
            'answer_is_exclusive': True,
            'correct_answer': [['<p>This is value2 for DragAndDropSort</p>']],
            'explanation': {
                'content_id': 'solution',
                'html': ''
            }
        })

        hint_list1 = [state_domain.Hint.from_dict({
            'hint_content': {
                'content_id': 'hint_0',
                'html': ''
            }
        })]

        state1.update_interaction_id('DragAndDropSortInput')
        state1.update_interaction_customization_args(customization_args_dict1)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list1)
        exp_services.save_new_exploration(self.albert_id, exploration)
        state1.update_interaction_solution(solution1)
        state1.update_interaction_hints(hint_list1)

        # Start RuleInputToCustomizationArgsMappingOneOffJob job on sample
        # exploration.
        job_id = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.create_new())
        (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])

        customization_args_dict2 = {
            'choices': {'value': [{
                'html': '<p>This is value1 for DragAndDropSort</p>',
                'content_id': 'ca_choices_0'
            }, {
                'html': '<p>This is value2 for DragAndDropSort</p>',
                'content_id': 'ca_choices_1'
            }]},
            'allowMultipleItemsInSamePosition': {'value': True}
        }

        state_answer_group_list2 = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'IsEqualToOrdering',
                    {
                        'x': [[
                            '<p>This is value1 for DragAndDropSort</p>',
                            '<p>This is value3 for DragAndDropSort</p>'
                            ]]
                    }),
                state_domain.RuleSpec(
                    'HasElementXBeforeElementY',
                    {
                        'x': '<p>This is value3 for DragAndDropSort</p>',
                        'y': '<p>This is value1 for DragAndDropSort</p>'
                    }),
                state_domain.RuleSpec(
                    'HasElementXAtPositionY',
                    {
                        'x': '<p>This is value3 for DragAndDropSort</p>',
                        'y': 2
                    })
            ],
            [],
            None
        )]

        solution2 = state_domain.Solution.from_dict('DragAndDropSortInput', {
            'answer_is_exclusive': True,
            'correct_answer': [['<p>This is value3 for DragAndDropSort</p>']],
            'explanation': {
                'content_id': 'solution',
                'html': ''
            }
        })

        hint_list2 = [state_domain.Hint.from_dict({
            'hint_content': {
                'content_id': 'hint_0',
                'html': ''
            }
        })]

        state2.update_interaction_id('DragAndDropSortInput')
        state2.update_interaction_customization_args(customization_args_dict2)
        state2.update_next_content_id_index(2)
        state2.update_interaction_answer_groups(state_answer_group_list2)
        state2.update_interaction_solution(solution2)
        state2.update_interaction_hints(hint_list2)

        exp_services.save_new_exploration(self.albert_id, exploration)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)

        # Start ItemSelectionInteractionOneOff job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.create_new())
        (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.get_output(job_id))
        expected_output = [(
            u'[u\'exp_id0\', [u"<DragAndDropSortInput Answer> State: '
            '\\u0627\\u062e\\u062a\\u0628\\u0627\\u0631\\u0627\\u062a, '
            'Invalid Values: [\'<p>This is value3 for DragAndDropSort</p>\']"'
            ', u"<DragAndDropSortInput Rule> State: \\u0627\\u062e\\u062a'
            '\\u0628\\u0627\\u0631\\u0627\\u062a, Answer Group Index: 0, '
            'Invalid Values: [u\'<p>This is value3 for DragAndDropSort</p>\']"'
            ', u"<DragAndDropSortInput Rule> State: \\u0627\\u062e\\u062a'
            '\\u0628\\u0627\\u0631\\u0627\\u062a, Answer Group Index: 0, '
            'Invalid Values: [u\'<p>This is value3 for DragAndDropSort</p>\']'
            '", u"<DragAndDropSortInput Rule> State: \\u0627\\u062e\\u062a'
            '\\u0628\\u0627\\u0631\\u0627\\u062a, Answer Group Index: 0, '
            'Invalid Values: [u\'<p>This is value3 for DragAndDropSort<'
            '/p>\']"]]'
        )]
        self.assertEqual(actual_output, expected_output)

        rights_manager.unpublish_exploration(self.admin, self.VALID_EXP_ID)
        # Start job on private exploration.
        job_id = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.create_new())
        (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()
        actual_output = (
            interaction_jobs_one_off
            .RuleInputToCustomizationArgsMappingOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])

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

        state_answer_group_list = [state_domain.AnswerGroup(
            state_domain.Outcome(
                'State1', state_domain.SubtitledHtml(
                    'feedback', '<p>Outcome for state2</p>'),
                False, [], None, None),
            [
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value1 for ItemSelection</p>']
                    }),
                state_domain.RuleSpec(
                    'Equals',
                    {
                        'x': ['<p>This is value3 for ItemSelection</p>']
                    })
            ],
            [],
            None
        )]

        state1.update_interaction_customization_args(customization_args_dict)
        state1.update_next_content_id_index(2)
        state1.update_interaction_answer_groups(state_answer_group_list)

        exp_services.save_new_exploration(self.albert_id, exploration)

        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self,
            (
                interaction_jobs_one_off
                .RuleInputToCustomizationArgsMappingOneOffJob)
        )
