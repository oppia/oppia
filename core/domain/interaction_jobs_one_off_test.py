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
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


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


class LogicProofInteractionOneOffJobTests(test_utils.GenericTestBase):

    USER_EMAIL = 'albert@example.com'
    USER_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(LogicProofInteractionOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.USER_EMAIL, self.USER_NAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_exp_state_pairs_are_produced_only_for_desired_interactions(self):
        """Checks EMAIL_DATA and SUCCESS are produced only for
        desired interactions.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('LogicProof')

        customization_args_dict1 = {
            'question': {
                'value': {
                    'assumptions': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'results': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'default_proof_string': ''
                }
            },
        }

        state1.update_interaction_customization_args(customization_args_dict1)
        exp_services.save_new_exploration(self.user_id, exploration)

        # Start LogicProofInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.create_new())
        interaction_jobs_one_off.LogicProofInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.get_output(job_id))
        expected_output = [(u'[u\'SUCCESS\', 1]'), (
            u'[u\'EMAIL_DATA\', [u"(u\'albert@example.com\', \'exp_id0\')"]]')]
        self.assertEqual(actual_output, expected_output)

    def test_empty_when_owner_ids_is_empty(self):
        """Checks EMPTY and SUCCESS is produced when owner ids is set
        empty.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exploration.add_states(['State1'])
        state1 = exploration.states['State1']
        state1.update_interaction_id('LogicProof')
        customization_args_dict1 = {
            'question': {
                'value': {
                    'assumptions': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'results': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'default_proof_string': ''
                }
            },
        }

        state1.update_interaction_customization_args(customization_args_dict1)
        exp_services.save_new_exploration(self.user_id, exploration)

        owner = user_services.get_user_actions_info(self.user_id)
        rights_manager.publish_exploration(owner, self.VALID_EXP_ID)
        rights_manager.release_ownership_of_exploration(
            owner, self.VALID_EXP_ID)

        # Start LogicProofInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.create_new())
        interaction_jobs_one_off.LogicProofInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.get_output(job_id))
        expected_output = [(u'[u\'EMPTY\', [u\'exp_id0\']]'), (
            u'[u\'SUCCESS\', 1]')]

        self.assertEqual(actual_output, expected_output)

    def test_missing_rights_when_exploration_rights_is_none(self):
        """Checks MISSING_RIGHTS is produced when exploration rights is
        none.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])
        state1 = exploration.states['State1']
        state1.update_interaction_id('LogicProof')

        customization_args_dict1 = {
            'question': {
                'value': {
                    'assumptions': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'results': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'default_proof_string': ''
                }
            },
        }

        state1.update_interaction_customization_args(customization_args_dict1)

        exp_services.save_new_exploration(self.user_id, exploration)

        owner = user_services.get_user_actions_info(self.user_id)

        rights_manager.set_private_viewability_of_exploration(
            owner, self.VALID_EXP_ID, True)

        exp_rights_model = exp_models.ExplorationRightsModel.get(
            self.VALID_EXP_ID)
        exp_rights_model.delete(feconf.SYSTEM_COMMITTER_ID, 'Delete model')

        # Start LogicProofInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.create_new())
        interaction_jobs_one_off.LogicProofInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.get_output(job_id))
        expected_output = [u'[u\'MISSING_RIGHTS\', [u\'exp_id0\']]',
                           u'[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_success_when_interaction_id_is_not_logicproof(self):
        """Checks SUCCESS is produced when interaction id is not logicProof."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exp_services.save_new_exploration(self.user_id, exploration)

        # Start LogicProofInteractionOneOffJob job on sample exploration.
        job_id = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.create_new())
        interaction_jobs_one_off.LogicProofInteractionOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            interaction_jobs_one_off
            .LogicProofInteractionOneOffJob.get_output(job_id))
        expected_output = [u'[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('LogicProof')

        customization_args_dict = {
            'question': {
                'value': {
                    'assumptions': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'results': [{
                        'top_kind_name': 'variable',
                        'top_operator_name': 'p',
                        'arguments': [],
                        'dummies': []
                    }],
                    'default_proof_string': ''
                }
            },
        }

        state1.update_interaction_customization_args(customization_args_dict)

        exp_services.save_new_exploration(self.user_id, exploration)

        exp_services.delete_exploration(self.user_id, self.VALID_EXP_ID)

        run_job_for_deleted_exp(
            self, interaction_jobs_one_off.LogicProofInteractionOneOffJob)
