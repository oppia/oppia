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
import os

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import html_cleaner
from core.domain import html_validation_service
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
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

        answer_groups_1 = [{
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'labelled_as_correct': True,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_input_translations_mapping': {},
            'rule_inputs': {
                'IsMathematicallyEquivalentTo': [{
                    'x': 'x+y'
                }, {
                    'x': 'x=y'
                }]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }]

        states_dict = state_domain.State.from_dict({
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'content_2': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'content_2': {}
                }
            },
            'interaction': {
                'answer_groups': answer_groups_1,
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': {
                        'ascii': 'x+y',
                        'latex': 'x+y'
                    },
                    'answer_is_exclusive': False,
                    'explanation': {
                        'html': 'Solution explanation',
                        'content_id': 'content_2'
                    }
                },
                'id': 'MathExpressionInput'
            },
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }).to_dict()

        self.save_new_exp_with_custom_states_schema_version(
            self.VALID_EXP_ID, 'user_id', states_dict, 34)

        job_id = (
            exp_jobs_one_off.MathExpressionValidationOneOffJob.create_new())
        exp_jobs_one_off.MathExpressionValidationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off.MathExpressionValidationOneOffJob.get_output(
                job_id))
        expected_output = [
            u'[u\'Invalid\', [u\'The exploration with ID: exp_id0 had some '
            u'issues during migration. This is most likely due to the '
            u'exploration having invalid solution(s).\']]']

        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')

        exploration.add_states(['State1'])

        state1 = exploration.states['State1']

        state1.update_interaction_id('MathExpressionInput')

        answer_group_list = [{
            'rule_input_translations_mapping': {},
            'rule_inputs': {
                'IsMathematicallyEquivalentTo': [{
                    'x': u'[\'y=mx+c\']'
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

        self.set_interaction_for_state(intro_state, 'TextInput')
        self.set_interaction_for_state(end_state, 'EndExploration')

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

        self.set_interaction_for_state(
            exploration.states['Introduction'], 'TextInput')

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


class ExplorationMigrationAuditJobTests(test_utils.GenericTestBase):
    """Tests for ExplorationMigrationAuditJob."""

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(ExplorationMigrationAuditJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def create_exploration_with_states_schema_version(
            self, states_schema_version, exp_id, user_id, states_dict):
        """Saves a new default exploration with the given states dictionary in
        the given state schema version. All passed state dictionaries in
        'states_dict' must have the states schema version indicated by
        'states_schema_version'.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating explorations. This is
        because the latter approach would result in an exploration with the
        *current* states schema version.

        Args:
            states_schema_version: int. The state schema version.
            exp_id: str. The exploration ID.
            user_id: str. The user_id of the creator.
            states_dict: dict. The dict representation of all the states, in the
                given states schema version.
        """
        exp_model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title='title',
            objective='Old objective',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=states_schema_version,
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            states=states_dict,
            param_specs={},
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights(exp_id, user_id)

        commit_message = 'New exploration created with title \'title\'.'
        exp_model.commit(
            user_id, commit_message, [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])
        exp_rights = exp_models.ExplorationRightsModel.get_by_id(exp_id)
        exp_summary_model = exp_models.ExpSummaryModel(
            id=exp_id,
            title='title',
            category='category',
            objective='Old objective',
            language_code='en',
            tags=[],
            ratings=feconf.get_empty_ratings(),
            scaled_average_rating=feconf.EMPTY_SCALED_AVERAGE_RATING,
            status=exp_rights.status,
            community_owned=exp_rights.community_owned,
            owner_ids=exp_rights.owner_ids,
            contributor_ids=[],
            contributors_summary={},
        )
        exp_summary_model.put()

    def test_migration_audit_job_skips_deleted_explorations(self):
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
        job_id = exp_jobs_one_off.ExplorationMigrationAuditJob.create_new()
        exp_jobs_one_off.ExplorationMigrationAuditJob.enqueue(job_id)

        # This running without errors indicates the deleted exploration is
        # being ignored, since otherwise exp_fetchers.get_exploration_by_id
        # (used within the job) will raise an error.
        self.process_and_flush_pending_tasks()

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            exp_fetchers.get_exploration_by_id(self.NEW_EXP_ID)

    def test_audit_job_runs_for_any_state_schema_version(self):
        """Tests that the exploration migration converts older explorations to a
        previous state schema version before running the audit job.
        """
        self.save_new_exp_with_states_schema_v0(
            self.NEW_EXP_ID, self.albert_id, self.EXP_TITLE)

        job_id = exp_jobs_one_off.ExplorationMigrationAuditJob.create_new()
        exp_jobs_one_off.ExplorationMigrationAuditJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        actual_output = (
            exp_jobs_one_off.ExplorationMigrationAuditJob.get_output(job_id))

        self.assertEqual(actual_output, [u'[u\'SUCCESS\', 1]'])

    def test_migration_job_audit_success(self):
        """Test that the audit job runs correctly on explorations of the
        previous state schema.
        """
        states_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'content_2': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'content_2': {}
                }
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': {
                        'ascii': 'x+y',
                        'latex': 'x+y'
                    },
                    'answer_is_exclusive': False,
                    'explanation': {
                        'html': 'Solution explanation',
                        'content_id': 'content_2'
                    }
                },
                'id': 'MathExpressionInput'
            },
            'next_content_id_index': 0,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        self.create_exploration_with_states_schema_version(
            36,
            self.NEW_EXP_ID,
            self.albert_id,
            {'Introduction': states_dict}
        )

        swap_states_schema_version = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 37)
        swap_exp_schema_version = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 42)
        with swap_states_schema_version, swap_exp_schema_version:
            job_id = exp_jobs_one_off.ExplorationMigrationAuditJob.create_new()
            exp_jobs_one_off.ExplorationMigrationAuditJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

            actual_output = (
                exp_jobs_one_off.ExplorationMigrationAuditJob.get_output(
                    job_id)
            )

        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

    def test_migration_job_audit_failure(self):
        """Test that the audit job runs correctly on explorations of the
        previous state schema and catches any errors that occur during the
        migration.
        """
        states_dict = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'content_2': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'content_2': {}
                }
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'correct_answer': {
                        'ascii': 'x+y',
                        'latex': 'x+y'
                    },
                    'answer_is_exclusive': False,
                    'explanation': {
                        'html': 'Solution explanation',
                        'content_id': 'content_2'
                    }
                },
                'id': 'MathExpressionInput'
            },
            'next_content_id_index': 0,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        self.create_exploration_with_states_schema_version(
            36,
            self.NEW_EXP_ID,
            self.albert_id,
            {'Introduction': states_dict}
        )

        # Make a mock conversion function that raises an error.
        mock_conversion = classmethod(
            lambda cls, exploration_dict: exploration_dict['property_that_dne'])

        swap_states_schema_version = self.swap(
            feconf, 'CURRENT_STATE_SCHEMA_VERSION', 37)
        swap_exp_schema_version = self.swap(
            exp_domain.Exploration, 'CURRENT_EXP_SCHEMA_VERSION', 42)

        with swap_states_schema_version, swap_exp_schema_version, self.swap(
            exp_domain.Exploration,
            '_convert_states_v36_dict_to_v37_dict',
            mock_conversion
        ):
            job_id = exp_jobs_one_off.ExplorationMigrationAuditJob.create_new()
            exp_jobs_one_off.ExplorationMigrationAuditJob.enqueue(job_id)
            self.process_and_flush_pending_tasks()

            actual_output = (
                exp_jobs_one_off.ExplorationMigrationAuditJob.get_output(
                    job_id)
            )

        expected_output = [
            u'[u\'MIGRATION_ERROR\', [u"Exploration exp_id1 failed migratio'
            'n to states v37: u\'property_that_dne\'"]]'
        ]
        self.assertEqual(actual_output, expected_output)


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
        self.set_interaction_for_state(init_state, 'EndExploration')
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


class ExplorationMathSvgFilenameValidationOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            ExplorationMathSvgFilenameValidationOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_explorations_with_invalid_math_tags_fails_validation(self):
        """Tests for the case when there are invalid svg_filenames in the
        explorations.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')
        exploration.add_states(['State1', 'State2'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        invalid_html_content1 = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img1.svg&amp;quot;}"></oppia-noninteractive-math>')

        invalid_html_content2 = (
            '<p>Feedback2</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;-,-,-,-'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img2.svg&amp;quot;}"></oppia-noninteractive-math>')

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
                'value': [{
                    'html': invalid_html_content1,
                    'content_id': 'ca_choices_0'
                }, {
                    'html': '<p>2</p>',
                    'content_id': 'ca_choices_1'
                }, {
                    'html': '<p>3</p>',
                    'content_id': 'ca_choices_2'
                }, {
                    'html': '<p>4</p>',
                    'content_id': 'ca_choices_3'
                }]
            },
            'allowMultipleItemsInSamePosition': {'value': True}
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
            'rule_input_translations_mapping': {},
            'rule_inputs': {
                'HasElementXAtPositionY': [{
                    'x': invalid_html_content2,
                    'y': 2
                }],
                'HasElementXBeforeElementY': [{
                    'x': invalid_html_content1,
                    'y': invalid_html_content1
                }],
                'IsEqualToOrdering': [{
                    'x': [
                        [invalid_html_content1]
                    ]
                }, {
                    'x': [
                        [invalid_html_content2]
                    ]
                }],
                'IsEqualToOrderingWithOneItemAtIncorrectPosition': [{
                    'x': [
                        [invalid_html_content1]
                    ]
                }]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        written_translations_dict = {
            'translations_mapping': {
                'ca_choices_0': {},
                'ca_choices_1': {},
                'ca_choices_2': {},
                'ca_choices_3': {},
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': invalid_html_content1,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation': invalid_html_content2,
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': invalid_html_content2,
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        state1.update_content(
            state_domain.SubtitledHtml.from_dict(content1_dict))
        state2.update_content(
            state_domain.SubtitledHtml.from_dict(content2_dict))
        state2.update_interaction_id('DragAndDropSortInput')
        state2.update_interaction_customization_args(
            customization_args_dict)
        state2.update_next_content_id_index(4)
        state2.update_interaction_answer_groups([answer_group_dict])
        state2.update_written_translations(
            state_domain.WrittenTranslations.from_dict(
                written_translations_dict))

        exp_services.save_new_exploration(self.albert_id, exploration)

        job_id = (
            exp_jobs_one_off
            .ExplorationMathSvgFilenameValidationOneOffJob.create_new())
        exp_jobs_one_off.ExplorationMathSvgFilenameValidationOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationMathSvgFilenameValidationOneOffJob.get_output(job_id))

        detailed_info_output = ast.literal_eval(actual_output[1])

        invalid_tag1 = (
            '<oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img1.svg&amp;quot;}"></oppia-noninteractive-math>')
        invalid_tag2 = (
            '<oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;-,-,-,-'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img2.svg&amp;quot;}"></oppia-noninteractive-math>')
        expected_invalid_tags = [invalid_tag1, invalid_tag2]
        exp_error_info = detailed_info_output[1][self.VALID_EXP_ID]
        for state_error_info in exp_error_info:
            for invalid_tag in state_error_info['error_list']:
                self.assertTrue(invalid_tag in expected_invalid_tags)

        overall_result = ast.literal_eval(actual_output[0])
        self.assertEqual(overall_result[1]['no_of_invalid_tags'], 12)
        self.assertEqual(
            overall_result[1]['no_of_explorations_with_no_svgs'], 1)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')

        exploration.add_states(['State1'])
        invalid_html_content1 = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img1.svg&amp;quot;}"></oppia-noninteractive-math>')
        content_dict = {
            'html': invalid_html_content1,
            'content_id': 'content'
        }
        state1 = exploration.states['State1']
        state1.update_content(
            state_domain.SubtitledHtml.from_dict(content_dict))
        exp_services.save_new_exploration(self.albert_id, exploration)
        exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)
        run_job_for_deleted_exp(
            self,
            exp_jobs_one_off.ExplorationMathSvgFilenameValidationOneOffJob)

    def test_explorations_with_valid_math_tags(self):
        """Tests for the case when there are no invalid svg_filenames in the
        explorations.
        """

        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title=self.EXP_TITLE, category='category')
        exploration.add_states(['State1', 'State2'])
        state1 = exploration.states['State1']
        state2 = exploration.states['State2']
        valid_html_content = (
            '<p>Feedback1</p><oppia-noninteractive-math math_content-with-v'
            'alue="{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+'
            '&amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot'
            ';img1.svg&amp;quot;}"></oppia-noninteractive-math>')

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.VALID_EXP_ID))
        fs.commit('image/img1.svg', raw_image, mimetype='image/svg+xml')
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
                'value': [{
                    'html': valid_html_content,
                    'content_id': 'ca_choices_0'
                }, {
                    'html': '<p>2</p>',
                    'content_id': 'ca_choices_1'
                }, {
                    'html': '<p>3</p>',
                    'content_id': 'ca_choices_2'
                }, {
                    'html': '<p>4</p>',
                    'content_id': 'ca_choices_3'
                }]
            },
            'allowMultipleItemsInSamePosition': {'value': True}
        }

        state1.update_content(
            state_domain.SubtitledHtml.from_dict(content1_dict))
        state2.update_content(
            state_domain.SubtitledHtml.from_dict(content2_dict))
        state2.update_interaction_id('DragAndDropSortInput')
        state2.update_interaction_customization_args(
            customization_args_dict)
        state2.update_next_content_id_index(4)
        exp_services.save_new_exploration(self.albert_id, exploration)

        job_id = (
            exp_jobs_one_off
            .ExplorationMathSvgFilenameValidationOneOffJob.create_new())
        exp_jobs_one_off.ExplorationMathSvgFilenameValidationOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .ExplorationMathSvgFilenameValidationOneOffJob.get_output(job_id))
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
                'value': [{
                    'html': '<p>1</p>',
                    'content_id': 'ca_choices_0'
                }, {
                    'html': '<p>2</p>',
                    'content_id': 'ca_choices_1'
                }, {
                    'html': '<p>3</p>',
                    'content_id': 'ca_choices_2'
                }, {
                    'html': '<p>4</p>',
                    'content_id': 'ca_choices_3'
                }]
            },
            'allowMultipleItemsInSamePosition': {'value': False}
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
            'rule_input_translations_mapping': {},
            'rule_inputs': {
                'HasElementXAtPositionY': [{
                    'x': valid_html_content,
                    'y': 2
                }],
                'HasElementXBeforeElementY': [{
                    'x': valid_html_content,
                    'y': valid_html_content
                }],
                'IsEqualToOrdering': [{
                    'x': [
                        [valid_html_content]
                    ]
                }, {
                    'x': [
                        [valid_html_content]
                    ]
                }],
                'IsEqualToOrderingWithOneItemAtIncorrectPosition': [{
                    'x': [
                        [valid_html_content]
                    ]
                }]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        written_translations_dict = {
            'translations_mapping': {
                'ca_choices_0': {},
                'ca_choices_1': {},
                'ca_choices_2': {},
                'ca_choices_3': {},
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': valid_html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'default_outcome': {
                    'hi': {
                        'data_format': 'html',
                        'translation': valid_html_content,
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': valid_html_content,
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
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
            state1.update_next_content_id_index(4)
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
            'rule_input_translations_mapping': {},
            'rule_inputs': {
                'HasElementXAtPositionY': [{
                    'x': valid_html_content,
                    'y': 2
                }],
                'HasElementXBeforeElementY': [{
                    'x': valid_html_content,
                    'y': valid_html_content
                }],
                'IsEqualToOrdering': [{
                    'x': [
                        [valid_html_content]
                    ]
                }, {
                    'x': [
                        [valid_html_content]
                    ]
                }],
                'IsEqualToOrderingWithOneItemAtIncorrectPosition': [{
                    'x': [
                        [valid_html_content]
                    ]
                }]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }

        with self.swap(html_cleaner, 'clean', lambda html: html):
            state1.update_content(
                state_domain.SubtitledHtml.from_dict(content1_dict))
            state2.update_content(
                state_domain.SubtitledHtml.from_dict(content2_dict))
            self.set_interaction_for_state(state2, 'DragAndDropSortInput')
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


class ExplorationMathRichTextInfoModelGenerationOneOffJobTests(
        test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            ExplorationMathRichTextInfoModelGenerationOneOffJobTests,
            self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_explorations_with_math_images(self):
        """Test the audit job output when there are several explorations with
        math rich text components.
        """
        exploration_with_no_math = (
            exp_domain.Exploration.create_default_exploration(
                self.VALID_EXP_ID, title=self.EXP_TITLE, category='category'))
        exp_services.save_new_exploration(
            self.albert_id, exploration_with_no_math)
        exploration1 = exp_domain.Exploration.create_default_exploration(
            'exp_id1', title='title1', category='category')
        exploration2 = exp_domain.Exploration.create_default_exploration(
            'exp_id2', title='title2', category='category2')
        exploration3 = exp_domain.Exploration.create_default_exploration(
            'exp_id3', title='title3', category='category3')

        exploration1.add_states(['FirstState'])
        exploration2.add_states(['FirstState'])
        exploration3.add_states(['FirstState'])

        exploration1_state = exploration1.states['FirstState']
        exploration2_state = exploration2.states['FirstState']
        exploration3_state = exploration3.states['FirstState']

        valid_html_content1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n-1)(x - a_n)&amp;quot;, &amp;quot;svg_filenam'
            'e&amp;quot;: &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
        )
        valid_html_content2 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )
        valid_html_content3 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;\\\\frac{x}{y}&amp;quot'
            ';, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"'
            '></oppia-noninteractive-math>'
        )

        content_dict = {
            'content_id': 'content',
            'html': valid_html_content1
        }
        choices_customization_arg = {
            'value': [{
                'content_id': 'ca_choices_0',
                'html': valid_html_content1
            }, {
                'content_id': 'ca_choices_1',
                'html': '<p>2</p>'
            }, {
                'content_id': 'ca_choices_2',
                'html': '<p>3</p>'
            }, {
                'content_id': 'ca_choices_3',
                'html': valid_html_content2
            }]
        }

        drag_and_drop_answer_group_dict = {
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
            'rule_input_translations_mapping': {},
            'rule_inputs': {
                'HasElementXAtPositionY': [{
                    'x': valid_html_content1,
                    'y': 2
                }],
                'HasElementXBeforeElementY': [{
                    'x': valid_html_content2,
                    'y': valid_html_content1
                }],
                'IsEqualToOrdering': [{
                    'x': [
                        [valid_html_content1]
                    ]
                }, {
                    'x': [
                        [valid_html_content1]
                    ]
                }],
                'IsEqualToOrderingWithOneItemAtIncorrectPosition': [{
                    'x': [
                        [valid_html_content2]
                    ]
                }]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        item_selection_answer_group = {
            'rule_input_translations_mapping': {},
            'rule_inputs': {
                'ContainsAtLeastOneOf': [{
                    'x': [valid_html_content1]
                }],
                'DoesNotContainAtLeastOneOf': [{
                    'x': [valid_html_content1]
                }],
                'Equals': [{
                    'x': [valid_html_content3]
                }],
                'IsProperSubsetOf': [{
                    'x': [valid_html_content3]
                }]
            },
            'outcome': {
                'dest': 'Introduction',
                'feedback': {
                    'content_id': 'feedback',
                    'html': valid_html_content1
                },
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        exploration1_state.update_content(
            state_domain.SubtitledHtml.from_dict(content_dict))
        exploration1_state.update_interaction_id('DragAndDropSortInput')
        exploration1_state.update_interaction_customization_args({
            'choices': choices_customization_arg,
            'allowMultipleItemsInSamePosition': {'value': True}
        })
        exploration1_state.update_next_content_id_index(4)
        exploration1_state.update_interaction_answer_groups(
            [drag_and_drop_answer_group_dict])
        exploration2_state.update_content(
            state_domain.SubtitledHtml.from_dict(content_dict))
        exploration2_state.update_interaction_id('ItemSelectionInput')
        exploration2_state.update_interaction_customization_args({
            'choices': choices_customization_arg,
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1}
        })
        exploration2_state.update_next_content_id_index(4)
        exploration2_state.update_interaction_answer_groups(
            [item_selection_answer_group])
        exploration3_state.update_content(
            state_domain.SubtitledHtml.from_dict(content_dict))
        exploration3_state.update_interaction_id('DragAndDropSortInput')
        exploration3_state.update_interaction_customization_args({
            'choices': choices_customization_arg,
            'allowMultipleItemsInSamePosition': {'value': True}
        })
        exploration3_state.update_next_content_id_index(4)
        exploration3_state.update_interaction_answer_groups(
            [drag_and_drop_answer_group_dict])

        exp_services.save_new_exploration(self.albert_id, exploration1)
        exp_services.save_new_exploration(self.albert_id, exploration2)
        exp_services.save_new_exploration(self.albert_id, exploration3)

        mock_max_size_of_math_svgs_batch = 0.1 * 1024 * 1024
        self.assertEqual(
            exp_models.ExplorationMathRichTextInfoModel.
            get_all().count(), 0)
        with self.swap(
            feconf, 'MAX_SIZE_OF_MATH_SVGS_BATCH_BYTES',
            mock_max_size_of_math_svgs_batch):
            job_id = (
                exp_jobs_one_off
                .ExplorationMathRichTextInfoModelGenerationOneOffJob.
                create_new())
            (
                exp_jobs_one_off.
                ExplorationMathRichTextInfoModelGenerationOneOffJob.enqueue(
                    job_id))
            self.process_and_flush_pending_tasks()
            actual_output = (
                exp_jobs_one_off
                .ExplorationMathRichTextInfoModelGenerationOneOffJob.
                get_output(job_id))

        actual_output_list = ast.literal_eval(actual_output[0])
        self.assertEqual(
            actual_output_list[1]['longest_raw_latex_string'],
            '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)')
        self.assertEqual(
            actual_output_list[1]['number_of_explorations_having_math'], 3)
        self.assertEqual(
            actual_output_list[1]['estimated_no_of_batches'], 2)
        # Checks below assert that the temporary models are created with
        # values.
        exp1_math_image_model = (
            exp_models.ExplorationMathRichTextInfoModel.get_by_id('exp_id1'))
        exp2_math_image_model = (
            exp_models.ExplorationMathRichTextInfoModel.get_by_id('exp_id2'))
        exp3_math_image_model = (
            exp_models.ExplorationMathRichTextInfoModel.get_by_id('exp_id3'))
        self.assertEqual(
            exp1_math_image_model.estimated_max_size_of_images_in_bytes,
            57000)
        expected_latex_strings_1 = [
            '+,+,+,+', '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)']
        expected_latex_strings_2 = [
            '+,+,+,+', '(x - a_1)(x - a_2)(x - a_3)...(x - a_n-1)(x - a_n)',
            '\\frac{x}{y}']
        self.assertEqual(
            sorted(exp1_math_image_model.latex_strings_without_svg),
            sorted(expected_latex_strings_1))
        self.assertEqual(
            exp2_math_image_model.estimated_max_size_of_images_in_bytes,
            68000)
        self.assertEqual(
            sorted(exp2_math_image_model.latex_strings_without_svg),
            sorted(expected_latex_strings_2))
        self.assertEqual(
            exp3_math_image_model.estimated_max_size_of_images_in_bytes,
            57000)
        self.assertEqual(
            sorted(exp3_math_image_model.latex_strings_without_svg),
            sorted(expected_latex_strings_1))
        self.assertEqual(
            exp_models.ExplorationMathRichTextInfoModel.get_all().count(), 3)

    def test_one_off_job_handles_unicode_in_latex_strings_correctly(self):
        """Test that the one-off job handles LaTeX strings with unicode
        characters correctly.
        """
        exploration1 = exp_domain.Exploration.create_default_exploration(
            'exp_id1', title='title1', category='category')

        exploration1.add_states(['FirstState'])

        exploration1_state = exploration1.states['FirstState']

        valid_html_content_with_unicode = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ&'
            'amp;quot;, &amp;quot;svg_filename&amp;quot;: &amp;quot;&am'
            'p;quot;}"></oppia-noninteractive-math>'
        )
        content_dict = {
            'content_id': 'content',
            'html': valid_html_content_with_unicode
        }
        exploration1_state.update_content(
            state_domain.SubtitledHtml.from_dict(content_dict))
        exp_services.save_new_exploration(self.albert_id, exploration1)

        mock_max_size_of_math_svgs_batch = 0.1 * 1024 * 1024
        self.assertEqual(
            exp_models.ExplorationMathRichTextInfoModel.
            get_all().count(), 0)
        with self.swap(
            feconf, 'MAX_SIZE_OF_MATH_SVGS_BATCH_BYTES',
            mock_max_size_of_math_svgs_batch):
            job_id = (
                exp_jobs_one_off
                .ExplorationMathRichTextInfoModelGenerationOneOffJob.
                create_new())
            (
                exp_jobs_one_off.
                ExplorationMathRichTextInfoModelGenerationOneOffJob.enqueue(
                    job_id))
            self.process_and_flush_pending_tasks()
            actual_output = (
                exp_jobs_one_off
                .ExplorationMathRichTextInfoModelGenerationOneOffJob.
                get_output(job_id))

        actual_output_list = ast.literal_eval(actual_output[0])
        self.assertEqual(
            actual_output_list[1]['longest_raw_latex_string'],
            'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ')
        self.assertEqual(
            actual_output_list[1]['number_of_explorations_having_math'], 1)
        self.assertEqual(
            actual_output_list[1]['estimated_no_of_batches'], 1)
        # Checks below assert that the temporary models are created with
        # values.
        exp1_math_image_model = (
            exp_models.ExplorationMathRichTextInfoModel.get_by_id('exp_id1'))
        self.assertEqual(
            exp1_math_image_model.estimated_max_size_of_images_in_bytes,
            46000)
        expected_latex_strings = ['ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ']
        self.assertEqual(
            sorted(exp1_math_image_model.latex_strings_without_svg),
            sorted(expected_latex_strings))
        self.assertEqual(
            exp_models.ExplorationMathRichTextInfoModel.get_all().count(), 1)


    def test_one_off_job_fails_with_invalid_exploration(self):
        """Test the audit job fails when there is an invalid exploration."""
        exploration = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exp_services.save_new_exploration(self.albert_id, exploration)

        exploration_model = exp_models.ExplorationModel.get(self.VALID_EXP_ID)
        exploration_model.language_code = 'invalid_language_code'
        exploration_model.commit(
            self.albert_id, 'Changed language_code.', [])

        job_id = (
            exp_jobs_one_off
            .ExplorationMathRichTextInfoModelGenerationOneOffJob.create_new())
        (
            exp_jobs_one_off.
            ExplorationMathRichTextInfoModelGenerationOneOffJob.enqueue(
                job_id))
        self.process_and_flush_pending_tasks()
        actual_output = (
            exp_jobs_one_off
            .ExplorationMathRichTextInfoModelGenerationOneOffJob.
            get_output(job_id))
        expected_output = (
            [u'[u\'validation_error\', [u\'Exploration exp_id0 failed non-' +
             'strict validation: Invalid language_code: invalid_language_' +
             'code\']]'])
        self.assertEqual(actual_output, expected_output)

    def test_no_action_is_performed_for_deleted_exploration(self):
        """Test that no action is performed on deleted explorations."""

        exploration1 = exp_domain.Exploration.create_default_exploration(
            'exp_id1', title='title1', category='category')
        exploration1.add_states(['FirstState'])
        exploration1_state = exploration1.states['FirstState']
        valid_html_content1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;q'
            'uot;raw_latex&amp;quot;: &amp;quot;(x - a_1)(x - a_2)(x - a'
            '_3)...(x - a_n)&amp;quot;, &amp;quot;svg_filename&amp;quot;'
            ': &amp;quot;&amp;quot;}"></oppia-noninteractive-math>'
        )
        content_dict = {
            'content_id': 'content',
            'html': valid_html_content1
        }

        exploration1_state.update_content(
            state_domain.SubtitledHtml.from_dict(content_dict))
        exp_services.save_new_exploration(self.albert_id, exploration1)
        exp_services.delete_exploration(self.albert_id, 'exp_id1')
        run_job_for_deleted_exp(
            self,
            exp_jobs_one_off.
            ExplorationMathRichTextInfoModelGenerationOneOffJob)


class ExplorationMathRichTextInfoModelDeletionOneOffJobTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(
            ExplorationMathRichTextInfoModelDeletionOneOffJobTests,
            self).setUp()
        exp_models.ExplorationMathRichTextInfoModel(
            id='user_id.exp_id',
            math_images_generation_required=True,
            estimated_max_size_of_images_in_bytes=1000).put()
        exp_models.ExplorationMathRichTextInfoModel(
            id='user_id1.exp_id1',
            math_images_generation_required=True,
            estimated_max_size_of_images_in_bytes=2000).put()
        exp_models.ExplorationMathRichTextInfoModel(
            id='user_id2.exp_id2',
            math_images_generation_required=True,
            estimated_max_size_of_images_in_bytes=3000).put()

    def test_that_all_the_models_are_deleted(self):
        no_of_models_before_job_is_run = (
            exp_models.ExplorationMathRichTextInfoModel.
            get_all().count())
        self.assertEqual(no_of_models_before_job_is_run, 3)

        job = (
            exp_jobs_one_off.
            ExplorationMathRichTextInfoModelDeletionOneOffJob)
        job_id = job.create_new()
        job.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        actual_output = job.get_output(job_id)
        no_of_models_after_job_is_run = (
            exp_models.ExplorationMathRichTextInfoModel.
            get_all().count())
        self.assertEqual(no_of_models_after_job_is_run, 0)

        expected_output = (
            [u'[u\'model_deleted\', [u\'3 models successfully delelted.\']]'])
        self.assertEqual(actual_output, expected_output)


class RTECustomizationArgsValidationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    def setUp(self):
        super(
            RTECustomizationArgsValidationOneOffJobTests, self).setUp()

        # Setup user who will own the test explorations.
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_tasks()

    def test_for_customization_arg_validation_job_with_single_exp(self):
        """Check expected errors are produced for invalid html strings in RTE
        components for a single exploration.
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
                .RTECustomizationArgsValidationOneOffJob.create_new(
                    ))
            (
                exp_jobs_one_off
                .RTECustomizationArgsValidationOneOffJob.enqueue(
                    job_id))
            self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob.get_output(
                job_id))
        expected_output = [(
            '[u\'Invalid filepath\', '
            '[[u\'Exp ID: exp_id0\', u\'<oppia-noninteractive-image '
            'alt-with-value="&amp;quot;A circle divided into equal fifths.'
            '&amp;quot;" caption-with-value="&amp;quot;Hello&amp;quot;" '
            'filepath-with-value="&amp;quot;xy.z.png&amp;quot;">'
            '</oppia-noninteractive-image>\']]]'
        ), (
            '[u"Invalid URL: Sanitized URL should start with \'http://\' '
            'or \'https://\'; received htt://link.com", '
            '[[u\'Exp ID: exp_id0\', u\'<p><oppia-noninteractive-link '
            'text-with-value="&amp;quot;What is a link?&amp;quot;" '
            'url-with-value="&amp;quot;htt://link.com&amp;quot;">'
            '</oppia-noninteractive-link></p>\']]]')]

        self.assertEqual(actual_output, expected_output)

    def test_for_customization_arg_validation_job_with_multiple_exp(self):
        """Check expected errors are produced for invalid html strings in RTE
        components for multiple explorations.
        """

        exploration1 = exp_domain.Exploration.create_default_exploration(
            self.VALID_EXP_ID, title='title', category='category')
        exploration1.add_states(['State1', 'State2', 'State3'])
        exp1_state1 = exploration1.states['State1']
        exp1_state2 = exploration1.states['State2']
        exp1_state3 = exploration1.states['State3']
        exp1_content1_dict = {
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
        exp1_default_outcome2 = state_domain.Outcome(
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
        exp1_content3_dict = {
            'content_id': 'content',
            'html': (
                '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
                'circle divided into equal fifths.&amp;quot;" '
                'caption-with-value="&amp;quot;Hello&amp;quot;" '
                'filepath-with-value="&amp;quot;xy.z.png&amp;quot;">'
                '</oppia-noninteractive-image>'
            )
        }

        exploration2 = exp_domain.Exploration.create_default_exploration(
            self.NEW_EXP_ID, title='title', category='category')
        exploration2.add_states(['State1', 'State2'])
        exp2_state1 = exploration2.states['State1']
        exp2_content1_dict = {
            'content_id': 'content',
            'html': (
                '<oppia-noninteractive-image alt-with-value="&amp;quot;A '
                'circle divided into equal fifths.&amp;quot;" '
                'caption-with-value="&amp;quot;Hello&amp;quot;" '
                'filepath-with-value="&amp;quot;123png&amp;quot;">'
                '</oppia-noninteractive-image>'
            )
        }
        exp2_default_outcome1 = state_domain.Outcome(
            'State2',
            state_domain.SubtitledHtml(
                'default_outcome',
                (
                    '<p><oppia-noninteractive-link text-with-value="'
                    '&amp;quot;Test link?&amp;quot;" url-with-'
                    'value="&amp;quot;test.com&amp'
                    ';quot;"></oppia-noninteractive-link></p>'
                )
            ), False, [], None, None
        )

        with self.swap(state_domain.SubtitledHtml, 'validate', mock_validate):
            exp1_state1.update_content(
                state_domain.SubtitledHtml.from_dict(exp1_content1_dict))
            exp1_state2.update_interaction_default_outcome(
                exp1_default_outcome2)
            exp1_state3.update_content(
                state_domain.SubtitledHtml.from_dict(exp1_content3_dict))
            exp_services.save_new_exploration(self.albert_id, exploration1)

            exp2_state1.update_content(
                state_domain.SubtitledHtml.from_dict(exp2_content1_dict))
            exp2_state1.update_interaction_default_outcome(
                exp2_default_outcome1)
            exp_services.save_new_exploration(self.albert_id, exploration2)

            # Start CustomizationArgsValidation job on sample exploration.
            job_id = (
                exp_jobs_one_off
                .RTECustomizationArgsValidationOneOffJob.create_new(
                    ))
            (
                exp_jobs_one_off
                .RTECustomizationArgsValidationOneOffJob.enqueue(
                    job_id))
            self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob.get_output(
                job_id))
        expected_output = [(
            '[u"Invalid URL: Sanitized URL should start with \'http://\' '
            'or \'https://\'; received htt://link.com", '
            '[[u\'Exp ID: exp_id0\', '
            'u\'<p><oppia-noninteractive-link text-with-value="&amp;quot;'
            'What is a link?&amp;quot;" url-with-value="&amp;quot;htt://'
            'link.com&amp;quot;"></oppia-noninteractive-link></p>\']]]'
        ), (
            '[u"Invalid URL: Sanitized URL should start with \'http://\' '
            'or \'https://\'; received test.com", [[u\'Exp ID: exp_id1\', '
            'u\'<p><oppia-noninteractive-link text-with-value="&amp;quot;Test '
            'link?&amp;quot;" url-with-value="&amp;quot;test.com&amp;quot;">'
            '</oppia-noninteractive-link></p>\']]]'
        ), (
            '[u\'Invalid filepath\', [[u\'Exp ID: exp_id0\', '
            'u\'<oppia-noninteractive-image alt-with-value="&amp;quot;'
            'A circle divided into equal fifths.&amp;quot;" '
            'caption-with-value="&amp;quot;Hello&amp;quot;" '
            'filepath-with-value="&amp;quot;xy.z.png&amp;quot;">'
            '</oppia-noninteractive-image>\'], '
            '[u\'Exp ID: exp_id1\', '
            'u\'<oppia-noninteractive-image alt-with-value="&amp;quot;A circle '
            'divided into equal fifths.&amp;quot;" caption-with-value='
            '"&amp;quot;Hello&amp;quot;" filepath-with-value="&amp;quot;'
            '123png&amp;quot;"></oppia-noninteractive-image>\']]]')]

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
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob)

    def test_validation_job_fails_for_invalid_schema_version(self):
        """Test that invalid schema version results in job failure."""
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
            .RTECustomizationArgsValidationOneOffJob.create_new())
        (
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            exp_jobs_one_off
            .RTECustomizationArgsValidationOneOffJob.get_output(
                job_id))
        expected_output = [
            u'[u\'Error Sorry, we can only process v1-v%s and unversioned '
            'exploration state schemas at present. when loading exploration\', '
            '[u\'exp_id0\']]' % feconf.CURRENT_STATE_SCHEMA_VERSION]

        self.assertEqual(actual_output, expected_output)
